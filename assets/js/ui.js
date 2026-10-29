/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║   UI.JS — Interactividad y animaciones de la interfaz       ║
 * ║   Artista: GRANATTE                                          ║
 * ╠══════════════════════════════════════════════════════════════╣
 * ║  MÓDULOS INCLUIDOS:                                         ║
 * ║  1. initCursor()         Cursor estrella personalizado      ║
 * ║  2. initNavigation()     Nav lateral activa por scroll      ║
 * ║  3. initScrollAnimations() Entradas con GSAP + ScrollTrigger║
 * ║  4. initGallery()        Filtros y lightbox de portafolio   ║
 * ║  5. initLightbox()       Lightbox con efecto 3D             ║
 * ║  6. initWaveforms()      Visualizadores de onda en canvas   ║
 * ║  7. initQuoteRotator()   Citas rotatorias en sidebar        ║
 * ║  8. initContactForm()    Validación y envío del formulario  ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

/* Esperar a que el DOM esté listo antes de ejecutar todo */
document.addEventListener('DOMContentLoaded', () => {
  initCursor();
  initNavigation();
  initScrollAnimations();
  initGallery();
  initLightbox();
  initWaveforms();
  initQuoteRotator();
  initContactForm();
});


/* ══════════════════════════════════════════════════════════════
   1. CURSOR PERSONALIZADO
   Mueve el elemento .cursor siguiendo el mouse en tiempo real.
   La estela (.cursor-trail) usa transición CSS para el retraso.
   ══════════════════════════════════════════════════════════════ */
function initCursor() {
  const cursor = document.getElementById('cursor');
  const trail  = document.getElementById('cursor-trail');

  if (!cursor || !trail) return; // Guardia: si no existen, salir

  // Actualizar posición en tiempo real con requestAnimationFrame
  // Es más eficiente que mousemove → DOM directo
  let mouseX = 0, mouseY = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    // El cursor principal se mueve directamente (sin lag)
    cursor.style.left = mouseX + 'px';
    cursor.style.top  = mouseY + 'px';

    // La estela usa transición CSS para el lag visual
    trail.style.left = mouseX + 'px';
    trail.style.top  = mouseY + 'px';
  });

  // Ocultar cursor al salir de la ventana
  document.addEventListener('mouseleave', () => {
    cursor.style.opacity = '0';
    trail.style.opacity  = '0';
  });
  document.addEventListener('mouseenter', () => {
    cursor.style.opacity = '1';
    trail.style.opacity  = '0.5';
  });

  /*
    Efecto hover: cuando el mouse pasa sobre elementos interactivos,
    añadimos clase al body para cambiar el estilo del cursor (ver CSS).
    Usamos event delegation: un solo listener en document en lugar
    de uno por elemento → más eficiente.
  */
  document.addEventListener('mouseover', (e) => {
    const target = e.target.closest('a, button, .gallery-item, .filter-btn, .track-card, .tarot-card');
    if (target) {
      document.body.classList.add('cursor-hover');
    }
  });

  document.addEventListener('mouseout', (e) => {
    const target = e.target.closest('a, button, .gallery-item, .filter-btn, .track-card, .tarot-card');
    if (target) {
      document.body.classList.remove('cursor-hover');
    }
  });
}


/* ══════════════════════════════════════════════════════════════
   2. NAVEGACIÓN ACTIVA POR SCROLL
   Detecta qué sección está visible y marca el nav link activo.
   Usa IntersectionObserver (API nativa, eficiente, sin scroll events).
   ══════════════════════════════════════════════════════════════ */
