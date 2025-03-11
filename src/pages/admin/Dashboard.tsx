import React, { useEffect } from 'react';
import { useAdminStore } from '../../store/adminStore';
import { Card } from '../../components/ui/Card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, DollarSign, GamepadIcon, Activity } from 'lucide-react';
import { format } from 'date-fns';

export const AdminDashboard = () => {
  const { gameStats, fetchGameStats, loading } = useAdminStore();

  useEffect(() => {
    fetchGameStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const stats = [
    {
      title: 'Total Users',
      value: '1,234',
      icon: Users,
      change: '+12%',
    },
    {
      title: 'Total Revenue',
      value: '$45,678',
      icon: DollarSign,
      change: '+8%',
    },
    {
      title: 'Active Games',
      value: gameStats?.totalGames || 0,
      icon: GamepadIcon,
      change: '+15%',
    },
    {
      title: 'Win Rate',
      value: '48%',
      icon: Activity,
      change: '-3%',
    },
  ];

  const chartData = [
    { name: 'Mon', users: 400, revenue: 2400 },
    { name: 'Tue', users: 300, revenue: 1398 },
    { name: 'Wed', users: 500, revenue: 9800 },
    { name: 'Thu', users: 278, revenue: 3908 },
    { name: 'Fri', users: 189, revenue: 4800 },
    { name: 'Sat', users: 239, revenue: 3800 },
    { name: 'Sun', users: 349, revenue: 4300 },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <button
          onClick={() => fetchGameStats()}
          className="bg-primary text-secondary px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          Refresh Data
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text/60">{stat.title}</p>
                <p className="text-2xl font-bold mt-2">{stat.value}</p>
              </div>
              <stat.icon className="w-8 h-8 text-primary" />
            </div>
            <div className={`mt-4 text-sm ${
              stat.change.startsWith('+') ? 'text-green-500' : 'text-red-500'
            }`}>
              {stat.change} from last week
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Revenue Overview</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#FFD700" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {gameStats?.recentActivity?.map((activity: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-4 bg-surface/60 rounded-lg">
                <div>
                  <p className="font-medium">{activity.game_type}</p>
                  <p className="text-sm text-text/60">
                    {format(new Date(activity.created_at), 'PPp')}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  activity.status === 'completed' ? 'bg-green-500/10 text-green-500' : 'bg-primary/10 text-primary'
                }`}>
                  {activity.status}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;