import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  generateReport,
  getReports,
  exportReportPDF,
} from '../../services/reportService';
import PageHeader from '../../components/common/PageHeader/PageHeader';
import ErrorState from '../../components/common/ErrorState/ErrorState';
import EmptyState from '../../components/common/EmptyState/EmptyState';
import logger from '../../utils/logger';
import './Reports.css';

const PRESETS = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
];

function toISODate(date) {
  return date.toISOString().split('T')[0];
}

function todayISO() {
  return toISODate(new Date());
}

function daysAgoISO(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return toISODate(date);
}

function ReportActions({ report, onExported }) {
  const navigate = useNavigate();
  const [exporting, setExporting] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareReport = async () => {
    const url = `${window.location.origin}/reports/${report.id}`;

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt('Copy this report link:', url);
    }
  };

  const exportPDF = async (event) => {
    event.stopPropagation();
    setExporting(true);

    try {
      const response = await exportReportPDF(report.id);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = url;
      link.download = `LOOP-VoC-Report-${report.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      onExported?.();
    } catch (error) {
      logger.error('[PDF] Export failed', { error, reportId: report.id });
      window.alert('Failed to export the report PDF. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="d-flex flex-wrap gap-2">
      <button
        type="button"
        className="btn btn-outline-secondary btn-sm"
        onClick={() => navigate(`/reports/${report.id}`)}
      >
        View
      </button>

      <button
        type="button"
        className="btn btn-outline-secondary btn-sm"
        onClick={exportPDF}
        disabled={exporting}
      >
        {exporting ? 'Exporting…' : 'Export PDF'}
      </button>

      <button
        type="button"
        className="btn btn-outline-primary btn-sm"
        onClick={(event) => {
          event.stopPropagation();
          shareReport();
        }}
      >
        {copied ? '✓ Copied' : 'Share'}
      </button>
    </div>
  );
}

function Reports() {
  const navigate = useNavigate();

  const [periodStart, setPeriodStart] = useState(daysAgoISO(7));
  const [periodEnd, setPeriodEnd] = useState(todayISO());
  const [selectedPreset, setSelectedPreset] = useState('Last 7 days');

  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState(null);

  const [reports, setReports] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState(null);

  const loadReports = useCallback(async (requestedPage = page) => {
    setListLoading(true);
    setListError(null);

    try {
      const response = await getReports({ page: requestedPage, limit: 10 });
      setReports(response.data.data || []);
      setPagination(response.data.pagination || null);
    } catch (error) {
      setListError(
        error.response?.data?.error || 'Failed to load report history'
      );
    } finally {
      setListLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadReports(page);
  }, [loadReports, page]);

  const selectPreset = (preset) => {
    setSelectedPreset(preset.label);
    setPeriodStart(daysAgoISO(preset.days));
    setPeriodEnd(todayISO());
    setGenerateError(null);
  };

  const handleCustomDateChange = (setter) => (event) => {
    setSelectedPreset('Custom');
    setter(event.target.value);
    setGenerateError(null);
  };

  const handleGenerate = async (event) => {
    event.preventDefault();

    const start = new Date(`${periodStart}T00:00:00`);
    const end = new Date(`${periodEnd}T23:59:59.999`);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start >= end) {
      setGenerateError('Start date must be before end date.');
      return;
    }

    setGenerating(true);
    setGenerateError(null);

    try {
      const response = await generateReport(start.toISOString(), end.toISOString());
      const report = response.data.report;

      await loadReports(1);
      setPage(1);
      navigate(`/reports/${report.id}`);
    } catch (error) {
      setGenerateError(
        error.response?.data?.error || 'Failed to generate report'
      );
    } finally {
      setGenerating(false);
    }
  };  return (
    <div>
      {/* Page Header */}
      <PageHeader
        title="Voice of Customer Reports"
        subtitle="Generate leadership-ready reports backed by real feedback data."
      />

      <div className="glass-card">
        <h2>Generate a Report</h2>
        <p className="subtitle" style={{ marginBottom: '16px' }}>
          Choose a predefined period or set a custom range.
        </p>

        <div className="d-flex flex-wrap gap-2 mb-4" role="group" aria-label="Report period presets">
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              className={`btn ${
                selectedPreset === preset.label
                  ? 'btn-primary'
                  : 'btn-secondary'
              }`}
              onClick={() => selectPreset(preset)}
            >
              {preset.label}
            </button>
          ))}
          <button
            type="button"
            className={`btn ${
              selectedPreset === 'Custom'
                ? 'btn-primary'
                : 'btn-secondary'
            }`}
            onClick={() => setSelectedPreset('Custom')}
          >
            Custom range
          </button>
        </div>

        <form onSubmit={handleGenerate}>
          <div className="row g-3 align-items-end">
            <div className="col-12 col-md-4">
              <label htmlFor="report-period-start" className="form-label">
                From
              </label>
              <input
                id="report-period-start"
                type="date"
                value={periodStart}
                max={periodEnd}
                onChange={handleCustomDateChange(setPeriodStart)}
                required
              />
            </div>

            <div className="col-12 col-md-4">
              <label htmlFor="report-period-end" className="form-label">
                To
              </label>
              <input
                id="report-period-end"
                type="date"
                value={periodEnd}
                max={todayISO()}
                onChange={handleCustomDateChange(setPeriodEnd)}
                required
              />
            </div>

            <div className="col-12 col-md-4">
              <button
                type="submit"
                className="btn btn-primary w-100"
                disabled={generating}
                style={{ height: '45px' }}
              >
                {generating ? 'Generating…' : 'Generate Report'}
              </button>
            </div>
          </div>
        </form>

        {generateError && (
          <div className="alert alert-error mt-3 mb-0" role="alert">
            {generateError}
          </div>
        )}
      </div>

      <section aria-labelledby="report-history-heading">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
          <div>
            <h2 id="report-history-heading" style={{ margin: 0 }}>
              Report History
            </h2>
            {pagination && (
              <p className="subtitle" style={{ margin: 0, marginTop: '4px' }}>
                {pagination.total} report{pagination.total === 1 ? '' : 's'} generated
              </p>
            )}
          </div>
        </div>

        {listLoading && (
          <div className="glass-card text-center py-5">
            <div className="spinner-border spinner-border-sm me-2 text-primary" role="status" aria-hidden="true" />
            <span style={{ color: 'var(--text-secondary)' }}>Loading report history…</span>
          </div>
        )}

        {!listLoading && listError && (
          <ErrorState
            message={listError}
            onRetry={() => loadReports(page)}
          />
        )}

        {!listLoading && !listError && reports.length === 0 && (
          <EmptyState
            icon="📄"
            title="No reports yet"
            description="Generate your first Voice-of-Customer report above."
          />
        )}

        {!listLoading && !listError && reports.length > 0 && (
          <>
            <div className="row g-3">
              {reports.map((report) => (
                <div className="col-12 col-md-6" key={report.id}>
                  <article className="glass-card report-history-card h-100 mb-0" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
                        <div className="min-w-0">
                          <h3 className="report-history-title" style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
                            {report.title}
                          </h3>
                          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, marginTop: '4px' }}>
                            Generated {new Date(report.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="badge badge-neu" style={{ color: 'var(--text-primary)', border: 'none', background: 'rgba(255,255,255,0.08)' }}>
                          VoC
                        </span>
                      </div>
                    </div>

                    <div style={{ marginTop: '16px' }}>
                      <ReportActions report={report} />
                    </div>
                  </article>
                </div>
              ))}
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div className="pagination-container" style={{ justifyContent: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    className="pagination-btn"
                    disabled={page <= 1}
                    onClick={() => setPage((current) => current - 1)}
                  >
                    ← Previous
                  </button>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)', padding: '0 8px' }}>
                    {page} / {pagination.totalPages}
                  </span>
                  <button
                    type="button"
                    className="pagination-btn"
                    disabled={page >= pagination.totalPages}
                    onClick={() => setPage((current) => current + 1)}
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

export default Reports;
