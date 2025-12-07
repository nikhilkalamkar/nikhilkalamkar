from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
import secrets
from datetime import datetime, timezone, timedelta
import razorpay
import os

admin_router = APIRouter(prefix="/api/admin")

# Razorpay client
razorpay_client = razorpay.Client(auth=(os.getenv('RAZORPAY_KEY_ID', 'test_key'), os.getenv('RAZORPAY_KEY_SECRET', 'test_secret')))

class AdminLogin(BaseModel):
    username: str
    password: str

class UserBan(BaseModel):
    user_id: str
    reason: str

class TeamMember(BaseModel):
    user_id: str
    role: str

class StoryPromotion(BaseModel):
    story_id: str
    amount: int
    duration_days: int

# Admin credentials (in production, use database)
ADMIN_CREDENTIALS = {
    "admin": "ishukart2024",  # Username: admin, Password: ishukart2024
    "superadmin": "ishukart@admin123"  # Username: superadmin, Password: ishukart@admin123
}

@admin_router.post("/login")
async def admin_login(credentials: AdminLogin):
    if credentials.username in ADMIN_CREDENTIALS:
        if ADMIN_CREDENTIALS[credentials.username] == credentials.password:
            token = secrets.token_urlsafe(32)
            return {
                "success": True,
                "token": token,
                "username": credentials.username,
                "role": "superadmin" if credentials.username == "superadmin" else "admin"
            }
    raise HTTPException(status_code=401, detail="Invalid credentials")

@admin_router.get("/users")
async def get_all_users():
    from server import db
    users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(1000)
    return users

@admin_router.post("/users/ban")
async def ban_user(ban_data: UserBan):
    from server import db
    result = await db.users.update_one(
        {"user_id": ban_data.user_id},
        {"$set": {"banned": True, "ban_reason": ban_data.reason, "banned_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.modified_count > 0:
        return {"success": True, "message": "User banned successfully"}
    raise HTTPException(status_code=404, detail="User not found")

@admin_router.post("/users/unban")
async def unban_user(user_id: str):
    from server import db
    result = await db.users.update_one(
        {"user_id": user_id},
        {"$set": {"banned": False}, "$unset": {"ban_reason": "", "banned_at": ""}}
    )
    if result.modified_count > 0:
        return {"success": True, "message": "User unbanned successfully"}
    raise HTTPException(status_code=404, detail="User not found")

@admin_router.post("/team/assign")
async def assign_team_member(team_data: TeamMember):
    from server import db
    result = await db.users.update_one(
        {"user_id": team_data.user_id},
        {"$set": {"team_role": team_data.role, "is_team_member": True}}
    )
    if result.modified_count > 0:
        return {"success": True, "message": f"User assigned as {team_data.role}"}
    raise HTTPException(status_code=404, detail="User not found")

@admin_router.get("/stories/all")
async def get_all_stories():
    from server import db
    stories = await db.stories.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return stories

@admin_router.get("/promotions")
async def get_promotions():
    from server import db
    promotions = await db.promotions.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return promotions

@admin_router.post("/create-payment-order")
async def create_payment_order(amount: int):
    try:
        order = razorpay_client.order.create({
            "amount": amount * 100,  # Amount in paise
            "currency": "INR",
            "payment_capture": 1
        })
        return order
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@admin_router.get("/stats")
async def get_admin_stats():
    from server import db
    total_users = await db.users.count_documents({})
    total_stories = await db.stories.count_documents({})
    total_messages = await db.messages.count_documents({})
    banned_users = await db.users.count_documents({"banned": True})
    team_members = await db.users.count_documents({"is_team_member": True})
    
    return {
        "total_users": total_users,
        "total_stories": total_stories,
        "total_messages": total_messages,
        "banned_users": banned_users,
        "team_members": team_members
    }
