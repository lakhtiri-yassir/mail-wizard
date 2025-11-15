import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const events = await req.json();

    for (const event of events) {
      const eventType = event.event;
      const email = event.email;
      const timestamp = new Date(event.timestamp * 1000);

      const metadata = {
        sg_event_id: event.sg_event_id,
        sg_message_id: event.sg_message_id,
        response: event.response,
        reason: event.reason,
        url: event.url,
      };

      await supabase.from('email_events').insert({
        event_type: eventType,
        timestamp,
        metadata,
      });

      if (eventType === 'open') {
        await supabase.rpc('increment_campaign_opens', {
          p_email: email,
        });
      } else if (eventType === 'click') {
        await supabase.rpc('increment_campaign_clicks', {
          p_email: email,
        });

        if (event.url) {
          await supabase.from('link_clicks').insert({
            url: event.url,
          });
        }
      } else if (eventType === 'bounce') {
        await supabase
          .from('contacts')
          .update({ status: 'bounced' })
          .eq('email', email);
      } else if (eventType === 'spam') {
        await supabase
          .from('contacts')
          .update({ status: 'complained' })
          .eq('email', email);
      } else if (eventType === 'unsubscribe') {
        await supabase
          .from('contacts')
          .update({ status: 'unsubscribed' })
          .eq('email', email);
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed: events.length }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});