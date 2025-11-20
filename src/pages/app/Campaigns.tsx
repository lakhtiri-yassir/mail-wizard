import { useState, useEffect } from 'react';
import { Mail, Plus, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../../components/app/AppLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { TemplateSelector } from '../../components/campaigns/TemplateSelector';
import { RecipientSelector } from '../../components/campaigns/RecipientSelector';
import { EMAIL_TEMPLATES, extractEditableSections, extractMergeFields } from '../../data/emailTemplates';
import { replaceEditableSections } from '../../utils/mergeFieldReplacer';

interface Campaign {
  id: string;
  name: string;
  subject: string;
  content: any;
  status: string;
  recipients_count: number;
  opens: number;
  clicks: number;
  created_at: string;
}

export const Campaigns = () => {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  const [createStep, setCreateStep] = useState<'template' | 'editor' | 'recipients' | 'review'>('template');

  useEffect(() => {
    if (user) {
      fetchCampaigns();
    }
  }, [user]);

  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error: any) {
      console.error('Error fetching campaigns:', error);
      toast.error(error.message || 'Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const filteredCampaigns = campaigns.filter((campaign) =>
    campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    campaign.subject?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendCampaign = async (campaignId: string) => {
    if (!confirm('Are you sure you want to send this campaign to all contacts?')) return;

    setSending(campaignId);
    const toastId = toast.loading('Preparing to send campaign...');

    try {
      const campaign = campaigns.find(c => c.id === campaignId);
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      toast.loading('Fetching contacts...', { id: toastId });
      const { data: contacts, error: contactsError } = await supabase
        .from('contacts')
        .select('id, email, first_name, last_name')
        .eq('status', 'active');

      if (contactsError) throw contactsError;

      if (!contacts || contacts.length === 0) {
        toast.error('No active contacts found', { id: toastId });
        return;
      }

      toast.loading(`Sending to ${contacts.length} recipients...`, { id: toastId });
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error('Not authenticated');
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          campaign_id: campaignId,
          from_email: user?.email || 'hello@mailwizard.com',
          from_name: user?.user_metadata?.full_name || 'Mail Wizard',
          subject: campaign.subject,
          html_body: campaign.content?.html || '',
          recipients: contacts.map(c => ({
            email: c.email,
            contact_id: c.id,
            first_name: c.first_name || '',
            last_name: c.last_name || ''
          })),
          track_opens: true,
          track_clicks: true
        })
      });

      if (!response.ok) {
        const error = await response.json();
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again in a few minutes.');
        }
        throw new Error(error.message || error.error || 'Failed to send campaign');
      }

      const data = await response.json();
      await fetchCampaigns();

      toast.success(`Campaign sent to ${data.sent} recipients!`, { id: toastId });
    } catch (error: any) {
      console.error('Send error:', error);
      toast.error(error.message || 'Failed to send campaign', { id: toastId });
    } finally {
      setSending(null);
    }
  };

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
};

interface CreateCampaignModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const CreateCampaignModal = ({ onClose, onSuccess }: CreateCampaignModalProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Form state
  const [campaignName, setCampaignName] = useState('');
  const [subject, setSubject] = useState('');
  const [contentChoice, setContentChoice] = useState<'template' | 'custom'>('template');
  const [customHtml, setCustomHtml] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleBrowseTemplates = () => {
    if (!campaignName.trim()) {
      setError('Please enter a campaign name');
      return;
    }
    if (!subject.trim()) {
      setError('Please enter a subject line');
      return;
    }

    // Navigate to templates page with campaign context
    const params = new URLSearchParams({
      createMode: 'true',
      name: campaignName,
      subject: subject
    });
    navigate(`/app/templates?${params.toString()}`);
    onClose();
  };

  const handleCreateWithCustomHtml = async () => {
    if (!campaignName.trim()) {
      setError('Please enter a campaign name');
      return;
    }
    if (!subject.trim()) {
      setError('Please enter a subject line');
      return;
    }
    if (!customHtml.trim()) {
      setError('Please enter HTML content');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create draft campaign with custom HTML
      const { error: insertError } = await supabase
        .from('campaigns')
        .insert({
          user_id: user?.id,
          name: campaignName,
          subject: subject,
          content: {
            html: customHtml
          },
          status: 'draft',
          from_email: user?.email,
          from_name: 'Mail Wizard'
        });

      if (insertError) throw insertError;

      toast.success('Campaign draft created successfully!');
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
        {/* Header */}
        <div className="border-b border-black">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-serif font-bold">Create New Campaign</h2>
              <button onClick={onClose} className="text-gray-500 hover:text-black">
                ✕
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="space-y-6">
            {/* Campaign Name */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Campaign Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#57377d] focus:border-transparent"
                placeholder="e.g., Summer Newsletter 2025"
              />
            </div>

            {/* Subject Line */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Subject Line <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#57377d] focus:border-transparent"
                placeholder="Enter email subject line"
              />
            </div>

            {/* Content Choice */}
            <div>
              <label className="block text-sm font-medium mb-3">
                Email Content <span className="text-red-500">*</span>
              </label>
              
              <div className="space-y-3">
                {/* Template Option */}
                <label className="flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-[#f3ba42]">
                  <input
                    type="radio"
                    name="contentChoice"
                    value="template"
                    checked={contentChoice === 'template'}
                    onChange={(e) => setContentChoice(e.target.value as 'template')}
                    className="mt-1 mr-3"
                  />
                  <div className="flex-1">
                    <div className="font-semibold mb-1">Choose from Available Templates</div>
                    <div className="text-sm text-gray-600">
                      Browse our professionally designed templates and customize them to fit your brand.
                    </div>
                  </div>
                </label>

                {/* Custom HTML Option */}
                <label className="flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-[#f3ba42]">
                  <input
                    type="radio"
                    name="contentChoice"
                    value="custom"
                    checked={contentChoice === 'custom'}
                    onChange={(e) => setContentChoice(e.target.value as 'custom')}
                    className="mt-1 mr-3"
                  />
                  <div className="flex-1">
                    <div className="font-semibold mb-1">Enter Custom HTML</div>
                    <div className="text-sm text-gray-600">
                      Paste your own HTML code for complete design control.
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Custom HTML Textarea (conditional) */}
            {contentChoice === 'custom' && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  HTML Content <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={customHtml}
                  onChange={(e) => setCustomHtml(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#57377d] focus:border-transparent font-mono text-sm"
                  rows={12}
                  placeholder="Paste your HTML code here..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Paste complete HTML including &lt;html&gt;, &lt;head&gt;, and &lt;body&gt; tags.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-black p-6 flex items-center justify-between bg-gray-50">
          <Button variant="tertiary" onClick={onClose}>
            Cancel
          </Button>
          
          {contentChoice === 'template' ? (
            <Button 
              variant="primary" 
              onClick={handleBrowseTemplates}
            >
              Browse Templates →
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handleCreateWithCustomHtml}
              loading={loading}
              disabled={loading}
            >
              Create Campaign Draft
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};