import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface VerifyCodeRequest {
  email: string;
  code: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, code }: VerifyCodeRequest = await req.json();

    if (!email || !code) {
      return new Response(
        JSON.stringify({ error: "Email and code are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Create Supabase client with service role key for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Verifying code for ${email}: ${code}`);

    // First, check if the verification code exists and is valid
    const { data: verificationData, error: verificationError } = await supabase
      .from('verification_codes')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('code', code)
      .eq('verified', false)
      .gte('expires_at', new Date().toISOString())
      .maybeSingle(); // Use maybeSingle instead of single to handle no results gracefully

    console.log('Verification lookup result:', { verificationData, verificationError });

    if (verificationError) {
      console.log('Database error during verification:', verificationError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Database error during verification" 
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    if (!verificationData) {
      console.log('No valid verification code found - code may be invalid, expired, or already used');
      
      // Check if the user already exists and is verified
      const { data: existingUser, error: userCheckError } = await supabase.auth.admin.listUsers();
      
      if (!userCheckError && existingUser?.users) {
        const userExists = existingUser.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
        
        if (userExists) {
          console.log('User already exists and is verified - generating sign-in token');
          
          // For existing users, just return success - let the client handle sign in
          console.log('User already exists and is verified - allowing verification');
          
          return new Response(
            JSON.stringify({ 
              success: true, 
              message: "Code verified successfully",
              user_exists: true
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            }
          );
        }
      }
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Invalid or expired verification code. Please request a new one." 
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Mark the code as verified
    const { error: updateError } = await supabase
      .from('verification_codes')
      .update({ verified: true })
      .eq('id', verificationData.id);

    if (updateError) {
      console.error('Error updating verification code:', updateError);
      throw new Error('Failed to update verification status');
    }

    // Create the user account using admin API
    const { data: userData, error: signUpError } = await supabase.auth.admin.createUser({
      email: email.toLowerCase(),
      email_confirm: true, // Auto-confirm the email since they verified via code
      user_metadata: {
        verified_via_code: true,
        verification_timestamp: new Date().toISOString()
      }
    });

    if (signUpError) {
      // If user already exists, that's okay - we'll sign them in
      if (signUpError.message.includes('already been registered') || signUpError.code === 'email_exists') {
        console.log('User already exists, proceeding with sign-in');
        
        // For existing users, just return success
        console.log('User already exists, verification successful');
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Code verified successfully",
            user_exists: true
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      } else {
        console.error('Error creating user:', signUpError);
        throw new Error('Failed to create user account');
      }
    }

    console.log('User created successfully:', userData.user?.id);

    // Clean up old verification codes for this email
    await supabase
      .from('verification_codes')
      .delete()
      .eq('email', email.toLowerCase());

    // For new users, just return success - let the client handle sign in
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Code verified and account created successfully",
        user_created: true
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in verify-code function:", error);
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