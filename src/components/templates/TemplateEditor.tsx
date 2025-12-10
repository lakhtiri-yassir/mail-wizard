import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X, Eye, Settings as SettingsIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import SectionEditor from './SectionEditor';
import type { Section } from './SectionEditor';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { EMAIL_TEMPLATES } from '../../data/emailTemplates';
import toast from 'react-hot-toast';

interface TemplateEditorProps {
  mode?: 'create' | 'edit';
  existingTemplate?: any;
  onSave?: (sections: Section[], settings: any, html: string) => void;
  onCancel?: () => void;
}

interface EmailSettings {
  companyName: string;
  backgroundColor: string;
  textColor: string;
  linkColor: string;
  fontFamily: string;
}

export default function TemplateEditor({
  mode = 'create',
  existingTemplate,
  onSave,
  onCancel,
}: TemplateEditorProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [sections, setSections] = useState<Section[]>([]);
  const [emailSettings, setEmailSettings] = useState<EmailSettings>({
    companyName: 'Your Company',
    backgroundColor: '#F5F5F5',
    textColor: '#333333',
    linkColor: '#f3ba42',
    fontFamily: 'DM Sans, sans-serif',
  });

  const [templateName, setTemplateName] = useState(existingTemplate?.name || 'New Template');
  const [templateCategory, setTemplateCategory] = useState(existingTemplate?.category || 'custom');
  const [templateDescription, setTemplateDescription] = useState(existingTemplate?.description || '');
  const [settingsExpanded, setSettingsExpanded] = useState(true);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);

  useEffect(() => {
    if (mode === 'edit' && existingTemplate) {
      if (existingTemplate.content?.sections) {
        setSections(existingTemplate.content.sections);
      }
      if (existingTemplate.content?.settings) {
        setEmailSettings((prev) => ({
          ...prev,
          ...existingTemplate.content.settings,
        }));
      }
      setTemplateName(existingTemplate.name);
      setTemplateCategory(existingTemplate.category || 'custom');
      setTemplateDescription(existingTemplate.description || '');
    }
  }, [mode, existingTemplate]);

  // Refresh preview when sections or settings change
  useEffect(() => {
    setPreviewKey(prev => prev + 1);
  }, [sections, emailSettings]);

  function generateEmailHTML(): string {
    let sectionsHTML = '';
    
    sections.forEach(section => {
      switch (section.type) {
        case 'header':
          sectionsHTML += `
            <tr>
              <td style="padding: 40px 40px 20px 40px; text-align: center;">
                <h1 style="margin: 0 0 10px 0; color: ${emailSettings.textColor}; font-size: 32px; font-weight: bold; font-family: ${emailSettings.fontFamily};">
                  ${section.content.title || ''}
                </h1>
                ${section.content.subtitle ? `
                <p style="margin: 0; color: ${emailSettings.textColor}; font-size: 18px; font-family: ${emailSettings.fontFamily};">
                  ${section.content.subtitle}
                </p>
                ` : ''}
              </td>
            </tr>`;
          break;

        case 'text':
          const textContent = (section.content.text || '').replace(/\n/g, '<br>');
          sectionsHTML += `
            <tr>
              <td style="padding: 20px 40px;">
                <div style="color: ${emailSettings.textColor}; font-size: 16px; line-height: 1.6; font-family: ${emailSettings.fontFamily};">
                  ${textContent}
                </div>
              </td>
            </tr>`;
          break;

        case 'image':
          sectionsHTML += `
            <tr>
              <td style="padding: 20px 40px; text-align: center;">
                ${section.content.imageUrl ? `
                <img src="${section.content.imageUrl}" alt="${section.content.altText || ''}" style="max-width: 100%; height: auto; border-radius: 8px;">
                ` : `
                <div style="width: 100%; height: 200px; background-color: #e5e5e5; display: flex; align-items: center; justify-content: center; border-radius: 8px; color: #999;">
                  No image uploaded
                </div>
                `}
                ${section.content.caption ? `
                <p style="margin: 10px 0 0 0; color: ${emailSettings.textColor}; font-size: 14px; font-family: ${emailSettings.fontFamily};">
                  ${section.content.caption}
                </p>
                ` : ''}
              </td>
            </tr>`;
          break;

        case 'button':
          sectionsHTML += `
            <tr>
              <td style="padding: 20px 40px; text-align: ${section.content.alignment || 'center'};">
                <a href="${section.content.url || '#'}" style="display: inline-block; padding: 14px 32px; background-color: ${emailSettings.linkColor}; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-family: ${emailSettings.fontFamily}; font-size: 16px;">
                  ${section.content.text || 'Click Here'}
                </a>
              </td>
            </tr>`;
          break;

        case 'divider':
          sectionsHTML += `
            <tr>
              <td style="padding: 20px 40px;">
                <hr style="border: none; border-top: 2px solid #e5e5e5; margin: 0;">
              </td>
            </tr>`;
          break;
      }
    });

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${emailSettings.companyName}</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: ${emailSettings.backgroundColor}; font-family: ${emailSettings.fontFamily};">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 40px 20px;">
                <table role="presentation" style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                  ${sectionsHTML}
                  <tr>
                    <td style="padding: 30px 40px; text-align: center; background-color: #f9f9f9; border-radius: 0 0 8px 8px;">
                      <p style="margin: 0; color: #999999; font-size: 12px; font-family: ${emailSettings.fontFamily};">
                        © ${new Date().getFullYear()} ${emailSettings.companyName}. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `.trim();
  }

  async function handleSaveTemplate() {
    if (!user) {
      toast.error('You must be logged in to save templates');
      return;
    }

    if (!templateName.trim()) {
      toast.error('Please enter a template name');
      return;
    }

    if (sections.length === 0) {
      toast.error('Template must have at least one section');
      return;
    }

    try {
      setSavingTemplate(true);
      const htmlContent = generateEmailHTML();

      const templateData = {
        name: templateName.trim(),
        category: templateCategory,
        description: templateDescription.trim() || null,
        content: {
          html: htmlContent,
          sections: sections,
          settings: emailSettings,
        },
        updated_at: new Date().toISOString(),
      };

      if (mode === 'edit' && existingTemplate) {
        const { error } = await supabase
          .from('templates')
          .update(templateData)
          .eq('id', existingTemplate.id);

        if (error) throw error;
        toast.success(`Template "${templateName}" updated successfully!`);
      } else {
        const { error } = await supabase
          .from('templates')
          .insert({
            ...templateData,
            user_id: user.id,
            is_locked: false,
            thumbnail: null,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw error;
        toast.success(`Template "${templateName}" created successfully!`);
      }

      if (onSave) {
        onSave(sections, emailSettings, htmlContent);
      } else {
        navigate('/app/templates');
      }
    } catch (error: any) {
      console.error('Failed to save template:', error);
      toast.error(error.message || 'Failed to save template');
    } finally {
      setSavingTemplate(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b-2 border-black px-8 py-6 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif font-bold">
              {mode === 'edit' ? 'Edit Template' : 'Template Editor'}
            </h1>
            <p className="text-gray-600 mt-1">
              {mode === 'edit'
                ? 'Update your email template with live preview'
                : 'Design your email template with live preview'}
            </p>
          </div>

          <div className="flex gap-3">
            {onCancel && (
              <Button
                variant="secondary"
                onClick={onCancel}
                disabled={savingTemplate}
              >
                Cancel
              </Button>
            )}

            <Button
              variant="primary"
              onClick={handleSaveTemplate}
              loading={savingTemplate}
              disabled={savingTemplate}
            >
              {savingTemplate ? 'Saving...' : mode === 'edit' ? 'Update Template' : 'Save Template'}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content - Split Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side - Editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Settings Panel */}
          <div className="bg-white border-b-2 border-black p-6 flex-shrink-0">
            <button
              onClick={() => setSettingsExpanded(!settingsExpanded)}
              className="flex items-center justify-between w-full text-left"
            >
              <div className="flex items-center gap-2">
                <SettingsIcon size={20} />
                <span className="font-bold text-lg">Template Settings</span>
              </div>
              {settingsExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>

            {settingsExpanded && (
              <div className="mt-4 grid grid-cols-2 gap-4">
                <Input
                  label="Template Name"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="My Email Template"
                />
                <Input
                  label="Category"
                  value={templateCategory}
                  onChange={(e) => setTemplateCategory(e.target.value)}
                  placeholder="marketing"
                />
                <div className="col-span-2">
                  <Input
                    label="Description (Optional)"
                    value={templateDescription}
                    onChange={(e) => setTemplateDescription(e.target.value)}
                    placeholder="Brief description of this template"
                  />
                </div>
                <Input
                  label="Company Name"
                  value={emailSettings.companyName}
                  onChange={(e) => setEmailSettings({ ...emailSettings, companyName: e.target.value })}
                />
                <Input
                  label="Font Family"
                  value={emailSettings.fontFamily}
                  onChange={(e) => setEmailSettings({ ...emailSettings, fontFamily: e.target.value })}
                />
                <Input
                  type="color"
                  label="Background Color"
                  value={emailSettings.backgroundColor}
                  onChange={(e) => setEmailSettings({ ...emailSettings, backgroundColor: e.target.value })}
                />
                <Input
                  type="color"
                  label="Text Color"
                  value={emailSettings.textColor}
                  onChange={(e) => setEmailSettings({ ...emailSettings, textColor: e.target.value })}
                />
                <Input
                  type="color"
                  label="Link/Button Color"
                  value={emailSettings.linkColor}
                  onChange={(e) => setEmailSettings({ ...emailSettings, linkColor: e.target.value })}
                />
              </div>
            )}
          </div>

          {/* Section Editor */}
          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-3xl mx-auto">
              <SectionEditor sections={sections} onChange={setSections} />
            </div>
          </div>
        </div>

        {/* Right Side - Live Preview */}
        <div className="w-[480px] bg-gray-900 border-l-2 border-black flex flex-col flex-shrink-0">
          <div className="bg-gray-800 px-6 py-4 border-b-2 border-black flex items-center gap-2">
            <Eye size={20} className="text-gold" />
            <span className="font-bold text-white">Live Preview</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <iframe
              key={previewKey}
              srcDoc={generateEmailHTML()}
              className="w-full h-full bg-white rounded-lg"
              title="Email Preview"
              sandbox="allow-same-origin"
            />
          </div>
        </div>
      </div>
    </div>
  );
}