import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, 
  Eye, 
  Settings as SettingsIcon, 
  ChevronDown, 
  ChevronUp,
  Save,
  Sparkles,
  Palette,
  Type,
  Layout
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import SectionEditor from './SectionEditor';
import type { Section } from './SectionEditor';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
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
  const [settingsExpanded, setSettingsExpanded] = useState(false);
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
                <div style="width: 100%; height: 200px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; border-radius: 8px; color: white; font-family: ${emailSettings.fontFamily};">
                  Image Placeholder
                </div>
                `}
                ${section.content.caption ? `
                <p style="margin: 10px 0 0 0; color: #666; font-size: 14px; font-family: ${emailSettings.fontFamily};">
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
                <a href="${section.content.url || '#'}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, ${emailSettings.linkColor} 0%, ${emailSettings.linkColor}dd 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-family: ${emailSettings.fontFamily}; font-size: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); transition: transform 0.2s;">
                  ${section.content.text || 'Click Here'}
                </a>
              </td>
            </tr>`;
          break;

        case 'divider':
          sectionsHTML += `
            <tr>
              <td style="padding: 20px 40px;">
                <div style="height: 1px; background: linear-gradient(90deg, transparent, #e5e5e5, transparent);"></div>
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
                <table role="presentation" style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.1);">
                  ${sectionsHTML}
                  <tr>
                    <td style="padding: 30px 40px; text-align: center; background: linear-gradient(135deg, #f5f5f5 0%, #e5e5e5 100%); border-radius: 0 0 12px 12px;">
                      <p style="margin: 0; color: #666; font-size: 12px; font-family: ${emailSettings.fontFamily};">
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
        toast.success(`✨ Template "${templateName}" updated successfully!`);
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
        toast.success(`🎉 Template "${templateName}" created successfully!`);
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
      {/* Header */}
      <div className="backdrop-blur-xl bg-white/80 border-b border-gray-200/50 shadow-lg px-8 py-6 flex-shrink-0 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple to-gold rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple to-gold bg-clip-text text-transparent">
                {mode === 'edit' ? 'Edit Template' : 'Create Template'}
              </h1>
              <p className="text-sm text-gray-600 mt-0.5">
                Design beautiful emails with live preview
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {onCancel && (
              <Button
                variant="secondary"
                onClick={onCancel}
                disabled={savingTemplate}
                className="border-gray-300 hover:border-gray-400"
              >
                <X size={18} />
                Cancel
              </Button>
            )}

            <button
              onClick={handleSaveTemplate}
              disabled={savingTemplate}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple to-gold text-white font-semibold rounded-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={18} />
              {savingTemplate ? 'Saving...' : mode === 'edit' ? 'Update Template' : 'Save Template'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side - Editor */}
        <div className="flex-1 flex flex-col overflow-hidden p-6">
          {/* Settings Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 mb-6 overflow-hidden">
            <button
              onClick={() => setSettingsExpanded(!settingsExpanded)}
              className="flex items-center justify-between w-full text-left px-6 py-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple/10 to-gold/10 rounded-xl flex items-center justify-center">
                  <SettingsIcon size={20} className="text-purple" />
                </div>
                <div>
                  <span className="font-bold text-lg">Template Settings</span>
                  <p className="text-xs text-gray-500 mt-0.5">Customize your template details</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 font-medium">
                  {settingsExpanded ? 'Hide' : 'Show'}
                </span>
                {settingsExpanded ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
              </div>
            </button>

            {settingsExpanded && (
              <div className="px-6 pb-6 pt-2 bg-gradient-to-br from-gray-50/50 to-transparent">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 mb-2">
                    <div className="flex items-center gap-2 mb-3">
                      <Layout size={16} className="text-purple" />
                      <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Template Info</span>
                    </div>
                  </div>
                  
                  <Input
                    label="Template Name"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="My Email Template"
                    className="bg-white"
                  />
                  <Input
                    label="Category"
                    value={templateCategory}
                    onChange={(e) => setTemplateCategory(e.target.value)}
                    placeholder="marketing"
                    className="bg-white"
                  />
                  <div className="col-span-2">
                    <Input
                      label="Description (Optional)"
                      value={templateDescription}
                      onChange={(e) => setTemplateDescription(e.target.value)}
                      placeholder="Brief description of this template"
                      className="bg-white"
                    />
                  </div>

                  <div className="col-span-2 mb-2 mt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles size={16} className="text-gold" />
                      <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Brand Settings</span>
                    </div>
                  </div>

                  <Input
                    label="Company Name"
                    value={emailSettings.companyName}
                    onChange={(e) => setEmailSettings({ ...emailSettings, companyName: e.target.value })}
                    className="bg-white"
                  />
                  <Input
                    label="Font Family"
                    value={emailSettings.fontFamily}
                    onChange={(e) => setEmailSettings({ ...emailSettings, fontFamily: e.target.value })}
                    className="bg-white"
                  />

                  <div className="col-span-2 mb-2 mt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Palette size={16} className="text-purple" />
                      <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Color Palette</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Background</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={emailSettings.backgroundColor}
                        onChange={(e) => setEmailSettings({ ...emailSettings, backgroundColor: e.target.value })}
                        className="w-12 h-12 rounded-lg border-2 border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={emailSettings.backgroundColor}
                        onChange={(e) => setEmailSettings({ ...emailSettings, backgroundColor: e.target.value })}
                        className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg font-mono text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Text Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={emailSettings.textColor}
                        onChange={(e) => setEmailSettings({ ...emailSettings, textColor: e.target.value })}
                        className="w-12 h-12 rounded-lg border-2 border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={emailSettings.textColor}
                        onChange={(e) => setEmailSettings({ ...emailSettings, textColor: e.target.value })}
                        className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg font-mono text-sm"
                      />
                    </div>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-semibold mb-2">Button/Link Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={emailSettings.linkColor}
                        onChange={(e) => setEmailSettings({ ...emailSettings, linkColor: e.target.value })}
                        className="w-12 h-12 rounded-lg border-2 border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={emailSettings.linkColor}
                        onChange={(e) => setEmailSettings({ ...emailSettings, linkColor: e.target.value })}
                        className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg font-mono text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section Editor Card */}
          <div className="flex-1 bg-white rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-gold/10 to-purple/10 rounded-xl flex items-center justify-center">
                  <Type size={20} className="text-purple" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Email Content</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Drag sections by the handle to reorder</p>
                </div>
              </div>
            </div>
            <div className="overflow-y-auto p-6" style={{ height: 'calc(100% - 90px)' }}>
              <div className="max-w-3xl mx-auto">
                <SectionEditor sections={sections} onChange={setSections} />
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Live Preview */}
        <div className="w-[520px] flex-shrink-0 p-6 pl-0">
          <div className="h-full bg-gradient-to-br from-gray-900 via-purple/5 to-gray-900 rounded-2xl shadow-2xl border border-gray-800 flex flex-col overflow-hidden">
            <div className="bg-gradient-to-r from-purple to-gold px-6 py-4 flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center">
                <Eye size={18} className="text-white" />
              </div>
              <div>
                <span className="font-bold text-white text-lg">Live Preview</span>
                <p className="text-xs text-white/70 mt-0.5">Updates in real-time</p>
              </div>
            </div>
            <div className="flex-1 overflow-hidden p-6 bg-gray-900/50">
              <div className="h-full bg-white rounded-xl shadow-2xl overflow-hidden border-4 border-gray-800">
                <iframe
                  key={previewKey}
                  srcDoc={generateEmailHTML()}
                  className="w-full h-full"
                  title="Email Preview"
                  sandbox="allow-same-origin"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}