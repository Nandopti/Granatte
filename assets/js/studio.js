/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║   STUDIO.JS — Lógica del Creador Musical                   ║
 * ╠══════════════════════════════════════════════════════════════╣
 * ║  MÓDULOS:                                                   ║
 * ║  1. CONFIG & DATOS (escalas, patrones, colores)             ║
 * ║  2. Estado global                                           ║
 * ║  3. Inicialización del audio (Tone.js)                      ║
 * ║  4. Secuenciador de batería                                 ║
 * ║  5. Piano mágico de acordes                                 ║
 * ║  6. Seguimiento de manos (MediaPipe)                        ║
 * ║  7. Grabación y descarga MP3 (lamejs)                       ║
 * ║  8. Mezclador de volumen                                    ║
 * ║  9. Pantalla de bienvenida                                  ║
 * ║  10. Controles de transporte (play/stop/BPM)                ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

/* ══════════════════════════════════════════════════════════════
   1. CONFIG & DATOS
   📝 EDITAR estas secciones para cambiar sonidos, colores y acordes
   ══════════════════════════════════════════════════════════════ */

/** Número de pasos del secuenciador (no cambiar sin ajustar el HTML) */
const STEPS = 16;

/** Número de filas de instrumentos */
const ROWS = 6;

/**
 * PATRONES DE BAJO
 * Cada patrón es un array de 16 booleanos (uno por paso del secuenciador).
 * true  = el bajo toca en ese paso (siempre que el usuario sostenga un acorde)
 * false = silencio en ese paso
 *
 * Recuerda: 16 pasos = 1 compás de 4 tiempos a subdivisión de semicorchea.
 * Grupos de 4: [1,2,3,4] [5,6,7,8] [9,10,11,12] [13,14,15,16]
 * Los tiempos fuertes son los pasos 0, 4, 8 y 12.
 *
 * 📝 EDITAR: cambia los true/false para crear tus propios patrones de bajo.
 */
const BASS_PATTERNS = {
  // Raíz: un golpe en cada tiempo fuerte (pulso clásico)
  root: [
    true, false,false,false,
    true, false,false,false,
    true, false,false,false,
    true, false,false,false,
  ],
  // Corcheas: un golpe cada dos pasos (doble densidad)
  eighth: [
    true, false,true, false,
    true, false,true, false,
    true, false,true, false,
    true, false,true, false,
  ],
  // Sincopado: contratiempos (entre los tiempos fuertes)
  synco: [
    false,false,true, false,
    false,false,true, false,
    false,true, false,false,
    true, false,false,true,
  ],
};

/**
 * DEFINICIÓN DE INSTRUMENTOS
 * Cada instrumento tiene:
 * · name: identificador (debe coincidir con data-instrument del HTML)
 * · color: color de los pasos activos (hex)
 * · synth: función que devuelve el sintetizador Tone.js a usar
 *   Se llama lazy (solo cuando se inicializa el audio)
 *
 * 📝 EDITAR: Cambia los colores o ajusta los parámetros del synth
 */
const INSTRUMENTS_CONFIG = [
  { name: 'kick',   color: '#7c3aed', label: 'Bombo' },
  { name: 'snare',  color: '#1d4ed8', label: 'Caja' },
  { name: 'hihat-c',color: '#0f766e', label: 'Hi-hat' },
  { name: 'hihat-o',color: '#0369a1', label: 'Hi-hat+' },
  { name: 'clap',   color: '#9f1239', label: 'Palmas' },
  { name: 'crash',  color: '#78350f', label: 'Crash' },
];

/**
 * ESCALAS MUSICALES
 * Cada escala define 8 acordes para las teclas del piano.
 * Formato de cada acorde:
 * · name:    nombre musical (Am, C, F#m, etc.)
 * · notes:   array de notas en notación científica (C4 = Do central)
 * · emotion: descripción poética para el usuario
 * · color:   color de la tecla (hex)
 *
 * 📝 EDITAR: Añade tus propias escalas copiando la estructura.
 * Las notas en Tone.js usan la notación "Nota + Octava": C4, D#3, Gb5, etc.
 */
const SCALES = {

  mystic: {
    label: 'Mística',
    chords: [
      { name: 'Am',  notes: ['A3','C4','E4','A4'],       emotion: 'Misterio',   color: '#6b21a8' },
      { name: 'F',   notes: ['F3','A3','C4','F4'],        emotion: 'Esperanza',  color: '#1d4ed8' },
      { name: 'C',   notes: ['C3','E3','G3','C4'],        emotion: 'Claridad',   color: '#0f766e' },
      { name: 'G',   notes: ['G3','B3','D4','G4'],        emotion: 'Camino',     color: '#0369a1' },
      { name: 'Em',  notes: ['E3','G3','B3','E4'],        emotion: 'Melancolía', color: '#7f1d1d' },
      { name: 'Dm',  notes: ['D3','F3','A3','D4'],        emotion: 'Nostalgia',  color: '#78350f' },
      { name: 'E7',  notes: ['E3','G#3','B3','D4'],       emotion: 'Tensión',    color: '#4a1d96' },
      { name: 'Am7', notes: ['A3','C4','E4','G4'],        emotion: 'Profundidad',color: '#1e3a5f' },
    ]
  },

  ocean: {
    label: 'Oceánica',
    chords: [
      { name: 'Dm',  notes: ['D3','F3','A3','D4'],        emotion: 'Marea',      color: '#0369a1' },
      { name: 'Am',  notes: ['A3','C4','E4','A4'],        emotion: 'Corriente',  color: '#0f766e' },
      { name: 'Bb',  notes: ['Bb3','D4','F4','Bb4'],      emotion: 'Profundo',   color: '#075985' },
      { name: 'F',   notes: ['F3','A3','C4','F4'],        emotion: 'Superficie', color: '#164e63' },
      { name: 'Gm',  notes: ['G3','Bb3','D4','G4'],       emotion: 'Abismo',     color: '#1e3a5f' },
      { name: 'C',   notes: ['C3','E3','G3','C4'],        emotion: 'Calma',      color: '#0c4a6e' },
      { name: 'A7',  notes: ['A3','C#4','E4','G4'],       emotion: 'Tormenta',   color: '#1d4ed8' },
      { name: 'Dm7', notes: ['D3','F3','A3','C4'],        emotion: 'Sirena',     color: '#0369a1' },
    ]
  },

  witch: {
    label: 'Bruja',
    chords: [
      { name: 'Bm',  notes: ['B3','D4','F#4','B4'],       emotion: 'Hechizo',    color: '#701a75' },
      { name: 'G',   notes: ['G3','B3','D4','G4'],        emotion: 'Ritual',     color: '#500724' },
      { name: 'D',   notes: ['D3','F#3','A3','D4'],       emotion: 'Luna',       color: '#581c87' },
      { name: 'A',   notes: ['A3','C#4','E4','A4'],       emotion: 'Invocación', color: '#4a1d96' },
      { name: 'F#m', notes: ['F#3','A3','C#4','F#4'],     emotion: 'Sombra',     color: '#7f1d1d' },
      { name: 'Em',  notes: ['E3','G3','B3','E4'],        emotion: 'Umbral',     color: '#422006' },
      { name: 'C#m', notes: ['C#3','E3','G#3','C#4'],     emotion: 'Destino',    color: '#1e1b4b' },
      { name: 'F#7', notes: ['F#3','A#3','C#4','E4'],     emotion: 'Caos',       color: '#831843' },
    ]
  },

  stars: {
    label: 'Estelar',
    chords: [
      { name: 'C',   notes: ['C4','E4','G4','C5'],        emotion: 'Zenith',     color: '#d97706' },
      { name: 'G',   notes: ['G3','B3','D4','G4'],        emotion: 'Cosmos',     color: '#b45309' },
      { name: 'Am',  notes: ['A3','C4','E4','A4'],        emotion: 'Constelación',color:'#92400e' },
      { name: 'Em',  notes: ['E3','G3','B3','E4'],        emotion: 'Nebulosa',   color: '#78350f' },
      { name: 'F',   notes: ['F3','A3','C4','F4'],        emotion: 'Eclipse',    color: '#6b3f04' },
      { name: 'Fm',  notes: ['F3','Ab3','C4','F4'],       emotion: 'Cometa',     color: '#422006' },
      { name: 'Cmaj7',notes:['C4','E4','G4','B4'],        emotion: 'Eternidad',  color: '#fbbf24' },
      { name: 'Am9', notes: ['A3','C4','E4','G4','B4'],   emotion: 'Infinito',   color: '#f59e0b' },
    ]
  },
};

