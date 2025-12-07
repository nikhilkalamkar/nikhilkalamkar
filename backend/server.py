from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, WebSocket, WebSocketDisconnect, UploadFile, File, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
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

class Chat(BaseModel):
    model_config = ConfigDict(extra="ignore")
    chat_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    participants: List[str]
    last_message: Optional[str] = None
    last_message_time: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Story(BaseModel):
    model_config = ConfigDict(extra="ignore")
    story_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    media_url: str
    media_type: str = "image"
    is_promoted: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc) + timedelta(hours=24))

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
    user_response = {k: v for k, v in user_dict.items() if k != 'password_hash'}
    return TokenResponse(access_token=token, user=user_response)

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email})
    if not user or not bcrypt.checkpw(credentials.password.encode('utf-8'), user['password_hash'].encode('utf-8')):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = jwt.encode({'user_id': user['user_id'], 'exp': datetime.now(timezone.utc) + timedelta(days=30)}, JWT_SECRET, algorithm=JWT_ALGORITHM)
    user_response = {k: v for k, v in user.items() if k not in ['password_hash', '_id']}
    return TokenResponse(access_token=token, user=user_response)

@api_router.get("/users/me")
async def get_current_user(user_id: str = Depends(verify_token)):
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@api_router.get("/users/search")
async def search_users(q: str, user_id: str = Depends(verify_token)):
    users = await db.users.find(
        {"$and": [
            {"user_id": {"$ne": user_id}},
            {"$or": [
                {"username": {"$regex": q, "$options": "i"}},
                {"email": {"$regex": q, "$options": "i"}}
            ]}
        ]},
        {"_id": 0, "password_hash": 0}
    ).to_list(20)
    return users

@api_router.post("/friends/request")
async def send_friend_request(receiver_id: str, user_id: str = Depends(verify_token)):
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
    for req in requests:
        sender = await db.users.find_one({"user_id": req['sender_id']}, {"_id": 0, "password_hash": 0})
        req['sender'] = sender
    return requests

@api_router.get("/chats")
async def get_chats(user_id: str = Depends(verify_token)):
    chats = await db.chats.find({"participants": user_id}, {"_id": 0}).to_list(100)
    for chat in chats:
        other_id = [p for p in chat['participants'] if p != user_id][0]
        other_user = await db.users.find_one({"user_id": other_id}, {"_id": 0, "password_hash": 0})
        chat['other_user'] = other_user
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
    return messages

@api_router.post("/chats/{chat_id}/messages")
async def send_message(chat_id: str, content: str = Form(...), message_type: str = Form("text"), media: Optional[UploadFile] = File(None), user_id: str = Depends(verify_token)):
    chat = await db.chats.find_one({"chat_id": chat_id})
    if not chat or user_id not in chat['participants']:
        raise HTTPException(status_code=403, detail="Access denied")
    
    media_url = None
    if media:
        file_ext = media.filename.split('.')[-1]
        file_name = f"{uuid.uuid4()}.{file_ext}"
        file_path = f"/tmp/{file_name}"
        async with aiofiles.open(file_path, 'wb') as f:
            content_file = await media.read()
            await f.write(content_file)
        media_url = f"/api/media/{file_name}"
    
    message = Message(
        chat_id=chat_id,
        sender_id=user_id,
        content=content,
        message_type=message_type,
        media_url=media_url
    )
    message_dict = message.model_dump()
    message_dict['created_at'] = message_dict['created_at'].isoformat()
    message_dict['expires_at'] = message_dict['expires_at'].isoformat()
    await db.messages.insert_one(message_dict)
    
    await db.chats.update_one(
        {"chat_id": chat_id},
        {"$set": {"last_message": content[:50], "last_message_time": datetime.now(timezone.utc).isoformat()}}
    )
    
    other_user = [p for p in chat['participants'] if p != user_id][0]
    await manager.send_personal_message({"type": "new_message", "data": message_dict}, other_user)
    
    return message_dict

@api_router.post("/stories")
async def create_story(media: UploadFile = File(...), user_id: str = Depends(verify_token)):
    file_ext = media.filename.split('.')[-1]
    file_name = f"{uuid.uuid4()}.{file_ext}"
    file_path = f"/tmp/{file_name}"
    async with aiofiles.open(file_path, 'wb') as f:
        content = await media.read()
        await f.write(content)
    
    media_url = f"/api/media/{file_name}"
    media_type = "video" if file_ext in ['mp4', 'mov', 'avi'] else "image"
    
    story = Story(user_id=user_id, media_url=media_url, media_type=media_type)
    story_dict = story.model_dump()
    story_dict['created_at'] = story_dict['created_at'].isoformat()
    story_dict['expires_at'] = story_dict['expires_at'].isoformat()
    await db.stories.insert_one(story_dict)
    
    return story_dict

