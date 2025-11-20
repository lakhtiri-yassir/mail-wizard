/**
 * UPDATED Templates Page Component
 * 
 * This version adds support for campaign creation mode.
 * 
 * INSTRUCTIONS:
 * 1. Open src/pages/app/Templates.tsx
 * 2. Replace the ENTIRE file content with this code
 * 3. This adds detection for createMode and changes UI/behavior accordingly
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FileText, Crown, Lock, ArrowLeft } from 'lucide-react';
import { AppLayout } from '../../components/app/AppLayout';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { EMAIL_TEMPLATES, extractMergeFields } from '../../data/emailTemplates';

const CATEGORIES = [
  { id: 'all', name: 'All Templates' },
  { id: 'marketing', name: 'Marketing' },
  { id: 'sales', name: 'Sales' },
  { id: 'newsletter', name: 'Newsletter' },
  { id: 'announcement', name: 'Announcement' }
];

export const Templates = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { profile } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Check if we're in campaign creation mode
  const isCreationMode = searchParams.get('createMode') === 'true';
  const campaignName = searchParams.get('name') || '';
  const campaignSubject = searchParams.get('subject') || '';

  const isPlusUser = profile?.plan_type === 'pro_plus';

  const filteredTemplates = selectedCategory === 'all'
    ? EMAIL_TEMPLATES
    : EMAIL_TEMPLATES.filter(t => t.category === selectedCategory);

  const handleUseTemplate = (templateId: string) => {
    if (isCreationMode) {
      // In creation mode, pass campaign context to template editor
      const params = new URLSearchParams({
        template: templateId,
        createMode: 'true',
        name: campaignName,
        subject: campaignSubject
      });
      navigate(`/app/template-editor?${params.toString()}`);
    } else {
      // Normal mode, just edit the template
      navigate(`/app/template-editor?template=${templateId}`);
    }
  };

  const handleCancelCreation = () => {
    navigate('/app/campaigns');
  };

  return (
    <AppLayout currentPath="/app/templates">
      <div className="p-8">
        {/* Creation Mode Banner */}
        {isCreationMode && (
          <div className="mb-6 bg-[#f3ba42] border-2 border-black rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg font-bold">Creating Campaign</span>
                </div>
                <div className="text-sm">
                  <span className="font-semibold">Name:</span> {campaignName} • 
                  <span className="font-semibold ml-2">Subject:</span> {campaignSubject}
                </div>
              </div>
              <Button
                variant="tertiary"
                icon={ArrowLeft}
                onClick={handleCancelCreation}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Regular Header */}
        {!isCreationMode && (
          <div className="mb-8">
            <h1 className="text-3xl font-serif font-bold mb-2">Email Templates</h1>
            <p className="text-gray-600">
              Choose from our professionally designed templates to create stunning emails.
            </p>
          </div>
        )}

        {/* Creation Mode Header */}
        {isCreationMode && (
          <div className="mb-8">
            <h1 className="text-3xl font-serif font-bold mb-2">Select a Template</h1>
            <p className="text-gray-600">
              Choose a template to customize for your campaign.
            </p>
          </div>
        )}

        {/* Category Filters */}
        <div className="mb-8">
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-6 py-2 rounded-full border transition-all duration-200 ${
                  selectedCategory === category.id
                    ? 'bg-[#f3ba42] text-black border-black font-semibold'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-black'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => {
            const hasPersonalization = template.supportsPersonalization;
            const isLocked = hasPersonalization && !isPlusUser;
            const mergeFields = hasPersonalization ? extractMergeFields(template.htmlContent) : [];

            return (
              <div
                key={template.id}
                className={`border-2 rounded-lg overflow-hidden transition-all hover:shadow-lg ${
                  isLocked ? 'opacity-60' : ''
                }`}
              >
                {/* Template Preview */}
                <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center border-b-2 border-black">
                  <FileText size={64} className="text-gray-400" />
                  
                  {hasPersonalization && (
                    <div className="absolute top-3 right-3">
                      {isPlusUser ? (
                        <div className="bg-[#f3ba42] text-black px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                          <Crown size={12} />
                          Personalization
                        </div>
                      ) : (
                        <div className="bg-gray-800 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                          <Lock size={12} />
                          Pro Plus
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Template Info */}
                <div className="p-4">
                  <h3 className="font-serif font-bold text-lg mb-1">{template.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                  
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                      {template.category}
                    </span>
                  </div>

                  {hasPersonalization && (
                    <div className="mb-3">
                      <p className="text-xs text-gray-600 mb-1">Merge Fields:</p>
                      <div className="flex flex-wrap gap-1">
                        {mergeFields.slice(0, 3).map((field) => (
                          <span key={field} className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
                            {field}
                          </span>
                        ))}
                        {mergeFields.length > 3 && (
                          <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                            +{mergeFields.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <Button
                    variant="primary"
                    onClick={() => handleUseTemplate(template.id)}
                    disabled={isLocked}
                    className="w-full"
                  >
                    {isCreationMode ? 'Select This Template' : 'Use Template'}
                  </Button>

                  {isLocked && (
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      Upgrade to Pro Plus to use personalization
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
};