class SoundManager {
  private sounds: { [key: string]: HTMLAudioElement } = {};
  private muted: boolean = false;

  constructor() {
    this.initializeSounds();
  }

  private initializeSounds() {
    this.sounds = {
      win: new Audio('https://assets.mixkit.co/active_storage/sfx/2019.wav'),
      lose: new Audio('https://assets.mixkit.co/active_storage/sfx/2020.wav'),
      bet: new Audio('https://assets.mixkit.co/active_storage/sfx/2021.wav'),
      click: new Audio('https://assets.mixkit.co/active_storage/sfx/2022.wav'),
    };

    // Preload sounds
    Object.values(this.sounds).forEach(sound => {
      sound.load();
    });
  }

  play(soundName: keyof typeof this.sounds) {
    if (this.muted) return;
    
    const sound = this.sounds[soundName];
    if (sound) {
      sound.currentTime = 0;
      sound.play().catch(() => {});
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
}

export const soundManager = new SoundManager();