import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { Toaster } from "./components/ui/toaster";
import MainLayout from "./components/Layout/MainLayout";
import Home from "./pages/Home";
import Login from "./pages/Auth/Login";
import Signup from "./pages/Auth/Signup";
import Profile from "./pages/Profile";
import Explore from "./pages/Explore";
import Messages from "./pages/Messages";
import Search from "./pages/Search";
import Reels from "./pages/Reels";
import Notifications from "./pages/Notifications";
import Saved from "./pages/Saved";
import Settings from "./pages/Settings";
import AdminLogin from "./pages/Admin/AdminLogin";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import PostDetail from "./pages/PostDetail";
import StoryViewer from "./pages/StoryViewer";
import AuthCallback from "./pages/Auth/AuthCallback";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <div className="App">
          <BrowserRouter>
            <Routes>
              {/* Auth Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              {/* Admin Routes */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />

              {/* Protected Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <MainLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Home />} />
                <Route path="profile/:username" element={<Profile />} />
                <Route path="explore" element={<Explore />} />
                <Route path="messages" element={<Messages />} />
                <Route path="messages/:id" element={<Messages />} />
                <Route path="search" element={<Search />} />
                <Route path="reels" element={<Reels />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="saved" element={<Saved />} />
                <Route path="settings" element={<Settings />} />
                <Route path="post/:postId" element={<PostDetail />} />
                <Route path="stories/:username" element={<StoryViewer />} />
              </Route>
            </Routes>
          </BrowserRouter>
          <Toaster />
        </div>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
