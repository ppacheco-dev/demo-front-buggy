import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import styles from './Buggy3DViewer.module.css';

/**
 * Buggy3DViewer: Visor interactivo 3D para modelos .glb de Buggies.
 * Si el archivo .glb aún no existe en el proyecto, muestra elegantemente la imagen .webp de fallback.
 */
export default function Buggy3DViewer({
  modelUrl = '/assets/models/amarillo.glb',
  fallbackImage = '/assets/images/buggies/amarillo.webp',
  buggyColor = '#facc15',
  glowColor = 'rgba(250, 204, 21, 0.45)',
  buggyName = 'AMARILLO',
}) {
  const mountRef = useRef(null);
  const [hasModel, setHasModel] = useState(null); // null = comprobando, true = cargado, false = fallback
  const [loading, setLoading] = useState(true);
  const [autoRotate, setAutoRotate] = useState(true);
  const [force2D, setForce2D] = useState(false);

  const controlsRef = useRef(null);
  const cameraRef = useRef(null);
  const defaultCamPos = useRef(new THREE.Vector3(2.8, 1.6, 3.4));

  useEffect(() => {
    // 1. Verificar primero si el archivo .glb existe
    let isMounted = true;
    setLoading(true);

    fetch(modelUrl, { method: 'HEAD' })
      .then((res) => {
        if (!isMounted) return;
        if (res.ok) {
          setHasModel(true);
        } else {
          setHasModel(false);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setHasModel(false);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [modelUrl]);

  useEffect(() => {
    if (!hasModel || force2D || !mountRef.current) return;

    const container = mountRef.current;
    const width = container.clientWidth || 380;
    const height = container.clientHeight || 280;

    // A. Escena, Cámara y Renderer
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.copy(defaultCamPos.current);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.replaceChildren(renderer.domElement);

    // B. Controles Orbitales (Girar 360°, Zoom, Inclinación)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI / 2 + 0.05; // No pasar muy por debajo del suelo
    controls.minDistance = 1.8;
    controls.maxDistance = 7.5;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 1.8;
    controlsRef.current = controls;

    // C. Iluminación de Estudio Profesional
    // 1. Luz ambiente suave
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    // 2. Luz direccional frontal/superior (Key Light)
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(5, 8, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    scene.add(keyLight);

    // 3. Luz de contorno con el color característico del Buggy (Rim Light Sci-Fi)
    const rimLight = new THREE.DirectionalLight(new THREE.Color(buggyColor), 2.5);
    rimLight.position.set(-5, 4, -5);
    scene.add(rimLight);

    // 4. Luz de relleno azulada suave (Fill Light)
    const fillLight = new THREE.DirectionalLight(0x60a5fa, 1.0);
    fillLight.position.set(0, -2, 5);
    scene.add(fillLight);

    // 5. Neón de piso (Bajo chasis)
    const underGlow = new THREE.PointLight(new THREE.Color(buggyColor), 3.0, 4);
    underGlow.position.set(0, 0.2, 0);
    scene.add(underGlow);

    // 6. Plataforma / Disco circular reflectivo bajo el buggy
    const discGeo = new THREE.CylinderGeometry(1.6, 1.6, 0.04, 48);
    const discMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.8,
      roughness: 0.2,
    });
    const disc = new THREE.Mesh(discGeo, discMat);
    disc.position.y = -0.02;
    disc.receiveShadow = true;
    scene.add(disc);

    // Anillo exterior brillante
    const ringGeo = new THREE.RingGeometry(1.55, 1.62, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(buggyColor),
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.005;
    scene.add(ring);

    // D. Carga del Modelo .GLB
    let loadedModel = null;
    const loader = new GLTFLoader();

    loader.load(
      modelUrl,
      (gltf) => {
        loadedModel = gltf.scene;

        // Auto-centrado y auto-escalado para cualquier modelo de Scenario.gg
        const box = new THREE.Box3().setFromObject(loadedModel);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        const maxDim = Math.max(size.x, size.y, size.z);
        const targetScale = 2.4 / (maxDim || 1);
        loadedModel.scale.setScalar(targetScale);

        // Alinear al centro y piso
        loadedModel.position.x = -center.x * targetScale;
        loadedModel.position.z = -center.z * targetScale;
        loadedModel.position.y = -box.min.y * targetScale;

        // Habilitar sombras en todos los meshes
        loadedModel.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.material) {
              child.material.envMapIntensity = 1.2;
            }
          }
        });

        scene.add(loadedModel);
        setLoading(false);
      },
      undefined,
      (error) => {
        console.warn('Error al cargar modelo 3D GLB, activando vista 2D:', error);
        setHasModel(false);
        setLoading(false);
      }
    );

    // E. Loop de Renderizado y Redimensionamiento
    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      renderer.dispose();
      scene.clear();
      if (container && renderer.domElement) {
        container.replaceChildren();
      }
    };
  }, [hasModel, force2D, modelUrl, buggyColor]);

  // Actualizar rotación automática dinámica
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
    }
  }, [autoRotate]);

  const handleResetCamera = () => {
    if (!cameraRef.current || !controlsRef.current) return;
    cameraRef.current.position.copy(defaultCamPos.current);
    controlsRef.current.target.set(0, 0.4, 0);
    controlsRef.current.update();
  };

  const toggleAutoRotate = () => {
    setAutoRotate((prev) => !prev);
  };

  return (
    <div
      className={styles.viewerContainer}
      style={{
        '--badge-color': buggyColor,
        '--badge-glow': glowColor,
      }}
    >
      {/* Si hay modelo 3D activo y no estamos forzando 2D */}
      {hasModel && !force2D ? (
        <>
          <div ref={mountRef} className={styles.canvasWrapper} />

          <div className={styles.badge3D}>
            <span className={styles.pulsingDot} />
            <span>3D INTERACTIVO</span>
          </div>

          <span className={styles.dragHint}>Arrastra para rotar • Rueda para zoom</span>

          <div className={styles.controlsToolbar}>
            <button
              type="button"
              className={`${styles.controlBtn} ${autoRotate ? styles.controlBtnActive : ''}`}
              onClick={toggleAutoRotate}
              title={autoRotate ? 'Pausar auto-rotación' : 'Activar auto-rotación'}
            >
              <i className={autoRotate ? 'ph ph-pause' : 'ph ph-play'} aria-hidden="true" />
            </button>

            <button
              type="button"
              className={styles.controlBtn}
              onClick={handleResetCamera}
              title="Restablecer ángulo de cámara"
            >
              <i className="ph ph-arrows-counter-clockwise" aria-hidden="true" />
            </button>

            <button
              type="button"
              className={styles.controlBtn}
              onClick={() => setForce2D(true)}
              title="Ver imagen 2D fija"
            >
              <i className="ph ph-image" aria-hidden="true" />
            </button>
          </div>

          {loading && (
            <div className={styles.loadingOverlay}>
              <div className={styles.spinner} />
              <span className={styles.loadingText}>Cargando modelo 3D...</span>
            </div>
          )}
        </>
      ) : (
        /* Fallback visual 2D cuando aún no se ha colocado el .glb */
        <div className={styles.fallbackContainer}>
          <img src={fallbackImage} alt={buggyName} className={styles.fallbackImg} />

          {hasModel && force2D ? (
            <div className={styles.controlsToolbar}>
              <button
                type="button"
                className={`${styles.controlBtn} ${styles.controlBtnActive}`}
                onClick={() => setForce2D(false)}
                title="Volver a la vista 3D"
              >
                <i className="ph ph-cube" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <span className={styles.fallbackBadge}>
              💡 Coloca <code>public/assets/models/{buggyName.toLowerCase()}.glb</code> para activar el visor 3D
            </span>
          )}
        </div>
      )}
    </div>
  );
}
