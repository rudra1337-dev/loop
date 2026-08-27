import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  Share2,
  Check,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";

import {
  getReport,
  exportReportPDF,
} from "../../services/reportService";

import "./ReportView.css";

const formatDate = (date) => {
  if (!date) return "—";

  return new Date(date).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatDateRange = (start, end) => {
  return `${formatDate(start)} – ${formatDate(end)}`;
};

const getSentimentLabel = (sentiment) => {
  switch (sentiment) {
    case "POS":
      return "Positive";
    case "NEG":
      return "Negative";
    default:
      return "Neutral";
  }
};

const getSentimentClass = (sentiment) => {
  switch (sentiment) {
    case "POS":
      return "report-sentiment-positive";
    case "NEG":
      return "report-sentiment-negative";
    default:
      return "report-sentiment-neutral";
  }
};

const getChangeIcon = (value) => {
  if (value > 0) return <TrendingUp size={14} />;
  if (value < 0) return <TrendingDown size={14} />;
  return <Minus size={14} />;
};

const getChangeClass = (value, inverse = false) => {
  if (value === 0) return "report-change-neutral";

  const positive = inverse ? value < 0 : value > 0;

  return positive
    ? "report-change-positive"
    : "report-change-negative";
};

function ReportView() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadReport = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getReport(id);

        if (mounted) {
          setReport(response.data?.report);
        }
      } catch (err) {
        console.error("Failed to load report:", err);

        if (mounted) {
          if (err.response?.status === 404) {
            setError("Report not found.");
          } else {
            setError("Failed to load the report.");
          }
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadReport();

    return () => {
      mounted = false;
    };
  }, [id]);

  const stats = report?.contentJson?.stats || {};
  const narrative = report?.contentJson?.narrative || null;

  const currentSentiment = stats.sentiment?.current || {
    POS: 0,
    NEU: 0,
    NEG: 0,
  };

  const sentimentShift = stats.sentiment?.shift || {
    POS: 0,
    NEU: 0,
    NEG: 0,
  };

  const volume = stats.volume || {
    current: 0,
    previous: 0,
    pctChange: 0,
  };

  const period = useMemo(
    () => stats.period || {},
    [stats.period]
  );

  const handleExport = async () => {
    if (!report || exporting) return;

    try {
      setExporting(true);

      const response = await exportReportPDF(report.id);

      const blob = new Blob([response.data], {
        type: "application/pdf",
      });

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `LOOP-VoC-Report-${report.id}.pdf`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export report:", err);
      alert("Failed to export the report.");
    } finally {
      setExporting(false);
    }
  };

  const handleShare = async () => {
    if (!report || sharing) return;

    try {
      setSharing(true);

      const shareUrl = `${window.location.origin}/reports/${report.id}`;

      if (navigator.share) {
        await navigator.share({
          title: report.title,
          text: "View this Voice of Customer report in LOOP.",
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
      }

      setTimeout(() => {
        setSharing(false);
      }, 1500);
    } catch (err) {
      console.error("Failed to share report:", err);
      setSharing(false);
    }
  };

  if (loading) {
    return (
      <div className="container-fluid report-view-page">
        <div className="report-loading">
          <div
            className="spinner-border"
            role="status"
            aria-label="Loading report"
          />
          <p>Loading report...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="container-fluid report-view-page">
        <div className="report-error">
          <AlertCircle size={42} />

          <h2>{error || "Report not found"}</h2>

          <p>
            The report could not be loaded. It may have been
            deleted or you may not have access to it.
          </p>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate("/reports")}
          >
            <ArrowLeft size={16} />
            Back to Reports
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="container-fluid report-view-page">
      <div className="container-xl px-2 px-sm-3 px-lg-4">

        {/* Top actions */}
        <div className="report-view-toolbar">
          <button
            type="button"
            className="btn btn-outline-secondary report-back-btn"
            onClick={() => navigate("/reports")}
          >
            <ArrowLeft size={17} />
            <span>Back to Reports</span>
          </button>

          <div className="report-toolbar-actions">
            <button
              type="button"
              className="btn btn-outline-primary"
              onClick={handleShare}
              disabled={sharing}
            >
              {sharing ? (
                <>
                  <Check size={17} />
                  Copied
                </>
              ) : (
                <>
                  <Share2 size={17} />
                  Share Report
                </>
              )}
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleExport}
              disabled={exporting}
            >
              {exporting ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm"
                    role="status"
                    aria-hidden="true"
                  />
                  Exporting...
                </>
              ) : (
                <>
                  <Download size={17} />
                  Export PDF
                </>
              )}
            </button>
          </div>
        </div>

        {/* Report document */}
        <article className="report-document">

          {/* Header */}
          <header className="report-document-header">
            <div className="report-brand">
              <div className="report-brand-name">
                LOOP
              </div>

              <div className="report-brand-subtitle">
                VOICE OF CUSTOMER REPORT
              </div>
            </div>

            <h1 className="report-title">
              {report.title}
            </h1>

            <div className="report-meta">
              <span>
                <strong>Workspace:</strong>{" "}
                {report.workspace?.name ||
                  report.workspaceName ||
                  "Your Workspace"}
              </span>

              <span className="report-meta-separator">
                •
              </span>

              <span>
                <strong>Period:</strong>{" "}
                {formatDateRange(
                  period.start || report.periodStart,
                  period.end || report.periodEnd
                )}
              </span>

              <span className="report-meta-separator">
                •
              </span>

              <span>
                <strong>Generated:</strong>{" "}
                {formatDate(report.createdAt)}
              </span>
            </div>
          </header>

          {/* Executive Summary */}
          <section className="report-section">
            <h2 className="report-section-title">
              Executive Summary
            </h2>

            <p className="report-summary">
              {narrative?.summary ||
                "No written summary is available for this report, but the statistics below are based on the selected feedback period."}
            </p>

            {/* KPIs */}
            <div className="row g-3 report-kpi-row">

              <div className="col-12 col-md-6">
                <div className="report-kpi-card">
                  <div className="report-kpi-label">
                    FEEDBACK VOLUME
                  </div>

                  <div className="report-kpi-value">
                    {volume.current}
                  </div>

                  <div
                    className={`report-kpi-change ${getChangeClass(
                      volume.pctChange
                    )}`}
                  >
                    {getChangeIcon(volume.pctChange)}

                    <span>
                      {volume.pctChange >= 0
                        ? "+"
                        : ""}
                      {volume.pctChange}% vs previous
                      period
                    </span>
                  </div>
                </div>
              </div>

              <div className="col-12 col-md-6">
                <div className="report-kpi-card">
                  <div className="report-kpi-label">
                    NEGATIVE SENTIMENT
                  </div>

                  <div className="report-kpi-value">
                    {currentSentiment.NEG}%
                  </div>

                  <div
                    className={`report-kpi-change ${getChangeClass(
                      sentimentShift.NEG,
                      true
                    )}`}
                  >
                    {getChangeIcon(sentimentShift.NEG)}

                    <span>
                      {sentimentShift.NEG >= 0
                        ? "+"
                        : ""}
                      {sentimentShift.NEG} pts vs previous
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </section>

          {/* Sentiment */}
          <section className="report-section">
            <h2 className="report-section-title">
              Sentiment Breakdown
            </h2>

            <div
              className="report-sentiment-bar"
              aria-label={`Positive ${currentSentiment.POS}%, Neutral ${currentSentiment.NEU}%, Negative ${currentSentiment.NEG}%`}
            >
              {currentSentiment.POS > 0 && (
                <div
                  className="report-sentiment-segment report-segment-positive"
                  style={{
                    width: `${currentSentiment.POS}%`,
                  }}
                />
              )}

              {currentSentiment.NEU > 0 && (
                <div
                  className="report-sentiment-segment report-segment-neutral"
                  style={{
                    width: `${currentSentiment.NEU}%`,
                  }}
                />
              )}

              {currentSentiment.NEG > 0 && (
                <div
                  className="report-sentiment-segment report-segment-negative"
                  style={{
                    width: `${currentSentiment.NEG}%`,
                  }}
                />
              )}
            </div>

            <div className="report-sentiment-legend">
              <span>
                <i className="legend-dot positive" />
                Positive {currentSentiment.POS}%
              </span>

              <span>
                <i className="legend-dot neutral" />
                Neutral {currentSentiment.NEU}%
              </span>

              <span>
                <i className="legend-dot negative" />
                Negative {currentSentiment.NEG}%
              </span>
            </div>

            {narrative?.sentimentNarrative && (
              <p className="report-secondary-text">
                {narrative.sentimentNarrative}
              </p>
            )}
          </section>

          {/* Themes */}
          <section className="report-section">
            <h2 className="report-section-title">
              Top Customer Themes
            </h2>

            {!stats.topThemes?.length ? (
              <div className="report-empty-section">
                No theme activity was recorded in this period.
              </div>
            ) : (
              <div className="report-themes">

                {stats.topThemes.map((theme) => {
                  const themeNarrative =
                    narrative?.themeNarratives?.find(
                      (item) =>
                        item.themeId === theme.themeId
                    );

                  return (
                    <article
                      className="report-theme"
                      key={theme.themeId}
                    >
                      <div className="report-theme-header">

                        <div className="report-theme-title-wrapper">
                          <span
                            className="report-theme-dot"
                            style={{
                              backgroundColor:
                                theme.color ||
                                "#4f46e5",
                            }}
                          />

                          <h3 className="report-theme-title">
                            {theme.name}
                          </h3>
                        </div>

                        <div className="report-theme-meta">
                          {theme.currentCount} feedback
                          {theme.currentCount === 1
                            ? ""
                            : "s"}

                          {theme.isSpiking && (
                            <span className="report-spike">
                              +{theme.pctChange}% spike
                            </span>
                          )}
                        </div>
                      </div>

                      {themeNarrative?.narrative && (
                        <p className="report-theme-narrative">
                          {themeNarrative.narrative}
                        </p>
                      )}

                      {theme.quotes?.length > 0 && (
                        <div className="report-quotes">
                          {theme.quotes.map((quote) => (
                            <blockquote
                              className="report-quote"
                              key={quote.id}
                            >
                              <div
                                className={`report-quote-indicator ${getSentimentClass(
                                  quote.sentiment
                                )}`}
                              />

                              <div className="report-quote-content">
                                <div
                                  className={`report-quote-label ${getSentimentClass(
                                    quote.sentiment
                                  )}`}
                                >
                                  {getSentimentLabel(
                                    quote.sentiment
                                  )}
                                </div>

                                <p>
                                  “{quote.content}”
                                </p>
                              </div>
                            </blockquote>
                          ))}
                        </div>
                      )}
                    </article>
                  );
                })}

              </div>
            )}
          </section>

          {/* Recommended Actions */}
          {narrative?.recommendedActions?.length > 0 && (
            <section className="report-section report-actions-section">
              <h2 className="report-section-title">
                Recommended Actions
              </h2>

              <div className="report-recommended-actions">
                {narrative.recommendedActions.map(
                  (action, index) => (
                    <div
                      className="report-action"
                      key={`${index}-${action}`}
                    >
                      <div className="report-action-number">
                        {index + 1}
                      </div>

                      <p>{action}</p>
                    </div>
                  )
                )}
              </div>
            </section>
          )}

          {/* Bottom actions */}
          <footer className="report-document-footer">
            <button
              type="button"
              className="btn btn-outline-primary"
              onClick={handleShare}
              disabled={sharing}
            >
              {sharing ? (
                <>
                  <Check size={17} />
                  Link Copied
                </>
              ) : (
                <>
                  <Share2 size={17} />
                  Share Report
                </>
              )}
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleExport}
              disabled={exporting}
            >
              {exporting ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm"
                    role="status"
                    aria-hidden="true"
                  />
                  Exporting...
                </>
              ) : (
                <>
                  <Download size={17} />
                  Export PDF
                </>
              )}
            </button>
          </footer>

        </article>
      </div>
    </main>
  );
}

export default ReportView;