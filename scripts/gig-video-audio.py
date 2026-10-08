"""
Music bed for the Fiverr gig video: the launch video's C-major groove, quieter and sparser so a voice
sits on top, with effects placed on the scene changes. Scene lengths come from gallery/talha/timing.json.
    python3 scripts/gig-video-audio.py gallery/work/music.wav
"""
import json
import sys
import wave
from pathlib import Path

import numpy as np

SR = 44100
BPM = 116
BEAT = 60 / BPM
BAR = 4 * BEAT
rng = np.random.default_rng(11)

timing = {"face": 10, "demo": 15, "ticket": 12, "packages": 6.5, "outro": 7}
tf = Path("gallery/talha/timing.json")
if tf.exists():
    timing.update(json.loads(tf.read_text()))
AT_DEMO = timing["face"]
AT_TICKET = AT_DEMO + timing["demo"]
AT_PACKAGES = AT_TICKET + timing["ticket"]
AT_OUTRO = AT_PACKAGES + timing["packages"]
DUR = AT_OUTRO + timing["outro"]
N = int(SR * DUR)
left = np.zeros(N)
right = np.zeros(N)


def hz(note):
    return 440.0 * 2 ** ((note - 69) / 12)


def place(sig, t, gain=1.0, pan=0.0):
    i = int(t * SR)
    if i >= N or i < 0:
        return
    sig = sig[: N - i] * gain
    lg, rg = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    left[i : i + len(sig)] += sig * lg
    right[i : i + len(sig)] += sig * rg


def env(n, attack, release):
    e = np.ones(n)
    a, r = int(attack * SR), int(release * SR)
    if a:
        e[:a] = np.linspace(0, 1, a)
    if r:
        e[-r:] *= np.linspace(1, 0, r)
    return e


def lowpass(x, cutoff):
    taps = 101
    k = np.arange(taps) - (taps - 1) / 2
    h = np.sinc(2 * cutoff / SR * k) * np.blackman(taps)
    return np.convolve(x, h / h.sum(), mode="same")


def keys(notes, dur):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    out = np.zeros(n)
    for m in notes:
        f = hz(m)
        out += np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(4 * np.pi * f * tt) * np.exp(-tt * 3)
    return out / len(notes) * env(n, 0.02, 0.25) * np.exp(-tt * 0.6)


def pluck(m, dur=0.5, bright=0.55):
    f = hz(m)
    period = int(SR / f)
    n = int(dur * SR)
    buf = rng.uniform(-1, 1, period)
    out = np.zeros(n)
    damp = 0.996 - (1 - bright) * 0.01
    idx = 0
    for i in range(n):
        out[i] = buf[idx]
        nxt = (idx + 1) % period
        buf[idx] = damp * 0.5 * (buf[idx] + buf[nxt])
        idx = nxt
    return out * env(n, 0.002, 0.08)


def kick():
    n = int(0.3 * SR)
    tt = np.arange(n) / SR
    f = 50 + 60 * np.exp(-tt * 28)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 15)


def shaker():
    n = int(0.08 * SR)
    tt = np.arange(n) / SR
    s = rng.normal(0, 1, n)
    return (s - lowpass(s, 6000)) * np.exp(-tt * 60)


def whoosh(dur=0.45):
    n = int(dur * SR)
    return lowpass(rng.normal(0, 1, n), 2500) * np.sin(np.linspace(0, np.pi, n)) ** 2 * np.linspace(0.4, 1, n)


def tick():
    n = int(0.05 * SR)
    tt = np.arange(n) / SR
    return (rng.normal(0, 1, n) - lowpass(rng.normal(0, 1, n), 3000)) * np.exp(-tt * 200)


def slap():
    n = int(0.12 * SR)
    tt = np.arange(n) / SR
    return lowpass(rng.normal(0, 1, n), 1800) * np.exp(-tt * 30)