/**
 * PATRONES DE BATERÍA PREESTABLECIDOS
 * Cada patrón es un array de 6 filas × 16 columnas (boolean).
 * Orden de filas: kick, snare, hihat-c, hihat-o, clap, crash
 *
 * 📝 EDITAR: Cambia los 1/0 para crear tus propios patrones.
 * 1 = paso activo, 0 = paso inactivo
 * Los 16 elementos corresponden a los 16 pasos del compás.
 */
const PRESETS = {
  empty: [
    [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
    [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
    [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
    [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
    [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
    [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
  ],
  basic: [
    //kick: tiempo 1 y 3 (pasos 0 y 8)
    [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
    //snare: tiempo 2 y 4 (pasos 4 y 12)
    [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
    //hihat-c: cada corchea (cada 2 pasos)
    [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
    //hihat-o: silencioso
    [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
    //clap: con el snare
    [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
    //crash: solo en el primer tiempo
    [1,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
  ],
  ritual: [
    //kick: sincopado
    [1,0,0,1, 0,0,1,0, 1,0,0,0, 1,0,0,1],
    //snare
    [0,0,0,0, 1,0,0,0, 0,0,1,0, 0,0,0,0],
    //hihat-c: pattern de semicorcheas
    [1,1,0,1, 1,1,0,1, 1,1,0,1, 1,1,0,1],
    //hihat-o
    [0,0,0,0, 0,0,0,1, 0,0,0,0, 0,0,1,0],
    //clap
    [0,0,1,0, 0,1,0,0, 0,0,1,0, 0,1,0,0],
    //crash
    [1,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,1],
  ],
  ocean: [
    //kick: bajo y lento, como olas
    [1,0,0,0, 0,0,0,0, 0,1,0,0, 0,0,1,0],
    //snare
    [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
    //hihat-c: fluido
    [0,1,0,1, 0,1,0,1, 0,1,0,1, 0,1,0,1],
    //hihat-o: abierto en off-beats
    [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0],
    //clap
    [0,0,0,0, 0,0,0,1, 0,0,0,0, 0,0,0,1],
    //crash
    [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,1],
  ],
  witch: [
    //kick: irregular y pesado
    [1,0,1,0, 0,1,0,0, 1,0,0,1, 0,0,1,0],
    //snare
    [0,0,0,1, 0,0,1,0, 0,1,0,0, 1,0,0,0],
    //hihat-c
    [1,0,1,1, 0,1,1,0, 1,0,1,1, 0,1,0,1],
    //hihat-o
    [0,1,0,0, 1,0,0,1, 0,1,0,0, 0,0,1,0],
    //clap
    [0,1,0,0, 0,0,1,0, 0,0,0,1, 0,1,0,0],
    //crash
    [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
  ],
};


/* ══════════════════════════════════════════════════════════════
   2. ESTADO GLOBAL
   Todo el estado mutable de la app en un solo objeto.
   ══════════════════════════════════════════════════════════════ */
const STATE = {
  // Secuenciador
  grid: Array.from({ length: ROWS }, () => new Array(STEPS).fill(false)),
  currentStep: 0,
  isPlaying: false,
  bpm: 90,

  // Piano
  currentScale: 'mystic',
  activeChordIndex: null,
  pianoSynth: null,

  // Bajo
  bassPattern: 'root',    // patrón activo: 'root' | 'eighth' | 'synco'
  bassSynth:   null,      // sintetizador Tone.js del bajo

  // Batería: mapa nombre→canal Tone.js
  drumChannels: {},

  // Efectos
  reverb: null,
  delay: null,

  // Mezclador: mapa nombre→volumen Tone.js
  volumeNodes: {},

  // Grabación
  isRecording: false,
  recorder: null,
  recordedBlob: null,

  // Cámara
  cameraActive: false,
  lastHandAction: 0,

  // Flags
  audioInitialized: false,
};


/* ══════════════════════════════════════════════════════════════
   3. INICIALIZACIÓN DEL AUDIO (Tone.js)
   El audio en browsers modernos requiere un gesto del usuario
   antes de poder iniciarse. Llamamos a Tone.start() en el primer
   click/keydown del usuario.
   ══════════════════════════════════════════════════════════════ */

/**
 * Inicializa todos los componentes de audio.
 * DEBE llamarse después de un gesto del usuario (click, keypress).
 * Tone.start() desbloquea el AudioContext del browser.
 */
async function initAudio() {
  if (STATE.audioInitialized) return;

  try {
    // Desbloquear el AudioContext (requerido por el browser)
    await Tone.start();
    console.log('[Audio] AudioContext iniciado:', Tone.context.state);

    // Crear efectos globales compartidos
    STATE.reverb = new Tone.Reverb({
      decay: 3,           // Tiempo de decaimiento en segundos
      preDelay: 0.01,
      wet: 0.3,           // Mix wet/dry (0 = seco, 1 = todo reverb)
    }).toDestination();
    await STATE.reverb.generate(); // Los reverbs necesitan pre-generación

    STATE.delay = new Tone.FeedbackDelay({
      delayTime: '8n',    // Delay de 1/8 de compás (se sincroniza con BPM)
      feedback: 0.3,
      wet: 0.1,
    }).toDestination();

    // Conectar efectos en cadena: delay → reverb → speakers
    STATE.delay.connect(STATE.reverb);

    // Inicializar batería, piano y mezclador
    createDrumKit();
    createPianoSynth();
    createBassSynth();   // ← bajo nuevo
    initMixer();
    initBassControls();  // ← selector de patrón del bajo

    // Configurar el secuenciador de Tone.js
    initToneSequencer();

    STATE.audioInitialized = true;
    setStatus('Audio inicializado ✦ Todo listo');
    console.log('[Audio] Todos los componentes creados');

  } catch (err) {
    console.error('[Audio] Error al inicializar:', err);
    setStatus('Error de audio. Revisa los permisos del navegador.');
  }
}

/**
 * Crea todos los sintetizadores de la batería.
 *
 * TÉCNICA: Cada instrumento usa un sintetizador diferente de Tone.js.
 * · MembraneSynth: oscilador de membrana (perfecto para bombos/cajas)
 * · MetalSynth:    síntesis FM metálica (hi-hats, cymbals)
 * · NoiseSynth:    ruido blanco con envelope (palmas, snares)
 *
 * Cada synth tiene un nodo de volumen (Tone.Volume) para el mezclador.
 * La cadena es: Synth → Volume → Effects → Destination
 */
function createDrumKit() {
  // ── BOMBO ──────────────────────────────────────────────────
  // MembraneSynth simula la membrana de un bombo con un oscilador
  // que baja rápidamente de frecuencia (pitchDecay).
  const kickVol = new Tone.Volume(-6).connect(STATE.reverb);
  STATE.volumeNodes['kick'] = kickVol;
  STATE.drumChannels['kick'] = new Tone.MembraneSynth({
    pitchDecay:  0.08,    // Cuánto dura el "tum" antes de bajar
    octaves:     8,       // Rango de bajada de frecuencia
    envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.1 },
  }).connect(kickVol);

  // ── CAJA ───────────────────────────────────────────────────
  // NoiseSynth con filtro HP genera el "crack" de la caja.
  const snareVol = new Tone.Volume(-10).connect(STATE.reverb);
  STATE.volumeNodes['snare'] = snareVol;
  STATE.drumChannels['snare'] = new Tone.NoiseSynth({
    noise: { type: 'white' },  // Ruido blanco = espectro completo
    envelope: { attack: 0.001, decay: 0.18, sustain: 0, release: 0.05 },
  }).connect(new Tone.Filter(800, 'highpass').connect(snareVol));
  // El filtro HP corta las frecuencias bajas, dejando el tono crepitante

  // ── HI-HAT CERRADO ─────────────────────────────────────────
  // MetalSynth con decay muy corto para el "tick" metálico cerrado.
  const hihatCVol = new Tone.Volume(-14).connect(STATE.delay);
  STATE.volumeNodes['hihat-c'] = hihatCVol;
  STATE.drumChannels['hihat-c'] = new Tone.MetalSynth({
    frequency: 400,
    envelope:  { attack: 0.001, decay: 0.04, release: 0.01 },
    harmonicity: 5.1,
    modulationIndex: 32,
    resonance: 4000,
    octaves: 1.5,
  }).connect(hihatCVol);

  // ── HI-HAT ABIERTO ─────────────────────────────────────────
  // Igual que el cerrado pero con decay largo (el "shhhh" abierto).
  const hihatOVol = new Tone.Volume(-18).connect(STATE.delay);
  STATE.volumeNodes['hihat-o'] = hihatOVol;
  STATE.drumChannels['hihat-o'] = new Tone.MetalSynth({
    frequency: 400,
    envelope:  { attack: 0.001, decay: 0.5, release: 0.3 }, // Más largo que cerrado
    harmonicity: 5.1,
    modulationIndex: 32,
    resonance: 4000,
    octaves: 1.5,
  }).connect(hihatOVol);

  // ── PALMAS (CLAP) ───────────────────────────────────────────
  // NoiseSynth con múltiples transientes simulando la "textura" de palmas.
  const clapVol = new Tone.Volume(-12).connect(STATE.reverb);
  STATE.volumeNodes['clap'] = clapVol;
  STATE.drumChannels['clap'] = new Tone.NoiseSynth({
    noise: { type: 'pink' },   // Ruido rosa = más cálido que blanco
    envelope: { attack: 0.005, decay: 0.1, sustain: 0, release: 0.05 },
  }).connect(new Tone.Filter(500, 'bandpass').connect(clapVol));

  // ── CRASH ───────────────────────────────────────────────────
  // MetalSynth con decay muy largo para el platillo de crash.
  const crashVol = new Tone.Volume(-20).connect(STATE.reverb);
  STATE.volumeNodes['crash'] = crashVol;
  STATE.drumChannels['crash'] = new Tone.MetalSynth({
    frequency: 300,
    envelope:  { attack: 0.001, decay: 1.5, release: 0.8 }, // Muy largo
    harmonicity: 3.1,
    modulationIndex: 40,
    resonance: 3000,
    octaves: 2,
  }).connect(crashVol);

  console.log('[Audio] Batería creada:', Object.keys(STATE.drumChannels));
}

/**
 * Crea el sintetizador del piano mágico.
 * PolySynth permite tocar múltiples notas simultáneamente (acordes).
 * Usamos un oscilador de triángulo + suave para sonido etéreo.
 */
function createPianoSynth() {
  const pianoVol = new Tone.Volume(-8).connect(STATE.reverb);
  STATE.volumeNodes['piano'] = pianoVol;

  // PolySynth: varios synths de voz en paralelo para poliofonía
  STATE.pianoSynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: {
      type: 'triangle8',  // Triángulo con 8 armónicos → suave y etéreo
    },
    envelope: {
      attack:  0.02,
      decay:   1.5,
      sustain: 0.3,
      release: 2.5,       // Release largo → notas se desvanecen suavemente
    },
  }).connect(pianoVol);

  // Añadir una pequeña distorsión para dar carácter
  // (conecta el piano también al delay para el eco)
  STATE.pianoSynth.connect(STATE.delay);

  console.log('[Audio] Piano creado');
}

/**
 * Crea el sintetizador del bajo.
 *
 * Usamos un Synth mono (no PolySynth) porque el bajo toca
 * una sola nota a la vez. Oscilador de tipo 'sawtooth' (sierra)
 * para un timbre grave con armónicos, parecido a un bajo eléctrico.
 *
 * La nota que toca se calcula en triggerBass() extrayendo
 * la nota raíz del acorde activo y bajándola una octava.
 */
function createBassSynth() {
  // Nodo de volumen para el mezclador
  const bassVol = new Tone.Volume(-10).connect(STATE.reverb);
  STATE.volumeNodes['bass'] = bassVol;

  STATE.bassSynth = new Tone.Synth({
    oscillator: {
      type: 'sawtooth4', // Sierra con 4 armónicos → grave y presente
    },
    envelope: {
      attack:  0.01,   // Ataque rápido para el "golpe" del bajo
      decay:   0.3,    // Caída media
      sustain: 0.6,    // Sostén relativamente alto
      release: 0.8,    // Release un poco largo para que no corte bruscamente
    },
  }).connect(bassVol);

  // También conectar al delay para que el bajo tenga eco si está activado
  STATE.bassSynth.connect(STATE.delay);

  console.log('[Audio] Bajo creado');
}

/**
 * Extrae la nota raíz del acorde activo y la transporta una octava abajo.
 *
 * CÓMO FUNCIONA EL TRANSPORTE DE OCTAVA:
 * Las notas en Tone.js tienen formato "NotaOctava" (ej: "B3", "G4").
 * El número al final es la octava. Para bajar una octava, restamos 1.
 * Ejemplos: "B3" → "B2", "G4" → "G3", "D3" → "D2"
 *
 * @param {number} chordIndex - Índice del acorde en la escala actual
 * @returns {string|null} nota raíz transpuesta, o null si no hay acorde
 */
function getBassNote(chordIndex) {
  if (chordIndex === null) return null;

  const scale = SCALES[STATE.currentScale];
  if (!scale || !scale.chords[chordIndex]) return null;

  const chord = scale.chords[chordIndex];
  // La nota raíz es siempre la primera del array de notas del acorde
  const rootNote = chord.notes[0]; // ej: "B3", "G3", "D3"

  // Separar la letra de la nota (puede tener # o b) del número de octava
  // Regex: todo excepto el dígito final = nombre, dígito final = octava
  const match = rootNote.match(/^([A-G][#b]?)(\d)$/);
  if (!match) return rootNote; // fallback: devolver sin cambiar

  const noteName = match[1]; // ej: "B", "G#", "Db"
  const octave   = parseInt(match[2]) - 1; // bajar una octava

  // No bajar por debajo de la octava 1 (notas muy graves inaudibles)
  const finalOctave = Math.max(1, octave);

  return `${noteName}${finalOctave}`; // ej: "B2", "G2"
}

/**
 * Dispara el bajo en el tiempo dado si:
 * 1. El usuario está sosteniendo una tecla del piano (activeChordIndex !== null)
 * 2. El paso actual corresponde al patrón de bajo seleccionado
 *
 * @param {number} step - Paso actual del secuenciador (0-15)
 * @param {number} time - Tiempo de audio de Tone.js
 */
function triggerBass(step, time) {
  // Condición 1: el usuario debe estar sosteniendo una tecla
  if (STATE.activeChordIndex === null) return;

  // Condición 2: el patrón de bajo debe estar activo en este paso
  const pattern = BASS_PATTERNS[STATE.bassPattern];
  if (!pattern || !pattern[step]) return;

  // Obtener la nota raíz una octava abajo
  const note = getBassNote(STATE.activeChordIndex);
  if (!note || !STATE.bassSynth) return;

  try {
    // '8n' = duración de corchea para la mayoría de patrones
    // Para el patrón sincopado también funciona bien
    STATE.bassSynth.triggerAttackRelease(note, '8n', time);
  } catch (e) {
    console.debug('[Bajo] triggerError (no crítico):', e.message);
  }
}

/**
 * Inicializa los botones del selector de patrón del bajo.
 * Usamos event delegation: un listener por botón (solo son 3).
 */
function initBassControls() {
  document.querySelectorAll('.bass-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      // Actualizar estado visual
      document.querySelectorAll('.bass-btn').forEach((b) => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');

      // Actualizar el patrón en el estado global
      STATE.bassPattern = btn.dataset.bass;
      setStatus(`Bajo: patrón "${btn.textContent}" activado`);
    });
  });
}

/**
 * Configura el secuenciador de Tone.js.
 * Tone.Sequence crea un callback que se llama en cada subdivisión del tempo.
 *
 * La resolución es '16n' (semicorcheas = 16 pasos por compás).
 */
function initToneSequencer() {
  // Tone.Sequence llama a su callback en cada paso del loop
  const seq = new Tone.Sequence(
    (time, step) => {
      STATE.currentStep = step;

      // Para cada fila, disparar el instrumento si el paso está activo
      STATE.grid.forEach((row, rowIndex) => {
        if (row[step]) {
          const instrument = INSTRUMENTS_CONFIG[rowIndex].name;
          triggerDrum(instrument, time);
        }
      });

      // Disparar el bajo si el usuario tiene apretada una tecla del piano
      // y el patrón de bajo está activo en este paso.
      // triggerBass() comprueba internamente ambas condiciones.
      triggerBass(step, time);

      // Actualizar la UI en el siguiente frame de animación
      // Tone.draw sincroniza callbacks de audio con el frame del browser
      Tone.getDraw().schedule(() => {
        updateSequencerUI(step);
      }, time);
    },
    Array.from({ length: STEPS }, (_, i) => i), // Valores pasados al callback
    '16n'  // Resolución: semicorcheas
  );

  seq.start(0); // Iniciar la secuencia desde el beat 0

  console.log('[Audio] Secuenciador Tone.js configurado');
}

/**
 * Dispara un instrumento de batería en el tiempo dado.
 * time es el tiempo de audio preciso de Tone.js (no setTimeout).
 * @param {string} instrument - Nombre del instrumento
 * @param {number} time       - Tiempo de audio de Tone.js
 */
function triggerDrum(instrument, time) {
  const synth = STATE.drumChannels[instrument];
  if (!synth) return;

  try {
    if (instrument === 'kick') {
      // El bombo necesita una nota (C1 = Do grave)
      synth.triggerAttackRelease('C1', '8n', time);
    } else if (instrument === 'crash') {
      synth.triggerAttackRelease('16n', time);
    } else if (instrument === 'hihat-o') {
      synth.triggerAttackRelease('8n', time);
    } else {
      synth.triggerAttackRelease('16n', time);
    }
  } catch (e) {
    // Algunos synths pueden lanzar error si se disparan muy rápido
    console.debug('[Drum] triggerError (no crítico):', e.message);
  }
}


/* ══════════════════════════════════════════════════════════════
   4. SECUENCIADOR DE BATERÍA — UI
   ══════════════════════════════════════════════════════════════ */

/** Genera los botones de pasos del secuenciador en el DOM */
function initSequencer() {
  const rows = document.querySelectorAll('.seq-row');

  rows.forEach((row, rowIndex) => {
    const stepsContainer = row.querySelector('.seq-steps');
    const color = INSTRUMENTS_CONFIG[rowIndex].color;
    const instrumentName = INSTRUMENTS_CONFIG[rowIndex].label;

    // Crear los 16 botones de paso
    for (let col = 0; col < STEPS; col++) {
      const btn = document.createElement('button');
      btn.className = 'seq-step';
      btn.dataset.row = rowIndex;
      btn.dataset.col = col;
      btn.setAttribute('aria-label', `${instrumentName} paso ${col + 1}`);
      btn.setAttribute('aria-pressed', 'false');
      btn.type = 'button';

      // Inyectar el color de la fila como variable CSS
      btn.style.setProperty('--step-color', color);

      // Click: toggle del paso
      btn.addEventListener('click', () => {
        toggleStep(rowIndex, col, btn);
      });

      stepsContainer.appendChild(btn);
    }
  });

  // Cargar el patrón básico al inicio
  applyPreset('basic');

  // Listeners de los botones de preset
  document.querySelectorAll('.preset-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      applyPreset(btn.dataset.preset);
    });
  });

  console.log('[Sequencer] UI inicializada');
}

/**
 * Alterna el estado de un paso del secuenciador.
 * @param {number} row - Índice de fila
 * @param {number} col - Índice de columna (paso)
 * @param {HTMLElement} btn - El botón DOM
 */
function toggleStep(row, col, btn) {
  STATE.grid[row][col] = !STATE.grid[row][col];
  const isOn = STATE.grid[row][col];
  btn.classList.toggle('is-on', isOn);
  btn.setAttribute('aria-pressed', isOn ? 'true' : 'false');

  // Preview sonoro: si el audio está listo, tocar el instrumento al activar
  if (isOn && STATE.audioInitialized) {
    triggerDrum(INSTRUMENTS_CONFIG[row].name, Tone.now());
  }
}

/**
 * Aplica un patrón de preset al grid del secuenciador.
 * @param {string} presetName - Clave en el objeto PRESETS
 */
function applyPreset(presetName) {
  const preset = PRESETS[presetName];
  if (!preset) return;

  // Actualizar el estado
  preset.forEach((rowData, rowIndex) => {
    rowData.forEach((value, colIndex) => {
      STATE.grid[rowIndex][colIndex] = Boolean(value);
    });
  });

  // Actualizar los botones del DOM
  const rows = document.querySelectorAll('.seq-row');
  rows.forEach((row, rowIndex) => {
    const steps = row.querySelectorAll('.seq-step');
    steps.forEach((step, colIndex) => {
      const isOn = STATE.grid[rowIndex][colIndex];
      step.classList.toggle('is-on', isOn);
      step.setAttribute('aria-pressed', isOn ? 'true' : 'false');
    });
  });

  setStatus(`Patrón "${presetName}" cargado`);
}

/**
 * Actualiza el indicador visual del paso actual (la columna activa).
 * Se llama desde el callback del secuenciador de Tone.js.
 * @param {number} currentStep - El paso que está sonando
 */
function updateSequencerUI(currentStep) {
  // Quitar la clase .is-current del paso anterior
  document.querySelectorAll('.seq-step.is-current').forEach((el) => {
    el.classList.remove('is-current');
  });

  // Añadir .is-current a todos los pasos de la columna actual
  document.querySelectorAll(`.seq-step[data-col="${currentStep}"]`).forEach((el) => {
    el.classList.add('is-current');
  });

  // Actualizar el indicador de texto
  const indicator = document.getElementById('step-indicator');
  if (indicator) indicator.textContent = `● ${currentStep + 1}`;
}


/* ══════════════════════════════════════════════════════════════
   5. PIANO MÁGICO — UI
   ══════════════════════════════════════════════════════════════ */

/** Inicializa el piano con la escala actual */
function initPiano() {
  renderPianoKeys(STATE.currentScale);
  initPianoVisualizer();

  // Listeners de los selectores de escala
  document.querySelectorAll('.scale-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.scale-btn').forEach((b) => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
      STATE.currentScale = btn.dataset.scale;
      renderPianoKeys(STATE.currentScale);
      setStatus(`Escala cambiada a "${SCALES[STATE.currentScale].label}"`);
    });
  });

  console.log('[Piano] UI inicializada');
}

/** Renderiza las teclas del piano para la escala dada */
function renderPianoKeys(scaleName) {
  const container = document.getElementById('piano-keys');
  if (!container) return;

  container.innerHTML = ''; // Limpiar teclas anteriores

  const scale = SCALES[scaleName];
  if (!scale) return;

  scale.chords.forEach((chord, index) => {
    const key = document.createElement('button');
    key.className = 'piano-key';
    key.type = 'button';
    key.dataset.chordIndex = index;
    key.setAttribute('aria-label', `Acorde ${chord.name} — ${chord.emotion}`);

    // Inyectar el color como variable CSS (para el gradient del botón)
    key.style.setProperty('--key-color', chord.color);

    key.innerHTML = `
      <span class="key-chord-name">${chord.name}</span>
      <span class="key-emotion">${chord.emotion}</span>
    `;

    // Tocar el acorde al presionar
    key.addEventListener('mousedown',  () => playChord(index));
    key.addEventListener('touchstart', (e) => { e.preventDefault(); playChord(index); });

    // Soltar: detener las notas del acorde (release)
    key.addEventListener('mouseup',   () => releaseChord(index, key));
    key.addEventListener('touchend',  () => releaseChord(index, key));
    key.addEventListener('mouseleave',() => releaseChord(index, key));

    container.appendChild(key);
  });

  // Actualizar el visualizador con los colores de la nueva escala
  updateVisualizerColors(scaleName);
}

/**
 * Toca el acorde en el índice dado.
 * @param {number} chordIndex - Índice del acorde en la escala actual
 */
function playChord(chordIndex) {
  if (!STATE.audioInitialized) {
    // Si el audio no está listo, inicializarlo primero
    initAudio().then(() => playChord(chordIndex));
    return;
  }

  const scale = SCALES[STATE.currentScale];
  const chord = scale.chords[chordIndex];
  if (!chord || !STATE.pianoSynth) return;

  // Tocar todas las notas del acorde simultáneamente
  STATE.pianoSynth.triggerAttack(chord.notes, Tone.now());
  STATE.activeChordIndex = chordIndex;

  // Feedback visual
  const keyEl = document.querySelector(`.piano-key[data-chord-index="${chordIndex}"]`);
  if (keyEl) {
    keyEl.classList.add('is-active', 'press-anim');
    keyEl.removeEventListener('animationend', null);
    keyEl.addEventListener('animationend', () => keyEl.classList.remove('press-anim'), { once: true });
  }

  // Actualizar el display del acorde
  updateChordDisplay(chord);

  // Animar el visualizador
  animateVisualizer(chord.color);
}

/**
 * Suelta el acorde (release del envelope).
 * @param {number} chordIndex - Índice del acorde
 * @param {HTMLElement} keyEl - El elemento botón
 */
function releaseChord(chordIndex, keyEl) {
  if (!STATE.pianoSynth || STATE.activeChordIndex !== chordIndex) return;

  const scale = SCALES[STATE.currentScale];
  const chord = scale.chords[chordIndex];
  if (!chord) return;

  // Release: el envelope del synth hace un fade out suave
  STATE.pianoSynth.triggerRelease(chord.notes, Tone.now());
  STATE.activeChordIndex = null;

  if (keyEl) keyEl.classList.remove('is-active');
}

/** Actualiza el display del acorde activo */
function updateChordDisplay(chord) {
  const nameEl  = document.getElementById('current-chord-name');
  const notesEl = document.getElementById('current-chord-notes');

  if (nameEl)  nameEl.textContent  = chord.name;
  if (notesEl) notesEl.textContent = chord.notes.join(' · ');
}


/* ── Visualizador del piano ── */

/** Crea las barras del visualizador de EQ */
function initPianoVisualizer() {
  const container = document.getElementById('piano-visualizer');
  if (!container) return;

  container.innerHTML = '';
  for (let i = 0; i < 32; i++) {
    const bar = document.createElement('div');
    bar.className = 'viz-bar';
    bar.dataset.index = i;
    container.appendChild(bar);
  }
}

/** Anima el visualizador cuando suena un acorde */
function animateVisualizer(color) {
  const bars = document.querySelectorAll('.viz-bar');
  bars.forEach((bar, i) => {
    // Altura aleatoria pero con curva (más alto en el centro)
    const curve = Math.sin((i / bars.length) * Math.PI);
    const h = (Math.random() * 30 + 10) * curve;
    bar.style.height = Math.max(4, h) + 'px';
    bar.style.background = color;
    bar.style.boxShadow = `0 0 6px ${color}`;
    bar.classList.add('is-active');
  });

  // Bajar las barras gradualmente
  setTimeout(() => {
    bars.forEach((bar) => {
      bar.style.height = '4px';
      bar.style.boxShadow = '';
      bar.classList.remove('is-active');
    });
  }, 800);
}

/** Actualiza los colores de las barras del visualizador */
function updateVisualizerColors(scaleName) {
  const scale = SCALES[scaleName];
  if (!scale) return;
  // Colorear las barras con los colores de los acordes de la escala
  const bars = document.querySelectorAll('.viz-bar');
  bars.forEach((bar, i) => {
    const chordIndex = Math.floor(i / (bars.length / scale.chords.length));
    if (scale.chords[chordIndex]) {
      bar.style.setProperty('--bar-color', scale.chords[chordIndex].color);
    }
  });
}


/* ══════════════════════════════════════════════════════════════
   6. SEGUIMIENTO DE MANOS (MediaPipe Hands)
   ══════════════════════════════════════════════════════════════ */

let handsModel = null; // Instancia del modelo MediaPipe

/** Inicializa el sistema de cámara y manos */
function initCamera() {
  const btnCamera    = document.getElementById('btn-camera');
  const container    = document.getElementById('camera-container');
  const videoEl      = document.getElementById('camera-video');
  const canvasEl     = document.getElementById('camera-canvas');
  const statusEl     = document.getElementById('camera-status');

  if (!btnCamera) return;

  btnCamera.addEventListener('click', async () => {
    if (STATE.cameraActive) {
      // APAGAR cámara
      stopCamera(videoEl, btnCamera, container, statusEl);
    } else {
      // ENCENDER cámara
      await startCamera(videoEl, canvasEl, btnCamera, container, statusEl);
    }
  });
}

/**
 * Inicia el stream de cámara y el modelo de MediaPipe.
 */
async function startCamera(videoEl, canvasEl, btnEl, container, statusEl) {
  try {
    statusEl.textContent = 'Solicitando permiso de cámara...';
    statusEl.className = 'camera-status';

    // Solicitar acceso a la cámara
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: 'user',  // Cámara frontal
      }
    });

    videoEl.srcObject = stream;

    // Esperar a que el video tenga dimensiones
    await new Promise((resolve) => {
      videoEl.onloadedmetadata = resolve;
    });

    // Ajustar el canvas al tamaño del video
    canvasEl.width  = videoEl.videoWidth;
    canvasEl.height = videoEl.videoHeight;

    // Mostrar la interfaz de cámara
    container.removeAttribute('hidden');
    btnEl.textContent = '📷 Desactivar Cámara';
    btnEl.classList.add('active');
    statusEl.textContent = 'Cámara activa · Cargando modelo de manos...';
    statusEl.className = 'camera-status active';
    STATE.cameraActive = true;

    // Inicializar MediaPipe si está disponible
    if (typeof Hands !== 'undefined') {
      await initMediaPipeHands(videoEl, canvasEl, statusEl);
    } else {
      statusEl.textContent = 'Cámara activa · (MediaPipe no disponible — verificar conexión)';
      // Hacer una demo visual básica sin detección
      startBasicCameraLoop(videoEl, canvasEl);
    }

  } catch (err) {
    let msg = 'Error al acceder a la cámara.';
    if (err.name === 'NotAllowedError')  msg = 'Permiso de cámara denegado.';
    if (err.name === 'NotFoundError')    msg = 'No se encontró ninguna cámara.';
    if (err.name === 'NotReadableError') msg = 'Cámara en uso por otro programa.';

    statusEl.textContent = msg;
    statusEl.className = 'camera-status error';
    console.error('[Camera]', err);
  }
}

/**
 * Inicializa el modelo de manos de MediaPipe.
 * MediaPipe Hands detecta hasta 2 manos y devuelve 21 landmarks por mano.
 */
async function initMediaPipeHands(videoEl, canvasEl, statusEl) {
  handsModel = new Hands({
    locateFile: (file) => {
      // CDN de MediaPipe para los archivos del modelo
      return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
    }
  });

  // Configuración del modelo
  handsModel.setOptions({
    maxNumHands: 2,           // Detectar hasta 2 manos
    modelComplexity: 1,       // 0=rápido/menos preciso, 1=balanceado
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.5,
  });

  // Callback: se llama en cada frame con los resultados
  handsModel.onResults((results) => {
    processHandResults(results, canvasEl);
  });

  // Camera Utils de MediaPipe: maneja el loop de frames del video
  const mpCamera = new Camera(videoEl, {
    onFrame: async () => {
      // En cada frame, enviar el video al modelo
      await handsModel.send({ image: videoEl });
    },
    width: 640,
    height: 480,
  });

  await mpCamera.start();

  statusEl.textContent = '✋ Modelo cargado · Muestra tus manos';
  statusEl.className = 'camera-status active';
  console.log('[Camera] MediaPipe Hands inicializado');
}

/**
 * Procesa los resultados de MediaPipe Hands.
 * results.multiHandLandmarks: array de manos, cada una con 21 landmarks.
 * results.multiHandedness: array con "Left"/"Right" para cada mano.
 *
 * Landmarks clave (índices):
 * 0=muñeca, 4=punta pulgar, 8=punta índice, 12=punta medio,
 * 16=punta anular, 20=punta meñique
 */
function processHandResults(results, canvasEl) {
  const ctx = canvasEl.getContext('2d');

  // Limpiar el canvas overlay
  ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);

  const leftIndicator  = document.getElementById('left-hand-indicator');
  const rightIndicator = document.getElementById('right-hand-indicator');

  // Resetear indicadores
  leftIndicator?.classList.remove('detected');
  rightIndicator?.classList.remove('detected');

  if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
    return; // No hay manos en el frame
  }

  // Procesar cada mano detectada
  results.multiHandLandmarks.forEach((landmarks, handIndex) => {
    const handedness = results.multiHandedness[handIndex].label; // "Left" o "Right"

    // Dibujar los landmarks de la mano en el canvas
    drawHandLandmarks(ctx, landmarks, canvasEl, handedness);

    // Actualizar indicadores de UI
    if (handedness === 'Left') {
      leftIndicator?.classList.add('detected');
      // La mano izquierda controla el piano
      processLeftHandGesture(landmarks, canvasEl);
    } else {
      rightIndicator?.classList.add('detected');
      // La mano derecha controla el secuenciador
      processRightHandGesture(landmarks, canvasEl);
    }
  });
}

/**
 * Dibuja los landmarks de una mano en el canvas.
 * Puntos = landmarks, líneas = conexiones entre ellos.
 */
function drawHandLandmarks(ctx, landmarks, canvas, handedness) {
  const color = handedness === 'Left' ? '#22d3ee' : '#8b5cf6';
  const w = canvas.width;
  const h = canvas.height;

  // Conexiones entre landmarks (índices definidos por MediaPipe)
  const connections = [
    [0,1],[1,2],[2,3],[3,4],           // Pulgar
    [0,5],[5,6],[6,7],[7,8],           // Índice
    [0,9],[9,10],[10,11],[11,12],      // Medio
    [0,13],[13,14],[14,15],[15,16],    // Anular
    [0,17],[17,18],[18,19],[19,20],    // Meñique
    [5,9],[9,13],[13,17],              // Palma
  ];

  // Dibujar líneas de conexión
  ctx.strokeStyle = color + '80'; // 50% opacidad
  ctx.lineWidth = 2;
  connections.forEach(([a, b]) => {
    if (landmarks[a] && landmarks[b]) {
      ctx.beginPath();
      ctx.moveTo(landmarks[a].x * w, landmarks[a].y * h);
      ctx.lineTo(landmarks[b].x * w, landmarks[b].y * h);
      ctx.stroke();
    }
  });

  // Dibujar puntos en cada landmark
  landmarks.forEach((lm, i) => {
    ctx.beginPath();
    ctx.arc(lm.x * w, lm.y * h, i === 8 ? 8 : 4, 0, Math.PI * 2);
    ctx.fillStyle = i === 8 ? '#ffffff' : color; // Índice más grande y blanco
    ctx.fill();
  });
}

/**
 * Procesa gestos de la MANO IZQUIERDA → piano.
 * La posición X del índice (landmark 8) determina qué tecla tocar.
 */
function processLeftHandGesture(landmarks, canvas) {
  // Debounce: no procesar gestos más de una vez cada 200ms
  const now = Date.now();
  if (now - STATE.lastHandAction < 200) return;

  const indexTip = landmarks[8]; // Punta del dedo índice
  const w = canvas.width;

  // Mapear la posición X del índice a un índice de tecla (0-7)
  const keyIndex = Math.floor(indexTip.x * 8);
  const clampedKey = Math.max(0, Math.min(7, keyIndex));

  // Solo tocar si el dedo está suficientemente arriba (Y < 0.7)
  // para evitar activaciones accidentales
  if (indexTip.y < 0.7) {
    if (!STATE.audioInitialized) return;
    playChord(clampedKey);
    STATE.lastHandAction = now;
  }
}

/**
 * Procesa gestos de la MANO DERECHA → secuenciador.
 * Puño cerrado = activar paso. Mano abierta = silenciar todo.
 *
 * DETECCIÓN DE PUÑO:
 * Comparamos la distancia entre la punta del índice (8) y la base de los dedos (5).
 * Si todos los dedos están recogidos, es un puño.
 */
function processRightHandGesture(landmarks, canvas) {
  const now = Date.now();
  if (now - STATE.lastHandAction < 300) return;

  // Calcular si los dedos están extendidos
  const fingers = [
    { tip: 8,  pip: 6  }, // Índice
    { tip: 12, pip: 10 }, // Medio
    { tip: 16, pip: 14 }, // Anular
    { tip: 20, pip: 18 }, // Meñique
  ];

  const extended = fingers.filter(f =>
    // Un dedo está extendido si su punta está más arriba (Y menor) que su articulación PIP
    landmarks[f.tip].y < landmarks[f.pip].y
  ).length;

  if (extended === 0) {
    // PUÑO: activar/desactivar paso del secuenciador
    // Mapear posición X a columna, Y a fila
    const wrist = landmarks[0];
    const col = Math.floor(wrist.x * STEPS);
    const row = Math.floor(wrist.y * ROWS);
    const clampedCol = Math.max(0, Math.min(STEPS - 1, col));
    const clampedRow = Math.max(0, Math.min(ROWS - 1, row));

    const stepBtn = document.querySelector(
      `.seq-step[data-row="${clampedRow}"][data-col="${clampedCol}"]`
    );
    if (stepBtn) {
      toggleStep(clampedRow, clampedCol, stepBtn);
      STATE.lastHandAction = now;
    }

  } else if (extended >= 4) {
    // MANO ABIERTA: silenciar todo
    if (STATE.pianoSynth) {
      STATE.pianoSynth.releaseAll();
    }
    STATE.lastHandAction = now;
  }
}

/** Loop básico de cámara sin detección (fallback si MediaPipe no carga) */
function startBasicCameraLoop(videoEl, canvasEl) {
  const ctx = canvasEl.getContext('2d');
  function loop() {
    // Solo dibujar un marco de guía
    ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
    ctx.strokeStyle = 'rgba(139,92,246,0.3)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(
      canvasEl.width * 0.1, canvasEl.height * 0.1,
      canvasEl.width * 0.8, canvasEl.height * 0.8
    );
    ctx.setLineDash([]);
    if (STATE.cameraActive) requestAnimationFrame(loop);
  }
  loop();
}

