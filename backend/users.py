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

class UpdateProfileRequest(BaseModel):
    fullName: str = None
    bio: str = None
    website: str = None
    avatar: str = None

@router.put("/profile")
async def update_profile(
    request: Request,
    profile_data: UpdateProfileRequest
):
    """Update user profile"""
    try:
        # Get current user
        session_token = await get_session_token(request, None)
        if not session_token:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        session = await db.user_sessions.find_one({"session_token": session_token})
        if not session:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        user_id = session["user_id"]
        
        # Prepare update data
        update_data = {}
        if profile_data.fullName is not None:
            update_data["fullName"] = profile_data.fullName
        if profile_data.bio is not None:
            update_data["bio"] = profile_data.bio
        if profile_data.website is not None:
            update_data["website"] = profile_data.website
        if profile_data.avatar is not None:
            update_data["avatar"] = profile_data.avatar
        
        # Update user in database
        result = await db.users.update_one(
            {"user_id": user_id},
            {"$set": update_data}
        )
        
        if result.modified_count == 0 and result.matched_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get updated user
        updated_user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
        
        return {
            "success": True,
            "message": "Profile updated successfully",
            "user": {
                "id": updated_user["user_id"],
                "username": updated_user["username"],
                "fullName": updated_user.get("fullName", ""),
                "bio": updated_user.get("bio", ""),
                "website": updated_user.get("website", ""),
                "avatar": updated_user.get("avatar", "")
            }
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
