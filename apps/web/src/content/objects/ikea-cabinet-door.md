---
name: "IKEA-style Cabinet Door"
kind: "cabinet-door"
summary: "Standard IKEA cabinet door profile with selectable edge thickness, for custom kitchen door design."
dimensions:
  widthMm: 396
  heightMm: 596
  depthMm: 18
downloadFile:
  path: "/files/ikea-cabinet-door-schema.txt"
  label: "Download schema (placeholder)"
cabinetDoor:
  material: "MDF"
  colorHex: "#f5f2ec"
  edgeWidthMm:
    min: 5
    max: 30
    default: 12
    step: 1
---

This is a demo entry representing a common IKEA-compatible kitchen cabinet
door size, used to prototype custom door designs with different edge
profiles. Choose an edge thickness below to preview it in 3D, or download
the reference schema for exact measurements.
