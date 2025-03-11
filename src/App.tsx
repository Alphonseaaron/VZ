import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Toaster } from 'react-hot-toast';
import AuthForm from './components/auth/AuthForm';
import SlotMachine from './components/games/slots/SlotMachine';
import DiceGame from './components/games/dice/DiceGame';
import CrashGame from './components/games/crash/CrashGame';
import { useAuthStore } from './store/authStore';
import { Leaderboard } from './components/leaderboard/Leaderboard';
import { ChatSystem } from './components/chat/ChatSystem';
import { LoyaltySystem } from './components/rewards/LoyaltySystem';
import AdminDashboard from './pages/admin/Dashboard';
import UserManagement from './pages/admin/UserManagement';
import GameSettings from './pages/admin/GameSettings';

function App() {
  const { user } = useAuthStore();

  if (!user) {
    return (
      <div className="bg-background text-text">
        <AuthForm />
        <Toaster position="top-right" />
      </div>
    );
  }

  return (
    <Router>
      <Layout>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/" element={<SlotMachine />} />
          <Route path="/dice" element={<DiceGame />} />
          <Route path="/crash" element={<CrashGame />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<UserManagement />} />
          <Route path="/admin/settings" element={<GameSettings />} />
        </Routes>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <Leaderboard />
          <ChatSystem />
        </div>
        <div className="mt-8">
          <LoyaltySystem />
        </div>
      </Layout>
    </Router>
  );
}

export default App;