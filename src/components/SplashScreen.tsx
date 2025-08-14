import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

interface SplashScreenProps {
  onComplete: (userEmail: string) => void;
  user?: User | null;
}

type Screen = 'splash' | 'welcome' | 'new-player' | 'returning-player';

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete, user }) => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('splash');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  const handleNewPlayer = async () => {
    if (!email.trim()) {
      toast({
        title: "Email required",
        description: "Please enter an email address to continue",
        variant: "destructive"
      });
      return;
    }

    if (!password.trim()) {
      toast({
        title: "Password required",
        description: "Please enter a password to continue",
        variant: "destructive"
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        }
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        if (data.user.email_confirmed_at) {
          toast({
            title: "Welcome to Zixle Studios!",
            description: `Account created successfully for ${email}`,
          });
          onComplete(email);
        } else {
          toast({
            title: "Check your email!",
            description: `We've sent a confirmation link to ${email}. Please check your email and click the link to activate your account.`,
          });
          setIsLoading(false);
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create account. Please try again.",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  const handleReturningPlayer = async () => {
    if (!email.trim()) {
      toast({
        title: "Email required",
        description: "Please enter your email address to continue",
        variant: "destructive"
      });
      return;
    }

    if (!password.trim()) {
      toast({
        title: "Password required",
        description: "Please enter your password to continue",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast({
            title: "Invalid credentials",
            description: "Please check your email and password. If you just signed up, make sure you've confirmed your email address.",
            variant: "destructive"
          });
        } else if (error.message.includes('Email not confirmed')) {
          toast({
            title: "Email not confirmed",
            description: "Please check your email and click the confirmation link before logging in.",
            variant: "destructive"
          });
        } else {
          throw error;
        }
        setIsLoading(false);
        return;
      }

      if (data.user) {
        toast({
          title: "Welcome back!",
          description: `Successfully logged in as ${email}`,
        });
        onComplete(email);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to login. Please try again.",
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
              Choose your path to begin
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => setCurrentScreen('new-player')}
              className="w-full bg-perception hover:bg-perception/90 text-white font-mono"
              size="lg"
            >
              NEW PLAYER
            </Button>
            <Button
              onClick={() => setCurrentScreen('returning-player')}
              variant="outline"
              className="w-full border-perception text-perception hover:bg-perception/10 font-mono"
              size="lg"
            >
              RETURNING PLAYER
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentScreen === 'new-player') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-game-bg via-game-surface to-game-bg flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-game-surface border-game-border shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-black text-perception font-orbitron">
              CREATE ACCOUNT
            </CardTitle>
            <p className="text-game-text-dim text-sm font-mono">
              Enter your email and create a password
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-game-text font-mono">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="bg-game-bg border-game-border text-game-text font-mono"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-game-text font-mono">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="bg-game-bg border-game-border text-game-text font-mono"
                  disabled={isLoading}
                />
              </div>
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
                onClick={handleNewPlayer}
                className="flex-1 bg-perception hover:bg-perception/90 text-white font-mono"
                disabled={isLoading}
              >
                {isLoading ? 'CREATING...' : 'CREATE'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentScreen === 'returning-player') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-game-bg via-game-surface to-game-bg flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-game-surface border-game-border shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-black text-perception font-orbitron">
              WELCOME BACK
            </CardTitle>
            <p className="text-game-text-dim text-sm font-mono">
              Enter your email and password
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-game-text font-mono">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="bg-game-bg border-game-border text-game-text font-mono"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-game-text font-mono">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="bg-game-bg border-game-border text-game-text font-mono"
                  disabled={isLoading}
                />
              </div>
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
                onClick={handleReturningPlayer}
                className="flex-1 bg-perception hover:bg-perception/90 text-white font-mono"
                disabled={isLoading}
              >
                {isLoading ? 'LOGGING IN...' : 'LOGIN'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
};