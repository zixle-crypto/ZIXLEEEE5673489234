import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

interface SplashScreenProps {
  onComplete: (userEmail: string) => void;
  user?: User | null;
}

type Screen = 'splash' | 'welcome' | 'enter-email' | 'verify-code';

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete, user }) => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('splash');
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);

  // If user is already authenticated, complete the flow
  useEffect(() => {
    if (user && user.email_confirmed_at) {
      onComplete(user.email || '');
    }
  }, [user, onComplete]);

  useEffect(() => {
    // Auto transition from splash screen after 3 seconds
    if (currentScreen === 'splash') {
      const timer = setTimeout(() => {
        setCurrentScreen('welcome');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [currentScreen]);

  // Countdown timer for resend cooldown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const sendVerificationCode = async () => {
    if (!email.trim()) {
      toast({
        title: "Email required",
        description: "Please enter an email address to continue",
        variant: "destructive"
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('send-verification-code', {
        body: { email: email.trim() }
      });

      if (error) {
        throw error;
      }

      if (data.success) {
        toast({
          title: "Verification code sent!",
          description: `We've sent a 6-digit code to ${email}. Please check your email.`,
        });
        setExpiresAt(new Date(data.expiresAt));
        setCurrentScreen('verify-code');
        setResendCooldown(30); // 30 second cooldown
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send verification code. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!verificationCode.trim() || verificationCode.length !== 6) {
      toast({
        title: "Invalid code",
        description: "Please enter the complete 6-digit verification code",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('verify-code', {
        body: { 
          email: email.trim(), 
          code: verificationCode.trim() 
        }
      });

      if (error) {
        throw error;
      }

      if (data.success) {
        console.log('Verification successful, data:', data);
        
        // If we got tokens, set the session
        if (data.access_token && data.refresh_token) {
          console.log('Setting session with tokens...');
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: data.access_token,
            refresh_token: data.refresh_token
          });

          if (sessionError) {
            console.error('Session error:', sessionError);
            throw sessionError;
          }
          console.log('Session set successfully');
        } else {
          // No tokens returned, try to sign in with email (passwordless)
          console.log('No tokens returned, attempting passwordless sign in...');
          const { error: signInError } = await supabase.auth.signInWithOtp({
            email: email.trim(),
            options: {
              shouldCreateUser: false
            }
          });
          
          if (signInError) {
            console.error('Sign in error:', signInError);
            // Don't throw here, just continue with the flow
          }
        }

        toast({
          title: data.user_created ? "Welcome to Zixle Studios!" : "Welcome back!",
          description: data.user_created 
            ? `Account created successfully for ${email}` 
            : `Successfully verified and logged in as ${email}`,
        });
        
        console.log('About to call onComplete...');
        // Complete immediately - the auth state change will handle navigation
        onComplete(email);
      } else {
        throw new Error(data.error || "Invalid verification code");
      }
    } catch (error: any) {
      toast({
        title: "Verification failed",
        description: error.message || "Invalid or expired verification code. Please try again.",
        variant: "destructive"
      });
      setVerificationCode('');
    } finally {
      setIsLoading(false);
    }
  };

  const getTimeRemaining = (): string => {
    if (!expiresAt) return '';
    const now = new Date();
    const timeLeft = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (currentScreen === 'splash') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-8xl font-black text-black font-orbitron tracking-wider animate-fade-in">
            ZIXLE STUDIOS
          </h1>
          <div className="mt-8 w-32 h-1 bg-black mx-auto animate-scale-in"></div>
        </div>
      </div>
    );
  }

  if (currentScreen === 'welcome') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-game-bg via-game-surface to-game-bg flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-game-surface border-game-border shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-black text-perception font-orbitron">
              PERCEPTION SHIFT
            </CardTitle>
            <p className="text-game-text-dim text-sm font-mono">
              Enter your email to begin or continue
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => setCurrentScreen('enter-email')}
              className="w-full bg-perception hover:bg-perception/90 text-white font-mono"
              size="lg"
            >
              ENTER EMAIL
            </Button>
            <p className="text-center text-xs text-game-text-dim font-mono">
              We'll send you a 6-digit code to verify your email
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentScreen === 'enter-email') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-game-bg via-game-surface to-game-bg flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-game-surface border-game-border shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-black text-perception font-orbitron">
              ENTER EMAIL
            </CardTitle>
            <p className="text-game-text-dim text-sm font-mono">
              We'll send you a verification code
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-game-text font-mono">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="bg-game-bg border-game-border text-game-text font-mono"
                disabled={isLoading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    sendVerificationCode();
                  }
                }}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setCurrentScreen('welcome')}
                variant="outline"
                className="flex-1 border-game-border text-game-text hover:bg-game-bg font-mono"
                disabled={isLoading}
              >
                BACK
              </Button>
              <Button
                onClick={sendVerificationCode}
                className="flex-1 bg-perception hover:bg-perception/90 text-white font-mono"
                disabled={isLoading}
              >
                {isLoading ? 'SENDING...' : 'SEND CODE'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentScreen === 'verify-code') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-game-bg via-game-surface to-game-bg flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-game-surface border-game-border shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-black text-perception font-orbitron">
              VERIFY CODE
            </CardTitle>
            <p className="text-game-text-dim text-sm font-mono">
              Enter the 6-digit code sent to
            </p>
            <p className="text-perception text-sm font-mono font-bold">
              {email}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={verificationCode}
                  onChange={(value) => setVerificationCode(value)}
                  disabled={isLoading}
                >
                  <InputOTPGroup className="gap-2">
                    <InputOTPSlot 
                      index={0} 
                      className="w-12 h-12 text-2xl font-mono bg-game-bg border-game-border text-game-text" 
                    />
                    <InputOTPSlot 
                      index={1} 
                      className="w-12 h-12 text-2xl font-mono bg-game-bg border-game-border text-game-text" 
                    />
                    <InputOTPSlot 
                      index={2} 
                      className="w-12 h-12 text-2xl font-mono bg-game-bg border-game-border text-game-text" 
                    />
                    <InputOTPSlot 
                      index={3} 
                      className="w-12 h-12 text-2xl font-mono bg-game-bg border-game-border text-game-text" 
                    />
                    <InputOTPSlot 
                      index={4} 
                      className="w-12 h-12 text-2xl font-mono bg-game-bg border-game-border text-game-text" 
                    />
                    <InputOTPSlot 
                      index={5} 
                      className="w-12 h-12 text-2xl font-mono bg-game-bg border-game-border text-game-text" 
                    />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              
              {expiresAt && (
                <p className="text-center text-xs text-game-text-dim font-mono">
                  Code expires in: {getTimeRemaining()}
                </p>
              )}
            </div>
            
            <div className="space-y-3">
              <Button
                onClick={verifyCode}
                className="w-full bg-perception hover:bg-perception/90 text-white font-mono"
                disabled={isLoading || verificationCode.length !== 6}
              >
                {isLoading ? 'VERIFYING...' : 'VERIFY CODE'}
              </Button>
              
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setCurrentScreen('enter-email');
                    setVerificationCode('');
                    setExpiresAt(null);
                  }}
                  variant="outline"
                  className="flex-1 border-game-border text-game-text hover:bg-game-bg font-mono"
                  disabled={isLoading}
                >
                  CHANGE EMAIL
                </Button>
                <Button
                  onClick={sendVerificationCode}
                  variant="outline"
                  className="flex-1 border-perception text-perception hover:bg-perception/10 font-mono"
                  disabled={isLoading || resendCooldown > 0}
                >
                  {resendCooldown > 0 ? `RESEND (${resendCooldown}s)` : 'RESEND CODE'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
};