/** Detiene la cámara */
function stopCamera(videoEl, btnEl, container, statusEl) {
  if (videoEl.srcObject) {
    videoEl.srcObject.getTracks().forEach(track => track.stop());
    videoEl.srcObject = null;
  }
  container.setAttribute('hidden', '');
  btnEl.textContent = '📷 Activar Cámara';
  btnEl.classList.remove('active');
  statusEl.textContent = 'Cámara desactivada';
  statusEl.className = 'camera-status';
  STATE.cameraActive = false;
}


/* ══════════════════════════════════════════════════════════════
   7. GRABACIÓN Y DESCARGA MP3
   Tone.Recorder captura el audio → lamejs lo codifica a MP3.
   ══════════════════════════════════════════════════════════════ */

function initRecording() {
  const btnRecord   = document.getElementById('btn-record');
  const btnDownload = document.getElementById('btn-download');

  if (!btnRecord) return;

  btnRecord.addEventListener('click', async () => {
    if (!STATE.audioInitialized) {
      await initAudio();
    }

    if (STATE.isRecording) {
      // DETENER GRABACIÓN
      await stopRecording();
      btnRecord.classList.remove('is-recording');
      btnRecord.innerHTML = '<span aria-hidden="true">⏺</span><span>Grabar</span>';
      if (STATE.recordedBlob) {
        btnDownload.removeAttribute('hidden');
        setStatus('Grabación lista · Pulsa Descargar para guardar el MP3');
      }
    } else {
      // INICIAR GRABACIÓN
      startRecording();
      btnRecord.classList.add('is-recording');
      btnRecord.innerHTML = '<span aria-hidden="true">⏹</span><span>Detener y Descargar</span>';
      btnDownload.setAttribute('hidden', '');
      setStatus('🔴 Grabando... Toca el secuenciador y el piano');
    }
  });

  btnDownload.addEventListener('click', () => {
    if (STATE.recordedBlob) {
      downloadBlob(STATE.recordedBlob, 'GRANATTE-creacion.mp3');
    }
  });
}

