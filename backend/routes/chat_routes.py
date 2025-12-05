from fastapi import APIRouter, Depends, HTTPException
from models import ChatCreate, ChatResponse, MessageCreate, MessageResponse, Chat, Message
from auth import get_current_user
from motor.motor_asyncio import AsyncIOMotorDatabase
from database import get_db
from typing import List
import uuid
from datetime import datetime

router = APIRouter(prefix="/chats", tags=["Chats"])

@router.get("", response_model=List[ChatResponse])
async def get_user_chats(current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    # Get all chats where user is a participant
    chats = await db.chats.find({"participants": current_user["id"]}).to_list(1000)
    
    result = []
    for chat in chats:
        chat_response = ChatResponse(
            id=chat["id"],
            type=chat["type"],
            name=chat.get("name", ""),
            avatar=chat.get("avatar"),
            lastMessage=chat.get("lastMessage"),
            lastMessageTime=chat.get("lastMessageTime"),
            unreadCount=0  # TODO: Calculate unread count
        )
        
        # For direct chats, get the other user's info
        if chat["type"] == "direct":
            other_user_id = [p for p in chat["participants"] if p != current_user["id"]][0]
            other_user = await db.users.find_one({"id": other_user_id})
            if other_user:
                chat_response.userId = other_user["id"]
                chat_response.name = other_user["name"]
                chat_response.avatar = other_user.get("avatar")
        else:
            # For group chats, count members
            chat_response.members = len(chat["participants"])
        
        result.append(chat_response)
    
    # Sort by last message time
    result.sort(key=lambda x: x.lastMessageTime or datetime.min, reverse=True)
    return result

@router.post("", response_model=ChatResponse)
async def create_chat(chat_data: ChatCreate, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    # Add current user to participants if not already
    if current_user["id"] not in chat_data.participantIds:
        chat_data.participantIds.append(current_user["id"])
    
    # For direct chats, check if chat already exists
    if chat_data.type == "direct" and len(chat_data.participantIds) == 2:
        existing_chat = await db.chats.find_one({
            "type": "direct",
            "participants": {"$all": chat_data.participantIds}
        })
        if existing_chat:
            return ChatResponse(
                id=existing_chat["id"],
                type=existing_chat["type"],
                userId=existing_chat["participants"][0] if existing_chat["participants"][0] != current_user["id"] else existing_chat["participants"][1],
                name="",
                avatar=None,
                lastMessage=existing_chat.get("lastMessage"),
                lastMessageTime=existing_chat.get("lastMessageTime"),
                unreadCount=0
            )
    
    # Create new chat
    chat = Chat(
        id=str(uuid.uuid4()),
        type=chat_data.type,
        participants=chat_data.participantIds,
        name=chat_data.name,
        avatar=f"https://api.dicebear.com/7.x/initials/svg?seed={chat_data.name}" if chat_data.name else None
    )
    
    await db.chats.insert_one(chat.dict())
    
    return ChatResponse(
        id=chat.id,
        type=chat.type,
        name=chat.name or "",
        avatar=chat.avatar,
        lastMessage=None,
        lastMessageTime=None,
        unreadCount=0,
        members=len(chat.participants) if chat.type == "group" else None
    )

@router.get("/{chat_id}/messages", response_model=List[MessageResponse])
async def get_chat_messages(chat_id: str, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    # Verify user is part of chat
    chat = await db.chats.find_one({"id": chat_id})
    if not chat or current_user["id"] not in chat["participants"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get messages
    messages = await db.messages.find({"chatId": chat_id}).sort("timestamp", 1).to_list(1000)
    
    return [MessageResponse(
        id=msg["id"],
        senderId=msg["senderId"],
        senderName=msg.get("senderName"),
        text=msg["text"],
        timestamp=msg["timestamp"],
        status=msg.get("status", "sent")
    ) for msg in messages]
