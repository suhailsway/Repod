import { useState, useEffect, useRef } from "react";
import { useUser, SignInButton, SignOutButton, SignUpButton, SignedIn, SignedOut } from "@clerk/clerk-react";
import Uppy from "@uppy/core";
import AwsS3 from "@uppy/aws-s3";

const SUPABASE_URL = "https://frbziezfrpdbtrkbmlzy.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyYnppZXpmcnBkYnRya2JtbHp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyMDM5MDUsImV4cCI6MjA5MTc3OTkwNX0.S7ViyQgVYgxdxk2EU8470DChaD46WO20X9mdDDkQ1Hk";

async function fetchLatestContent(sessionId) {
  const url = `${SUPABASE_URL}/rest/v1/repod_jobs?session_id=eq.${sessionId}&limit=1&select=*&order=created_at.desc`;
  const res = await fetch(url, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } });
  const data = await res.json();
  if (data && data.length > 0) return data[0];
  return null;
}

const PlatformLogo = ({ platform }) => {
  const logos = {
    twitter: <svg viewBox="0 0 24 24" width="20" height="20" fill="white"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
    linkedin: <svg viewBox="0 0 24 24" width="20" height="20" fill="white"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>,
    facebook: <svg viewBox="0 0 24 24" width="20" height="20" fill="white"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>,
    instagram: <svg viewBox="0 0 24 24" width="20" height="20" fill="white"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>,
  };
  return logos[platform] || null;
};

const sansFont = "'Inter', 'Helvetica Neue', Arial, sans-serif";

