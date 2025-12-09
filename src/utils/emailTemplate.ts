/**
 * EXPERT-DESIGNED EMAIL TEMPLATES
 * Each template has UNIQUE, purpose-specific content
 * 
 * All templates use:
 * - Table-based layout for email client compatibility
 * - Inline CSS only (no <style> tags)
 * - 600px max-width responsive design
 * - Brand colors: Gold #f3ba42, Purple #57377d, Black #000000
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
  // ==================== MARKETING TEMPLATES ====================
  
  {
    id: 'product-launch-hero',
    name: 'Product Launch',
    category: 'marketing',
    thumbnail: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'Bold product launch announcement with hero image',
    supportsPersonalization: true,
    htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 20px 10px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="width: 100%; max-width: 600px; background-color: #ffffff;">
          
          <!-- Header -->
          <tr>
            <td align="center" style="background: linear-gradient(135deg, #000000 0%, #57377d 100%); padding: 50px 30px;">
              <h1 style="margin: 0 0 15px 0; color: #f3ba42; font-size: 48px; font-weight: bold; font-family: Arial, Helvetica, sans-serif;">LAUNCHING NOW</h1>
              <p style="margin: 0; color: #ffffff; font-size: 22px; font-family: Arial, Helvetica, sans-serif;">Introducing Our Revolutionary New Product</p>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 50px 30px;">
              <p style="margin: 0 0 20px 0; color: #000000; font-size: 18px; font-family: Arial, Helvetica, sans-serif;">Hi {{MERGE:first_name}},</p>
              
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.8; font-family: Arial, Helvetica, sans-serif;">
                After months of development, we're thrilled to announce the launch of our groundbreaking new solution. This is what you've been waiting for.
              </p>
              
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.8; font-family: Arial, Helvetica, sans-serif;">
                <strong style="color: #000000;">Key Features:</strong>
              </p>
              
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0 0 30px 0;">
                <tr>
                  <td style="padding: 15px; background-color: #f8f8f8; border-left: 4px solid #f3ba42;">
                    <p style="margin: 0 0 8px 0; color: #000000; font-size: 16px; font-weight: bold; font-family: Arial, Helvetica, sans-serif;">⚡ Lightning Fast Performance</p>
                    <p style="margin: 0; color: #666666; font-size: 14px; font-family: Arial, Helvetica, sans-serif;">10x faster than traditional solutions</p>
                  </td>
                </tr>
              </table>
              
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0 0 30px 0;">
                <tr>
                  <td style="padding: 15px; background-color: #f8f8f8; border-left: 4px solid #57377d;">
                    <p style="margin: 0 0 8px 0; color: #000000; font-size: 16px; font-weight: bold; font-family: Arial, Helvetica, sans-serif;">🎯 Precision Targeting</p>
                    <p style="margin: 0; color: #666666; font-size: 14px; font-family: Arial, Helvetica, sans-serif;">Advanced AI-powered recommendations</p>
                  </td>
                </tr>
              </table>
              
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0 0 30px 0;">
                <tr>
                  <td style="padding: 15px; background-color: #f8f8f8; border-left: 4px solid #000000;">
                    <p style="margin: 0 0 8px 0; color: #000000; font-size: 16px; font-weight: bold; font-family: Arial, Helvetica, sans-serif;">🔒 Enterprise Security</p>
                    <p style="margin: 0; color: #666666; font-size: 14px; font-family: Arial, Helvetica, sans-serif;">Bank-level encryption and compliance</p>
                  </td>
                </tr>
              </table>
              
              <!-- CTA -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="#" style="display: inline-block; background-color: #f3ba42; color: #000000; text-decoration: none; padding: 18px 50px; border-radius: 6px; font-weight: bold; font-size: 18px; font-family: Arial, Helvetica, sans-serif;">Get Early Access →</a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 30px 0 0 0; color: #999999; font-size: 14px; text-align: center; font-family: Arial, Helvetica, sans-serif;">
                Limited spots available. Launch price ends in 48 hours.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #f8f8f8; border-top: 1px solid #e5e5e5;">
              <p style="margin: 0 0 10px 0; text-align: center; font-size: 14px; color: #666666; font-family: Arial, Helvetica, sans-serif;">
                {{COMPANY_NAME}}
              </p>
              <p style="margin: 0; text-align: center; font-size: 12px; color: #999999; font-family: Arial, Helvetica, sans-serif;">
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
    id: 'limited-time-offer',
    name: 'Limited Time Offer',
    category: 'marketing',
    thumbnail: 'https://images.pexels.com/photos/5632402/pexels-photo-5632402.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'Urgency-driven promotional email with countdown',
    supportsPersonalization: true,
    htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #000000;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #000000;">
    <tr>
      <td align="center" style="padding: 20px 10px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="width: 100%; max-width: 600px; background-color: #ffffff;">
          
          <!-- Urgent Banner -->
          <tr>
            <td align="center" style="background-color: #f3ba42; padding: 15px;">
              <p style="margin: 0; color: #000000; font-size: 16px; font-weight: bold; font-family: Arial, Helvetica, sans-serif;">⏰ FLASH SALE - ENDS IN 24 HOURS</p>
            </td>
          </tr>
          
          <!-- Header -->
          <tr>
            <td align="center" style="padding: 50px 30px 30px 30px;">
              <h1 style="margin: 0 0 10px 0; color: #000000; font-size: 52px; font-weight: bold; font-family: Arial, Helvetica, sans-serif;">50% OFF</h1>
              <p style="margin: 0; color: #57377d; font-size: 24px; font-weight: bold; font-family: Arial, Helvetica, sans-serif;">Everything Must Go!</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 0 30px 40px 30px;">
              <p style="margin: 0 0 20px 0; color: #000000; font-size: 18px; font-family: Arial, Helvetica, sans-serif;">Hi {{MERGE:first_name}},</p>
              
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.8; font-family: Arial, Helvetica, sans-serif;">
                This is not a drill. For the next 24 hours only, you can save <strong>50% on your entire order</strong>. No minimums. No exclusions. Just massive savings.
              </p>
              
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.8; font-family: Arial, Helvetica, sans-serif;">
                Whether you've been eyeing our premium plans or want to stock up on essentials, now's the time to act.
              </p>
              
              <!-- Offer Box -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 30px 0; background-color: #f8f8f8; border: 3px dashed #f3ba42;">
                <tr>
                  <td style="padding: 30px; text-align: center;">
                    <p style="margin: 0 0 10px 0; color: #000000; font-size: 18px; font-weight: bold; font-family: Arial, Helvetica, sans-serif;">Your Exclusive Code:</p>
                    <p style="margin: 0 0 20px 0; color: #57377d; font-size: 32px; font-weight: bold; font-family: 'Courier New', monospace; letter-spacing: 3px;">FLASH50</p>
                    <p style="margin: 0; color: #666666; font-size: 14px; font-family: Arial, Helvetica, sans-serif;">Valid for 24 hours only</p>
                  </td>
                </tr>
              </table>
              
              <!-- CTA -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="#" style="display: inline-block; background-color: #000000; color: #f3ba42; text-decoration: none; padding: 20px 60px; border-radius: 6px; font-weight: bold; font-size: 18px; font-family: Arial, Helvetica, sans-serif;">Claim My 50% Off →</a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 30px 0 0 0; color: #ff0000; font-size: 15px; text-align: center; font-weight: bold; font-family: Arial, Helvetica, sans-serif;">
                ⚠️ Sale ends midnight tonight - Don't miss out!
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #000000;">
              <p style="margin: 0 0 10px 0; text-align: center; font-size: 14px; color: #ffffff; font-family: Arial, Helvetica, sans-serif;">
                {{COMPANY_NAME}}
              </p>
              <p style="margin: 0; text-align: center; font-size: 12px; color: #999999; font-family: Arial, Helvetica, sans-serif;">
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
    thumbnail: 'https://images.pexels.com/photos/2608517/pexels-photo-2608517.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'Professional event invitation with RSVP',
    supportsPersonalization: true,
    htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 20px 10px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="width: 100%; max-width: 600px; background-color: #ffffff; border: 2px solid #000000;">
          
          <!-- Header -->
          <tr>
            <td align="center" style="background-color: #57377d; padding: 50px 30px;">
              <p style="margin: 0 0 15px 0; color: #f3ba42; font-size: 18px; font-weight: bold; text-transform: uppercase; letter-spacing: 3px; font-family: Arial, Helvetica, sans-serif;">You're Invited</p>
              <h1 style="margin: 0 0 15px 0; color: #ffffff; font-size: 42px; font-weight: bold; font-family: Arial, Helvetica, sans-serif;">Annual Leadership Summit 2024</h1>
              <p style="margin: 0; color: #ffffff; font-size: 18px; font-family: Arial, Helvetica, sans-serif;">Join industry leaders for a day of insights and networking</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 50px 30px;">
              <p style="margin: 0 0 20px 0; color: #000000; font-size: 18px; font-family: Arial, Helvetica, sans-serif;">Dear {{MERGE:first_name}},</p>
              
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.8; font-family: Arial, Helvetica, sans-serif;">
                We're honored to invite you to our exclusive Annual Leadership Summit, where the brightest minds in the industry come together to share groundbreaking strategies and forge powerful connections.
              </p>
              
              <!-- Event Details Box -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 30px 0; background-color: #f8f8f8; border-left: 4px solid #f3ba42;">
                <tr>
                  <td style="padding: 25px;">
                    <p style="margin: 0 0 15px 0; color: #000000; font-size: 18px; font-weight: bold; font-family: Arial, Helvetica, sans-serif;">📅 Event Details:</p>
                    
                    <p style="margin: 0 0 10px 0; color: #333333; font-size: 15px; font-family: Arial, Helvetica, sans-serif;">
                      <strong>Date:</strong> March 15, 2024<br>
                      <strong>Time:</strong> 9:00 AM - 5:00 PM<br>
                      <strong>Location:</strong> Grand Conference Center, Downtown<br>
                      <strong>Dress Code:</strong> Business Professional
                    </p>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.8; font-family: Arial, Helvetica, sans-serif;">
                <strong>Featured Sessions:</strong>
              </p>
              
              <ul style="margin: 0 0 30px 0; padding-left: 20px; color: #333333; font-size: 15px; line-height: 2; font-family: Arial, Helvetica, sans-serif;">
                <li>Keynote: "The Future of Digital Transformation"</li>
                <li>Panel Discussion: Navigating Market Disruption</li>
                <li>Workshop: Building High-Performance Teams</li>
                <li>Networking Lunch with C-Suite Executives</li>
              </ul>
              
              <!-- CTA -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="#" style="display: inline-block; background-color: #f3ba42; color: #000000; text-decoration: none; padding: 18px 50px; border-radius: 6px; font-weight: bold; font-size: 18px; font-family: Arial, Helvetica, sans-serif;">Reserve Your Spot →</a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 30px 0 0 0; color: #999999; font-size: 14px; text-align: center; font-family: Arial, Helvetica, sans-serif;">
                Limited seating available. RSVP by March 1st.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #f8f8f8; border-top: 1px solid #e5e5e5;">
              <p style="margin: 0 0 10px 0; text-align: center; font-size: 14px; color: #666666; font-family: Arial, Helvetica, sans-serif;">
                {{COMPANY_NAME}}
              </p>
              <p style="margin: 0; text-align: center; font-size: 12px; color: #999999; font-family: Arial, Helvetica, sans-serif;">
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

  // ==================== SALES TEMPLATES ====================
  
  {
    id: 'sales-cold-outreach',
    name: 'Cold Outreach',
    category: 'sales',
    thumbnail: 'https://images.pexels.com/photos/5198239/pexels-photo-5198239.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'Personalized cold email for initial contact',
    supportsPersonalization: true,
    htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #ffffff;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
    <tr>
      <td align="center" style="padding: 40px 10px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="width: 100%; max-width: 600px;">
          <tr>
            <td style="padding: 0 30px;">
              <p style="margin: 0 0 25px 0; color: #000000; font-size: 18px; font-family: Arial, Helvetica, sans-serif;">Hi {{MERGE:first_name}},</p>
              
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.8; font-family: Arial, Helvetica, sans-serif;">
                I came across your profile and noticed you're leading {{MERGE:company}}'s growth initiatives as {{MERGE:role}}. Impressive work on your recent expansion!
              </p>
              
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.8; font-family: Arial, Helvetica, sans-serif;">
                I'm reaching out because we've helped similar companies in your industry <strong>increase their revenue by 40%</strong> in just 6 months using our proven framework.
              </p>
              
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.8; font-family: Arial, Helvetica, sans-serif;">
                <strong>Quick question:</strong> Are you currently facing any challenges with customer acquisition costs or conversion rates?
              </p>
              
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.8; font-family: Arial, Helvetica, sans-serif;">
                I'd love to share a few strategies that could help {{MERGE:company}} scale faster without burning through budget. Would you be open to a quick 15-minute call this week?
              </p>
              
              <!-- CTA -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 30px 0;">
                <tr>
                  <td>
                    <a href="#" style="display: inline-block; background-color: #f3ba42; color: #000000; text-decoration: none; padding: 14px 35px; border-radius: 6px; font-weight: bold; font-size: 16px; font-family: Arial, Helvetica, sans-serif;">Book a Call →</a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0 0 8px 0; color: #333333; font-size: 16px; font-family: Arial, Helvetica, sans-serif;">Best regards,</p>
              <p style="margin: 0 0 5px 0; color: #000000; font-size: 16px; font-weight: bold; font-family: Arial, Helvetica, sans-serif;">Sarah Chen</p>
              <p style="margin: 0 0 20px 0; color: #666666; font-size: 15px; font-family: Arial, Helvetica, sans-serif;">Senior Growth Consultant | {{COMPANY_NAME}}</p>
              
              <p style="margin: 0; color: #999999; font-size: 13px; font-family: Arial, Helvetica, sans-serif;">
                P.S. No pressure! If timing isn't right, feel free to ignore this email. But if you're curious, here's a <a href="#" style="color: #57377d;">2-minute case study</a> of how we helped a similar company.
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
    id: 'sales-follow-up',
    name: 'Meeting Follow-Up',
    category: 'sales',
    thumbnail: 'https://images.pexels.com/photos/3183197/pexels-photo-3183197.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'Professional follow-up after meetings',
    supportsPersonalization: true,
    htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #ffffff;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
    <tr>
      <td align="center" style="padding: 40px 10px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="width: 100%; max-width: 600px;">
          <tr>
            <td style="padding: 0 30px;">
              <p style="margin: 0 0 25px 0; color: #000000; font-size: 18px; font-family: Arial, Helvetica, sans-serif;">Hi {{MERGE:first_name}},</p>
              
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.8; font-family: Arial, Helvetica, sans-serif;">
                Thank you for taking the time to meet with me yesterday. I really enjoyed our conversation about {{MERGE:company}}'s growth strategy and learning more about your goals for Q1.
              </p>
              
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.8; font-family: Arial, Helvetica, sans-serif;">
                <strong>Here's a quick recap of what we discussed:</strong>
              </p>
              
              <!-- Meeting Notes Box -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 20px 0; background-color: #f8f8f8; border-left: 4px solid #57377d;">
                <tr>
                  <td style="padding: 20px;">
                    <ul style="margin: 0; padding-left: 20px; color: #333333; font-size: 15px; line-height: 1.9; font-family: Arial, Helvetica, sans-serif;">
                      <li>Your current challenge: Scaling customer support while maintaining quality</li>
                      <li>Target: Reduce response time by 50% within 3 months</li>
                      <li>Budget: $50K-$75K for solution implementation</li>
                      <li>Timeline: Looking to implement by end of Q1</li>
                    </ul>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.8; font-family: Arial, Helvetica, sans-serif;">
                Based on our discussion, I've put together a <strong>custom proposal</strong> that addresses each of your concerns:
              </p>
              
              <ul style="margin: 0 0 25px 0; padding-left: 20px; color: #333333; font-size: 15px; line-height: 2; font-family: Arial, Helvetica, sans-serif;">
                <li>✓ 30-day onboarding plan with dedicated support</li>
                <li>✓ AI-powered automation to reduce manual workload</li>
                <li>✓ Real-time analytics dashboard</li>
                <li>✓ Guaranteed 60% reduction in response time</li>
              </ul>
              
              <!-- CTA -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 30px 0;">
                <tr>
                  <td>
                    <a href="#" style="display: inline-block; background-color: #000000; color: #f3ba42; text-decoration: none; padding: 16px 40px; border-radius: 6px; font-weight: bold; font-size: 16px; font-family: Arial, Helvetica, sans-serif;">View Full Proposal →</a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.8; font-family: Arial, Helvetica, sans-serif;">
                I'm available this Thursday or Friday if you'd like to discuss the proposal in detail. What works best for you?
              </p>
              
              <p style="margin: 0 0 8px 0; color: #333333; font-size: 16px; font-family: Arial, Helvetica, sans-serif;">Looking forward to hearing from you,</p>
              <p style="margin: 0 0 5px 0; color: #000000; font-size: 16px; font-weight: bold; font-family: Arial, Helvetica, sans-serif;">Michael Torres</p>
              <p style="margin: 0; color: #666666; font-size: 15px; font-family: Arial, Helvetica, sans-serif;">Account Executive | {{COMPANY_NAME}}</p>
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
    id: 'demo-invitation',
    name: 'Demo Invitation',
    category: 'sales',
    thumbnail: 'https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'Compelling product demo invitation',
    supportsPersonalization: true,
    htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 20px 10px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="width: 100%; max-width: 600px; background-color: #ffffff;">
          
          <!-- Header -->
          <tr>
            <td align="center" style="background: linear-gradient(135deg, #57377d 0%, #000000 100%); padding: 40px 30px;">
              <h1 style="margin: 0 0 10px 0; color: #f3ba42; font-size: 38px; font-weight: bold; font-family: Arial, Helvetica, sans-serif;">See It In Action</h1>
              <p style="margin: 0; color: #ffffff; font-size: 18px; font-family: Arial, Helvetica, sans-serif;">Join us for a personalized 30-minute demo</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 50px 30px;">
              <p style="margin: 0 0 20px 0; color: #000000; font-size: 18px; font-family: Arial, Helvetica, sans-serif;">Hi {{MERGE:first_name}},</p>
              
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.8; font-family: Arial, Helvetica, sans-serif;">
                I noticed you downloaded our whitepaper on scaling customer operations. Great choice! Many companies like {{MERGE:company}} are facing similar challenges.
              </p>
              
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.8; font-family: Arial, Helvetica, sans-serif;">
                I'd love to show you <strong>exactly how our platform can help you</strong>:
              </p>
              
              <!-- Benefits -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 25px 0;">
                <tr>
                  <td style="padding: 15px; background-color: #f8f8f8;">
                    <p style="margin: 0 0 8px 0; color: #000000; font-size: 16px; font-weight: bold; font-family: Arial, Helvetica, sans-serif;">⚡ Live Product Walkthrough</p>
                    <p style="margin: 0; color: #666666; font-size: 14px; line-height: 1.6; font-family: Arial, Helvetica, sans-serif;">See how top companies use our platform to cut costs by 40%</p>
                  </td>
                </tr>
              </table>
              
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 15px 0;">
                <tr>
                  <td style="padding: 15px; background-color: #f8f8f8;">
                    <p style="margin: 0 0 8px 0; color: #000000; font-size: 16px; font-weight: bold; font-family: Arial, Helvetica, sans-serif;">🎯 Customized to Your Use Case</p>
                    <p style="margin: 0; color: #666666; font-size: 14px; line-height: 1.6; font-family: Arial, Helvetica, sans-serif;">We'll focus on solving YOUR specific challenges</p>
                  </td>
                </tr>
              </table>
              
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 15px 0 25px 0;">
                <tr>
                  <td style="padding: 15px; background-color: #f8f8f8;">
                    <p style="margin: 0 0 8px 0; color: #000000; font-size: 16px; font-weight: bold; font-family: Arial, Helvetica, sans-serif;">💡 Expert Q&A Session</p>
                    <p style="margin: 0; color: #666666; font-size: 14px; line-height: 1.6; font-family: Arial, Helvetica, sans-serif;">Get answers to all your technical and business questions</p>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0 0 25px 0; color: #333333; font-size: 16px; line-height: 1.8; font-family: Arial, Helvetica, sans-serif;">
                <strong>The demo takes just 30 minutes</strong> and you'll walk away with:
              </p>
              
              <ul style="margin: 0 0 30px 0; padding-left: 20px; color: #333333; font-size: 15px; line-height: 2; font-family: Arial, Helvetica, sans-serif;">
                <li>Clear understanding of ROI potential for your business</li>
                <li>Implementation timeline and resource requirements</li>
                <li>Custom pricing based on your needs</li>
              </ul>
              
              <!-- CTA -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="#" style="display: inline-block; background-color: #f3ba42; color: #000000; text-decoration: none; padding: 18px 45px; border-radius: 6px; font-weight: bold; font-size: 18px; font-family: Arial, Helvetica, sans-serif;">Schedule My Demo →</a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0; color: #999999; font-size: 14px; text-align: center; font-family: Arial, Helvetica, sans-serif;">
                Pick a time that works for you - We're flexible!
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #f8f8f8; border-top: 1px solid #e5e5e5;">
              <p style="margin: 0 0 10px 0; text-align: center; font-size: 14px; color: #666666; font-family: Arial, Helvetica, sans-serif;">
                {{COMPANY_NAME}}
              </p>
              <p style="margin: 0; text-align: center; font-size: 12px; color: #999999; font-family: Arial, Helvetica, sans-serif;">
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

  // ==================== NEWSLETTER TEMPLATES ====================
  
  {
    id: 'weekly-digest',
    name: 'Weekly Digest',
    category: 'newsletter',
    thumbnail: 'https://images.pexels.com/photos/6457579/pexels-photo-6457579.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'Curated content roundup for regular updates',
    supportsPersonalization: false,
    htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 20px 10px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="width: 100%; max-width: 600px; background-color: #ffffff;">
          
          <!-- Header -->
          <tr>
            <td style="padding: 40px 30px; background-color: #000000;">
              <h1 style="margin: 0 0 10px 0; color: #f3ba42; font-size: 36px; font-weight: bold; font-family: Arial, Helvetica, sans-serif;">Weekly Digest</h1>
              <p style="margin: 0; color: #ffffff; font-size: 16px; font-family: Arial, Helvetica, sans-serif;">Your weekly dose of industry insights • December 9, 2024</p>
            </td>
          </tr>
          
          <!-- Featured Story -->
          <tr>
            <td style="padding: 40px 30px 30px 30px;">
              <p style="margin: 0 0 10px 0; color: #57377d; font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; font-family: Arial, Helvetica, sans-serif;">Featured Story</p>
              <h2 style="margin: 0 0 15px 0; color: #000000; font-size: 28px; font-weight: bold; line-height: 1.3; font-family: Arial, Helvetica, sans-serif;">The Rise of AI in Customer Experience: What You Need to Know</h2>
              <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.8; font-family: Arial, Helvetica, sans-serif;">
                Artificial intelligence is revolutionizing how companies interact with customers. Here's how leading brands are implementing AI-powered solutions to deliver personalized experiences at scale.
              </p>
              <a href="#" style="color: #57377d; font-size: 15px; font-weight: bold; text-decoration: none; font-family: Arial, Helvetica, sans-serif;">Read Full Article →</a>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 0 30px;">
              <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 0;">
            </td>
          </tr>
          
          <!-- Article 1 -->
          <tr>
            <td style="padding: 30px;">
              <h3 style="margin: 0 0 12px 0; color: #000000; font-size: 20px; font-weight: bold; font-family: Arial, Helvetica, sans-serif;">5 Marketing Trends Dominating 2024</h3>
              <p style="margin: 0 0 15px 0; color: #666666; font-size: 15px; line-height: 1.7; font-family: Arial, Helvetica, sans-serif;">
                From short-form video to AI-generated content, here are the trends shaping modern marketing strategies.
              </p>
              <a href="#" style="color: #57377d; font-size: 14px; font-weight: bold; text-decoration: none; font-family: Arial, Helvetica, sans-serif;">Read More →</a>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 0 30px;">
              <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 0;">
            </td>
          </tr>
          
          <!-- Article 2 -->
          <tr>
            <td style="padding: 30px;">
              <h3 style="margin: 0 0 12px 0; color: #000000; font-size: 20px; font-weight: bold; font-family: Arial, Helvetica, sans-serif;">Case Study: How Company X Increased ROI by 300%</h3>
              <p style="margin: 0 0 15px 0; color: #666666; font-size: 15px; line-height: 1.7; font-family: Arial, Helvetica, sans-serif;">
                A deep dive into the strategies and tactics that led to unprecedented growth in just 6 months.
              </p>
              <a href="#" style="color: #57377d; font-size: 14px; font-weight: bold; text-decoration: none; font-family: Arial, Helvetica, sans-serif;">Read More →</a>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 0 30px;">
              <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 0;">
            </td>
          </tr>
          
          <!-- Article 3 -->
          <tr>
            <td style="padding: 30px;">
              <h3 style="margin: 0 0 12px 0; color: #000000; font-size: 20px; font-weight: bold; font-family: Arial, Helvetica, sans-serif;">Expert Interview: Building Scalable Systems</h3>
              <p style="margin: 0 0 15px 0; color: #666666; font-size: 15px; line-height: 1.7; font-family: Arial, Helvetica, sans-serif;">
                We sat down with industry veteran Jane Doe to discuss best practices for scaling operations.
              </p>
              <a href="#" style="color: #57377d; font-size: 14px; font-weight: bold; text-decoration: none; font-family: Arial, Helvetica, sans-serif;">Read More →</a>
            </td>
          </tr>
          
          <!-- Quick Links -->
          <tr>
            <td style="padding: 30px; background-color: #f8f8f8;">
              <p style="margin: 0 0 15px 0; color: #000000; font-size: 16px; font-weight: bold; font-family: Arial, Helvetica, sans-serif;">Quick Links</p>
              <p style="margin: 0 0 8px 0; font-size: 15px; font-family: Arial, Helvetica, sans-serif;">
                <a href="#" style="color: #57377d; text-decoration: none;">📚 Resource Library</a>
              </p>
              <p style="margin: 0 0 8px 0; font-size: 15px; font-family: Arial, Helvetica, sans-serif;">
                <a href="#" style="color: #57377d; text-decoration: none;">🎓 Upcoming Webinars</a>
              </p>
              <p style="margin: 0; font-size: 15px; font-family: Arial, Helvetica, sans-serif;">
                <a href="#" style="color: #57377d; text-decoration: none;">💼 Career Opportunities</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #000000;">
              <p style="margin: 0 0 10px 0; text-align: center; font-size: 14px; color: #ffffff; font-family: Arial, Helvetica, sans-serif;">
                {{COMPANY_NAME}}
              </p>
              <p style="margin: 0; text-align: center; font-size: 12px; color: #999999; font-family: Arial, Helvetica, sans-serif;">
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
    id: 'monthly-roundup',
    name: 'Monthly Roundup',
    category: 'newsletter',
    thumbnail: 'https://images.pexels.com/photos/733856/pexels-photo-733856.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'Comprehensive monthly update newsletter',
    supportsPersonalization: false,
    htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Georgia, serif; background-color: #faf9f7;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #faf9f7;">
    <tr>
      <td align="center" style="padding: 20px 10px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="width: 100%; max-width: 600px; background-color: #ffffff;">
          
          <!-- Header -->
          <tr>
            <td style="padding: 50px 40px 30px 40px; border-bottom: 3px solid #000000;">
              <h1 style="margin: 0 0 10px 0; color: #000000; font-size: 42px; font-weight: bold; font-family: Georgia, serif;">December 2024</h1>
              <p style="margin: 0; color: #666666; font-size: 18px; font-family: Georgia, serif; font-style: italic;">Your Monthly Industry Roundup</p>
            </td>
          </tr>
          
          <!-- Editor's Note -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 10px 0; color: #57377d; font-size: 14px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; font-family: Arial, Helvetica, sans-serif;">From the Editor</p>
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 17px; line-height: 1.8; font-family: Georgia, serif;">
                Welcome to December's edition! This month we're diving deep into year-end trends, celebrating major industry milestones, and looking ahead to what 2024 has in store.
              </p>
            </td>
          </tr>
          
          <!-- Section 1: Industry News -->
          <tr>
            <td style="padding: 0 40px 30px 40px;">
              <h2 style="margin: 0 0 20px 0; color: #000000; font-size: 28px; font-weight: bold; padding-bottom: 10px; border-bottom: 2px solid #f3ba42; font-family: Georgia, serif;">Industry Highlights</h2>
              
              <h3 style="margin: 0 0 10px 0; color: #000000; font-size: 20px; font-weight: bold; font-family: Georgia, serif;">Market Reaches All-Time High</h3>
              <p style="margin: 0 0 25px 0; color: #666666; font-size: 16px; line-height: 1.8; font-family: Georgia, serif;">
                The industry saw unprecedented growth this quarter, with major players reporting record revenues. Analysts attribute this surge to increased digital adoption and innovative solutions.
              </p>
              
              <h3 style="margin: 0 0 10px 0; color: #000000; font-size: 20px; font-weight: bold; font-family: Georgia, serif;">New Regulations Take Effect</h3>
              <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.8; font-family: Georgia, serif;">
                Starting January 2025, companies must comply with updated data privacy standards. Here's what you need to know to stay compliant.
              </p>
            </td>
          </tr>
          
          <!-- Section 2: Company Updates -->
          <tr>
            <td style="padding: 0 40px 30px 40px;">
              <h2 style="margin: 0 0 20px 0; color: #000000; font-size: 28px; font-weight: bold; padding-bottom: 10px; border-bottom: 2px solid #f3ba42; font-family: Georgia, serif;">What We've Been Up To</h2>
              
              <ul style="margin: 0 0 20px 0; padding-left: 20px; color: #666666; font-size: 16px; line-height: 2.2; font-family: Georgia, serif;">
                <li>Launched 3 major product updates based on your feedback</li>
                <li>Expanded our team with 15 new industry experts</li>
                <li>Hosted our biggest conference yet with 5,000+ attendees</li>
                <li>Published 12 in-depth research reports</li>
              </ul>
            </td>
          </tr>
          
          <!-- Featured Resource -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f8f8f8; border-left: 5px solid #57377d;">
              <p style="margin: 0 0 10px 0; color: #57377d; font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; font-family: Arial, Helvetica, sans-serif;">Featured Resource</p>
              <h3 style="margin: 0 0 12px 0; color: #000000; font-size: 22px; font-weight: bold; font-family: Georgia, serif;">2024 Year in Review: Complete Guide</h3>
              <p style="margin: 0 0 20px 0; color: #666666; font-size: 15px; line-height: 1.7; font-family: Georgia, serif;">
                Our comprehensive 50-page report analyzing the year's biggest trends, failures, and successes. Packed with data, insights, and predictions for 2025.
              </p>
              <a href="#" style="display: inline-block; background-color: #000000; color: #f3ba42; text-decoration: none; padding: 12px 30px; font-weight: bold; font-size: 15px; font-family: Arial, Helvetica, sans-serif;">Download Free →</a>
            </td>
          </tr>
          
          <!-- Stats -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 25px 0; color: #000000; font-size: 28px; font-weight: bold; text-align: center; font-family: Georgia, serif;">By the Numbers</h2>
              
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding: 20px;">
                    <p style="margin: 0 0 5px 0; color: #f3ba42; font-size: 42px; font-weight: bold; font-family: Georgia, serif;">250K+</p>
                    <p style="margin: 0; color: #666666; font-size: 14px; font-family: Arial, Helvetica, sans-serif;">Active Users</p>
                  </td>
                  <td align="center" style="padding: 20px;">
                    <p style="margin: 0 0 5px 0; color: #57377d; font-size: 42px; font-weight: bold; font-family: Georgia, serif;">150+</p>
                    <p style="margin: 0; color: #666666; font-size: 14px; font-family: Arial, Helvetica, sans-serif;">Countries</p>
                  </td>
                  <td align="center" style="padding: 20px;">
                    <p style="margin: 0 0 5px 0; color: #000000; font-size: 42px; font-weight: bold; font-family: Georgia, serif;">98%</p>
                    <p style="margin: 0; color: #666666; font-size: 14px; font-family: Arial, Helvetica, sans-serif;">Satisfaction</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #000000;">
              <p style="margin: 0 0 10px 0; text-align: center; font-size: 14px; color: #ffffff; font-family: Arial, Helvetica, sans-serif;">
                {{COMPANY_NAME}}
              </p>
              <p style="margin: 0; text-align: center; font-size: 12px; color: #999999; font-family: Arial, Helvetica, sans-serif;">
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

  // ==================== ANNOUNCEMENT TEMPLATES ====================
  
  {
    id: 'feature-announcement',
    name: 'Feature Announcement',
    category: 'announcement',
    thumbnail: 'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'Exciting new feature launch announcement',
    supportsPersonalization: false,
    htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 20px 10px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="width: 100%; max-width: 600px; background-color: #ffffff; border: 3px solid #f3ba42;">
          
          <!-- Header -->
          <tr>
            <td align="center" style="background-color: #000000; padding: 50px 30px;">
              <p style="margin: 0 0 15px 0; color: #f3ba42; font-size: 16px; font-weight: bold; text-transform: uppercase; letter-spacing: 3px; font-family: Arial, Helvetica, sans-serif;">New Feature</p>
              <h1 style="margin: 0 0 15px 0; color: #ffffff; font-size: 44px; font-weight: bold; font-family: Arial, Helvetica, sans-serif;">AI-Powered Analytics</h1>
              <p style="margin: 0; color: #f3ba42; font-size: 20px; font-family: Arial, Helvetica, sans-serif;">Transform data into actionable insights instantly</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 50px 30px;">
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 18px; line-height: 1.8; font-family: Arial, Helvetica, sans-serif;">
                We're thrilled to announce our most powerful feature yet: <strong style="color: #000000;">AI-Powered Analytics</strong>. This game-changing addition will revolutionize how you understand and act on your data.
              </p>
              
              <h2 style="margin: 0 0 20px 0; color: #000000; font-size: 26px; font-weight: bold; font-family: Arial, Helvetica, sans-serif;">What's New?</h2>
              
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0 0 20px 0;">
                <tr>
                  <td style="padding: 20px; background-color: #f8f8f8; border-left: 5px solid #f3ba42;">
                    <h3 style="margin: 0 0 10px 0; color: #000000; font-size: 20px; font-weight: bold; font-family: Arial, Helvetica, sans-serif;">🤖 Intelligent Insights</h3>
                    <p style="margin: 0; color: #666666; font-size: 15px; line-height: 1.7; font-family: Arial, Helvetica, sans-serif;">
                      Our AI automatically identifies trends, anomalies, and opportunities in your data—no manual analysis required.
                    </p>
                  </td>
                </tr>
              </table>
              
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0 0 20px 0;">
                <tr>
                  <td style="padding: 20px; background-color: #f8f8f8; border-left: 5px solid #57377d;">
                    <h3 style="margin: 0 0 10px 0; color: #000000; font-size: 20px; font-weight: bold; font-family: Arial, Helvetica, sans-serif;">📊 Predictive Forecasting</h3>
                    <p style="margin: 0; color: #666666; font-size: 15px; line-height: 1.7; font-family: Arial, Helvetica, sans-serif;">
                      Get accurate predictions for revenue, churn, and growth based on historical patterns and market data.
                    </p>
                  </td>
                </tr>
              </table>
              
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0 0 30px 0;">
                <tr>
                  <td style="padding: 20px; background-color: #f8f8f8; border-left: 5px solid #000000;">
                    <h3 style="margin: 0 0 10px 0; color: #000000; font-size: 20px; font-weight: bold; font-family: Arial, Helvetica, sans-serif;">⚡ Real-Time Alerts</h3>
                    <p style="margin: 0; color: #666666; font-size: 15px; line-height: 1.7; font-family: Arial, Helvetica, sans-serif;">
                      Receive instant notifications when significant changes occur, so you can act fast.
                    </p>
                  </td>
                </tr>
              </table>
              
              <h2 style="margin: 0 0 15px 0; color: #000000; font-size: 24px; font-weight: bold; font-family: Arial, Helvetica, sans-serif;">Available Now</h2>
              <p style="margin: 0 0 30px 0; color: #333333; font-size: 16px; line-height: 1.8; font-family: Arial, Helvetica, sans-serif;">
                This feature is rolling out to all users starting today. Simply log in and navigate to the Analytics section to get started.
              </p>
              
              <!-- CTA -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="#" style="display: inline-block; background-color: #f3ba42; color: #000000; text-decoration: none; padding: 18px 50px; border-radius: 6px; font-weight: bold; font-size: 18px; font-family: Arial, Helvetica, sans-serif;">Try It Now →</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #f8f8f8; border-top: 1px solid #e5e5e5;">
              <p style="margin: 0 0 10px 0; text-align: center; font-size: 14px; color: #666666; font-family: Arial, Helvetica, sans-serif;">
                {{COMPANY_NAME}}
              </p>
              <p style="margin: 0; text-align: center; font-size: 12px; color: #999999; font-family: Arial, Helvetica, sans-serif;">
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
    id: 'company-milestone',
    name: 'Company Milestone',
    category: 'announcement',
    thumbnail: 'https://images.pexels.com/photos/3184357/pexels-photo-3184357.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'Celebrate major achievements with your audience',
    supportsPersonalization: false,
    htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #000000;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #000000;">
    <tr>
      <td align="center" style="padding: 20px 10px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="width: 100%; max-width: 600px; background-color: #ffffff;">
          
          <!-- Celebration Banner -->
          <tr>
            <td align="center" style="background: linear-gradient(135deg, #f3ba42 0%, #57377d 100%); padding: 60px 30px;">
              <h1 style="margin: 0 0 15px 0; color: #ffffff; font-size: 56px; font-weight: bold; font-family: Arial, Helvetica, sans-serif;">🎉 1,000,000</h1>
              <p style="margin: 0 0 10px 0; color: #ffffff; font-size: 24px; font-weight: bold; font-family: Arial, Helvetica, sans-serif;">Users Worldwide!</p>
              <p style="margin: 0; color: #ffffff; font-size: 18px; opacity: 0.95; font-family: Arial, Helvetica, sans-serif;">Thank you for making this possible</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 50px 30px;">
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 18px; line-height: 1.8; font-family: Arial, Helvetica, sans-serif;">
                Today marks an incredible milestone in our journey—<strong style="color: #000000;">we've reached 1 million users</strong> across 150 countries! 🌎
              </p>
              
              <p style="margin: 0 0 30px 0; color: #333333; font-size: 16px; line-height: 1.8; font-family: Arial, Helvetica, sans-serif;">
                When we started 5 years ago with a small team and a big dream, we never imagined we'd grow to serve a community this amazing. This achievement belongs to YOU—our users, partners, and supporters.
              </p>
              
              <h2 style="margin: 0 0 25px 0; color: #000000; font-size: 28px; font-weight: bold; text-align: center; font-family: Arial, Helvetica, sans-serif;">The Journey So Far</h2>
              
              <!-- Timeline -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="padding: 20px 0; border-left: 4px solid #f3ba42; padding-left: 20px;">
                    <p style="margin: 0 0 8px 0; color: #f3ba42; font-size: 14px; font-weight: bold; font-family: Arial, Helvetica, sans-serif;">2019</p>
                    <p style="margin: 0; color: #333333; font-size: 15px; font-family: Arial, Helvetica, sans-serif;">Launched with 100 beta users</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px 0; border-left: 4px solid #57377d; padding-left: 20px;">
                    <p style="margin: 0 0 8px 0; color: #57377d; font-size: 14px; font-weight: bold; font-family: Arial, Helvetica, sans-serif;">2021</p>
                    <p style="margin: 0; color: #333333; font-size: 15px; font-family: Arial, Helvetica, sans-serif;">Crossed 100,000 users milestone</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px 0; border-left: 4px solid #000000; padding-left: 20px;">
                    <p style="margin: 0 0 8px 0; color: #000000; font-size: 14px; font-weight: bold; font-family: Arial, Helvetica, sans-serif;">2023</p>
                    <p style="margin: 0; color: #333333; font-size: 15px; font-family: Arial, Helvetica, sans-serif;">Expanded to 100+ countries</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px 0; border-left: 4px solid #f3ba42; padding-left: 20px;">
                    <p style="margin: 0 0 8px 0; color: #f3ba42; font-size: 14px; font-weight: bold; font-family: Arial, Helvetica, sans-serif;">TODAY</p>
                    <p style="margin: 0; color: #000000; font-size: 15px; font-weight: bold; font-family: Arial, Helvetica, sans-serif;">1,000,000 users! 🎊</p>
                  </td>
                </tr>
              </table>
              
              <!-- Thank You Message -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 40px 0;">
                <tr>
                  <td style="padding: 30px; background-color: #f8f8f8; border: 2px solid #f3ba42; text-align: center;">
                    <h3 style="margin: 0 0 15px 0; color: #000000; font-size: 24px; font-weight: bold; font-family: Arial, Helvetica, sans-serif;">Special Thank You Offer</h3>
                    <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.7; font-family: Arial, Helvetica, sans-serif;">
                      To celebrate, we're giving all users <strong style="color: #000000;">30% off Premium</strong> for the next 7 days!
                    </p>
                    <p style="margin: 0; color: #57377d; font-size: 20px; font-weight: bold; font-family: 'Courier New', monospace; letter-spacing: 2px;">MILLION30</p>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0 0 30px 0; color: #333333; font-size: 16px; line-height: 1.8; text-align: center; font-family: Arial, Helvetica, sans-serif;">
                Here's to the next million! Thank you for being part of our story. 💙
              </p>
              
              <!-- CTA -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="#" style="display: inline-block; background-color: #000000; color: #f3ba42; text-decoration: none; padding: 18px 50px; border-radius: 6px; font-weight: bold; font-size: 18px; font-family: Arial, Helvetica, sans-serif;">Claim Your Discount →</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #000000;">
              <p style="margin: 0 0 10px 0; text-align: center; font-size: 14px; color: #ffffff; font-family: Arial, Helvetica, sans-serif;">
                {{COMPANY_NAME}}
              </p>
              <p style="margin: 0; text-align: center; font-size: 12px; color: #999999; font-family: Arial, Helvetica, sans-serif;">
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