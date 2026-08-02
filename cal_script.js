// --- 1. Dynamic RGB Rainbow + Golden Oscillator ---
let rainbowHue = 0;
let goldHue = 45;
let goldDirection = 1;

function startRealtimeColorLoop() {
  setInterval(() => {
    rainbowHue = (rainbowHue + 0.8) % 360;

    goldHue += 0.1 * goldDirection;
    if (goldHue >= 54 || goldHue <= 38) {
      goldDirection *= -1;
    }

    document.documentElement.style.setProperty('--hue-rainbow', rainbowHue);
    document.documentElement.style.setProperty('--hue-gold', goldHue);
  }, 40);
}

// --- 2. Outside Calculator Hover Glow Tracker ---
const calculatorCard = document.getElementById('calculator');
const cursorGlow = document.getElementById('cursor-glow');

document.addEventListener('mousemove', (e) => {
  const calcRect = calculatorCard.getBoundingClientRect();
  const mouseX = e.clientX;
  const mouseY = e.clientY;

  const isOutside =
    mouseX < calcRect.left ||
    mouseX > calcRect.right ||
    mouseY < calcRect.top ||
    mouseY > calcRect.bottom;

  if (isOutside) {
    cursorGlow.style.left = `${mouseX}px`;
    cursorGlow.style.top = `${mouseY}px`;
    cursorGlow.classList.add('visible');
  } else {
    cursorGlow.classList.remove('visible');
  }
});

document.addEventListener('mouseleave', () => {
  cursorGlow.classList.remove('visible');
});

// --- 3. Live Clock with Seconds ---
function updateClock() {
  const clockElement = document.getElementById('live-clock');
  const now = new Date();
  
  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  
  hours = hours % 12 || 12;
  const hoursStr = String(hours).padStart(2, '0');
  
  clockElement.textContent = `${hoursStr}:${minutes}:${seconds} ${ampm}`;
}

// --- 4. Interactive Ripple Effect ---
function createRipple(event) {
  const button = event.currentTarget;
  const circle = document.createElement('span');
  const diameter = Math.max(button.clientWidth, button.clientHeight);
  const radius = diameter / 2;

  const rect = button.getBoundingClientRect();
  circle.style.width = circle.style.height = `${diameter}px`;
  circle.style.left = `${event.clientX - rect.left - radius}px`;
  circle.style.top = `${event.clientY - rect.top - radius}px`;
  circle.classList.add('ripple');

  const ripple = button.getElementsByClassName('ripple')[0];
  if (ripple) {
    ripple.remove();
  }

  button.appendChild(circle);
}

document.querySelectorAll('.btn').forEach(btn => {
  btn.addEventListener('click', createRipple);
});

// --- 5. Calculator Logic Engine (with editable cursor) ---
let isEvaluated = false;
let lastResult = null;
const history = [];

const expressionEl = document.getElementById('expression');
const resultEl = document.getElementById('result');
const historyPanel = document.getElementById('history-panel');
const displayContainer = document.getElementById('display-container');

// Allowed characters in expression (when typing directly)
const allowedKeys = /^[0-9+\-*/.%^()πsincotaqlgrdep]$/; // rough; we'll sanitize properly

function triggerResultAnimation() {
  resultEl.classList.remove('bump');
  void resultEl.offsetWidth;
  resultEl.classList.add('bump');
}

function updateDisplay() {
  // Nothing needed – contenteditable is self-managed now.
}

function updateHistory() {
  historyPanel.innerHTML = '';
  history.forEach(entry => {
    const div = document.createElement('div');
    div.className = 'history-item';
    div.textContent = entry;
    historyPanel.appendChild(div);
  });
  displayContainer.scrollTop = displayContainer.scrollHeight;
}

// Get the current expression text from the contenteditable div
function getExpressionText() {
  return expressionEl.innerText.trim();
}

// Set expression text and move caret to the end
function setExpressionText(text) {
  expressionEl.innerText = text;
  // Move caret to end
  const range = document.createRange();
  range.selectNodeContents(expressionEl);
  range.collapse(false);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}

// Insert text at the current caret position (or replace selected text)
function insertAtCaret(text) {
  expressionEl.focus();
  const sel = window.getSelection();
  if (sel.rangeCount) {
    const range = sel.getRangeAt(0);
    range.deleteContents();
    const textNode = document.createTextNode(text);
    range.insertNode(textNode);
    // Move caret after the inserted text
    range.setStartAfter(textNode);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  } else {
    // fallback: append at end
    expressionEl.innerText += text;
  }
}

// Sanitise the contenteditable to only contain allowed characters
function sanitizeExpression() {
  let text = expressionEl.innerText;
  // Replace any disallowed character (keep digits, operators, dot, parentheses, π, sin, cos, tan, log, ln, sqrt, ^)
  const allowed = /[^0-9+\-*/.%^()πsincotaqlgrdep\s]/g;
  text = text.replace(allowed, '');
  // Collapse multiple operators? Not needed now.
  expressionEl.innerText = text;
}

// Listen for direct typing/input in the editable expression
expressionEl.addEventListener('input', () => {
  sanitizeExpression();
  // After sanitization, maintain caret position as best as we can (browser handles it)
});

