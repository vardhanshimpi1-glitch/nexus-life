// ===== NEXUSLIFE FRONTEND APP =====

const state = {
  user: null,
  selectedClass: '',
  selectedGoals: [],
  selectedAvatar: '⚡',
  newTaskType: 'daily',
  newTaskDiff: 'medium',
  pendingToggleTask: null,
  chatHistory: []
};

// ===== INIT =====
window.addEventListener('DOMContentLoaded', async () => {
  await checkAuth();
});

async function checkAuth() {
  try {
    const res = await fetch('/api/auth/me');
    const data = await res.json();
    if (data.user) {
      state.user = data.user;
      fadeLoader();
      showPage('page-dashboard');
      renderDashboard();
      loadLeaderboard();
    } else {
      fadeLoader();
      showPage('page-landing');
    }
  } catch {
    fadeLoader();
    showPage('page-landing');
  }
}

function fadeLoader() {
  const loader = document.getElementById('loader');
  setTimeout(() => {
    loader.classList.add('fade-out');
    setTimeout(() => loader.remove(), 600);
  }, 1800);
}

// ===== PAGE NAVIGATION =====
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  document.getElementById(pageId).classList.remove('hidden');
  window.scrollTo(0, 0);
}

// ===== LOGIN =====
async function handleLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pass = document.getElementById('login-pass').value;
  const errEl = document.getElementById('login-error');
  errEl.classList.add('hidden');
  if (!email || !pass) { showError(errEl, 'Fill in all fields'); return; }
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass })
    });
    const data = await res.json();
    if (!data.success) { showError(errEl, data.error); return; }
    state.user = data.user;
    showPage('page-dashboard');
    renderDashboard();
    loadLeaderboard();
    showToast('WELCOME BACK, ' + state.user.username.toUpperCase() + '!');
  } catch {
    showError(errEl, 'Connection error. Try again.');
  }
}

// ===== ONBOARDING =====
let onboardStep = 1;

function onboardNext(step) {
  if (step === 1) {
    const username = document.getElementById('reg-username').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const pass = document.getElementById('reg-pass').value;
    const errEl = document.getElementById('reg-error');
    if (!username || username.length < 2) { showError(errEl, 'Username must be at least 2 characters'); return; }
    if (!email || !email.includes('@')) { showError(errEl, 'Enter a valid email'); return; }
    if (!pass || pass.length < 6) { showError(errEl, 'Password must be at least 6 characters'); return; }
    errEl.classList.add('hidden');
  }
  if (step === 2 && !state.selectedClass) { showToast('Select a class first!'); return; }
  if (step === 3 && state.selectedGoals.length === 0) { showToast('Select at least one goal!'); return; }
  goToOnboardPanel(step + 1);
}

function onboardBack(step) { goToOnboardPanel(step - 1); }

function goToOnboardPanel(step) {
  document.querySelectorAll('.onboard-panel').forEach(p => { p.classList.add('hidden'); p.classList.remove('active'); });
  const panel = document.getElementById('opanel-' + step);
  panel.classList.remove('hidden'); panel.classList.add('active');
  // Update progress indicators
  for (let i = 1; i <= 4; i++) {
    const stepEl = document.getElementById('ostep-' + i);
    if (i < step) { stepEl.classList.add('done'); stepEl.classList.remove('active'); }
    else if (i === step) { stepEl.classList.add('active'); stepEl.classList.remove('done'); }
    else { stepEl.classList.remove('active', 'done'); }
    if (i < 4) {
      const line = document.getElementById('oline-' + i);
      if (i < step) line.classList.add('done'); else line.classList.remove('done');
    }
  }
  onboardStep = step;
}

function selectClass(el, cls) {
  state.selectedClass = cls;
  document.querySelectorAll('.class-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  document.getElementById('cls-next-btn').disabled = false;
}

function toggleGoal(el, goal) {
  el.classList.toggle('selected');
  if (state.selectedGoals.includes(goal)) {
    state.selectedGoals = state.selectedGoals.filter(g => g !== goal);
  } else {
    state.selectedGoals.push(goal);
  }
  document.getElementById('goals-next-btn').disabled = state.selectedGoals.length === 0;
}

function selectAvatar(el, av) {
  state.selectedAvatar = av;
  document.querySelectorAll('.avatar-opt').forEach(a => a.classList.remove('selected'));
  el.classList.add('selected');
  document.getElementById('av-next-btn').disabled = false;
}

async function handleRegister() {
  const username = document.getElementById('reg-username').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-pass').value;
  const errEl = document.getElementById('reg-error');
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username, email, password,
        charClass: state.selectedClass,
        goals: state.selectedGoals,
        avatar: state.selectedAvatar
      })
    });
    const data = await res.json();
    if (!data.success) { showError(errEl, data.error); goToOnboardPanel(1); return; }
    state.user = data.user;
    showPage('page-dashboard');
    renderDashboard();
    loadLeaderboard();
    showToast('WELCOME TO NEXUSLIFE, ' + state.user.username.toUpperCase() + '!');
  } catch {
    showError(errEl, 'Registration failed. Try again.');
  }
}

