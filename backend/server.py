from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, WebSocket, WebSocketDisconnect, UploadFile, File, Form, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import StreamingResponse, Response, FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from PIL import Image
import io as iolib
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import aiofiles
import razorpay
from agora_token_builder import RtcTokenBuilder
import io

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

JWT_SECRET = os.getenv('JWT_SECRET')
JWT_ALGORITHM = 'HS256'

razorpay_client = razorpay.Client(auth=(os.getenv('RAZORPAY_KEY_ID'), os.getenv('RAZORPAY_KEY_SECRET')))

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    email: EmailStr
    password_hash: Optional[str] = None
    profile_picture: Optional[str] = "https://images.unsplash.com/photo-1618698937393-8d7bb5f2d341?crop=entropy&cs=srgb&fm=jpg&q=85"
    bio: Optional[str] = ""
    online_status: str = "online"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserRegister(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    user: dict

class Message(BaseModel):
    model_config = ConfigDict(extra="ignore")
    message_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    chat_id: str
    sender_id: str
    content: str
    message_type: str = "text"
    media_url: Optional[str] = None
    is_screenshot: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc) + timedelta(hours=24))
    deleted_for_everyone: bool = False
    deleted_for: List[str] = []  # List of user_ids who deleted this message for themselves

class Chat(BaseModel):
    model_config = ConfigDict(extra="ignore")
    chat_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    participants: List[str]
    last_message: Optional[str] = None
    last_message_time: Optional[datetime] = None
    disappearing_timer: int = 86400  # Default 24 hours in seconds
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Story(BaseModel):
    model_config = ConfigDict(extra="ignore")
    story_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    media_url: str
    media_type: str = "image"
    is_promoted: bool = False
    promotion_tier: Optional[str] = None
    promotion_views: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc) + timedelta(hours=24))

class PromotionRequest(BaseModel):
    tier: str

class FriendRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    request_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    sender_id: str
    receiver_id: str
    status: str = "pending"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BlockedUser(BaseModel):
    model_config = ConfigDict(extra="ignore")
    blocker_id: str
    blocked_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Helper function to optimize images
async def optimize_image(file_content: bytes, filename: str, max_size: int = 1920) -> bytes:
    """Optimize image: resize if too large, compress, and convert to WebP if beneficial"""
    try:
        img = Image.open(iolib.BytesIO(file_content))
        
        # Convert RGBA to RGB if necessary
        if img.mode in ('RGBA', 'LA', 'P'):
            background = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'P':
                img = img.convert('RGBA')
            background.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
            img = background
        elif img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Resize if too large
        if img.width > max_size or img.height > max_size:
            img.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
        
        # Save optimized image
        output = iolib.BytesIO()
        
        # Use JPEG with quality 85 for good balance
        img.save(output, format='JPEG', quality=85, optimize=True)
        output.seek(0)
        
        return output.read()
    except Exception as e:
        logger.error(f"Image optimization failed: {e}")
        return file_content  # Return original if optimization fails

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordReset(BaseModel):
    email: EmailStr
    reset_token: str
    new_password: str

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict = {}

    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]

    async def send_personal_message(self, message: dict, user_id: str):
        if user_id in self.active_connections:
            try:
                await self.active_connections[user_id].send_json(message)
            except:
                self.disconnect(user_id)

manager = ConnectionManager()