def thump(dur=0.9):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    body = np.sin(2 * np.pi * hz(36) * tt + 3 * np.exp(-tt * 30)) * np.exp(-tt * 6)
    return body * 0.9 + lowpass(rng.normal(0, 1, n), 2200) * np.exp(-tt * 40) * 0.5


# ---------------------------------------------------------------- music bed
CHORDS = [[60, 64, 67, 71], [57, 60, 64, 67], [53, 57, 60, 65], [55, 59, 62, 67]]
ROOTS = [36, 33, 29, 31]
ARP = [[72, 76, 79, 76], [69, 72, 76, 72], [65, 69, 72, 69], [67, 71, 74, 71]]

for b in range(int(np.ceil(DUR / BAR))):
    t0 = b * BAR
    ci = b % 4
    place(keys(CHORDS[ci], BAR + 0.3), t0, 0.22, -0.15)
    for beat in range(4):
        tb = t0 + beat * BEAT
        if tb >= DUR - 0.8:
            continue
        # Under the face clip: keys only. The groove comes in with the product.
        if tb >= AT_DEMO and beat in (0, 2):
            n = int(BEAT * 1.6 * SR)
            tt = np.arange(n) / SR
            place(np.tanh(1.5 * np.sin(2 * np.pi * hz(ROOTS[ci] + 12) * tt)) * np.exp(-tt * 2.2), tb, 0.13)
            place(kick(), tb, 0.14)
        for half in (0, 0.5):
            th = tb + half * BEAT
            if th >= AT_DEMO:
                place(shaker(), th, 0.018, 0.45)
                place(pluck(ARP[ci][(beat * 2 + int(half * 2)) % 4]), th, 0.07, -0.35 if half else 0.35)

# ---------------------------------------------------------------- effects on the scene changes
desk = lambda d: AT_DEMO + (d - 3.2) * timing["demo"] / 15.05  # the demo scenes were drawn on a 3.2 → 18.25 clock
place(whoosh(0.5), AT_DEMO - 0.25, 0.05)
place(keys([60, 64, 67, 72], 1.2), desk(3.35), 0.12)
place(tick(), desk(7.6), 0.09, 0.4)
place(pluck(79, 0.6, 0.8), desk(7.7), 0.08, 0.3)
place(whoosh(0.4), desk(10.3), 0.04, -0.2)
place(pluck(84, 0.8, 0.9), desk(12.92), 0.08, 0.3)
place(thump(1.0), desk(15.85), 0.32)

place(whoosh(0.45), AT_TICKET - 0.2, 0.05)
ticket_len = timing["ticket"]
for i in range(4):
    place(tick(), AT_TICKET + 1.6 + i * (ticket_len - 3.6) / 3, 0.08, 0.3)
place(thump(0.9), AT_TICKET + ticket_len - 1.25, 0.28)

place(whoosh(0.45), AT_PACKAGES - 0.2, 0.05, 0.3)
for i in range(3):
    place(slap(), AT_PACKAGES + 1.1 + i * 0.35, 0.07, -0.3 + i * 0.3)

place(whoosh(0.6), AT_OUTRO - 0.2, 0.05)
place(thump(1.2), AT_OUTRO + 2.35, 0.3)
place(keys([48, 60, 64, 67, 74], 1.6), AT_OUTRO + 2.35, 0.16)

# ---------------------------------------------------------------- master
mix = np.stack([left, right], axis=1)
fi, fo = int(0.3 * SR), int(1.2 * SR)
mix[:fi] *= np.linspace(0, 1, fi)[:, None]
mix[-fo:] *= np.linspace(1, 0, fo)[:, None]
mix = np.tanh(mix * 1.3) / np.tanh(1.3)
mix *= 0.89 / np.max(np.abs(mix))

out = sys.argv[1] if len(sys.argv) > 1 else "music.wav"
with wave.open(out, "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix * 32767).astype("<i2").tobytes())
print(out, f"{DUR:.1f}s")
