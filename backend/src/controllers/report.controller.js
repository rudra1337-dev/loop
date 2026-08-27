import { createReport, listReports, getReportById } from '../services/report.service.js';

export const generateReport = async (req, res) => {
  try {
    const { workspaceId, id: userId } = req.user;
    const { periodStart, periodEnd } = req.body;

    if (!periodStart || !periodEnd) {
      return res.status(400).json({ error: 'periodStart and periodEnd are required' });
    }

    const start = new Date(periodStart);
    const end = new Date(periodEnd);
    if (isNaN(start) || isNaN(end) || start >= end) {
      return res.status(400).json({ error: 'Invalid period — periodStart must be before periodEnd' });
    }

    const report = await createReport(workspaceId, userId, start, end);
    res.status(201).json({ success: true, report });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
};

export const getReports = async (req, res) => {
  try {
    const { workspaceId } = req.user;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const { rows, count } = await listReports(workspaceId, { page, limit });
    res.json({
      success: true,
      data: rows,
      pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) },
    });
  } catch (error) {
    console.error('Error listing reports:', error);
    res.status(500).json({ error: 'Failed to list reports' });
  }
};

export const getReport = async (req, res) => {
  try {
    const { workspaceId } = req.user;
    const report = await getReportById(workspaceId, req.params.id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    res.json({ success: true, report });
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({ error: 'Failed to fetch report' });
  }
};