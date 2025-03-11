import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';

const Games = () => {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Games</h1>
      <Routes>
        <Route path="/" element={<GamesList />} />
      </Routes>
    </div>
  );
};

const GamesList = () => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <p className="text-gray-400">Select a game from the home page to start playing!</p>
    </div>
  );
};

export default Games;