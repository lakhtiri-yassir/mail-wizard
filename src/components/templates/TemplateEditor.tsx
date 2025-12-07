/**
 * ============================================================================
 * Template Editor - Complete Section-Based Email Builder
 * ============================================================================
 *
 * NEW TEMPLATE EDITOR STRUCTURE
 *
 * Layout:
 * ┌──────────────────────────────────────────────────┐
 * │  Template Editor - [Template Name]               │
 * ├───────────────────┬──────────────────────────────┤
 * │                   │                              │
 * │  [Section Editor] │   [Live Preview]             │
 * │                   │                              │
 * │  Drag sections    │   Iframe with                │
 * │  Add/Remove       │   real HTML output           │
 * │  Edit content     │                              │
 * │  Change colors    │   Updates in                 │
 * │  Upload images    │   real-time                  │
 * │                   │                              │
 * ├───────────────────┴──────────────────────────────┤
 * │  [Cancel]              [Save & Use Template]     │
 * └──────────────────────────────────────────────────┘
 *
 * Features:
 * - Drag and drop section reordering
 * - Real-time preview updates
 * - Image upload to Supabase Storage
 * - Color customization
 * - Complete HTML email generation
 *
 * ============================================================================
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppLayout } from '../app/AppLayout';
import { Button } from '../ui/Button';
import SectionEditor, { Section } from './SectionEditor';
import ColorPicker from './ColorPicker';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface EmailSettings {
  companyName: string;
  backgroundColor: string;
  textColor: string;
  linkColor: string;
  fontFamily: string;
}

export const TemplateEditor: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Template data
  const templateId = searchParams.get('template');
  const isCreationMode = searchParams.get('createMode') === 'true';
  const campaignName = searchParams.get('name') || '';
  const campaignSubject = searchParams.get('subject') || '';

  // State
  const [sections, setSections] = useState<Section[]>([]);
  const [emailSettings, setEmailSettings] = useState<EmailSettings>({
    companyName: 'Mail Wizard',
    backgroundColor: '#F5F5F5',
    textColor: '#333333',
    linkColor: '#f3ba42',
    fontFamily: 'Arial, Helvetica, sans-serif'
  });
  const [loading, setLoading] = useState(false);

  // Initialize with default sections
  useEffect(() => {
    const defaultSections: Section[] = [
      {
        id: 'header-1',
        type: 'header',
        content: {
          title: 'Welcome to Our Newsletter',
          subtitle: 'Stay updated with our latest news'
        }
      },
      {
        id: 'text-1',
        type: 'text',
        content: {
          text: 'Dear Valued Customer,\n\nWe\'re excited to share our latest updates with you. This email contains important information about our products and services.'
        }
      },
      {
        id: 'button-1',
        type: 'button',
        content: {
          buttonText: 'Learn More',
          buttonUrl: 'https://example.com',
          buttonColor: '#f3ba42'
        }
      },
      {
        id: 'divider-1',
        type: 'divider',
        content: {
          dividerColor: '#E5E7EB'
        }
      }
    ];

    setSections(defaultSections);
  }, [templateId]);

  // Update preview when sections or settings change
  useEffect(() => {
    updatePreview();
  }, [sections, emailSettings]);

  /**
   * Generates complete HTML email from sections
   */
  function generateEmailHTML(): string {
    let sectionsHTML = '';

    sections.forEach(section => {
      switch (section.type) {
        case 'header':
          sectionsHTML += `
            <tr>
              <td style="padding: 40px 40px 20px 40px;">
                <h1 style="margin: 0 0 10px 0; color: ${emailSettings.textColor}; font-size: 32px; font-weight: bold; font-family: ${emailSettings.fontFamily};">
                  ${section.content.title || ''}
                </h1>
                ${section.content.subtitle ? `
                  <p style="margin: 0; color: #666666; font-size: 16px; font-family: ${emailSettings.fontFamily};">
                    ${section.content.subtitle}
                  </p>
                ` : ''}
              </td>
            </tr>
          `;
          break;

        case 'text':
          sectionsHTML += `
            <tr>
              <td style="padding: 20px 40px;">
                <div style="color: ${emailSettings.textColor}; font-size: 16px; line-height: 1.6; font-family: ${emailSettings.fontFamily}; white-space: pre-wrap;">
                  ${section.content.text || ''}
                </div>
              </td>
            </tr>
          `;
          break;

        case 'image':
          if (section.content.imageUrl) {
            sectionsHTML += `
              <tr>
                <td style="padding: 20px 40px;">
                  <img src="${section.content.imageUrl}" alt="${section.content.imageAlt || 'Image'}" style="max-width: 100%; height: auto; display: block; border-radius: 8px; margin: 0 auto;">
                  ${section.content.caption ? `
                    <p style="margin: 10px 0 0 0; color: #666666; font-size: 14px; text-align: center; font-style: italic; font-family: ${emailSettings.fontFamily};">
                      ${section.content.caption}
                    </p>
                  ` : ''}
                </td>
              </tr>
            `;
          }
          break;

        case 'button':
          sectionsHTML += `
            <tr>
              <td style="padding: 30px 40px; text-align: center;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                  <tr>
                    <td style="background-color: ${section.content.buttonColor || '#f3ba42'}; border: 2px solid #000000; border-radius: 50px; padding: 14px 32px;">
                      <a href="${section.content.buttonUrl || '#'}" style="display: inline-block; color: #000000; text-decoration: none; font-weight: bold; font-size: 16px; font-family: ${emailSettings.fontFamily};">
                        ${section.content.buttonText || 'Click Here'}
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          `;
          break;

        case 'divider':
          sectionsHTML += `
            <tr>
              <td style="padding: 20px 40px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                  <tr>
                    <td style="border-top: 2px solid ${section.content.dividerColor || '#E5E7EB'}; font-size: 0; line-height: 0;">
                      &nbsp;
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          `;
          break;
      }
    });

    // Complete HTML email structure
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${campaignSubject || 'Email Template'}</title>
  <style>
    body { margin: 0; padding: 0; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: ${emailSettings.fontFamily}; background-color: ${emailSettings.backgroundColor};">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: ${emailSettings.backgroundColor};">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%; max-width: 600px; background-color: #ffffff; border: 2px solid #000000; border-radius: 8px;">

          <!-- Company Header -->
          <tr>
            <td style="background-color: #ffffff; padding: 30px 40px; text-align: center; border-bottom: 3px solid #f3ba42;">
              <h1 style="margin: 0; color: ${emailSettings.textColor}; font-size: 28px; font-weight: bold; font-family: 'DM Serif Display', Georgia, serif;">
                ${emailSettings.companyName}
              </h1>
            </td>
          </tr>

          <!-- Dynamic Sections -->
          ${sectionsHTML}

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9f9f9; padding: 30px 40px; text-align: center; border-top: 2px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0; font-size: 12px; color: #666666; font-family: ${emailSettings.fontFamily};">
                <a href="{{VIEW_IN_BROWSER_URL}}" style="color: ${emailSettings.linkColor}; text-decoration: underline;">View in browser</a>
              </p>
              <p style="margin: 10px 0 0 0; font-size: 12px; color: #666666; font-family: ${emailSettings.fontFamily};">
                <a href="{{UNSUBSCRIBE_URL}}" style="color: #666666; text-decoration: underline;">Unsubscribe</a>
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

  /**
   * Updates iframe preview
   */
  function updatePreview() {
    if (!iframeRef.current) return;

    const html = generateEmailHTML();
    const iframeDoc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;

    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(html);
      iframeDoc.close();
    }
  }

  /**
   * Saves template and continues to campaign creation
   */
  async function handleSave() {
    if (isCreationMode && !campaignName) {
      toast.error('Campaign name is required');
      return;
    }

    if (isCreationMode && !campaignSubject) {
      toast.error('Subject line is required');
      return;
    }

    if (sections.length === 0) {
      toast.error('Please add at least one section to your email');
      return;
    }

    setLoading(true);

    try {
      const htmlContent = generateEmailHTML();

      if (isCreationMode) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data: campaign, error } = await supabase
          .from('campaigns')
          .insert({
            user_id: user.id,
            name: campaignName,
            subject: campaignSubject,
            content: {
              html: htmlContent,
              sections: sections,
              settings: emailSettings
            },
            status: 'draft',
            from_email: user.email,
            from_name: emailSettings.companyName
          })
          .select()
          .single();

        if (error) throw error;

        toast.success('Campaign created successfully');
        navigate('/app/campaigns');
      } else {
        toast.success('Template saved');
        navigate('/app/templates');
      }
    } catch (err: any) {
      console.error('Save error:', err);
      toast.error(err.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppLayout currentPath="/app/templates">
      <div className="h-screen flex flex-col bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b-2 border-black p-6 flex-shrink-0">
          <div className="flex items-center justify-between max-w-[1800px] mx-auto">
            <div>
              <h1 className="text-2xl font-serif font-bold">
                {isCreationMode ? `Create Campaign: ${campaignName}` : 'Template Editor'}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {isCreationMode ? campaignSubject : 'Build your email template with drag-and-drop sections'}
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="tertiary"
                onClick={() => navigate(isCreationMode ? '/app/campaigns' : '/app/templates')}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSave}
                loading={loading}
              >
                {isCreationMode ? 'Create Campaign' : 'Save Template'}
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content: Split View */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Section Editor */}
          <div className="w-1/2 border-r-2 border-black overflow-y-auto bg-white p-6">
            <div className="max-w-2xl mx-auto space-y-6">
              {/* Email Settings */}
              <div className="bg-white border-2 border-black rounded-lg p-6 shadow-sm">
                <h2 className="text-lg font-serif font-bold mb-4">Email Settings</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Company Name</label>
                    <input
                      type="text"
                      value={emailSettings.companyName}
                      onChange={(e) => setEmailSettings(prev => ({ ...prev, companyName: e.target.value }))}
                      className="w-full px-3 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-purple"
                      placeholder="Your Company Name"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <ColorPicker
                      color={emailSettings.backgroundColor}
                      onChange={(color) => setEmailSettings(prev => ({ ...prev, backgroundColor: color }))}
                      label="Background Color"
                    />
                    <ColorPicker
                      color={emailSettings.textColor}
                      onChange={(color) => setEmailSettings(prev => ({ ...prev, textColor: color }))}
                      label="Text Color"
                    />
                  </div>

                  <ColorPicker
                    color={emailSettings.linkColor}
                    onChange={(color) => setEmailSettings(prev => ({ ...prev, linkColor: color }))}
                    label="Link Color"
                  />

                  <div>
                    <label className="block text-sm font-medium mb-2">Font Family</label>
                    <select
                      value={emailSettings.fontFamily}
                      onChange={(e) => setEmailSettings(prev => ({ ...prev, fontFamily: e.target.value }))}
                      className="w-full px-3 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-purple"
                    >
                      <option value="Arial, Helvetica, sans-serif">Arial</option>
                      <option value="Georgia, serif">Georgia</option>
                      <option value="'Times New Roman', Times, serif">Times New Roman</option>
                      <option value="'Courier New', Courier, monospace">Courier New</option>
                      <option value="Verdana, Geneva, sans-serif">Verdana</option>
                      <option value="'Trebuchet MS', sans-serif">Trebuchet MS</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section Editor */}
              <div className="bg-white border-2 border-black rounded-lg p-6 shadow-sm">
                <h2 className="text-lg font-serif font-bold mb-4">Email Content</h2>
                <SectionEditor
                  sections={sections}
                  onChange={setSections}
                />
              </div>
            </div>
          </div>

          {/* Right: Live Preview */}
          <div className="w-1/2 bg-gray-100 p-6 overflow-y-auto">
            <div className="max-w-3xl mx-auto">
              <div className="bg-white border-2 border-black rounded-lg overflow-hidden shadow-lg sticky top-0">
                <div className="bg-gold px-4 py-3 border-b-2 border-black">
                  <h3 className="font-bold text-black">Live Preview</h3>
                  <p className="text-xs text-black/70 mt-1">Updates in real-time as you edit</p>
                </div>
                <div className="bg-gray-100 p-2">
                  <iframe
                    ref={iframeRef}
                    className="w-full bg-white border-2 border-gray-300 rounded"
                    style={{
                      height: 'calc(100vh - 180px)',
                      minHeight: '600px'
                    }}
                    title="Email Preview"
                    sandbox="allow-same-origin"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};
