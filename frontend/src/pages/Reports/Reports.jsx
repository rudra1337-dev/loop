import { useState, useEffect, useCallback } from 'react';
import { generateReport, getReports, getReport, exportReportPDF } from '../../services/reportService';
import './Reports.css';

const SENTIMENT_LABEL = { POS: 'Positive', NEU: 'Neutral', NEG: 'Negative' };

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

function daysAgoISO(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

function Reports() {
  const [periodStart, setPeriodStart] = useState(daysAgoISO(7));
  const [periodEnd, setPeriodEnd] = useState(todayISO());
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState(null);

  const [reports, setReports] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState(null);

  const [selectedReport, setSelectedReport] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadReports = useCallback(async () => {
    setListLoading(true);
    setListError(null);
    try {
      const res = await getReports({ page: 1, limit: 20 });
      setReports(res.data.data);
    } catch (err) {
      setListError(err.response?.data?.error || 'Failed to load reports');
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (new Date(periodStart) >= new Date(periodEnd)) {
      setGenerateError('Start date must be before end date');
      return;
    }
    setGenerating(true);
    setGenerateError(null);
    try {
      const res = await generateReport(
        new Date(periodStart).toISOString(),
        new Date(periodEnd).toISOString()
      );
      await loadReports();
      setSelectedReport(res.data.report);
    } catch (err) {
      setGenerateError(err.response?.data?.error || 'Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const openReport = async (id) => {
    setDetailLoading(true);
    try {
      const res = await getReport(id);
      setSelectedReport(res.data.report);
    } catch (err) {
      setListError(err.response?.data?.error || 'Failed to load report');
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px 0' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: 0 }}>Voice of Customer Reports</h1>
        <p className="subtitle" style={{ margin: '4px 0 0 0' }}>
          Generate a leadership-ready digest for any period, backed by real feedback data.
        </p>
      </div>

      <form className="reports__generate-form" onSubmit={handleGenerate}>
        <div style={{ flex: '1 1 200px' }}>
          <label className="form-label">From</label>
          <input
            type="date"
            value={periodStart}
            max={periodEnd}
            onChange={(e) => setPeriodStart(e.target.value)}
          />
        </div>
        <div style={{ flex: '1 1 200px' }}>
          <label className="form-label">To</label>
          <input
            type="date"
            value={periodEnd}
            max={todayISO()}
            onChange={(e) => setPeriodEnd(e.target.value)}
          />
        </div>
        <div>
          <button type="submit" className="btn btn-primary" style={{ height: '46px', whiteSpace: 'nowrap' }} disabled={generating}>
            {generating ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Generating…
              </>
            ) : 'Generate Report'}
          </button>
        </div>
      </form>
      {generateError && <div className="alert alert-error" style={{ marginBottom: '24px' }}>{generateError}</div>}

      <div className="reports-container">
        <div className="reports-sidebar">
          <h2 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>Past Reports</h2>
          {listLoading && <div style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>Loading…</div>}
          {listError && <div className="alert alert-error" style={{ fontSize: '13px', padding: '10px 14px' }}>{listError}</div>}
          {!listLoading && reports.length === 0 && (
            <div style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>No reports generated yet. Pick a period above and generate your first one.</div>
          )}
          <div className="reports-list">
            {reports.map((r) => (
              <button
                key={r.id}
                type="button"
                className={`reports-list-item ${selectedReport?.id === r.id ? 'active' : ''}`}
                onClick={() => openReport(r.id)}
              >
                <div className="reports-list-title">{r.title}</div>
                <div className="reports-list-date">
                  {new Date(r.createdAt).toLocaleDateString()}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          {detailLoading && <div style={{ color: 'var(--color-text-muted)' }}>Loading report…</div>}
          {!detailLoading && !selectedReport && (
            <div className="glass-card" style={{ padding: '64px 24px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
              <h3>No report selected</h3>
              <p className="subtitle" style={{ maxWidth: '400px', margin: '0 auto' }}>
                Select a report from the past reports list on the left, or pick a date range above to generate a new intelligence digest.
              </p>
            </div>
          )}
          {!detailLoading && selectedReport && <ReportDetail report={selectedReport} />}
        </div>
      </div>
    </div>
  );
}

function ReportDetail({ report }) {
  const { stats, narrative } = report.contentJson;
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(null);

  const handleExport = async () => {
    setExporting(true);
    setExportError(null);
    try {
      const res = await exportReportPDF(report.id);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `LOOP-VoC-Report-${report.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('[PDF] Export failed:', err);
      setExportError('Failed to export PDF report. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="report-detail">
      <div className="glass-card" style={{ marginBottom: 0 }}>
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '16px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '24px' }}>{report.title}</h2>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>
              Reporting Period: {new Date(stats.period.start).toLocaleDateString()} – {new Date(stats.period.end).toLocaleDateString()}
            </span>
          </div>
          <button
            onClick={handleExport}
            className="btn btn-secondary btn-sm"
            style={{ padding: '8px 16px', fontSize: '13px' }}
            disabled={exporting}
          >
            {exporting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Exporting PDF…
              </>
            ) : 'Export PDF'}
          </button>
        </div>

        {exportError && (
          <div className="alert alert-error mb-4">
            {exportError}
          </div>
        )}

        {narrative?.summary ? (
          <p style={{ fontSize: '15.5px', lineHeight: '1.6', marginBottom: '24px', color: 'var(--color-text)' }}>{narrative.summary}</p>
        ) : (
          <div className="alert alert-warning mb-4">
            A written narrative wasn't available for this report, but the statistics below are accurate.
          </div>
        )}

        {/* KPI Cards Grid */}
        <div className="report-metrics-grid mb-4">
          <div className="report-metric-card">
            <span className="report-metric-title">Feedback volume</span>
            <span className="report-metric-value">{stats.volume.current}</span>
            <span style={{ fontSize: '11px', marginTop: '4px', fontWeight: '500', color: stats.volume.pctChange >= 0 ? 'var(--color-pos)' : 'var(--color-neg)' }}>
              {stats.volume.pctChange >= 0 ? '▲ +' : '▼ '}{stats.volume.pctChange}% vs previous period
            </span>
          </div>
          <div className="report-metric-card">
            <span className="report-metric-title">Negative sentiment</span>
            <span className="report-metric-value">{stats.sentiment.current.NEG}%</span>
            <span style={{ fontSize: '11px', marginTop: '4px', fontWeight: '500', color: stats.sentiment.shift.NEG > 0 ? 'var(--color-neg)' : 'var(--color-pos)' }}>
              {stats.sentiment.shift.NEG >= 0 ? '▲ +' : '▼ '}{stats.sentiment.shift.NEG}pts vs previous
            </span>
          </div>
        </div>

        {narrative?.sentimentNarrative && (
          <p style={{ fontSize: '14.5px', color: 'var(--color-text-secondary)', marginBottom: '24px', lineHeight: '1.5' }}>{narrative.sentimentNarrative}</p>
        )}

        {/* Top Themes */}
        <h3 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>Top Themes</h3>
        {stats.topThemes.length === 0 && <div style={{ color: 'var(--color-text-muted)', fontSize: '13px', marginBottom: '24px' }}>No theme activity in this period.</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
          {stats.topThemes.map((t) => {
            const themeNarrative = narrative?.themeNarratives?.find((tn) => tn.themeId === t.themeId);
            return (
              <div key={t.themeId} className="theme-group-card">
                <div className="d-flex align-items-center gap-2 mb-3 flex-wrap">
                  <span className="theme-pill" style={{ borderColor: t.color, color: t.color }}>{t.name}</span>
                  <span style={{ color: 'var(--color-text-secondary)', fontSize: '12px' }}>{t.currentCount} items</span>
                  {t.isSpiking && <span className="badge badge-neg">🔥 Spiking +{t.pctChange}%</span>}
                </div>
                {themeNarrative && <p style={{ fontSize: '14px', marginBottom: '12px', lineHeight: '1.5', color: 'var(--color-text)' }}>{themeNarrative.narrative}</p>}

                {/* Quote Bubbles */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                  {t.quotes.map((q) => (
                    <div
                      key={q.id}
                      className="quote-bubble"
                      style={{ borderLeftColor: q.sentiment === 'POS' ? 'var(--color-pos)' : q.sentiment === 'NEG' ? 'var(--color-neg)' : 'var(--color-neu)' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span className={`badge ${q.sentiment === 'POS' ? 'badge-pos' : q.sentiment === 'NEG' ? 'badge-neg' : 'badge-neu'}`}>
                          {SENTIMENT_LABEL[q.sentiment]}
                        </span>
                      </div>
                      <div>"{q.content}"</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Recommended Actions */}
        {narrative?.recommendedActions?.length > 0 && (
          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '20px' }}>
            <h3 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>Recommended Actions</h3>
            <ul style={{ paddingLeft: '20px', color: 'var(--color-text)', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
              {narrative.recommendedActions.map((a, i) => <li key={i} style={{ marginBottom: '6px' }}>{a}</li>)}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default Reports;