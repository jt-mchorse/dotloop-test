import { useState, useEffect, useCallback } from "react";
import dotloopApi from "../services/dotloopApi";

export const useDotloopAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      console.log("🔍 [HOOK] Checking authentication status...");
      try {
        setIsLoading(true);
        if (dotloopApi.isTokenValid()) {
          console.log("✅ [HOOK] Token is valid, fetching account data...");
          const accountData = await dotloopApi.getAccount();
          console.log("✅ [HOOK] Account data received:", accountData);
          setUser(accountData.data);
          setIsAuthenticated(true);
          console.log("✅ [HOOK] User authenticated successfully");
        } else {
          console.log("❌ [HOOK] Token is not valid");
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (err) {
        console.error("❌ [HOOK] Auth check failed:", err);
        setIsAuthenticated(false);
        setUser(null);
        setError(err.message);
      } finally {
        setIsLoading(false);
        console.log("🔍 [HOOK] Authentication check completed");
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = useCallback(() => {
    console.log("🚀 [HOOK] Login initiated...");
    const state = Math.random().toString(36).substring(7);
    console.log("🚀 [HOOK] Generated state:", state);
    const authUrl = dotloopApi.getAuthUrl(state);
    console.log("🚀 [HOOK] Redirecting to:", authUrl);
    window.location.href = authUrl;
  }, []);

  // Logout function
  const logout = useCallback(() => {
    console.log("🚪 [HOOK] Logout initiated...");
    dotloopApi.clearTokens();
    setIsAuthenticated(false);
    setUser(null);
    setError(null);
    console.log("✅ [HOOK] Logout completed");
  }, []);

  // Handle OAuth callback
  const handleCallback = useCallback(async (code, state) => {
    console.log("🔄 [HOOK] OAuth callback received...");
    console.log("🔄 [HOOK] Code:", code ? "✅ Present" : "❌ Missing");
    console.log("🔄 [HOOK] State:", state ? "✅ Present" : "❌ Missing");

    try {
      setIsLoading(true);
      setError(null);

      console.log("🔄 [HOOK] Exchanging code for token...");
      await dotloopApi.exchangeCodeForToken(code);
      console.log("✅ [HOOK] Token exchange successful, fetching account...");

      const accountData = await dotloopApi.getAccount();
      console.log("✅ [HOOK] Account data received:", accountData);

      setUser(accountData.data);
      setIsAuthenticated(true);
      console.log("✅ [HOOK] OAuth callback completed successfully");

      return true;
    } catch (err) {
      console.error("❌ [HOOK] OAuth callback failed:", err);
      setError(err.message);
      setIsAuthenticated(false);
      return false;
    } finally {
      setIsLoading(false);
      console.log("🔄 [HOOK] OAuth callback processing completed");
    }
  }, []);

  return {
    isAuthenticated,
    isLoading,
    user,
    error,
    login,
    logout,
    handleCallback,
  };
};
