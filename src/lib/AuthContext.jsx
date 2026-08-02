import React, { createContext, useContext, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { api } from "@/api/firebaseClient";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const queryClient = useQueryClient();

  // Every page in this app independently reads the current user via
  // useQuery({ queryKey: ["currentUser"], queryFn: () => demoApi.auth.me() }).
  // AuthContext uses that exact same query/cache instead of keeping its
  // own separate state, so a profile update from ANY page (Profile,
  // Onboarding, AdminVerification, ...) - which all call
  // queryClient.invalidateQueries(["currentUser"]) internally - is
  // reflected here too, without a second, possibly-stale copy of "user".
  const {
    data: user,
    isLoading: isLoadingAuth,
    error: authError,
  } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => api.auth.me(),
  });

  // Firebase's own sign-in/sign-out/token-refresh events also need to
  // invalidate that same cache (a profile *field* change re-invalidates
  // itself via api.auth.updateMe, but a fresh sign-in/sign-out doesn't
  // go through that path for every consumer).
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    });
    return () => unsubscribe();
  }, [queryClient]);

  const login = (email, password) => api.auth.loginWithEmail(email, password);
  const register = (email, password, fullName) =>
    api.auth.registerWithEmail(email, password, fullName);
  const loginWithGoogle = () => api.auth.loginWithGoogle();
  const logout = () => api.auth.logout();

  const value = {
    user: user ?? null,
    isAuthenticated: !!user,
    isLoadingAuth,
    isLoadingPublicSettings: false,
    authError: authError ?? null,
    appPublicSettings: null,
    login,
    register,
    loginWithGoogle,
    logout,
    navigateToLogin: () => {},
    checkAppState: () => {},
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
