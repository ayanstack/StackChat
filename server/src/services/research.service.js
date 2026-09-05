import getAIProvider from "../ai/aiProvider.factory.js";
import { env } from "../config/env.js";
import ApiError from "../utils/ApiError.js";
import webSearchService from "./webSearch.service.js";

export const performDeepResearch = async ({ topic, depth = "standard", focusAreas = [] }) => {
  if (!env.GEMINI_API_KEY) {
    throw new ApiError(503, "Deep research provider (Gemini API) is NOT_CONFIGURED on the server");
  }

  const provider = getAIProvider("gemini");
  const focusText = focusAreas.length > 0 ? `\nKey Focus Areas: ${focusAreas.join(", ")}` : "";

  // 1. Gather web intelligence if search provider is available
  let searchContext = "";
  let sources = [];

  try {
    const searchRes = await webSearchService.searchWeb({ query: topic, maxResults: 5 });
    if (searchRes && searchRes.results) {
      sources = searchRes.results.map((r) => ({ title: r.title, url: r.url }));
      searchContext = `\n\n[Real-time Web Search Intelligence]:\n` +
        searchRes.results.map((r, i) => `[Source ${i + 1} - ${r.title} (${r.url})]:\n${r.content}`).join("\n\n");
    }
  } catch {
    // If search is not configured or fails, fallback to AI deep knowledge synthesis
    searchContext = "\n\n[Note: Real-time search provider not active. Synthesizing from deep foundational AI model knowledge.]";
  }

  const prompt = `Conduct an exhaustive, high-level research investigation on the following subject:
Topic: "${topic}"
Depth: ${depth.toUpperCase()}${focusText}${searchContext}

Generate a comprehensive, publication-grade research briefing formatted in Markdown with the following clear sections:
# Executive Summary
# Core Background & Context
# Detailed Technical / Domain Analysis
# Key Findings & Empirical Data Points
# Multi-Perspective Breakdown (Pros/Cons, Challenges, Trade-offs)
# Future Outlook & Strategic Recommendations
# Synthesized References & Citations

Be thorough, precise, and objective.`;

  const result = await provider.generateReply({
    messages: [{ role: "user", content: prompt }],
    systemPrompt: "You are an elite research scientist and senior strategic analyst. Provide rigorous, structured, and citation-backed research analyses.",
    model: "gemini-3.6-flash",
  });

  return {
    topic,
    depth,
    focusAreas,
    report: result.content,
    sources,
    metadata: result.metadata,
    generatedAt: new Date().toISOString(),
  };
};

export default {
  performDeepResearch,
};
