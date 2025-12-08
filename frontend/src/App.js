import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Toaster } from '@/components/ui/sonner';
import AuthPage from '@/pages/AuthPage';
import HomePage from '@/pages/HomePage';
import ChatPage from '@/pages/ChatPage';
import StoryViewPage from '@/pages/StoryViewPage';
import StoryViewerPage from '@/pages/StoryViewerPage';
import ProfilePage from '@/pages/ProfilePage';
import UserProfilePage from '@/pages/UserProfilePage';
import AdminPage from '@/pages/AdminPage';
import BlockedUsersPage from '@/pages/BlockedUsersPage';
import MyStoriesPage from '@/pages/MyStoriesPage';
import PrivacyPolicyPage from '@/pages/PrivacyPolicyPage';
import TermsAndConditionsPage from '@/pages/TermsAndConditionsPage';
import AboutUsPage from '@/pages/AboutUsPage';
import ContactUsPage from '@/pages/ContactUsPage';
import './App.css';

function PrivateRoute({ children }) {
  const { isAuthenticated, token } = useAuthStore();
  return isAuthenticated || token ? children : <Navigate to="/auth" />;
}

function App() {
  const { token, fetchUser } = useAuthStore();
  
  useEffect(() => {
    if (token) {
      fetchUser();
    }
  }, [token]);
  
  return (
    <div className="App min-h-screen bg-background">
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/" element={<PrivateRoute><HomePage /></PrivateRoute>} />
          <Route path="/chat/:chatId" element={<PrivateRoute><ChatPage /></PrivateRoute>} />
          <Route path="/story/:storyId" element={<PrivateRoute><StoryViewPage /></PrivateRoute>} />
          <Route path="/stories/user/:userId" element={<PrivateRoute><StoryViewerPage /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
          <Route path="/user/:userId" element={<PrivateRoute><UserProfilePage /></PrivateRoute>} />
          <Route path="/admin" element={<PrivateRoute><AdminPage /></PrivateRoute>} />
          <Route path="/blocked-users" element={<PrivateRoute><BlockedUsersPage /></PrivateRoute>} />
          <Route path="/my-stories" element={<PrivateRoute><MyStoriesPage /></PrivateRoute>} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-center" theme="dark" />
    </div>
  );
}

export default App;