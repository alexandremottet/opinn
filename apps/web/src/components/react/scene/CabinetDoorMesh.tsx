import { useMemo } from "react";
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
const NEUTRAL_NORMAL = "/images/wood-pbr/neutral-normal.webp";
const NEUTRAL_ROUGHNESS = "/images/wood-pbr/neutral-roughness.webp";

// One texture repeat ≈ this many mm of real material (before tileScale).
// Deriving repeat from the actual face size (rather than a flat count)
// keeps grain tiles the same physical size in both directions and on every
// face, so nothing stretches or mismatches at the seams.
const TILE_SIZE_MM = 150;

function repeatFor(sizeMm: number, tileScale: number) {
  return Math.max((sizeMm / TILE_SIZE_MM) * tileScale, 0.01);
}

interface SwatchMaps {
  map: THREE.Texture;
  normalMap: THREE.Texture;
  roughnessMap: THREE.Texture;
  tiled: boolean | undefined;
  tileScale: number;
  normalScale: THREE.Vector2;
}

function useSwatchMaps(swatch: ValchromatColor): SwatchMaps {
  const map = useTexture(swatch.texture);
  map.colorSpace = THREE.SRGBColorSpace;
  const normalMap = useTexture(swatch.normalMap ?? NEUTRAL_NORMAL);
  const roughnessMap = useTexture(swatch.roughnessMap ?? NEUTRAL_ROUGHNESS);
  const scale = swatch.normalScale ?? 1;
  return {
    map,
    normalMap,
    roughnessMap,
    tiled: swatch.tiled,
    tileScale: swatch.tileScale ?? 1,
    normalScale: useMemo(() => new THREE.Vector2(scale, scale), [scale]),
  };
}

function tileClone(texture: THREE.Texture, repeatX: number, repeatY: number) {
  const clone = texture.clone();
  clone.needsUpdate = true;
  clone.wrapS = clone.wrapT = THREE.RepeatWrapping;
  clone.repeat.set(repeatX, repeatY);
  return clone;
}

// Clones a swatch's maps for one face, tiled to that face's real size (or
// stretched once, untiled, for a photographed full-panel swatch).
function useFaceMaps(swatch: SwatchMaps, faceWidthMm: number, faceHeightMm: number) {
  return useMemo(() => {
    const base = {
      normalScale: swatch.normalScale,
    };
    if (!swatch.tiled) {
      return { ...base, map: swatch.map, normalMap: swatch.normalMap, roughnessMap: swatch.roughnessMap };
    }
    const repeatX = repeatFor(faceWidthMm, swatch.tileScale);
    const repeatY = repeatFor(faceHeightMm, swatch.tileScale);
    return {
      ...base,
      map: tileClone(swatch.map, repeatX, repeatY),
      normalMap: tileClone(swatch.normalMap, repeatX, repeatY),
      roughnessMap: tileClone(swatch.roughnessMap, repeatX, repeatY),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    swatch.map,
    swatch.normalMap,
    swatch.roughnessMap,
    swatch.tiled,
    swatch.tileScale,
    swatch.normalScale,
    faceWidthMm,
    faceHeightMm,
  ]);
}

export default function CabinetDoorMesh({
  dimensions,
  edgeWidthMm,
  edgeSwatch,
  doorSwatch,
}: Props) {
  const { widthMm, heightMm, depthMm } = dimensions;
  const w = widthMm * MM_TO_UNIT;
  const h = heightMm * MM_TO_UNIT;
  const d = depthMm * MM_TO_UNIT;

  const edgeWidth = edgeWidthMm * MM_TO_UNIT;
  const hasEdge = edgeWidthMm > 0;

  const innerW = w - edgeWidth * 2;
  const innerH = h - edgeWidth * 2;
  const showInnerPanel = hasEdge && innerW > 0 && innerH > 0;
  const frontZ = d / 2;

  const edgeBase = useSwatchMaps(edgeSwatch);
  const doorBase = useSwatchMaps(doorSwatch);
  const bandBase = hasEdge ? edgeBase : doorBase;

  // box face order: +x, -x, +y, -y, +z, -z — rim + front banded, back bare
  const sideFaces = useFaceMaps(bandBase, heightMm, depthMm); // +x / -x
  const topBottomFaces = useFaceMaps(bandBase, widthMm, depthMm); // +y / -y
  const frontRim = useFaceMaps(bandBase, widthMm, heightMm); // +z
  const doorFace = useFaceMaps(doorBase, widthMm, heightMm); // -z + inner panel

  return (
    <group>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial attach="material-0" {...sideFaces} roughness={0.4} />
        <meshStandardMaterial attach="material-1" {...sideFaces} roughness={0.4} />
        <meshStandardMaterial attach="material-2" {...topBottomFaces} roughness={0.4} />
        <meshStandardMaterial attach="material-3" {...topBottomFaces} roughness={0.4} />
        <meshStandardMaterial attach="material-4" {...frontRim} roughness={0.4} />
        <meshStandardMaterial
          attach="material-5"
          {...doorFace}
          roughness={0.7}
          metalness={0.05}
        />
      </mesh>

      {showInnerPanel && (
        <mesh position={[0, 0, frontZ + FRONT_EPSILON]} receiveShadow>
          <planeGeometry args={[innerW, innerH]} />
          <meshStandardMaterial {...doorFace} roughness={0.7} metalness={0.05} />
        </mesh>
      )}
    </group>
  );
}
