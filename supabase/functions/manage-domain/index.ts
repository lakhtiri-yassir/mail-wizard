/**
 * ============================================================================
 * Edge Function: Domain Management
 * ============================================================================
 * 
 * Purpose: Handle all custom domain operations including add, verify, list,
 *          delete, and set default domain functionality
 * 
 * Endpoints:
 * - POST /manage-domain/add - Add new domain
 * - POST /manage-domain/verify/:id - Trigger domain verification
 * - GET /manage-domain/list - List user's domains
 * - DELETE /manage-domain/:id - Remove domain
 * - PATCH /manage-domain/:id/set-default - Set as default domain
 * - GET /manage-domain/:id/dns - Get DNS configuration instructions
 * 
 * Dependencies:
 * - Supabase client for database operations
 * - SendGrid API for domain authentication
 * 
 * ============================================================================
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Environment variables
const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const TESTING_MODE = Deno.env.get('DOMAIN_TESTING_MODE') === 'true';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

/**
 * ============================================================================
 * VALIDATION FUNCTIONS
 * ============================================================================
 */

/**
 * Validates domain format
 */
function validateDomain(domain: string): { valid: boolean; error?: string } {
  // Remove protocol if present
  domain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');

  // Check length
  if (domain.length > 253) {
    return { valid: false, error: 'Domain name too long (max 253 characters)' };
  }

  if (domain.length < 3) {
    return { valid: false, error: 'Domain name too short (min 3 characters)' };
  }

  // Check format: alphanumeric, hyphens, dots
  const domainRegex = /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
  if (!domainRegex.test(domain)) {
    return { valid: false, error: 'Invalid domain format. Use format: example.com' };
  }

  // Check for invalid patterns
  if (domain.includes('..') || domain.startsWith('-') || domain.endsWith('-')) {
    return { valid: false, error: 'Domain contains invalid characters or patterns' };
  }

  return { valid: true };
}

/**
 * Checks if user has access to domain features based on plan
 */
function checkDomainFeatureAccess(planType: string): boolean {
  if (TESTING_MODE) {
    console.log('🧪 TESTING_MODE enabled - allowing domain access for all plans');
    return true;
  }
  return planType === 'pro' || planType === 'pro_plus';
}

/**
 * ============================================================================
 * SENDGRID API FUNCTIONS
 * ============================================================================
 */

/**
 * Creates domain authentication in SendGrid
 */
async function createSendGridDomain(domain: string) {
  console.log(`📧 Creating domain in SendGrid: ${domain}`);

  const response = await fetch('https://api.sendgrid.com/v3/whitelabel/domains', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SENDGRID_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      domain: domain,
      subdomain: 'mail',
      automatic_security: false,
      default: false,
      custom_spf: false
    })
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('❌ SendGrid domain creation failed:', error);
    throw new Error(`Failed to create domain in SendGrid: ${error}`);
  }

  const data = await response.json();
  console.log('✅ Domain created in SendGrid:', data.id);

  return {
    id: data.id,
    dns_records: {
      spf: {
        host: data.dns.mail_cname?.host || domain,
        type: 'TXT',
        data: data.dns.mail_cname?.data || `v=spf1 include:sendgrid.net ~all`,
        valid: false
      },
      dkim1: {
        host: data.dns.dkim1?.host || `s1._domainkey.${domain}`,
        type: 'CNAME',
        data: data.dns.dkim1?.data || '',
        valid: false
      },
      dkim2: {
        host: data.dns.dkim2?.host || `s2._domainkey.${domain}`,
        type: 'CNAME',
        data: data.dns.dkim2?.data || '',
        valid: false
      },
      mail_cname: data.dns.mail_cname ? {
        host: data.dns.mail_cname.host,
        type: 'CNAME',
        data: data.dns.mail_cname.data,
        valid: false
      } : null
    }
  };
}

/**
 * Validates domain in SendGrid (checks DNS records)
 */
