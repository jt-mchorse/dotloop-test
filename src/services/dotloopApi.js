import axios from "axios";

/* ---------------- Dotloop constants ---------------- */
const DOTLOOP_AUTH = process.env.NEXT_PUBLIC_DOTLOOP_AUTH_URL || process.env.VITE_DOTLOOP_AUTH_URL || "https://auth.dotloop.com";
const DOTLOOP_API = process.env.NEXT_PUBLIC_DOTLOOP_API_URL || process.env.VITE_DOTLOOP_API_URL || "https://api-gateway.dotloop.com/public/v2";
const CLIENT_ID = process.env.NEXT_PUBLIC_DOTLOOP_CLIENT_ID || process.env.VITE_DOTLOOP_CLIENT_ID;
const CLIENT_SECRET = process.env.NEXT_PUBLIC_DOTLOOP_CLIENT_SECRET || process.env.VITE_DOTLOOP_CLIENT_SECRET;
const REDIRECT_URI = process.env.NEXT_PUBLIC_REDIRECT_URI || process.env.VITE_REDIRECT_URI || "http://localhost:3000/oauth-callback";
const SCOPES = [
  "account:read", // ✅ Account details
  "profile:read", // ✅ Profile information
  // "profile:write", // ❌ Create and update profiles (commented out - requires special access)
  "loop:read", // ✅ Loop information, details, folders, documents, participants, tasks, activities
  // "loop:write", // ❌ Create and update loops, details, folders, documents, participants (commented out - requires special access)
  "contact:read", // ✅ Contact information
  // "contact:write", // ❌ Create, update, delete contacts (commented out - requires special access)
  "template:read", // ✅ Loop templates
];

// Note: CORS proxy no longer needed with Next.js API routes

class DotloopApiService {
  constructor() {
    console.log("🏗️ [API] DotloopApiService constructor called");
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;

    // Bind methods to maintain 'this' context
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
    this.getContacts = this.getContacts.bind(this);
    this.getContact = this.getContact.bind(this);
    this.getTemplates = this.getTemplates.bind(this);
    this.getTemplate = this.getTemplate.bind(this);
    this.exchangeCodeForToken = this.exchangeCodeForToken.bind(this);
    this.refreshAccessToken = this.refreshAccessToken.bind(this);
    this.isTokenValid = this.isTokenValid.bind(this);
    this.getAuthUrl = this.getAuthUrl.bind(this);
    this.clearTokens = this.clearTokens.bind(this);
    this.loadTokens = this.loadTokens.bind(this);
    this.saveTokens = this.saveTokens.bind(this);

    // Load tokens from localStorage on initialization
    this.loadTokens();
    console.log("✅ [API] DotloopApiService initialized");
  }

  // Token management
  loadTokens() {
    console.log("📦 [TOKENS] Loading tokens from localStorage...");
    // Only access localStorage on the client side
    if (typeof window !== 'undefined') {
      const tokens = localStorage.getItem("dotloop_tokens");
      if (tokens) {
        const { accessToken, refreshToken, tokenExpiry } = JSON.parse(tokens);
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.tokenExpiry = tokenExpiry;
      }
    }
  }

  saveTokens(accessToken, refreshToken, expiresIn) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.tokenExpiry = Date.now() + expiresIn * 1000;

