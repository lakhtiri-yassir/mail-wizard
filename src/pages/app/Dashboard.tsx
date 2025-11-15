import { TrendingUp, Mail, Users, MousePointer, MailOpen } from 'lucide-react';
import { AppLayout } from '../../components/app/AppLayout';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';

const stats = [
  {
    name: 'Total Sent',
    value: '12,543',
    change: '+12.5%',
    trend: 'up',
    icon: Mail,
    color: 'text-gold',
  },
  {
    name: 'Open Rate',
    value: '42.3%',
    change: '+2.1%',
    trend: 'up',
    icon: MailOpen,
    color: 'text-purple',
  },
  {
    name: 'Click Rate',
    value: '18.7%',
    change: '+4.2%',
    trend: 'up',
    icon: MousePointer,
    color: 'text-gold',
  },
  {
    name: 'Active Contacts',
    value: '2,847',
    change: '+156',
    trend: 'up',
    icon: Users,
    color: 'text-purple',
  },
];

const recentCampaigns = [
  { name: 'Summer Sale Newsletter', sent: '2,543', opens: '1,076', clicks: '478', date: '2 hours ago' },
  { name: 'Product Update', sent: '1,234', opens: '523', clicks: '189', date: '1 day ago' },
  { name: 'Welcome Series #1', sent: '456', opens: '234', clicks: '98', date: '2 days ago' },
];

export const Dashboard = () => {
  const { profile } = useAuth();

  return (
    <AppLayout currentPath="/app">
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold mb-2">
            Welcome back, {profile?.full_name || 'there'}
          </h1>
          <p className="text-gray-600">Here's what's happening with your email campaigns today.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.name} className="card">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2 bg-gray-50 rounded-lg ${stat.color}`}>
                    <Icon size={24} />
                  </div>
                  <div
                    className={`text-sm font-semibold ${
                      stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {stat.change}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.name}</p>
                  <p className="text-3xl font-serif font-bold">{stat.value}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-serif font-bold">Performance Overview</h2>
              <select className="input-base w-auto">
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>Last 90 days</option>
              </select>
            </div>
            <div className="h-64 flex items-center justify-center border border-black rounded-lg bg-gradient-to-br from-purple/5 to-gold/5">
              <div className="text-center">
                <TrendingUp size={48} className="text-gold mx-auto mb-4" />
                <p className="text-gray-600">Chart visualization placeholder</p>
                <p className="text-sm text-gray-500 mt-2">Opens and clicks over time</p>
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="text-xl font-serif font-bold mb-6">Quick Actions</h2>
            <div className="space-y-3">
              <Button variant="primary" size="md" fullWidth icon={Mail}>
                Create Campaign
              </Button>
              <Button variant="secondary" size="md" fullWidth icon={Users}>
                Add Contacts
              </Button>
              <Button variant="secondary" size="md" fullWidth>
                View Analytics
              </Button>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-semibold mb-3">Your Plan</h3>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="font-semibold mb-1">
                  {profile?.plan_type.replace('_', ' ').toUpperCase()}
                </p>
                <p className="text-sm text-gray-600 mb-3">
                  {profile?.plan_type === 'free' && '500 emails/month remaining'}
                  {profile?.plan_type === 'pro' && '24,543 emails sent this month'}
                  {profile?.plan_type === 'pro_plus' && 'Unlimited emails'}
                </p>
                {profile?.plan_type === 'free' && (
                  <Button variant="primary" size="sm" fullWidth>
                    Upgrade to Pro
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-serif font-bold mb-6">Recent Campaigns</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold">Campaign</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold">Sent</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold">Opens</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold">Clicks</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentCampaigns.map((campaign, index) => (
                  <tr
                    key={index}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-4 px-4 font-medium">{campaign.name}</td>
                    <td className="py-4 px-4 text-right">{campaign.sent}</td>
                    <td className="py-4 px-4 text-right text-purple font-semibold">
                      {campaign.opens}
                    </td>
                    <td className="py-4 px-4 text-right text-gold font-semibold">
                      {campaign.clicks}
                    </td>
                    <td className="py-4 px-4 text-right text-gray-600 text-sm">{campaign.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};
