from fastapi import APIRouter, HTTPException, status, Depends
from models import UserCreate, UserLogin, UserResponse
from auth import hash_password, verify_password, create_access_token, get_current_user
from motor.motor_asyncio import AsyncIOMotorDatabase
from database import get_db
from datetime import datetime

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=dict)
async def register(user_data: UserCreate, db: AsyncIOMotorDatabase = Depends(get_db)):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user
    from models import User
    import uuid
    user = User(
        id=str(uuid.uuid4()),
        name=user_data.name,
        email=user_data.email,
        password=hash_password(user_data.password),
        avatar=f"https://api.dicebear.com/7.x/avataaars/svg?seed={user_data.name}",
        isPremium=False,
        role="user",
        status="online"
    )
    
    await db.users.insert_one(user.dict())
    
    # Create token
    token = create_access_token({
        "sub": user.id,
        "email": user.email,
        "role": user.role
    })
    
    return {
        "user": UserResponse(
            id=user.id,
            name=user.name,
            email=user.email,
            avatar=user.avatar,
            isPremium=user.isPremium,
            subscriptionDate=user.subscriptionDate,
            status=user.status
        ),
        "token": token
    }

@router.post("/login", response_model=dict)
async def login(user_data: UserLogin, db: AsyncIOMotorDatabase = Depends(get_db)):
    # Find user
    user = await db.users.find_one({"email": user_data.email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Verify password
    if not verify_password(user_data.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Update last active
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"lastActive": datetime.utcnow(), "status": "online"}}
    )
    
    # Create token
    token = create_access_token({
        "sub": user["id"],
        "email": user["email"],
        "role": user.get("role", "user")
    })
    
    return {
        "user": UserResponse(
            id=user["id"],
            name=user["name"],
            email=user["email"],
            avatar=user.get("avatar"),
            isPremium=user.get("isPremium", False),
            subscriptionDate=user.get("subscriptionDate"),
            status="online"
        ),
        "token": token
    }
