# GRANATTE — Página de Artista Emergente

Temática: Esoterismo · Mar · Sirenas · Brujería · Astrología

---

## Estructura de Archivos

```
Artistas/
├── index.html              ← Página principal (toda la estructura HTML)
├── assets/
│   ├── css/
│   │   └── style.css       ← Todos los estilos + variables de tema
│   ├── js/
│   │   ├── three-scene.js  ← Escena 3D de fondo (Three.js)
│   │   ├── ui.js           ← Interactividad, animaciones, galería, formulario
│   │   └── player.js       ← Reproductor de audio
│   ├── images/             ← Pon aquí tus fotos
│   └── audio/              ← Pon aquí tus archivos MP3/OGG
└── README.md               ← Esta guía
```

---

## Cómo editar el nombre del artista

Busca en `index.html` todos los comentarios que dicen `📝 EDITAR:` — ahí están todas las partes que necesitas cambiar.

Los principales:
- `<title>` → nombre en la pestaña del browser
- `.hero-title` → nombre grande en la portada
- `.brand-name` → nombre en el sidebar
- Textos de bio, trayectoria, proyecto, redes sociales

---

## Cómo cambiar los colores

Abre `assets/css/style.css` y modifica el bloque `:root { }` al inicio del archivo.

Las variables más importantes:
- `--color-accent` → color principal (morado por defecto)
- `--color-ocean`  → color del mar (cian por defecto)
- `--color-bg`     → fondo oscuro

---

## Cómo añadir fotos

1. Pon tus fotos en `assets/images/`
2. En `index.html`, busca cada `.gallery-item` y descomenta el `<img>`:
   ```html
   <img src="assets/images/tu-foto.jpg"
        alt="Descripción de la foto"
        loading="lazy" />
   ```
3. Borra el bloque `.img-placeholder` de encima

---

## Cómo añadir música

1. Pon tus archivos MP3 en `assets/audio/`
2. En `index.html`, busca cada `.track-audio` y descomenta la línea `<source>`:
   ```html
   <source src="assets/audio/tu-archivo.mp3" type="audio/mpeg">
   ```

---

## Cómo conectar el formulario

**Opción más fácil — Formspree:**
1. Crea cuenta en formspree.io
2. Crea un form, copia el endpoint
3. Cambia `action="#"` en el `<form>` por tu endpoint
4. En `ui.js`, descomenta el bloque "FORMSPREE"

---

## Librerías utilizadas

| Librería | Versión | Uso |
|---|---|---|
| Three.js | r128 | Fondo 3D, partículas, olas |
| GSAP | 3.12.5 | Animaciones de scroll y UI |
| ScrollTrigger | 3.12.5 | Trigger de animaciones por scroll |
| Google Fonts | — | Cinzel Decorative, IM Fell English, Rajdhani |

Todas cargan desde CDN. Si no hay internet, el sitio funciona igual (sin animaciones 3D).

---

## Compatibilidad

- Chrome/Edge 88+: completo
- Firefox 80+: completo
- Safari 14+: completo (sin cursor personalizado en iOS)
- Móvil: layout responsivo, sidebar lateral pasa a barra inferior
