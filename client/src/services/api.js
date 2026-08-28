const API_BASE = "/api/v1";

let accessToken = localStorage.getItem("stackchat_token") || "";

export const setAuthToken = (token) => {
  accessToken = token;
  if (token) {
    localStorage.setItem("stackchat_token", token);
  } else {
    localStorage.removeItem("stackchat_token");
  }
};

export const getAuthToken = () => accessToken;

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    ...options.headers,
  };

  if (accessToken && !headers.Authorization) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  // Handle FormData vs JSON
  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = data.message || data.error || response.statusText || "Request failed";
      const error = new Error(errorMsg);
      error.statusCode = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    throw error;
  }
}

// ----------------------------------------------------
// AUTH API
// ----------------------------------------------------
export const authApi = {
  register: (payload) => request("/auth/register", { method: "POST", body: JSON.stringify(payload) }),
  login: (payload) => request("/auth/login", { method: "POST", body: JSON.stringify(payload) }),
  forgotPassword: (email) => request("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) }),
  resetPassword: (payload) => request("/auth/reset-password", { method: "POST", body: JSON.stringify(payload) }),
  logout: () => request("/auth/logout", { method: "POST" }),
  getMe: () => request("/auth/me", { method: "GET" }),
};

// ----------------------------------------------------
// CONVERSATIONS API
// ----------------------------------------------------
export const conversationApi = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/conversations${query ? `?${query}` : ""}`, { method: "GET" });
  },
  create: (payload = {}) => request("/conversations", { method: "POST", body: JSON.stringify(payload) }),
  get: (id) => request(`/conversations/${id}`, { method: "GET" }),
  update: (id, payload) => request(`/conversations/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  delete: (id) => request(`/conversations/${id}`, { method: "DELETE" }),
  togglePin: (id) => request(`/conversations/${id}/pin`, { method: "PATCH" }),
  toggleFavourite: (id) => request(`/conversations/${id}/favourite`, { method: "PATCH" }),
};

