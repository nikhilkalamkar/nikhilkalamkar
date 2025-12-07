from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
from jose import jwt, JWTError
import secrets

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

SECRET_KEY = os.environ.get('SECRET_KEY', secrets.token_urlsafe(32))
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    avatar_url: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordReset(BaseModel):
    email: EmailStr
    new_password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    username: str
    email: EmailStr
    avatar_url: Optional[str] = None
    friends: List[str] = []
    blocked_users: List[str] = []
    screenshot_notifications: bool = True
    created_at: str

class SnapCreate(BaseModel):
    recipient_id: str
    image_url: str
    text: Optional[str] = None

class Snap(BaseModel):
    model_config = ConfigDict(extra="ignore")
    snap_id: str
    sender_id: str
    sender_username: str
    sender_avatar: Optional[str]
    recipient_id: str
    image_url: str
    text: Optional[str]
    viewed: bool
    created_at: str
    expires_at: str

class StoryCreate(BaseModel):
    image_url: str
    text: Optional[str] = None

class Story(BaseModel):
    model_config = ConfigDict(extra="ignore")
    story_id: str
    user_id: str
    username: str
    user_avatar: Optional[str]
    image_url: str
    text: Optional[str]
    created_at: str
    expires_at: str
    views: List[str] = []

class MessageCreate(BaseModel):
    recipient_id: str
    text: Optional[str] = None
    image_url: Optional[str] = None
    disappearing: bool = False
    disappear_after_seconds: int = 10

class Message(BaseModel):
    model_config = ConfigDict(extra="ignore")
    message_id: str
    sender_id: str
    sender_username: str
    recipient_id: str
    text: Optional[str] = None
    image_url: Optional[str] = None
    disappearing: bool = False
    viewed: bool = False
    disappear_after_seconds: Optional[int] = 10
    viewed_at: Optional[str] = None
    expires_at: Optional[str] = None
    created_at: str

class FriendRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    request_id: str
    sender_id: str
    sender_username: str
    sender_avatar: Optional[str]
    recipient_id: str
    status: str
    created_at: str

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication")
        return user_id
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication")

