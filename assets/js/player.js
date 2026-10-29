/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║   PLAYER.JS — Reproductor de audio para los tracks         ║
 * ║   Artista: GRANATTE                                          ║
 * ╠══════════════════════════════════════════════════════════════╣
 * ║  QUÉ HACE:                                                  ║
 * ║  · Maneja la reproducción de los tracks de audio           ║
 * ║  · Solo un track puede estar activo a la vez               ║
 * ║  · Actualiza el botón play/pause visualmente               ║
 * ║  · Activa/desactiva la animación del waveform del track     ║
 * ║                                                             ║
 * ║  📝 PARA AGREGAR AUDIO REAL:                               ║
 * ║  1. Pon tus archivos MP3 en: assets/audio/                  ║
 * ║  2. En index.html, descomenta las líneas <source src="..."> ║
 * ║  3. El player funciona automáticamente                      ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

document.addEventListener('DOMContentLoaded', initPlayer);

function initPlayer() {
  // Obtener todos los botones de play y los tracks
  const playBtns    = document.querySelectorAll('.btn-play');
  const trackCards  = document.querySelectorAll('.track-card');

  if (!playBtns.length) return;

  /*
    Estado global del player.
    Solo guardamos UNA referencia al audio actualmente reproduciéndose.
    Cuando el usuario presiona play en otro track, pausamos éste primero.
  */
  let currentAudio    = null;  // Elemento <audio> activo
  let currentBtn      = null;  // Botón play/pause activo
  let currentCard     = null;  // Card del track activo
  let currentWaveform = null;  // Canvas del waveform activo

  playBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation(); // No propagar al click del card (para evitar lightbox)

      // Obtener el card padre de este botón
      const card      = btn.closest('.track-card');
      const audio     = card ? card.querySelector('.track-audio') : null;
      const waveform  = card ? card.querySelector('.track-waveform') : null;

      /*
        Caso 1: Si este botón ya está reproduciendo → PAUSAR
      */
      if (btn === currentBtn && currentAudio && !currentAudio.paused) {
        pauseCurrent();
        return;
      }

      /*
        Caso 2: Hay otro track reproduciéndose → pausarlo primero
      */
      if (currentAudio && !currentAudio.paused) {
        pauseCurrent();
      }

      /*
        Caso 3: No hay audio real (sin <source>) → modo demo
        Mostramos la animación del waveform igualmente, pero no reproducimos audio.
      */
      if (!audio || !audio.querySelector('source')) {
        activateVisuals(btn, card, waveform);
        // Simular pausa después de un momento (demo)
        // Comentar estas líneas si tienes audio real
        setTimeout(() => {
          if (currentBtn === btn) {
            pauseCurrent();
          }
        }, 8000); // Simula 8 segundos de "reproducción"
        return;
      }

      /*
        Caso 4: Hay audio real → REPRODUCIR
      */
      activateVisuals(btn, card, waveform);
      currentAudio = audio;

      audio.play().catch((err) => {
        // El browser puede bloquear la reproducción sin interacción previa
        console.warn('[Player] No se pudo reproducir:', err.message);
      });

      // Cuando el audio termina, resetear el estado
      audio.addEventListener('ended', () => {
        if (currentAudio === audio) {
          pauseCurrent();
        }
      }, { once: true }); // { once: true } = el listener se autodestruye después del primer evento
    });
  });

  /**
   * Activa los visuales de "playing" para un track:
   * · Cambia el icono del botón a pausa
   * · Añade clase is-playing al card
   * · Activa la animación del waveform
   */
  function activateVisuals(btn, card, waveform) {
    currentBtn      = btn;
    currentCard     = card;
    currentWaveform = waveform;

    // Cambiar icono ▶ → ⏸
    const icon = btn.querySelector('.play-icon');
    if (icon) icon.textContent = '⏸';
    btn.classList.add('is-playing');
    if (card) card.classList.add('is-playing');

    // Activar animación del waveform
    if (waveform && waveform.startAnimation) {
      waveform.startAnimation();
    }
  }

  /**
   * Pausa el track actualmente en reproducción y resetea los visuales.
   */
  function pauseCurrent() {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }

    if (currentBtn) {
      const icon = currentBtn.querySelector('.play-icon');
      if (icon) icon.textContent = '▶';
      currentBtn.classList.remove('is-playing');
      currentBtn = null;
    }

    if (currentCard) {
      currentCard.classList.remove('is-playing');
      currentCard = null;
    }

    if (currentWaveform && currentWaveform.stopAnimation) {
      currentWaveform.stopAnimation();
      currentWaveform = null;
    }
  }

  /*
    Acceso global para debug desde la consola:
    window.player.pauseAll()
    window.player.currentTrack → número del track activo
  */
  window.player = {
    pauseAll: pauseCurrent,
    get currentTrack() {
      return currentCard ? currentCard.dataset.track : null;
    },
  };
}
