// ============================================
// NEXUS ENGINE — Core Engine
// ============================================

class NexusEngine {
  constructor() {
    this.version = '1.0.0';
    this.running = false;
    this.renderer = null;
    this.ai = null;
    this.textureEditor = null;
    this.currentMode = 'normal';
    this.gameLoop = null;
  }

  init() {
    // Init renderer
    const canvas = document.getElementById('gameCanvas');
    this.renderer = new NexusRenderer(canvas);
    this.renderer.setMode(this.currentMode);

    // Init AI
    this.ai = new NexusAI();

    // Start render loop
    this.startLoop();

    // Log
    this.log('Nexus Engine v' + this.version + ' zainicjalizowany.', 'info');
    this.log('WebGL: ' + (this.renderer.gl ? '✓ Aktywny' : '⚠ Fallback 2D'), this.renderer.gl ? 'info' : 'warn');
    this.log('Tryb renderowania: NORMAL', 'info');
  }

  startLoop() {
    const loop = (time) => {
      this.renderer.render(time);
      this.gameLoop = requestAnimationFrame(loop);
    };
    this.gameLoop = requestAnimationFrame(loop);
  }

  setMode(mode) {
    this.currentMode = mode;
    this.renderer.setMode(mode);
    document.body.className = `mode-${mode}`;
    const badge = document.getElementById('currentModeBadge');
    const labels = {
      normal: 'NORMAL MODE',
      realistic: '★ REALISTIC MODE',
      retro: '▓ RETRO 8-BIT MODE',
      ps1: '◻ PS1 MODE'
    };
    if (badge) badge.textContent = labels[mode] || mode.toUpperCase();
    this.log('Tryb zmieniony na: ' + mode.toUpperCase(), 'info');
  }

  log(msg, type = 'info') {
    const out = document.getElementById('console-output');
    if (!out) return;
    const div = document.createElement('div');
    div.className = 'log-' + type;
    div.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
    out.appendChild(div);
    out.scrollTop = out.scrollHeight;
  }
}

window.NexusEngine = NexusEngine;
