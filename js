/* ============================================================
   StudyMind AI — script.js
   Author: StudyMind AI Team
   Description: All interactivity for Smart Study Plan AI Website
   ============================================================ */

/* ══════════════════════════════════════════════════════════
   1. SCROLL REVEAL ANIMATION
   ══════════════════════════════════════════════════════════ */
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));


/* ══════════════════════════════════════════════════════════
   2. PROGRESS BARS — animate on scroll into view
   ══════════════════════════════════════════════════════════ */
const barObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.querySelectorAll('.progress-bar').forEach(bar => {
        bar.style.width = bar.dataset.width + '%';
      });
    }
  });
}, { threshold: 0.3 });

document.querySelectorAll('.tracker-card').forEach(card => barObserver.observe(card));


/* ══════════════════════════════════════════════════════════
   3. LEARNING STYLE TAGS — single select toggle
   ══════════════════════════════════════════════════════════ */
document.querySelectorAll('#style-tags .tag').forEach(tag => {
  tag.addEventListener('click', () => {
    document.querySelectorAll('#style-tags .tag').forEach(t => t.classList.remove('active'));
    tag.classList.add('active');
  });
});


/* ══════════════════════════════════════════════════════════
   4. STREAK CALENDAR — build 14-day calendar
   ══════════════════════════════════════════════════════════ */
(function buildStreak() {
  const streakBox = document.getElementById('streak-box');
  if (!streakBox) return;

  const dayLetters = ['M','T','W','T','F','S','S'];
  for (let i = 0; i < 14; i++) {
    const d = document.createElement('div');
    let state = 'done';
    if (i === 12) state = 'today';
    else if (i > 12) state = 'missed';
    d.className = 'streak-day ' + state;
    d.textContent = dayLetters[i % 7];
    streakBox.appendChild(d);
  }
})();


/* ══════════════════════════════════════════════════════════
   5. POMODORO TIMER
   ══════════════════════════════════════════════════════════ */
let timerInterval = null;
let timerSeconds  = 25 * 60;
let timerRunning  = false;
let timerDuration = 25;

/**
 * Switch between Focus / Short Break / Long Break modes.
 * @param {number} mins  - duration in minutes
 * @param {string} label - mode label text
 */
function setMode(mins, label) {
  // Remove active from all mode buttons, add to clicked
  const btn = event ? event.target : null;
  document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  resetTimer();
  timerDuration = mins;
  timerSeconds  = mins * 60;

  const labelEl = document.getElementById('timer-label');
  if (labelEl) labelEl.textContent = label.toUpperCase();

  const display = document.getElementById('timer-display');
  if (display) display.textContent = pad(mins) + ':00';
}

/** Start or pause the timer. */
function toggleTimer() {
  const startBtn = document.getElementById('timer-start-btn');

  if (timerRunning) {
    clearInterval(timerInterval);
    timerRunning = false;
    if (startBtn) startBtn.textContent = '▶ Resume';
  } else {
    timerRunning = true;
    if (startBtn) startBtn.textContent = '⏸ Pause';

    timerInterval = setInterval(() => {
      timerSeconds--;

      if (timerSeconds < 0) {
        clearInterval(timerInterval);
        timerRunning = false;
        if (startBtn) startBtn.textContent = '▶ Start';

        const display = document.getElementById('timer-display');
        if (display) display.textContent = '00:00';

        alert('⏰ Time is up! Great work! Take a well-earned break 😊');
        return;
      }

      const display = document.getElementById('timer-display');
      if (display) {
        const m = Math.floor(timerSeconds / 60);
        const s = timerSeconds % 60;
        display.textContent = pad(m) + ':' + pad(s);
      }
    }, 1000);
  }
}

/** Reset timer to current duration. */
function resetTimer() {
  clearInterval(timerInterval);
  timerRunning = false;

  timerSeconds = timerDuration * 60;

  const startBtn = document.getElementById('timer-start-btn');
  if (startBtn) startBtn.textContent = '▶ Start';

  const display = document.getElementById('timer-display');
  if (display) display.textContent = pad(timerDuration) + ':00';
}

