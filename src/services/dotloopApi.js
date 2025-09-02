import axios from "axios";

/* ---------------- Dotloop constants ---------------- */
const DOTLOOP_AUTH = import.meta.env.VITE_DOTLOOP_AUTH_URL || "https://auth.dotloop.com";
const DOTLOOP_API = import.meta.env.VITE_DOTLOOP_API_URL || "https://api-gateway.dotloop.com/public/v2";
const CLIENT_ID = import.meta.env.VITE_DOTLOOP_CLIENT_ID;
const CLIENT_SECRET = import.meta.env.VITE_DOTLOOP_CLIENT_SECRET;
const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI || "http://localhost:5173/callback";
const SCOPES = [
  "account:read", // ✅ Account stats and info
  "profile:read", // ✅ User profile data
  "loop:read", // ✅ List and view loops (includes documents)
  "contact:read", // ✅ List and view contacts
  "template:read", // ✅ List and view templates
  "admin:read", // ✅ Administrative data
];

// CORS proxy for development
const CORS_PROXY = import.meta.env.VITE_CORS_PROXY || "https://cors-anywhere.herokuapp.com/";
const USE_CORS_PROXY = import.meta.env.VITE_USE_CORS_PROXY === "true";

class DotloopApiService {
  constructor() {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;

    // Load tokens from localStorage on initialization
    this.loadTokens();
  }

  // Token management
  loadTokens() {
    console.log("📦 [TOKENS] Loading tokens from localStorage...");
    const tokens = localStorage.getItem("dotloop_tokens");
    if (tokens) {
      const { accessToken, refreshToken, tokenExpiry } = JSON.parse(tokens);
      this.accessToken = accessToken;
      this.refreshToken = refreshToken;
      this.tokenExpiry = tokenExpiry;
    }
  }

  saveTokens(accessToken, refreshToken, expiresIn) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.tokenExpiry = Date.now() + expiresIn * 1000;

