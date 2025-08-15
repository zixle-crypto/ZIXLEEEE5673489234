/**
 * Force reload user data - utility component for debugging
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { useUserDataStore } from '@/stores/userDataStore';
import { supabase } from '@/integrations/supabase/client';

export const DebugPanel: React.FC = () => {
  const { user, gameData, inventory, loading, error, loadUserData } = useUserDataStore();

  const forceReload = async () => {
    console.log('Forcing data reload...');
    await loadUserData();
  };

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Current session:', session);
    console.log('Current user in store:', user);
  };

  const forceLoadData = async () => {
    console.log('Force loading data directly...');
    
    // Get current session first
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Current session:', session);
    
    if (!session?.user?.id) {
      console.log('No authenticated user found');
      return;
    }

    const userId = session.user.id;
    console.log('Force loading for user ID:', userId);

    try {
      // Load game data directly
      console.log('Fetching game data...');
      const { data: gameData, error: gameError } = await supabase
        .from('user_game_data')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      console.log('Direct game data result:', gameData, 'Error:', gameError);

      // Load inventory directly
      console.log('Fetching inventory...');
      const { data: inventory, error: inventoryError } = await supabase
        .from('user_inventory')
        .select('*')
        .eq('user_id', userId);

      console.log('Direct inventory result:', inventory, 'Error:', inventoryError);
      console.log('Inventory count:', inventory?.length || 0);

      // If data exists, force update the store
      if (gameData || inventory) {
        const { setUser: setUserData } = useUserDataStore.getState();
        
        // Force update store state
        useUserDataStore.setState({
          user: session.user,
          gameData: gameData,
          inventory: inventory || [],
          loading: false,
          error: null
        });
        
        console.log('Store updated directly!');
      }
      
    } catch (error) {
      console.error('Direct load error:', error);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-game-surface border border-game-border rounded-lg p-4 text-xs max-w-sm">
      <h3 className="text-perception font-bold mb-2">Debug Panel</h3>
      <div className="space-y-1 text-game-text">
        <p>User: {user?.email || 'None'}</p>
        <p>User ID: {user?.id || 'None'}</p>
        <p>Loading: {loading ? 'Yes' : 'No'}</p>
        <p>Error: {error || 'None'}</p>
        <p>Game Data: {gameData ? 'Loaded' : 'None'}</p>
        <p>Shards: {gameData?.total_shards || 0}</p>
        <p>Inventory: {inventory.length} items</p>
      </div>
      <div className="flex gap-1 mt-3">
        <Button onClick={forceReload} size="sm" variant="outline">
          Reload
        </Button>
        <Button onClick={checkAuth} size="sm" variant="outline">
          Check Auth
        </Button>
        <Button onClick={forceLoadData} size="sm" variant="outline">
          Force Sync
        </Button>
      </div>
    </div>
  );
};