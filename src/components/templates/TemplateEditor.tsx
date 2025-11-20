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
  const { profile } = useAuth();
  
  const [template, setTemplate] = useState<any>(null);
  const [editableSections, setEditableSections] = useState<Array<{ id: string; label: string; type: 'text' | 'textarea'; defaultContent: string }>>([]);
  const [editedContent, setEditedContent] = useState<Record<string, string>>({});
  const [campaignName, setCampaignName] = useState('');
  const [subject, setSubject] = useState('');
  
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

  const handleSaveAndContinue = () => {
    if (!campaignName.trim()) {
      toast.error('Please enter a campaign name');
      return;
    }
    if (!subject.trim()) {
      toast.error('Please enter an email subject');
      return;
    }

    // Save to localStorage for now
    const campaignData = {
      name: campaignName,
      subject,
      templateId: template?.id,
      content: editedContent,
      htmlContent: generateFinalHtml()
    };
    
    localStorage.setItem('draft_campaign', JSON.stringify(campaignData));
    
    toast.success('Campaign draft saved!');
    
    // Navigate back to campaigns
    navigate('/app/campaigns');
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

  const mergeFields = template ? extractMergeFields(template.htmlContent) : [];
  const hasPersonalization = mergeFields.length > 0;

  if (!template) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-gold border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Loading template...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-black px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="secondary"
              size="sm"
              icon={ArrowLeft}
              onClick={() => navigate('/app/templates')}
            >
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-serif font-bold">{template.name}</h1>
              <p className="text-sm text-gray-600">{template.description}</p>
            </div>
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={handleSaveAndContinue}
          >
            Save Campaign Draft
          </Button>
        </div>
      </div>

      {/* Pro Plus Warning */}
      {hasPersonalization && !isPlusUser && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-3">
          <div className="flex items-center gap-3">
            <Lock size={20} className="text-amber-600" />
            <p className="text-sm text-amber-800">
              This template includes personalization fields ({mergeFields.join(', ')}). 
              <span className="font-semibold"> Upgrade to Pro Plus</span> to use these features.
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/app/settings?tab=billing')}
            >
              Upgrade
            </Button>
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Editor Form */}
        <div className="w-1/2 border-r border-gray-300 overflow-auto p-6 bg-white">
          <div className="space-y-6 max-w-2xl">
            {/* Campaign Details */}
            <div>
              <h2 className="text-lg font-serif font-bold mb-4">Campaign Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Campaign Name *
                  </label>
                  <input
                    type="text"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    className="input-base w-full"
                    placeholder="e.g., November Newsletter"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Email Subject *
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="input-base w-full"
                    placeholder="e.g., You won't believe what happened..."
                  />
                </div>
              </div>
            </div>

            {/* Editable Content */}
            {editableSections.length > 0 ? (
              <div>
                <h2 className="text-lg font-serif font-bold mb-4">Edit Content</h2>
                <div className="space-y-4">
                  {editableSections.map((section) => (
                    <div key={section.id}>
                      <label className="block text-sm font-medium mb-1">
                        {section.label}
                      </label>
                      {section.type === 'textarea' ? (
                        <textarea
                          value={editedContent[section.id] || ''}
                          onChange={(e) => handleContentChange(section.id, e.target.value)}
                          className="input-base w-full"
                          rows={4}
                          placeholder={`Enter ${section.label.toLowerCase()}...`}
                        />
                      ) : (
                        <input
                          type="text"
                          value={editedContent[section.id] || ''}
                          onChange={(e) => handleContentChange(section.id, e.target.value)}
                          className="input-base w-full"
                          placeholder={`Enter ${section.label.toLowerCase()}...`}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  This template has no editable sections. You can use it as-is or customize it by editing the HTML.
                </p>
              </div>
            )}

            {/* Personalization Info */}
            {hasPersonalization && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-purple-900 mb-2">
                  Personalization Fields
                </h3>
                <p className="text-sm text-purple-800 mb-2">
                  This template supports the following merge fields:
                </p>
                <div className="flex flex-wrap gap-2">
                  {mergeFields.map((field) => (
                    <span
                      key={field}
                      className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded"
                    >
                      {field}
                    </span>
                  ))}
                </div>
                {!isPlusUser && (
                  <p className="text-xs text-purple-600 mt-2">
                    * Upgrade to Pro Plus to use personalization features
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Live Preview */}
        <div className="w-1/2 overflow-auto p-6 bg-gray-100">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white border border-gray-300 rounded-lg overflow-hidden shadow-lg">
              <div className="bg-gray-200 px-4 py-2 border-b border-gray-300">
                <p className="text-sm font-semibold text-gray-700">Live Preview</p>
              </div>
              <div 
                className="p-6 overflow-auto"
                style={{ minHeight: '400px' }}
                dangerouslySetInnerHTML={{ __html: generateFinalHtml() }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};