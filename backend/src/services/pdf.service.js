import PDFDocument from 'pdfkit';
import { Workspace } from '../models/index.js';

// Styles
const PRIMARY = '#4f46e5';
const TEXT_DARK = '#0f172a';
const TEXT_MUTED = '#4b5563';
const BG_LIGHT = '#f8fafc';
const BORDER_COLOR = '#e2e8f0';
const GREEN = '#10b981';
const RED = '#ef4444';
const GRAY = '#9ca3af';

function checkPageBreak(doc, neededHeight = 100) {
  if (doc.y + neededHeight > 740) {
    doc.addPage();
  }
}

export async function generateReportPDF(report, stream) {
  const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true });
  doc.pipe(stream);

  const { stats, narrative } = report.contentJson;

  // Fetch Workspace name
  let companyName = 'Your Workspace';
  try {
    const workspace = await Workspace.findByPk(report.workspaceId);
    if (workspace) {
      companyName = workspace.name;
    }
  } catch (err) {
    console.error('[PDF] Failed to fetch workspace details:', err.message);
  }

  // --- Header ---
  doc.fontSize(16).fillColor(PRIMARY).font('Helvetica-Bold').text('LOOP', 50, 45);
  doc.moveUp();
  doc.fontSize(10).fillColor(TEXT_MUTED).font('Helvetica').text('Voice of Customer Report', { align: 'right' });

  doc.moveDown(1.5);
  doc.fontSize(20).fillColor(TEXT_DARK).font('Helvetica-Bold').text(report.title);

  doc.moveDown(0.4);
  doc.fontSize(9).fillColor(TEXT_MUTED).font('Helvetica');
  doc.text(`Workspace: `, { continued: true }).font('Helvetica-Bold').fillColor(TEXT_DARK).text(`${companyName}   `, { continued: true });
  doc.font('Helvetica').fillColor(TEXT_MUTED).text(`Period: `, { continued: true }).font('Helvetica-Bold').fillColor(TEXT_DARK).text(`${new Date(stats.period.start).toLocaleDateString()} – ${new Date(stats.period.end).toLocaleDateString()}   `, { continued: true });
  doc.font('Helvetica').fillColor(TEXT_MUTED).text(`Generated: `, { continued: true }).font('Helvetica-Bold').fillColor(TEXT_DARK).text(`${new Date(report.createdAt || Date.now()).toLocaleDateString()}`);

  doc.moveDown(0.8);
  doc.strokeColor(BORDER_COLOR).lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(1.2);

  // --- Executive Summary Callout Box ---
  doc.fontSize(12).fillColor(PRIMARY).font('Helvetica-Bold').text('Executive Summary');
  doc.moveDown(0.4);

  const summaryText = narrative?.summary || 'No written summary is available for this report, but the statistics below are accurate.';
  const summaryHeight = doc.heightOfString(summaryText, { width: 460, lineGap: 3 }) + 20;
  const summaryY = doc.y;

  doc.roundedRect(50, summaryY, 495, summaryHeight, 6).fill('#f5f3ff');
  doc.rect(50, summaryY, 4, summaryHeight).fill(PRIMARY);

  doc.fillColor(TEXT_DARK).font('Helvetica').fontSize(10).text(
    summaryText,
    65,
    summaryY + 10,
    { width: 460, lineGap: 3 }
  );

  doc.y = summaryY + summaryHeight + 20;

  // --- Key Metrics (Side-by-Side KPI Boxes) ---
  const yStart = doc.y;
  const boxHeight = 72;
  const boxWidth = 235;

  // Box 1: Total Feedback
  doc.roundedRect(50, yStart, boxWidth, boxHeight, 8).fillAndStroke(BG_LIGHT, BORDER_COLOR);
  // Drawing top Indigo accent border on the rounded rect
  doc.path(`M 50 ${yStart+3} A 3 3 0 0 1 53 ${yStart} L ${50+boxWidth-3} ${yStart} A 3 3 0 0 1 ${50+boxWidth} ${yStart+3} L ${50+boxWidth} ${yStart+3} L 50 ${yStart+3} Z`).fill(PRIMARY);

  doc.fillColor(TEXT_DARK).font('Helvetica-Bold').fontSize(22).text(`${stats.volume.current}`, 65, yStart + 16);
  doc.fontSize(9.5).fillColor(TEXT_MUTED).font('Helvetica').text('Total Feedback Volume', 65, yStart + 40);
  const volChangeText = `${stats.volume.pctChange >= 0 ? '▲ +' : '▼ '}${stats.volume.pctChange}% vs previous period`;
  const volChangeColor = stats.volume.pctChange >= 0 ? GREEN : RED;
  doc.fontSize(8.5).fillColor(volChangeColor).font('Helvetica-Bold').text(volChangeText, 65, yStart + 53);

  // Box 2: Negative Ratio
  doc.roundedRect(310, yStart, boxWidth, boxHeight, 8).fillAndStroke(BG_LIGHT, BORDER_COLOR);
  // Drawing top Red accent border on the rounded rect
  doc.path(`M 310 ${yStart+3} A 3 3 0 0 1 313 ${yStart} L ${310+boxWidth-3} ${yStart} A 3 3 0 0 1 ${310+boxWidth} ${yStart+3} L ${310+boxWidth} ${yStart+3} L 310 ${yStart+3} Z`).fill(RED);

  doc.fillColor(TEXT_DARK).font('Helvetica-Bold').fontSize(22).text(`${stats.sentiment.current.NEG}%`, 325, yStart + 16);
  doc.fontSize(9.5).fillColor(TEXT_MUTED).font('Helvetica').text('Negative Ratio', 325, yStart + 40);
  const negShiftText = `${stats.sentiment.shift.NEG >= 0 ? '▲ +' : '▼ '}${stats.sentiment.shift.NEG}pts vs previous`;
  const negShiftColor = stats.sentiment.shift.NEG > 0 ? RED : GREEN;
  doc.fontSize(8.5).fillColor(negShiftColor).font('Helvetica-Bold').text(negShiftText, 325, yStart + 53);

  doc.y = yStart + boxHeight + 24;

  // --- Sentiment Breakdown Capsule Progress Bar ---
  checkPageBreak(doc, 75);
  doc.fontSize(12).fillColor(PRIMARY).font('Helvetica-Bold').text('Sentiment Breakdown');
  doc.moveDown(0.4);

  const posPct = stats.sentiment.current.POS || 0;
  const neuPct = stats.sentiment.current.NEU || 0;
  const negPct = stats.sentiment.current.NEG || 0;

  const labelY = doc.y;
  doc.fontSize(9.5).fillColor(GREEN).font('Helvetica-Bold').text('● Positive ', 50, labelY, { continued: true });
  doc.fillColor(TEXT_DARK).font('Helvetica').text(`${posPct}%    `, { continued: true });

  doc.fillColor(GRAY).font('Helvetica-Bold').text('● Neutral ', { continued: true });
  doc.fillColor(TEXT_DARK).font('Helvetica').text(`${neuPct}%    `, { continued: true });

  doc.fillColor(RED).font('Helvetica-Bold').text('● Negative ', { continued: true });
  doc.fillColor(TEXT_DARK).font('Helvetica').text(`${negPct}%`);

  doc.moveDown(0.5);

  const barX = 50;
  const barY = doc.y;
  const barHeight = 12;
  const totalBarWidth = 495;

  doc.save();
  doc.roundedRect(barX, barY, totalBarWidth, barHeight, 6).clip();

  const posWidth = (posPct / 100) * totalBarWidth;
  const neuWidth = (neuPct / 100) * totalBarWidth;
  const negWidth = (negPct / 100) * totalBarWidth;

  if (posWidth > 0) {
    doc.rect(barX, barY, posWidth, barHeight).fill(GREEN);
  }
  if (neuWidth > 0) {
    doc.rect(barX + posWidth, barY, neuWidth, barHeight).fill(GRAY);
  }
  if (negWidth > 0) {
    doc.rect(barX + posWidth + neuWidth, barY, negWidth, barHeight).fill(RED);
  }

  doc.restore();
  doc.y = barY + barHeight + 16;

  if (narrative?.sentimentNarrative) {
    doc.fontSize(10).fillColor(TEXT_DARK).font('Helvetica').text(narrative.sentimentNarrative, { lineGap: 3 });
    doc.moveDown(1.5);
  } else {
    doc.moveDown(1);
  }

  // --- Top Themes ---
  checkPageBreak(doc, 90);
  doc.fontSize(12).fillColor(PRIMARY).font('Helvetica-Bold').text('Top Customer Themes');
  doc.moveDown(0.6);

  if (!stats.topThemes || stats.topThemes.length === 0) {
    doc.fontSize(10).fillColor(TEXT_MUTED).font('Helvetica').text('No theme activity in this period.');
    doc.moveDown(1.5);
  } else {
    for (const t of stats.topThemes) {
      const themeNarrative = narrative?.themeNarratives?.find((tn) => tn.themeId === t.themeId);
      const quotesCount = t.quotes?.length || 0;

      // Estimate card height to prevent broken pages
      let themeCardHeight = 24 + (themeNarrative ? 28 : 0) + (quotesCount * 26) + 12;
      checkPageBreak(doc, themeCardHeight);

      const themeY = doc.y;
      doc.roundedRect(50, themeY, 495, themeCardHeight, 8).fillAndStroke(BG_LIGHT, BORDER_COLOR);
      doc.rect(50, themeY, 4, themeCardHeight).fill(t.color || PRIMARY);

      const spikeText = t.isSpiking ? `  [SPIKING +${t.pctChange}%]` : '';
      doc.fontSize(11).fillColor(TEXT_DARK).font('Helvetica-Bold').text(
        `${t.name} • ${t.currentCount} items${spikeText}`,
        65,
        themeY + 12
      );

      if (themeNarrative) {
        doc.fontSize(9.5).fillColor(TEXT_DARK).font('Helvetica').text(
          themeNarrative.narrative,
          65,
          doc.y + 4,
          { width: 460, lineGap: 2.5 }
        );
      }

      if (t.quotes && t.quotes.length > 0) {
        doc.y += 6;
        for (const q of t.quotes) {
          const sentimentLabel = q.sentiment === 'POS' ? 'Positive' : q.sentiment === 'NEG' ? 'Negative' : 'Neutral';
          const sentimentColor = q.sentiment === 'POS' ? GREEN : q.sentiment === 'NEG' ? RED : '#f59e0b';
          const quoteY = doc.y;

          doc.rect(65, quoteY + 2, 2, 13).fill(sentimentColor);
          doc.fontSize(9).fillColor(sentimentColor).font('Helvetica-Bold').text(
            `  ${sentimentLabel.toUpperCase()}`,
            70,
            quoteY + 2,
            { continued: true }
          );
          doc.fillColor(TEXT_DARK).font('Helvetica').text(` — "${q.content}"`, { width: 440, lineGap: 2 });
          doc.y += 4;
        }
      }

      doc.y = themeY + themeCardHeight + 15;
    }
  }

  // --- Recommended Actions ---
  if (narrative?.recommendedActions && narrative.recommendedActions.length > 0) {
    const estimatedHeight = 35 + (narrative.recommendedActions.length * 20) + 12;
    checkPageBreak(doc, estimatedHeight);

    const actionY = doc.y;
    doc.roundedRect(50, actionY, 495, estimatedHeight, 8).fillAndStroke('#f0f9ff', '#bae6fd');
    doc.rect(50, actionY, 4, estimatedHeight).fill('#0284c7');

    doc.fontSize(11).fillColor('#0369a1').font('Helvetica-Bold').text('Recommended Actions', 65, actionY + 12);
    doc.moveDown(0.4);

    for (const action of narrative.recommendedActions) {
      doc.fontSize(9.5).fillColor(TEXT_DARK).font('Helvetica').text(`• ${action}`, 65, doc.y, { width: 460, lineGap: 2.5 });
      doc.y += 3;
    }
    doc.y = actionY + estimatedHeight + 20;
  }

  // --- Add Page Footers / Numbers ---
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);

    // Bottom border / divider line
    doc.strokeColor(BORDER_COLOR).lineWidth(0.5).moveTo(50, 775).lineTo(545, 775).stroke();

    // Footer text
    doc.fontSize(8).fillColor(TEXT_MUTED).font('Helvetica');
    doc.text(
      'Generated by LOOP — AI Customer Feedback Intelligence',
      50,
      785,
      { align: 'left', width: 400 }
    );
    doc.text(
      `Page ${i + 1} of ${range.count}`,
      450,
      785,
      { align: 'right', width: 95 }
    );
  }

  doc.end();
}
