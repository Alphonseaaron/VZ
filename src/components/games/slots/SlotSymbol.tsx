import React from 'react';
import { Diamond, Clover, Heart, Club, Star, Crown } from 'lucide-react';

export type SymbolType = 'diamond' | 'clover' | 'heart' | 'club' | 'star' | 'crown';

interface SlotSymbolProps {
  symbol: SymbolType;
  isSpinning?: boolean;
  highlighted?: boolean;
}

const symbolComponents = {
  diamond: Diamond,
  clover: Clover,
  heart: Heart,
  club: Club,
  star: Star,
  crown: Crown,
};

const symbolMultipliers = {
  crown: 10,
  star: 8,
  diamond: 6,
  heart: 4,
  club: 3,
  clover: 2,
};

export { symbolMultipliers };

const SlotSymbol: React.FC<SlotSymbolProps> = ({ symbol, isSpinning, highlighted }) => {
  const SymbolComponent = symbolComponents[symbol];
  
  return (
    <div
      className={`
        w-20 h-20 flex items-center justify-center
        ${isSpinning ? 'animate-spin' : ''}
        ${highlighted ? 'bg-yellow-200 rounded-lg' : ''}
        transition-all duration-300
      `}
    >
      <SymbolComponent
        size={40}
        className={`
          ${highlighted ? 'text-yellow-600' : 'text-gray-700'}
          transition-colors duration-300
        `}
      />
    </div>
  );
};

export default SlotSymbol;