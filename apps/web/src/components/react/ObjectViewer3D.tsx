import { Suspense, useRef, useState, type ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { ObjectData } from "../../types/object";
import {
  VALCHROMAT_COLORS,
  type ValchromatColor,
} from "../../data/valchromatColors";
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

function ColorCircle({
  color,
  selected,
  onSelect,
}: {
  color: ValchromatColor;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={`Use ${color.label}`}
      title={color.label}
      onClick={onSelect}
      className={`h-6 w-6 rounded-full border-2 transition ${
        selected ? "border-neutral-900" : "border-transparent"
      }`}
      style={{ backgroundColor: color.hex }}
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
  const contentColorHex = objectData.cabinetDoor?.colorHex?.toLowerCase();
  const defaultDoorColorId =
    VALCHROMAT_COLORS.find((c) => c.hex.toLowerCase() === contentColorHex)
      ?.id ?? VALCHROMAT_COLORS[0].id;

  const [edgeColorId, setEdgeColorId] = useState<string>(
    VALCHROMAT_COLORS[0].id,
  );
  const [doorColorId, setDoorColorId] = useState<string>(defaultDoorColorId);

  const edgeSwatch =
    VALCHROMAT_COLORS.find((c) => c.id === edgeColorId) ?? VALCHROMAT_COLORS[0];
  const doorSwatch =
    VALCHROMAT_COLORS.find((c) => c.id === doorColorId) ?? VALCHROMAT_COLORS[0];

  return (
    <div className="relative flex h-full w-full flex-col">
      {edgeColorBackground && (
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[160%] w-[160%] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 blur-3xl transition-colors duration-1000 ease-out"
          style={{
            backgroundColor: edgeSwatch.hex,
            WebkitMaskImage:
              "radial-gradient(circle, black 0%, transparent 70%)",
            maskImage: "radial-gradient(circle, black 0%, transparent 70%)",
          }}
        />
      )}

      <div className="relative flex-1 overflow-hidden rounded-lg">
        <Canvas
          shadows="variance"
          dpr={[1, 2]}
          gl={{ alpha: true }}
          camera={{ position: [0.5, 0.35, 0.9], fov: 35 }}
        >
          <SceneLighting />
          <CameraSway enabled={cameraSway} />
          <Suspense fallback={null}>
            <RotatingRig>
              {objectData.kind === "cabinet-door" ? (
                <CabinetDoorMesh
                  dimensions={objectData.dimensions}
                  edgeWidthMm={edgeWidthMm}
                  edgeSwatch={edgeSwatch}
                  doorSwatch={doorSwatch}
                />
              ) : (
                <GenericObjectMesh dimensions={objectData.dimensions} />
              )}
            </RotatingRig>
          </Suspense>
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
            {VALCHROMAT_COLORS.map((color) => (
              <ColorCircle
                key={color.id}
                color={color}
                selected={color.id === edgeColorId}
                onSelect={() => setEdgeColorId(color.id)}
              />
            ))}
          </div>

          <label className="mt-3 block text-xs font-medium text-neutral-500">
            Door color
          </label>
          <div className="mt-2 flex gap-2">
            {VALCHROMAT_COLORS.map((color) => (
              <ColorCircle
                key={color.id}
                color={color}
                selected={color.id === doorColorId}
                onSelect={() => setDoorColorId(color.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
