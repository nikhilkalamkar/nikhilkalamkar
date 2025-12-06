from fastapi import APIRouter, HTTPException, Request
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path
import os
from auth import get_session_token

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

router = APIRouter(prefix="/api/block", tags=["blocking"])

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

@router.post("/user/{user_id}")
async def block_user(
    user_id: str,
    request: Request
):
    """Block a user"""
    try:
        # Get current user
        session_token = await get_session_token(request, None)
        if not session_token:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        session = await db.user_sessions.find_one({"session_token": session_token})
        if not session:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        current_user_id = session["user_id"]
        
        # Can't block yourself
        if current_user_id == user_id:
            raise HTTPException(status_code=400, detail="Cannot block yourself")
        
        # Check if user exists
        blocked_user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
        if not blocked_user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get current user's blocked list
        current_user = await db.users.find_one({"user_id": current_user_id}, {"_id": 0})
        blocked_users = current_user.get("blocked_users", [])
        
        # Check if already blocked
        if user_id in blocked_users:
            raise HTTPException(status_code=400, detail="User already blocked")
        
        # Add to blocked list
        blocked_users.append(user_id)
        await db.users.update_one(
            {"user_id": current_user_id},
            {"$set": {"blocked_users": blocked_users}}
        )
        
        return {
            "success": True,
            "message": "User blocked successfully",
            "blocked_user": {
                "id": blocked_user["user_id"],
                "username": blocked_user["username"]
            }
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/user/{user_id}")
async def unblock_user(
    user_id: str,
    request: Request
):
    """Unblock a user"""
    try:
        # Get current user
        session_token = await get_session_token(request, None)
        if not session_token:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        session = await db.user_sessions.find_one({"session_token": session_token})
        if not session:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        current_user_id = session["user_id"]
        
        # Get current user's blocked list
        current_user = await db.users.find_one({"user_id": current_user_id}, {"_id": 0})
        blocked_users = current_user.get("blocked_users", [])
        
        # Check if user is blocked
        if user_id not in blocked_users:
            raise HTTPException(status_code=400, detail="User not blocked")
        
        # Remove from blocked list
        blocked_users.remove(user_id)
        await db.users.update_one(
            {"user_id": current_user_id},
            {"$set": {"blocked_users": blocked_users}}
        )
        
        return {
            "success": True,
            "message": "User unblocked successfully"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/list")
async def get_blocked_users(request: Request):
    """Get list of blocked users"""
    try:
        # Get current user
        session_token = await get_session_token(request, None)
        if not session_token:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        session = await db.user_sessions.find_one({"session_token": session_token})
        if not session:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        current_user_id = session["user_id"]
        
        # Get current user's blocked list
        current_user = await db.users.find_one({"user_id": current_user_id}, {"_id": 0})
        blocked_user_ids = current_user.get("blocked_users", [])
        
        # Get details of blocked users
        blocked_users = []
        for user_id in blocked_user_ids:
            user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
            if user:
                blocked_users.append({
                    "id": user["user_id"],
                    "username": user["username"],
                    "fullName": user.get("fullName", ""),
                    "avatar": user.get("avatar", "")
                })
        
        return {"blocked_users": blocked_users}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/check/{user_id}")
async def check_blocked(
    user_id: str,
    request: Request
):
    """Check if a user is blocked or has blocked you"""
    try:
        # Get current user
        session_token = await get_session_token(request, None)
        if not session_token:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        session = await db.user_sessions.find_one({"session_token": session_token})
        if not session:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        current_user_id = session["user_id"]
        
        # Get both users
        current_user = await db.users.find_one({"user_id": current_user_id}, {"_id": 0})
        other_user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
        
        if not other_user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Check if current user blocked other user
        you_blocked_them = user_id in current_user.get("blocked_users", [])
        
        # Check if other user blocked current user
        they_blocked_you = current_user_id in other_user.get("blocked_users", [])
        
        return {
            "is_blocked": you_blocked_them or they_blocked_you,
            "you_blocked_them": you_blocked_them,
            "they_blocked_you": they_blocked_you
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
