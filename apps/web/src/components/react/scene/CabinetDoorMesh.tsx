import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Dimensions } from "../../../types/object";

interface Props {
  dimensions: Dimensions;
  colorHex: string;
  edgeWidthMm: number;
  edgeColor: string;
}

const MM_TO_UNIT = 1 / 1000;
const FRONT_EPSILON = 0.0002;
const COLOR_TRANSITION_RATE = 4; // ~1s to converge on the new band color

export default function CabinetDoorMesh({
  dimensions,
  colorHex,
  edgeWidthMm,
  edgeColor,
}: Props) {
  const w = dimensions.widthMm * MM_TO_UNIT;
  const h = dimensions.heightMm * MM_TO_UNIT;
  const d = dimensions.depthMm * MM_TO_UNIT;

  const edgeWidth = edgeWidthMm * MM_TO_UNIT;
  const hasEdge = edgeWidthMm > 0;
  const bandColor = hasEdge ? edgeColor : colorHex;

  const innerW = w - edgeWidth * 2;
  const innerH = h - edgeWidth * 2;
  const showInnerPanel = hasEdge && innerW > 0 && innerH > 0;
  const frontZ = d / 2;

  const bandMaterials = useMemo(
    () =>
      Array.from(
        { length: 5 },
        () => new THREE.MeshStandardMaterial({ color: bandColor, roughness: 0.4 }),
      ),
    [],
  );
  const targetColor = useMemo(() => new THREE.Color(bandColor), [bandColor]);

  useEffect(
    () => () => bandMaterials.forEach((m) => m.dispose()),
    [bandMaterials],
  );

  useFrame((_, delta) => {
    const t = 1 - Math.exp(-COLOR_TRANSITION_RATE * delta);
    bandMaterials.forEach((m) => m.color.lerp(targetColor, t));
  });

  return (
    <group>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        {/* box face order: +x, -x, +y, -y, +z, -z — rim + front banded, back bare */}
        <primitive object={bandMaterials[0]} attach="material-0" />
        <primitive object={bandMaterials[1]} attach="material-1" />
        <primitive object={bandMaterials[2]} attach="material-2" />
        <primitive object={bandMaterials[3]} attach="material-3" />
        <primitive object={bandMaterials[4]} attach="material-4" />
        <meshStandardMaterial attach="material-5" color={colorHex} roughness={0.7} metalness={0.05} />
      </mesh>

      {showInnerPanel && (
        <mesh position={[0, 0, frontZ + FRONT_EPSILON]} receiveShadow>
          <planeGeometry args={[innerW, innerH]} />
          <meshStandardMaterial color={colorHex} roughness={0.7} metalness={0.05} />
        </mesh>
      )}
    </group>
  );
}
