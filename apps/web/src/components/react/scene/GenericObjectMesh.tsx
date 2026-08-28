import type { Dimensions } from "../../../types/object";

const MM_TO_UNIT = 1 / 1000;

export default function GenericObjectMesh({ dimensions }: { dimensions: Dimensions }) {
  const w = dimensions.widthMm * MM_TO_UNIT;
  const h = dimensions.heightMm * MM_TO_UNIT;
  const d = dimensions.depthMm * MM_TO_UNIT;
  return (
    <mesh castShadow receiveShadow>
      <boxGeometry args={[w, h, d]} />
      <meshStandardMaterial color="#d4d4d4" roughness={0.8} />
    </mesh>
  );
}
