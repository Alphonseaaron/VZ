import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { TowerControl, User, LogOut, Sun, Moon } from 'lucide-react';
import { WalletDisplay } from '../wallet/WalletDisplay';
import { useTheme } from './ThemeProvider';
import { motion } from 'framer-motion';

export const Navbar = () => {
  const { user, signOut } = useAuthStore();
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="bg-surface border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <TowerControl className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold">VZ Gaming</span>
          </Link>

          <div className="flex items-center space-x-6">
            {user && <WalletDisplay />}
            
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-surface/80 transition-colors"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-primary" />
              ) : (
                <Moon className="w-5 h-5 text-primary" />
              )}
            </button>

            {user ? (
              <motion.div className="flex items-center space-x-4" layout>
                <Link
                  to="/profile"
                  className="p-2 rounded-lg hover:bg-surface/80 transition-colors"
                >
                  <User className="w-5 h-5" />
                </Link>
                <button
                  onClick={() => signOut()}
                  className="p-2 rounded-lg hover:bg-surface/80 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </motion.div>
            ) : (
              <Link
                to="/auth"
                className="bg-primary text-secondary px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};