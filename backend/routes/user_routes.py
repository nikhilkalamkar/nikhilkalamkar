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
        lastActive=user.get("lastActive")
    )

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
