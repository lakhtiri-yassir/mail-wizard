/**
 * ============================================================================
 * FIXED: Edge Function - Send Email with Unsubscribe Support
 * ============================================================================
 * 
 * CRITICAL FIX:
 * - Added comprehensive debugging for merge tag replacement
 * - Ensures UNSUBSCRIBE_URL is properly replaced in HTML
 * - Validates that the unsubscribe link is actually in the final email
 * 
 * ============================================================================
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Environment variables
const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const SHARED_SENDING_DOMAIN = 'mail.mailwizard.io';

// Unsubscribe configuration
const UNSUBSCRIBE_TOKEN_SECRET = Deno.env.get('UNSUBSCRIBE_TOKEN_SECRET') || '';
const APP_URL = Deno.env.get('APP_URL') || Deno.env.get('VITE_APP_URL') || 'http://localhost:5173';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

/**
 * Generate HMAC-SHA256 signature for unsubscribe token
 */
async function generateUnsubscribeSignature(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(data);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate unsubscribe token for a specific contact and campaign
 */
async function generateUnsubscribeToken(
  contactId: string,
  campaignId: string,
  secret: string
): Promise<string> {
  const timestamp = Date.now();
  const data = `${contactId}:${campaignId}:${timestamp}`;
  const signature = await generateUnsubscribeSignature(data, secret);
  const token = `${data}:${signature}`;
  
  // Base64 encode for URL safety
  return btoa(token);
}

/**
 * Helper: Replace personalization fields in text
 * CRITICAL: Handles both {{key}} and {{MERGE:key}} formats
 */
function replacePersonalizationFields(text: string, fields: Record<string, any>): string {
  let result = text;
  
  for (const [key, value] of Object.entries(fields)) {
    const stringValue = String(value || '');
    
    // Handle {{key}} format (case insensitive)
    const regex1 = new RegExp(`\\{\\{${key}\\}\\}`, 'gi');
    result = result.replace(regex1, stringValue);
    
    // Handle {{MERGE:key}} format (case insensitive)
    const regex2 = new RegExp(`\\{\\{MERGE:${key}\\}\\}`, 'gi');
    result = result.replace(regex2, stringValue);
  }
  
  return result;
}

/**
 * Helper: Generate username from email
 */
function generateUsername(userEmail: string, userMetadata: any): string {
  if (userMetadata?.username) {
    return userMetadata.username.toLowerCase().replace(/[^a-z0-9]/g, '');
  }
  const emailUsername = userEmail.split('@')[0];
  return emailUsername.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Main handler
 */
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 200 });
  }

  try {
    console.log('='.repeat(80));
    console.log('📧 EMAIL SEND REQUEST');
    console.log('='.repeat(80) + '\n');

    // Validate unsubscribe token secret
    if (!UNSUBSCRIBE_TOKEN_SECRET) {
      console.error('❌ UNSUBSCRIBE_TOKEN_SECRET not configured');
      throw new Error('Server configuration error: Missing unsubscribe token secret');
    }

    // Get authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Parse request body
    const {
      to,
      subject,
      html,
      text,
      reply_to,
      from_name,
      campaign_id,
      contact_id,
      sending_domain_id,
      personalization = {}
    } = await req.json();

    // Log request data
    console.log(`📨 To: ${to}`);
    console.log(`📝 Subject: ${subject}`);
    console.log(`🎯 Campaign ID: ${campaign_id || 'N/A'}`);
    console.log(`👤 Contact ID: ${contact_id || 'N/A'}`);
    console.log(`🌐 Requested Domain ID: ${sending_domain_id || 'N/A (will use default)'}`);
    console.log(`🔗 App URL: ${APP_URL}`);

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      global: {
        headers: { Authorization: authHeader }
      }
    });

    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    console.log(`👤 User ID: ${user.id}`);
    console.log(`📧 User Email: ${user.email}`);

    // Determine sender email
    let fromEmail = '';
    let fromName = from_name || 'Email Wizard';

    // Try to get custom domain if specified
    if (sending_domain_id) {
      const { data: customDomain } = await supabase
        .from('sending_domains')
        .select('*')
        .eq('user_id', user.id)
        .eq('id', sending_domain_id)
        .eq('verification_status', 'verified')
        .single();

      if (customDomain) {
        const username = generateUsername(user.email!, user.user_metadata);
        fromEmail = `${username}@${customDomain.domain}`;
        console.log(`✅ Using specified custom domain: ${customDomain.domain}`);
      }
    }

    // If no custom domain, try default
    if (!fromEmail) {
      console.log('🔍 Looking for user default domain...');
      const { data: defaultDomain } = await supabase
        .from('sending_domains')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .eq('verification_status', 'verified')
        .single();

      if (defaultDomain) {
        const username = generateUsername(user.email!, user.user_metadata);
        fromEmail = `${username}@${defaultDomain.domain}`;
        console.log(`✅ Found default verified custom domain: ${defaultDomain.domain}`);
      }
    }

    // Fallback to shared domain
    if (!fromEmail) {
      const username = generateUsername(user.email!, user.user_metadata);
      fromEmail = `${username}@${SHARED_SENDING_DOMAIN}`;
      console.log(`📧 Using shared domain sender: ${fromEmail}`);
    }

    console.log(`📤 Final Sender: ${fromName} <${fromEmail}>`);
    console.log(`📨 Reply-To: ${reply_to || user.email}`);

    // ========================================================================
    // 🔐 GENERATE UNSUBSCRIBE TOKEN
    // ========================================================================
    let unsubscribeUrl = '';
    
    if (contact_id && campaign_id) {
      try {
        const unsubscribeToken = await generateUnsubscribeToken(
          contact_id,
          campaign_id,
          UNSUBSCRIBE_TOKEN_SECRET
        );
        unsubscribeUrl = `${APP_URL}/unsubscribe?token=${unsubscribeToken}`;
        console.log(`🔗 Generated unsubscribe URL for contact ${contact_id}`);
        console.log(`   URL: ${unsubscribeUrl.substring(0, 60)}...`);
      } catch (error) {
        console.error('⚠️ Failed to generate unsubscribe token:', error);
        // Continue without unsubscribe link - better than failing the send
      }
    } else {
      console.warn('⚠️ Missing contact_id or campaign_id - cannot generate unsubscribe link');
    }

    // ========================================================================
    // 📝 DEBUG: CHECK ORIGINAL HTML
    // ========================================================================
    console.log('\n🔍 PRE-PERSONALIZATION DEBUG:');
    console.log(`   Original HTML contains {{UNSUBSCRIBE_URL}}: ${html.includes('{{UNSUBSCRIBE_URL}}')} `);
    console.log(`   Original HTML length: ${html.length} characters`);

    // ========================================================================
    // 📝 APPLY PERSONALIZATION WITH UNSUBSCRIBE URL
    // ========================================================================
    const enhancedPersonalization = {
      first_name: personalization.first_name || 'there',
      last_name: personalization.last_name || '',
      email: to,
      company: personalization.company || '',
      ...personalization,
      // System merge tags - CRITICAL: These must be here
      UNSUBSCRIBE_URL: unsubscribeUrl,
      VIEW_IN_BROWSER_URL: `${APP_URL}/campaigns/${campaign_id || 'view'}`,
      FROM_EMAIL: fromEmail,
      COMPANY_NAME: fromName,
      CURRENT_YEAR: new Date().getFullYear().toString()
    };

    console.log('\n🔧 PERSONALIZATION DATA:');
    console.log(`   UNSUBSCRIBE_URL value: ${enhancedPersonalization.UNSUBSCRIBE_URL || '(empty)'}`);
    console.log(`   Total merge fields: ${Object.keys(enhancedPersonalization).length}`);

    // Replace merge tags
    const personalizedHtml = replacePersonalizationFields(html, enhancedPersonalization);
    const personalizedText = text ? replacePersonalizationFields(text, enhancedPersonalization) : '';
    const personalizedSubject = replacePersonalizationFields(subject, enhancedPersonalization);

    // ========================================================================
    // 🔍 DEBUG: VERIFY REPLACEMENT WORKED
    // ========================================================================
    console.log('\n🔍 POST-PERSONALIZATION DEBUG:');
    console.log(`   Personalized HTML length: ${personalizedHtml.length} characters`);
    console.log(`   Contains {{UNSUBSCRIBE_URL}} (should be false): ${personalizedHtml.includes('{{UNSUBSCRIBE_URL}}')} `);
    
    if (unsubscribeUrl) {
      const hasActualUrl = personalizedHtml.includes(unsubscribeUrl);
      console.log(`   Contains actual unsubscribe URL (should be true): ${hasActualUrl}`);
      
      if (hasActualUrl) {
        console.log('✅ SUCCESS: Unsubscribe URL successfully injected into email HTML');
      } else if (personalizedHtml.includes('{{UNSUBSCRIBE_URL}}')) {
        console.error('❌ CRITICAL ERROR: {{UNSUBSCRIBE_URL}} merge tag was NOT replaced!');
        console.error('   This means the replacePersonalizationFields function is not working correctly');
      } else {
        console.warn('⚠️ Warning: Email does not contain unsubscribe link (CAN-SPAM violation risk)');
        console.warn('   The template may not have {{UNSUBSCRIBE_URL}} placeholder');
      }
    } else {
      console.warn('⚠️ No unsubscribe URL generated - skipping validation');
    }

    // ========================================================================
    // 📦 BUILD SENDGRID PAYLOAD WITH customArgs
    // ========================================================================
    const sendGridPayload: any = {
      personalizations: [
        {
          to: [{ email: to }],
          subject: personalizedSubject
        }
      ],
      from: {
        email: fromEmail,
        name: fromName
      },
      reply_to: {
        email: reply_to || user.email!
      },
      // 🔥 customArgs for webhook tracking
      custom_args: {
        campaign_id: campaign_id || '',
        contact_id: contact_id || '',
        user_id: user.id
      },
      tracking_settings: {
        click_tracking: { enable: true, enable_text: false },
        open_tracking: { enable: true },
        subscription_tracking: { enable: false }
      },
      content: [
        {
          type: 'text/html',
          value: personalizedHtml
        }
      ]
    };

    // Add plain text if provided
    if (personalizedText) {
      sendGridPayload.content.unshift({
        type: 'text/plain',
        value: personalizedText
      });
    }

    // 📊 CRITICAL LOGGING: Show what we're sending to SendGrid
    console.log('\n📦 SendGrid Payload Details:');
    console.log(`   To: ${to}`);
    console.log(`   From: ${fromEmail}`);
    console.log(`   Subject: ${personalizedSubject}`);
    console.log(`   Custom Args:`, JSON.stringify(sendGridPayload.custom_args, null, 2));
    console.log(`   Tracking Enabled: Opens=${sendGridPayload.tracking_settings.open_tracking.enable}, Clicks=${sendGridPayload.tracking_settings.click_tracking.enable}`);
    console.log(`   Unsubscribe Link: ${unsubscribeUrl ? '✅ Included' : '❌ Missing'}`);

    // Send via SendGrid
    console.log('\n📮 Sending email via SendGrid...');
    
    const sendGridResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(sendGridPayload)
    });

    if (!sendGridResponse.ok) {
      const errorText = await sendGridResponse.text();
      console.error('❌ SendGrid error:', errorText);
      throw new Error(`SendGrid error: ${errorText}`);
    }

    // Get message ID from response headers
    const messageId = sendGridResponse.headers.get('x-message-id');
    console.log(`✅ Email sent successfully! Message ID: ${messageId}`);

    // Log campaign activity if IDs provided
    if (campaign_id && contact_id) {
      try {
        await supabase
          .from('email_events')
          .insert({
            campaign_id,
            contact_id,
            email: to,
            event_type: 'processed',
            timestamp: new Date().toISOString(),
            metadata: {
              sendgrid_message_id: messageId,
              from_email: fromEmail,
              has_unsubscribe_link: !!unsubscribeUrl
            }
          });
        console.log('📊 Activity logged to email_events');
      } catch (logError) {
        console.warn('⚠️ Failed to log activity:', logError);
        // Don't fail the request if logging fails
      }
    }

    console.log('\n' + '='.repeat(80) + '\n');

    return new Response(
      JSON.stringify({
        success: true,
        message_id: messageId,
        sender: { email: fromEmail, name: fromName },
        has_unsubscribe_link: !!unsubscribeUrl
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('❌ Error sending email:', error.message);
    console.error('Stack:', error.stack);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});