function initNavigation() {
  const navItems  = document.querySelectorAll('.nav-item');
  const sections  = document.querySelectorAll('.section');
  const mainScroll = document.getElementById('main-content');

  if (!sections.length || !navItems.length) return;

  /*
    IntersectionObserver observa qué sección está en el viewport.
    threshold: 0.3 = activa cuando el 30% de la sección es visible.
    rootMargin ajusta el "trigger zone" (positivo = más ancho/alto).
    root: mainScroll = observa relativo al main scrollable, no al viewport global
  */
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        // El id de la sección visible
        const sectionId = entry.target.id;

        // Quitar clase active de todos los nav items
        navItems.forEach((item) => item.classList.remove('active'));

        // Añadir active al nav item que corresponde a la sección
        const activeNav = document.querySelector(`.nav-item[data-section="${sectionId}"]`);
        if (activeNav) {
          activeNav.classList.add('active');
          // Actualizar aria-current para accesibilidad
          navItems.forEach((item) => {
            const link = item.querySelector('.nav-link');
            if (link) link.removeAttribute('aria-current');
          });
          const activeLink = activeNav.querySelector('.nav-link');
          if (activeLink) activeLink.setAttribute('aria-current', 'page');
        }
      });
    },
    {
      root: mainScroll,
      threshold: 0.3,
    }
  );

  sections.forEach((section) => observer.observe(section));

  /*
    Scroll suave al hacer click en los links del nav.
    Interceptamos el click para hacer scroll en #main-content
    (que es quien tiene el overflow:auto), no en el body.
  */
  navItems.forEach((item) => {
    const link = item.querySelector('.nav-link');
    if (!link) return;

    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href').replace('#', '');
      const targetEl = document.getElementById(targetId);
      if (targetEl && mainScroll) {
        // scrollIntoView funciona relativo al scroll container más cercano
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // También conectar el botón "Descender" del hero
  const btnEnter = document.querySelector('.btn-enter');
  if (btnEnter && mainScroll) {
    btnEnter.addEventListener('click', (e) => {
      e.preventDefault();
      const profileSection = document.getElementById('profile');
      if (profileSection) {
        profileSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }
}


/* ══════════════════════════════════════════════════════════════
   3. ANIMACIONES DE SCROLL CON GSAP
   Activa animaciones de entrada cuando los elementos entran
   en el viewport. Usa ScrollTrigger si está disponible,
   o IntersectionObserver como fallback.
   ══════════════════════════════════════════════════════════════ */
function initScrollAnimations() {
  const mainScroll = document.getElementById('main-content');

  /*
    ¿Tenemos GSAP? (puede que no cargue si no hay internet)
    Si no está disponible, hacemos un fallback con IntersectionObserver.
  */
  if (typeof gsap === 'undefined') {
    // Fallback: simplemente añadir clase .is-visible a los elementos
    const animatables = document.querySelectorAll('.timeline-content, .track-card');
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) e.target.classList.add('is-visible');
      }),
      { threshold: 0.1 }
    );
    animatables.forEach((el) => obs.observe(el));
    return;
  }

  // Registrar ScrollTrigger en GSAP
  if (typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
  }

  /* ── Animación del Hero ──────────────────────────────────────
     El hero se anima al cargar la página (no al hacer scroll).
     Stagger: animaciones escalonadas con delay entre elementos.
  */
  gsap.from('.hero-title', {
    duration: 1.2,
    y: 40,
    opacity: 0,
    ease: 'power3.out',
    delay: 0.3,
  });

  gsap.from('.hero-subtitle', {
    duration: 1,
    y: 20,
    opacity: 0,
    ease: 'power3.out',
    delay: 0.7,
  });

  gsap.from('.hero-quote', {
    duration: 1,
    x: -30,
    opacity: 0,
    ease: 'power2.out',
    delay: 1.0,
  });

  gsap.from('.btn-enter', {
    duration: 0.8,
    y: 20,
    opacity: 0,
    ease: 'back.out(1.7)', // ease con overshoot (rebote)
    delay: 1.3,
  });

  gsap.from('.invocation-circle', {
    duration: 2,
    scale: 0.5,
    opacity: 0,
    ease: 'power2.out',
    delay: 0,
  });

  /* ── Animación de títulos de sección ──────────────────────────
     Cada .section-header se anima cuando entra en el viewport.
     IMPORTANTE: scroller debe apuntar al contenedor con scroll.
  */
  if (typeof ScrollTrigger !== 'undefined') {

    document.querySelectorAll('.section-header').forEach((header) => {
      gsap.from(header, {
        scrollTrigger: {
          trigger: header,
          scroller: mainScroll,  // El scroll está en #main-content, no en body
          start: 'top 80%',      // Activar cuando el top del elemento llega al 80% del viewport
          toggleActions: 'play none none reverse',
        },
        y: 30,
        opacity: 0,
        duration: 0.8,
        ease: 'power2.out',
      });
    });

    /* ── Animación del perfil ────────────────────────────────── */
    gsap.from('.profile-photo-frame', {
      scrollTrigger: {
        trigger: '.section-profile',
        scroller: mainScroll,
        start: 'top 70%',
      },
      x: -60,
      opacity: 0,
      duration: 1,
      ease: 'power3.out',
    });

    gsap.from('.profile-text', {
      scrollTrigger: {
        trigger: '.section-profile',
        scroller: mainScroll,
        start: 'top 70%',
      },
      x: 60,
      opacity: 0,
      duration: 1,
      ease: 'power3.out',
      delay: 0.2,
    });

    /* ── Timeline items con stagger ─────────────────────────── */
    gsap.from('.timeline-item', {
      scrollTrigger: {
        trigger: '.timeline',
        scroller: mainScroll,
        start: 'top 80%',
      },
      x: -40,
      opacity: 0,
      duration: 0.6,
      stagger: 0.15, // 0.15s de delay entre cada item
      ease: 'power2.out',
      onComplete: () => {
        // Cuando termina la animación GSAP, añadir clase CSS también
        document.querySelectorAll('.timeline-content').forEach((el) => {
          el.classList.add('is-visible');
        });
      }
    });

    /* ── Grimorio (left/right) ───────────────────────────────── */
    gsap.from('.grimoire-left', {
      scrollTrigger: {
        trigger: '.grimoire-layout',
        scroller: mainScroll,
        start: 'top 75%',
      },
      rotationY: -30,
      opacity: 0,
      duration: 1.2,
      ease: 'power2.out',
      // perspective necesita un padre con transform-style:preserve-3d
      // Aquí es un efecto visual simple con rotationY
    });

    gsap.from('.grimoire-right', {
      scrollTrigger: {
        trigger: '.grimoire-layout',
        scroller: mainScroll,
        start: 'top 75%',
      },
      x: 40,
      opacity: 0,
      duration: 1,
      delay: 0.2,
      ease: 'power2.out',
    });

    /* ── Galería con stagger ─────────────────────────────────── */
    gsap.from('.gallery-item', {
      scrollTrigger: {
        trigger: '.gallery-grid',
        scroller: mainScroll,
        start: 'top 80%',
      },
      y: 50,
      opacity: 0,
      scale: 0.9,
      duration: 0.6,
      stagger: {
        amount: 1,          // Duración total del stagger (distribuye en 1s)
        from: 'random',     // Orden aleatorio de aparición (efecto más orgánico)
      },
      ease: 'power2.out',
    });

    /* ── Tracks con stagger ──────────────────────────────────── */
    gsap.from('.track-card', {
      scrollTrigger: {
        trigger: '.tracks-container',
        scroller: mainScroll,
        start: 'top 80%',
      },
      x: -30,
      opacity: 0,
      duration: 0.5,
      stagger: 0.1,
      ease: 'power2.out',
      onComplete: () => {
        document.querySelectorAll('.track-card').forEach((el) => {
          el.classList.add('is-visible');
        });
      }
    });

    /* ── Contacto ─────────────────────────────────────────────── */
    gsap.from('.contact-social', {
      scrollTrigger: {
        trigger: '.contact-layout',
        scroller: mainScroll,
        start: 'top 75%',
      },
      x: -40,
      opacity: 0,
      duration: 0.8,
      ease: 'power2.out',
    });

    gsap.from('.contact-form-container', {
      scrollTrigger: {
        trigger: '.contact-layout',
        scroller: mainScroll,
        start: 'top 75%',
      },
      x: 40,
      opacity: 0,
      duration: 0.8,
      delay: 0.2,
      ease: 'power2.out',
    });

  } else {
    // Fallback sin ScrollTrigger: todo visible de inmediato
    document.querySelectorAll('.timeline-content, .track-card').forEach((el) => {
      el.classList.add('is-visible');
    });
  }
}


/* ══════════════════════════════════════════════════════════════
   4. GALERÍA — FILTROS DE CATEGORÍA
   Al hacer click en un botón de filtro:
   · Se esconden los ítems que no corresponden (opacity + scale)
   · Los que sí corresponden aparecen
   ══════════════════════════════════════════════════════════════ */
function initGallery() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const galleryItems = document.querySelectorAll('.gallery-item');

  if (!filterBtns.length) return;

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter; // El valor de data-filter="all|press|live|..."

      // Actualizar estado activo de los botones
      filterBtns.forEach((b) => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');

      // Filtrar ítems
      galleryItems.forEach((item) => {
        const category = item.dataset.category;

        // Mostrar todo si el filtro es "all", o sólo los de la categoría
        const isVisible = filter === 'all' || category === filter;

        if (typeof gsap !== 'undefined') {
          // Con GSAP: animación suave de entrada/salida
          if (isVisible) {
            item.style.display = 'block';
            gsap.to(item, { opacity: 1, scale: 1, duration: 0.3, ease: 'power2.out' });
          } else {
            gsap.to(item, {
              opacity: 0,
              scale: 0.95,
              duration: 0.2,
              ease: 'power2.in',
              onComplete: () => { item.style.display = 'none'; },
            });
          }
        } else {
          // Fallback sin GSAP
          item.style.display = isVisible ? 'block' : 'none';
          item.style.opacity = isVisible ? '1' : '0';
        }
      });
    });
  });
}


