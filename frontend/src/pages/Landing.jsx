import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const PRESETS = [
  {
    text: "The payment page kept spinning and finally threw a timeout error when I tried to upgrade our team account.",
    sentiment: "NEG",
    score: -0.85,
    theme: "💳 Billing & Subscriptions",
    confidence: "98%",
    keywords: ["payment", "spinning", "timeout", "upgrade", "billing"]
  },
  {
    text: "I really love how clean the dashboard is, but our security team needs SSO and SAML logs before we buy.",
    sentiment: "NEU",
    score: 0.15,
    theme: "🔑 Integrations & API",
    confidence: "94%",
    keywords: ["dashboard", "SSO", "SAML", "integrations", "buy"]
  },
  {
    text: "The new bulk import feature saved our customer support team hours of manual CSV formatting today!",
    sentiment: "POS",
    score: 0.95,
    theme: "🚀 Onboarding & UX",
    confidence: "97%",
    keywords: ["saved", "hours", "import", "CSV", "onboarding"]
  }
];

const INTEGRATIONS = [
  { name: 'Slack', icon: '💬', color: '#4A154B', shadow: 'rgba(74, 21, 75, 0.4)' },
  { name: 'Discord', icon: '🎮', color: '#5865F2', shadow: 'rgba(88, 101, 242, 0.4)' },
  { name: 'App Store', icon: '🍎', color: '#0071E3', shadow: 'rgba(0, 113, 227, 0.4)' },
  { name: 'Zendesk', icon: '🎫', color: '#03363D', shadow: 'rgba(3, 54, 61, 0.4)' },
  { name: 'CSV Loader', icon: '📊', color: '#10B981', shadow: 'rgba(16, 185, 129, 0.4)' }
];

const CHART_DATA_7D = [
  { day: 'Mon', volume: 24, positive: 18, negative: 6 },
  { day: 'Tue', volume: 38, positive: 25, negative: 13 },
  { day: 'Wed', volume: 30, positive: 22, negative: 8 },
  { day: 'Thu', volume: 55, positive: 41, negative: 14 },
  { day: 'Fri', volume: 48, positive: 35, negative: 13 },
  { day: 'Sat', volume: 62, positive: 50, negative: 12 },
  { day: 'Sun', volume: 75, positive: 61, negative: 14 },
];

const CHART_DATA_30D = [
  { day: 'Wk 1', volume: 110, positive: 80, negative: 30 },
  { day: 'Wk 2', volume: 145, positive: 105, negative: 40 },
  { day: 'Wk 3', volume: 185, positive: 140, negative: 45 },
  { day: 'Wk 4', volume: 240, positive: 195, negative: 45 },
];

const MOCK_INBOX_ITEMS = [
  { id: 1, text: "SSO login keeps rejecting active tokens after workspace migrations.", theme: "🔑 Integrations & API", sentiment: "NEG", time: "2 mins ago" },
  { id: 2, text: "Love the new Recharts dashboard, loads instantly on mobile!", theme: "🚀 Onboarding & UX", sentiment: "POS", time: "15 mins ago" },
  { id: 3, text: "Need invoice invoices converted to custom business structures.", theme: "💳 Billing & Subscriptions", sentiment: "NEU", time: "1 hour ago" },
];

