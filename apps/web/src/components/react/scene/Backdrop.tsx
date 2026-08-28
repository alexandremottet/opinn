const BACKDROP_Z = -0.12;
const BACKDROP_SIZE: [number, number] = [1.4, 1.4];

export default function Backdrop() {
  return (
    <mesh position={[0, 0, BACKDROP_Z]} receiveShadow>
      <planeGeometry args={BACKDROP_SIZE} />
      <shadowMaterial color="#1c1c1c" transparent opacity={0.28} />
    </mesh>
  );
}
