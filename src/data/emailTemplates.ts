/**
 * Professional Email Templates
 *
 * All templates use:
 * - Table-based layout for maximum email client compatibility
 * - Inline CSS (no <style> tags - Gmail strips them)
 * - Responsive design with 600px max-width
 * - Proper HTML email DOCTYPE
 * - Web-safe fonts
 */

import { PROFESSIONAL_TEMPLATES } from './professionalTemplates';

export interface EmailTemplate {
  id: string;
  name: string;
  category: 'marketing' | 'sales' | 'newsletter' | 'announcement' | 'transactional';
  thumbnail: string;
  description: string;
  supportsPersonalization: boolean;
  htmlContent: string;
}

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'professional-announcement',
    name: 'Professional Announcement',
    category: 'announcement',
    thumbnail: 'https://images.pexels.com/photos/6954174/pexels-photo-6954174.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'Clean, professional template for company announcements',
    supportsPersonalization: false,
    htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{SUBJECT_LINE}}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 20px 10px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="width: 100%; max-width: 600px; background-color: #ffffff; border-radius: 8px;">
          <tr>
            <td align="center" style="background-color: #000000; padding: 30px 20px;">
              <h1 style="margin: 0; color: #f3ba42; font-size: 28px; font-weight: bold; font-family: Arial, Helvetica, sans-serif;">{{COMPANY_NAME}}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 40px 20px 40px;">
              <h2 style="margin: 0 0 20px 0; color: #000000; font-size: 32px; font-weight: bold; font-family: Arial, Helvetica, sans-serif;">{{EDITABLE:heading}}</h2>
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6; font-family: Arial, Helvetica, sans-serif;">{{EDITABLE:body}}</p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 20px 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="background-color: #f3ba42; border-radius: 25px; border: 2px solid #000000;">
                    <a href="{{EDITABLE:cta_url}}" style="display: inline-block; padding: 14px 35px; color: #000000; text-decoration: none; font-weight: bold; font-size: 16px; font-family: Arial, Helvetica, sans-serif;">{{EDITABLE:cta_text}}</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f9f9f9; padding: 30px 40px; text-align: center; border-top: 1px solid #dddddd;">
              <p style="margin: 10px 0; font-size: 12px; color: #666666; font-family: Arial, Helvetica, sans-serif;">
                <a href="{{VIEW_IN_BROWSER_URL}}" style="color: #0066cc; text-decoration: underline;">View in browser</a>
              </p>
              <p style="margin: 10px 0; font-size: 12px; color: #666666; font-family: Arial, Helvetica, sans-serif;">
                <a href="{{UNSUBSCRIBE_URL}}" style="color: #666666; text-decoration: underline;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  },
  {
    id: 'personal-outreach',
    name: 'Personal Outreach',
    category: 'sales',
    thumbnail: 'https://images.pexels.com/photos/6954174/pexels-photo-6954174.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'Personalized one-on-one sales outreach',
    supportsPersonalization: true,
    htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{SUBJECT_LINE}}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #ffffff;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
    <tr>
      <td align="center" style="padding: 40px 10px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="width: 100%; max-width: 600px;">
          <tr>
            <td style="padding: 0 30px;">
              <p style="margin: 0 0 20px 0; color: #000000; font-size: 18px; font-family: Arial, Helvetica, sans-serif;">Hi {{MERGE:first_name}},</p>
              <p style="margin: 0 0 16px 0; color: #333333; font-size: 16px; line-height: 1.8; font-family: Arial, Helvetica, sans-serif;">{{EDITABLE:opening}}</p>
              <p style="margin: 0 0 16px 0; color: #333333; font-size: 16px; line-height: 1.8; font-family: Arial, Helvetica, sans-serif;">I noticed you're a {{MERGE:role}} at {{MERGE:company}}. {{EDITABLE:personalized_pitch}}</p>
              <p style="margin: 0 0 16px 0; color: #333333; font-size: 16px; line-height: 1.8; font-family: Arial, Helvetica, sans-serif;">{{EDITABLE:call_to_action}}</p>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e5e5;">
                <tr>
                  <td>
                    <p style="margin: 0 0 8px 0; color: #333333; font-size: 16px; font-family: Arial, Helvetica, sans-serif;">Best regards,</p>
                    <p style="margin: 0; color: #000000; font-size: 16px; font-weight: 600; font-family: Arial, Helvetica, sans-serif;">{{EDITABLE:sender_name}}</p>
                    <p style="margin: 5px 0 0 0; color: #666666; font-size: 16px; font-family: Arial, Helvetica, sans-serif;">{{EDITABLE:sender_title}}</p>
                  </td>
                </tr>
              </table>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e5e5;">
                <tr>
                  <td align="center">
                    <p style="margin: 0; font-size: 12px; color: #999999; font-family: Arial, Helvetica, sans-serif;">
                      <a href="{{UNSUBSCRIBE_URL}}" style="color: #999999; text-decoration: underline;">Unsubscribe</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  },
  {
    id: 'newsletter-modern',
    name: 'Modern Newsletter',
    category: 'newsletter',
    thumbnail: 'https://images.pexels.com/photos/6954174/pexels-photo-6954174.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'Contemporary newsletter with multiple articles',
    supportsPersonalization: false,
    htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{SUBJECT_LINE}}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 20px 10px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="width: 100%; max-width: 600px; background-color: #ffffff;">
          <tr>
            <td align="center" style="background: linear-gradient(135deg, #f3ba42 0%, #57377d 100%); padding: 40px 30px;">
              <h1 style="margin: 0 0 10px 0; color: #ffffff; font-size: 28px; font-weight: bold; font-family: Arial, Helvetica, sans-serif;">{{EDITABLE:newsletter_name}}</h1>
              <p style="margin: 0; color: #ffffff; font-size: 14px; opacity: 0.9; font-family: Arial, Helvetica, sans-serif;">{{EDITABLE:tagline}}</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 40px; padding-bottom: 40px; border-bottom: 1px solid #e5e5e5;">
                <tr>
                  <td>
                    <h2 style="margin: 0 0 15px 0; color: #000000; font-size: 24px; font-weight: bold; font-family: Arial, Helvetica, sans-serif;">{{EDITABLE:article1_title}}</h2>
                    <p style="margin: 0 0 15px 0; color: #333333; font-size: 16px; line-height: 1.6; font-family: Arial, Helvetica, sans-serif;">{{EDITABLE:article1_text}}</p>
                    <a href="{{EDITABLE:article1_url}}" style="color: #f3ba42; font-weight: 600; text-decoration: none; font-family: Arial, Helvetica, sans-serif;">Read more →</a>
                  </td>
                </tr>
              </table>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 40px; padding-bottom: 40px; border-bottom: 1px solid #e5e5e5;">
                <tr>
                  <td>
                    <h2 style="margin: 0 0 15px 0; color: #000000; font-size: 24px; font-weight: bold; font-family: Arial, Helvetica, sans-serif;">{{EDITABLE:article2_title}}</h2>
                    <p style="margin: 0 0 15px 0; color: #333333; font-size: 16px; line-height: 1.6; font-family: Arial, Helvetica, sans-serif;">{{EDITABLE:article2_text}}</p>
                    <a href="{{EDITABLE:article2_url}}" style="color: #f3ba42; font-weight: 600; text-decoration: none; font-family: Arial, Helvetica, sans-serif;">Read more →</a>
                  </td>
                </tr>
              </table>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td>
                    <h2 style="margin: 0 0 15px 0; color: #000000; font-size: 24px; font-weight: bold; font-family: Arial, Helvetica, sans-serif;">{{EDITABLE:article3_title}}</h2>
                    <p style="margin: 0 0 15px 0; color: #333333; font-size: 16px; line-height: 1.6; font-family: Arial, Helvetica, sans-serif;">{{EDITABLE:article3_text}}</p>
                    <a href="{{EDITABLE:article3_url}}" style="color: #f3ba42; font-weight: 600; text-decoration: none; font-family: Arial, Helvetica, sans-serif;">Read more →</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="background-color: #000000; padding: 30px; color: #ffffff;">
              <p style="margin: 0 0 10px 0; font-size: 14px; font-family: Arial, Helvetica, sans-serif;">You're receiving this because you subscribed.</p>
              <p style="margin: 0; font-size: 14px; font-family: Arial, Helvetica, sans-serif;">
                <a href="{{UNSUBSCRIBE_URL}}" style="color: #f3ba42; text-decoration: underline;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  },
  {
    id: 'product-launch',
    name: 'Product Launch',
    category: 'marketing',
    thumbnail: 'https://images.pexels.com/photos/6954174/pexels-photo-6954174.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'Eye-catching product launch announcement',
    supportsPersonalization: false,
    htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{SUBJECT_LINE}}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #000000;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #000000;">
    <tr>
      <td align="center" style="padding: 20px 10px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="width: 100%; max-width: 600px;">
          <tr>
            <td align="center" style="background: linear-gradient(180deg, #57377d 0%, #000000 100%); padding: 60px 30px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="background-color: #f3ba42; padding: 8px 16px; border-radius: 20px; margin-bottom: 20px;">
                    <span style="color: #000000; font-size: 12px; font-weight: bold; font-family: Arial, Helvetica, sans-serif;">{{EDITABLE:badge_text}}</span>
                  </td>
                </tr>
              </table>
              <h1 style="margin: 20px 0; color: #ffffff; font-size: 42px; font-weight: bold; line-height: 1.2; font-family: Arial, Helvetica, sans-serif;">{{EDITABLE:product_name}}</h1>
              <p style="margin: 0 0 30px 0; color: #ffffff; font-size: 18px; opacity: 0.9; font-family: Arial, Helvetica, sans-serif;">{{EDITABLE:tagline}}</p>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="background-color: #f3ba42; border-radius: 50px;">
                    <a href="{{EDITABLE:cta_url}}" style="display: inline-block; padding: 16px 40px; color: #000000; text-decoration: none; font-weight: bold; font-size: 16px; font-family: Arial, Helvetica, sans-serif;">{{EDITABLE:cta_text}}</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color: #ffffff; padding: 50px 30px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="padding-bottom: 30px;">
                    <h3 style="margin: 0 0 10px 0; color: #000000; font-size: 20px; font-weight: bold; font-family: Arial, Helvetica, sans-serif;">{{EDITABLE:feature1_title}}</h3>
                    <p style="margin: 0; color: #666666; font-size: 16px; line-height: 1.6; font-family: Arial, Helvetica, sans-serif;">{{EDITABLE:feature1_description}}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 30px;">
                    <h3 style="margin: 0 0 10px 0; color: #000000; font-size: 20px; font-weight: bold; font-family: Arial, Helvetica, sans-serif;">{{EDITABLE:feature2_title}}</h3>
                    <p style="margin: 0; color: #666666; font-size: 16px; line-height: 1.6; font-family: Arial, Helvetica, sans-serif;">{{EDITABLE:feature2_description}}</p>
                  </td>
                </tr>
                <tr>
                  <td>
                    <h3 style="margin: 0 0 10px 0; color: #000000; font-size: 20px; font-weight: bold; font-family: Arial, Helvetica, sans-serif;">{{EDITABLE:feature3_title}}</h3>
                    <p style="margin: 0; color: #666666; font-size: 16px; line-height: 1.6; font-family: Arial, Helvetica, sans-serif;">{{EDITABLE:feature3_description}}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="background-color: #000000; padding: 30px;">
              <p style="margin: 0; font-size: 14px; color: #999999; font-family: Arial, Helvetica, sans-serif;">
                <a href="{{UNSUBSCRIBE_URL}}" style="color: #999999; text-decoration: underline;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  },
  {
    id: 'event-invitation',
    name: 'Event Invitation',
    category: 'marketing',
    thumbnail: 'https://images.pexels.com/photos/6954174/pexels-photo-6954174.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'Elegant event invitation with RSVP',
    supportsPersonalization: true,
    htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{SUBJECT_LINE}}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 20px 10px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="width: 100%; max-width: 600px; background-color: #ffffff;">
          <tr>
            <td align="center" style="background-color: #f3ba42; padding: 50px 30px;">
              <p style="margin: 0 0 15px 0; color: #000000; font-size: 14px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; font-family: Arial, Helvetica, sans-serif;">{{EDITABLE:event_type}}</p>
              <h1 style="margin: 0; color: #000000; font-size: 36px; font-weight: bold; font-family: Arial, Helvetica, sans-serif;">{{EDITABLE:event_title}}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; color: #000000; font-size: 18px; font-family: Arial, Helvetica, sans-serif;">Hi {{MERGE:first_name}},</p>
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6; font-family: Arial, Helvetica, sans-serif;">{{EDITABLE:invitation_message}}</p>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f9f9f9; border: 2px solid #000000; border-radius: 10px; padding: 30px; margin: 30px 0;">
                <tr>
                  <td>
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="padding-bottom: 15px;">
                          <span style="font-weight: bold; min-width: 80px; display: inline-block; font-family: Arial, Helvetica, sans-serif;">Date:</span>
                          <span style="font-family: Arial, Helvetica, sans-serif;">{{EDITABLE:event_date}}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 15px;">
                          <span style="font-weight: bold; min-width: 80px; display: inline-block; font-family: Arial, Helvetica, sans-serif;">Time:</span>
                          <span style="font-family: Arial, Helvetica, sans-serif;">{{EDITABLE:event_time}}</span>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <span style="font-weight: bold; min-width: 80px; display: inline-block; font-family: Arial, Helvetica, sans-serif;">Location:</span>
                          <span style="font-family: Arial, Helvetica, sans-serif;">{{EDITABLE:event_location}}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="background-color: #57377d; border-radius: 50px;">
                          <a href="{{EDITABLE:rsvp_url}}" style="display: inline-block; padding: 16px 40px; color: #ffffff; text-decoration: none; font-weight: bold; font-family: Arial, Helvetica, sans-serif;">{{EDITABLE:rsvp_text}}</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <p style="margin: 0; color: #333333; font-size: 16px; line-height: 1.6; font-family: Arial, Helvetica, sans-serif;">{{EDITABLE:closing_message}}</p>
            </td>
          </tr>
          <tr>
            <td align="center" style="background-color: #f5f5f5; padding: 30px;">
              <p style="margin: 0; font-size: 14px; color: #666666; font-family: Arial, Helvetica, sans-serif;">
                <a href="{{UNSUBSCRIBE_URL}}" style="color: #666666; text-decoration: underline;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  },
  {
    id: 'simple-text',
    name: 'Simple Text Email',
    category: 'sales',
    thumbnail: 'https://images.pexels.com/photos/6954174/pexels-photo-6954174.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'Plain text style for personal communication',
    supportsPersonalization: true,
    htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{SUBJECT_LINE}}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Courier New', monospace; background-color: #ffffff;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
    <tr>
      <td align="center" style="padding: 40px 10px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="width: 100%; max-width: 600px;">
          <tr>
            <td style="padding: 0 30px;">
              <p style="margin: 0 0 16px 0; color: #000000; font-size: 16px; line-height: 1.8; font-family: 'Courier New', monospace; white-space: pre-wrap;">Hi {{MERGE:first_name}},

