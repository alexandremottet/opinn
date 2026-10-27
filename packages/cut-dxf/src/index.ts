// AutoCAD R14 (AC1014) ASCII DXF, mirroring the structure of a
// hand-drilled reference file: HEADER/TABLES/BLOCKS boilerplate + a
// door-outline LWPOLYLINE + a hinge-boring CIRCLE cluster top and bottom.
// Every hinge dimension below (cup size, screw size, offsets) was measured
// off that reference file, not derived from a spec — it's one fixed 35mm
// cup boring, placed the same way regardless of door height.
const CUP_DIAMETER_MM = 35;
const SCREW_DIAMETER_MM = 8;
// Cup center distance from the door's top/bottom edge.
const EDGE_OFFSET_MM = 50.5;
// Screw center distance from the cup center, along the height axis.
const SCREW_SPACING_MM = 22.5;
// Cup / screw center distance from the hinge-side edge (x = 0), along width.
const CUP_X_MM = 22;
const SCREW_X_MM = 31.5;

function code(n: number, value: string | number): string {
  return `${n}\n${value}\n`;
}

let nextHandle = 0x64;
function handle(): string {
  return (nextHandle++).toString(16).toUpperCase();
}

function circle(xMm: number, yMm: number, radiusMm: number): string {
  return (
    code(0, "CIRCLE") +
    code(5, handle()) +
    code(100, "AcDbEntity") +
    code(8, "0") +
    code(100, "AcDbCircle") +
    code(10, xMm) +
    code(20, yMm) +
    code(30, 0) +
    code(40, radiusMm) +
    code(210, 0) +
    code(220, 0) +
    code(230, 1)
  );
}

function hingeCluster(edgeYMm: number, direction: 1 | -1): string {
  const cupY = edgeYMm + direction * EDGE_OFFSET_MM;
  return (
    circle(CUP_X_MM, cupY, CUP_DIAMETER_MM / 2) +
    circle(SCREW_X_MM, cupY - SCREW_SPACING_MM, SCREW_DIAMETER_MM / 2) +
    circle(SCREW_X_MM, cupY + SCREW_SPACING_MM, SCREW_DIAMETER_MM / 2)
  );
}

function outline(widthMm: number, heightMm: number): string {
  const vertices: [number, number][] = [
    [0, 0],
    [0, heightMm],
    [widthMm, heightMm],
    [widthMm, 0],
  ];
  let entity =
    code(0, "LWPOLYLINE") +
    code(5, handle()) +
    code(100, "AcDbEntity") +
    code(8, "0") +
    code(100, "AcDbPolyline") +
    code(90, vertices.length) +
    code(70, 1) +
    code(43, "0.0");
  for (const [x, y] of vertices) {
    entity += code(10, x) + code(20, y);
  }
  return entity;
}

