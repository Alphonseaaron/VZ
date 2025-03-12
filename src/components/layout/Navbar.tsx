import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useAdminStore } from '../../store/adminStore';
import { TowerControl, User, LogOut, Settings, Users, LayoutDashboard } from 'lucide-react';
import { WalletDisplay } from '../wallet/WalletDisplay';
import { motion } from 'framer-motion';

export const Navbar = () => {
  const { user, signOut } = useAuthStore();
  const { isAdmin } = useAdminStore();
  const location = useLocation();

  const adminLinks = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/users', icon: Users, label: 'Users' },
    { path: '/admin/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <nav className="glass-effect sticky top-0 z-50 border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 360 }}
              transition={{ duration: 0.5 }}
            >
              <TowerControl className="w-8 h-8 text-primary neon-text" />
            </motion.div>
            <span className="text-xl font-bold neon-text">VZ Gaming</span>
          </Link>

          <div className="flex items-center space-x-6">
            {isAdmin && (
              <div className="flex items-center space-x-4">
                {adminLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-all ${
                      location.pathname === link.path
                        ? 'bg-primary/20 text-primary neon-text'
                        : 'hover:bg-surface/80'
                    }`}
                  >
                    <link.icon className="w-4 h-4" />
                    <span>{link.label}</span>
                  </Link>
                ))}
              </div>
            )}

            {user && <WalletDisplay />}

            {user ? (
              <motion.div className="flex items-center space-x-4" layout>
                <Link
                  to="/profile"
                  className="p-2 rounded-lg hover:bg-surface/80 transition-all hover:neon-border"
                >
                  <User className="w-5 h-5" />
                </Link>
                <button
                  onClick={() => signOut()}
                  className="p-2 rounded-lg hover:bg-surface/80 transition-all hover:neon-border"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </motion.div>
            ) : (
              <Link
                to="/auth"
                className="bg-primary text-background px-4 py-2 rounded-lg hover:neon-border transition-all"
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