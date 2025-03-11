import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { soundManager } from '../../lib/sounds';
import { Card } from '../ui/Card';
import Button from '../ui/Button';

export const SoundSettings: React.FC = () => {
  const [muted, setMuted] = React.useState(soundManager.isMuted());
  const [currentTheme, setCurrentTheme] = React.useState(soundManager.getCurrentTheme());

  const handleToggleMute = () => {
    const newMuted = soundManager.toggleMute();
    setMuted(newMuted);
  };

  const handleThemeChange = (theme: string) => {
    soundManager.setTheme(theme);
    setCurrentTheme(theme);
    soundManager.play('click');
  };

  return (
    <Card className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Sound Settings</h3>
        <Button
          onClick={handleToggleMute}
          variant="outline"
          className="p-2"
        >
          {muted ? (
            <VolumeX className="w-5 h-5" />
          ) : (
            <Volume2 className="w-5 h-5" />
          )}
        </Button>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Sound Theme</label>
        <div className="grid grid-cols-3 gap-2">
          {soundManager.getAvailableThemes().map((theme) => (
            <Button
              key={theme}
              variant={currentTheme === theme ? 'primary' : 'outline'}
              onClick={() => handleThemeChange(theme)}
              className="capitalize"
            >
              {theme}
            </Button>
          ))}
        </div>
      </div>
    </Card>
  );
};