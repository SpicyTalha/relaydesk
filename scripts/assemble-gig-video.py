"""
Builds the Fiverr gig video from Talha's recordings and the rendered stage.
    pnpm dev
    node scripts/render-video.mjs gallery/work/frames --url /gallery/gig-video
    python3 scripts/gig-video-audio.py gallery/work/music.wav
    python3 scripts/assemble-gig-video.py            # → gallery/out/relaydesk-gig-video.mp4

Inputs in gallery/talha/ (git-ignored):
    face.mp4|mov    camera clip; timing.json "faceIn" is where the spoken intro starts in it
    voice.*         voice-over; timing.json "voiceIn" trims the start, "voiceAt" is when it plays
    timing.json     scene lengths (see the gig-video stage) plus the offsets above
Without face or voice files it still builds a silent-intro preview, so the edit can be checked early.
"""
import json
import subprocess
from pathlib import Path

T = Path("gallery/talha")
W = Path("gallery/work")
OUT = Path("gallery/out/relaydesk-gig-video.mp4")
FPS = 30

timing = {"face": 10, "demo": 15, "ticket": 12, "packages": 6.5, "outro": 7, "faceIn": 0, "voiceIn": 0}
if (T / "timing.json").exists():
    timing.update(json.loads((T / "timing.json").read_text()))
face_len = timing["face"]
total = face_len + timing["demo"] + timing["ticket"] + timing["packages"] + timing["outro"]
voice_at = timing.get("voiceAt", face_len + 0.3)

find = lambda *names: next((T / n for n in names if (T / n).exists()), None)
face = find("face.mp4", "face.mov", "face.MOV", "face.MP4")
voice = find("voice.wav", "voice.m4a", "voice.mp3", "voice.aac", "voice.ogg")
frames = W / "frames"
music = W / "music.wav"
assert frames.exists() and music.exists(), "Render the frames and the music first (see the header)."

inputs, filters = [], []

# 0: the camera clip (or a dark placeholder), cropped to fill 1920×1080, with the name tag frames on top.
if face:
    inputs += ["-ss", str(timing["faceIn"]), "-t", str(face_len), "-i", str(face)]
else:
    inputs += ["-f", "lavfi", "-t", str(face_len), "-i", f"color=c=0x2b2f36:s=1920x1080:r={FPS}"]
inputs += ["-framerate", str(FPS), "-start_number", "0", "-i", str(frames / "%05d.png")]
filters.append(f"[0:v]scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,fps={FPS},setsar=1,format=yuv420p[cam]")
filters.append("[cam][1:v]overlay=0:0:eof_action=pass,trim=duration=" + str(face_len) + ",setpts=PTS-STARTPTS[intro]")

# 2: the rendered scenes after the intro.
inputs += ["-framerate", str(FPS), "-start_number", str(round(face_len * FPS)), "-i", str(frames / "%05d.jpg")]
filters.append(f"[2:v]fps={FPS},setsar=1,format=yuv420p[scenes]")
filters.append("[intro][scenes]concat=n=2:v=1:a=0[v]")

# Audio: the intro's own sound, the voice-over, and the music ducked under both.
inputs += ["-i", str(music)]
music_idx = 3
voices = []
if face:
    filters.append(f"[0:a]highpass=f=80,afftdn=nf=-25,acompressor=threshold=-20dB:ratio=3:attack=5:release=120,loudnorm=I=-16:TP=-2,aresample=44100,apad=whole_dur={total}[fa]")
    voices.append("[fa]")
if voice:
    inputs += ["-ss", str(timing["voiceIn"]), "-i", str(voice)]
    vi = music_idx + 1
    delay = int(voice_at * 1000)
    filters.append(
        f"[{vi}:a]highpass=f=80,afftdn=nf=-25,acompressor=threshold=-20dB:ratio=3:attack=5:release=120,loudnorm=I=-16:TP=-2,"
        f"aresample=44100,aformat=channel_layouts=stereo,adelay={delay}|{delay},apad=whole_dur={total}[vo]"
    )
    voices.append("[vo]")

if voices:
    filters.append(f"{''.join(voices)}amix=inputs={len(voices)}:normalize=0,aformat=channel_layouts=stereo,asplit=2[speech][key]")
    filters.append(f"[{music_idx}:a]volume=0.55[bed]")
    filters.append("[bed][key]sidechaincompress=threshold=0.03:ratio=8:attack=20:release=400[ducked]")
    filters.append("[speech][ducked]amix=inputs=2:normalize=0,loudnorm=I=-15:TP=-1.5,atrim=duration=" + str(total) + "[a]")
else:
    filters.append(f"[{music_idx}:a]loudnorm=I=-16:TP=-1.5,atrim=duration={total}[a]")

OUT.parent.mkdir(parents=True, exist_ok=True)
cmd = ["ffmpeg", "-loglevel", "error", "-y", *inputs, "-filter_complex", ";".join(filters), "-map", "[v]", "-map", "[a]",
       "-c:v", "libx264", "-preset", "slow", "-crf", "19", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
       "-c:a", "aac", "-b:a", "192k", "-t", str(total), str(OUT)]
subprocess.run(cmd, check=True)
size = OUT.stat().st_size / 1e6
print(f"{OUT}  {total:.1f}s  {size:.1f} MB" + ("" if face and voice else "  (preview: missing " + ", ".join(n for n, f in (("face", face), ("voice", voice)) if not f) + ")"))
assert total <= 75 and size < 50, "Fiverr allows 75 s and 50 MB at most."
