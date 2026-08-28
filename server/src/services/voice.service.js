import OpenAI from "openai";
import { env } from "../config/env.js";
import ApiError from "../utils/ApiError.js";

export const speechToText = async (file) => {
  if (!file) {
    throw ApiError.badRequest("Audio file is required for Speech-to-Text");
  }

  if (env.OPENAI_API_KEY) {
    try {
      const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
      // Create File object from Buffer
      const audioFile = new File([file.buffer], file.originalname || "audio.mp3", {
        type: file.mimetype || "audio/mpeg",
      });

      const transcription = await openai.audio.transcriptions.create({
        file: audioFile,
        model: "whisper-1",
      });

      return {
        provider: "openai-whisper",
        text: transcription.text,
      };
    } catch (error) {
      throw ApiError.internal(`OpenAI Whisper error: ${error.message}`);
    }
  }

  throw new ApiError(503, "Voice STT provider (OpenAI Whisper) is NOT_CONFIGURED on the server");
};

export const textToSpeech = async ({ text, voice = "alloy", speed = 1.0, format = "mp3" }) => {
  if (env.OPENAI_API_KEY) {
    try {
      const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
      const mp3Response = await openai.audio.speech.create({
        model: "tts-1",
        voice,
        input: text,
        speed,
        response_format: format,
      });

      const buffer = Buffer.from(await mp3Response.arrayBuffer());
      return {
        provider: "openai-tts",
        audioBase64: buffer.toString("base64"),
        mimeType: `audio/${format}`,
      };
    } catch (error) {
      throw ApiError.internal(`OpenAI TTS error: ${error.message}`);
    }
  }

  throw new ApiError(503, "Voice TTS provider (OpenAI TTS) is NOT_CONFIGURED on the server");
};

export default {
  speechToText,
  textToSpeech,
};
