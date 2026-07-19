'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

interface Product3DViewerProps {
  category?: string;
  slug?: string;
  fallbackImage?: string;
  autoRotate?: boolean;
  interactive?: boolean;
  scrollSync?: boolean; // If true, syncs rotation/position to page scroll
  mouseSync?: boolean;  // If true, responds to mouse movement
  height?: string;
  width?: string;
}

// Global script loading state to prevent double loading
let threeLoadingPromise: Promise<void> | null = null;

function loadThreeAndPlugins(): Promise<void> {
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

    // Load Three.js first, then loaders & controls, then GSAP
    loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js')
      .then(() => {
        return Promise.all([
          loadScript('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js'),
          loadScript('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js'),
          loadScript('https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js'),
        ]);
      })
      .then(() => {
        return loadScript('https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js');
      })
      .then(() => {
        resolve();
      })
      .catch((err) => {
        console.error('Failed loading 3D scripts:', err);
        threeLoadingPromise = null; // Reset on failure
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

// Map categories to high-quality lightweight CC0 GLB models from KhronosGroup sample models repo (fully CORS compliant)
// Only map EXACT matches to avoid showing a helmet for a smartwatch
const categoryModelMap: Record<string, string> = {
  footwear: 'https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@master/2.0/MaterialsVariantsShoe/glTF-Binary/MaterialsVariantsShoe.glb',
};

export default function Product3DViewer({
  category = 'default',
  slug = '',
  fallbackImage = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600',
  autoRotate = true,
  interactive = false,
  scrollSync = false,
  mouseSync = false,
  height = '100%',
  width = '100%',
}: Product3DViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasWebGL, setHasWebGL] = useState<boolean>(true);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  
  // Track hover state for list hover pause/play
  const isHovered = useRef(false);

  useEffect(() => {
    // 1. Initial WebGL validation
    const supported = checkWebGLSupport();
    setHasWebGL(supported);
    if (!supported) return;

    let active = true;
    let renderer: any = null;
    let scene: any = null;
    let camera: any = null;
    let controls: any = null;
    let modelMesh: any = null;
    let animFrameId: number;

    loadThreeAndPlugins()
      .then(() => {
        if (!active || !canvasRef.current || !containerRef.current) return;

        const THREE = (window as any).THREE;
        if (!THREE) {
          setHasWebGL(false);
          return;
        }

        // Initialize Scene
        scene = new THREE.Scene();

        // Get container dimensions
        const rect = containerRef.current.getBoundingClientRect();
        const w = rect.width || 300;
        const h = rect.height || 300;

        // Initialize Camera
        camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
        camera.position.set(0, 0, 5);

        // Initialize Renderer
        renderer = new THREE.WebGLRenderer({
          canvas: canvasRef.current,
          alpha: true,
          antialias: true,
          powerPreference: 'high-performance',
        });
        renderer.setSize(w, h);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.0;
        renderer.shadowMap.enabled = true;

        // Add Premium Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);

        const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
        dirLight1.position.set(5, 8, 5);
        scene.add(dirLight1);

        const dirLight2 = new THREE.DirectionalLight(0x8b7cff, 0.8); // slight colored fill light
        dirLight2.position.set(-5, 3, -5);
        scene.add(dirLight2);

        const pointLight = new THREE.PointLight(0x2dd4bf, 0.5, 10);
        pointLight.position.set(0, 0, 2);
        scene.add(pointLight);

        // OrbitControls for Details Page
        if (interactive && (window as any).THREE.OrbitControls) {
          controls = new THREE.OrbitControls(camera, renderer.domElement);
          controls.enableDamping = true;
          controls.dampingFactor = 0.05;
          controls.maxDistance = 10;
          controls.minDistance = 2;
          controls.enableZoom = true;
        }

        // Helper to center and scale loaded model
        const centerAndScaleModel = (gltfScene: any) => {
          const box = new THREE.Box3().setFromObject(gltfScene);
          const size = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());

          // Reset center position
          gltfScene.position.x += (gltfScene.position.x - center.x);
          gltfScene.position.y += (gltfScene.position.y - center.y);
          gltfScene.position.z += (gltfScene.position.z - center.z);

          // Standardize size
          const maxDim = Math.max(size.x, size.y, size.z);
          const scale = 2.4 / maxDim; // fits box nicely
          gltfScene.scale.set(scale, scale, scale);
        };

        // Determine Model URL
        const catKey = category.toLowerCase().trim();
        const modelUrl = categoryModelMap[catKey];

        if (modelUrl && THREE.GLTFLoader) {
          // Load glTF model from CDN
          const loader = new THREE.GLTFLoader();
          loader.load(
            modelUrl,
            (gltf: any) => {
              if (!active) return;
              modelMesh = gltf.scene;
              centerAndScaleModel(modelMesh);
              scene.add(modelMesh);
              setIsLoaded(true);

              // Hook up GSAP Scroll Trigger for Home Hero or Section scroll synchronization
              const gsap = (window as any).gsap;
              const ScrollTrigger = (window as any).ScrollTrigger;
              if (scrollSync && gsap && ScrollTrigger && modelMesh) {
                gsap.registerPlugin(ScrollTrigger);
                gsap.to(modelMesh.rotation, {
                  y: Math.PI * 4,
                  x: 0.8,
                  scrollTrigger: {
                    trigger: containerRef.current,
                    start: 'top center',
                    end: 'bottom+=1500 top',
                    scrub: 1.2,
                  },
                });
                gsap.to(modelMesh.position, {
                  y: -0.5,
                  z: -1.0,
                  scrollTrigger: {
                    trigger: containerRef.current,
                    start: 'top center',
                    end: 'bottom+=1500 top',
                    scrub: 1.2,
                  },
                });
              }
            },
            undefined,
            (error: any) => {
              console.warn(`Could not load GLB for ${category}, falling back to geometric premium mesh.`, error);
              createGeometricFallback();
            }
          );
        } else {
          // Create beautiful geometric procedural placeholder shape
          createGeometricFallback();
        }

        function createGeometricFallback() {
          const group = new THREE.Group();
          const mat = new THREE.MeshPhysicalMaterial({
            color: 0x6d5dfc,
            metalness: 0.1,
            roughness: 0.1,
            transmission: 0.6,
            ior: 1.5,
            thickness: 0.5,
            specularIntensity: 1.0,
            clearcoat: 1.0,
            clearcoatRoughness: 0.1,
          });

          if (catKey.includes('audio') || catKey.includes('headphone')) {
            // Headphones: Torus for band, cylinders for earcups
            const band = new THREE.Mesh(new THREE.TorusGeometry(1, 0.15, 16, 50, Math.PI), mat);
            band.rotation.z = Math.PI;
            const leftCup = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.3, 32), mat);
            leftCup.rotation.z = Math.PI / 2;
            leftCup.position.set(-1, -0.2, 0);
            const rightCup = leftCup.clone();
            rightCup.position.set(1, -0.2, 0);
            group.add(band, leftCup, rightCup);
          } else if (catKey.includes('wear') || catKey.includes('watch')) {
            // Smart Watch: Cylinder for face, box for band
            const face = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.2, 32), mat);
            face.rotation.x = Math.PI / 2;
            const band = new THREE.Mesh(new THREE.BoxGeometry(0.8, 2.5, 0.1), mat);
            group.add(face, band);
          } else if (catKey.includes('computer') || catKey.includes('laptop')) {
            // Laptop: Two thin boxes
            const base = new THREE.Mesh(new THREE.BoxGeometry(2, 0.1, 1.5), mat);
            const screen = new THREE.Mesh(new THREE.BoxGeometry(2, 1.5, 0.1), mat);
            screen.position.set(0, 0.75, -0.75);
            group.add(base, screen);
          } else if (catKey.includes('home office') || catKey.includes('lamp')) {
            // Lamp: Cone on a stick
            const base = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.1, 32), mat);
            const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.5, 16), mat);
            neck.position.y = 0.75;
            const shade = new THREE.Mesh(new THREE.ConeGeometry(0.6, 0.8, 32), mat);
            shade.position.y = 1.6;
            group.add(base, neck, shade);
          } else if (catKey.includes('kitchen') || catKey.includes('espresso')) {
            // Espresso Machine: Box with cylinder spout
            const body = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2, 1.5), mat);
            const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.5, 16), mat);
            spout.rotation.x = Math.PI / 2;
            spout.position.set(0, 0.5, 0.8);
            group.add(body, spout);
          } else if (catKey.includes('creative') || catKey.includes('tablet')) {
            // Tablet
            const tablet = new THREE.Mesh(new THREE.BoxGeometry(2, 1.5, 0.1), mat);
            group.add(tablet);
          } else if (catKey.includes('helmet')) {
             // Helmet fallback
             const helmet = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2), mat);
             group.add(helmet);
          } else {
            // Fall back to 2D image gallery if no matching asset or procedural shape
            setHasError(true);
            return;
          }

          modelMesh = group;
          centerAndScaleModel(modelMesh);
          scene.add(modelMesh);
          setIsLoaded(true);
        }

        // Handle Pointer parallax offsets
        let mouseX = 0;
        let mouseY = 0;
        const handleMouseMove = (e: MouseEvent) => {
          if (!mouseSync) return;
          mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
          mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
        };
        window.addEventListener('mousemove', handleMouseMove);

        // Animation loop
        const animate = () => {
          if (!active) return;
          animFrameId = requestAnimationFrame(animate);

          // Update controls
          if (controls) controls.update();

          // Apply auto-rotation if enabled and not currently dragging
          if (modelMesh) {
            const shouldRotate = autoRotate && (!interactive || !isDraggingRef.current);
            if (shouldRotate) {
              // On lists, only spin on hover
              if (!interactive && !isHovered.current) {
                // slowly glide back to default angle
                modelMesh.rotation.y += (0 - modelMesh.rotation.y) * 0.05;
              } else {
                modelMesh.rotation.y += 0.015;
              }
            }

            // Apply slight mouse parallax movement
            if (mouseSync) {
              modelMesh.rotation.y += (mouseX * 0.5 - modelMesh.rotation.y) * 0.05;
              modelMesh.rotation.x += (mouseY * 0.4 - modelMesh.rotation.x) * 0.05;
            }
          }

          renderer.render(scene, camera);
        };
        animate();

        // Responsive handling
        const resizeObserver = new ResizeObserver((entries) => {
          if (!entries[0]) return;
          const { width: currentW, height: currentH } = entries[0].contentRect;
          if (camera && renderer) {
            camera.aspect = currentW / currentH;
            camera.updateProjectionMatrix();
            renderer.setSize(currentW, currentH);
          }
        });
        resizeObserver.observe(containerRef.current);

        return () => {
          window.removeEventListener('mousemove', handleMouseMove);
          resizeObserver.disconnect();
        };
      })
      .catch((err) => {
        console.warn('WebGL/Three initialization failed:', err);
        setHasError(true);
      });

    // Tracking drag state
    const isDraggingRef = { current: false };
    const onMouseDown = () => { isDraggingRef.current = true; };
    const onMouseUp = () => { isDraggingRef.current = false; };
    const canvasEl = canvasRef.current;
    if (canvasEl) {
      canvasEl.addEventListener('mousedown', onMouseDown);
      window.addEventListener('mouseup', onMouseUp);
    }

    return () => {
      active = false;
      cancelAnimationFrame(animFrameId);
      if (canvasEl) {
        canvasEl.removeEventListener('mousedown', onMouseDown);
      }
      window.removeEventListener('mouseup', onMouseUp);
      if (renderer) renderer.dispose();
    };
  }, [category, autoRotate, interactive, scrollSync, mouseSync]);

  // Handle fallback rendering
  if (!hasWebGL || hasError) {
    return (
      <div 
        className="relative w-full h-full flex items-center justify-center bg-neutral-light/20 rounded-2xl overflow-hidden"
        style={{ height, width }}
      >
        <Image
          src={fallbackImage}
          alt="Product Fallback Preview"
          fill
          className="object-cover"
          sizes="400px"
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => { isHovered.current = true; }}
      onMouseLeave={() => { isHovered.current = false; }}
      className="relative w-full h-full overflow-hidden transition-all duration-700 ease-out"
      style={{
        height,
        width,
        opacity: isLoaded ? 1 : 0.4,
        scale: isLoaded ? '1' : '0.98',
      }}
    >
      <canvas ref={canvasRef} className="block w-full h-full select-none cursor-grab active:cursor-grabbing" />
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-light/5 backdrop-blur-sm">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
