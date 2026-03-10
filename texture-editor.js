// ============================================
// NEXUS ENGINE — Texture Editor
// ============================================

class NexusTextureEditor {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.tool = 'brush';
    this.brushSize = 10;
    this.color = '#ff6600';
    this.painting = false;
    this.lastX = 0;
    this.lastY = 0;
    this.textures = [];
    this.history = [];
    this.historyIndex = -1;
    this.initCanvas();
    this.bindEvents();
    this.generateDefaultTextures();
  }

  initCanvas() {
    const ctx = this.ctx;
    ctx.fillStyle = '#888888';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.noise(0.3);
    this.saveHistory();
  }

  bindEvents() {
    const c = this.canvas;
    c.addEventListener('mousedown', e => { this.painting = true; this.paint(e); });
    c.addEventListener('mousemove', e => { if (this.painting) this.paint(e); });
    c.addEventListener('mouseup', () => { this.painting = false; this.saveHistory(); });
    c.addEventListener('mouseleave', () => { this.painting = false; });
    // Touch support
    c.addEventListener('touchstart', e => { e.preventDefault(); this.painting = true; this.paintTouch(e); });
    c.addEventListener('touchmove', e => { e.preventDefault(); if(this.painting) this.paintTouch(e); });
    c.addEventListener('touchend', () => { this.painting = false; this.saveHistory(); });
  }

  getPos(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }

  paintTouch(e) {
    const touch = e.touches[0];
    this.paint({ clientX: touch.clientX, clientY: touch.clientY });
  }

  paint(e) {
    const pos = this.getPos(e);
    const ctx = this.ctx;
    const s = this.brushSize;

    switch (this.tool) {
      case 'brush':
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = this.color;
        ctx.lineWidth = s;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(this.lastX, this.lastY);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        break;
      case 'erase':
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
        ctx.lineWidth = s * 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(this.lastX, this.lastY);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        ctx.globalCompositeOperation = 'source-over';
        break;
      case 'fill':
        this.floodFill(Math.floor(pos.x), Math.floor(pos.y), this.color);
        break;
      case 'noise':
        this.noiseBrush(pos.x, pos.y, s);
        break;
      case 'pattern':
        this.patternBrush(pos.x, pos.y, s);
        break;
    }
    this.lastX = pos.x;
    this.lastY = pos.y;
  }

  noiseBrush(x, y, s) {
    const ctx = this.ctx;
    for (let i = 0; i < s * 5; i++) {
      const rx = x + (Math.random()-0.5)*s*2;
      const ry = y + (Math.random()-0.5)*s*2;
      const r = Math.floor(Math.random()*256);
      const g = Math.floor(Math.random()*256);
      const b = Math.floor(Math.random()*256);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(rx, ry, 2, 2);
    }
  }

  patternBrush(x, y, s) {
    const ctx = this.ctx;
    const gridSize = Math.max(4, s);
    const gx = Math.floor(x / gridSize) * gridSize;
    const gy = Math.floor(y / gridSize) * gridSize;
    const h = this.hexToHsl(this.color);
    for (let dx = -3; dx <= 3; dx++) {
      for (let dy = -3; dy <= 3; dy++) {
        const r = Math.sqrt(dx*dx+dy*dy);
        if (r <= 3) {
          const lum = 30 + Math.random() * 40;
          ctx.fillStyle = `hsl(${h.h},${h.s}%,${lum}%)`;
          ctx.fillRect(gx + dx*gridSize, gy + dy*gridSize, gridSize-1, gridSize-1);
        }
      }
    }
  }

  hexToHsl(hex) {
    let r = parseInt(hex.slice(1,3),16)/255;
    let g = parseInt(hex.slice(3,5),16)/255;
    let b = parseInt(hex.slice(5,7),16)/255;
    const max = Math.max(r,g,b), min = Math.min(r,g,b);
    let h,s, l=(max+min)/2;
    if (max===min) { h=s=0; }
    else {
      const d = max-min;
      s = l>0.5 ? d/(2-max-min) : d/(max+min);
      h = max===r ? (g-b)/d+(g<b?6:0) : max===g ? (b-r)/d+2 : (r-g)/d+4;
      h = Math.round(h*60);
    }
    return { h, s: Math.round(s*100), l: Math.round(l*100) };
  }

  floodFill(startX, startY, fillColor) {
    const ctx = this.ctx;
    const w = this.canvas.width, h = this.canvas.height;
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;
    const idx = (startY * w + startX) * 4;
    const targetR = data[idx], targetG = data[idx+1], targetB = data[idx+2];

    const fill = this.hexToRgb(fillColor);
    if (targetR === fill.r && targetG === fill.g && targetB === fill.b) return;

    const stack = [[startX, startY]];
    const visited = new Uint8Array(w * h);

    const match = (i) => {
      return Math.abs(data[i]-targetR) < 30 &&
             Math.abs(data[i+1]-targetG) < 30 &&
             Math.abs(data[i+2]-targetB) < 30;
    };

    let cnt = 0;
    while (stack.length && cnt < 50000) {
      const [cx, cy] = stack.pop();
      if (cx < 0 || cx >= w || cy < 0 || cy >= h) continue;
      const pi = cy * w + cx;
      if (visited[pi]) continue;
      const di = pi * 4;
      if (!match(di)) continue;
      visited[pi] = 1;
      data[di] = fill.r; data[di+1] = fill.g; data[di+2] = fill.b; data[di+3] = 255;
      stack.push([cx+1,cy],[cx-1,cy],[cx,cy+1],[cx,cy-1]);
      cnt++;
    }
    ctx.putImageData(imgData, 0, 0);
  }

  hexToRgb(hex) {
    return {
      r: parseInt(hex.slice(1,3),16),
      g: parseInt(hex.slice(3,5),16),
      b: parseInt(hex.slice(5,7),16)
    };
  }

  noise(intensity = 0.5) {
    const ctx = this.ctx;
    const w = this.canvas.width, h = this.canvas.height;
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const n = (Math.random() * 2 - 1) * intensity * 255;
      data[i] = Math.max(0, Math.min(255, data[i] + n));
      data[i+1] = Math.max(0, Math.min(255, data[i+1] + n));
      data[i+2] = Math.max(0, Math.min(255, data[i+2] + n));
    }
    ctx.putImageData(imgData, 0, 0);
  }

  generateTexture(type) {
    const ctx = this.ctx;
    const w = this.canvas.width, h = this.canvas.height;
    ctx.clearRect(0, 0, w, h);

    const types = {
      rock: () => {
        ctx.fillStyle = '#5a5a5a';
        ctx.fillRect(0, 0, w, h);
        for (let i = 0; i < 5000; i++) {
          const x = Math.random()*w, y = Math.random()*h;
          const v = 80 + Math.random()*80;
          ctx.fillStyle = `rgb(${v},${v-5},${v-10})`;
          ctx.fillRect(x, y, Math.random()*6, Math.random()*6);
        }
        this.noise(0.2);
      },
      grass: () => {
        ctx.fillStyle = '#3a7a2a';
        ctx.fillRect(0, 0, w, h);
        for (let i = 0; i < 3000; i++) {
          const x = Math.random()*w, y = Math.random()*h;
          const g = 80 + Math.random()*100;
          ctx.fillStyle = `rgb(${20+Math.floor(Math.random()*30)},${g},${20+Math.floor(Math.random()*20)})`;
          ctx.fillRect(x, y, 2, 5+Math.random()*10);
        }
        this.noise(0.1);
      },
      metal: () => {
        const grad = ctx.createLinearGradient(0, 0, w, h);
        grad.addColorStop(0, '#888');
        grad.addColorStop(0.3, '#ccc');
        grad.addColorStop(0.6, '#999');
        grad.addColorStop(1, '#aaa');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
        for (let i = 0; i < w; i += 8) {
          ctx.strokeStyle = 'rgba(255,255,255,0.05)';
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,h); ctx.stroke();
        }
        this.noise(0.05);
      },
      wood: () => {
        for (let y = 0; y < h; y++) {
          const v = 120 + 30 * Math.sin(y * 0.1 + Math.sin(y*0.03)*3);
          ctx.fillStyle = `rgb(${Math.floor(v)},${Math.floor(v*0.6)},${Math.floor(v*0.3)})`;
          ctx.fillRect(0, y, w, 1);
        }
        for (let i = 0; i < 2000; i++) {
          const x = Math.random()*w, y = Math.random()*h;
          ctx.fillStyle = `rgba(0,0,0,${Math.random()*0.1})`;
          ctx.fillRect(x, y, Math.random()*20, 1);
        }
        this.noise(0.05);
      },
      dirt: () => {
        ctx.fillStyle = '#7a5a3a';
        ctx.fillRect(0, 0, w, h);
        for (let i = 0; i < 8000; i++) {
          const x = Math.random()*w, y = Math.random()*h;
          const v = 80+Math.random()*60;
          ctx.fillStyle = `rgb(${v},${Math.floor(v*0.7)},${Math.floor(v*0.4)})`;
          ctx.fillRect(x, y, Math.random()*4, Math.random()*4);
        }
        this.noise(0.15);
      },
      fire: () => {
        for (let y = h; y >= 0; y--) {
          const t = 1 - y/h;
          const r = Math.floor(255 * Math.min(1, t * 2));
          const g = Math.floor(255 * Math.max(0, t * 2 - 1) * 0.8);
          const b = 0;
          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.fillRect(0, y, w, 1);
        }
        for (let i = 0; i < 3000; i++) {
          const x = Math.random()*w, y = h - Math.random()*h;
          ctx.fillStyle = `rgba(255,${Math.floor(Math.random()*200)},0,${Math.random()*0.5})`;
          ctx.beginPath();
          ctx.arc(x, y, Math.random()*5, 0, Math.PI*2);
          ctx.fill();
        }
      },
      water: () => {
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const v = 0.5 + 0.5*Math.sin(x*0.05 + y*0.03);
            const b = Math.floor(180 + v*75);
            ctx.fillStyle = `rgb(${Math.floor(v*30)},${Math.floor(100+v*80)},${b})`;
            ctx.fillRect(x, y, 1, 1);
          }
        }
        this.noise(0.05);
      },
      checkerboard: () => {
        const s = 32;
        for (let y = 0; y < h; y += s) {
          for (let x = 0; x < w; x += s) {
            ctx.fillStyle = ((x/s + y/s) % 2 === 0) ? '#fff' : '#222';
            ctx.fillRect(x, y, s, s);
          }
        }
      }
    };

    if (types[type]) {
      types[type]();
    } else {
      // AI-like procedural generation based on prompt
      this.proceduralGenerate(type);
    }
    this.saveHistory();
    this.addToLibrary();
  }

  proceduralGenerate(prompt) {
    const ctx = this.ctx;
    const w = this.canvas.width, h = this.canvas.height;
    // Hash prompt to seed colors
    let hash = 0;
    for (let i = 0; i < prompt.length; i++) {
      hash = ((hash << 5) - hash) + prompt.charCodeAt(i);
      hash |= 0;
    }
    const hue = Math.abs(hash) % 360;
    ctx.fillStyle = `hsl(${hue},40%,40%)`;
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < 6000; i++) {
      const x = Math.random()*w, y = Math.random()*h;
      const v = 30 + Math.random()*50;
      ctx.fillStyle = `hsl(${(hue + Math.random()*60-30) % 360},${40+Math.random()*40}%,${v}%)`;
      ctx.fillRect(x, y, Math.random()*8, Math.random()*8);
    }
    this.noise(0.2);
  }

  saveHistory() {
    const dataURL = this.canvas.toDataURL();
    this.history = this.history.slice(0, this.historyIndex+1);
    this.history.push(dataURL);
    this.historyIndex++;
    if (this.history.length > 30) {
      this.history.shift();
      this.historyIndex--;
    }
  }

  undo() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.loadFromURL(this.history[this.historyIndex]);
    }
  }

  redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.loadFromURL(this.history[this.historyIndex]);
    }
  }

  loadFromURL(url) {
    const img = new Image();
    img.onload = () => { this.ctx.drawImage(img, 0, 0); };
    img.src = url;
  }

  addToLibrary() {
    const grid = document.getElementById('texLibGrid');
    if (!grid) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'tex-lib-item';
    const miniCanvas = document.createElement('canvas');
    miniCanvas.width = 64; miniCanvas.height = 64;
    const miniCtx = miniCanvas.getContext('2d');
    miniCtx.drawImage(this.canvas, 0, 0, 64, 64);
    wrapper.appendChild(miniCanvas);
    wrapper.addEventListener('click', () => {
      this.ctx.drawImage(miniCanvas, 0, 0, this.canvas.width, this.canvas.height);
    });
    grid.prepend(wrapper);
    this.textures.push(this.canvas.toDataURL());
  }

  generateDefaultTextures() {
    const types = ['rock', 'grass', 'metal', 'wood', 'dirt', 'water', 'checkerboard', 'fire'];
    types.forEach((t, i) => {
      setTimeout(() => {
        const tmpCanvas = document.createElement('canvas');
        tmpCanvas.width = 64; tmpCanvas.height = 64;
        const tmpCtx = tmpCanvas.getContext('2d');
        const editor = new NexusTextureEditor(tmpCanvas);
        editor.generateTexture(t);
        const grid = document.getElementById('texLibGrid');
        if (!grid) return;
        const wrapper = document.createElement('div');
        wrapper.className = 'tex-lib-item';
        wrapper.title = t;
        wrapper.appendChild(tmpCanvas);
        wrapper.addEventListener('click', () => {
          this.generateTexture(t);
        });
        grid.appendChild(wrapper);
      }, i * 50);
    });
  }

  clear() {
    const ctx = this.ctx;
    ctx.fillStyle = '#888';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.saveHistory();
  }

  exportPNG() {
    const link = document.createElement('a');
    link.download = 'texture_' + Date.now() + '.png';
    link.href = this.canvas.toDataURL('image/png');
    link.click();
  }
}

window.NexusTextureEditor = NexusTextureEditor;
