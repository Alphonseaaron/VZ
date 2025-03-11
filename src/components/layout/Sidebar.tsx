import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useAdminStore } from '../../store/adminStore';
import { Gamepad2, Dice1 as Dice, Rocket, Coins, Trophy, MessageSquare, Gift, LayoutDashboard, Users, Settings } from 'lucide-react';

export const Sidebar = () => {
  const { isAdmin } = useAdminStore();

  const navItems = [
    { path: '/', icon: Coins, label: 'Slots' },
    { path: '/dice', icon: Dice, label: 'Dice' },
    { path: '/crash', icon: Rocket, label: 'Crash' },
    { path: '/games', icon: Gamepad2, label: 'All Games' },
    { path: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
    { path: '/chat', icon: MessageSquare, label: 'Chat' },
    { path: '/rewards', icon: Gift, label: 'Rewards' },
  ];

  const adminItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/users', icon: Users, label: 'Users' },
    { path: '/admin/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="w-64 bg-surface border-r border-border h-[calc(100vh-4rem)] sticky top-16">
      <nav className="p-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors
              ${isActive 
                ? 'bg-primary text-secondary' 
                : 'hover:bg-surface/80'
              }
            `}
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}

        {isAdmin && (
          <>
            <div className="border-t border-border my-4" />
            {adminItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `
                  flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors
                  ${isActive 
                    ? 'bg-primary text-secondary' 
                    : 'hover:bg-surface/80'
                  }
                `}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </>
        )}
      </nav>
    </div>
  );
};