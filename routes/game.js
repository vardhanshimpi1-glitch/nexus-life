const express = require('express');
const router = express.Router();
const User = require('../models/User');
const requireAuth = require('../middleware/auth');

// Leaderboard — top 20 by XP
router.get('/leaderboard', async (req, res) => {
  try {
    const users = await User.find({})
      .select('username avatar charClass xp level streak')
      .sort({ xp: -1 })
      .limit(20);
    const currentUserId = req.session.userId;
    const lb = users.map((u, i) => ({
      rank: i + 1,
      username: u.username,
      avatar: u.avatar,
      charClass: u.charClass,
      xp: u.xp,
      level: u.level,
      streak: u.streak,
      isMe: u._id.toString() === (currentUserId ? currentUserId.toString() : '')
    }));
    res.json({ leaderboard: lb });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load leaderboard' });
  }
});

// AI Coach — full conversational
router.post('/ai-coach', requireAuth, async (req, res) => {
  try {
    const { message, history } = req.body;
    const user = await User.findById(req.session.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const doneTasks = user.tasks.filter(t => t.completed).map(t => t.title);
    const pendingTasks = user.tasks.filter(t => !t.completed).map(t => t.title);
    const ld = user.getLevelTitle();

    const systemPrompt = `You are NEXUS AI — the personal life coach inside NexusLife, a life gamification platform.

Player Profile:
- Name: ${user.username}
- Class: ${user.charClass}
- Level: ${ld.level} (${ld.title})
- XP: ${user.xp}
- Streak: ${user.streak} days
- Goals: ${user.goals.join(', ') || 'Not set'}
- Today's completed tasks: ${doneTasks.join(', ') || 'None yet'}
- Pending tasks: ${pendingTasks.join(', ') || 'All done!'}

Your personality: You are direct, motivating, occasionally brutal, but always constructive. You speak like a high-performance coach — not a therapist. You use game language naturally (XP, level up, streak, boss fight, etc.) but not excessively. You give real, actionable advice. You answer ALL questions — about productivity, habits, fitness, money, mindset, study, anything. You reference the user's actual data when relevant. Keep responses concise but powerful — 3-6 sentences unless the user needs a detailed plan. Address them by name sometimes.`;

    const messages = [];
    if (history && Array.isArray(history)) {
      history.slice(-8).forEach(m => messages.push({ role: m.role, content: m.content }));
    }
    messages.push({ role: 'user', content: message });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 600,
        system: systemPrompt,
        messages
      })
    });

    const data = await response.json();
    if (data.error) return res.status(500).json({ error: data.error.message });
    const reply = data.content[0].text;
    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'AI Coach unavailable' });
  }
});

module.exports = router;