const Landing = () => {
  const { user } = useAuth();
  
  const [inputText, setInputText] = useState(PRESETS[0].text);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(PRESETS[0]);
  const [hoveredCard, setHoveredCard] = useState(null);
  
  // Interactive Dashboard Preview Navigation
  const [activeTab, setActiveTab] = useState('dashboard');
  const [previewPeriod, setPreviewPeriod] = useState('7d');
  
  // Dynamic Simulation Inbox records
  const [inboxFeed, setInboxFeed] = useState(MOCK_INBOX_ITEMS);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    if (analyzing) {
      setLogs([]);
      const stepLogs = [
        "Initializing Gemini 3.5 Flash model weights...",
        "Executing semantic tokenization parser...",
        "Classifying feedback sentiment markers...",
        "Identifying workspace theme tag nodes...",
        "Synching data pipelines to inbox feed..."
      ];
      
      stepLogs.forEach((log, idx) => {
        setTimeout(() => {
          setLogs(prev => [...prev, log]);
        }, idx * 120);
      });
    }
  }, [analyzing]);

  const handleAnalyze = (e) => {
    e?.preventDefault();
    if (!inputText.trim()) return;
    
    setAnalyzing(true);
    
    setTimeout(() => {
      let analysisResult = PRESETS.find(p => p.text === inputText);
      if (!analysisResult) {
        const isNeg = /error|fail|broken|crash|slow|bad|pricing|expensive|billing/i.test(inputText);
        const isPos = /love|great|awesome|saved|fast|good|help/i.test(inputText);
        
        const sentiment = isNeg ? "NEG" : isPos ? "POS" : "NEU";
        const score = isNeg ? -0.75 : isPos ? 0.85 : 0.05;
        
        let theme = "🚀 Onboarding & UX";
        if (/invoice|pay|card|price|billing|subscription/i.test(inputText)) {
          theme = "💳 Billing & Subscriptions";
        } else if (/api|webhook|sso|saml|integration/i.test(inputText)) {
          theme = "🔑 Integrations & API";
        } else if (/speed|slow|crash|load|performance/i.test(inputText)) {
          theme = "⚡ App Performance";
        }
        
        analysisResult = {
          text: inputText,
          sentiment,
          score,
          theme,
          confidence: `${Math.floor(Math.random() * 10) + 88}%`,
          keywords: inputText.split(' ').slice(0, 3).map(w => w.replace(/[^a-zA-Z]/g, '').toLowerCase())
        };
      }

      setResult(analysisResult);
      setAnalyzing(false);

      // PUSH sandbox input straight to the top of the simulated Dashboard Workspace Inbox!
      const newInboxItem = {
        id: Date.now(),
        text: analysisResult.text,
        theme: analysisResult.theme,
        sentiment: analysisResult.sentiment,
        time: "Just now"
      };
      setInboxFeed(prev => [newInboxItem, ...prev.slice(0, 3)]);
    }, 750);
  };

  const handlePresetSelect = (preset) => {
    setInputText(preset.text);
    setResult(preset);
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#02040a', 
      color: '#f3f4f6', 
      overflowX: 'hidden', 
      position: 'relative',
      fontFamily: 'var(--font-primary)'
    }}>
      
      {/* Background grid canvas with sweeping laser scan line */}
      <div className="laser-grid-container" style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.012) 1px, transparent 1px)',
        backgroundSize: '50px 50px',
        maskImage: 'radial-gradient(ellipse at 50% 35%, black 60%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(ellipse at 50% 35%, black 60%, transparent 100%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Pulsing Glowing Aura spheres */}
      <div className="glow-circle" style={{
        position: 'absolute',
        top: '-150px',
        left: '25%',
        width: '650px',
        height: '650px',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.16) 0%, transparent 70%)',
        filter: 'blur(100px)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      <div className="glow-circle" style={{
        position: 'absolute',
        top: '200px',
        right: '20%',
        width: '550px',
        height: '550px',
        background: 'radial-gradient(circle, rgba(168, 85, 247, 0.1) 0%, transparent 75%)',
        filter: 'blur(120px)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      <div className="glow-circle" style={{
        position: 'absolute',
        top: '1600px',
        left: '15%',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(6, 182, 212, 0.07) 0%, transparent 70%)',
        filter: 'blur(130px)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Navbar section */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        background: 'rgba(2, 4, 10, 0.7)'
      }}>
        <div style={{
          maxWidth: '1240px',
          margin: '0 auto',
          padding: '18px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          {/* Logo link with hover spin */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <span style={{ fontSize: '26px' }} className="logo-spinner">🌀</span>
            <span style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: '24px',
              letterSpacing: '-0.03em',
              background: 'linear-gradient(135deg, #ffffff 40%, #818cf8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>LOOP</span>
          </Link>

          {/* Nav items */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            <a href="#features" className="nav-link" style={{ color: '#9ca3af', textDecoration: 'none', fontSize: '13.5px', fontWeight: '500', transition: 'color 0.2s', position: 'relative' }}>Features</a>
            <a href="#sandbox" className="nav-link" style={{ color: '#9ca3af', textDecoration: 'none', fontSize: '13.5px', fontWeight: '500', transition: 'color 0.2s', position: 'relative' }}>AI Sandbox</a>
            <a href="#analytics" className="nav-link" style={{ color: '#9ca3af', textDecoration: 'none', fontSize: '13.5px', fontWeight: '500', transition: 'color 0.2s', position: 'relative' }}>Workspace Preview</a>
            
            <div style={{ width: '1px', height: '18px', backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />

            {user ? (
              <Link to="/dashboard" className="btn btn-primary premium-cta" style={{ padding: '8px 22px', borderRadius: '20px', fontSize: '13.5px' }}>
                Go to Dashboard ➜
              </Link>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <Link to="/login" style={{ color: '#e5e7eb', textDecoration: 'none', fontSize: '13.5px', fontWeight: '600', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = '#fff'} onMouseLeave={e => e.target.style.color = '#e5e7eb'}>Sign In</Link>
                <Link to="/signup" className="btn btn-primary premium-cta" style={{ padding: '8px 22px', borderRadius: '20px', fontSize: '13.5px' }}>
                  Start Free
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Main section */}
      <main style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 10 }}>
        
        {/* HERO SECTION */}
        <section style={{ textAlign: 'center', padding: '120px 0 90px 0' }}>
          
          {/* Animated Glow Pill */}
          <div 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '10px', 
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '9999px',
              padding: '6px 18px',
              marginBottom: '32px',
              fontSize: '12.5px',
              fontWeight: '600',
              color: '#e5e7eb',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              backdropFilter: 'blur(10px)'
            }}
          >
            <span style={{
              width: '8px',
              height: '8px',
              backgroundColor: '#10b981',
              borderRadius: '50%',
              display: 'inline-block',
              boxShadow: '0 0 10px #10b981',
              animation: 'pulse 1.5s infinite'
            }} />
            <span style={{ color: '#9ca3af' }}>Feature update:</span> 
            <span style={{
              background: 'linear-gradient(135deg, #a5b4fc, #6366f1)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: '700'
            }}>Emerging theme spike warnings</span>
          </div>
          
          {/* Hero text - Iridescent Shimmer */}
          <h1 className="iridescent-title" style={{
            fontFamily: 'var(--font-display)',
            fontSize: '68px',
            lineHeight: 1.1,
            fontWeight: 800,
            maxWidth: '960px',
            margin: '0 auto 24px auto',
            letterSpacing: '-0.03em',
            background: 'linear-gradient(135deg, #ffffff 10%, #a5b4fc 40%, #818cf8 70%, #ffffff 90%)',
            backgroundSize: '200% auto',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            animation: 'textShimmer 6s linear infinite'
          }}>
            Turn Customer Feedback <br />
            Into Product Growth Insights
          </h1>
          
          <p style={{
            fontSize: '19px',
            color: '#9ca3af',
            maxWidth: '700px',
            margin: '0 auto 44px auto',
            lineHeight: 1.6,
            fontWeight: '400'
          }}>
            Consolidate your customer channels instantly. Let our localized NLP classifier catalog sentiments, match custom tags, and trigger real-time spike warnings.
          </p>
          
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', alignItems: 'center' }}>
            {user ? (
              <Link to="/dashboard" className="btn btn-primary premium-cta" style={{ padding: '14px 40px', fontSize: '15px', borderRadius: '30px' }}>
                Open Workspace Dashboard ➜
              </Link>
            ) : (
              <>
                <Link to="/signup" className="btn btn-primary premium-cta" style={{ padding: '14px 40px', fontSize: '15px', borderRadius: '30px' }}>
                  Create Account Free
                </Link>
                <Link to="/login" className="btn btn-secondary" style={{ padding: '14px 40px', fontSize: '15px', borderRadius: '30px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  Sign in to Demo
                </Link>
              </>
            )}
          </div>

          {/* Integration Strip */}
          <div style={{ marginTop: '100px' }}>
            <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.18em', color: '#4b5563', fontWeight: '800', marginBottom: '28px' }}>
              Seamless Ingestion Connectors
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', flexWrap: 'wrap' }}>
              {INTEGRATIONS.map((int, idx) => (
                <div 
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 24px',
                    borderRadius: '16px',
                    background: 'rgba(255, 255, 255, 0.01)',
                    border: '1px solid rgba(255, 255, 255, 0.03)',
                    color: '#9ca3af',
                    fontSize: '13px',
                    fontWeight: '600',
                    transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                    boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.02)'
                  }}
                  className="integration-card"
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = int.color;
                    e.currentTarget.style.color = '#fff';
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = `0 10px 24px ${int.shadow}, inset 0 1px 1px rgba(255,255,255,0.05)`;
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.03)';
                    e.currentTarget.style.color = '#9ca3af';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'inset 0 1px 1px rgba(255,255,255,0.02)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.01)';
                  }}
                >
                  <span style={{ fontSize: '18px' }}>{int.icon}</span>
                  {int.name}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* INTERACTIVE AI SANDBOX */}
        <section id="sandbox" style={{ padding: '90px 0', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <div style={{ textAlign: 'center', marginBottom: '55px' }}>
            <h2 style={{ fontSize: '38px', fontFamily: 'var(--font-display)', fontWeight: '800', marginBottom: '14px', letterSpacing: '-0.02em', color: '#fff' }}>
              Test the AI Sandbox Real-Time
            </h2>
            <p className="subtitle" style={{ maxWidth: '600px', margin: '0 auto', color: '#9ca3af' }}>
              Choose a preset below to see how our NLP engine classifies sentiment, extracts key themes, and runs log processing live.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: '32px',
            alignItems: 'stretch'
          }}>
            {/* Input Side - True Hover Border Gradient */}
            <div className="gradient-border-card" style={{ 
              margin: 0, 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'space-between', 
              padding: '32px',
              borderRadius: '20px'
            }}>
              <div>
                <span style={{ fontSize: '11px', color: '#818cf8', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Select Shortcut Preset</span>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '22px', marginTop: '10px', flexWrap: 'wrap' }}>
                  {PRESETS.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => handlePresetSelect(p)}
                      style={{
                        padding: '10px 18px',
                        background: inputText === p.text ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                        border: inputText === p.text ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.06)',
                        borderRadius: '30px',
                        color: inputText === p.text ? '#fff' : '#9ca3af',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        transition: 'all 0.3s',
                        outline: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <span>{p.theme.split(' ')[0]}</span>
                      Preset {idx + 1}
                    </button>
                  ))}
                </div>
                
                <span style={{ fontSize: '11px', color: '#818cf8', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sandbox Feedback Area</span>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Paste support transcripts, CSV text columns, or store reviews..."
                  style={{
                    width: '100%',
                    height: '160px',
                    resize: 'none',
                    border: '1px solid rgba(255, 255, 255, 0.07)',
                    background: 'rgba(2, 4, 10, 0.6)',
                    padding: '16px',
                    fontSize: '14px',
                    lineHeight: '1.65',
                    borderRadius: '12px',
                    color: '#fff',
                    marginTop: '10px',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={e => e.target.style.borderColor = 'rgba(99, 102, 241, 0.4)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255, 255, 255, 0.07)'}
                />
              </div>

              <button
                onClick={handleAnalyze}
                disabled={analyzing || !inputText.trim()}
                className="btn btn-primary premium-cta"
                style={{ width: '100%', marginTop: '24px', padding: '14px', borderRadius: '12px', fontWeight: '700' }}
              >
                {analyzing ? '⚡ Model Parsing...' : 'Run Extraction Model'}
              </button>
            </div>

            {/* Simulated processing Terminal output */}
            <div className="gradient-border-card" style={{
              margin: 0,
              background: 'rgba(5, 8, 18, 0.8)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden',
              padding: '32px',
              borderRadius: '20px'
            }}>
              
              {/* Scan effect */}
              {analyzing && (
                <div style={{
                  position: 'absolute',
                  top: 0, left: 0, right: 0, bottom: 0,
                  background: 'linear-gradient(to bottom, transparent 0%, rgba(99, 102, 241, 0.12) 50%, transparent 100%)',
                  animation: 'scanning 0.8s linear infinite',
                  zIndex: 2,
                  pointerEvents: 'none'
                }} />
              )}

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '14px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#64748b' }}>AI Classification Engine</span>
                  <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.2)', fontSize: '11px', fontWeight: '700' }}>
                    Node Synced
                  </span>
                </div>

                {/* If analyzing: display simulation logs. Else: display result */}
                {analyzing ? (
                  <div style={{ fontFamily: 'monospace', fontSize: '13px', color: '#818cf8', display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '190px' }}>
                    {logs.map((log, i) => (
                      <div key={i} style={{ display: 'flex', gap: '8px' }}>
                        <span style={{ color: '#4f46e5' }}>&gt;</span>
                        <span>{log}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                    {/* Sentiment */}
                    <div>
                      <span className="form-label" style={{ fontSize: '10px', color: '#64748b' }}>Sentiment Index</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                        <span className={`badge ${
                          result.sentiment === 'POS' ? 'badge-pos' : result.sentiment === 'NEG' ? 'badge-neg' : 'badge-neu'
                        }`} style={{ fontSize: '13px', padding: '6px 16px', fontWeight: '700' }}>
                          {result.sentiment === 'POS' ? '🟢 Positive' : result.sentiment === 'NEG' ? '🔴 Negative' : '🟡 Neutral'}
                        </span>
                        <span style={{ color: '#9ca3af', fontSize: '13px' }}>
                          Score: <strong style={{ color: '#fff' }}>{result.score > 0 ? `+${result.score}` : result.score}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Tag Theme */}
                    <div>
                      <span className="form-label" style={{ fontSize: '10px', color: '#64748b' }}>Assigned Theme Node</span>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '700',
                        color: '#fff',
                        background: 'rgba(255, 255, 255, 0.02)',
                        padding: '14px 18px',
                        borderRadius: '10px',
                        marginTop: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.04)',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.15)'
                      }}>
                        {result.theme}
                      </div>
                    </div>

                    {/* Keywords */}
                    {result.keywords && (
                      <div>
                        <span className="form-label" style={{ fontSize: '10px', color: '#64748b' }}>Parsed Keywords</span>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                          {result.keywords.map((kw, i) => (
                            <span key={i} style={{ background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.15)', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', color: '#a5b4fc', fontWeight: '500' }}>
                              #{kw}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Console specs */}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '18px', marginTop: '24px', fontSize: '11px', color: '#4b5563' }}>
                <span>AI Confidence: <strong style={{ color: '#9ca3af' }}>{result.confidence}</strong></span>
                <span>Response latency: <strong style={{ color: '#9ca3af' }}>~35ms</strong></span>
              </div>
            </div>
          </div>
        </section>

        {/* FULLY FUNCTIONAL MOCK WORKSPACE PREVIEW (Dashboard, Trends, Inbox) */}
        <section id="analytics" style={{ padding: '90px 0', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <div style={{ textAlign: 'center', marginBottom: '55px' }}>
            <span className="badge badge-pos" style={{ marginBottom: '16px', textTransform: 'uppercase', padding: '6px 12px', letterSpacing: '0.05em' }}>
              💻 Workspace Simulator
            </span>
            <h2 style={{ fontSize: '40px', fontFamily: 'var(--font-display)', fontWeight: '800', marginBottom: '18px', letterSpacing: '-0.02em', color: '#fff' }}>
              Simulate the Entire Platform UI
            </h2>
            <p className="subtitle" style={{ maxWidth: '600px', margin: '0 auto', color: '#9ca3af' }}>
              Switch workspace tabs below to experience our Dashboard charts, Trend calculators, and real-time Inbox streams dynamically.
            </p>
          </div>

          {/* Browser Container */}
          <div style={{
            background: '#070b13',
            border: '1px solid rgba(255, 255, 255, 0.07)',
            borderRadius: '20px',
            overflow: 'hidden',
            boxShadow: '0 30px 70px rgba(0, 0, 0, 0.6)'
          }}>
            {/* Mock Header Toolbar */}
            <div style={{
              background: '#0d111c',
              padding: '14px 20px',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              {/* Window Controls */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{ width: '12px', height: '12px', background: '#ef4444', borderRadius: '50%', display: 'inline-block' }} />
                <span style={{ width: '12px', height: '12px', background: '#f59e0b', borderRadius: '50%', display: 'inline-block' }} />
                <span style={{ width: '12px', height: '12px', background: '#10b981', borderRadius: '50%', display: 'inline-block' }} />
              </div>
              {/* URL Address Bar */}
              <div style={{
                background: 'rgba(0,0,0,0.3)',
                padding: '6px 100px',
                borderRadius: '8px',
                fontSize: '11px',
                color: '#64748b',
                border: '1px solid rgba(255,255,255,0.03)',
                fontFamily: 'monospace'
              }}>
                loop.intelligence/workspace/{activeTab}
              </div>
              <div style={{ width: '50px' }} />
            </div>

            {/* Browser Content */}
            <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', minHeight: '380px' }}>
              
              {/* Sidebar Menu */}
              <div style={{
                background: '#090d16',
                borderRight: '1px solid rgba(255,255,255,0.04)',
                padding: '24px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    background: activeTab === 'dashboard' ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                    color: activeTab === 'dashboard' ? '#fff' : '#64748b',
                    fontSize: '13px',
                    fontWeight: '600',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <span>📊</span> Dashboard
                </button>
                <button
                  onClick={() => setActiveTab('trends')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    background: activeTab === 'trends' ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                    color: activeTab === 'trends' ? '#fff' : '#64748b',
                    fontSize: '13px',
                    fontWeight: '600',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <span>📈</span> Trends Explorer
                </button>
                <button
                  onClick={() => setActiveTab('inbox')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    background: activeTab === 'inbox' ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                    color: activeTab === 'inbox' ? '#fff' : '#64748b',
                    fontSize: '13px',
                    fontWeight: '600',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <span>📥</span> Feedback Inbox
                  <span style={{ fontSize: '9px', background: '#3b82f6', color: '#fff', padding: '2px 6px', borderRadius: '10px', marginLeft: 'auto' }}>
                    {inboxFeed.length}
                  </span>
                </button>
              </div>

              {/* View Window */}
              <div style={{ padding: '32px', background: '#070b13' }}>
                
                {/* View 1: Dashboard */}
                {activeTab === 'dashboard' && (
                  <div className="view-animation-fade">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                      <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#fff' }}>Dashboard Hub</h4>
                      
                      <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.02)', padding: '3px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        {['7d', '30d'].map(p => (
                          <button
                            key={p}
                            onClick={() => setPreviewPeriod(p)}
                            style={{
                              padding: '4px 12px',
                              background: previewPeriod === p ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                              border: 'none',
                              borderRadius: '15px',
                              color: previewPeriod === p ? '#fff' : '#475569',
                              fontSize: '10px',
                              fontWeight: '700',
                              cursor: 'pointer'
                            }}
                          >
                            {p.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{ width: '100%', height: 180, marginBottom: '20px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={previewPeriod === '7d' ? CHART_DATA_7D : CHART_DATA_30D} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorPreviewVol" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#818cf8" stopOpacity={0.25}/>
                              <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="day" stroke="#334155" fontSize={10} tickLine={false} />
                          <YAxis stroke="#334155" fontSize={10} tickLine={false} />
                          <Area type="monotone" dataKey="volume" stroke="#818cf8" strokeWidth={2} fillOpacity={1} fill="url(#colorPreviewVol)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '10px' }}>
                        <span style={{ fontSize: '9px', textTransform: 'uppercase', color: '#64748b', fontWeight: '800' }}>Active Feedback</span>
                        <div style={{ fontSize: '20px', fontWeight: '800', color: '#fff', marginTop: '2px' }}>{previewPeriod === '7d' ? '338' : '680'}</div>
                      </div>
                      <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '10px' }}>
                        <span style={{ fontSize: '9px', textTransform: 'uppercase', color: '#64748b', fontWeight: '800' }}>Spike Alert rate</span>
                        <div style={{ fontSize: '20px', fontWeight: '800', color: '#10B981', marginTop: '2px' }}>{previewPeriod === '7d' ? '+24%' : '+45%'}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* View 2: Trends */}
                {activeTab === 'trends' && (
                  <div className="view-animation-fade">
                    <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '700', color: '#fff' }}>Spiking Alert Trends</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', justifycontent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(239, 68, 68, 0.04)', border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: '12px' }}>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>💳 Billing & Subscriptions</div>
                          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Invoices, payments, and checkout failures.</div>
                        </div>
                        <span className="badge badge-neg" style={{ fontSize: '11px', padding: '4px 10px' }}>🔥 Spiking (+140%)</span>
                      </div>
                      <div style={{ display: 'flex', justifycontent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '12px' }}>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>🚀 Onboarding & UX</div>
                          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>User signup, initial tour, and navigation ease.</div>
                        </div>
                        <span className="badge badge-pos" style={{ fontSize: '11px', padding: '4px 10px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.15)' }}>Normal (+12%)</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* View 3: Inbox */}
                {activeTab === 'inbox' && (
                  <div className="view-animation-fade">
                    <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '700', color: '#fff' }}>Customer Feedback Inbox</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '250px', overflowY: 'auto' }}>
                      {inboxFeed.map((item) => (
                        <div 
                          key={item.id} 
                          className="inbox-slide-item"
                          style={{ 
                            padding: '12px 16px', 
                            background: 'rgba(255,255,255,0.01)', 
                            border: '1px solid rgba(255,255,255,0.04)', 
                            borderRadius: '10px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                            <span style={{ color: '#818cf8', fontWeight: '600' }}>{item.theme}</span>
                            <span style={{ color: '#4b5563' }}>{item.time}</span>
                          </div>
                          <p style={{ margin: 0, fontSize: '12.5px', color: '#cbd5e1', lineHeight: '1.4' }}>{item.text}</p>
                          <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                            <span style={{
                              fontSize: '9px',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: item.sentiment === 'POS' ? 'rgba(16, 185, 129, 0.08)' : item.sentiment === 'NEG' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(255,255,255,0.04)',
                              color: item.sentiment === 'POS' ? '#34d399' : item.sentiment === 'NEG' ? '#f87171' : '#9ca3af'
                            }}>{item.sentiment === 'POS' ? 'Positive' : item.sentiment === 'NEG' ? 'Negative' : 'Neutral'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        </section>

        {/* CORE FEATURES LISTINGS - Hover gradient cards */}
        <section id="features" style={{ padding: '90px 0', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <div style={{ textAlign: 'center', marginBottom: '55px' }}>
            <h2 style={{ fontSize: '38px', fontFamily: 'var(--font-display)', fontWeight: '800', marginBottom: '14px', letterSpacing: '-0.02em', color: '#fff' }}>
              Why Product Leaders Choose LOOP
            </h2>
            <p className="subtitle" style={{ maxWidth: '600px', margin: '0 auto', color: '#9ca3af' }}>
              The complete set of visual analytical engines to streamline unstructured reviews.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '30px'
          }}>
            {/* Card 1 */}
            <div 
              className="gradient-border-card" 
              style={{ 
                margin: 0, 
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                transform: hoveredCard === 1 ? 'translateY(-6px)' : 'translateY(0)',
                boxShadow: hoveredCard === 1 ? '0 20px 40px rgba(99, 102, 241, 0.1)' : 'none',
                padding: '32px',
                borderRadius: '20px'
              }}
              onMouseEnter={() => setHoveredCard(1)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div style={{
                width: '48px', height: '48px', borderRadius: '12px',
                background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', marginBottom: '24px'
              }}>📥</div>
              <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#fff', marginBottom: '12px' }}>Multi-Channel Ingestion</h3>
              <p style={{ color: '#9ca3af', fontSize: '13.5px', lineHeight: 1.65, marginBottom: '20px' }}>
                Directly import CSV spreadsheets or map app reviews cleanly. Automatic columns detection processes fields cleanly.
              </p>
              
              {/* Mini visual element */}
              <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px', fontSize: '11px', color: '#64748b' }}>
                <span style={{ color: '#34d399' }}>● Auto-mapping ready</span>
                <span>● CSV support</span>
              </div>
            </div>

            {/* Card 2 */}
            <div 
              className="gradient-border-card" 
              style={{ 
                margin: 0, 
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                transform: hoveredCard === 2 ? 'translateY(-6px)' : 'translateY(0)',
                boxShadow: hoveredCard === 2 ? '0 20px 40px rgba(129, 140, 248, 0.1)' : 'none',
                padding: '32px',
                borderRadius: '20px'
              }}
              onMouseEnter={() => setHoveredCard(2)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div style={{
                width: '48px', height: '48px', borderRadius: '12px',
                background: 'rgba(129, 140, 248, 0.08)', border: '1px solid rgba(129, 140, 248, 0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', marginBottom: '24px'
              }}>🧠</div>
              <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#fff', marginBottom: '12px' }}>AI Sentiment Tagging</h3>
              <p style={{ color: '#9ca3af', fontSize: '13.5px', lineHeight: 1.65, marginBottom: '20px' }}>
                Leverage local model inferences to assign category themes and sentiment values immediately upon ingestion.
              </p>
              
              {/* Mini visual element */}
              <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px', fontSize: '11px', color: '#64748b' }}>
                <span style={{ color: '#a5b4fc' }}>● Gemini 3.5 Flash</span>
                <span>● ~35ms processing</span>
              </div>
            </div>

            {/* Card 3 */}
            <div 
              className="gradient-border-card" 
              style={{ 
                margin: 0, 
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                transform: hoveredCard === 3 ? 'translateY(-6px)' : 'translateY(0)',
                boxShadow: hoveredCard === 3 ? '0 20px 40px rgba(168, 85, 247, 0.1)' : 'none',
                padding: '32px',
                borderRadius: '20px'
              }}
              onMouseEnter={() => setHoveredCard(3)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div style={{
                width: '48px', height: '48px', borderRadius: '12px',
                background: 'rgba(168, 85, 247, 0.08)', border: '1px solid rgba(168, 85, 247, 0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', marginBottom: '24px'
              }}>⚡</div>
              <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#fff', marginBottom: '12px' }}>Emerging Spike Alerts</h3>
              <p style={{ color: '#9ca3af', fontSize: '13.5px', lineHeight: 1.65, marginBottom: '20px' }}>
                Identify complaints and bugs before they scale. Receive automated spike alerts for growth indicators exceeding 30%.
              </p>
              
              {/* Mini visual element */}
              <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px', fontSize: '11px', color: '#64748b' }}>
                <span style={{ color: '#ef4444' }}>● &ge; 30% Growth thresholds</span>
                <span>● Trend comparison</span>
              </div>
            </div>
          </div>
        </section>

        {/* FINAL CALL TO ACTION CARD */}
        <section style={{ padding: '80px 0 120px 0' }}>
          <div className="glass-card" style={{
            margin: 0,
            padding: '70px 40px',
            textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.05) 100%)',
            borderColor: 'rgba(99, 102, 241, 0.3)',
            boxShadow: '0 0 50px rgba(99, 102, 241, 0.1)',
            borderRadius: '24px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <h2 style={{ fontSize: '44px', fontFamily: 'var(--font-display)', fontWeight: '800', color: '#fff', marginBottom: '18px', letterSpacing: '-0.02em' }}>
              Ready to Understand Your Customers?
            </h2>
            <p className="subtitle" style={{ maxWidth: '640px', margin: '0 auto 36px auto', fontSize: '15.5px', color: '#9ca3af', lineHeight: 1.6 }}>
              Register your workspace instantly or log in using the pre-seeded admin credentials to test the interactive inbox workflows.
            </p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {user ? (
                <Link to="/dashboard" className="btn btn-primary premium-cta" style={{ padding: '14px 44px', borderRadius: '30px', fontWeight: '700' }}>
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link to="/signup" className="btn btn-primary premium-cta" style={{ padding: '14px 44px', borderRadius: '30px', fontWeight: '700' }}>
                    Create Account Free
                  </Link>
                  <Link to="/login" className="btn btn-secondary" style={{ padding: '14px 44px', borderRadius: '30px', fontWeight: '700', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    Explore Demo
                  </Link>
                </>
              )}
            </div>
            
            {/* Small trust features pill strip */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', flexWrap: 'wrap', marginTop: '40px', fontSize: '12px', color: '#4b5563' }}>
              <span>✓ No credit card required</span>
              <span>✓ 30-second workspace setup</span>
              <span>✓ Seed data preloaded</span>
            </div>
          </div>
        </section>

      </main>

      {/* Premium Footer */}
      <footer style={{ 
        borderTop: '1px solid rgba(255, 255, 255, 0.04)', 
        background: '#010206', 
        padding: '80px 24px 40px 24px',
        position: 'relative'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: '10%',
          right: '10%',
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.25), transparent)',
          pointerEvents: 'none'
        }} />

        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '40px',
            marginBottom: '60px'
          }}>
            {/* Brand column */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '22px' }}>🌀</span>
                <span style={{ fontWeight: '800', color: '#fff', fontSize: '18px', letterSpacing: '-0.02em' }}>LOOP</span>
              </div>
              <p style={{ color: '#6b7280', fontSize: '13px', lineHeight: '1.65', marginTop: '16px', maxWidth: '240px' }}>
                AI-powered customer feedback intelligence. Ingest automatically, analyze trends, and identify spikes.
              </p>
              
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                marginTop: '20px',
                padding: '6px 14px',
                background: 'rgba(16, 185, 129, 0.05)',
                border: '1px solid rgba(16, 185, 129, 0.15)',
                borderRadius: '30px',
                fontSize: '11.5px',
                color: '#34d399',
                fontWeight: '600'
              }}>
                <span className="pulsing-dot" style={{
                  width: '6px',
                  height: '6px',
                  backgroundColor: '#10b981',
                  borderRadius: '50%',
                  display: 'inline-block',
                  boxShadow: '0 0 8px #10b981'
                }} />
                All Systems Operational
              </div>
            </div>

            {/* Product Column */}
            <div>
              <h4 style={{ color: '#f3f4f6', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '20px' }}>Product</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <li><a href="#features" style={{ color: '#9ca3af', textDecoration: 'none', fontSize: '13.5px', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = '#fff'} onMouseLeave={e => e.target.style.color = '#9ca3af'}>Features</a></li>
                <li><a href="#sandbox" style={{ color: '#9ca3af', textDecoration: 'none', fontSize: '13.5px', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = '#fff'} onMouseLeave={e => e.target.style.color = '#9ca3af'}>AI Sandbox</a></li>
                <li><Link to="/dashboard" style={{ color: '#9ca3af', textDecoration: 'none', fontSize: '13.5px', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = '#fff'} onMouseLeave={e => e.target.style.color = '#9ca3af'}>Dashboard View</Link></li>
                <li><Link to="/trends" style={{ color: '#9ca3af', textDecoration: 'none', fontSize: '13.5px', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = '#fff'} onMouseLeave={e => e.target.style.color = '#9ca3af'}>Trends Analytics</Link></li>
              </ul>
            </div>

            {/* Resources Column */}
            <div>
              <h4 style={{ color: '#f3f4f6', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '20px' }}>Resources</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <li><a href="#" style={{ color: '#9ca3af', textDecoration: 'none', fontSize: '13.5px', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = '#fff'} onMouseLeave={e => e.target.style.color = '#9ca3af'}>Documentation</a></li>
                <li><a href="#" style={{ color: '#9ca3af', textDecoration: 'none', fontSize: '13.5px', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = '#fff'} onMouseLeave={e => e.target.style.color = '#9ca3af'}>API Reference</a></li>
                <li><a href="#" style={{ color: '#9ca3af', textDecoration: 'none', fontSize: '13.5px', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = '#fff'} onMouseLeave={e => e.target.style.color = '#9ca3af'}>Security Center</a></li>
                <li><a href="#" style={{ color: '#9ca3af', textDecoration: 'none', fontSize: '13.5px', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = '#fff'} onMouseLeave={e => e.target.style.color = '#9ca3af'}>Terms & Privacy</a></li>
              </ul>
            </div>

            {/* Changelog Column */}
            <div>
              <h4 style={{ color: '#f3f4f6', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>Subscribe to Changelog</h4>
              <p style={{ color: '#6b7280', fontSize: '13px', lineHeight: '1.6', marginBottom: '16px' }}>
                Receive updates on new connector additions and model changes.
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="email" 
                  placeholder="name@company.com" 
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    fontSize: '12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    background: 'rgba(255, 255, 255, 0.02)',
                    color: '#fff',
                    outline: 'none'
                  }}
                />
                <button 
                  className="btn btn-primary" 
                  style={{ 
                    padding: '10px 16px', 
                    borderRadius: '8px', 
                    fontSize: '12px', 
                    fontWeight: '700',
                    whiteSpace: 'nowrap'
                  }}
                  onClick={() => alert('Thanks for subscribing!')}
                >
                  Join
                </button>
              </div>
            </div>
          </div>

          {/* Bottom links */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            paddingTop: '32px'
          }}>
            <span style={{ fontSize: '12px', color: '#4b5563' }}>
              &copy; 2026 LOOP Customer Feedback Intelligence. All rights reserved.
            </span>

            <div style={{ display: 'flex', gap: '20px' }}>
              <a href="#" style={{ color: '#4b5563', textDecoration: 'none', fontSize: '13.5px', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = '#fff'} onMouseLeave={e => e.target.style.color = '#4b5563'}>GitHub</a>
              <a href="#" style={{ color: '#4b5563', textDecoration: 'none', fontSize: '13.5px', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = '#fff'} onMouseLeave={e => e.target.style.color = '#4b5563'}>Twitter</a>
              <a href="#" style={{ color: '#4b5563', textDecoration: 'none', fontSize: '13.5px', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = '#fff'} onMouseLeave={e => e.target.style.color = '#4b5563'}>Discord</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Styled Premium Classes & Keyframes */}
      <style>{`
        /* True modern CSS Masked Gradient Borders */
        .gradient-border-card {
          position: relative;
          background: rgba(10, 15, 30, 0.35);
          border: 1px solid rgba(255, 255, 255, 0.04);
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .gradient-border-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          border-radius: 20px;
          padding: 1.5px;
          background: linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.01), rgba(255,255,255,0.08));
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
          transition: background 0.4s;
        }
        .gradient-border-card:hover::before {
          background: linear-gradient(135deg, #6366f1, #a855f7, #06b6d4);
        }

        /* Iridescent text gradient shimmer animation */
        @keyframes textShimmer {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }

        /* Laser Sweep Line on Grid */
        .laser-grid-container {
          position: relative;
        }
        .laser-grid-container::after {
          content: '';
          position: absolute;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.3), rgba(6, 182, 212, 0.3), transparent);
          animation: laserSweep 8s linear infinite;
        }
        @keyframes laserSweep {
          0% { top: 0%; opacity: 0; }
          5% { opacity: 1; }
          95% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }

        /* Logo Spin animation on hover */
        .logo-spinner {
          display: inline-block;
          transition: transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        a:hover .logo-spinner {
          transform: rotate(360deg);
        }

        /* Nav links underline hover animation */
        .nav-link::after {
          content: '';
          position: absolute;
          width: 0;
          height: 1px;
          bottom: -4px;
          left: 0;
          background: linear-gradient(90deg, #6366f1, #a855f7);
          transition: width 0.3s ease;
        }
        .nav-link:hover::after {
          width: 100%;
        }
        .nav-link:hover {
          color: #fff !important;
        }

        /* Scanning overlay animation for AI sandbox processing */
        @keyframes scanning {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(200%); }
        }

        /* Dot pulse animation */
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.15); }
        }

        .pulsing-dot {
          animation: pulse 1.6s infinite ease-in-out;
        }

        /* Float floating background glow spheres */
        .glow-circle {
          animation: floatingGlow 14s ease-in-out infinite alternate;
        }
        @keyframes floatingGlow {
          0% { transform: translate(0px, 0px) scale(1); }
          100% { transform: translate(40px, -50px) scale(1.15); }
        }

        /* Premium button shimmer sweep effect */
        .premium-cta {
          position: relative;
          overflow: hidden;
          box-shadow: 0 4px 18px rgba(99, 102, 241, 0.3);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .premium-cta::after {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(to right, transparent, rgba(255,255,255,0.12), transparent);
          transform: rotate(30deg);
          transition: 0.8s;
          opacity: 0;
        }
        .premium-cta:hover::after {
          left: 120%;
          opacity: 1;
        }
        .premium-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(99, 102, 241, 0.45);
        }

        /* View tab transition animations */
        .view-animation-fade {
          animation: viewFadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes viewFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Slide down entrance for new inbox item ingestion */
        .inbox-slide-item {
          animation: slideDownIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes slideDownIn {
          from { opacity: 0; transform: translateY(-20px); filter: blur(5px); }
          to { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
      `}</style>
    </div>
  );
};

export default Landing;