async function validateSendGridDomain(sendgridDomainId: string) {
  console.log(`🔍 Validating domain in SendGrid: ${sendgridDomainId}`);

  const response = await fetch(
    `https://api.sendgrid.com/v3/whitelabel/domains/${sendgridDomainId}/validate`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('❌ SendGrid validation failed:', error);
    throw new Error(`Failed to validate domain: ${error}`);
  }

  const data = await response.json();
  console.log('📊 Validation results:', data);

  return {
    valid: data.valid || false,
    validation_results: data.validation_results || {}
  };
}

/**
 * Deletes domain from SendGrid
 */
async function deleteSendGridDomain(sendgridDomainId: string) {
  console.log(`🗑️  Deleting domain from SendGrid: ${sendgridDomainId}`);

  const response = await fetch(
    `https://api.sendgrid.com/v3/whitelabel/domains/${sendgridDomainId}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`
      }
    }
  );

  if (!response.ok && response.status !== 404) {
    const error = await response.text();
    console.error('❌ SendGrid deletion failed:', error);
    throw new Error(`Failed to delete domain: ${error}`);
  }

  console.log('✅ Domain deleted from SendGrid');
}

/**
 * ============================================================================
 * DOMAIN OPERATION HANDLERS
 * ============================================================================
 */

/**
 * Adds a new domain for the user
 */
