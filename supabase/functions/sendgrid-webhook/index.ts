/**
 * ============================================================================
 * SENDGRID WEBHOOK HANDLER - UPDATED WITH UNSUBSCRIBE SUPPORT
 * ============================================================================
 * 
 * UPDATES:
 * 1. ✅ Enhanced unsubscribe handler with full tracking
 * 2. ✅ Records unsubscribe events with timestamp and campaign info
 * 3. ✅ Increments campaign unsubscribe count
 * 4. ✅ Updates contact engagement score
 * 5. ✅ Idempotency check to prevent duplicate processing
 * 
 * All existing functionality preserved including:
 * - ECDSA P-256 signature verification
 * - Separated recipients_count from delivered_count
 * - Proxy-generated open filtering with 1-second delay
 * - Delivery timestamp storage
 * 
 * ============================================================================
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const SENDGRID_WEBHOOK_VERIFICATION_KEY = Deno.env.get('SENDGRID_WEBHOOK_VERIFICATION_KEY') || '';

/**
 * ============================================================================
 * DER SIGNATURE CONVERSION FUNCTIONS
 * ============================================================================
 */

/**
 * Convert DER-encoded ECDSA signature to raw format (R||S)
 * 
 * DER format: 0x30 [length] 0x02 [r-length] [r-bytes] 0x02 [s-length] [s-bytes]
 * Raw format: [32-byte R][32-byte S] = 64 bytes for P-256
 * 
 * SendGrid sends DER format, Web Crypto API needs raw format
 */
function derToRawSignature(derSignature: Uint8Array): Uint8Array {
  const coordinateLength = 32; // P-256 uses 32-byte coordinates
  const rawSignatureLength = 64; // 32 bytes R + 32 bytes S

  let offset = 0;

  // Check SEQUENCE tag (0x30)
  if (derSignature[offset++] !== 0x30) {
    throw new Error('Invalid DER signature: missing SEQUENCE tag');
  }

  // Skip total length
  offset++;

  // Parse R value
  if (derSignature[offset++] !== 0x02) {
    throw new Error('Invalid DER signature: missing INTEGER tag for R');
  }

  const rLength = derSignature[offset++];
  let rBytes = derSignature.slice(offset, offset + rLength);
  offset += rLength;

  // Parse S value
  if (derSignature[offset++] !== 0x02) {
    throw new Error('Invalid DER signature: missing INTEGER tag for S');
  }

  const sLength = derSignature[offset++];
  let sBytes = derSignature.slice(offset, offset + sLength);

  // Remove leading zero bytes (DER padding)
  while (rBytes.length > coordinateLength && rBytes[0] === 0x00) {
    rBytes = rBytes.slice(1);
  }
  while (sBytes.length > coordinateLength && sBytes[0] === 0x00) {
    sBytes = sBytes.slice(1);
  }

  // Pad to 32 bytes if needed
  const paddedR = new Uint8Array(coordinateLength);
  const paddedS = new Uint8Array(coordinateLength);
  paddedR.set(rBytes, coordinateLength - rBytes.length);
  paddedS.set(sBytes, coordinateLength - sBytes.length);

  // Concatenate R and S
  const rawSignature = new Uint8Array(rawSignatureLength);
  rawSignature.set(paddedR, 0);
  rawSignature.set(paddedS, coordinateLength);

  return rawSignature;
}

/**
 * ============================================================================
 * ECDSA SIGNATURE VERIFICATION
 * ============================================================================
 */

/**
 * Import SendGrid's ECDSA P-256 public key
 */
async function importPublicKey(base64PublicKey: string): Promise<CryptoKey> {
  try {
    const binaryDer = Uint8Array.from(atob(base64PublicKey), c => c.charCodeAt(0));
    
    const publicKey = await crypto.subtle.importKey(
      'spki',
      binaryDer,
      {
        name: 'ECDSA',
        namedCurve: 'P-256'
      },
      true,
      ['verify']
    );
    
    return publicKey;
  } catch (error) {
    console.error('❌ Error importing public key:', error);
    throw new Error('Failed to import SendGrid public key');
  }
}

/**
 * Verify webhook signature using ECDSA P-256
 */
