from fastapi import APIRouter, HTTPException, Request, File, UploadFile, Form
from fastapi.responses import FileResponse
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path
import os
from datetime import datetime, timezone
import uuid
import shutil
from typing import List
from auth import get_session_token

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

router = APIRouter(prefix="/api/posts", tags=["posts"])

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create uploads directory
UPLOAD_DIR = Path("/app/uploads/posts")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/create")
async def create_post(
    request: Request,
    images: List[UploadFile] = File(...),
    caption: str = Form(""),
    location: str = Form("")
):
    """Create a new post with images"""
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
        
        # Save images
        image_urls = []
        post_id = f"post_{uuid.uuid4().hex[:12]}"
        
        for i, image in enumerate(images):
            # Validate file type
            if not image.content_type.startswith("image/"):
                raise HTTPException(status_code=400, detail=f"File {image.filename} is not an image")
            
            # Generate unique filename
            file_ext = image.filename.split(".")[-1]
            filename = f"{post_id}_{i}.{file_ext}"
            file_path = UPLOAD_DIR / filename
            
            # Save file
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(image.file, buffer)
            
            image_urls.append(f"/api/posts/image/{filename}")
        
        # Create post document
        post = {
            "post_id": post_id,
            "user_id": user_id,
            "images": image_urls,
            "caption": caption,
            "location": location if location else None,
            "likes": 0,
            "comments": 0,
            "is_liked": False,
            "is_saved": False,
            "is_boosted": False,
            "created_at": datetime.now(timezone.utc)
        }
        
        await db.posts.insert_one(post)
        
        # Update user post count
        await db.users.update_one(
            {"user_id": user_id},
            {"$inc": {"postsCount": 1}}
        )
        
        return {
            "success": True,
            "post_id": post_id,
            "message": "Post created successfully"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/image/{filename}")
async def get_post_image(filename: str):
    """Serve post images"""
    file_path = UPLOAD_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Image not found")
    return FileResponse(file_path)
