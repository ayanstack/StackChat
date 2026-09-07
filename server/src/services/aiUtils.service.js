import getAIProvider from "../ai/aiProvider.factory.js";
import { env } from "../config/env.js";

const MODEL = "gemini-3.5-flash-lite";

async function callAI(systemPrompt, userContent) {
  const provider = getAIProvider(env.AI_PROVIDER);
  const result = await provider.generateReply({
    messages: [{ role: "user", content: userContent }],
    systemPrompt,
    model: MODEL,
  });
  return result;
}

async function explainCode(code, language) {
  const systemPrompt = `You are an expert programming teacher. Explain the given ${language || "code"} clearly and simply, breaking down what each important part does. Use simple language suitable for a learner.`;
  return callAI(systemPrompt, code);
}

async function summarizeText(text) {
  const systemPrompt = "You are a summarization expert. Summarize the given text concisely while keeping all key points. Keep it to 3-5 sentences unless the text is very long.";
  return callAI(systemPrompt, text);
}

async function translateText(text, targetLanguage) {
  const systemPrompt = `You are a professional translator. Translate the given text into ${targetLanguage}. Only return the translated text, nothing else.`;
  return callAI(systemPrompt, text);
}

async function rewriteText(text) {
  const systemPrompt = "You are a writing expert. Rewrite the given text to improve clarity, flow, and style while keeping the original meaning intact.";
  return callAI(systemPrompt, text);
}

async function fixGrammar(text) {
  const systemPrompt = "You are a grammar correction expert. Fix all grammar, spelling, and punctuation mistakes in the given text. Only return the corrected text, nothing else.";
  return callAI(systemPrompt, text);
}

async function customPrompt(systemPrompt, userMessage) {
  return callAI(systemPrompt, userMessage);
}

export default {
  explainCode,
  summarizeText,
  translateText,
  rewriteText,
  fixGrammar,
  customPrompt,
};