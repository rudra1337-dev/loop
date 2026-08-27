import PDFDocument from 'pdfkit';
import { Workspace } from '../models/index.js';

const PAGE = {
  width: 595.28,
  height: 841.89,
  left: 50,
  right: 50,
  top: 48,
  bottom: 70,
};

const CONTENT_WIDTH = PAGE.width - PAGE.left - PAGE.right;
const CONTENT_BOTTOM = PAGE.height - PAGE.bottom;

const COLORS = {
  primary: '#4f46e5',
  text: '#0f172a',
  muted: '#64748b',
  border: '#e2e8f0',
  surface: '#f8fafc',
  success: '#059669',
  danger: '#dc2626',
  neutral: '#64748b',
};

/*
 * PDF layout strategy:
 *
 * 1. Every content block calculates its height before rendering.
 * 2. A new page is created only when the block cannot fit.
 * 3. Footer rendering NEVER creates a new page.
 *
 * This prevents the blank-page problem caused by PDFKit's automatic
 * pagination when content is drawn close to the bottom margin.
 */

function newPage(doc) {
  doc.addPage();
  doc.y = PAGE.top;
}

function ensureSpace(doc, requiredHeight) {
  const available = CONTENT_BOTTOM - doc.y;

  if (requiredHeight > available) {
    newPage(doc);
    return true;
  }

  return false;
}

function textHeight(
  doc,
  text,
  width,
  font = 'Helvetica',
  fontSize = 10,
  lineGap = 2
) {
  doc.font(font).fontSize(fontSize);

  return doc.heightOfString(String(text ?? ''), {
    width,
    lineGap,
  });
}

function drawText(
  doc,
  text,
  {
    width = CONTENT_WIDTH,
    font = 'Helvetica',
    fontSize = 10,
    color = COLORS.text,
    lineGap = 2,
    after = 8,
  } = {}
) {
  const value = String(text ?? '');

  const height = textHeight(
    doc,
    value,
    width,
    font,
    fontSize,
    lineGap
  );

  ensureSpace(doc, height + after);

  doc
    .font(font)
    .fontSize(fontSize)
    .fillColor(color)
    .text(value, PAGE.left, doc.y, {
      width,
      lineGap,
      lineBreak: true,
    });

  doc.y += after;

  return height;
}

function heading(doc, title) {
  const headingHeight = 16;
  const spacingAfter = 16;

  ensureSpace(doc, headingHeight + spacingAfter);

  doc
    .font('Helvetica-Bold')
    .fontSize(13)
    .fillColor(COLORS.primary)
    .text(title, PAGE.left, doc.y, {
      width: CONTENT_WIDTH,
      lineBreak: false,
    });

  doc.y += 20;
}

function drawKpi(
  doc,
  x,
  y,
  width,
  height,
  label,
  value,
  change,
  changeColor
) {
  doc
    .roundedRect(x, y, width, height, 8)
    .fillAndStroke(COLORS.surface, COLORS.border);

  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor(COLORS.muted)
    .text(label, x + 14, y + 12, {
      width: width - 28,
      lineBreak: false,
    });

  doc
    .font('Helvetica-Bold')
    .fontSize(20)
    .fillColor(COLORS.text)
    .text(String(value), x + 14, y + 28, {
      width: width - 28,
      lineBreak: false,
    });

  doc
    .font('Helvetica-Bold')
    .fontSize(8)
    .fillColor(changeColor || COLORS.muted)
    .text(change, x + 14, y + height - 18, {
      width: width - 28,
      lineBreak: false,
    });
}

function sentimentColor(sentiment) {
  if (sentiment === 'POS') {
    return COLORS.success;
  }

  if (sentiment === 'NEG') {
    return COLORS.danger;
  }

  return COLORS.neutral;
}

function quoteHeight(doc, quote) {
  const quoteText = `"${quote.content || ''}"`;

  const bodyHeight = textHeight(
    doc,
    quoteText,
    CONTENT_WIDTH - 38,
    'Helvetica',
    9,
    2
  );

  return (
    8 + // top padding
    9 + // label
    5 + // label/body gap
    bodyHeight +
    10 // bottom padding
  );
}