function SocialCard({ platform, content, onCopy, copied }) {
  if (!content) return (
    <div style={{ padding: "32px", textAlign: "center", color: "#555", fontSize: 13, fontFamily: sansFont }}>
      No content yet — still generating...
    </div>
  );

  const avatarStyle = { width: 42, height: 42, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 15, flexShrink: 0, letterSpacing: -0.5 };
  const copyBtn = (
    <button onClick={onCopy} style={{ marginTop: 16, background: copied ? "#E8FF47" : "transparent", border: `1px solid ${copied ? "#E8FF47" : "#333"}`, color: copied ? "#0a0a0a" : "#666", padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontSize: 12, width: "100%", fontFamily: sansFont, transition: "all 0.15s" }}>
      {copied ? "✓ Copied!" : "Copy to clipboard"}
    </button>
  );

  if (platform === "twitter") {
    const tweets = content.split("\n").filter(t => t.trim());
    return (
      <div style={{ background: "#000", border: "1px solid #2f3336", borderRadius: 12, overflow: "hidden" }}>
        {tweets.map((tweet, i) => (
          <div key={i} style={{ padding: "16px", borderBottom: i < tweets.length - 1 ? "1px solid #2f3336" : "none" }}>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ ...avatarStyle, background: "#000", border: "1px solid #333" }}><PlatformLogo platform="twitter" /></div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
                  <span style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>Your Podcast</span>
                  <span style={{ color: "#71767b", fontSize: 14 }}>@podcast</span>
                  {i > 0 && <span style={{ color: "#71767b", fontSize: 14 }}>· {i + 1}/{tweets.length}</span>}
                </div>
                <p style={{ color: "#e7e9ea", fontSize: 15, lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap", fontFamily: sansFont }}>{tweet}</p>
                <div style={{ display: "flex", gap: 24, marginTop: 12, color: "#71767b", fontSize: 12, fontFamily: sansFont }}>
                  <span>↩ Reply</span><span>↺ Repost</span><span>♡ Like</span><span>↗ Share</span>
                </div>
              </div>
            </div>
          </div>
        ))}
        <div style={{ padding: "12px 16px", borderTop: "1px solid #2f3336" }}>{copyBtn}</div>
      </div>
    );
  }

  if (platform === "linkedin") {
    return (
      <div style={{ background: "#1b1f23", border: "1px solid #2a2a2a", borderRadius: 12, padding: 16 }}>
        <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
          <div style={{ ...avatarStyle, background: "#0077b5" }}><PlatformLogo platform="linkedin" /></div>
          <div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 14, fontFamily: sansFont }}>Your Podcast</div>
            <div style={{ color: "#888", fontSize: 12, fontFamily: sansFont }}>Podcast Creator · 1st</div>
            <div style={{ color: "#888", fontSize: 11, fontFamily: sansFont }}>Just now · 🌐</div>
          </div>
        </div>
        <p style={{ color: "#e0e0e0", fontSize: 15, lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap", fontFamily: sansFont }}>{content}</p>
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #2a2a2a", display: "flex", gap: 16, color: "#888", fontSize: 12, fontFamily: sansFont }}>
          <span>👍 Like</span><span>💬 Comment</span><span>↺ Repost</span><span>↗ Send</span>
        </div>
        {copyBtn}
      </div>
    );
  }

  if (platform === "facebook") {
    return (
      <div style={{ background: "#1c1e21", border: "1px solid #3a3b3c", borderRadius: 12, padding: 16 }}>
        <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
          <div style={{ ...avatarStyle, background: "#1877f2" }}><PlatformLogo platform="facebook" /></div>
          <div>
            <div style={{ color: "#e4e6eb", fontWeight: 700, fontSize: 14 }}>Your Podcast</div>
            <div style={{ color: "#b0b3b8", fontSize: 12 }}>Just now · 🌐</div>
          </div>
        </div>
        <p style={{ color: "#e4e6eb", fontSize: 15, lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap", fontFamily: sansFont }}>{content}</p>
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #3a3b3c", display: "flex", gap: 16, color: "#b0b3b8", fontSize: 12 }}>
          <span style={{fontFamily: sansFont}}>👍 Like</span><span style={{fontFamily: sansFont}}>💬 Comment</span><span style={{fontFamily: sansFont}}>↗ Share</span>
        </div>
        {copyBtn}
      </div>
    );
  }

  if (platform === "instagram") {
    return (
      <div style={{ background: "#000", border: "1px solid #2a2a2a", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid #2a2a2a" }}>
          <div style={{ ...avatarStyle, background: "linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)" }}><PlatformLogo platform="instagram" /></div>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>yourpodcast</span>
        </div>
        <div style={{ background: "#111", height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "#555", fontSize: 13 }}>🎙️ Podcast Cover</div>
        <div style={{ padding: 16 }}>
          <div style={{ display: "flex", gap: 16, marginBottom: 12, color: "#fff", fontSize: 18 }}>
            <span>❤️</span><span>💬</span><span>📤</span>
          </div>
          <p style={{ color: "#e0e0e0", fontSize: 14, lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>
            <span style={{ fontWeight: 700 }}>yourpodcast </span>{content}
          </p>
        </div>
        <div style={{ padding: "0 16px 16px" }}>{copyBtn}</div>
      </div>
    );
  }

  if (platform === "hashtags") {
    const tags = content.split(" ").filter(t => t.startsWith("#"));
    return (
      <div style={{ background: "#111", border: "1px solid #2a2a2a", borderRadius: 12, padding: 16 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          {tags.map((tag, i) => (
            <span key={i} style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", color: "#E8FF47", padding: "4px 10px", borderRadius: 20, fontSize: 12 }}>{tag}</span>
          ))}
        </div>
        {copyBtn}
      </div>
    );
  }

  // Default: newsletter, shownotes
  const bgColors = { newsletter: "#1a0a2e", shownotes: "#0a1a0a" };
  const accentColors = { newsletter: "#9b59b6", shownotes: "#27ae60" };
  return (
    <div style={{ background: bgColors[platform] || "#111", border: `1px solid ${accentColors[platform] || "#2a2a2a"}`, borderRadius: 12, padding: 16 }}>
      <p style={{ color: "#e0e0e0", fontSize: 15, lineHeight: 1.8, margin: 0, whiteSpace: "pre-wrap", fontFamily: sansFont }}>{content}</p>
      {copyBtn}
    </div>
  );
}

export default function App() {
  const { isSignedIn, user } = useUser();
  const [step, setStep] = useState("upload");
  const [inputMode, setInputMode] = useState("audio");
  const [audioUrl, setAudioUrl] = useState("");
  const [videoFile, setVideoFile] = useState(null);
  const [audioFile, setAudioFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState("linkedin");
  const [copied, setCopied] = useState(null);
  const [results, setResults] = useState(null);
  const [loadingResults, setLoadingResults] = useState(false);
  const [error, setError] = useState(null);
  const [hasClips, setHasClips] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [feedbackEmail, setFeedbackEmail] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);

  useEffect(() => {
    if (window.location.search.includes('success=true')) {
      setShowSuccess(true);
      window.history.replaceState({}, '', '/');
    }
    const savedSession = localStorage.getItem('repod_session_id');
    if (savedSession) {
      const savedHasClips = localStorage.getItem('repod_has_clips') === 'true';
      const savedDuration = parseInt(localStorage.getItem('repod_video_duration') || '0');
      setVideoDuration(savedDuration);
      setSessionId(savedSession);
      setHasClips(savedHasClips);
      setLoadingResults(true);
      setStep('results');
    }
  }, []);

  useEffect(() => {
    if (step === "results" && sessionId) {
      setLoadingResults(true);
      setError(null);
      let attempts = 0;
      const maxAttempts = 60;
      const interval = setInterval(async () => {
        attempts++;
        const data = await fetchLatestContent(sessionId);
        if (data) {
          const status = data.status;
          if (data.linkedin) {
            setResults(data);
            if (data.video_clips) {
              setHasClips(true);
              setLoadingResults(false);
              clearInterval(interval);
            } else if (status === "completed") {
              setLoadingResults(false);
              clearInterval(interval);
            } else {
              // Content ready but clips still processing — show content, keep polling for clips
              setLoadingResults(false);
            }
          } else if (status === "error") {
            setLoadingResults(false);
            setError("Something went wrong processing your file. Please try again.");
            clearInterval(interval);
            localStorage.removeItem("repod_session_id");
          } else if (attempts >= maxAttempts) {
            setLoadingResults(false);
            setError("Processing is taking longer than expected. Check your email — we will notify you when your content is ready.");
            clearInterval(interval);
          }
        } else if (attempts >= maxAttempts) {
          setLoadingResults(false);
          setError("Could not find your job. Please try again.");
          clearInterval(interval);
        }
      }, 15000);
      return () => clearInterval(interval);
    }
  }, [step, sessionId]);

  const WORKER_URL = "https://upload.repodlab.com";

  const uploadWithUppy = async (file, onProgress) => {
    const CHUNK_SIZE = 5 * 1024 * 1024;
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

    const startRes = await fetch(`${WORKER_URL}/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: file.name }),
    });
    const { uploadId, key } = await startRes.json();

    const parts = [];
    for (let i = 0; i < totalChunks; i++) {
      const chunk = file.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      const partRes = await fetch(`${WORKER_URL}/part`, {
        method: "POST",
        headers: {
          "Content-Type": "application/octet-stream",
          "X-Upload-Id": uploadId,
          "X-Key": key,
          "X-Part-Number": String(i + 1),
        },
        body: chunk,
      });
      const { etag } = await partRes.json();
      parts.push({ partNumber: i + 1, etag });
      if (onProgress) onProgress(Math.round(((i + 1) / totalChunks) * 100));
    }

    const completeRes = await fetch(`${WORKER_URL}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, uploadId, parts }),
    });
    const completeData = await completeRes.json();
    console.log("Complete response:", completeData);
    return completeData.url;
  };

  const handleSubmit = async () => {
    if (inputMode === "audio" && !audioUrl.trim() && !audioFile) { setError("Please enter a podcast URL or upload an MP3 file"); return; }
    if (inputMode === "video" && !videoFile) { setError("Please upload a video file"); return; }
    setError(null);
    setHasClips(inputMode === "video");
    let videoPath = null;
    const newSessionId = Date.now().toString();
    setSessionId(newSessionId);
    localStorage.setItem('repod_session_id', newSessionId);
    localStorage.setItem('repod_has_clips', String(inputMode === 'video'));
    localStorage.setItem('repod_video_duration', String(videoDuration));
    if (videoFile && inputMode === "video") {
      setIsUploading(true);
      setUploadProgress(0);
    }
    setStep("processing");

    try {
      if (videoFile && inputMode === "video") {
        videoPath = await uploadWithUppy(videoFile, (pct) => {
          setUploadProgress(pct);
        });
        setIsUploading(false);
      }
      let finalAudioUrl = audioUrl;
      if (audioFile && inputMode === "audio") {
        setIsUploading(true);
        setUploadProgress(0);
        finalAudioUrl = await uploadWithUppy(audioFile, (pct) => {
          setUploadProgress(pct);
        });
        setIsUploading(false);
        setAudioUrl(finalAudioUrl);
      }
      await fetch("/api/trigger", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audio_url: finalAudioUrl || audioUrl, video_path: videoPath || null, mode: inputMode, session_id: newSessionId, user_email: user?.primaryEmailAddress?.emailAddress || "" }),
      });
    } catch (err) { console.error("Upload error:", err); }

    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 8;
      if (p >= 100) { p = 100; clearInterval(interval); setTimeout(() => setStep("results"), 400); }
      setProgress(Math.min(p, 100));
    }, 900);
  };

  const handleSubscribe = async () => {
    const res = await fetch('/api/checkout', { method: 'POST' });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  };

  const handleFeedback = async () => {
    if (!feedbackMessage.trim()) return;
    await fetch(`${SUPABASE_URL}/rest/v1/repod_feedback`, {
      method: 'POST',
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: feedbackEmail, message: feedbackMessage }),
    }).catch(() => {});
    setFeedbackSent(true);
  };

  const copy = (key) => {
    navigator.clipboard.writeText(results ? results[key] || "" : "");
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const tabs = [
    { key: "linkedin", label: "LinkedIn", icon: "💼" },
    { key: "twitter", label: "Twitter / X", icon: "𝕏" },
    { key: "newsletter", label: "Newsletter", icon: "✉️" },
    { key: "shownotes", label: "Show Notes", icon: "📋" },
    { key: "facebook", label: "Facebook", icon: "👥" },
    { key: "instagram", label: "Instagram", icon: "📸" },
    { key: "hashtags", label: "Hashtags", icon: "#" },
  ];

  const clipUrls = results?.video_clips ? (() => {
    try { return JSON.parse(results.video_clips).map(c => `/api/clips?file=${c.filename}`); }
    catch { return results.video_clips.split('\n').filter(Boolean); }
  })() : [];

  const clipTitles = results?.video_clips ? (() => {
    try { return JSON.parse(results.video_clips).map(c => c.text ? c.text.substring(0, 80) + "..." : "Clip"); }
    catch { return []; }
  })() : [];

  return (
    <div style={styles.root}>
      <style>{css}</style>

      <header style={styles.header}>
        <div style={styles.logo}>
          <span style={styles.logoMark}>◈</span>
          <span style={styles.logoText}>REPOD</span>
        </div>
        <nav style={styles.nav}>
          <SignedOut>
            <SignInButton mode="modal"><button style={styles.navBtn}>Sign in</button></SignInButton>
            <SignUpButton mode="modal"><button style={styles.subscribeBtn}>Try Free →</button></SignUpButton>
          </SignedOut>
          <SignedIn>
            <button style={styles.navBtn} onClick={handleSubscribe}>Subscribe — $29/mo</button>
            <SignOutButton><button style={styles.navBtn}>Sign out</button></SignOutButton>
          </SignedIn>
        </nav>
      </header>

      <main style={styles.main}>
        {step === "upload" && !isSignedIn && (
          <div style={styles.heroWrap}>
            <div style={styles.badge}><span style={styles.badgeDot} />AI-Powered</div>
            <h1 style={styles.hero}>One podcast.<br /><span style={styles.heroAccent}>Every platform.</span></h1>
            <p style={styles.sub}>Turn your podcast into LinkedIn posts, tweets, newsletters, show notes, and viral video clips — automatically.</p>
            <SignUpButton mode="modal"><button style={styles.submitBtn}>Try Free — 3 generations →</button></SignUpButton>

            <div style={styles.pricingSection}>
              <h2 style={styles.pricingTitle}>Simple pricing</h2>
              <div style={styles.pricingGrid}>
                <div style={styles.pricingCard}>
                  <div style={styles.pricingPlan}>Free</div>
                  <div style={styles.pricingPrice}>$0</div>
                  <div style={styles.pricingDesc}>3 generations to try it out</div>
                  <ul style={styles.pricingFeatures}>
                    <li>✓ LinkedIn post</li>
                    <li>✓ Twitter thread</li>
                    <li>✓ Newsletter</li>
                    <li>✓ Show notes</li>
                    <li>✓ Video clips (video mode)</li>
                    <li style={{color:"#555"}}>✗ Unlimited generations</li>
                  </ul>
                  <SignUpButton mode="modal"><button style={styles.pricingBtn}>Get started free</button></SignUpButton>
                </div>
                <div style={{...styles.pricingCard, borderColor:"#E8FF47"}}>
                  <div style={{...styles.pricingPlan, color:"#E8FF47"}}>Pro</div>
                  <div style={styles.pricingPrice}>$29<span style={{fontSize:14,color:"#666"}}>/mo</span></div>
                  <div style={styles.pricingDesc}>For serious podcasters</div>
                  <ul style={styles.pricingFeatures}>
                    <li>✓ LinkedIn post</li>
                    <li>✓ Twitter thread</li>
                    <li>✓ Newsletter</li>
                    <li>✓ Show notes</li>
                    <li>✓ Video clips (video mode)</li>
                    <li style={{color:"#E8FF47"}}>✓ Unlimited generations</li>
                  </ul>
                  <button style={{...styles.pricingBtn, background:"#E8FF47", color:"#0a0a0a"}} onClick={handleSubscribe}>Subscribe — $29/mo</button>
                </div>
              </div>
            </div>

            <div style={styles.feedbackSection}>
              <h2 style={styles.pricingTitle}>Share your thoughts</h2>
              <p style={{color:"#555", fontSize:13, marginBottom:20}}>We're early. Your feedback shapes what we build next.</p>
              {feedbackSent ? (
                <p style={{color:"#E8FF47", fontSize:14}}>✓ Thanks for your feedback!</p>
              ) : (
                <div style={styles.feedbackForm}>
                  <input style={styles.feedbackInput} type="email" placeholder="Your email (optional)" value={feedbackEmail} onChange={e => setFeedbackEmail(e.target.value)} />
                  <textarea style={styles.feedbackTextarea} placeholder="What would make REPOD better for you?" value={feedbackMessage} onChange={e => setFeedbackMessage(e.target.value)} rows={4} />
                  <button style={styles.feedbackBtn} onClick={handleFeedback}>Send feedback</button>
                </div>
              )}
            </div>
          </div>
        )}

        {step === "upload" && isSignedIn && (
          <div style={styles.heroWrap}>
            {showSuccess && (
              <div style={{background:"#0f110a",border:"1px solid #E8FF47",borderRadius:8,padding:"12px 20px",marginBottom:24,color:"#E8FF47",fontSize:13}}>
                🎉 Welcome to REPOD Pro! You're all set.
              </div>
            )}
            <div style={styles.badge}><span style={styles.badgeDot} />AI-Powered · No editing required</div>
            <h1 style={styles.hero}>One podcast.<br /><span style={styles.heroAccent}>Every platform.</span></h1>
            <p style={styles.sub}>Get LinkedIn posts, tweets, newsletters, show notes, and viral short-form clips — automatically.</p>

            <div style={styles.modeRow}>
              <button style={{ ...styles.modeBtn, ...(inputMode === "audio" ? styles.modeBtnActive : {}) }} onClick={() => setInputMode("audio")}>
                🎙 Audio / Podcast
                <span style={styles.modeSub}>Paste an MP3 URL</span>
              </button>
              <button style={{ ...styles.modeBtn, ...(inputMode === "video" ? styles.modeBtnActive : {}) }} onClick={() => setInputMode("video")}>
                🎬 Video
                <span style={styles.modeSub}>Upload MP4 file</span>
                <span style={styles.modeBadge}>+ VIDEO CLIPS</span>
              </button>
            </div>

            <div style={styles.inputCard}>
              {inputMode === "audio" && (
                <div>
                  <div style={styles.inputWrap}>
                    <span style={styles.inputIcon}>🎙</span>
                    <input style={styles.input} type="text" placeholder="Paste your podcast MP3 URL..." value={audioUrl} onChange={e => { setAudioUrl(e.target.value); setAudioFile(null); }} onKeyDown={e => e.key === "Enter" && handleSubmit()} />
                  </div>
                  <div style={{textAlign:"center", margin:"12px 0", color:"#444", fontSize:12}}>— or upload an MP3 file —</div>
                  <label style={{cursor:"pointer", padding:"12px 24px", border:"1px dashed #555", borderRadius:"8px", color:"#aaa", fontSize:"13px", display:"block", textAlign:"center"}}>
                    {audioFile ? `✓ ${audioFile.name}` : "Click to upload MP3 file"}
                    <input type="file" accept="audio/mp3,audio/mpeg" style={{display:"none"}} onChange={e => { setAudioFile(e.target.files[0] || null); setAudioUrl(""); }} />
                  </label>
                </div>
              )}
              {inputMode === "video" && (
                <div style={{textAlign:"center", padding:"16px 0"}}>
                  <label style={{cursor:"pointer",padding:"12px 24px",border:"1px dashed #555",borderRadius:"8px",color:"#aaa",fontSize:"13px",display:"inline-block"}}>
                    {videoFile ? `✓ ${videoFile.name}` : "Click to upload MP4 file"}
                    <input type="file" accept="video/mp4" style={{display:"none"}} onChange={e => {
                    const f = e.target.files[0] || null;
                    setVideoFile(f);
                    if (f) {
                      const v = document.createElement("video");
                      v.preload = "metadata";
                      v.onloadedmetadata = () => { setVideoDuration(Math.round(v.duration / 60)); URL.revokeObjectURL(v.src); };
                      v.src = URL.createObjectURL(f);
                    }
                  }} />
                  </label>
                </div>
              )}
              {error && <p style={styles.error}>{error}</p>}
              <button style={styles.submitBtn} onClick={handleSubmit}>Generate Content →</button>
              <p style={styles.inputHint}>
                {inputMode === "audio" ? "Generates: LinkedIn · Twitter · Newsletter · Show Notes" : "Generates: LinkedIn · Twitter · Newsletter · Show Notes · Video Clips 🎬"}
              </p>
            </div>

            <div style={styles.stats}>
              {[["~2 min", "first results"], ["7 assets", "per episode"], ["$29/mo", "pro plan"]].map(([val, label]) => (
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
              <h2 style={styles.processingTitle}>{isUploading ? "Uploading your episode" : "Processing your episode"}</h2>
              <p style={styles.processingFile}>{audioUrl || videoFile?.name}</p>
              {!isUploading && (videoFile && videoDuration > 0 || audioFile) && (
                <p style={{fontSize:11, color:"#555", marginBottom:8}}>
                  {audioFile
                    ? `First results in ~2 min · Full processing: ~${Math.max(5, Math.round(audioFile.size / (1024*1024*10)))} min`
                    : `First results in ~2 min · Full processing: ~${Math.max(10, Math.round(videoDuration * 0.25))} min`}
                </p>
              )}
              <div style={styles.progressBar}><div style={{ ...styles.progressFill, width: `${isUploading ? uploadProgress : progress}%`, transition: isUploading ? "width 0.2s ease" : "width 0.3s ease" }} /></div>
              <p style={styles.progressPct}>{isUploading ? `Uploading... ${uploadProgress}%` : `${Math.round(progress)}%`}</p>
              <div style={styles.taskList}>
                {[["Transcribing audio", 20], ["Extracting key moments", 45], ["Generating written content", 65], ...(hasClips ? [["Generating video clips", 80]] : []), ["Finalising assets", 95]].map(([task, threshold]) => (
                  <div key={task} style={styles.task}>
                    <span style={{ ...styles.taskDot, background: progress >= threshold ? "#E8FF47" : "#2a2a2a", boxShadow: progress >= threshold ? "0 0 8px #E8FF47" : "none" }} />
                    <span style={{ ...styles.taskLabel, opacity: progress >= threshold ? 1 : 0.35 }}>{task}</span>
                    {progress >= threshold && <span style={styles.taskCheck}>✓</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === "results" && error && (
          <div style={styles.processingWrap}>
            <div style={styles.processingCard}>
              <p style={{fontSize: 40, marginBottom: 16}}>⚠️</p>
              <h2 style={{...styles.processingTitle, color: "#ff6b6b"}}>Processing failed</h2>
              <p style={{color: "#888", fontSize: 13, marginBottom: 24, textAlign: "center"}}>{error}</p>
              <button style={styles.newBtn} onClick={() => { setStep("upload"); setError(null); setSessionId(null); localStorage.removeItem("repod_session_id"); localStorage.removeItem("repod_has_clips"); }}>
                Try again
              </button>
            </div>
          </div>
        )}

        {step === "results" && !error && (
          <div style={styles.resultsWrap}>
            <div style={styles.resultsHeader}>
              <div>
                <div style={styles.badge}><span style={styles.badgeDot} />{loadingResults ? "Processing..." : "Ready"}</div>
                <h2 style={styles.resultsTitle}>{loadingResults ? "Generating your content..." : "Your content is ready"}</h2>
                <p style={styles.resultsSub}>{loadingResults ? "This may take several minutes for large files" : hasClips ? `7 text assets + ${clipUrls.length} video clips` : "7 text assets generated"}</p>
              </div>
              <button style={styles.newBtn} onClick={() => { setStep("upload"); setAudioUrl(""); setVideoFile(null); setProgress(0); setResults(null); setHasClips(false); setSessionId(null); localStorage.removeItem('repod_session_id'); localStorage.removeItem('repod_has_clips'); localStorage.removeItem('repod_video_duration'); }}>
                + New episode
              </button>
            </div>

            {loadingResults ? (
              <div style={styles.loadingWrap}>
                <div className="spinner" style={{ ...styles.spinner, position: "relative", margin: "0 auto" }} />
                <p style={{ color: "#555", marginTop: 24, fontSize: 13, textAlign: "center" }}>{videoDuration > 0 ? `AI is processing your content · First results appear in ~2 min · Full processing: ~${Math.max(10, Math.round(videoDuration * 0.25))} min` : "AI is processing your content · First results appear in ~2 min..."}</p>
              </div>
            ) : (
              <div style={{ ...styles.resultsGrid, gridTemplateColumns: hasClips && clipUrls.length > 0 ? "1fr 1fr" : "1fr" }}>
                {results && !results.video_clips && hasClips && (
                  <div style={{ gridColumn: "1 / -1", background: "#0f1a0a", border: "1px solid #1a3a1a", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                    <div className="spinner" style={{ width: 16, height: 16, border: "2px solid #1a3a1a", borderTop: "2px solid #E8FF47", borderRadius: "50%", animation: "spin 0.8s linear infinite", flexShrink: 0 }} />
                    <div>
                      <span style={{ color: "#E8FF47", fontSize: 13, fontWeight: 600, fontFamily: "Inter, sans-serif" }}>✂️ Video clips processing</span>
                      <span style={{ color: "#888", fontSize: 12, marginLeft: 8, fontFamily: "Inter, sans-serif" }}>{results.clips_status || "Analyzing your video..."}</span>
                    </div>
                  </div>
                )}
                <div style={styles.panel}>
                  <div style={styles.panelHeader}>
                    <span style={styles.panelTitle}>Written Content</span>
                    <span style={styles.panelCount}>7 assets</span>
                  </div>
                  <div style={styles.tabRow}>
                    {tabs.map(t => (
                      <button key={t.key} style={{ ...styles.tab, ...(activeTab === t.key ? styles.tabActive : {}) }} onClick={() => setActiveTab(t.key)}>
                        {t.icon} {t.label}
                      </button>
                    ))}
                  </div>
                  <SocialCard platform={activeTab} content={results ? (results[activeTab] || "") : ""} onCopy={() => copy(activeTab)} copied={copied === activeTab} />
                </div>

                {hasClips && clipUrls.length > 0 && (
                  <div style={styles.panel}>
                    <div style={styles.panelHeader}>
                      <span style={styles.panelTitle}>Short-Form Clips</span>
                      <span style={styles.panelCount}>{clipUrls.length} clips · Reels / Shorts / TikTok</span>
                    </div>
                    <div style={styles.clipList}>
                      {clipUrls.map((url, index) => (
                        <div key={index} style={styles.clipCard}>
                          <video style={styles.clipVideo} src={url} controls playsInline />
                          <div style={styles.clipInfo}>
                            <p style={styles.clipHook}>{clipTitles[index] || `Clip ${index + 1}`}</p>
                            <a href={url} download style={styles.dlLink}>↓ Download</a>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={styles.platformRow}>
                      {["Instagram Reels", "YouTube Shorts", "TikTok"].map(p => (
                        <span key={p} style={styles.platformTag}>{p}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

const styles = {
  root: { minHeight: "100vh", background: "#0a0a0a", color: "#f0f0f0", fontFamily: "'DM Mono', 'Courier New', monospace", overflowX: "hidden" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 40px", borderBottom: "1px solid #1a1a1a" },
  logo: { display: "flex", alignItems: "center", gap: 10 },
  logoMark: { fontSize: 22, color: "#E8FF47" },
  logoText: { fontSize: 18, fontWeight: 700, letterSpacing: 6, color: "#fff" },
  nav: { display: "flex", alignItems: "center", gap: 12 },
  navBtn: { background: "transparent", border: "1px solid #333", color: "#f0f0f0", padding: "8px 20px", borderRadius: 4, cursor: "pointer", fontSize: 13, letterSpacing: 1 },
  subscribeBtn: { background: "#E8FF47", color: "#0a0a0a", border: "none", padding: "8px 20px", borderRadius: 4, cursor: "pointer", fontSize: 13, fontWeight: 700, letterSpacing: 1 },
  main: { maxWidth: 900, margin: "0 auto", padding: "60px 24px" },
  heroWrap: { textAlign: "center" },
  badge: { display: "inline-flex", alignItems: "center", gap: 8, background: "#111", border: "1px solid #222", borderRadius: 100, padding: "6px 16px", fontSize: 12, color: "#888", letterSpacing: 1, marginBottom: 32 },
  badgeDot: { width: 6, height: 6, borderRadius: "50%", background: "#E8FF47", display: "inline-block", boxShadow: "0 0 6px #E8FF47" },
  hero: { fontSize: "clamp(42px, 7vw, 80px)", fontWeight: 800, lineHeight: 1.05, letterSpacing: -2, marginBottom: 20, fontFamily: "'DM Serif Display', Georgia, serif" },
  heroAccent: { color: "#E8FF47" },
  sub: { fontSize: 17, color: "#888", maxWidth: 520, margin: "0 auto 40px", lineHeight: 1.6 },
  modeRow: { display: "flex", gap: 12, marginBottom: 24, justifyContent: "center" },
  modeBtn: { background: "#0d0d0d", border: "1px solid #1a1a1a", color: "#666", padding: "16px 24px", borderRadius: 12, cursor: "pointer", fontSize: 14, fontWeight: 600, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4, minWidth: 200, transition: "all 0.2s ease" },
  modeBtnActive: { borderColor: "#E8FF47", color: "#f0f0f0", background: "#0f110a" },
  modeSub: { fontSize: 11, color: "#555", fontWeight: 400 },
  modeBadge: { fontSize: 9, background: "#E8FF47", color: "#0a0a0a", padding: "2px 6px", borderRadius: 4, fontWeight: 700, letterSpacing: 1 },
  inputCard: { background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 16, padding: 32, marginBottom: 40, textAlign: "left" },
  inputWrap: { display: "flex", alignItems: "center", gap: 12, background: "#080808", border: "1px solid #222", borderRadius: 10, padding: "12px 16px", marginBottom: 16 },
  inputIcon: { fontSize: 20, flexShrink: 0 },
  input: { flex: 1, background: "transparent", border: "none", color: "#f0f0f0", fontSize: 14, fontFamily: "'DM Mono', monospace", outline: "none" },
  error: { color: "#ff6b6b", fontSize: 12, marginBottom: 12 },
  submitBtn: { width: "100%", background: "#E8FF47", color: "#0a0a0a", border: "none", padding: "14px 32px", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer", letterSpacing: 1, marginBottom: 12 },
  inputHint: { fontSize: 11, color: "#444", textAlign: "center" },
  stats: { display: "flex", justifyContent: "center", gap: 60 },
  stat: { display: "flex", flexDirection: "column", alignItems: "center", gap: 4 },
  statVal: { fontSize: 28, fontWeight: 800, color: "#E8FF47" },
  statLabel: { fontSize: 12, color: "#555", letterSpacing: 1 },
  pricingSection: { marginTop: 80, textAlign: "center" },
  pricingTitle: { fontSize: 28, fontWeight: 800, marginBottom: 32, fontFamily: "'DM Serif Display', Georgia, serif" },
  pricingGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, maxWidth: 700, margin: "0 auto" },
  pricingCard: { background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 16, padding: 32, textAlign: "left" },
  pricingPlan: { fontSize: 12, fontWeight: 700, letterSpacing: 2, color: "#888", marginBottom: 12 },
  pricingPrice: { fontSize: 42, fontWeight: 800, color: "#f0f0f0", marginBottom: 8 },
  pricingDesc: { fontSize: 13, color: "#555", marginBottom: 24 },
  pricingFeatures: { listStyle: "none", padding: 0, margin: "0 0 24px", display: "flex", flexDirection: "column", gap: 10, fontSize: 13, color: "#888" },
  pricingBtn: { width: "100%", background: "transparent", border: "1px solid #333", color: "#f0f0f0", padding: "12px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 },
  feedbackSection: { marginTop: 80, textAlign: "center", paddingBottom: 80 },
  feedbackForm: { maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column", gap: 12 },
  feedbackInput: { background: "#1a1a1a", border: "1px solid #444", borderRadius: 8, padding: "12px 16px", color: "#ffffff", fontSize: 13, fontFamily: "'DM Mono', monospace", outline: "none" },
  feedbackTextarea: { background: "#1a1a1a", border: "1px solid #444", borderRadius: 8, padding: "12px 16px", color: "#ffffff", fontSize: 13, fontFamily: "'DM Mono', monospace", outline: "none", resize: "vertical" },
  feedbackBtn: { background: "#E8FF47", border: "none", color: "#0a0a0a", padding: "12px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 },
  processingWrap: { display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" },
  processingCard: { background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 20, padding: "52px 60px", textAlign: "center", width: "100%", maxWidth: 480 },
  spinnerWrap: { position: "relative", width: 60, height: 60, margin: "0 auto 28px" },
  spinner: { width: 60, height: 60, border: "2px solid #1a1a1a", borderTop: "2px solid #E8FF47", borderRadius: "50%", position: "absolute", top: 0, left: 0 },
  spinnerIcon: { position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", fontSize: 20, color: "#E8FF47" },
  processingTitle: { fontSize: 22, fontWeight: 700, marginBottom: 8, fontFamily: "'DM Serif Display', Georgia, serif" },
  processingFile: { fontSize: 11, color: "#555", marginBottom: 32, wordBreak: "break-all" },
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
  newBtn: { background: "transparent", border: "1px solid #E8FF47", color: "#E8FF47", padding: "10px 24px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, letterSpacing: 1 },
  resultsGrid: { display: "grid", gap: 20 },
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
  clipList: { display: "flex", flexDirection: "column", gap: 16 },
  clipCard: { display: "flex", flexDirection: "column", gap: 8, background: "#080808", border: "1px solid #161616", borderRadius: 10, overflow: "hidden" },
  clipVideo: { width: "100%", aspectRatio: "9/16", maxHeight: 300, background: "#000", objectFit: "contain" },
  clipInfo: { padding: "8px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  clipHook: { fontSize: 12, color: "#ccc", flex: 1 },
  dlLink: { fontSize: 12, color: "#E8FF47", textDecoration: "none", fontWeight: 700 },
  platformRow: { display: "flex", gap: 8, flexWrap: "wrap" },
  platformTag: { fontSize: 11, color: "#444", border: "1px solid #1a1a1a", borderRadius: 100, padding: "4px 12px", letterSpacing: 0.5 },
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Serif+Display&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0a0a0a; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .spinner { animation: spin 1s linear infinite; }
input::placeholder, textarea::placeholder { color: #666; }`;