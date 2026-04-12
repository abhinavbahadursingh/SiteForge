"use strict";
// import "dotenv/config";
// import express from "express";
// import cors from "cors";
// import { GoogleGenAI } from "@google/genai";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// import { BASE_PROMPT, getSystemPrompt } from "./prompts";
// import { basePrompt as nodeBasePrompt } from "./defaults/node";
// import { basePrompt as reactBasePrompt } from "./defaults/react";
// const app = express();
// app.use(cors());
// app.use(express.json());
// const ai = new GoogleGenAI({
//   apiKey: process.env.GEMINI_API_KEY!,
// });
// // ================= TEMPLATE =================
// app.post("/templates", async (req, res) => {
//   try {
//     const prompt = req.body.prompt;
//     if (!prompt) {
//       return res.status(400).json({ message: "Prompt missing" });
//     }
//     const response = await ai.models.generateContent({
//       model: "gemini-2.5-flash",
//       contents: prompt,
//       config: {
//         systemInstruction:
//           "Return either node or react based on what do you think this project should be. Only return a single word either 'node' or 'react'. Do not return anything extra",
//       },
//     });
//     const answer = response.text?.trim().toLowerCase();
//     // 🔥 REACT
//     if (answer === "react") {
//       return res.json({
//         prompts: [
//           BASE_PROMPT,
//           `Here is an artifact that contains all files of the project visible to you.
// Consider the contents of ALL files in the project.
// ${reactBasePrompt}
// Here is a list of files that exist on the file system but are not being shown to you:
//   - .gitignore
//   - package-lock.json
// `,
//         ],
//         uiPrompts: [reactBasePrompt],
//       });
//     }
//     // 🔥 NODE
//     if (answer === "node") {
//       return res.json({
//         prompts: [
//           BASE_PROMPT,
//           `Here is an artifact that contains all files of the project visible to you.
// Consider the contents of ALL files in the project.
// ${nodeBasePrompt}
// Here is a list of files that exist on the file system but are not being shown to you:
//   - .gitignore
//   - package-lock.json
// `,
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
// // ================= CHAT =================
// app.post("/chat", async (req, res) => {
//   try {
//     const messages = req.body.messages;
//     if (!messages || messages.length === 0) {
//       return res.status(400).json({ message: "Messages missing" });
//     }
//     const contents = messages
//       .map((m: any) => m?.content)
//       .filter((c: string) => c && c.trim() !== "");
//     if (contents.length === 0) {
//       return res.status(400).json({ message: "Empty contents" });
//     }
//     // FIX: stream plain text instead of res.json()
//     res.setHeader("Content-Type", "text/plain; charset=utf-8");
//     res.setHeader("Transfer-Encoding", "chunked");
//     res.setHeader("X-Accel-Buffering", "no"); // disable nginx buffering if behind proxy
//     const stream = await ai.models.generateContentStream({
//       model: "gemini-2.5-flash",
//       contents: contents,
//       config: {
//         systemInstruction: getSystemPrompt(),
//       },
//     });
//     for await (const chunk of stream) {
//       const text = chunk.text;
//       if (text) {
//         res.write(text);
//       }
//     }
//     res.end();
//   } catch (err) {
//     console.error("CHAT ERROR:", err);
//     // Headers may already be sent if streaming started
//     if (!res.headersSent) {
//       res.status(500).json({ message: "Chat failed" });
//     } else {
//       res.end();
//     }
//   }
// });
// // ================= HEALTH =================
// app.get("/", (req, res) => {
//   res.send("Backend running 🚀");
// });
// // ================= SERVER =================
// app.listen(3000, () => {
//   console.log("Server running on http://localhost:3000");
// });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const groq_sdk_1 = __importDefault(require("groq-sdk")); // 1. Change Import
const prompts_1 = require("./prompts");
const node_1 = require("./defaults/node");
const react_1 = require("./defaults/react");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// 2. Initialize Groq Client
const groq = new groq_sdk_1.default({
    apiKey: process.env.GROQ_API_KEY,
});
app.use((req, res, next) => {
    res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    next();
});
// ================= TEMPLATE =================
app.post("/templates", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const prompt = req.body.prompt;
        if (!prompt) {
            return res.status(400).json({ message: "Prompt missing" });
        }
        // 3. Update Template logic for Groq
        const chatCompletion = yield groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "Return either node or react based on what do you think this project should be. Only return a single word either 'node' or 'react'. Do not return anything extra",
                },
                {
                    role: "user",
                    content: prompt,
                },
            ],
            model: "llama-3.3-70b-versatile", // Or your preferred Groq model
        });
        const answer = (_c = (_b = (_a = chatCompletion.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.trim().toLowerCase();
        if (answer === "react") {
            return res.json({
                prompts: [
                    prompts_1.BASE_PROMPT,
                    `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${react_1.basePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n - .gitignore\n - package-lock.json\n`,
                ],
                uiPrompts: [react_1.basePrompt],
            });
        }
        if (answer === "node") {
            return res.json({
                prompts: [
                    prompts_1.BASE_PROMPT,
                    `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${node_1.basePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n - .gitignore\n - package-lock.json\n`,
                ],
                uiPrompts: [node_1.basePrompt],
            });
        }
        return res.status(403).json({ message: "Invalid response from model" });
    }
    catch (err) {
        console.error("TEMPLATE ERROR:", err);
        res.status(500).json({ message: "Template generation failed" });
    }
}));
// ================= CHAT =================
app.post("/chat", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, e_1, _b, _c;
    var _d, _e;
    try {
        const messages = req.body.messages; // Expects [{role: 'user', content: '...'}]
        if (!messages || messages.length === 0) {
            return res.status(400).json({ message: "Messages missing" });
        }
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.setHeader("Transfer-Encoding", "chunked");
        res.setHeader("X-Accel-Buffering", "no");
        // 4. Update Streaming logic for Groq
        const stream = yield groq.chat.completions.create({
            messages: [
                { role: "system", content: (0, prompts_1.getSystemPrompt)() },
                ...messages, // Groq expects the full message history
            ],
            model: "llama-3.3-70b-versatile",
            stream: true,
        });
        try {
            for (var _f = true, stream_1 = __asyncValues(stream), stream_1_1; stream_1_1 = yield stream_1.next(), _a = stream_1_1.done, !_a; _f = true) {
                _c = stream_1_1.value;
                _f = false;
                const chunk = _c;
                const content = ((_e = (_d = chunk.choices[0]) === null || _d === void 0 ? void 0 : _d.delta) === null || _e === void 0 ? void 0 : _e.content) || "";
                if (content) {
                    res.write(content);
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (!_f && !_a && (_b = stream_1.return)) yield _b.call(stream_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        res.end();
    }
    catch (err) {
        console.error("CHAT ERROR:", err);
        if (!res.headersSent) {
            res.status(500).json({ message: "Chat failed" });
        }
        else {
            res.end();
        }
    }
}));
// ================= HEALTH & SERVER =================
app.get("/", (req, res) => res.send("Backend running on Groq 🚀"));
app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