function drawQuote(doc, quote) {
  const height = quoteHeight(doc, quote);

  ensureSpace(doc, height + 8);

  const y = doc.y;
  const color = sentimentColor(quote.sentiment);

  doc
    .roundedRect(
      PAGE.left,
      y,
      CONTENT_WIDTH,
      height,
      6
    )
    .fillAndStroke('#ffffff', COLORS.border);

  doc
    .rect(PAGE.left, y, 3, height)
    .fill(color);

  const label =
    quote.sentiment === 'POS'
      ? 'POSITIVE'
      : quote.sentiment === 'NEG'
        ? 'NEGATIVE'
        : 'NEUTRAL';

  doc
    .font('Helvetica-Bold')
    .fontSize(7.5)
    .fillColor(color)
    .text(
      label,
      PAGE.left + 13,
      y + 8,
      {
        width: CONTENT_WIDTH - 26,
        lineBreak: false,
      }
    );

  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor(COLORS.text)
    .text(
      `"${quote.content || ''}"`,
      PAGE.left + 13,
      y + 22,
      {
        width: CONTENT_WIDTH - 38,
        lineGap: 2,
      }
    );

  doc.y = y + height + 8;
}

function themeHeight(doc, theme, narrative) {
  let height = 24;

  if (narrative?.narrative) {
    height +=
      textHeight(
        doc,
        narrative.narrative,
        CONTENT_WIDTH,
        'Helvetica',
        9.5,
        2.5
      ) + 8;
  }

  for (const quote of theme.quotes || []) {
    height += quoteHeight(doc, quote) + 8;
  }

  return height + 15;
}

function drawTheme(doc, theme, narrative) {
  const fullHeight = themeHeight(
    doc,
    theme,
    narrative
  );

  const pageContentHeight =
    CONTENT_BOTTOM - PAGE.top;

  /*
   * If the complete theme fits on one page,
   * keep it together.
   *
   * If it is larger than a page, allow its
   * individual content blocks to flow normally.
   */
  if (fullHeight <= pageContentHeight) {
    ensureSpace(doc, fullHeight);
  } else {
    ensureSpace(doc, 35);
  }

  const startY = doc.y;

  doc
    .font('Helvetica-Bold')
    .fontSize(11)
    .fillColor(COLORS.text)
    .text(
      theme.name || 'Untitled theme',
      PAGE.left,
      startY,
      {
        width: CONTENT_WIDTH - 130,
        lineBreak: false,
      }
    );

  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor(COLORS.muted)
    .text(
      `${theme.currentCount || 0} feedback items${
        theme.isSpiking
          ? `  •  Spiking +${theme.pctChange}%`
          : ''
      }`,
      PAGE.left + CONTENT_WIDTH - 170,
      startY + 1,
      {
        width: 170,
        align: 'right',
        lineBreak: false,
      }
    );

  doc.y = startY + 18;

  if (narrative?.narrative) {
    drawText(doc, narrative.narrative, {
      fontSize: 9.5,
      lineGap: 2.5,
      after: 8,
    });
  }

  for (const quote of theme.quotes || []) {
    drawQuote(doc, quote);
  }

  ensureSpace(doc, 10);

  doc
    .strokeColor(COLORS.border)
    .lineWidth(0.5)
    .moveTo(PAGE.left, doc.y)
    .lineTo(
      PAGE.width - PAGE.right,
      doc.y
    )
    .stroke();

  doc.y += 14;
}

function drawFooter(
  doc,
  pageNumber,
  pageCount
) {
  /*
   * Critical fix:
   *
   * The footer is below the normal content area.
   * PDFKit may otherwise think the footer is overflowing
   * and automatically create another page.
   *
   * Temporarily disable the bottom margin while drawing
   * the footer so it can NEVER create a page.
   */

  const oldBottomMargin =
    doc.page.margins.bottom;

  doc.page.margins.bottom = 0;

  const y = PAGE.height - 42;

  doc
    .save()
    .strokeColor(COLORS.border)
    .lineWidth(0.5)
    .moveTo(
      PAGE.left,
      PAGE.height - 52
    )
    .lineTo(
      PAGE.width - PAGE.right,
      PAGE.height - 52
    )
    .stroke();

  doc
    .font('Helvetica')
    .fontSize(7.5)
    .fillColor(COLORS.muted)
    .text(
      'Generated by LOOP — AI Customer Feedback Intelligence',
      PAGE.left,
      y,
      {
        width: 350,
        lineBreak: false,
      }
    );

  doc
    .text(
      `Page ${pageNumber} of ${pageCount}`,
      PAGE.width - PAGE.right - 95,
      y,
      {
        width: 95,
        align: 'right',
        lineBreak: false,
      }
    )
    .restore();

  doc.page.margins.bottom =
    oldBottomMargin;
}

