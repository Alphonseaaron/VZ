import React from 'react';
import { Link } from 'react-router-dom';
import { Dice1 as Dice, ChevronRight as ChessKnight, Target, Grid3X3 } from 'lucide-react';

const games = [
  {
    id: 'dice',
    name: 'Dice',
    icon: Dice,
    description: 'Test your luck with our exciting dice game!',
  },
  {
    id: 'chess',
    name: 'Chess',
    icon: ChessKnight,
    description: 'Challenge your mind with the classic game of chess.',
  },
  {
    id: 'crash',
    name: 'Crash',
    icon: Target,
    description: 'An exciting multiplayer game of timing and strategy!',
  },
  {
    id: 'tictactoe',
    name: 'Tic Tac Toe',
    icon: Grid3X3,
    description: 'Classic three-in-a-row game with best of 3 rounds.',
  },
];

const Home = () => {
  return (
    <div className="space-y-8">
      <section className="text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to VZ Gaming</h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Experience the thrill of competitive gaming with our collection of classic and modern games.
          Challenge friends, climb the leaderboards, and become a champion!
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {games.map((game) => (
          <Link
            key={game.id}
            to={`/games/${game.id}`}
            className="bg-gray-800 p-6 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <game.icon className="w-12 h-12 text-blue-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">{game.name}</h3>
            <p className="text-gray-400">{game.description}</p>
          </Link>
        ))}
      </section>

      <section className="bg-gray-800 p-8 rounded-lg">
        <h2 className="text-2xl font-bold mb-4">Latest Winners</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Placeholder for leaderboard data */}
          <div className="bg-gray-700 p-4 rounded-md">
            <p className="font-semibold">Chess Champion</p>
            <p className="text-gray-400">Player123</p>
          </div>
          <div className="bg-gray-700 p-4 rounded-md">
            <p className="font-semibold">Dice Master</p>
            <p className="text-gray-400">GamePro456</p>
          </div>
          <div className="bg-gray-700 p-4 rounded-md">
            <p className="font-semibold">Crash King</p>
            <p className="text-gray-400">Winner789</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;