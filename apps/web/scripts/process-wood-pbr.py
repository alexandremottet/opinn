"""Builds the solid-wood PBR texture set from the source scans in /bois.

Oak, Birch and Ash have real PBR scans in /bois (basecolor + normal +
roughness). Poplar and Beech don't, so per the brief we derive them from the
closest existing scan by recoloring its basecolor (grayscale recolored via
PIL's colorize) while reusing its normal/roughness maps as-is — same surface
detail, different species tone.

Run with: python3 apps/web/scripts/process-wood-pbr.py
Source:   ../../bois (repo root /bois)
Output:   apps/web/public/images/wood-pbr/<species>/{basecolor,normal,roughness}.webp
"""

from pathlib import Path

from PIL import Image, ImageOps

REPO_ROOT = Path(__file__).parent.parent.parent.parent
SRC_DIR = REPO_ROOT / "bois"
OUT_DIR = Path(__file__).parent.parent / "public" / "images" / "wood-pbr"
SIZE = (1024, 1024)


def load_resized(path: Path, mode: str | None = None) -> Image.Image:
    img = Image.open(path)
    if mode:
        img = img.convert(mode)
    return img.resize(SIZE, Image.LANCZOS)


def save_webp(img: Image.Image, path: Path, quality=88):
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, "WEBP", quality=quality, method=6)


def build_real(species: str, prefix: str, has_ao: bool):
    """Copy a real scanned PBR set through, resized and re-encoded."""
    basecolor = load_resized(SRC_DIR / f"{prefix}_basecolor_textures.png", "RGB")
    normal = load_resized(SRC_DIR / f"{prefix}_normal_textures.png", "RGB")
    roughness = load_resized(SRC_DIR / f"{prefix}_roughness_textures.png", "L")

    save_webp(basecolor, OUT_DIR / species / "basecolor.webp")
    save_webp(normal, OUT_DIR / species / "normal.webp", quality=90)
    save_webp(roughness, OUT_DIR / species / "roughness.webp")
    print(f"{species}: real scan ({prefix})")


def build_recolored(species: str, source_species: str, dark_hex: str, light_hex: str):
    """No scan exists for this species — recolor a sibling's basecolor and
    reuse its normal/roughness maps untouched (same grain, new tone)."""
    src_dir = OUT_DIR / source_species
    basecolor = Image.open(src_dir / "basecolor.webp").convert("RGB")
    gray = ImageOps.grayscale(basecolor)
    recolored = ImageOps.colorize(gray, black=dark_hex, white=light_hex)

    save_webp(recolored, OUT_DIR / species / "basecolor.webp")
    normal = Image.open(src_dir / "normal.webp")
    save_webp(normal, OUT_DIR / species / "normal.webp", quality=90)
    roughness = Image.open(src_dir / "roughness.webp")
    save_webp(roughness, OUT_DIR / species / "roughness.webp")
    print(f"{species}: recolored from {source_species}")


if __name__ == "__main__":
    build_real("oak", "wood_oak_brown", has_ao=False)
    build_real("birch", "natural_birch_wood", has_ao=True)
    build_real("ash", "ash_wood_gouged_emboss", has_ao=True)

    # Poplar: pale, slightly grey-green, subtle grain — recolor the birch scan.
    build_recolored("poplar", "birch", dark_hex="#b7ae86", light_hex="#efe9d6")
    # Beech: light pinkish-tan, fine straight grain — recolor the ash scan.
    build_recolored("beech", "ash", dark_hex="#a9724e", light_hex="#e8c6a3")