// ===== LOGOUT =====
async function handleLogout() {
  await fetch('/api/auth/logout', { method: 'POST' });
  state.user = null;
  state.chatHistory = [];
  showPage('page-landing');
  showToast('LOGGED OUT');
}

// ===== DASHBOARD =====
function renderDashboard() {
  const u = state.user;
  if (!u) return;
  // Avatar & name
  document.getElementById('su-avatar').textContent = u.avatar;
  document.getElementById('su-name').textContent = u.username;
  document.getElementById('su-class').textContent = u.charClass.toUpperCase();
  document.getElementById('m-avatar').textContent = u.avatar;
  document.getElementById('xp-avatar').textContent = u.avatar;
  document.getElementById('xp-username').textContent = u.username;
  document.getElementById('xp-classlevel').textContent = u.charClass.toUpperCase() + ' · ' + u.levelTitle.toUpperCase();
  // XP
  const pct = Math.min(100, Math.round(((u.xp - u.levelMin) / (u.levelMax - u.levelMin)) * 100));
  document.getElementById('xp-bar-fill').style.width = pct + '%';
  document.getElementById('level-badge').textContent = 'LVL ' + u.level;
  document.getElementById('xp-next-label').textContent = (u.levelMax - u.xp).toLocaleString() + ' XP to next level';
  document.getElementById('xp-total').textContent = u.xp.toLocaleString() + ' XP';
  // Streaks
  const streakText = '🔥 ' + u.streak;
  document.getElementById('d-streak').textContent = streakText;
  document.getElementById('m-streak').textContent = streakText;
  // Stats
  const done = u.tasks.filter(t => t.completed).length;
  const missed = u.tasks.filter(t => !t.completed && t.type === 'daily').length;
  document.getElementById('stat-done').textContent = done;
  document.getElementById('stat-missed').textContent = missed;
  document.getElementById('stat-xp').textContent = u.xp.toLocaleString();
  renderTasks();
  renderActivityLog();
}

function renderTasks() {
  const list = document.getElementById('task-list');
  list.innerHTML = '';
  if (!state.user || !state.user.tasks.length) {
    list.innerHTML = '<div style="color:var(--txt2);padding:20px;text-align:center;font-size:15px">No tasks yet. Add your first task!</div>';
    return;
  }
  state.user.tasks.forEach(task => {
    const xpMap = { easy: 'xp-easy', medium: 'xp-medium', hard: 'xp-hard' };
    const xpLabels = { easy: '+10', medium: '+25', hard: '+50' };
    const typeLabel = task.type.toUpperCase() + ' · ' + task.difficulty.toUpperCase();
    const el = document.createElement('div');
    el.className = 'task-item' + (task.completed ? ' completed' : '');
    el.innerHTML = `
      <div class="task-check ${task.completed ? 'done' : ''}" onclick="handleTaskToggle('${task._id}')">${task.completed ? '✓' : ''}</div>
      <div class="task-info">
        <div class="task-title">${escapeHtml(task.title)}</div>
        <div class="task-meta">${typeLabel}</div>
      </div>
      <div class="task-xp-badge ${xpMap[task.difficulty]}">${xpLabels[task.difficulty]} XP</div>
      <button class="task-delete" onclick="deleteTask('${task._id}')" title="Delete task">✕</button>
    `;
    list.appendChild(el);
  });
}

