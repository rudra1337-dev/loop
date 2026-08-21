import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { CHART_DATA_7D, CHART_DATA_30D } from './constants';

const MockBrowser = ({ inboxFeed }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [previewPeriod, setPreviewPeriod] = useState('7d');

  return (
    <div className="sim-browser-container">
      {/* Mock Header Toolbar */}
      <div className="sim-browser-toolbar">
        {/* Window Controls */}
        <div className="sim-window-controls">
          <span className="sim-window-dot" style={{ background: '#ef4444' }} />
          <span className="sim-window-dot" style={{ background: '#f59e0b' }} />
          <span className="sim-window-dot" style={{ background: '#10b981' }} />
        </div>
        {/* URL Address Bar */}
        <div className="sim-address-bar">
          loop.intelligence/workspace/{activeTab}
        </div>
        <div style={{ width: '50px' }} />
      </div>

      {/* Browser Content */}
      <div className="sim-browser-content">
        
        {/* Sidebar Menu */}
        <div className="sim-sidebar">
          <button
            onClick={() => setActiveTab('dashboard')}
            style={{
              background: activeTab === 'dashboard' ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
              color: activeTab === 'dashboard' ? '#fff' : '#64748b'
            }}
            className="sim-sidebar-btn"
          >
            <span>📊</span> Dashboard
          </button>
          <button
            onClick={() => setActiveTab('trends')}
            style={{
              background: activeTab === 'trends' ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
              color: activeTab === 'trends' ? '#fff' : '#64748b'
            }}
            className="sim-sidebar-btn"
          >
            <span>📈</span> Trends Explorer
          </button>
          <button
            onClick={() => setActiveTab('inbox')}
            style={{
              background: activeTab === 'inbox' ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
              color: activeTab === 'inbox' ? '#fff' : '#64748b'
            }}
            className="sim-sidebar-btn"
          >
            <span>📥</span> Feedback Inbox
            <span className="sim-sidebar-badge">
              {inboxFeed.length}
            </span>
          </button>
        </div>

        {/* View Window */}
        <div className="sim-view-window">
          
          {/* View 1: Dashboard */}
          {activeTab === 'dashboard' && (
            <div className="view-animation-fade">
              <div className="sim-view-header">
                <h4 className="sim-view-title">Dashboard Hub</h4>
                
                <div className="sim-view-tab-pill-container">
                  {['7d', '30d'].map(p => (
                    <button
                      key={p}
                      onClick={() => setPreviewPeriod(p)}
                      style={{
                        background: previewPeriod === p ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                        color: previewPeriod === p ? '#fff' : '#475569'
                      }}
                      className="sim-view-tab-pill"
                    >
                      {p.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="sim-chart-wrapper">
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

              <div className="sim-stats-grid">
                <div className="sim-stat-box">
                  <span className="sim-stat-label">Active Feedback</span>
                  <div className="sim-stat-value">{previewPeriod === '7d' ? '338' : '680'}</div>
                </div>
                <div className="sim-stat-box">
                  <span className="sim-stat-label">Spike Alert rate</span>
                  <div className="sim-stat-value" style={{ color: '#10B981' }}>{previewPeriod === '7d' ? '+24%' : '+45%'}</div>
                </div>
              </div>
            </div>
          )}

          {/* View 2: Trends */}
          {activeTab === 'trends' && (
            <div className="view-animation-fade">
              <h4 className="sim-view-title" style={{ marginBottom: '16px' }}>Spiking Alert Trends</h4>
              <div className="sim-trends-list">
                <div className="sim-trend-row" style={{ background: 'rgba(239, 68, 68, 0.04)', border: '1px solid rgba(239, 68, 68, 0.15)' }}>
                  <div>
                    <div className="sim-trend-title">💳 Billing & Subscriptions</div>
                    <div className="sim-trend-desc">Invoices, payments, and checkout failures.</div>
                  </div>
                  <span className="badge badge-neg">🔥 Spiking (+140%)</span>
                </div>
                <div className="sim-trend-row" style={{ background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
                  <div>
                    <div className="sim-trend-title">🚀 Onboarding & UX</div>
                    <div className="sim-trend-desc">User signup, initial tour, and navigation ease.</div>
                  </div>
                    <span className="badge badge-pos">Normal (+12%)</span>
                </div>
              </div>
            </div>
          )}

          {/* View 3: Inbox */}
          {activeTab === 'inbox' && (
            <div className="view-animation-fade">
              <h4 className="sim-view-title" style={{ marginBottom: '16px' }}>Customer Feedback Inbox</h4>
              <div className="sim-inbox-list">
                {inboxFeed.map((item) => (
                  <div key={item.id} className="sim-inbox-item">
                    <div className="sim-inbox-item-header">
                      <span className="sim-inbox-item-theme">{item.theme}</span>
                      <span className="sim-inbox-item-time">{item.time}</span>
                    </div>
                    <p className="sim-inbox-item-text">{item.text}</p>
                    <div className="sim-inbox-item-footer">
                      <span className="sim-inbox-item-sentiment-badge" style={{
                        background: item.sentiment === 'POS' ? 'rgba(16, 185, 129, 0.08)' : item.sentiment === 'NEG' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(255, 255, 255, 0.04)',
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
  );
};

export default MockBrowser;
