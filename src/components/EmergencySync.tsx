/**
 * Emergency Data Sync - Forces data reload for the current user
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { useUserDataStore } from '@/stores/userDataStore';
import { supabase } from '@/integrations/supabase/client';

export const EmergencySync: React.FC = () => {
  const emergencySync = async () => {
    console.log('🚨 EMERGENCY SYNC STARTED');
    
    try {
      // Get session first
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        console.log('❌ No authenticated user found');
        alert('No authenticated user found!');
        return;
      }

      const userId = session.user.id;
      const userEmail = session.user.email;
      
      console.log('✅ User found:', userEmail, 'ID:', userId);

      // Direct database queries
      console.log('🔍 Checking game data...');
      const { data: gameData, error: gameError } = await supabase
        .from('user_game_data')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      console.log('Game data result:', gameData, gameError);

      console.log('🔍 Checking inventory...');
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('user_inventory')
        .select('*')
        .eq('user_id', userId);

      console.log('Inventory result:', inventoryData, inventoryError);
      console.log('📦 Inventory items found:', inventoryData?.length || 0);

      // Force update the store
      useUserDataStore.setState({
        user: session.user,
        gameData: gameData,
        inventory: inventoryData || [],
        loading: false,
        error: null
      });

      console.log('✅ Store force-updated!');
      
      alert(`Sync complete! Found ${inventoryData?.length || 0} cubes and ${gameData?.total_shards || 0} shards`);
      
      // Refresh the page to ensure everything loads
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (error) {
      console.error('❌ Emergency sync failed:', error);
      alert('Sync failed: ' + error);
    }
  };

  return (
    <div className="fixed top-4 left-4 z-50">
      <Button 
        onClick={emergencySync}
        className="bg-red-600 hover:bg-red-700 text-white font-bold"
        size="sm"
      >
        🚨 EMERGENCY SYNC
      </Button>
    </div>
  );
};