/**
 * Inicia la grabación usando Tone.Recorder.
 * Tone.Recorder captura TODO lo que sale del contexto de audio.
 */
function startRecording() {
  try {
    STATE.recorder = new Tone.Recorder();

    // Conectar la salida del Tone.js al recorder
    // Tone.getDestination() es la salida maestra
    Tone.getDestination().connect(STATE.recorder);

    STATE.recorder.start();
    STATE.isRecording = true;
    console.log('[Recorder] Grabación iniciada');

  } catch (err) {
    console.error('[Recorder] Error al iniciar:', err);
    setStatus('Error al iniciar la grabación.');
  }
}

/**
 * Detiene la grabación y convierte el audio a MP3 usando lamejs.
 *
 * PROCESO:
 * 1. recorder.stop() → devuelve un Blob de audio (formato WebM/WAV)
 * 2. Decodificar el Blob con AudioContext.decodeAudioData()
 * 3. Extraer los samples de audio como Float32Array
 * 4. Codificar los samples a MP3 con lamejs
 * 5. Crear un Blob MP3 descargable
 */
async function stopRecording() {
  if (!STATE.recorder || !STATE.isRecording) return;

  try {
    // Obtener el Blob de audio grabado
    const audioBlob = await STATE.recorder.stop();
    STATE.isRecording = false;

    setStatus('Procesando audio...');

    // Desconectar el recorder de la salida
    Tone.getDestination().disconnect(STATE.recorder);
    STATE.recorder = null;

    // Convertir el Blob a ArrayBuffer para decodificarlo
    const arrayBuffer = await audioBlob.arrayBuffer();

    // Decodificar el audio con Web Audio API
    const audioCtx = new AudioContext();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

    // Extraer los channels de audio
    const leftChannel  = audioBuffer.getChannelData(0);
    // Si es mono, usar el mismo canal para ambos; si es estéreo, usar ambos
    const rightChannel = audioBuffer.numberOfChannels > 1
      ? audioBuffer.getChannelData(1)
      : leftChannel;

    console.log('[Recorder] Audio decodificado:', {
      duration: audioBuffer.duration.toFixed(2) + 's',
      sampleRate: audioBuffer.sampleRate,
      channels: audioBuffer.numberOfChannels,
      samples: leftChannel.length,
    });

    // Codificar a MP3 con lamejs
    const mp3Blob = encodeToMp3(leftChannel, rightChannel, audioBuffer.sampleRate);
    STATE.recordedBlob = mp3Blob;

    await audioCtx.close();
    setStatus('✦ MP3 listo para descargar');

  } catch (err) {
    console.error('[Recorder] Error al procesar:', err);
    setStatus('Error al procesar la grabación. Intenta de nuevo.');
    STATE.isRecording = false;
  }
}

