import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from "npm:resend@2.0.0";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const resendApiKey = Deno.env.get('RESEND_API_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface SendGiftRequest {
  cubeId: string;
  cubeName: string;
  cubeCost: number;
  recipient: string;
  recipientType: 'email' | 'github';
  message?: string;
}



const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cubeId, cubeName, cubeCost, recipient, recipientType, message }: SendGiftRequest = await req.json();

    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const anonSupabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!);
    const jwt = authHeader.split(' ')[1];
    const { data: { user }, error: userError } = await anonSupabase.auth.getUser(jwt);
    
    if (!user || userError) {
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`🎁 Gift request from ${user.email}: ${cubeName} to ${recipient}`);

    // Check if sender has enough shards
    const { data: senderGameData, error: senderError } = await supabase
      .from('user_game_data')
      .select('total_shards')
      .eq('user_id', user.id)
      .single();

    if (senderError || !senderGameData) {
      return new Response(JSON.stringify({ error: 'Could not verify sender account' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (senderGameData.total_shards < cubeCost) {
      return new Response(JSON.stringify({ error: 'Insufficient shards' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Deduct shards from sender
    const { error: deductError } = await supabase
      .from('user_game_data')
      .update({ total_shards: senderGameData.total_shards - cubeCost })
      .eq('user_id', user.id);

    if (deductError) {
      console.error('Failed to deduct shards:', deductError);
      return new Response(JSON.stringify({ error: 'Failed to process payment' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create gift record in database
    const giftId = crypto.randomUUID();
    const { error: giftError } = await supabase
      .from('gifts')
      .insert({
        id: giftId,
        sender_id: user.id,
        sender_email: user.email,
        cube_id: cubeId,
        cube_name: cubeName,
        cube_cost: cubeCost,
        recipient: recipient,
        recipient_type: recipientType,
        message: message || '',
        claimed: false
      });

    if (giftError) {
      console.error('Failed to create gift record:', giftError);
      // Refund shards on failure
      await supabase
        .from('user_game_data')
        .update({ total_shards: senderGameData.total_shards })
        .eq('user_id', user.id);
        
      return new Response(JSON.stringify({ error: 'Failed to create gift' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Send email notification (only for email recipients)
    if (recipientType === 'email') {
      try {
        const resend = new Resend(resendApiKey);
        const claimUrl = `${supabaseUrl.replace('//', '//').replace('/rest/v1', '')}/claim-gift?id=${giftId}`;
        
        const emailHtml = `
          <div style="font-family: 'Courier New', monospace; background: #0a0a0f; color: #e2e8f0; padding: 40px; border-radius: 12px; max-width: 600px; margin: 0 auto;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #20d4d4; font-size: 28px; margin: 0; letter-spacing: 2px;">🎁 PERCEPTION SHIFT</h1>
              <p style="color: #64748b; margin: 10px 0;">Reality changes with your attention</p>
            </div>
            
            <div style="background: #1e293b; border: 2px solid #20d4d4; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h2 style="color: #20d4d4; margin: 0 0 15px 0; font-size: 20px;">You've received a gift!</h2>
              <p style="margin: 10px 0; color: #e2e8f0;">
                <strong>${user.email}</strong> has sent you a <strong style="color: #20d4d4;">${cubeName}</strong> cube!
              </p>
              ${message ? `<p style="margin: 10px 0; color: #94a3b8; font-style: italic;">"${message}"</p>` : ''}
              <p style="margin: 15px 0; color: #64748b; font-size: 14px;">
                This cube is worth <strong>${cubeCost} ⬟ shards</strong> and provides special gameplay abilities.
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${claimUrl}" style="background: #20d4d4; color: #0a0a0f; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; letter-spacing: 1px;">
                CLAIM YOUR GIFT
              </a>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #334155;">
              <p style="color: #64748b; font-size: 12px; margin: 0;">
                If you don't have an account, you'll be able to create one when claiming your gift.
              </p>
            </div>
          </div>
        `;

        await resend.emails.send({
          from: Deno.env.get('EMAIL_FROM') || 'Perception Shift <noreply@perceptionshift.game>',
          to: [recipient],
          subject: `🎁 You've received a ${cubeName} cube from ${user.email?.split('@')[0]}!`,
          html: emailHtml,
        });

        console.log('✅ Gift email sent successfully');
      } catch (emailError) {
        console.error('Failed to send email:', emailError);
        // Don't fail the whole transaction for email errors
      }
    }

    console.log(`✅ Gift sent successfully: ${giftId}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        giftId,
        message: `Gift sent successfully to ${recipient}!`
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-gift function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);