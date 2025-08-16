import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://ihvnriqsrdhayysfcywm.lovableproject.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface SendCodeRequest {
  email: string;
}

function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const hashCode = async (code: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(code);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const checkRateLimit = async (supabase: any, email: string): Promise<boolean> => {
  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
  
  // Check current rate limit status
  const { data: attempts } = await supabase
    .from('verification_attempts')
    .select('*')
    .eq('email', email)
    .single();
  
  if (attempts) {
    // Check if blocked
    if (attempts.blocked_until && new Date(attempts.blocked_until) > now) {
      return false;
    }
    
    // Check if within rate limit window
    if (new Date(attempts.last_attempt) > fiveMinutesAgo) {
      if (attempts.attempt_count >= 3) {
        // Block for 15 minutes
        await supabase
          .from('verification_attempts')
          .update({ 
            blocked_until: new Date(now.getTime() + 15 * 60 * 1000).toISOString(),
            attempt_count: attempts.attempt_count + 1 
          })
          .eq('email', email);
        return false;
      }
      
      // Increment attempt count
      await supabase
        .from('verification_attempts')
        .update({ 
          attempt_count: attempts.attempt_count + 1,
          last_attempt: now.toISOString()
        })
        .eq('email', email);
    } else {
      // Reset attempt count
      await supabase
        .from('verification_attempts')
        .update({ 
          attempt_count: 1,
          last_attempt: now.toISOString(),
          blocked_until: null
        })
        .eq('email', email);
    }
  } else {
    // Create new attempt record
    await supabase
      .from('verification_attempts')
      .insert({
        email,
        attempt_count: 1,
        last_attempt: now.toISOString()
      });
  }
  
  return true;
};

serve(async (req: Request) => {
  console.log("=== EMAIL FUNCTION STARTED ===");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email }: SendCodeRequest = await req.json();

    if (!email || !email.includes('@')) {
      return new Response(
        JSON.stringify({ error: "Valid email address is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Initialize Supabase with service role for rate limiting
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check rate limiting
    const canProceed = await checkRateLimit(supabase, email.toLowerCase());
    if (!canProceed) {
      return new Response(JSON.stringify({ error: 'Too many attempts. Please try again later.' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate verification code
    const code = generateVerificationCode();
    const hashedCode = await hashCode(code);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    console.log("Generated verification code for:", email);

    // Store hashed code in database
    const { error: dbError } = await supabase
      .from('verification_codes')
      .upsert({
        email: email.toLowerCase(),
        code: hashedCode,
        expires_at: expiresAt.toISOString(),
        verified: false
      });

    if (dbError) {
      console.error('Database error:', dbError);
      return new Response(
        JSON.stringify({ error: "Database error: " + dbError.message }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Initialize Resend
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const resend = new Resend(resendApiKey);

    // Send email with plaintext code (only in email)
    const emailResponse = await resend.emails.send({
      from: 'noreply@zixlestudios.com',
      to: [email],
      subject: "Your Perception Shift Verification Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #000; color: #fff;">
          <h1 style="color: #00ff41; text-align: center;">PERCEPTION SHIFT</h1>
          <div style="background: #111; padding: 30px; border-radius: 8px; text-align: center;">
            <p style="font-size: 18px; margin-bottom: 20px;">Your verification code:</p>
            <div style="font-size: 36px; font-weight: bold; color: #00ff41; background: #222; padding: 15px; border-radius: 4px; letter-spacing: 4px;">
              ${code}
            </div>
            <p style="margin-top: 20px; font-size: 14px; color: #999;">
              This code expires in 5 minutes
            </p>
          </div>
        </div>
      `,
    });

    if (emailResponse.error) {
      console.error('Resend error:', emailResponse.error);
      return new Response(
        JSON.stringify({ error: "Email sending failed: " + emailResponse.error.message }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!emailResponse.data) {
      console.error('No data returned from Resend');
      return new Response(
        JSON.stringify({ error: "Email service returned no data" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log('SUCCESS! Email sent');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Verification code sent successfully",
        expiresAt: expiresAt.toISOString()
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );

  } catch (error: any) {
    console.error("Function error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );
  }
});