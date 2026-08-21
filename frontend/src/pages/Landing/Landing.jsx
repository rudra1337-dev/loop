import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import MockBrowser from './MockBrowser';
import { PRESETS, INTEGRATIONS, MOCK_INBOX_ITEMS } from './constants';
import "./Landing.css";

const Landing = () => {
  const { user } = useAuth();
  
  const [inputText, setInputText] = useState(PRESETS[0].text);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(PRESETS[0]);
  const [hoveredCard, setHoveredCard] = useState(null);
  
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
    <div className="landing-container">
      
      {/* Background grid canvas with sweeping laser scan line */}
      <div className="laser-grid-container landing-grid" />

      {/* Pulsing Glowing Aura spheres */}
      <div className="glow-circle glow-sphere-1" />
      <div className="glow-circle glow-sphere-2" />
      <div className="glow-circle glow-sphere-3" />

      {/* Navbar section */}
      <header className="landing-header">
        <div className="landing-nav-container">
          {/* Logo link with hover spin */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <span style={{ fontSize: '26px' }} className="logo-spinner">🌀</span>
            <span className="landing-logo-text">LOOP</span>
          </Link>

          {/* Nav items */}
          <nav className="landing-nav">
            <a href="#features" className="nav-link" style={{ color: '#9ca3af', textDecoration: 'none', fontSize: '13.5px', fontWeight: '500', transition: 'color 0.2s', position: 'relative' }}>Features</a>
            <a href="#sandbox" className="nav-link" style={{ color: '#9ca3af', textDecoration: 'none', fontSize: '13.5px', fontWeight: '500', transition: 'color 0.2s', position: 'relative' }}>AI Sandbox</a>
            <a href="#analytics" className="nav-link" style={{ color: '#9ca3af', textDecoration: 'none', fontSize: '13.5px', fontWeight: '500', transition: 'color 0.2s', position: 'relative' }}>Workspace Preview</a>
            
            <div className="landing-nav-divider" />

            {user ? (
              <Link to="/dashboard" className="btn btn-primary premium-cta" style={{ padding: '8px 22px', borderRadius: '20px', fontSize: '13.5px' }}>
                Go to Dashboard ➜
              </Link>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <Link to="/login" style={{ color: '#e5e7eb', textDecoration: 'none', fontSize: '13.5px', fontWeight: '600', transition: 'color 0.2s' }}>Sign In</Link>
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
        <section className="hero-section">
          
          {/* Animated Glow Pill */}
          <div className="hero-pill">
            <span className="hero-dot" />
            <span style={{ color: '#9ca3af' }}>Feature update:</span> 
            <span className="hero-pill-text-gradient">Emerging theme spike warnings</span>
          </div>
          
          {/* Hero text - Iridescent Shimmer */}
          <h1 className="iridescent-title">
            Turn Customer Feedback <br />
            Into Product Growth Insights
          </h1>
          
          <p className="hero-subtitle">
            Consolidate your customer channels instantly. Let our localized NLP classifier catalog sentiments, match custom tags, and trigger real-time spike warnings.
          </p>
          
          <div className="hero-ctas">
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
            <p className="integrations-title">
              Seamless Ingestion Connectors
            </p>
            <div className="integrations-container">
              {INTEGRATIONS.map((int, idx) => (
                <div 
                  key={idx}
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
        <section id="sandbox" className="section-wrapper">
          <div className="section-header">
            <h2 className="section-title">
              Test the AI Sandbox Real-Time
            </h2>
            <p className="section-subtitle">
              Choose a preset below to see how our NLP engine classifies sentiment, extracts key themes, and runs log processing live.
            </p>
          </div>

          <div className="sandbox-grid">
            {/* Input Side - True Hover Border Gradient */}
            <div className="gradient-border-card sandbox-input-card">
              <div>
                <span className="sandbox-presets-label">Select Shortcut Preset</span>
                <div className="sandbox-presets-list">
                  {PRESETS.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => handlePresetSelect(p)}
                      style={{
                        background: inputText === p.text ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                        border: inputText === p.text ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.06)',
                        color: inputText === p.text ? '#fff' : '#9ca3af'
                      }}
                      className="sandbox-preset-btn"
                    >
                      <span>{p.theme.split(' ')[0]}</span>
                      Preset {idx + 1}
                    </button>
                  ))}
                </div>
                
                <span className="sandbox-presets-label">Sandbox Feedback Area</span>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Paste support transcripts, CSV text columns, or store reviews..."
                  className="sandbox-textarea"
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
            <div className="gradient-border-card sandbox-terminal-card">
              
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
                <div className="sandbox-terminal-header">
                  <span className="sandbox-terminal-title">AI Classification Engine</span>
                  <span className="badge sandbox-terminal-badge">
                    Node Synced
                  </span>
                </div>

                {/* If analyzing: display simulation logs. Else: display result */}
                {analyzing ? (
                  <div className="sandbox-terminal-logs">
                    {logs.map((log, i) => (
                      <div key={i} className="sandbox-terminal-log-row">
                        <span className="sandbox-terminal-log-bullet">&gt;</span>
                        <span>{log}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="sandbox-result-container">
                    {/* Sentiment */}
                    <div>
                      <span className="sandbox-result-label">Sentiment Index</span>
                      <div className="sandbox-sentiment-row">
                        <span className={`badge sandbox-sentiment-badge ${
                          result.sentiment === 'POS' ? 'badge-pos' : result.sentiment === 'NEG' ? 'badge-neg' : 'badge-neu'
                        }`}>
                          {result.sentiment === 'POS' ? '🟢 Positive' : result.sentiment === 'NEG' ? '🔴 Negative' : '🟡 Neutral'}
                        </span>
                        <span className="sandbox-score-text">
                          Score: <strong className="sandbox-score-value">{result.score > 0 ? `+${result.score}` : result.score}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Tag Theme */}
                    <div>
                      <span className="sandbox-result-label">Assigned Theme Node</span>
                      <div className="sandbox-theme-node">
                        {result.theme}
                      </div>
                    </div>

                    {/* Keywords */}
                    {result.keywords && (
                      <div>
                        <span className="sandbox-result-label">Parsed Keywords</span>
                        <div className="sandbox-keywords-container">
                          {result.keywords.map((kw, i) => (
                            <span key={i} className="sandbox-keyword-badge">
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
              <div className="sandbox-terminal-footer">
                <span>AI Confidence: <strong>{result.confidence}</strong></span>
                <span>Response latency: <strong>~35ms</strong></span>
              </div>
            </div>
          </div>
        </section>

        {/* WORKSPACE PREVIEW SIMULATOR */}
        <section id="analytics" className="section-wrapper">
          <div className="section-header">
            <span className="badge badge-pos sim-section-header-badge">
              💻 Workspace Simulator
            </span>
            <h2 className="section-title">
              Simulate the Entire Platform UI
            </h2>
            <p className="section-subtitle">
              Switch workspace tabs below to experience our Dashboard charts, Trend calculators, and real-time Inbox streams dynamically.
            </p>
          </div>

          <MockBrowser inboxFeed={inboxFeed} />
        </section>

        {/* CORE FEATURES LISTINGS - Hover gradient cards */}
        <section id="features" className="section-wrapper">
          <div className="section-header">
            <h2 className="section-title">
              Why Product Leaders Choose LOOP
            </h2>
            <p className="section-subtitle">
              The complete set of visual analytical engines to streamline unstructured reviews.
            </p>
          </div>

          <div className="features-grid">
            {/* Card 1 */}
            <div 
              className="gradient-border-card feature-card" 
              style={{ 
                transform: hoveredCard === 1 ? 'translateY(-6px)' : 'translateY(0)',
                boxShadow: hoveredCard === 1 ? '0 20px 40px rgba(99, 102, 241, 0.1)' : 'none'
              }}
              onMouseEnter={() => setHoveredCard(1)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className="feature-icon-wrapper">📥</div>
              <h3 className="feature-title">Multi-Channel Ingestion</h3>
              <p className="feature-desc">
                Directly import CSV spreadsheets or map app reviews cleanly. Automatic columns detection processes fields cleanly.
              </p>
              
              {/* Mini visual element */}
              <div className="feature-footer-stats">
                <span style={{ color: '#34d399' }}>● Auto-mapping ready</span>
                <span>● CSV support</span>
              </div>
            </div>

            {/* Card 2 */}
            <div 
              className="gradient-border-card feature-card" 
              style={{ 
                transform: hoveredCard === 2 ? 'translateY(-6px)' : 'translateY(0)',
                boxShadow: hoveredCard === 2 ? '0 20px 40px rgba(129, 140, 248, 0.1)' : 'none'
              }}
              onMouseEnter={() => setHoveredCard(2)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className="feature-icon-wrapper">🧠</div>
              <h3 className="feature-title">AI Sentiment Tagging</h3>
              <p className="feature-desc">
                Leverage local model inferences to assign category themes and sentiment values immediately upon ingestion.
              </p>
              
              {/* Mini visual element */}
              <div className="feature-footer-stats">
                <span style={{ color: '#a5b4fc' }}>● Gemini 3.5 Flash</span>
                <span>● ~35ms processing</span>
              </div>
            </div>

            {/* Card 3 */}
            <div 
              className="gradient-border-card feature-card" 
              style={{ 
                transform: hoveredCard === 3 ? 'translateY(-6px)' : 'translateY(0)',
                boxShadow: hoveredCard === 3 ? '0 20px 40px rgba(168, 85, 247, 0.1)' : 'none'
              }}
              onMouseEnter={() => setHoveredCard(3)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className="feature-icon-wrapper">⚡</div>
              <h3 className="feature-title">Emerging Spike Alerts</h3>
              <p className="feature-desc">
                Identify complaints and bugs before they scale. Receive automated spike alerts for growth indicators exceeding 30%.
              </p>
              
              {/* Mini visual element */}
              <div className="feature-footer-stats">
                <span style={{ color: '#ef4444' }}>● &ge; 30% Growth thresholds</span>
                <span>● Trend comparison</span>
              </div>
            </div>
          </div>
        </section>

        {/* FINAL CALL TO ACTION CARD */}
        <section className="cta-section">
          <div className="cta-glass-card">
            <h2 className="cta-title">
              Ready to Understand Your Customers?
            </h2>
            <p className="cta-subtitle">
              Register your workspace instantly or log in using the pre-seeded admin credentials to test the interactive inbox workflows.
            </p>
            <div className="cta-buttons">
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
            <div className="cta-trust-bar">
              <span>✓ No credit card required</span>
              <span>✓ 30-second workspace setup</span>
              <span>✓ Seed data preloaded</span>
            </div>
          </div>
        </section>

      </main>

      {/* Premium Footer */}
      <footer className="landing-footer">
        <div className="footer-top-line" />

        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
          <div className="footer-grid">
            {/* Brand column */}
            <div>
              <div className="footer-brand-title">
                <span>🌀</span>
                <span>LOOP</span>
              </div>
              <p className="footer-brand-desc">
                AI-powered customer feedback intelligence. Ingest automatically, analyze trends, and identify spikes.
              </p>
              
              <div className="footer-status-pill">
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
              <h4 className="footer-col-title">Product</h4>
              <ul className="footer-links-list">
                <li><a href="#features" className="footer-link">Features</a></li>
                <li><a href="#sandbox" className="footer-link">AI Sandbox</a></li>
                <li><Link to="/dashboard" className="footer-link">Dashboard View</Link></li>
                <li><Link to="/trends" className="footer-link">Trends Analytics</Link></li>
              </ul>
            </div>

            {/* Resources Column */}
            <div>
              <h4 className="footer-col-title">Resources</h4>
              <ul className="footer-links-list">
                <li><a href="#" className="footer-link">Documentation</a></li>
                <li><a href="#" className="footer-link">API Reference</a></li>
                <li><a href="#" className="footer-link">Security Center</a></li>
                <li><a href="#" className="footer-link">Terms & Privacy</a></li>
              </ul>
            </div>

            {/* Changelog Column */}
            <div>
              <h4 className="footer-col-title" style={{ marginBottom: '16px' }}>Subscribe to Changelog</h4>
              <p className="footer-changelog-desc">
                Receive updates on new connector additions and model changes.
              </p>
              <div className="footer-changelog-form">
                <input 
                  type="email" 
                  placeholder="name@company.com" 
                  className="footer-changelog-input"
                />
                <button 
                  className="btn btn-primary footer-changelog-btn" 
                  onClick={() => alert('Thanks for subscribing!')}
                >
                  Join
                </button>
              </div>
            </div>
          </div>

          {/* Bottom links */}
          <div className="footer-bottom">
            <span className="footer-copyright">
              &copy; 2026 LOOP Customer Feedback Intelligence. All rights reserved.
            </span>

            <div className="footer-bottom-socials">
              <a href="#" className="footer-bottom-social-link">GitHub</a>
              <a href="#" className="footer-bottom-social-link">Twitter</a>
              <a href="#" className="footer-bottom-social-link">Discord</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
