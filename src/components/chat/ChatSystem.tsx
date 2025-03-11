import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
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
  user_id: string;
  message: string;
  created_at: string;
  profiles: {
    username: string;
  };
}

export const ChatSystem: React.FC = () => {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
    subscribeToMessages();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          id,
          user_id,
          message,
          created_at,
          profiles (username)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setMessages(data.reverse());
    } catch (error) {
      setError('Failed to load messages');
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel('chat_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
        },
        async (payload) => {
          const { data: message, error } = await supabase
            .from('chat_messages')
            .select(`
              id,
              user_id,
              message,
              created_at,
              profiles (username)
            `)
            .eq('id', payload.new.id)
            .single();

          if (!error && message) {
            setMessages((prev) => [...prev, message]);
            soundManager.play('click');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.from('chat_messages').insert({
        user_id: user.id,
        message: newMessage.trim(),
      });

      if (error) throw error;
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
                message.user_id === user?.id ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.user_id === user?.id
                    ? 'bg-primary text-secondary'
                    : 'bg-surface'
                }`}
              >
                <div className="font-medium text-sm mb-1">
                  {message.profiles.username}
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