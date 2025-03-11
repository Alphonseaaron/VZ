import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import AuthForm from './components/auth/AuthForm';
import SlotMachine from './components/games/slots/SlotMachine';
import DiceGame from './components/games/dice/DiceGame';
import CrashGame from './components/games/crash/CrashGame';
import { useAuthStore } from './store/authStore';
import { useTheme } from './hooks/useTheme';
import { Wallet, LogOut, Sun, Moon } from 'lucide-react';

function App() {
  const { user, signOut } = useAuthStore();
  const { theme, toggleTheme } = useTheme();

  if (!user) {
    return <AuthForm />;
  }

  return (
    <Router>
      <div className={`min-h-screen transition-colors duration-200 ${
        theme === 'dark' 
          ? 'bg-gray-900 text-gray-100' 
          : 'bg-gray-50 text-gray-900'
      }`}>
        <nav className={`${
          theme === 'dark' 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
          } border-b sticky top-0 z-50`}>
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-8">
                <NavLink 
                  to="/" 
                  className={({ isActive }) => `
                    text-lg font-medium transition-colors duration-200
                    ${theme === 'dark'
                      ? isActive ? 'text-indigo-400' : 'text-gray-300 hover:text-white'
                      : isActive ? 'text-indigo-600' : 'text-gray-700 hover:text-gray-900'
                    }
                  `}
                >
                  Slots
                </NavLink>
                <NavLink 
                  to="/dice" 
                  className={({ isActive }) => `
                    text-lg font-medium transition-colors duration-200
                    ${theme === 'dark'
                      ? isActive ? 'text-indigo-400' : 'text-gray-300 hover:text-white'
                      : isActive ? 'text-indigo-600' : 'text-gray-700 hover:text-gray-900'
                    }
                  `}
                >
                  Dice
                </NavLink>
                <NavLink 
                  to="/crash" 
                  className={({ isActive }) => `
                    text-lg font-medium transition-colors duration-200
                    ${theme === 'dark'
                      ? isActive ? 'text-indigo-400' : 'text-gray-300 hover:text-white'
                      : isActive ? 'text-indigo-600' : 'text-gray-700 hover:text-gray-900'
                    }
                  `}
                >
                  Crash
                </NavLink>
              </div>
              
              <div className="flex items-center space-x-6">
                <div className={`
                  flex items-center px-4 py-2 rounded-lg
                  ${theme === 'dark' 
                    ? 'bg-gray-700' 
                    : 'bg-gray-100'
                  }
                `}>
                  <Wallet className="w-5 h-5 mr-2" />
                  <span className="font-medium">$1000.00</span>
                </div>
                
                <button
                  onClick={toggleTheme}
                  className={`
                    p-2 rounded-lg transition-colors duration-200
                    ${theme === 'dark'
                      ? 'hover:bg-gray-700'
                      : 'hover:bg-gray-200'
                    }
                  `}
                >
                  {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
                
                <button
                  onClick={signOut}
                  className={`
                    p-2 rounded-lg transition-colors duration-200
                    ${theme === 'dark'
                      ? 'hover:bg-gray-700'
                      : 'hover:bg-gray-200'
                    }
                  `}
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </nav>

        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<SlotMachine />} />
            <Route path="/dice" element={<DiceGame />} />
            <Route path="/crash" element={<CrashGame />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;