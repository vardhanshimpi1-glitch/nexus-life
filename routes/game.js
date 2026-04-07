const express = require('express');
const router = express.Router();
const User = require('../models/User');
const requireAuth = require('../middleware/auth');
const https = require('https');

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

// AI Coach — full conversational using https module (no fetch dependency issues)
router.post('/ai-coach', requireAuth, async (req, res) => {
  try {
    const { message, history } = req.body;
    const user = await User.findById(req.session.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const doneTasks = user.tasks.filter(t => t.completed).map(t => t.title);
    const pendingTasks = user.tasks.filter(t => !t.completed).map(t => t.title);
    const ld = user.getLevelTitle();

    const systemPrompt = `You are NEXUS AI — the personal life coach inside NexusLife, a life gamification platform where users earn XP by completing real-life tasks.

Player Profile:
- Name: ${user.username}
- Class: ${user.charClass}
- Level: ${ld.level} (${ld.title})
- XP: ${user.xp}
- Streak: ${user.streak} days
- Goals: ${user.goals.join(', ') || 'Not set'}
- Today completed: ${doneTasks.join(', ') || 'None yet'}
- Still pending: ${pendingTasks.join(', ') || 'All done!'}

Your personality: Direct, motivating, occasionally brutal but always constructive. You speak like a high-performance coach. Use game language naturally (XP, level up, streak, etc.) but not excessively. You answer ALL questions about productivity, habits, fitness, money, mindset, study, relationships, business — anything. Reference the user's actual data when relevant. Keep responses focused and powerful — 3-6 sentences unless user needs a detailed plan. Address them by name sometimes.`;

    const messages = [];
    if (history && Array.isArray(history)) {
      history.slice(-8).forEach(m => messages.push({ role: m.role, content: m.content }));
    }
    messages.push({ role: 'user', content: message });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey.includes('YOUR_KEY')) {
      return res.json({ reply: 'AI Coach is not configured yet. Add your ANTHROPIC_API_KEY to the environment variables.' });
    }

    const body = JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 600,
      system: systemPrompt,
      messages
    });

    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const reply = await new Promise((resolve, reject) => {
      const request = https.request(options, (response) => {
        let data = '';
        response.on('data', chunk => data += chunk);
        response.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.error) reject(new Error(parsed.error.message));
            else resolve(parsed.content[0].text);
          } catch (e) {
            reject(e);
          }
        });
      });
      request.on('error', reject);
      request.write(body);
      request.end();
    });

    res.json({ reply });
  } catch (err) {
    console.error('AI Coach error:', err.message);
    res.status(500).json({ error: 'AI Coach unavailable: ' + err.message });
  }
});

module.exports = router;
