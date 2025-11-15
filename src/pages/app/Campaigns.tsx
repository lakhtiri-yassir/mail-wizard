import { useState } from 'react';
import { Mail, Plus, Search } from 'lucide-react';
import { AppLayout } from '../../components/app/AppLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

const mockCampaigns = [
  {
    id: '1',
    name: 'Summer Sale Newsletter',
    subject: '50% Off Everything',
    status: 'sent',
    sent: 2543,
    opens: 1076,
    clicks: 478,
    date: '2025-11-14',
  },
  {
    id: '2',
    name: 'Product Update',
    subject: 'New Features Just Launched',
    status: 'draft',
    sent: 0,
    opens: 0,
    clicks: 0,
    date: '2025-11-15',
  },
];

export const Campaigns = () => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <AppLayout currentPath="/app/campaigns">
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-serif font-bold mb-2">Campaigns</h1>
            <p className="text-gray-600">Create and manage your email campaigns.</p>
          </div>
          <Button variant="primary" size="md" icon={Plus}>
            Create Campaign
          </Button>
        </div>

        <div className="card mb-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search campaigns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select className="input-base w-auto">
              <option>All Status</option>
              <option>Draft</option>
              <option>Scheduled</option>
              <option>Sent</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {mockCampaigns.map((campaign) => (
            <div key={campaign.id} className="card hover:-translate-y-1 transition-all cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Mail className="text-gold" size={20} />
                    <h3 className="text-lg font-semibold">{campaign.name}</h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        campaign.status === 'sent'
                          ? 'bg-green-100 text-green-800'
                          : campaign.status === 'draft'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-gold/20 text-black'
                      }`}
                    >
                      {campaign.status}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-3">{campaign.subject}</p>
                  <div className="flex gap-6 text-sm">
                    <div>
                      <span className="text-gray-600">Sent: </span>
                      <span className="font-semibold">{campaign.sent.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Opens: </span>
                      <span className="font-semibold text-purple">{campaign.opens.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Clicks: </span>
                      <span className="font-semibold text-gold">{campaign.clicks.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right text-sm text-gray-600">{campaign.date}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};
