from fastapi import APIRouter, HTTPException, status, Depends
from models import UserCreate, UserLogin, UserResponse
from auth import hash_password, verify_password, create_access_token, get_current_user
from motor.motor_asyncio import AsyncIOMotorDatabase
from database import get_db
from datetime import datetime, timedelta
import random
import uuid

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=dict)
async def register(user_data: UserCreate, db: AsyncIOMotorDatabase = Depends(get_db)):
    print(f"[DEBUG] Registration attempt for email: {user_data.email}")
    # Check if user exists by email
    existing_user = await db.users.find_one({"email": user_data.email})
    print(f"[DEBUG] Existing user found: {existing_user is not None}")
    if existing_user:
        print(f"[DEBUG] Existing user email: {existing_user.get('email')}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Check if mobile number already exists
    if user_data.mobile:
        existing_mobile = await db.users.find_one({"mobile": user_data.mobile})
        if existing_mobile:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mobile number already registered"
            )
    
    # Create user
    from models import User
    import uuid
    user = User(
        id=str(uuid.uuid4()),
        name=user_data.name,
        email=user_data.email,
        mobile=user_data.mobile,
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
            mobile=user.mobile,
            avatar=user.avatar,
            isPremium=user.isPremium,
            subscriptionDate=user.subscriptionDate,
            status=user.status,
            role=user.role
        ),
        "token": token
    }

@router.post("/login", response_model=dict)
async def login(user_data: UserLogin, db: AsyncIOMotorDatabase = Depends(get_db)):
    # Find user by email or mobile number
    user = await db.users.find_one({
        "$or": [
            {"email": user_data.identifier},
            {"mobile": user_data.identifier}
        ]
    })
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    # Verify password
    if not verify_password(user_data.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
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
            mobile=user.get("mobile"),
            avatar=user.get("avatar"),
            isPremium=user.get("isPremium", False),
            subscriptionDate=user.get("subscriptionDate"),
            status="online",
            role=user.get("role", "user")
        ),
        "token": token
    }

@router.post("/forgot-password")
async def forgot_password(data: dict, db: AsyncIOMotorDatabase = Depends(get_db)):
    identifier = data.get("identifier")
    
    # Find user
    user = await db.users.find_one({
        "$or": [
            {"email": identifier},
            {"mobile": identifier}
        ]
    })
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Generate 6-digit OTP
    otp = str(random.randint(100000, 999999))
    reset_token = str(uuid.uuid4())
    
    # Store reset token in database (expires in 10 minutes)
    await db.password_resets.insert_one({
        "userId": user["id"],
        "identifier": identifier,
        "otp": otp,
        "resetToken": reset_token,
        "createdAt": datetime.utcnow(),
        "expiresAt": datetime.utcnow() + timedelta(minutes=10),
        "used": False
    })
    
    # In production, send OTP via email/SMS
    # For demo, return OTP in response
    return {
        "message": "Reset code sent",
        "resetToken": reset_token,
        "otp": otp  # Remove this in production
    }

@router.post("/verify-otp")
async def verify_otp(data: dict, db: AsyncIOMotorDatabase = Depends(get_db)):
    identifier = data.get("identifier")
    otp = data.get("otp")
    reset_token = data.get("resetToken")
    
    # Find reset request
    reset_request = await db.password_resets.find_one({
        "identifier": identifier,
        "otp": otp,
        "resetToken": reset_token,
        "used": False
    })
    
    if not reset_request:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired code"
        )
    
    # Check if expired
    if reset_request["expiresAt"] < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Code has expired"
        )
    
    return {"message": "Code verified successfully"}

@router.post("/reset-password")
async def reset_password(data: dict, db: AsyncIOMotorDatabase = Depends(get_db)):
    identifier = data.get("identifier")
    otp = data.get("otp")
    reset_token = data.get("resetToken")
    new_password = data.get("newPassword")
    
    # Find reset request
    reset_request = await db.password_resets.find_one({
        "identifier": identifier,
        "otp": otp,
        "resetToken": reset_token,
        "used": False
    })
    
    if not reset_request:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired code"
        )
    
    # Check if expired
    if reset_request["expiresAt"] < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Code has expired"
        )
    
    # Update user password
    await db.users.update_one(
        {"id": reset_request["userId"]},
        {"$set": {"password": hash_password(new_password)}}
    )
    
    # Mark reset request as used
    await db.password_resets.update_one(
        {"_id": reset_request["_id"]},
        {"$set": {"used": True}}
    )
    
    return {"message": "Password reset successfully"}
