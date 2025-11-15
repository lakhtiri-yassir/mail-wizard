import { useState, useEffect } from 'react';
import { Users, Mail, TrendingUp, AlertCircle, Crown } from 'lucide-react';
import { AppLayout } from '../../components/app/AppLayout';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface UserData {
  id: string;
  email: string;
  full_name: string | null;
  plan_type: string;
  subscription_status: string;
  created_at: string;
}

export const AdminDashboard = () => {
  const { profile } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.is_admin) {
      fetchUsers();
    }
  }, [profile]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!profile?.is_admin) {
    return (
      <AppLayout currentPath="/admin">
        <div className="p-8 text-center py-20">
          <AlertCircle size={48} className="text-red-600 mx-auto mb-4" />
          <h1 className="text-2xl font-serif font-bold mb-2">Access Denied</h1>
          <p className="text-gray-600">You do not have permission to access this page.</p>
        </div>
      </AppLayout>
    );
  }

  const stats = [
    {
      label: 'Total Users',
      value: users.length.toLocaleString(),
      icon: Users,
      color: 'text-gold',
    },
    {
      label: 'Pro Users',
      value: users.filter((u) => u.plan_type === 'pro').length.toLocaleString(),
      icon: Crown,
      color: 'text-purple',
    },
    {
      label: 'Pro Plus Users',
      value: users.filter((u) => u.plan_type === 'pro_plus').length.toLocaleString(),
      icon: Crown,
      color: 'text-gold',
    },
    {
      label: 'Active Subscriptions',
      value: users.filter((u) => u.subscription_status === 'active' && u.plan_type !== 'free')
        .length.toLocaleString(),
      icon: TrendingUp,
      color: 'text-green-600',
    },
  ];

  return (
    <AppLayout currentPath="/admin">
      <div className="p-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Crown className="text-purple" size={32} />
            <h1 className="text-3xl font-serif font-bold">Admin Dashboard</h1>
          </div>
          <p className="text-gray-600">Platform overview and user management.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="card">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2 bg-gray-50 rounded-lg ${stat.color}`}>
                    <Icon size={24} />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                <p className="text-3xl font-serif font-bold">{stat.value}</p>
              </div>
            );
          })}
        </div>

        <div className="card">
          <h2 className="text-xl font-serif font-bold mb-6">All Users</h2>
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Loading users...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold">User</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold">Email</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold">Plan</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold">Status</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="font-medium">
                          {user.full_name || 'No name'}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-600">{user.email}</td>
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                            user.plan_type === 'pro_plus'
                              ? 'bg-purple text-white'
                              : user.plan_type === 'pro'
                              ? 'bg-gold text-black'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {user.plan_type.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                            user.subscription_status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {user.subscription_status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right text-sm text-gray-600">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};
