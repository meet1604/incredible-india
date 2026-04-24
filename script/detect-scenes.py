#!/usr/bin/env python3
"""
Detect scene changes in a video using inter-frame pixel difference.
Outputs JSON array of scene objects with start/end times and thumbnail paths.
Usage: python3 detect-scenes.py <video_path> <thumb_output_dir> [threshold]
"""
import sys, os, json, av
from PIL import Image, ImageChops, ImageStat

def frame_diff(img1, img2):
    diff = ImageChops.difference(img1.convert("L"), img2.convert("L"))
    return ImageStat.Stat(diff).mean[0]

def detect(video_path, output_dir, threshold=22.0, sample_interval=0.75):
    os.makedirs(output_dir, exist_ok=True)

    container = av.open(video_path)
    stream = container.streams.video[0]
    duration = float(stream.duration * stream.time_base)

    # Extract one frame every sample_interval seconds
    frames = {}
    timestamps = []
    t = 0.0
    while t < duration:
        try:
            container.seek(int(t / stream.time_base), stream=stream)
            for frame in container.decode(stream):
                img = frame.to_image().resize((320, 180))
                frames[round(t, 2)] = img
                timestamps.append(round(t, 2))
                break
        except Exception:
            pass
        t += sample_interval
    container.close()

    if len(timestamps) < 2:
        return []

    # Find scene cut points
    cuts = [timestamps[0]]
    for i in range(1, len(timestamps)):
        prev_t, cur_t = timestamps[i - 1], timestamps[i]
        if prev_t in frames and cur_t in frames:
            diff = frame_diff(frames[prev_t], frames[cur_t])
            if diff > threshold:
                cuts.append(cur_t)
    cuts.append(duration)

    # Build scene list — skip very short ones (likely crossfades)
    scenes = []
    for i in range(len(cuts) - 1):
        start = round(cuts[i], 1)
        end = round(min(cuts[i + 1], duration), 1)
        if end - start < 2.5:
            continue

        # Pick frame at 30% into the scene for the thumbnail
        thumb_t = round(start + (end - start) * 0.3, 2)
        closest = min(timestamps, key=lambda x: abs(x - thumb_t))
        thumb_img = frames.get(closest)

        thumb_name = f"scene_{i:02d}_{int(start)}s.jpg"
        if thumb_img:
            thumb_img.save(os.path.join(output_dir, thumb_name), quality=80)

        scenes.append({
            "timeStart": start,
            "timeEnd": end,
            "thumbnail": f"/thumbnails/{thumb_name}",
            "x": "50%",
            "y": "50%",
            "label": "",
            "title": "",
            "location": "",
            "description": "",
        })

    return scenes

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: detect-scenes.py <video_path> <thumb_dir> [threshold]", file=sys.stderr)
        sys.exit(1)
    video_path = sys.argv[1]
    thumb_dir  = sys.argv[2]
    threshold  = float(sys.argv[3]) if len(sys.argv) > 3 else 22.0
    result = detect(video_path, thumb_dir, threshold)
    print(json.dumps(result))