// Prevent newlines and handle Enter to calculate
expressionEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    calculate();
  } else if (e.key === 'Backspace') {
    // Let natural deletion work, but we need to ensure expression updates.
    // We'll handle it via the input event.
  }
});

// Override clearOne to use proper deletion at caret
function clearOne() {
  if (isEvaluated) {
    clearAll();
    return;
  }
  expressionEl.focus();
  const sel = window.getSelection();
  if (sel.rangeCount) {
    const range = sel.getRangeAt(0);
    if (range.collapsed) {
      // If nothing selected, delete character before caret (like Backspace)
      if (range.startOffset > 0) {
        range.setStart(range.startContainer, range.startOffset - 1);
        range.deleteContents();
      }
    } else {
      range.deleteContents();
    }
  }
  // After deletion, the expression is updated; no need to call setExpressionText
}

function clearAll() {
  setExpressionText('');
  resultEl.textContent = '0';
  lastResult = null;
  isEvaluated = false;
  triggerResultAnimation();
}

function appendValue(val) {
  if (isEvaluated) {
    const operators = ['+', '-', '×', '÷', '%', '^'];
    if (operators.includes(val)) {
      if (lastResult !== null && !isNaN(lastResult) && isFinite(lastResult)) {
        setExpressionText(String(lastResult) + val);
      } else {
        setExpressionText('0' + val);
      }
    } else {
      // number, dot, π – start fresh
      setExpressionText(val);
    }
    isEvaluated = false;
  } else {
    insertAtCaret(val);
  }
}

function appendFunc(funcName) {
  if (isEvaluated) {
    setExpressionText(funcName + '(');
    isEvaluated = false;
  } else {
    insertAtCaret(funcName + '(');
  }
}

function calculate() {
  const expression = getExpressionText();
  if (!expression) return;
  
  try {
    let sanitized = expression
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/π/g, 'Math.PI')
      .replace(/\^/g, '**')
      // Trigonometric functions – degrees to radians
      .replace(/sin\(/g, 'Math.sin((Math.PI/180)*')
      .replace(/cos\(/g, 'Math.cos((Math.PI/180)*')
      .replace(/tan\(/g, 'Math.tan((Math.PI/180)*')
      // Other functions
      .replace(/log\(/g, 'Math.log10(')
      .replace(/ln\(/g, 'Math.log(')
      .replace(/sqrt\(/g, 'Math.sqrt(');

    sanitized = sanitized.replace(/(\d|\))(Math\.PI)/g, '$1*$2');
    sanitized = sanitized.replace(/(\d+(\.\d+)?)%/g, '($1/100)');

    let openCount = (sanitized.match(/\(/g) || []).length;
    let closeCount = (sanitized.match(/\)/g) || []).length;
    while (openCount > closeCount) {
      sanitized += ')';
      closeCount++;
    }

    const evalResult = Function(`'use strict'; return (${sanitized})`)();
    
    if (isNaN(evalResult) || !isFinite(evalResult)) {
      resultEl.textContent = 'Error';
      lastResult = null;
    } else {
      const rounded = Math.round(evalResult * 1e10) / 1e10;
      resultEl.textContent = rounded;
      lastResult = rounded;
      history.push(`${expression} = ${rounded}`);
      updateHistory();
    }
    isEvaluated = true;
    triggerResultAnimation();
  } catch (error) {
    resultEl.textContent = 'Syntax Error';
    lastResult = null;
    triggerResultAnimation();
  }
}

// --- 6. Mode Switcher ---
const basicBtn = document.getElementById('mode-basic-btn');
const trigBtn = document.getElementById('mode-trig-btn');
const modeBar = document.querySelector('.mode-bar');
const sciPanel = document.getElementById('scientific-panel');

basicBtn.addEventListener('click', () => {
  basicBtn.classList.add('active');
  trigBtn.classList.remove('active');
  modeBar.classList.remove('trig-active');
  sciPanel.classList.add('hidden');
});

trigBtn.addEventListener('click', () => {
  trigBtn.classList.add('active');
  basicBtn.classList.remove('active');
  modeBar.classList.add('trig-active');
  sciPanel.classList.remove('hidden');
});

// --- 7. Keyboard Listener (for physical keyboard shortcuts) ---
document.addEventListener('keydown', (e) => {
  // Don't interfere when user is typing in the expression
  if (document.activeElement === expressionEl) return;
  
  if ((e.key >= '0' && e.key <= '9') || e.key === '.') appendValue(e.key);
  else if (e.key === '+') appendValue('+');
  else if (e.key === '-') appendValue('-');
  else if (e.key === '*') appendValue('×');
  else if (e.key === '/') appendValue('÷');
  else if (e.key === '%') appendValue('%');
  else if (e.key === 'Enter' || e.key === '=') calculate();
  else if (e.key === 'Backspace') clearOne();
  else if (e.key === 'Escape') clearAll();
});

// --- Init Loops ---
window.addEventListener('DOMContentLoaded', () => {
  startRealtimeColorLoop();
  updateClock();
  setInterval(updateClock, 1000);
  // Set initial empty expression (cursor ready)
  setExpressionText('');
});