/** Left-pad a number to 2 digits. */
function pad(n) {
  return String(n).padStart(2, '0');
}


/* ══════════════════════════════════════════════════════════
   6. AI STUDY PLAN GENERATOR
   ══════════════════════════════════════════════════════════ */

/** Task templates by difficulty level. */
const PLAN_TEMPLATES = {
  easy: [
    { label: 'Introduction & Overview',  time: '30 min' },
    { label: 'Concept Mind Map',         time: '20 min' },
    { label: 'Light Practice Problems',  time: '25 min' },
    { label: 'Flashcard Review',         time: '15 min' },
  ],
  medium: [
    { label: 'Deep Reading & Notes',          time: '45 min' },
    { label: 'Concept Application',           time: '30 min' },
    { label: 'Self-Testing (Active Recall)',   time: '20 min' },
    { label: 'Problem Solving',               time: '35 min' },
    { label: 'Summary & Spaced Review',       time: '15 min' },
  ],
  hard: [
    { label: 'Intense Reading + Annotations', time: '60 min' },
    { label: 'Formula / Key Concept Drill',   time: '40 min' },
    { label: 'Past Paper Questions',          time: '50 min' },
    { label: 'Error Analysis & Corrections',  time: '25 min' },
    { label: 'Teach-Back Method',             time: '20 min' },
    { label: 'Final Spaced Review',           time: '15 min' },
  ],
};

/** Auto-detected topic lists per subject keyword. */
const TOPICS = {
  physics: [
    'Mechanics & Motion', 'Waves & Optics',
    'Electricity & Magnetism', 'Thermodynamics', 'Modern Physics'
  ],
  mathematics: [
    'Algebra & Functions', 'Calculus (Derivatives)',
    'Calculus (Integration)', 'Probability & Statistics', 'Linear Algebra'
  ],
  chemistry: [
    'Atomic Structure', 'Chemical Bonding',
    'Thermochemistry', 'Organic Chemistry Basics', 'Reaction Kinetics'
  ],
  history: [
    'Ancient Civilizations', 'Medieval Period',
    'Industrial Revolution', 'World Wars', 'Modern Era'
  ],
  biology: [
    'Cell Biology', 'Genetics & DNA',
    'Human Physiology', 'Ecology', 'Evolution'
  ],
  geography: [
    'Physical Geography', 'Human Geography',
    'Climate & Weather', 'Maps & Cartography', 'Environmental Issues'
  ],
  economics: [
    'Microeconomics Basics', 'Macroeconomics',
    'Supply & Demand', 'Market Structures', 'Global Trade'
  ],
  computer: [
    'Data Structures', 'Algorithms',
    'Operating Systems', 'Databases', 'Networking'
  ],
  english: [
    'Grammar & Composition', 'Reading Comprehension',
    'Essay Writing', 'Literature Analysis', 'Vocabulary Building'
  ],
  default: [
    'Core Concepts & Fundamentals',
    'Key Theories & Frameworks',
    'Practical Applications',
    'Case Studies & Examples',
    'Exam Strategy & Revision',
  ],
};

/** Day accent colors cycling through the plan. */
const DAY_COLORS = [
  '#6C3DE8','#4ECDC4','#FF6B6B','#FFD93D',
  '#6BCB77','#FF8C42','#9B6DFF'
];

const DAY_NAMES = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

/**
 * Detect subject topics from user input string.
 * @param {string} subject
 * @returns {string[]}
 */
function getTopics(subject) {
  const key = subject.toLowerCase().trim();
  for (const k in TOPICS) {
    if (key.includes(k)) return TOPICS[k];
  }
  // Fallback: replace generic placeholders with the subject name
  return TOPICS.default.map(t => subject + ' — ' + t);
}

/**
 * Main plan generator — called by the "Generate" button.
 */
