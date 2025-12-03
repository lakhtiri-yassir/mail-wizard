/**
 * ============================================================================
 * Edge Function: Domain Management - FIXED ROUTING
 * ============================================================================
 * 
 * Purpose: Handle all custom domain operations including add, verify, list,
 *          delete, and set default domain functionality
 * 
 * Endpoints:
 * - POST /manage-domain/add - Add new domain
 * - POST /manage-domain/verify/{domainId} - Trigger domain verification
 * - GET /manage-domain/list - List user's domains
 * - DELETE /manage-domain/{domainId} - Remove domain
 * - PATCH /manage-domain/{domainId}/set-default - Set as default domain
 * - GET /manage-domain/{domainId}/dns - Get DNS configuration instructions
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
 * Checks if user's plan supports custom domains
 */
function checkDomainFeatureAccess(planType: string): boolean {
  const allowedPlans = ['pro', 'pro_plus'];
  return allowedPlans.includes(planType.toLowerCase());
}

/**
 * ============================================================================
 * SENDGRID API FUNCTIONS
 * ============================================================================
 */

/**
 * Creates a new domain in SendGrid
 */
async function createSendGridDomain(domain: string) {
  if (TESTING_MODE) {
    console.log('⚠️  TESTING MODE: Skipping SendGrid API call');
    return {
      id: 'test-sendgrid-id-' + Date.now(),
      dns_records: {
        dkim1: {
          host: `s1._domainkey.${domain}`,
          type: 'CNAME',
          data: 'example.sendgrid.net',
          valid: false
        },
        dkim2: {
          host: `s2._domainkey.${domain}`,
          type: 'CNAME',
          data: 'example2.sendgrid.net',
          valid: false
        }
      }
    };
  }

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
    const errorData = await response.json();
    throw new Error(`SendGrid API error: ${errorData.errors?.[0]?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  return {
    id: data.id,
    dns_records: {
      dkim1: data.dns.dkim1,
      dkim2: data.dns.dkim2,
      mail_cname: data.dns.mail_cname
    }
  };
}

/**
 * Validates domain in SendGrid
 */
async function validateSendGridDomain(sendgridDomainId: string) {
  if (TESTING_MODE) {
    console.log('⚠️  TESTING MODE: Simulating SendGrid validation');
    return {
      valid: true,
      validation_results: {
        dkim1: { valid: true },
        dkim2: { valid: true },
        mail_cname: { valid: true }
      }
    };
  }

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
    throw new Error('Failed to validate domain with SendGrid');
  }

  const data = await response.json();
  return data;
}

/**
 * Deletes domain from SendGrid
 */
async function deleteSendGridDomain(sendgridDomainId: string) {
  if (TESTING_MODE) {
    console.log('⚠️  TESTING MODE: Skipping SendGrid deletion');
    return;
  }

  await fetch(`https://api.sendgrid.com/v3/whitelabel/domains/${sendgridDomainId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${SENDGRID_API_KEY}`
    }
  });
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

  // Fetch domain from database
  const { data: domain, error } = await supabase
    .from('sending_domains')
    .select('*')
    .eq('id', domainId)
    .eq('user_id', userId)
    .single();

  if (error || !domain) {
    console.error('❌ Domain not found:', error);
    throw new Error('Domain not found');
  }

  const dnsRecords = domain.dns_records;
  
  // Log DNS records structure for debugging
  console.log('📋 DNS Records from database:', {
    has_mail_cname: !!dnsRecords.mail_cname,
    has_dkim1: !!dnsRecords.dkim1,
    has_dkim2: !!dnsRecords.dkim2,
    mail_cname_host: dnsRecords.mail_cname?.host,
    mail_cname_data: dnsRecords.mail_cname?.data,
    dkim1_host: dnsRecords.dkim1?.host,
    dkim1_data: dnsRecords.dkim1?.data,
    dkim2_host: dnsRecords.dkim2?.host,
    dkim2_data: dnsRecords.dkim2?.data
  });

  // Build instructions array dynamically
  const instructionsArray = [];

  // Add MAIL CNAME if it exists (SendGrid may or may not return this)
  if (dnsRecords.mail_cname && dnsRecords.mail_cname.data) {
    instructionsArray.push({
      step: instructionsArray.length + 1,
      title: 'Add CNAME Record (Mail)',
      description: 'Links your domain to SendGrid\'s mail servers for sending emails',
      required: true,
      record: {
        type: dnsRecords.mail_cname.type || 'CNAME',
        host: dnsRecords.mail_cname.host,
        value: dnsRecords.mail_cname.data, // CRITICAL: Use .data not .value
        ttl: 300,
        valid: dnsRecords.mail_cname.valid || false
      }
    });
  } else {
    console.warn('⚠️  mail_cname not provided by SendGrid - this is normal for some configurations');
  }

  // Add DKIM1 (required)
  if (dnsRecords.dkim1 && dnsRecords.dkim1.data) {
    instructionsArray.push({
      step: instructionsArray.length + 1,
      title: 'Add DKIM Record 1',
      description: 'First cryptographic signature for email authentication (required)',
      required: true,
      record: {
        type: dnsRecords.dkim1.type || 'CNAME',
        host: dnsRecords.dkim1.host,
        value: dnsRecords.dkim1.data, // CRITICAL: Use .data not .value
        ttl: 300,
        valid: dnsRecords.dkim1.valid || false
      }
    });
  } else {
    console.error('❌ DKIM1 record missing or incomplete!');
    throw new Error('DKIM1 record not found in DNS configuration');
  }

  // Add DKIM2 (required)
  if (dnsRecords.dkim2 && dnsRecords.dkim2.data) {
    instructionsArray.push({
      step: instructionsArray.length + 1,
      title: 'Add DKIM Record 2',
      description: 'Second cryptographic signature for email authentication (required)',
      required: true,
      record: {
        type: dnsRecords.dkim2.type || 'CNAME',
        host: dnsRecords.dkim2.host,
        value: dnsRecords.dkim2.data, // CRITICAL: Use .data not .value
        ttl: 300,
        valid: dnsRecords.dkim2.valid || false
      }
    });
  } else {
    console.error('❌ DKIM2 record missing or incomplete!');
    throw new Error('DKIM2 record not found in DNS configuration');
  }

  console.log(`✅ Generated ${instructionsArray.length} DNS instructions`);

  // Return formatted instructions
  return {
    domain: domain.domain,
    status: domain.verification_status,
    records: instructionsArray,
    notes: [
      'Add all DNS records to your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.)',
      'DNS propagation can take anywhere from 5 minutes to 48 hours',
      'After adding all records, click "Verify Domain" to check your configuration',
      `Once verified, emails will be sent from addresses like: user@mail.${domain.domain}`
    ]
  };
}

