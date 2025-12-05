from fastapi import APIRouter, Depends, HTTPException
from models import UserResponse, UserPublic
from auth import get_current_user
from motor.motor_asyncio import AsyncIOMotorDatabase
from database import get_db
from typing import List
from datetime import datetime

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    user = await db.users.find_one({"id": current_user["id"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return UserResponse(
        id=user["id"],
        name=user["name"],
        email=user["email"],
        mobile=user.get("mobile"),
        avatar=user.get("avatar"),
        isPremium=user.get("isPremium", False),
        subscriptionDate=user.get("subscriptionDate"),
        status=user.get("status", "offline"),
        lastActive=user.get("lastActive"),
        role=user.get("role", "user")
    )

@router.get("/search", response_model=List[UserPublic])
async def search_users(
    q: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Search users by name or mobile number - improved with word matching"""
    if not q or len(q.strip()) < 2:
        raise HTTPException(status_code=400, detail="Search query must be at least 2 characters")
    
    search_query = q.strip()
    
    # Split search query into words for better matching
    search_words = search_query.split()
    
    # Build regex patterns for each word
    regex_patterns = [{"name": {"$regex": word, "$options": "i"}} for word in search_words]
    
    # Search by name (matching any word) or mobile number
    users = await db.users.find({
        "$and": [
            {"id": {"$ne": current_user["id"]}},  # Exclude current user
            {"role": {"$in": ["user", "premium"]}},  # Only search regular users
            {
                "$or": [
                    {"$or": regex_patterns},  # Match any word in name
                    {"mobile": {"$regex": search_query}}
                ]
            }
        ]
    }, {
        "_id": 0,
        "id": 1,
        "name": 1,
        "mobile": 1,
        "avatar": 1,
        "isPremium": 1,
        "lastActive": 1,
        "email": 1
    }).limit(20).to_list(20)
    
    # Calculate status based on last active
    now = datetime.utcnow()
    result = []
    for user in users:
        last_active = user.get("lastActive", now)
        time_diff = (now - last_active).total_seconds()
        status = "online" if time_diff < 300 else "offline"  # 5 minutes
        
        result.append(UserPublic(
            id=user["id"],
            name=user["name"],
            mobile=user.get("mobile"),
            avatar=user.get("avatar"),
            status=status,
            isPremium=user.get("isPremium", False)
        ))
    
    return result

@router.get("/profile/{user_id}")
async def get_user_profile(
    user_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get detailed user profile with friend count"""
    
    # Get user details
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Count friends
    friendships = await db.friendships.find({
        "$or": [
            {"user1": user_id},
            {"user2": user_id}
        ]
    }).to_list(10000)
    
    friend_count = len(friendships)
    
    # Get friendship status with current user
    friendship_status = "not_friends"
    if user_id != current_user["id"]:
        # Check if friends
        friendship = await db.friendships.find_one({
            "$or": [
                {"user1": current_user["id"], "user2": user_id},
                {"user1": user_id, "user2": current_user["id"]}
            ]
        })
        
        if friendship:
            friendship_status = "friends"
        else:
            # Check pending requests
            sent_request = await db.friend_requests.find_one({
                "senderId": current_user["id"],
                "receiverId": user_id,
                "status": "pending"
            })
            
            if sent_request:
                friendship_status = "request_sent"
            else:
                received_request = await db.friend_requests.find_one({
                    "senderId": user_id,
                    "receiverId": current_user["id"],
                    "status": "pending"
                })
                
                if received_request:
                    friendship_status = "request_received"
    else:
        friendship_status = "self"
    
    # Calculate status
    now = datetime.utcnow()
    last_active = user.get("lastActive", now)
    time_diff = (now - last_active).total_seconds()
    status = "online" if time_diff < 300 else "offline"
    
    return {
        "id": user["id"],
        "name": user["name"],
        "email": user.get("email"),
        "mobile": user.get("mobile"),
        "avatar": user.get("avatar"),
        "isPremium": user.get("isPremium", False),
        "status": status,
        "role": user.get("role", "user"),
        "friendCount": friend_count,
        "friendshipStatus": friendship_status
    }

@router.get("", response_model=List[UserPublic])
async def get_all_users(current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    users = await db.users.find({"id": {"$ne": current_user["id"]}}).to_list(1000)
    
    # Calculate status based on last active
    now = datetime.utcnow()
    result = []
    for user in users:
        last_active = user.get("lastActive", user.get("createdAt", now))
        time_diff = (now - last_active).total_seconds()
        status = "online" if time_diff < 300 else "offline"  # 5 minutes
        
        result.append(UserPublic(
            id=user["id"],
            name=user["name"],
            mobile=user.get("mobile"),
            avatar=user.get("avatar"),
            status=status,
            isPremium=user.get("isPremium", False)
        ))
    
    return result
