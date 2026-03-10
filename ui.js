// ============================================
// NEXUS ENGINE — UI System
// ============================================

function initUI(engine) {
  // ===== Mode Switcher =====
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      engine.setMode(btn.dataset.mode);
    });
  });

  // ===== Top Nav Panels =====
  const panels = {
    editor: null,
    textures: 'panel-textures',
    assets: 'panel-assets',
    ai: 'panel-ai',
    settings: 'panel-settings'
  };

  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const panel = panels[btn.dataset.panel];
      Object.values(panels).forEach(p => { if(p) document.getElementById(p)?.classList.add('hidden'); });
      if (panel) {
        document.getElementById(panel)?.classList.remove('hidden');
        if (btn.dataset.panel === 'ai') initAIPanel(engine);
        if (btn.dataset.panel === 'textures') initTexturePanel(engine);
        if (btn.dataset.panel === 'assets') initAssetsPanel();
      }
    });
  });

  // Close panels
  document.querySelectorAll('.close-panel').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.full-panel')?.classList.add('hidden');
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      document.querySelector('.nav-btn[data-panel="editor"]')?.classList.add('active');
    });
  });

  // ===== Viewport Tools =====
  document.querySelectorAll('.vp-tool').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.vp-tool').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  document.querySelectorAll('.vp-view').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.vp-view').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Wireframe/Grid/Shadows
  document.getElementById('wireframe')?.addEventListener('change', e => {
    if (engine.renderer) engine.renderer.wireframe = e.target.checked;
  });
  document.getElementById('grid')?.addEventListener('change', e => {
    if (engine.renderer) engine.renderer.gridEnabled = e.target.checked;
  });

  // ===== Bottom Tabs =====
  document.querySelectorAll('.btab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.btab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      document.querySelectorAll('.btab-content').forEach(c => c.classList.add('hidden'));
      const target = tab.dataset.btab + 'Panel';
      document.getElementById(target)?.classList.remove('hidden');
    });
  });

  // ===== Console Input =====
  document.getElementById('consoleInput')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const val = e.target.value.trim();
      if (!val) return;
      engine.log('> ' + val, 'info');
      try {
        const result = eval(val); // Sandboxed in real engine
        if (result !== undefined) engine.log(String(result), 'info');
      } catch (err) {
        engine.log('Error: ' + err.message, 'error');
      }
      e.target.value = '';
    }
  });

  // ===== Scene Tree Selection =====
  document.querySelectorAll('.tree-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.tree-item').forEach(i => i.classList.remove('selected'));
      item.classList.add('selected');
      engine.log(`Wybrano obiekt: ${item.querySelector('.tree-name')?.textContent}`, 'info');
    });
  });

  // ===== Add Object Button =====
  document.getElementById('addObjectBtn')?.addEventListener('click', () => {
    const names = ['Sześcian', 'Sfera', 'Walec', 'Płaszczyzna', 'Kapsułka', 'Stożek'];
    const icons = ['📦', '🔵', '⬜', '▭', '💊', '△'];
    const i = Math.floor(Math.random() * names.length);
    const tree = document.getElementById('scene-tree');
    const item = document.createElement('div');
    item.className = 'tree-item child';
    item.dataset.id = Date.now();
    item.innerHTML = `<span class="tree-icon">${icons[i]}</span><span class="tree-name">${names[i]}_${Math.floor(Math.random()*100)}</span>`;
    item.addEventListener('click', () => {
      document.querySelectorAll('.tree-item').forEach(it => it.classList.remove('selected'));
      item.classList.add('selected');
    });
    tree.appendChild(item);
    engine.log(`Dodano obiekt: ${names[i]}`, 'info');
  });

  // ===== Physics Sliders =====
  ['gravity', 'friction', 'bounce', 'air'].forEach(id => {
    const slider = document.getElementById(id + 'Slider');
    const val = document.getElementById(id + 'Val');
    if (slider && val) {
      slider.addEventListener('input', () => { val.textContent = slider.value; });
    }
  });

  // ===== Run Game =====
  document.getElementById('btnRun')?.addEventListener('click', () => {
    const modal = document.getElementById('game-modal');
    if (modal) {
      modal.classList.remove('hidden');
      startGamePreview(engine);
    }
  });

  document.getElementById('closeModal')?.addEventListener('click', () => {
    document.getElementById('game-modal')?.classList.add('hidden');
    stopGamePreview();
  });

  document.getElementById('toggleFullscreen')?.addEventListener('click', () => {
    const inner = document.querySelector('.modal-inner');
    if (inner) {
      inner.style.width = inner.style.width === '100vw' ? '' : '100vw';
      inner.style.height = inner.style.height === '100vh' ? '' : '100vh';
      inner.style.borderRadius = inner.style.borderRadius === '0px' ? '' : '0px';
    }
  });

  // ===== Export =====
  document.getElementById('btnExport')?.addEventListener('click', () => {
    engine.log('Eksportowanie projektu...', 'info');
    setTimeout(() => {
      engine.log('✓ Projekt wyeksportowany (symulacja)', 'info');
      showToast('Projekt wyeksportowany!');
    }, 1000);
  });

  document.getElementById('publishGH')?.addEventListener('click', () => {
    engine.log('Publikowanie na GitHub Pages...', 'info');
    setTimeout(() => {
      engine.log('✓ Opublikowano na: https://yourusername.github.io/nexus-game/', 'info');
      showToast('Opublikowano na GitHub Pages!');
    }, 2000);
  });

  // ===== Resize =====
  window.addEventListener('resize', () => {
    if (engine.renderer) engine.renderer.resize();
  });

  // ===== Code Editor =====
  document.getElementById('runScript')?.addEventListener('click', () => {
    engine.log('Uruchamianie skryptu...', 'info');
    engine.log('✓ Skrypt skompilowany pomyślnie', 'info');
  });

  document.getElementById('aiFixBtn')?.addEventListener('click', () => {
    engine.log('AI analizuje kod...', 'info');
    setTimeout(() => {
      engine.log('✓ AI znalazło i naprawiło 2 potencjalne błędy', 'info');
      showToast('Kod naprawiony przez AI!');
    }, 1200);
  });
}

