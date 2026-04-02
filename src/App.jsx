import { useState, useRef, useEffect } from "react";

const AIRTABLE_TOKEN = import.meta.env.VITE_AIRTABLE_TOKEN;
const AIRTABLE_BASE = "appHPv16UPdsghkQt";
const AIRTABLE_TABLE = "tblaDHnsqtL3PWZk1";

async function fetchLatestContent() {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE}/${AIRTABLE_TABLE}?maxRecords=1`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` },
  });
  const data = await res.json();
  console.log("Airtable response:", JSON.stringify(data)); if (data.records && data.records.length > 0) {
    return data.records[0].fields;
  }
  return null;
}

const clipData = [
  { id: 1, time: "04:22–06:15", hook: "Why most AI products fail in 90 days", score: 94 },
  { id: 2, time: "21:45–23:30", hook: "The no-code stack that costs $50/mo", score: 91 },
  { id: 3, time: "33:10–35:00", hook: "Talk to 10 people before writing code", score: 87 },
];

export default function App() {
  const [step, setStep] = useState("upload");
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState(null);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState("linkedin");
  const [copied, setCopied] = useState(null);
  const [results, setResults] = useState(null);
  const [loadingResults, setLoadingResults] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    if (step === "results") { console.log("useEffect triggered");
      setLoadingResults(true);
      fetchLatestContent().then((data) => {
        if (data) setResults(data);
        setLoadingResults(false);
      });
    }
  }, [step]);

  const handleFile = (file) => {
    if (!file) return;
    setFileName(file.name);
    setStep("processing");
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 18;
      if (p >= 100) {
        p = 100;
        clearInterval(interval);
        setTimeout(() => setStep("results"), 400);
      }
      setProgress(Math.min(p, 100));
    }, 320);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const copy = (key) => {
    const content = results ? results[key] : "";
    navigator.clipboard.writeText(content || "");
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const tabs = [
    { key: "linkedin", label: "LinkedIn", icon: "💼" },
    { key: "twitter", label: "Twitter / X", icon: "𝕏" },
    { key: "newsletter", label: "Newsletter", icon: "✉️" },
    { key: "shownotes", label: "Show Notes", icon: "📋" },
  ];

  return (
    <div style={styles.root}>
      <style>{css}</style>

      <header style={styles.header}>
        <div style={styles.logo}>
          <span style={styles.logoMark}>◈</span>
          <span style={styles.logoText}>REPOD</span>
        </div>
        <nav style={styles.nav}>
          <span style={styles.navLink}>Pricing</span>
          <span style={styles.navLink}>Docs</span>
          <button style={styles.navBtn}>Sign in</button>
        </nav>
      </header>

      <main style={styles.main}>
        {step === "upload" && (
          <div style={styles.heroWrap}>
            <div style={styles.badge}>
              <span style={styles.badgeDot} />
              AI-Powered · No editing required
            </div>
            <h1 style={styles.hero}>
              One podcast.<br />
              <span style={styles.heroAccent}>Every platform.</span>
            </h1>
            <p style={styles.sub}>
              Upload your episode. Get LinkedIn posts, tweets, newsletters,
              show notes, and viral short-form clips — in under 2 minutes.
            </p>
            <div
              style={{ ...styles.dropzone, ...(dragging ? styles.dropzoneDrag : {}) }}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current.click()}
              className="dropzone"
            >
              <input
                ref={fileRef}
                type="file"
                accept="audio/*,video/*"
                style={{ display: "none" }}
                onChange={(e) => handleFile(e.target.files[0])}
              />
              <div style={styles.dropIcon}>⬆</div>
              <p style={styles.dropTitle}>Drop your episode here</p>
              <p style={styles.dropSub}>MP3, MP4, WAV, M4A — up to 2GB</p>
              <button style={styles.uploadBtn} onClick={(e) => { e.stopPropagation(); fileRef.current.click(); }}>
                Choose file
              </button>
            </div>
            <div style={styles.stats}>
              {[["2 min", "avg processing"], ["6 assets", "per episode"], ["$0", "to start"]].map(([val, label]) => (
                <div key={label} style={styles.stat}>
                  <span style={styles.statVal}>{val}</span>
                  <span style={styles.statLabel}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === "processing" && (
          <div style={styles.processingWrap}>
            <div style={styles.processingCard}>
              <div style={styles.spinnerWrap}>
                <div className="spinner" style={styles.spinner} />
                <span style={styles.spinnerIcon}>◈</span>
              </div>
              <h2 style={styles.processingTitle}>Processing your episode</h2>
              <p style={styles.processingFile}>{fileName}</p>
              <div style={styles.progressBar}>
                <div style={{ ...styles.progressFill, width: `${progress}%` }} />
              </div>
              <p style={styles.progressPct}>{Math.round(progress)}%</p>
              <div style={styles.taskList}>
                {[
                  ["Transcribing audio", 20],
                  ["Extracting key moments", 45],
                  ["Generating written content", 65],
                  ["Creating video clips", 85],
                  ["Finalising assets", 95],
                ].map(([task, threshold]) => (
                  <div key={task} style={styles.task}>
                    <span style={{
                      ...styles.taskDot,
                      background: progress >= threshold ? "#E8FF47" : "#2a2a2a",
                      boxShadow: progress >= threshold ? "0 0 8px #E8FF47" : "none",
                    }} />
                    <span style={{ ...styles.taskLabel, opacity: progress >= threshold ? 1 : 0.35 }}>
                      {task}
                    </span>
                    {progress >= threshold && <span style={styles.taskCheck}>✓</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === "results" && (
          <div style={styles.resultsWrap}>
            <div style={styles.resultsHeader}>
              <div>
                <div style={styles.badge}>
                  <span style={styles.badgeDot} />
                  {loadingResults ? "Loading..." : "Ready"}
                </div>
                <h2 style={styles.resultsTitle}>Your content is ready</h2>
                <p style={styles.resultsSub}>{fileName} · 6 assets generated</p>
              </div>
              <button style={styles.newBtn} onClick={() => {
                setStep("upload");
                setFileName(null);
                setProgress(0);
                setResults(null);
              }}>
                + New episode
              </button>
            </div>

            {loadingResults ? (
              <div style={styles.loadingWrap}>
                <div className="spinner" style={{ ...styles.spinner, position: "relative", margin: "0 auto" }} />
                <p style={{ color: "#555", marginTop: 24, fontSize: 13, textAlign: "center" }}>
                  Fetching your content from Airtable...
                </p>
              </div>
            ) : (
              <div style={styles.resultsGrid}>
                <div style={styles.panel}>
                  <div style={styles.panelHeader}>
                    <span style={styles.panelTitle}>Written Content</span>
                    <span style={styles.panelCount}>4 assets</span>
                  </div>
                  <div style={styles.tabRow}>
                    {tabs.map(t => (
                      <button
                        key={t.key}
                        style={{ ...styles.tab, ...(activeTab === t.key ? styles.tabActive : {}) }}
                        onClick={() => setActiveTab(t.key)}
                      >
                        {t.icon} {t.label}
                      </button>
                    ))}
                  </div>
                  <div style={styles.contentBox}>
                    <pre style={styles.contentText}>
                      {results ? (results[activeTab] || "No content found for this field.") : "No data available."}
                    </pre>
                  </div>
                  <button
                    style={{ ...styles.copyBtn, ...(copied === activeTab ? styles.copyBtnDone : {}) }}
                    onClick={() => copy(activeTab)}
                  >
                    {copied === activeTab ? "✓ Copied!" : "Copy to clipboard"}
                  </button>
                </div>

                <div style={styles.panel}>
                  <div style={styles.panelHeader}>
                    <span style={styles.panelTitle}>Short-Form Clips</span>
                    <span style={styles.panelCount}>3 clips · Reels / Shorts / TikTok</span>
                  </div>
                  <div style={styles.clipList}>
                    {clipData.map((clip) => (
                      <div key={clip.id} style={styles.clipCard} className="clipcard">
                        <div style={styles.clipThumb}>
                          <div style={styles.clipPlay}>▶</div>
                          <div style={styles.clipBadge}>9:16</div>
                        </div>
                        <div style={styles.clipInfo}>
                          <p style={styles.clipHook}>"{clip.hook}"</p>
                          <p style={styles.clipTime}>⏱ {clip.time}</p>
                          <div style={styles.clipScoreRow}>
                            <span style={styles.clipScoreLabel}>Viral score</span>
                            <div style={styles.clipScoreBar}>
                              <div style={{ ...styles.clipScoreFill, width: `${clip.score}%` }} />
                            </div>
                            <span style={styles.clipScoreNum}>{clip.score}</span>
                          </div>
                        </div>
                        <button style={styles.dlBtn}>↓</button>
                      </div>
                    ))}
                  </div>
                  <div style={styles.platformRow}>
                    {["Instagram Reels", "YouTube Shorts", "TikTok"].map(p => (
                      <span key={p} style={styles.platformTag}>{p}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

const styles = {
  root: {
    minHeight: "100vh",
    background: "#0a0a0a",
    color: "#f0f0f0",
    fontFamily: "'DM Mono', 'Courier New', monospace",
    overflowX: "hidden",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "20px 40px",
    borderBottom: "1px solid #1a1a1a",
  },
  logo: { display: "flex", alignItems: "center", gap: 10 },
  logoMark: { fontSize: 22, color: "#E8FF47" },
  logoText: { fontSize: 18, fontWeight: 700, letterSpacing: 6, color: "#fff" },
  nav: { display: "flex", alignItems: "center", gap: 28 },
  navLink: { fontSize: 13, color: "#888", cursor: "pointer", letterSpacing: 1 },
  navBtn: {
    background: "transparent",
    border: "1px solid #333",
    color: "#f0f0f0",
    padding: "8px 20px",
    borderRadius: 4,
    cursor: "pointer",
    fontSize: 13,
    letterSpacing: 1,
  },
  main: { maxWidth: 900, margin: "0 auto", padding: "60px 24px" },
  heroWrap: { textAlign: "center" },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    background: "#111",
    border: "1px solid #222",
    borderRadius: 100,
    padding: "6px 16px",
    fontSize: 12,
    color: "#888",
    letterSpacing: 1,
    marginBottom: 32,
  },
  badgeDot: {
    width: 6, height: 6,
    borderRadius: "50%",
    background: "#E8FF47",
    display: "inline-block",
    boxShadow: "0 0 6px #E8FF47",
  },
  hero: {
    fontSize: "clamp(42px, 7vw, 80px)",
    fontWeight: 800,
    lineHeight: 1.05,
    letterSpacing: -2,
    marginBottom: 20,
    fontFamily: "'DM Serif Display', Georgia, serif",
  },
  heroAccent: { color: "#E8FF47" },
  sub: {
    fontSize: 17,
    color: "#888",
    maxWidth: 520,
    margin: "0 auto 48px",
    lineHeight: 1.6,
  },
  dropzone: {
    border: "1px dashed #2a2a2a",
    borderRadius: 16,
    padding: "60px 40px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    background: "#0d0d0d",
    marginBottom: 40,
  },
  dropzoneDrag: { borderColor: "#E8FF47", background: "#111", transform: "scale(1.01)" },
  dropIcon: { fontSize: 32, marginBottom: 16, color: "#E8FF47" },
  dropTitle: { fontSize: 20, fontWeight: 600, marginBottom: 8, color: "#e0e0e0" },
  dropSub: { fontSize: 13, color: "#555", marginBottom: 24 },
  uploadBtn: {
    background: "#E8FF47",
    color: "#0a0a0a",
    border: "none",
    padding: "12px 32px",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    letterSpacing: 1,
  },
  stats: { display: "flex", justifyContent: "center", gap: 60 },
  stat: { display: "flex", flexDirection: "column", alignItems: "center", gap: 4 },
  statVal: { fontSize: 28, fontWeight: 800, color: "#E8FF47" },
  statLabel: { fontSize: 12, color: "#555", letterSpacing: 1 },
  processingWrap: { display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" },
  processingCard: {
    background: "#0d0d0d",
    border: "1px solid #1a1a1a",
    borderRadius: 20,
    padding: "52px 60px",
    textAlign: "center",
    width: "100%",
    maxWidth: 480,
  },
  spinnerWrap: { position: "relative", width: 60, height: 60, margin: "0 auto 28px" },
  spinner: {
    width: 60, height: 60,
    border: "2px solid #1a1a1a",
    borderTop: "2px solid #E8FF47",
    borderRadius: "50%",
    position: "absolute",
    top: 0, left: 0,
  },
  spinnerIcon: {
    position: "absolute",
    top: "50%", left: "50%",
    transform: "translate(-50%, -50%)",
    fontSize: 20, color: "#E8FF47",
  },
  processingTitle: { fontSize: 22, fontWeight: 700, marginBottom: 8, fontFamily: "'DM Serif Display', Georgia, serif" },
  processingFile: { fontSize: 13, color: "#555", marginBottom: 32 },
  progressBar: { height: 3, background: "#1a1a1a", borderRadius: 4, overflow: "hidden", marginBottom: 8 },
  progressFill: { height: "100%", background: "#E8FF47", borderRadius: 4, transition: "width 0.3s ease", boxShadow: "0 0 12px #E8FF47" },
  progressPct: { fontSize: 12, color: "#555", marginBottom: 32, textAlign: "right" },
  taskList: { textAlign: "left", display: "flex", flexDirection: "column", gap: 14 },
  task: { display: "flex", alignItems: "center", gap: 12 },
  taskDot: { width: 8, height: 8, borderRadius: "50%", flexShrink: 0, transition: "all 0.4s ease" },
  taskLabel: { fontSize: 13, flex: 1, transition: "opacity 0.4s ease" },
  taskCheck: { fontSize: 12, color: "#E8FF47" },
  loadingWrap: { padding: "80px 0", textAlign: "center" },
  resultsWrap: {},
  resultsHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32 },
  resultsTitle: { fontSize: 32, fontWeight: 800, marginTop: 10, marginBottom: 4, fontFamily: "'DM Serif Display', Georgia, serif" },
  resultsSub: { fontSize: 13, color: "#555" },
  newBtn: {
    background: "transparent",
    border: "1px solid #E8FF47",
    color: "#E8FF47",
    padding: "10px 24px",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: 1,
  },
  resultsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 },
  panel: { background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 16, padding: 24, display: "flex", flexDirection: "column", gap: 16 },
  panelHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  panelTitle: { fontSize: 14, fontWeight: 700, letterSpacing: 1, color: "#e0e0e0" },
  panelCount: { fontSize: 11, color: "#555", letterSpacing: 1 },
  tabRow: { display: "flex", gap: 6, flexWrap: "wrap" },
  tab: { background: "transparent", border: "1px solid #1a1a1a", color: "#555", padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: 12, letterSpacing: 0.5, transition: "all 0.15s ease" },
  tabActive: { background: "#E8FF47", borderColor: "#E8FF47", color: "#0a0a0a", fontWeight: 700 },
  contentBox: { background: "#080808", border: "1px solid #161616", borderRadius: 10, padding: 16, flex: 1, minHeight: 220, overflow: "auto" },
  contentText: { fontSize: 12, lineHeight: 1.7, color: "#aaa", whiteSpace: "pre-wrap", fontFamily: "'DM Mono', monospace", margin: 0 },
  copyBtn: { background: "#111", border: "1px solid #222", color: "#888", padding: "10px", borderRadius: 8, cursor: "pointer", fontSize: 12, letterSpacing: 1, transition: "all 0.2s ease" },
  copyBtnDone: { borderColor: "#E8FF47", color: "#E8FF47", background: "#0f110a" },
  clipList: { display: "flex", flexDirection: "column", gap: 12 },
  clipCard: { display: "flex", alignItems: "center", gap: 14, background: "#080808", border: "1px solid #161616", borderRadius: 10, padding: 12, transition: "border-color 0.2s ease" },
  clipThumb: { width: 44, height: 78, background: "#111", borderRadius: 6, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", border: "1px solid #1a1a1a" },
  clipPlay: { fontSize: 14, color: "#E8FF47" },
  clipBadge: { position: "absolute", bottom: 4, right: 4, fontSize: 8, color: "#555", letterSpacing: 0.5 },
  clipInfo: { flex: 1 },
  clipHook: { fontSize: 12, color: "#ccc", marginBottom: 4, lineHeight: 1.4 },
  clipTime: { fontSize: 11, color: "#444", marginBottom: 8 },
  clipScoreRow: { display: "flex", alignItems: "center", gap: 8 },
  clipScoreLabel: { fontSize: 10, color: "#444", whiteSpace: "nowrap" },
  clipScoreBar: { flex: 1, height: 3, background: "#1a1a1a", borderRadius: 4, overflow: "hidden" },
  clipScoreFill: { height: "100%", background: "#E8FF47", boxShadow: "0 0 6px #E8FF47" },
  clipScoreNum: { fontSize: 11, color: "#E8FF47", fontWeight: 700, minWidth: 24 },
  dlBtn: { background: "#111", border: "1px solid #1a1a1a", color: "#E8FF47", width: 32, height: 32, borderRadius: 6, cursor: "pointer", fontSize: 14, flexShrink: 0 },
  platformRow: { display: "flex", gap: 8, flexWrap: "wrap" },
  platformTag: { fontSize: 11, color: "#444", border: "1px solid #1a1a1a", borderRadius: 100, padding: "4px 12px", letterSpacing: 0.5 },
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Serif+Display&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0a0a0a; }
  .dropzone:hover { border-color: #333 !important; background: #0f0f0f !important; }
  .clipcard:hover { border-color: #2a2a2a !important; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .spinner { animation: spin 1s linear infinite; }
`;
