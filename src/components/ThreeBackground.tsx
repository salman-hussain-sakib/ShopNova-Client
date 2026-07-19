'use client';

import { useEffect, useRef, useState } from 'react';

// Reusable script loader with global promise cache
let threeLoadingPromise: Promise<void> | null = null;

function loadThreeAndLoader(): Promise<void> {
  if (threeLoadingPromise) return threeLoadingPromise;

  threeLoadingPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      resolve();
      return;
    }

    const loadScript = (url: string) => {
      return new Promise<void>((res, rej) => {
        const script = document.createElement('script');
        script.src = url;
        script.async = true;
        script.onload = () => res();
        script.onerror = () => rej(new Error(`Failed to load ${url}`));
        document.body.appendChild(script);
      });
    };

    loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js')
      .then(() => {
        return loadScript('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js');
      })
      .then(() => {
        resolve();
      })
      .catch((err) => {
        console.error('Failed loading Three.js for background:', err);
        threeLoadingPromise = null;
        reject(err);
      });
  });

  return threeLoadingPromise;
}

// Check for WebGL compatibility
function checkWebGLSupport(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch (e) {
    return false;
  }
}

// 3D models configuration for background drifting
const backgroundModels = [
  {
    category: 'audio',
    url: 'https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@master/2.0/BoomBox/glTF-Binary/BoomBox.glb',
    basePos: { x: -2.8, y: 1.8, z: -4 },
    rotSpeed: { x: 0.003, y: 0.006, z: 0.002 },
    scale: 45,
  },
  {
    category: 'footwear',
    url: 'https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@master/2.0/MaterialsVariantsShoe/glTF-Binary/MaterialsVariantsShoe.glb',
    basePos: { x: 3.0, y: 0.5, z: -8 },
    rotSpeed: { x: 0.005, y: 0.004, z: 0.001 },
    scale: 3.2,
  },
  {
    category: 'kitchen',
    url: 'https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@master/2.0/WaterBottle/glTF-Binary/WaterBottle.glb',
    basePos: { x: -3.2, y: -1.5, z: -12 },
    rotSpeed: { x: 0.002, y: 0.008, z: 0.004 },
    scale: 2.8,
  },
  {
    category: 'wearables',
    url: 'https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@master/2.0/DamagedHelmet/glTF-Binary/DamagedHelmet.glb',
    basePos: { x: 2.6, y: -2.8, z: -16 },
    rotSpeed: { x: 0.004, y: 0.003, z: 0.005 },
    scale: 1.6,
  },
  {
    category: 'home office',
    url: 'https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@master/2.0/Lantern/glTF-Binary/Lantern.glb',
    basePos: { x: -1.8, y: -4.5, z: -20 },
    rotSpeed: { x: 0.003, y: 0.005, z: 0.003 },
    scale: 0.18,
  },
];

