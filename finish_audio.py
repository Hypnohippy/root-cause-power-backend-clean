#!/usr/bin/env python3
import numpy as np
from scipy.io import wavfile
import os
import json

print("🎵 Creating remaining therapeutic audio files...")

sample_rate = 44100
audio_dir = "public/audio"

# Create remaining therapeutic audio files

# 1. Alternating Chimes (30 seconds)
duration = 30
total_samples = int(duration * sample_rate)
result = np.zeros((total_samples, 2))

for i in range(0, total_samples, int(1.5 * sample_rate)):
    if i + int(0.3 * sample_rate) < total_samples:
        chime_samples = int(0.3 * sample_rate)
        t_chime = np.linspace(0, 0.3, chime_samples)
        chime = 0.15 * np.sin(2 * np.pi * 523 * t_chime) * np.exp(-t_chime * 3)
        
        channel = 0 if (i // int(1.5 * sample_rate)) % 2 == 0 else 1
        result[i:i + chime_samples, channel] = chime

audio_int = (result * 32767).astype(np.int16)
wavfile.write(f'{audio_dir}/alternating-chimes.wav', sample_rate, audio_int)
print("✅ Created alternating chimes")

# 2. Ocean waves
duration = 30
t = np.linspace(0, duration, int(duration * sample_rate))
ocean = 0.08 * np.random.normal(0, 1, len(t)) * (1 + 0.3 * np.sin(2 * np.pi * 0.1 * t))
audio_int = (ocean * 32767).astype(np.int16)
wavfile.write(f'{audio_dir}/ocean-waves.wav', sample_rate, audio_int)
print("✅ Created ocean waves")

# 3. Forest sounds
duration = 30
forest = 0.05 * np.random.normal(0, 1, int(duration * sample_rate))
# Add 3 bird chirps
for _ in range(3):
    start = np.random.randint(0, int(duration * sample_rate) - sample_rate)
    chirp_len = int(0.4 * sample_rate)
    t_chirp = np.linspace(0, 0.4, chirp_len)
    chirp = 0.03 * np.sin(2 * np.pi * 2500 * t_chirp) * np.exp(-t_chirp * 2)
    forest[start:start + chirp_len] += chirp
audio_int = (forest * 32767).astype(np.int16)
wavfile.write(f'{audio_dir}/forest-sounds.wav', sample_rate, audio_int)
print("✅ Created forest sounds")

# 4. Box breathing guide (5 minutes)
duration = 300
t = np.linspace(0, duration, int(duration * sample_rate))
breathing = np.zeros_like(t)

# Simple breathing rhythm
for cycle in range(int(duration / 20)):
    start_time = cycle * 20
    # Inhale tone (4 seconds)
    inhale_mask = (t >= start_time) & (t < start_time + 4)
    breathing[inhale_mask] = 0.08 * np.sin(2 * np.pi * 220 * (t[inhale_mask] - start_time))
    
    # Exhale tone (8 seconds, starting at 12)
    exhale_start = start_time + 12
    exhale_mask = (t >= exhale_start) & (t < exhale_start + 8)
    breathing[exhale_mask] = 0.06 * np.sin(2 * np.pi * 180 * (t[exhale_mask] - exhale_start))

audio_int = (breathing * 32767).astype(np.int16)
wavfile.write(f'{audio_dir}/box-breathing-guide.wav', sample_rate, audio_int)
print("✅ Created box breathing guide")

# 5. Panic attack help (3 minutes)
duration = 180
t = np.linspace(0, duration, int(duration * sample_rate))
panic_help = 0.04 * np.sin(2 * np.pi * 200 * t) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.1 * t))
audio_int = (panic_help * 32767).astype(np.int16)
wavfile.write(f'{audio_dir}/panic-attack-help.wav', sample_rate, audio_int)
print("✅ Created panic attack help")

# 6. Grounding meditation (8 minutes)
duration = 480
t = np.linspace(0, duration, int(duration * sample_rate))
grounding = 0.03 * np.sin(2 * np.pi * 220 * t) * (0.7 + 0.3 * np.sin(2 * np.pi * 0.02 * t))
audio_int = (grounding * 32767).astype(np.int16)
wavfile.write(f'{audio_dir}/grounding-meditation.wav', sample_rate, audio_int)
print("✅ Created grounding meditation")

# 7. Progressive relaxation (15 minutes) 
duration = 900
t = np.linspace(0, duration, int(duration * sample_rate))
relaxation = 0.025 * (np.sin(2 * np.pi * 200 * t) + 0.5 * np.sin(2 * np.pi * 150 * t))
audio_int = (relaxation * 32767).astype(np.int16)
wavfile.write(f'{audio_dir}/progressive-relaxation.wav', sample_rate, audio_int)
print("✅ Created progressive relaxation")

# Create audio manifest
manifest = {
    "bilateral-tones-left.wav": {"duration": 1, "type": "emdr", "description": "Left ear EMDR bilateral tone"},
    "bilateral-tones-right.wav": {"duration": 1, "type": "emdr", "description": "Right ear EMDR bilateral tone"}, 
    "alternating-chimes.wav": {"duration": 30, "type": "emdr", "description": "30-second EMDR alternating chimes"},
    "calming-rain.wav": {"duration": 30, "type": "ambient", "description": "30-second calming rain sounds"},
    "ocean-waves.wav": {"duration": 30, "type": "ambient", "description": "30-second ocean wave sounds"},
    "forest-sounds.wav": {"duration": 30, "type": "ambient", "description": "30-second forest ambience"},
    "box-breathing-guide.wav": {"duration": 300, "type": "breathing", "description": "5-minute guided breathing"},
    "panic-attack-help.wav": {"duration": 180, "type": "crisis", "description": "3-minute panic attack help"},
    "grounding-meditation.wav": {"duration": 480, "type": "meditation", "description": "8-minute grounding meditation"}, 
    "progressive-relaxation.wav": {"duration": 900, "type": "relaxation", "description": "15-minute progressive relaxation"}
}

with open(f'{audio_dir}/manifest.json', 'w') as f:
    json.dump(manifest, f, indent=2)

print("📝 Audio manifest created!")
print("🎉 All therapeutic audio files completed!")