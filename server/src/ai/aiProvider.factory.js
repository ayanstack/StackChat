import geminiProvider from "./providers/gemini.provider.js";
import { AI_PROVIDERS } from "../constants/enums.js";
import ApiError from "../utils/ApiError.js";

const providers = {
  [AI_PROVIDERS.GEMINI]: geminiProvider,
};

function getAIProvider(providerName) {
  const provider = providers[providerName] || providers[AI_PROVIDERS.GEMINI];

  if (!provider) {
    throw ApiError.badRequest(
      `AI provider "${providerName}" is not supported`
    );
  }

  return provider;
}

export default getAIProvider;