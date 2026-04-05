const express = require('express');
const router = express.Router();
const User = require('../models/User');
const requireAuth = require('../middleware/auth');
const { sanitizeUser } = require('./auth');

// Get all tasks
router.get('/', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    res.json({ tasks: user.tasks });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get tasks' });
  }
});

// Add task
router.post('/', requireAuth, async (req, res) => {
  try {
    const { title, difficulty, type } = req.body;
    const xpMap = { easy: 10, medium: 25, hard: 50 };
    const user = await User.findById(req.session.userId);
    user.tasks.push({ title, difficulty: difficulty || 'medium', type: type || 'daily', xpReward: xpMap[difficulty] || 25 });
    await user.save();
    res.json({ success: true, tasks: user.tasks });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add task' });
  }
});

// Complete / uncomplete task
router.patch('/:taskId/toggle', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    const task = user.tasks.id(req.params.taskId);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    if (!task.completed) {
      // Complete it
      task.completed = true;
      task.completedAt = new Date();
      user.xp += task.xpReward;
      user.streak += 1;
      user.activityLog.push({ action: `Completed: ${task.title}`, xpChange: task.xpReward });
      // Update level
      const ld = user.getLevelTitle();
      user.level = ld.level;
      await user.save();
      return res.json({ success: true, action: 'completed', xpGained: task.xpReward, user: sanitizeUser(user) });
    } else {
      // Uncomplete — take XP back
      task.completed = false;
      task.completedAt = null;
      user.xp = Math.max(0, user.xp - task.xpReward);
      user.streak = Math.max(0, user.streak - 1);
      user.activityLog.push({ action: `Uncompleted: ${task.title}`, xpChange: -task.xpReward });
      const ld = user.getLevelTitle();
      user.level = ld.level;
      await user.save();
      return res.json({ success: true, action: 'uncompleted', xpLost: task.xpReward, user: sanitizeUser(user) });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to toggle task' });
  }
});

// Delete task
router.delete('/:taskId', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    user.tasks = user.tasks.filter(t => t._id.toString() !== req.params.taskId);
    await user.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

module.exports = router;
