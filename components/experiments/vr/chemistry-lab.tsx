"use client"
/*
import { useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import { Box, Sphere, Text } from "@react-three/drei"

export function ChemistryLab({
  parameters = {},
}: {
  parameters?: { temperature?: number; k?: number; showGraph?: boolean }
}) {
  const N = 120
  const states = useMemo(() => Array.from({ length: N }).map(() => 0), [N]) // 0 => A, 1 => B
  const positions = useMemo<[number, number, number][]>(
    () =>
      Array.from({ length: N }).map(() => [
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 4,
      ]),
    [N],
  )

  const concA = useRef(N)
  const concB = useRef(0)

  useFrame((_, dt) => {
    const kEff = (parameters.k ?? 0.4) * Math.exp(((parameters.temperature ?? 298) - 298) / 500)
    const p = 1 - Math.exp(-kEff * dt)
    for (let i = 0; i < N; i++) {
      if (states[i] === 0 && Math.random() < p) {
        states[i] = 1
        concA.current -= 1
        concB.current += 1
      }
    }
    positions.forEach((p) => {
      p[0] += (Math.random() - 0.5) * 0.01
      p[1] += (Math.random() - 0.5) * 0.01
      p[2] += (Math.random() - 0.5) * 0.01
    })
  })

  const hA = () => (concA.current / N) * 1.5
  const hB = () => (concB.current / N) * 1.5

  return (
    <group>
      {/* Table *//*}
      <Box args={[8, 0.1, 4]} position={[0, -1.2, 0]}>
        <meshStandardMaterial color="#374151" />
      </Box>

      {/* Container *//*}
      <Box args={[5, 2.2, 5]}>
        <meshStandardMaterial color="#111827" transparent opacity={0.12} />
      </Box>

      {positions.map((pos, i) => (
        <Sphere key={i} args={[0.06]} position={pos}>
          <meshStandardMaterial color={states[i] === 0 ? "#3b82f6" : "#ef4444"} />
        </Sphere>
      ))}

      <Text position={[0, -1.6, 0]} fontSize={0.1} color="white" anchorX="center">
        {"VR Chemistry Lab: A → B"}
      </Text>

      {parameters.showGraph !== false && (
        <group position={[3, -0.3, 0]}>
          <Box args={[0.35, hA(), 0.35]} position={[0, hA() / 2 - 0.8, 0]}>
            <meshStandardMaterial color="#3b82f6" />
          </Box>
          <Box args={[0.35, hB(), 0.35]} position={[0.7, hB() / 2 - 0.8, 0]}>
            <meshStandardMaterial color="#ef4444" />
          </Box>
          <Text position={[0.0, -1.0, 0]} fontSize={0.08} color="white">
            {"[A]"}
          </Text>
          <Text position={[0.7, -1.0, 0]} fontSize={0.08} color="white">
            {"[B]"}
          </Text>
        </group>
      )}
    </group>
  )
}
*/
import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';

