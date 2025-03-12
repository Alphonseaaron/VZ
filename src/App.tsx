import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Toaster } from 'react-hot-toast';
import AuthForm from './components/auth/AuthForm';
import SlotMachine from './components/games/slots/SlotMachine';
import DiceGame from './components/games/dice/DiceGame';
import CrashGame from './components/games/crash/CrashGame';
import ChessGame from './components/games/chess/ChessGame';
import { useAuthStore } from './store/authStore';
import { Leaderboard } from './components/leaderboard/Leaderboard';
import { ChatSystem } from './components/chat/ChatSystem';
import { LoyaltySystem } from './components/rewards/LoyaltySystem';
import AdminDashboard from './pages/admin/Dashboard';
import UserManagement from './pages/admin/UserManagement';
import GameSettings from './pages/admin/GameSettings';
import Games from './pages/Games';

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
    <Layout>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<SlotMachine />} />
        <Route path="/dice" element={<DiceGame />} />
        <Route path="/crash" element={<CrashGame />} />
        <Route path="/chess" element={<ChessGame />} />
        <Route path="/games" element={<Games />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/chat" element={<ChatSystem />} />
        <Route path="/rewards" element={<LoyaltySystem />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<UserManagement />} />
        <Route path="/admin/settings" element={<GameSettings />} />
      </Routes>
    </Layout>
  );
}

export default App;