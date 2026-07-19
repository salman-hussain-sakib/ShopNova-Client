'use client';

import { useEffect, useRef, useState } from 'react';

interface Point3D {
  x: number;
  y: number;
  z: number;
}

interface Product3DModelProps {
  category: string;
}

export default function Product3DModel({ category }: Product3DModelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotation = useRef({ x: -0.3, y: 0.5 });
  const isDragging = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });

  // Generate 3D geometry depending on product category
  const getGeometry = (): { vertices: Point3D[]; edges: [number, number][] } => {
    const vertices: Point3D[] = [];
    const edges: [number, number][] = [];

    const cat = category.toLowerCase();

    if (cat.includes('audio') || cat.includes('headphone') || cat.includes('sound')) {
      // --- 3D HEADPHONES MODEL ---
      // Headband (Semi-circle arc)
      const numBandSegments = 16;
      const bandRadius = 70;
      for (let i = 0; i <= numBandSegments; i++) {
        const theta = (i / numBandSegments) * Math.PI - Math.PI; // semi-circle
        vertices.push({
          x: Math.cos(theta) * bandRadius,
          y: Math.sin(theta) * bandRadius + 15,
          z: 0,
        });
        if (i > 0) edges.push([i - 1, i]);
      }

      // Left Earcup (cylinder/capsule)
      const leftCenterIdx = vertices.length;
      const earcupRadius = 25;
      const earcupDepth = 20;
      const earcupX = -bandRadius;
      const earcupY = 15;

      // 8 vertices for outer circle, 8 for inner circle
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const cy = Math.cos(angle) * earcupRadius + earcupY;
        const cz = Math.sin(angle) * earcupRadius;
        
        // Inner circle
        vertices.push({ x: earcupX - earcupDepth / 2, y: cy, z: cz });
        // Outer circle
        vertices.push({ x: earcupX + earcupDepth / 2, y: cy, z: cz });

        // Circular edges
        const idx = leftCenterIdx + i * 2;
        const nextIdx = leftCenterIdx + ((i + 1) % 8) * 2;
        edges.push([idx, nextIdx]);
        edges.push([idx + 1, nextIdx + 1]);
        // Bridge edges
        edges.push([idx, idx + 1]);
      }

      // Right Earcup
      const rightCenterIdx = vertices.length;
      const rightX = bandRadius;

      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const cy = Math.cos(angle) * earcupRadius + earcupY;
        const cz = Math.sin(angle) * earcupRadius;

        // Inner circle
        vertices.push({ x: rightX - earcupDepth / 2, y: cy, z: cz });
        // Outer circle
        vertices.push({ x: rightX + earcupDepth / 2, y: cy, z: cz });

        const idx = rightCenterIdx + i * 2;
        const nextIdx = rightCenterIdx + ((i + 1) % 8) * 2;
        edges.push([idx, nextIdx]);
        edges.push([idx + 1, nextIdx + 1]);
        edges.push([idx, idx + 1]);
      }

      // Connect headband ends to earcups
      edges.push([0, leftCenterIdx + 1]);
      edges.push([numBandSegments, rightCenterIdx]);

    } else if (cat.includes('computer') || cat.includes('laptop') || cat.includes('tech')) {
      // --- 3D LAPTOP MODEL ---
      // Base (keyboard part) - Flat cuboid
      const bw = 90, bd = 70, bh = 6;
      const baseVertices = [
        { x: -bw, y: 30, z: -bd }, // Front bottom left (0)
        { x: bw, y: 30, z: -bd },  // Front bottom right (1)
        { x: bw, y: 30, z: bd },   // Back bottom right (2)
        { x: -bw, y: 30, z: bd },  // Back bottom left (3)
        { x: -bw, y: 30 - bh, z: -bd }, // Front top left (4)
        { x: bw, y: 30 - bh, z: -bd },  // Front top right (5)
        { x: bw, y: 30 - bh, z: bd },   // Back top right (6)
        { x: -bw, y: 30 - bh, z: bd },  // Back top left (7)
      ];
      vertices.push(...baseVertices);
      edges.push(
        [0, 1], [1, 2], [2, 3], [3, 0], // Bottom loop
        [4, 5], [5, 6], [6, 7], [7, 4], // Top loop
        [0, 4], [1, 5], [2, 6], [3, 7]  // Verticals
      );

      // Screen (hinged open at 110 degrees)
      const sw = 88, sh = 65, sd = 4;
      const angle = 110 * (Math.PI / 180);
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      // Screen bottom corners sit at back of base (z = bd)
      const baseIndex = 8;
      const screenVertices = [
        // Bottom left hinge
        { x: -sw, y: 30 - bh, z: bd }, // 8
        // Bottom right hinge
        { x: sw, y: 30 - bh, z: bd },  // 9
        // Top right screen corner (rotated)
        { x: sw, y: (30 - bh) - sh * sinA, z: bd - sh * cosA }, // 10
        // Top left screen corner (rotated)
        { x: -sw, y: (30 - bh) - sh * sinA, z: bd - sh * cosA }, // 11
      ];
      vertices.push(...screenVertices);
      edges.push(
        [8, 9], [9, 10], [10, 11], [11, 8] // Screen frame
      );

    } else if (cat.includes('wear') || cat.includes('watch') || cat.includes('fit')) {
      // --- 3D SMARTWATCH MODEL ---
      // Watch body (chubby cylinder watch face)
      const faceRadius = 40;
      const faceHeight = 15;
      const numSegments = 12;

      // Front Face loop
      for (let i = 0; i < numSegments; i++) {
        const theta = (i / numSegments) * Math.PI * 2;
        vertices.push({
          x: Math.cos(theta) * faceRadius,
          y: Math.sin(theta) * faceRadius,
          z: -faceHeight / 2,
        });
        const next = (i + 1) % numSegments;
        edges.push([i, next]);
      }

      // Back Face loop
      for (let i = 0; i < numSegments; i++) {
        const theta = (i / numSegments) * Math.PI * 2;
        vertices.push({
          x: Math.cos(theta) * faceRadius,
          y: Math.sin(theta) * faceRadius,
          z: faceHeight / 2,
        });
        const next = (i + 1) % numSegments;
        edges.push([numSegments + i, numSegments + next]);
        // Bridge edges (depth)
        edges.push([i, numSegments + i]);
      }

      // Watchband (wrapped loop)
      const bandWidth = 20;
      const bandRadiusX = 42;
      const bandRadiusY = 70;
      const bandSegments = 24;

      const bandStartIndex = vertices.length;
      for (let i = 0; i <= bandSegments; i++) {
        // Wrapped oval band around Z-axis
        const phi = (i / bandSegments) * Math.PI * 2;
        const cy = Math.cos(phi) * bandRadiusY;
        const cz = Math.sin(phi) * bandRadiusX;

        // Front edge of band
        vertices.push({ x: -bandWidth / 2, y: cy, z: cz });
        // Back edge of band
        vertices.push({ x: bandWidth / 2, y: cy, z: cz });

        if (i > 0) {
          const prev = bandStartIndex + (i - 1) * 2;
          const curr = bandStartIndex + i * 2;
          edges.push([prev, curr]);
          edges.push([prev + 1, curr + 1]);
          // Cross stitching
          if (i % 2 === 0) edges.push([curr, curr + 1]);
        }
      }

    } else {
      // --- DEFAULT 3D LOGO CONTAINER (Octahedron inside a cube) ---
      const size = 50;
      vertices.push(
        { x: -size, y: -size, z: -size }, // 0
        { x: size, y: -size, z: -size },  // 1
        { x: size, y: size, z: -size },   // 2
        { x: -size, y: size, z: -size },  // 3
        { x: -size, y: -size, z: size },  // 4
        { x: size, y: -size, z: size },   // 5
        { x: size, y: size, z: size },    // 6
        { x: -size, y: size, z: size }    // 7
      );
      edges.push(
        [0, 1], [1, 2], [2, 3], [3, 0],
        [4, 5], [5, 6], [6, 7], [7, 4],
        [0, 4], [1, 5], [2, 6], [3, 7]
      );

      // Inner Diamond
      const d = size * 0.8;
      const offset = 8;
      vertices.push(
        { x: 0, y: -d, z: 0 }, // 8 (Top)
        { x: 0, y: d, z: 0 },  // 9 (Bottom)
        { x: -d, y: 0, z: 0 }, // 10 (Left)
        { x: d, y: 0, z: 0 },  // 11 (Right)
        { x: 0, y: 0, z: -d }, // 12 (Front)
        { x: 0, y: 0, z: d }   // 13 (Back)
      );
      edges.push(
        [8, 10], [8, 11], [8, 12], [8, 13],
        [9, 10], [9, 11], [9, 12], [9, 13],
        [10, 12], [12, 11], [11, 13], [13, 10]
      );
    }

    return { vertices, edges };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let autoRot = 0.005;

    const { vertices, edges } = getGeometry();
    const focalLength = 260;

    const rotateX = (p: Point3D, angle: number): Point3D => {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      return { x: p.x, y: p.y * cos - p.z * sin, z: p.y * sin + p.z * cos };
    };

    const rotateY = (p: Point3D, angle: number): Point3D => {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      return { x: p.x * cos + p.z * sin, y: p.y, z: -p.x * sin + p.z * cos };
    };

    const draw = () => {
      const width = (canvas.width = canvas.clientWidth);
      const height = (canvas.height = canvas.clientHeight);
      const centerX = width / 2;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      // Render hologram background circles
      ctx.strokeStyle = 'rgba(109, 93, 252, 0.06)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 80, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(centerX, centerY, 120, 0, Math.PI * 2);
      ctx.stroke();

      // Project vertices
      const projected = vertices.map((v) => {
        let r = rotateY(v, rotation.current.y + (isDragging.current ? 0 : autoRot));
        r = rotateX(r, rotation.current.x);

        const dist = 240;
        const scale = focalLength / (focalLength + r.z + dist);
        return {
          x: r.x * scale + centerX,
          y: r.y * scale + centerY,
          z: r.z,
          scale,
        };
      });

      if (!isDragging.current) {
        rotation.current.y += autoRot;
      }

      // Draw wireframe edges
      ctx.lineWidth = 1.5;
      edges.forEach(([start, end]) => {
        const p1 = projected[start];
        const p2 = projected[end];
        if (!p1 || !p2) return;

        // Depth cueing (lighter lines in back)
        const avgZ = (p1.z + p2.z) / 2;
        const opacity = Math.max(0.18, 1 - (avgZ + 100) / 200);

        ctx.strokeStyle = `rgba(109, 93, 252, ${opacity})`;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      });

      // Draw glowing vertices
      ctx.fillStyle = 'rgba(24, 197, 159, 0.85)';
      projected.forEach((p) => {
        const size = Math.max(1, 3 * p.scale);
        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fill();
      });

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [category]);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    previousMousePosition.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;

    const deltaX = e.clientX - previousMousePosition.current.x;
    const deltaY = e.clientY - previousMousePosition.current.y;

    rotation.current.x = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, rotation.current.x + deltaY * 0.01));
    rotation.current.y += deltaX * 0.01;

    previousMousePosition.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUpOrLeave = () => {
    isDragging.current = false;
  };

  return (
    <div className="relative aspect-square w-full rounded-2xl overflow-hidden card bg-gradient-to-b from-neutral-light/20 to-transparent flex flex-col items-center justify-center p-4">
      <div className="absolute top-4 left-4 bg-primary/10 text-primary text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider select-none pointer-events-none">
        3D Hologram Preview
      </div>
      
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />

      <div className="absolute bottom-4 text-[10px] text-neutral select-none pointer-events-none">
        Drag to rotate • Auto-spinning enabled
      </div>
    </div>
  );
}
