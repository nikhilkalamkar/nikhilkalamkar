import requests
import sys
import json
import time
from datetime import datetime

class SnapCloneAPITester:
    def __init__(self, base_url="https://chatmate-app-4.preview.emergentagent.com/api"):
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
        
        # Story functionality
        self.test_story_functionality()
        
        # Additional features
        self.test_agora_token()
        self.test_block_functionality()
        
        # Admin functionality
        self.test_admin_login()
        self.test_admin_functionality()
        
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
    tester = SnapCloneAPITester()
    
    try:
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