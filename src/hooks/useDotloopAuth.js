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
          console.log("✅ [HOOK] Token is valid, fetching user data...");
          
          // Try to fetch account data first
          let userData = null;
          try {
            const accountData = await dotloopApi.getAccount();
            console.log("✅ [HOOK] Account data received:", accountData);
            userData = accountData?.data;
          } catch (accountError) {
            console.error("❌ [HOOK] Account fetch failed:", accountError);
          }

          // If account data is missing or incomplete, try profiles endpoint
          if (!userData || !userData.default_profile_id) {
            console.log("🔄 [HOOK] Fetching profiles as fallback...");
            try {
              const profilesData = await dotloopApi.getProfiles();
              console.log("✅ [HOOK] Profiles data received:", profilesData);
              
              if (profilesData?.data?.length > 0) {
                // Create user object with profile data
                const primaryProfile = profilesData.data.find(p => p.is_default) || profilesData.data[0];
                userData = {
                  id: primaryProfile.profile_id,
                  default_profile_id: primaryProfile.profile_id,
                  profiles: profilesData.data,
                  attributes: {
                    name: primaryProfile.name,
                    email: primaryProfile.email
                  },
                  type: "user"
                };
                console.log("✅ [HOOK] User data constructed from profiles:", userData);
              }
            } catch (profilesError) {
              console.error("❌ [HOOK] Profiles fetch failed:", profilesError);
            }
          }

          if (userData) {
            setUser(userData);
            setIsAuthenticated(true);
            console.log("✅ [HOOK] User authenticated successfully");
          } else {
            console.error("❌ [HOOK] No user data available from any endpoint");
            setIsAuthenticated(false);
            setUser(null);
            setError("Unable to fetch user data");
          }
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
      console.log("✅ [HOOK] Token exchange successful, fetching user data...");

      // Try to fetch account data first
      let userData = null;
      try {
        const accountData = await dotloopApi.getAccount();
        console.log("✅ [HOOK] Account data received:", accountData);
        userData = accountData?.data;
      } catch (accountError) {
        console.error("❌ [HOOK] Account fetch failed:", accountError);
      }

      // If account data is missing or incomplete, try profiles endpoint
      if (!userData || !userData.default_profile_id) {
        console.log("🔄 [HOOK] Fetching profiles as fallback...");
        try {
          const profilesData = await dotloopApi.getProfiles();
          console.log("✅ [HOOK] Profiles data received:", profilesData);
          
          if (profilesData?.data?.length > 0) {
            // Create user object with profile data
            const primaryProfile = profilesData.data.find(p => p.is_default) || profilesData.data[0];
            userData = {
              id: primaryProfile.profile_id,
              default_profile_id: primaryProfile.profile_id,
              profiles: profilesData.data,
              attributes: {
                name: primaryProfile.name,
                email: primaryProfile.email
              },
              type: "user"
            };
            console.log("✅ [HOOK] User data constructed from profiles:", userData);
          }
        } catch (profilesError) {
          console.error("❌ [HOOK] Profiles fetch failed:", profilesError);
        }
      }

      if (userData) {
        setUser(userData);
        setIsAuthenticated(true);
        console.log("✅ [HOOK] OAuth callback completed successfully");
      } else {
        throw new Error("Unable to fetch user data from account or profiles endpoints");
      }

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
