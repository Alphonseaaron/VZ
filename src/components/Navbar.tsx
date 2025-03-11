import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { TowerControl as GameController, User, LogOut } from 'lucide-react';

const Navbar = () => {
  const { user, signOut } = useAuthStore();

  return (
    <nav className="bg-gray-800 border-b border-gray-700">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <GameController className="w-8 h-8 text-blue-500" />
            <span className="text-xl font-bold">VZ Gaming</span>
          </Link>

          <div className="flex items-center space-x-4">
            <Link to="/games" className="hover:text-blue-500 transition-colors">
              Games
            </Link>
            {user ? (
              <>
                <Link to="/profile" className="hover:text-blue-500 transition-colors">
                  <User className="w-6 h-6" />
                </Link>
                <button
                  onClick={() => signOut()}
                  className="hover:text-blue-500 transition-colors"
                >
                  <LogOut className="w-6 h-6" />
                </button>
              </>
            ) : (
              <Link
                to="/auth"
                className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-md transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;