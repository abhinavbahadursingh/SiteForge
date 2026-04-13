import "dotenv/config";
import express from "express";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";

import { BASE_PROMPT, getSystemPrompt } from "./prompts";
import { basePrompt as nodeBasePrompt } from "./defaults/node";
import { basePrompt as reactBasePrompt } from "./defaults/react";

const app = express();
app.use(cors());
app.use(express.json());

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

// ================= TEMPLATE =================
app.post("/templates", async (req, res) => {
  try {
    const prompt = req.body.prompt;

    if (!prompt) {
      return res.status(400).json({ message: "Prompt missing" });
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction:
          "Return either node or react based on what do you think this project should be. Only return a single word either 'node' or 'react'. Do not return anything extra",
      },
    });

    const answer = response.text?.trim().toLowerCase();

    // 🔥 REACT
    if (answer === "react") {
      return res.json({
        prompts: [
          BASE_PROMPT,
          `Here is an artifact that contains all files of the project visible to you.
Consider the contents of ALL files in the project.

${reactBasePrompt}

Here is a list of files that exist on the file system but are not being shown to you:

  - .gitignore
  - package-lock.json
`,
        ],
        uiPrompts: [reactBasePrompt],
      });
    }

    // 🔥 NODE
    if (answer === "node") {
      return res.json({
        prompts: [
          BASE_PROMPT,
          `Here is an artifact that contains all files of the project visible to you.
Consider the contents of ALL files in the project.

${nodeBasePrompt}

Here is a list of files that exist on the file system but are not being shown to you:

  - .gitignore
  - package-lock.json
`,
        ],
        uiPrompts: [nodeBasePrompt],
      });
    }

    return res.status(403).json({ message: "Invalid response from model" });

  } catch (err) {
    console.error("TEMPLATE ERROR:", err);
    res.status(500).json({ message: "Template generation failed" });
  }
});

// ================= CHAT =================
// ================= CHAT =================
app.post("/chat", async (req, res) => {
  try {
    const messages = req.body.messages;

    if (!messages || messages.length === 0) {
      return res.status(400).json({ message: "Messages missing" });
    }

    const contents = messages
      .map((m: any) => m?.content)
      .filter((c: string) => c && c.trim() !== "");

    if (contents.length === 0) {
      return res.status(400).json({ message: "Empty contents" });
    }

    // FIX: stream plain text instead of res.json()
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");
    res.setHeader("X-Accel-Buffering", "no"); // disable nginx buffering if behind proxy

    const stream = await ai.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents: contents,
      config: {
        systemInstruction: getSystemPrompt(),
      },
    });

    for await (const chunk of stream) {
      const text = chunk.text;
      if (text) {
        res.write(text);
      }
    }

    res.end();

  } catch (err) {
    console.error("CHAT ERROR:", err);
    // Headers may already be sent if streaming started
    if (!res.headersSent) {
      res.status(500).json({ message: "Chat failed" });
    } else {
      res.end();
    }
  }
});
// ================= HEALTH =================
app.get("/", (req, res) => {
  res.send("Backend running 🚀");
});

// ================= SERVER =================
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});




// import "dotenv/config";
// import express from "express";
// import cors from "cors";
// import Groq from "groq-sdk"; // 1. Change Import

// import { BASE_PROMPT, getSystemPrompt } from "./prompts";
// import { basePrompt as nodeBasePrompt } from "./defaults/node";
// import { basePrompt as reactBasePrompt } from "./defaults/react";

// const app = express();
// app.use(cors());
// app.use(express.json());

// // 2. Initialize Groq Client
// const groq = new Groq({
//   apiKey: process.env.GROQ_API_KEY,
// });

// // ================= TEMPLATE =================
// app.post("/templates", async (req, res) => {
//   try {
//     const prompt = req.body.prompt;

//     if (!prompt) {
//       return res.status(400).json({ message: "Prompt missing" });
//     }

//     // 3. Update Template logic for Groq
//     const chatCompletion = await groq.chat.completions.create({
//       messages: [
//         {
//           role: "system",
//           content: "Return either node or react based on what do you think this project should be. Only return a single word either 'node' or 'react'. Do not return anything extra",
//         },
//         {
//           role: "user",
//           content: prompt,
//         },
//       ],
//       model: "llama-3.3-70b-versatile", // Or your preferred Groq model
//     });

//     const answer = chatCompletion.choices[0]?.message?.content?.trim().toLowerCase();

//     if (answer === "react") {
//       return res.json({
//         prompts: [
//           BASE_PROMPT,
//           `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${reactBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n - .gitignore\n - package-lock.json\n`,
//         ],
//         uiPrompts: [reactBasePrompt],
//       });
//     }

//     if (answer === "node") {
//       return res.json({
//         prompts: [
//           BASE_PROMPT,
//           `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${nodeBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n - .gitignore\n - package-lock.json\n`,
//         ],
//         uiPrompts: [nodeBasePrompt],
//       });
//     }

//     return res.status(403).json({ message: "Invalid response from model" });
//   } catch (err) {
//     console.error("TEMPLATE ERROR:", err);
//     res.status(500).json({ message: "Template generation failed" });
//   }
// });

// // ================= CHAT =================
// app.post("/chat", async (req, res) => {
//   try {
//     const messages = req.body.messages; // Expects [{role: 'user', content: '...'}]

//     if (!messages || messages.length === 0) {
//       return res.status(400).json({ message: "Messages missing" });
//     }

//     res.setHeader("Content-Type", "text/plain; charset=utf-8");
//     res.setHeader("Transfer-Encoding", "chunked");
//     res.setHeader("X-Accel-Buffering", "no");

//     // 4. Update Streaming logic for Groq
//     const stream = await groq.chat.completions.create({
//       messages: [
//         { role: "system", content: getSystemPrompt() },
//         ...messages, // Groq expects the full message history
//       ],
//       model: "llama-3.3-70b-versatile",
//       stream: true,
//     });

//     for await (const chunk of stream) {
//       const content = chunk.choices[0]?.delta?.content || "";
//       if (content) {
//         res.write(content);
//       }
//     }

//     res.end();
//   } catch (err) {
//     console.error("CHAT ERROR:", err);
//     if (!res.headersSent) {
//       res.status(500).json({ message: "Chat failed" });
//     } else {
//       res.end();
//     }
//   }
// });

// // ================= HEALTH & SERVER =================
// app.get("/", (req, res) => res.send("Backend running on Groq 🚀"));

// app.listen(3000, () => {
//   console.log("Server running on http://localhost:3000");
// });