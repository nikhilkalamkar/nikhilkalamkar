import requests
import sys
import json
import time
from datetime import datetime, timedelta

class SnapCloneAPITester:
    def __init__(self, base_url="https://snapchat-clone-24.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.admin_token = None
        self.test_user_data = {}
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def log_test(self, name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {name}")
        if details:
            print(f"    {details}")
        if success:
            self.tests_passed += 1
        else:
            self.failed_tests.append({"test": name, "details": details})

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)
        
        if files:
            # Remove Content-Type for file uploads
            test_headers.pop('Content-Type', None)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                if files:
                    response = requests.post(url, data=data, files=files, headers=test_headers, timeout=10)
                else:
                    response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if not success:
                try:
                    error_data = response.json()
                    details += f", Error: {error_data.get('detail', 'Unknown error')}"
                except:
                    details += f", Response: {response.text[:100]}"
            
            self.log_test(name, success, details)
            return success, response.json() if success and response.content else {}

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return False, {}

    def test_user_registration(self):
        """Test user registration"""
        timestamp = int(time.time())
        user_data = {
            "username": f"testuser_{timestamp}",
            "email": f"test_{timestamp}@example.com",
            "password": "TestPass123!"
        }
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data=user_data
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_id = response['user']['user_id']
            self.test_user_data = user_data
            return True
        return False

    def test_user_login(self):
        """Test user login"""
        if not self.test_user_data:
            return False
            
        login_data = {
            "email": self.test_user_data["email"],
            "password": self.test_user_data["password"]
        }
        
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            return True
        return False

    def test_get_current_user(self):
        """Test get current user"""
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "users/me",
            200
        )
        return success

    def test_search_users(self):
        """Test user search"""
        success, response = self.run_test(
            "Search Users",
            "GET",
            "users/search?q=test",
            200
        )
        return success

    def test_admin_login(self):
        """Test admin login"""
        admin_data = {
            "email": "admin@snapclone.com",
            "password": "admin123"
        }
        
        # First try to register admin if not exists
        admin_register = {
            "username": "admin",
            "email": "admin@snapclone.com", 
            "password": "admin123"
        }
        
        # Try register first (might fail if exists)
        requests.post(f"{self.base_url}/auth/register", json=admin_register)
        
        success, response = self.run_test(
            "Admin Login",
            "POST", 
            "auth/login",
            200,
            data=admin_data
        )
        
        if success and 'access_token' in response:
            self.admin_token = response['access_token']
            return True
        return False

    def test_friend_request_flow(self):
        """Test complete friend request flow"""
        # Create second user for friend request
        timestamp = int(time.time()) + 1
        user2_data = {
            "username": f"testuser2_{timestamp}",
            "email": f"test2_{timestamp}@example.com", 
            "password": "TestPass123!"
        }
        
        success, response = self.run_test(
            "Create Second User",
            "POST",
            "auth/register", 
            200,
            data=user2_data
        )
        
        if not success:
            return False
            
        user2_token = response['access_token']
        user2_id = response['user']['user_id']
        
        # Send friend request
        success, _ = self.run_test(
            "Send Friend Request",
            "POST",
            f"friends/request?receiver_id={user2_id}",
            200
        )
        
        if not success:
            return False
        
        # Switch to user2 token to check requests
        original_token = self.token
        self.token = user2_token
        
        success, response = self.run_test(
            "Get Friend Requests",
            "GET",
            "friends/requests",
            200
        )
        
        if success and len(response) > 0:
            request_id = response[0]['request_id']
            
            # Accept friend request
            success, response = self.run_test(
                "Accept Friend Request",
                "POST",
                f"friends/accept/{request_id}",
                200
            )
            
            if success:
                # Check if chat was created
                success, response = self.run_test(
                    "Get Chats After Friend Accept",
                    "GET",
                    "chats",
                    200
                )
        
        # Restore original token
        self.token = original_token
        return success

    def test_chat_functionality(self):
        """Test chat and messaging"""
        # Get chats
        success, response = self.run_test(
            "Get User Chats",
            "GET", 
            "chats",
            200
        )
        
        if not success or len(response) == 0:
            return False
            
        chat_id = response[0]['chat_id']
        
        # Send text message using form data
        import requests
        url = f"{self.base_url}/chats/{chat_id}/messages"
        headers = {'Authorization': f'Bearer {self.token}'}
        data = {
            "content": "Hello, this is a test message!",
            "message_type": "text"
        }
        
        try:
            response = requests.post(url, data=data, headers=headers, timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if not success:
                try:
                    error_data = response.json()
                    details += f", Error: {error_data.get('detail', 'Unknown error')}"
                except:
                    details += f", Response: {response.text[:100]}"
            self.log_test("Send Text Message", success, details)
        except Exception as e:
            self.log_test("Send Text Message", False, f"Exception: {str(e)}")
            success = False
        
        if success:
            # Get messages
            success, response = self.run_test(
                "Get Chat Messages", 
                "GET",
                f"chats/{chat_id}/messages",
                200
            )
        
        return success

    def test_story_functionality(self):
        """Test story creation"""
        # Create a dummy image file for testing
        import requests
        import io
        
        url = f"{self.base_url}/stories"
        headers = {'Authorization': f'Bearer {self.token}'}
        
        # Create a simple test image
        dummy_image = io.BytesIO(b"fake image content for testing")
        files = {'media': ('test.jpg', dummy_image, 'image/jpeg')}
        
        try:
            response = requests.post(url, files=files, headers=headers, timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if not success:
                try:
                    error_data = response.json()
                    details += f", Error: {error_data.get('detail', 'Unknown error')}"
                except:
                    details += f", Response: {response.text[:100]}"
            self.log_test("Create Story", success, details)
            
            if success:
                response_data = response.json()
            else:
                response_data = {}
        except Exception as e:
            self.log_test("Create Story", False, f"Exception: {str(e)}")
            success = False
            response_data = {}
        
        if success:
            # Get stories
            success, response = self.run_test(
                "Get Stories",
                "GET", 
                "stories",
                200
            )
            
            if success and len(response) > 0:
                story_id = response[0]['story_id']
                
                # Test story promotion
                success, response = self.run_test(
                    "Create Story Promotion",
                    "POST",
                    f"stories/{story_id}/promote",
                    200
                )
        
        return success

    def test_agora_token(self):
        """Test Agora token generation"""
        success, response = self.run_test(
            "Get Agora Token",
            "GET",
            "token/agora?channel=test_channel",
            200
        )
        return success

    def test_block_functionality(self):
        """Test block/unblock users"""
        # Need another user ID for blocking
        success, response = self.run_test(
            "Search Users for Blocking",
            "GET",
            "users/search?q=test",
            200
        )
        
        if success and len(response) > 0:
            user_to_block = response[0]['user_id']
            
            # Block user
            success, _ = self.run_test(
                "Block User",
                "POST",
                f"block/{user_to_block}",
                200
            )
            
            if success:
                # Unblock user
                success, _ = self.run_test(
                    "Unblock User", 
                    "DELETE",
                    f"block/{user_to_block}",
                    200
                )
        
        return success

    def test_admin_functionality(self):
        """Test admin panel functionality"""
        if not self.admin_token:
            return False
            
        original_token = self.token
        self.token = self.admin_token
        
        # Get all users
        success, response = self.run_test(
            "Admin Get All Users",
            "GET",
            "admin/users", 
            200
        )
        
        self.token = original_token
        return success

    def test_disappearing_messages_timer_api(self):
        """Test disappearing messages timer API endpoint"""
        # First get a chat to test with
        success, response = self.run_test(
            "Get Chats for Timer Test",
            "GET", 
            "chats",
            200
        )
        
        if not success or len(response) == 0:
            self.log_test("Disappearing Timer Test", False, "No chats available for testing")
            return False
            
        chat_id = response[0]['chat_id']
        
        # Test valid timer values
        valid_timers = [5, 60, 3600, 86400, 0]
        timer_success = True
        
        for timer_value in valid_timers:
            url = f"{self.base_url}/chats/{chat_id}/timer?timer_seconds={timer_value}"
            headers = {'Authorization': f'Bearer {self.token}'}
            
            try:
                response = requests.put(url, headers=headers, timeout=10)
                success = response.status_code == 200
                
                if success:
                    response_data = response.json()
                    if response_data.get('timer_seconds') != timer_value:
                        success = False
                        
                details = f"Timer {timer_value}s - Status: {response.status_code}"
                if not success:
                    try:
                        error_data = response.json()
                        details += f", Error: {error_data.get('detail', 'Unknown error')}"
                    except:
                        details += f", Response: {response.text[:100]}"
                        
                self.log_test(f"Set Timer to {timer_value} seconds", success, details)
                if not success:
                    timer_success = False
                    
            except Exception as e:
                self.log_test(f"Set Timer to {timer_value} seconds", False, f"Exception: {str(e)}")
                timer_success = False
        
        # Test invalid timer values
        invalid_timers = [10, 30, 7200, -1, 999999]
        for timer_value in invalid_timers:
            url = f"{self.base_url}/chats/{chat_id}/timer?timer_seconds={timer_value}"
            headers = {'Authorization': f'Bearer {self.token}'}
            
            try:
                response = requests.put(url, headers=headers, timeout=10)
                success = response.status_code == 400  # Should fail with 400
                
                details = f"Invalid timer {timer_value}s - Status: {response.status_code}"
                self.log_test(f"Reject Invalid Timer {timer_value}s", success, details)
                if not success:
                    timer_success = False
                    
            except Exception as e:
                self.log_test(f"Reject Invalid Timer {timer_value}s", False, f"Exception: {str(e)}")
                timer_success = False
        
        return timer_success

    def test_message_expiry_calculation(self):
        """Test that messages get correct expires_at based on chat timer"""
        # Get a chat to test with
        success, response = self.run_test(
            "Get Chats for Expiry Test",
            "GET", 
            "chats",
            200
        )
        
        if not success or len(response) == 0:
            self.log_test("Message Expiry Test", False, "No chats available for testing")
            return False
            
        chat_id = response[0]['chat_id']
        
        # Set timer to 5 seconds
        url = f"{self.base_url}/chats/{chat_id}/timer?timer_seconds=5"
        headers = {'Authorization': f'Bearer {self.token}'}
        
        try:
            response = requests.put(url, headers=headers, timeout=10)
            if response.status_code != 200:
                self.log_test("Message Expiry Test", False, "Failed to set timer")
                return False
        except Exception as e:
            self.log_test("Message Expiry Test", False, f"Timer setup failed: {str(e)}")
            return False
        
        # Send a message and check its expires_at
        message_url = f"{self.base_url}/chats/{chat_id}/messages"
        message_headers = {'Authorization': f'Bearer {self.token}'}
        message_data = {
            "content": "Test message for expiry calculation",
            "message_type": "text"
        }
        
        try:
            before_send = datetime.now()
            response = requests.post(message_url, data=message_data, headers=message_headers, timeout=10)
            after_send = datetime.now()
            
            if response.status_code != 200:
                self.log_test("Message Expiry Calculation", False, f"Failed to send message: {response.status_code}")
                return False
                
            message_data = response.json()
            expires_at_str = message_data.get('expires_at')
            
            if not expires_at_str:
                self.log_test("Message Expiry Calculation", False, "No expires_at field in message")
                return False
            
            # Parse expires_at and check if it's approximately 5 seconds from now
            from datetime import timezone
            expires_at = datetime.fromisoformat(expires_at_str.replace('Z', '+00:00'))
            expected_expiry = before_send.replace(tzinfo=timezone.utc) + timedelta(seconds=5)
            
            # Allow 2 second tolerance
            time_diff = abs((expires_at - expected_expiry).total_seconds())
            success = time_diff <= 2
            
            details = f"Expected ~5s expiry, got {time_diff:.1f}s difference"
            self.log_test("Message Expiry Calculation", success, details)
            return success
            
        except Exception as e:
            self.log_test("Message Expiry Calculation", False, f"Exception: {str(e)}")
            return False

    def test_message_auto_deletion(self):
        """Test automatic message deletion via MongoDB TTL"""
        # Get a chat to test with
        success, response = self.run_test(
            "Get Chats for Auto-Delete Test",
            "GET", 
            "chats",
            200
        )
        
        if not success or len(response) == 0:
            self.log_test("Message Auto-Deletion Test", False, "No chats available for testing")
            return False
            
        chat_id = response[0]['chat_id']
        
        # Set timer to 5 seconds for quick testing
        url = f"{self.base_url}/chats/{chat_id}/timer?timer_seconds=5"
        headers = {'Authorization': f'Bearer {self.token}'}
        
        try:
            response = requests.put(url, headers=headers, timeout=10)
            if response.status_code != 200:
                self.log_test("Message Auto-Deletion Test", False, "Failed to set timer")
                return False
        except Exception as e:
            self.log_test("Message Auto-Deletion Test", False, f"Timer setup failed: {str(e)}")
            return False
        
        # Send a test message
        message_url = f"{self.base_url}/chats/{chat_id}/messages"
        message_headers = {'Authorization': f'Bearer {self.token}'}
        message_data = {
            "content": "Test message for auto-deletion",
            "message_type": "text"
        }
        
        try:
            response = requests.post(message_url, data=message_data, headers=message_headers, timeout=10)
            if response.status_code != 200:
                self.log_test("Message Auto-Deletion Test", False, f"Failed to send message: {response.status_code}")
                return False
                
            sent_message = response.json()
            message_id = sent_message.get('message_id')
            
            # Immediately check that message exists
            get_url = f"{self.base_url}/chats/{chat_id}/messages"
            response = requests.get(get_url, headers=message_headers, timeout=10)
            
            if response.status_code != 200:
                self.log_test("Message Auto-Deletion Test", False, "Failed to get messages")
                return False
                
            messages = response.json()
            message_found = any(msg.get('message_id') == message_id for msg in messages)
            
            if not message_found:
                self.log_test("Message Auto-Deletion Test", False, "Message not found immediately after sending")
                return False
            
            self.log_test("Message Visible After Send", True, "Message found in chat")
            
            # Wait for message to expire (5 seconds + buffer for MongoDB TTL)
            print("    Waiting 10 seconds for message auto-deletion...")
            time.sleep(10)
            
            # Check if message is deleted
            response = requests.get(get_url, headers=message_headers, timeout=10)
            if response.status_code != 200:
                self.log_test("Message Auto-Deletion Test", False, "Failed to get messages after wait")
                return False
                
            messages_after = response.json()
            message_still_exists = any(msg.get('message_id') == message_id for msg in messages_after)
            
            success = not message_still_exists
            details = "Message deleted by TTL" if success else "Message still exists after expiry"
            self.log_test("Message Auto-Deletion", success, details)
            return success
            
        except Exception as e:
            self.log_test("Message Auto-Deletion Test", False, f"Exception: {str(e)}")
            return False

    def test_disappearing_messages_end_to_end(self):
        """Test complete disappearing messages flow"""
        print("\n🔄 Testing Disappearing Messages End-to-End Flow...")
        
        # Test timer API
        timer_success = self.test_disappearing_messages_timer_api()
        
        # Test message expiry calculation
        expiry_success = self.test_message_expiry_calculation()
        
        # Test auto-deletion (this takes time)
        deletion_success = self.test_message_auto_deletion()
        
        overall_success = timer_success and expiry_success and deletion_success
        
        details = f"Timer API: {'✅' if timer_success else '❌'}, " + \
                 f"Expiry Calc: {'✅' if expiry_success else '❌'}, " + \
                 f"Auto-Delete: {'✅' if deletion_success else '❌'}"
        
        self.log_test("Disappearing Messages E2E Flow", overall_success, details)
        return overall_success

    def create_real_test_image(self, filename="test_real_image.png"):
        """Create a real PNG image file for testing"""
        import io
        
        # Create a simple 1x1 PNG image (minimal valid PNG)
        png_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\tpHYs\x00\x00\x0b\x13\x00\x00\x0b\x13\x01\x00\x9a\x9c\x18\x00\x00\x00\nIDATx\x9cc```\x00\x00\x00\x04\x00\x01\xdd\x8d\xb4\x1c\x00\x00\x00\x00IEND\xaeB`\x82'
        return io.BytesIO(png_data)

    def test_image_upload_end_to_end(self):
        """Test complete image upload and display flow"""
        print("\n📸 Testing Image Upload End-to-End Flow...")
        
        # Step 1: Create two users and make them friends
        timestamp = int(time.time())
        user1_data = {
            "username": f"imageuser1_{timestamp}",
            "email": f"imageuser1_{timestamp}@example.com",
            "password": "TestPass123!"
        }
        
        user2_data = {
            "username": f"imageuser2_{timestamp}",
            "email": f"imageuser2_{timestamp}@example.com", 
            "password": "TestPass123!"
        }
        
        # Register User 1
        success, response = self.run_test(
            "Register Image Test User 1",
            "POST",
            "auth/register",
            200,
            data=user1_data
        )
        
        if not success:
            self.log_test("Image Upload E2E", False, "Failed to register user 1")
            return False
            
        user1_token = response['access_token']
        user1_id = response['user']['user_id']
        
        # Register User 2
        success, response = self.run_test(
            "Register Image Test User 2",
            "POST",
            "auth/register",
            200,
            data=user2_data
        )
        
        if not success:
            self.log_test("Image Upload E2E", False, "Failed to register user 2")
            return False
            
        user2_token = response['access_token']
        user2_id = response['user']['user_id']
        
        # User 1 sends friend request to User 2
        original_token = self.token
        self.token = user1_token
        
        success, _ = self.run_test(
            "Send Friend Request for Image Test",
            "POST",
            f"friends/request?receiver_id={user2_id}",
            200
        )
        
        if not success:
            self.log_test("Image Upload E2E", False, "Failed to send friend request")
            return False
        
        # User 2 accepts friend request
        self.token = user2_token
        
        success, response = self.run_test(
            "Get Friend Requests for Image Test",
            "GET",
            "friends/requests",
            200
        )
        
        if not success or len(response) == 0:
            self.log_test("Image Upload E2E", False, "No friend requests found")
            return False
            
        request_id = response[0]['request_id']
        
        success, response = self.run_test(
            "Accept Friend Request for Image Test",
            "POST",
            f"friends/accept/{request_id}",
            200
        )
        
        if not success:
            self.log_test("Image Upload E2E", False, "Failed to accept friend request")
            return False
            
        chat_id = response.get('chat_id')
        if not chat_id:
            self.log_test("Image Upload E2E", False, "No chat_id returned from friend accept")
            return False
        
        # Step 2: User 1 uploads a real image
        self.token = user1_token
        
        # Check uploads directory before upload
        import os
        files_before = os.listdir('/app/uploads/') if os.path.exists('/app/uploads/') else []
        print(f"    Files in /app/uploads/ before upload: {files_before}")
        
        # Create and upload real image
        image_file = self.create_real_test_image()
        url = f"{self.base_url}/chats/{chat_id}/messages"
        headers = {'Authorization': f'Bearer {user1_token}'}
        
        files = {'media': ('test_image.png', image_file, 'image/png')}
        data = {
            'content': 'Here is a test image!',
            'message_type': 'image'
        }
        
        try:
            response = requests.post(url, data=data, files=files, headers=headers, timeout=15)
            upload_success = response.status_code == 200
            
            if upload_success:
                message_data = response.json()
                media_url = message_data.get('media_url')
                message_id = message_data.get('message_id')
                message_type = message_data.get('message_type')
                
                details = f"Status: {response.status_code}, media_url: {media_url}, type: {message_type}"
                self.log_test("Upload Real Image", True, details)
                
                # Step 3: Verify file was created in /app/uploads/
                files_after = os.listdir('/app/uploads/') if os.path.exists('/app/uploads/') else []
                new_files = [f for f in files_after if f not in files_before]
                
                if new_files:
                    uploaded_filename = new_files[0]
                    file_path = f"/app/uploads/{uploaded_filename}"
                    file_exists = os.path.exists(file_path)
                    file_size = os.path.getsize(file_path) if file_exists else 0
                    
                    self.log_test("Image File Created", file_exists, f"File: {uploaded_filename}, Size: {file_size} bytes")
                    
                    # Step 4: Test media endpoint directly
                    if media_url:
                        media_filename = media_url.split('/')[-1]
                        media_response = requests.get(f"{self.base_url}/media/{media_filename}", timeout=10)
                        media_success = media_response.status_code == 200
                        content_type = media_response.headers.get('content-type', 'unknown')
                        
                        self.log_test("Media Endpoint Serves Image", media_success, 
                                    f"Status: {media_response.status_code}, Content-Type: {content_type}")
                        
                        # Step 5: User 2 retrieves messages to see if image is visible
                        self.token = user2_token
                        
                        success, messages_response = self.run_test(
                            "User 2 Get Messages with Image",
                            "GET",
                            f"chats/{chat_id}/messages",
                            200
                        )
                        
                        if success:
                            # Find the image message
                            image_message = None
                            for msg in messages_response:
                                if msg.get('message_id') == message_id:
                                    image_message = msg
                                    break
                            
                            if image_message:
                                has_media_url = bool(image_message.get('media_url'))
                                correct_type = image_message.get('message_type') == 'image'
                                
                                self.log_test("User 2 Sees Image Message", has_media_url and correct_type,
                                            f"media_url present: {has_media_url}, type: {image_message.get('message_type')}")
                                
                                # Step 6: User 2 tries to access the image directly
                                if has_media_url:
                                    user2_media_url = image_message['media_url']
                                    if user2_media_url.startswith('/api/media/'):
                                        filename = user2_media_url.split('/')[-1]
                                        user2_media_response = requests.get(f"{self.base_url}/media/{filename}", timeout=10)
                                        user2_media_success = user2_media_response.status_code == 200
                                        
                                        self.log_test("User 2 Can Access Image", user2_media_success,
                                                    f"Status: {user2_media_response.status_code}")
                                        
                                        # Overall success
                                        overall_success = (upload_success and file_exists and 
                                                         media_success and has_media_url and 
                                                         correct_type and user2_media_success)
                                        
                                        self.log_test("Image Upload E2E Flow", overall_success,
                                                    f"All steps completed successfully: {overall_success}")
                                        
                                        # Restore original token
                                        self.token = original_token
                                        return overall_success
                else:
                    self.log_test("Image File Created", False, "No new files found in /app/uploads/")
            else:
                try:
                    error_data = response.json()
                    details = f"Status: {response.status_code}, Error: {error_data.get('detail', 'Unknown error')}"
                except:
                    details = f"Status: {response.status_code}, Response: {response.text[:100]}"
                self.log_test("Upload Real Image", False, details)
                
        except Exception as e:
            self.log_test("Upload Real Image", False, f"Exception: {str(e)}")
        
        # Restore original token
        self.token = original_token
        self.log_test("Image Upload E2E Flow", False, "Failed during image upload process")
        return False

    def test_media_endpoint_directly(self):
        """Test media endpoint with existing files"""
        print("\n🖼️ Testing Media Endpoint with Existing Files...")
        
        import os
        if not os.path.exists('/app/uploads/'):
            self.log_test("Media Endpoint Test", False, "/app/uploads/ directory does not exist")
            return False
        
        files = os.listdir('/app/uploads/')
        if not files:
            self.log_test("Media Endpoint Test", False, "No files in /app/uploads/ directory")
            return False
        
        success_count = 0
        for filename in files:
            try:
                response = requests.get(f"{self.base_url}/media/{filename}", timeout=10)
                success = response.status_code == 200
                content_type = response.headers.get('content-type', 'unknown')
                
                details = f"Status: {response.status_code}, Content-Type: {content_type}"
                self.log_test(f"Serve Media File: {filename}", success, details)
                
                if success:
                    success_count += 1
                    
            except Exception as e:
                self.log_test(f"Serve Media File: {filename}", False, f"Exception: {str(e)}")
        
        overall_success = success_count == len(files)
        self.log_test("All Media Files Accessible", overall_success, f"{success_count}/{len(files)} files served successfully")
        return overall_success

    def check_database_media_messages(self):
        """Check database for existing media messages"""
        print("\n🗄️ Checking Database for Media Messages...")
        
        # This would require direct database access, which we don't have in the API
        # Instead, let's check through the API by getting all chats and messages
        
        if not self.token:
            self.log_test("Database Media Check", False, "No authentication token available")
            return False
        
        try:
            # Get all chats
            success, chats_response = self.run_test(
                "Get All Chats for Media Check",
                "GET",
                "chats",
                200
            )
            
            if not success:
                return False
            
            media_messages_found = 0
            total_messages = 0
            
            for chat in chats_response:
                chat_id = chat['chat_id']
                
                # Get messages for this chat
                success, messages_response = self.run_test(
                    f"Get Messages for Chat {chat_id[:8]}...",
                    "GET", 
                    f"chats/{chat_id}/messages",
                    200
                )
                
                if success:
                    for message in messages_response:
                        total_messages += 1
                        if message.get('media_url') and message.get('message_type') in ['image', 'video', 'media']:
                            media_messages_found += 1
                            
                            # Check if the media file actually exists
                            media_url = message.get('media_url')
                            if media_url and media_url.startswith('/api/media/'):
                                filename = media_url.split('/')[-1]
                                file_path = f"/app/uploads/{filename}"
                                file_exists = os.path.exists(file_path)
                                
                                status = "EXISTS" if file_exists else "MISSING"
                                print(f"    Media message: {message.get('message_id', 'unknown')[:8]}... -> {filename} [{status}]")
            
            self.log_test("Database Media Messages Check", True, 
                        f"Found {media_messages_found} media messages out of {total_messages} total messages")
            return True
            
        except Exception as e:
            self.log_test("Database Media Check", False, f"Exception: {str(e)}")
            return False

    def run_all_tests(self):
        """Run comprehensive test suite"""
        print("🚀 Starting SnapClone API Tests...")
        print("=" * 50)
        
        # Core authentication tests
        if not self.test_user_registration():
            print("❌ Registration failed - stopping tests")
            return False
            
        if not self.test_user_login():
            print("❌ Login failed - stopping tests") 
            return False
            
        self.test_get_current_user()
        self.test_search_users()
        
        # Friend and chat functionality
        self.test_friend_request_flow()
        self.test_chat_functionality()
        
        # CRITICAL: Message Deletion Testing (Current Focus)
        print("\n" + "="*50)
        print("🚨 CRITICAL MESSAGE DELETION TESTING")
        print("="*50)
        
        # Test message deletion functionality
        self.test_message_deletion_comprehensive()
        
        # CRITICAL: Image Upload Testing (User's Main Concern)
        print("\n" + "="*50)
        print("🚨 CRITICAL IMAGE UPLOAD TESTING")
        print("="*50)
        
        # Check existing media files and database state
        self.check_database_media_messages()
        self.test_media_endpoint_directly()
        
        # Test complete image upload flow
        self.test_image_upload_end_to_end()
        
        # Disappearing Messages Feature Testing
        self.test_disappearing_messages_end_to_end()
        
        # Story functionality
        self.test_story_functionality()
        
        # Additional features
        self.test_agora_token()
        self.test_block_functionality()
        
        # Admin functionality
        self.test_admin_login()
        self.test_admin_functionality()
        
        return True

    def test_message_deletion_delete_for_me(self):
        """Test delete for me functionality"""
        print("\n🗑️ Testing Message Deletion - Delete for Me...")
        
        # Get a chat to test with
        success, response = self.run_test(
            "Get Chats for Delete Test",
            "GET", 
            "chats",
            200
        )
        
        if not success or len(response) == 0:
            self.log_test("Delete for Me Test", False, "No chats available for testing")
            return False
            
        chat_id = response[0]['chat_id']
        
        # Send a test message first
        message_url = f"{self.base_url}/chats/{chat_id}/messages"
        message_headers = {'Authorization': f'Bearer {self.token}'}
        message_data = {
            "content": "Test message for delete-for-me",
            "message_type": "text"
        }
        
        try:
            response = requests.post(message_url, data=message_data, headers=message_headers, timeout=10)
            if response.status_code != 200:
                self.log_test("Delete for Me Test", False, f"Failed to send test message: {response.status_code}")
                return False
                
            sent_message = response.json()
            message_id = sent_message.get('message_id')
            
            if not message_id:
                self.log_test("Delete for Me Test", False, "No message_id in response")
                return False
            
            # Verify message exists before deletion
            get_url = f"{self.base_url}/chats/{chat_id}/messages"
            response = requests.get(get_url, headers=message_headers, timeout=10)
            
            if response.status_code != 200:
                self.log_test("Delete for Me Test", False, "Failed to get messages before deletion")
                return False
                
            messages_before = response.json()
            message_found_before = any(msg.get('message_id') == message_id for msg in messages_before)
            
            if not message_found_before:
                self.log_test("Delete for Me Test", False, "Test message not found before deletion")
                return False
            
            self.log_test("Message Exists Before Deletion", True, f"Message {message_id[:8]}... found")
            
            # Now delete the message for current user
            delete_url = f"{self.base_url}/messages/{message_id}/delete-for-me"
            delete_response = requests.delete(delete_url, headers=message_headers, timeout=10)
            
            delete_success = delete_response.status_code == 200
            delete_details = f"Status: {delete_response.status_code}"
            
            if not delete_success:
                try:
                    error_data = delete_response.json()
                    delete_details += f", Error: {error_data.get('detail', 'Unknown error')}"
                except:
                    delete_details += f", Response: {delete_response.text[:100]}"
            
            self.log_test("Delete Message for Me API", delete_success, delete_details)
            
            if delete_success:
                # Verify message is no longer visible to current user
                response = requests.get(get_url, headers=message_headers, timeout=10)
                
                if response.status_code == 200:
                    messages_after = response.json()
                    message_found_after = any(msg.get('message_id') == message_id for msg in messages_after)
                    
                    success = not message_found_after
                    details = "Message hidden from current user" if success else "Message still visible to current user"
                    self.log_test("Message Hidden After Delete for Me", success, details)
                    return success
                else:
                    self.log_test("Delete for Me Test", False, "Failed to get messages after deletion")
                    return False
            
            return delete_success
            
        except Exception as e:
            self.log_test("Delete for Me Test", False, f"Exception: {str(e)}")
            return False

    def test_message_deletion_delete_for_everyone(self):
        """Test delete for everyone functionality"""
        print("\n🗑️ Testing Message Deletion - Delete for Everyone...")
        
        # Create two users and establish friendship for proper testing
        timestamp = int(time.time())
        user1_data = {
            "username": f"deleteuser1_{timestamp}",
            "email": f"deleteuser1_{timestamp}@example.com",
            "password": "TestPass123!"
        }
        
        user2_data = {
            "username": f"deleteuser2_{timestamp}",
            "email": f"deleteuser2_{timestamp}@example.com", 
            "password": "TestPass123!"
        }
        
        # Register User 1 (sender)
        success, response = self.run_test(
            "Register Delete Test User 1",
            "POST",
            "auth/register",
            200,
            data=user1_data
        )
        
        if not success:
            self.log_test("Delete for Everyone Test", False, "Failed to register user 1")
            return False
            
        user1_token = response['access_token']
        user1_id = response['user']['user_id']
        
        # Register User 2 (receiver)
        success, response = self.run_test(
            "Register Delete Test User 2",
            "POST",
            "auth/register",
            200,
            data=user2_data
        )
        
        if not success:
            self.log_test("Delete for Everyone Test", False, "Failed to register user 2")
            return False
            
        user2_token = response['access_token']
        user2_id = response['user']['user_id']
        
        # Establish friendship
        original_token = self.token
        self.token = user1_token
        
        # User 1 sends friend request
        success, _ = self.run_test(
            "Send Friend Request for Delete Test",
            "POST",
            f"friends/request?receiver_id={user2_id}",
            200
        )
        
        if not success:
            self.log_test("Delete for Everyone Test", False, "Failed to send friend request")
            return False
        
        # User 2 accepts friend request
        self.token = user2_token
        
        success, response = self.run_test(
            "Get Friend Requests for Delete Test",
            "GET",
            "friends/requests",
            200
        )
        
        if not success or len(response) == 0:
            self.log_test("Delete for Everyone Test", False, "No friend requests found")
            return False
            
        request_id = response[0]['request_id']
        
        success, response = self.run_test(
            "Accept Friend Request for Delete Test",
            "POST",
            f"friends/accept/{request_id}",
            200
        )
        
        if not success:
            self.log_test("Delete for Everyone Test", False, "Failed to accept friend request")
            return False
            
        chat_id = response.get('chat_id')
        if not chat_id:
            self.log_test("Delete for Everyone Test", False, "No chat_id returned")
            return False
        
        # User 1 sends a message
        self.token = user1_token
        
        message_url = f"{self.base_url}/chats/{chat_id}/messages"
        message_headers = {'Authorization': f'Bearer {user1_token}'}
        message_data = {
            "content": "Test message for delete-for-everyone",
            "message_type": "text"
        }
        
        try:
            response = requests.post(message_url, data=message_data, headers=message_headers, timeout=10)
            if response.status_code != 200:
                self.log_test("Delete for Everyone Test", False, f"Failed to send test message: {response.status_code}")
                return False
                
            sent_message = response.json()
            message_id = sent_message.get('message_id')
            
            if not message_id:
                self.log_test("Delete for Everyone Test", False, "No message_id in response")
                return False
            
            # Test 1: User 1 (sender) deletes for everyone - should succeed
            delete_url = f"{self.base_url}/messages/{message_id}/delete-for-everyone"
            delete_response = requests.delete(delete_url, headers=message_headers, timeout=10)
            
            delete_success = delete_response.status_code == 200
            delete_details = f"Status: {delete_response.status_code}"
            
            if not delete_success:
                try:
                    error_data = delete_response.json()
                    delete_details += f", Error: {error_data.get('detail', 'Unknown error')}"
                except:
                    delete_details += f", Response: {delete_response.text[:100]}"
            
            self.log_test("Sender Delete for Everyone API", delete_success, delete_details)
            
            if delete_success:
                # Verify message shows "This message was deleted" for both users
                
                # Check for User 1 (sender)
                get_url = f"{self.base_url}/chats/{chat_id}/messages"
                response = requests.get(get_url, headers={'Authorization': f'Bearer {user1_token}'}, timeout=10)
                
                if response.status_code == 200:
                    messages_user1 = response.json()
                    deleted_message_user1 = None
                    for msg in messages_user1:
                        if msg.get('message_id') == message_id:
                            deleted_message_user1 = msg
                            break
                    
                    if deleted_message_user1:
                        content_changed = deleted_message_user1.get('content') == "This message was deleted"
                        deleted_flag = deleted_message_user1.get('deleted_for_everyone', False)
                        
                        self.log_test("User 1 Sees Deleted Message", content_changed and deleted_flag,
                                    f"Content: '{deleted_message_user1.get('content')}', Flag: {deleted_flag}")
                    else:
                        self.log_test("User 1 Sees Deleted Message", False, "Message not found")
                
                # Check for User 2 (receiver)
                response = requests.get(get_url, headers={'Authorization': f'Bearer {user2_token}'}, timeout=10)
                
                if response.status_code == 200:
                    messages_user2 = response.json()
                    deleted_message_user2 = None
                    for msg in messages_user2:
                        if msg.get('message_id') == message_id:
                            deleted_message_user2 = msg
                            break
                    
                    if deleted_message_user2:
                        content_changed = deleted_message_user2.get('content') == "This message was deleted"
                        deleted_flag = deleted_message_user2.get('deleted_for_everyone', False)
                        
                        self.log_test("User 2 Sees Deleted Message", content_changed and deleted_flag,
                                    f"Content: '{deleted_message_user2.get('content')}', Flag: {deleted_flag}")
                    else:
                        self.log_test("User 2 Sees Deleted Message", False, "Message not found")
            
            # Test 2: Send another message and test authorization (User 2 tries to delete User 1's message)
            message_data2 = {
                "content": "Another test message for authorization test",
                "message_type": "text"
            }
            
            response = requests.post(message_url, data=message_data2, headers=message_headers, timeout=10)
            if response.status_code == 200:
                sent_message2 = response.json()
                message_id2 = sent_message2.get('message_id')
                
                if message_id2:
                    # User 2 tries to delete User 1's message for everyone (should fail)
                    delete_url2 = f"{self.base_url}/messages/{message_id2}/delete-for-everyone"
                    user2_headers = {'Authorization': f'Bearer {user2_token}'}
                    delete_response2 = requests.delete(delete_url2, headers=user2_headers, timeout=10)
                    
                    auth_test_success = delete_response2.status_code == 403
                    auth_details = f"Status: {delete_response2.status_code} (expected 403)"
                    
                    self.log_test("Authorization Check - Non-sender Cannot Delete", auth_test_success, auth_details)
            
            # Restore original token
            self.token = original_token
            return delete_success
            
        except Exception as e:
            self.log_test("Delete for Everyone Test", False, f"Exception: {str(e)}")
            self.token = original_token
            return False

    def test_message_deletion_comprehensive(self):
        """Test comprehensive message deletion scenarios"""
        print("\n🗑️ Testing Message Deletion - Comprehensive Scenarios...")
        
        # Test both deletion types
        delete_for_me_success = self.test_message_deletion_delete_for_me()
        delete_for_everyone_success = self.test_message_deletion_delete_for_everyone()
        
        overall_success = delete_for_me_success and delete_for_everyone_success
        
        details = f"Delete for Me: {'✅' if delete_for_me_success else '❌'}, " + \
                 f"Delete for Everyone: {'✅' if delete_for_everyone_success else '❌'}"
        
        self.log_test("Message Deletion Comprehensive Test", overall_success, details)
        return overall_success

    def run_image_tests_only(self):
        """Run only image-related tests for focused debugging"""
        print("📸 Starting Image Upload Focused Tests...")
        print("=" * 50)
        
        # Quick auth setup
        if not self.test_user_registration():
            print("❌ Registration failed - stopping tests")
            return False
            
        # Check existing state
        self.check_database_media_messages()
        self.test_media_endpoint_directly()
        
        # Main image upload test
        self.test_image_upload_end_to_end()
        
        return True

    def run_message_deletion_tests_only(self):
        """Run only message deletion tests for focused testing"""
        print("🗑️ Starting Message Deletion Focused Tests...")
        print("=" * 50)
        
        # Quick auth setup
        if not self.test_user_registration():
            print("❌ Registration failed - stopping tests")
            return False
            
        # Ensure we have a chat for testing
        if not self.test_friend_request_flow():
            print("❌ Friend request flow failed - needed for deletion tests")
            return False
        
        # Main message deletion tests
        self.test_message_deletion_comprehensive()
        
        return True

    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 50)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} passed")
        
        if self.failed_tests:
            print("\n❌ Failed Tests:")
            for test in self.failed_tests:
                print(f"  - {test['test']}: {test['details']}")
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"\n✨ Success Rate: {success_rate:.1f}%")
        
        return self.tests_passed == self.tests_run

def main():
    import sys
    tester = SnapCloneAPITester()
    
    try:
        # Check command line arguments for specific test types
        if len(sys.argv) > 1:
            if sys.argv[1] == "--image-only":
                tester.run_image_tests_only()
            elif sys.argv[1] == "--deletion-only":
                tester.run_message_deletion_tests_only()
            else:
                print("Usage: python backend_test.py [--image-only|--deletion-only]")
                return 1
        else:
            tester.run_all_tests()
            
        success = tester.print_summary()
        return 0 if success else 1
    except KeyboardInterrupt:
        print("\n⚠️ Tests interrupted by user")
        return 1
    except Exception as e:
        print(f"\n💥 Unexpected error: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())