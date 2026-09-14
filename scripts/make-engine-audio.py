#!/usr/bin/env python3
"""
Builds public/audio/*.m4a from CC-licensed Ferrari recordings on Freesound (HQ previews):
  857147 jtvdb            Ferrari_motor_idle              CC0
  241083 PritzProductions Ferrari 360 Spider engine sound CC0
  370278 biholao          Acceleration (Ferrari)          CC0
  43484  enginemusic      ferrari355underhood4            CC BY 3.0
  812434 Oscar_Patrick    Ferrari Engine On Front         CC BY 4.0
Loops get an equal-power crossfade at the seam; one-shots get fades. Encoded to AAC with afconvert (macOS).
usage: python3 scripts/make-engine-audio.py
"""
import os, subprocess, sys, wave, urllib.request
import numpy as np

SRC = {
    '857147': '857/857147_14592662', '241083': '241/241083_3450345', '370278': '370/370278_6820745',
    '43484': '43/43484_462458', '812434': '812/812434_5918919',
}
CUTS = [
    # name, source, start, end, kind, nominal rpm
    ('start', '812434', 0.55, 7.6, 'shot', None),
    ('idle', '857147', 8.0, 12.0, 'loop', 1000),
    ('mid', '43484', 7.75, 9.25, 'loop', 3600),
    ('high', '43484', 5.25, 6.45, 'loop', 6800),
    ('launch', '370278', 168.6, 175.8, 'shot', None),
    ('blip', '241083', 4.45, 6.6, 'shot', None),
]
work = os.path.join(os.path.dirname(__file__), '..', 'source-assets', 'audio')
out = os.path.join(os.path.dirname(__file__), '..', 'public', 'audio')
os.makedirs(work, exist_ok=True); os.makedirs(out, exist_ok=True)

def fetch(id):
    mp3 = os.path.join(work, f'{id}.mp3'); wav = os.path.join(work, f'{id}.wav')
    if not os.path.exists(mp3):
        req = urllib.request.Request(f'https://cdn.freesound.org/previews/{SRC[id]}-hq.mp3', headers={'User-Agent': 'Mozilla/5.0'})
        open(mp3, 'wb').write(urllib.request.urlopen(req).read())
    if not os.path.exists(wav):
        subprocess.run(['afconvert', '-f', 'WAVE', '-d', 'LEI16@44100', '-c', '1', mp3, wav], check=True)
    w = wave.open(wav); sr = w.getframerate(); x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
    return sr, x

def highpass(x, sr, fc=35.0):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / sr)
    X[f < fc] *= (f[f < fc] / fc) ** 2
    return np.fft.irfft(X, len(x))

def loop(seg, sr, xf=0.12):
    n = int(sr * xf); a = seg[:n]; b = seg[-n:]
    t = np.linspace(0, 1, n); fi = np.sin(t * np.pi / 2); fo = np.cos(t * np.pi / 2)
    body = seg[n:-n]
    seam = b * fo + a * fi           # tail fades out while head fades in → seamless when wrapped
    return np.concatenate([seam, body])

def shot(seg, sr, fin=0.01, fout=0.35):
    i = int(sr * fin); o = int(sr * fout)
    seg = seg.copy(); seg[:i] *= np.linspace(0, 1, i); seg[-o:] *= np.linspace(1, 0, o) ** 1.5
    return seg

def write(name, x, sr):
    x = x / (np.max(np.abs(x)) + 1e-9) * 0.89
    wav = os.path.join(work, f'{name}.wav')
    with wave.open(wav, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes((x * 32767).astype(np.int16).tobytes())
    m4a = os.path.join(out, f'{name}.m4a')
    if os.path.exists(m4a): os.remove(m4a)
    subprocess.run(['afconvert', '-f', 'm4af', '-d', 'aac', '-b', '80000', wav, m4a], check=True)
    print(f'{name:7} {len(x)/sr:5.2f}s  {os.path.getsize(m4a)/1024:6.1f} KB')

for name, src, a, b, kind, rpm in CUTS:
    sr, x = fetch(src)
    seg = highpass(x[int(a * sr):int(b * sr)], sr)
    write(name, loop(seg, sr) if kind == 'loop' else shot(seg, sr), sr)
print('done →', os.path.relpath(out))