function addFooters(doc) {
  /*
   * IMPORTANT:
   *
   * Capture the page count BEFORE drawing footers.
   * Footer drawing itself never adds pages.
   */

  const range = doc.bufferedPageRange();

  const start = range.start;
  const count = range.count;

  for (let i = 0; i < count; i += 1) {
    doc.switchToPage(start + i);

    drawFooter(
      doc,
      i + 1,
      count
    );
  }
}

export async function generateReportPDF(
  report,
  stream
) {
  const doc = new PDFDocument({
    size: 'A4',

    margins: {
      top: PAGE.top,
      bottom: PAGE.bottom,
      left: PAGE.left,
      right: PAGE.right,
    },

    /*
     * Required because we add page numbers
     * after all content has been rendered.
     */
    bufferPages: true,

    autoFirstPage: true,
  });

  doc.pipe(stream);

  const {
    stats = {},
    narrative = null,
  } = report.contentJson || {};

  // ----------------------------------
  // Workspace
  // ----------------------------------

  let workspaceName =
    'Your Workspace';

  try {
    const workspace =
      await Workspace.findByPk(
        report.workspaceId
      );

    if (workspace?.name) {
      workspaceName =
        workspace.name;
    }
  } catch (error) {
    console.error(
      '[PDF] Failed to fetch workspace:',
      error.message
    );
  }

  // ----------------------------------
  // Header
  // ----------------------------------

  doc
    .font('Helvetica-Bold')
    .fontSize(16)
    .fillColor(COLORS.primary)
    .text(
      'LOOP',
      PAGE.left,
      doc.y,
      {
        lineBreak: false,
      }
    );

  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor(COLORS.muted)
    .text(
      'VOICE OF CUSTOMER REPORT',
      PAGE.left,
      doc.y + 21,
      {
        lineBreak: false,
      }
    );

  doc.y += 48;

  doc
    .font('Helvetica-Bold')
    .fontSize(20)
    .fillColor(COLORS.text)
    .text(
      report.title ||
        'Voice of Customer Report',
      PAGE.left,
      doc.y,
      {
        width: CONTENT_WIDTH,
        lineGap: 2,
      }
    );

  doc.y += 7;

  const periodStart =
    new Date(
      stats.period?.start ||
        report.periodStart
    );

  const periodEnd =
    new Date(
      stats.period?.end ||
        report.periodEnd
    );

  const generatedAt =
    new Date(
      report.createdAt ||
        Date.now()
    );

  drawText(
    doc,
    `Workspace: ${workspaceName}  •  Period: ${periodStart.toLocaleDateString()} – ${periodEnd.toLocaleDateString()}  •  Generated: ${generatedAt.toLocaleDateString()}`,
    {
      fontSize: 8.5,
      color: COLORS.muted,
      lineGap: 2,
      after: 12,
    }
  );

  doc
    .strokeColor(COLORS.border)
    .lineWidth(0.7)
    .moveTo(
      PAGE.left,
      doc.y
    )
    .lineTo(
      PAGE.width - PAGE.right,
      doc.y
    )
    .stroke();

  doc.y += 20;

  // ----------------------------------
  // Executive Summary
  // ----------------------------------

  heading(
    doc,
    'Executive Summary'
  );

  drawText(
    doc,
    narrative?.summary ||
      'No written summary is available for this report, but the statistics below are based on the selected feedback period.',
    {
      fontSize: 10,
      lineGap: 3,
      after: 15,
    }
  );

  // ----------------------------------
  // KPIs
  // ----------------------------------

  const kpiHeight = 72;

  ensureSpace(
    doc,
    kpiHeight + 18
  );

  const gap = 15;

  const kpiWidth =
    (CONTENT_WIDTH - gap) / 2;

  const kpiY = doc.y;

  const volumeChange =
    stats.volume?.pctChange ?? 0;

  const negativeShift =
    stats.sentiment?.shift?.NEG ?? 0;

  drawKpi(
    doc,
    PAGE.left,
    kpiY,
    kpiWidth,
    kpiHeight,
    'FEEDBACK VOLUME',
    stats.volume?.current ?? 0,
    `${
      volumeChange >= 0
        ? '▲ +'
        : '▼ '
    }${volumeChange}% vs previous period`,
    volumeChange >= 0
      ? COLORS.success
      : COLORS.danger
  );

  drawKpi(
    doc,
    PAGE.left +
      kpiWidth +
      gap,
    kpiY,
    kpiWidth,
    kpiHeight,
    'NEGATIVE SENTIMENT',
    `${
      stats.sentiment?.current?.NEG ??
      0
    }%`,
    `${
      negativeShift >= 0
        ? '▲ +'
        : '▼ '
    }${negativeShift} pts vs previous`,
    negativeShift > 0
      ? COLORS.danger
      : COLORS.success
  );

  doc.y =
    kpiY +
    kpiHeight +
    22;

  // ----------------------------------
  // Sentiment
  // ----------------------------------

  heading(
    doc,
    'Sentiment Breakdown'
  );

  ensureSpace(doc, 48);

  const pos =
    stats.sentiment?.current?.POS ||
    0;

  const neu =
    stats.sentiment?.current?.NEU ||
    0;

  const neg =
    stats.sentiment?.current?.NEG ||
    0;

  const barY = doc.y;
  const barHeight = 16;

  doc
    .roundedRect(
      PAGE.left,
      barY,
      CONTENT_WIDTH,
      barHeight,
      8
    )
    .fill(COLORS.border);

  let x = PAGE.left;

  const sentimentSegments = [
    [pos, COLORS.success],
    [neu, COLORS.neutral],
    [neg, COLORS.danger],
  ];

  for (const [pct, color] of sentimentSegments) {
    if (pct <= 0) {
      continue;
    }

    const width =
      (pct / 100) *
      CONTENT_WIDTH;

    doc
      .rect(
        x,
        barY,
        width,
        barHeight
      )
      .fill(color);

    x += width;
  }

  doc.y =
    barY +
    27;

  drawText(
    doc,
    `Positive ${pos}%   •   Neutral ${neu}%   •   Negative ${neg}%`,
    {
      fontSize: 8.5,
      after: 6,
    }
  );

  if (narrative?.sentimentNarrative) {
    drawText(
      doc,
      narrative.sentimentNarrative,
      {
        fontSize: 9.5,
        color: COLORS.muted,
        lineGap: 2.5,
        after: 12,
      }
    );
  }

  // ----------------------------------
  // Top Themes
  // ----------------------------------

  heading(
    doc,
    'Top Customer Themes'
  );

  if (
    !stats.topThemes ||
    stats.topThemes.length === 0
  ) {
    drawText(
      doc,
      'No theme activity was recorded in this period.',
      {
        fontSize: 9.5,
        color: COLORS.muted,
        after: 12,
      }
    );
  } else {
    for (
      const theme of stats.topThemes
    ) {
      const themeNarrative =
        narrative?.themeNarratives?.find(
          (item) =>
            item.themeId ===
            theme.themeId
        );

      drawTheme(
        doc,
        theme,
        themeNarrative
      );
    }
  }

  // ----------------------------------
  // Recommended Actions
  // ----------------------------------

  if (
    narrative?.recommendedActions &&
    narrative.recommendedActions.length
  ) {
    heading(
      doc,
      'Recommended Actions'
    );

    for (
      let i = 0;
      i <
      narrative.recommendedActions
        .length;
      i += 1
    ) {
      drawText(
        doc,
        `${i + 1}. ${narrative.recommendedActions[i]}`,
        {
          fontSize: 9.5,
          lineGap: 2.5,
          after: 7,
        }
      );
    }
  }

  /*
   * EVERYTHING is rendered before the footer pass.
   *
   * This is critical because addFooters() captures the final
   * page count and does not create any pages.
   */
  addFooters(doc);

  doc.end();
}