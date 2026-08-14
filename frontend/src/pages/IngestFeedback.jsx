import { useState, useRef } from 'react';
import { ingestCSV, ingestSingle } from '../services/feedbackService';
import { useAuth } from '../context/AuthContext';

const IngestFeedback = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('csv'); // csv, channels, manual
  
  // CSV Ingestion State
  const [csvFile, setCsvFile] = useState(null);
  const [defaultChannel, setDefaultChannel] = useState('CSV Import');
  const [csvLoading, setCsvLoading] = useState(false);
  const [csvResult, setCsvResult] = useState(null);
  const [csvError, setCsvError] = useState('');
  const fileInputRef = useRef(null);

  // Manual Ingestion State
  const [manualData, setManualData] = useState({
    content: '',
    channel: 'Manual Ingest',
    customerLabel: '',
  });
  const [manualLoading, setManualLoading] = useState(false);
  const [manualSuccess, setManualSuccess] = useState(false);
  const [manualError, setManualError] = useState('');

  // Webhook integration state
  const [copiedText, setCopiedText] = useState('');

  // CSV Drag and Drop
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.csv')) {
        setCsvFile(file);
        setCsvError('');
        setCsvResult(null);
      } else {
        setCsvError('Please drop a valid CSV file.');
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setCsvFile(e.target.files[0]);
      setCsvError('');
      setCsvResult(null);
    }
  };

  const handleCSVUpload = async (e) => {
    e.preventDefault();
    if (!csvFile) {
      setCsvError('Please select a CSV file first.');
      return;
    }

    try {
      setCsvLoading(true);
      setCsvError('');
      setCsvResult(null);

      const res = await ingestCSV(csvFile, defaultChannel);
      if (res.data.success) {
        setCsvResult(res.data);
        setCsvFile(null);
      }
    } catch (err) {
      console.error(err);
      setCsvError(err.response?.data?.error || 'Failed to import CSV file. Ensure format is correct.');
    } finally {
      setCsvLoading(false);
    }
  };

  // Manual submit
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualData.content.trim()) {
      setManualError('Feedback content is required');
      return;
    }

    try {
      setManualLoading(true);
      setManualError('');
      setManualSuccess(false);

      const res = await ingestSingle(manualData);
      if (res.data.success) {
        setManualSuccess(true);
        setManualData({
          content: '',
          channel: 'Manual Ingest',
          customerLabel: '',
        });
      }
    } catch (err) {
      console.error(err);
      setManualError(err.response?.data?.error || 'Failed to ingest feedback item');
    } finally {
      setManualLoading(false);
    }
  };

  // Copy helper
  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(''), 2000);
  };

  const mockWebhookUrl = `${window.location.origin}/api/feedback/ingest/webhook?token=${user?.workspaceId || 'workspace_id'}`;
  const mockApiCode = `curl -X POST "${window.location.origin}/api/feedback/ingest/single" \\
  -H "Content-Type: application/json" \\
  -d '{
    "channel": "API",
    "content": "The application interface is smooth and intuitive.",
    "customerLabel": "user@example.com"
  }'`;

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1>Ingest Customer Feedback</h1>
        <p className="subtitle">Import user testimonials, support tickets, and reviews into your isolation workspace</p>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button 
          onClick={() => setActiveTab('csv')} 
          className={`tab-btn ${activeTab === 'csv' ? 'active' : ''}`}
        >
          📁 CSV File Uploader
        </button>
        <button 
          onClick={() => setActiveTab('channels')} 
          className={`tab-btn ${activeTab === 'channels' ? 'active' : ''}`}
        >
          🔌 Channel Integrations
        </button>
        <button 
          onClick={() => setActiveTab('manual')} 
          className={`tab-btn ${activeTab === 'manual' ? 'active' : ''}`}
        >
          ✍️ Manual Feedback
        </button>
      </div>

      {/* 1. CSV Ingest */}
      {activeTab === 'csv' && (
        <div className="glass-card">
          <h2>Upload CSV Document</h2>
          <p className="subtitle">Upload a batch list of feedback. The importer detects <strong>content</strong> (or <strong>description</strong> / <strong>desc</strong>), <strong>channel</strong>, <strong>customerLabel</strong>, and <strong>sentiment</strong> columns.</p>

          {csvError && (
            <div className="alert alert-error">
              <span>⚠️</span> {csvError}
            </div>
          )}

          {csvResult && (
            <div className="alert alert-success" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>✅</span> <strong>{csvResult.message}</strong>
              </div>
              <div style={{ marginTop: '8px', fontSize: '13px', display: 'flex', gap: '16px' }}>
                <span>Parsed Rows: {csvResult.stats.totalRows}</span>
                <span>Success: {csvResult.stats.imported}</span>
                <span>Failures: {csvResult.stats.failed}</span>
              </div>
              {csvResult.errors && (
                <div style={{ marginTop: '8px', fontSize: '11px', maxHeight: '100px', overflowY: 'auto', width: '100%' }}>
                  <p style={{ fontWeight: 'bold' }}>Failures list:</p>
                  {csvResult.errors.map((e, idx) => (
                    <div key={idx} style={{ color: 'rgba(255,255,255,0.7)' }}>Row {e.row}: {e.error}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleCSVUpload}>
            <div 
              className="upload-zone"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".csv"
                style={{ display: 'none' }}
              />
              <div className="upload-icon">📂</div>
              {csvFile ? (
                <div className="file-pill">
                  <span>📄 {csvFile.name} ({(csvFile.size / 1024).toFixed(1)} KB)</span>
                  <button 
                    type="button" 
                    className="file-remove" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setCsvFile(null);
                    }}
                  >
                    ×
                  </button>
                </div>
              ) : (
                <>
                  <p className="upload-text">Drag and drop your CSV file here, or click to browse</p>
                  <p className="upload-hint">Limit: 5MB. Standard Columns: content/description (required), channel, customerLabel</p>
                </>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Default Channel Source</label>
              <input 
                type="text" 
                value={defaultChannel} 
                onChange={(e) => setDefaultChannel(e.target.value)}
                placeholder="e.g. Product Hunt, CSV Import"
              />
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Used if rows inside the CSV file do not specify a channel column.
              </p>
            </div>

            <button type="submit" className="btn btn-primary" disabled={csvLoading || !csvFile}>
              {csvLoading ? 'Parsing & Analyzing...' : '🚀 Start CSV Ingestion'}
            </button>
          </form>

          {/* Sample CSV preview format */}
          <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--border-light)' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>Supported CSV Format Example (Using 'description')</h3>
            <div className="table-container" style={{ margin: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th>description</th>
                    <th>channel</th>
                    <th>customerLabel</th>
                    <th>sentiment</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>"Love the new analytics module!"</td>
                    <td>Slack</td>
                    <td>customer@company.com</td>
                    <td>POS</td>
                  </tr>
                  <tr>
                    <td>"The system lags during database exports."</td>
                    <td>Email</td>
                    <td>user@domain.com</td>
                    <td>NEG</td>
                  </tr>
                  <tr>
                    <td>"How can I reset my team password?"</td>
                    <td>Zendesk</td>
                    <td>client@app.net</td>
                    <td>NEU</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. Channel Integrations */}
      {activeTab === 'channels' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass-card">
            <h2>Webhook Ingestion Sources</h2>
            <p className="subtitle">Stream live customer feedback automatically from external platforms into your LOOP Workspace.</p>

            <div className="ingest-grid" style={{ marginBottom: '24px' }}>
              <div className="channel-card">
                <div className="channel-header">
                  <div className="channel-icon">💬</div>
                  <span className="channel-title">Slack Integration</span>
                </div>
                <p className="channel-desc">Send feedback comments to a channel webhook to automatically ingest them with sentiment tags.</p>
                <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                  <button 
                    onClick={() => copyToClipboard(mockWebhookUrl, 'slack')}
                    className="btn btn-secondary" 
                    style={{ padding: '8px 12px', fontSize: '11px', width: '100%' }}
                  >
                    {copiedText === 'slack' ? 'Copied! ✅' : 'Copy Webhook URL'}
                  </button>
                </div>
              </div>

              <div className="channel-card">
                <div className="channel-header">
                  <div className="channel-icon">✉️</div>
                  <span className="channel-title">Email Forwarder</span>
                </div>
                <p className="channel-desc">Forward support emails to this dedicated address to catalog customer concerns dynamically.</p>
                <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                  <button 
                    onClick={() => copyToClipboard(`ingest+${user?.workspaceId}@loop-feedback.com`, 'email')}
                    className="btn btn-secondary" 
                    style={{ padding: '8px 12px', fontSize: '11px', width: '100%' }}
                  >
                    {copiedText === 'email' ? 'Copied! ✅' : 'Copy Ingestion Email'}
                  </button>
                </div>
              </div>

              <div className="channel-card">
                <div className="channel-header">
                  <div className="channel-icon">🔌</div>
                  <span className="channel-title">Rest API</span>
                </div>
                <p className="channel-desc">Submit feedback items directly from your mobile app, backend servers, or websites.</p>
                <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                  <button 
                    onClick={() => copyToClipboard(user?.workspaceId || '', 'apiKey')}
                    className="btn btn-secondary" 
                    style={{ padding: '8px 12px', fontSize: '11px', width: '100%' }}
                  >
                    {copiedText === 'apiKey' ? 'Copied! ✅' : 'Copy Workspace ID'}
                  </button>
                </div>
              </div>
            </div>

            <div style={{ backgroundColor: 'rgba(15, 22, 42, 0.9)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--color-primary)' }}>DEVELOPER QUICK-START CURL</span>
                <button 
                  onClick={() => copyToClipboard(mockApiCode, 'curl')}
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px' }}
                >
                  {copiedText === 'curl' ? 'Copied! ✅' : 'Copy Code'}
                </button>
              </div>
              <pre style={{ margin: 0, overflowX: 'auto', fontSize: '12px', color: '#e2e8f0', fontFamily: 'monospace' }}>
                {mockApiCode}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* 3. Manual Feedback */}
      {activeTab === 'manual' && (
        <div className="glass-card">
          <h2>Ingest Feedback Record Manually</h2>
          <p className="subtitle">Manually record a client note, call snippet, or testimonial. Gemini AI will run classification after saving.</p>

          {manualError && (
            <div className="alert alert-error">
              <span>⚠️</span> {manualError}
            </div>
          )}

          {manualSuccess && (
            <div className="alert alert-success">
              <span>✅</span> Feedback item recorded successfully! Go to the explorer to check its sentiment classification.
            </div>
          )}

          <form onSubmit={handleManualSubmit}>
            <div className="form-group">
              <label className="form-label">Feedback Content</label>
              <textarea 
                rows="4"
                value={manualData.content}
                onChange={(e) => setManualData({ ...manualData, content: e.target.value })}
                placeholder="What did the customer say? e.g. The checkout form threw an error when I used Safari..."
                required
              ></textarea>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="form-group">
                <label className="form-label">Channel Source</label>
                <select 
                  value={manualData.channel}
                  onChange={(e) => setManualData({ ...manualData, channel: e.target.value })}
                >
                  <option value="Manual Ingest">Manual Entry</option>
                  <option value="Slack Chat">Slack Chat</option>
                  <option value="Client Call">Client Call</option>
                  <option value="Support Email">Support Email</option>
                  <option value="Intercom Chat">Intercom Chat</option>
                  <option value="Play Store Review">Play Store Review</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Customer Label (Optional)</label>
                <input 
                  type="text" 
                  value={manualData.customerLabel}
                  onChange={(e) => setManualData({ ...manualData, customerLabel: e.target.value })}
                  placeholder="e.g. john.doe@email.com or @twitterHandle"
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={manualLoading}>
              {manualLoading ? 'Ingesting feedback...' : '💾 Save Feedback'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default IngestFeedback;
