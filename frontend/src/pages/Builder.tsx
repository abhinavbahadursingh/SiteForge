import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import Editor from "@monaco-editor/react";
import { WebContainer } from "@webcontainer/api";
import {
  ChevronRight,
  ChevronDown,
  FileCode2,
  Folder,
  FolderOpen,
  File,
  CheckCircle2,
  Circle,
  Loader2,
  Share2,
  Settings,
  ExternalLink,
  Code2,
  Eye,
  ArrowLeft,
  Terminal,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";

import { BACKEND_URL } from "@/config";
import { parseXml } from "@/steps";

// ===== TYPES =====
export enum StepType {
  CreateFile,
  CreateFolder,
  EditFile,
  DeleteFile,
  RunScript,
}

export interface Step {
  id: number;
  title: string;
  type: StepType;
  description: string;
  status: "pending" | "running" | "done";
  code?: string;
  path?: string;
}

interface FileNode {
  name: string;
  path: string;
  type: "file" | "folder";
  children?: FileNode[];
  content?: string;
}

type WebContainerStatus =
  | "idle"
  | "booting"
  | "mounting"
  | "installing"
  | "starting"
  | "ready"
  | "error";

const WC_STATUS_LABELS: Record<WebContainerStatus, string> = {
  idle: "Waiting for build…",
  booting: "Booting WebContainer…",
  mounting: "Mounting files…",
  installing: "Installing dependencies…",
  starting: "Starting dev server…",
  ready: "Preview ready",
  error: "WebContainer error",
};

// ===== FILE TREE BUILDER =====
function buildFileTree(steps: Step[]): FileNode[] {
  const root: Record<string, any> = {};

  steps.forEach((step) => {
    if (
      (step.type !== StepType.CreateFile && step.type !== StepType.EditFile) ||
      !step.path
    )
      return;

    const parts = step.path.replace(/^\//, "").split("/");
    let current = root;

    parts.forEach((part, index) => {
      if (!current[part]) {
        current[part] = {
          name: part,
          path: parts.slice(0, index + 1).join("/"),
          type: index === parts.length - 1 ? "file" : "folder",
          children: {},
          content: "",
        };
      }
      if (index === parts.length - 1) {
        current[part].content = step.code || current[part].content;
      }
      current = current[part].children;
    });
  });

  const convert = (obj: Record<string, any>): FileNode[] =>
    Object.values(obj).map((node: any) => ({
      name: node.name,
      path: node.path,
      type: node.type,
      content: node.content,
      children:
        node.type === "folder" ? convert(node.children || {}) : undefined,
    }));

  return convert(root);
}

// ===== CONVERT FileNode[] → WebContainer FileSystemTree =====
function toWebContainerFS(files: FileNode[]): Record<string, any> {
  const processNode = (node: FileNode): any => {
    if (node.type === "file") {
      return { file: { contents: node.content ?? "" } };
    }
    const dir: Record<string, any> = {};
    node.children?.forEach((child) => {
      dir[child.name] = processNode(child);
    });
    return { directory: dir };
  };

  const result: Record<string, any> = {};
  files.forEach((node) => {
    result[node.name] = processNode(node);
  });
  return result;
}

// ===== HELPERS =====
function getFileColor(name: string) {
  const ext = name.split(".").pop()?.toLowerCase();
  const map: Record<string, string> = {
    tsx: "#61dafb", jsx: "#61dafb",
    ts: "#3178c6", js: "#f7df1e",
    css: "#563d7c", html: "#e34c26",
    json: "#f5a623", md: "#aaaaaa",
  };
  return map[ext || ""] || "#858585";
}

function getLang(name: string) {
  const ext = name.split(".").pop();
  if (ext === "ts" || ext === "tsx") return "typescript";
  if (ext === "js" || ext === "jsx") return "javascript";
  if (ext === "html") return "html";
  if (ext === "css") return "css";
  if (ext === "json") return "json";
  return "plaintext";
}

// ===== FILE TREE NODE =====
function FileTreeNode({
  node, selectedFile, onSelect, depth = 0, activeFilePath,
}: {
  node: FileNode;
  selectedFile: FileNode | null;
  onSelect: (f: FileNode) => void;
  depth?: number;
  activeFilePath?: string;
}) {
  const [open, setOpen] = useState(true);
  const isSelected = selectedFile?.path === node.path;
  const isActive = activeFilePath === node.path;

  if (node.type === "folder") {
    return (
      <div>
        <button
          onClick={() => setOpen((o) => !o)}
          style={{
            display: "flex", alignItems: "center", gap: "6px",
            width: "100%", textAlign: "left",
            padding: `3px 8px 3px ${depth * 12 + 8}px`,
            background: "none", border: "none", cursor: "pointer",
            borderRadius: "4px",
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "none")}
        >
          {open
            ? <ChevronDown size={11} style={{ color: "#555", flexShrink: 0 }} />
            : <ChevronRight size={11} style={{ color: "#555", flexShrink: 0 }} />}
          {open
            ? <FolderOpen size={13} style={{ color: "#dcb67a", flexShrink: 0 }} />
            : <Folder size={13} style={{ color: "#dcb67a", flexShrink: 0 }} />}
          <span style={{ fontSize: "12px", color: "#cccccc", fontFamily: "monospace" }}>
            {node.name}
          </span>
        </button>
        {open && node.children?.map((child) => (
          <FileTreeNode
            key={child.path} node={child} selectedFile={selectedFile}
            onSelect={onSelect} depth={depth + 1} activeFilePath={activeFilePath}
          />
        ))}
      </div>
    );
  }

  return (
    <button
      onClick={() => onSelect(node)}
      style={{
        display: "flex", alignItems: "center", gap: "6px", position: "relative",
        width: "100%", textAlign: "left",
        padding: `3px 8px 3px ${depth * 12 + 20}px`,
        background: isSelected ? "#37373d" : "none",
        border: "none", cursor: "pointer", borderRadius: "4px",
      }}
      onMouseEnter={(e) => {
        if (!isSelected) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
      }}
      onMouseLeave={(e) => {
        if (!isSelected) (e.currentTarget as HTMLElement).style.background = "none";
      }}
    >
      {isActive && !isSelected && (
        <span style={{
          position: "absolute", left: "6px", top: "50%", transform: "translateY(-50%)",
          width: "5px", height: "5px", borderRadius: "50%", background: "#4fc1ff",
          animation: "pulse 1.5s infinite",
        }} />
      )}
      <File size={13} style={{ color: getFileColor(node.name), flexShrink: 0 }} />
      <span style={{
        fontSize: "12px", fontFamily: "monospace",
        color: isSelected ? "white" : isActive ? "#4fc1ff" : "#cccccc",
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>
        {node.name}
      </span>
    </button>
  );
}

// ===== STEP ITEM =====
function StepItem({ step }: { step: Step }) {
  const isRunning = step.status === "running";
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: "10px",
      padding: "8px 12px", borderRadius: "6px",
      background: isRunning ? "#1e2a1e" : "transparent",
      border: isRunning ? "1px solid #2d5a2d" : "1px solid transparent",
      transition: "all 0.2s",
    }}>
      <div style={{ marginTop: "1px", flexShrink: 0 }}>
        {step.status === "done"
          ? <CheckCircle2 size={15} style={{ color: "#4ec94e" }} />
          : step.status === "running"
          ? <Loader2 size={15} style={{ color: "#4fc1ff", animation: "spin 1s linear infinite" }} />
          : <Circle size={15} style={{ color: "#2a2a2a" }} />}
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{
          fontSize: "12px", fontFamily: "monospace", fontWeight: 500,
          color: step.status === "pending" ? "#444" : "#cccccc",
          lineHeight: 1.4, margin: 0,
        }}>
          {step.title}
        </p>
        {step.path && (
          <p style={{
            fontSize: "11px", color: "#3a3a3a", fontFamily: "monospace",
            marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}>
            {step.type === StepType.RunScript ? "Running script" : step.path}
          </p>
        )}
      </div>
    </div>
  );
}

// ===== TYPEWRITER HOOK =====
function useTypewriter(target: string, speed = 10) {
  const [displayed, setDisplayed] = useState("");
  const rafRef = useRef<number>();
  const idxRef = useRef(0);

  useEffect(() => {
    if (target.length < idxRef.current) {
      idxRef.current = 0;
      setDisplayed("");
    }
  }, [target]);

  useEffect(() => {
    if (!target) { setDisplayed(""); idxRef.current = 0; return; }
    if (idxRef.current >= target.length) return;

    const tick = () => {
      idxRef.current = Math.min(idxRef.current + speed, target.length);
      setDisplayed(target.slice(0, idxRef.current));
      if (idxRef.current < target.length) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target]);

  return displayed;
}

// ===== MAIN BUILDER =====
const Builder = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const prompt = (location.state as { prompt?: string })?.prompt || "Build app";

  const [steps, setSteps] = useState<Step[]>([]);
  const [files, setFiles] = useState<FileNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [activeFilePath, setActiveFilePath] = useState<string>("");
  const [tab, setTab] = useState<"code" | "preview">("code");
  const [loading, setLoading] = useState(true);
  const [buildComplete, setBuildComplete] = useState(false);

  // WebContainer state
  const [wcStatus, setWcStatus] = useState<WebContainerStatus>("idle");
  const [wcUrl, setWcUrl] = useState<string>("");
  const [wcError, setWcError] = useState<string>("");
  const [terminalLines, setTerminalLines] = useState<string[]>([]);
  const [iframeKey, setIframeKey] = useState(0);

  const wcRef = useRef<WebContainer | null>(null);
  const hasRun = useRef(false);
  const wcLaunched = useRef(false);
  const terminalRef = useRef<HTMLDivElement>(null);

  const addLine = useCallback((line: string) => {
    setTerminalLines((prev) => [...prev.slice(-300), line]);
  }, []);

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalLines]);

  // ===== BOOT WEBCONTAINER =====
  useEffect(() => {
    (async () => {
      try {
        setWcStatus("booting");
        addLine("$ Booting WebContainer…");
        const wc = await WebContainer.boot();
        wcRef.current = wc;
        addLine("✓ WebContainer booted");
        setWcStatus("idle");
      } catch (err: any) {
        setWcStatus("error");
        setWcError(err.message || "Boot failed");
        addLine(`✗ ${err.message}`);
      }
    })();
  }, []);

  // ===== LAUNCH WEBCONTAINER (called once when build completes) =====
  const launchWebContainer = useCallback(async (currentFiles: FileNode[]) => {
    const wc = wcRef.current;
    if (!wc || currentFiles.length === 0) return;

    try {
      // Mount
      setWcStatus("mounting");
      addLine("\n$ Mounting project files…");
      await wc.mount(toWebContainerFS(currentFiles));
      addLine("✓ Files mounted");

      // npm install
      setWcStatus("installing");
      addLine("\n$ npm install");
      const install = await wc.spawn("npm", ["install"]);
      install.output.pipeTo(new WritableStream({
        write(data) {
          data.split("\n").filter(Boolean).forEach((l: string) => addLine(l));
        },
      }));
      const installCode = await install.exit;
      if (installCode !== 0) throw new Error(`npm install exited ${installCode}`);
      addLine("✓ Dependencies installed");

      // npm run dev
      setWcStatus("starting");
      addLine("\n$ npm run dev");
      const dev = await wc.spawn("npm", ["run", "dev"]);
      dev.output.pipeTo(new WritableStream({
        write(data) {
          data.split("\n").filter(Boolean).forEach((l: string) => addLine(l));
        },
      }));

      // Wait for server
      wc.on("server-ready", (_port, url) => {
        addLine(`\n✓ Server ready → ${url}`);
        setWcUrl(url);
        setWcStatus("ready");
        setTab("preview");
      });
    } catch (err: any) {
      setWcStatus("error");
      setWcError(err.message || "Launch failed");
      addLine(`\n✗ ${err.message}`);
    }
  }, [addLine]);

  // ===== STREAM INDIVIDUAL FILE WRITES TO WC =====
  const updateWcFile = useCallback(async (path: string, content: string) => {
    const wc = wcRef.current;
    if (!wc) return;
    try {
      const parts = path.split("/");
      if (parts.length > 1) {
        await wc.fs.mkdir(parts.slice(0, -1).join("/"), { recursive: true });
      }
      await wc.fs.writeFile(path, content);
    } catch { /* ignore during streaming */ }
  }, []);

  // ===== MAIN BUILD STREAM =====
  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    (async () => {
      try {
        setLoading(true);

        const res = await axios.post(`${BACKEND_URL}/templates`, { prompt });
        const { prompts, uiPrompts } = res.data;

        if (uiPrompts?.[0]) {
          setSteps(parseXml(uiPrompts[0]).map((s, i) => ({ ...s, id: i, status: "done" as const })));
        }

        const chatRes = await fetch(`${BACKEND_URL}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [
              ...prompts.map((p: string) => ({ role: "user", content: p })),
              { role: "user", content: prompt },
            ],
          }),
        });

        if (!chatRes.ok) throw new Error(`Chat ${chatRes.status}`);
        const reader = chatRes.body?.getReader();
        if (!reader) throw new Error("No body");

        const decoder = new TextDecoder();
        let fullText = "";
        let idOffset = 1000;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          fullText += decoder.decode(value, { stream: true });

          const parsed = parseXml(fullText);
          if (!parsed.length) continue;

          setSteps((prev) => {
            const prevMap = new Map(prev.map((s) => [`${s.type}:${s.path}`, s]));
            const merged = parsed.map((s, i) => ({
              ...(prevMap.get(`${s.type}:${s.path}`) ?? { ...s, id: idOffset++ }),
              code: s.code,
              status: i === parsed.length - 1 ? ("running" as const) : ("done" as const),
            }));
            const mergedKeys = new Set(merged.map((s) => `${s.type}:${s.path}`));
            return [
              ...prev.filter((s) => !mergedKeys.has(`${s.type}:${s.path}`)),
              ...merged,
            ];
          });
        }

        setSteps((prev) => prev.map((s) => ({ ...s, status: "done" as const })));
        setBuildComplete(true);
      } catch (err) {
        console.error("BUILD ERROR:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [prompt]);

  // ===== SYNC FILE TREE + AUTO OPEN ACTIVE FILE =====
  useEffect(() => {
    const tree = buildFileTree(steps);
    setFiles(tree);

    const runningStep = steps.find((s) => s.status === "running" && s.path);

    const findByPath = (nodes: FileNode[], path: string): FileNode | null => {
      for (const n of nodes) {
        if (n.path === path) return n;
        if (n.children) { const f = findByPath(n.children, path); if (f) return f; }
      }
      return null;
    };

    if (runningStep?.path) {
      setActiveFilePath(runningStep.path);
      const node = findByPath(tree, runningStep.path);
      if (node) {
        setSelectedFile(node);
        if (runningStep.code) updateWcFile(runningStep.path, runningStep.code);
        return;
      }
    }

    setSelectedFile((prev) => {
      if (!prev) {
        const first = (function find(nodes: FileNode[]): FileNode | null {
          for (const n of nodes) {
            if (n.type === "file") return n;
            if (n.children) { const f = find(n.children); if (f) return f; }
          }
          return null;
        })(tree);
        return first;
      }
      return findByPath(tree, prev.path) ?? prev;
    });
  }, [steps, updateWcFile]);

  // ===== LAUNCH WC WHEN BUILD COMPLETE =====
  useEffect(() => {
    
    if (buildComplete && files.length > 0 && wcRef.current && !wcLaunched.current) {
      wcLaunched.current = true;
      launchWebContainer(files);
    }
  }, [buildComplete, files, launchWebContainer]);

  // Derived
  const doneCount = steps.filter((s) => s.status === "done").length;
  const runningStep = steps.find((s) => s.status === "running");
  const isActiveBeingWritten = selectedFile?.path === activeFilePath && !buildComplete;
  const typedContent = useTypewriter(isActiveBeingWritten ? (selectedFile?.content ?? "") : "", 10);
  const editorContent = isActiveBeingWritten ? typedContent : (selectedFile?.content ?? "");

  // Shared button style helpers
  const tabStyle = (active: boolean): React.CSSProperties => ({
    display: "flex", alignItems: "center", gap: "6px",
    padding: "4px 12px", borderRadius: "6px",
    fontSize: "12px", fontFamily: "inherit", border: "none", cursor: "pointer",
    background: active ? "#1e1e2e" : "transparent",
    color: active ? "white" : "#555",
    transition: "all 0.15s",
  });

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden",
      background: "#0d0d12", color: "#cccccc",
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    }}>

      {/* HEADER */}
      <header style={{
        display: "flex", alignItems: "center", gap: "12px",
        padding: "0 16px", height: "44px",
        borderBottom: "1px solid #1e1e2e", background: "#0d0d12", flexShrink: 0,
      }}>
        <button onClick={() => navigate("/")} style={{
          padding: "4px", borderRadius: "4px", background: "none",
          border: "none", cursor: "pointer", color: "#555",
        }}>
          <ArrowLeft size={14} />
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Code2 size={16} style={{ color: "#4fc1ff" }} />
          <span style={{ fontSize: "13px", fontWeight: 600, color: "white" }}>SiteForge</span>
        </div>
        <span style={{ color: "#222", fontSize: "16px" }}>/</span>
        <span style={{ fontSize: "13px", color: "#444" }}>Builder</span>
        <div style={{ flex: 1, margin: "0 16px" }}>
          <div style={{
            padding: "3px 12px", borderRadius: "6px", fontSize: "12px",
            color: "#555", background: "#1a1a24", border: "1px solid #2a2a3a",
            maxWidth: "480px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {prompt}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginLeft: "auto" }}>
          {[<Share2 size={15} />, <Settings size={15} />].map((icon, i) => (
            <button key={i} style={{
              padding: "6px", borderRadius: "6px", background: "none",
              border: "none", color: "#444", cursor: "pointer",
            }}>
              {icon}
            </button>
          ))}
          <button style={{
            display: "flex", alignItems: "center", gap: "6px",
            padding: "5px 14px", borderRadius: "6px",
            background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
            color: "white", border: "none", fontSize: "12px",
            fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
          }}>
            Deploy <ExternalLink size={12} />
          </button>
        </div>
      </header>

      {/* 3-PANEL BODY */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* BUILD STEPS */}
        <div style={{
          width: "260px", flexShrink: 0, display: "flex", flexDirection: "column",
          borderRight: "1px solid #1e1e2e", overflow: "hidden",
        }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "8px 16px", borderBottom: "1px solid #1e1e2e", flexShrink: 0,
          }}>
            <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#333" }}>
              Build Steps
            </span>
            {steps.length > 0 && (
              <span style={{
                fontSize: "11px", padding: "2px 8px", borderRadius: "4px",
                background: "#1a1a24", color: "#4fc1ff", border: "1px solid #2a3a4a",
              }}>
                {doneCount}/{steps.length}
              </span>
            )}
          </div>
          {/* Progress */}
          <div style={{ height: "2px", background: "#111", flexShrink: 0 }}>
            <div style={{
              height: "100%",
              width: `${steps.length > 0 ? (doneCount / steps.length) * 100 : 0}%`,
              background: "linear-gradient(90deg, #4f46e5, #4fc1ff)",
              transition: "width 0.4s ease",
            }} />
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "8px", scrollbarWidth: "none" }}>
            {steps.map((s) => <StepItem key={s.id} step={s} />)}
            {loading && !steps.length && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "24px", justifyContent: "center" }}>
                <Loader2 size={14} style={{ color: "#4fc1ff", animation: "spin 1s linear infinite" }} />
                <span style={{ fontSize: "12px", color: "#333" }}>Initializing…</span>
              </div>
            )}
          </div>
        </div>

        {/* FILE EXPLORER */}
        <div style={{
          width: "200px", flexShrink: 0, display: "flex", flexDirection: "column",
          borderRight: "1px solid #1e1e2e", overflow: "hidden",
        }}>
          <div style={{ padding: "8px 16px", borderBottom: "1px solid #1e1e2e", flexShrink: 0 }}>
            <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#333" }}>
              Explorer
            </span>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "4px", scrollbarWidth: "none" }}>
            {files.map((n) => (
              <FileTreeNode
                key={n.path} node={n} selectedFile={selectedFile}
                onSelect={setSelectedFile} activeFilePath={activeFilePath}
              />
            ))}
            {!files.length && (
              <div style={{ padding: "16px", fontSize: "11px", color: "#2a2a2a", textAlign: "center" }}>
                Waiting for files…
              </div>
            )}
          </div>
        </div>

        {/* CODE / PREVIEW */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Tab bar */}
          <div style={{
            display: "flex", alignItems: "center", gap: "4px",
            padding: "5px 12px", borderBottom: "1px solid #1e1e2e", flexShrink: 0,
          }}>
            <button style={tabStyle(tab === "code")} onClick={() => setTab("code")}>
              <Code2 size={13} /> Code
            </button>
            <button style={tabStyle(tab === "preview")} onClick={() => setTab("preview")}>
              <Eye size={13} /> Preview
              {wcStatus === "ready" && (
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#4ec94e" }} />
              )}
            </button>

            {tab === "code" && selectedFile && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginLeft: "12px" }}>
                <File size={11} style={{ color: getFileColor(selectedFile.name) }} />
                <span style={{ fontSize: "11px", color: "#555" }}>{selectedFile.path}</span>
                {isActiveBeingWritten && (
                  <span style={{
                    padding: "1px 6px", borderRadius: "4px", fontSize: "10px",
                    background: "#1e2a1e", color: "#4ec94e", border: "1px solid #2d5a2d",
                    animation: "pulse 1.5s infinite",
                  }}>
                    writing…
                  </span>
                )}
              </div>
            )}

            {tab === "preview" && wcStatus !== "idle" && (
              <div style={{
                display: "flex", alignItems: "center", gap: "6px", marginLeft: "12px", fontSize: "11px",
                color: wcStatus === "error" ? "#f87171" : wcStatus === "ready" ? "#4ec94e" : "#4fc1ff",
              }}>
                {wcStatus === "ready"
                  ? <CheckCircle2 size={12} />
                  : wcStatus === "error"
                  ? <AlertTriangle size={12} />
                  : <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} />}
                {WC_STATUS_LABELS[wcStatus]}
              </div>
            )}

            {tab === "preview" && wcStatus === "ready" && (
              <button
                title="Refresh"
                onClick={() => setIframeKey((k) => k + 1)}
                style={{
                  marginLeft: "auto", padding: "4px", borderRadius: "4px",
                  background: "none", border: "none", color: "#444", cursor: "pointer",
                }}
              >
                <RefreshCw size={13} />
              </button>
            )}
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>

            {/* CODE TAB */}
            {tab === "code" && (
              selectedFile
                ? <Editor
                    height="100%"
                    language={getLang(selectedFile.name)}
                    value={editorContent}
                    theme="vs-dark"
                    options={{
                      readOnly: true, minimap: { enabled: false },
                      fontSize: 13, fontFamily: "'JetBrains Mono', monospace",
                      fontLigatures: true, scrollBeyondLastLine: false,
                      padding: { top: 12, bottom: 12 },
                      scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
                      smoothScrolling: true,
                    }}
                  />
                : <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "12px" }}>
                    <FileCode2 size={36} style={{ color: "#1e1e2e" }} />
                    <p style={{ fontSize: "12px", color: "#333" }}>Select a file to view code</p>
                  </div>
            )}

            {/* PREVIEW TAB */}
            {tab === "preview" && (
              <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                {/* iframe */}
                <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
                  {wcStatus === "ready" && wcUrl
                    ? <iframe
                        key={iframeKey}
                        src={wcUrl}
                        style={{ width: "100%", height: "100%", border: "none", background: "white" }}
                        title="Preview"
                        allow="cross-origin-isolated"
                      />
                    : wcStatus === "error"
                    ? <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "12px", padding: "24px" }}>
                        <AlertTriangle size={28} style={{ color: "#f87171" }} />
                        <p style={{ fontSize: "13px", color: "#f87171" }}>WebContainer Error</p>
                        <p style={{ fontSize: "12px", color: "#444", textAlign: "center", maxWidth: "360px" }}>{wcError}</p>
                        <p style={{ fontSize: "11px", color: "#333", textAlign: "center", maxWidth: "360px", lineHeight: 1.6 }}>
                          Make sure your Vite dev server has these headers:
                          <br /><code style={{ color: "#4fc1ff" }}>Cross-Origin-Embedder-Policy: require-corp</code>
                          <br /><code style={{ color: "#4fc1ff" }}>Cross-Origin-Opener-Policy: same-origin</code>
                        </p>
                      </div>
                    : <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "12px" }}>
                        <Loader2 size={28} style={{ color: "#4fc1ff", animation: "spin 1s linear infinite" }} />
                        <p style={{ fontSize: "12px", color: "#444" }}>{WC_STATUS_LABELS[wcStatus]}</p>
                        {wcStatus === "idle" && !buildComplete && (
                          <p style={{ fontSize: "11px", color: "#333" }}>Waiting for build to complete…</p>
                        )}
                      </div>
                  }
                </div>

                {/* Terminal */}
                <div style={{ height: "180px", borderTop: "1px solid #1e1e2e", background: "#07070f", flexShrink: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "4px 12px", borderBottom: "1px solid #1a1a24" }}>
                    <Terminal size={11} style={{ color: "#333" }} />
                    <span style={{ fontSize: "10px", color: "#333", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                      Terminal
                    </span>
                  </div>
                  <div
                    ref={terminalRef}
                    style={{ height: "calc(100% - 25px)", overflowY: "auto", padding: "8px 12px", scrollbarWidth: "none" }}
                  >
                    {terminalLines.map((line, i) => (
                      <div key={i} style={{
                        fontSize: "11px", lineHeight: 1.7, fontFamily: "monospace",
                        color: line.startsWith("✗") ? "#f87171"
                          : line.startsWith("✓") ? "#4ec94e"
                          : line.startsWith("$") ? "#4fc1ff"
                          : "#555",
                        whiteSpace: "pre-wrap", wordBreak: "break-all",
                      }}>
                        {line}
                      </div>
                    ))}
                    {!terminalLines.length && (
                      <span style={{ fontSize: "11px", color: "#222" }}>Terminal output will appear here…</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* STATUS BAR */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 16px", height: "22px",
        borderTop: "1px solid #1e1e2e",
        background: buildComplete ? "#0a1a0a" : "#0d0d12",
        flexShrink: 0, transition: "background 0.6s",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {buildComplete
            ? <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "#4ec94e" }}>
                <CheckCircle2 size={11} /> Build completed
              </span>
            : runningStep
            ? <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "#4fc1ff" }}>
                <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} /> {runningStep.title}
              </span>
            : <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "#2a2a2a" }}>
                <Terminal size={11} /> Idle
              </span>}

          {!["idle", "ready", "error"].includes(wcStatus) && (
            <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "#4fc1ff" }}>
              <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} />
              {WC_STATUS_LABELS[wcStatus]}
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {selectedFile && <span style={{ fontSize: "11px", color: "#2a2a2a" }}>{getLang(selectedFile.name).toUpperCase()}</span>}
          <span style={{ fontSize: "11px", color: "#2a2a2a" }}>UTF-8</span>
          <span style={{ fontSize: "11px", color: "#2a2a2a" }}>Ln 1, Col 1</span>
        </div>
      </div>

      {/* CSS keyframes */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  );
};

export default Builder;
