/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║   THREE-SCENE.JS — Escena 3D de fondo con Three.js         ║
 * ║   Artista: GRANATTE                                          ║
 * ╠══════════════════════════════════════════════════════════════╣
 * ║  QUÉ HACE:                                                  ║
 * ║  · Renderiza un fondo 3D interactivo con partículas         ║
 * ║  · Capa 1: Campo estelar (puntos blancos lejanos)           ║
 * ║  · Capa 2: Partículas oceánicas (puntos cian flotantes)     ║
 * ║  · Capa 3: Olas de profundidad (malla de geometría sinuosa) ║
 * ║  · Todo reacciona al movimiento del mouse (parallax suave)  ║
 * ║                                                              ║
 * ║  📝 EDITAR:                                                 ║
 * ║  · Busca los bloques CONFIG para cambiar colores/cantidad   ║
 * ║  · STAR_COUNT: cantidad de estrellas                        ║
 * ║  · OCEAN_PARTICLE_COUNT: partículas de océano               ║
 * ║  · WAVE_AMPLITUDE: altura de las olas                       ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

/* ────────────────────────────────────────────────────────────────
   GUARDIA: Si Three.js no cargó (sin internet), salir sin romper.
   ──────────────────────────────────────────────────────────────── */
if (typeof THREE === 'undefined') {
  console.warn('[three-scene] Three.js no disponible. Fondo estático.');
} else {
  initThreeScene();
}

