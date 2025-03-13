import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuthStore } from '../../store/authStore';
import { Card } from '../ui/Card';
import Button from '../ui/Button';
import { Send, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { ErrorMessage } from '../ui/ErrorMessage';
import { soundManager } from '../../lib/sounds';

interface Message {
  id: string;
  userId: string;
  message: string;
  createdAt: any;
  username: string;
}

export const ChatSystem: React.FC = () => {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    
    const messagesQuery = query(
      collection(db, 'chat_messages'),
      orderBy('created_at', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const newMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(newMessages.reverse());
      soundManager.play('click');
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    setLoading(true);
    setError(null);

    try {
      await addDoc(collection(db, 'chat_messages'), {
        userId: user.uid,
        username: user.displayName || 'Anonymous',
        message: newMessage.trim(),
        createdAt: serverTimestamp()
      });

      setNewMessage('');
      soundManager.play('click');
    } catch (error) {
      setError('Failed to send message');
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && messages.length === 0) {
    return (
      <Card className="flex items-center justify-center h-[500px]">
        <LoadingSpinner size="lg" />
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-[500px]">
      <div className="flex items-center space-x-2 mb-4">
        <MessageSquare className="w-6 h-6 text-primary" />
        <h2 className="text-xl font-bold">Chat</h2>
      </div>

      {error && <ErrorMessage message={error} className="mb-4" />}

      <div className="flex-1 overflow-y-auto mb-4 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`flex flex-col ${
                message.userId === user?.uid ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.userId === user?.uid
                    ? 'bg-primary text-secondary'
                    : 'bg-surface'
                }`}
              >
                <div className="font-medium text-sm mb-1">
                  {message.username}
                </div>
                <div>{message.message}</div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="flex space-x-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2 bg-surface border border-border rounded-lg focus:outline-none focus:border-primary transition-colors"
          disabled={loading}
        />
        <Button type="submit" disabled={loading || !newMessage.trim()}>
          <Send className="w-5 h-5" />
        </Button>
      </form>
    </Card>
  );
};