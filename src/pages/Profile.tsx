import React from 'react';
import { useAuthStore } from '../store/authStore';

const Profile = () => {
  const { user } = useAuthStore();

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">Please sign in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-gray-800 p-6 rounded-lg">
        <h1 className="text-2xl font-bold mb-4">Profile</h1>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-400">Email</label>
            <p className="text-lg">{user.email}</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-4">Game Statistics</h2>
        <p className="text-gray-400">Your gaming statistics will appear here.</p>
      </div>
    </div>
  );
};

export default Profile;