import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

interface SplashScreenProps {
  onComplete: (username: string) => void;
}

type Screen = 'splash' | 'welcome' | 'new-player' | 'returning-player';

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('splash');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Auto transition from splash screen after 3 seconds
    if (currentScreen === 'splash') {
      const timer = setTimeout(() => {
        setCurrentScreen('welcome');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [currentScreen]);

  const checkUserExists = async (username: string): Promise<boolean> => {
    // This will be implemented with Supabase
    // For now, simulate with localStorage
    const existingUsers = JSON.parse(localStorage.getItem('zixle-users') || '{}');
    return username.toLowerCase() in existingUsers;
  };

  const createUser = async (username: string) => {
    const existingUsers = JSON.parse(localStorage.getItem('zixle-users') || '{}');
    existingUsers[username.toLowerCase()] = {
      username,
      score: 0,
      progress: 0,
      createdAt: Date.now()
    };
    localStorage.setItem('zixle-users', JSON.stringify(existingUsers));
  };

  const handleNewPlayer = async () => {
    if (!username.trim()) {
      toast({
        title: "Username required",
        description: "Please enter a username to continue",
        variant: "destructive"
      });
      return;
    }

    if (username.length < 3) {
      toast({
        title: "Username too short",
        description: "Username must be at least 3 characters long",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const userExists = await checkUserExists(username);
      if (userExists) {
        toast({
          title: "Username taken",
          description: "This username has already been taken. Please try another one.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      await createUser(username);
      toast({
        title: "Welcome to Zixle Studios!",
        description: `Account created successfully for ${username}`,
      });
      onComplete(username);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create account. Please try again.",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  const handleReturningPlayer = async () => {
    if (!username.trim()) {
      toast({
        title: "Username required",
        description: "Please enter your username to continue",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const userExists = await checkUserExists(username);
      if (!userExists) {
        toast({
          title: "User does not exist",
          description: "This username was not found. Please try again or create a new account.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      toast({
        title: "Welcome back!",
        description: `Successfully logged in as ${username}`,
      });
      onComplete(username);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to login. Please try again.",
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
              Choose a unique username
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-game-text font-mono">
                Username
              </Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="bg-game-bg border-game-border text-game-text font-mono"
                disabled={isLoading}
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
              Enter your username
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-game-text font-mono">
                Username
              </Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="bg-game-bg border-game-border text-game-text font-mono"
                disabled={isLoading}
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