async function verifyWebhookSignature(
  signature: string,
  timestamp: string,
  rawPayload: string
): Promise<boolean> {
  if (!SENDGRID_WEBHOOK_VERIFICATION_KEY) {
    console.warn('⚠️  No verification key set - skipping signature verification');
    return true;
  }

  try {
    console.log('🔐 Starting signature verification...');
    
    // Import public key
    const publicKey = await importPublicKey(SENDGRID_WEBHOOK_VERIFICATION_KEY);
    console.log('✅ Public key imported successfully');
    
    // Create signed data (timestamp + payload)
    const encoder = new TextEncoder();
    const data = encoder.encode(timestamp + rawPayload);
    
    console.log('🔍 Verification details:');
    console.log(`   Timestamp: "${timestamp}"`);
    console.log(`   Payload length: ${rawPayload.length} bytes`);
    console.log(`   Combined data length: ${data.length} bytes`);
    
    // Decode DER signature
    const derSignatureBytes = Uint8Array.from(atob(signature), c => c.charCodeAt(0));
    console.log(`   DER signature length: ${derSignatureBytes.length} bytes`);
    
    // Convert DER to raw format
    const rawSignatureBytes = derToRawSignature(derSignatureBytes);
    console.log(`   Raw signature length: ${rawSignatureBytes.length} bytes`);
    
    // Verify signature
    const isValid = await crypto.subtle.verify(
      {
        name: 'ECDSA',
        hash: { name: 'SHA-256' }
      },
      publicKey,
      rawSignatureBytes,
      data
    );
    
    if (isValid) {
      console.log('✅ Webhook signature verified successfully');
    } else {
      console.error('❌ Invalid webhook signature');
      console.error('   Signature verification failed - possible causes:');
      console.error('   1. Wrong public key');
      console.error('   2. Payload modified in transit');
      console.error('   3. Timestamp mismatch');
    }

    return isValid;
  } catch (error) {
    console.error('❌ Signature verification error:', error);
    return false;
  }
}

/**
 * ============================================================================
 * EVENT EXTRACTION HELPERS
 * ============================================================================
 */

function extractCampaignId(event: any): string | null {
  const possibleLocations = [
    event.campaign_id,
    event['campaign-id'],
    event.campaign,
    event.customArgs?.campaign_id,
    event.custom_args?.campaign_id,
    event['sg_campaign_id']
  ];

  for (const value of possibleLocations) {
    if (value && typeof value === 'string' && value.trim() !== '') {
      return value;
    }
  }
  return null;
}

function extractContactId(event: any): string | null {
  const possibleLocations = [
    event.contact_id,
    event['contact-id'],
    event.contact,
    event.customArgs?.contact_id,
    event.custom_args?.contact_id,
    event['sg_contact_id']
  ];

  for (const value of possibleLocations) {
    if (value && typeof value === 'string' && value.trim() !== '') {
      return value;
    }
  }
  return null;
}

/**
 * ============================================================================
 * HANDLE DELIVERED EVENT - Store timestamp for open filtering
 * ============================================================================
 */
async function handleDelivered(
  campaignId: string,
  email: string,
  timestamp: number,
  supabase: any
) {
  console.log(`📬 Handling delivery for ${email} in campaign ${campaignId.substring(0, 8)}...`);
  
  try {
    const deliveredAt = new Date(timestamp * 1000).toISOString();
    
    const { error } = await supabase
      .from('delivery_timestamps')
      .upsert({
        campaign_id: campaignId,
        email: email,
        delivered_at: deliveredAt
      }, {
        onConflict: 'campaign_id,email'
      });
    
    if (error) {
      console.error('❌ Failed to store delivery timestamp:', error.message);
    } else {
      console.log(`✅ Stored delivery timestamp: ${deliveredAt}`);
    }
    
    // Increment delivered count
    const { error: campaignError } = await supabase.rpc('increment_campaign_delivered', {
      campaign_id_param: campaignId
    });
    
    if (campaignError) {
      console.error('❌ Campaign increment error:', campaignError.message);
    }
  } catch (error: any) {
    console.error('❌ Delivery handler error:', error.message);
  }
}

/**
 * ============================================================================
 * UPDATED CAMPAIGN ANALYTICS
 * ============================================================================
 */
