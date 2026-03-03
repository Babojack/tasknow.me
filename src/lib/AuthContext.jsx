import React, { createContext, useState, useContext, useEffect } from 'react';
import { setDemoCurrentUserType } from '@/api/demoClient';

const AuthContext = createContext();

const defaultDemoUser = {
  id: '1',
  full_name: 'Demo User',
  email: 'demo@example.com',
  user_type: 'customer',
  city: 'Berlin',
  onboarding_completed: true,
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(defaultDemoUser);

  const setUserType = (userType) => {
    setUser((prev) =>
      prev ? { ...prev, user_type: userType } : { ...defaultDemoUser, user_type: userType }
    );
    setDemoCurrentUserType(userType);
  };

  useEffect(() => {
    setDemoCurrentUserType(user?.user_type ?? 'customer');
  }, []);

  const logout = () => {
    setUser(null);
  };

  const value = {
    user,
    setUserType,
    isAuthenticated: !!user,
    isLoadingAuth: false,
    isLoadingPublicSettings: false,
    authError: null,
    appPublicSettings: null,
    logout,
    navigateToLogin: () => {},
    checkAppState: () => {},
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
