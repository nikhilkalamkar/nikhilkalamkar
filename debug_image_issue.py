#!/usr/bin/env python3
"""
Debug script to investigate the image upload issue reported by the user.
This script will create a realistic scenario and test all aspects of image display.
"""

import requests
import json
import time
import os
from datetime import datetime

class ImageIssueDebugger:
    def __init__(self):
        self.base_url = "https://snapchat-clone-24.preview.emergentagent.com/api"
        self.users = []
        self.chats = []
        
    def create_test_users(self, count=2):
        """Create test users for debugging"""
        print(f"🔧 Creating {count} test users...")
        
        timestamp = int(time.time())
        
        for i in range(count):
            user_data = {
                "username": f"debuguser{i+1}_{timestamp}",
                "email": f"debuguser{i+1}_{timestamp}@test.com",
                "password": "DebugPass123!"
            }
            
            try:
                response = requests.post(f"{self.base_url}/auth/register", json=user_data, timeout=10)
                if response.status_code == 200:
                    user_info = response.json()
                    user_info['credentials'] = user_data
                    self.users.append(user_info)
                    print(f"  ✅ Created user: {user_data['username']}")
                else:
                    print(f"  ❌ Failed to create user {i+1}: {response.status_code}")
                    return False
            except Exception as e:
                print(f"  ❌ Exception creating user {i+1}: {e}")
                return False
        
        return len(self.users) == count
    
    def establish_friendship(self):
        """Make users friends and create chat"""
        if len(self.users) < 2:
            print("❌ Need at least 2 users for friendship")
            return False
        
        print("🤝 Establishing friendship...")
        
        user1 = self.users[0]
        user2 = self.users[1]
        
        # User 1 sends friend request
        headers1 = {'Authorization': f'Bearer {user1["access_token"]}'}
        
        try:
            response = requests.post(
                f"{self.base_url}/friends/request?receiver_id={user2['user']['user_id']}", 
                headers=headers1, 
                timeout=10
            )
            
            if response.status_code != 200:
                print(f"  ❌ Failed to send friend request: {response.status_code}")
                return False
            
            print("  ✅ Friend request sent")
            
            # User 2 accepts friend request
            headers2 = {'Authorization': f'Bearer {user2["access_token"]}'}
            
            # Get friend requests
            response = requests.get(f"{self.base_url}/friends/requests", headers=headers2, timeout=10)
            if response.status_code != 200:
                print(f"  ❌ Failed to get friend requests: {response.status_code}")
                return False
            
            requests_data = response.json()
            if not requests_data:
                print("  ❌ No friend requests found")
                return False
            
            request_id = requests_data[0]['request_id']
            
            # Accept the request
            response = requests.post(
                f"{self.base_url}/friends/accept/{request_id}", 
                headers=headers2, 
                timeout=10
            )
            
            if response.status_code != 200:
                print(f"  ❌ Failed to accept friend request: {response.status_code}")
                return False
            
            chat_id = response.json().get('chat_id')
            if not chat_id:
                print("  ❌ No chat_id returned")
                return False
            
            self.chats.append(chat_id)
            print(f"  ✅ Friendship established, chat created: {chat_id[:8]}...")
            return True
            
        except Exception as e:
            print(f"  ❌ Exception during friendship: {e}")
            return False
    
    def create_real_image_file(self):
        """Create a real PNG image for testing"""
        # This is a minimal valid PNG file (1x1 pixel, red)
        png_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00\x00\x01\x00\x01\x00\x18\xdd\x8d\xb4\x1c\x00\x00\x00\x00IEND\xaeB`\x82'
        return png_data
    
    def upload_image_and_debug(self):
        """Upload image and debug the entire flow"""
        if not self.chats:
            print("❌ No chat available for image upload")
            return False
        
        print("📸 Testing image upload flow...")
        
        chat_id = self.chats[0]
        user1 = self.users[0]
        user2 = self.users[1]
        
        # Check uploads directory before
        files_before = os.listdir('/app/uploads/') if os.path.exists('/app/uploads/') else []
        print(f"  📁 Files before upload: {len(files_before)} files")
        
        # Upload image as User 1
        headers1 = {'Authorization': f'Bearer {user1["access_token"]}'}
        
        image_data = self.create_real_image_file()
        files = {'media': ('debug_test.png', image_data, 'image/png')}
        data = {
            'content': 'Debug test image - can you see this?',
            'message_type': 'image'
        }
        
        try:
            print("  📤 Uploading image...")
            response = requests.post(
                f"{self.base_url}/chats/{chat_id}/messages",
                data=data,
                files=files,
                headers=headers1,
                timeout=15
            )
            
            if response.status_code != 200:
                print(f"  ❌ Upload failed: {response.status_code}")
                try:
                    error = response.json()
                    print(f"     Error: {error.get('detail', 'Unknown')}")
                except:
                    print(f"     Response: {response.text[:200]}")
                return False
            
            message_data = response.json()
            media_url = message_data.get('media_url')
            message_id = message_data.get('message_id')
            message_type = message_data.get('message_type')
            
            print(f"  ✅ Upload successful!")
            print(f"     Message ID: {message_id}")
            print(f"     Media URL: {media_url}")
            print(f"     Message Type: {message_type}")
            
            # Check if file was created
            files_after = os.listdir('/app/uploads/') if os.path.exists('/app/uploads/') else []
            new_files = [f for f in files_after if f not in files_before]
            
            if new_files:
                filename = new_files[0]
                file_path = f"/app/uploads/{filename}"
                file_size = os.path.getsize(file_path)
                print(f"  ✅ File created: {filename} ({file_size} bytes)")
                
                # Test direct media access
                if media_url:
                    media_filename = media_url.split('/')[-1]
                    print(f"  🔍 Testing media endpoint: /api/media/{media_filename}")
                    
                    media_response = requests.get(f"{self.base_url}/media/{media_filename}", timeout=10)
                    content_type = media_response.headers.get('content-type', 'unknown')
                    
                    if media_response.status_code == 200:
                        print(f"  ✅ Media endpoint works: {content_type}")
                    else:
                        print(f"  ❌ Media endpoint failed: {media_response.status_code}")
                        return False
                
                # Test User 2 can see the message
                print("  👥 Testing User 2 can see the image...")
                headers2 = {'Authorization': f'Bearer {user2["access_token"]}'}
                
                response = requests.get(f"{self.base_url}/chats/{chat_id}/messages", headers=headers2, timeout=10)
                
                if response.status_code != 200:
                    print(f"  ❌ User 2 can't get messages: {response.status_code}")
                    return False
                
                messages = response.json()
                image_message = None
                
                for msg in messages:
                    if msg.get('message_id') == message_id:
                        image_message = msg
                        break
                
                if not image_message:
                    print(f"  ❌ User 2 can't see the image message")
                    return False
                
                user2_media_url = image_message.get('media_url')
                user2_message_type = image_message.get('message_type')
                
                print(f"  ✅ User 2 sees message:")
                print(f"     Content: {image_message.get('content', '')}")
                print(f"     Media URL: {user2_media_url}")
                print(f"     Type: {user2_message_type}")
                
                # Test User 2 can access the image
                if user2_media_url:
                    user2_filename = user2_media_url.split('/')[-1]
                    user2_response = requests.get(f"{self.base_url}/media/{user2_filename}", timeout=10)
                    
                    if user2_response.status_code == 200:
                        print(f"  ✅ User 2 can access image: {user2_response.headers.get('content-type', 'unknown')}")
                        
                        # Final check - simulate frontend behavior
                        print("  🌐 Simulating frontend image display...")
                        
                        # This is how the frontend constructs the URL
                        frontend_url = f"https://snapchat-clone-24.preview.emergentagent.com{user2_media_url}"
                        frontend_response = requests.get(frontend_url, timeout=10)
                        
                        if frontend_response.status_code == 200:
                            print(f"  ✅ Frontend URL works: {frontend_url}")
                            print(f"     Content-Type: {frontend_response.headers.get('content-type')}")
                            print(f"     Content-Length: {len(frontend_response.content)} bytes")
                            return True
                        else:
                            print(f"  ❌ Frontend URL failed: {frontend_response.status_code}")
                            print(f"     URL: {frontend_url}")
                            return False
                    else:
                        print(f"  ❌ User 2 can't access image: {user2_response.status_code}")
                        return False
                else:
                    print(f"  ❌ User 2 message has no media_url")
                    return False
            else:
                print(f"  ❌ No new files created in uploads directory")
                return False
                
        except Exception as e:
            print(f"  ❌ Exception during upload: {e}")
            return False
    
    def check_existing_issues(self):
        """Check for existing issues in the system"""
        print("🔍 Checking for existing issues...")
        
        # Check uploads directory
        if os.path.exists('/app/uploads/'):
            files = os.listdir('/app/uploads/')
            print(f"  📁 Current files in /app/uploads/: {len(files)}")
            for f in files:
                file_path = f"/app/uploads/{f}"
                size = os.path.getsize(file_path)
                print(f"     - {f} ({size} bytes)")
        else:
            print("  ❌ /app/uploads/ directory doesn't exist!")
            return False
        
        # Test media endpoint with existing files
        print("  🔍 Testing existing files via media endpoint...")
        for filename in files:
            try:
                response = requests.get(f"{self.base_url}/media/{filename}", timeout=5)
                status = "✅" if response.status_code == 200 else "❌"
                content_type = response.headers.get('content-type', 'unknown')
                print(f"     {status} {filename}: {response.status_code} ({content_type})")
            except Exception as e:
                print(f"     ❌ {filename}: Exception - {e}")
        
        return True
    
    def run_full_debug(self):
        """Run complete debugging session"""
        print("🚀 Starting Image Upload Debug Session")
        print("=" * 60)
        
        # Check existing state
        if not self.check_existing_issues():
            return False
        
        # Create test scenario
        if not self.create_test_users(2):
            return False
        
        if not self.establish_friendship():
            return False
        
        # Test image upload
        success = self.upload_image_and_debug()
        
        print("\n" + "=" * 60)
        if success:
            print("✅ DEBUG RESULT: Image upload flow is WORKING correctly!")
            print("   - Images are uploaded successfully")
            print("   - Files are created in /app/uploads/")
            print("   - Media endpoint serves images correctly")
            print("   - Both users can see and access images")
            print("   - Frontend URLs work properly")
        else:
            print("❌ DEBUG RESULT: Image upload flow has ISSUES!")
            print("   Check the detailed output above for specific problems.")
        
        return success

def main():
    debugger = ImageIssueDebugger()
    success = debugger.run_full_debug()
    return 0 if success else 1

if __name__ == "__main__":
    exit(main())