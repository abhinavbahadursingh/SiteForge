# SiteForge 🚀

SiteForge is an AI-powered application builder that generates full-stack web applications based on simple user prompts. It streamlines the development process by handling boilerplate code, project structure, and component generation, allowing you to go from idea to functional prototype in minutes.

![SiteForge Banner](https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=2070&auto=format&fit=crop)

## ✨ Features

-   **Prompt-to-App:** Transform your ideas into code with intuitive AI-driven generation.
-   **Interactive Builder:** Watch your application take shape in real-time with step-by-step build tracking.
-   **Integrated Code Editor:** View and inspect generated code using the powerful Monaco Editor.
-   **Celebratory Success:** Beautiful confetti and success popups when your project is ready.
-   **Developer-Friendly Tech:** Built on modern standards for maximum performance and scalability.
-   **Modern UI:** Dark-themed, sleek interface using Shadcn UI and Lucide icons.

## 🛠️ Tech Stack

### Frontend
-   **React (TypeScript):** For a robust and type-safe UI layer.
-   **Vite:** High-performance development server and bundler.
-   **Tailwind CSS:** Utility-first styling with custom animations.
-   **Shadcn UI:** High-quality, accessible UI components.
-   **Monaco Editor:** Industry-standard code editing experience.
-   **Lucide React:** Beautiful, consistent iconography.
-   **Canvas Confetti:** Engaging celebratory feedback.

### Backend
-   **Node.js & Express:** Scalable server-side architecture.
-   **Google Generative AI:** Powered by Google's latest AI models for intelligent code generation.
-   **Groq SDK:** High-speed AI inference for rapid response times.
-   **TypeScript:** Consistent type safety across the entire stack.

## 🚀 Getting Started

### Prerequisites
-   Node.js (v18 or higher recommended)
-   npm, yarn, or pnpm
-   An API key for Google Generative AI (Gemini) or Groq

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-abhinavbahadursingh/siteforge.git
    cd siteforge
    ```

2.  **Backend Setup:**
    ```bash
    cd be
    npm install
    cp .env.example .env
    ```
    *Edit the `.env` file and add your API keys.*

3.  **Frontend Setup:**
    ```bash
    cd ../frontend
    npm install
    ```

### Running the Project

1.  **Start the Backend:**
    ```bash
    cd be
    npm run dev
    ```

2.  **Start the Frontend:**
    ```bash
    cd frontend
    npm run dev
    ```

3.  **Open in Browser:**
    Navigate to `http://localhost:8080` (or the port shown in your terminal).

## 💡 Troubleshooting

### WebContainer Errors
If you encounter a `SharedArrayBuffer` error while booting the WebContainer, ensure that the following headers are set in your development environment (SiteForge handles this in `vite.config.ts`):
- `Cross-Origin-Embedder-Policy: require-corp`
- `Cross-Origin-Opener-Policy: same-origin`

## 📄 License
This project is licensed under the ISC License.

---

Built with ❤️ by the SiteForge Team.
