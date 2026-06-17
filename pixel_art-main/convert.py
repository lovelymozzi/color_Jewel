from __future__ import annotations

from collections import Counter
from dataclasses import dataclass
from pathlib import Path

from PIL import Image


FRAME_COLOR = "#404050"
SPECK_COLOR_TOL = 72.0
DEFAULT_DESPECKLE = 2
ALPHA_THRESHOLD = 128
TRIM_ALPHA_THRESHOLD = 20
SYMBOLS = "123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"


@dataclass
class PixelArt:
    name: str
    rows: list[str]
    legend: dict[str, str]


def frame_dims(width: int, height: int) -> dict[str, int]:
    h_pad = (width * 4) // 30
    content_width = width - (2 * h_pad) - 2
    content_height = height - 2
    return {
        "h_pad": h_pad,
        "content_width": content_width,
        "content_height": content_height,
        "col_offset": h_pad + 1,
        "row_offset": 1,
    }


def to_hex(rgb: tuple[int, int, int]) -> str:
    return "#{:02X}{:02X}{:02X}".format(*rgb)


def parse_hex_color(value: str) -> tuple[int, int, int] | None:
    text = str(value or "").strip().upper()
    if len(text) != 7 or not text.startswith("#"):
        return None
    try:
        return (int(text[1:3], 16), int(text[3:5], 16), int(text[5:7], 16))
    except ValueError:
        return None


def color_distance(left: tuple[int, int, int], right: tuple[int, int, int]) -> float:
    return (
        ((left[0] - right[0]) ** 2)
        + ((left[1] - right[1]) ** 2)
        + ((left[2] - right[2]) ** 2)
    ) ** 0.5