async function updateCampaignAnalytics(
  campaignId: string,
  contactId: string | null,
  eventType: string,
  email: string,
  timestamp: number,
  supabase: any
) {
  try {
    console.log(`📊 Updating analytics for campaign ${campaignId.substring(0, 8)}...`);

    // Increment campaign counters based on event type
    switch (eventType) {
      case 'open': {
        // Check if this is a proxy-generated open
        const { data: deliveryData } = await supabase
          .from('delivery_timestamps')
          .select('delivered_at')
          .eq('campaign_id', campaignId)
          .eq('email', email)
          .single();

        if (deliveryData) {
          const deliveredTime = new Date(deliveryData.delivered_at).getTime();
          const openTime = timestamp * 1000;
          const timeDiff = (openTime - deliveredTime) / 1000; // in seconds

          if (timeDiff < 1) {
            console.log(`⚠️  Proxy-generated open detected (${timeDiff.toFixed(3)}s) - ignoring`);
            return;
          }
        }

        await supabase.rpc('increment_campaign_opens', {
          campaign_id_param: campaignId
        });
        console.log('✅ Campaign opens incremented');
        break;
      }

      case 'click':
        await supabase.rpc('increment_campaign_clicks', {
          campaign_id_param: campaignId
        });
        console.log('✅ Campaign clicks incremented');
        break;

      case 'bounce':
      case 'dropped':
        await supabase.rpc('increment_campaign_bounces', {
          campaign_id_param: campaignId
        });
        console.log('✅ Campaign bounces incremented');
        break;

      case 'spamreport':
        await supabase.rpc('increment_campaign_complaints', {
          campaign_id_param: campaignId
        });
        console.log('✅ Campaign complaints incremented');
        break;

      case 'unsubscribe':
        await supabase.rpc('increment_campaign_unsubscribes', {
          campaign_id_param: campaignId
        });
        console.log('✅ Campaign unsubscribes incremented');
        break;
    }

    // Update contact engagement score
    if (contactId) {
      const engagementPoints: Record<string, number> = {
        'open': 1,
        'click': 3,
        'bounce': -5,
        'spamreport': -10,
        'unsubscribe': -15
      };

      const points = engagementPoints[eventType];
      
      if (points) {
        await supabase.rpc('update_contact_engagement', {
          p_contact_id: contactId,
          p_points: points
        });
        console.log(`✅ Contact engagement: ${points > 0 ? '+' : ''}${points}`);
      }
    }
  } catch (error: any) {
    console.error(`❌ Analytics update error:`, error.message);
    throw error;
  }
}

/**
 * ============================================================================
 * EVENT HANDLERS
 * ============================================================================
 */

async function handleBounce(contactId: string, reason: string, supabase: any) {
  const { error } = await supabase
    .from('contacts')
    .update({ status: 'bounced', updated_at: new Date().toISOString() })
    .eq('id', contactId);

  if (error) {
    console.error('❌ Bounce update error:', error);
  } else {
    console.log(`✅ Contact marked as bounced`);
  }
}

async function handleSpamReport(contactId: string, supabase: any) {
  const { error } = await supabase
    .from('contacts')
    .update({ status: 'complained', updated_at: new Date().toISOString() })
    .eq('id', contactId);

  if (error) {
    console.error('❌ Spam report error:', error);
  } else {
    console.log(`✅ Contact marked as complained`);
  }
}

/**
 * ============================================================================
 * UPDATED: ENHANCED UNSUBSCRIBE HANDLER
 * ============================================================================
 */
