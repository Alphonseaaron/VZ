import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { motion } from 'framer-motion';
import { Card } from '../ui/Card';
import Button from '../ui/Button';
import { Loader2, Mail, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { auth, db } from '../../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

const AuthForm = () => {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuthStore();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        await signIn(email, password);
        toast.success('Welcome back!');
      } else {
        const { user } = await signUp(email, password);
        // Create user profile in Firestore
        await setDoc(doc(db, 'profiles', user.uid), {
          email: email,
          createdAt: new Date(),
          balance: 1000, // Starting balance
          banned: false
        });
        toast.success('Account created successfully!');
      }
      navigate('/');
    } catch (err) {
      console.error('Auth error:', err);
      toast.error(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="relative overflow-hidden">
          {/* Animated gradient background */}
          <div className="absolute inset-0 gradient-animate opacity-10" />

          <div className="relative z-10">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">
                {isLogin ? 'Welcome Back!' : 'Create Account'}
              </h2>
              <p className="text-text/60">
                {isLogin
                  ? 'Enter your credentials to access your account'
                  : 'Sign up to start playing amazing games'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text/40" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-surface border border-border rounded-lg focus:outline-none focus:border-primary transition-colors"
                    placeholder="Email address"
                    required
                  />
                </div>

                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text/40" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-surface border border-border rounded-lg focus:outline-none focus:border-primary transition-colors"
                    placeholder="Password"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full py-3"
                disabled={loading}
                loading={loading}
              >
                {isLogin ? 'Sign In' : 'Create Account'}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-primary hover:text-primary/80 transition-colors"
                >
                  {isLogin
                    ? "Don't have an account? Sign Up"
                    : 'Already have an account? Sign In'}
                </button>
              </div>
            </form>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default AuthForm;