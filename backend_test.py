import requests
import sys
import json
from datetime import datetime

class SnapVibeAPITester:
    def __init__(self, base_url="https://match-finder-98.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            
            if success:
                self.log_test(name, True)
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                error_msg = f"Expected {expected_status}, got {response.status_code}"
                try:
                    error_detail = response.json().get('detail', '')
                    if error_detail:
                        error_msg += f" - {error_detail}"
                except:
                    pass
                self.log_test(name, False, error_msg)
                return False, {}

        except Exception as e:
            self.log_test(name, False, f"Request failed: {str(e)}")
            return False, {}

    def test_user_registration(self):
        """Test user registration"""
        timestamp = datetime.now().strftime('%H%M%S')
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
        
        if success and 'token' in response:
            self.token = response['token']
            self.user_id = response['user']['user_id']
            return True, user_data
        return False, user_data

    def test_user_login(self, user_data):
        """Test user login"""
        login_data = {
            "email": user_data["email"],
            "password": user_data["password"]
        }
        
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        
        if success and 'token' in response:
            self.token = response['token']
            self.user_id = response['user']['user_id']
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

    def test_friend_request_flow(self):
        """Test complete friend request flow"""
        # Create second user for friend request testing
        timestamp = datetime.now().strftime('%H%M%S')
        friend_data = {
            "username": f"friend_{timestamp}",
            "email": f"friend_{timestamp}@example.com",
            "password": "FriendPass123!"
        }
        
        # Register friend
        success, response = self.run_test(
            "Register Friend User",
            "POST",
            "auth/register",
            200,
            data=friend_data
        )
        
        if not success:
            return False
            
        friend_id = response['user']['user_id']
        friend_token = response['token']
        
        # Send friend request
        success, _ = self.run_test(
            "Send Friend Request",
            "POST",
            f"friends/request?recipient_id={friend_id}",
            200
        )
        
        if not success:
            return False
        
        # Switch to friend's token to check requests
        original_token = self.token
        self.token = friend_token
        
        # Get friend requests
        success, response = self.run_test(
            "Get Friend Requests",
            "GET",
            "friends/requests",
            200
        )
        
        if not success or not response:
            self.token = original_token
            return False
            
        # Accept friend request
        if response and len(response) > 0:
            request_id = response[0]['request_id']
            success, _ = self.run_test(
                "Accept Friend Request",
                "POST",
                f"friends/accept/{request_id}",
                200
            )
        else:
            success = False
            
        # Switch back to original token
        self.token = original_token
        
        # Get friends list
        success2, _ = self.run_test(
            "Get Friends List",
            "GET",
            "friends",
            200
        )
        
        return success and success2

    def test_snap_functionality(self):
        """Test snap sending and receiving"""
        # Create a test recipient
        timestamp = datetime.now().strftime('%H%M%S')
        recipient_data = {
            "username": f"recipient_{timestamp}",
            "email": f"recipient_{timestamp}@example.com",
            "password": "RecipientPass123!"
        }
        
        success, response = self.run_test(
            "Register Snap Recipient",
            "POST",
            "auth/register",
            200,
            data=recipient_data
        )
        
        if not success:
            return False
            
        recipient_id = response['user']['user_id']
        
        # Send snap
        snap_data = {
            "recipient_id": recipient_id,
            "image_url": "https://images.unsplash.com/photo-1758275557473-6e6359ced762?w=800",
            "text": "Test snap message"
        }
        
        success, _ = self.run_test(
            "Send Snap",
            "POST",
            "snaps",
            200,
            data=snap_data
        )
        
        if not success:
            return False
            
        # Get snaps (should be empty for sender)
        success, _ = self.run_test(
            "Get Snaps",
            "GET",
            "snaps",
            200
        )
        
        return success

    def test_story_functionality(self):
        """Test story creation and viewing"""
        story_data = {
            "image_url": "https://images.unsplash.com/photo-1758275557784-39516582a05d?w=800",
            "text": "Test story content"
        }
        
        # Create story
        success, response = self.run_test(
            "Create Story",
            "POST",
            "stories",
            200,
            data=story_data
        )
        
        if not success:
            return False
            
        story_id = response.get('story_id')
        
        # Get stories
        success, _ = self.run_test(
            "Get Stories",
            "GET",
            "stories",
            200
        )
        
        if not success:
            return False
            
        # Mark story as viewed
        if story_id:
            success, _ = self.run_test(
                "Mark Story Viewed",
                "PUT",
                f"stories/{story_id}/view",
                200
            )
        
        return success

    def test_messaging_functionality(self):
        """Test messaging between users"""
        # Create a message recipient
        timestamp = datetime.now().strftime('%H%M%S')
        recipient_data = {
            "username": f"msgrecipient_{timestamp}",
            "email": f"msgrecipient_{timestamp}@example.com",
            "password": "MsgPass123!"
        }
        
        success, response = self.run_test(
            "Register Message Recipient",
            "POST",
            "auth/register",
            200,
            data=recipient_data
        )
        
        if not success:
            return False
            
        recipient_id = response['user']['user_id']
        
        # Send message
        message_data = {
            "recipient_id": recipient_id,
            "text": "Hello, this is a test message!"
        }
        
        success, _ = self.run_test(
            "Send Message",
            "POST",
            "messages",
            200,
            data=message_data
        )
        
        if not success:
            return False
            
        # Get messages
        success, _ = self.run_test(
            "Get Messages",
            "GET",
            f"messages/{recipient_id}",
            200
        )
        
        return success

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting SnapVibe API Tests")
        print(f"   Base URL: {self.base_url}")
        print("=" * 50)
        
        # Test user registration and login
        reg_success, user_data = self.test_user_registration()
        if not reg_success:
            print("❌ Registration failed, stopping tests")
            return False
            
        # Test login with same credentials
        if not self.test_user_login(user_data):
            print("❌ Login failed, stopping tests")
            return False
            
        # Test user info retrieval
        if not self.test_get_current_user():
            print("❌ Get current user failed")
            
        # Test user search
        if not self.test_search_users():
            print("❌ User search failed")
            
        # Test friend functionality
        if not self.test_friend_request_flow():
            print("❌ Friend request flow failed")
            
        # Test snap functionality
        if not self.test_snap_functionality():
            print("❌ Snap functionality failed")
            
        # Test story functionality
        if not self.test_story_functionality():
            print("❌ Story functionality failed")
            
        # Test messaging functionality
        if not self.test_messaging_functionality():
            print("❌ Messaging functionality failed")
        
        # Print final results
        print("\n" + "=" * 50)
        print(f"📊 Tests completed: {self.tests_passed}/{self.tests_run} passed")
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"📈 Success rate: {success_rate:.1f}%")
        
        return self.tests_passed == self.tests_run

def main():
    tester = SnapVibeAPITester()
    success = tester.run_all_tests()
    
    # Save detailed results
    with open('/app/backend_test_results.json', 'w') as f:
        json.dump({
            'timestamp': datetime.now().isoformat(),
            'total_tests': tester.tests_run,
            'passed_tests': tester.tests_passed,
            'success_rate': (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0,
            'results': tester.test_results
        }, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())