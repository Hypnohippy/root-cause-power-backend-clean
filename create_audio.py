#!/usr/bin/env python3
"""
Simple therapeutic audio generator for Root Cause Power PWA
"""

import numpy as np
import os
from scipy.io import wavfile
import json

def create_therapeutic_audio():
    sample_rate = 44100
    audio_dir = "public/audio"
    
    print("🎵 Creating therapeutic audio files...")
    
    # 1. EMDR Bilateral Tones (0.5 seconds each)
    duration = 0.5
    t = np.linspace(0, duration, int(sample_rate * duration), False)
    tone = 0.2 * np.sin(2 * np.pi * 440 * t)
    
    # Apply fade in/out
    fade_samples = int(0.1 * sample_rate)
    tone[:fade_samples] *= np.linspace(0, 1, fade_samples)
    tone[-fade_samples:] *= np.linspace(1, 0, fade_samples)
    
    # Left ear (stereo)
    left_stereo = np.column_stack([tone, np.zeros_like(tone)])
    audio_int = (left_stereo * 32767).astype(np.int16)
    wavfile.write(f'{audio_dir}/bilateral-tones-left.wav', sample_rate, audio_int)
    
    # Right ear (stereo)  
    right_stereo = np.column_stack([np.zeros_like(tone), tone])
    audio_int = (right_stereo * 32767).astype(np.int16)
    wavfile.write(f'{audio_dir}/bilateral-tones-right.wav', sample_rate, audio_int)
    
    print("✅ Created bilateral EMDR tones")
    
    # 2. Alternating Chimes (60 seconds sample)
    duration = 60
    total_samples = int(duration * sample_rate)
    result = np.zeros((total_samples, 2))
    
    chime_interval = 1.5 * sample_rate  # Every 1.5 seconds
    chime_duration = int(0.3 * sample_rate)
    
    for i in range(0, total_samples, int(chime_interval)):
        if i + chime_duration < total_samples:
            # Create bell-like sound (multiple harmonics)
            t_chime = np.linspace(0, 0.3, chime_duration)
            chime = 0.1 * (np.sin(2 * np.pi * 523 * t_chime) + 
                          0.5 * np.sin(2 * np.pi * 659 * t_chime) + 
                          0.3 * np.sin(2 * np.pi * 784 * t_chime))
            
            # Envelope
            env = np.exp(-t_chime * 3)  # Exponential decay
            chime *= env
            
            # Alternate left/right
            channel = 0 if (i // int(chime_interval)) % 2 == 0 else 1
            result[i:i + chime_duration, channel] = chime
    
    audio_int = (result * 32767).astype(np.int16)
    wavfile.write(f'{audio_dir}/alternating-chimes.wav', sample_rate, audio_int)
    
    print("✅ Created alternating EMDR chimes")
    
    # 3. Calming Rain (60 seconds sample)
    duration = 60
    samples = int(duration * sample_rate)
    
    # White noise filtered to sound like rain
    rain_base = np.random.normal(0, 0.08, samples)
    
    # Simple low-pass filter effect
    for i in range(1, len(rain_base)):
        rain_base[i] = 0.8 * rain_base[i] + 0.2 * rain_base[i-1]
    
    audio_int = (rain_base * 32767).astype(np.int16)
    wavfile.write(f'{audio_dir}/calming-rain.wav', sample_rate, audio_int)
    
    print("✅ Created calming rain sounds")
    
    # 4. Ocean Waves (60 seconds sample)
    duration = 60
    t = np.linspace(0, duration, int(duration * sample_rate))
    
    # Brown noise with wave-like modulation
    base_noise = np.cumsum(np.random.normal(0, 1, len(t)))
    base_noise = base_noise / np.max(np.abs(base_noise)) * 0.1
    
    # Add wave rhythm
    wave_rhythm = 0.03 * np.sin(2 * np.pi * 0.1 * t)  # 0.1 Hz waves
    ocean = base_noise * (1 + wave_rhythm)
    
    audio_int = (ocean * 32767).astype(np.int16)
    wavfile.write(f'{audio_dir}/ocean-waves.wav', sample_rate, audio_int)
    
    print("✅ Created ocean wave sounds")
    
    # 5. Forest Sounds (60 seconds sample)
    duration = 60
    samples = int(duration * sample_rate)
    
    # Base wind sound
    forest_base = np.random.normal(0, 0.03, samples)
    
    # Add bird chirps randomly
    for _ in range(5):  # 5 bird chirps in 60 seconds
        chirp_start = np.random.randint(0, samples - sample_rate)
        chirp_duration = int(0.5 * sample_rate)
        
        t_chirp = np.linspace(0, 0.5, chirp_duration)
        freq_start = 2000 + np.random.randint(-500, 500)
        freq_end = freq_start * 1.5
        freq_sweep = freq_start + (freq_end - freq_start) * t_chirp / 0.5
        
        chirp = 0.02 * np.sin(2 * np.pi * freq_sweep * t_chirp)
        chirp *= np.exp(-t_chirp * 2)  # Decay envelope
        
        end_idx = min(chirp_start + chirp_duration, samples)
        forest_base[chirp_start:end_idx] += chirp[:end_idx - chirp_start]
    
    audio_int = (forest_base * 32767).astype(np.int16)
    wavfile.write(f'{audio_dir}/forest-sounds.wav', sample_rate, audio_int)
    
    print("✅ Created forest ambience")
    
    # 6. Guided Breathing (5 minutes sample)
    duration = 300
    t = np.linspace(0, duration, int(duration * sample_rate))
    
    # 4-7-8 breathing pattern (19 seconds per cycle)
    cycle_length = 19
    breathing = np.zeros_like(t)
    
    for cycle in range(int(duration / cycle_length)):
        start_time = cycle * cycle_length
        
        # Inhale phase (4 seconds) - rising tone
        inhale_mask = (t >= start_time) & (t < start_time + 4)
        inhale_freq = 200 + 50 * (t - start_time) / 4
        breathing[inhale_mask] = 0.1 * np.sin(2 * np.pi * inhale_freq[inhale_mask] * (t[inhale_mask] - start_time))
        
        # Exhale phase (8 seconds starting at second 11) - falling tone  
        exhale_start = start_time + 11
        exhale_mask = (t >= exhale_start) & (t < exhale_start + 8)
        exhale_freq = 250 - 50 * (t - exhale_start) / 8
        breathing[exhale_mask] = 0.1 * np.sin(2 * np.pi * exhale_freq[exhale_mask] * (t[exhale_mask] - exhale_start))
    
    audio_int = (breathing * 32767).astype(np.int16)
    wavfile.write(f'{audio_dir}/box-breathing-guide.wav', sample_rate, audio_int)
    
    print("✅ Created guided breathing audio")
    
    # 7. Panic Attack Help (3 minutes)
    duration = 180
    t = np.linspace(0, duration, int(duration * sample_rate))
    
    # Very slow, calming rhythm (6 breaths per minute)
    breath_freq = 6 / 60  # 0.1 Hz
    panic_help = 0.06 * np.sin(2 * np.pi * breath_freq * t) * np.sin(2 * np.pi * 200 * t)
    
    audio_int = (panic_help * 32767).astype(np.int16)
    wavfile.write(f'{audio_dir}/panic-attack-help.wav', sample_rate, audio_int)
    
    print("✅ Created panic attack help audio")
    
    # 8. Grounding Meditation (8 minutes)  
    duration = 480
    t = np.linspace(0, duration, int(duration * sample_rate))
    
    # Gentle, steady tones for grounding
    grounding = 0.05 * np.sin(2 * np.pi * 220 * t) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.05 * t))
    
    audio_int = (grounding * 32767).astype(np.int16)
    wavfile.write(f'{audio_dir}/grounding-meditation.wav', sample_rate, audio_int)
    
    print("✅ Created grounding meditation audio")
    
    # 9. Progressive Relaxation (15 minutes)
    duration = 900
    t = np.linspace(0, duration, int(duration * sample_rate))
    
    # Very gentle, slowly changing tones
    relaxation = 0.04 * (np.sin(2 * np.pi * 200 * t) + 0.5 * np.sin(2 * np.pi * 150 * t)) * (0.3 + 0.7 * np.sin(2 * np.pi * 0.01 * t))
    
    audio_int = (relaxation * 32767).astype(np.int16)
    wavfile.write(f'{audio_dir}/progressive-relaxation.wav', sample_rate, audio_int)
    
    print("✅ Created progressive relaxation audio")
    
    # Create manifest
    manifest = {
        "bilateral-tones-left.wav": {"duration": 0.5, "type": "emdr", "description": "Left ear EMDR bilateral tone"},
        "bilateral-tones-right.wav": {"duration": 0.5, "type": "emdr", "description": "Right ear EMDR bilateral tone"},
        "alternating-chimes.wav": {"duration": 60, "type": "emdr", "description": "1-minute EMDR alternating chimes sample"},
        "calming-rain.wav": {"duration": 60, "type": "ambient", "description": "1-minute calming rain sounds sample"},
        "ocean-waves.wav": {"duration": 60, "type": "ambient", "description": "1-minute ocean wave sounds sample"},  
        "forest-sounds.wav": {"duration": 60, "type": "ambient", "description": "1-minute forest ambience sample"},
        "box-breathing-guide.wav": {"duration": 300, "type": "breathing", "description": "5-minute guided breathing exercise"},
        "panic-attack-help.wav": {"duration": 180, "type": "crisis", "description": "3-minute emergency calming audio"},
        "grounding-meditation.wav": {"duration": 480, "type": "meditation", "description": "8-minute grounding meditation"},
        "progressive-relaxation.wav": {"duration": 900, "type": "relaxation", "description": "15-minute progressive relaxation"}
    }
    
    with open(f'{audio_dir}/manifest.json', 'w') as f:
        json.dump(manifest, f, indent=2)
    
    print("📝 Audio manifest created!")
    print("🎉 All therapeutic audio files generated successfully!")

if __name__ == "__main__":
    create_therapeutic_audio()