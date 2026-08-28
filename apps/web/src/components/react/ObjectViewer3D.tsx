import { useRef, useState, type ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { ObjectData } from "../../types/object";
import CabinetDoorMesh from "./scene/CabinetDoorMesh";
import GenericObjectMesh from "./scene/GenericObjectMesh";
import Backdrop from "./scene/Backdrop";
import SceneLighting from "./scene/SceneLighting";
import useConstrainedRotation from "./scene/useConstrainedRotation";

interface Props {
  objectData: ObjectData;
  cameraSway?: boolean;
  edgeColorBackground?: boolean;
}

const SWAY_AMPLITUDE = THREE.MathUtils.degToRad(8);
const SWAY_SPEED = 0.5;

const EDGE_COLOR_PRESETS = [
  "#3b82f6",
  "#ef4444",
  "#22c55e",
  "#f59e0b",
  "#a855f6",
  "#ec4899",
];

function ColorCircle({
  color,
  selected,
  onSelect,
}: {
  color: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={`Use ${color} edge color`}
      onClick={onSelect}
      className={`h-6 w-6 rounded-full border-2 transition ${
        selected ? "border-neutral-900" : "border-transparent"
      }`}
      style={{ backgroundColor: color }}
    />
  );
}

function RotatingRig({ children }: { children: ReactNode }) {
  const { groupRef, bind } = useConstrainedRotation();
  return (
    <group ref={groupRef} {...bind()}>
      {children}
    </group>
  );
}

function CameraSway({ enabled }: { enabled: boolean }) {
  const { camera } = useThree();
  const baseAngle = useRef(Math.atan2(camera.position.z, camera.position.x));
  const radius = useRef(Math.hypot(camera.position.x, camera.position.z));

  useFrame(({ clock }) => {
    if (!enabled) return;
    const angle =
      baseAngle.current +
      Math.sin(clock.elapsedTime * SWAY_SPEED) * SWAY_AMPLITUDE;
    camera.position.x = radius.current * Math.cos(angle);
    camera.position.z = radius.current * Math.sin(angle);
    camera.lookAt(0, 0, 0);
  });

  return null;
}

export default function ObjectViewer3D({
  objectData,
  cameraSway = true,
  edgeColorBackground = false,
}: Props) {
  const edgeWidthRange = objectData.cabinetDoor?.edgeWidthMm;

  const [edgeWidthMm, setEdgeWidthMm] = useState<number>(
    edgeWidthRange?.default ?? 0,
  );
  const [edgeColor, setEdgeColor] = useState<string>(EDGE_COLOR_PRESETS[0]);

  return (
    <div className="relative flex h-full w-full flex-col">
      {edgeColorBackground && (
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[160%] w-[160%] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 blur-3xl transition-colors duration-1000 ease-out"
          style={{
            backgroundColor: edgeColor,
            WebkitMaskImage: "radial-gradient(circle, black 0%, transparent 70%)",
            maskImage: "radial-gradient(circle, black 0%, transparent 70%)",
          }}
        />
      )}

      <div className="relative flex-1 overflow-hidden rounded-lg">
        <Canvas
          shadows="variance"
          dpr={[1, 2]}
          gl={{ alpha: true }}
          camera={{ position: [0.9, 0.35, 0.9], fov: 35 }}
        >
          <SceneLighting />
          <CameraSway enabled={cameraSway} />
          <RotatingRig>
            {objectData.kind === "cabinet-door" ? (
              <CabinetDoorMesh
                dimensions={objectData.dimensions}
                colorHex={objectData.cabinetDoor?.colorHex ?? "#efece4"}
                edgeWidthMm={edgeWidthMm}
                edgeColor={edgeColor}
              />
            ) : (
              <GenericObjectMesh dimensions={objectData.dimensions} />
            )}
          </RotatingRig>
          <Backdrop />
        </Canvas>
      </div>

      {objectData.cabinetDoor && edgeWidthRange && (
        <div className="border-t border-neutral-200 bg-white p-3">
          <label className="text-xs font-medium text-neutral-500">
            Edge width: {edgeWidthMm}mm
          </label>
          <input
            type="range"
            className="mt-1 block w-full"
            min={edgeWidthRange.min}
            max={edgeWidthRange.max}
            step={edgeWidthRange.step ?? 1}
            value={edgeWidthMm}
            onChange={(e) => setEdgeWidthMm(Number(e.target.value))}
          />

          <label className="mt-3 block text-xs font-medium text-neutral-500">
            Edge color
          </label>
          <div className="mt-2 flex gap-2">
            {EDGE_COLOR_PRESETS.map((color) => (
              <ColorCircle
                key={color}
                color={color}
                selected={color === edgeColor}
                onSelect={() => setEdgeColor(color)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
