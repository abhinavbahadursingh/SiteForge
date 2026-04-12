import { GoogleGenAI } from "@google/genai";
require("dotenv").config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

async function main() {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: "What is 2+2",
  });

  console.log(response.text);
}

main();