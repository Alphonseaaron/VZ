import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { Card } from '../ui/Card';
import Button from '../ui/Button';
import { Gift, Star, Award } from 'lucide-react';
import { motion } from 'framer-motion';

interface Reward {
  id: string;
  name: string;
  description: string;
  points_required: number;
  icon: keyof typeof rewardIcons;
}

const rewardIcons = {
  bonus: Gift,
  multiplier: Star,
  special: Award,
};

export const LoyaltySystem: React.FC = () => {
  const { user } = useAuthStore();
  const [points, setPoints] = useState(0);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchPoints();
      fetchRewards();
    }
  }, [user]);

  const fetchPoints = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('loyalty_points')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      setPoints(data.loyalty_points || 0);
    } catch (error) {
      console.error('Error fetching points:', error);
    }
  };

  const fetchRewards = async () => {
    try {
      const { data, error } = await supabase
        .from('rewards')
        .select('*')
        .order('points_required', { ascending: true });

      if (error) throw error;
      setRewards(data);
    } catch (error) {
      console.error('Error fetching rewards:', error);
    }
  };

  const claimReward = async (reward: Reward) => {
    if (points < reward.points_required) return;

    setLoading(true);
    try {
      const { error } = await supabase.rpc('claim_reward', {
        p_reward_id: reward.id,
        p_user_id: user?.id
      });

      if (error) throw error;
      await fetchPoints();
      // Show success message or trigger reward animation
    } catch (error) {
      console.error('Error claiming reward:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Award className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold">Loyalty Rewards</h2>
        </div>
        <div className="flex items-center space-x-2">
          <Star className="w-5 h-5 text-primary" />
          <span className="font-bold">{points} Points</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rewards.map((reward) => {
          const Icon = rewardIcons[reward.icon];
          const isAvailable = points >= reward.points_required;

          return (
            <motion.div
              key={reward.id}
              whileHover={{ scale: 1.02 }}
              className={`p-4 rounded-lg border ${
                isAvailable
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-surface'
              }`}
            >
              <div className="flex items-center space-x-3 mb-3">
                <Icon className={`w-6 h-6 ${isAvailable ? 'text-primary' : 'text-text/40'}`} />
                <h3 className="font-bold">{reward.name}</h3>
              </div>
              <p className="text-sm text-text/60 mb-4">{reward.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {reward.points_required} points
                </span>
                <Button
                  size="sm"
                  variant={isAvailable ? 'primary' : 'secondary'}
                  disabled={!isAvailable || loading}
                  onClick={() => claimReward(reward)}
                >
                  {isAvailable ? 'Claim' : 'Locked'}
                </Button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </Card>
  );
};