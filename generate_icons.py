#!/usr/bin/env python3
"""
Advanced Icon Generator for PWA
Generates high-quality PNG icons with gradient backgrounds and text.
Fully cross-platform, no external dependencies.
"""

import argparse
import sys
import zlib
import struct
import math
import os
import shutil
from pathlib import Path
from concurrent.futures import ProcessPoolExecutor, as_completed
from dataclasses import dataclass
from typing import List, Tuple, Dict, Optional
import time

# PNG chunk helper function - defined once at module level
def _create_chunk(tag: bytes, data: bytes) -> bytes:
    """Create a PNG chunk."""
    chunk_data = tag + data
    return struct.pack('>I', len(data)) + chunk_data + struct.pack('>I', zlib.crc32(chunk_data) & 0xffffffff)


@dataclass
class IconConfig:
    """Configuration for icon generation."""
    size: int
    output_path: Path
    text: str = "SR"
    background_start: Tuple[int, int, int] = (102, 126, 234)
    background_end: Tuple[int, int, int] = (34, 211, 238)
    text_color: Tuple[int, int, int] = (255, 255, 255)
    gradient_direction: str = "diagonal"
    compression_level: int = 6


class IconGenerator:
    """Generate PNG icons programmatically without external libraries."""
    
    # Complete character bitmap definitions for all uppercase A-Z
    CHAR_BITMAPS: Dict[str, List[List[int]]] = {
        'A': [
            [0,1,1,1,0],
            [1,0,0,0,1],
            [1,0,0,0,1],
            [1,1,1,1,1],
            [1,0,0,0,1],
            [1,0,0,0,1],
            [1,0,0,0,1]
        ],
        'B': [
            [1,1,1,1,0],
            [1,0,0,0,1],
            [1,0,0,0,1],
            [1,1,1,1,0],
            [1,0,0,0,1],
            [1,0,0,0,1],
            [1,1,1,1,0]
        ],
        'C': [
            [0,1,1,1,1],
            [1,0,0,0,0],
            [1,0,0,0,0],
            [1,0,0,0,0],
            [1,0,0,0,0],
            [1,0,0,0,0],
            [0,1,1,1,1]
        ],
        'D': [
            [1,1,1,1,0],
            [1,0,0,0,1],
            [1,0,0,0,1],
            [1,0,0,0,1],
            [1,0,0,0,1],
            [1,0,0,0,1],
            [1,1,1,1,0]
        ],
        'E': [
            [1,1,1,1,1],
            [1,0,0,0,0],
            [1,0,0,0,0],
            [1,1,1,1,0],
            [1,0,0,0,0],
            [1,0,0,0,0],
            [1,1,1,1,1]
        ],
        'F': [
            [1,1,1,1,1],
            [1,0,0,0,0],
            [1,0,0,0,0],
            [1,1,1,1,0],
            [1,0,0,0,0],
            [1,0,0,0,0],
            [1,0,0,0,0]
        ],
        'G': [
            [0,1,1,1,1],
            [1,0,0,0,0],
            [1,0,0,0,0],
            [1,0,1,1,1],
            [1,0,0,0,1],
            [1,0,0,0,1],
            [0,1,1,1,0]
        ],
        'H': [
            [1,0,0,0,1],
            [1,0,0,0,1],
            [1,0,0,0,1],
            [1,1,1,1,1],
            [1,0,0,0,1],
            [1,0,0,0,1],
            [1,0,0,0,1]
        ],
        'I': [
            [1,1,1,1,1],
            [0,0,1,0,0],
            [0,0,1,0,0],
            [0,0,1,0,0],
            [0,0,1,0,0],
            [0,0,1,0,0],
            [1,1,1,1,1]
        ],
        'J': [
            [1,1,1,1,1],
            [0,0,0,1,0],
            [0,0,0,1,0],
            [0,0,0,1,0],
            [1,0,0,1,0],
            [1,0,0,1,0],
            [0,1,1,0,0]
        ],
        'K': [
            [1,0,0,0,1],
            [1,0,0,1,0],
            [1,0,1,0,0],
            [1,1,0,0,0],
            [1,0,1,0,0],
            [1,0,0,1,0],
            [1,0,0,0,1]
        ],
        'L': [
            [1,0,0,0,0],
            [1,0,0,0,0],
            [1,0,0,0,0],
            [1,0,0,0,0],
            [1,0,0,0,0],
            [1,0,0,0,0],
            [1,1,1,1,1]
        ],
        'M': [
            [1,0,0,0,1],
            [1,1,0,1,1],
            [1,0,1,0,1],
            [1,0,0,0,1],
            [1,0,0,0,1],
            [1,0,0,0,1],
            [1,0,0,0,1]
        ],
        'N': [
            [1,0,0,0,1],
            [1,1,0,0,1],
            [1,0,1,0,1],
            [1,0,0,1,1],
            [1,0,0,0,1],
            [1,0,0,0,1],
            [1,0,0,0,1]
        ],
        'O': [
            [0,1,1,1,0],
            [1,0,0,0,1],
            [1,0,0,0,1],
            [1,0,0,0,1],
            [1,0,0,0,1],
            [1,0,0,0,1],
            [0,1,1,1,0]
        ],
        'P': [
            [1,1,1,1,0],
            [1,0,0,0,1],
            [1,0,0,0,1],
            [1,1,1,1,0],
            [1,0,0,0,0],
            [1,0,0,0,0],
            [1,0,0,0,0]
        ],
        'Q': [
            [0,1,1,1,0],
            [1,0,0,0,1],
            [1,0,0,0,1],
            [1,0,0,0,1],
            [1,0,1,0,1],
            [1,0,0,1,1],
            [0,1,1,1,1]
        ],
        'R': [
            [1,1,1,1,0],
            [1,0,0,0,1],
            [1,0,0,0,1],
            [1,1,1,1,0],
            [1,0,1,0,0],
            [1,0,0,1,0],
            [1,0,0,0,1]
        ],
        'S': [
            [0,1,1,1,0],
            [1,0,0,0,1],
            [1,0,0,0,0],
            [0,1,1,1,0],
            [0,0,0,0,1],
            [1,0,0,0,1],
            [0,1,1,1,0]
        ],
        'T': [
            [1,1,1,1,1],
            [0,0,1,0,0],
            [0,0,1,0,0],
            [0,0,1,0,0],
            [0,0,1,0,0],
            [0,0,1,0,0],
            [0,0,1,0,0]
        ],
        'U': [
            [1,0,0,0,1],
            [1,0,0,0,1],
            [1,0,0,0,1],
            [1,0,0,0,1],
            [1,0,0,0,1],
            [1,0,0,0,1],
            [0,1,1,1,0]
        ],
        'V': [
            [1,0,0,0,1],
            [1,0,0,0,1],
            [1,0,0,0,1],
            [0,1,0,1,0],
            [0,1,0,1,0],
            [0,0,1,0,0],
            [0,0,1,0,0]
        ],
        'W': [
            [1,0,0,0,1],
            [1,0,0,0,1],
            [1,0,0,0,1],
            [1,0,1,0,1],
            [1,0,1,0,1],
            [1,1,0,1,1],
            [1,0,0,0,1]
        ],
        'X': [
            [1,0,0,0,1],
            [0,1,0,1,0],
            [0,0,1,0,0],
            [0,0,1,0,0],
            [0,0,1,0,0],
            [0,1,0,1,0],
            [1,0,0,0,1]
        ],
        'Y': [
            [1,0,0,0,1],
            [0,1,0,1,0],
            [0,0,1,0,0],
            [0,0,1,0,0],
            [0,0,1,0,0],
            [0,0,1,0,0],
            [0,0,1,0,0]
        ],
        'Z': [
            [1,1,1,1,1],
            [0,0,0,0,1],
            [0,0,0,1,0],
            [0,0,1,0,0],
            [0,1,0,0,0],
            [1,0,0,0,0],
            [1,1,1,1,1]
        ]
    }
    
    VALID_GRADIENT_DIRECTIONS = ["horizontal", "vertical", "diagonal", "radial"]
    
    def __init__(self, config: IconConfig):
        self.config = config
        self._validate_config()
    
    def _validate_config(self) -> None:
        """Validate configuration parameters."""
        if self.config.size < 16:
            raise ValueError(f"Icon size must be at least 16px, got {self.config.size}")
        if self.config.size > 2048:
            raise ValueError(f"Icon size too large: {self.config.size}. Max 2048px.")
        if not self.config.text:
            raise ValueError("Text cannot be empty")
        if len(self.config.text) > 4:
            raise ValueError(f"Text too long: {self.config.text}. Max 4 characters.")
        if self.config.gradient_direction not in self.VALID_GRADIENT_DIRECTIONS:
            raise ValueError(f"Invalid gradient direction: {self.config.gradient_direction}. "
                           f"Must be one of: {self.VALID_GRADIENT_DIRECTIONS}")
        if self.config.compression_level < 1 or self.config.compression_level > 9:
            raise ValueError(f"Compression level must be 1-9, got {self.config.compression_level}")
    
    def _get_gradient_color(self, x: int, y: int, w: int, h: int) -> Tuple[int, int, int]:
        """Calculate gradient color at position (x, y)."""
        if w <= 1 or h <= 1:
            return self.config.background_start
        
        direction = self.config.gradient_direction
        
        if direction == "horizontal":
            t = x / (w - 1)
        elif direction == "vertical":
            t = y / (h - 1)
        elif direction == "diagonal":
            t = (x + y) / (w + h - 2)
        elif direction == "radial":
            cx, cy = w / 2, h / 2
            max_dist = math.sqrt(cx * cx + cy * cy)
            dist = math.sqrt((x - cx) ** 2 + (y - cy) ** 2)
            t = min(1.0, dist / max_dist)
        else:
            t = 0
        
        r = int(self.config.background_start[0] + (self.config.background_end[0] - self.config.background_start[0]) * t)
        g = int(self.config.background_start[1] + (self.config.background_end[1] - self.config.background_start[1]) * t)
        b = int(self.config.background_start[2] + (self.config.background_end[2] - self.config.background_start[2]) * t)
        
        return (max(0, min(255, r)), max(0, min(255, g)), max(0, min(255, b)))
    
    def _get_char_bitmap(self, ch: str) -> Optional[List[List[int]]]:
        """Get bitmap for character, return None if not supported."""
        upper_ch = ch.upper()
        return self.CHAR_BITMAPS.get(upper_ch)
    
    def _draw_text(self, pixels: List[List[Tuple[int, int, int]]]) -> List[List[Tuple[int, int, int]]]:
        """Draw text on the pixel grid with proper centering."""
        size = self.config.size
        text = self.config.text.upper()
        
        char_width = 5
        char_height = 7
        
        min_scale_for_readability = max(1, size // 32)
        max_scale_for_fit = max(1, size // (char_width * len(text) + 4))
        scale = max(1, min(min_scale_for_readability, max_scale_for_fit))
        spacing = max(1, scale // 2)
        
        valid_chars = []
        skipped_chars = []
        for ch in text:
            if self._get_char_bitmap(ch):
                valid_chars.append(ch)
            else:
                skipped_chars.append(ch)
        
        if skipped_chars and not valid_chars:
            raise ValueError(f"No supported characters in text: {skipped_chars}")
        
        if not valid_chars:
            return pixels
        
        total_width = sum((char_width + spacing) * scale for _ in valid_chars) - spacing * scale
        
        start_x = (size - total_width) // 2
        start_y = (size - char_height * scale) // 2
        
        # Ensure start positions are not negative
        if start_x < 0:
            start_x = 0
        if start_y < 0:
            start_y = 0
        
        x_offset = start_x
        
        for ch in valid_chars:
            bitmap = self._get_char_bitmap(ch)
            if bitmap is None:
                continue
            
            for dy in range(char_height):
                for dx in range(char_width):
                    if dy < len(bitmap) and dx < len(bitmap[dy]) and bitmap[dy][dx]:
                        for py in range(scale):
                            for px in range(scale):
                                px_abs = x_offset + dx * scale + px
                                py_abs = start_y + dy * scale + py
                                if 0 <= px_abs < size and 0 <= py_abs < size:
                                    pixels[py_abs][px_abs] = self.config.text_color
            
            x_offset += (char_width + spacing) * scale
        
        return pixels
    
    def generate(self) -> bytes:
        """Generate PNG bytes."""
        size = self.config.size
        pixels: List[List[Tuple[int, int, int]]] = []
        
        for y in range(size):
            row = []
            for x in range(size):
                color = self._get_gradient_color(x, y, size, size)
                row.append(color)
            pixels.append(row)
        
        pixels = self._draw_text(pixels)
        
        return self._encode_png(pixels, size)
    
    def _encode_png(self, pixels: List[List[Tuple[int, int, int]]], size: int) -> bytes:
        """Encode pixel data as PNG."""
        raw_data = b''
        for row in pixels:
            raw_data += b'\x00'
            for r, g, b in row:
                raw_data += bytes([r, g, b])
        
        compressed = zlib.compress(raw_data, self.config.compression_level)
        
        ihdr = struct.pack('>IIBBBBB', size, size, 8, 2, 0, 0, 0)
        png = b'\x89PNG\r\n\x1a\n'
        png += _create_chunk(b'IHDR', ihdr)
        png += _create_chunk(b'IDAT', compressed)
        png += _create_chunk(b'IEND', b'')
        
        return png
    
    def save(self) -> int:
        """Save icon to file. Returns file size in bytes."""
        output_path = self.config.output_path
        
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        png_data = self.generate()
        
        with open(output_path, 'wb') as f:
            f.write(png_data)
        
        return len(png_data)


def generate_single_icon(size: int, output_dir: Path, text: str, gradient: str, 
                         compression: int, background_start: Tuple[int, int, int],
                         background_end: Tuple[int, int, int],
                         text_color: Tuple[int, int, int],
                         verbose: bool = False) -> Tuple[int, int, bool, str]:
    """Generate a single icon and return (size, file_size, success, error_message)."""
    try:
        output_path = output_dir / f'icon-{size}.png'
        
        config = IconConfig(
            size=size,
            output_path=output_path,
            text=text,
            background_start=background_start,
            background_end=background_end,
            text_color=text_color,
            gradient_direction=gradient,
            compression_level=compression
        )
        
        generator = IconGenerator(config)
        file_size = generator.save()
        
        if verbose:
            print(f"  Generated {size}x{size}: {file_size} bytes")
        
        return (size, file_size, True, "")
    except Exception as e:
        return (size, 0, False, str(e))


def show_progress(current: int, total: int, start_time: float):
    """Show progress bar."""
    elapsed = time.time() - start_time
    percent = current / total
    bar_length = 30
    filled = int(bar_length * percent)
    bar = "#" * filled + "-" * (bar_length - filled)
    
    sys.stderr.write(f"\rProgress: [{bar}] {current}/{total} ({percent*100:.1f}%) - {elapsed:.1f}s")
    sys.stderr.flush()


def setup_windows_multiprocessing():
    """Setup for Windows multiprocessing support."""
    if sys.platform == 'win32':
        try:
            from multiprocessing import set_start_method
            set_start_method('spawn', force=True)
        except RuntimeError:
            pass


def cleanup_backups(backup_dir: Path, keep_count: int = 5):
    """Clean up old backup files, keeping only the most recent ones."""
    if not backup_dir.exists():
        return
    
    backup_files = sorted(backup_dir.glob('*.backup.png'), key=lambda f: f.stat().st_mtime, reverse=True)
    for old_file in backup_files[keep_count:]:
        old_file.unlink()


def main():
    parser = argparse.ArgumentParser(
        description="Generate PWA icons for the portfolio application",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python generate_icons.py
  python generate_icons.py --sizes 64 128 256 512
  python generate_icons.py --output ./public/icons
  python generate_icons.py --text SB
  python generate_icons.py --gradient radial
  python generate_icons.py --compression 9
  python generate_icons.py --verbose
  python generate_icons.py --workers 2
        """
    )
    
    parser.add_argument(
        '--sizes', '-s',
        type=int,
        nargs='+',
        default=[192, 512],
        help='Icon sizes to generate (default: 192 512)'
    )
    
    parser.add_argument(
        '--output', '-o',
        type=Path,
        default=Path('icons'),
        help='Output directory (default: ./icons)'
    )
    
    parser.add_argument(
        '--text', '-t',
        type=str,
        default='SR',
        help='Text to display on icon (default: SR, max 4 chars)'
    )
    
    parser.add_argument(
        '--gradient', '-g',
        type=str,
        default='diagonal',
        choices=['horizontal', 'vertical', 'diagonal', 'radial'],
        help='Gradient direction (default: diagonal)'
    )
    
    parser.add_argument(
        '--compression', '-c',
        type=int,
        default=6,
        choices=range(1, 10),
        metavar='1-9',
        help='PNG compression level 1-9 (default: 6, 1=fastest/largest, 9=slowest/smallest)'
    )
    
    parser.add_argument(
        '--verbose', '-v',
        action='store_true',
        help='Show detailed output'
    )
    
    parser.add_argument(
        '--workers', '-w',
        type=int,
        default=2,
        help='Number of parallel processes (default: 2)'
    )
    
    parser.add_argument(
        '--force', '-f',
        action='store_true',
        help='Overwrite existing files without asking'
    )
    
    parser.add_argument(
        '--backup', '-b',
        action='store_true',
        help='Create backup of existing files before overwriting'
    )
    
    parser.add_argument(
        '--bg-start',
        type=str,
        default='102,126,234',
        help='Background start color RGB (default: 102,126,234)'
    )
    
    parser.add_argument(
        '--bg-end',
        type=str,
        default='34,211,238',
        help='Background end color RGB (default: 34,211,238)'
    )
    
    parser.add_argument(
        '--text-color',
        type=str,
        default='255,255,255',
        help='Text color RGB (default: 255,255,255)'
    )
    
    args = parser.parse_args()
    
    setup_windows_multiprocessing()
    
    text_upper = args.text[:4].upper()
    
    # Parse color values
    try:
        bg_start = tuple(map(int, args.bg_start.split(',')))
        bg_end = tuple(map(int, args.bg_end.split(',')))
        txt_color = tuple(map(int, args.text_color.split(',')))
        if len(bg_start) != 3 or len(bg_end) != 3 or len(txt_color) != 3:
            raise ValueError()
    except ValueError:
        print("Error: Colors must be in format R,G,B (e.g., 102,126,234)")
        sys.exit(1)
    
    valid_sizes = [s for s in args.sizes if 16 <= s <= 2048]
    invalid_sizes = [s for s in args.sizes if s < 16 or s > 2048]
    
    if invalid_sizes:
        print(f"Warning: Skipping invalid sizes: {invalid_sizes} (must be 16-2048)")
    
    if not valid_sizes:
        print("Error: No valid sizes provided")
        sys.exit(1)
    
    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    existing_files = []
    for size in valid_sizes:
        output_path = output_dir / f'icon-{size}.png'
        if output_path.exists():
            existing_files.append(size)
    
    if existing_files and not args.force:
        print(f"Warning: Files for sizes {existing_files} already exist.")
        response = input("Overwrite? (y/N/b for backup): ")
        if response.lower() == 'b':
            backup_dir = output_dir / 'backup'
            backup_dir.mkdir(exist_ok=True)
            for size in existing_files:
                src = output_dir / f'icon-{size}.png'
                dst = backup_dir / f'icon-{size}.{int(time.time())}.backup.png'
                shutil.copy2(src, dst)
            cleanup_backups(backup_dir)
            print(f"Backup created in {backup_dir}")
        elif response.lower() != 'y':
            print("Aborted.")
            sys.exit(0)
    
    print(f"Icon Generator v3.1")
    print(f"=" * 50)
    print(f"Output directory: {output_dir.absolute()}")
    print(f"Sizes: {valid_sizes}")
    print(f"Text: {text_upper}")
    print(f"Gradient: {args.gradient}")
    print(f"Background: {bg_start} -> {bg_end}")
    print(f"Text color: {txt_color}")
    print(f"Compression level: {args.compression} (1=fastest/largest, 9=slowest/smallest)")
    print(f"Parallel processes: {args.workers}")
    print(f"=" * 50)
    
    start_time = time.time()
    results = []
    completed = 0
    
    # Determine if we should use multiprocessing
    use_multiprocessing = len(valid_sizes) > 1 and args.workers > 1
    
    try:
        if use_multiprocessing:
            with ProcessPoolExecutor(max_workers=args.workers) as executor:
                futures = {
                    executor.submit(generate_single_icon, size, output_dir, text_upper, 
                                  args.gradient, args.compression, bg_start, bg_end, txt_color,
                                  args.verbose): size
                    for size in valid_sizes
                }
                
                for future in as_completed(futures):
                    size, file_size, success, error = future.result()
                    results.append((size, file_size, success, error))
                    completed += 1
                    if not args.verbose:
                        show_progress(completed, len(valid_sizes), start_time)
        else:
            for size in valid_sizes:
                size, file_size, success, error = generate_single_icon(
                    size, output_dir, text_upper, args.gradient, args.compression,
                    bg_start, bg_end, txt_color, args.verbose
                )
                results.append((size, file_size, success, error))
                completed += 1
                if not args.verbose:
                    show_progress(completed, len(valid_sizes), start_time)
    except Exception as e:
        print(f"\nError: {e}")
        sys.exit(1)
    
    if not args.verbose:
        print()
    
    print(f"\nSummary:")
    print(f"-" * 50)
    
    successful = [r for r in results if r[2]]
    failed = [r for r in results if not r[2]]
    
    for size, file_size, success, error in results:
        if success:
            print(f"  OK   {size}x{size}: {file_size} bytes")
        else:
            print(f"  FAIL {size}x{size}: {error}")
    
    print(f"-" * 50)
    print(f"Successful: {len(successful)}/{len(valid_sizes)}")
    elapsed = time.time() - start_time
    print(f"Time taken: {elapsed:.2f} seconds")
    
    if failed:
        print(f"Failed: {len(failed)}")
        sys.exit(1)
    else:
        print(f"\nAll icons generated successfully.")
        print(f"Location: {output_dir.absolute()}")
        
        print(f"\nAdd this to your manifest.json:")
        print('"icons": [')
        for idx, size in enumerate(valid_sizes):
            comma = "," if idx < len(valid_sizes) - 1 else ""
            print(f'  {{ "src": "icons/icon-{size}.png", "sizes": "{size}x{size}", "type": "image/png" }}{comma}')
        print(']')


if __name__ == '__main__':
    main()