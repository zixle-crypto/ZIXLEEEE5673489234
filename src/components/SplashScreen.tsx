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
  const [isLoading, setIsLoading] = useState(false);

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

  const signInWithGoogle = async () => {
    setIsLoading(true);
    console.log('🚀 Starting Google OAuth with popup...');
    
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          skipBrowserRedirect: true
        }
      });

      if (error) throw error;

      if (data?.url) {
        console.log('🌐 Opening OAuth popup:', data.url);
        // Open OAuth in a popup window to bypass sandbox restrictions
        const popup = window.open(
          data.url,
          'oauth-popup',
          'width=500,height=600,scrollbars=yes,resizable=yes'
        );

        // Listen for auth state changes
        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'SIGNED_IN' && session) {
            console.log('✅ OAuth successful');
            popup?.close();
            setIsLoading(false);
            if (session.user?.email) {
              onComplete(session.user.email);
            }
          }
        });

        // Clean up listener after 5 minutes
        setTimeout(() => {
          authListener.subscription.unsubscribe();
          setIsLoading(false);
        }, 300000);
      }
      
    } catch (error: any) {
      console.error('❌ Google sign-in failed:', error);
      toast({
        title: "Sign in failed",
        description: "Please try again or use guest mode.",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  const signInWithGitHub = async () => {
    setIsLoading(true);
    console.log('🚀 Starting GitHub OAuth with popup...');
    
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: window.location.origin,
          skipBrowserRedirect: true
        }
      });

      if (error) throw error;

      if (data?.url) {
        console.log('🌐 Opening OAuth popup:', data.url);
        // Open OAuth in a popup window to bypass sandbox restrictions
        const popup = window.open(
          data.url,
          'oauth-popup',
          'width=500,height=600,scrollbars=yes,resizable=yes'
        );

        // Listen for auth state changes
        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'SIGNED_IN' && session) {
            console.log('✅ OAuth successful');
            popup?.close();
            setIsLoading(false);
            if (session.user?.email) {
              onComplete(session.user.email);
            }
          }
        });

        // Clean up listener after 5 minutes
        setTimeout(() => {
          authListener.subscription.unsubscribe();
          setIsLoading(false);
        }, 300000);
      }
      
    } catch (error: any) {
      console.error('❌ GitHub sign-in failed:', error);
      toast({
        title: "Sign in failed", 
        description: "Please try again or use guest mode.",
        variant: "destructive"
      });
      setIsLoading(false);
    }
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
              Sign in to save your progress
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={signInWithGoogle}
              className="w-full bg-white hover:bg-gray-100 text-black font-mono border border-gray-300"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? 'SIGNING IN...' : '🔗 CONTINUE WITH GOOGLE'}
            </Button>
            <Button
              onClick={signInWithGitHub}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white font-mono border border-gray-700"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? 'SIGNING IN...' : '🔗 CONTINUE WITH GITHUB'}
            </Button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-game-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-game-surface px-2 text-game-text-dim font-mono">OR</span>
              </div>
            </div>
            <Button
              onClick={() => onComplete('guest')}
              variant="outline"
              className="w-full border-game-border text-game-text hover:bg-game-bg font-mono"
              size="lg"
            >
              PLAY AS GUEST
            </Button>
            <p className="text-center text-xs text-game-text-dim font-mono">
              <span className="text-perception">Sign in to save your progress, scores, and unlock achievements!</span>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;

};