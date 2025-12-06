from fastapi import APIRouter, HTTPException, Request, Query
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path
import os
from auth import get_session_token
from pydantic import BaseModel

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

router = APIRouter(prefix="/api/users", tags=["users"])

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

@router.get("/search")
async def search_users(
    request: Request,
    q: str = Query(..., description="Search query")
):
    """Search users by username or full name"""
    try:
        # Get current user for authentication
        session_token = await get_session_token(request, None)
        if not session_token:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        session = await db.user_sessions.find_one({"session_token": session_token})
        if not session:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        current_user_id = session["user_id"]
        
        # Get current user's blocked list
        current_user = await db.users.find_one({"user_id": current_user_id}, {"_id": 0})
        my_blocked_users = current_user.get("blocked_users", [])
        
        # Search users by username or full name (case insensitive)
        if not q or not q.strip():
            return {"users": []}
        
        search_regex = {"$regex": q.strip(), "$options": "i"}
        
        users = await db.users.find(
            {
                "$or": [
                    {"username": search_regex},
                    {"fullName": search_regex}
                ]
            },
            {"_id": 0}
        ).limit(20).to_list(20)
        
        # Format user data and filter blocked users
        formatted_users = []
        for user in users:
            user_id = user["user_id"]
            
            # Skip if current user blocked this user
            if user_id in my_blocked_users:
                continue
            
            # Skip if this user blocked current user
            user_blocked_list = user.get("blocked_users", [])
            if current_user_id in user_blocked_list:
                continue
            
            formatted_users.append({
                "id": user["user_id"],
                "username": user["username"],
                "fullName": user.get("fullName", ""),
                "avatar": user.get("avatar", ""),
                "followersCount": user.get("followersCount", 0),
                "followingCount": user.get("followingCount", 0),
                "isVerified": user.get("isVerified", False)
            })
        
        return {"users": formatted_users}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{username}")
async def get_user_by_username(
    username: str,
    request: Request
):
    """Get user profile by username"""
    try:
        # Get current user for authentication
        session_token = await get_session_token(request, None)
        if not session_token:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        session = await db.user_sessions.find_one({"session_token": session_token})
        if not session:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        # Find user by username
        user = await db.users.find_one({"username": username}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Format user data
        formatted_user = {
            "id": user["user_id"],
            "username": user["username"],
            "fullName": user.get("fullName", ""),
            "avatar": user.get("avatar", ""),
            "bio": user.get("bio", ""),
            "website": user.get("website", ""),
            "postsCount": user.get("postsCount", 0),
            "followersCount": user.get("followersCount", 0),
            "followingCount": user.get("followingCount", 0),
            "isPrivate": user.get("isPrivate", False),
            "isVerified": user.get("isVerified", False)
        }
        
        return {"user": formatted_user}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
