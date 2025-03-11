import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import DiceGame from '../components/games/DiceGame';
import SlotMachine from '../components/games/SlotMachine';
import { useAuthStore } from '../store/authStore';

const Games = () => {
  const { user } = useAuthStore();

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Games</h1>
      <Routes>
        <Route path="/" element={<GamesList />} />
        <Route path="/dice" element={<DiceGame />} />
        <Route path="/slots" element={<SlotMachine />} />
      </Routes>
    </div>
  );
};

const GamesList = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const games = [
    {
      id: 'dice',
      name: 'Dice',
      description: 'Predict if the number will be over or under your target!',
      minBet: 1,
      maxBet: 1000,
      image: 'https://images.unsplash.com/photo-1595933868307-5a7083dfb921?auto=format&fit=crop&q=80&w=500',
    },
    {
      id: 'slots',
      name: 'Slots',
      description: 'Try your luck with our exciting slot machine!',
      minBet: 1,
      maxBet: 1000,
      image: 'https://images.unsplash.com/photo-1601645191163-3fc0d5d64e35?auto=format&fit=crop&q=80&w=500',
    }
  ];

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 text-lg">Please sign in to play games.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {games.map((game) => (
        <div
          key={game.id}
          className="bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-700 transition-colors cursor-pointer"
          onClick={() => navigate(`/games/${game.id}`)}
        >
          <img
            src={game.image}
            alt={game.name}
            className="w-full h-48 object-cover"
          />
          <div className="p-6">
            <h3 className="text-xl font-semibold mb-2">{game.name}</h3>
            <p className="text-gray-400 mb-4">{game.description}</p>
            <div className="flex justify-between text-sm text-gray-500">
              <span>Min Bet: ${game.minBet}</span>
              <span>Max Bet: ${game.maxBet}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Games;