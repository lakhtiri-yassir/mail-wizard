import { useState, useEffect } from 'react';
import { Plus, Mail, Send } from 'lucide-react';
import { AppLayout } from '../../components/app/AppLayout';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface Campaign {
  id: string;
  name: string;
  subject: string;
  content: { html: string };
  status: string;
  recipients_count: number;
  opens: number;
  clicks: number;
  sent_at: string | null;
  created_at: string;
}

export function Campaigns() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user) {
      fetchCampaigns();
    }
  }, [user]);

  const fetchCampaigns = async () => {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching campaigns:', error);
      toast.error('Failed to load campaigns');
    } else {
      setCampaigns(data || []);
    }
  };

  const handleSendCampaign = async (campaignId: string) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    if (!campaign) return;

    if (!confirm(`Send "${campaign.name}" to all contacts?`)) return;

    setSending(campaignId);
    const toastId = toast.loading('Sending campaign...');

    try {
      // Get all active contacts
      const { data: contacts, error: contactsError } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', user?.id)
        .eq('status', 'active');

      if (contactsError) throw contactsError;

      if (!contacts || contacts.length === 0) {
        throw new Error('No active contacts found');
      }

      // Call send-email Edge Function
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          campaign_id: campaign.id,
          from_email: user?.email,
          from_name: user?.user_metadata?.full_name || 'Mail Wizard',
          subject: campaign.subject,
          html_body: campaign.content.html,
          recipients: contacts.map(contact => ({
            email: contact.email,
            contact_id: contact.id,
            first_name: contact.first_name,
            last_name: contact.last_name
          }))
        }
      });

      if (error) throw error;

      toast.success(`Campaign sent to ${data.sent} recipient(s)!`, { id: toastId });
      fetchCampaigns();
    } catch (error: any) {
      console.error('Error sending campaign:', error);
      toast.error(error.message || 'Failed to send campaign', { id: toastId });
    } finally {
      setSending(null);
    }
  };

  const filteredCampaigns = campaigns.filter(campaign =>
    campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    campaign.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout currentPath="/app/campaigns">
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-serif font-bold mb-2">Campaigns</h1>
            <p className="text-gray-600">Create and manage your email campaigns.</p>
          </div>
          <Button
            variant="primary"
            size="md"
            icon={Plus}
            onClick={() => setShowCreateModal(true)}
          >
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

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading campaigns...</p>
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="card text-center py-12">
            <Mail size={48} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">No campaigns found</p>
            <p className="text-sm text-gray-500 mb-6">
              {searchQuery
                ? 'Try adjusting your search query'
                : 'Get started by creating your first campaign'}
            </p>
            {!searchQuery && (
              <Button variant="primary" size="md" onClick={() => setShowCreateModal(true)}>
                Create Your First Campaign
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredCampaigns.map((campaign) => (
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
                        <span className="font-semibold">{campaign.recipients_count.toLocaleString()}</span>
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
                  <div className="text-right">
                    <div className="text-sm text-gray-600 mb-2">
                      {new Date(campaign.created_at).toLocaleDateString()}
                    </div>
                    {campaign.status === 'draft' && (
                      <Button
                        variant="primary"
                        size="sm"
                        icon={Send}
                        onClick={() => handleSendCampaign(campaign.id)}
                        loading={sending === campaign.id}
                        disabled={sending !== null}
                      >
                        Send
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {showCreateModal && (
          <CreateCampaignModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={fetchCampaigns}
          />
        )}
      </div>
    </AppLayout>
  );
}

interface CreateCampaignModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const CreateCampaignModal = ({ onClose, onSuccess }: CreateCampaignModalProps) => {
  const { user } = useAuth();
  const [campaignName, setCampaignName] = useState('');
  const [subject, setSubject] = useState('');
  const [htmlBody, setHtmlBody] = useState('<p>Hello {{first_name}}!</p><p>This is your email content.</p>');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!campaignName.trim()) {
      setError('Please enter a campaign name');
      return;
    }
    if (!subject.trim()) {
      setError('Please enter a subject line');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error: insertError } = await supabase
        .from('campaigns')
        .insert({
          user_id: user?.id,
          name: campaignName,
          subject: subject,
          from_name: user?.user_metadata?.full_name || 'Mail Wizard',
          from_email: user?.email,
          content: { html: htmlBody },
          status: 'draft'
        });

      if (insertError) throw insertError;

      toast.success('Campaign created successfully!');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error creating campaign:', err);
      setError(err.message || 'Failed to create campaign');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="border-b border-black p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-serif font-bold">Create New Campaign</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-black">
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Campaign Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple focus:border-transparent"
                placeholder="e.g., Summer Newsletter 2025"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Subject Line <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple focus:border-transparent"
                placeholder="Hello {{first_name}}!"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Email Body (HTML)
              </label>
              <textarea
                value={htmlBody}
                onChange={(e) => setHtmlBody(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple focus:border-transparent font-mono text-sm"
                rows={12}
                placeholder="<p>Your email content here</p>"
              />
              <p className="text-xs text-gray-500 mt-1">
                Use {`{{first_name}}`} and {`{{last_name}}`} for personalization
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-black p-6 flex items-center justify-between bg-gray-50">
          <Button variant="tertiary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleCreate}
            loading={loading}
            disabled={loading}
          >
            Create Campaign Draft
          </Button>
        </div>
      </div>
    </div>
  );
};