// ----------------------------------------------------
// MESSAGES API
// ----------------------------------------------------
export const messageApi = {
  listByConversation: (convId, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/conversations/${convId}/messages${query ? `?${query}` : ""}`, { method: "GET" });
  },
  send: (convId, payload) => request(`/conversations/${convId}/messages`, { method: "POST", body: JSON.stringify(payload) }),
  edit: (id, payload) => request(`/messages/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  delete: (id) => request(`/messages/${id}`, { method: "DELETE" }),
  regenerate: (id) => request(`/messages/${id}/regenerate`, { method: "POST" }),
};

// ----------------------------------------------------
// FOLDERS API
// ----------------------------------------------------
export const folderApi = {
  list: () => request("/folders", { method: "GET" }),
  create: (payload) => request("/folders", { method: "POST", body: JSON.stringify(payload) }),
  update: (id, payload) => request(`/folders/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  delete: (id) => request(`/folders/${id}`, { method: "DELETE" }),
};

// ----------------------------------------------------
// CSV & DATA ANALYSIS API
// ----------------------------------------------------
export const csvApi = {
  analyzeFile: (formData) => request("/csv/analyze", { method: "POST", body: formData }),
  analyzeText: (csvText) => request("/csv/analyze", { method: "POST", body: JSON.stringify({ csvText }) }),
  query: (payload) => request("/csv/query", { method: "POST", body: JSON.stringify(payload) }),
  aggregate: (payload) => request("/csv/aggregate", { method: "POST", body: JSON.stringify(payload) }),
  generateChart: (payload) => request("/csv/chart", { method: "POST", body: JSON.stringify(payload) }),
};

// ----------------------------------------------------
// PERSISTENT MEMORY API
// ----------------------------------------------------
export const memoryApi = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/memory${query ? `?${query}` : ""}`, { method: "GET" });
  },
  create: (payload) => request("/memory", { method: "POST", body: JSON.stringify(payload) }),
  get: (id) => request(`/memory/${id}`, { method: "GET" }),
  update: (id, payload) => request(`/memory/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  delete: (id) => request(`/memory/${id}`, { method: "DELETE" }),
};

// ----------------------------------------------------
// CAPABILITIES API
// ----------------------------------------------------
export const capabilitiesApi = {
  get: () => request("/capabilities", { method: "GET" }),
};

// ----------------------------------------------------
// VISION API
// ----------------------------------------------------
export const visionApi = {
  analyze: (payload) => {
    if (payload instanceof FormData) {
      return request("/vision/analyze", { method: "POST", body: payload });
    }
    return request("/vision/analyze", { method: "POST", body: JSON.stringify(payload) });
  },
};

// ----------------------------------------------------
// IMAGE GENERATION API
// ----------------------------------------------------
export const imageGenApi = {
  generate: (payload) => request("/image-generation/generate", { method: "POST", body: JSON.stringify(payload) }),
};

// ----------------------------------------------------
// WEB SEARCH API
// ----------------------------------------------------
export const webSearchApi = {
  search: (payload) => request("/web-search/query", { method: "POST", body: JSON.stringify(payload) }),
};

// ----------------------------------------------------
// PLACES SEARCH API
// ----------------------------------------------------
export const placesApi = {
  search: (payload) => request("/places/search", { method: "POST", body: JSON.stringify(payload) }),
  details: (placeId) => request(`/places/details/${placeId}`, { method: "GET" }),
};

// ----------------------------------------------------
// VOICE API (STT & TTS)
// ----------------------------------------------------
export const voiceApi = {
  transcribe: (formData) => request("/voice/transcribe", { method: "POST", body: formData }),
  synthesize: (payload) => request("/voice/synthesize", { method: "POST", body: JSON.stringify(payload) }),
};

// ----------------------------------------------------
// DEEP RESEARCH API
// ----------------------------------------------------
export const researchApi = {
  run: (payload) => request("/research/run", { method: "POST", body: JSON.stringify(payload) }),
};

// ----------------------------------------------------
// INTEGRATIONS API
// ----------------------------------------------------
export const integrationsApi = {
  list: () => request("/integrations", { method: "GET" }),
  connect: (payload) => request("/integrations/connect", { method: "POST", body: JSON.stringify(payload) }),
  disconnect: (provider) => request(`/integrations/disconnect/${provider}`, { method: "POST" }),
};

// ----------------------------------------------------
// AI UTILITIES API
// ----------------------------------------------------
export const aiUtilsApi = {
  explainCode: (payload) => request("/ai/explain-code", { method: "POST", body: JSON.stringify(payload) }),
  summarizeText: (payload) => request("/ai/summarize", { method: "POST", body: JSON.stringify(payload) }),
  translateText: (payload) => request("/ai/translate", { method: "POST", body: JSON.stringify(payload) }),
  rewriteText: (payload) => request("/ai/rewrite", { method: "POST", body: JSON.stringify(payload) }),
  fixGrammar: (payload) => request("/ai/fix-grammar", { method: "POST", body: JSON.stringify(payload) }),
  customPrompt: (payload) => request("/ai/custom-prompt", { method: "POST", body: JSON.stringify(payload) }),
};

// ----------------------------------------------------
// ANALYTICS & REPORTS API
// ----------------------------------------------------
export const analyticsApi = {
  getStats: () => request("/analytics/me", { method: "GET" }),
  getDailyUsage: () => request("/analytics/me/daily", { method: "GET" }),
  getMonthlyUsage: () => request("/analytics/me/monthly", { method: "GET" }),
};

export default {
  setAuthToken,
  getAuthToken,
  auth: authApi,
  conversations: conversationApi,
  messages: messageApi,
  folders: folderApi,
  csv: csvApi,
  memory: memoryApi,
  capabilities: capabilitiesApi,
  vision: visionApi,
  imageGen: imageGenApi,
  webSearch: webSearchApi,
  places: placesApi,
  voice: voiceApi,
  research: researchApi,
  integrations: integrationsApi,
  aiUtils: aiUtilsApi,
  analytics: analyticsApi,
};
