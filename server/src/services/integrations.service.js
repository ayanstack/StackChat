import ApiError from "../utils/ApiError.js";

const PROVIDER_CONFIG = {
  "google-drive": {
    name: "Google Drive",
    configured: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    authType: "oauth2",
    scopes: ["https://www.googleapis.com/auth/drive.readonly"],
  },
  github: {
    name: "GitHub",
    configured: Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
    authType: "oauth2",
    scopes: ["repo", "read:user"],
  },
  notion: {
    name: "Notion",
    configured: Boolean(process.env.NOTION_API_KEY || (process.env.NOTION_CLIENT_ID && process.env.NOTION_CLIENT_SECRET)),
    authType: "oauth2",
  },
  slack: {
    name: "Slack",
    configured: Boolean(process.env.SLACK_BOT_TOKEN || (process.env.SLACK_CLIENT_ID && process.env.SLACK_CLIENT_SECRET)),
    authType: "oauth2",
    scopes: ["channels:read", "chat:write"],
  },
};

export const getIntegrationsStatus = async (user) => {
  const integrations = Object.keys(PROVIDER_CONFIG).map((key) => {
    const conf = PROVIDER_CONFIG[key];
    const isConnected = Boolean(user.integrations && user.integrations[key]?.connected);

    return {
      id: key,
      name: conf.name,
      status: conf.configured ? (isConnected ? "CONNECTED" : "AVAILABLE") : "NOT_CONFIGURED",
      authType: conf.authType,
      connected: isConnected,
      connectedAt: user.integrations?.[key]?.connectedAt || null,
      lastSyncedAt: user.integrations?.[key]?.lastSyncedAt || null,
    };
  });

  return integrations;
};

export const connectIntegration = async (user, { provider, authCode, apiKey, settings = {} }) => {
  const conf = PROVIDER_CONFIG[provider];
  if (!conf) {
    throw ApiError.badRequest(`Unknown integration provider: ${provider}`);
  }

  if (!conf.configured && !apiKey) {
    throw new ApiError(503, `Integration provider (${conf.name}) is NOT_CONFIGURED on the server`);
  }

  // Save connection to user model
  if (!user.integrations) user.integrations = {};
  user.integrations[provider] = {
    connected: true,
    connectedAt: new Date(),
    lastSyncedAt: new Date(),
    settings,
  };

  user.markModified("integrations");
  await user.save();

  return {
    provider,
    status: "CONNECTED",
    connectedAt: user.integrations[provider].connectedAt,
  };
};

export const disconnectIntegration = async (user, provider) => {
  if (user.integrations && user.integrations[provider]) {
    user.integrations[provider].connected = false;
    user.integrations[provider].disconnectedAt = new Date();
    user.markModified("integrations");
    await user.save();
  }

  return {
    provider,
    status: "DISCONNECTED",
  };
};

export default {
  getIntegrationsStatus,
  connectIntegration,
  disconnectIntegration,
};
