import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Dice1 as Dice, Rocket, Coins } from 'lucide-react';
import toast from 'react-hot-toast';

interface GameSetting {
  name: string;
  value: number;
  min: number;
  max: number;
  step: number;
}

export const GameSettings = () => {
  const [settings, setSettings] = useState({
    dice: {
      houseEdge: { name: 'House Edge', value: 1, min: 0.1, max: 5, step: 0.1 },
      minBet: { name: 'Minimum Bet', value: 1, min: 0.1, max: 100, step: 0.1 },
      maxBet: { name: 'Maximum Bet', value: 1000, min: 100, max: 10000, step: 100 },
    },
    crash: {
      houseEdge: { name: 'House Edge', value: 1, min: 0.1, max: 5, step: 0.1 },
      minBet: { name: 'Minimum Bet', value: 1, min: 0.1, max: 100, step: 0.1 },
      maxBet: { name: 'Maximum Bet', value: 1000, min: 100, max: 10000, step: 100 },
      maxMultiplier: { name: 'Max Multiplier', value: 100, min: 10, max: 1000, step: 10 },
    },
    slots: {
      rtp: { name: 'RTP %', value: 96, min: 90, max: 98, step: 0.1 },
      minBet: { name: 'Minimum Bet', value: 1, min: 0.1, max: 100, step: 0.1 },
      maxBet: { name: 'Maximum Bet', value: 1000, min: 100, max: 10000, step: 100 },
    },
  });

  const handleSettingChange = (
    game: keyof typeof settings,
    setting: string,
    value: number
  ) => {
    setSettings((prev) => ({
      ...prev,
      [game]: {
        ...prev[game],
        [setting]: {
          ...prev[game][setting as keyof typeof prev[typeof game]],
          value,
        },
      },
    }));
  };

  const handleSave = () => {
    // In a real application, this would save to the database
    toast.success('Settings saved successfully');
  };

  const renderGameSettings = (
    game: keyof typeof settings,
    icon: React.ReactNode,
    title: string
  ) => {
    const gameSettings = settings[game];

    return (
      <Card className="p-6">
        <div className="flex items-center space-x-2 mb-6">
          {icon}
          <h2 className="text-xl font-bold">{title}</h2>
        </div>

        <div className="space-y-6">
          {Object.entries(gameSettings).map(([key, setting]) => (
            <div key={key} className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-medium">{setting.name}</label>
                <span className="text-sm text-text/60">
                  {setting.value.toFixed(1)}
                </span>
              </div>
              <input
                type="range"
                min={setting.min}
                max={setting.max}
                step={setting.step}
                value={setting.value}
                onChange={(e) =>
                  handleSettingChange(game, key, parseFloat(e.target.value))
                }
                className="w-full"
              />
              <div className="flex justify-between text-sm text-text/60">
                <span>{setting.min}</span>
                <span>{setting.max}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Game Settings</h1>
        <button
          onClick={handleSave}
          className="bg-primary text-secondary px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {renderGameSettings('dice', <Dice className="w-6 h-6 text-primary" />, 'Dice Game')}
        {renderGameSettings('crash', <Rocket className="w-6 h-6 text-primary" />, 'Crash Game')}
        {renderGameSettings('slots', <Coins className="w-6 h-6 text-primary" />, 'Slot Machine')}
      </div>
    </div>
  );
};

export default GameSettings;