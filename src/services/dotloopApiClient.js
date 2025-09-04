/**
 * Dotloop API Client for Next.js
 * Follows Dotloop API v2 guidelines and Next.js security best practices
 *
 * Security features:
 * - Client secrets kept server-side only
 * - Access tokens managed securely
 * - Automatic token refresh handling
 * - Proper error handling for 401 Unauthorized
 */

import axios from "axios";

/* ---------------- Dotloop Client Configuration ---------------- */
const DOTLOOP_AUTH = process.env.NEXT_PUBLIC_DOTLOOP_AUTH_URL || "https://auth.dotloop.com";
const CLIENT_ID = process.env.NEXT_PUBLIC_DOTLOOP_CLIENT_ID;
const REDIRECT_URI = process.env.NEXT_PUBLIC_REDIRECT_URI || "http://localhost:3000/callback";

// OAuth 2.0 Scopes as per Dotloop API guidelines
const SCOPES = [
  "account:read", // Account details
  "profile:*", // Profile information (all profile permissions)
  "loop:*", // Loop information, details, folders, documents, participants, tasks, activities (all loop permissions)
  "contact:*", // Contact information (all contact permissions)
  "template:*", // Loop templates (all template permissions)
];

class DotloopApiClient {
  constructor() {
    console.log("🏗️ [API] DotloopApiClient initialized");
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;

    // Bind all methods to maintain 'this' context
    this.loadTokens = this.loadTokens.bind(this);
    this.saveTokens = this.saveTokens.bind(this);
    this.clearTokens = this.clearTokens.bind(this);
    this.isTokenValid = this.isTokenValid.bind(this);
    this.getAuthUrl = this.getAuthUrl.bind(this);
    this.exchangeCodeForToken = this.exchangeCodeForToken.bind(this);
    this.refreshAccessToken = this.refreshAccessToken.bind(this);
    this.makeRequest = this.makeRequest.bind(this);
    this.getAccount = this.getAccount.bind(this);
    this.getProfiles = this.getProfiles.bind(this);
    this.getProfile = this.getProfile.bind(this);
    this.getLoops = this.getLoops.bind(this);
    this.getLoop = this.getLoop.bind(this);
    this.getLoopDetails = this.getLoopDetails.bind(this);
    this.getFolders = this.getFolders.bind(this);
    this.getFolder = this.getFolder.bind(this);
    this.getDocuments = this.getDocuments.bind(this);
    this.getDocument = this.getDocument.bind(this);
    this.downloadDocument = this.downloadDocument.bind(this);
    this.getContacts = this.getContacts.bind(this);
    this.getContact = this.getContact.bind(this);
    this.getTemplates = this.getTemplates.bind(this);
    this.getTemplate = this.getTemplate.bind(this);

    // Load tokens from localStorage on client-side
    this.loadTokens();

    console.log("✅ [API] DotloopApiClient methods bound and initialized");
    console.log("🔍 [API] makeRequest method:", typeof this.makeRequest);
  }

  /* ---------------- Token Management ---------------- */

  loadTokens() {
    if (typeof window !== "undefined") {
      console.log("📦 [TOKENS] Loading tokens from localStorage...");
      const tokens = localStorage.getItem("dotloop_tokens");
      if (tokens) {
        const { accessToken, refreshToken, tokenExpiry } = JSON.parse(tokens);
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.tokenExpiry = tokenExpiry;
        console.log("✅ [TOKENS] Tokens loaded successfully");
      }
    }
  }

  saveTokens(accessToken, refreshToken, expiresIn) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.tokenExpiry = Date.now() + expiresIn * 1000;

    if (typeof window !== "undefined") {
      localStorage.setItem(
        "dotloop_tokens",
        JSON.stringify({
          accessToken,
          refreshToken,
          tokenExpiry: this.tokenExpiry,
        })
      );
      console.log("💾 [TOKENS] Tokens saved to localStorage");
    }
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;

