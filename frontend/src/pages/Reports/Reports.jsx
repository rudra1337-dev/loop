import { useState, useEffect, useCallback } from 'react';
import { generateReport, getReports, getReport } from '../../services/reportService';
import './Reports.css';

const SENTIMENT_LABEL = { POS: 'Positive', NEU: 'Neutral', NEG: 'Negative' };
const SENTIMENT_BADGE_CLASS = { POS: 'bg-success', NEU: 'bg-secondary', NEG: 'bg-danger' };

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
    <div className="container-fluid py-4">
      <div className="mb-4">
        <h1 className="h3 mb-1">Voice of Customer Reports</h1>
        <p className="text-muted">Generate a leadership-ready digest for any period, backed by real feedback data.</p>
      </div>

      <form className="reports__generate-form " onSubmit={handleGenerate}>
        <div className="col-auto">
          <label className="form-label small text-muted mb-1">From</label>
          <input
            type="date"
            className="form-control form-control-sm"
            value={periodStart}
            max={periodEnd}
            onChange={(e) => setPeriodStart(e.target.value)}
          />
        </div>
        <div className="col-auto">
          <label className="form-label small text-muted mb-1">To</label>
          <input
            type="date"
            className="form-control form-control-sm"
            value={periodEnd}
            max={todayISO()}
            onChange={(e) => setPeriodEnd(e.target.value)}
          />
        </div>
        <div className="col-auto">
          <button type="submit" className="btn btn-primary btn-sm" disabled={generating}>
            {generating ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Generating…
              </>
            ) : 'Generate Report'}
          </button>
        </div>
      </form>
      {generateError && <div className="alert alert-danger py-2">{generateError}</div>}

      <div className="row g-4">
        <div className="col-md-3">
          <h6 className="text-uppercase text-muted small mb-2">Past Reports</h6>
          {listLoading && <div className="text-muted small">Loading…</div>}
          {listError && <div className="alert alert-danger py-2 small">{listError}</div>}
          {!listLoading && reports.length === 0 && (
            <div className="text-muted small">No reports generated yet — pick a period above and generate your first one.</div>
          )}
          <div className="list-group">
            {reports.map((r) => (
              <button
                key={r.id}
                type="button"
                className={`list-group-item list-group-item-action py-2 ${selectedReport?.id === r.id ? 'active' : ''}`}
                onClick={() => openReport(r.id)}
              >
                <div className="fw-semibold small">{r.title}</div>
                <div className={`small ${selectedReport?.id === r.id ? 'text-white-50' : 'text-muted'}`}>
                  {new Date(r.createdAt).toLocaleDateString()}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="col-md-9">
          {detailLoading && <div className="text-muted">Loading report…</div>}
          {!detailLoading && !selectedReport && (
            <div className="text-muted">Select a report from the list, or generate a new one.</div>
          )}
          {!detailLoading && selectedReport && <ReportDetail report={selectedReport} />}
        </div>
      </div>
    </div>
  );
}

function ReportDetail({ report }) {
  const { stats, narrative } = report.contentJson;

  return (
    <div className="report-detail">
      <div className="mb-3">
        <h2 className="h4 mb-1">{report.title}</h2>
        <span className="text-muted small">
          {new Date(stats.period.start).toLocaleDateString()} – {new Date(stats.period.end).toLocaleDateString()}
        </span>
      </div>

      {narrative?.summary ? (
        <p className="fs-6 mb-4">{narrative.summary}</p>
      ) : (
        <div className="alert alert-warning py-2 mb-4">
          A written narrative wasn't available for this report, but the statistics below are accurate.
        </div>
      )}

      <div className="row g-3 mb-4">
        <div className="col-sm-6">
          <div className="card h-100">
            <div className="card-body">
              <div className="fs-3 fw-bold">{stats.volume.current}</div>
              <div className="text-muted small">Feedback items</div>
              <div className={`small mt-1 ${stats.volume.pctChange >= 0 ? 'text-success' : 'text-danger'}`}>
                {stats.volume.pctChange >= 0 ? '+' : ''}{stats.volume.pctChange}% vs previous period
              </div>
            </div>
          </div>
        </div>
        <div className="col-sm-6">
          <div className="card h-100">
            <div className="card-body">
              <div className="fs-3 fw-bold">{stats.sentiment.current.NEG}%</div>
              <div className="text-muted small">Negative sentiment</div>
              <div className={`small mt-1 ${stats.sentiment.shift.NEG > 0 ? 'text-danger' : 'text-success'}`}>
                {stats.sentiment.shift.NEG >= 0 ? '+' : ''}{stats.sentiment.shift.NEG}pts vs previous
              </div>
            </div>
          </div>
        </div>
      </div>

      {narrative?.sentimentNarrative && (
        <p className="text-body-secondary mb-4">{narrative.sentimentNarrative}</p>
      )}

      <h6 className="text-uppercase text-muted small mb-2">Top Themes</h6>
      {stats.topThemes.length === 0 && <div className="text-muted small mb-4">No theme activity in this period.</div>}
      <div className="d-flex flex-column gap-3 mb-4">
        {stats.topThemes.map((t) => {
          const themeNarrative = narrative?.themeNarratives?.find((tn) => tn.themeId === t.themeId);
          return (
            <div key={t.themeId} className="card">
              <div className="card-body">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <span className="theme-pill" style={{ borderColor: t.color }}>{t.name}</span>
                  <span className="text-muted small">{t.currentCount} items</span>
                  {t.isSpiking && <span className="badge bg-danger">🔥 Spiking {t.pctChange}%</span>}
                </div>
                {themeNarrative && <p className="small mb-2">{themeNarrative.narrative}</p>}
                <ul className="list-unstyled mb-0 d-flex flex-column gap-2">
                  {t.quotes.map((q) => (
                    <li key={q.id} className="small d-flex align-items-baseline gap-2">
                      <span className={`badge ${SENTIMENT_BADGE_CLASS[q.sentiment]}`}>{SENTIMENT_LABEL[q.sentiment]}</span>
                      <span className="text-body-secondary">"{q.content}"</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      {narrative?.recommendedActions?.length > 0 && (
        <div>
          <h6 className="text-uppercase text-muted small mb-2">Recommended Actions</h6>
          <ul className="mb-0">
            {narrative.recommendedActions.map((a, i) => <li key={i} className="small mb-1">{a}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

export default Reports;