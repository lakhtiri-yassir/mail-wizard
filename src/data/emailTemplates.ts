/**
 * Email Templates Data
 *
 * Central repository of email templates with section-based structure.
 * Each template includes:
 * - Sections array for drag-and-drop editing
 * - Settings for styling customization
 * - Footer section with unsubscribe link (CAN-SPAM compliant)
 *
 * NOTE: Footer company name, address and social links are intentionally
 * left empty. They are populated at send-time from the user's profile
 * settings (companyName, companyAddress etc.) via merge tags.
 */

import type { Section } from '../components/templates/SectionEditor';

export interface EmailTemplate {
  id: string;
  name: string;
  category: string;
  description?: string;
  thumbnail?: string;
  is_locked: boolean;
  content: {
    sections: Section[];
    settings: {
      companyName: string;
      backgroundColor: string;
      textColor: string;
      linkColor: string;
      fontFamily: string;
    };
    html?: string; // Generated HTML for backward compatibility
  };
}

/**
 * Shared footer section used across all templates.
 * Company name and address are populated at send-time.
 */
const defaultFooter: Section = {
  id: 'footer-1',
  type: 'footer',
  content: {
    companyName: '',
    companyAddress: '',
    socialLinks: {
      facebook: '',
      linkedin: '',
      website: ''
    },
    showUnsubscribe: true,
    footerText: ''
  }
};

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'welcome',
    name: 'Welcome Email',
    category: 'onboarding',
    description: 'Welcome new subscribers with a warm greeting',
    is_locked: true,
    content: {
      sections: [
        {
          id: 'header-1',
          type: 'header',
          content: {
            title: 'Welcome to Our Community!',
            subtitle: 'Thanks for joining us'
          }
        },
        {
          id: 'text-1',
          type: 'text',
          content: {
            text: 'Hi {{MERGE:first_name}},\n\nWe\'re thrilled to have you on board! Welcome to our community of innovators and creators.'
          }
        },
        {
          id: 'text-2',
          type: 'text',
          content: {
            text: 'Here\'s what you can expect from us:\n\n• Weekly tips and insights\n• Exclusive member benefits\n• Early access to new features\n• A supportive community'
          }
        },
        {
          id: 'button-1',
          type: 'button',
          content: {
            buttonText: 'Get Started',
            buttonUrl: 'https://example.com/getting-started',
            buttonColor: '#f3ba42'
          }
        },
        {
          id: 'divider-1',
          type: 'divider',
          content: {
            dividerColor: '#E5E7EB'
          }
        },
        {
          id: 'text-3',
          type: 'text',
          content: {
            text: 'Questions? Just reply to this email — we\'re here to help!'
          }
        },
        { ...defaultFooter, id: 'footer-1' }
      ],
      settings: {
        companyName: '',
        backgroundColor: '#F0F4FF',
        textColor: '#333333',
        linkColor: '#f3ba42',
        fontFamily: 'DM Sans, sans-serif'
      }
    }
  },
  {
    id: 'newsletter',
    name: 'Newsletter',
    category: 'marketing',
    description: 'Monthly newsletter template',
    is_locked: true,
    content: {
      sections: [
        {
          id: 'header-1',
          type: 'header',
          content: {
            title: 'Monthly Newsletter',
            subtitle: 'Your latest updates'
          }
        },
        {
          id: 'text-1',
          type: 'text',
          content: {
            text: 'Hi {{MERGE:first_name}},\n\nHere are this month\'s highlights and updates from our team.'
          }
        },
        {
          id: 'text-2',
          type: 'text',
          content: {
            text: '📰 Latest News\n• Update 1: New feature launched\n• Update 2: Community spotlight\n• Update 3: Upcoming events'
          }
        },
        {
          id: 'button-1',
          type: 'button',
          content: {
            buttonText: 'Read More',
            buttonUrl: 'https://example.com/newsletter',
            buttonColor: '#f3ba42'
          }
        },
        {
          id: 'divider-1',
          type: 'divider',
          content: {
            dividerColor: '#E5E7EB'
          }
        },
        {
          id: 'text-3',
          type: 'text',
          content: {
            text: 'Thank you for being part of our community!'
          }
        },
        { ...defaultFooter, id: 'footer-2' }
      ],
      settings: {
        companyName: '',
        backgroundColor: '#FFFFFF',
        textColor: '#333333',
        linkColor: '#f3ba42',
        fontFamily: 'DM Sans, sans-serif'
      }
    }
  },
  {
    id: 'promotion',
    name: 'Promotion',
    category: 'marketing',
    description: 'Promotional campaign template',
    is_locked: true,
    content: {
      sections: [
        {
          id: 'header-1',
          type: 'header',
          content: {
            title: 'Special Offer Inside!',
            subtitle: 'Limited time only'
          }
        },
        {
          id: 'text-1',
          type: 'text',
          content: {
            text: 'Hi {{MERGE:first_name}},\n\nWe have an exclusive offer just for you!'
          }
        },
        {
          id: 'text-2',
          type: 'text',
          content: {
            text: '🎉 Get 20% off your next purchase\n\nUse code: SAVE20 at checkout'
          }
        },
        {
          id: 'button-1',
          type: 'button',
          content: {
            buttonText: 'Shop Now',
            buttonUrl: 'https://example.com/shop',
            buttonColor: '#f3ba42'
          }
        },
        {
          id: 'divider-1',
          type: 'divider',
          content: {
            dividerColor: '#E5E7EB'
          }
        },
        {
          id: 'text-3',
          type: 'text',
          content: {
            text: 'Offer expires in 7 days. Don\'t miss out!'
          }
        },
        { ...defaultFooter, id: 'footer-3' }
      ],
      settings: {
        companyName: '',
        backgroundColor: '#FFF9E6',
        textColor: '#333333',
        linkColor: '#f3ba42',
        fontFamily: 'DM Sans, sans-serif'
      }
    }
  },
  {
    id: 'event-invitation',
    name: 'Event Invitation',
    category: 'events',
    description: 'Invite people to your event',
    is_locked: true,
    content: {
      sections: [
        {
          id: 'header-1',
          type: 'header',
          content: {
            title: 'You\'re Invited!',
            subtitle: 'Join us for an exciting event'
          }
        },
        {
          id: 'text-1',
          type: 'text',
          content: {
            text: 'Hi {{MERGE:first_name}},\n\nWe would love for you to join us at our upcoming event!'
          }
        },
        {
          id: 'text-2',
          type: 'text',
          content: {
            text: '📅 Event Details\n• Date: [Insert Date]\n• Time: [Insert Time]\n• Location: [Insert Location]\n• Dress Code: [Insert Code]'
          }
        },
        {
          id: 'button-1',
          type: 'button',
          content: {
            buttonText: 'RSVP Now',
            buttonUrl: 'https://example.com/rsvp',
            buttonColor: '#8b5cf6'
          }
        },
        {
          id: 'divider-1',
          type: 'divider',
          content: {
            dividerColor: '#E5E7EB'
          }
        },
        {
          id: 'text-3',
          type: 'text',
          content: {
            text: 'Space is limited. Reserve your spot today!'
          }
        },
        { ...defaultFooter, id: 'footer-4' }
      ],
      settings: {
        companyName: '',
        backgroundColor: '#F3E8FF',
        textColor: '#333333',
        linkColor: '#8b5cf6',
        fontFamily: 'DM Sans, sans-serif'
      }
    }
  },
  {
    id: 'blank',
    name: 'Blank Template',
    category: 'basic',
    description: 'Start from scratch',
    is_locked: true,
    content: {
      sections: [
        {
          id: 'text-1',
          type: 'text',
          content: {
            text: 'Start writing your email here...'
          }
        },
        { ...defaultFooter, id: 'footer-5' }
      ],
      settings: {
        companyName: '',
        backgroundColor: '#FFFFFF',
        textColor: '#333333',
        linkColor: '#f3ba42',
        fontFamily: 'DM Sans, sans-serif'
      }
    }
  }
];

/**
 * Get template by ID
 */
export function getTemplateById(id: string): EmailTemplate | undefined {
  return EMAIL_TEMPLATES.find(t => t.id === id);
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: string): EmailTemplate[] {
  return EMAIL_TEMPLATES.filter(t => t.category === category);
}

/**
 * Extract editable field names from template HTML
 */
export function extractEditableFields(html: string): string[] {
  const regex = /\{\{EDITABLE:(\w+)\}\}/g;
  const fields: string[] = [];
  let match;
  while ((match = regex.exec(html)) !== null) {
    fields.push(match[1]);
  }
  return fields;
}

/**
 * Extract merge field names from template HTML
 */
export function extractMergeFields(html: string): string[] {
  const regex = /\{\{MERGE:(\w+)\}\}/g;
  const fields: string[] = [];
  let match;
  while ((match = regex.exec(html)) !== null) {
    if (!fields.includes(match[1])) fields.push(match[1]);
  }
  return fields;
}