export default function ThreeBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasWebGL, setHasWebGL] = useState<boolean>(true);
  const [isReady, setIsReady] = useState<boolean>(false);

  // Track target and current scroll position for smooth interpolation
  const scrollYRef = useRef({ current: 0, target: 0 });
  const mouseRef = useRef({ x: 0, y: 0, currentX: 0, currentY: 0 });

  useEffect(() => {
    // 1. Check WebGL support
    const supported = checkWebGLSupport();
    setHasWebGL(supported);
    if (!supported) return;

    let active = true;
    let renderer: any = null;
    let scene: any = null;
    let camera: any = null;
    let modelsArray: { mesh: any; config: typeof backgroundModels[0]; currentZ: number }[] = [];
    let starField: any = null;
    let animFrameId: number;

    loadThreeAndLoader()
      .then(() => {
        if (!active || !canvasRef.current || !containerRef.current) return;

        const THREE = (window as any).THREE;
        if (!THREE) {
          setHasWebGL(false);
          return;
        }

        // Initialize Scene
        scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x0a0a16, 0.035); // fog creates smooth fade-out at depth

        // Initialize Camera
        const w = window.innerWidth;
        const h = window.innerHeight;
        camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
        camera.position.set(0, 0, 5);

        // Initialize WebGLRenderer
        renderer = new THREE.WebGLRenderer({
          canvas: canvasRef.current,
          alpha: true,
          antialias: false, // Turn off antialiasing for raw performance since it's a background
          powerPreference: 'high-performance',
        });
        renderer.setSize(w, h);
        renderer.setPixelRatio(1); // Force pixel ratio 1 for perfectly smooth 60 FPS on all devices
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 0.8;

        // Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        scene.add(ambientLight);

        const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight1.position.set(5, 10, 7);
        scene.add(dirLight1);

        const dirLight2 = new THREE.DirectionalLight(0x6d5dfc, 1.2); // neon fill light
        dirLight2.position.set(-6, -2, -5);
        scene.add(dirLight2);

        const pointLight = new THREE.PointLight(0x2dd4bf, 1.5, 15); // turquoise point glow
        pointLight.position.set(0, 2, -2);
        scene.add(pointLight);

        // Add starfield particle system
        const starsGeometry = new THREE.BufferGeometry();
        const starsCount = 250;
        const starPositions = new Float32Array(starsCount * 3);
        const starColors = new Float32Array(starsCount * 3);

        const spaceColors = [
          new THREE.Color(0x6d5dfc),
          new THREE.Color(0x2dd4bf),
          new THREE.Color(0xff8a3d),
        ];

        for (let i = 0; i < starsCount * 3; i += 3) {
          starPositions[i] = (Math.random() - 0.5) * 35;
          starPositions[i + 1] = (Math.random() - 0.5) * 35;
          starPositions[i + 2] = Math.random() * -40; // extend far into background

          const color = spaceColors[Math.floor(Math.random() * spaceColors.length)];
          starColors[i] = color.r;
          starColors[i + 1] = color.g;
          starColors[i + 2] = color.b;
        }

        starsGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
        starsGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

        const starsMaterial = new THREE.PointsMaterial({
          size: 0.12,
          vertexColors: true,
          transparent: true,
          opacity: 0.7,
        });

        starField = new THREE.Points(starsGeometry, starsMaterial);
        scene.add(starField);

        // Loader
        const loader = new THREE.GLTFLoader();

        // Load configured models
        backgroundModels.forEach((cfg) => {
          loader.load(
            cfg.url,
            (gltf: any) => {
              if (!active) return;
              const mesh = gltf.scene;

              // Center geometry to avoid weird offsets
              const box = new THREE.Box3().setFromObject(mesh);
              const center = box.getCenter(new THREE.Vector3());
              mesh.position.x = -center.x;
              mesh.position.y = -center.y;
              mesh.position.z = -center.z;

              // Wrap in parent group for clean local/global transformations
              const parentGroup = new THREE.Group();
              parentGroup.add(mesh);
              
              // Scale according to config
              parentGroup.scale.set(cfg.scale, cfg.scale, cfg.scale);
              
              // Apply starting base positions
              parentGroup.position.set(cfg.basePos.x, cfg.basePos.y, cfg.basePos.z);
              
              // Randomize initial rotation for realism
              parentGroup.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
              );

              scene.add(parentGroup);
              modelsArray.push({
                mesh: parentGroup,
                config: cfg,
                currentZ: cfg.basePos.z,
              });
            },
            undefined,
            (error: any) => {
              console.warn(`Could not load background model ${cfg.category}, using geometric mesh.`, error);
              // Fallback primitive
              let geom;
              if (cfg.category === 'kitchen') geom = new THREE.CylinderGeometry(0.5, 0.5, 2, 16);
              else if (cfg.category === 'footwear') geom = new THREE.ConeGeometry(0.8, 1.5, 4);
              else geom = new THREE.TorusGeometry(0.6, 0.2, 8, 16);
              
              const mat = new THREE.MeshPhysicalMaterial({
                color: 0x6d5dfc,
                metalness: 0.1,
                roughness: 0.2,
                transmission: 0.6,
                thickness: 0.5,
              });
              const pMesh = new THREE.Mesh(geom, mat);
              const parentGroup = new THREE.Group();
              parentGroup.add(pMesh);
              parentGroup.position.set(cfg.basePos.x, cfg.basePos.y, cfg.basePos.z);
              scene.add(parentGroup);
              modelsArray.push({
                mesh: parentGroup,
                config: cfg,
                currentZ: cfg.basePos.z,
              });
            }
          );
        });

        setIsReady(true);
        document.documentElement.classList.add('three-bg-active');

        // Listeners
        const handleScroll = () => {
          scrollYRef.current.target = window.scrollY;
        };
        window.addEventListener('scroll', handleScroll, { passive: true });

        const handleMouseMove = (e: MouseEvent) => {
          mouseRef.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
          mouseRef.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
        };
        window.addEventListener('mousemove', handleMouseMove);

        const handleResize = () => {
          if (!camera || !renderer) return;
          const width = window.innerWidth;
          const height = window.innerHeight;
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          renderer.setSize(width, height);
        };
        window.addEventListener('resize', handleResize);

        // Animation Loop
        const animate = () => {
          if (!active) return;
          animFrameId = requestAnimationFrame(animate);

          // Interpolate scroll and mouse coords smoothly AND FAST
          scrollYRef.current.current += (scrollYRef.current.target - scrollYRef.current.current) * 0.15;
          mouseRef.current.currentX += (mouseRef.current.x - mouseRef.current.currentX) * 0.15;
          mouseRef.current.currentY += (mouseRef.current.y - mouseRef.current.currentY) * 0.15;

          const scrollZOffset = scrollYRef.current.current * 0.012; // slightly faster scroll parallax

          // Parallax camera shifting based on mouse coords
          if (camera) {
            camera.position.x = mouseRef.current.currentX * 1.5;
            camera.position.y = -mouseRef.current.currentY * 1.5;
            camera.lookAt(new THREE.Vector3(0, 0, -10));
          }

          // Gentle ambient drift for stars
          if (starField) {
            starField.rotation.z += 0.0003;
            starField.position.z = scrollZOffset * 0.4;
          }

          // Animate and wrap models
          modelsArray.forEach((item) => {
            const { mesh, config } = item;

            // Rotation
            mesh.rotation.x += config.rotSpeed.x;
            mesh.rotation.y += config.rotSpeed.y;
            mesh.rotation.z += config.rotSpeed.z;

            // Update Z depth mapping scroll offset
            let localZ = config.basePos.z + scrollZOffset;
            
            // Loop models indefinitely as we scroll deeper into pages
            while (localZ > 5) localZ -= 30;
            while (localZ < -25) localZ += 30;
            
            mesh.position.z = localZ;

            // Subtle drift oscillation
            const time = Date.now() * 0.001;
            mesh.position.x = config.basePos.x + Math.sin(time + config.basePos.z) * 0.15;
            mesh.position.y = config.basePos.y + Math.cos(time * 0.8 + config.basePos.x) * 0.15;
          });

          renderer.render(scene, camera);
        };
        animate();

        return () => {
          window.removeEventListener('scroll', handleScroll);
          window.removeEventListener('mousemove', handleMouseMove);
          window.removeEventListener('resize', handleResize);
        };
      })
      .catch((err) => {
        console.warn('WebGL/Three initialization failed for background:', err);
      });

    return () => {
      active = false;
      cancelAnimationFrame(animFrameId);
      if (renderer) renderer.dispose();
      document.documentElement.classList.remove('three-bg-active');
    };
  }, []);

  // Standard CSS fallback if WebGL is unavailable
  if (!hasWebGL) {
    return (
      <div 
        className="fixed inset-0 w-full h-full -z-10 pointer-events-none bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 opacity-90"
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-full -z-20 pointer-events-none transition-opacity duration-1000 bg-slate-50 dark:bg-[#0a0a16]"
      style={{ opacity: isReady ? 1 : 0 }}
    >
      <canvas ref={canvasRef} className="block w-full h-full opacity-60 dark:opacity-100 transition-opacity duration-1000" />
      {/* Absolute dark/tinted gradient layer for readable contrast (WCAG contrast accessibility) */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,rgba(248,250,252,0.3),rgba(248,250,252,0.95))] dark:bg-[radial-gradient(circle_at_top,rgba(10,10,22,0.1),rgba(10,10,22,0.85))]" />
    </div>
  );
}
