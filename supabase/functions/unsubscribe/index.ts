/**
 * UNSUBSCRIBE EDGE FUNCTION
 * 
 * Handles one-click unsubscribe requests from email campaigns.
 * CAN-SPAM Act compliant - processes unsubscribe immediately without confirmation.
 * 
 * Features:
 * - Token-based authentication to prevent abuse
 * - Immediate status update (no confirmation required)
 * - Event tracking for analytics
 * - HTML response page with success confirmation
 * - Re-subscribe option provided
 * 
 * Endpoint: /functions/v1/unsubscribe?token={encrypted_token}
 * Method: GET (for email link compatibility)
 * Authentication: Token-based (no JWT required)
 */

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

// CORS headers for browser access
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * Generate HMAC-SHA256 signature for token validation
 */
async function generateSignature(data: string, secret: string): Promise<string> {
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
 * Validate and parse unsubscribe token
 */
async function validateToken(token: string, secret: string): Promise<{
  valid: boolean;
  contact_id?: string;
  campaign_id?: string;
  timestamp?: number;
  error?: string;
}> {
  try {
    // Token format: base64({contact_id}:{campaign_id}:{timestamp}:{signature})
    const decoded = atob(token);
    const parts = decoded.split(':');
    
    if (parts.length !== 4) {
      return { valid: false, error: 'Invalid token format' };
    }
    
    const [contact_id, campaign_id, timestampStr, signature] = parts;
    const timestamp = parseInt(timestampStr, 10);
    
    // Verify token hasn't expired (30 days = 2592000000 ms)
    const now = Date.now();
    const age = now - timestamp;
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
    
    if (age > maxAge) {
      return { valid: false, error: 'Token expired' };
    }
    
    // Verify signature
    const data = `${contact_id}:${campaign_id}:${timestampStr}`;
    const expectedSignature = await generateSignature(data, secret);
    
    if (signature !== expectedSignature) {
      return { valid: false, error: 'Invalid signature' };
    }
    
    return {
      valid: true,
      contact_id,
      campaign_id,
      timestamp
    };
  } catch (error) {
    console.error('Token validation error:', error);
    return { valid: false, error: 'Token validation failed' };
  }
}

/**
 * Generate HTML response page
 */
function generateSuccessPage(email: string | null): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Unsubscribed Successfully</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    
    .container {
      background: white;
      border-radius: 16px;
      padding: 48px 32px;
      max-width: 500px;
      width: 100%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      text-align: center;
    }
    
    .icon {
      width: 80px;
      height: 80px;
      background: #f3ba42;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
    }
    
    .icon svg {
      width: 40px;
      height: 40px;
      color: white;
    }
    
    h1 {
      font-size: 28px;
      font-weight: 600;
      color: #1a202c;
      margin-bottom: 16px;
    }
    
    p {
      font-size: 16px;
      color: #4a5568;
      line-height: 1.6;
      margin-bottom: 24px;
    }
    
    .email {
      background: #f7fafc;
      padding: 12px 16px;
      border-radius: 8px;
      font-weight: 500;
      color: #2d3748;
      margin-bottom: 32px;
    }
    
    .button {
      display: inline-block;
      background: #f3ba42;
      color: white;
      text-decoration: none;
      padding: 12px 32px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      transition: all 0.2s;
    }
    
    .button:hover {
      background: #e5ac3a;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(243, 186, 66, 0.4);
    }
    
    .footer {
      margin-top: 32px;
      padding-top: 32px;
      border-top: 1px solid #e2e8f0;
      font-size: 14px;
      color: #718096;
    }
    
    @media (max-width: 600px) {
      .container {
        padding: 32px 24px;
      }
      
      h1 {
        font-size: 24px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
      </svg>
    </div>
    
    <h1>You've Been Unsubscribed</h1>
    
    <p>
      You will no longer receive marketing emails from us. 
      This change is effective immediately.
    </p>
    
    ${email ? `<div class="email">${email}</div>` : ''}
    
    <p>
      Changed your mind? You can always re-subscribe at any time.
    </p>
    
    <a href="/resubscribe" class="button">Re-subscribe</a>
    
    <div class="footer">
      <p>
        If you believe this was done in error or have questions,<br>
        please contact our support team.
      </p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Generate error page
 */
function generateErrorPage(message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Unsubscribe Error</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    
    .container {
      background: white;
      border-radius: 16px;
      padding: 48px 32px;
      max-width: 500px;
      width: 100%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      text-align: center;
    }
    
    .icon {
      width: 80px;
      height: 80px;
      background: #fc8181;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
    }
    
    .icon svg {
      width: 40px;
      height: 40px;
      color: white;
    }
    
    h1 {
      font-size: 28px;
      font-weight: 600;
      color: #1a202c;
      margin-bottom: 16px;
    }
    
    p {
      font-size: 16px;
      color: #4a5568;
      line-height: 1.6;
    }
    
    @media (max-width: 600px) {
      .container {
        padding: 32px 24px;
      }
      
      h1 {
        font-size: 24px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </div>
    
    <h1>Unsubscribe Failed</h1>
    
    <p>${message}</p>
  </div>
</body>
</html>`;
}

/**
 * Main handler
 */
Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // Get token from query parameters
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    
    if (!token) {
      return new Response(
        generateErrorPage('Missing unsubscribe token. Please use the link from your email.'),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'text/html' }
        }
      );
    }
    
    // Get token secret from environment
    const tokenSecret = Deno.env.get('UNSUBSCRIBE_TOKEN_SECRET');
    if (!tokenSecret) {
      console.error('UNSUBSCRIBE_TOKEN_SECRET not configured');
      return new Response(
        generateErrorPage('Server configuration error. Please contact support.'),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'text/html' }
        }
      );
    }
    
    // Validate token
    const validation = await validateToken(token, tokenSecret);
    if (!validation.valid) {
      console.error('Token validation failed:', validation.error);
      return new Response(
        generateErrorPage(validation.error || 'Invalid unsubscribe link.'),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'text/html' }
        }
      );
    }
    
    const { contact_id, campaign_id } = validation;
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get contact information
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('id, email, user_id, status')
      .eq('id', contact_id)
      .single();
    
    if (contactError || !contact) {
      console.error('Contact not found:', contactError);
      return new Response(
        generateErrorPage('Contact not found. This unsubscribe link may be invalid.'),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'text/html' }
        }
      );
    }
    
    // Check if already unsubscribed
    if (contact.status === 'unsubscribed') {
      return new Response(
        generateSuccessPage(contact.email),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'text/html' }
        }
      );
    }
    
    // Update contact status to unsubscribed
    const { error: updateError } = await supabase
      .from('contacts')
      .update({
        status: 'unsubscribed',
        unsubscribed_at: new Date().toISOString(),
        unsubscribe_campaign_id: campaign_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', contact_id);
    
    if (updateError) {
      console.error('Failed to update contact:', updateError);
      return new Response(
        generateErrorPage('Failed to process unsubscribe. Please try again or contact support.'),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'text/html' }
        }
      );
    }
    
    // Record unsubscribe event
    await supabase.from('email_events').insert({
      campaign_id,
      contact_id,
      event_type: 'unsubscribe',
      timestamp: new Date().toISOString(),
      metadata: {
        method: 'link_click',
        user_agent: req.headers.get('user-agent') || 'unknown'
      }
    });
    
    // Update campaign unsubscribe count
    await supabase.rpc('increment_campaign_unsubscribes', {
      campaign_id_param: campaign_id
    });
    
    console.log(`✅ Contact ${contact.email} unsubscribed from campaign ${campaign_id}`);
    
    // Return success page
    return new Response(
      generateSuccessPage(contact.email),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/html' }
      }
    );
    
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return new Response(
      generateErrorPage('An unexpected error occurred. Please try again later.'),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'text/html' }
      }
    );
  }
});