async function generatePlan() {
  const subjectInput  = document.getElementById('subject-input');
  const examDateInput = document.getElementById('exam-date');
  const hoursSelect   = document.getElementById('study-hours');
  const diffSelect    = document.getElementById('difficulty');
  const activeTag     = document.querySelector('#style-tags .tag.active');

  const subject    = subjectInput  ? subjectInput.value.trim()  : '';
  const examDate   = examDateInput ? examDateInput.value        : '';
  const hours      = hoursSelect   ? parseInt(hoursSelect.value): 2;
  const difficulty = diffSelect    ? diffSelect.value           : 'medium';
  const style      = activeTag     ? activeTag.dataset.val      : 'visual';

  if (!subject) {
    alert('Please enter a subject or exam name!');
    return;
  }

  // ── UI: show loading state ──
  const btn = document.getElementById('generate-btn');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Generating…'; }

  const placeholder = document.getElementById('plan-placeholder');
  const spinner     = document.getElementById('spinner');
  const result      = document.getElementById('plan-result');

  if (placeholder) placeholder.style.display = 'none';
  if (result)      result.classList.remove('visible');
  if (spinner)     spinner.classList.add('active');

  // Simulate AI thinking delay
  await new Promise(resolve => setTimeout(resolve, 1800));

  if (spinner) spinner.classList.remove('active');

  // ── Build plan HTML ──
  const tasks  = PLAN_TEMPLATES[difficulty] || PLAN_TEMPLATES.medium;
  const topics = getTopics(subject);
  const days   = 7;

  let daysHTML = '';
  for (let d = 0; d < days; d++) {
    const topic  = topics[d % topics.length];
    const color  = DAY_COLORS[d % DAY_COLORS.length];
    const dayName = DAY_NAMES[d];

    const tasksHTML = tasks.map(t => `
      <div class="task-item">
        <div class="task-check" onclick="toggleTask(this)"></div>
        <div class="task-text"><strong>${t.label}</strong> — ${topic}</div>
        <span class="task-time">${t.time}</span>
      </div>`).join('');

    daysHTML += `
      <div class="plan-day">
        <div class="day-header" onclick="toggleDay(this)">
          <span class="day-title">
            <span class="day-dot" style="background:${color}"></span>
            Day ${d + 1} — ${dayName}
          </span>
          <span class="day-badge">${tasks.length} tasks · ${hours}h</span>
        </div>
        <div class="day-body">${tasksHTML}</div>
      </div>`;
  }

  // ── Format exam date ──
  let dateStr = '';
  if (examDate) {
    const formatted = new Date(examDate).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
    dateStr = ' · Exam on ' + formatted;
  }

  // ── Inject into DOM ──
  const titleEl = document.getElementById('plan-title');
  const daysEl  = document.getElementById('plan-days');

  if (titleEl) titleEl.textContent = '📚 ' + subject + ' Study Plan' + dateStr;
  if (daysEl)  daysEl.innerHTML = daysHTML;
  if (result)  result.classList.add('visible');

  // Auto-open Day 1
  const firstBody = document.querySelector('.day-body');
  if (firstBody) firstBody.classList.add('open');

  // ── Reset button ──
  if (btn) { btn.disabled = false; btn.textContent = '✨ Generate My AI Study Plan'; }
}

/**
 * Toggle a plan day's task list open / closed.
 * @param {HTMLElement} header
 */
function toggleDay(header) {
  const body = header.nextElementSibling;
  if (body) body.classList.toggle('open');
}

/**
 * Mark a task as done / undone.
 * @param {HTMLElement} check
 */
function toggleTask(check) {
  check.classList.toggle('done');
  const text = check.nextElementSibling;
  if (!text) return;
  if (check.classList.contains('done')) {
    text.style.textDecoration = 'line-through';
    text.style.opacity = '0.5';
  } else {
    text.style.textDecoration = '';
    text.style.opacity = '';
  }
}


/* ══════════════════════════════════════════════════════════
   7. NAV — shrink on scroll
   ══════════════════════════════════════════════════════════ */
window.addEventListener('scroll', () => {
  const nav = document.querySelector('nav');
  if (nav) {
    nav.style.padding = window.scrollY > 60 ? '0.7rem 3rem' : '1rem 3rem';
  }
});


/* ══════════════════════════════════════════════════════════
   8. SMOOTH SCROLL HELPERS — called from inline onclick attrs
   ══════════════════════════════════════════════════════════ */
function scrollTo(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}