/* ══════════════════════════════════════════════════════════════
   5. LIGHTBOX
   Al hacer click en un ítem de la galería, muestra la imagen
   en pantalla completa con efecto 3D de apertura.
   ══════════════════════════════════════════════════════════════ */
function initLightbox() {
  const galleryItems = document.querySelectorAll('.gallery-item');
  if (!galleryItems.length) return;

  /* Crear el elemento lightbox dinámicamente y añadirlo al body.
     Así el HTML queda limpio y sólo existe cuando se necesita. */
  const lightboxEl = document.createElement('div');
  lightboxEl.className = 'lightbox';
  lightboxEl.setAttribute('role', 'dialog');
  lightboxEl.setAttribute('aria-modal', 'true');
  lightboxEl.setAttribute('aria-label', 'Visor de imagen');
  lightboxEl.innerHTML = `
    <div class="lightbox-inner">
      <button class="lightbox-close" aria-label="Cerrar visor">✕</button>
      <img src="" alt="" id="lightbox-img" />
      <p class="lightbox-caption" id="lightbox-caption"></p>
    </div>
  `;
  document.body.appendChild(lightboxEl);

  // Estilos para el caption del lightbox (añadidos inline para no editar CSS)
  const captionStyle = document.createElement('style');
  captionStyle.textContent = `
    .lightbox-caption {
      text-align: center;
      font-family: 'Rajdhani', monospace;
      font-size: 0.8rem;
      color: rgba(180,140,255,0.6);
      letter-spacing: 0.1em;
      margin-top: 0.5rem;
    }
  `;
  document.head.appendChild(captionStyle);

  const lightboxImg     = document.getElementById('lightbox-img');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const closeBtn        = lightboxEl.querySelector('.lightbox-close');

  /* Función para abrir el lightbox */
  function openLightbox(item) {
    // Intentar obtener la imagen real, o el placeholder
    const img     = item.querySelector('img');
    const caption = item.querySelector('.caption-title');

    if (img) {
      // Hay imagen real
      lightboxImg.src = img.src;
      lightboxImg.alt = img.alt || '';
      lightboxImg.style.display = 'block';
    } else {
      // Solo placeholder — mostrar el texto del placeholder
      lightboxImg.src = '';
      lightboxImg.style.display = 'none';
    }

    lightboxCaption.textContent = caption ? caption.textContent : '';

    lightboxEl.classList.add('is-open');
    document.body.style.overflow = 'hidden'; // Bloquear scroll del body

    // Animación de entrada con GSAP si está disponible
    if (typeof gsap !== 'undefined') {
      gsap.fromTo(
        '.lightbox-inner',
        { scale: 0.8, rotationY: -20, opacity: 0 },
        { scale: 1, rotationY: 0, opacity: 1, duration: 0.5, ease: 'back.out(1.2)' }
      );
    }

    // Foco en el botón de cerrar (accesibilidad)
    closeBtn.focus();
  }

  /* Función para cerrar el lightbox */
  function closeLightbox() {
    if (typeof gsap !== 'undefined') {
      gsap.to('.lightbox-inner', {
        scale: 0.9,
        opacity: 0,
        duration: 0.25,
        ease: 'power2.in',
        onComplete: () => {
          lightboxEl.classList.remove('is-open');
          document.body.style.overflow = '';
        },
      });
    } else {
      lightboxEl.classList.remove('is-open');
      document.body.style.overflow = '';
    }
  }

  // Abrir al hacer click en cualquier gallery-item
  galleryItems.forEach((item) => {
    item.addEventListener('click', () => openLightbox(item));
    // Accesibilidad: también con Enter/Space cuando hay foco
    item.setAttribute('tabindex', '0');
    item.setAttribute('role', 'button');
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openLightbox(item);
      }
    });
  });

  // Cerrar con el botón X
  closeBtn.addEventListener('click', closeLightbox);

  // Cerrar al hacer click fuera de la imagen
  lightboxEl.addEventListener('click', (e) => {
    if (e.target === lightboxEl) closeLightbox();
  });

  // Cerrar con Escape (accesibilidad)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightboxEl.classList.contains('is-open')) {
      closeLightbox();
    }
  });
}