const HEADER_AND_TABLES =
  code(0, "SECTION") +
  code(2, "HEADER") +
  code(9, "$INSUNITS") +
  code(70, 4) +
  code(9, "$ACADVER") +
  code(1, "AC1014") +
  code(9, "$HANDSEED") +
  code(5, "FFFF") +
  code(0, "ENDSEC") +
  code(0, "SECTION") +
  code(2, "TABLES") +
  code(0, "TABLE") +
  code(2, "VPORT") +
  code(5, "8") +
  code(100, "AcDbSymbolTable") +
  code(0, "ENDTAB") +
  code(0, "TABLE") +
  code(2, "LTYPE") +
  code(5, "5") +
  code(100, "AcDbSymbolTable") +
  code(0, "LTYPE") +
  code(5, "14") +
  code(100, "AcDbSymbolTableRecord") +
  code(100, "AcDbLinetypeTableRecord") +
  code(2, "BYBLOCK") +
  code(70, 0) +
  code(0, "LTYPE") +
  code(5, "15") +
  code(100, "AcDbSymbolTableRecord") +
  code(100, "AcDbLinetypeTableRecord") +
  code(2, "BYLAYER") +
  code(70, 0) +
  code(0, "ENDTAB") +
  code(0, "TABLE") +
  code(2, "LAYER") +
  code(5, "2") +
  code(100, "AcDbSymbolTable") +
  code(70, 1) +
  code(0, "LAYER") +
  code(5, "50") +
  code(100, "AcDbSymbolTableRecord") +
  code(100, "AcDbLayerTableRecord") +
  code(2, "0") +
  code(70, 0) +
  code(62, 7) +
  code(6, "CONTINUOUS") +
  code(0, "ENDTAB") +
  code(0, "TABLE") +
  code(2, "STYLE") +
  code(5, "3") +
  code(100, "AcDbSymbolTable") +
  code(70, 1) +
  code(0, "STYLE") +
  code(5, "11") +
  code(100, "AcDbSymbolTableRecord") +
  code(100, "AcDbTextStyleTableRecord") +
  code(2, "STANDARD") +
  code(70, 0) +
  code(0, "ENDTAB") +
  code(0, "TABLE") +
  code(2, "VIEW") +
  code(5, "6") +
  code(100, "AcDbSymbolTable") +
  code(70, 0) +
  code(0, "ENDTAB") +
  code(0, "TABLE") +
  code(2, "UCS") +
  code(5, "7") +
  code(100, "AcDbSymbolTable") +
  code(70, 0) +
  code(0, "ENDTAB") +
  code(0, "TABLE") +
  code(2, "APPID") +
  code(5, "9") +
  code(100, "AcDbSymbolTable") +
  code(70, 1) +
  code(0, "APPID") +
  code(5, "12") +
  code(100, "AcDbSymbolTableRecord") +
  code(100, "AcDbRegAppTableRecord") +
  code(2, "ACAD") +
  code(70, 0) +
  code(0, "ENDTAB") +
  code(0, "TABLE") +
  code(2, "DIMSTYLE") +
  code(5, "A") +
  code(100, "AcDbSymbolTable") +
  code(70, 1) +
  code(0, "ENDTAB") +
  code(0, "TABLE") +
  code(2, "BLOCK_RECORD") +
  code(5, "1") +
  code(100, "AcDbSymbolTable") +
  code(70, 1) +
  code(0, "BLOCK_RECORD") +
  code(5, "1F") +
  code(100, "AcDbSymbolTableRecord") +
  code(100, "AcDbBlockTableRecord") +
  code(2, "*MODEL_SPACE") +
  code(0, "BLOCK_RECORD") +
  code(5, "1B") +
  code(100, "AcDbSymbolTableRecord") +
  code(100, "AcDbBlockTableRecord") +
  code(2, "*PAPER_SPACE") +
  code(0, "ENDTAB") +
  code(0, "ENDSEC") +
  code(0, "SECTION") +
  code(2, "BLOCKS") +
  code(0, "BLOCK") +
  code(5, "20") +
  code(100, "AcDbEntity") +
  code(100, "AcDbBlockBegin") +
  code(2, "*MODEL_SPACE") +
  code(0, "ENDBLK") +
  code(5, "21") +
  code(100, "AcDbEntity") +
  code(100, "AcDbBlockEnd") +
  code(0, "BLOCK") +
  code(5, "1C") +
  code(100, "AcDbEntity") +
  code(100, "AcDbBlockBegin") +
  code(2, "*PAPER_SPACE") +
  code(0, "ENDBLK") +
  code(5, "1D") +
  code(100, "AcDbEntity") +
  code(100, "AcDbBlockEnd") +
  code(0, "ENDSEC");

const OBJECTS_AND_EOF =
  code(0, "SECTION") +
  code(2, "OBJECTS") +
  code(0, "DICTIONARY") +
  code(5, "C") +
  code(100, "AcDbDictionary") +
  code(3, "ACAD_GROUP") +
  code(350, "D") +
  code(3, "ACAD_MLINESTYLE") +
  code(350, "17") +
  code(0, "DICTIONARY") +
  code(5, "D") +
  code(100, "AcDbDictionary") +
  code(0, "DICTIONARY") +
  code(5, "1A") +
  code(330, "C") +
  code(100, "AcDbDictionary") +
  code(0, "DICTIONARY") +
  code(5, "17") +
  code(100, "AcDbDictionary") +
  code(0, "ENDSEC") +
  code(0, "EOF");

// Generates a hinge-boring DXF for one door panel: its outer rectangle
// (widthMm x heightMm, hinge side at x = 0) plus a cup + 2 screw holes
// near the top edge and the same cluster near the bottom edge.
export function generateDoorHingeDxf(widthMm: number, heightMm: number): string {
  nextHandle = 0x64;

  const entities =
    code(0, "SECTION") +
    code(2, "ENTITIES") +
    outline(widthMm, heightMm) +
    hingeCluster(heightMm, -1) +
    hingeCluster(0, 1) +
    code(0, "ENDSEC");

  return HEADER_AND_TABLES + entities + OBJECTS_AND_EOF;
}