/**
 * Codifica arrays de PCM float32 a MP3 usando lamejs.
 *
 * CÓMO FUNCIONA LAMEJS:
 * 1. Crea un codificador MP3 con la tasa de muestreo y bitrate deseados
 * 2. Procesa los samples en bloques (1152 samples por bloque)
 * 3. Cada bloque devuelve bytes MP3 que se acumulan
 * 4. Al final, se llush() el encoder para obtener los bytes restantes
 *
 * @param {Float32Array} leftData   - Samples del canal izquierdo (-1 a 1)
 * @param {Float32Array} rightData  - Samples del canal derecho (-1 a 1)
 * @param {number}       sampleRate - Tasa de muestreo (ej: 44100)
 * @returns {Blob} Blob de audio MP3
 */
function encodeToMp3(leftData, rightData, sampleRate) {
  if (typeof lamejs === 'undefined') {
    console.error('[MP3] lamejs no disponible');
    // Fallback: devolver el audio como WAV-like blob
    return new Blob([leftData.buffer], { type: 'audio/wav' });
  }

  const CHANNELS = 2;        // Estéreo
  const BITRATE  = 128;      // 128 kbps
  const BLOCK    = 1152;     // Tamaño de bloque de LAME (estándar MP3)

  const mp3encoder = new lamejs.Mp3Encoder(CHANNELS, sampleRate, BITRATE);
  const mp3Data = [];

  // Convertir Float32 (-1 a 1) a Int16 (-32768 a 32767)
  // MP3/PCM trabaja con enteros de 16 bits
  function floatToInt16(float32) {
    const int16 = new Int16Array(float32.length);
    for (let i = 0; i < float32.length; i++) {
      // Clamp a [-1, 1] y escalar a Int16
      const clamped = Math.max(-1, Math.min(1, float32[i]));
      int16[i] = clamped < 0 ? clamped * 32768 : clamped * 32767;
    }
    return int16;
  }

  const leftInt16  = floatToInt16(leftData);
  const rightInt16 = floatToInt16(rightData);

  // Procesar en bloques de 1152 samples
  for (let i = 0; i < leftInt16.length; i += BLOCK) {
    const leftChunk  = leftInt16.subarray(i, i + BLOCK);
    const rightChunk = rightInt16.subarray(i, i + BLOCK);

    const encoded = mp3encoder.encodeBuffer(leftChunk, rightChunk);
    if (encoded.length > 0) {
      mp3Data.push(new Int8Array(encoded));
    }
  }

  // Flush: obtener los últimos bytes del encoder
  const flushed = mp3encoder.flush();
  if (flushed.length > 0) {
    mp3Data.push(new Int8Array(flushed));
  }

  const totalBytes = mp3Data.reduce((sum, arr) => sum + arr.length, 0);
  console.log(`[MP3] Codificado: ${totalBytes} bytes`);

  return new Blob(mp3Data, { type: 'audio/mp3' });
}