@api_router.get("/stories")
async def get_stories(user_id: str = Depends(verify_token)):
    friends = await db.friends.find({"$or": [{"user1": user_id}, {"user2": user_id}]}, {"_id": 0}).to_list(1000)
    friend_ids = [f['user2'] if f['user1'] == user_id else f['user1'] for f in friends]
    friend_ids.append(user_id)
    
    current_time = datetime.now(timezone.utc)
    stories = await db.stories.find(
        {"user_id": {"$in": friend_ids}, "expires_at": {"$gt": current_time.isoformat()}},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    for story in stories:
        user = await db.users.find_one({"user_id": story['user_id']}, {"_id": 0, "password_hash": 0})
        story['user'] = user
    
    return stories

@api_router.post("/stories/{story_id}/promote")
async def create_promotion_order(story_id: str, user_id: str = Depends(verify_token)):
    story = await db.stories.find_one({"story_id": story_id, "user_id": user_id})
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
    
    amount = 50000
    order = razorpay_client.order.create({"amount": amount, "currency": "INR", "payment_capture": 1})
    
    await db.story_promotions.insert_one({
        "story_id": story_id,
        "user_id": user_id,
        "order_id": order['id'],
        "amount": amount,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"order_id": order['id'], "amount": amount, "key": os.getenv('RAZORPAY_KEY_ID')}

@api_router.post("/stories/{story_id}/promote/verify")
async def verify_promotion(story_id: str, payment_id: str, order_id: str, signature: str, user_id: str = Depends(verify_token)):
    try:
        razorpay_client.utility.verify_payment_signature({
            'razorpay_order_id': order_id,
            'razorpay_payment_id': payment_id,
            'razorpay_signature': signature
        })
        
        await db.story_promotions.update_one({"order_id": order_id}, {"$set": {"status": "completed", "payment_id": payment_id}})
        await db.stories.update_one({"story_id": story_id}, {"$set": {"is_promoted": True}})
        
        return {"message": "Promotion successful"}
    except:
        raise HTTPException(status_code=400, detail="Payment verification failed")

@api_router.post("/block/{user_id_to_block}")
async def block_user(user_id_to_block: str, user_id: str = Depends(verify_token)):
    await db.blocked_users.insert_one({"blocker_id": user_id, "blocked_id": user_id_to_block, "created_at": datetime.now(timezone.utc).isoformat()})
    return {"message": "User blocked"}

@api_router.delete("/block/{user_id_to_unblock}")
async def unblock_user(user_id_to_unblock: str, user_id: str = Depends(verify_token)):
    await db.blocked_users.delete_one({"blocker_id": user_id, "blocked_id": user_id_to_unblock})
    return {"message": "User unblocked"}

@api_router.get("/token/agora")
async def get_agora_token(channel: str, user_id: str = Depends(verify_token)):
    app_id = os.getenv('AGORA_APP_ID')
    app_certificate = os.getenv('AGORA_APP_CERTIFICATE')
    uid = int(user_id.replace('-', '')[:9], 16) % 1000000
    expiration_time = int((datetime.now(timezone.utc) + timedelta(hours=1)).timestamp())
    
    token = RtcTokenBuilder.buildTokenWithUid(app_id, app_certificate, channel, uid, 1, expiration_time)
    return {"token": token, "uid": uid, "channel": channel}

@api_router.get("/media/{filename}")
async def get_media(filename: str):
    file_path = f"/tmp/{filename}"
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    async with aiofiles.open(file_path, 'rb') as f:
        content = await f.read()
    
    return StreamingResponse(io.BytesIO(content), media_type="application/octet-stream")

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
    if not admin_user or admin_user.get('email') != 'admin@snapclone.com':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    return users

@api_router.delete("/admin/users/{delete_user_id}")
async def delete_user(delete_user_id: str, user_id: str = Depends(verify_token)):
    admin_user = await db.users.find_one({"user_id": user_id})
    if not admin_user or admin_user.get('email') != 'admin@snapclone.com':
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

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup():
    await db.users.create_index("user_id", unique=True)
    await db.users.create_index("email", unique=True)
    await db.chats.create_index("chat_id", unique=True)
    await db.messages.create_index("chat_id")
    await db.messages.create_index("expires_at")
    await db.stories.create_index("user_id")
    await db.stories.create_index("expires_at")
    logger.info("Database indexes created")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()