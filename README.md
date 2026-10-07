# Demo Front Buggy 🏎️🏖️

Demo interactivo del juego **Buggy** desarrollado con **Phaser 3**, **React 18** y **Vite**, optimizado para ejecución local y despliegue directo en **Vercel**.

---

## 🌟 Características

1. **Pantalla Principal (Landing / Menú de Inicio)**:
   - **Fondo**: Escena de carrera playera de buggies en alta resolución (`/public/assets/images/background_clean.jpg`).
   - **Logo**: Título "BUGGY" con bandera a cuadros y monedas doradas flotando con animación de levitación suave (`/public/assets/images/logo.png`).
   - **Botón JUGAR**: Botón estilizado con pulso continuo, efecto hover interactivo, respuesta táctil y sonido de clic (`/public/assets/images/btn_jugar.png`).
   - **Diseño Adaptativo (Responsive)**: Escala automáticamente en pantallas de escritorio, tablets y móviles (tanto en orientación vertical como horizontal).

2. **Botones Laterales de Interfaz (Copiados de `front-caja_fuerte`)**:
   - **Pantalla Completa** (`ph-corners-out` / `ph-corners-in`): Alterna el modo fullscreen del navegador usando la API nativa de pantalla completa.
   - **Reglas y Ajustes** (`ph-info`): Abre un modal con pestañas:
     - **Reglas**: Instrucciones de la carrera y condiciones de victoria.
     - **Ajustes**: Controles de volumen deslizantes para Música y Efectos, más botón de alternancia Habilitado/Muteado.
   - **Sonido** (`ph-speaker-high` / `ph-speaker-slash`): Alterna el silencio del audio en tiempo real y sincroniza el estado con el motor de Phaser.
   - **Menú Móvil** (`ph-list` / `ph-x`): Para pantallas angostas (`<= 720px`), agrupa los botones en un menú desplegable (drawer).

---

## 🚀 Ejecución Local

1. Instalar dependencias (ya configuradas en la carpeta):
   ```bash
   npm install
   ```

2. Iniciar el servidor de desarrollo:
   ```bash
   npm run dev
   ```
   Abrir en el navegador: [http://localhost:3000](http://localhost:3000)

3. Probar la compilación para producción:
   ```bash
   npm run build
   npm run preview
   ```

---

## ☁️ Despliegue en Vercel

El proyecto incluye la configuración lista en `vercel.json` y el script estándar `"build": "vite build"`.

### Opción 1: Despliegue desde GitHub
1. Sube este repositorio a GitHub:
   ```bash
   git init
   git add .
   git commit -m "feat: initial buggy demo"
   git remote add origin <tu-repositorio>
   git push -u origin main
   ```
2. En [Vercel](https://vercel.com), haz clic en **"Add New Project"** e importa tu repositorio.
3. Vercel detectará automáticamente la configuración de **Vite**:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Presiona **Deploy**.

### Opción 2: Despliegue directo vía CLI
En la raíz del proyecto (`C:\Demo-Front-Buggy`):
```bash
npx vercel
```

---

## 📁 Estructura del Proyecto

```text
C:\Demo-Front-Buggy\
├── index.html                           # Plantilla HTML con Phosphor icons
├── package.json                         # Dependencias y scripts Vite
├── vite.config.js                       # Configuración de Vite con plugin React
├── vercel.json                          # Configuración SPA para Vercel
├── public/
│   ├── vendor/phosphor/regular/         # Fuentes y estilos de Phosphor Icons (de front-caja_fuerte)
│   └── assets/
│       ├── images/
│       │   ├── background.jpg           # Arte de fondo original
│       │   ├── background_clean.jpg     # Fondo optimizado para animación de botón
│       │   ├── logo.png                 # Logo BUGGY recortado
│       │   └── btn_jugar.png            # Botón JUGAR recortado
│       └── sounds/
│           ├── click.mp3                # Efecto de clic
│           └── win.mp3                  # Efecto de victoria
└── src/
    ├── main.jsx                         # Entrada de React
    ├── App.jsx                          # Componente raíz
    ├── components/
    │   ├── GameContainer.jsx            # Contenedor de Phaser + Toolbar de botones lateral
    │   ├── GameContainer.module.css     # Estilos glassmorphism de botones y modales
    │   └── modals/
    │       ├── InfoModal.jsx            # Modal de Reglas y Ajustes de Audio
    │       └── PlayModal.jsx            # Modal de demostración al pulsar JUGAR
    ├── hooks/
    │   └── useGame.js                   # Hook de ciclo de vida de Phaser y resize
    └── game/
        ├── config/
        │   └── phaserConfig.js          # Configuración del motor Phaser 3
        └── scenes/
            ├── BootScene.js             # Precarga de assets con barra de progreso
            └── MenuScene.js             # Escena con fondo, logo animado y botón interactivo
```

---

## 🎨 Cómo Reemplazar Elementos Futuros

Para reemplazar los elementos con nuevas imágenes o animaciones:
- **Fondo**: Reemplaza `public/assets/images/background_clean.jpg`.
- **Logo**: Reemplaza `public/assets/images/logo.png`.
- **Botón JUGAR**: Reemplaza `public/assets/images/btn_jugar.png`.
- **Animaciones Spine / Spritesheets**: Añade los archivos `.json` y `.png` en `public/assets/` y cárgalos en `src/game/scenes/BootScene.js`.