    localStorage.setItem(
      "dotloop_tokens",
      JSON.stringify({
        accessToken,
        refreshToken,
        tokenExpiry: this.tokenExpiry,
      })
    );
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
    localStorage.removeItem("dotloop_tokens");
  }

  isTokenValid() {
    return this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry;
  }

  // OAuth2 Authentication
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

    return `${DOTLOOP_AUTH}/oauth/authorize?${params.toString()}`;
  }

  async exchangeCodeForToken(code) {
    console.log("🔄 [TOKEN] Starting code exchange for token...");
    console.log("🔄 [TOKEN] Authorization code:", code ? "✅ Received" : "❌ Missing");
    console.log("🔄 [TOKEN] Using serverless function for token exchange");

    try {
      // Use our serverless function instead of direct API call
      const response = await axios.post('/api/oauth/token', {
        code: code,
        redirect_uri: REDIRECT_URI,
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log("✅ [TOKEN] Token exchange successful!");
      console.log("✅ [TOKEN] Response status:", response.status);
      console.log("✅ [TOKEN] Response data keys:", Object.keys(response.data));
      console.log("✅ [TOKEN] Access token received:", response.data.access_token ? "✅ Yes" : "❌ No");
      console.log("✅ [TOKEN] Refresh token received:", response.data.refresh_token ? "✅ Yes" : "❌ No");
      console.log("✅ [TOKEN] Expires in:", response.data.expires_in, "seconds");

      const { access_token, refresh_token, expires_in } = response.data;
      this.saveTokens(access_token, refresh_token, expires_in);
      return response.data;
    } catch (error) {
      console.error("❌ [TOKEN] Token exchange failed!");
      console.error("❌ [TOKEN] Error type:", error.constructor.name);
      console.error("❌ [TOKEN] Error message:", error.message);
      console.error("❌ [TOKEN] Error response status:", error.response?.status);
      console.error("❌ [TOKEN] Error response data:", error.response?.data);
      console.error("❌ [TOKEN] Full error object:", error);
      throw error;
    }
  }

  async refreshAccessToken() {
    if (!this.refreshToken) {
      throw new Error("No refresh token available");
    }

    try {
      const credentials = btoa(`${CLIENT_ID}:${CLIENT_SECRET}`);
      const response = await axios.post(
        `${DOTLOOP_AUTH}/oauth/token`,
        {
          grant_type: "refresh_token",
          refresh_token: this.refreshToken,
        },
        {
          headers: {
            Authorization: `Basic ${credentials}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      const { access_token, refresh_token, expires_in } = response.data;
      this.saveTokens(access_token, refresh_token || this.refreshToken, expires_in);
      return response.data;
    } catch (error) {
      console.error("Error refreshing token:", error);
      this.clearTokens();
      throw error;
    }
  }

  // API request helper
  async makeRequest(endpoint, options = {}) {
    if (!this.isTokenValid()) {
      if (this.refreshToken) {
        await this.refreshAccessToken();
      } else {
        throw new Error("No valid token available");
      }
    }

    const config = {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await axios(`${DOTLOOP_API}${endpoint}`, config);
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        // Token might be expired, try to refresh
        await this.refreshAccessToken();
        config.headers.Authorization = `Bearer ${this.accessToken}`;
        const retryResponse = await axios(`${DOTLOOP_API}${endpoint}`, config);
        return retryResponse.data;
      }
      throw error;
    }
  }

  // Account API
  async getAccount() {
    return this.makeRequest("/account");
  }

  // Profiles API
  async getProfiles() {
    return this.makeRequest("/profiles");
  }

  async getProfile(profileId) {
    return this.makeRequest(`/profiles/${profileId}`);
  }

  async createProfile(profileData) {
    return this.makeRequest("/profiles", {
      method: "POST",
      data: profileData,
    });
  }

  async updateProfile(profileId, profileData) {
    return this.makeRequest(`/profiles/${profileId}`, {
      method: "PATCH",
      data: profileData,
    });
  }

  // Loops API
  async getLoops(params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    const endpoint = queryParams ? `/loops?${queryParams}` : "/loops";
    return this.makeRequest(endpoint);
  }

  async getLoop(loopId) {
    return this.makeRequest(`/loops/${loopId}`);
  }

  async createLoop(loopData) {
    return this.makeRequest("/loops", {
      method: "POST",
      data: loopData,
    });
  }

  async updateLoop(loopId, loopData) {
    return this.makeRequest(`/loops/${loopId}`, {
      method: "PATCH",
      data: loopData,
    });
  }

  // Loop Details API
  async getLoopDetails(loopId) {
    return this.makeRequest(`/loops/${loopId}/details`);
  }

  async updateLoopDetails(loopId, detailsData) {
    return this.makeRequest(`/loops/${loopId}/details`, {
      method: "PATCH",
      data: detailsData,
    });
  }

  // Loop Folders API
  async getFolders(loopId) {
    return this.makeRequest(`/loops/${loopId}/folders`);
  }

  async getFolder(loopId, folderId) {
    return this.makeRequest(`/loops/${loopId}/folders/${folderId}`);
  }

  async createFolder(loopId, folderData) {
    return this.makeRequest(`/loops/${loopId}/folders`, {
      method: "POST",
      data: folderData,
    });
  }

  async updateFolder(loopId, folderId, folderData) {
    return this.makeRequest(`/loops/${loopId}/folders/${folderId}`, {
      method: "PATCH",
      data: folderData,
    });
  }

  // Loop Documents API
  async getDocuments(loopId, folderId) {
    return this.makeRequest(`/loops/${loopId}/folders/${folderId}/documents`);
  }

  async getDocument(loopId, folderId, documentId) {
    return this.makeRequest(`/loops/${loopId}/folders/${folderId}/documents/${documentId}`);
  }

  async uploadDocument(loopId, folderId, file, metadata = {}) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("metadata", JSON.stringify(metadata));

    return this.makeRequest(`/loops/${loopId}/folders/${folderId}/documents`, {
      method: "POST",
      headers: {
        "Content-Type": "multipart/form-data",
      },
      data: formData,
    });
  }

  // Loop Participants API
  async getParticipants(loopId) {
    return this.makeRequest(`/loops/${loopId}/participants`);
  }

  async getParticipant(loopId, participantId) {
    return this.makeRequest(`/loops/${loopId}/participants/${participantId}`);
  }

  async addParticipant(loopId, participantData) {
    return this.makeRequest(`/loops/${loopId}/participants`, {
      method: "POST",
      data: participantData,
    });
  }

  async updateParticipant(loopId, participantId, participantData) {
    return this.makeRequest(`/loops/${loopId}/participants/${participantId}`, {
      method: "PATCH",
      data: participantData,
    });
  }

  async deleteParticipant(loopId, participantId) {
    return this.makeRequest(`/loops/${loopId}/participants/${participantId}`, {
      method: "DELETE",
    });
  }

  // Loop Tasks API
  async getTaskLists(loopId) {
    return this.makeRequest(`/loops/${loopId}/task-lists`);
  }

  async getTaskList(loopId, taskListId) {
    return this.makeRequest(`/loops/${loopId}/task-lists/${taskListId}`);
  }

  async getTaskItems(loopId, taskListId) {
    return this.makeRequest(`/loops/${loopId}/task-lists/${taskListId}/items`);
  }

  async getTaskItem(loopId, taskListId, itemId) {
    return this.makeRequest(`/loops/${loopId}/task-lists/${taskListId}/items/${itemId}`);
  }

  // Loop Activities API
  async getActivities(loopId) {
    return this.makeRequest(`/loops/${loopId}/activities`);
  }

  // Contacts API
  async getContacts(params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    const endpoint = queryParams ? `/contacts?${queryParams}` : "/contacts";
    return this.makeRequest(endpoint);
  }

  async getContact(contactId) {
    return this.makeRequest(`/contacts/${contactId}`);
  }

  async createContact(contactData) {
    return this.makeRequest("/contacts", {
      method: "POST",
      data: contactData,
    });
  }

  async updateContact(contactId, contactData) {
    return this.makeRequest(`/contacts/${contactId}`, {
      method: "PATCH",
      data: contactData,
    });
  }

  async deleteContact(contactId) {
    return this.makeRequest(`/contacts/${contactId}`, {
      method: "DELETE",
    });
  }

  // Loop Templates API
  async getTemplates() {
    return this.makeRequest("/templates");
  }

  async getTemplate(templateId) {
    return this.makeRequest(`/templates/${templateId}`);
  }

  // Webhook Subscriptions API
  async getSubscriptions() {
    return this.makeRequest("/webhook-subscriptions");
  }

  async getSubscription(subscriptionId) {
    return this.makeRequest(`/webhook-subscriptions/${subscriptionId}`);
  }

  async createSubscription(subscriptionData) {
    return this.makeRequest("/webhook-subscriptions", {
      method: "POST",
      data: subscriptionData,
    });
  }

  async updateSubscription(subscriptionId, subscriptionData) {
    return this.makeRequest(`/webhook-subscriptions/${subscriptionId}`, {
      method: "PATCH",
      data: subscriptionData,
    });
  }

  async deleteSubscription(subscriptionId) {
    return this.makeRequest(`/webhook-subscriptions/${subscriptionId}`, {
      method: "DELETE",
    });
  }

  // Webhook Events API
  async getEvents(params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    const endpoint = queryParams ? `/webhook-events?${queryParams}` : "/webhook-events";
    return this.makeRequest(endpoint);
  }

  async getEvent(eventId) {
    return this.makeRequest(`/webhook-events/${eventId}`);
  }
}

// Create and export a singleton instance
const dotloopApi = new DotloopApiService();
export default dotloopApi;
