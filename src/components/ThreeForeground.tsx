'use client';

import { useEffect, useRef, useState } from 'react';

// Reusable script loader with global promise cache (matches background script loader)
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
        console.error('Failed loading Three.js for foreground:', err);
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

// Floating foreground assets (placed closer to viewport for foreground depth/blur)
const foregroundModels = [
  {
    category: 'wearables',
    url: 'https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@master/2.0/DamagedHelmet/glTF-Binary/DamagedHelmet.glb',
    basePos: { x: -4.2, y: 2.0, z: 2.2 },
    rotSpeed: { x: 0.007, y: 0.009, z: 0.005 },
    scale: 2.2,
  },
  {
    category: 'footwear',
    url: 'https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@master/2.0/MaterialsVariantsShoe/glTF-Binary/MaterialsVariantsShoe.glb',
    basePos: { x: 4.5, y: -2.2, z: 1.5 },
    rotSpeed: { x: 0.010, y: 0.007, z: 0.004 },
    scale: 4.2,
  },
  {
    category: 'kitchen',
    url: 'https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@master/2.0/WaterBottle/glTF-Binary/WaterBottle.glb',
    basePos: { x: -3.8, y: -3.0, z: 2.8 },
    rotSpeed: { x: 0.005, y: 0.012, z: 0.008 },
    scale: 3.5,
  },
];

function detectTier(): 'low' | 'mid' | 'high' {
  if (typeof navigator === 'undefined') return 'mid';
  const cores = navigator.hardwareConcurrency || 2;
  const mem = (navigator as any).deviceMemory || 2;
  const isMobile = /android|iphone|ipad|ipod/i.test(navigator.userAgent);
  if ((cores <= 2 && mem <= 2) || (isMobile && cores <= 2)) return 'low';
  if (cores >= 4 && mem >= 4 && !isMobile) return 'high';
  return 'mid';
}

export default function ThreeForeground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasWebGL, setHasWebGL] = useState<boolean>(true);
  const [isReady, setIsReady] = useState<boolean>(false);

  // Track target and current scroll position for smooth parallax interpolation
  const scrollYRef = useRef({ current: 0, target: 0 });
  const mouseRef = useRef({ x: 0, y: 0, currentX: 0, currentY: 0 });

  useEffect(() => {
    const supported = checkWebGLSupport();
    setHasWebGL(supported);
    if (!supported) return;

    // Skip heavy foreground 3D on low-end devices
    const tier = detectTier();
    if (tier === 'low') {
      setHasWebGL(false);
      return;
    }

    let active = true;
    let renderer: any = null;
    let scene: any = null;
    let camera: any = null;
    let modelsArray: { mesh: any; config: typeof foregroundModels[0]; currentZ: number }[] = [];
    let animFrameId: number;
    let lastTime = 0;
    const interval = tier === 'mid' ? 1000 / 30 : 1000 / 45;

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

        // Initialize Camera
        const w = window.innerWidth;
        const h = window.innerHeight;
        camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 50);
        camera.position.set(0, 0, 5);

        // Initialize WebGLRenderer
        renderer = new THREE.WebGLRenderer({
          canvas: canvasRef.current,
          alpha: true,
          antialias: false,
          powerPreference: 'high-performance',
        });
        renderer.setSize(w, h);
        renderer.setPixelRatio(1);

        // Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
        dirLight.position.set(4, 8, 12);
        scene.add(dirLight);

        const pointLight = new THREE.PointLight(0x2dd4bf, 2.0, 10); // colored foreground fill glow
        pointLight.position.set(-2, 0, 4);
        scene.add(pointLight);

        // Loader
        const loader = new THREE.GLTFLoader();

        foregroundModels.forEach((cfg) => {
          loader.load(
            cfg.url,
            (gltf: any) => {
              if (!active) return;
              const mesh = gltf.scene;

              // Center geometry
              const box = new THREE.Box3().setFromObject(mesh);
              const center = box.getCenter(new THREE.Vector3());
              mesh.position.x = -center.x;
              mesh.position.y = -center.y;
              mesh.position.z = -center.z;

              const parentGroup = new THREE.Group();
              parentGroup.add(mesh);
              parentGroup.scale.set(cfg.scale, cfg.scale, cfg.scale);
              parentGroup.position.set(cfg.basePos.x, cfg.basePos.y, cfg.basePos.z);
              
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
              console.warn(`Could not load foreground model ${cfg.category}, using lightweight wireframe.`, error);
              // Procedural fallback
              let geom;
              if (cfg.category === 'footwear') {
                geom = new THREE.ConeGeometry(0.8, 1.6, 5);
              } else if (cfg.category === 'wearables') {
                geom = new THREE.SphereGeometry(0.75, 12, 12);
              } else {
                geom = new THREE.TorusGeometry(0.8, 0.25, 8, 24);
              }

              const mat = new THREE.MeshPhysicalMaterial({
                color: 0x2dd4bf,
                metalness: 0.1,
                roughness: 0.3,
                transmission: 0.6,
                thickness: 0.3,
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
        const animate = (time: number) => {
          if (!active) return;
          animFrameId = requestAnimationFrame(animate);
          if (time - lastTime < interval) return;
          lastTime = time;

          const lerp = tier === 'mid' ? 0.1 : 0.15;
          scrollYRef.current.current += (scrollYRef.current.target - scrollYRef.current.current) * lerp;
          mouseRef.current.currentX += (mouseRef.current.x - mouseRef.current.currentX) * lerp;
          mouseRef.current.currentY += (mouseRef.current.y - mouseRef.current.currentY) * lerp;

          const scrollZOffset = scrollYRef.current.current * 0.035;

          modelsArray.forEach((item) => {
            const { mesh, config } = item;

            mesh.rotation.x += config.rotSpeed.x * 2;
            mesh.rotation.y += config.rotSpeed.y * 2;
            mesh.rotation.z += config.rotSpeed.z * 2;

            let localZ = config.basePos.z + scrollZOffset;
            while (localZ > 5) localZ -= 15;
            while (localZ < -10) localZ += 15;
            mesh.position.z = localZ;

            mesh.position.x = config.basePos.x - mouseRef.current.currentX * 1.5;
            mesh.position.y = config.basePos.y + mouseRef.current.currentY * 1.5;
          });

          renderer.render(scene, camera);
        };
        animFrameId = requestAnimationFrame(animate);

        return () => {
          window.removeEventListener('scroll', handleScroll);
          window.removeEventListener('mousemove', handleMouseMove);
          window.removeEventListener('resize', handleResize);
        };
      })
      .catch((err) => {
        console.warn('WebGL/Three initialization failed for foreground:', err);
      });

    return () => {
      active = false;
      cancelAnimationFrame(animFrameId);
      if (renderer) renderer.dispose();
    };
  }, []);

  if (!hasWebGL) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-full z-30 pointer-events-none transition-opacity duration-1000"
      style={{
        opacity: isReady ? 0.25 : 0, // Lower opacity to make up for removing blur
      }}
    >
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}