async function handleUnsubscribe(
  contactId: string,
  email: string,
  campaignId: string | null,
  supabase: any
) {
  console.log(`🚫 Processing unsubscribe for ${email}`);
  
  try {
    // Check if already unsubscribed (idempotency)
    const { data: existingContact } = await supabase
      .from('contacts')
      .select('status')
      .eq('id', contactId)
      .single();

    if (existingContact?.status === 'unsubscribed') {
      console.log(`ℹ️ Contact ${email} already unsubscribed, skipping duplicate processing`);
      return;
    }

    // Update contact status to unsubscribed
    const { error: updateError } = await supabase
      .from('contacts')
      .update({
        status: 'unsubscribed',
        unsubscribed_at: new Date().toISOString(),
        unsubscribe_campaign_id: campaignId || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', contactId);

    if (updateError) {
      console.error('❌ Failed to update contact:', updateError);
      throw updateError;
    }

    console.log(`✅ Contact ${email} marked as unsubscribed`);
    console.log(`   Campaign ID: ${campaignId || 'N/A'}`);
    console.log(`   Timestamp: ${new Date().toISOString()}`);

  } catch (error: any) {
    console.error('❌ Error handling unsubscribe:', error.message);
    throw error;
  }
}

async function handleClick(
  campaignId: string,
  contactId: string,
  url: string,
  supabase: any
) {
  const { error } = await supabase
    .from('link_clicks')
    .insert({
      campaign_id: campaignId,
      contact_id: contactId,
      url: url,
      clicked_at: new Date().toISOString()
    });

  if (error && error.code !== '23505') {
    console.error('❌ Click tracking error:', error);
  } else if (!error) {
    console.log(`✅ Click tracked: ${url.substring(0, 50)}...`);
  }
}

/**
 * ============================================================================
 * EVENT PROCESSING
 * ============================================================================
 */
async function processSendGridEvent(event: any, supabase: any) {
  const eventType = event.event;
  const email = event.email;
  const timestamp = event.timestamp;

  console.log(`\n📧 Processing ${eventType} event for ${email}`);

  const campaign_id = extractCampaignId(event);
  const contact_id = extractContactId(event);

  console.log('🔍 Event Payload Analysis:');
  console.log(`   Event Type: ${eventType}`);
  console.log(`   Email: ${email}`);
  console.log(`   Campaign ID: ${campaign_id || '❌ NOT FOUND'}`);
  console.log(`   Contact ID: ${contact_id || '❌ NOT FOUND'}`);
  console.log(`   Timestamp: ${timestamp} (${new Date(timestamp * 1000).toISOString()})`);

  if (!campaign_id) {
    console.warn(`⚠️  No campaign_id found - event will not be linked to campaign`);
  }

  try {
    const eventTimestamp = timestamp 
      ? new Date(timestamp * 1000).toISOString() 
      : new Date().toISOString();

    // Insert event into email_events table
    const { data: insertedEvent, error: insertError } = await supabase
      .from('email_events')
      .insert({
        campaign_id: campaign_id,
        contact_id: contact_id,
        email: email,
        event_type: eventType,
        timestamp: eventTimestamp,
        metadata: {
          ...event,
          url: event.url || null,
          reason: event.reason || null,
          sendgrid_event_id: event.sg_message_id || event.sg_event_id || null
        }
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Insert error:', insertError.message);
      throw insertError;
    }

    console.log(`✅ Event inserted with ID: ${insertedEvent.id}`);

    // Update campaign analytics
    if (campaign_id) {
      await updateCampaignAnalytics(
        campaign_id, 
        contact_id, 
        eventType,
        email,
        timestamp,
        supabase
      );
    }

    // Handle specific event types
    switch (eventType) {
      case 'delivered':
        if (campaign_id) {
          await handleDelivered(campaign_id, email, timestamp, supabase);
        }
        break;
        
      case 'bounce':
      case 'dropped':
        if (contact_id) await handleBounce(contact_id, event.reason, supabase);
        break;
        
      case 'spamreport':
        if (contact_id) await handleSpamReport(contact_id, supabase);
        break;
        
      case 'unsubscribe':
        if (contact_id) {
          await handleUnsubscribe(contact_id, email, campaign_id, supabase);
        }
        break;
        
      case 'click':
        if (campaign_id && contact_id && event.url) {
          await handleClick(campaign_id, contact_id, event.url, supabase);
        }
        break;
    }

    console.log(`✅ Completed processing ${eventType} event`);
    return true;

  } catch (error: any) {
    console.error(`❌ Processing error:`, error.message);
    throw error;
  }
}

/**
 * ============================================================================
 * MAIN HANDLER
 * ============================================================================
 */
serve(async (req) => {
  console.log('\n' + '='.repeat(80));
  console.log('📨 SENDGRID WEBHOOK RECEIVED');
  console.log('='.repeat(80));

  try {
    const signature = req.headers.get('x-twilio-email-event-webhook-signature');
    const timestamp = req.headers.get('x-twilio-email-event-webhook-timestamp');
    const rawBody = await req.text();

    console.log('📋 Request info:');
    console.log(`   Signature present: ${!!signature}`);
    console.log(`   Timestamp: ${timestamp}`);
    console.log(`   Body size: ${rawBody.length} bytes`);

    // Verify signature
    if (signature && timestamp) {
      const isValid = await verifyWebhookSignature(signature, timestamp, rawBody);
      
      if (!isValid) {
        console.error('❌ REJECTED: Invalid signature');
        return new Response('Unauthorized', { status: 401 });
      }
    } else {
      console.warn('⚠️  No signature headers - skipping verification');
    }

    // Parse events
    const events = JSON.parse(rawBody);
    console.log(`\n📊 Received ${events.length} event(s)`);

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Process events
    let successCount = 0;
    let errorCount = 0;

    for (const event of events) {
      try {
        await processSendGridEvent(event, supabase);
        successCount++;
      } catch (error) {
        console.error(`❌ Event processing failed:`, error);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log(`✅ Success: ${successCount} | ❌ Failed: ${errorCount}`);
    console.log('='.repeat(80) + '\n');

    return new Response('OK', { status: 200 });

  } catch (error: any) {
    console.error('❌ Webhook handler error:', error.message);
    console.error('Stack:', error.stack);
    return new Response('Error', { status: 500 });
  }
});