def preprocess(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    alpha = rgba.getchannel("A")
    bbox = alpha.point(lambda value: 255 if value >= TRIM_ALPHA_THRESHOLD else 0).getbbox()
    if bbox is None:
        return rgba
    if bbox == (0, 0, rgba.width, rgba.height):
        return rgba
    return rgba.crop(bbox)


def remove_edge_background(image: Image.Image, tolerance: int = 28) -> Image.Image:
    if image.width == 0 or image.height == 0:
        return image

    rgba = image.convert("RGBA")
    pixels = rgba.load()
    width, height = rgba.size
    corners = [
        pixels[0, 0][:3],
        pixels[width - 1, 0][:3],
        pixels[0, height - 1][:3],
        pixels[width - 1, height - 1][:3],
    ]
    background = tuple(round(sum(color[channel] for color in corners) / len(corners)) for channel in range(3))
    stack: list[tuple[int, int]] = []
    seen: set[tuple[int, int]] = set()

    for x in range(width):
        stack.append((x, 0))
        stack.append((x, height - 1))
    for y in range(height):
        stack.append((0, y))
        stack.append((width - 1, y))

    while stack:
        x, y = stack.pop()
        if (x, y) in seen:
            continue
        seen.add((x, y))
        pixel = pixels[x, y]
        if pixel[3] < ALPHA_THRESHOLD:
            continue
        if color_distance(pixel[:3], background) > tolerance:
            continue
        pixels[x, y] = (pixel[0], pixel[1], pixel[2], 0)
        if x > 0:
            stack.append((x - 1, y))
        if x + 1 < width:
            stack.append((x + 1, y))
        if y > 0:
            stack.append((x, y - 1))
        if y + 1 < height:
            stack.append((x, y + 1))

    return rgba


def apply_background(image: Image.Image, bg: str) -> Image.Image:
    normalized = str(bg or "auto").strip().lower()
    rgba = image.convert("RGBA")
    if normalized == "none":
        return rgba
    if normalized == "auto":
        if rgba.getbbox() is None:
            return rgba
        if rgba.getchannel("A").getextrema()[0] < 255:
            return rgba
        return remove_edge_background(rgba)

    color = parse_hex_color(normalized)
    if color is None:
        return rgba

    background = Image.new("RGBA", rgba.size, color + (255,))
    background.alpha_composite(rgba)
    return background


def fit_to_content(image: Image.Image, content_width: int, content_height: int) -> Image.Image:
    canvas = Image.new("RGBA", (content_width, content_height), (0, 0, 0, 0))
    source = image.convert("RGBA")
    scale = min(content_width / max(1, source.width), content_height / max(1, source.height))
    scaled_width = max(1, round(source.width * scale))
    scaled_height = max(1, round(source.height * scale))
    resample = Image.Resampling.NEAREST if scale >= 1 else Image.Resampling.LANCZOS
    resized = source.resize((scaled_width, scaled_height), resample=resample)
    offset_x = (content_width - scaled_width) // 2
    offset_y = (content_height - scaled_height) // 2
    canvas.alpha_composite(resized, (offset_x, offset_y))
    return canvas


def quantize_colors(pixels: list[tuple[int, int, int]], color_count: int, dither: bool) -> list[tuple[int, int, int]]:
    unique_pixels = list(dict.fromkeys(pixels))
    if not unique_pixels:
        return []
    if len(unique_pixels) <= color_count:
        return unique_pixels

    sample = Image.new("RGB", (len(pixels), 1))
    sample.putdata(pixels)
    quantized = sample.quantize(
        colors=max(1, color_count),
        method=Image.Quantize.MEDIANCUT,
        dither=Image.Dither.FLOYDSTEINBERG if dither else Image.Dither.NONE,
    ).convert("RGB")
    reps = list(dict.fromkeys(quantized.getdata()))
    return reps[:color_count]


def nearest_color_index(pixel: tuple[int, int, int], palette: list[tuple[int, int, int]]) -> int:
    best_index = 0
    best_distance = float("inf")
    for index, color in enumerate(palette):
        distance = (
            ((pixel[0] - color[0]) ** 2)
            + ((pixel[1] - color[1]) ** 2)
            + ((pixel[2] - color[2]) ** 2)
        )
        if distance < best_distance:
            best_distance = distance
            best_index = index
    return best_index


def despeckle(
    grid: list[list[int]],
    max_size: int,
    colors_by_id: dict[int, tuple[int, int, int]],
    color_tolerance: float,
) -> None:
    if max_size <= 0 or not grid or not grid[0]:
        return

    height = len(grid)
    width = len(grid[0])
    directions = [(-1, 0), (1, 0), (0, -1), (0, 1)]

    for _pass in range(6):
        component_ids = [[-1] * width for _ in range(height)]
        members: list[list[tuple[int, int]]] = []
        component_values: list[int] = []
        component_index = 0

        for y in range(height):
            for x in range(width):
                if component_ids[y][x] != -1:
                    continue
                value = grid[y][x]
                stack = [(x, y)]
                component_ids[y][x] = component_index
                cells: list[tuple[int, int]] = []
                while stack:
                    current_x, current_y = stack.pop()
                    cells.append((current_x, current_y))
                    for offset_x, offset_y in directions:
                        next_x = current_x + offset_x
                        next_y = current_y + offset_y
                        if next_x < 0 or next_y < 0 or next_x >= width or next_y >= height:
                            continue
                        if component_ids[next_y][next_x] != -1:
                            continue
                        if grid[next_y][next_x] != value:
                            continue
                        component_ids[next_y][next_x] = component_index
                        stack.append((next_x, next_y))
                members.append(cells)
                component_values.append(value)
                component_index += 1

        changed = False
        for index, cells in enumerate(members):
            if len(cells) > max_size:
                continue
            value = component_values[index]
            tally: Counter[int] = Counter()
            gate_color = value != 0
            for current_x, current_y in cells:
                for offset_x, offset_y in directions:
                    next_x = current_x + offset_x
                    next_y = current_y + offset_y
                    if next_x < 0 or next_y < 0 or next_x >= width or next_y >= height:
                        continue
                    neighbor_value = grid[next_y][next_x]
                    if neighbor_value == value:
                        continue
                    if gate_color:
                        if neighbor_value == 0:
                            continue
                        if (
                            color_distance(colors_by_id[value], colors_by_id[neighbor_value])
                            > color_tolerance
                        ):
                            continue
                    tally[neighbor_value] += 1
            if not tally:
                continue
            next_value = sorted(tally.items(), key=lambda item: (item[1], item[0]), reverse=True)[0][0]
            for current_x, current_y in cells:
                grid[current_y][current_x] = next_value
            changed = True

        if not changed:
            break


def build_pixel_art(
    content_image: Image.Image,
    *,
    width: int,
    height: int,
    color_count: int,
    dither: bool,
    name: str,
) -> PixelArt:
    content = fit_to_content(content_image, frame_dims(width, height)["content_width"], frame_dims(width, height)["content_height"])
    pixels = list(content.getdata())
    opaque_pixels = [pixel[:3] for pixel in pixels if pixel[3] >= ALPHA_THRESHOLD]
    if not opaque_pixels:
        raise ValueError("image has no visible pixels")

    representatives = quantize_colors(opaque_pixels, max(1, color_count), dither)
    if not representatives:
        raise ValueError("failed to build a palette from the image")

    frame = frame_dims(width, height)
    content_width = frame["content_width"]
    content_height = frame["content_height"]
    content_grid = [[0 for _ in range(content_width)] for _ in range(content_height)]
    id_to_color: dict[int, tuple[int, int, int]] = {1: parse_hex_color(FRAME_COLOR) or (64, 64, 80)}

    for y in range(content_height):
        for x in range(content_width):
            pixel = pixels[(y * content_width) + x]
            if pixel[3] < ALPHA_THRESHOLD:
                continue
            palette_index = nearest_color_index(pixel[:3], representatives) + 2
            content_grid[y][x] = palette_index

    for index, color in enumerate(representatives, start=2):
        id_to_color[index] = color

    despeckle(content_grid, DEFAULT_DESPECKLE, id_to_color, SPECK_COLOR_TOL)

    used_ids = sorted({cell for row in content_grid for cell in row if cell > 0})
    remap = {old_id: new_id for new_id, old_id in enumerate(used_ids, start=2)}

    final_grid = [[0 for _ in range(width)] for _ in range(height)]
    for y in range(content_height):
        for x in range(content_width):
            value = content_grid[y][x]
            if value > 0:
                final_grid[frame["row_offset"] + y][frame["col_offset"] + x] = remap[value]

    left = frame["h_pad"]
    right = width - 1 - frame["h_pad"]
    for x in range(left, right + 1):
        final_grid[0][x] = 1
        final_grid[height - 1][x] = 1
    for y in range(height):
        final_grid[y][left] = 1
        final_grid[y][right] = 1

    final_palette: dict[int, tuple[int, int, int]] = {1: parse_hex_color(FRAME_COLOR) or (64, 64, 80)}
    for original_id, new_id in remap.items():
        final_palette[new_id] = id_to_color[original_id]

    if len(final_palette) > len(SYMBOLS):
        raise ValueError("palette is too large for the export format")

    legend: dict[str, str] = {}
    value_to_symbol: dict[int, str] = {}
    for index, color_id in enumerate(sorted(final_palette)):
        symbol = SYMBOLS[index]
        value_to_symbol[color_id] = symbol
        legend[symbol] = to_hex(final_palette[color_id])

    rows = [
        "".join("." if value == 0 else value_to_symbol[value] for value in row)
        for row in final_grid
    ]
    return PixelArt(name=name, rows=rows, legend=legend)


def convert(
    image_path: str | Path,
    *,
    size: int = 30,
    colors: int = 10,
    dither: bool = True,
    bg: str = "auto",
) -> PixelArt:
    source_path = Path(image_path)
    with Image.open(source_path) as image:
        prepared = apply_background(preprocess(image), bg)
        return build_pixel_art(
            prepared,
            width=size,
            height=size,
            color_count=max(1, int(colors) - 1),
            dither=dither,
            name=source_path.stem,
        )


def convert_grid(
    image_path: str | Path,
    *,
    colors: int = 10,
    expected_size: int = 30,
    exact: bool = True,
) -> tuple[PixelArt, tuple[int, int]]:
    source_path = Path(image_path)
    with Image.open(source_path) as image:
        rgba = preprocess(image).convert("RGBA")
        if rgba.width > expected_size or rgba.height > expected_size:
            raise ValueError("could not detect a grid")
        if exact and rgba.width != rgba.height:
            raise ValueError("could not detect a grid")
        pixel_art = build_pixel_art(
            rgba,
            width=expected_size,
            height=expected_size,
            color_count=max(1, int(colors) - 1),
            dither=False,
            name=source_path.stem,
        )
        return pixel_art, (rgba.width, rgba.height)
