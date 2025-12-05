from fastapi import APIRouter, Depends, HTTPException
from auth import get_current_user
from motor.motor_asyncio import AsyncIOMotorDatabase
from database import get_db
from datetime import datetime
from typing import Optional
from pydantic import BaseModel

router = APIRouter(prefix="/calls", tags=["Calls"])

class CallSignal(BaseModel):
    callId: str
    signal: dict
    type: str  # offer, answer, ice-candidate

class CallInitiate(BaseModel):
    receiverId: str
    callType: str  # audio or video

class CallResponse(BaseModel):
    callId: str
    action: str  # accept or reject

@router.post("/initiate")
async def initiate_call(
    call_data: CallInitiate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Initiate a new call"""
    
    # Check if receiver exists
    receiver = await db.users.find_one({"id": call_data.receiverId}, {"_id": 0})
    if not receiver:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if users are friends
    friendship = await db.friendships.find_one({
        "$or": [
            {"user1": current_user["id"], "user2": call_data.receiverId},
            {"user1": call_data.receiverId, "user2": current_user["id"]}
        ]
    })
    
    if not friendship:
        raise HTTPException(status_code=403, detail="Can only call friends")
    
    # Create call record
    call = {
        "callId": f"call_{current_user['id']}_{call_data.receiverId}_{int(datetime.utcnow().timestamp())}",
        "callerId": current_user["id"],
        "callerName": current_user.get("name", "User"),
        "receiverId": call_data.receiverId,
        "receiverName": receiver.get("name", "User"),
        "callType": call_data.callType,
        "status": "ringing",
        "initiatedAt": datetime.utcnow(),
        "answeredAt": None,
        "endedAt": None,
        "signal": None
    }
    
    await db.calls.insert_one(call)
    
    return {
        "callId": call["callId"],
        "receiverId": call_data.receiverId,
        "receiverName": receiver.get("name"),
        "callType": call_data.callType
    }

@router.post("/signal")
async def send_signal(
    signal_data: CallSignal,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Send WebRTC signal (offer/answer/ice-candidate)"""
    
    # Store signal in database
    await db.call_signals.insert_one({
        "callId": signal_data.callId,
        "userId": current_user["id"],
        "signal": signal_data.signal,
        "type": signal_data.type,
        "timestamp": datetime.utcnow()
    })
    
    return {"status": "signal_sent"}

@router.get("/signal/{call_id}")
async def get_signals(
    call_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get pending signals for a call"""
    
    # Get signals that are not from current user
    signals = await db.call_signals.find({
        "callId": call_id,
        "userId": {"$ne": current_user["id"]}
    }, {"_id": 0}).sort("timestamp", 1).to_list(100)
    
    # Delete retrieved signals
    await db.call_signals.delete_many({
        "callId": call_id,
        "userId": {"$ne": current_user["id"]}
    })
    
    return {"signals": signals}

@router.post("/respond")
async def respond_to_call(
    response_data: CallResponse,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Accept or reject a call"""
    
    call = await db.calls.find_one({"callId": response_data.callId})
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")
    
    if call["receiverId"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if response_data.action == "accept":
        await db.calls.update_one(
            {"callId": response_data.callId},
            {
                "$set": {
                    "status": "connected",
                    "answeredAt": datetime.utcnow()
                }
            }
        )
        return {"status": "call_accepted"}
    else:
        await db.calls.update_one(
            {"callId": response_data.callId},
            {
                "$set": {
                    "status": "rejected",
                    "endedAt": datetime.utcnow()
                }
            }
        )
        return {"status": "call_rejected"}

@router.post("/end/{call_id}")
async def end_call(
    call_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """End an active call"""
    
    call = await db.calls.find_one({"callId": call_id})
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")
    
    if call["callerId"] != current_user["id"] and call["receiverId"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.calls.update_one(
        {"callId": call_id},
        {
            "$set": {
                "status": "ended",
                "endedAt": datetime.utcnow()
            }
        }
    )
    
    # Clean up signals
    await db.call_signals.delete_many({"callId": call_id})
    
    return {"status": "call_ended"}

@router.get("/incoming")
async def get_incoming_calls(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get incoming calls for current user"""
    
    calls = await db.calls.find({
        "receiverId": current_user["id"],
        "status": "ringing"
    }, {"_id": 0}).sort("initiatedAt", -1).to_list(10)
    
    return {"calls": calls}

@router.get("/status/{call_id}")
async def get_call_status(
    call_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get current status of a call"""
    
    call = await db.calls.find_one({"callId": call_id}, {"_id": 0})
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")
    
    return call