function renderActivityLog() {
  const log = document.getElementById('activity-log');
  if (!state.user || !state.user.activityLog.length) {
    log.innerHTML = '<div style="color:var(--txt2);padding:20px;text-align:center;font-size:15px">No activity yet. Start completing tasks!</div>';
    return;
  }
  log.innerHTML = '';
  state.user.activityLog.forEach(entry => {
    const isPos = entry.xpChange > 0;
    const time = new Date(entry.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    const el = document.createElement('div');
    el.className = 'log-item';
    el.innerHTML = `
      <div>
        <div class="log-action">${escapeHtml(entry.action)}</div>
        <div class="log-time">${time}</div>
      </div>
      <div class="log-xp ${isPos ? 'positive' : 'negative'}">${isPos ? '+' : ''}${entry.xpChange} XP</div>
    `;
    log.appendChild(el);
  });
}

// ===== TASK TOGGLE WITH CONFIRM =====
function handleTaskToggle(taskId) {
  const task = state.user.tasks.find(t => t._id === taskId);
  if (!task) return;
  state.pendingToggleTask = taskId;

  const modal = document.getElementById('modal-confirm');
  const icon = document.getElementById('confirm-icon');
  const title = document.getElementById('confirm-title');
  const sub = document.getElementById('confirm-sub');
  const cancelBtn = document.getElementById('confirm-cancel-btn');
  const okBtn = document.getElementById('confirm-ok-btn');

  if (!task.completed) {
    icon.textContent = '✓';
    title.textContent = 'TASK COMPLETE!';
    sub.textContent = `"${task.title}" — +${task.xpReward} XP`;
    cancelBtn.textContent = 'CANCEL';
    okBtn.textContent = 'CONFIRM ✓';
  } else {
    icon.textContent = '↩';
    title.textContent = 'UNDO COMPLETION?';
    sub.textContent = `"${task.title}" — -${task.xpReward} XP refunded`;
    cancelBtn.textContent = 'KEEP IT';
    okBtn.textContent = 'UNDO';
  }
  modal.classList.remove('hidden');
}

async function closeConfirm(confirmed) {
  document.getElementById('modal-confirm').classList.add('hidden');
  if (!confirmed || !state.pendingToggleTask) { state.pendingToggleTask = null; return; }
  const taskId = state.pendingToggleTask;
  state.pendingToggleTask = null;
  await toggleTaskAPI(taskId);
}

async function toggleTaskAPI(taskId) {
  try {
    const task = state.user.tasks.find(t => t._id === taskId);
    const res = await fetch('/api/tasks/' + taskId + '/toggle', { method: 'PATCH' });
    const data = await res.json();
    if (!data.success) { showToast('Error: ' + data.error); return; }
    state.user = data.user;
    renderDashboard();
    if (data.action === 'completed') {
      spawnXPPop('+' + data.xpGained + ' XP');
      showToast('🔥 TASK COMPLETE! +' + data.xpGained + ' XP');
      refreshLeaderboard();
    } else {
      showToast('Task unmarked. -' + data.xpLost + ' XP refunded');
    }
  } catch {
    showToast('Error updating task');
  }
}

// ===== DELETE TASK =====
async function deleteTask(taskId) {
  if (!confirm('Delete this task?')) return;
  try {
    const res = await fetch('/api/tasks/' + taskId, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      state.user.tasks = state.user.tasks.filter(t => t._id !== taskId);
      renderTasks();
      showToast('Task deleted');
    }
  } catch {
    showToast('Error deleting task');
  }
}

// ===== ADD TASK MODAL =====
function openAddTaskModal() {
  document.getElementById('new-task-name').value = '';
  state.newTaskType = 'daily';
  state.newTaskDiff = 'medium';
  document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.type-btn')[0].classList.add('active');
  document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active-diff'));
  document.getElementById('modal-add-task').classList.remove('hidden');
  setTimeout(() => document.getElementById('new-task-name').focus(), 100);
}
function closeAddTaskModal() { document.getElementById('modal-add-task').classList.add('hidden'); }

function setType(el, type) {
  state.newTaskType = type;
  document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
}

function setDiff(el, diff) {
  state.newTaskDiff = diff;
  document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active-diff'));
  el.classList.add('active-diff');
}

async function submitAddTask() {
  const title = document.getElementById('new-task-name').value.trim();
  if (!title) { showToast('Enter a task name!'); return; }
  try {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, difficulty: state.newTaskDiff, type: state.newTaskType })
    });
    const data = await res.json();
    if (data.success) {
      state.user.tasks = data.tasks;
      renderTasks();
      closeAddTaskModal();
      showToast('TASK ADDED: ' + title.toUpperCase());
    }
  } catch {
    showToast('Error adding task');
  }
}

// ===== TAB SWITCHING =====
function switchTab(tab, el) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));
  document.getElementById('tab-' + tab).classList.remove('hidden');
  // Sidebar nav
  document.querySelectorAll('.snav-item').forEach(n => n.classList.remove('active'));
  document.querySelectorAll('.mnav-item').forEach(n => n.classList.remove('active'));
  if (el) el.classList.add('active');
  // Also update corresponding nav
  const sideItem = document.querySelector('.snav-item[data-tab="' + tab + '"]');
  const mobileItem = document.querySelector('.mnav-item[data-tab="' + tab + '"]');
  if (sideItem) sideItem.classList.add('active');
  if (mobileItem) mobileItem.classList.add('active');
  if (tab === 'leaderboard') loadLeaderboard();
}

// ===== LEADERBOARD =====
let lbInterval = null;

async function loadLeaderboard() {
  try {
    const res = await fetch('/api/game/leaderboard');
    const data = await res.json();
    renderLeaderboard(data.leaderboard);
  } catch {
    document.getElementById('lb-list').innerHTML = '<div style="color:var(--txt2);padding:20px">Could not load leaderboard.</div>';
  }
}