/**
 * Descarga un Blob como archivo.
 * @param {Blob}   blob     - El blob a descargar
 * @param {string} filename - Nombre del archivo
 */
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();

  // Liberar la URL de objeto después de la descarga
  setTimeout(() => URL.revokeObjectURL(url), 10000);

  setStatus(`✦ Descargando "${filename}"`);
}


/* ══════════════════════════════════════════════════════════════
   8. MEZCLADOR DE VOLUMEN
   ══════════════════════════════════════════════════════════════ */

/** Sincroniza los faders con los nodos de volumen de Tone.js */
function initMixer() {
  document.querySelectorAll('.vol-fader').forEach((fader) => {
    const channel = fader.dataset.channel;
    const display = fader.nextElementSibling; // <output>

    // Aplicar valor inicial
    setChannelVolume(channel, parseFloat(fader.value));
    if (display) display.value = fader.value;

    fader.addEventListener('input', () => {
      const val = parseFloat(fader.value);
      setChannelVolume(channel, val);
      if (display) display.value = val;
    });
  });

  // Efectos (reverb/delay)
  const reverbFader = document.getElementById('fx-reverb');
  const delayFader  = document.getElementById('fx-delay');

  if (reverbFader && STATE.reverb) {
    reverbFader.addEventListener('input', () => {
      STATE.reverb.wet.value = parseFloat(reverbFader.value);
    });
  }

  if (delayFader && STATE.delay) {
    delayFader.addEventListener('input', () => {
      STATE.delay.wet.value = parseFloat(delayFader.value);
    });
  }
}

