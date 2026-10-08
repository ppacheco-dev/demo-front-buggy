# Demo Front Buggy 🏎️🏖️

Demo interactivo del juego **Buggy** desarrollado con **Phaser 3**, **React 18** y **Vite**, optimizado para ejecución local y despliegue directo en **Vercel**.

---

## 🌟 Características

1. **Pantalla Principal (Landing / Menú de Inicio)**:
   - **Fondo**: Escena de carrera playera de buggies en alta resolución (`/public/assets/images/background.webp`).
   - **Logo**: Título "BUGGY" con bandera a cuadros y monedas doradas flotando con animación de levitación suave (`/public/assets/images/logo.webp`).
   - **Botón JUGAR**: Botón estilizado con pulso continuo, efecto hover interactivo y respuesta táctil (`/public/assets/images/btn_jugar.webp`).
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
│       │   ├── background.webp          # Fondo de carrera playera
│       │   ├── logo.webp                # Logo BUGGY
│       │   ├── btn_jugar.webp           # Botón JUGAR
│       │   ├── buggies/                 # Imágenes de los 6 buggies (amarillo, rojo, azul, etc.)
│       │   └── markets/                 # Iconos de copas y bandera de los 4 mercados
│       └── sounds/                      # Carpeta reservada para efectos de audio (.mp3, .ogg, etc.)
└── src/
    ├── main.jsx                         # Entrada de React
    ├── App.jsx                          # Componente raíz
    ├── components/
    │   ├── GameContainer.jsx            # Contenedor de Phaser + Toolbar de botones lateral
    │   ├── GameContainer.module.css     # Estilos glassmorphism de botones y modales
    │   ├── selection/
    │   │   ├── SelectionScreen.jsx      # Pantalla interactiva de Mercados y Buggies
    │   │   └── SelectionScreen.module.css # Estilos con efecto neon, banners y selector
    │   └── modals/
    │       ├── InfoModal.jsx            # Modal de Reglas y Ajustes de Audio
    │       └── PlayModal.jsx            # Modal de confirmación al presionar CONFIRMAR SELECCION Y JUGAR
    ├── hooks/
    │   └── useGame.js                   # Hook de ciclo de vida de Phaser y resize
    └── game/
        ├── config/
        │   ├── phaserConfig.js          # Configuración del motor Phaser 3
        │   └── selectionData.js         # Objetos configurables con imágenes, cuotas y nombres
        └── scenes/
            ├── BootScene.js             # Precarga de assets con barra de progreso
            └── MenuScene.js             # Escena con fondo, logo animado y botón interactivo
```

---

## 🎨 Cómo Reemplazar Elementos Futuros

Para reemplazar los elementos con nuevas imágenes o animaciones:
- **Fondo**: Reemplaza `public/assets/images/background.webp`.
- **Logo**: Reemplaza `public/assets/images/logo.webp`.
- **Botón JUGAR**: Reemplaza `public/assets/images/btn_jugar.webp`.
- **Buggies (6 vehículos)**: Reemplaza las imágenes en `public/assets/images/buggies/` (`amarillo.webp`, `rojo.webp`, `azul.webp`, `verde.webp`, `naranjo.webp`, `morado.webp`) o actualiza sus rutas en `src/game/config/selectionData.js`.
- **Mercados y Trofeos (4 opciones)**: Reemplaza los iconos en `public/assets/images/markets/` (`trophy_1.webp`, `trophy_2.webp`, `trophy_3.webp`, `flag_crash.webp`) o configúralos en `src/game/config/selectionData.js`.
- **Efectos de Sonido / Audio**: Agrega tus archivos `.mp3` en `public/assets/sounds/` y vincúlalos en `src/game/scenes/BootScene.js` (`this.load.audio(...)`).
- **Animaciones Spine / Spritesheets**: Añade los archivos `.json` y `.png` en `public/assets/` y cárgalos en `src/game/scenes/BootScene.js`.