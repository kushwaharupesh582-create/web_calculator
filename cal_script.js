(function() {
  'use strict';

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
    const oldRipple = button.querySelector('.ripple');
    if (oldRipple) oldRipple.remove();
    button.appendChild(circle);
    setTimeout(() => circle.remove(), 600);
  }

  // --- 5. Calculator Logic Engine (display-only expression) ---
  let isEvaluated = false;
  let lastResult = null;
  const history = [];

  const expressionEl = document.getElementById('expression');
  const resultEl = document.getElementById('result');
  const historyPanel = document.getElementById('history-panel');
  const displayContainer = document.getElementById('display-container');

  function triggerResultAnimation() {
    resultEl.classList.remove('bump');
    void resultEl.offsetWidth;
    resultEl.classList.add('bump');
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

  function getExpressionText() {
    return expressionEl.innerText.trim();
  }

  function setExpressionText(text) {
    expressionEl.innerText = text;
  }

  function clearAll() {
    setExpressionText('');
    resultEl.textContent = '0';
    lastResult = null;
    isEvaluated = false;
    triggerResultAnimation();
  }

  function clearOne() {
    if (isEvaluated) {
      clearAll();
      return;
    }
    const text = getExpressionText();
    if (text.length > 0) {
      setExpressionText(text.slice(0, -1));
    }
  }

  function appendValue(val) {
    if (isEvaluated) {
      const operators = ['+', '-', '×', '÷', '%', '^'];
      if (operators.includes(val)) {
        const current = getExpressionText();
        if (lastResult !== null && !isNaN(lastResult) && isFinite(lastResult)) {
          setExpressionText(String(lastResult) + val);
        } else if (current) {
          setExpressionText(current + val);
        } else {
          setExpressionText('0' + val);
        }
      } else {
        setExpressionText(val);
      }
      isEvaluated = false;
    } else {
      const current = getExpressionText();
      setExpressionText(current + val);
    }
  }

  function appendFunc(funcName) {
    if (isEvaluated) {
      setExpressionText(funcName + '(');
      isEvaluated = false;
    } else {
      const current = getExpressionText();
      setExpressionText(current + funcName + '(');
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
        .replace(/sin\(/g, 'Math.sin((Math.PI/180)*')
        .replace(/cos\(/g, 'Math.cos((Math.PI/180)*')
        .replace(/tan\(/g, 'Math.tan((Math.PI/180)*')
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

  // --- 7. Button Bindings (data-val / data-fn) ---
  document.querySelectorAll('[data-val]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const val = e.currentTarget.getAttribute('data-val');
      appendValue(val);
    });
  });

  document.querySelectorAll('[data-fn]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const fn = e.currentTarget.getAttribute('data-fn');
      appendFunc(fn);
    });
  });

  document.getElementById('btn-ac').addEventListener('click', clearAll);
  document.getElementById('btn-ce').addEventListener('click', clearOne);
  document.getElementById('btn-equals').addEventListener('click', calculate);

  // Ripple on all buttons
  document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', createRipple);
  });

  // --- 8. Keyboard Listener (physical keyboard shortcuts) ---
  document.addEventListener('keydown', (e) => {
    const key = e.key;
    // Only intercept if not typing in a focused input (but we have none)
    if (document.activeElement && document.activeElement.tagName === 'INPUT') return;

    if ((key >= '0' && key <= '9') || key === '.') {
      e.preventDefault();
      appendValue(key);
    } else if (key === '+') {
      e.preventDefault();
      appendValue('+');
    } else if (key === '-') {
      e.preventDefault();
      appendValue('-');
    } else if (key === '*') {
      e.preventDefault();
      appendValue('×');
    } else if (key === '/') {
      e.preventDefault();
      appendValue('÷');
    } else if (key === '%') {
      e.preventDefault();
      appendValue('%');
    } else if (key === 'Enter' || key === '=') {
      e.preventDefault();
      calculate();
    } else if (key === 'Backspace') {
      e.preventDefault();
      clearOne();
    } else if (key === 'Escape') {
      e.preventDefault();
      clearAll();
    } else if (key === '^') {
      e.preventDefault();
      appendValue('^');
    } else if (key === '(') {
      e.preventDefault();
      appendValue('(');
    } else if (key === ')') {
      e.preventDefault();
      appendValue(')');
    }
  });

  // --- Init ---
  window.addEventListener('DOMContentLoaded', () => {
    startRealtimeColorLoop();
    updateClock();
    setInterval(updateClock, 1000);
    setExpressionText('');
  });

})();