    if (typeof window !== "undefined") {
      localStorage.removeItem("dotloop_tokens");
      console.log("🗑️ [TOKENS] Tokens cleared from localStorage");
    }
  }

  isTokenValid() {
    const valid = this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry;
    console.log("🔍 [TOKENS] Token validity check:", valid ? "✅ Valid" : "❌ Invalid/Expired");
    return valid;
  }

  /* ---------------- OAuth 2.0 Authentication ---------------- */

  getAuthUrl(state = null) {
    const params = new URLSearchParams({
      response_type: "code",
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      scope: SCOPES.join(" "),
    });

    if (state) {
      params.append("state", state);
    }

    const authUrl = `${DOTLOOP_AUTH}/oauth/authorize?${params.toString()}`;
    console.log("🔗 [AUTH] Generated authorization URL");
    return authUrl;
  }

  async exchangeCodeForToken(code, state) {
    console.log("🔄 [AUTH] Starting OAuth code exchange...");

    try {
      const response = await axios.post("/api/dotloop/auth/token", {
        code,
        state,
        redirect_uri: REDIRECT_URI,
      });

      const { access_token, refresh_token, expires_in } = response.data;
      this.saveTokens(access_token, refresh_token, expires_in);

      console.log("✅ [AUTH] Token exchange successful");
      return response.data;
    } catch (error) {
      console.error("❌ [AUTH] Token exchange failed:", error.response?.data || error.message);
      throw error;
    }
  }

  async refreshAccessToken() {
    if (!this.refreshToken) {
      throw new Error("No refresh token available");
    }

    console.log("🔄 [TOKENS] Refreshing access token...");

    try {
      const response = await axios.post("/api/dotloop/auth/refresh", {
        refresh_token: this.refreshToken,
      });

      const { access_token, refresh_token, expires_in } = response.data;
      this.saveTokens(access_token, refresh_token || this.refreshToken, expires_in);

      console.log("✅ [TOKENS] Token refreshed successfully");
      return response.data;
    } catch (error) {
      console.error("❌ [TOKENS] Token refresh failed:", error.response?.data || error.message);
      this.clearTokens(); // Clear invalid tokens
      throw error;
    }
  }

  /* ---------------- API Request Methods ---------------- */

  async makeRequest(endpoint, options = {}) {
    console.log("🌐 [API] Making request to:", endpoint);

    // Ensure we have a valid token
    if (!this.isTokenValid()) {
      if (this.refreshToken) {
        await this.refreshAccessToken();
      } else {
        throw new Error("Authentication required - no valid token available");
      }
    }

    const config = {
      method: options.method || "GET",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    // If Accept header indicates binary content, set responseType appropriately
    const acceptHeader = config.headers.Accept || config.headers.accept;
    if (
      acceptHeader &&
      (acceptHeader.includes("application/pdf") ||
        acceptHeader.includes("application/octet-stream") ||
        acceptHeader.includes("image/") ||
        acceptHeader.includes("application/zip"))
    ) {
      config.responseType = "arraybuffer";
      console.log("🔧 [API] Set responseType to arraybuffer for binary content");
    }

    try {
      const response = await axios(`/api/dotloop/proxy${endpoint}`, config);
      console.log("✅ [API] Request successful:", endpoint);

      // Return raw response for binary data
      if (config.responseType === "arraybuffer") {
        return response.data;
      }

      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        console.log("🔄 [API] 401 received, attempting token refresh...");

        try {
          await this.refreshAccessToken();
          config.headers.Authorization = `Bearer ${this.accessToken}`;
          const retryResponse = await axios(`/api/dotloop/proxy${endpoint}`, config);
          console.log("✅ [API] Retry after refresh successful:", endpoint);

          // Return raw response for binary data
          if (config.responseType === "arraybuffer") {
            return retryResponse.data;
          }

          return retryResponse.data;
        } catch (refreshError) {
          console.error("❌ [API] Retry after refresh failed:", refreshError);
          throw refreshError;
        }
      }

      console.error("❌ [API] Request failed:", endpoint, error.response?.data || error.message);
      throw error;
    }
  }

  /* ---------------- Account & Profile API Methods ---------------- */

  async getAccount() {
    return this.makeRequest("/account");
  }

  async getProfiles() {
    return this.makeRequest("/profile");
  }

  async getProfile(profileId) {
    return this.makeRequest(`/profile/${profileId}`);
  }

  /* ---------------- Loop API Methods ---------------- */

  async getLoops(profileId, params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    const endpoint = queryParams ? `/profile/${profileId}/loop?${queryParams}` : `/profile/${profileId}/loop`;
    return this.makeRequest(endpoint);
  }

  async getLoop(profileId, loopId) {
    return this.makeRequest(`/profile/${profileId}/loop/${loopId}`);
  }

  async getLoopDetails(profileId, loopId) {
    return this.makeRequest(`/profile/${profileId}/loop/${loopId}/detail`);
  }

  /* ---------------- Folder API Methods ---------------- */

  async getFolders(profileId, loopId, params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    const endpoint = queryParams
      ? `/profile/${profileId}/loop/${loopId}/folder?${queryParams}`
      : `/profile/${profileId}/loop/${loopId}/folder`;
    return this.makeRequest(endpoint);
  }

  async getFolder(profileId, loopId, folderId) {
    return this.makeRequest(`/profile/${profileId}/loop/${loopId}/folder/${folderId}`);
  }

  /* ---------------- Document API Methods ---------------- */

  async getDocuments(profileId, loopId, folderId, params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    const endpoint = queryParams
      ? `/profile/${profileId}/loop/${loopId}/folder/${folderId}/document?${queryParams}`
      : `/profile/${profileId}/loop/${loopId}/folder/${folderId}/document`;
    return this.makeRequest(endpoint);
  }

  async getDocument(profileId, loopId, folderId, documentId) {
    return this.makeRequest(`/profile/${profileId}/loop/${loopId}/folder/${folderId}/document/${documentId}`);
  }

  async downloadDocument(profileId, loopId, folderId, documentId, documentName = "document") {
    // Download a document as PDF (binary) following Dotloop API doc
    try {
      const response = await this.makeRequest(
        `/profile/${profileId}/loop/${loopId}/folder/${folderId}/document/${documentId}`,
        {
          method: "GET",
          headers: {
            Accept: "application/pdf",
          },
        }
      );

      // If response is arraybuffer, return it directly
      if (response instanceof ArrayBuffer || (response && response.byteLength)) {
        return response;
      }

      // If response is an object, check for binary data
      if (response?.data && response?.headers?.["content-type"] === "application/pdf") {
        return response.data;
      }

      // Otherwise, return as-is
      return response;
    } catch (error) {
      // If 405, log method issue
      if (error.response?.status === 405) {
        console.warn("[Dotloop] 405 Method Not Allowed - ensure GET is used");
      }
      // If 404, try alternative endpoint (rare)
      if (error.response?.status === 404) {
        try {
          const altResponse = await this.makeRequest(`/profile/${profileId}/loop/${loopId}/document/${documentId}`, {
            method: "GET",
            headers: {
              Accept: "application/pdf",
            },
          });
          if (altResponse instanceof ArrayBuffer || (altResponse && altResponse.byteLength)) {
            return altResponse;
          }
          if (altResponse?.data && altResponse?.headers?.["content-type"] === "application/pdf") {
            return altResponse.data;
          }
          return altResponse;
        } catch (altError) {
          console.error("[Dotloop] Alternative endpoint failed:", altError);
        }
      }
      throw error;
    }
  }

  /* ---------------- Contact API Methods ---------------- */

  async getContacts(profileId = null, params = {}) {
    // Based on research: contacts may need profile_id parameter
    const queryParams = new URLSearchParams(params).toString();
    let endpoint;

    if (profileId) {
      endpoint = queryParams ? `/profile/${profileId}/contact?${queryParams}` : `/profile/${profileId}/contact`;
    } else {
      endpoint = queryParams ? `/contact?${queryParams}` : "/contact";
    }

    console.log("📞 [CONTACTS] Fetching contacts with endpoint:", endpoint);
    return this.makeRequest(endpoint);
  }

  async getContact(contactId, profileId = null) {
    let endpoint;
    if (profileId) {
      endpoint = `/profile/${profileId}/contact/${contactId}`;
    } else {
      endpoint = `/contact/${contactId}`;
    }
    return this.makeRequest(endpoint);
  }

  /* ---------------- Template API Methods ---------------- */

  async getTemplates(profileId = null) {
    // Based on research: templates may need profile_id parameter
    let endpoint;

    if (profileId) {
      endpoint = `/profile/${profileId}/loop-template`;
    } else {
      endpoint = "/template";
    }

    console.log("📋 [TEMPLATES] Fetching templates with endpoint:", endpoint);
    return this.makeRequest(endpoint);
  }

  async getTemplate(templateId, profileId = null) {
    let endpoint;
    if (profileId) {
      endpoint = `/profile/${profileId}/loop-template/${templateId}`;
    } else {
      endpoint = `/template/${templateId}`;
    }
    return this.makeRequest(endpoint);
  }
}

// Export singleton instance
const dotloopApi = new DotloopApiClient();
export default dotloopApi;
