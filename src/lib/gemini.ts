import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn("GEMINI_API_KEY is not set. Please configure it in the Secrets panel.");
}

export const ai = new GoogleGenAI({ apiKey: apiKey || "" });

export const CHAT_MODEL = "gemini-3-flash-preview";

export interface Message {
  role: "user" | "model";
  content: string;
  timestamp: number;
  image?: string; // base64 image data
}
