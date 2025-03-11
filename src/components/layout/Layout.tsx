import React from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { ThemeProvider } from './ThemeProvider';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background text-text">
        <Navbar />
        <div className="flex">
          <Sidebar />
          <AnimatePresence mode="wait">
            <motion.main
              key={location.pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="flex-1 p-8"
            >
              {children}
            </motion.main>
          </AnimatePresence>
        </div>
      </div>
    </ThemeProvider>
  );
};