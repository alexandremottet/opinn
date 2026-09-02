import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import type { Dimensions } from "../../../types/object";
import type { ValchromatColor } from "../../../data/valchromatColors";

interface Props {
  dimensions: Dimensions;
  edgeWidthMm: number;
  edgeSwatch: ValchromatColor;
  doorSwatch: ValchromatColor;
}

const MM_TO_UNIT = 1 / 1000;
const FRONT_EPSILON = 0.0002;

export default function CabinetDoorMesh({
  dimensions,
  edgeWidthMm,
  edgeSwatch,
  doorSwatch,
}: Props) {
  const w = dimensions.widthMm * MM_TO_UNIT;
  const h = dimensions.heightMm * MM_TO_UNIT;
  const d = dimensions.depthMm * MM_TO_UNIT;

  const edgeWidth = edgeWidthMm * MM_TO_UNIT;
  const hasEdge = edgeWidthMm > 0;

  const innerW = w - edgeWidth * 2;
  const innerH = h - edgeWidth * 2;
  const showInnerPanel = hasEdge && innerW > 0 && innerH > 0;
  const frontZ = d / 2;

  const edgeTexture = useTexture(edgeSwatch.texture);
  edgeTexture.colorSpace = THREE.SRGBColorSpace;
  const doorTexture = useTexture(doorSwatch.texture);
  doorTexture.colorSpace = THREE.SRGBColorSpace;

  const bandTexture = hasEdge ? edgeTexture : doorTexture;

  return (
    <group>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        {/* box face order: +x, -x, +y, -y, +z, -z — rim + front banded, back bare */}
        <meshStandardMaterial attach="material-0" map={bandTexture} roughness={0.4} />
        <meshStandardMaterial attach="material-1" map={bandTexture} roughness={0.4} />
        <meshStandardMaterial attach="material-2" map={bandTexture} roughness={0.4} />
        <meshStandardMaterial attach="material-3" map={bandTexture} roughness={0.4} />
        <meshStandardMaterial attach="material-4" map={bandTexture} roughness={0.4} />
        <meshStandardMaterial
          attach="material-5"
          map={doorTexture}
          roughness={0.7}
          metalness={0.05}
        />
      </mesh>

      {showInnerPanel && (
        <mesh position={[0, 0, frontZ + FRONT_EPSILON]} receiveShadow>
          <planeGeometry args={[innerW, innerH]} />
          <meshStandardMaterial map={doorTexture} roughness={0.7} metalness={0.05} />
        </mesh>
      )}
    </group>
  );
}