function initThreeScene() {

  /* ══════════════════════════════════════════════════════════════
     CONFIGURACIÓN CENTRAL
     📝 EDITAR estos valores para ajustar el comportamiento visual.
     ══════════════════════════════════════════════════════════════ */
  const CONFIG = {
    // ── Estrellas ──
    STAR_COUNT: 2000,           // Cantidad de estrellas (+ = más denso, más lento)
    STAR_SIZE: 0.8,             // Tamaño base de las estrellas
    STAR_COLOR: 0xd4bbff,       // Color base de las estrellas (hex, morado claro)
    STAR_SPREAD: 800,           // Área de distribución en el espacio 3D

    // ── Partículas oceánicas ──
    OCEAN_PARTICLE_COUNT: 600,  // Cantidad de partículas del océano
    OCEAN_SIZE: 1.5,            // Tamaño de cada partícula oceánica
    OCEAN_COLOR: 0x22d3ee,      // Color del océano (cian) — hex
    OCEAN_SPREAD_X: 400,        // Dispersión horizontal de partículas
    OCEAN_SPREAD_Y: 200,        // Dispersión vertical
    OCEAN_SPREAD_Z: 100,        // Profundidad de dispersión

    // ── Malla de olas (grilla 3D ondulada) ──
    WAVE_SEGMENTS: 80,          // Subdivisiones de la grilla (+ = más suave, más lento)
    WAVE_WIDTH: 600,            // Ancho de la superficie de olas
    WAVE_HEIGHT: 400,           // Alto de la superficie de olas
    WAVE_AMPLITUDE: 15,         // Altura de las olas (en unidades 3D)
    WAVE_FREQUENCY: 0.008,      // Frecuencia espacial de las olas
    WAVE_SPEED: 0.0008,         // Velocidad de animación de las olas
    WAVE_COLOR: 0x1a0a4a,       // Color de la malla de olas (azul muy oscuro)

    // ── Reacción al mouse ──
    MOUSE_PARALLAX_STRENGTH: 0.0015, // Fuerza del efecto parallax (0 = sin efecto)

    // ── Fog (niebla 3D) ──
    FOG_COLOR: 0x08081a,        // Color de la niebla (mismo que bg del CSS)
    FOG_NEAR: 200,              // Distancia donde empieza la niebla
    FOG_FAR: 800,               // Distancia donde todo es niebla
  };

  /* ══════════════════════════════════════════════════════════════
     SETUP DE THREE.JS
     Renderer → Scene → Camera → Fog
     ══════════════════════════════════════════════════════════════ */

  // Obtener el canvas del HTML
  const canvas = document.getElementById('bg-canvas');

  // Renderer WebGL: antialiasing activado para bordes suaves
  // alpha: true → fondo transparente para que se vea el CSS detrás
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  });

  renderer.setSize(window.innerWidth, window.innerHeight);
  // setPixelRatio limita a 2 para no matar la GPU en pantallas retina
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  // No limpiar el canvas en cada frame (alpha=true lo maneja)
  renderer.autoClearColor = false;

  // La escena: el "mundo" 3D
  const scene = new THREE.Scene();

  // Niebla exponencial: los objetos lejanos se desvanecen gradualmente
  // FogExp2 tiene un falloff más natural que Fog lineal para espacios abiertos
  scene.fog = new THREE.FogExp2(CONFIG.FOG_COLOR, 0.002);

  // Cámara perspectiva
  // Parámetros: FOV (campo visual), aspect ratio, near clip, far clip
  const camera = new THREE.PerspectiveCamera(
    75,                                      // FOV: 75° — se siente amplio
    window.innerWidth / window.innerHeight,  // Aspect ratio dinámico
    0.1,                                     // Near clip: nada muy cerca
    1000                                     // Far clip: nada muy lejos
  );
  camera.position.z = 150; // La cámara mira hacia -Z (hacia la escena)

  /* ══════════════════════════════════════════════════════════════
     CAPA 1: CAMPO ESTELAR (Stars)
     Técnica: BufferGeometry con atributo de posición aleatorio.
     Es la forma más eficiente de muchos puntos en Three.js.
     ══════════════════════════════════════════════════════════════ */
  function createStarfield() {
    // Float32Array: array de floats (x, y, z por cada estrella)
    const positions = new Float32Array(CONFIG.STAR_COUNT * 3);

    for (let i = 0; i < CONFIG.STAR_COUNT; i++) {
      const i3 = i * 3; // Índice de los 3 componentes (x=i3, y=i3+1, z=i3+2)
      positions[i3]     = (Math.random() - 0.5) * CONFIG.STAR_SPREAD;
      positions[i3 + 1] = (Math.random() - 0.5) * CONFIG.STAR_SPREAD;
      positions[i3 + 2] = (Math.random() - 0.5) * CONFIG.STAR_SPREAD;
    }

    const geometry = new THREE.BufferGeometry();
    // itemSize=3 porque cada vértice tiene x, y, z
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: CONFIG.STAR_COLOR,
      size: CONFIG.STAR_SIZE,
      // sizeAttenuation: true hace que las partículas más lejanas sean más pequeñas
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.7,
    });

    const stars = new THREE.Points(geometry, material);
    scene.add(stars);
    return stars;
  }

  /* ══════════════════════════════════════════════════════════════
     CAPA 2: PARTÍCULAS OCEÁNICAS
     Partículas de mayor tamaño que flotan y brillan.
     Tienen dos colores: cian (superficie) y violeta (profundidad).
     ══════════════════════════════════════════════════════════════ */
  function createOceanParticles() {
    const positions = new Float32Array(CONFIG.OCEAN_PARTICLE_COUNT * 3);
    // Array de colores: un RGB por vértice (permite gradiente de color)
    const colors = new Float32Array(CONFIG.OCEAN_PARTICLE_COUNT * 3);

    // Color cian para partículas altas (superficie)
    const colorSurface = new THREE.Color(CONFIG.OCEAN_COLOR);
    // Color violeta para partículas bajas (profundidad)
    const colorDeep = new THREE.Color(0x6b21d6);

    for (let i = 0; i < CONFIG.OCEAN_PARTICLE_COUNT; i++) {
      const i3 = i * 3;

      positions[i3]     = (Math.random() - 0.5) * CONFIG.OCEAN_SPREAD_X;
      positions[i3 + 1] = (Math.random() - 0.5) * CONFIG.OCEAN_SPREAD_Y;
      positions[i3 + 2] = (Math.random() - 0.8) * CONFIG.OCEAN_SPREAD_Z;

      // Interpolación de color por profundidad (y):
      // Más arriba (y positivo) → más cian; más abajo → más violeta
      const t = (positions[i3 + 1] / CONFIG.OCEAN_SPREAD_Y) * 0.5 + 0.5;
      const mixColor = colorSurface.clone().lerp(colorDeep, 1 - t);

      colors[i3]     = mixColor.r;
      colors[i3 + 1] = mixColor.g;
      colors[i3 + 2] = mixColor.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    // vertexColors: true activa los colores por vértice
    // Si no lo pones, ignora el atributo 'color' y usa el color plano del material

    const material = new THREE.PointsMaterial({
      size: CONFIG.OCEAN_SIZE,
      sizeAttenuation: true,
      vertexColors: true,    // Usar el atributo 'color' del geometry
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending, // Blending aditivo = brillo bioluminiscente
      depthWrite: false,     // Necesario con blending aditivo para transparencias
    });

    const particles = new THREE.Points(geometry, material);
    // Posicionar las partículas un poco detrás de la cámara
    particles.position.z = -20;
    scene.add(particles);
    return particles;
  }

  /* ══════════════════════════════════════════════════════════════
     CAPA 3: MALLA DE OLAS (Wave Mesh)
     PlaneGeometry subdividida. En cada frame los vértices
     se mueven en Y con funciones sinusoidales para simular olas.
     ══════════════════════════════════════════════════════════════ */
  function createWaveMesh() {
    // PlaneGeometry: un rectángulo subdividido en WAVE_SEGMENTS × WAVE_SEGMENTS vértices
    const geometry = new THREE.PlaneGeometry(
      CONFIG.WAVE_WIDTH,
      CONFIG.WAVE_HEIGHT,
      CONFIG.WAVE_SEGMENTS,
      CONFIG.WAVE_SEGMENTS
    );

    // Rotamos el plano en X para que quede horizontal (mira hacia arriba)
    geometry.rotateX(-Math.PI / 2);

    // MeshBasicMaterial no necesita luces, perfecto para un fondo
    const material = new THREE.MeshBasicMaterial({
      color: CONFIG.WAVE_COLOR,
      wireframe: true,         // Modo wireframe: solo muestra las aristas de la malla
      transparent: true,
      opacity: 0.25,           // 📝 EDITAR: sube para malla más visible (0.0–0.5)
    });

    const mesh = new THREE.Mesh(geometry, material);
    // Posicionar la malla bajo la cámara
    mesh.position.y = -80;
    mesh.position.z = -50;
    scene.add(mesh);

    // Guardamos la referencia al array de posiciones de los vértices
    // para modificarlos en cada frame de la animación
    const positionAttribute = geometry.attributes.position;

    return { mesh, positionAttribute };
  }

  /* ══════════════════════════════════════════════════════════════
     TRACKING DEL MOUSE
     Guardamos la posición normalizada del mouse (-1 a +1)
     para el efecto parallax.
     ══════════════════════════════════════════════════════════════ */
  const mouse = { x: 0, y: 0 };      // Posición actual del mouse
  const target = { x: 0, y: 0 };     // Posición objetivo (lerp suave)

  document.addEventListener('mousemove', (e) => {
    // Normalizar a -1 / +1:
    // e.clientX / width da 0–1, luego * 2 - 1 da -1 a +1
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  });

  /* ══════════════════════════════════════════════════════════════
     RESIZE HANDLER
     Actualiza renderer y cámara cuando cambia el tamaño de ventana.
     ══════════════════════════════════════════════════════════════ */
  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    // updateProjectionMatrix() DEBE llamarse después de cambiar aspect
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener('resize', onResize);

  /* ══════════════════════════════════════════════════════════════
     CONSTRUIR LA ESCENA
     ══════════════════════════════════════════════════════════════ */
  const stars = createStarfield();
  const oceanParticles = createOceanParticles();
  const { mesh: waveMesh, positionAttribute: wavePositions } = createWaveMesh();

  /* ══════════════════════════════════════════════════════════════
     LOOP DE ANIMACIÓN
     requestAnimationFrame mantiene el loop sincronizado con el
     refresh del monitor (60fps o más). NUNCA usar setInterval.
     ══════════════════════════════════════════════════════════════ */
  let clock = 0; // Contador de tiempo manual (alternativa a THREE.Clock)

  function animate() {
    // Solicita el siguiente frame — el browser llama a animate() en el
    // próximo ciclo de render, manteniéndolo sincronizado con 60fps
    requestAnimationFrame(animate);

    clock += CONFIG.WAVE_SPEED * 60; // Escalar para que sea consistente entre FPS

    /* ── Animación de la malla de olas ──────────────────────────
       Recorremos cada vértice y modificamos su componente Y (arriba/abajo)
       con una función sinusoidal que depende de X, Z y el tiempo (clock).
       Esto crea la ilusión de olas en movimiento.
    */
    const positions = wavePositions.array;
    // El PlaneGeometry tiene (WAVE_SEGMENTS+1)² vértices
    const vertexCount = positions.length / 3;

    for (let i = 0; i < vertexCount; i++) {
      const x = positions[i * 3];       // Coordenada X original
      const z = positions[i * 3 + 2];   // Coordenada Z original

      // Superposición de dos sinusoides con diferente frecuencia y fase
      // para una ola más orgánica (no perfectamente regular):
      positions[i * 3 + 1] =
        Math.sin(x * CONFIG.WAVE_FREQUENCY + clock) * CONFIG.WAVE_AMPLITUDE +
        Math.sin(z * CONFIG.WAVE_FREQUENCY * 0.7 + clock * 0.8) * CONFIG.WAVE_AMPLITUDE * 0.5;
    }
    // needsUpdate = true le dice a Three.js que suba el buffer a la GPU de nuevo
    wavePositions.needsUpdate = true;

    /* ── Efecto parallax con el mouse ───────────────────────────
       Interpolación lineal (lerp) hacia la posición del mouse.
       El factor 0.05 hace que el movimiento sea suave/inercial.
       target = target + (mouse - target) * 0.05
    */
    target.x += (mouse.x - target.x) * 0.05;
    target.y += (mouse.y - target.y) * 0.05;

    // Rotar la cámara levemente según la posición del mouse
    camera.rotation.y = target.x * CONFIG.MOUSE_PARALLAX_STRENGTH * 30;
    camera.rotation.x = -target.y * CONFIG.MOUSE_PARALLAX_STRENGTH * 20;

    /* ── Rotación lenta de capas de partículas ──────────────────
       Las estrellas y partículas rotan en ejes distintos para
       crear sensación de profundidad y movimiento 3D.
    */
    stars.rotation.y += 0.00008;        // Rotación muy lenta del campo estelar
    stars.rotation.x += 0.000025;

    oceanParticles.rotation.y -= 0.0001; // Las partículas oceánicas van en sentido contrario
    // Flotación vertical de las partículas oceánicas
    oceanParticles.position.y = Math.sin(clock * 0.3) * 5;

    /* ── Render final ───────────────────────────────────────────
       renderer.render(scene, camera) dibuja la escena en el canvas.
       Esto se llama ~60 veces por segundo.
    */
    renderer.render(scene, camera);
  }

  // Iniciar el loop
  animate();

  /* ══════════════════════════════════════════════════════════════
     EXPOSICIÓN GLOBAL (para debug desde la consola del browser)
     Accede con: window.threeScene.camera.position.z = 200
     ══════════════════════════════════════════════════════════════ */
  window.threeScene = { scene, camera, renderer, stars, oceanParticles, waveMesh };

} // fin initThreeScene()
