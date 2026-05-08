#!/usr/bin/env -S uv run
# /// script
# dependencies = ["psycopg2-binary"]
# ///
"""
Migrate image files from flat checksum-based paths to UUID-sharded paths.

Old layout: {image_dir}/{checksum}
New layout: {image_dir}/{id[0:2]}/{id[2:4]}/{id}

Usage:
    POSTGRES_DB="postgres://user@localhost/stash-box" ./migrate_images_from_checksum_to_id.py /path/to/images
"""

import os
import sys
import shutil
import argparse
import psycopg2


def sharded_path(image_dir, image_id):
    return os.path.join(image_dir, image_id[0:2], image_id[2:4], image_id)


def main():
    parser = argparse.ArgumentParser(description="Migrate images from checksum to sharded UUID paths")
    parser.add_argument("image_dir", help="Path to the image storage directory")
    args = parser.parse_args()

    image_dir = args.image_dir
    db_url = os.environ.get("POSTGRES_DB")
    if not db_url:
        print("Error: POSTGRES_DB environment variable is not set", file=sys.stderr)
        sys.exit(1)

    if not os.path.isdir(image_dir):
        print(f"Error: image directory does not exist: {image_dir}", file=sys.stderr)
        sys.exit(1)

    conn = psycopg2.connect(db_url)
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id, checksum FROM images")
            rows = cur.fetchall()
    finally:
        conn.close()

    moved = 0
    skipped = 0
    missing = 0

    for image_id, checksum in rows:
        image_id = str(image_id)
        src = os.path.join(image_dir, checksum)
        dst = sharded_path(image_dir, image_id)

        if not os.path.exists(src):
            missing += 1
            continue

        if os.path.exists(dst):
            skipped += 1
            continue

        os.makedirs(os.path.dirname(dst), exist_ok=True)
        shutil.move(src, dst)
        moved += 1

    print(f"Done: {moved} moved, {skipped} already at destination, {missing} source files not found")


if __name__ == "__main__":
    main()
