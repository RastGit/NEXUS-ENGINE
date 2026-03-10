// ============================================
// NEXUS ENGINE — Core 3D Renderer (WebGL)
// ============================================

class NexusRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = null;
    this.mode = 'normal';
    this.scene = { objects: [], lights: [], camera: null };
    this.programs = {};
    this.buffers = {};
    this.textures = {};
    this.frameCount = 0;
    this.lastTime = 0;
    this.fps = 60;
    this.gridEnabled = true;
    this.wireframe = false;
    this.shadowsEnabled = true;
    this.init();
  }

  init() {
    this.gl = this.canvas.getContext('webgl2') || this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
    if (!this.gl) {
      console.warn('[Nexus] WebGL not available, using 2D fallback');
      this.ctx2d = this.canvas.getContext('2d');
      this.use2D = true;
      return;
    }
    const gl = this.gl;
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.clearColor(0.05, 0.08, 0.12, 1.0);
    this.compileShaders();
    this.createDefaultBuffers();
    this.camera = { pos: [0, 3, 8], target: [0, 0, 0], fov: 60, near: 0.1, far: 1000 };
    this.resize();
  }

  compileShaders() {
    // Main PBR-lite shader
    this.programs.main = this.createProgram(
      // Vertex
      `#version 100
      attribute vec3 aPos;
      attribute vec3 aNormal;
      attribute vec2 aUV;
      uniform mat4 uMVP;
      uniform mat4 uModel;
      varying vec3 vNormal;
      varying vec2 vUV;
      varying vec3 vWorldPos;
      void main() {
        vNormal = (uModel * vec4(aNormal, 0.0)).xyz;
        vUV = aUV;
        vWorldPos = (uModel * vec4(aPos, 1.0)).xyz;
        gl_Position = uMVP * vec4(aPos, 1.0);
      }`,
      // Fragment
      `precision mediump float;
      varying vec3 vNormal;
      varying vec2 vUV;
      varying vec3 vWorldPos;
      uniform vec3 uColor;
      uniform vec3 uLightDir;
      uniform vec3 uCamPos;
      uniform float uMetalness;
      uniform float uRoughness;
      uniform float uMode; // 0=normal 1=realistic 2=retro 3=ps1
      void main() {
        vec3 N = normalize(vNormal);
        vec3 L = normalize(uLightDir);
        vec3 V = normalize(uCamPos - vWorldPos);
        float diff = max(dot(N, L), 0.0);
        float amb = 0.15;
        vec3 H = normalize(L + V);
        float spec = pow(max(dot(N, H), 0.0), mix(8.0, 64.0, 1.0 - uRoughness));
        
        vec3 color = uColor;
        
        if (uMode < 0.5) { // NORMAL
          color = color * (amb + diff * 0.85) + vec3(spec * 0.4 * uMetalness);
        } else if (uMode < 1.5) { // REALISTIC
          float shadow = diff;
          vec3 ambient = color * 0.1;
          vec3 diffuse = color * shadow * 0.9;
          vec3 specular = mix(vec3(0.04), color, uMetalness) * spec;
          color = ambient + diffuse + specular;
          // Tone mapping
          color = color / (color + vec3(1.0));
          color = pow(color, vec3(1.0/2.2));
        } else if (uMode < 2.5) { // RETRO (pixelated, limited palette)
          color = color * (amb + diff);
          // Quantize to 8 levels
          color = floor(color * 8.0) / 8.0;
        } else { // PS1 (affine texture, vertex lighting, dithering)
          color = color * (amb + diff * 0.7);
          // PS1 color depth reduction
          color = floor(color * 32.0) / 32.0;
          // Slight color wobble (PS1 feel)
          float dither = mod(floor(gl_FragCoord.x) + floor(gl_FragCoord.y), 2.0) * 0.02;
          color += dither;
        }
        
        gl_FragColor = vec4(color, 1.0);
      }`
    );

    // Grid shader
    this.programs.grid = this.createProgram(
      `#version 100
      attribute vec3 aPos;
      uniform mat4 uMVP;
      void main() { gl_Position = uMVP * vec4(aPos, 1.0); }`,
      `precision mediump float;
      uniform vec4 uColor;
      void main() { gl_FragColor = uColor; }`
    );
  }

  createProgram(vsrc, fsrc) {
    const gl = this.gl;
    const vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, vsrc);
    gl.compileShader(vs);
    if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
      console.error('VS error:', gl.getShaderInfoLog(vs));
    }
    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, fsrc);
    gl.compileShader(fs);
    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
      console.error('FS error:', gl.getShaderInfoLog(fs));
    }
    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    return prog;
  }

  createDefaultBuffers() {
    // Cube geometry
    const cubeVerts = new Float32Array([
      // front
      -0.5,-0.5, 0.5,  0,0,1,  0,0,
       0.5,-0.5, 0.5,  0,0,1,  1,0,
       0.5, 0.5, 0.5,  0,0,1,  1,1,
      -0.5, 0.5, 0.5,  0,0,1,  0,1,
      // back
      -0.5,-0.5,-0.5,  0,0,-1, 1,0,
       0.5,-0.5,-0.5,  0,0,-1, 0,0,
       0.5, 0.5,-0.5,  0,0,-1, 0,1,
      -0.5, 0.5,-0.5,  0,0,-1, 1,1,
      // top
      -0.5, 0.5,-0.5,  0,1,0,  0,1,
       0.5, 0.5,-0.5,  0,1,0,  1,1,
       0.5, 0.5, 0.5,  0,1,0,  1,0,
      -0.5, 0.5, 0.5,  0,1,0,  0,0,
      // bottom
      -0.5,-0.5,-0.5,  0,-1,0, 0,0,
       0.5,-0.5,-0.5,  0,-1,0, 1,0,
       0.5,-0.5, 0.5,  0,-1,0, 1,1,
      -0.5,-0.5, 0.5,  0,-1,0, 0,1,
      // right
       0.5,-0.5,-0.5,  1,0,0,  0,0,
       0.5, 0.5,-0.5,  1,0,0,  0,1,
       0.5, 0.5, 0.5,  1,0,0,  1,1,
       0.5,-0.5, 0.5,  1,0,0,  1,0,
      // left
      -0.5,-0.5,-0.5, -1,0,0,  1,0,
      -0.5, 0.5,-0.5, -1,0,0,  1,1,
      -0.5, 0.5, 0.5, -1,0,0,  0,1,
      -0.5,-0.5, 0.5, -1,0,0,  0,0,
    ]);
    const cubeIdx = [];
    for (let f = 0; f < 6; f++) {
      const b = f * 4;
      cubeIdx.push(b, b+1, b+2, b, b+2, b+3);
    }
    this.buffers.cube = this.createGeometry(cubeVerts, new Uint16Array(cubeIdx));

    // Plane geometry
    const planeVerts = new Float32Array([
      -10, 0,-10,  0,1,0,  0,10,
       10, 0,-10,  0,1,0,  10,10,
       10, 0, 10,  0,1,0,  10,0,
      -10, 0, 10,  0,1,0,  0,0,
    ]);
    this.buffers.plane = this.createGeometry(planeVerts, new Uint16Array([0,1,2,0,2,3]));

    // Sphere (icosphere approximation)
    this.buffers.sphere = this.createSphereBuffer(1, 16, 16);

    // Grid lines
    this.createGridBuffer();
  }

  createGeometry(verts, indices) {
    const gl = this.gl;
    const vao = { vb: gl.createBuffer(), ib: gl.createBuffer(), count: indices.length };
    gl.bindBuffer(gl.ARRAY_BUFFER, vao.vb);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vao.ib);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    return vao;
  }

  createSphereBuffer(r, latDiv, lonDiv) {
    const verts = []; const idx = [];
    for (let lat = 0; lat <= latDiv; lat++) {
      const theta = (lat * Math.PI) / latDiv;
      for (let lon = 0; lon <= lonDiv; lon++) {
        const phi = (lon * 2 * Math.PI) / lonDiv;
        const x = Math.sin(theta) * Math.cos(phi) * r;
        const y = Math.cos(theta) * r;
        const z = Math.sin(theta) * Math.sin(phi) * r;
        verts.push(x, y, z, x/r, y/r, z/r, lon/lonDiv, lat/latDiv);
      }
    }
    for (let lat = 0; lat < latDiv; lat++) {
      for (let lon = 0; lon < lonDiv; lon++) {
        const a = lat * (lonDiv+1) + lon;
        const b = a + lonDiv + 1;
        idx.push(a, b, a+1, b, b+1, a+1);
      }
    }
    return this.createGeometry(new Float32Array(verts), new Uint16Array(idx));
  }

  createGridBuffer() {
    const lines = [];
    const range = 10;
    for (let i = -range; i <= range; i++) {
      lines.push(i, 0, -range, i, 0, range);
      lines.push(-range, 0, i, range, 0, i);
    }
    const gl = this.gl;
    this.buffers.grid = { vb: gl.createBuffer(), count: lines.length / 3 };
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.grid.vb);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lines), gl.STATIC_DRAW);
  }

  resize() {
    const canvas = this.canvas;
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = Math.floor(rect.width);
    canvas.height = Math.floor(rect.height - 36);
    if (this.gl) this.gl.viewport(0, 0, canvas.width, canvas.height);
  }

  setMode(mode) {
    this.mode = mode;
    const modeMap = { normal: 0, realistic: 1, retro: 2, ps1: 3 };
    this.modeId = modeMap[mode] || 0;
    // PS1/Retro: lower resolution
    if (mode === 'ps1') {
      this.pixelScale = 4;
    } else if (mode === 'retro') {
      this.pixelScale = 3;
    } else {
      this.pixelScale = 1;
    }
  }

  // ===== Math helpers =====
  mat4Identity() {
    return [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];
  }

  mat4Multiply(a, b) {
    const out = new Array(16);
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        out[i*4+j] = 0;
        for (let k = 0; k < 4; k++) out[i*4+j] += a[i*4+k] * b[k*4+j];
      }
    }
    return out;
  }

  mat4Perspective(fov, aspect, near, far) {
    const f = 1 / Math.tan(fov * Math.PI / 360);
    const nf = 1 / (near - far);
    return [
      f/aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (far+near)*nf, -1,
      0, 0, 2*far*near*nf, 0
    ];
  }

  mat4LookAt(eye, center, up) {
    let fx = center[0]-eye[0], fy = center[1]-eye[1], fz = center[2]-eye[2];
    let fl = Math.sqrt(fx*fx+fy*fy+fz*fz);
    fx/=fl; fy/=fl; fz/=fl;
    let sx = fy*up[2]-fz*up[1], sy = fz*up[0]-fx*up[2], sz = fx*up[1]-fy*up[0];
    let sl = Math.sqrt(sx*sx+sy*sy+sz*sz);
    sx/=sl; sy/=sl; sz/=sl;
    const ux = sy*fz-sz*fy, uy = sz*fx-sx*fz, uz = sx*fy-sy*fx;
    return [
      sx, ux,-fx, 0,
      sy, uy,-fy, 0,
      sz, uz,-fz, 0,
      -(sx*eye[0]+sy*eye[1]+sz*eye[2]),
      -(ux*eye[0]+uy*eye[1]+uz*eye[2]),
      fx*eye[0]+fy*eye[1]+fz*eye[2], 1
    ];
  }

  mat4Translation(x, y, z) {
    return [1,0,0,0, 0,1,0,0, 0,0,1,0, x,y,z,1];
  }

  mat4Scale(x, y, z) {
    return [x,0,0,0, 0,y,0,0, 0,0,z,0, 0,0,0,1];
  }

  mat4RotY(a) {
    const c = Math.cos(a), s = Math.sin(a);
    return [c,0,s,0, 0,1,0,0, -s,0,c,0, 0,0,0,1];
  }

  // ===== Render Frame =====
  render(time) {
    this.frameCount++;
    const dt = (time - this.lastTime) / 1000;
    if (dt > 0) this.fps = Math.round(0.9 * this.fps + 0.1 * (1/dt));
    this.lastTime = time;

    if (this.use2D) {
      this.render2D(time);
      return;
    }

    const gl = this.gl;
    const w = this.canvas.width, h = this.canvas.height;

    // Low-res for retro/ps1
    const scale = this.pixelScale || 1;
    gl.viewport(0, 0, w/scale, h/scale);

    // Background color by mode
    const bgColors = {
      normal:    [0.05, 0.08, 0.12, 1],
      realistic: [0.02, 0.02, 0.03, 1],
      retro:     [0.0, 0.0, 0.0, 1],
      ps1:       [0.1, 0.05, 0.18, 1]
    };
    const bg = bgColors[this.mode] || bgColors.normal;
    gl.clearColor(...bg);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Camera auto-orbit
    const camAngle = time * 0.0004;
    const camDist = 12;
    const cam = this.camera;
    cam.pos = [
      Math.sin(camAngle) * camDist,
      5,
      Math.cos(camAngle) * camDist
    ];

    const proj = this.mat4Perspective(cam.fov, w/h, cam.near, cam.far);
    const view = this.mat4LookAt(cam.pos, cam.target, [0,1,0]);
    const vp = this.mat4Multiply(proj, view);

    // Draw grid
    if (this.gridEnabled) this.drawGrid(vp);

    // Draw scene objects
    const lightDir = [0.5, 1.0, 0.7];

    // Ground plane
    this.drawObject(this.buffers.plane,
      this.mat4Identity(),
      vp, [0.2, 0.3, 0.2], lightDir, cam.pos, 0, 0.9, false);

    // Sample cubes (scene objects)
    const cubeData = [
      { pos: [0, 0.5, 0], scale: [1,1,1], color: [0.3, 0.5, 0.9] },
      { pos: [3, 0.5, 1], scale: [0.8,0.8,0.8], color: [0.9, 0.3, 0.3] },
      { pos: [-2, 0.5, -1], scale: [1.2,1.2,1.2], color: [0.3, 0.9, 0.4] },
      { pos: [1, 0.5, -3], scale: [0.6,1.5,0.6], color: [0.9, 0.7, 0.2] },
    ];

    cubeData.forEach((obj, i) => {
      const rot = this.mat4RotY(time * 0.001 + i * 0.7);
      const trans = this.mat4Translation(...obj.pos);
      const scale = this.mat4Scale(...obj.scale);
      let model = this.mat4Multiply(trans, this.mat4Multiply(rot, scale));
      this.drawObject(this.buffers.cube, model, vp, obj.color, lightDir, cam.pos, 0.5, 0.5, this.wireframe);
    });

    // Sphere
    const sphereTrans = this.mat4Translation(
      Math.sin(time * 0.001) * 2,
      1.5,
      Math.cos(time * 0.0013) * 2
    );
    this.drawObject(this.buffers.sphere, sphereTrans, vp, [0.8, 0.5, 0.9], lightDir, cam.pos, 0.8, 0.2);

    // Update FPS display
    if (this.frameCount % 10 === 0) {
      const el = document.getElementById('fpsDisplay');
      if (el) el.textContent = this.fps;
    }
  }

  drawGrid(vp) {
    const gl = this.gl;
    const prog = this.programs.grid;
    gl.useProgram(prog);
    const mvpLoc = gl.getUniformLocation(prog, 'uMVP');
    const colLoc = gl.getUniformLocation(prog, 'uColor');
    gl.uniformMatrix4fv(mvpLoc, false, new Float32Array(vp));
    const alpha = this.mode === 'retro' ? 0.6 : 0.25;
    const gridColor = this.mode === 'retro' ? [0, 1, 0, alpha] :
                      this.mode === 'ps1'   ? [0.5, 0.3, 1, alpha] :
                                              [0.3, 0.5, 0.7, alpha];
    gl.uniform4fv(colLoc, gridColor);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.grid.vb);
    const posLoc = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 12, 0);
    gl.drawArrays(gl.LINES, 0, this.buffers.grid.count);
  }

  drawObject(geo, model, vp, color, lightDir, camPos, metal, rough, wireframe=false) {
    const gl = this.gl;
    const prog = this.programs.main;
    gl.useProgram(prog);

    const mvp = this.mat4Multiply(vp, model);
    gl.uniformMatrix4fv(gl.getUniformLocation(prog, 'uMVP'), false, new Float32Array(mvp));
    gl.uniformMatrix4fv(gl.getUniformLocation(prog, 'uModel'), false, new Float32Array(model));
    gl.uniform3fv(gl.getUniformLocation(prog, 'uColor'), color);
    gl.uniform3fv(gl.getUniformLocation(prog, 'uLightDir'), lightDir);
    gl.uniform3fv(gl.getUniformLocation(prog, 'uCamPos'), camPos);
    gl.uniform1f(gl.getUniformLocation(prog, 'uMetalness'), metal || 0.3);
    gl.uniform1f(gl.getUniformLocation(prog, 'uRoughness'), rough || 0.7);
    gl.uniform1f(gl.getUniformLocation(prog, 'uMode'), this.modeId || 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, geo.vb);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, geo.ib);

    const stride = 32;
    const posLoc = gl.getAttribLocation(prog, 'aPos');
    const normLoc = gl.getAttribLocation(prog, 'aNormal');
    const uvLoc = gl.getAttribLocation(prog, 'aUV');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, stride, 0);
    if (normLoc >= 0) { gl.enableVertexAttribArray(normLoc); gl.vertexAttribPointer(normLoc, 3, gl.FLOAT, false, stride, 12); }
    if (uvLoc >= 0) { gl.enableVertexAttribArray(uvLoc); gl.vertexAttribPointer(uvLoc, 2, gl.FLOAT, false, stride, 24); }

    if (wireframe) {
      gl.drawElements(gl.LINE_STRIP, geo.count, gl.UNSIGNED_SHORT, 0);
    } else {
      gl.drawElements(gl.TRIANGLES, geo.count, gl.UNSIGNED_SHORT, 0);
    }
  }

  // 2D fallback renderer
  render2D(time) {
    const ctx = this.ctx2d;
    const w = this.canvas.width, h = this.canvas.height;
    ctx.fillStyle = '#080c14';
    ctx.fillRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = 'rgba(0,212,255,0.15)';
    ctx.lineWidth = 1;
    const gsize = 40;
    for (let x = 0; x < w; x += gsize) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke(); }
    for (let y = 0; y < h; y += gsize) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke(); }

    // Simple 2D isometric scene preview
    const cx = w/2, cy = h/2;
    const t = time * 0.001;
    ctx.save();
    ctx.translate(cx, cy - 40);

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(0, 60, 50, 15, 0, 0, Math.PI*2);
    ctx.fill();

    // Cube (isometric)
    const drawIsoBox = (x, y, s, col) => {
      const hw = s * Math.cos(Math.PI/6);
      const hh = s * Math.sin(Math.PI/6);
      ctx.save();
      ctx.translate(x, y);

      // Top
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(0, -s*0.5);
      ctx.lineTo(hw, -s*0.5 + hh);
      ctx.lineTo(0, -s*0.5 + hh*2);
      ctx.lineTo(-hw, -s*0.5 + hh);
      ctx.closePath();
      ctx.fill();

      // Left
      ctx.fillStyle = this.hexDarken(col, 0.7);
      ctx.beginPath();
      ctx.moveTo(-hw, -s*0.5 + hh);
      ctx.lineTo(0, -s*0.5 + hh*2);
      ctx.lineTo(0, s*0.5 + hh*2);
      ctx.lineTo(-hw, s*0.5 + hh);
      ctx.closePath();
      ctx.fill();

      // Right
      ctx.fillStyle = this.hexDarken(col, 0.5);
      ctx.beginPath();
      ctx.moveTo(0, -s*0.5 + hh*2);
      ctx.lineTo(hw, -s*0.5 + hh);
      ctx.lineTo(hw, s*0.5 + hh);
      ctx.lineTo(0, s*0.5 + hh*2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    drawIsoBox(Math.sin(t)*30, Math.cos(t)*20, 40, '#4a90e2');
    drawIsoBox(-60, 20, 30, '#e24a4a');
    drawIsoBox(60, 15, 25, '#4ae24a');
    ctx.restore();

    // Mode badge
    const modeColors = { normal: '#00d4ff', realistic: '#ffd700', retro: '#00ff41', ps1: '#ff6090' };
    ctx.fillStyle = modeColors[this.mode] || '#00d4ff';
    ctx.font = '11px "Share Tech Mono"';
    ctx.fillText('[2D FALLBACK — WebGL not supported]', 10, h-10);
  }

  hexDarken(hex, factor) {
    if (hex.startsWith('#')) {
      const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
      return `rgb(${Math.floor(r*factor)},${Math.floor(g*factor)},${Math.floor(b*factor)})`;
    }
    return hex;
  }
}

window.NexusRenderer = NexusRenderer;
