import { Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { Dimensions, ObjectData } from "../../types/object";
import {
  VALCHROMAT_COLORS,
  type ValchromatColor,
} from "../../data/valchromatColors";
import CabinetDoorMesh from "./scene/CabinetDoorMesh";
import GenericObjectMesh from "./scene/GenericObjectMesh";
import Backdrop from "./scene/Backdrop";
import SceneLighting from "./scene/SceneLighting";
import useConstrainedRotation from "./scene/useConstrainedRotation";

// Driven externally by a parent that owns edge/door state and renders its
// own controls elsewhere (e.g. CabinetDoorConfigurator). When omitted, the
// viewer is self-contained: its own state, its own control panel below the
// canvas — the original behavior, still used for non-cabinet-door objects.
export interface ControlledView {
  edgeWidthMm: number;
  edgeSwatch: ValchromatColor;
  doorSwatch: ValchromatColor;
}

interface Props {
  objectData: ObjectData;
  cameraSway?: boolean;
  edgeColorBackground?: boolean;
  controlled?: ControlledView;
}

const SWAY_AMPLITUDE = THREE.MathUtils.degToRad(8);
const SWAY_SPEED = 0.5;
const MM_TO_UNIT = 1 / 1000;
const FOV_DEG = 35;
const CAMERA_DIRECTION = new THREE.Vector3(0.5, 0.35, 0.9).normalize();

// Distance that fits the object's bounding sphere inside the camera's fov,
// so a 2m column door frames the same way a 10cm drawer face does instead
// of overflowing a fixed camera position sized for one object.
function fitCameraPosition(dimensions: Dimensions): [number, number, number] {
  const w = dimensions.widthMm * MM_TO_UNIT;
  const h = dimensions.heightMm * MM_TO_UNIT;
  const d = dimensions.depthMm * MM_TO_UNIT;
  const boundingRadius = 0.5 * Math.hypot(w, h, d);
  const fovRad = THREE.MathUtils.degToRad(FOV_DEG);
  const distance = (boundingRadius / Math.sin(fovRad / 2)) * 1.4;
  return [
    CAMERA_DIRECTION.x * distance,
    CAMERA_DIRECTION.y * distance,
    CAMERA_DIRECTION.z * distance,
  ];
}

export function ColorCircle({
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

// Refits the camera whenever the object's size changes — without remounting
// the Canvas, which would tear down and recreate the WebGL context (rapid
// dimension changes exhausted the browser's context limit and blanked the
// view). Sway (when enabled) orbits around whatever the current fit is.
function CameraRig({ enabled, dimensions }: { enabled: boolean; dimensions: Dimensions }) {
  const { camera } = useThree();
  const fitted = useRef(fitCameraPosition(dimensions));
  const baseAngle = useRef(Math.atan2(fitted.current[2], fitted.current[0]));
  const radius = useRef(Math.hypot(fitted.current[0], fitted.current[2]));

  useEffect(() => {
    const pos = fitCameraPosition(dimensions);
    fitted.current = pos;
    baseAngle.current = Math.atan2(pos[2], pos[0]);
    radius.current = Math.hypot(pos[0], pos[2]);
    camera.position.set(pos[0], pos[1], pos[2]);
    camera.lookAt(0, 0, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dimensions.widthMm, dimensions.heightMm, dimensions.depthMm, camera]);

  useFrame(({ clock }) => {
    if (!enabled) return;
    const angle =
      baseAngle.current +
      Math.sin(clock.elapsedTime * SWAY_SPEED) * SWAY_AMPLITUDE;
    camera.position.x = radius.current * Math.cos(angle);
    camera.position.z = radius.current * Math.sin(angle);
    camera.position.y = fitted.current[1];
    camera.lookAt(0, 0, 0);
  });

  return null;
}

export default function ObjectViewer3D({
  objectData,
  cameraSway = true,
  edgeColorBackground = false,
  controlled,
}: Props) {
  const edgeWidthRange = objectData.cabinetDoor?.edgeWidthMm;

  const [internalEdgeWidthMm, setInternalEdgeWidthMm] = useState<number>(
    edgeWidthRange?.default ?? 0,
  );
  const contentColorHex = objectData.cabinetDoor?.colorHex?.toLowerCase();
  const defaultDoorColorId =
    VALCHROMAT_COLORS.find((c) => c.hex.toLowerCase() === contentColorHex)
      ?.id ?? VALCHROMAT_COLORS[0].id;

  const [internalEdgeColorId, setInternalEdgeColorId] = useState<string>(
    VALCHROMAT_COLORS[0].id,
  );
  const [internalDoorColorId, setInternalDoorColorId] = useState<string>(defaultDoorColorId);

  const edgeWidthMm = controlled?.edgeWidthMm ?? internalEdgeWidthMm;
  const edgeSwatch =
    controlled?.edgeSwatch ??
    VALCHROMAT_COLORS.find((c) => c.id === internalEdgeColorId) ??
    VALCHROMAT_COLORS[0];
  const doorSwatch =
    controlled?.doorSwatch ??
    VALCHROMAT_COLORS.find((c) => c.id === internalDoorColorId) ??
    VALCHROMAT_COLORS[0];

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
          camera={{ position: fitCameraPosition(objectData.dimensions), fov: FOV_DEG }}
        >
          <SceneLighting />
          <CameraRig enabled={cameraSway} dimensions={objectData.dimensions} />
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

      {!controlled && objectData.cabinetDoor && edgeWidthRange && (
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
            onChange={(e) => setInternalEdgeWidthMm(Number(e.target.value))}
          />

          <label className="mt-3 block text-xs font-medium text-neutral-500">
            Edge color
          </label>
          <div className="mt-2 flex gap-2">
            {VALCHROMAT_COLORS.map((color) => (
              <ColorCircle
                key={color.id}
                color={color}
                selected={color.id === internalEdgeColorId}
                onSelect={() => setInternalEdgeColorId(color.id)}
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
                selected={color.id === internalDoorColorId}
                onSelect={() => setInternalDoorColorId(color.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
