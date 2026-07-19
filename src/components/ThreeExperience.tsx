'use client';

import { useEffect, useRef, useState } from 'react';
import { API_URL } from '@/lib/api';
import { fallbackProducts } from '@/data/products';

// ─── Script loader (singleton) ──────────────────────────────────────────────
let threeLoadingPromise: Promise<void> | null = null;

function loadThreeAndLoader(): Promise<void> {
  if (threeLoadingPromise) return threeLoadingPromise;
  threeLoadingPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined') { resolve(); return; }
    const loadScript = (url: string) =>
      new Promise<void>((res, rej) => {
        const s = document.createElement('script');
        s.src = url; s.async = true;
        s.onload = () => res();
        s.onerror = () => rej(new Error(`Failed to load ${url}`));
        document.body.appendChild(s);
      });
    loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js')
      .then(() => loadScript('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js'))
      .then(resolve)
      .catch((err) => { threeLoadingPromise = null; reject(err); });
  });
  return threeLoadingPromise;
}

// ─── WebGL check ────────────────────────────────────────────────────────────
function checkWebGL(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
  } catch { return false; }
}

// ─── Device tier ────────────────────────────────────────────────────────────
type Tier = 'low' | 'mid' | 'high';

function detectTier(): Tier {
  if (typeof navigator === 'undefined') return 'mid';
  const cores = navigator.hardwareConcurrency || 2;
  const mem = (navigator as any).deviceMemory || 2;
  const isMobile = /android|iphone|ipad|ipod/i.test(navigator.userAgent);
  if ((cores <= 2 && mem <= 2) || (isMobile && cores <= 2)) return 'low';
  if (cores >= 4 && mem >= 4 && !isMobile) return 'high';
  return 'mid';
}

function tierConfig(tier: Tier) {
  switch (tier) {
    case 'low':  return { productCards: 6,  pixelRatio: 1,    fps: 30, starCount: 30 };
    case 'mid':  return { productCards: 12, pixelRatio: Math.min(window.devicePixelRatio, 1.5), fps: 45, starCount: 60 };
    default:     return { productCards: 18, pixelRatio: Math.min(window.devicePixelRatio, 2), fps: 60, starCount: 100 };
  }
}

// ─── Original 3D GLB model configs ─────────────────────────────────────────
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