/* ══════════════════════════════════════════════════════════════
   6. VISUALIZADORES DE ONDA (Waveforms)
   Dibuja formas de onda decorativas/pseudoaleatorias en cada
   canvas .track-waveform. No reproduce audio real, es decorativo.
   ══════════════════════════════════════════════════════════════
   📝 Si quieres análisis de audio REAL, necesitas Web Audio API
      y conectarlo a cada elemento <audio>. Ver comentarios al final.
*/
function initWaveforms() {
  const waveformCanvases = document.querySelectorAll('.track-waveform');
  if (!waveformCanvases.length) return;

  waveformCanvases.forEach((canvas, index) => {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    // Generar datos de onda únicos para cada track
    // Usamos el índice como seed para que cada track tenga su forma
    const barCount = 40;
    // Array de amplitudes basadas en seed (pseudoaleatorio pero reproducible)
    const amplitudes = generateWaveData(barCount, index * 137.5 + 42);

    let animFrame;
    let phase = 0;
    let isAnimating = false;

    /* Dibujar la onda estática (estado idle) */
    function drawStatic() {
      ctx.clearRect(0, 0, w, h);

      const barWidth = w / barCount;
      const centerY = h / 2;

      for (let i = 0; i < barCount; i++) {
        const amp = amplitudes[i] * (h * 0.4); // Escalar a 40% de la altura
        const x = i * barWidth + barWidth * 0.1;
        const bw = barWidth * 0.7;

        // Color con gradiente según la amplitud
        const alpha = 0.3 + amplitudes[i] * 0.4;
        ctx.fillStyle = `rgba(139, 92, 246, ${alpha})`;
        // Barra superior (mitad arriba del centro)
        ctx.fillRect(x, centerY - amp, bw, amp);
        // Barra inferior (espejo)
        ctx.fillStyle = `rgba(34, 211, 238, ${alpha * 0.5})`;
        ctx.fillRect(x, centerY, bw, amp);
      }
    }

    /* Dibujar la onda animada (estado playing) */
    function drawAnimated() {
      ctx.clearRect(0, 0, w, h);

      const barWidth = w / barCount;
      const centerY = h / 2;
      phase += 0.05; // Velocidad de la animación

      for (let i = 0; i < barCount; i++) {
        // Modulamos la amplitud con el seno del tiempo + posición
        const modulation = Math.abs(Math.sin(phase + i * 0.3)) * 0.5 + 0.5;
        const amp = amplitudes[i] * (h * 0.45) * modulation;

        const x = i * barWidth + barWidth * 0.1;
        const bw = barWidth * 0.7;

        // Gradiente animado que va de violeta a cian
        const hue = 260 + Math.sin(phase + i * 0.1) * 40; // 260=violeta, 200=cian
        ctx.fillStyle = `hsla(${hue}, 70%, 65%, 0.8)`;
        ctx.fillRect(x, centerY - amp, bw, amp);

        ctx.fillStyle = `hsla(${hue - 40}, 80%, 60%, 0.5)`;
        ctx.fillRect(x, centerY, bw, amp);
      }

      animFrame = requestAnimationFrame(drawAnimated);
    }

    /* Inicializar como estático */
    drawStatic();

    /*
      Exponer funciones en el canvas para que el player.js
      pueda activar/desactivar la animación.
      Accede con: canvas.startAnimation() / canvas.stopAnimation()
    */
    canvas.startAnimation = function() {
      if (isAnimating) return;
      isAnimating = true;
      cancelAnimationFrame(animFrame);
      drawAnimated();
    };

    canvas.stopAnimation = function() {
      isAnimating = false;
      cancelAnimationFrame(animFrame);
      drawStatic();
    };
  });
}

