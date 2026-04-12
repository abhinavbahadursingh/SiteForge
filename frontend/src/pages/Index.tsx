import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, ArrowRight, Code2, Layers, Zap } from "lucide-react";
import axios from 'axios'
import { BACKEND_URL } from "@/config";

const Index = () => {
  const [prompt, setPrompt] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      navigate("/builder", { state: { prompt: prompt.trim() } });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Code2 className="h-6 w-6 text-primary" />
          <span className="font-heading text-lg font-semibold tracking-tight text-foreground">
            SiteForge
          </span>
        </div>
        <div className="flex items-center gap-6 text-sm text-muted-foreground font-body">
          <span className="hover:text-foreground cursor-pointer transition-colors">Docs</span>
          <span className="hover:text-foreground cursor-pointer transition-colors">Templates</span>
          <span className="hover:text-foreground cursor-pointer transition-colors">Pricing</span>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/10 blur-[120px] animate-pulse-glow pointer-events-none" />

        <div className="relative z-10 max-w-2xl w-full text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs font-heading tracking-wide">
            <Sparkles className="h-3.5 w-3.5" />
            AI-Powered Website Builder
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold leading-tight tracking-tight">
            Describe it.{" "}
            <span className="gradient-text">We build it.</span>
          </h1>

          <p className="text-muted-foreground text-lg font-body max-w-md mx-auto leading-relaxed">
            Turn your ideas into fully functional websites with a single prompt. No code required.
          </p>

          {/* Prompt Input */}
          <form onSubmit={handleSubmit} className="relative group">
            <div className="relative rounded-xl border border-border bg-card transition-all duration-300 group-focus-within:glow-border">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the website you want to build..."
                rows={3}
                className="w-full bg-transparent px-5 py-4 text-foreground font-body text-sm placeholder:text-muted-foreground/60 resize-none focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
              <div className="flex items-center justify-between px-4 pb-3">
                <span className="text-xs text-muted-foreground font-heading">
                  Press Enter to generate
                </span>
                <button
                  type="submit"
                  disabled={!prompt.trim()}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-heading font-medium hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Generate
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </form>

          {/* Feature chips */}
          <div className="flex items-center justify-center gap-4 flex-wrap pt-2">
            {[
              { icon: Zap, label: "Instant generation" },
              { icon: Layers, label: "Step-by-step build" },
              { icon: Code2, label: "Full source code" },
            ].map((f) => (
              <div
                key={f.label}
                className="flex items-center gap-2 text-xs text-muted-foreground font-body"
              >
                <f.icon className="h-3.5 w-3.5 text-primary/70" />
                {f.label}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
