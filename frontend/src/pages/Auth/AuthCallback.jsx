import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const AuthCallback = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState('Processing authentication...');
  const [error, setError] = useState(null);

  useEffect(() => {
    const processAuth = async () => {
      try {
        console.log('[AuthCallback] Starting auth process');
        console.log('[AuthCallback] Full URL:', window.location.href);
        console.log('[AuthCallback] Hash:', window.location.hash);
        console.log('[AuthCallback] Search:', window.location.search);
        
        // Try to get session_id from URL fragment (hash)
        let sessionId = null;
        const hash = window.location.hash;
        
        if (hash) {
          const hashParams = new URLSearchParams(hash.substring(1));
          sessionId = hashParams.get('session_id');
          console.log('[AuthCallback] Session ID from hash:', sessionId);
        }
        
        // Also try query params as fallback
        if (!sessionId) {
          const searchParams = new URLSearchParams(window.location.search);
          sessionId = searchParams.get('session_id');
          console.log('[AuthCallback] Session ID from search:', sessionId);
        }

        if (!sessionId) {
          console.error('[AuthCallback] No session_id found in URL');
          setError('No session ID found in callback URL');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        setStatus('Verifying session with server...');
        console.log('[AuthCallback] Calling backend with session_id:', sessionId);

        // Call backend to process session
        const response = await axios.post(
          `${BACKEND_URL}/api/auth/session`,
          { session_id: sessionId },
          { withCredentials: true }
        );

        console.log('[AuthCallback] Backend response:', response.data);
        const userData = response.data.user;
        
        // Store in localStorage
        localStorage.setItem('ishukart_user', JSON.stringify(userData));
        console.log('[AuthCallback] User data stored in localStorage');
        
        // Set flag to skip delay in ProtectedRoute
        sessionStorage.setItem('just_authenticated', 'true');

        setStatus('Login successful! Redirecting...');
        
        // Redirect to home
        setTimeout(() => {
          navigate('/', { replace: true, state: { user: userData } });
        }, 500);
      } catch (error) {
        console.error('[AuthCallback] Auth error:', error);
        console.error('[AuthCallback] Error details:', error.response?.data);
        setError(error.response?.data?.detail || error.message || 'Authentication failed');
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    processAuth();
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        {!error ? (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-lg text-gray-700 dark:text-gray-300">{status}</p>
          </>
        ) : (
          <>
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <p className="text-lg text-red-600 dark:text-red-400 mb-2">Authentication Error</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{error}</p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-4">Redirecting to login...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