async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get('user_id')
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserRegister):
    existing = await db.users.find_one({"$or": [{"email": user_data.email}, {"username": user_data.username}]})
    if existing:
        raise HTTPException(status_code=400, detail="User already exists")
    
    hashed_password = bcrypt.hashpw(user_data.password.encode('utf-8'), bcrypt.gensalt())
    user = User(
        username=user_data.username,
        email=user_data.email,
        password_hash=hashed_password.decode('utf-8')
    )
    
    user_dict = user.model_dump()
    user_dict['created_at'] = user_dict['created_at'].isoformat()
    user_dict['updated_at'] = user_dict['updated_at'].isoformat()
    await db.users.insert_one(user_dict)
    
    token = jwt.encode({'user_id': user.user_id, 'exp': datetime.now(timezone.utc) + timedelta(days=30)}, JWT_SECRET, algorithm=JWT_ALGORITHM)
    user_response = {k: v for k, v in user_dict.items() if k not in ['password_hash', '_id']}
    return TokenResponse(access_token=token, user=user_response)

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email})
    if not user or not bcrypt.checkpw(credentials.password.encode('utf-8'), user['password_hash'].encode('utf-8')):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = jwt.encode({'user_id': user['user_id'], 'exp': datetime.now(timezone.utc) + timedelta(days=30)}, JWT_SECRET, algorithm=JWT_ALGORITHM)
    user_response = {k: v for k, v in user.items() if k not in ['password_hash', '_id']}
    return TokenResponse(access_token=token, user=user_response)

