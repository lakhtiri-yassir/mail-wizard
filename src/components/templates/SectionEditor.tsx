/**
 * ============================================================================
 * Section Editor Component
 * ============================================================================
 *
 * Purpose: Modular section system for building email templates
 *
 * Features:
 * - Drag and drop section reordering
 * - Add/remove sections
 * - Multiple section types (header, text, image, button, divider)
 * - Inline section editing
 * - Real-time preview generation
 *
 * Section Types:
 * - header: Title with optional subtitle
 * - text: Rich text paragraph
 * - image: Image with optional caption
 * - button: Call-to-action button
 * - divider: Horizontal line separator
 *
 * Props:
 * - sections: Array of section objects
 * - onChange: Callback when sections change
 *
 * ============================================================================
 */

import { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import {
  GripVertical,
  Trash2,
  Plus,
  Type,
  Image as ImageIcon,
  Link,
  Minus,
  Heading1
} from 'lucide-react';
import { Button } from '../ui/Button';
import ColorPicker from './ColorPicker';
import ImageUpload from './ImageUpload';
import Modal from '../ui/Modal';

export interface Section {
  id: string;
  type: 'header' | 'text' | 'image' | 'button' | 'divider';
  content: {
    // Header
    title?: string;
    subtitle?: string;
    // Text
    text?: string;
    // Image
    imageUrl?: string;
    imageAlt?: string;
    caption?: string;
    // Button
    buttonText?: string;
    buttonUrl?: string;
    buttonColor?: string;
    // Divider
    dividerColor?: string;
  };
}

interface SectionEditorProps {
  sections: Section[];
  onChange: (sections: Section[]) => void;
}

export default function SectionEditor({ sections, onChange }: SectionEditorProps) {
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageTargetSection, setImageTargetSection] = useState<string | null>(null);

  /**
   * Handles drag end event
   */
  function handleDragEnd(result: DropResult) {
    if (!result.destination) return;

    const items = Array.from(sections);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    onChange(items);
  }

  /**
   * Adds a new section
   */
  function addSection(type: Section['type']) {
    const newSection: Section = {
      id: `section-${Date.now()}`,
      type,
      content: getSectionDefaults(type)
    };

    onChange([...sections, newSection]);
    setEditingSection(newSection.id);
  }

  /**
   * Gets default content for section type
   */
  function getSectionDefaults(type: Section['type']) {
    switch (type) {
      case 'header':
        return { title: 'Section Title', subtitle: 'Optional subtitle' };
      case 'text':
        return { text: 'Enter your text here. You can use this for announcements, updates, or any other content.' };
      case 'image':
        return { imageUrl: '', imageAlt: 'Image', caption: '' };
      case 'button':
        return { buttonText: 'Click Here', buttonUrl: 'https://example.com', buttonColor: '#f3ba42' };
      case 'divider':
        return { dividerColor: '#E5E7EB' };
      default:
        return {};
    }
  }

  /**
   * Updates a section's content
   */
  function updateSection(sectionId: string, content: Partial<Section['content']>) {
    onChange(
      sections.map(section =>
        section.id === sectionId
          ? { ...section, content: { ...section.content, ...content } }
          : section
      )
    );
  }

  /**
   * Removes a section
   */
  function removeSection(sectionId: string) {
    onChange(sections.filter(section => section.id !== sectionId));
  }

  /**
   * Opens image picker for section
   */
  function openImagePicker(sectionId: string) {
    setImageTargetSection(sectionId);
    setShowImageModal(true);
  }

  /**
   * Handles image selection
   */
  function handleImageSelect(url: string) {
    if (imageTargetSection) {
      updateSection(imageTargetSection, { imageUrl: url });
    }
    setShowImageModal(false);
    setImageTargetSection(null);
  }

  /**
   * Renders section editor based on type
   */
  function renderSectionEditor(section: Section) {
    const isEditing = editingSection === section.id;

    switch (section.type) {
      case 'header':
        return (
          <div className="space-y-3">
            <input
              type="text"
              value={section.content.title || ''}
              onChange={(e) => updateSection(section.id, { title: e.target.value })}
              onFocus={() => setEditingSection(section.id)}
              className="w-full px-3 py-2 text-lg font-serif font-bold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple"
              placeholder="Section Title"
            />
            <input
              type="text"
              value={section.content.subtitle || ''}
              onChange={(e) => updateSection(section.id, { subtitle: e.target.value })}
              onFocus={() => setEditingSection(section.id)}
              className="w-full px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple"
              placeholder="Optional subtitle"
            />
          </div>
        );

      case 'text':
        return (
          <textarea
            value={section.content.text || ''}
            onChange={(e) => updateSection(section.id, { text: e.target.value })}
            onFocus={() => setEditingSection(section.id)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple"
            placeholder="Enter your text content here..."
          />
        );

      case 'image':
        return (
          <div className="space-y-3">
            {section.content.imageUrl ? (
              <div className="relative">
                <img
                  src={section.content.imageUrl}
                  alt={section.content.imageAlt || 'Section image'}
                  className="w-full rounded-lg"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => openImagePicker(section.id)}
                  className="absolute top-2 right-2"
                >
                  Change Image
                </Button>
              </div>
            ) : (
              <div
                onClick={() => openImagePicker(section.id)}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
              >
                <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Click to select image</p>
              </div>
            )}
            <input
              type="text"
              value={section.content.imageAlt || ''}
              onChange={(e) => updateSection(section.id, { imageAlt: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple"
              placeholder="Image alt text (for accessibility)"
            />
            <input
              type="text"
              value={section.content.caption || ''}
              onChange={(e) => updateSection(section.id, { caption: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple"
              placeholder="Optional caption"
            />
          </div>
        );

      case 'button':
        return (
          <div className="space-y-3">
            <input
              type="text"
              value={section.content.buttonText || ''}
              onChange={(e) => updateSection(section.id, { buttonText: e.target.value })}
              onFocus={() => setEditingSection(section.id)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple"
              placeholder="Button text"
            />
            <input
              type="url"
              value={section.content.buttonUrl || ''}
              onChange={(e) => updateSection(section.id, { buttonUrl: e.target.value })}
              onFocus={() => setEditingSection(section.id)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple"
              placeholder="https://example.com"
            />
            <ColorPicker
              color={section.content.buttonColor || '#f3ba42'}
              onChange={(color) => updateSection(section.id, { buttonColor: color })}
              label="Button Color"
            />
          </div>
        );

      case 'divider':
        return (
          <div className="space-y-3">
            <ColorPicker
              color={section.content.dividerColor || '#E5E7EB'}
              onChange={(color) => updateSection(section.id, { dividerColor: color })}
              label="Divider Color"
            />
            <div
              className="h-px"
              style={{ backgroundColor: section.content.dividerColor || '#E5E7EB' }}
            />
          </div>
        );

      default:
        return null;
    }
  }

  /**
   * Gets section type icon
   */
  function getSectionIcon(type: Section['type']) {
    switch (type) {
      case 'header': return <Heading1 className="w-4 h-4" />;
      case 'text': return <Type className="w-4 h-4" />;
      case 'image': return <ImageIcon className="w-4 h-4" />;
      case 'button': return <Link className="w-4 h-4" />;
      case 'divider': return <Minus className="w-4 h-4" />;
    }
  }

  /**
   * Gets section type label
   */
  function getSectionLabel(type: Section['type']) {
    return type.charAt(0).toUpperCase() + type.slice(1);
  }

  return (
    <div className="space-y-4">
      {/* Section List */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="sections">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-3"
            >
              {sections.map((section, index) => (
                <Draggable key={section.id} draggableId={section.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`border-2 rounded-lg p-4 bg-white transition-shadow ${
                        snapshot.isDragging
                          ? 'border-gold shadow-lg'
                          : 'border-gray-200'
                      }`}
                    >
                      {/* Section Header */}
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          {...provided.dragHandleProps}
                          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
                        >
                          <GripVertical className="w-5 h-5" />
                        </div>
                        <div className="flex items-center gap-2">
                          {getSectionIcon(section.type)}
                          <span className="text-sm font-medium text-gray-700">
                            {getSectionLabel(section.type)}
                          </span>
                        </div>
                        <div className="flex-1" />
                        <button
                          onClick={() => removeSection(section.id)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                          title="Remove section"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Section Editor */}
                      {renderSectionEditor(section)}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Add Section Buttons */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
        <p className="text-sm font-medium text-gray-700 mb-3">Add Section:</p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={Heading1}
            onClick={() => addSection('header')}
          >
            Header
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={Type}
            onClick={() => addSection('text')}
          >
            Text
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={ImageIcon}
            onClick={() => addSection('image')}
          >
            Image
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={Link}
            onClick={() => addSection('button')}
          >
            Button
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={Minus}
            onClick={() => addSection('divider')}
          >
            Divider
          </Button>
        </div>
      </div>

      {/* Image Upload Modal */}
      {showImageModal && (
        <Modal
          isOpen={showImageModal}
          onClose={() => {
            setShowImageModal(false);
            setImageTargetSection(null);
          }}
          title="Select Image"
        >
          <ImageUpload
            onSelectImage={handleImageSelect}
            selectedUrl={
              imageTargetSection
                ? sections.find(s => s.id === imageTargetSection)?.content.imageUrl
                : undefined
            }
          />
        </Modal>
      )}
    </div>
  );
}

/**
 * Generates HTML from sections for email template
 */
export function sectionsToHtml(sections: Section[]): string {
  return sections.map(section => {
    switch (section.type) {
      case 'header':
        return `
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td style="padding: 20px 0; text-align: center;">
                <h1 style="margin: 0 0 8px 0; font-family: 'DM Serif Display', Georgia, serif; font-size: 32px; font-weight: bold; color: #000000;">
                  ${section.content.title || ''}
                </h1>
                ${section.content.subtitle ? `
                  <p style="margin: 0; font-family: Arial, Helvetica, sans-serif; font-size: 16px; color: #6B7280;">
                    ${section.content.subtitle}
                  </p>
                ` : ''}
              </td>
            </tr>
          </table>
        `;

      case 'text':
        return `
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td style="padding: 15px 0; font-family: Arial, Helvetica, sans-serif; font-size: 16px; line-height: 1.6; color: #374151;">
                ${section.content.text || ''}
              </td>
            </tr>
          </table>
        `;

      case 'image':
        return `
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td style="padding: 15px 0;">
                ${section.content.imageUrl ? `
                  <img src="${section.content.imageUrl}" alt="${section.content.imageAlt || ''}" style="max-width: 100%; height: auto; display: block; border-radius: 8px;" />
                  ${section.content.caption ? `
                    <p style="margin: 8px 0 0 0; font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #6B7280; text-align: center;">
                      ${section.content.caption}
                    </p>
                  ` : ''}
                ` : ''}
              </td>
            </tr>
          </table>
        `;

      case 'button':
        return `
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td style="padding: 20px 0; text-align: center;">
                <a href="${section.content.buttonUrl || '#'}" style="display: inline-block; padding: 14px 32px; background-color: ${section.content.buttonColor || '#f3ba42'}; color: #000000; text-decoration: none; font-family: Arial, Helvetica, sans-serif; font-size: 16px; font-weight: 600; border-radius: 999px; border: 2px solid #000000;">
                  ${section.content.buttonText || 'Click Here'}
                </a>
              </td>
            </tr>
          </table>
        `;

      case 'divider':
        return `
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td style="padding: 20px 0;">
                <div style="height: 1px; background-color: ${section.content.dividerColor || '#E5E7EB'};"></div>
              </td>
            </tr>
          </table>
        `;

      default:
        return '';
    }
  }).join('\n');
}
