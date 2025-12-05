from fastapi import APIRouter, Depends, HTTPException
from models import FriendRequest, FriendRequestResponse, FriendRequestCreate, UserPublic
from auth import get_current_user
from motor.motor_asyncio import AsyncIOMotorDatabase
from database import get_db
from typing import List
from datetime import datetime

router = APIRouter(prefix="/friends", tags=["Friends"])

@router.post("/request", response_model=FriendRequestResponse)
async def send_friend_request(
    request_data: FriendRequestCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Send a friend request to another user"""
    
    # Check if receiver exists
    receiver = await db.users.find_one({"id": request_data.receiverId}, {"_id": 0})
    if not receiver:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Can't send request to self
    if request_data.receiverId == current_user["id"]:
        raise HTTPException(status_code=400, detail="Cannot send friend request to yourself")
    
    # Check if already friends
    existing_friendship = await db.friendships.find_one({
        "$or": [
            {"user1": current_user["id"], "user2": request_data.receiverId},
            {"user1": request_data.receiverId, "user2": current_user["id"]}
        ]
    })
    if existing_friendship:
        raise HTTPException(status_code=400, detail="Already friends with this user")
    
    # Check if request already exists
    existing_request = await db.friend_requests.find_one({
        "senderId": current_user["id"],
        "receiverId": request_data.receiverId,
        "status": "pending"
    })
    if existing_request:
        raise HTTPException(status_code=400, detail="Friend request already sent")
    
    # Check if there's a pending request from the other user
    reverse_request = await db.friend_requests.find_one({
        "senderId": request_data.receiverId,
        "receiverId": current_user["id"],
        "status": "pending"
    })
    if reverse_request:
        raise HTTPException(
            status_code=400,
            detail="This user has already sent you a friend request. Please accept it instead."
        )
    
    # Get sender info
    sender = await db.users.find_one({"id": current_user["id"]}, {"_id": 0})
    
    # Create friend request
    friend_request = FriendRequest(
        senderId=current_user["id"],
        senderName=sender["name"],
        senderAvatar=sender.get("avatar"),
        receiverId=request_data.receiverId,
        receiverName=receiver["name"],
        receiverAvatar=receiver.get("avatar"),
        status="pending"
    )
    
    await db.friend_requests.insert_one(friend_request.dict())
    
    return FriendRequestResponse(**friend_request.dict())

@router.get("/requests/received", response_model=List[FriendRequestResponse])
async def get_received_requests(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get all pending friend requests received by the current user"""
    
    requests = await db.friend_requests.find({
        "receiverId": current_user["id"],
        "status": "pending"
    }, {"_id": 0}).sort("createdAt", -1).to_list(100)
    
    return [FriendRequestResponse(**req) for req in requests]

@router.get("/requests/sent", response_model=List[FriendRequestResponse])
async def get_sent_requests(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get all friend requests sent by the current user"""
    
    requests = await db.friend_requests.find({
        "senderId": current_user["id"],
        "status": "pending"
    }, {"_id": 0}).sort("createdAt", -1).to_list(100)
    
    return [FriendRequestResponse(**req) for req in requests]

@router.put("/request/{request_id}/accept")
async def accept_friend_request(
    request_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Accept a friend request"""
    
    # Find the request
    friend_request = await db.friend_requests.find_one({
        "id": request_id,
        "receiverId": current_user["id"],
        "status": "pending"
    })
    
    if not friend_request:
        raise HTTPException(status_code=404, detail="Friend request not found")
    
    # Update request status
    await db.friend_requests.update_one(
        {"id": request_id},
        {
            "$set": {
                "status": "accepted",
                "respondedAt": datetime.utcnow()
            }
        }
    )
    
    # Create friendship
    friendship = {
        "user1": friend_request["senderId"],
        "user2": friend_request["receiverId"],
        "createdAt": datetime.utcnow()
    }
    await db.friendships.insert_one(friendship)
    
    return {"message": "Friend request accepted", "friendId": friend_request["senderId"]}

@router.put("/request/{request_id}/reject")
async def reject_friend_request(
    request_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Reject a friend request"""
    
    # Find the request
    friend_request = await db.friend_requests.find_one({
        "id": request_id,
        "receiverId": current_user["id"],
        "status": "pending"
    })
    
    if not friend_request:
        raise HTTPException(status_code=404, detail="Friend request not found")
    
    # Update request status
    await db.friend_requests.update_one(
        {"id": request_id},
        {
            "$set": {
                "status": "rejected",
                "respondedAt": datetime.utcnow()
            }
        }
    )
    
    return {"message": "Friend request rejected"}

@router.delete("/request/{request_id}")
async def cancel_friend_request(
    request_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Cancel a sent friend request"""
    
    # Find the request
    friend_request = await db.friend_requests.find_one({
        "id": request_id,
        "senderId": current_user["id"],
        "status": "pending"
    })
    
    if not friend_request:
        raise HTTPException(status_code=404, detail="Friend request not found")
    
    # Delete the request
    await db.friend_requests.delete_one({"id": request_id})
    
    return {"message": "Friend request cancelled"}

@router.get("/list", response_model=List[UserPublic])
async def get_friends_list(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get list of all friends"""
    
    # Find all friendships
    friendships = await db.friendships.find({
        "$or": [
            {"user1": current_user["id"]},
            {"user2": current_user["id"]}
        ]
    }).to_list(1000)
    
    # Extract friend IDs
    friend_ids = []
    for friendship in friendships:
        if friendship["user1"] == current_user["id"]:
            friend_ids.append(friendship["user2"])
        else:
            friend_ids.append(friendship["user1"])
    
    if not friend_ids:
        return []
    
    # Fetch friend details
    friends = await db.users.find(
        {"id": {"$in": friend_ids}},
        {"_id": 0, "id": 1, "name": 1, "mobile": 1, "avatar": 1, "isPremium": 1, "lastActive": 1}
    ).to_list(1000)
    
    # Calculate status
    now = datetime.utcnow()
    result = []
    for friend in friends:
        last_active = friend.get("lastActive", now)
        time_diff = (now - last_active).total_seconds()
        status = "online" if time_diff < 300 else "offline"
        
        result.append(UserPublic(
            id=friend["id"],
            name=friend["name"],
            mobile=friend.get("mobile"),
            avatar=friend.get("avatar"),
            status=status,
            isPremium=friend.get("isPremium", False)
        ))
    
    return result

@router.get("/status/{user_id}")
async def check_friendship_status(
    user_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Check friendship status with a user"""
    
    # Check if friends
    friendship = await db.friendships.find_one({
        "$or": [
            {"user1": current_user["id"], "user2": user_id},
            {"user1": user_id, "user2": current_user["id"]}
        ]
    })
    
    if friendship:
        return {"status": "friends"}
    
    # Check if request sent
    sent_request = await db.friend_requests.find_one({
        "senderId": current_user["id"],
        "receiverId": user_id,
        "status": "pending"
    })
    
    if sent_request:
        return {"status": "request_sent", "requestId": sent_request["id"]}
    
    # Check if request received
    received_request = await db.friend_requests.find_one({
        "senderId": user_id,
        "receiverId": current_user["id"],
        "status": "pending"
    })
    
    if received_request:
        return {"status": "request_received", "requestId": received_request["id"]}
    
    return {"status": "not_friends"}
