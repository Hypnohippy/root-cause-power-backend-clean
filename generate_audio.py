#!/usr/bin/env python3
"""
Generate therapeutic audio files for Root Cause Power PWA
Creates realistic audio files for PTSD therapy, EMDR, meditation, etc.
"""

import numpy as np
import os
from scipy.io import wavfile
from scipy import signal
import json

class TherapeuticAudioGenerator:
    def __init__(self, sample_rate=44100):
        self.sample_rate = sample_rate
        self.audio_dir = "public/audio"
        
    def generate_sine_wave(self, frequency, duration, amplitude=0.3):
        """Generate a sine wave of given frequency and duration"""
        t = np.linspace(0, duration, int(self.sample_rate * duration), False)
        return amplitude * np.sin(2 * np.pi * frequency * t)
    
    def generate_white_noise(self, duration, amplitude=0.1):
        """Generate white noise for rain-like sounds"""
        samples = int(self.sample_rate * duration)
        return amplitude * np.random.normal(0, 1, samples)
    
    def generate_brown_noise(self, duration, amplitude=0.15):
        """Generate brown noise for ocean-like sounds"""
        samples = int(self.sample_rate * duration)
        white = np.random.normal(0, 1, samples)
        brown = np.cumsum(white)
        brown = brown / np.max(np.abs(brown)) * amplitude
        return brown
    
    def apply_envelope(self, audio, fade_in=0.5, fade_out=0.5):
        """Apply fade in/out envelope to audio"""
        samples = len(audio)
        fade_in_samples = int(fade_in * self.sample_rate)
        fade_out_samples = int(fade_out * self.sample_rate)
        
        # Fade in
        if fade_in_samples > 0:
            fade_in_curve = np.linspace(0, 1, fade_in_samples)
            audio[:fade_in_samples] *= fade_in_curve
        
        # Fade out
        if fade_out_samples > 0:
            fade_out_curve = np.linspace(1, 0, fade_out_samples)
            audio[-fade_out_samples:] *= fade_out_curve
        
        return audio
    
    def generate_bilateral_tone(self, ear, duration=0.5):
        """Generate EMDR bilateral stimulation tones"""
        # 440 Hz (A4) tone for bilateral stimulation
        tone = self.generate_sine_wave(440, duration, 0.2)
        tone = self.apply_envelope(tone, 0.1, 0.1)
        
        # Create stereo audio
        if ear == 'left':
            stereo = np.column_stack([tone, np.zeros_like(tone)])
        else:
            stereo = np.column_stack([np.zeros_like(tone), tone])
        
        return stereo
    
    def generate_alternating_chimes(self, duration=600):  # 10 minutes
        """Generate alternating EMDR chimes"""
        chime_duration = 0.3
        pause_duration = 1.2
        cycle_duration = chime_duration * 2 + pause_duration
        
        total_samples = int(duration * self.sample_rate)
        result = np.zeros((total_samples, 2))  # Stereo
        
        current_sample = 0
        left_turn = True
        
        while current_sample < total_samples:
            # Generate chime (soft bell-like sound)
            frequencies = [523, 659, 784]  # C5, E5, G5 chord
            chime = np.zeros(int(chime_duration * self.sample_rate))
            for freq in frequencies:
                chime += self.generate_sine_wave(freq, chime_duration, 0.1)
            chime = self.apply_envelope(chime, 0.05, 0.2)
            
            # Add to appropriate channel
            end_sample = min(current_sample + len(chime), total_samples)
            if left_turn:
                result[current_sample:end_sample, 0] = chime[:end_sample-current_sample]
            else:
                result[current_sample:end_sample, 1] = chime[:end_sample-current_sample]
            
            current_sample += int(cycle_duration * self.sample_rate)
            left_turn = not left_turn
        
        return result
    
    def generate_rain_sounds(self, duration=1800):  # 30 minutes
        """Generate calming rain sounds"""
        # Combine different noise layers for realistic rain
        base_noise = self.generate_white_noise(duration, 0.08)
        
        # Add filtering to make it sound more like rain
        # Low-pass filter
        b, a = signal.butter(4, 8000, 'low', fs=self.sample_rate)
        rain = signal.filtfilt(b, a, base_noise)
        
        # Add occasional droplet sounds
        droplet_times = np.random.exponential(0.3, int(duration / 0.3))
        for t in droplet_times:
            if t < duration:
                droplet = self.generate_sine_wave(800, 0.05, 0.02)
                droplet = self.apply_envelope(droplet, 0.01, 0.04)
                start_sample = int(t * self.sample_rate)
                end_sample = min(start_sample + len(droplet), len(rain))
                rain[start_sample:end_sample] += droplet[:end_sample-start_sample]
        
        return rain
    
    def generate_ocean_waves(self, duration=1800):  # 30 minutes
        """Generate ocean wave sounds"""
        # Base brown noise for wave texture
        base = self.generate_brown_noise(duration, 0.1)
        
        # Add wave cycles (low frequency modulation)
        t = np.linspace(0, duration, len(base))
        wave_cycle = 0.05 * np.sin(2 * np.pi * 0.1 * t)  # 0.1 Hz wave cycle
        ocean = base * (1 + wave_cycle)
        
        # Low-pass filter for realistic ocean sound
        b, a = signal.butter(6, 2000, 'low', fs=self.sample_rate)
        ocean = signal.filtfilt(b, a, ocean)
        
        return ocean
    
    def generate_forest_sounds(self, duration=1800):  # 30 minutes
        """Generate forest ambience with birds"""
        # Base wind/rustling sound
        base = self.generate_brown_noise(duration, 0.03)
        
        # Add bird chirps at random intervals
        bird_times = np.random.exponential(2.0, int(duration / 2.0))
        for t in bird_times:
            if t < duration:
                # Generate bird chirp (frequency sweep)
                chirp_duration = np.random.uniform(0.2, 0.8)
                start_freq = np.random.uniform(2000, 4000)
                end_freq = start_freq * np.random.uniform(1.2, 2.0)
                
                chirp_t = np.linspace(0, chirp_duration, int(chirp_duration * self.sample_rate))
                freq_sweep = np.linspace(start_freq, end_freq, len(chirp_t))
                chirp = 0.02 * np.sin(2 * np.pi * np.cumsum(freq_sweep) * chirp_duration / len(chirp_t))
                chirp = self.apply_envelope(chirp, 0.1, 0.3)
                
                start_sample = int(t * self.sample_rate)
                end_sample = min(start_sample + len(chirp), len(base))
                base[start_sample:end_sample] += chirp[:end_sample-start_sample]
        
        return base
    
    def generate_guided_breathing(self, duration=300):  # 5 minutes
        """Generate breathing guide tones"""
        # 4-7-8 breathing pattern: inhale 4, hold 7, exhale 8
        cycle_duration = 19  # 4+7+8 seconds
        total_samples = int(duration * self.sample_rate)
        result = np.zeros(total_samples)
        
        current_sample = 0
        while current_sample < total_samples:
            # Inhale tone (rising)
            inhale_samples = int(4 * self.sample_rate)
            if current_sample + inhale_samples <= total_samples:
                t = np.linspace(0, 4, inhale_samples)
                freq = 200 + 100 * t / 4  # Rising from 200 to 300 Hz
                inhale_tone = 0.1 * np.sin(2 * np.pi * freq * t)
                result[current_sample:current_sample + inhale_samples] = inhale_tone
            current_sample += inhale_samples
            
            # Hold (silence)
            current_sample += int(7 * self.sample_rate)
            
            # Exhale tone (falling)
            exhale_samples = int(8 * self.sample_rate)
            if current_sample < total_samples:
                end_sample = min(current_sample + exhale_samples, total_samples)
                actual_samples = end_sample - current_sample
                t = np.linspace(0, actual_samples / self.sample_rate, actual_samples)
                freq = 300 - 100 * t / (actual_samples / self.sample_rate)  # Falling from 300 to 200 Hz
                exhale_tone = 0.1 * np.sin(2 * np.pi * freq * t)
                result[current_sample:end_sample] = exhale_tone[:actual_samples]
            current_sample = end_sample
        
        return result
    
    def generate_panic_attack_help(self, duration=180):  # 3 minutes
        """Generate emergency calming audio for panic attacks"""
        # Slow, steady tones to help regulate breathing
        total_samples = int(duration * self.sample_rate)
        result = np.zeros(total_samples)
        
        # 6 breaths per minute (10 seconds each)
        breath_duration = 10
        breath_samples = int(breath_duration * self.sample_rate)
        
        current_sample = 0
        while current_sample < total_samples:
            # Gentle sine wave for breathing rhythm
            t = np.linspace(0, breath_duration, breath_samples)
            breathing_tone = 0.08 * np.sin(2 * np.pi * 0.1 * t)  # Very slow rhythm
            
            end_sample = min(current_sample + breath_samples, total_samples)
            result[current_sample:end_sample] = breathing_tone[:end_sample-current_sample]
            current_sample = end_sample
        
        return result
    
    def save_audio(self, audio_data, filename, is_stereo=False):
        """Save audio data to WAV file"""
        filepath = os.path.join(self.audio_dir, filename)
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        
        # Normalize audio to prevent clipping
        if is_stereo:
            max_val = np.max(np.abs(audio_data))
        else:
            max_val = np.max(np.abs(audio_data))
        
        if max_val > 0:
            audio_data = audio_data / max_val * 0.8  # Leave some headroom
        
        # Convert to 16-bit integer
        audio_int = (audio_data * 32767).astype(np.int16)
        
        wavfile.write(filepath, self.sample_rate, audio_int)
        print(f"Generated: {filename}")
    
    def generate_all_audio_files(self):
        """Generate all therapeutic audio files"""
        print("🎵 Generating therapeutic audio files...")
        
        # EMDR bilateral tones
        left_tone = self.generate_bilateral_tone('left', 0.5)
        self.save_audio(left_tone, "bilateral-tones-left.wav", True)
        
        right_tone = self.generate_bilateral_tone('right', 0.5)
        self.save_audio(right_tone, "bilateral-tones-right.wav", True)
        
        # EMDR alternating chimes (10 minutes)
        alternating = self.generate_alternating_chimes(600)
        self.save_audio(alternating, "alternating-chimes.wav", True)
        
        # Background ambience (30 minutes each)
        rain = self.generate_rain_sounds(1800)
        self.save_audio(rain, "calming-rain.wav")
        
        ocean = self.generate_ocean_waves(1800)
        self.save_audio(ocean, "ocean-waves.wav")
        
        forest = self.generate_forest_sounds(1800)
        self.save_audio(forest, "forest-sounds.wav")
        
        # Guided breathing (5 minutes)
        breathing = self.generate_guided_breathing(300)
        self.save_audio(breathing, "box-breathing-guide.wav")
        
        # Emergency panic attack help (3 minutes)
        panic_help = self.generate_panic_attack_help(180)
        self.save_audio(panic_help, "panic-attack-help.wav")
        
        # Additional therapeutic audio
        grounding = self.generate_guided_breathing(480)  # 8 minutes for grounding
        self.save_audio(grounding, "grounding-meditation.wav")
        
        relaxation = self.generate_guided_breathing(900)  # 15 minutes for progressive relaxation
        self.save_audio(relaxation, "progressive-relaxation.wav")
        
        print("✅ All therapeutic audio files generated successfully!")
        
        # Generate audio manifest
        manifest = {
            "bilateral-tones-left.wav": {"duration": 0.5, "type": "emdr", "description": "Left ear EMDR tone"},
            "bilateral-tones-right.wav": {"duration": 0.5, "type": "emdr", "description": "Right ear EMDR tone"},
            "alternating-chimes.wav": {"duration": 600, "type": "emdr", "description": "10-minute EMDR alternating chimes"},
            "calming-rain.wav": {"duration": 1800, "type": "ambient", "description": "30-minute calming rain sounds"},
            "ocean-waves.wav": {"duration": 1800, "type": "ambient", "description": "30-minute ocean wave sounds"},
            "forest-sounds.wav": {"duration": 1800, "type": "ambient", "description": "30-minute forest ambience with birds"},
            "box-breathing-guide.wav": {"duration": 300, "type": "breathing", "description": "5-minute guided breathing exercise"},
            "panic-attack-help.wav": {"duration": 180, "type": "crisis", "description": "3-minute emergency calming audio"},
            "grounding-meditation.wav": {"duration": 480, "type": "meditation", "description": "8-minute grounding meditation"},
            "progressive-relaxation.wav": {"duration": 900, "type": "relaxation", "description": "15-minute progressive relaxation"}
        }
        
        with open(os.path.join(self.audio_dir, "manifest.json"), 'w') as f:
            json.dump(manifest, f, indent=2)
        
        print("📝 Audio manifest created!")

if __name__ == "__main__":
    generator = TherapeuticAudioGenerator()
    generator.generate_all_audio_files()