/**
 * Ajusta el volumen de un canal.
 * @param {string} channel - Nombre del canal (ej: 'kick', 'piano')
 * @param {number} db      - Valor en decibeles (-40 a 0)
 */
function setChannelVolume(channel, db) {
  const volumeNode = STATE.volumeNodes[channel];
  if (volumeNode) {
    volumeNode.volume.value = db;
  }
}


/* ══════════════════════════════════════════════════════════════
   9. PANTALLA DE BIENVENIDA
   ══════════════════════════════════════════════════════════════ */

function initWelcomeScreen() {
  const welcomeScreen = document.getElementById('welcome-screen');
  const studioApp     = document.getElementById('studio-app');
  const btnStart      = document.getElementById('btn-start');
  const btnHelp       = document.getElementById('btn-help');

  if (!btnStart || !welcomeScreen || !studioApp) return;

  function showStudio() {
    welcomeScreen.style.opacity = '0';
    welcomeScreen.style.transition = 'opacity 0.5s ease';
    setTimeout(() => {
      welcomeScreen.setAttribute('hidden', '');
      welcomeScreen.style.display = 'none';
      studioApp.removeAttribute('hidden');
    }, 500);
  }

  btnStart.addEventListener('click', showStudio);

  // Botón de ayuda: volver a mostrar el tutorial
  if (btnHelp) {
    btnHelp.addEventListener('click', () => {
      welcomeScreen.removeAttribute('hidden');
      welcomeScreen.style.display = '';
      welcomeScreen.style.opacity = '0';
      requestAnimationFrame(() => {
        welcomeScreen.style.transition = 'opacity 0.3s ease';
        welcomeScreen.style.opacity = '1';
      });
    });
  }
}


