// Follow this template to write a good function:
// 1. Import the necessary dependencies
// 2. Define the types
// 3. Define the main logic
// 4. Export the handler

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://ihvnriqsrdhayysfcywm.lovableproject.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface VerifyCodeRequest {
  email: string;
  code: string;
}

const hashCode = async (code: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(code);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, code }: VerifyCodeRequest = await req.json();

    if (!email || !code) {
      return new Response(JSON.stringify({ error: 'Email and code are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const hashedCode = await hashCode(code);

    // Find valid verification code using hashed code
    const { data: verificationData, error: verificationError } = await supabase
      .from('verification_codes')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('code', hashedCode)
      .eq('verified', false)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (verificationError || !verificationData) {
      console.log('No valid verification code found');
      // Check if user already exists without revealing if code was wrong or user exists
      const { data: { user }, error: userError } = await supabase.auth.admin.getUserByEmail(email);
      
      if (user && !userError) {
        return new Response(JSON.stringify({ 
          success: true, 
          message: 'User already verified',
          userId: user.id 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      return new Response(JSON.stringify({ error: 'Invalid verification code' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Mark code as verified
    const { error: updateError } = await supabase
      .from('verification_codes')
      .update({ verified: true })
      .eq('id', verificationData.id);

    if (updateError) {
      console.error('Error updating verification code:', updateError);
      throw new Error('Failed to update verification status');
    }

    // Create user with email already confirmed
    const { data: userData, error: createError } = await supabase.auth.admin.createUser({
      email: email,
      email_confirm: true,
      user_metadata: {
        email_verified: true,
        verified_at: new Date().toISOString()
      }
    });

    if (createError) {
      console.error('Error creating user:', createError);
      
      // If user already exists, that's ok
      if (createError.message?.includes('already registered')) {
        const { data: { user }, error: getUserError } = await supabase.auth.admin.getUserByEmail(email);
        if (user && !getUserError) {
          return new Response(JSON.stringify({ 
            success: true, 
            message: 'User verified successfully',
            userId: user.id 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
      
      throw new Error('Failed to create user');
    }

    // Clean up old verification codes for this email
    const { error: cleanupError } = await supabase
      .from('verification_codes')
      .delete()
      .eq('email', email.toLowerCase())
      .neq('id', verificationData.id);

    if (cleanupError) {
      console.warn('Failed to cleanup old verification codes:', cleanupError);
      // Don't fail the request for cleanup errors
    }

    console.log('User verified and created successfully');

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Email verified successfully',
      userId: userData.user?.id 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in verify-code function:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);