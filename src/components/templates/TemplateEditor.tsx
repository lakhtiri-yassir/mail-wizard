import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getTemplateById, extractMergeFields } from '../../data/emailTemplates';
import { Button } from '../ui/Button';
import { Lock, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

// Helper function to extract editable sections from HTML comments
function extractEditableSections(html: string): Array<{ id: string; label: string; type: 'text' | 'textarea'; defaultContent: string }> {
  const sections: Array<{ id: string; label: string; type: 'text' | 'textarea'; defaultContent: string }> = [];
  
  // Extract sections marked as {{EDITABLE:section_name}}
  const regex = /\{\{EDITABLE:(\w+)\}\}/g;
  let match;
  
  while ((match = regex.exec(html)) !== null) {
    const id = match[1];
    // Create a readable label from the ID
    const label = id.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
    
    // Determine if it should be textarea based on common patterns
    const isLongContent = id.includes('content') || id.includes('description') || id.includes('message') || id.includes('intro');
    
    sections.push({
      id,
      label,
      type: isLongContent ? 'textarea' : 'text',
      defaultContent: ''
    });
  }
  
  return sections;
}

export const TemplateEditor: React.FC = () => {
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get('template');
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  
  // Check if we're in campaign creation mode
  const isCreationMode = searchParams.get('createMode') === 'true';
  const prefilledName = searchParams.get('name') || '';
  const prefilledSubject = searchParams.get('subject') || '';
  
  const [template, setTemplate] = useState<any>(null);
  const [editableSections, setEditableSections] = useState<Array<{ id: string; label: string; type: 'text' | 'textarea'; defaultContent: string }>>([]);
  const [editedContent, setEditedContent] = useState<Record<string, string>>({});
  const [campaignName, setCampaignName] = useState(prefilledName);
  const [subject, setSubject] = useState(prefilledSubject);
  const [loading, setLoading] = useState(false);
  
  const isPlusUser = profile?.plan_type === 'pro_plus';

  useEffect(() => {
    if (templateId) {
      const foundTemplate = getTemplateById(templateId);
      if (foundTemplate) {
        setTemplate(foundTemplate);
        
        // Extract editable sections from the HTML
        const sections = extractEditableSections(foundTemplate.htmlContent);
        setEditableSections(sections);
        
        // Initialize with default content
        const defaults: Record<string, string> = {};
        sections.forEach(section => {
          defaults[section.id] = section.defaultContent;
        });
        setEditedContent(defaults);
      }
    }
  }, [templateId]);

  const handleContentChange = (sectionId: string, value: string) => {
    setEditedContent(prev => ({
      ...prev,
      [sectionId]: value
    }));
  };

  const generateFinalHtml = (): string => {
    if (!template) return '';
    
    let finalHtml = template.htmlContent;
    
    // Replace all {{EDITABLE:section_id}} with actual content
    editableSections.forEach(section => {
      const content = editedContent[section.id] || section.defaultContent || '[Content]';
      const regex = new RegExp(`\\{\\{EDITABLE:${section.id}\\}\\}`, 'g');
      finalHtml = finalHtml.replace(regex, content);
    });
    
    return finalHtml;
  };

  const handleSaveAndContinue = async () => {
    if (!campaignName.trim()) {
      toast.error('Please enter a campaign name');
      return;
    }
    if (!subject.trim()) {
      toast.error('Please enter an email subject');
      return;
    }

    if (isCreationMode) {
      // Create campaign in database
      setLoading(true);
      
      try {
        const { error: insertError } = await supabase
          .from('campaigns')
          .insert({
            user_id: user?.id,
            name: campaignName,
            subject: subject,
            template_id: template?.id,
            content: {
              html: generateFinalHtml()
            },
            status: 'draft',
            from_email: user?.email,
            from_name: 'Mail Wizard'
          });

        if (insertError) throw insertError;

        toast.success('Campaign draft created successfully!');
        navigate('/app/campaigns');
      } catch (err: any) {
        console.error('Error creating campaign:', err);
        toast.error(err.message || 'Failed to create campaign');
      } finally {
        setLoading(false);
      }
    } else {
      // Normal mode - save to localStorage
      const campaignData = {
        name: campaignName,
        subject,
        templateId: template?.id,
        content: editedContent,
        htmlContent: generateFinalHtml()
      };
      
      localStorage.setItem('draft_campaign', JSON.stringify(campaignData));
      
      toast.success('Campaign draft saved!');
      navigate('/app/campaigns');
    }
  };

  const mergeFields = template ? extractMergeFields(template.htmlContent) : [];

  if (!template) {
    return (
      <AppLayout currentPath="/app/templates">
        <div className="p-8">
          <div className="text-center py-12">
            <p className="text-gray-600">Loading template...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout currentPath="/app/templates">
      <div className="p-8 max-w-5xl mx-auto">
        {/* Breadcrumb */}
        {isCreationMode && (
          <div className="mb-4 text-sm text-gray-600">
            <span className="hover:text-black cursor-pointer" onClick={() => navigate('/app/campaigns')}>
              Campaigns
            </span>
            {' > '}
            <span className="hover:text-black cursor-pointer" onClick={() => navigate(-1)}>
              Select Template
            </span>
            {' > '}
            <span className="text-black font-semibold">Edit Template</span>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold mb-2">
            {isCreationMode ? 'Customize Template' : 'Edit Template'}
          </h1>
          <p className="text-gray-600">
            {isCreationMode 
              ? 'Fill in the content for your campaign email.' 
              : 'Customize this template and save it for your campaign.'}
          </p>
        </div>

        {/* Template Info Card */}
        <div className="bg-gray-50 border-2 border-black rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <FileText size={24} />
            <div>
              <h3 className="font-bold">{template.name}</h3>
              <p className="text-sm text-gray-600">{template.description}</p>
            </div>
          </div>
        </div>

        {/* Campaign Details */}
        <div className="bg-white border-2 border-black rounded-lg p-6 mb-6">
          <h2 className="text-xl font-serif font-bold mb-4">Campaign Details</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Campaign Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                disabled={isCreationMode}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#57377d] focus:border-transparent ${
                  isCreationMode ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
                placeholder="e.g., Summer Newsletter 2025"
              />
              {isCreationMode && (
                <p className="text-xs text-gray-500 mt-1">
                  Campaign name is set and cannot be changed here.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Subject Line <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={isCreationMode}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#57377d] focus:border-transparent ${
                  isCreationMode ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
                placeholder="Enter email subject line"
              />
              {isCreationMode && (
                <p className="text-xs text-gray-500 mt-1">
                  Subject line is set and cannot be changed here.
                </p>
              )}
              {template.supportsPersonalization && (
                <p className="text-xs text-gray-500 mt-1">
                  💡 You can use merge fields: {mergeFields.map(f => `{{${f}}}`).join(', ')}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Editable Sections */}
        <div className="bg-white border-2 border-black rounded-lg p-6 mb-6">
          <h2 className="text-xl font-serif font-bold mb-4">Email Content</h2>
          
          <div className="space-y-4">
            {editableSections.map((section) => (
              <div key={section.id}>
                <label className="block text-sm font-medium mb-2 capitalize">
                  {section.label}
                </label>
                {section.type === 'textarea' ? (
                  <textarea
                    value={editedContent[section.id] || ''}
                    onChange={(e) => handleContentChange(section.id, e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#57377d] focus:border-transparent"
                    rows={5}
                    placeholder={`Enter ${section.label.replace(/_/g, ' ')}`}
                  />
                ) : (
                  <input
                    type="text"
                    value={editedContent[section.id] || ''}
                    onChange={(e) => handleContentChange(section.id, e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#57377d] focus:border-transparent"
                    placeholder={`Enter ${section.label.replace(/_/g, ' ')}`}
                  />
                )}
              </div>
            ))}
          </div>

          {template.supportsPersonalization && !isPlusUser && (
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> This template supports personalization, but it requires a Pro Plus plan. 
                Merge fields will not be replaced for recipients.
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Button
            variant="tertiary"
            onClick={() => navigate(isCreationMode ? -1 : '/app/campaigns')}
          >
            {isCreationMode ? '← Back to Templates' : 'Cancel'}
          </Button>
          
          <Button
            variant="primary"
            onClick={handleSaveAndContinue}
            loading={loading}
            disabled={loading}
          >
            {isCreationMode ? 'Create Campaign Draft' : 'Save and Continue'}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
};