@api_router.post("/auth/forgot-password")
async def forgot_password(request: PasswordResetRequest):
    user = await db.users.find_one({"email": request.email})
    if not user:
        return {"message": "If the email exists, a reset token has been generated"}
    
    reset_token = str(uuid.uuid4())
    expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
    
    await db.password_resets.insert_one({
        "email": request.email,
        "reset_token": reset_token,
        "expires_at": expires_at.isoformat(),
        "used": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {
        "message": "Reset token generated",
        "reset_token": reset_token,
        "note": "In production, this would be sent via email"
    }

@api_router.post("/auth/reset-password")
async def reset_password(reset_data: PasswordReset):
    reset_record = await db.password_resets.find_one({
        "email": reset_data.email,
        "reset_token": reset_data.reset_token,
        "used": False
    })
    
    if not reset_record:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    
    expires_at = datetime.fromisoformat(reset_record['expires_at'])
    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(status_code=400, detail="Reset token has expired")
    
    hashed_password = bcrypt.hashpw(reset_data.new_password.encode('utf-8'), bcrypt.gensalt())
    await db.users.update_one(
        {"email": reset_data.email},
        {"$set": {"password_hash": hashed_password.decode('utf-8'), "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    await db.password_resets.update_one(
        {"_id": reset_record["_id"]},
        {"$set": {"used": True}}
    )
    
    return {"message": "Password reset successfully"}

@api_router.get("/users/me")
async def get_current_user(user_id: str = Depends(verify_token)):
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@api_router.get("/users/search")
async def search_users(q: str, user_id: str = Depends(verify_token)):
    logger.info(f"Search request: user_id={user_id}, query='{q}'")
    
    blocked = await db.blocked_users.find({"blocker_id": user_id}, {"_id": 0}).to_list(1000)
    blocked_ids = [b['blocked_id'] for b in blocked]
    logger.info(f"Blocked users for {user_id}: {len(blocked_ids)}")
    
    search_query = {"$and": [
        {"user_id": {"$ne": user_id}},
        {"user_id": {"$nin": blocked_ids}},
        {"$or": [
            {"username": {"$regex": q, "$options": "i"}},
            {"email": {"$regex": q, "$options": "i"}}
        ]}
    ]}
    logger.info(f"MongoDB search query: {search_query}")
    
    users = await db.users.find(
        search_query,
        {"_id": 0, "password_hash": 0}
    ).to_list(20)
    
    logger.info(f"Search results for '{q}': found {len(users)} users")
    return users

@api_router.get("/users/{target_user_id}")
async def get_user_by_id(target_user_id: str, user_id: str = Depends(verify_token)):
    """Get another user's profile"""
    user = await db.users.find_one({"user_id": target_user_id}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@api_router.put("/users/me")
async def update_profile(
    bio: str = Form(None),
    profile_picture: Optional[UploadFile] = File(None),
    user_id: str = Depends(verify_token)
):
    """Update user profile (bio and/or profile picture)"""
    update_data = {}
    
    # Update bio if provided
    if bio is not None:
        update_data["bio"] = bio
    
    # Update profile picture if provided
    if profile_picture:
        file_ext = profile_picture.filename.split('.')[-1].lower()
        content_file = await profile_picture.read()
        
        # Optimize image
        image_extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp']
        if file_ext in image_extensions:
            content_file = await optimize_image(content_file, profile_picture.filename)
            file_name = f"profile_{user_id}_{uuid.uuid4()}.jpg"
        else:
            file_name = f"profile_{user_id}_{uuid.uuid4()}.{file_ext}"
        
        file_path = f"/app/uploads/{file_name}"
        async with aiofiles.open(file_path, 'wb') as f:
            await f.write(content_file)
        
        profile_picture_url = f"/api/media/{file_name}"
        update_data["profile_picture"] = profile_picture_url
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    # Update user in database
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.users.update_one(
        {"user_id": user_id},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Return updated user
    updated_user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    return updated_user

# Search endpoint moved above to fix routing conflict with /users/{target_user_id}

@api_router.post("/friends/request")
async def send_friend_request(receiver_id: str, user_id: str = Depends(verify_token)):
    is_blocked = await db.blocked_users.find_one({
        "$or": [
            {"blocker_id": user_id, "blocked_id": receiver_id},
            {"blocker_id": receiver_id, "blocked_id": user_id}
        ]
    })
    if is_blocked:
        raise HTTPException(status_code=403, detail="Cannot send request to this user")
    
    existing = await db.friend_requests.find_one({"sender_id": user_id, "receiver_id": receiver_id, "status": "pending"})
    if existing:
        raise HTTPException(status_code=400, detail="Request already sent")
    
    request = FriendRequest(sender_id=user_id, receiver_id=receiver_id)
    request_dict = request.model_dump()
    request_dict['created_at'] = request_dict['created_at'].isoformat()
    await db.friend_requests.insert_one(request_dict)
    
    await manager.send_personal_message({"type": "friend_request", "data": request_dict}, receiver_id)
    return {"message": "Request sent"}

@api_router.post("/friends/accept/{request_id}")
async def accept_friend_request(request_id: str, user_id: str = Depends(verify_token)):
    request = await db.friend_requests.find_one({"request_id": request_id, "receiver_id": user_id})
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    await db.friend_requests.update_one({"request_id": request_id}, {"$set": {"status": "accepted"}})
    await db.friends.insert_one({"user1": request['sender_id'], "user2": user_id, "created_at": datetime.now(timezone.utc).isoformat()})
    
    chat = Chat(participants=[request['sender_id'], user_id])
    chat_dict = chat.model_dump()
    chat_dict['created_at'] = chat_dict['created_at'].isoformat()
    await db.chats.insert_one(chat_dict)
    
    return {"message": "Request accepted", "chat_id": chat.chat_id}

@api_router.post("/friends/decline/{request_id}")
async def decline_friend_request(request_id: str, user_id: str = Depends(verify_token)):
    await db.friend_requests.update_one({"request_id": request_id, "receiver_id": user_id}, {"$set": {"status": "declined"}})
    return {"message": "Request declined"}

@api_router.get("/friends/requests")
async def get_friend_requests(user_id: str = Depends(verify_token)):
    requests = await db.friend_requests.find({"receiver_id": user_id, "status": "pending"}, {"_id": 0}).to_list(100)
    
    if requests:
        sender_ids = [req['sender_id'] for req in requests]
        senders = await db.users.find({"user_id": {"$in": sender_ids}}, {"_id": 0, "password_hash": 0}).to_list(len(sender_ids))
        sender_map = {s['user_id']: s for s in senders}
        
        for req in requests:
            req['sender'] = sender_map.get(req['sender_id'])
    
    return requests

@api_router.get("/friends")
async def get_friends(user_id: str = Depends(verify_token)):
    """Get list of user's friends with details"""
    # Get all friendships for this user
    friends = await db.friends.find(
        {"$or": [{"user1": user_id}, {"user2": user_id}]}, 
        {"_id": 0}
    ).to_list(1000)
    
    if not friends:
        return []
    
    # Extract friend IDs
    friend_ids = [f['user2'] if f['user1'] == user_id else f['user1'] for f in friends]
    
    # Get friend user details
    friend_users = await db.users.find(
        {"user_id": {"$in": friend_ids}}, 
        {"_id": 0, "password_hash": 0}
    ).to_list(len(friend_ids))
    
    return friend_users

@api_router.get("/chats")
async def get_chats(user_id: str = Depends(verify_token)):
    chats = await db.chats.find({"participants": user_id}, {"_id": 0}).to_list(100)
    
    if chats:
        other_ids = [[p for p in chat['participants'] if p != user_id][0] for chat in chats]
        other_users = await db.users.find({"user_id": {"$in": other_ids}}, {"_id": 0, "password_hash": 0}).to_list(len(other_ids))
        user_map = {u['user_id']: u for u in other_users}
        
        for chat in chats:
            other_id = [p for p in chat['participants'] if p != user_id][0]
            chat['other_user'] = user_map.get(other_id)
    
    return chats

@api_router.get("/chats/{chat_id}/messages")
async def get_messages(chat_id: str, user_id: str = Depends(verify_token)):
    chat = await db.chats.find_one({"chat_id": chat_id})
    if not chat or user_id not in chat['participants']:
        raise HTTPException(status_code=403, detail="Access denied")
    
    current_time = datetime.now(timezone.utc)
    messages = await db.messages.find(
        {"chat_id": chat_id, "expires_at": {"$gt": current_time.isoformat()}},
        {"_id": 0}
    ).sort("created_at", 1).to_list(500)
    
    # Filter out messages deleted by current user
    filtered_messages = []
    for msg in messages:
        # Skip if message was deleted for this user
        if user_id in msg.get('deleted_for', []):
            continue
        filtered_messages.append(msg)
    
    return filtered_messages

@api_router.put("/chats/{chat_id}/timer")
async def update_disappearing_timer(chat_id: str, timer_seconds: int, user_id: str = Depends(verify_token)):
    chat = await db.chats.find_one({"chat_id": chat_id})
    if not chat or user_id not in chat['participants']:
        raise HTTPException(status_code=403, detail="Access denied")
    
    if timer_seconds not in [5, 60, 3600, 86400, 0]:
        raise HTTPException(status_code=400, detail="Invalid timer value")
    
    await db.chats.update_one(
        {"chat_id": chat_id},
        {"$set": {"disappearing_timer": timer_seconds}}
    )
    
    other_user_id = [p for p in chat['participants'] if p != user_id][0]
    await manager.send_personal_message({
        "type": "timer_updated",
        "chat_id": chat_id,
        "timer_seconds": timer_seconds
    }, other_user_id)
    
    return {"message": "Timer updated", "timer_seconds": timer_seconds}

@api_router.delete("/messages/{message_id}/delete-for-me")
async def delete_message_for_me(message_id: str, user_id: str = Depends(verify_token)):
    """Delete message for current user only"""
    message = await db.messages.find_one({"message_id": message_id})
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    # Check if user is part of the chat
    chat = await db.chats.find_one({"chat_id": message['chat_id']})
    if not chat or user_id not in chat['participants']:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Add user to deleted_for list
    await db.messages.update_one(
        {"message_id": message_id},
        {"$addToSet": {"deleted_for": user_id}}
    )
    
    return {"message": "Message deleted for you"}

@api_router.delete("/messages/{message_id}/delete-for-everyone")
async def delete_message_for_everyone(message_id: str, user_id: str = Depends(verify_token)):
    """Delete message for everyone (only sender can do this)"""
    message = await db.messages.find_one({"message_id": message_id})
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    # Only sender can delete for everyone
    if message['sender_id'] != user_id:
        raise HTTPException(status_code=403, detail="You can only delete your own messages for everyone")
    
    # Mark as deleted for everyone
    await db.messages.update_one(
        {"message_id": message_id},
        {"$set": {"deleted_for_everyone": True, "content": "This message was deleted", "media_url": None}}
    )
    
    # Notify other participants via WebSocket
    chat = await db.chats.find_one({"chat_id": message['chat_id']})
    if chat:
        for participant_id in chat['participants']:
            if participant_id != user_id:
                await manager.send_personal_message({
                    "type": "message_deleted",
                    "message_id": message_id,
                    "chat_id": message['chat_id']
                }, participant_id)
    
    return {"message": "Message deleted for everyone"}

@api_router.post("/chats/{chat_id}/messages")
async def send_message(chat_id: str, content: str = Form(""), message_type: str = Form("text"), media: Optional[UploadFile] = File(None), user_id: str = Depends(verify_token)):
    chat = await db.chats.find_one({"chat_id": chat_id})
    if not chat or user_id not in chat['participants']:
        raise HTTPException(status_code=403, detail="Access denied")
    
    other_user_id = [p for p in chat['participants'] if p != user_id][0]
    is_blocked = await db.blocked_users.find_one({
        "$or": [
            {"blocker_id": user_id, "blocked_id": other_user_id},
            {"blocker_id": other_user_id, "blocked_id": user_id}
        ]
    })
    if is_blocked:
        raise HTTPException(status_code=403, detail="Cannot send message to this user")
    
    media_url = None
    actual_message_type = message_type
    if media:
        file_ext = media.filename.split('.')[-1].lower()
        content_file = await media.read()
        
        # Determine actual message type based on file extension
        image_extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg']
        video_extensions = ['mp4', 'mov', 'avi', 'webm', 'mkv', 'flv', 'wmv']
        
        if file_ext in image_extensions:
            actual_message_type = "image"
            # Optimize image
            content_file = await optimize_image(content_file, media.filename)
            file_name = f"{uuid.uuid4()}.jpg"  # Save as JPEG after optimization
        elif file_ext in video_extensions:
            actual_message_type = "video"
            file_name = f"{uuid.uuid4()}.{file_ext}"
        else:
            actual_message_type = "media"
            file_name = f"{uuid.uuid4()}.{file_ext}"
        
        # Save the file
        file_path = f"/app/uploads/{file_name}"
        async with aiofiles.open(file_path, 'wb') as f:
            await f.write(content_file)
        
        # Store relative path for API, frontend will construct full URL
        media_url = f"/api/media/{file_name}"
    
    # Calculate expires_at based on chat's disappearing timer
    disappearing_timer = chat.get('disappearing_timer', 86400)
    if disappearing_timer == 0:
        # Timer is off, use 30 days expiry
        expires_at = datetime.now(timezone.utc) + timedelta(days=30)
    else:
        expires_at = datetime.now(timezone.utc) + timedelta(seconds=disappearing_timer)
    
    # If sending media without text, use appropriate placeholder
    message_content = content if content else ("Media" if media_url else "")
    
    message = Message(
        chat_id=chat_id,
        sender_id=user_id,
        content=message_content,
        message_type=actual_message_type,
        media_url=media_url,
        expires_at=expires_at
    )
    message_dict = message.model_dump()
    message_dict['created_at'] = message_dict['created_at'].isoformat()
    message_dict['expires_at'] = message_dict['expires_at'].isoformat()
    await db.messages.insert_one(message_dict)
    
    await db.chats.update_one(
        {"chat_id": chat_id},
        {"$set": {"last_message": content[:50], "last_message_time": datetime.now(timezone.utc).isoformat()}}
    )
    
    response_dict = {k: v for k, v in message_dict.items() if k != '_id'}
    
    other_user = [p for p in chat['participants'] if p != user_id][0]
    await manager.send_personal_message({"type": "new_message", "data": response_dict}, other_user)
    
    return response_dict

@api_router.post("/stories")
async def create_story(media: UploadFile = File(...), user_id: str = Depends(verify_token)):
    file_ext = media.filename.split('.')[-1].lower()
    content = await media.read()
    
    media_type = "video" if file_ext in ['mp4', 'mov', 'avi', 'webm', 'mkv'] else "image"
    
    # Optimize image files
    if media_type == "image":
        content = await optimize_image(content, media.filename)
        file_name = f"{uuid.uuid4()}.jpg"  # Save as JPEG after optimization
    else:
        file_name = f"{uuid.uuid4()}.{file_ext}"
    
    file_path = f"/app/uploads/{file_name}"
    async with aiofiles.open(file_path, 'wb') as f:
        await f.write(content)
    
    media_url = f"/api/media/{file_name}"
    
    story = Story(user_id=user_id, media_url=media_url, media_type=media_type)
    story_dict = story.model_dump()
    story_dict['created_at'] = story_dict['created_at'].isoformat()
    story_dict['expires_at'] = story_dict['expires_at'].isoformat()
    await db.stories.insert_one(story_dict)
    
    response_dict = {k: v for k, v in story_dict.items() if k != '_id'}
    return response_dict

@api_router.delete("/stories/{story_id}")
async def delete_story(story_id: str, user_id: str = Depends(verify_token)):
    story = await db.stories.find_one({"story_id": story_id, "user_id": user_id})
    if not story:
        raise HTTPException(status_code=404, detail="Story not found or access denied")
    
    result = await db.stories.delete_one({"story_id": story_id, "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Story not found")
    
    await db.story_promotions.delete_many({"story_id": story_id})
    
    if story.get('media_url'):
        file_path = f"/app/uploads/{story['media_url'].split('/')[-1]}"
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except:
                pass
    
    return {"message": "Story deleted successfully"}

@api_router.get("/stories")
async def get_stories(user_id: str = Depends(verify_token)):
    blocked = await db.blocked_users.find({"blocker_id": user_id}, {"_id": 0}).to_list(1000)
    blocked_ids = [b['blocked_id'] for b in blocked]
    
    friends = await db.friends.find({"$or": [{"user1": user_id}, {"user2": user_id}]}, {"_id": 0}).to_list(1000)
    friend_ids = [f['user2'] if f['user1'] == user_id else f['user1'] for f in friends]
    
    # Always include own user_id first (to show your own stories)
    friend_ids.insert(0, user_id)
    
    # Remove duplicates and blocked users
    friend_ids = list(set([fid for fid in friend_ids if fid not in blocked_ids]))
    
    current_time = datetime.now(timezone.utc)
    stories = await db.stories.find(
        {"user_id": {"$in": friend_ids}, "expires_at": {"$gt": current_time.isoformat()}},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    if stories:
        user_ids = list(set([story['user_id'] for story in stories]))
        users = await db.users.find({"user_id": {"$in": user_ids}}, {"_id": 0, "password_hash": 0}).to_list(len(user_ids))
        user_map = {u['user_id']: u for u in users}
        
        for story in stories:
            story['user'] = user_map.get(story['user_id'])
    
    return stories

@api_router.post("/stories/{story_id}/promote")
async def create_promotion_order(story_id: str, promotion_req: PromotionRequest, user_id: str = Depends(verify_token)):
    story = await db.stories.find_one({"story_id": story_id, "user_id": user_id})
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
    
    # Define promotion tiers (amount in paise, views are estimates)
    promotion_tiers = {
        "basic": {"amount": 5000, "views": 10000, "name": "Basic - ₹50/day (10k views)", "duration_days": 1},
        "premium": {"amount": 10000, "views": 20000, "name": "Premium - ₹100/day (20k views)", "duration_days": 1}
    }
    
    tier = promotion_req.tier.lower()
    if tier not in promotion_tiers:
        raise HTTPException(status_code=400, detail="Invalid promotion tier")
    
    tier_info = promotion_tiers[tier]
    amount = tier_info["amount"]
    
    order = razorpay_client.order.create({"amount": amount, "currency": "INR", "payment_capture": 1})
    
    await db.story_promotions.insert_one({
        "story_id": story_id,
        "user_id": user_id,
        "order_id": order['id'],
        "amount": amount,
        "tier": tier,
        "target_views": tier_info["views"],
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {
        "order_id": order['id'], 
        "amount": amount, 
        "key": os.getenv('RAZORPAY_KEY_ID'),
        "tier": tier,
        "tier_name": tier_info["name"]
    }

@api_router.post("/stories/{story_id}/promote/verify")
async def verify_promotion(story_id: str, payment_id: str, order_id: str, signature: str, user_id: str = Depends(verify_token)):
    try:
        razorpay_client.utility.verify_payment_signature({
            'razorpay_order_id': order_id,
            'razorpay_payment_id': payment_id,
            'razorpay_signature': signature
        })
        
        promotion = await db.story_promotions.find_one({"order_id": order_id})
        if not promotion:
            raise HTTPException(status_code=404, detail="Promotion not found")
        
        await db.story_promotions.update_one(
            {"order_id": order_id}, 
            {"$set": {"status": "completed", "payment_id": payment_id}}
        )
        
        await db.stories.update_one(
            {"story_id": story_id}, 
            {"$set": {
                "is_promoted": True,
                "promotion_tier": promotion.get("tier", "basic"),
                "promotion_views": 0
            }}
        )
        
        return {"message": "Promotion successful", "tier": promotion.get("tier")}
    except:
        raise HTTPException(status_code=400, detail="Payment verification failed")

@api_router.post("/block/{user_id_to_block}")
async def block_user(user_id_to_block: str, user_id: str = Depends(verify_token)):
    existing = await db.blocked_users.find_one({"blocker_id": user_id, "blocked_id": user_id_to_block})
    if existing:
        raise HTTPException(status_code=400, detail="User already blocked")
    
    await db.blocked_users.insert_one({"blocker_id": user_id, "blocked_id": user_id_to_block, "created_at": datetime.now(timezone.utc).isoformat()})
    return {"message": "User blocked"}

@api_router.delete("/block/{user_id_to_unblock}")
async def unblock_user(user_id_to_unblock: str, user_id: str = Depends(verify_token)):
    result = await db.blocked_users.delete_one({"blocker_id": user_id, "blocked_id": user_id_to_unblock})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not blocked")
    return {"message": "User unblocked"}

@api_router.get("/blocked-users")
async def get_blocked_users(user_id: str = Depends(verify_token)):
    blocked = await db.blocked_users.find({"blocker_id": user_id}, {"_id": 0}).to_list(1000)
    
    if not blocked:
        return []
    
    blocked_ids = [b['blocked_id'] for b in blocked]
    blocked_users = await db.users.find({"user_id": {"$in": blocked_ids}}, {"_id": 0, "password_hash": 0}).to_list(len(blocked_ids))
    return blocked_users

@api_router.get("/token/agora")
async def get_agora_token(channel: str, user_id: str = Depends(verify_token)):
    app_id = os.getenv('AGORA_APP_ID')
    app_certificate = os.getenv('AGORA_APP_CERTIFICATE')
    uid = int(user_id.replace('-', '')[:9], 16) % 1000000
    expiration_time = int((datetime.now(timezone.utc) + timedelta(hours=1)).timestamp())
    
    token = RtcTokenBuilder.buildTokenWithUid(app_id, app_certificate, channel, uid, 1, expiration_time)
    return {"token": token, "uid": uid, "channel": channel}

@api_router.get("/media/{filename}")
@api_router.head("/media/{filename}")
async def get_media(filename: str, request: Request):
    file_path = f"/app/uploads/{filename}"
    if not os.path.exists(file_path):
        # Log missing file for monitoring
        logger.warning(f"Media file not found: {filename}")
        raise HTTPException(status_code=404, detail="File not found")
    
    # Get file stats for caching
    file_stat = os.stat(file_path)
    file_size = file_stat.st_size
    last_modified = file_stat.st_mtime
    
    # Determine proper media type based on file extension
    file_ext = filename.split('.')[-1].lower()
    media_type_map = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'bmp': 'image/bmp',
        'svg': 'image/svg+xml',
        'mp4': 'video/mp4',
        'mov': 'video/quicktime',
        'avi': 'video/x-msvideo',
        'webm': 'video/webm',
        'mkv': 'video/x-matroska',
    }
    media_type = media_type_map.get(file_ext, 'application/octet-stream')
    
    # Caching headers
    headers = {
        "Cache-Control": "public, max-age=31536000, immutable",  # 1 year cache
        "Content-Length": str(file_size),
        "Accept-Ranges": "bytes"
    }
    
    # For HEAD requests, just return headers without content
    if request.method == "HEAD":
        return Response(
            content="",
            media_type=media_type,
            headers=headers
        )
    
    # Use FileResponse for better performance with caching
    return FileResponse(
        path=file_path,
        media_type=media_type,
        headers=headers
    )

@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(user_id, websocket)
    try:
        await db.users.update_one({"user_id": user_id}, {"$set": {"online_status": "online"}})
        while True:
            data = await websocket.receive_json()
            if data.get('type') == 'screenshot_taken':
                chat_id = data.get('chat_id')
                chat = await db.chats.find_one({"chat_id": chat_id})
                if chat:
                    other_user = [p for p in chat['participants'] if p != user_id][0]
                    await manager.send_personal_message({"type": "screenshot_alert", "chat_id": chat_id}, other_user)
    except WebSocketDisconnect:
        manager.disconnect(user_id)
        await db.users.update_one({"user_id": user_id}, {"$set": {"online_status": "offline"}})

@api_router.get("/admin/users")
async def get_all_users(user_id: str = Depends(verify_token)):
    admin_user = await db.users.find_one({"user_id": user_id})
    if not admin_user or admin_user.get('email') != 'admin@ishukart.com':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    return users

@api_router.delete("/admin/users/{delete_user_id}")
async def delete_user(delete_user_id: str, user_id: str = Depends(verify_token)):
    admin_user = await db.users.find_one({"user_id": user_id})
    if not admin_user or admin_user.get('email') != 'admin@ishukart.com':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    await db.users.delete_one({"user_id": delete_user_id})
    await db.messages.delete_many({"sender_id": delete_user_id})
    await db.stories.delete_many({"user_id": delete_user_id})
    return {"message": "User deleted"}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Logging already configured at top of file

@app.on_event("startup")
async def startup():
    await db.users.create_index("user_id", unique=True)
    await db.users.create_index("email", unique=True)
    await db.chats.create_index("chat_id", unique=True)
    await db.messages.create_index("chat_id")
    
    # Drop and recreate expires_at indexes with TTL for automatic deletion
    try:
        await db.messages.drop_index("expires_at_1")
    except:
        pass
    await db.messages.create_index("expires_at", expireAfterSeconds=0)
    
    await db.stories.create_index("user_id")
    try:
        await db.stories.drop_index("expires_at_1")
    except:
        pass
    await db.stories.create_index("expires_at", expireAfterSeconds=0)
    
    await db.blocked_users.create_index(["blocker_id", "blocked_id"], unique=True)
    logger.info("Database indexes created with TTL")
    
    # Clean up orphaned media references (files that don't exist on disk)
    # This helps when deploying to new environments where uploads/ directory is empty
    try:
        # Ensure uploads directory exists
        os.makedirs("/app/uploads", exist_ok=True)
        
        # Get all media URLs from messages and stories
        messages_with_media = await db.messages.find(
            {"media_url": {"$exists": True, "$ne": None}},
            {"media_url": 1}
        ).to_list(None)
        
        stories_with_media = await db.stories.find(
            {"media_url": {"$exists": True}},
            {"media_url": 1}
        ).to_list(None)
        
        # Check which files don't exist and clean them up
        cleaned_messages = 0
        cleaned_stories = 0
        
        for msg in messages_with_media:
            filename = msg['media_url'].split('/')[-1]
            if not os.path.exists(f"/app/uploads/{filename}"):
                # Set media_url to None for missing files
                await db.messages.update_one(
                    {"_id": msg["_id"]},
                    {"$set": {"media_url": None}}
                )
                cleaned_messages += 1
        
        for story in stories_with_media:
            filename = story['media_url'].split('/')[-1]
            if not os.path.exists(f"/app/uploads/{filename}"):
                # Delete stories with missing media
                await db.stories.delete_one({"_id": story["_id"]})
                cleaned_stories += 1
        
        if cleaned_messages > 0 or cleaned_stories > 0:
            logger.info(f"Cleaned up {cleaned_messages} messages and {cleaned_stories} stories with missing media files")
    except Exception as e:
        logger.warning(f"Media cleanup failed: {e}")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()