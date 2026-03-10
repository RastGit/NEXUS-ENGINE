# NEXUS ENGINE 🎮

> Webowy silnik do tworzenia gier — inspirowany Unity, Unreal Engine i Godot.
> Działa w przeglądarce. Hostowany na **GitHub Pages**.

[![Deploy to GitHub Pages](https://github.com/YOUR_USERNAME/nexus-engine/actions/workflows/deploy.yml/badge.svg)](https://github.com/YOUR_USERNAME/nexus-engine/actions)

## 🌐 Demo na żywo
**https://YOUR_USERNAME.github.io/nexus-engine/**

---

## 🚀 Funkcje

### 🎮 Edytor Sceny
- Hierarchia obiektów (Scene Tree)
- Inspektor właściwości (Transform, Material, RigidBody)
- Viewport 3D z WebGL (perspektyw, top, front, bok)
- Narzędzia: zaznaczanie, przesuwanie, obracanie, skalowanie
- Timeline animacji
- Konsola JavaScript
- Edytor kodu skryptów

### 🌟 Tryby Renderowania
| Tryb | Opis |
|------|------|
| **REALISTIC** | PBR lighting, tone mapping, gamma correction |
| **NORMAL** | Standard Phong shading |
| **RETRO** | 8-bit pixel art, ograniczona paleta |
| **PS1** | PlayStation 1 styl — niskie rozdzielczości, dithering |

### 🎨 Edytor Tekstur
- Pędzel, wiadro, gumka, szum, wzór
- Flood fill
- Paleta kolorów
- Generator tekstur proceduralnych (skała, trawa, metal, drewno, ogień, woda...)
- Generator AI bazowany na opisie tekstowym
- Biblioteka tekstur
- Eksport PNG

### 🤖 AI Studio
- **NPC AI**: FSM, BehaviorTree, Neural Network, Reinforcement Learning
- **Generator Terenu**: Szum Perlina z oktawami — niziny, góry, wyspy, kaniony, księżyc
- **Generator Kodu**: Opisz skrypt, AI go wygeneruje
- **Analiza Balansu**: Radarowy wykres parametrów gry
- **Pathfinding A\***: Interaktywny labirynt z wizualizacją ścieżki

### 📦 Menedżer Assetów
- Modele 3D, tekstury, audio, skrypty, animacje, efekty cząsteczkowe

---

## 📱 Responsywność
- Pełna obsługa **desktop** i **mobile**
- Touch events w edytorze tekstur
- Zoptymalizowany layout dla małych ekranów

---

## 🛠 Technologie
- **WebGL 2.0** (z fallback na WebGL 1.0 i Canvas 2D)
- **Vanilla JavaScript** — brak zewnętrznych frameworków
- **CSS Custom Properties** — dynamiczne motywy
- **Canvas API** — edytor tekstur i AI wizualizacje
- **GitHub Pages** — hosting

---

## 📦 Instalacja lokalna
```bash
git clone https://github.com/YOUR_USERNAME/nexus-engine.git
cd nexus-engine
# Otwórz index.html w przeglądarce lub użyj live server:
npx serve .
```

## 🚀 Deploy na GitHub Pages
1. Zrób fork / stwórz nowe repo
2. Wgraj wszystkie pliki
3. Idź do **Settings → Pages → Source: main / root**
4. Gotowe! Strona będzie dostępna na `https://USERNAME.github.io/REPO/`

Albo użyj **GitHub Actions** (plik `.github/workflows/deploy.yml` już jest skonfigurowany).

---

## 📁 Struktura projektu
```
nexus-engine/
├── index.html          # Główna strona edytora
├── css/
│   └── main.css        # Style + tryby renderowania
├── js/
│   ├── engine.js       # Core engine
│   ├── renderer.js     # WebGL 3D renderer (PBR, Retro, PS1)
│   ├── texture-editor.js # Edytor tekstur
│   ├── ai-system.js    # AI, pathfinding, terrain gen
│   ├── ui.js           # UI interactions
│   └── main.js         # Entry point
├── .github/
│   └── workflows/
│       └── deploy.yml  # GitHub Pages auto-deploy
└── README.md
```

---

## 🎯 Roadmap
- [ ] Import modeli 3D (OBJ, GLTF)
- [ ] System cząsteczek (particles)
- [ ] Fizyka Rapier.js
- [ ] Multiplayer (WebSockets)
- [ ] Audio 3D (WebAudio API)
- [ ] Export do PWA offline

---

Made with ❤️ by Nexus Engine Team
