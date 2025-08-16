import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SendCodeRequest {
  email: string;
}

// Generate a secure 6-digit code
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email }: SendCodeRequest = await req.json();

    if (!email || !email.includes('@')) {
      return new Response(
        JSON.stringify({ error: "Valid email address is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Clean up any existing codes for this email
    await supabase
      .from('verification_codes')
      .delete()
      .eq('email', email.toLowerCase());

    // Generate new verification code
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

    console.log(`Generating verification code for ${email}: ${code}`);

    // Store the code in the database
    const { error: dbError } = await supabase
      .from('verification_codes')
      .insert({
        email: email.toLowerCase(),
        code: code,
        expires_at: expiresAt.toISOString(),
        verified: false
      });

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Failed to store verification code');
    }

    // Send email with verification code
    try {
      const fromEmail = Deno.env.get('EMAIL_FROM') || 'onboarding@resend.dev';
      console.log(`Attempting to send verification email from: ${fromEmail} to: ${email}`);
      console.log('RESEND_API_KEY exists:', !!Deno.env.get('RESEND_API_KEY'));
      console.log('EMAIL_FROM value:', Deno.env.get('EMAIL_FROM'));
      
      const emailResponse = await resend.emails.send({
        from: fromEmail,
        to: [email],
        subject: "Your Perception Shift Verification Code",
        html: `
          <div style="font-family: 'Courier New', monospace; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); color: #ffffff; padding: 40px; border-radius: 8px;">
            <div style="text-align: center; margin-bottom: 40px;">
              <h1 style="font-size: 32px; font-weight: 900; letter-spacing: 2px; margin: 0; background: linear-gradient(45deg, #00ff41, #41ff00); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
                ZIXLE STUDIOS
              </h1>
              <h2 style="font-size: 18px; font-weight: 700; letter-spacing: 1px; margin: 10px 0 0 0; color: #00ff41;">
                PERCEPTION SHIFT
              </h2>
            </div>
            
            <div style="background: #000000; border: 2px solid #00ff41; border-radius: 8px; padding: 30px; text-align: center; margin-bottom: 30px;">
              <p style="font-size: 16px; color: #cccccc; margin: 0 0 20px 0;">
                Your verification code is:
              </p>
              <div style="font-size: 48px; font-weight: 900; letter-spacing: 8px; color: #00ff41; background: #1a1a1a; padding: 20px; border-radius: 4px; border: 1px solid #333;">
                ${code}
              </div>
              <p style="font-size: 14px; color: #999999; margin: 20px 0 0 0;">
                This code will expire in 5 minutes
              </p>
            </div>
            
            <div style="text-align: center; margin-bottom: 30px;">
              <p style="font-size: 16px; color: #cccccc; margin: 0 0 10px 0;">
                Enter this code in the game to verify your account and begin your journey.
              </p>
              <p style="font-size: 14px; color: #999999; margin: 0;">
                Reality is about to shift...
              </p>
            </div>
            
            <div style="border-top: 1px solid #333; padding-top: 20px; text-align: center;">
              <p style="font-size: 12px; color: #666666; margin: 0;">
                If you didn't request this code, you can safely ignore this email.
              </p>
              <p style="font-size: 12px; color: #666666; margin: 5px 0 0 0;">
                This is an automated message from Zixle Studios.
              </p>
            </div>
          </div>
        `,
      });

      console.log("Email response:", JSON.stringify(emailResponse, null, 2));

      if (emailResponse.error) {
        console.error('Email sending error:', JSON.stringify(emailResponse.error, null, 2));
        const errorMessage = emailResponse.error?.message || emailResponse.error?.error || JSON.stringify(emailResponse.error);
        throw new Error(`Failed to send email: ${errorMessage}`);
      }

      if (!emailResponse.data) {
        console.error('No data in email response:', emailResponse);
        throw new Error('Email service returned no data');
      }

      console.log('Email sent successfully! ID:', emailResponse.data.id);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Verification code sent successfully",
          expiresAt: expiresAt.toISOString()
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    } catch (emailError: any) {
      console.error('Email sending failed with exception:', emailError);
      console.error('Error details:', JSON.stringify(emailError, null, 2));
      throw new Error(`Email service error: ${emailError.message || emailError}`);
    }
  } catch (error: any) {
    console.error("Error in send-verification-code function:", error);
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