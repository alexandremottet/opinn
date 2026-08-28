export default function SceneLighting() {
  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight
        position={[0.15, 0.6, 1.3]}
        intensity={1.8}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.1}
        shadow-camera-far={4}
        shadow-camera-left={-1}
        shadow-camera-right={1}
        shadow-camera-top={1}
        shadow-camera-bottom={-1}
        shadow-bias={-0.0005}
        shadow-radius={50}
        shadow-blurSamples={6}
      />
      <hemisphereLight args={["#ffffff", "#e5e5e5", 0.15]} />
    </>
  );
}
