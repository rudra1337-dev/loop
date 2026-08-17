import { Feedback, Theme, sequelize } from '../models/index.js';
import { Op } from 'sequelize';

/**
 * Get feedback items for the current workspace with pagination, search, and filters.
 */
export const getFeedbacks = async (req, res) => {
  try {
    const { workspaceId } = req.user;
    const { page = 1, limit = 10, search = '', channel, sentiment, status, theme, from, to } = req.query;

    const parsedPage = parseInt(page);
    const parsedLimit = parseInt(limit);
    if (isNaN(parsedPage) || parsedPage <= 0) {
      return res.status(400).json({ error: 'Page must be a positive integer' });
    }
    if (isNaN(parsedLimit) || parsedLimit <= 0) {
      return res.status(400).json({ error: 'Limit must be a positive integer' });
    }

    const validStatuses = ['NEW', 'REVIEWED', 'ACTIONED'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const validSentiments = ['POS', 'NEU', 'NEG'];
    if (sentiment && !validSentiments.includes(sentiment)) {
      return res.status(400).json({ error: 'Invalid sentiment value' });
    }

    if (from && isNaN(Date.parse(from))) {
      return res.status(400).json({ error: 'Invalid "from" date format' });
    }
    if (to && isNaN(Date.parse(to))) {
      return res.status(400).json({ error: 'Invalid "to" date format' });
    }

    const offset = (parsedPage - 1) * parsedLimit;
    const whereClause = { workspaceId };

    if (search && search.trim() !== '') {
      whereClause.content = { [Op.like]: `%${search.trim()}%` };
    }
    if (channel) whereClause.channel = channel;
    if (sentiment) whereClause.sentiment = sentiment;
    if (status) whereClause.status = status;
    if (from || to) {
      whereClause.createdAt = {};
      if (from) whereClause.createdAt[Op.gte] = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        whereClause.createdAt[Op.lte] = toDate;
      }
    }

    const includeOptions = [
      theme
        ? { model: Theme, where: { name: theme }, through: { attributes: [] }, required: true }
        : { model: Theme, through: { attributes: [] }, required: false },
    ];

    const { rows: feedbacks, count } = await Feedback.findAndCountAll({
      where: whereClause,
      include: includeOptions,
      limit: parsedLimit,
      offset,
      order: [['createdAt', 'DESC']],
      distinct: true,
    });

    res.json({
      success: true,
      data: feedbacks,
      feedbacks,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total: count,
        totalPages: Math.ceil(count / parsedLimit),
        currentPage: parsedPage,
        totalItems: count,
      },
    });
  } catch (error) {
    console.error('Error fetching feedbacks:', error);
    res.status(500).json({ error: 'Failed to retrieve feedbacks' });
  }
};

/**
 * Delete a specific feedback item.
 */
export const deleteFeedback = async (req, res) => {
  try {
    const { workspaceId } = req.user;
    const { id } = req.params;

    const feedback = await Feedback.findOne({ where: { id, workspaceId } });
    if (!feedback) {
      return res.status(404).json({ error: 'Feedback item not found in this workspace' });
    }

    await feedback.destroy();
    res.json({ success: true, message: 'Feedback deleted successfully' });
  } catch (error) {
    console.error('Error deleting feedback:', error);
    res.status(500).json({ error: 'Failed to delete feedback' });
  }
};

/**
 * Update the status of a specific feedback item.
 */
export const updateStatus = async (req, res) => {
  try {
    const { workspaceId } = req.user;
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['NEW', 'REVIEWED', 'ACTIONED'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const feedback = await Feedback.findOne({ where: { id, workspaceId } });
    if (!feedback) {
      return res.status(404).json({ error: 'Feedback item not found' });
    }

    feedback.status = status;
    await feedback.save();

    res.json({ success: true, message: 'Feedback status updated successfully', feedback });
  } catch (error) {
    console.error('Error updating feedback status:', error);
    res.status(500).json({ error: 'Failed to update feedback status' });
  }
};