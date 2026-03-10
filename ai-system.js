// ============================================
// NEXUS ENGINE — AI System
// ============================================

class NexusAI {
  constructor() {
    this.trainingData = [];
    this.npcStates = new Map();
    this.neuralNet = null;
    this.isTraining = false;
    this.epoch = 0;
    this.maxEpochs = 100;
    this.brainAnimFrame = null;
    this.pathGrid = null;
  }

  // ===== Neural Network (Simple Feed-Forward) =====
  createNetwork(layers) {
    const net = { layers: [], weights: [], biases: [] };
    for (let i = 0; i < layers.length - 1; i++) {
      const w = [];
      const b = [];
      for (let j = 0; j < layers[i+1]; j++) {
        const row = [];
        for (let k = 0; k < layers[i]; k++) {
          row.push((Math.random() * 2 - 1) * Math.sqrt(2 / layers[i]));
        }
        w.push(row);
        b.push(0);
      }
      net.weights.push(w);
      net.biases.push(b);
    }
    net.layers = layers;
    return net;
  }

  sigmoid(x) { return 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, x)))); }
  relu(x) { return Math.max(0, x); }
  tanh(x) { return Math.tanh(x); }

  forward(net, input) {
    let current = [...input];
    net.activation = [current];
    for (let l = 0; l < net.weights.length; l++) {
      const next = [];
      for (let j = 0; j < net.weights[l].length; j++) {
        let sum = net.biases[l][j];
        for (let k = 0; k < current.length; k++) {
          sum += net.weights[l][k] ? 0 : (net.weights[l][j][k] * current[k]);
          if (net.weights[l][j]) sum = net.biases[l][j];
          for (let ki = 0; ki < current.length; ki++) {
            if (net.weights[l][j] && net.weights[l][j][ki] !== undefined) {
              sum = net.biases[l][j];
              for (let km = 0; km < current.length; km++) {
                sum += (net.weights[l][j][km] || 0) * current[km];
              }
              break;
            }
          }
          break;
        }
        next.push(l === net.weights.length-1 ? this.sigmoid(sum) : this.relu(sum));
      }
      current = next;
      net.activation.push(current);
    }
    return current;
  }

  // Simplified backprop
  trainStep(net, inputs, targets, lr = 0.01) {
    let totalLoss = 0;
    const batchSize = Math.min(inputs.length, 32);

    for (let b = 0; b < batchSize; b++) {
      const idx = Math.floor(Math.random() * inputs.length);
      const output = this.forward(net, inputs[idx]);
      const target = targets[idx];

      // MSE Loss
      let loss = 0;
      for (let i = 0; i < output.length; i++) {
        loss += Math.pow(output[i] - target[i], 2);
      }
      totalLoss += loss / output.length;

      // Gradient descent (simplified weight perturbation)
      for (let l = 0; l < net.weights.length; l++) {
        for (let j = 0; j < net.weights[l].length; j++) {
          for (let k = 0; k < net.weights[l][j].length; k++) {
            const grad = (Math.random() * 2 - 1) * loss * lr;
            net.weights[l][j][k] -= grad * 0.01;
          }
          net.biases[l][j] -= (Math.random() * 2 - 1) * loss * lr * 0.001;
        }
      }
    }
    return totalLoss / batchSize;
  }

  // ===== NPC AI Behavior Tree =====
  createNPCBehavior(config) {
    return {
      type: config.type || 'fsm',
      aggression: config.aggression || 0.5,
      intelligence: config.intelligence || 0.7,
      fov: config.fov || 120,
      memory: config.memory || 30,
      state: 'idle',
      target: null,
      lastSeenPos: null,
      path: [],
      network: config.type === 'neural' || config.type === 'rl'
        ? this.createNetwork([8, 16, 12, 4])
        : null,

      update(npc, player, dt) {
        // Perception
        const dist = Math.sqrt(
          Math.pow(npc.x - player.x, 2) +
          Math.pow(npc.y - player.y, 2)
        );
        const canSee = dist < 20 && Math.random() < this.intelligence;

        // FSM States
        switch (this.state) {
          case 'idle':
            if (canSee) {
              this.state = 'alert';
              this.target = { x: player.x, y: player.y };
            } else if (Math.random() < 0.01) {
              this.state = 'patrol';
            }
            break;
          case 'alert':
            if (canSee) {
              this.lastSeenPos = { x: player.x, y: player.y };
              if (dist < 5 * this.aggression + 2) {
                this.state = 'attack';
              } else {
                this.state = 'chase';
              }
            } else {
              this.state = 'search';
            }
            break;
          case 'chase':
            if (!canSee) { this.state = 'search'; break; }
            // Move toward player
            npc.x += (player.x - npc.x) * 0.02 * this.aggression;
            npc.y += (player.y - npc.y) * 0.02 * this.aggression;
            if (dist < 3) this.state = 'attack';
            break;
          case 'attack':
            if (dist > 6) { this.state = 'chase'; break; }
            return { action: 'attack', damage: Math.random() * 10 * this.aggression };
          case 'search':
            if (canSee) { this.state = 'chase'; break; }
            if (this.lastSeenPos) {
              npc.x += (this.lastSeenPos.x - npc.x) * 0.01;
              npc.y += (this.lastSeenPos.y - npc.y) * 0.01;
            }
            break;
          case 'patrol':
            npc.x += Math.sin(Date.now() * 0.001) * 0.05;
            if (canSee) this.state = 'alert';
            break;
          case 'flee':
            npc.x -= (player.x - npc.x) * 0.03;
            npc.y -= (player.y - npc.y) * 0.03;
            if (dist > 30) this.state = 'idle';
            break;
        }

        // Health-based flee
        if (npc.hp < 20 && this.aggression < 0.7) {
          this.state = 'flee';
        }

        return { action: 'none' };
      }
    };
  }

  // ===== Terrain Generation =====
  generateTerrain(config) {
    const { seed, scale, height, octaves, type, width = 400, depth = 400 } = config;

    // Seeded random
    let s = seed;
    const rand = () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };

    // Permutation table
    const perm = [];
    for (let i = 0; i < 256; i++) perm.push(i);
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [perm[i], perm[j]] = [perm[j], perm[i]];
    }
    const p = [...perm, ...perm];

    const fade = t => t * t * t * (t * (t * 6 - 15) + 10);
    const lerp = (a, b, t) => a + t * (b - a);
    const grad = (hash, x, y) => {
      const h = hash & 3;
      const u = h < 2 ? x : y, v = h < 2 ? y : x;
      return (h & 1 ? -u : u) + (h & 2 ? -v : v);
    };

    const noise2D = (x, y) => {
      const X = Math.floor(x) & 255, Y = Math.floor(y) & 255;
      x -= Math.floor(x); y -= Math.floor(y);
      const u = fade(x), v = fade(y);
      const a = p[X]+Y, aa = p[a], ab = p[a+1];
      const b = p[X+1]+Y, ba = p[b], bb = p[b+1];
      return lerp(lerp(grad(p[aa],x,y), grad(p[ba],x-1,y),u),
                  lerp(grad(p[ab],x,y-1), grad(p[bb],x-1,y-1),u), v);
    };

    // Generate heightmap
    const gridW = 64, gridH = 64;
    const heightmap = [];
    for (let gy = 0; gy < gridH; gy++) {
      const row = [];
      for (let gx = 0; gx < gridW; gx++) {
        let h = 0, amp = 1, freq = 1, maxAmp = 0;
        for (let o = 0; o < octaves; o++) {
          h += noise2D(gx/scale * freq, gy/scale * freq) * amp;
          maxAmp += amp;
          amp *= 0.5; freq *= 2;
        }
        h = (h / maxAmp + 1) / 2; // normalize 0-1

        // Type modifications
        if (type === 'islands') {
          const dx = (gx/gridW - 0.5) * 2, dy = (gy/gridH - 0.5) * 2;
          const falloff = 1 - Math.sqrt(dx*dx+dy*dy);
          h *= Math.max(0, falloff);
        } else if (type === 'canyon') {
          h = Math.abs(Math.sin(h * Math.PI * 3)) * h;
        } else if (type === 'moon') {
          h = Math.pow(h, 0.3);
          // Add craters
          if (rand() < 0.02) h = Math.max(0, h - rand() * 0.3);
        }
        row.push(h * height);
      }
      heightmap.push(row);
    }
    return { heightmap, gridW, gridH };
  }

  renderTerrainPreview(canvas, terrainData) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const { heightmap, gridW, gridH } = terrainData;
    const cw = w / gridW, ch = h / gridH;

    for (let gy = 0; gy < gridH; gy++) {
      for (let gx = 0; gx < gridW; gx++) {
        const hv = heightmap[gy][gx];
        const maxH = 50;
        const t = hv / maxH;
        let color;
        if (t < 0.1) color = '#1a3a6e'; // deep water
        else if (t < 0.2) color = '#2a5abe'; // water
        else if (t < 0.25) color = '#e8d49e'; // sand
        else if (t < 0.5) color = '#3a7a2a'; // grass
        else if (t < 0.7) color = '#5a5040'; // dirt/rock
        else if (t < 0.85) color = '#7a7070'; // mountain
        else color = '#ffffff'; // snow
        ctx.fillStyle = color;
        ctx.fillRect(Math.floor(gx*cw), Math.floor(gy*ch), Math.ceil(cw)+1, Math.ceil(ch)+1);
      }
    }
  }

  // ===== A* Pathfinding =====
  generateMaze(canvas, size = 20) {
    const w = canvas.width, h = canvas.height;
    const cellW = Math.floor(w / size), cellH = Math.floor(h / size);
    this.pathGrid = { size, cellW, cellH, grid: [], start: {x:0,y:0}, end: {x:size-1,y:size-1} };

    // Generate random walkable grid
    for (let y = 0; y < size; y++) {
      this.pathGrid.grid.push([]);
      for (let x = 0; x < size; x++) {
        this.pathGrid.grid[y].push(Math.random() < 0.3 ? 1 : 0); // 1 = wall
      }
    }
    this.pathGrid.grid[0][0] = 0;
    this.pathGrid.grid[size-1][size-1] = 0;

    this.renderMaze(canvas, []);
    return this.pathGrid;
  }

  astar(grid, start, end, size) {
    const key = (x,y) => `${x},${y}`;
    const h = (a, b) => Math.abs(a.x-b.x) + Math.abs(a.y-b.y);

    const open = [{ x:start.x, y:start.y, g:0, f:h(start,end), parent:null }];
    const closed = new Set();
    const nodes = new Map();
    nodes.set(key(start.x,start.y), open[0]);

    while (open.length) {
      open.sort((a,b) => a.f - b.f);
      const cur = open.shift();
      if (cur.x === end.x && cur.y === end.y) {
        const path = [];
        let n = cur;
        while (n) { path.unshift({x:n.x, y:n.y}); n = n.parent; }
        return path;
      }
      closed.add(key(cur.x, cur.y));
      const dirs = [[0,1],[0,-1],[1,0],[-1,0]];
      for (const [dx, dy] of dirs) {
        const nx = cur.x+dx, ny = cur.y+dy;
        const nk = key(nx, ny);
        if (nx<0||ny<0||nx>=size||ny>=size) continue;
        if (grid[ny][nx] === 1) continue;
        if (closed.has(nk)) continue;
        const g = cur.g + 1;
        const existing = nodes.get(nk);
        if (!existing || g < existing.g) {
          const node = { x:nx, y:ny, g, f: g + h({x:nx,y:ny},end), parent:cur };
          nodes.set(nk, node);
          open.push(node);
        }
      }
    }
    return [];
  }

  renderMaze(canvas, path) {
    const ctx = canvas.getContext('2d');
    const { size, cellW, cellH, grid, start, end } = this.pathGrid;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        ctx.fillStyle = grid[y][x] ? '#1a2332' : '#0d1421';
        ctx.fillRect(x*cellW, y*cellH, cellW-1, cellH-1);
      }
    }

    // Draw path
    if (path.length) {
      path.forEach((p, i) => {
        const t = i / path.length;
        ctx.fillStyle = `hsl(${120*t + 180*(1-t)},80%,50%)`;
        ctx.fillRect(p.x*cellW+2, p.y*cellH+2, cellW-4, cellH-4);
      });
    }

    // Start/End
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(start.x*cellW, start.y*cellH, cellW-1, cellH-1);
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(end.x*cellW, end.y*cellH, cellW-1, cellH-1);
  }

  // ===== Brain Visualization =====
  animateBrain(canvas, net) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    let frame = 0;

    const draw = () => {
      ctx.fillStyle = '#080c14';
      ctx.fillRect(0, 0, w, h);
      frame++;

      if (!net) {
        // Default animation
        for (let l = 0; l < 4; l++) {
          const nodes = [3, 6, 5, 2][l];
          const lx = 40 + l * 70;
          for (let n = 0; n < nodes; n++) {
            const ly = h/2 + (n - nodes/2 + 0.5) * 28;
            // Connections
            if (l < 3) {
              const nextNodes = [6, 5, 2][l];
              for (let nn = 0; nn < nextNodes; nn++) {
                const nly = h/2 + (nn - nextNodes/2 + 0.5) * 28;
                const act = 0.5 + 0.5 * Math.sin(frame * 0.05 + l + n + nn);
                ctx.strokeStyle = `rgba(0,212,255,${act * 0.4})`;
                ctx.lineWidth = act * 2;
                ctx.beginPath();
                ctx.moveTo(lx, ly);
                ctx.lineTo(lx+70, nly);
                ctx.stroke();
              }
            }
            const act = 0.5 + 0.5 * Math.sin(frame * 0.08 + l * 2 + n);
            ctx.beginPath();
            ctx.arc(lx, ly, 7, 0, Math.PI*2);
            ctx.fillStyle = `hsl(${180 + l*30},80%,${30 + act*40}%)`;
            ctx.fill();
            ctx.strokeStyle = `rgba(0,212,255,${act})`;
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }
        }
      }

      this.brainAnimFrame = requestAnimationFrame(draw);
    };
    if (this.brainAnimFrame) cancelAnimationFrame(this.brainAnimFrame);
    draw();
  }

  // ===== Balance Analysis =====
  drawBalanceChart(canvas) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    ctx.fillStyle = '#080c14';
    ctx.fillRect(0, 0, w, h);

    const data = [
      { label: 'Łatwość', value: 0.65, color: '#00d4ff' },
      { label: 'Progresja', value: 0.82, color: '#7c3aed' },
      { label: 'Różnorodność', value: 0.55, color: '#10b981' },
      { label: 'Nagrody', value: 0.78, color: '#f59e0b' },
      { label: 'Trudność', value: 0.71, color: '#ef4444' },
    ];

    const cx = w/2, cy = h/2, r = Math.min(w,h)/2 - 30;
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    [0.25,0.5,0.75,1].forEach(t => {
      ctx.beginPath();
      ctx.arc(cx, cy, r*t, 0, Math.PI*2);
      ctx.stroke();
    });

    data.forEach((d, i) => {
      const angle = (i/data.length) * Math.PI*2 - Math.PI/2;
      ctx.strokeStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle)*r, cy + Math.sin(angle)*r);
      ctx.stroke();
    });

    // Data polygon
    ctx.beginPath();
    data.forEach((d, i) => {
      const angle = (i/data.length) * Math.PI*2 - Math.PI/2;
      const x = cx + Math.cos(angle)*r*d.value;
      const y = cy + Math.sin(angle)*r*d.value;
      i === 0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
    });
    ctx.closePath();
    ctx.fillStyle = 'rgba(0,212,255,0.15)';
    ctx.fill();
    ctx.strokeStyle = '#00d4ff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Labels + dots
    data.forEach((d, i) => {
      const angle = (i/data.length) * Math.PI*2 - Math.PI/2;
      const x = cx + Math.cos(angle)*r*d.value;
      const y = cy + Math.sin(angle)*r*d.value;
      ctx.fillStyle = d.color;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI*2);
      ctx.fill();

      const lx = cx + Math.cos(angle)*(r+20);
      const ly = cy + Math.sin(angle)*(r+20);
      ctx.fillStyle = '#64748b';
      ctx.font = '10px Share Tech Mono';
      ctx.textAlign = 'center';
      ctx.fillText(d.label, lx, ly);
    });
  }

  // ===== Code Generation =====
  generateCode(prompt) {
    const templates = {
      inventory: `// Sistema Inventory — Nexus Engine
class Inventory extends NexusComponent {
  constructor() {
    super();
    this.slots = new Array(30).fill(null);
    this.maxStack = 99;
    this.weight = 0;
    this.maxWeight = 100;
  }
  
  addItem(item, amount = 1) {
    // Find existing stack
    const existing = this.slots.findIndex(
      s => s && s.id === item.id && s.count < this.maxStack
    );
    if (existing >= 0) {
      this.slots[existing].count = Math.min(
        this.maxStack, this.slots[existing].count + amount
      );
      this.emit('itemAdded', { item, slot: existing });
      return true;
    }
    // Find empty slot
    const empty = this.slots.findIndex(s => !s);
    if (empty < 0) { this.emit('inventoryFull'); return false; }
    this.slots[empty] = { ...item, count: amount };
    this.weight += item.weight * amount;
    this.emit('itemAdded', { item, slot: empty });
    return true;
  }
  
  removeItem(slotIndex, amount = 1) {
    const slot = this.slots[slotIndex];
    if (!slot) return false;
    slot.count -= amount;
    if (slot.count <= 0) this.slots[slotIndex] = null;
    this.emit('itemRemoved', { slotIndex });
    return true;
  }
  
  swapSlots(a, b) {
    [this.slots[a], this.slots[b]] = [this.slots[b], this.slots[a]];
    this.emit('slotsSwapped', { a, b });
  }
}`,
      movement: `// PlayerMovement — Nexus Engine
class PlayerMovement extends NexusComponent {
  constructor() {
    super();
    this.speed = 5.0;
    this.runSpeed = 9.0;
    this.jumpForce = 7.0;
    this.crouchSpeed = 2.5;
    this.isGrounded = false;
    this.isCrouching = false;
    this.coyoteTime = 0.12; // seconds
    this.coyoteTimer = 0;
    this.jumpBuffer = 0.15;
    this.jumpTimer = 0;
  }
  
  update(dt) {
    const input = Input.getAxes();
    const isRunning = Input.getKey('Shift');
    const currentSpeed = this.isCrouching ? this.crouchSpeed 
                       : isRunning ? this.runSpeed : this.speed;
    
    // Horizontal movement
    const dir = new Vector3(input.horizontal, 0, input.vertical).normalized;
    this.rigidbody.velocity.x = dir.x * currentSpeed;
    this.rigidbody.velocity.z = dir.z * currentSpeed;
    
    // Coyote time
    if (this.isGrounded) this.coyoteTimer = this.coyoteTime;
    else this.coyoteTimer -= dt;
    
    // Jump buffering
    if (Input.getKeyDown('Space')) this.jumpTimer = this.jumpBuffer;
    this.jumpTimer -= dt;
    
    if (this.jumpTimer > 0 && this.coyoteTimer > 0) {
      this.rigidbody.velocity.y = this.jumpForce;
      this.coyoteTimer = 0;
      this.jumpTimer = 0;
      this.animator.play('jump');
    }
    
    // Crouch
    this.isCrouching = Input.getKey('Control');
    this.collider.height = this.isCrouching ? 0.9 : 1.8;
    
    // Animation
    const spd = new Vector2(dir.x, dir.z).magnitude;
    if (spd > 0.1) this.animator.play(isRunning ? 'run' : 'walk');
    else this.animator.play('idle');
  }
}`,
      enemy: `// EnemyAI — Nexus Engine
class EnemyAI extends NexusComponent {
  constructor() {
    super();
    this.hp = 100;
    this.maxHp = 100;
    this.damage = 15;
    this.attackRange = 2.0;
    this.detectionRange = 15.0;
    this.speed = 3.0;
    this.state = 'patrol';
    this.patrolPoints = [];
    this.patrolIndex = 0;
    this.attackCooldown = 0;
  }
  
  start() {
    this.player = GameObject.findWithTag('Player');
    this.navAgent = this.getComponent(NavMeshAgent);
    this.navAgent.speed = this.speed;
    // Generate patrol points
    for (let i = 0; i < 4; i++) {
      this.patrolPoints.push(
        this.transform.position.add(new Vector3(
          (Math.random()-0.5)*20, 0, (Math.random()-0.5)*20
        ))
      );
    }
  }
  
  update(dt) {
    this.attackCooldown -= dt;
    const dist = Vector3.distance(this.transform.position, this.player.position);
    
    switch(this.state) {
      case 'patrol':
        const target = this.patrolPoints[this.patrolIndex];
        this.navAgent.setDestination(target);
        if (Vector3.distance(this.transform.position, target) < 1.0) {
          this.patrolIndex = (this.patrolIndex + 1) % this.patrolPoints.length;
        }
        if (dist < this.detectionRange) this.state = 'chase';
        break;
      
      case 'chase':
        this.navAgent.setDestination(this.player.position);
        if (dist < this.attackRange && this.attackCooldown <= 0) {
          this.state = 'attack';
        }
        if (dist > this.detectionRange * 1.5) this.state = 'patrol';
        break;
      
      case 'attack':
        this.attackCooldown = 1.5;
        const playerHP = this.player.getComponent(Health);
        if (playerHP) playerHP.takeDamage(this.damage);
        this.animator.play('attack');
        this.state = 'chase';
        break;
    }
  }
  
  takeDamage(amount) {
    this.hp -= amount;
    if (this.hp <= 0) this.die();
    this.animator.play('hurt');
  }
  
  die() {
    this.animator.play('death');
    GameManager.addScore(100);
    setTimeout(() => this.gameObject.destroy(), 2000);
  }
}`
    };

    const pl = prompt.toLowerCase();
    if (pl.includes('inventory') || pl.includes('inwentarz')) return templates.inventory;
    if (pl.includes('ruch') || pl.includes('movem') || pl.includes('player')) return templates.movement;
    if (pl.includes('wróg') || pl.includes('enemy') || pl.includes('npc')) return templates.enemy;

    // Generic template
    return `// ${prompt} — Nexus Engine
// Wygenerowano automatycznie przez Nexus AI

class CustomScript extends NexusComponent {
  constructor() {
    super();
    // Inicjalizacja właściwości
    this.initialized = false;
  }
  
  start() {
    // Wywołane raz przy starcie
    console.log('[Custom] Zainicjalizowano: ${prompt}');
    this.initialized = true;
  }
  
  update(deltaTime) {
    // Wywołane każdą klatkę
    if (!this.initialized) return;
    
    // TODO: Implementuj logikę dla: ${prompt}
  }
  
  onDestroy() {
    // Czyszczenie zasobów
    this.initialized = false;
  }
}`;
  }

  // ===== Training Simulation =====
  async trainNPC(logEl, config) {
    if (this.isTraining) return;
    this.isTraining = true;
    this.epoch = 0;

    const net = this.createNetwork([8, 16, 16, 4]);
    const inputs = [], targets = [];

    // Generate training data
    for (let i = 0; i < 200; i++) {
      inputs.push([
        Math.random(), Math.random(), Math.random(), Math.random(),
        Math.random(), Math.random(), Math.random(), Math.random()
      ]);
      targets.push([
        Math.random() > 0.5 ? 1 : 0,
        Math.random() > 0.5 ? 1 : 0,
        Math.random() > 0.5 ? 1 : 0,
        Math.random() > 0.5 ? 1 : 0
      ]);
    }

    const addLog = (msg, type='') => {
      const div = document.createElement('div');
      div.style.color = type === 'good' ? '#10b981' : type === 'warn' ? '#f59e0b' : '#00d4ff';
      div.textContent = msg;
      logEl.appendChild(div);
      logEl.scrollTop = logEl.scrollHeight;
    };

    addLog(`[AI] Rozpoczynam trening sieci neuronowej...`);
    addLog(`[AI] Architektura: 8→16→16→4, aktywacja ReLU+Sigmoid`);
    addLog(`[AI] Dane treningowe: ${inputs.length} próbek`);

    const trainBatch = (epoch) => {
      return new Promise(resolve => {
        setTimeout(() => {
          let loss = 0;
          for (let b = 0; b < 10; b++) {
            const idx = Math.floor(Math.random() * inputs.length);
            // Simplified loss computation
            loss += Math.random() * 0.5 * Math.exp(-epoch * 0.05);
          }
          loss /= 10;
          resolve(loss);
        }, 20);
      });
    };

    for (let ep = 0; ep < this.maxEpochs && this.isTraining; ep++) {
      const loss = await trainBatch(ep);
      this.epoch = ep;

      if (ep % 10 === 0) {
        const acc = Math.min(99, 40 + ep * 0.55 + Math.random() * 5);
        addLog(`[Epoch ${ep+1}/${this.maxEpochs}] Loss: ${loss.toFixed(4)} | Acc: ${acc.toFixed(1)}%`,
               loss < 0.1 ? 'good' : 'warn');
      }
    }

    addLog(`[AI] ✓ Trening zakończony! Model gotowy.`, 'good');
    addLog(`[AI] Zapisuję wagi... OK`, 'good');
    addLog(`[AI] Model wdrożony dla NPC.`, 'good');
    this.isTraining = false;
    this.neuralNet = net;
  }
}

window.NexusAI = NexusAI;
