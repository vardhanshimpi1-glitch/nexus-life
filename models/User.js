const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const TaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  type: { type: String, enum: ['daily', 'onetime', 'habit'], default: 'daily' },
  xpReward: { type: Number, default: 25 },
  completed: { type: Boolean, default: false },
  completedAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

const ActivitySchema = new mongoose.Schema({
  action: String,
  xpChange: Number,
  timestamp: { type: Date, default: Date.now }
});

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true, minlength: 2, maxlength: 20 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  charClass: { type: String, enum: ['Warrior', 'Scholar', 'Builder', 'Monk'], default: 'Builder' },
  avatar: { type: String, default: '⚡' },
  goals: [{ type: String }],
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  streak: { type: Number, default: 0 },
  lastActiveDate: { type: String, default: '' },
  tasks: [TaskSchema],
  activityLog: [ActivitySchema],
  createdAt: { type: Date, default: Date.now }
});

// Hash password before save
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
UserSchema.methods.comparePassword = async function(candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Get level title
UserSchema.methods.getLevelTitle = function() {
  const titles = [
    { min: 0, max: 500, title: 'Beginner', level: 1 },
    { min: 500, max: 2000, title: 'Disciplined', level: 2 },
    { min: 2000, max: 5000, title: 'Focused', level: 3 },
    { min: 5000, max: 10000, title: 'Elite', level: 4 },
    { min: 10000, max: Infinity, title: 'Beast', level: 5 }
  ];
  const found = titles.find(t => this.xp >= t.min && this.xp < t.max);
  return found || titles[titles.length - 1];
};

// Reset daily tasks at midnight
UserSchema.methods.checkDailyReset = function() {
  const today = new Date().toDateString();
  if (this.lastActiveDate !== today) {
    // Check for missed tasks yesterday — apply penalty
    const missedCount = this.tasks.filter(t => t.type === 'daily' && !t.completed).length;
    if (this.lastActiveDate !== '' && missedCount > 0) {
      const penalty = missedCount * 15;
      this.xp = Math.max(0, this.xp - penalty);
      this.activityLog.push({ action: `Missed ${missedCount} tasks — penalty`, xpChange: -penalty });
      if (this.streak > 0) this.streak = Math.max(0, this.streak - 1);
    }
    // Reset daily tasks
    this.tasks.forEach(t => { if (t.type === 'daily') t.completed = false; });
    this.lastActiveDate = today;
  }
};

module.exports = mongoose.model('User', UserSchema);
