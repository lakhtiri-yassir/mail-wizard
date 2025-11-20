import { useState } from 'react';
import { FileText, Eye, Sparkles, Lock, Crown } from 'lucide-react';
import { AppLayout } from '../../components/app/AppLayout';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { EMAIL_TEMPLATES, extractMergeFields } from '../../data/emailTemplates';
import { useNavigate } from 'react-router-dom';

export const Templates = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', name: 'All Templates' },
    { id: 'marketing', name: 'Marketing' },
    { id: 'sales', name: 'Sales' },
    { id: 'newsletter', name: 'Newsletter' },
    { id: 'announcement', name: 'Announcement' }
  ];

  const filteredTemplates = selectedCategory === 'all'
    ? EMAIL_TEMPLATES
    : EMAIL_TEMPLATES.filter(t => t.category === selectedCategory);

  const isPlusUser = profile?.plan_type === 'pro_plus';

  const handleUseTemplate = (templateId: string) => {
  navigate(`/app/templates/editor?template=${templateId}`);
  };

  return (
    <AppLayout currentPath="/app/templates">
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold mb-2">Email Templates</h1>
          <p className="text-gray-600">
            Choose from professionally designed templates to create your campaigns
          </p>
        </div>

        {!isPlusUser && (
          <div className="mb-6 p-6 bg-gradient-to-r from-[#57377d]/10 to-[#f3ba42]/10 border border-black rounded-lg">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-[#57377d] text-white rounded-full">
                <Crown size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-serif font-bold mb-2">
                  Unlock Personalized Templates with Pro Plus
                </h3>
                <p className="text-gray-700 mb-4">
                  Upgrade to Pro Plus to use merge fields for personalized emails with contact data like names, companies, and custom fields.
                </p>
                <Button
                  variant="primary"
                  onClick={() => navigate('/app/settings?tab=billing')}
                >
                  Upgrade to Pro Plus
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-full border transition-all duration-200 ${
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => {
            const hasPersonalization = template.supportsPersonalization;
            const isLocked = hasPersonalization && !isPlusUser;
            const mergeFields = hasPersonalization ? extractMergeFields(template.htmlContent) : [];

            return (
              <div
                key={template.id}
                className="bg-white border border-black rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200"
              >
                <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <FileText size={64} className="text-gray-400" />
                  {hasPersonalization && (
                    <div className="absolute top-3 right-3">
                      {isPlusUser ? (
                        <div className="flex items-center gap-1 px-3 py-1 bg-[#57377d] text-white rounded-full text-xs font-bold">
                          <Sparkles size={12} />
                          Personalized
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 px-3 py-1 bg-gray-800 text-white rounded-full text-xs font-bold">
                          <Lock size={12} />
                          Pro Plus
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-serif font-bold text-lg">{template.name}</h3>
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                      {template.category}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">{template.description}</p>

                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="s"
                      onClick={() => {
                        /* Preview modal would open here */
                      }}
                      icon={<Eye size={16} />}
                      className="flex-1"
                    >
                      Preview
                    </Button>
                    <Button
                      variant="primary"
                      size="s"
                      onClick={() => handleUseTemplate(template.id)}
                      disabled={isLocked}
                      className="flex-1"
                    >
                      {isLocked ? 'Upgrade to Use' : 'Use Template'}
                    </Button>
                  </div>

                  {hasPersonalization && mergeFields.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Sparkles size={12} />
                        Uses: {mergeFields.join(', ')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-20">
            <FileText size={48} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No templates found in this category.</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
};
