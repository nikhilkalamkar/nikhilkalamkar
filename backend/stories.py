from fastapi import APIRouter, HTTPException, Request, File, UploadFile, Form
from fastapi.responses import FileResponse
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path
import os
from datetime import datetime, timezone, timedelta
import uuid
import shutil
from auth import get_session_token

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

router = APIRouter(prefix="/api/stories", tags=["stories"])

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create uploads directory
UPLOAD_DIR = Path("/app/uploads/stories")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/create")
async def create_story(
    request: Request,
    media: UploadFile = File(...),
    type: str = Form(...)
):
    """Create a new story (24 hour duration)"""
    try:
        # Get current user
        session_token = await get_session_token(request, None)
        if not session_token:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        session = await db.user_sessions.find_one({"session_token": session_token})
        if not session:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        user_id = session["user_id"]
        user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Validate file type
        if type == "image" and not media.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="Invalid image file")
        elif type == "video" and not media.content_type.startswith("video/"):
            raise HTTPException(status_code=400, detail="Invalid video file")
        
        # Generate unique filename
        story_item_id = f"story_{uuid.uuid4().hex[:12]}"
        file_ext = media.filename.split(".")[-1]
        filename = f"{story_item_id}.{file_ext}"
        file_path = UPLOAD_DIR / filename
        
        # Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(media.file, buffer)
        
        media_url = f"/api/stories/media/{filename}"
        
        # Calculate expiry (24 hours from now)
        expires_at = datetime.now(timezone.utc) + timedelta(hours=24)
        
        # Check if user has active stories collection
        story_collection = await db.stories.find_one({"user_id": user_id})
        
        story_item = {
            "id": story_item_id,
            "type": type,
            "url": media_url,
            "created_at": datetime.now(timezone.utc),
            "viewed": False
        }
        
        if story_collection:
            # Add to existing collection
            await db.stories.update_one(
                {"user_id": user_id},
                {
                    "$push": {"items": story_item},
                    "$set": {
                        "hasUnviewed": True,
                        "updated_at": datetime.now(timezone.utc)
                    }
                }
            )
        else:
            # Create new story collection
            await db.stories.insert_one({
                "story_id": f"story_collection_{uuid.uuid4().hex[:12]}",
                "user_id": user_id,
                "items": [story_item],
                "hasUnviewed": True,
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc),
                "expires_at": expires_at
            })
        
        return {
            "success": True,
            "story_item_id": story_item_id,
            "message": "Story created successfully"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/media/{filename}")
async def get_story_media(filename: str):
    """Serve story media"""
    file_path = UPLOAD_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Media not found")
    return FileResponse(file_path)