function refreshLeaderboard() {
  // Refresh in background
  loadLeaderboard();
}

function renderLeaderboard(lb) {
  const list = document.getElementById('lb-list');
  if (!lb || !lb.length) {
    list.innerHTML = '<div style="color:var(--txt2);padding:20px">No players yet. Be the first!</div>';
    return;
  }
  const rankClass = ['gold', 'silver', 'bronze'];
  list.innerHTML = '';
  lb.forEach((p, i) => {
    const el = document.createElement('div');
    el.className = 'lb-item' + (p.isMe ? ' me' : '');
    el.innerHTML = `
      <div class="lb-rank ${rankClass[i] || ''}">${String(i + 1).padStart(2, '0')}</div>
      <div class="lb-avatar">${p.avatar}</div>
      <div class="lb-info">
        <div class="lb-name">${escapeHtml(p.username)}${p.isMe ? ' <span style="color:var(--accent);font-size:12px">(YOU)</span>' : ''}</div>
        <div class="lb-sub">${p.charClass.toUpperCase()} · LVL ${p.level}</div>
      </div>
      <div>
        <div class="lb-xp">${p.xp.toLocaleString()} XP</div>
        <div class="lb-streak">🔥 ${p.streak}</div>
      </div>
    `;
    list.appendChild(el);
  });
}

// Auto-refresh leaderboard every 30 seconds when on that tab
setInterval(() => {
  if (!document.getElementById('tab-leaderboard').classList.contains('hidden')) {
    loadLeaderboard();
  }
}, 30000);

// ===== AI COACH =====
async function sendChatMessage() {
  const input = document.getElementById('chat-input');
  const msg = input.value.trim();
  if (!msg) return;
  input.value = '';
  appendChatMsg('user', msg);
  state.chatHistory.push({ role: 'user', content: msg });
  appendTyping();
  try {
    const res = await fetch('/api/game/ai-coach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg, history: state.chatHistory.slice(-8) })
    });
    const data = await res.json();
    removeTyping();
    const reply = data.reply || 'Coach unavailable right now.';
    appendChatMsg('ai', reply);
    state.chatHistory.push({ role: 'assistant', content: reply });
  } catch {
    removeTyping();
    appendChatMsg('ai', 'Connection error. Coach will be back online soon.');
  }
}

function quickChat(msg) {
  document.getElementById('chat-input').value = msg;
  sendChatMessage();
}

function appendChatMsg(role, text) {
  const win = document.getElementById('chat-window');
  // Remove welcome message on first chat
  const welcome = win.querySelector('.chat-welcome');
  if (welcome) welcome.remove();
  const el = document.createElement('div');
  el.className = 'chat-msg ' + (role === 'user' ? 'user-msg' : 'ai-msg');
  el.innerHTML = `
    <div class="chat-msg-icon">${role === 'user' ? (state.user ? state.user.avatar : '👤') : '🤖'}</div>
    <div class="chat-bubble">${escapeHtml(text).replace(/\n/g, '<br>')}</div>
  `;
  win.appendChild(el);
  win.scrollTop = win.scrollHeight;
}

function appendTyping() {
  const win = document.getElementById('chat-window');
  const el = document.createElement('div');
  el.className = 'chat-msg ai-msg';
  el.id = 'typing-indicator';
  el.innerHTML = `<div class="chat-msg-icon">🤖</div><div class="chat-typing"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>`;
  win.appendChild(el);
  win.scrollTop = win.scrollHeight;
}

function removeTyping() {
  const el = document.getElementById('typing-indicator');
  if (el) el.remove();
}

// ===== XP POP =====
function spawnXPPop(text) {
  const pop = document.createElement('div');
  pop.className = 'xp-pop';
  pop.textContent = text;
  pop.style.left = (Math.random() * 60 + 20) + '%';
  pop.style.top = '40%';
  document.getElementById('xp-pops').appendChild(pop);
  setTimeout(() => pop.remove(), 1400);
}

// ===== TOAST =====
let toastTimer = null;
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.remove('hidden');
  toast.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.classList.add('hidden'), 300);
  }, 2500);
}

// ===== UTILS =====
function showError(el, msg) {
  el.textContent = msg;
  el.classList.remove('hidden');
}

function escapeHtml(str) {
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(str));
  return d.innerHTML;
}

// ===== KEYBOARD SHORTCUTS =====
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.getElementById('modal-add-task').classList.add('hidden');
    document.getElementById('modal-confirm').classList.add('hidden');
  }
});

// Close modals on overlay click
document.getElementById('modal-add-task').addEventListener('click', function(e) {
  if (e.target === this) closeAddTaskModal();
});
document.getElementById('modal-confirm').addEventListener('click', function(e) {
  if (e.target === this) closeConfirm(false);
});
