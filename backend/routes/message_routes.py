from fastapi import APIRouter, Depends, HTTPException
from models import MessageCreate, MessageResponse, Message
from auth import get_current_user
from motor.motor_asyncio import AsyncIOMotorDatabase
from database import get_db
import uuid
from datetime import datetime

router = APIRouter(prefix="/messages", tags=["Messages"])

@router.post("", response_model=MessageResponse)
async def send_message(message_data: MessageCreate, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    # Verify chat exists and user is participant
    chat = await db.chats.find_one({"id": message_data.chatId})
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    if current_user["id"] not in chat["participants"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get sender info
    user = await db.users.find_one({"id": current_user["id"]})
    
    # Create message
    message = Message(
        id=str(uuid.uuid4()),
        chatId=message_data.chatId,
        senderId=current_user["id"],
        senderName=user["name"] if user else "Unknown",
        text=message_data.text,
        timestamp=datetime.utcnow(),
        status="sent"
    )
    
    await db.messages.insert_one(message.dict())
    
    # Update chat's last message
    await db.chats.update_one(
        {"id": message_data.chatId},
        {"$set": {
            "lastMessage": message_data.text,
            "lastMessageTime": message.timestamp
        }}
    )
    
    return MessageResponse(
        id=message.id,
        senderId=message.senderId,
        senderName=message.senderName,
        text=message.text,
        timestamp=message.timestamp,
        status=message.status
    )
