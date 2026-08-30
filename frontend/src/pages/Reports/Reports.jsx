import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  generateReport,
  getReports,
  exportReportPDF,
} from '../../services/reportService';
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
  };

  return (
    <div className="reports-page py-4">
      <div className="container-fluid px-0">
        <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap mb-4">
          <div>
            <h1 className="h3 mb-1">Voice of Customer Reports</h1>
            <p className="text-body-secondary mb-0">
              Generate leadership-ready reports backed by real feedback data.
            </p>
          </div>
        </div>

        <div className="card shadow-sm border-0 mb-4">
          <div className="card-body p-4">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
              <div>
                <h2 className="h5 mb-1">Generate a report</h2>
                <p className="small text-body-secondary mb-0">
                  Choose a predefined period or set a custom range.
                </p>
              </div>
            </div>

            <div className="d-flex flex-wrap gap-2 mb-4" role="group" aria-label="Report period presets">
              {PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  className={`btn ${
                    selectedPreset === preset.label
                      ? 'btn-primary'
                      : 'btn-outline-secondary'
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
                    : 'btn-outline-secondary'
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
                    className="form-control"
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
                    className="form-control"
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
                  >
                    {generating ? 'Generating…' : 'Generate Report'}
                  </button>
                </div>
              </div>
            </form>

            {generateError && (
              <div className="alert alert-danger mt-3 mb-0" role="alert">
                {generateError}
              </div>
            )}
          </div>
        </div>

        <section aria-labelledby="report-history-heading">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
            <div>
              <h2 id="report-history-heading" className="h5 mb-1">
                Report History
              </h2>
              {pagination && (
                <p className="small text-body-secondary mb-0">
                  {pagination.total} report{pagination.total === 1 ? '' : 's'} generated
                </p>
              )}
            </div>
          </div>

          {listLoading && (
            <div className="card border-0 shadow-sm">
              <div className="card-body py-5 text-center text-body-secondary">
                <div className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                Loading report history…
              </div>
            </div>
          )}

          {!listLoading && listError && (
            <div className="alert alert-danger" role="alert">
              {listError}
              <button
                type="button"
                className="btn btn-sm btn-outline-danger ms-3"
                onClick={() => loadReports(page)}
              >
                Retry
              </button>
            </div>
          )}

          {!listLoading && !listError && reports.length === 0 && (
            <div className="card border-0 shadow-sm">
              <div className="card-body py-5 text-center">
                <div className="fs-1 mb-2" aria-hidden="true">📄</div>
                <h3 className="h5">No reports yet</h3>
                <p className="text-body-secondary mb-0">
                  Generate your first Voice-of-Customer report above.
                </p>
              </div>
            </div>
          )}

          {!listLoading && !listError && reports.length > 0 && (
            <>
              <div className="row g-3">
                {reports.map((report) => (
                  <div className="col-12 col-xl-6" key={report.id}>
                    <article className="card report-history-card h-100 border-0 shadow-sm">
                      <div className="card-body d-flex flex-column">
                        <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
                          <div className="min-w-0">
                            <h3 className="h6 mb-1 report-history-title">
                              {report.title}
                            </h3>
                            <p className="small text-body-secondary mb-0">
                              Generated {new Date(report.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <span className="badge text-bg-light border flex-shrink-0">
                            VoC
                          </span>
                        </div>

                        <div className="mt-auto pt-2">
                          <ReportActions report={report} />
                        </div>
                      </div>
                    </article>
                  </div>
                ))}
              </div>

              {pagination && pagination.totalPages > 1 && (
                <nav className="d-flex justify-content-center mt-4" aria-label="Report history pagination">
                  <div className="btn-group" role="group">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      disabled={page <= 1}
                      onClick={() => setPage((current) => current - 1)}
                    >
                      Previous
                    </button>
                    <span className="btn btn-outline-secondary disabled">
                      {page} / {pagination.totalPages}
                    </span>
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      disabled={page >= pagination.totalPages}
                      onClick={() => setPage((current) => current + 1)}
                    >
                      Next
                    </button>
                  </div>
                </nav>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

export default Reports;
