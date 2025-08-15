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
    if (!user?.id) {
      console.log('No user ID');
      return;
    }

    try {
      // Load game data
      const { data: gameData, error: gameError } = await supabase
        .from('user_game_data')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      console.log('Direct game data:', gameData, 'Error:', gameError);

      // Load inventory
      const { data: inventory, error: inventoryError } = await supabase
        .from('user_inventory')
        .select('*')
        .eq('user_id', user.id);

      console.log('Direct inventory:', inventory, 'Error:', inventoryError);
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
          Force Load
        </Button>
      </div>
    </div>
  );
};