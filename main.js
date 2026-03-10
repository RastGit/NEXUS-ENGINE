// ============================================
// NEXUS ENGINE — Main Entry Point
// ============================================

window.addEventListener('DOMContentLoaded', () => {
  const bootScreen = document.getElementById('boot-screen');
  const app = document.getElementById('app');

  const statusMessages = [
    'Initializing rendering pipeline...',
    'Loading WebGL context...',
    'Compiling shaders...',
    'Initializing physics engine...',
    'Loading AI modules...',
    'Starting editor...',
    'Ready.'
  ];

  let msgIdx = 0;
  const statusEl = document.querySelector('.boot-status');
  const msgInterval = setInterval(() => {
    if (msgIdx < statusMessages.length) {
      if (statusEl) statusEl.textContent = statusMessages[msgIdx++];
    } else {
      clearInterval(msgInterval);
    }
  }, 280);

  // Boot delay
  setTimeout(() => {
    bootScreen.classList.add('fade-out');
    setTimeout(() => {
      bootScreen.style.display = 'none';
      app.style.display = 'flex';
      app.style.flexDirection = 'column';
      app.style.height = '100vh';

      // Init engine
      const engine = new NexusEngine();
      engine.init();
      initUI(engine);

      // Welcome messages
      setTimeout(() => {
        engine.log('Witaj w Nexus Engine! Twój silnik do tworzenia gier.', 'info');
        engine.log('Użyj przycisków nawigacji aby przełączać między panelami.', 'info');
        engine.log('Kliknij ▶ URUCHOM aby zobaczyć podgląd gry.', 'info');
        engine.log('Użyj trybu AI aby generować tekstury, teren i kod.', 'info');
      }, 500);

    }, 500);
  }, 2200);
});
