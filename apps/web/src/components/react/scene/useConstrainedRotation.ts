import { useRef, useCallback } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";

const MAX_ANGLE = THREE.MathUtils.degToRad(5);
const DRAG_SENSITIVITY = 0.01;
const RETURN_EASE = 0.12;

export default function useConstrainedRotation() {
  const groupRef = useRef<THREE.Group>(null);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const angleAtDragStart = useRef(0);
  const currentAngle = useRef(0);

  const onPointerDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    isDragging.current = true;
    dragStartX.current = e.clientX;
    angleAtDragStart.current = currentAngle.current;
    (e.target as Element).setPointerCapture?.(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (!isDragging.current) return;
    const deltaX = e.clientX - dragStartX.current;
    const proposed = angleAtDragStart.current + deltaX * DRAG_SENSITIVITY;
    currentAngle.current = THREE.MathUtils.clamp(proposed, -MAX_ANGLE, MAX_ANGLE);
  }, []);

  const onPointerUp = useCallback((e: ThreeEvent<PointerEvent>) => {
    isDragging.current = false;
    (e.target as Element).releasePointerCapture?.(e.pointerId);
  }, []);

  useFrame(() => {
    if (!groupRef.current) return;
    if (!isDragging.current) {
      currentAngle.current += (0 - currentAngle.current) * RETURN_EASE;
    }
    groupRef.current.rotation.y = currentAngle.current;
  });

  const bind = () => ({
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerLeave: onPointerUp,
  });

  return { groupRef, bind };
}
