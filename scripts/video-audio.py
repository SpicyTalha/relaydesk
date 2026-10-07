"""
Soundtrack for the Relaydesk launch video: music and effects written as one piece.
116 BPM in C major. Effects are pitched to the key and sit under the music.
    python3 scripts/video-audio.py brag-output/work/audio.wav
"""
import sys
import wave

import numpy as np

SR = 44100
DUR = 22.0
BPM = 116
BEAT = 60 / BPM
BAR = 4 * BEAT
N = int(SR * DUR)
rng = np.random.default_rng(7)

left = np.zeros(N)
right = np.zeros(N)


def hz(note):
    """MIDI note number to Hz."""
    return 440.0 * 2 ** ((note - 69) / 12)


def place(sig, t, gain=1.0, pan=0.0):
    """Mix a mono signal in at time t (seconds), panned -1..1."""
    i = int(t * SR)
    if i >= N:
        return
    sig = sig[: N - i] * gain
    lg, rg = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    left[i : i + len(sig)] += sig * lg
    right[i : i + len(sig)] += sig * rg


def env(n, attack, release, sustain_level=1.0):
    a = int(attack * SR)
    r = int(release * SR)
    e = np.ones(n) * sustain_level
    if a:
        e[:a] = np.linspace(0, sustain_level, a)
    if r:
        e[-r:] *= np.linspace(1, 0, r)
    return e


def lowpass(x, cutoff):
    """Windowed-sinc low-pass (enough for shaping noise and softening tones)."""
    taps = 101
    fc = cutoff / SR
    k = np.arange(taps) - (taps - 1) / 2
    h = np.sinc(2 * fc * k) * np.blackman(taps)
    return np.convolve(x, h / h.sum(), mode="same")


def keys(notes, dur):
    """Warm electric-piano-ish chord: a few soft harmonics, gentle attack and decay."""
    n = int(dur * SR)
    tt = np.arange(n) / SR
    out = np.zeros(n)
    for m in notes:
        f = hz(m)
        tone = np.sin(2 * np.pi * f * tt) + 0.35 * np.sin(2 * np.pi * 2 * f * tt) * np.exp(-tt * 3) + 0.1 * np.sin(2 * np.pi * 3 * f * tt) * np.exp(-tt * 5)
        out += tone
    return out / len(notes) * env(n, 0.02, 0.25) * np.exp(-tt * 0.6)


def pluck(m, dur=0.6, bright=0.5):
    """Karplus-Strong plucked string."""
    f = hz(m)
    period = int(SR / f)
    n = int(dur * SR)
    buf = rng.uniform(-1, 1, period)
    buf = lowpass(buf, SR * 0.1 + bright * SR * 0.3) if period > 101 else buf
    out = np.zeros(n)
    idx = 0
    damp = 0.996 - (1 - bright) * 0.01
    for i in range(n):
        out[i] = buf[idx]
        nxt = (idx + 1) % period
        buf[idx] = damp * 0.5 * (buf[idx] + buf[nxt])
        idx = nxt
    return out * env(n, 0.002, 0.08)


def bell(m, dur=0.9):
    """Soft notification ping: sine with a quiet inharmonic partial."""
    n = int(dur * SR)
    tt = np.arange(n) / SR
    f = hz(m)
    s = np.sin(2 * np.pi * f * tt) + 0.25 * np.sin(2 * np.pi * f * 2.76 * tt) * np.exp(-tt * 8)
    return s * np.exp(-tt * 5.5) * env(n, 0.003, 0.05)


def kick(dur=0.35):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    f = 50 + 70 * np.exp(-tt * 28)
    phase = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(phase) * np.exp(-tt * 14)


def shaker(dur=0.09):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    s = rng.normal(0, 1, n)
    s = s - lowpass(s, 6000)  # keep the top end only
    return s * np.exp(-tt * 55)


def clap(dur=0.25):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    s = lowpass(rng.normal(0, 1, n), 3500) - lowpass(rng.normal(0, 1, n), 900) * 0.3
    return s * np.exp(-tt * 18)


def whoosh(dur=0.5, rise=True):
    n = int(dur * SR)
    s = rng.normal(0, 1, n)
    s = lowpass(s, 2500)
    shape = np.sin(np.linspace(0, np.pi, n)) ** 2
    if rise:
        shape *= np.linspace(0.4, 1, n)
    return s * shape


def scribble(dur=0.6):
    """Felt pen on paper: band-limited noise with a wobbling stroke."""
    n = int(dur * SR)
    tt = np.arange(n) / SR
    s = lowpass(rng.normal(0, 1, n), 5000) - lowpass(rng.normal(0, 1, n), 1500)
    stroke = 0.6 + 0.4 * np.sin(2 * np.pi * 7 * tt) ** 2
    return s * stroke * env(n, 0.05, 0.12)


def thump(m=36, dur=0.9):
    """The stamp: a low C body plus a short paper slap."""
    n = int(dur * SR)
    tt = np.arange(n) / SR
    body = np.sin(2 * np.pi * hz(m) * tt + 3 * np.exp(-tt * 30)) * np.exp(-tt * 6)
    slap = lowpass(rng.normal(0, 1, n), 2200) * np.exp(-tt * 40)
    return body * 0.9 + slap * 0.5


