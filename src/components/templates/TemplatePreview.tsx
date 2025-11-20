import React from 'react';
import { EmailTemplate } from '../../data/emailTemplates';

interface TemplatePreviewProps {
  template: EmailTemplate;
  editedContent: Record<string, string>;
}

export const TemplatePreview: React.FC<TemplatePreviewProps> = ({ 
  template, 
  editedContent 
}) => {
  // Replace all {{section_id}} with actual content
  let previewHtml = template.htmlContent;
  
  template.editableSections.forEach(section => {
    const content = editedContent[section.id] || section.defaultContent;
    const regex = new RegExp(`\\{\\{${section.id}\\}\\}`, 'g');
    previewHtml = previewHtml.replace(regex, content);
  });

  return (
    <div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
      <div className="bg-gray-100 px-4 py-2 border-b border-gray-300">
        <p className="text-sm text-gray-600">Live Preview</p>
      </div>
      <div 
        className="p-4 overflow-auto"
        style={{ maxHeight: '600px' }}
        dangerouslySetInnerHTML={{ __html: previewHtml }}
      />
    </div>
  );
};