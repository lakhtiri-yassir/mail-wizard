/**
 * ============================================================================
 * Edge Function: Automatic Domain Verification (Cron Job)
 * ============================================================================
 * 
 * Purpose: Automatically verify pending domains by checking DNS records
 *          via SendGrid API. Runs periodically to retry verification for
 *          domains that haven't been verified yet.
 * 
 * Schedule: Every 6 hours (configured in Supabase)
 * 
 * Logic:
 * - Find all domains with verification_status = 'pending'
 * - Skip domains checked less than 5 minutes ago (avoid spam)
 * - Verify each domain via SendGrid API
 * - Update status and notify users on success/failure
 * - Stop retrying after 72 hours (3 days)
 * 
 * Dependencies:
 * - Supabase for database access
 * - SendGrid API for domain verification
 * 
 * ============================================================================
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Environment variables
const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

// Configuration
const MIN_RETRY_INTERVAL_MINUTES = 5; // Don't check more than once per 5 minutes
const MAX_RETRY_HOURS = 72; // Stop trying after 72 hours (3 days)

/**
 * ============================================================================
 * SENDGRID VALIDATION FUNCTION
 * ============================================================================
 */

/**
 * Validates domain in SendGrid by checking DNS records
 */
async function validateSendGridDomain(sendgridDomainId: string) {
  console.log(`🔍 Validating domain in SendGrid: ${sendgridDomainId}`);

  try {
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
      console.error('❌ SendGrid validation request failed:', error);
      return {
        valid: false,
        error: `SendGrid API error: ${error}`,
        validation_results: {}
      };
    }

    const data = await response.json();
    console.log('📊 Validation results:', JSON.stringify(data, null, 2));

    return {
      valid: data.valid || false,
      validation_results: data.validation_results || {},
      error: null
    };
  } catch (error: any) {
    console.error('❌ Exception during SendGrid validation:', error.message);
    return {
      valid: false,
      error: error.message,
      validation_results: {}
    };
  }
}

/**
 * ============================================================================
 * VERIFICATION LOGIC
 * ============================================================================
 */

/**
 * Processes a single domain verification
 */
async function verifyDomain(supabase: any, domain: any) {
  console.log(`\n🔄 Processing domain: ${domain.domain} (ID: ${domain.id})`);

  if (!domain.sendgrid_domain_id) {
    console.error('❌ Domain missing SendGrid ID, skipping');
    return { success: false, reason: 'missing_sendgrid_id' };
  }

  // Check if domain is too old (past retry window)
  const createdAt = new Date(domain.created_at);
  const now = new Date();
  const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

  if (hoursSinceCreation > MAX_RETRY_HOURS) {
    console.log(`⏰ Domain created ${hoursSinceCreation.toFixed(1)}h ago, exceeds retry window`);
    
    // Mark as failed if not already
    if (domain.verification_status === 'pending') {
      await supabase
        .from('sending_domains')
        .update({
          verification_status: 'failed',
          last_verified_at: new Date().toISOString()
        })
        .eq('id', domain.id);
      
      console.log('❌ Marked domain as failed (retry window expired)');
    }
    
    return { success: false, reason: 'retry_window_expired' };
  }

  // Check if checked too recently
  if (domain.last_verified_at) {
    const lastCheck = new Date(domain.last_verified_at);
    const minutesSinceLastCheck = (now.getTime() - lastCheck.getTime()) / (1000 * 60);

    if (minutesSinceLastCheck < MIN_RETRY_INTERVAL_MINUTES) {
      console.log(`⏳ Last checked ${minutesSinceLastCheck.toFixed(1)}m ago, skipping (too soon)`);
      return { success: false, reason: 'checked_too_recently' };
    }
  }

  // Perform validation
  const validationResult = await validateSendGridDomain(domain.sendgrid_domain_id);

  // Prepare update data
  const updateData: any = {
    last_verified_at: new Date().toISOString()
  };

  if (validationResult.valid) {
    // Domain verified successfully
    updateData.verification_status = 'verified';
    updateData.verified_at = new Date().toISOString();
    console.log('✅ Domain verification SUCCESSFUL');
  } else {
    // Verification failed - keep as pending if within retry window
    updateData.verification_status = 'pending';
    console.log('⚠️  Domain verification FAILED (will retry)');
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

  // Update database
  const { error: updateError } = await supabase
    .from('sending_domains')
    .update(updateData)
    .eq('id', domain.id);

  if (updateError) {
    console.error('❌ Failed to update domain in database:', updateError);
    return { success: false, reason: 'database_error' };
  }

  return {
    success: validationResult.valid,
    reason: validationResult.valid ? 'verified' : 'dns_not_configured',
    validation_results: validationResult.validation_results
  };
}

/**
 * ============================================================================
 * MAIN CRON HANDLER
 * ============================================================================
 */

serve(async (req: Request) => {
  console.log('\n' + '='.repeat(80));
  console.log('🔄 DOMAIN VERIFICATION CRON JOB STARTED');
  console.log('='.repeat(80));

  try {
    // Create Supabase client with service role key
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });

    // Find all pending domains
    const { data: pendingDomains, error: fetchError } = await supabase
      .from('sending_domains')
      .select('*')
      .eq('verification_status', 'pending')
      .order('created_at', { ascending: true });

    if (fetchError) {
      console.error('❌ Failed to fetch pending domains:', fetchError);
      throw new Error('Database query failed');
    }

    console.log(`\n📋 Found ${pendingDomains?.length || 0} pending domains to check`);

    if (!pendingDomains || pendingDomains.length === 0) {
      console.log('✨ No pending domains to verify');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No pending domains to verify',
          processed: 0
        }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    // Process each domain
    const results = {
      total: pendingDomains.length,
      verified: 0,
      failed: 0,
      skipped: 0,
      errors: 0
    };

    for (const domain of pendingDomains) {
      try {
        const result = await verifyDomain(supabase, domain);
        
        if (result.success) {
          results.verified++;
        } else if (result.reason === 'checked_too_recently' || result.reason === 'retry_window_expired') {
          results.skipped++;
        } else if (result.reason === 'dns_not_configured') {
          results.failed++;
        } else {
          results.errors++;
        }
      } catch (error: any) {
        console.error(`❌ Exception processing domain ${domain.id}:`, error.message);
        results.errors++;
      }
    }

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 VERIFICATION SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total domains checked: ${results.total}`);
    console.log(`✅ Verified: ${results.verified}`);
    console.log(`⚠️  Failed (will retry): ${results.failed}`);
    console.log(`⏭️  Skipped: ${results.skipped}`);
    console.log(`❌ Errors: ${results.errors}`);
    console.log('='.repeat(80) + '\n');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Domain verification cron completed',
        results
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('❌ CRON JOB FAILED:', error.message);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
