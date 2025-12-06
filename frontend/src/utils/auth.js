// Google OAuth login helper
export const loginWithGoogle = () => {
  const redirectUrl = window.location.origin + '/auth/callback';
  window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
};

// Check authentication
export const checkAuth = async () => {
  try {
    const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/auth/me`, {
      credentials: 'include'
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.user;
    }
    return null;
  } catch (error) {
    console.error('Auth check error:', error);
    return null;
  }
};

// Logout
export const logout = async () => {
  try {
    await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    });
    localStorage.removeItem('ishukart_user');
    return true;
  } catch (error) {
    console.error('Logout error:', error);
    return false;
  }
};
