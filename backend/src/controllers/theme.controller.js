import { Theme } from '../models/index.js';

/**
 * Get all themes for the current workspace.
 */
export const getThemes = async (req, res) => {
  try {
    const { workspaceId } = req.user;
    const themes = await Theme.findAll({ where: { workspaceId }, order: [['name', 'ASC']] });
    res.json({ success: true, themes });
  } catch (error) {
    console.error('Error fetching themes:', error);
    res.status(500).json({ error: 'Failed to retrieve themes' });
  }
};