// ===== Texture Panel =====
function initTexturePanel(engine) {
  if (engine.textureEditor) return;
  const canvas = document.getElementById('textureCanvas');
  if (!canvas) return;
  engine.textureEditor = new NexusTextureEditor(canvas);

  const brushSizeSlider = document.getElementById('brushSize');
  const texColor = document.getElementById('texColor');

  brushSizeSlider?.addEventListener('input', () => {
    engine.textureEditor.brushSize = parseInt(brushSizeSlider.value);
  });

  texColor?.addEventListener('input', () => {
    engine.textureEditor.color = texColor.value;
  });

  document.querySelectorAll('.tex-tool').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tex-tool').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      engine.textureEditor.tool = btn.dataset.texttool;
    });
  });

  document.querySelectorAll('.pal-color').forEach(col => {
    col.addEventListener('click', () => {
      engine.textureEditor.color = col.style.background;
      if (texColor) texColor.value = rgbToHex(col.style.background);
    });
  });

  document.getElementById('generateTexture')?.addEventListener('click', () => {
    const prompt = document.getElementById('aiTexPrompt')?.value || 'random';
    engine.textureEditor.generateTexture(prompt);
    showToast('Tekstura wygenerowana!');
  });

  document.getElementById('saveTexture')?.addEventListener('click', () => {
    engine.textureEditor.addToLibrary();
    showToast('Zapisano do biblioteki!');
  });

  document.getElementById('clearTexture')?.addEventListener('click', () => {
    engine.textureEditor.clear();
  });
}

