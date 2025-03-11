import { Howl } from 'howler';

interface SoundTheme {
  win: string;
  lose: string;
  bet: string;
  click: string;
  cashout: string;
}

const soundThemes: Record<string, SoundTheme> = {
  default: {
    win: 'https://assets.mixkit.co/active_storage/sfx/2019.wav',
    lose: 'https://assets.mixkit.co/active_storage/sfx/2020.wav',
    bet: 'https://assets.mixkit.co/active_storage/sfx/2021.wav',
    click: 'https://assets.mixkit.co/active_storage/sfx/2022.wav',
    cashout: 'https://assets.mixkit.co/active_storage/sfx/2023.wav',
  },
  retro: {
    win: 'https://assets.mixkit.co/active_storage/sfx/2024.wav',
    lose: 'https://assets.mixkit.co/active_storage/sfx/2025.wav',
    bet: 'https://assets.mixkit.co/active_storage/sfx/2026.wav',
    click: 'https://assets.mixkit.co/active_storage/sfx/2027.wav',
    cashout: 'https://assets.mixkit.co/active_storage/sfx/2028.wav',
  },
  modern: {
    win: 'https://assets.mixkit.co/active_storage/sfx/2029.wav',
    lose: 'https://assets.mixkit.co/active_storage/sfx/2030.wav',
    bet: 'https://assets.mixkit.co/active_storage/sfx/2031.wav',
    click: 'https://assets.mixkit.co/active_storage/sfx/2032.wav',
    cashout: 'https://assets.mixkit.co/active_storage/sfx/2033.wav',
  },
};

class SoundManager {
  private sounds: Record<string, Howl> = {};
  private muted: boolean = false;
  private currentTheme: string = 'default';

  constructor() {
    this.loadSoundTheme(this.currentTheme);
  }

  private loadSoundTheme(theme: string) {
    const themeData = soundThemes[theme];
    if (!themeData) return;

    // Clear existing sounds
    Object.values(this.sounds).forEach(sound => sound.unload());
    this.sounds = {};

    // Load new theme sounds
    Object.entries(themeData).forEach(([key, url]) => {
      this.sounds[key] = new Howl({
        src: [url],
        preload: true,
        volume: 0.5,
      });
    });
  }

  play(soundName: keyof SoundTheme) {
    if (this.muted) return;
    
    const sound = this.sounds[soundName];
    if (sound) {
      sound.play();
    }
  }

  setTheme(theme: string) {
    if (soundThemes[theme]) {
      this.currentTheme = theme;
      this.loadSoundTheme(theme);
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  setMuted(muted: boolean) {
    this.muted = muted;
  }

  isMuted() {
    return this.muted;
  }

  getCurrentTheme() {
    return this.currentTheme;
  }

  getAvailableThemes() {
    return Object.keys(soundThemes);
  }
}

export const soundManager = new SoundManager();