{{EDITABLE:paragraph1}}

{{EDITABLE:paragraph2}}

{{EDITABLE:paragraph3}}

Best,
{{EDITABLE:sender_name}}</p>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e5e5;">
                <tr>
                  <td align="center">
                    <p style="margin: 0; font-size: 12px; color: #999999; font-family: Arial, Helvetica, sans-serif;">
                      <a href="{{UNSUBSCRIBE_URL}}" style="color: #999999; text-decoration: underline;">Unsubscribe</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  },
  {
    id: 'welcome-series',
    name: 'Welcome Email',
    category: 'marketing',
    thumbnail: 'https://images.pexels.com/photos/6954174/pexels-photo-6954174.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'Warm welcome for new subscribers',
    supportsPersonalization: true,
    htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{SUBJECT_LINE}}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 20px 10px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="width: 100%; max-width: 600px; background-color: #ffffff;">
          <tr>
            <td align="center" style="background: linear-gradient(135deg, #57377d 0%, #f3ba42 100%); padding: 60px 30px;">
              <h1 style="margin: 0 0 10px 0; color: #ffffff; font-size: 48px; font-weight: bold; font-family: Arial, Helvetica, sans-serif;">Welcome!</h1>
              <p style="margin: 0; color: #ffffff; font-size: 20px; opacity: 0.95; font-family: Arial, Helvetica, sans-serif;">We're excited to have you here</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 50px 30px;">
              <p style="margin: 0 0 25px 0; color: #000000; font-size: 20px; font-family: Arial, Helvetica, sans-serif;">Hi {{MERGE:first_name}},</p>
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.8; font-family: Arial, Helvetica, sans-serif;">{{EDITABLE:welcome_message}}</p>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 30px 0;">
                <tr>
                  <td style="padding-bottom: 25px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td align="center" valign="top" style="width: 40px;">
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                            <tr>
                              <td align="center" style="background-color: #f3ba42; width: 40px; height: 40px; border-radius: 50%;">
                                <span style="color: #000000; font-weight: bold; font-family: Arial, Helvetica, sans-serif;">1</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                        <td style="padding-left: 20px;">
                          <h3 style="margin: 0 0 8px 0; color: #000000; font-size: 18px; font-family: Arial, Helvetica, sans-serif;">{{EDITABLE:step1_title}}</h3>
                          <p style="margin: 0; color: #666666; font-size: 16px; line-height: 1.6; font-family: Arial, Helvetica, sans-serif;">{{EDITABLE:step1_description}}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 25px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td align="center" valign="top" style="width: 40px;">
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                            <tr>
                              <td align="center" style="background-color: #f3ba42; width: 40px; height: 40px; border-radius: 50%;">
                                <span style="color: #000000; font-weight: bold; font-family: Arial, Helvetica, sans-serif;">2</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                        <td style="padding-left: 20px;">
                          <h3 style="margin: 0 0 8px 0; color: #000000; font-size: 18px; font-family: Arial, Helvetica, sans-serif;">{{EDITABLE:step2_title}}</h3>
                          <p style="margin: 0; color: #666666; font-size: 16px; line-height: 1.6; font-family: Arial, Helvetica, sans-serif;">{{EDITABLE:step2_description}}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td>
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td align="center" valign="top" style="width: 40px;">
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                            <tr>
                              <td align="center" style="background-color: #f3ba42; width: 40px; height: 40px; border-radius: 50%;">
                                <span style="color: #000000; font-weight: bold; font-family: Arial, Helvetica, sans-serif;">3</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                        <td style="padding-left: 20px;">
                          <h3 style="margin: 0 0 8px 0; color: #000000; font-size: 18px; font-family: Arial, Helvetica, sans-serif;">{{EDITABLE:step3_title}}</h3>
                          <p style="margin: 0; color: #666666; font-size: 16px; line-height: 1.6; font-family: Arial, Helvetica, sans-serif;">{{EDITABLE:step3_description}}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="background-color: #57377d; border-radius: 50px;">
                          <a href="{{EDITABLE:cta_url}}" style="display: inline-block; padding: 16px 40px; color: #ffffff; text-decoration: none; font-weight: bold; font-family: Arial, Helvetica, sans-serif;">{{EDITABLE:cta_text}}</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <p style="margin: 0; color: #333333; font-size: 16px; line-height: 1.8; font-family: Arial, Helvetica, sans-serif;">{{EDITABLE:closing_message}}</p>
            </td>
          </tr>
          <tr>
            <td align="center" style="background-color: #f5f5f5; padding: 30px;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #666666; font-family: Arial, Helvetica, sans-serif;">Questions? Just reply to this email.</p>
              <p style="margin: 0; font-size: 14px; color: #666666; font-family: Arial, Helvetica, sans-serif;">
                <a href="{{UNSUBSCRIBE_URL}}" style="color: #666666; text-decoration: underline;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  },
  ...PROFESSIONAL_TEMPLATES
];

export function getTemplateById(id: string): EmailTemplate | undefined {
  return EMAIL_TEMPLATES.find(t => t.id === id);
}

export function getTemplatesByCategory(category: string): EmailTemplate[] {
  return EMAIL_TEMPLATES.filter(t => t.category === category);
}

export function extractEditableFields(htmlContent: string): string[] {
  const matches = htmlContent.matchAll(/\{\{EDITABLE:([^}]+)\}\}/g);
  return Array.from(matches).map(match => match[1]);
}

export function extractMergeFields(htmlContent: string): string[] {
  const matches = htmlContent.matchAll(/\{\{MERGE:([^}]+)\}\}/g);
  return Array.from(matches).map(match => match[1]);
}