/**
 * ============================================================================
 * MAIN HANDLER
 * ============================================================================
 */

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // Get auth token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    });

    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Invalid authentication token');
    }

    // Get user's plan type
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan_type')
      .eq('id', user.id)
      .single();

    const planType = profile?.plan_type || 'free';

    // Parse URL path
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    // pathParts[0] = 'manage-domain' (base path)
    // pathParts[1] = action OR domainId
    // pathParts[2] = additional path segment (e.g., 'dns', 'set-default')

    console.log(`🎯 Path parts: ${JSON.stringify(pathParts)}, User: ${user.id}`);

    let result;

    // Route to appropriate handler - FIXED ROUTING LOGIC
    switch (req.method) {
      case 'POST':
        if (pathParts[1] === 'add') {
          // POST /manage-domain/add
          const { domain } = await req.json();
          result = await addDomain(supabase, user.id, domain, planType);
        } else if (pathParts[1] === 'verify' && pathParts[2]) {
          // POST /manage-domain/verify/{domainId}
          const domainId = pathParts[2];
          result = await verifyDomain(supabase, user.id, domainId);
        } else {
          throw new Error('Invalid POST action');
        }
        break;

      case 'GET':
        if (pathParts[1] === 'list') {
          // GET /manage-domain/list
          result = await listDomains(supabase, user.id);
        } else if (pathParts[1] && pathParts[2] === 'dns') {
          // GET /manage-domain/{domainId}/dns
          const domainId = pathParts[1];
          result = await getDNSInstructions(supabase, user.id, domainId);
        } else {
          throw new Error('Invalid GET action');
        }
        break;

      case 'DELETE':
        if (pathParts[1]) {
          // DELETE /manage-domain/{domainId}
          const domainId = pathParts[1];
          result = await deleteDomain(supabase, user.id, domainId);
        } else {
          throw new Error('Domain ID required for DELETE');
        }
        break;

      case 'PATCH':
        if (pathParts[1] && pathParts[2] === 'set-default') {
          // PATCH /manage-domain/{domainId}/set-default
          const domainId = pathParts[1];
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