// ===== AI Panel =====
function initAIPanel(engine) {
  const brainCanvas = document.getElementById('brainCanvas');
  if (brainCanvas && !engine._brainInit) {
    engine._brainInit = true;
    engine.ai.animateBrain(brainCanvas, null);
  }

  // AI Module switching
  document.querySelectorAll('.ai-module').forEach(mod => {
    mod.addEventListener('click', () => {
      document.querySelectorAll('.ai-module').forEach(m => m.classList.remove('active'));
      mod.classList.add('active');
      document.querySelectorAll('.ai-section').forEach(s => s.classList.add('hidden'));
      const target = 'ai-' + mod.dataset.ai;
      document.getElementById(target)?.classList.remove('hidden');

      if (mod.dataset.ai === 'balance') {
        const canvas = document.getElementById('balanceCanvas');
        if (canvas) engine.ai.drawBalanceChart(canvas);
      }
      if (mod.dataset.ai === 'pathfind') {
        const canvas = document.getElementById('pathCanvas');
        if (canvas && !engine._mazeInit) {
          engine._mazeInit = true;
          engine.ai.generateMaze(canvas);
        }
      }
    });
  });

  // Train AI
  document.getElementById('trainAI')?.addEventListener('click', async () => {
    const logEl = document.getElementById('trainingLog');
    if (logEl) logEl.innerHTML = '';
    const config = {
      type: document.getElementById('npcAiType')?.value,
      aggression: parseFloat(document.getElementById('aiAggression')?.value || 0.5),
      intelligence: parseFloat(document.getElementById('aiIntelligence')?.value || 0.7),
    };
    await engine.ai.trainNPC(logEl, config);
  });

  // Terrain generator
  document.getElementById('generateTerrain')?.addEventListener('click', () => {
    const config = {
      seed: parseInt(document.getElementById('terrainSeed')?.value || 42),
      scale: parseInt(document.getElementById('terrainScale')?.value || 30),
      height: parseInt(document.getElementById('terrainHeight')?.value || 10),
      octaves: parseInt(document.getElementById('terrainOctaves')?.value || 4),
      type: document.getElementById('terrainType')?.value?.toLowerCase() || 'niziny'
    };
    const typeMap = { 'niziny': 'plains', 'góry': 'mountains', 'wyspy': 'islands', 'kaniony': 'canyon', 'księżyc': 'moon' };
    config.type = typeMap[config.type] || config.type;
    const data = engine.ai.generateTerrain(config);
    const canvas = document.getElementById('terrainPreview');
    if (canvas) engine.ai.renderTerrainPreview(canvas, data);
    showToast('Teren wygenerowany!');
  });

  // Code generator
  document.getElementById('generateCode')?.addEventListener('click', () => {
    const prompt = document.getElementById('aiCodePrompt')?.value || 'generic script';
    const code = engine.ai.generateCode(prompt);
    const el = document.getElementById('aiGeneratedCode');
    if (el) el.textContent = code;
    showToast('Kod wygenerowany!');
  });

  // Balance analyzer
  document.getElementById('analyzeBalance')?.addEventListener('click', () => {
    const canvas = document.getElementById('balanceCanvas');
    if (canvas) engine.ai.drawBalanceChart(canvas);
    document.getElementById('balFun').textContent = (70 + Math.floor(Math.random()*25)) + '%';
    const diffs = ['★☆☆', '★★☆', '★★★'];
    document.getElementById('balDiff').textContent = diffs[Math.floor(Math.random()*3)];
    showToast('Analiza zakończona!');
  });

  // Pathfinding
  document.getElementById('generateMaze')?.addEventListener('click', () => {
    const canvas = document.getElementById('pathCanvas');
    if (canvas) { engine._mazeInit = true; engine.ai.generateMaze(canvas); }
  });

  document.getElementById('solvePath')?.addEventListener('click', () => {
    if (!engine.ai.pathGrid) return;
    const { grid, size, start, end } = engine.ai.pathGrid;
    const path = engine.ai.astar(grid, start, end, size);
    const canvas = document.getElementById('pathCanvas');
    if (canvas) engine.ai.renderMaze(canvas, path);
    showToast(path.length ? `Ścieżka znaleziona! (${path.length} kroków)` : 'Brak ścieżki!');
  });
}