function VRChemistryLab() {
  const canvasRef = useRef(null);
  const [experiment, setExperiment] = useState('equilibrium');
  const [temperature, setTemperature] = useState(298);
  const [k, setK] = useState(0.4);
  const [keq, setKeq] = useState(4);
  const [pH, setPH] = useState(7);
  const [showGraph, setShowGraph] = useState(true);

  useEffect(() => {
    if (!canvasRef.current) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x0a0a0a, 8, 20);
    
    const camera = new THREE.PerspectiveCamera(60, canvasRef.current.clientWidth / canvasRef.current.clientHeight, 0.1, 1000);
    camera.position.set(7, 4, 7);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ 
      canvas: canvasRef.current, 
      antialias: true,
      alpha: true 
    });
    renderer.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x0a0a0a, 1);

    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(ambientLight);
    
    const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
    mainLight.position.set(5, 8, 5);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    scene.add(mainLight);
    
    const fillLight = new THREE.PointLight(0x6495ed, 0.5);
    fillLight.position.set(-5, 3, -3);
    scene.add(fillLight);

    const tableGeometry = new THREE.BoxGeometry(10, 0.15, 6);
    const tableMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x8b7355,
      roughness: 0.8,
      metalness: 0.1
    });
    const table = new THREE.Mesh(tableGeometry, tableMaterial);
    table.position.set(0, -1.4, 0);
    table.receiveShadow = true;
    scene.add(table);

    const legGeometry = new THREE.CylinderGeometry(0.08, 0.08, 1.2, 16);
    const legPositions = [[-4, -2, -2.5], [4, -2, -2.5], [-4, -2, 2.5], [4, -2, 2.5]];
    legPositions.forEach(pos => {
      const leg = new THREE.Mesh(legGeometry, tableMaterial);
      leg.position.set(pos[0], pos[1], pos[2]);
      leg.castShadow = true;
      scene.add(leg);
    });

    const beakerGroup = new THREE.Group();
    const beakerGeometry = new THREE.CylinderGeometry(2, 2, 3, 32, 1, true);
    const beakerMaterial = new THREE.MeshPhysicalMaterial({ 
      color: 0xffffff,
      transparent: true,
      opacity: 0.15,
      roughness: 0.1,
      metalness: 0.0,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      transmission: 0.9,
      thickness: 0.5,
      side: THREE.DoubleSide
    });
    const beaker = new THREE.Mesh(beakerGeometry, beakerMaterial);
    beaker.castShadow = true;
    beaker.receiveShadow = true;
    beakerGroup.add(beaker);

    const bottomGeometry = new THREE.CircleGeometry(2, 32);
    const bottom = new THREE.Mesh(bottomGeometry, beakerMaterial);
    bottom.rotation.x = -Math.PI / 2;
    bottom.position.y = -1.5;
    beakerGroup.add(bottom);

    const rimGeometry = new THREE.TorusGeometry(2, 0.08, 16, 32);
    const rimMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xe0e0e0,
      roughness: 0.3,
      metalness: 0.5
    });
    const rim = new THREE.Mesh(rimGeometry, rimMaterial);
    rim.position.y = 1.5;
    beakerGroup.add(rim);

    for (let i = 1; i <= 5; i++) {
      const markGeometry = new THREE.TorusGeometry(2.02, 0.01, 8, 32);
      const markMaterial = new THREE.MeshBasicMaterial({ color: 0x808080 });
      const mark = new THREE.Mesh(markGeometry, markMaterial);
      mark.position.y = -1.5 + (i * 0.5);
      beakerGroup.add(mark);
    }

    beakerGroup.position.y = 0.1;
    scene.add(beakerGroup);

    const liquidGeometry = new THREE.CylinderGeometry(1.95, 1.95, 2.8, 32);
    const liquidMaterial = new THREE.MeshPhysicalMaterial({ 
      color: 0x3b82f6,
      transparent: true,
      opacity: 0.6,
      roughness: 0.1,
      metalness: 0.0,
      transmission: 0.3,
      thickness: 1.0
    });
    const liquid = new THREE.Mesh(liquidGeometry, liquidMaterial);
    liquid.position.y = -0.25;
    scene.add(liquid);

    const N = 120;
    const particles = [];
    const velocities = [];
    
    for (let i = 0; i < N; i++) {
      const particleGeometry = new THREE.SphereGeometry(0.06, 16, 16);
      const material = new THREE.MeshStandardMaterial({ 
        color: 0x3b82f6,
        roughness: 0.3,
        metalness: 0.8,
        emissive: 0x1e3a8a,
        emissiveIntensity: 0.2
      });
      const particle = new THREE.Mesh(particleGeometry, material);
      particle.position.set(
        (Math.random() - 0.5) * 3.5,
        (Math.random() - 0.5) * 2.5 - 0.2,
        (Math.random() - 0.5) * 3.5
      );
      particle.castShadow = true;
      particle.userData = { 
        state: 'A',
        energy: Math.random() * 2 + 1
      };
      scene.add(particle);
      particles.push(particle);
      velocities.push(new THREE.Vector3(
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.5
      ));
    }

    const catalysts = [];
    const catalystPositions = [[0, -0.5, 0], [1.2, 0.2, 0], [-1.2, 0.2, 0], [0, 0.2, 1.2], [0, 0.2, -1.2]];
    
    catalystPositions.forEach(pos => {
      const catalystGeometry = new THREE.SphereGeometry(0.18, 32, 32);
      const material = new THREE.MeshStandardMaterial({ 
        color: 0xffd700,
        roughness: 0.2,
        metalness: 0.95,
        emissive: 0xffa500,
        emissiveIntensity: 0.15
      });
      const catalyst = new THREE.Mesh(catalystGeometry, material);
      catalyst.position.set(pos[0], pos[1], pos[2]);
      catalyst.castShadow = true;
      catalyst.visible = false;
      
      const glowGeometry = new THREE.SphereGeometry(0.22, 32, 32);
      const glowMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xffd700,
        transparent: true,
        opacity: 0.2
      });
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      catalyst.add(glow);
      
      scene.add(catalyst);
      catalysts.push(catalyst);
    });

    const stripGeometry = new THREE.BoxGeometry(0.3, 1.5, 0.05);
    const stripMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x10b981,
      roughness: 0.7
    });
    const strip = new THREE.Mesh(stripGeometry, stripMaterial);
    strip.position.set(2.3, 0, 0);
    strip.rotation.y = -0.3;
    strip.castShadow = true;
    scene.add(strip);

    const thermometerGroup = new THREE.Group();
    const thermometerBody = new THREE.CylinderGeometry(0.08, 0.08, 2, 16);
    const thermometerMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xe0e0e0,
      transparent: true,
      opacity: 0.7,
      roughness: 0.2
    });
    const thermometer = new THREE.Mesh(thermometerBody, thermometerMaterial);
    thermometer.castShadow = true;
    thermometerGroup.add(thermometer);
    
    const mercuryGeometry = new THREE.CylinderGeometry(0.04, 0.04, 1.5, 16);
    const mercuryMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xff0000,
      emissive: 0x8b0000,
      emissiveIntensity: 0.3,
      metalness: 0.8
    });
    const mercury = new THREE.Mesh(mercuryGeometry, mercuryMaterial);
    mercury.position.y = -0.25;
    thermometerGroup.add(mercury);
    
    thermometerGroup.position.set(-2.5, 0.5, 0);
    thermometerGroup.rotation.z = 0.2;
    scene.add(thermometerGroup);

    const graphGroup = new THREE.Group();
    const barAGeometry = new THREE.BoxGeometry(0.4, 1, 0.4);
    const barAMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x3b82f6,
      roughness: 0.5,
      metalness: 0.3
    });
    const barA = new THREE.Mesh(barAGeometry, barAMaterial);
    barA.castShadow = true;
    graphGroup.add(barA);
    
    const barBMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xef4444,
      roughness: 0.5,
      metalness: 0.3
    });
    const barB = new THREE.Mesh(barAGeometry, barBMaterial);
    barB.position.x = 0.6;
    barB.castShadow = true;
    graphGroup.add(barB);
    
    const baseGeometry = new THREE.BoxGeometry(1.5, 0.1, 0.8);
    const baseMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x2d3748,
      roughness: 0.8
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.set(0.3, -1.2, 0);
    base.castShadow = true;
    graphGroup.add(base);
    
    graphGroup.position.set(4, 0, 0);
    scene.add(graphGroup);

    let concA = N;
    let concB = 0;
    let reactionCount = 0;
    let currentPH = 7;

    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let rotationVelocity = { x: 0, y: 0 };
    
    const onMouseDown = (e) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };
    
    const onMouseMove = (e) => {
      if (!isDragging) return;
      
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;
      
      rotationVelocity.x = deltaY * 0.005;
      rotationVelocity.y = deltaX * 0.005;
      
      const radius = Math.sqrt(camera.position.x ** 2 + camera.position.z ** 2);
      const angle = Math.atan2(camera.position.z, camera.position.x);
      
      camera.position.x = radius * Math.cos(angle - rotationVelocity.y);
      camera.position.z = radius * Math.sin(angle - rotationVelocity.y);
      camera.position.y = Math.max(1, Math.min(8, camera.position.y - rotationVelocity.x));
      camera.lookAt(0, 0, 0);
      
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };
    
    const onMouseUp = () => {
      isDragging = false;
    };
    
    const onWheel = (e) => {
      e.preventDefault();
      const delta = e.deltaY * 0.005;
      const currentRadius = Math.sqrt(camera.position.x ** 2 + camera.position.y ** 2 + camera.position.z ** 2);
      const newRadius = Math.max(4, Math.min(15, currentRadius + delta));
      const scale = newRadius / currentRadius;
      
      camera.position.multiplyScalar(scale);
    };
    
    canvasRef.current.addEventListener('mousedown', onMouseDown);
    canvasRef.current.addEventListener('mousemove', onMouseMove);
    canvasRef.current.addEventListener('mouseup', onMouseUp);
    canvasRef.current.addEventListener('wheel', onWheel, { passive: false });

    const checkCollision = (pos1, pos2, radius1, radius2) => {
      const dist = pos1.distanceTo(pos2);
      return dist < (radius1 + radius2);
    };

    let lastTime = Date.now();
    
    const animate = () => {
      const currentTime = Date.now();
      const dt = Math.min((currentTime - lastTime) / 1000, 0.05);
      lastTime = currentTime;

      const currentExperiment = experiment;
      
      catalysts.forEach((cat) => {
        cat.visible = currentExperiment === 'catalysis';
        if (cat.visible) {
          cat.rotation.y += 0.01;
          cat.children[0].rotation.y -= 0.02;
        }
      });

      if (currentExperiment === 'equilibrium') {
        const kForward = k * Math.exp((temperature - 298) / 500);
        const kReverse = kForward / keq;
        const pForward = 1 - Math.exp(-kForward * dt * 2);
        const pReverse = 1 - Math.exp(-kReverse * dt * 2);

        particles.forEach((particle) => {
          if (particle.userData.state === 'A' && Math.random() < pForward * particle.userData.energy) {
            particle.userData.state = 'B';
            particle.material.color.setHex(0xef4444);
            particle.material.emissive.setHex(0x7f1d1d);
            concA--;
            concB++;
          } else if (particle.userData.state === 'B' && Math.random() < pReverse * particle.userData.energy) {
            particle.userData.state = 'A';
            particle.material.color.setHex(0x3b82f6);
            particle.material.emissive.setHex(0x1e3a8a);
            concA++;
            concB--;
          }
        });

        liquid.material.color.setHex(0x3b82f6);
        liquid.material.opacity = 0.6;

      } else if (currentExperiment === 'acidbase') {
        currentPH += (pH - currentPH) * dt;
        const targetH = Math.pow(10, -currentPH) * 50;
        const currentH = particles.filter(p => p.userData.state === 'H').length;

        if (Math.abs(currentH - targetH) > 2) {
          if (currentH < targetH) {
            const particle = particles.find(p => p.userData.state === 'O');
            if (particle) {
              particle.userData.state = 'H';
              particle.material.color.setHex(0xe5e7eb);
              particle.material.emissive.setHex(0x9ca3af);
              particle.scale.set(0.7, 0.7, 0.7);
            }
          } else {
            const particle = particles.find(p => p.userData.state === 'H');
            if (particle) {
              particle.userData.state = 'O';
              particle.material.color.setHex(0xdc2626);
              particle.material.emissive.setHex(0x7f1d1d);
              particle.scale.set(1.2, 1.2, 1.2);
            }
          }
        }

        const liquidColor = currentPH < 5 ? 0xff6b6b : currentPH > 9 ? 0x4dabf7 : 0x51cf66;
        liquid.material.color.setHex(liquidColor);
        liquid.material.opacity = 0.5;
        strip.material.color.setHex(liquidColor);

      } else if (currentExperiment === 'catalysis') {
        const baseRate = k * 0.5;
        
        particles.forEach((particle) => {
          if (particle.userData.state === 'A') {
            let nearCatalyst = false;
            let closestDist = Infinity;
            
            for (const cat of catalysts) {
              const dist = particle.position.distanceTo(cat.position);
              if (dist < 0.7) {
                nearCatalyst = true;
                closestDist = Math.min(closestDist, dist);
              }
            }
            
            const rate = nearCatalyst ? baseRate * (8 - closestDist * 5) : baseRate;
            const p = 1 - Math.exp(-rate * dt * particle.userData.energy);
            
            if (Math.random() < p) {
              particle.userData.state = 'C';
              particle.material.color.setHex(0x10b981);
              particle.material.emissive.setHex(0x065f46);
              reactionCount++;
            }
          }
        });

        liquid.material.color.setHex(0x10b981);
        liquid.material.opacity = 0.6;
      }

      particles.forEach((particle, idx) => {
        const velocity = velocities[idx];
        const thermalVelocity = Math.sqrt(temperature / 298) * 0.03;
        
        velocity.x += (Math.random() - 0.5) * thermalVelocity;
        velocity.y += (Math.random() - 0.5) * thermalVelocity;
        velocity.z += (Math.random() - 0.5) * thermalVelocity;
        
        velocity.multiplyScalar(0.98);
        
        particle.position.add(velocity);
        
        const radius = Math.sqrt(particle.position.x ** 2 + particle.position.z ** 2);
        if (radius > 1.85) {
          const angle = Math.atan2(particle.position.z, particle.position.x);
          particle.position.x = 1.85 * Math.cos(angle);
          particle.position.z = 1.85 * Math.sin(angle);
          velocity.x *= -0.5;
          velocity.z *= -0.5;
        }
        
        if (particle.position.y > 1.2) {
          particle.position.y = 1.2;
          velocity.y *= -0.6;
        }
        if (particle.position.y < -1.3) {
          particle.position.y = -1.3;
          velocity.y *= -0.6;
        }
        
        for (let j = idx + 1; j < particles.length; j++) {
          if (checkCollision(particle.position, particles[j].position, 0.06, 0.06)) {
            const normal = new THREE.Vector3().subVectors(particle.position, particles[j].position).normalize();
            const relativeVelocity = new THREE.Vector3().subVectors(velocity, velocities[j]);
            const impulse = relativeVelocity.dot(normal);
            
            if (impulse > 0) {
              velocity.sub(normal.multiplyScalar(impulse * 0.5));
              velocities[j].add(normal.multiplyScalar(impulse * 0.5));
            }
          }
        }
        
        particle.rotation.x += velocity.x * 2;
        particle.rotation.y += velocity.y * 2;
      });

      liquid.position.y = -0.25 + Math.sin(Date.now() * 0.001) * 0.02;
      liquid.rotation.y += 0.0005;

      const mercuryHeight = 0.5 + ((temperature - 250) / 150) * 1.0;
      mercury.scale.y = mercuryHeight;
      mercury.position.y = -0.75 + mercuryHeight / 2;

      if (showGraph && currentExperiment !== 'catalysis') {
        const heightA = (concA / N) * 2;
        const heightB = (concB / N) * 2;
        
        barA.scale.y = Math.max(0.1, heightA);
        barA.position.y = -1.2 + (heightA / 2);
        barA.visible = true;
        
        barB.scale.y = Math.max(0.1, heightB);
        barB.position.y = -1.2 + (heightB / 2);
        barB.visible = true;
      } else {
        barA.visible = false;
        barB.visible = false;
      }

      if (!isDragging) {
        rotationVelocity.x *= 0.95;
        rotationVelocity.y *= 0.95;
      }

      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      camera.aspect = canvasRef.current.clientWidth / canvasRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      canvasRef.current?.removeEventListener('mousedown', onMouseDown);
      canvasRef.current?.removeEventListener('mousemove', onMouseMove);
      canvasRef.current?.removeEventListener('mouseup', onMouseUp);
      canvasRef.current?.removeEventListener('wheel', onWheel);
      renderer.dispose();
    };
  }, [experiment, temperature, k, keq, pH, showGraph]);

  return (
    <div className="w-full h-screen bg-gradient-to-b from-gray-950 to-gray-900 flex flex-col">
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-4 border-b border-gray-700 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">VR Chemistry Laboratory</h1>
            <p className="text-gray-400 text-sm">Realistic molecular simulation and reaction kinetics</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-400">{temperature}K</div>
            <div className="text-xs text-gray-400">Temperature</div>
          </div>
        </div>
        
        <div className="flex gap-3 mb-4">
          <button
            onClick={() => setExperiment('equilibrium')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              experiment === 'equilibrium' 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Chemical Equilibrium
          </button>
          <button
            onClick={() => setExperiment('acidbase')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              experiment === 'acidbase' 
                ? 'bg-green-600 text-white shadow-lg shadow-green-500/50' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Acid-Base Reaction
          </button>
          <button
            onClick={() => setExperiment('catalysis')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              experiment === 'catalysis' 
                ? 'bg-yellow-600 text-white shadow-lg shadow-yellow-500/50' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Catalysis
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {experiment !== 'acidbase' && (
            <>
              <div className="bg-gray-800 p-3 rounded-lg">
                <label className="text-white text-sm font-semibold block mb-2">Temperature</label>
                <input
                  type="range"
                  min="250"
                  max="400"
                  value={temperature}
                  onChange={(e) => setTemperature(Number(e.target.value))}
                  className="w-full accent-blue-500"
                />
                <div className="flex justify-between mt-1">
                  <span className="text-gray-400 text-xs">250K</span>
                  <span className="text-white text-sm font-bold">{temperature}K</span>
                  <span className="text-gray-400 text-xs">400K</span>
                </div>
              </div>
              <div className="bg-gray-800 p-3 rounded-lg">
                <label className="text-white text-sm font-semibold block mb-2">Rate Constant</label>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={k}
                  onChange={(e) => setK(Number(e.target.value))}
                  className="w-full accent-blue-500"
                />
                <div className="flex justify-between mt-1">
                  <span className="text-gray-400 text-xs">0.1</span>
                  <span className="text-white text-sm font-bold">{k.toFixed(1)}</span>
                  <span className="text-gray-400 text-xs">1.0</span>
                </div>
              </div>
            </>
          )}
          
          {experiment === 'equilibrium' && (
            <div className="bg-gray-800 p-3 rounded-lg">
              <label className="text-white text-sm font-semibold block mb-2">Equilibrium Constant</label>
              <input
                type="range"
                min="0.5"
                max="10"
                step="0.5"
                value={keq}
                onChange={(e) => setKeq(Number(e.target.value))}
                className="w-full accent-blue-500"
              />
              <div className="flex justify-between mt-1">
                <span className="text-gray-400 text-xs">0.5</span>
                <span className="text-white text-sm font-bold">{keq.toFixed(1)}</span>
                <span className="text-gray-400 text-xs">10</span>
              </div>
            </div>
          )}

          {experiment === 'acidbase' && (
            <div className="bg-gray-800 p-3 rounded-lg">
              <label className="text-white text-sm font-semibold block mb-2">pH Level</label>
              <input
                type="range"
                min="1"
                max="14"
                step="0.5"
                value={pH}
                onChange={(e) => setPH(Number(e.target.value))}
                className="w-full accent-green-500"
              />
              <div className="flex justify-between mt-1">
                <span className="text-gray-400 text-xs">1</span>
                <span className="text-white text-sm font-bold">{pH.toFixed(1)}</span>
                <span className="text-gray-400 text-xs">14</span>
              </div>
            </div>
          )}

          <div className="bg-gray-800 p-3 rounded-lg flex items-center">
            <label className="text-white text-sm flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showGraph}
                onChange={(e) => setShowGraph(e.target.checked)}
                className="w-4 h-4"
              />
              Show Bar Graph
            </label>
          </div>
        </div>
      </div>

      <div className="flex-1 relative">
        <canvas ref={canvasRef} className="w-full h-full" />
        <div className="absolute bottom-4 left-4 text-white text-sm bg-gray-800 bg-opacity-80 p-3 rounded-lg">
          Drag to rotate • Scroll to zoom
        </div>
      </div>

      <div className="bg-gray-800 p-3 border-t border-gray-700 text-white text-sm">
        <div className="flex gap-6">
          <div><span className="inline-block w-3 h-3 bg-blue-500 mr-2 rounded"></span>Reactant A / H⁺</div>
          <div><span className="inline-block w-3 h-3 bg-red-500 mr-2 rounded"></span>Product B / OH⁻</div>
          <div><span className="inline-block w-3 h-3 bg-green-500 mr-2 rounded"></span>Product C</div>
          <div><span className="inline-block w-3 h-3 bg-yellow-500 mr-2 rounded"></span>Catalyst</div>
        </div>
      </div>
    </div>
  );
}

export const ChemistryLab = VRChemistryLab;

export default VRChemistryLab;