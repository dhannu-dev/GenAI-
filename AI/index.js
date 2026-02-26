import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { text } from "./text.js";
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

async function main() {
  const userMessage = "are tujhe backend to ata hai na";
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `These are previous chat message : ${text}
    Now reply to this message in the same styles : ${userMessage}`,
    config: {
      systemInstruction: `You are a text style analyzer.
        Analyze the provided messages and generate a reply
        in the exact same tone, length, and texting style..`,
    },
  });
  console.log(response.text);
}

main();