def click():
    n = int(0.03 * SR)
    tt = np.arange(n) / SR
    return (rng.normal(0, 1, n) - lowpass(rng.normal(0, 1, n), 3000)) * np.exp(-tt * 260)


# ---------------------------------------------------------------- music
# C, Am, F, G, one bar each. Voicings stay in the middle register.
CHORDS = [[60, 64, 67, 71], [57, 60, 64, 67], [53, 57, 60, 65], [55, 59, 62, 67]]
ROOTS = [36, 33, 29, 31]
ARP = [[72, 76, 79, 76], [69, 72, 76, 72], [65, 69, 72, 69], [67, 71, 74, 71]]

bars = int(np.ceil(DUR / BAR))
for b in range(bars):
    t0 = b * BAR
    ci = b % 4
    # Keys: every bar, quiet in the hook, fuller from the reveal.
    level = 0.24 if t0 < 3.2 else 0.3
    place(keys(CHORDS[ci], BAR + 0.3), t0, level, -0.15)
    place(keys([n + 12 for n in CHORDS[ci][1:3]], BAR * 0.5), t0 + BAR * 0.5, level * 0.4, 0.3)
    for beat in range(4):
        tb = t0 + beat * BEAT
        if tb >= DUR - 0.6:
            continue
        # Bass on 1 and 3 once the desk appears.
        if tb >= 3.2 and beat in (0, 2):
            n = int(BEAT * 1.6 * SR)
            tt = np.arange(n) / SR
            bass = np.tanh(1.6 * np.sin(2 * np.pi * hz(ROOTS[ci] + 12) * tt)) * np.exp(-tt * 2.2)
            place(bass, tb, 0.17, 0)
        if tb >= 3.2 and beat in (0, 2):
            place(kick(), tb, 0.2, 0)
        if tb >= 6.4 and beat in (1, 3):
            place(clap(), tb, 0.12, 0.1)
        for half in (0, 0.5):
            th = tb + half * BEAT
            if th >= 6.4:
                place(shaker(), th, 0.03 if half else 0.02, 0.45)
            # Plucked arpeggio, eighth notes, from the reveal on.
            if th >= 3.2:
                note = ARP[ci][(beat * 2 + int(half * 2)) % 4]
                place(pluck(note, 0.5, 0.55), th, 0.11, -0.35 if half else 0.35)

# ---------------------------------------------------------------- effects (in key, under the music)
for i, m in enumerate([76, 79, 84, 79, 88]):  # email pings: E5 G5 C6 G5 E6
    place(bell(m), 0.55 + i * 0.22, 0.07, -0.4 + i * 0.2)
place(whoosh(0.5), 2.85, 0.06, 0)
place(keys([60, 64, 67, 72], 1.4), 3.35, 0.16, 0)  # logo arrives on a C chord
place(whoosh(0.45), 6.25, 0.05, 0.2)
place(lowpass(rng.normal(0, 1, int(0.12 * SR)), 1800) * np.exp(-np.arange(int(0.12 * SR)) / SR * 30), 6.9, 0.07, 0.2)
place(click(), 7.6, 0.12, 0.4)
place(pluck(79, 0.7, 0.8), 7.7, 0.12, 0.3)  # pin: G5
place(scribble(0.6), 7.85, 0.05, 0.3)
place(whoosh(0.3, False), 8.45, 0.04, 0.3)  # sticky note lands
place(whoosh(0.45), 10.3, 0.05, -0.2)
place(pluck(72, 0.6, 0.7), 11.15, 0.09, 0.3)
place(pluck(76, 0.6, 0.7), 11.55, 0.09, 0.3)
place(click(), 12.9, 0.1, 0.3)
place(pluck(84, 0.9, 0.9), 12.92, 0.11, 0.3)  # task ticked: C6
place(whoosh(0.45), 14.3, 0.05, 0.2)
place(lowpass(rng.normal(0, 1, int(0.12 * SR)), 1800) * np.exp(-np.arange(int(0.12 * SR)) / SR * 30), 14.95, 0.07, 0.1)
place(click(), 15.4, 0.1, -0.3)
place(thump(36, 1.0), 15.85, 0.5, 0)  # the stamp
place(keys([48, 55, 64, 72], 1.2), 15.85, 0.12, 0)
place(whoosh(0.6), 17.8, 0.06, 0)
for i in range(5):
    place(pluck([72, 74, 76, 79, 84][i], 0.5, 0.7), 19.3 + i * 0.14, 0.06, -0.4 + i * 0.2)
place(thump(36, 1.2), 20.75, 0.42, 0)  # outro stamp
place(keys([48, 60, 64, 67, 74], 1.4), 20.75, 0.2, 0)  # C add9 to finish

# ---------------------------------------------------------------- master
mix = np.stack([left, right], axis=1)
fade_in = int(0.05 * SR)
mix[:fade_in] *= np.linspace(0, 1, fade_in)[:, None]
fade_out = int(0.7 * SR)
mix[-fade_out:] *= np.linspace(1, 0, fade_out)[:, None]
mix = np.tanh(mix * 1.4) / np.tanh(1.4)  # gentle glue, no harsh peaks
mix *= 0.89 / np.max(np.abs(mix))  # peak about -1 dBFS

out = sys.argv[1] if len(sys.argv) > 1 else "audio.wav"
with wave.open(out, "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix * 32767).astype("<i2").tobytes())
print(out, f"{DUR:.1f}s")