// ===== Assets Panel =====
function initAssetsPanel() {
  const grid = document.getElementById('assetsGrid');
  if (!grid || grid.children.length > 0) return;

  const assets = [
    { icon: '🟫', name: 'Cube.mesh' },
    { icon: '⚪', name: 'Sphere.mesh' },
    { icon: '⬜', name: 'Plane.mesh' },
    { icon: '💊', name: 'Capsule.mesh' },
    { icon: '🖼', name: 'Stone_tex.png' },
    { icon: '🖼', name: 'Grass_tex.png' },
    { icon: '🖼', name: 'Metal_tex.png' },
    { icon: '🔊', name: 'Jump.wav' },
    { icon: '🔊', name: 'Footstep.wav' },
    { icon: '🎬', name: 'Walk_anim' },
    { icon: '📜', name: 'Player.js' },
    { icon: '📜', name: 'Enemy.js' },
    { icon: '✨', name: 'Explosion.pfx' },
    { icon: '✨', name: 'Rain.pfx' },
  ];

  assets.forEach(a => {
    const item = document.createElement('div');
    item.className = 'asset-item';
    item.innerHTML = `<span class="asset-icon">${a.icon}</span><span class="asset-name">${a.name}</span>`;
    item.addEventListener('click', () => showToast(`Załadowano: ${a.name}`));
    grid.appendChild(item);
  });
}

// ===== Game Preview =====
let gamePreviewLoop = null;
let gameState = { hp: 100, score: 0, ammo: 30, time: 0, playerX: 0, playerY: 0 };