/**
 * Genera un array de amplitudes pseudoaleatorias.
 * @param {number} count - Número de barras
 * @param {number} seed  - Semilla para reproducibilidad
 * @returns {number[]} Array de valores entre 0 y 1
 */
function generateWaveData(count, seed) {
  const data = [];
  let s = seed;
  for (let i = 0; i < count; i++) {
    // Generador de números pseudoaleatorios simple (LCG)
    // No es criptográficamente seguro, pero perfecto para gráficos
    s = (s * 9301 + 49297) % 233280;
    const rand = s / 233280;
    // Aplicar curva: los extremos son más bajos (forma de arco)
    const curve = Math.sin((i / count) * Math.PI);
    data.push(rand * curve * 0.7 + 0.15); // Mínimo 0.15 para que sea visible
  }
  return data;
}


/* ══════════════════════════════════════════════════════════════
   7. ROTADOR DE CITAS
   Rota las citas del sidebar derecho cada N segundos.
   Fade out → cambiar texto → fade in.
   ══════════════════════════════════════════════════════════════ */
function initQuoteRotator() {
  const quoteEl  = document.getElementById('rotating-quote');
  const authorEl = document.getElementById('quote-author');

  if (!quoteEl) return;

  /*
    📝 EDITAR: Añade más citas a este array.
    Formato: { text: "La cita", author: "— Quien sea" }
  */
  const quotes = [
    {
      text: '"El mar recuerda todo lo que la tierra olvidó."',
      author: '— GRANATTE',
    },
    {
      text: '"Las sirenas no cantan para seducir. Cantan porque no pueden parar."',
      author: '— GRANATTE',
    },
    {
      text: '"Cada hechizo es una promesa hecha al vacío."',
      author: '— Libro del Abismo',
    },
    {
      text: '"Piscis: la última señal del zodíaco. Sabe todo y dice nada."',
      author: '— Carta Natal',
    },
    {
      text: '"El océano es el único espejo que no miente."',
      author: '— GRANATTE',
    },
    {
      text: '"Aries empieza. Piscis disuelve. En el medio, todo lo que somos."',
      author: '— Ciclo Zodiacal',
    },
    {
      text: '"Una bruja no invoca el fuego. Se convierte en él."',
      author: '— Tradición Costera',
    },
  ];

  let currentIndex = 0;
  const intervalMs = 6000; // 📝 EDITAR: milisegundos entre cambio de cita

  function rotateQuote() {
    currentIndex = (currentIndex + 1) % quotes.length;
    const nextQuote = quotes[currentIndex];

    // Fade out con transición CSS (opacity: 0 → se ve porque CSS tiene transition)
    quoteEl.style.opacity = '0';
    if (authorEl) authorEl.style.opacity = '0';

    // Después de que el fade out completa, cambiar texto y hacer fade in
    setTimeout(() => {
      quoteEl.textContent = nextQuote.text;
      if (authorEl) authorEl.textContent = nextQuote.author;

      quoteEl.style.opacity = '1';
      if (authorEl) authorEl.style.opacity = '1';
    }, 600); // 600ms = duración del fade out (igual que --transition-slow en CSS)
  }

  // Asegurarse de que la transición de opacity esté activada
  quoteEl.style.transition = 'opacity 0.6s ease';
  if (authorEl) authorEl.style.transition = 'opacity 0.6s ease';

  // Iniciar la rotación
  setInterval(rotateQuote, intervalMs);
}


