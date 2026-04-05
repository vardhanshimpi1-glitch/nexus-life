const express = require('express');
const router = express.Router();
const User = require('../models/User');

const DEFAULT_TASKS = {
  Warrior: [
    { title: 'Morning workout', difficulty: 'hard', type: 'daily', xpReward: 50 },
    { title: 'Hit 10,000 steps', difficulty: 'medium', type: 'daily', xpReward: 25 },
    { title: 'Drink 3L water', difficulty: 'easy', type: 'habit', xpReward: 10 }
  ],
  Scholar: [
    { title: 'Study session (2hrs)', difficulty: 'hard', type: 'daily', xpReward: 50 },
    { title: 'Read 30 pages', difficulty: 'medium', type: 'daily', xpReward: 25 },
    { title: 'Review your notes', difficulty: 'easy', type: 'habit', xpReward: 10 }
  ],
  Builder: [
    { title: 'Deep work (3hrs)', difficulty: 'hard', type: 'daily', xpReward: 50 },
    { title: 'Outreach / client work', difficulty: 'medium', type: 'daily', xpReward: 25 },
    { title: 'Plan tomorrow', difficulty: 'easy', type: 'habit', xpReward: 10 }
  ],
  Monk: [
    { title: 'Meditate 20 minutes', difficulty: 'medium', type: 'daily', xpReward: 25 },
    { title: 'No social media till noon', difficulty: 'hard', type: 'daily', xpReward: 50 },
    { title: 'Journaling', difficulty: 'easy', type: 'habit', xpReward: 10 }
  ]
};

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, charClass, goals, avatar } = req.body;
    if (!username || !email || !password) return res.status(400).json({ error: 'All fields required' });
    const exists = await User.findOne({ $or: [{ email }, { username }] });
    if (exists) return res.status(400).json({ error: 'Username or email already taken' });

    const user = new User({
      username, email, password,
      charClass: charClass || 'Builder',
      goals: goals || [],
      avatar: avatar || '⚡',
      tasks: DEFAULT_TASKS[charClass] || DEFAULT_TASKS.Builder,
      lastActiveDate: new Date().toDateString()
    });
    await user.save();
    req.session.userId = user._id;
    res.json({ success: true, user: sanitizeUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    user.checkDailyReset();
    await user.save();
    req.session.userId = user._id;
    res.json({ success: true, user: sanitizeUser(user) });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// Get current user
router.get('/me', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });
  try {
    const user = await User.findById(req.session.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.checkDailyReset();
    await user.save();
    res.json({ user: sanitizeUser(user) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get user' });
  }
});

function sanitizeUser(user) {
  const ld = user.getLevelTitle();
  return {
    id: user._id,
    username: user.username,
    email: user.email,
    charClass: user.charClass,
    avatar: user.avatar,
    goals: user.goals,
    xp: user.xp,
    level: ld.level,
    levelTitle: ld.title,
    levelMin: ld.min,
    levelMax: ld.max,
    streak: user.streak,
    tasks: user.tasks,
    activityLog: user.activityLog.slice(-20).reverse()
  };
}

module.exports = router;
module.exports.sanitizeUser = sanitizeUser;
