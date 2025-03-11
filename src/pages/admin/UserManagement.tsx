import React, { useEffect, useState } from 'react';
import { useAdminStore } from '../../store/adminStore';
import { Card } from '../../components/ui/Card';
import { Ban, CheckCircle, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export const UserManagement = () => {
  const { users, loading, error, fetchUsers, banUser, unbanUser } = useAdminStore();
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(search.toLowerCase()) ||
    user.email?.toLowerCase().includes(search.toLowerCase())
  );

  const handleBanUser = async (userId: string) => {
    try {
      await banUser(userId);
      toast.success('User banned successfully');
    } catch (error) {
      toast.error('Failed to ban user');
    }
  };

  const handleUnbanUser = async (userId: string) => {
    try {
      await unbanUser(userId);
      toast.success('User unbanned successfully');
    } catch (error) {
      toast.error('Failed to unban user');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center py-8">
        Error loading users: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">User Management</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text/40" />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 bg-surface border border-border rounded-lg focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-surface/60">
                <th className="px-6 py-3 text-left text-sm font-medium">Username</th>
                <th className="px-6 py-3 text-left text-sm font-medium">Balance</th>
                <th className="px-6 py-3 text-left text-sm font-medium">Joined</th>
                <th className="px-6 py-3 text-left text-sm font-medium">Status</th>
                <th className="px-6 py-3 text-left text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers.map((user) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-surface/40 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium">{user.username}</div>
                        <div className="text-sm text-text/60">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">${user.balance?.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      user.banned
                        ? 'bg-red-500/10 text-red-500'
                        : 'bg-green-500/10 text-green-500'
                    }`}>
                      {user.banned ? 'Banned' : 'Active'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {user.banned ? (
                      <button
                        onClick={() => handleUnbanUser(user.id)}
                        className="flex items-center space-x-1 text-green-500 hover:text-green-600"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Unban</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleBanUser(user.id)}
                        className="flex items-center space-x-1 text-red-500 hover:text-red-600"
                      >
                        <Ban className="w-4 h-4" />
                        <span>Ban</span>
                      </button>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default UserManagement;