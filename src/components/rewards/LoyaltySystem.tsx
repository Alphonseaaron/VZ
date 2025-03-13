import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, addDoc, runTransaction, doc } from 'firebase/firestore';
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
      if (!user) return;

      const profileQuery = query(
        collection(db, 'profiles'),
        where('id', '==', user.uid)
      );
      const snapshot = await getDocs(profileQuery);
      
      if (snapshot.docs[0]) {
        setPoints(snapshot.docs[0].data().loyalty_points || 0);
      }
    } catch (error) {
      console.error('Error fetching points:', error);
    }
  };

  const fetchRewards = async () => {
    try {
      const rewardsQuery = query(collection(db, 'rewards'));
      const snapshot = await getDocs(rewardsQuery);
      
      const rewardsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Reward[];
      
      setRewards(rewardsData);
    } catch (error) {
      console.error('Error fetching rewards:', error);
    }
  };

  const claimReward = async (reward: Reward) => {
    if (!user || points < reward.points_required) return;

    setLoading(true);
    try {
      await runTransaction(db, async (transaction) => {
        // Get user profile
        const profileRef = doc(db, 'profiles', user.uid);
        const profileSnap = await transaction.get(profileRef);
        
        if (!profileSnap.exists()) {
          throw new Error('User profile not found');
        }

        const currentPoints = profileSnap.data().loyalty_points || 0;
        
        if (currentPoints < reward.points_required) {
          throw new Error('Insufficient points');
        }

        // Update points
        transaction.update(profileRef, {
          loyalty_points: currentPoints - reward.points_required
        });

        // Record reward claim
        const claimRef = collection(db, 'reward_claims');
        transaction.set(doc(claimRef), {
          user_id: user.uid,
          reward_id: reward.id,
          claimed_at: new Date(),
          points_spent: reward.points_required
        });
      });

      await fetchPoints();
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