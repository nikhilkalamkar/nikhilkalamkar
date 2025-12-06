from fastapi import APIRouter, HTTPException, Request
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from dotenv import load_dotenv
from pathlib import Path
from typing import List, Optional
import os
from datetime import datetime, timezone
import uuid
from auth import get_session_token

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

router = APIRouter(prefix="/api/messages", tags=["messages"])

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

class SendMessageRequest(BaseModel):
    recipient_id: str
    text: str
    image: Optional[str] = None

class Message(BaseModel):
    id: str
    sender_id: str
    recipient_id: str
    text: str
    image: Optional[str] = None
    created_at: str
    read: bool = False

@router.post("/send")
async def send_message(
    request: Request,
    message_data: SendMessageRequest
):
    """Send a message to another user"""
    try:
        # Get current user
        session_token = await get_session_token(request, None)
        if not session_token:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        session = await db.user_sessions.find_one({"session_token": session_token})
        if not session:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        sender_id = session["user_id"]
        
        # Verify recipient exists
        recipient = await db.users.find_one({"user_id": message_data.recipient_id}, {"_id": 0})
        if not recipient:
            raise HTTPException(status_code=404, detail="Recipient not found")
        
        # Create message
        message_id = f"msg_{uuid.uuid4().hex[:12]}"
        message = {
            "message_id": message_id,
            "sender_id": sender_id,
            "recipient_id": message_data.recipient_id,
            "text": message_data.text,
            "image": message_data.image,
            "created_at": datetime.now(timezone.utc),
            "read": False
        }
        
        await db.messages.insert_one(message)
        
        return {
            "success": True,
            "message_id": message_id,
            "message": "Message sent successfully"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/conversations")
async def get_conversations(request: Request):
    """Get all conversations for the current user"""
    try:
        # Get current user
        session_token = await get_session_token(request, None)
        if not session_token:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        session = await db.user_sessions.find_one({"session_token": session_token})
        if not session:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        user_id = session["user_id"]
        
        # Get all messages where user is sender or recipient
        messages_cursor = db.messages.find({
            "$or": [
                {"sender_id": user_id},
                {"recipient_id": user_id}
            ]
        }).sort("created_at", -1)
        
        messages = await messages_cursor.to_list(length=1000)
        
        # Group messages by conversation partner
        conversations_dict = {}
        
        for msg in messages:
            # Determine conversation partner
            partner_id = msg["recipient_id"] if msg["sender_id"] == user_id else msg["sender_id"]
            
            if partner_id not in conversations_dict:
                # Get partner user info
                partner = await db.users.find_one({"user_id": partner_id}, {"_id": 0})
                if not partner:
                    continue
                
                conversations_dict[partner_id] = {
                    "id": f"conv_{user_id}_{partner_id}",
                    "user": {
                        "id": partner["user_id"],
                        "username": partner["username"],
                        "fullName": partner.get("fullName", ""),
                        "avatar": partner.get("avatar", ""),
                        "isVerified": partner.get("isVerified", False)
                    },
                    "lastMessage": msg["text"],
                    "lastMessageTime": msg["created_at"].isoformat() if isinstance(msg["created_at"], datetime) else msg["created_at"],
                    "unreadCount": 0,
                    "messages": []
                }
        
        # Count unread messages for each conversation
        for partner_id, conv in conversations_dict.items():
            unread_count = await db.messages.count_documents({
                "sender_id": partner_id,
                "recipient_id": user_id,
                "read": False
            })
            conv["unreadCount"] = unread_count
        
        conversations = list(conversations_dict.values())
        
        return {"conversations": conversations}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/conversation/{partner_id}")
async def get_conversation_messages(
    partner_id: str,
    request: Request
):
    """Get all messages in a conversation with a specific user"""
    try:
        # Get current user
        session_token = await get_session_token(request, None)
        if not session_token:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        session = await db.user_sessions.find_one({"session_token": session_token})
        if not session:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        user_id = session["user_id"]
        
        # Get partner info
        partner = await db.users.find_one({"user_id": partner_id}, {"_id": 0})
        if not partner:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get all messages between these two users
        messages_cursor = db.messages.find({
            "$or": [
                {"sender_id": user_id, "recipient_id": partner_id},
                {"sender_id": partner_id, "recipient_id": user_id}
            ]
        }).sort("created_at", 1)
        
        messages = await messages_cursor.to_list(length=1000)
        
        # Mark messages as read
        await db.messages.update_many(
            {
                "sender_id": partner_id,
                "recipient_id": user_id,
                "read": False
            },
            {"$set": {"read": True}}
        )
        
        # Format messages
        formatted_messages = []
        for msg in messages:
            formatted_messages.append({
                "id": msg["message_id"],
                "senderId": msg["sender_id"],
                "text": msg["text"],
                "image": msg.get("image"),
                "createdAt": msg["created_at"].isoformat() if isinstance(msg["created_at"], datetime) else msg["created_at"],
                "read": msg.get("read", False)
            })
        
        return {
            "conversation": {
                "id": f"conv_{user_id}_{partner_id}",
                "user": {
                    "id": partner["user_id"],
                    "username": partner["username"],
                    "fullName": partner.get("fullName", ""),
                    "avatar": partner.get("avatar", ""),
                    "isVerified": partner.get("isVerified", False)
                },
                "messages": formatted_messages
            }
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/mark-read/{message_id}")
async def mark_message_read(
    message_id: str,
    request: Request
):
    """Mark a message as read"""
    try:
        # Get current user
        session_token = await get_session_token(request, None)
        if not session_token:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        session = await db.user_sessions.find_one({"session_token": session_token})
        if not session:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        user_id = session["user_id"]
        
        # Update message
        result = await db.messages.update_one(
            {
                "message_id": message_id,
                "recipient_id": user_id
            },
            {"$set": {"read": True}}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Message not found")
        
        return {"success": True, "message": "Message marked as read"}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
