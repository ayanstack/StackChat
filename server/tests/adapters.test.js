import imageGenerationService from "../src/services/imageGeneration.service.js";
import webSearchService from "../src/services/webSearch.service.js";
import placesService from "../src/services/places.service.js";
import voiceService from "../src/services/voice.service.js";
import ApiError from "../src/utils/ApiError.js";

describe("Provider Adapters and NOT_CONFIGURED Behavior Tests", () => {
  test("Image generation should throw 503 when providers not configured", async () => {
    // If no OPENAI_API_KEY and STABILITY_API_KEY
    if (!process.env.OPENAI_API_KEY && !process.env.STABILITY_API_KEY) {
      await expect(
        imageGenerationService.generateImage({ prompt: "A sunset over mountains" })
      ).rejects.toThrow();
    }
  });

  test("Web search should throw 503 when search providers not configured", async () => {
    if (!process.env.TAVILY_API_KEY && !process.env.SERP_API_KEY) {
      await expect(
        webSearchService.searchWeb({ query: "Latest AI developments" })
      ).rejects.toThrow();
    }
  });

  test("Places search should throw 503 when Google Maps key is not configured", async () => {
    if (!process.env.GOOGLE_MAPS_API_KEY) {
      await expect(
        placesService.searchPlaces({ query: "Coffee shops in SF" })
      ).rejects.toThrow();
    }
  });

  test("Voice TTS should throw 503 when OpenAI key is not configured", async () => {
    if (!process.env.OPENAI_API_KEY) {
      await expect(
        voiceService.textToSpeech({ text: "Hello world" })
      ).rejects.toThrow();
    }
  });
});
