"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Float } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";

function Sneaker({ accent }: { accent: string }) {
  const group = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (!group.current) return;
    group.current.rotation.y += delta * 0.18;
    group.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.7) * 0.035;
  });

  return (
    <group ref={group} rotation={[0.12, -0.55, -0.08]} scale={1.15}>
      <mesh castShadow position={[0, -0.05, 0]} rotation={[0, 0, -0.08]} scale={[2.15, 0.48, 0.82]}>
        <sphereGeometry args={[1, 48, 24]} />
        <meshStandardMaterial color="#f3f1ea" roughness={0.34} metalness={0.08} />
      </mesh>
      <mesh castShadow position={[-0.58, 0.48, 0]} rotation={[0, 0, -0.18]} scale={[1.12, 0.92, 0.78]}>
        <boxGeometry args={[1.25, 1.05, 1.1, 8, 6, 6]} />
        <meshStandardMaterial color="#dedbd2" roughness={0.42} />
      </mesh>
      <mesh castShadow position={[0.58, 0.24, 0]} rotation={[0, 0, 0.1]} scale={[1.15, 0.62, 0.82]}>
        <boxGeometry args={[1.42, 0.72, 1.05]} />
        <meshStandardMaterial color="#faf9f5" roughness={0.28} />
      </mesh>
      <mesh position={[0.5, 0.64, 0.48]} scale={[0.5, 0.28, 0.12]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={accent} roughness={0.3} metalness={0.12} />
      </mesh>
      {[-0.35, -0.12, 0.12, 0.34].map((x) => (
        <mesh key={x} position={[x, 0.73, 0.82]} rotation={[0, 0, -0.18]} scale={[0.32, 0.035, 0.035]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#2a2433" roughness={0.5} />
        </mesh>
      ))}
      <mesh castShadow position={[-1.48, -0.22, 0]} rotation={[0, 0, -0.05]} scale={[0.72, 0.46, 0.84]}>
        <capsuleGeometry args={[0.72, 0.5, 8, 20]} />
        <meshStandardMaterial color="#f7f5ef" roughness={0.38} />
      </mesh>
      <mesh position={[0, -0.49, 0]} scale={[2.22, 0.11, 0.86]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#15121a" roughness={0.62} />
      </mesh>
    </group>
  );
}

export default function HeroScene({ accent = "#7c3aed" }: { accent?: string }) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [5.2, 3.1, 6.2], fov: 32 }}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={1.2} />
      <directionalLight position={[5, 8, 4]} intensity={3} castShadow />
      <pointLight position={[-4, 1, 3]} intensity={18} color={accent} distance={8} />
      <Float speed={1.8} rotationIntensity={0.18} floatIntensity={0.45}>
        <Sneaker accent={accent} />
      </Float>
      <ContactShadows position={[0, -0.72, 0]} opacity={0.38} scale={7} blur={2.4} far={2} />
      <Environment preset="city" />
    </Canvas>
  );
}
