import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendCodeRequest {
  email: string;
}

function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

serve(async (req: Request) => {
  console.log("=== EMAIL FUNCTION STARTED ===");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email }: SendCodeRequest = await req.json();
    console.log("Processing email:", email);

    if (!email || !email.includes('@')) {
      return new Response(
        JSON.stringify({ error: "Valid email address is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Using custom domain - can send to any email
    console.log("Sending to email:", email);

    // Initialize Resend
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    console.log("RESEND_API_KEY exists:", !!resendApiKey);
    
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const resend = new Resend(resendApiKey);

    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Generate verification code
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    console.log("Generated verification code:", code);

    // Store in database
    console.log("Storing code in database...");
    const { error: dbError } = await supabase
      .from('verification_codes')
      .upsert({
        email: email.toLowerCase(),
        code: code,
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

    // Send email using custom domain
    console.log("Sending email via Resend...");
    
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

    console.log("Resend response:", JSON.stringify(emailResponse, null, 2));

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

    console.log('SUCCESS! Email sent with ID:', emailResponse.data.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Verification code sent successfully",
        expiresAt: expiresAt.toISOString(),
        emailId: emailResponse.data.id
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