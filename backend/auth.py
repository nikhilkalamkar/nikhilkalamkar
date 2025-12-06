from fastapi import APIRouter, HTTPException, Response, Request, Header
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone, timedelta
import os
import httpx
import uuid

router = APIRouter(prefix="/api/auth", tags=["auth"])

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

class SessionData(BaseModel):
    session_id: str

# Helper function to get session token from cookies or headers
async def get_session_token(request: Request, authorization: str = Header(None)):
    # Try cookie first
    session_token = request.cookies.get('session_token')
    
    # Fallback to Authorization header
    if not session_token and authorization:
        if authorization.startswith('Bearer '):
            session_token = authorization.replace('Bearer ', '')
    
    return session_token

@router.post("/session")
async def create_session(session_data: SessionData, response: Response):
    """Process session_id from Emergent Auth and create user session"""
    try:
        # Call Emergent Auth API to get user data
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_data.session_id}
            )
            
            if resp.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid session")
            
            auth_data = resp.json()
        
        # Check if user exists
        user = await db.users.find_one({"email": auth_data["email"]}, {"_id": 0})
        
        if not user:
            # Create new user
            user_id = f"user_{uuid.uuid4().hex[:12]}"
            user = {
                "user_id": user_id,
                "username": auth_data["email"].split('@')[0].lower(),
                "email": auth_data["email"],
                "fullName": auth_data["name"],
                "avatar": auth_data.get("picture", ""),
                "bio": "",
                "website": "",
                "postsCount": 0,
                "followersCount": 0,
                "followingCount": 0,
                "isPrivate": False,
                "isVerified": False,
                "created_at": datetime.now(timezone.utc)
            }
            await db.users.insert_one(user)
        else:
            user_id = user["user_id"]
        
        # Create session
        session_token = auth_data["session_token"]
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        
        await db.user_sessions.insert_one({
            "user_id": user_id,
            "session_token": session_token,
            "expires_at": expires_at,
            "created_at": datetime.now(timezone.utc)
        })
        
        # Set httpOnly cookie
        response.set_cookie(
            key="session_token",
            value=session_token,
            httponly=True,
            secure=True,
            samesite="none",
            path="/",
            max_age=7*24*60*60
        )
        
        return {
            "user": {
                "user_id": user_id,
                "username": user["username"],
                "email": user["email"],
                "fullName": user["fullName"],
                "avatar": user["avatar"]
            }
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/me")
async def get_current_user(request: Request, authorization: str = Header(None)):
    """Get current authenticated user"""
    session_token = await get_session_token(request, authorization)
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Find session
    session = await db.user_sessions.find_one({"session_token": session_token})
    
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    # Check expiry
    expires_at = session["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    
    if expires_at < datetime.now(timezone.utc):
        await db.user_sessions.delete_one({"session_token": session_token})
        raise HTTPException(status_code=401, detail="Session expired")
    
    # Get user
    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"user": user}

@router.post("/logout")
async def logout(request: Request, response: Response):
    """Logout current user"""
    session_token = request.cookies.get('session_token')
    
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    # Clear cookie
    response.delete_cookie(key="session_token", path="/")
    
    return {"message": "Logged out successfully"}