@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    existing_user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    existing_username = await db.users.find_one({"username": user_data.username}, {"_id": 0})
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already taken")
    
    hashed_password = pwd_context.hash(user_data.password)
    user_id = secrets.token_urlsafe(16)
    
    user_doc = {
        "user_id": user_id,
        "username": user_data.username,
        "email": user_data.email,
        "password": hashed_password,
        "avatar_url": user_data.avatar_url or "https://images.unsplash.com/photo-1675526607070-f5cbd71dde92?w=200",
        "friends": [],
        "blocked_users": [],
        "screenshot_notifications": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    
    token = create_access_token({"sub": user_id})
    return {"token": token, "user": User(**user_doc)}

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not pwd_context.verify(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_access_token({"sub": user["user_id"]})
    return {"token": token, "user": User(**user)}

@api_router.post("/auth/forgot-password")
async def forgot_password(request: PasswordResetRequest):
    user = await db.users.find_one({"email": request.email}, {"_id": 0})
    if not user:
        return {"message": "If the email exists, a reset link has been sent"}
    
    return {
        "message": "Email verified. You can now reset your password.",
        "email": request.email,
        "username": user["username"]
    }

@api_router.post("/auth/reset-password")
async def reset_password(reset_data: PasswordReset):
    user = await db.users.find_one({"email": reset_data.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    hashed_password = pwd_context.hash(reset_data.new_password)
    
    await db.users.update_one(
        {"email": reset_data.email},
        {"$set": {"password": hashed_password}}
    )
    
    return {"message": "Password reset successfully"}

@api_router.get("/users/me", response_model=User)
async def get_me(current_user_id: str = Depends(get_current_user)):
    user = await db.users.find_one({"user_id": current_user_id}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return User(**user)

class AvatarUpdate(BaseModel):
    avatar_url: str

@api_router.put("/users/me/avatar")
async def update_avatar(avatar_data: AvatarUpdate, current_user_id: str = Depends(get_current_user)):
    result = await db.users.update_one(
        {"user_id": current_user_id},
        {"$set": {"avatar_url": avatar_data.avatar_url}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    user = await db.users.find_one({"user_id": current_user_id}, {"_id": 0, "password": 0})
    return {"message": "Avatar updated successfully", "user": User(**user)}

@api_router.get("/users/search")
async def search_users(q: str, current_user_id: str = Depends(get_current_user)):
    users = await db.users.find(
        {
            "user_id": {"$ne": current_user_id},
            "$or": [
                {"username": {"$regex": q, "$options": "i"}},
                {"email": {"$regex": q, "$options": "i"}}
            ]
        },
        {"_id": 0, "password": 0}
    ).limit(20).to_list(20)
    return [User(**u) for u in users]

@api_router.post("/friends/request")
async def send_friend_request(recipient_id: str, current_user_id: str = Depends(get_current_user)):
    if recipient_id == current_user_id:
        raise HTTPException(status_code=400, detail="Cannot send friend request to yourself")
    
    recipient = await db.users.find_one({"user_id": recipient_id}, {"_id": 0})
    if not recipient:
        raise HTTPException(status_code=404, detail="User not found")
    
    existing_request = await db.friend_requests.find_one({
        "sender_id": current_user_id,
        "recipient_id": recipient_id,
        "status": "pending"
    }, {"_id": 0})
    
    if existing_request:
        raise HTTPException(status_code=400, detail="Friend request already sent")
    
    sender = await db.users.find_one({"user_id": current_user_id}, {"_id": 0})
    if recipient_id in sender.get("friends", []):
        raise HTTPException(status_code=400, detail="Already friends")
    
    request_id = secrets.token_urlsafe(16)
    request_doc = {
        "request_id": request_id,
        "sender_id": current_user_id,
        "sender_username": sender["username"],
        "sender_avatar": sender.get("avatar_url"),
        "recipient_id": recipient_id,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.friend_requests.insert_one(request_doc)
    return {"message": "Friend request sent", "request": FriendRequest(**request_doc)}

@api_router.get("/friends/requests")
async def get_friend_requests(current_user_id: str = Depends(get_current_user)):
    requests = await db.friend_requests.find(
        {"recipient_id": current_user_id, "status": "pending"},
        {"_id": 0}
    ).to_list(100)
    return [FriendRequest(**r) for r in requests]

@api_router.post("/friends/accept/{request_id}")
async def accept_friend_request(request_id: str, current_user_id: str = Depends(get_current_user)):
    request = await db.friend_requests.find_one(
        {"request_id": request_id, "recipient_id": current_user_id},
        {"_id": 0}
    )
    
    if not request:
        raise HTTPException(status_code=404, detail="Friend request not found")
    
    await db.friend_requests.update_one(
        {"request_id": request_id},
        {"$set": {"status": "accepted"}}
    )
    
    await db.users.update_one(
        {"user_id": current_user_id},
        {"$addToSet": {"friends": request["sender_id"]}}
    )
    
    await db.users.update_one(
        {"user_id": request["sender_id"]},
        {"$addToSet": {"friends": current_user_id}}
    )
    
    return {"message": "Friend request accepted"}

@api_router.post("/friends/decline/{request_id}")
async def decline_friend_request(request_id: str, current_user_id: str = Depends(get_current_user)):
    request = await db.friend_requests.find_one(
        {"request_id": request_id, "recipient_id": current_user_id},
        {"_id": 0}
    )
    
    if not request:
        raise HTTPException(status_code=404, detail="Friend request not found")
    
    await db.friend_requests.update_one(
        {"request_id": request_id},
        {"$set": {"status": "declined"}}
    )
    
    return {"message": "Friend request declined"}

@api_router.get("/friends")
async def get_friends(current_user_id: str = Depends(get_current_user)):
    user = await db.users.find_one({"user_id": current_user_id}, {"_id": 0})
    friend_ids = user.get("friends", [])
    blocked_users = user.get("blocked_users", [])
    
    if not friend_ids:
        return []
    
    # Filter out blocked users
    active_friend_ids = [fid for fid in friend_ids if fid not in blocked_users]
    
    if not active_friend_ids:
        return []
    
    friends = await db.users.find(
        {"user_id": {"$in": active_friend_ids}},
        {"_id": 0, "password": 0}
    ).to_list(100)
    
    return [User(**f) for f in friends]

@api_router.post("/friends/block/{user_id}")
async def block_user(user_id: str, current_user_id: str = Depends(get_current_user)):
    if user_id == current_user_id:
        raise HTTPException(status_code=400, detail="Cannot block yourself")
    
    # Add to blocked list
    await db.users.update_one(
        {"user_id": current_user_id},
        {"$addToSet": {"blocked_users": user_id}}
    )
    
    return {"message": "User blocked successfully"}

@api_router.post("/friends/unblock/{user_id}")
async def unblock_user(user_id: str, current_user_id: str = Depends(get_current_user)):
    # Remove from blocked list
    await db.users.update_one(
        {"user_id": current_user_id},
        {"$pull": {"blocked_users": user_id}}
    )
    
    return {"message": "User unblocked successfully"}

@api_router.get("/friends/blocked")
async def get_blocked_users(current_user_id: str = Depends(get_current_user)):
    user = await db.users.find_one({"user_id": current_user_id}, {"_id": 0})
    blocked_ids = user.get("blocked_users", [])
    
    if not blocked_ids:
        return []
    
    blocked_users = await db.users.find(
        {"user_id": {"$in": blocked_ids}},
        {"_id": 0, "password": 0}
    ).to_list(100)
    
    return [User(**u) for u in blocked_users]

@api_router.post("/screenshot/{friend_id}")
async def notify_screenshot(friend_id: str, current_user_id: str = Depends(get_current_user)):
    user = await db.users.find_one({"user_id": current_user_id}, {"_id": 0})
    friend = await db.users.find_one({"user_id": friend_id}, {"_id": 0})
    
    if not friend:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if friend has screenshot notifications enabled
    if friend.get("screenshot_notifications", True):
        # Send notification message
        message_id = secrets.token_urlsafe(16)
        now = datetime.now(timezone.utc)
        
        notification_doc = {
            "message_id": message_id,
            "sender_id": "system",
            "sender_username": "SnapVibe",
            "recipient_id": friend_id,
            "text": f"📸 {user['username']} took a screenshot!",
            "image_url": None,
            "disappearing": False,
            "viewed": False,
            "created_at": now.isoformat()
        }
        
        await db.messages.insert_one(notification_doc)
    
    return {"message": "Screenshot notification sent"}

@api_router.put("/settings/screenshot-notifications")
async def toggle_screenshot_notifications(enabled: bool, current_user_id: str = Depends(get_current_user)):
    await db.users.update_one(
        {"user_id": current_user_id},
        {"$set": {"screenshot_notifications": enabled}}
    )
    
    return {"message": f"Screenshot notifications {'enabled' if enabled else 'disabled'}"}

@api_router.post("/snaps", response_model=Snap)
async def send_snap(snap_data: SnapCreate, current_user_id: str = Depends(get_current_user)):
    sender = await db.users.find_one({"user_id": current_user_id}, {"_id": 0})
    
    snap_id = secrets.token_urlsafe(16)
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(hours=24)
    
    snap_doc = {
        "snap_id": snap_id,
        "sender_id": current_user_id,
        "sender_username": sender["username"],
        "sender_avatar": sender.get("avatar_url"),
        "recipient_id": snap_data.recipient_id,
        "image_url": snap_data.image_url,
        "text": snap_data.text,
        "viewed": False,
        "created_at": now.isoformat(),
        "expires_at": expires_at.isoformat()
    }
    
    await db.snaps.insert_one(snap_doc)
    return Snap(**snap_doc)

@api_router.get("/snaps", response_model=List[Snap])
async def get_snaps(current_user_id: str = Depends(get_current_user)):
    now = datetime.now(timezone.utc).isoformat()
    snaps = await db.snaps.find(
        {
            "recipient_id": current_user_id,
            "viewed": False,
            "expires_at": {"$gt": now}
        },
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return [Snap(**s) for s in snaps]

@api_router.put("/snaps/{snap_id}/view")
async def mark_snap_viewed(snap_id: str, current_user_id: str = Depends(get_current_user)):
    result = await db.snaps.update_one(
        {"snap_id": snap_id, "recipient_id": current_user_id},
        {"$set": {"viewed": True}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Snap not found")
    
    return {"message": "Snap marked as viewed"}

@api_router.post("/stories", response_model=Story)
async def create_story(story_data: StoryCreate, current_user_id: str = Depends(get_current_user)):
    user = await db.users.find_one({"user_id": current_user_id}, {"_id": 0})
    
    story_id = secrets.token_urlsafe(16)
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(hours=24)
    
    story_doc = {
        "story_id": story_id,
        "user_id": current_user_id,
        "username": user["username"],
        "user_avatar": user.get("avatar_url"),
        "image_url": story_data.image_url,
        "text": story_data.text,
        "created_at": now.isoformat(),
        "expires_at": expires_at.isoformat(),
        "views": []
    }
    
    await db.stories.insert_one(story_doc)
    return Story(**story_doc)

@api_router.get("/stories", response_model=List[Story])
async def get_stories(current_user_id: str = Depends(get_current_user)):
    user = await db.users.find_one({"user_id": current_user_id}, {"_id": 0})
    friend_ids = user.get("friends", [])
    friend_ids.append(current_user_id)
    
    now = datetime.now(timezone.utc).isoformat()
    stories = await db.stories.find(
        {
            "user_id": {"$in": friend_ids},
            "expires_at": {"$gt": now}
        },
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return [Story(**s) for s in stories]

@api_router.put("/stories/{story_id}/view")
async def mark_story_viewed(story_id: str, current_user_id: str = Depends(get_current_user)):
    result = await db.stories.update_one(
        {"story_id": story_id},
        {"$addToSet": {"views": current_user_id}}
    )
    
    if result.modified_count == 0:
        return {"message": "Story already viewed"}
    
    return {"message": "Story view recorded"}

@api_router.post("/messages", response_model=Message)
async def send_message(message_data: MessageCreate, current_user_id: str = Depends(get_current_user)):
    sender = await db.users.find_one({"user_id": current_user_id}, {"_id": 0})
    
    if not message_data.text and not message_data.image_url:
        raise HTTPException(status_code=400, detail="Message must contain text or image")
    
    message_id = secrets.token_urlsafe(16)
    now = datetime.now(timezone.utc)
    
    message_doc = {
        "message_id": message_id,
        "sender_id": current_user_id,
        "sender_username": sender["username"],
        "recipient_id": message_data.recipient_id,
        "text": message_data.text,
        "image_url": message_data.image_url,
        "disappearing": message_data.disappearing,
        "viewed": False,
        "disappear_after_seconds": message_data.disappear_after_seconds if message_data.disappearing else None,
        "viewed_at": None,
        "expires_at": None,
        "created_at": now.isoformat()
    }
    
    await db.messages.insert_one(message_doc)
    return Message(**message_doc)

@api_router.put("/messages/{message_id}/view")
async def mark_message_viewed(message_id: str, current_user_id: str = Depends(get_current_user)):
    message = await db.messages.find_one(
        {"message_id": message_id, "recipient_id": current_user_id},
        {"_id": 0}
    )
    
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    now = datetime.now(timezone.utc)
    update_data = {
        "viewed": True,
        "viewed_at": now.isoformat()
    }
    
    # Set expiration time for disappearing messages
    if message.get("disappearing"):
        disappear_seconds = message.get("disappear_after_seconds", 10)
        expires_at = now + timedelta(seconds=disappear_seconds)
        update_data["expires_at"] = expires_at.isoformat()
    
    await db.messages.update_one(
        {"message_id": message_id},
        {"$set": update_data}
    )
    
    return {"message": "Message marked as viewed", "expires_at": update_data.get("expires_at")}

@api_router.get("/messages/{friend_id}", response_model=List[Message])
async def get_messages(friend_id: str, current_user_id: str = Depends(get_current_user)):
    now = datetime.now(timezone.utc).isoformat()
    
    # Delete expired disappearing messages
    await db.messages.delete_many({
        "disappearing": True,
        "expires_at": {"$ne": None, "$lt": now}
    })
    
    messages = await db.messages.find(
        {
            "$or": [
                {"sender_id": current_user_id, "recipient_id": friend_id},
                {"sender_id": friend_id, "recipient_id": current_user_id}
            ]
        },
        {"_id": 0}
    ).sort("created_at", 1).to_list(500)
    
    return [Message(**m) for m in messages]

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

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()