async function addDomain(supabase: any, userId: string, domain: string, planType: string) {
  console.log(`➕ Adding domain: ${domain} for user: ${userId}`);

  // Check feature access
  if (!checkDomainFeatureAccess(planType)) {
    throw new Error('Custom domains are only available on Pro and Pro Plus plans');
  }

  // Validate domain format
  const validation = validateDomain(domain);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Check if domain already exists for this user
  const { data: existingUserDomain } = await supabase
    .from('sending_domains')
    .select('id')
    .eq('user_id', userId)
    .eq('domain', domain)
    .single();

  if (existingUserDomain) {
    throw new Error('You have already added this domain');
  }

  // Check if domain is claimed by another user
  const { data: existingOtherDomain } = await supabase
    .from('sending_domains')
    .select('id, user_id')
    .eq('domain', domain)
    .neq('user_id', userId)
    .single();

  if (existingOtherDomain) {
    throw new Error('This domain is already claimed by another user');
  }

  // Create domain in SendGrid
  const sendgridDomain = await createSendGridDomain(domain);

  // Check if user has any domains (set as default if first)
  const { count } = await supabase
    .from('sending_domains')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  const isFirstDomain = count === 0;

  // Store in database
  const { data: newDomain, error: dbError } = await supabase
    .from('sending_domains')
    .insert({
      user_id: userId,
      domain: domain,
      verification_status: 'pending',
      sendgrid_domain_id: sendgridDomain.id,
      dns_records: sendgridDomain.dns_records,
      is_default: isFirstDomain,
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (dbError) {
    console.error('❌ Database error:', dbError);
    // Clean up SendGrid domain if database insert fails
    try {
      await deleteSendGridDomain(sendgridDomain.id);
    } catch (cleanupError) {
      console.error('⚠️  Failed to clean up SendGrid domain:', cleanupError);
    }
    throw new Error(`Failed to save domain: ${dbError.message}`);
  }

  console.log('✅ Domain added successfully:', newDomain.id);
  return newDomain;
}

/**
 * Verifies a domain by checking DNS records
 */
async function verifyDomain(supabase: any, userId: string, domainId: string) {
  console.log(`🔍 Verifying domain: ${domainId}`);

  // Get domain from database
  const { data: domain, error: fetchError } = await supabase
    .from('sending_domains')
    .select('*')
    .eq('id', domainId)
    .eq('user_id', userId)
    .single();

  if (fetchError || !domain) {
    throw new Error('Domain not found');
  }

  if (!domain.sendgrid_domain_id) {
    throw new Error('Domain missing SendGrid configuration');
  }

  // Validate in SendGrid
  const validationResult = await validateSendGridDomain(domain.sendgrid_domain_id);

  // Update domain status
  const newStatus = validationResult.valid ? 'verified' : 'failed';
  const updateData: any = {
    verification_status: newStatus,
    last_verified_at: new Date().toISOString()
  };

  if (validationResult.valid) {
    updateData.verified_at = new Date().toISOString();
  }

  // Update DNS records with validation results
  if (validationResult.validation_results) {
    const updatedDnsRecords = { ...domain.dns_records };
    const results = validationResult.validation_results;

    if (results.spf) updatedDnsRecords.spf.valid = results.spf.valid;
    if (results.dkim1) updatedDnsRecords.dkim1.valid = results.dkim1.valid;
    if (results.dkim2) updatedDnsRecords.dkim2.valid = results.dkim2.valid;
    if (results.mail_cname && updatedDnsRecords.mail_cname) {
      updatedDnsRecords.mail_cname.valid = results.mail_cname.valid;
    }

    updateData.dns_records = updatedDnsRecords;
  }

  const { data: updatedDomain, error: updateError } = await supabase
    .from('sending_domains')
    .update(updateData)
    .eq('id', domainId)
    .select()
    .single();

  if (updateError) {
    console.error('❌ Failed to update domain:', updateError);
    throw new Error('Failed to update domain status');
  }

  console.log(`✅ Domain verification complete: ${newStatus}`);
  return {
    ...updatedDomain,
    validation_results: validationResult.validation_results
  };
}

/**
 * Lists all domains for a user
 */
async function listDomains(supabase: any, userId: string) {
  console.log(`📋 Listing domains for user: ${userId}`);

  const { data: domains, error } = await supabase
    .from('sending_domains')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Failed to list domains:', error);
    throw new Error('Failed to retrieve domains');
  }

  console.log(`✅ Found ${domains?.length || 0} domains`);
  return domains || [];
}

/**
 * Deletes a domain
 */
async function deleteDomain(supabase: any, userId: string, domainId: string) {
  console.log(`🗑️  Deleting domain: ${domainId}`);

  // Get domain
  const { data: domain, error: fetchError } = await supabase
    .from('sending_domains')
    .select('*')
    .eq('id', domainId)
    .eq('user_id', userId)
    .single();

  if (fetchError || !domain) {
    throw new Error('Domain not found');
  }

  // Delete from SendGrid
  if (domain.sendgrid_domain_id) {
    try {
      await deleteSendGridDomain(domain.sendgrid_domain_id);
    } catch (error) {
      console.warn('⚠️  Failed to delete from SendGrid (may already be deleted):', error);
    }
  }

  // Delete from database
  const { error: deleteError } = await supabase
    .from('sending_domains')
    .delete()
    .eq('id', domainId);

  if (deleteError) {
    console.error('❌ Failed to delete domain:', deleteError);
    throw new Error('Failed to delete domain');
  }

  // If this was the default domain, set another as default
  if (domain.is_default) {
    const { data: otherDomains } = await supabase
      .from('sending_domains')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if (otherDomains && otherDomains.length > 0) {
      await supabase
        .from('sending_domains')
        .update({ is_default: true })
        .eq('id', otherDomains[0].id);
    }
  }

  console.log('✅ Domain deleted successfully');
  return { success: true };
}

/**
 * Sets a domain as default
 */
async function setDefaultDomain(supabase: any, userId: string, domainId: string) {
  console.log(`⭐ Setting default domain: ${domainId}`);

  // Verify domain exists and belongs to user
  const { data: domain, error: fetchError } = await supabase
    .from('sending_domains')
    .select('*')
    .eq('id', domainId)
    .eq('user_id', userId)
    .single();

  if (fetchError || !domain) {
    throw new Error('Domain not found');
  }

  // Unset current default
  await supabase
    .from('sending_domains')
    .update({ is_default: false })
    .eq('user_id', userId)
    .eq('is_default', true);

  // Set new default
  const { data: updatedDomain, error: updateError } = await supabase
    .from('sending_domains')
    .update({ is_default: true })
    .eq('id', domainId)
    .select()
    .single();

  if (updateError) {
    console.error('❌ Failed to set default domain:', updateError);
    throw new Error('Failed to set default domain');
  }

  console.log('✅ Default domain updated');
  return updatedDomain;
}

/**
 * Gets DNS configuration instructions for a domain
 */
async function getDNSInstructions(supabase: any, userId: string, domainId: string) {
  console.log(`📖 Getting DNS instructions for domain: ${domainId}`);

  const { data: domain, error } = await supabase
    .from('sending_domains')
    .select('*')
    .eq('id', domainId)
    .eq('user_id', userId)
    .single();

  if (error || !domain) {
    throw new Error('Domain not found');
  }

  const dnsRecords = domain.dns_records;

  // Format instructions
  const instructions = {
    domain: domain.domain,
    status: domain.verification_status,
    records: [
      {
        step: 1,
        title: 'Add CNAME Record (Mail)',
        description: 'Links your domain to SendGrid\'s mail servers',
        required: true,
        record: dnsRecords.mail_cname || {
          type: 'CNAME',
          host: `mail.${domain.domain}`,
          value: 'Please verify SendGrid configuration',
          ttl: 300
        }
      },
      {
        step: 2,
        title: 'Add DKIM Record 1',
        description: 'First cryptographic signature for email authentication',
        required: true,
        record: {
          type: 'CNAME',
          host: dnsRecords.dkim1.host,
          value: dnsRecords.dkim1.data,
          ttl: 300,
          valid: dnsRecords.dkim1.valid
        }
      },
      {
        step: 3,
        title: 'Add DKIM Record 2',
        description: 'Second cryptographic signature for email authentication',
        required: true,
        record: {
          type: 'CNAME',
          host: dnsRecords.dkim2.host,
          value: dnsRecords.dkim2.data,
          ttl: 300,
          valid: dnsRecords.dkim2.valid
        }
      },
      {
        step: 4,
        title: 'Add SPF Record (Optional but Recommended)',
        description: 'Authorizes SendGrid to send emails on your behalf',
        required: false,
        record: {
          type: 'TXT',
          host: domain.domain,
          value: 'v=spf1 include:sendgrid.net ~all',
          ttl: 300,
          valid: dnsRecords.spf?.valid
        }
      }
    ],
    notes: [
      'DNS changes can take 5-30 minutes to propagate',
      'Some DNS providers use "@" instead of the domain name for the root domain',
      'TTL (Time To Live) of 300 seconds (5 minutes) is recommended for faster updates',
      'After adding all records, click "Verify Domain" to check the configuration'
    ]
  };

  return instructions;
}

/**
 * ============================================================================
 * MAIN REQUEST HANDLER
 * ============================================================================
 */

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get authorization token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      },
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    });

    // Get user from token
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Invalid authorization token');
    }

    // Get user profile to check plan
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan_type')
      .eq('id', user.id)
      .single();

    const planType = profile?.plan_type || 'free';

    // Parse URL and determine action
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const action = pathParts[1]; // manage-domain/[action]
    const domainId = pathParts[2]; // for actions that need ID

    console.log(`🎯 Action: ${action}, Domain ID: ${domainId || 'N/A'}, User: ${user.id}`);

    let result;

    // Route to appropriate handler
    switch (req.method) {
      case 'POST':
        if (action === 'add') {
          const { domain } = await req.json();
          result = await addDomain(supabase, user.id, domain, planType);
        } else if (action === 'verify' && domainId) {
          result = await verifyDomain(supabase, user.id, domainId);
        } else {
          throw new Error('Invalid POST action');
        }
        break;

      case 'GET':
        if (action === 'list') {
          result = await listDomains(supabase, user.id);
        } else if (domainId && pathParts[3] === 'dns') {
          result = await getDNSInstructions(supabase, user.id, domainId);
        } else {
          throw new Error('Invalid GET action');
        }
        break;

      case 'DELETE':
        if (domainId) {
          result = await deleteDomain(supabase, user.id, domainId);
        } else {
          throw new Error('Domain ID required for DELETE');
        }
        break;

      case 'PATCH':
        if (domainId && pathParts[3] === 'set-default') {
          result = await setDefaultDomain(supabase, user.id, domainId);
        } else {
          throw new Error('Invalid PATCH action');
        }
        break;

      default:
        throw new Error('Method not allowed');
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});