/* ══════════════════════════════════════════════════════════════
   10. CONTROLES DE TRANSPORTE
   ══════════════════════════════════════════════════════════════ */

function initTransportControls() {
  const btnPlayStop = document.getElementById('btn-play-stop');
  const bpmSlider   = document.getElementById('bpm-slider');
  const bpmDisplay  = document.getElementById('bpm-display');
  const btnClear    = document.getElementById('btn-clear');

  // Play / Stop
  if (btnPlayStop) {
    btnPlayStop.addEventListener('click', async () => {
      // Asegurarse de que el audio esté inicializado antes de reproducir
      if (!STATE.audioInitialized) {
        await initAudio();
      }

      if (STATE.isPlaying) {
        // DETENER
        Tone.getTransport().stop();
        STATE.isPlaying = false;
        STATE.currentStep = 0;
        btnPlayStop.classList.remove('is-playing');
        document.getElementById('play-icon').textContent = '▶';
        document.getElementById('play-label').textContent = 'Iniciar';
        // Limpiar resaltado del paso actual
        document.querySelectorAll('.seq-step.is-current').forEach(el =>
          el.classList.remove('is-current')
        );
        setStatus('Detenido');
      } else {
        // INICIAR
        Tone.getTransport().start();
        STATE.isPlaying = true;
        btnPlayStop.classList.add('is-playing');
        document.getElementById('play-icon').textContent = '⏹';
        document.getElementById('play-label').textContent = 'Detener';
        setStatus('Reproduciendo ▶');
      }
    });
  }

  // BPM Slider
  if (bpmSlider) {
    bpmSlider.addEventListener('input', () => {
      const bpm = parseInt(bpmSlider.value);
      STATE.bpm = bpm;
      Tone.getTransport().bpm.value = bpm;
      if (bpmDisplay) bpmDisplay.value = bpm;
    });
  }

  // Limpiar todo
  if (btnClear) {
    btnClear.addEventListener('click', () => {
      applyPreset('empty');
      setStatus('Grid limpio');
    });
  }

  // Inicializar el BPM de Tone.js
  Tone.getTransport().bpm.value = STATE.bpm;

  // Configurar como loop infinito
  Tone.getTransport().loop = true;
  Tone.getTransport().loopStart = 0;
  Tone.getTransport().loopEnd = '1m'; // 1 compás (4 beats × 16 pasos)
}

/** Actualiza el mensaje de estado en el header */
function setStatus(msg) {
  const el = document.getElementById('studio-status');
  if (el) el.textContent = msg;
}


/* ══════════════════════════════════════════════════════════════
   PUNTO DE ENTRADA — Inicializar todo al cargar el DOM
   ══════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {

  // 1. Welcome screen y botón de inicio
  initWelcomeScreen();

  // 2. Controles de transporte (play/stop/BPM)
  initTransportControls();

  // 3. Secuenciador (solo UI — el audio se inicializa al primer click de play)
  initSequencer();

  // 4. Piano (solo UI)
  initPiano();

  // 5. Cámara (solo el botón — la cámara se inicia al hacer click)
  initCamera();

  // 6. Grabación
  initRecording();

  // Inicializar audio al primer click en cualquier parte
  // (para asegurar que el AudioContext se desbloquee lo antes posible)
  document.addEventListener('click', () => {
    if (!STATE.audioInitialized) initAudio();
  }, { once: true });

  console.log('[Studio] Aplicación inicializada ✦');
});
