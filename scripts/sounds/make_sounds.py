"""Synthesizes the game's sound effects and background music from scratch
(no samples, so no licensing questions) into assets/sounds/*.mp3.

    python3 scripts/sounds/make_sounds.py   (needs numpy and ffmpeg)

The same instruments are used in the promo video, so the app and the
video sound alike."""
import os
import subprocess
import tempfile
import wave

import numpy as np

SR = 44100
OUT = os.path.join(os.path.dirname(__file__), "..", "..", "assets", "sounds")
rng = np.random.default_rng(7)


def t_(sec):
    return np.arange(int(SR * sec)) / SR


def env(n, attack=0.005, decay=0.3):
    t = np.arange(n) / SR
    return np.clip(t / attack, 0, 1) * np.exp(-t / decay)


def hz(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


def add(buf, start, sig, gain=1.0):
    i = int(start * SR)
    j = min(len(buf), i + len(sig))
    if i < len(buf):
        buf[i:j] += sig[: j - i] * gain


def sweep(f0, f1, length):
    f = np.linspace(f0, f1, int(SR * length))
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def marimba(midi, length=0.45, decay=0.18):
    t = t_(length)
    f = hz(midi)
    s = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * 4 * f * t) * np.exp(-t / 0.04)
    return s * env(len(t), 0.002, decay)


def bell(midi, length=0.8):
    t = t_(length)
    s = marimba(midi, length, 0.25) + 0.5 * np.sin(2 * np.pi * hz(midi + 12) * t) * env(len(t), 0.001, 0.25)
    return s


def noise(length, decay):
    n = int(SR * length)
    return rng.standard_normal(n) * env(n, 0.001, decay)


def smooth(sig, width):
    return np.convolve(sig, np.ones(width) / width, mode="same")


# ---------- sound effects ----------
def open_tile():
    # A light wooden tap: a short pitched knock plus a click.
    knock = sweep(900, 600, 0.09) * env(int(SR * 0.09), 0.001, 0.025)
    return knock * 0.8 + noise(0.09, 0.004) * 0.25


def chain():
    out = np.zeros(int(SR * 0.9))
    for i, m in enumerate([72, 74, 76, 79, 81, 84]):
        add(out, i * 0.055, marimba(m, 0.4), 0.6)
    return out


def mine():
    t = t_(1.0)
    f = 80 * np.exp(-t / 0.3) + 35
    low = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(t), 0.002, 0.4)
    burst = smooth(noise(1.0, 0.12), 20)
    return np.tanh(2.5 * (low + 1.5 * burst))


def wrong():
    t = t_(0.17)
    sq = np.sign(np.sin(2 * np.pi * 185 * t)) * env(len(t), 0.002, 0.2)
    sq = smooth(sq, 6)
    return np.concatenate([sq, np.zeros(int(SR * 0.05)), sq])


def correct():
    out = np.zeros(int(SR * 1.6))
    for i, m in enumerate([72, 76, 79, 84, 88]):
        add(out, i * 0.07, bell(m, 1.1), 0.5)
    for _ in range(10):
        add(out, 0.35 + rng.random() * 0.8, sweep(2600, 3600, 0.03) * env(int(SR * 0.03), 0.001, 0.01), 0.12)
    return out


def start():
    out = np.zeros(int(SR * 0.6))
    add(out, 0, bell(79, 0.5), 0.5)
    add(out, 0.09, bell(84, 0.5), 0.5)
    return out


def game_over():
    out = np.zeros(int(SR * 1.4))
    for i, m in enumerate([72, 67, 64, 60]):
        add(out, i * 0.16, marimba(m, 0.9, 0.35), 0.6)
    return out


def tap():
    return sweep(1400, 1700, 0.04) * env(int(SR * 0.04), 0.001, 0.012)


# ---------- background music: 120 BPM, C - Am - F - G, loops seamlessly ----------
def bass(midi, length=0.45):
    t = t_(length)
    tri = 2 / np.pi * np.arcsin(np.sin(2 * np.pi * hz(midi) * t))
    return tri * env(len(t), 0.004, 0.22)


def kick():
    t = t_(0.2)
    f = 110 * np.exp(-t / 0.05) + 45
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(t), 0.001, 0.1)


def hat():
    return np.diff(np.concatenate([[0], noise(0.04, 0.012)]))


def pad(midis, length):
    t = t_(length)
    s = sum(np.sin(2 * np.pi * hz(m) * t + rng.random() * 6) for m in midis)
    fade = np.minimum(1, np.minimum(t / 0.3, (length - t) / 0.3).clip(0))
    return s * fade / len(midis)


def bgm():
    beat = 0.5
    bars = 16
    length = bars * 4 * beat
    out = np.zeros(int(SR * length))
    chords = [(48, [60, 64, 67]), (45, [57, 60, 64]), (41, [57, 60, 65]), (43, [59, 62, 67])]
    scale = [72, 74, 76, 79, 81, 84]
    melodies = [
        [0, 2, 4, 2, 3, 1, 2, 0, 1, 3, 5, 3, 4, 2, 1, -1],
        [2, -1, 2, 3, 4, 3, 2, 1, 0, 1, 2, 4, 3, -1, 1, -1],
    ]
    for bar in range(bars):
        time = bar * 4 * beat
        root, chord = chords[bar % 4]
        add(out, time, pad(chord, 4 * beat), 0.10)
        melody = melodies[(bar // 4) % 2]
        for b in range(4):
            tb = time + b * beat
            add(out, tb, bass(root), 0.26)
            if b in (0, 2):
                add(out, tb, kick(), 0.22)
            add(out, tb + beat / 2, hat(), 0.08)
            for half in range(2):
                k = melody[(bar * 8 + b * 2 + half) % len(melody)]
                # Melody on half of the loop only, so it doesn't tire.
                if k >= 0 and (bar // 4) % 2 == 0:
                    add(out, tb + half * beat / 2, marimba(scale[k]), 0.13)
    # 20 ms fades at both ends so the loop point doesn't click.
    fade = int(SR * 0.02)
    out[:fade] *= np.linspace(0, 1, fade)
    out[-fade:] *= np.linspace(1, 0, fade)
    return out


def write_mp3(name, mono, bitrate):
    mono = mono / max(1e-9, np.abs(mono).max()) * 0.89
    data = (mono * 32767).astype("<i2").tobytes()
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        path = tmp.name
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data)
    target = os.path.join(OUT, f"{name}.mp3")
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-i", path, "-codec:a", "libmp3lame", "-b:a", bitrate, target],
        check=True,
    )
    os.remove(path)
    print("wrote", target)


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    for name, make in [
        ("open", open_tile),
        ("chain", chain),
        ("mine", mine),
        ("wrong", wrong),
        ("correct", correct),
        ("start", start),
        ("over", game_over),
        ("tap", tap),
    ]:
        write_mp3(name, make(), "96k")
    write_mp3("bgm", bgm(), "128k")
