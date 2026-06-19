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
    despeckle_size: int = DEFAULT_DESPECKLE,
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

    if despeckle_size > 0:
        despeckle(content_grid, despeckle_size, id_to_color, SPECK_COLOR_TOL)

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
    dither: bool = True,
) -> tuple[PixelArt, tuple[int, int]]:
    source_path = Path(image_path)
    with Image.open(source_path) as image:
        rgba = preprocess(image).convert("RGBA")
        corner_colors = [
            rgba.getpixel((0, 0))[:3],
            rgba.getpixel((rgba.width - 1, 0))[:3],
            rgba.getpixel((0, rgba.height - 1))[:3],
            rgba.getpixel((rgba.width - 1, rgba.height - 1))[:3],
        ]
        background_color = tuple(
            round(sum(color[channel] for color in corner_colors) / len(corner_colors))
            for channel in range(3)
        )
        if sum(background_color) / 3 < 96.0:
            crop_left = rgba.width
            crop_top = rgba.height
            crop_right = -1
            crop_bottom = -1
            for sample_y in range(rgba.height):
                for sample_x in range(rgba.width):
                    pixel = rgba.getpixel((sample_x, sample_y))
                    if pixel[3] < ALPHA_THRESHOLD:
                        continue
                    if color_distance(pixel[:3], background_color) <= 6.0:
                        continue
                    crop_left = min(crop_left, sample_x)
                    crop_top = min(crop_top, sample_y)
                    crop_right = max(crop_right, sample_x)
                    crop_bottom = max(crop_bottom, sample_y)
            if crop_right >= crop_left and crop_bottom >= crop_top:
                cropped_width = crop_right - crop_left + 1
                cropped_height = crop_bottom - crop_top + 1
                if (
                    cropped_width >= round(rgba.width * 0.85)
                    and cropped_height >= round(rgba.height * 0.85)
                ):
                    rgba = rgba.crop((crop_left, crop_top, crop_right + 1, crop_bottom + 1))
                    corner_colors = [
                        rgba.getpixel((0, 0))[:3],
                        rgba.getpixel((rgba.width - 1, 0))[:3],
                        rgba.getpixel((0, rgba.height - 1))[:3],
                        rgba.getpixel((rgba.width - 1, rgba.height - 1))[:3],
                    ]
                    background_color = tuple(
                        round(sum(color[channel] for color in corner_colors) / len(corner_colors))
                        for channel in range(3)
                    )

        detected = rgba
        if rgba.width > expected_size or rgba.height > expected_size:
            if exact and rgba.width >= expected_size * 2 and rgba.height >= expected_size * 2:
                sampled_cells: list[list[tuple[int, int, int, int]]] = []
                for cell_y in range(expected_size):
                    row_top = round((cell_y * rgba.height) / expected_size)
                    row_bottom = round(((cell_y + 1) * rgba.height) / expected_size)
                    sample_height = max(1, row_bottom - row_top)
                    inner_top = row_top + max(1, sample_height // 4)
                    inner_bottom = row_bottom - max(1, sample_height // 4)
                    if inner_bottom <= inner_top:
                        inner_top = row_top
                        inner_bottom = row_bottom
                    sampled_row: list[tuple[int, int, int, int]] = []
                    for cell_x in range(expected_size):
                        col_left = round((cell_x * rgba.width) / expected_size)
                        col_right = round(((cell_x + 1) * rgba.width) / expected_size)
                        sample_width = max(1, col_right - col_left)
                        inner_left = col_left + max(1, sample_width // 4)
                        inner_right = col_right - max(1, sample_width // 4)
                        if inner_right <= inner_left:
                            inner_left = col_left
                            inner_right = col_right
                        cell_pixels: Counter[tuple[int, int, int]] = Counter()
                        for sample_y in range(inner_top, max(inner_top + 1, inner_bottom)):
                            for sample_x in range(inner_left, max(inner_left + 1, inner_right)):
                                pixel = rgba.getpixel(
                                    (min(rgba.width - 1, sample_x), min(rgba.height - 1, sample_y))
                                )
                                if pixel[3] < ALPHA_THRESHOLD:
                                    continue
                                cell_pixels[pixel[:3]] += 1
                        if not cell_pixels:
                            sampled_row.append((0, 0, 0, 0))
                            continue
                        average_red = 0
                        average_green = 0
                        average_blue = 0
                        pixel_count = 0
                        for pixel_rgb, count in cell_pixels.items():
                            average_red += pixel_rgb[0] * count
                            average_green += pixel_rgb[1] * count
                            average_blue += pixel_rgb[2] * count
                            pixel_count += count
                        average_color = (
                            round(average_red / pixel_count),
                            round(average_green / pixel_count),
                            round(average_blue / pixel_count),
                        )
                        chosen_color = max(
                            cell_pixels,
                            key=lambda pixel_rgb: (
                                cell_pixels[pixel_rgb],
                                -color_distance(pixel_rgb, average_color),
                            ),
                        )
                        sampled_row.append((*chosen_color, 255))
                    sampled_cells.append(sampled_row)

                border_bins: Counter[tuple[int, int, int]] = Counter()
                neutral_bins: Counter[tuple[int, int, int]] = Counter()
                last_row_index = len(sampled_cells) - 1
                last_col_index = len(sampled_cells[0]) - 1 if sampled_cells else -1
                for cell_y, sampled_row in enumerate(sampled_cells):
                    for cell_x, pixel in enumerate(sampled_row):
                        if pixel[3] < ALPHA_THRESHOLD:
                            continue
                        pixel_rgb = pixel[:3]
                        pixel_brightness = sum(pixel_rgb) / 3
                        pixel_spread = max(pixel_rgb) - min(pixel_rgb)
                        if pixel_brightness < 180.0 or pixel_spread > 52:
                            continue
                        color_bin = tuple(channel // 16 for channel in pixel_rgb)
                        neutral_bins[color_bin] += 1
                        if cell_y in {0, last_row_index} or cell_x in {0, last_col_index}:
                            border_bins[color_bin] += 1

                sampled_background = background_color
                if border_bins:
                    sampled_background = tuple(
                        (value * 16) + 8 for value in border_bins.most_common(1)[0][0]
                    )
                elif neutral_bins:
                    sampled_background = tuple(
                        (value * 16) + 8 for value in neutral_bins.most_common(1)[0][0]
                    )

                direct_grid = Image.new("RGBA", (expected_size, expected_size), (0, 0, 0, 0))
                direct_nonempty = 0
                for cell_y, sampled_row in enumerate(sampled_cells):
                    for cell_x, pixel in enumerate(sampled_row):
                        if pixel[3] < ALPHA_THRESHOLD:
                            continue
                        pixel_rgb = pixel[:3]
                        pixel_brightness = sum(pixel_rgb) / 3
                        pixel_spread = max(pixel_rgb) - min(pixel_rgb)
                        if (
                            color_distance(pixel_rgb, sampled_background) <= 24.0
                            or (
                                color_distance(pixel_rgb, background_color) <= 20.0
                                and pixel_brightness >= 188.0
                            )
                            or (pixel_brightness >= 244.0 and pixel_spread <= 18)
                        ):
                            continue
                        direct_grid.putpixel((cell_x, cell_y), (pixel[0], pixel[1], pixel[2], 255))
                        direct_nonempty += 1
                if direct_nonempty > 0:
                    detected = direct_grid

            patch_width = min(rgba.width, max(70, min(130, rgba.width // 4)))
            patch_height = min(rgba.height, max(70, min(130, rgba.height // 4)))
            strong_vertical_centers: list[float] = []
            strong_horizontal_centers: list[float] = []

            vertical_presence: list[int] = []
            for sample_x in range(patch_width):
                non_background = 0
                for sample_y in range(patch_height):
                    pixel = rgba.getpixel((sample_x, sample_y))
                    if pixel[3] < ALPHA_THRESHOLD:
                        continue
                    if color_distance(pixel[:3], background_color) > 8.0:
                        non_background += 1
                vertical_presence.append(non_background)
            presence_threshold = patch_height * 0.68
            run: list[int] = []
            for sample_x, presence in enumerate(vertical_presence):
                if presence >= presence_threshold:
                    run.append(sample_x)
                    continue
                if run:
                    strong_vertical_centers.append(sum(run) / len(run))
                    run = []
            if run:
                strong_vertical_centers.append(sum(run) / len(run))

            horizontal_presence: list[int] = []
            for sample_y in range(patch_height):
                non_background = 0
                for sample_x in range(patch_width):
                    pixel = rgba.getpixel((sample_x, sample_y))
                    if pixel[3] < ALPHA_THRESHOLD:
                        continue
                    if color_distance(pixel[:3], background_color) > 8.0:
                        non_background += 1
                horizontal_presence.append(non_background)
            presence_threshold = patch_width * 0.68
            run = []
            for sample_y, presence in enumerate(horizontal_presence):
                if presence >= presence_threshold:
                    run.append(sample_y)
                    continue
                if run:
                    strong_horizontal_centers.append(sum(run) / len(run))
                    run = []
            if run:
                strong_horizontal_centers.append(sum(run) / len(run))

            best_vertical_progression: list[float] = []
            best_horizontal_progression: list[float] = []
            best_vertical_spacing = 0.0
            best_horizontal_spacing = 0.0

            vertical_diffs = [
                strong_vertical_centers[index + 1] - strong_vertical_centers[index]
                for index in range(len(strong_vertical_centers) - 1)
                if strong_vertical_centers[index + 1] - strong_vertical_centers[index] >= 6.0
            ]
            for spacing in vertical_diffs:
                tolerance = max(1.5, spacing * 0.18)
                for start_center in strong_vertical_centers:
                    progression = [start_center]
                    target = start_center + spacing
                    while target <= strong_vertical_centers[-1] + tolerance:
                        candidates = [
                            center
                            for center in strong_vertical_centers
                            if center > progression[-1] and abs(center - target) <= tolerance
                        ]
                        if not candidates:
                            break
                        match = min(candidates, key=lambda center: abs(center - target))
                        progression.append(match)
                        target = match + spacing
                    if len(progression) > len(best_vertical_progression) or (
                        len(progression) == len(best_vertical_progression)
                        and spacing > best_vertical_spacing
                    ):
                        best_vertical_progression = progression
                        best_vertical_spacing = spacing

            horizontal_diffs = [
                strong_horizontal_centers[index + 1] - strong_horizontal_centers[index]
                for index in range(len(strong_horizontal_centers) - 1)
                if strong_horizontal_centers[index + 1] - strong_horizontal_centers[index] >= 6.0
            ]
            for spacing in horizontal_diffs:
                tolerance = max(1.5, spacing * 0.18)
                for start_center in strong_horizontal_centers:
                    progression = [start_center]
                    target = start_center + spacing
                    while target <= strong_horizontal_centers[-1] + tolerance:
                        candidates = [
                            center
                            for center in strong_horizontal_centers
                            if center > progression[-1] and abs(center - target) <= tolerance
                        ]
                        if not candidates:
                            break
                        match = min(candidates, key=lambda center: abs(center - target))
                        progression.append(match)
                        target = match + spacing
                    if len(progression) > len(best_horizontal_progression) or (
                        len(progression) == len(best_horizontal_progression)
                        and spacing > best_horizontal_spacing
                    ):
                        best_horizontal_progression = progression
                        best_horizontal_spacing = spacing

            if len(best_vertical_progression) >= 4 and len(best_horizontal_progression) >= 4:
                best_vertical_spacing = (
                    sum(
                        best_vertical_progression[index + 1] - best_vertical_progression[index]
                        for index in range(len(best_vertical_progression) - 1)
                    )
                    / max(1, len(best_vertical_progression) - 1)
                )
                best_horizontal_spacing = (
                    sum(
                        best_horizontal_progression[index + 1] - best_horizontal_progression[index]
                        for index in range(len(best_horizontal_progression) - 1)
                    )
                    / max(1, len(best_horizontal_progression) - 1)
                )
                vertical_origin = (
                    sum(
                        center - (best_vertical_spacing * index)
                        for index, center in enumerate(best_vertical_progression)
                    )
                    / len(best_vertical_progression)
                )
                horizontal_origin = (
                    sum(
                        center - (best_horizontal_spacing * index)
                        for index, center in enumerate(best_horizontal_progression)
                    )
                    / len(best_horizontal_progression)
                )

                while vertical_origin - best_vertical_spacing > -best_vertical_spacing * 0.5:
                    vertical_origin -= best_vertical_spacing
                while horizontal_origin - best_horizontal_spacing > -best_horizontal_spacing * 0.5:
                    horizontal_origin -= best_horizontal_spacing

                exact_vertical_lines: list[float] = []
                exact_horizontal_lines: list[float] = []
                next_line = vertical_origin
                while next_line <= rgba.width - 1 + (best_vertical_spacing * 0.5):
                    if next_line >= -best_vertical_spacing * 0.5:
                        exact_vertical_lines.append(next_line)
                    next_line += best_vertical_spacing
                next_line = horizontal_origin
                while next_line <= rgba.height - 1 + (best_horizontal_spacing * 0.5):
                    if next_line >= -best_horizontal_spacing * 0.5:
                        exact_horizontal_lines.append(next_line)
                    next_line += best_horizontal_spacing
                if (
                    len(exact_vertical_lines) == expected_size
                    and exact_vertical_lines[-1] + (best_vertical_spacing * 0.75) >= rgba.width - 1
                ):
                    exact_vertical_lines.append(exact_vertical_lines[-1] + best_vertical_spacing)
                if (
                    len(exact_horizontal_lines) == expected_size
                    and exact_horizontal_lines[-1] + (best_horizontal_spacing * 0.75) >= rgba.height - 1
                ):
                    exact_horizontal_lines.append(exact_horizontal_lines[-1] + best_horizontal_spacing)

                exact_width = max(0, len(exact_vertical_lines) - 1)
                exact_height = max(0, len(exact_horizontal_lines) - 1)
                if (
                    exact_width >= 8
                    and exact_height >= 8
                    and exact_width <= expected_size
                    and exact_height <= expected_size
                ):
                    exact_grid = Image.new("RGBA", (exact_width, exact_height), (0, 0, 0, 0))
                    for cell_y in range(exact_height):
                        center_y = min(
                            rgba.height - 1,
                            max(0, round((exact_horizontal_lines[cell_y] + exact_horizontal_lines[cell_y + 1]) / 2)),
                        )
                        for cell_x in range(exact_width):
                            center_x = min(
                                rgba.width - 1,
                                max(0, round((exact_vertical_lines[cell_x] + exact_vertical_lines[cell_x + 1]) / 2)),
                            )
                            center_pixel = rgba.getpixel((center_x, center_y))
                            if center_pixel[3] < ALPHA_THRESHOLD:
                                continue
                            chosen_color = center_pixel[:3]
                            chosen_brightness = sum(chosen_color) / 3
                            chosen_spread = max(chosen_color) - min(chosen_color)
                            if (
                                color_distance(chosen_color, background_color) <= 26.0
                                or (chosen_brightness >= 244.0 and chosen_spread <= 18)
                            ):
                                cell_pixels: Counter[tuple[int, int, int]] = Counter()
                                for sample_y in range(max(0, center_y - 1), min(rgba.height, center_y + 2)):
                                    for sample_x in range(max(0, center_x - 1), min(rgba.width, center_x + 2)):
                                        pixel = rgba.getpixel((sample_x, sample_y))
                                        if pixel[3] < ALPHA_THRESHOLD:
                                            continue
                                        pixel_rgb = pixel[:3]
                                        pixel_brightness = sum(pixel_rgb) / 3
                                        pixel_spread = max(pixel_rgb) - min(pixel_rgb)
                                        if (
                                            color_distance(pixel_rgb, background_color) <= 26.0
                                            or (pixel_brightness >= 244.0 and pixel_spread <= 18)
                                        ):
                                            continue
                                        cell_pixels[pixel_rgb] += 1
                                if not cell_pixels:
                                    continue
                                chosen_color = cell_pixels.most_common(1)[0][0]
                            exact_grid.putpixel((cell_x, cell_y), (*chosen_color, 255))
                    if any(pixel[3] >= ALPHA_THRESHOLD for pixel in exact_grid.getdata()):
                        detected = exact_grid

            max_cell_size = min(rgba.width, rgba.height)
            for cell_size in range(2, max_cell_size + 1):
                if detected is not rgba:
                    break
                if rgba.width % cell_size or rgba.height % cell_size:
                    continue

                reduced_width = rgba.width // cell_size
                reduced_height = rgba.height // cell_size
                if reduced_width > expected_size or reduced_height > expected_size:
                    continue
                block_colors: list[tuple[int, int, int, int]] = []
                blocks_match = True
                for block_y in range(reduced_height):
                    for block_x in range(reduced_width):
                        reference = rgba.getpixel((block_x * cell_size, block_y * cell_size))
                        for sample_y in range(block_y * cell_size, (block_y + 1) * cell_size):
                            for sample_x in range(block_x * cell_size, (block_x + 1) * cell_size):
                                if rgba.getpixel((sample_x, sample_y)) != reference:
                                    blocks_match = False
                                    break
                            if not blocks_match:
                                break
                        if not blocks_match:
                            break
                        block_colors.append(reference)
                    if not blocks_match:
                        break

                if not blocks_match:
                    continue

                reduced = Image.new("RGBA", (reduced_width, reduced_height))
                color_index = 0
                for block_y in range(reduced_height):
                    for block_x in range(reduced_width):
                        reduced.putpixel((block_x, block_y), block_colors[color_index])
                        color_index += 1
                detected = reduced
                break

            if detected is rgba:
                background_threshold = 8.0
                candidate_bins: Counter[tuple[int, int, int]] = Counter()

                for sample_y in range(rgba.height):
                    for sample_x in range(rgba.width):
                        pixel = rgba.getpixel((sample_x, sample_y))
                        if pixel[3] < ALPHA_THRESHOLD:
                            continue
                        if color_distance(pixel[:3], background_color) <= background_threshold:
                            continue
                        candidate_bins[tuple(channel // 16 for channel in pixel[:3])] += 1

                vertical_lines: list[int] = []
                horizontal_lines: list[int] = []
                regularity_tolerance = 2

                for candidate_bin, _count in candidate_bins.most_common(6):
                    candidate_color = tuple((value * 16) + 8 for value in candidate_bin)

                    best_vertical: list[int] = []
                    best_vertical_score = 0
                    for sample_y in range(rgba.height):
                        clusters: list[tuple[int, int]] = []
                        cluster_start = -1
                        for sample_x in range(rgba.width):
                            pixel = rgba.getpixel((sample_x, sample_y))
                            is_candidate = (
                                pixel[3] >= ALPHA_THRESHOLD
                                and color_distance(pixel[:3], candidate_color) <= 24.0
                            )
                            if is_candidate and cluster_start < 0:
                                cluster_start = sample_x
                            elif not is_candidate and cluster_start >= 0:
                                clusters.append((cluster_start, sample_x - 1))
                                cluster_start = -1
                        if cluster_start >= 0:
                            clusters.append((cluster_start, rgba.width - 1))
                        if len(clusters) < 4:
                            continue

                        centers = [round((start + end) / 2) for start, end in clusters]
                        intervals = [centers[index + 1] - centers[index] for index in range(len(centers) - 1)]
                        if not intervals:
                            continue
                        sorted_intervals = sorted(intervals)
                        median_interval = sorted_intervals[len(sorted_intervals) // 2]
                        if median_interval < 3:
                            continue
                        if any(abs(interval - median_interval) > regularity_tolerance for interval in intervals):
                            continue
                        if any((end - start + 1) > max(4, median_interval // 2) for start, end in clusters):
                            continue

                        score = len(clusters) * median_interval
                        if score > best_vertical_score:
                            best_vertical_score = score
                            best_vertical = centers

                    best_horizontal: list[int] = []
                    best_horizontal_score = 0
                    for sample_x in range(rgba.width):
                        clusters = []
                        cluster_start = -1
                        for sample_y in range(rgba.height):
                            pixel = rgba.getpixel((sample_x, sample_y))
                            is_candidate = (
                                pixel[3] >= ALPHA_THRESHOLD
                                and color_distance(pixel[:3], candidate_color) <= 24.0
                            )
                            if is_candidate and cluster_start < 0:
                                cluster_start = sample_y
                            elif not is_candidate and cluster_start >= 0:
                                clusters.append((cluster_start, sample_y - 1))
                                cluster_start = -1
                        if cluster_start >= 0:
                            clusters.append((cluster_start, rgba.height - 1))
                        if len(clusters) < 4:
                            continue

                        centers = [round((start + end) / 2) for start, end in clusters]
                        intervals = [centers[index + 1] - centers[index] for index in range(len(centers) - 1)]
                        if not intervals:
                            continue
                        sorted_intervals = sorted(intervals)
                        median_interval = sorted_intervals[len(sorted_intervals) // 2]
                        if median_interval < 3:
                            continue
                        if any(abs(interval - median_interval) > regularity_tolerance for interval in intervals):
                            continue
                        if any((end - start + 1) > max(4, median_interval // 2) for start, end in clusters):
                            continue

                        score = len(clusters) * median_interval
                        if score > best_horizontal_score:
                            best_horizontal_score = score
                            best_horizontal = centers

                    if len(best_vertical) >= 2 and len(best_horizontal) >= 2:
                        vertical_lines = best_vertical
                        horizontal_lines = best_horizontal
                        break

                reduced_width = max(0, len(vertical_lines) - 1)
                reduced_height = max(0, len(horizontal_lines) - 1)
                if (
                    reduced_width
                    and reduced_height
                    and reduced_width <= expected_size
                    and reduced_height <= expected_size
                ):
                    sampled_cells: list[list[tuple[int, int, int, int]]] = []
                    for cell_y in range(reduced_height):
                        sampled_row: list[tuple[int, int, int, int]] = []
                        top = max(0, horizontal_lines[cell_y] + 1)
                        bottom = min(rgba.height, horizontal_lines[cell_y + 1])
                        for cell_x in range(reduced_width):
                            left = max(0, vertical_lines[cell_x] + 1)
                            right = min(rgba.width, vertical_lines[cell_x + 1])
                            red_total = 0
                            green_total = 0
                            blue_total = 0
                            alpha_total = 0
                            pixel_count = 0
                            for sample_y in range(top, bottom):
                                for sample_x in range(left, right):
                                    pixel = rgba.getpixel((sample_x, sample_y))
                                    if pixel[3] < ALPHA_THRESHOLD:
                                        continue
                                    red_total += pixel[0]
                                    green_total += pixel[1]
                                    blue_total += pixel[2]
                                    alpha_total += pixel[3]
                                    pixel_count += 1
                            if pixel_count == 0:
                                sampled_row.append((0, 0, 0, 0))
                                continue
                            sampled_row.append(
                                (
                                    round(red_total / pixel_count),
                                    round(green_total / pixel_count),
                                    round(blue_total / pixel_count),
                                    round(alpha_total / pixel_count),
                                )
                            )
                        sampled_cells.append(sampled_row)

                    border_bins: Counter[tuple[int, int, int]] = Counter()
                    if sampled_cells:
                        last_row_index = len(sampled_cells) - 1
                        last_col_index = len(sampled_cells[0]) - 1
                        for cell_y, sampled_row in enumerate(sampled_cells):
                            for cell_x, pixel in enumerate(sampled_row):
                                if pixel[3] < ALPHA_THRESHOLD:
                                    continue
                                if cell_y not in {0, last_row_index} and cell_x not in {0, last_col_index}:
                                    continue
                                border_bins[tuple(channel // 16 for channel in pixel[:3])] += 1

                    sampled_background = background_color
                    if border_bins:
                        sampled_background = tuple(
                            (value * 16) + 8 for value in border_bins.most_common(1)[0][0]
                        )

                    reduced = Image.new("RGBA", (reduced_width, reduced_height))
                    for cell_y, sampled_row in enumerate(sampled_cells):
                        for cell_x, pixel in enumerate(sampled_row):
                            if pixel[3] < ALPHA_THRESHOLD:
                                reduced.putpixel((cell_x, cell_y), (0, 0, 0, 0))
                                continue
                            if (
                                color_distance(pixel[:3], sampled_background) <= 20.0
                                or color_distance(pixel[:3], background_color) <= 20.0
                            ):
                                reduced.putpixel((cell_x, cell_y), (0, 0, 0, 0))
                                continue
                            reduced.putpixel((cell_x, cell_y), (pixel[0], pixel[1], pixel[2], 255))
                    detected = reduced

            if detected is rgba:
                vertical_scores: list[float] = []
                for sample_x in range(1, rgba.width - 1):
                    total = 0.0
                    for sample_y in range(rgba.height):
                        left_pixel = rgba.getpixel((sample_x - 1, sample_y))[:3]
                        center_pixel = rgba.getpixel((sample_x, sample_y))[:3]
                        right_pixel = rgba.getpixel((sample_x + 1, sample_y))[:3]
                        total += (
                            abs(center_pixel[0] - ((left_pixel[0] + right_pixel[0]) / 2))
                            + abs(center_pixel[1] - ((left_pixel[1] + right_pixel[1]) / 2))
                            + abs(center_pixel[2] - ((left_pixel[2] + right_pixel[2]) / 2))
                        )
                    vertical_scores.append(total / rgba.height)

                horizontal_scores: list[float] = []
                for sample_y in range(1, rgba.height - 1):
                    total = 0.0
                    for sample_x in range(rgba.width):
                        upper_pixel = rgba.getpixel((sample_x, sample_y - 1))[:3]
                        center_pixel = rgba.getpixel((sample_x, sample_y))[:3]
                        lower_pixel = rgba.getpixel((sample_x, sample_y + 1))[:3]
                        total += (
                            abs(center_pixel[0] - ((upper_pixel[0] + lower_pixel[0]) / 2))
                            + abs(center_pixel[1] - ((upper_pixel[1] + lower_pixel[1]) / 2))
                            + abs(center_pixel[2] - ((upper_pixel[2] + lower_pixel[2]) / 2))
                        )
                    horizontal_scores.append(total / rgba.width)

                vertical_peak_mean = sum(vertical_scores) / max(1, len(vertical_scores))
                horizontal_peak_mean = sum(horizontal_scores) / max(1, len(horizontal_scores))
                vertical_peaks: list[int] = []
                horizontal_peaks: list[int] = []
                vertical_local_peaks: list[int] = []
                horizontal_local_peaks: list[int] = []
                for index in range(1, len(vertical_scores) - 1):
                    is_peak = (
                        vertical_scores[index] >= vertical_scores[index - 1]
                        and vertical_scores[index] > vertical_scores[index + 1]
                    )
                    if not is_peak:
                        continue
                    vertical_local_peaks.append(index + 1)
                    if vertical_scores[index] > vertical_peak_mean * 1.3:
                        vertical_peaks.append(index + 1)
                for index in range(1, len(horizontal_scores) - 1):
                    is_peak = (
                        horizontal_scores[index] >= horizontal_scores[index - 1]
                        and horizontal_scores[index] > horizontal_scores[index + 1]
                    )
                    if not is_peak:
                        continue
                    horizontal_local_peaks.append(index + 1)
                    if horizontal_scores[index] > horizontal_peak_mean * 1.3:
                        horizontal_peaks.append(index + 1)
                if len(vertical_peaks) < 2:
                    vertical_peaks = vertical_local_peaks[:]
                if len(horizontal_peaks) < 2:
                    horizontal_peaks = horizontal_local_peaks[:]

                best_vertical_lines: list[int] = []
                best_horizontal_lines: list[int] = []
                best_vertical_spacing = 0
                best_horizontal_spacing = 0

                for spacing in range(4, min(40, max(5, rgba.width // 2))):
                    tolerance = max(1, round(spacing * 0.12))
                    for start in vertical_peaks:
                        sequence = [start]
                        target = start + spacing
                        while target < rgba.width:
                            candidates = [peak for peak in vertical_peaks if abs(peak - target) <= tolerance]
                            if not candidates:
                                break
                            match = min(candidates, key=lambda peak: abs(peak - target))
                            if match != sequence[-1]:
                                sequence.append(match)
                            target += spacing
                        if len(sequence) > len(best_vertical_lines) or (
                            len(sequence) == len(best_vertical_lines)
                            and spacing * len(sequence) > best_vertical_spacing * len(best_vertical_lines)
                        ):
                            best_vertical_lines = sequence
                            best_vertical_spacing = spacing

                for spacing in range(4, min(40, max(5, rgba.height // 2))):
                    tolerance = max(1, round(spacing * 0.12))
                    for start in horizontal_peaks:
                        sequence = [start]
                        target = start + spacing
                        while target < rgba.height:
                            candidates = [peak for peak in horizontal_peaks if abs(peak - target) <= tolerance]
                            if not candidates:
                                break
                            match = min(candidates, key=lambda peak: abs(peak - target))
                            if match != sequence[-1]:
                                sequence.append(match)
                            target += spacing
                        if len(sequence) > len(best_horizontal_lines) or (
                            len(sequence) == len(best_horizontal_lines)
                            and spacing * len(sequence) > best_horizontal_spacing * len(best_horizontal_lines)
                        ):
                            best_horizontal_lines = sequence
                            best_horizontal_spacing = spacing

                if best_vertical_lines and best_vertical_spacing > 0:
                    tolerance = max(1, round(best_vertical_spacing * 0.12))
                    while best_vertical_lines[0] - best_vertical_spacing > 1:
                        target = best_vertical_lines[0] - best_vertical_spacing
                        window_start = max(1, round(target - tolerance))
                        window_end = min(rgba.width - 2, round(target + tolerance))
                        if window_end < window_start:
                            break
                        candidates = [
                            peak for peak in vertical_local_peaks
                            if window_start <= peak <= window_end
                        ]
                        if candidates:
                            match = max(candidates, key=lambda peak: vertical_scores[peak - 1])
                        else:
                            match = max(range(window_start, window_end + 1), key=lambda index: vertical_scores[index - 1])
                        if vertical_scores[match - 1] < vertical_peak_mean * 0.2:
                            break
                        best_vertical_lines.insert(0, match)
                    while best_vertical_lines[-1] + best_vertical_spacing < rgba.width - 1:
                        target = best_vertical_lines[-1] + best_vertical_spacing
                        window_start = max(1, round(target - tolerance))
                        window_end = min(rgba.width - 2, round(target + tolerance))
                        if window_end < window_start:
                            break
                        candidates = [
                            peak for peak in vertical_local_peaks
                            if window_start <= peak <= window_end
                        ]
                        if candidates:
                            match = max(candidates, key=lambda peak: vertical_scores[peak - 1])
                        else:
                            match = max(range(window_start, window_end + 1), key=lambda index: vertical_scores[index - 1])
                        if vertical_scores[match - 1] < vertical_peak_mean * 0.2:
                            break
                        best_vertical_lines.append(match)
                    best_vertical_lines = sorted(dict.fromkeys(best_vertical_lines))

                if best_horizontal_lines and best_horizontal_spacing > 0:
                    tolerance = max(1, round(best_horizontal_spacing * 0.12))
                    while best_horizontal_lines[0] - best_horizontal_spacing > 1:
                        target = best_horizontal_lines[0] - best_horizontal_spacing
                        window_start = max(1, round(target - tolerance))
                        window_end = min(rgba.height - 2, round(target + tolerance))
                        if window_end < window_start:
                            break
                        candidates = [
                            peak for peak in horizontal_local_peaks
                            if window_start <= peak <= window_end
                        ]
                        if candidates:
                            match = max(candidates, key=lambda peak: horizontal_scores[peak - 1])
                        else:
                            match = max(range(window_start, window_end + 1), key=lambda index: horizontal_scores[index - 1])
                        if horizontal_scores[match - 1] < horizontal_peak_mean * 0.2:
                            break
                        best_horizontal_lines.insert(0, match)
                    while best_horizontal_lines[-1] + best_horizontal_spacing < rgba.height - 1:
                        target = best_horizontal_lines[-1] + best_horizontal_spacing
                        window_start = max(1, round(target - tolerance))
                        window_end = min(rgba.height - 2, round(target + tolerance))
                        if window_end < window_start:
                            break
                        candidates = [
                            peak for peak in horizontal_local_peaks
                            if window_start <= peak <= window_end
                        ]
                        if candidates:
                            match = max(candidates, key=lambda peak: horizontal_scores[peak - 1])
                        else:
                            match = max(range(window_start, window_end + 1), key=lambda index: horizontal_scores[index - 1])
                        if horizontal_scores[match - 1] < horizontal_peak_mean * 0.2:
                            break
                        best_horizontal_lines.append(match)
                    best_horizontal_lines = sorted(dict.fromkeys(best_horizontal_lines))

                reduced_width = max(0, len(best_vertical_lines) - 1)
                reduced_height = max(0, len(best_horizontal_lines) - 1)
                if (
                    reduced_width >= 4
                    and reduced_height >= 4
                    and reduced_width <= expected_size
                    and reduced_height <= expected_size
                ):
                    reduced = Image.new("RGBA", (reduced_width, reduced_height))
                    for cell_y in range(reduced_height):
                        top = max(0, best_horizontal_lines[cell_y] + 1)
                        bottom = min(rgba.height, best_horizontal_lines[cell_y + 1])
                        for cell_x in range(reduced_width):
                            left = max(0, best_vertical_lines[cell_x] + 1)
                            right = min(rgba.width, best_vertical_lines[cell_x + 1])
                            red_total = 0
                            green_total = 0
                            blue_total = 0
                            alpha_total = 0
                            pixel_count = 0
                            for sample_y in range(top, bottom):
                                for sample_x in range(left, right):
                                    pixel = rgba.getpixel((sample_x, sample_y))
                                    if pixel[3] < ALPHA_THRESHOLD:
                                        continue
                                    red_total += pixel[0]
                                    green_total += pixel[1]
                                    blue_total += pixel[2]
                                    alpha_total += pixel[3]
                                    pixel_count += 1
                            if pixel_count == 0:
                                reduced.putpixel((cell_x, cell_y), (0, 0, 0, 0))
                                continue
                            reduced.putpixel(
                                (cell_x, cell_y),
                                (
                                    round(red_total / pixel_count),
                                    round(green_total / pixel_count),
                                    round(blue_total / pixel_count),
                                    round(alpha_total / pixel_count),
                                ),
                            )
                    detected = reduced

        if detected is not rgba and detected.width > 0 and detected.height > 0:
            border_bins: Counter[tuple[int, int, int]] = Counter()
            last_row_index = detected.height - 1
            last_col_index = detected.width - 1
            for cell_y in range(detected.height):
                for cell_x in range(detected.width):
                    pixel = detected.getpixel((cell_x, cell_y))
                    if pixel[3] < ALPHA_THRESHOLD:
                        continue
                    if cell_y not in {0, last_row_index} and cell_x not in {0, last_col_index}:
                        continue
                    border_bins[tuple(channel // 16 for channel in pixel[:3])] += 1

            sampled_background = background_color
            if border_bins:
                sampled_background = tuple(
                    (value * 16) + 8 for value in border_bins.most_common(1)[0][0]
                )
            cleaned = Image.new("RGBA", detected.size, (0, 0, 0, 0))
            for cell_y in range(detected.height):
                for cell_x in range(detected.width):
                    pixel = detected.getpixel((cell_x, cell_y))
                    if pixel[3] < ALPHA_THRESHOLD:
                        continue
                    if (
                        color_distance(pixel[:3], sampled_background) <= 20.0
                        and color_distance(pixel[:3], background_color) <= 28.0
                    ):
                        continue
                    cleaned.putpixel((cell_x, cell_y), (pixel[0], pixel[1], pixel[2], 255))
            if detected.width == expected_size and detected.height == expected_size:
                detected = cleaned
            else:
                detected = preprocess(cleaned)
                target_width = expected_size
                target_height = expected_size
                if detected.width > target_width or detected.height > target_height:
                    scale = min(target_width / max(1, detected.width), target_height / max(1, detected.height))
                    resized_width = max(1, round(detected.width * scale))
                    resized_height = max(1, round(detected.height * scale))
                    detected = detected.resize((resized_width, resized_height), Image.Resampling.NEAREST)

        if detected.width > expected_size or detected.height > expected_size:
            raise ValueError("could not detect a grid")

        foreground_pixels: list[tuple[int, int, int]] = []
        for pixel in detected.getdata():
            if pixel[3] < ALPHA_THRESHOLD:
                continue
            pixel_rgb = pixel[:3]
            pixel_brightness = sum(pixel_rgb) / 3
            pixel_spread = max(pixel_rgb) - min(pixel_rgb)
            if (
                color_distance(pixel_rgb, background_color) <= 26.0
                or (pixel_brightness >= 244.0 and pixel_spread <= 18)
            ):
                continue
            foreground_pixels.append(pixel_rgb)
        if not foreground_pixels:
            raise ValueError("image has no visible pixels")

        foreground_counts = Counter(foreground_pixels)
        palette_colors: list[tuple[int, int, int]]
        if len(foreground_counts) <= max(1, int(colors)):
            palette_colors = [
                color
                for color, _count in foreground_counts.most_common(max(1, int(colors)))
            ]
        else:
            preliminary_palette = quantize_colors(foreground_pixels, max(1, int(colors)), dither)
            cluster_members: list[list[tuple[tuple[int, int, int], int]]] = [
                [] for _ in preliminary_palette
            ]
            for pixel_rgb, count in foreground_counts.items():
                cluster_index = nearest_color_index(pixel_rgb, preliminary_palette)
                cluster_members[cluster_index].append((pixel_rgb, count))
            palette_colors = []
            for cluster_index, members in enumerate(cluster_members):
                if not members:
                    continue
                best_color = members[0][0]
                best_frequency = members[0][1]
                best_distance_sum = float("inf")
                for candidate_color, candidate_count in members:
                    distance_sum = 0.0
                    for member_color, member_count in members:
                        distance_sum += color_distance(candidate_color, member_color) * member_count
                    if (
                        candidate_count > best_frequency
                        or (
                            candidate_count == best_frequency
                            and distance_sum < best_distance_sum
                        )
                    ):
                        best_color = candidate_color
                        best_frequency = candidate_count
                        best_distance_sum = distance_sum
                palette_colors.append(best_color)
        if not palette_colors:
            raise ValueError("failed to build a palette from the image")
        if len(palette_colors) > len(SYMBOLS):
            raise ValueError("palette is too large for the export format")

        grid_values = [[0 for _ in range(expected_size)] for _ in range(expected_size)]
        offset_x = 0 if detected.width == expected_size else (expected_size - detected.width) // 2
        offset_y = 0 if detected.height == expected_size else (expected_size - detected.height) // 2
        used_palette_indices: list[int] = []
        used_palette_set: set[int] = set()

        for sample_y in range(detected.height):
            for sample_x in range(detected.width):
                pixel = detected.getpixel((sample_x, sample_y))
                if pixel[3] < ALPHA_THRESHOLD:
                    continue
                pixel_rgb = pixel[:3]
                pixel_brightness = sum(pixel_rgb) / 3
                pixel_spread = max(pixel_rgb) - min(pixel_rgb)
                if (
                    color_distance(pixel_rgb, background_color) <= 26.0
                    or (pixel_brightness >= 244.0 and pixel_spread <= 18)
                ):
                    continue
                palette_index = nearest_color_index(pixel_rgb, palette_colors)
                if palette_index not in used_palette_set:
                    used_palette_set.add(palette_index)
                    used_palette_indices.append(palette_index)
                grid_values[offset_y + sample_y][offset_x + sample_x] = palette_index + 1

        remap = {
            palette_index + 1: new_index
            for new_index, palette_index in enumerate(used_palette_indices, start=1)
        }
        legend: dict[str, str] = {}
        value_to_symbol: dict[int, str] = {}
        for new_index, palette_index in enumerate(used_palette_indices):
            symbol = SYMBOLS[new_index]
            color_id = new_index + 1
            legend[symbol] = to_hex(palette_colors[palette_index])
            value_to_symbol[color_id] = symbol

        rows = [
            "".join("." if value == 0 else value_to_symbol[remap[value]] for value in row)
            for row in grid_values
        ]
        return PixelArt(name=source_path.stem, rows=rows, legend=legend), (detected.width, detected.height)