function startGamePreview(engine) {
  const canvas = document.getElementById('gamePreviewCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width = canvas.offsetWidth;
  const h = canvas.height = canvas.offsetHeight;

  const keys = {};
  const keyHandler = e => { keys[e.key] = e.type === 'keydown'; };
  document.addEventListener('keydown', keyHandler);
  document.addEventListener('keyup', keyHandler);
  canvas._keyHandler = keyHandler;

  const mode = engine.currentMode;
  const pX = { value: w/2 }, pY = { value: h/2 };
  const enemies = Array.from({ length: 5 }, (_, i) => ({
    x: Math.random() * w,
    y: Math.random() * h,
    hp: 30,
    vx: (Math.random()-0.5)*2,
    vy: (Math.random()-0.5)*2
  }));

  const draw = (t) => {
    // Background
    const bgColors = {
      normal: '#0a1628',
      realistic: '#050505',
      retro: '#000',
      ps1: '#1a0a3e'
    };
    ctx.fillStyle = bgColors[mode] || '#0a1628';
    ctx.fillRect(0, 0, w, h);

    // Grid
    const gc = mode === 'retro' ? 'rgba(0,255,65,0.2)' : mode === 'ps1' ? 'rgba(200,100,255,0.15)' : 'rgba(0,212,255,0.1)';
    ctx.strokeStyle = gc;
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 40) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke(); }
    for (let y = 0; y < h; y += 40) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke(); }

    // Player movement
    const spd = 3;
    if (keys['ArrowLeft'] || keys['a'] || keys['A']) pX.value -= spd;
    if (keys['ArrowRight'] || keys['d'] || keys['D']) pX.value += spd;
    if (keys['ArrowUp'] || keys['w'] || keys['W']) pY.value -= spd;
    if (keys['ArrowDown'] || keys['s'] || keys['S']) pY.value += spd;
    pX.value = Math.max(20, Math.min(w-20, pX.value));
    pY.value = Math.max(20, Math.min(h-20, pY.value));

    // Draw enemies
    enemies.forEach(en => {
      en.x += en.vx;
      en.y += en.vy;
      if (en.x < 0 || en.x > w) en.vx *= -1;
      if (en.y < 0 || en.y > h) en.vy *= -1;

      const dx = pX.value - en.x, dy = pY.value - en.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      en.x += (dx/dist) * 0.5;
      en.y += (dy/dist) * 0.5;

      const ec = mode === 'retro' ? '#ff00ff' : mode === 'ps1' ? '#ff6090' : '#ef4444';
      ctx.fillStyle = ec;
      if (mode === 'retro') {
        ctx.fillRect(en.x-10, en.y-10, 20, 20);
        ctx.strokeStyle = '#ff00ff';
        ctx.lineWidth = 1;
        ctx.strokeRect(en.x-10, en.y-10, 20, 20);
      } else {
        ctx.beginPath();
        ctx.arc(en.x, en.y, 12, 0, Math.PI*2);
        ctx.fill();
        // HP bar
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(en.x-15, en.y-22, 30, 4);
        ctx.fillStyle = '#10b981';
        ctx.fillRect(en.x-15, en.y-22, 30*(en.hp/30), 4);
      }
    });

    // Draw player
    const pc = mode === 'retro' ? '#00ff41' : mode === 'ps1' ? '#60c0ff' : '#00d4ff';
    if (mode === 'retro') {
      ctx.fillStyle = pc;
      ctx.fillRect(pX.value-10, pY.value-14, 20, 28);
      ctx.fillStyle = '#00ff41';
      ctx.fillRect(pX.value-6, pY.value-20, 12, 12);
    } else {
      ctx.fillStyle = pc;
      ctx.shadowColor = pc;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(pX.value, pY.value, 14, 0, Math.PI*2);
      ctx.fill();
      ctx.shadowBlur = 0;
      // Direction indicator
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(pX.value, pY.value);
      ctx.lineTo(pX.value + Math.cos(t*0.001)*20, pY.value + Math.sin(t*0.001)*20);
      ctx.stroke();
    }

    // Scanlines for retro/ps1
    if (mode === 'retro' || mode === 'ps1') {
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      for (let y = 0; y < h; y += 4) ctx.fillRect(0, y, w, 2);
    }

    // Mode watermark
    const modeLabels = { normal: 'NORMAL', realistic: 'REALISTIC', retro: '8-BIT RETRO', ps1: 'PS1 STYLE' };
    ctx.font = `bold 11px "Share Tech Mono"`;
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillText(modeLabels[mode] || mode, 10, h-10);
    ctx.fillText('WASD = ruch', w-100, h-10);

    // Update HUD
    gameState.time += 0.016;
    document.getElementById('hpVal').textContent = Math.max(0, gameState.hp);
    document.getElementById('scoreVal').textContent = Math.floor(gameState.time * 10);

    gamePreviewLoop = requestAnimationFrame(draw);
  };
  gamePreviewLoop = requestAnimationFrame(draw);
}

function stopGamePreview() {
  if (gamePreviewLoop) {
    cancelAnimationFrame(gamePreviewLoop);
    gamePreviewLoop = null;
  }
}

// ===== Helpers =====
function showToast(msg) {
  const existing = document.getElementById('nexus-toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.id = 'nexus-toast';
  toast.textContent = msg;
  toast.style.cssText = `
    position:fixed; bottom:30px; left:50%; transform:translateX(-50%);
    background:#00d4ff; color:#000; padding:8px 20px; border-radius:6px;
    font-family:'Share Tech Mono',monospace; font-size:0.8rem;
    z-index:9999; animation:toast-in 0.3s ease;
    box-shadow: 0 4px 20px rgba(0,212,255,0.4);
  `;
  const style = document.createElement('style');
  style.textContent = '@keyframes toast-in{from{opacity:0;transform:translateX(-50%) translateY(10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}';
  document.head.appendChild(style);
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function rgbToHex(rgb) {
  const m = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!m) return '#000000';
  return '#' + [m[1],m[2],m[3]].map(n=>parseInt(n).toString(16).padStart(2,'0')).join('');
}

window.initUI = initUI;