    // Only access localStorage on the client side
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        "dotloop_tokens",
        JSON.stringify({
          accessToken,
          refreshToken,
          tokenExpiry: this.tokenExpiry,
        })
      );
    }
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
    // Only access localStorage on the client side
    if (typeof window !== 'undefined') {
      localStorage.removeItem("dotloop_tokens");
    }
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

  // API request helper - now uses serverless proxy
  async makeRequest(endpoint, options = {}) {
    console.log("🔄 [API] makeRequest called:", { endpoint, options });

    if (!this.isTokenValid()) {
      console.log("❌ [API] Token is not valid");
      if (this.refreshToken) {
        console.log("🔄 [API] Attempting to refresh token...");
        await this.refreshAccessToken();
      } else {
        console.log("❌ [API] No refresh token available");
        throw new Error("No valid token available");
      }
    }

    // Remove leading slash from endpoint if present
    let cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    
    // Add cache-busting parameter for GET requests to avoid 304
    if (options.method !== 'POST' && options.method !== 'PUT' && options.method !== 'PATCH' && options.method !== 'DELETE') {
      const separator = cleanEndpoint.includes('?') ? '&' : '?';
      cleanEndpoint += `${separator}_t=${Date.now()}`;
    }

    const config = {
      method: options.method || 'GET',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    // Add data as body for non-GET requests
    if (options.data && config.method !== 'GET') {
      config.data = options.data;
    }

    try {
      // Use our proxy endpoint instead of direct API call
      const response = await axios(`/api/dotloop/${cleanEndpoint}`, config);
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        // Token might be expired, try to refresh
        await this.refreshAccessToken();
        config.headers.Authorization = `Bearer ${this.accessToken}`;
        const retryResponse = await axios(`/api/dotloop/${cleanEndpoint}`, config);
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
    console.log("🔄 [API] getProfiles called, this:", this);
    console.log("🔄 [API] makeRequest method:", this.makeRequest);
    return this.makeRequest("/profile");
  }

  async getProfile(profileId) {
    return this.makeRequest(`/profile/${profileId}`);
  }

  async createProfile(profileData) {
    return this.makeRequest("/profile", {
      method: "POST",
      data: profileData,
    });
  }

  async updateProfile(profileId, profileData) {
    return this.makeRequest(`/profile/${profileId}`, {
      method: "PATCH",
      data: profileData,
    });
  }

  // Loops API - Updated to use profile-based endpoints
  async getLoops(profileId, params = {}) {
    console.log('🔄 [API] getLoops called with profileId:', profileId, 'params:', params);
    const queryParams = new URLSearchParams(params).toString();
    const endpoint = queryParams ? `/profile/${profileId}/loop?${queryParams}` : `/profile/${profileId}/loop`;
    console.log('🔄 [API] getLoops endpoint:', endpoint);
    const result = await this.makeRequest(endpoint);
    console.log('✅ [API] getLoops result:', result);
    return result;
  }

  async getLoop(profileId, loopId) {
    return this.makeRequest(`/profile/${profileId}/loop/${loopId}`);
  }

  async createLoop(profileId, loopData) {
    return this.makeRequest(`/profile/${profileId}/loop`, {
      method: "POST",
      data: loopData,
    });
  }

  async updateLoop(profileId, loopId, loopData) {
    return this.makeRequest(`/profile/${profileId}/loop/${loopId}`, {
      method: "PATCH",
      data: loopData,
    });
  }

  // Loop Details API
  async getLoopDetails(profileId, loopId) {
    return this.makeRequest(`/profile/${profileId}/loop/${loopId}/detail`);
  }

  async updateLoopDetails(profileId, loopId, detailsData) {
    return this.makeRequest(`/profile/${profileId}/loop/${loopId}/detail`, {
      method: "PATCH",
      data: detailsData,
    });
  }

  // Loop Folders API
  async getFolders(profileId, loopId, params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    const endpoint = queryParams ? `/profile/${profileId}/loop/${loopId}/folder?${queryParams}` : `/profile/${profileId}/loop/${loopId}/folder`;
    return this.makeRequest(endpoint);
  }

  async getFolder(profileId, loopId, folderId) {
    return this.makeRequest(`/profile/${profileId}/loop/${loopId}/folder/${folderId}`);
  }

  async createFolder(profileId, loopId, folderData) {
    return this.makeRequest(`/profile/${profileId}/loop/${loopId}/folder`, {
      method: "POST",
      data: folderData,
    });
  }

  async updateFolder(profileId, loopId, folderId, folderData) {
    return this.makeRequest(`/profile/${profileId}/loop/${loopId}/folder/${folderId}`, {
      method: "PATCH",
      data: folderData,
    });
  }

  // Loop Documents API
  async getDocuments(profileId, loopId, folderId, params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    const endpoint = queryParams ? `/profile/${profileId}/loop/${loopId}/folder/${folderId}/document?${queryParams}` : `/profile/${profileId}/loop/${loopId}/folder/${folderId}/document`;
    return this.makeRequest(endpoint);
  }

  async getDocument(profileId, loopId, folderId, documentId) {
    return this.makeRequest(`/profile/${profileId}/loop/${loopId}/folder/${folderId}/document/${documentId}`);
  }

  async uploadDocument(profileId, loopId, folderId, file, metadata = {}) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("metadata", JSON.stringify(metadata));

    return this.makeRequest(`/profile/${profileId}/loop/${loopId}/folder/${folderId}/document`, {
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
console.log("🔧 [API] Creating DotloopApiService instance...");
const dotloopApi = new DotloopApiService();
console.log("📤 [API] Exporting dotloopApi instance:", dotloopApi);
export default dotloopApi;