/* ══════════════════════════════════════════════════════════════
   8. FORMULARIO DE CONTACTO
   Validación client-side y manejo del envío.
   Por defecto: muestra mensaje de éxito (no envía realmente).
   ══════════════════════════════════════════════════════════════ */
function initContactForm() {
  const form       = document.getElementById('contact-form');
  const statusEl   = document.getElementById('form-status');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault(); // Prevenir el envío HTML nativo

    /* ── Validación ──────────────────────────────────────────── */
    const name    = form.querySelector('#contact-name').value.trim();
    const email   = form.querySelector('#contact-email').value.trim();
    const subject = form.querySelector('#contact-subject').value;
    const message = form.querySelector('#contact-message').value.trim();

    // Validación básica
    if (!name || !email || !subject || !message) {
      showStatus('Por favor completa todos los campos, mortal.', 'error');
      return;
    }

    // Validar formato de email con regex simple
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showStatus('El correo no tiene un formato válido.', 'error');
      return;
    }

    /* ── Envío ───────────────────────────────────────────────────
       📝 OPCIONES DE ENVÍO:

       OPCIÓN A — Formspree (más fácil, gratis hasta 50 envíos/mes):
       1. Ve a formspree.io y crea una cuenta
       2. Crea un nuevo form, copia el endpoint (algo como: https://formspree.io/f/xyzabc)
       3. Cambia el action del <form> en index.html por ese URL
       4. Descomenta el bloque "FORMSPREE" de abajo y comenta el bloque "SIMULACIÓN"

       OPCIÓN B — EmailJS (sin backend, gratis hasta 200 emails/mes):
       1. Ve a emailjs.com y crea cuenta
       2. Instala: <script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js">
       3. Descomenta el bloque "EMAILJS" de abajo

       OPCIÓN C — Netlify Forms (si hosteas en Netlify):
       · Solo añade data-netlify="true" al <form> en el HTML
       · Netlify lo captura automáticamente
    */

    // Deshabilitar el botón durante el envío
    const submitBtn = form.querySelector('.btn-submit');
    submitBtn.disabled = true;
    submitBtn.querySelector('.btn-submit-text').textContent = 'Invocando...';

    try {

      /* ── SIMULACIÓN (por defecto — elimina esto cuando configures envío real) ── */
      await simulateDelay(1500); // Simular espera de red
      showStatus(
        `✦ Mensaje recibido por el cosmos, ${name}. Responderé en 48 horas lunares.`,
        'success'
      );
      form.reset();
      /* ── FIN SIMULACIÓN ── */


      /* ── FORMSPREE (descomenta esto si usas Formspree) ─────────
      const response = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      });

      if (response.ok) {
        showStatus(`✦ Mensaje enviado, ${name}. Te responderé pronto.`, 'success');
        form.reset();
      } else {
        throw new Error('Error del servidor');
      }
      ── FIN FORMSPREE ── */


      /* ── EMAILJS (descomenta esto si usas EmailJS) ─────────────
      await emailjs.send(
        'TU_SERVICE_ID',    // Del dashboard de EmailJS
        'TU_TEMPLATE_ID',  // Del dashboard de EmailJS
        { name, email, subject, message }
      );
      showStatus(`✦ Mensaje enviado, ${name}.`, 'success');
      form.reset();
      ── FIN EMAILJS ── */


    } catch (err) {
      console.error('[ContactForm]', err);
      showStatus('El abismo no respondió. Intenta de nuevo.', 'error');
    } finally {
      // Re-habilitar el botón siempre, éxito o error
      submitBtn.disabled = false;
      submitBtn.querySelector('.btn-submit-text').textContent = 'Invocar';
    }
  });

  /** Muestra un mensaje de estado en el formulario */
  function showStatus(message, type) {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.className = `form-status ${type}`;
    // Scroll al mensaje para que sea visible
    statusEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /** Simula un delay de red para la demo */
  function simulateDelay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}


/* ══════════════════════════════════════════════════════════════
   UTILIDADES VARIAS
   ══════════════════════════════════════════════════════════════ */

/**
 * Lerp (interpolación lineal) — función auxiliar.
 * Útil para movimientos suaves.
 * @param {number} start - Valor inicial
 * @param {number} end   - Valor objetivo
 * @param {number} t     - Factor [0, 1] (0 = start, 1 = end)
 */
function lerp(start, end, t) {
  return start + (end - start) * t;
}

/**
 * Clamp: restringe un valor a un rango.
 * @param {number} val - Valor a restringir
 * @param {number} min - Mínimo
 * @param {number} max - Máximo
 */
function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}