// ─── Component ──────────────────────────────────────────────────────────────
export default function ThreeExperience() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasWebGL, setHasWebGL] = useState(true);
  const [isReady, setIsReady] = useState(false);

  const scrollRef = useRef({ cur: 0, tgt: 0 });
  const mouseRef = useRef({ x: 0, y: 0, cx: 0, cy: 0 });

  useEffect(() => {
    if (!checkWebGL()) { setHasWebGL(false); return; }

    const tier = detectTier();
    const cfg = tierConfig(tier);

    let active = true;
    let renderer: any = null;
    let scene: any = null;
    let camera: any = null;
    let frameId: number;
    let lastTime = 0;
    const interval = 1000 / cfg.fps;

    // 3D model tracking
    const glbModels: { mesh: any; config: typeof backgroundModels[0] }[] = [];

    // Product card tracking
    type FloatingCard = {
      mesh: any;
      baseX: number;
      baseY: number;
      baseZ: number;
      rotSpeed: { x: number; y: number; z: number };
      floatSpeed: number;
      floatAmp: number;
      parallaxStrength: number;
    };
    const productCards: FloatingCard[] = [];

    // Fetch products
    const fetchProducts = async (): Promise<{ images: string[] }[]> => {
      try {
        const res = await fetch(`${API_URL}/products?limit=50`);
        const data = await res.json();
        return data.products || fallbackProducts;
      } catch {
        return fallbackProducts as any;
      }
    };

    Promise.all([loadThreeAndLoader(), fetchProducts()])
      .then(([, products]) => {
        if (!active || !canvasRef.current) return;
        const THREE = (window as any).THREE;
        if (!THREE) { setHasWebGL(false); return; }

        // ── Scene ────────────────────────────────────────────────────
        scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x0a0a16, 0.03);

        // ── Camera ───────────────────────────────────────────────────
        const w = window.innerWidth;
        const h = window.innerHeight;
        camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
        camera.position.set(0, 0, 5);

        // ── Renderer ─────────────────────────────────────────────────
        renderer = new THREE.WebGLRenderer({
          canvas: canvasRef.current,
          alpha: true,
          antialias: tier !== 'low',
          powerPreference: tier === 'low' ? 'low-power' : 'high-performance',
        });
        renderer.setSize(w, h);
        renderer.setPixelRatio(cfg.pixelRatio);
        if (tier !== 'low') {
          renderer.toneMapping = THREE.ACESFilmicToneMapping;
          renderer.toneMappingExposure = 0.8;
        }

        // ── Lights (original style) ──────────────────────────────────
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        scene.add(ambientLight);

        const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight1.position.set(5, 10, 7);
        scene.add(dirLight1);

        const dirLight2 = new THREE.DirectionalLight(0x6d5dfc, 1.2);
        dirLight2.position.set(-6, -2, -5);
        scene.add(dirLight2);

        const pointLight = new THREE.PointLight(0x2dd4bf, 1.5, 15);
        pointLight.position.set(0, 2, -2);
        scene.add(pointLight);

        // ── Star particles ───────────────────────────────────────────
        const starsGeo = new THREE.BufferGeometry();
        const starCount = cfg.starCount;
        const sPos = new Float32Array(starCount * 3);
        const sCol = new Float32Array(starCount * 3);
        const palette = [new THREE.Color(0x6d5dfc), new THREE.Color(0x2dd4bf), new THREE.Color(0xff8a3d)];
        for (let i = 0; i < starCount * 3; i += 3) {
          sPos[i] = (Math.random() - 0.5) * 35;
          sPos[i + 1] = (Math.random() - 0.5) * 35;
          sPos[i + 2] = Math.random() * -40;
          const c = palette[Math.floor(Math.random() * 3)];
          sCol[i] = c.r; sCol[i + 1] = c.g; sCol[i + 2] = c.b;
        }
        starsGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
        starsGeo.setAttribute('color', new THREE.BufferAttribute(sCol, 3));
        const starMat = new THREE.PointsMaterial({
          size: 0.12,
          vertexColors: true,
          transparent: true,
          opacity: 0.7,
        });
        const starField = new THREE.Points(starsGeo, starMat);
        scene.add(starField);

        // ── Load original 3D GLB models ──────────────────────────────
        const loader = new THREE.GLTFLoader();

        backgroundModels.forEach((cfg) => {
          loader.load(
            cfg.url,
            (gltf: any) => {
              if (!active) return;
              const mesh = gltf.scene;

              const box = new THREE.Box3().setFromObject(mesh);
              const center = box.getCenter(new THREE.Vector3());
              mesh.position.set(-center.x, -center.y, -center.z);

              const parentGroup = new THREE.Group();
              parentGroup.add(mesh);
              parentGroup.scale.set(cfg.scale, cfg.scale, cfg.scale);
              parentGroup.position.set(cfg.basePos.x, cfg.basePos.y, cfg.basePos.z);
              parentGroup.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI,
              );

              scene.add(parentGroup);
              glbModels.push({ mesh: parentGroup, config: cfg });
            },
            undefined,
            (error: any) => {
              // Fallback primitive
              if (!active) return;
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
              glbModels.push({ mesh: parentGroup, config: cfg });
            },
          );
        });

        // ── Load product image cards ON TOP of 3D models ─────────────
        const textureLoader = new THREE.TextureLoader();
        const cardW = 0.9;
        const cardH = 1.1;
        const tallRange = 50;

        const productImages: string[] = [];
        for (const p of products) {
          if (p.images && p.images[0]) {
            productImages.push(p.images[0]);
          }
        }
        if (productImages.length === 0) {
          productImages.push(
            'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
            'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400',
          );
        }

        let cardLoaded = 0;
        const totalCards = Math.min(cfg.productCards, productImages.length * 2);

        for (let i = 0; i < totalCards; i++) {
          const imgIndex = i % productImages.length;
          const imgUrl = productImages[imgIndex];
          const geom = new THREE.PlaneGeometry(cardW, cardH, 1, 1);

          textureLoader.load(
            imgUrl,
            (texture: any) => {
              if (!active) return;
              texture.minFilter = THREE.LinearFilter;
              texture.magFilter = THREE.LinearFilter;

              const mat = new THREE.MeshBasicMaterial({
                map: texture,
                transparent: true,
                opacity: 0,
                side: THREE.DoubleSide,
              });

              const mesh = new THREE.Mesh(geom, mat);
              const baseX = (Math.random() - 0.5) * 12;
              const baseY = (Math.random() - 0.5) * tallRange;
              const baseZ = 1 + Math.random() * 4;

              mesh.position.set(baseX, baseY, baseZ);
              mesh.rotation.set(
                (Math.random() - 0.5) * 0.3,
                (Math.random() - 0.5) * 0.4,
                (Math.random() - 0.5) * 0.2,
              );

              scene.add(mesh);
              productCards.push({
                mesh, baseX, baseY, baseZ,
                rotSpeed: { x: (Math.random() - 0.5) * 0.004, y: (Math.random() - 0.5) * 0.006, z: (Math.random() - 0.5) * 0.003 },
                floatSpeed: 0.2 + Math.random() * 0.5,
                floatAmp: 0.2 + Math.random() * 0.4,
                parallaxStrength: 0.2 + Math.random() * 0.4,
              });

              cardLoaded++;
              if (cardLoaded >= totalCards) {
                setIsReady(true);
                document.documentElement.classList.add('three-bg-active');
              }
            },
            undefined,
            () => {
              // Fallback colored card
              const mat = new THREE.MeshBasicMaterial({
                color: new THREE.Color(palette[i % 3]),
                transparent: true,
                opacity: 0,
                side: THREE.DoubleSide,
              });
              const mesh = new THREE.Mesh(geom, mat);
              const baseX = (Math.random() - 0.5) * 12;
              const baseY = (Math.random() - 0.5) * tallRange;
              const baseZ = 1 + Math.random() * 4;
              mesh.position.set(baseX, baseY, baseZ);
              scene.add(mesh);
              productCards.push({
                mesh, baseX, baseY, baseZ,
                rotSpeed: { x: (Math.random() - 0.5) * 0.004, y: (Math.random() - 0.5) * 0.006, z: (Math.random() - 0.5) * 0.003 },
                floatSpeed: 0.2 + Math.random() * 0.5,
                floatAmp: 0.2 + Math.random() * 0.4,
                parallaxStrength: 0.2 + Math.random() * 0.4,
              });
              cardLoaded++;
              if (cardLoaded >= totalCards) {
                setIsReady(true);
                document.documentElement.classList.add('three-bg-active');
              }
            },
          );
        }

        // Also mark ready if GLB models load but no product cards yet
        setTimeout(() => {
          if (!isReady) {
            setIsReady(true);
            document.documentElement.classList.add('three-bg-active');
          }
        }, 3000);

        // ── Events ───────────────────────────────────────────────────
        const onScroll = () => { scrollRef.current.tgt = window.scrollY; };
        const onMouse = (e: MouseEvent) => {
          mouseRef.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
          mouseRef.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
        };
        const onResize = () => {
          if (!camera || !renderer) return;
          camera.aspect = window.innerWidth / window.innerHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('mousemove', onMouse);
        window.addEventListener('resize', onResize);

        // ── Animation loop ───────────────────────────────────────────
        const animate = (time: number) => {
          if (!active) return;
          frameId = requestAnimationFrame(animate);
          if (time - lastTime < interval) return;
          lastTime = time;

          const lerp = tier === 'low' ? 0.08 : 0.15;
          scrollRef.current.cur += (scrollRef.current.tgt - scrollRef.current.cur) * lerp;
          mouseRef.current.cx += (mouseRef.current.x - mouseRef.current.cx) * lerp;
          mouseRef.current.cy += (mouseRef.current.y - mouseRef.current.cy) * lerp;

          const scrollZOffset = scrollRef.current.cur * 0.012;
          const cardScrollOffset = scrollRef.current.cur * 0.008;

          // Camera parallax
          camera.position.x = mouseRef.current.cx * 1.5;
          camera.position.y = -mouseRef.current.cy * 1.5;
          camera.lookAt(new THREE.Vector3(0, 0, -10));

          // Star field drift
          starField.rotation.z += 0.0003;
          starField.position.z = scrollZOffset * 0.4;

          // ── Animate original GLB models ─────────────────────────────
          const t = Date.now() * 0.001;
          glbModels.forEach((item) => {
            const { mesh, config } = item;

            mesh.rotation.x += config.rotSpeed.x;
            mesh.rotation.y += config.rotSpeed.y;
            mesh.rotation.z += config.rotSpeed.z;

            let localZ = config.basePos.z + scrollZOffset;
            while (localZ > 5) localZ -= 30;
            while (localZ < -25) localZ += 30;
            mesh.position.z = localZ;

            mesh.position.x = config.basePos.x + Math.sin(t + config.basePos.z) * 0.15;
            mesh.position.y = config.basePos.y + Math.cos(t * 0.8 + config.basePos.x) * 0.15;
          });

          // ── Animate product image cards ─────────────────────────────
          for (let i = 0; i < productCards.length; i++) {
            const card = productCards[i];
            const { mesh } = card;

            // Fade in
            if (mesh.material.opacity < 0.85) {
              mesh.material.opacity = Math.min(mesh.material.opacity + 0.012, 0.85);
            }

            // Gentle rotation
            mesh.rotation.x += card.rotSpeed.x;
            mesh.rotation.y += card.rotSpeed.y;
            mesh.rotation.z += card.rotSpeed.z;

            // Float oscillation
            const floatY = Math.sin(t * card.floatSpeed + i * 1.7) * card.floatAmp;
            const floatX = Math.cos(t * card.floatSpeed * 0.6 + i * 2.3) * card.floatAmp * 0.4;

            // Position with scroll + mouse parallax
            mesh.position.x = card.baseX + floatX + mouseRef.current.cx * card.parallaxStrength;
            mesh.position.y = card.baseY + floatY - cardScrollOffset + mouseRef.current.cy * card.parallaxStrength * 0.4;
            mesh.position.z = card.baseZ + Math.sin(t * 0.3 + i) * 0.2;
          }

          renderer.render(scene, camera);
        };
        frameId = requestAnimationFrame(animate);

        return () => {
          window.removeEventListener('scroll', onScroll);
          window.removeEventListener('mousemove', onMouse);
          window.removeEventListener('resize', onResize);
        };
      })
      .catch((err) => console.warn('[ThreeExperience] init failed:', err));

    return () => {
      active = false;
      cancelAnimationFrame(frameId);
      if (renderer) renderer.dispose();
      document.documentElement.classList.remove('three-bg-active');
    };
  }, []);

  if (!hasWebGL) return null;

  return (
    <>
      {/* Dark backdrop */}
      <div
        className="fixed inset-0 w-full h-full -z-10 pointer-events-none bg-slate-50 dark:bg-[#0a0a16] transition-opacity duration-1000"
        style={{ opacity: isReady ? 1 : 0 }}
      />
      {/* 3D canvas behind content — GLB models + product cards */}
      <div
        ref={containerRef}
        className="fixed inset-0 w-full h-full -z-[1] pointer-events-none transition-opacity duration-1000"
        style={{ opacity: isReady ? 0.8 : 0 }}
      >
        <canvas ref={canvasRef} className="block w-full h-full opacity-60 dark:opacity-100 transition-opacity duration-1000" />
      </div>
    </>
  );
}
