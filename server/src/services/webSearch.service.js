import ApiError from "../utils/ApiError.js";

export const searchWeb = async ({ query, maxResults = 5, searchDepth = "basic", includeAnswer = true }) => {
  // 1. Check Tavily
  if (process.env.TAVILY_API_KEY) {
    try {
      const response = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: process.env.TAVILY_API_KEY,
          query,
          search_depth: searchDepth,
          include_answer: includeAnswer,
          max_results: maxResults,
        }),
      });

      if (!response.ok) {
        throw new Error(`Tavily error: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        provider: "tavily",
        query,
        answer: data.answer || null,
        results: (data.results || []).map((r) => ({
          title: r.title,
          url: r.url,
          content: r.content,
          score: r.score,
        })),
      };
    } catch (error) {
      throw ApiError.internal(`Tavily Web Search failed: ${error.message}`);
    }
  }

  // 2. Check SerpAPI
  if (process.env.SERP_API_KEY) {
    try {
      const url = `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&num=${maxResults}&api_key=${process.env.SERP_API_KEY}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`SerpAPI error: ${response.statusText}`);
      }

      const data = await response.json();
      const organic = data.organic_results || [];

      return {
        provider: "serpapi",
        query,
        answer: data.answer_box?.answer || data.answer_box?.snippet || null,
        results: organic.slice(0, maxResults).map((r) => ({
          title: r.title,
          url: r.link,
          content: r.snippet,
          position: r.position,
        })),
      };
    } catch (error) {
      throw ApiError.internal(`SerpAPI Web Search failed: ${error.message}`);
    }
  }

  throw new ApiError(503, "Web search provider (Tavily/SerpAPI) is NOT_CONFIGURED on the server");
};

export default {
  searchWeb,
};
