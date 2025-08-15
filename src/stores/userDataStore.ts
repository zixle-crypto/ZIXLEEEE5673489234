/**
 * User Data Store - Manages user-specific data persistence with Supabase
 */

import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

export interface UserGameData {
  user_id: string;
  total_shards: number;
  active_shard_multiplier: number;
  active_speed_boost: number;
  active_protection: number;
  shard_multiplier_rooms_left: number;
  speed_boost_rooms_left: number;
  protection_rooms_left: number;
}

export interface UserInventoryItem {
  id: string;
  user_id: string;
  cube_id: string;
  quantity: number;
  purchased_at: string;
}

interface UserDataState {
  user: User | null;
  gameData: UserGameData | null;
  inventory: UserInventoryItem[];
  loading: boolean;
  error: string | null;
}

interface UserDataStore extends UserDataState {
  // Actions
  setUser: (user: User | null) => void;
  loadUserData: () => Promise<void>;
  updateShards: (amount: number) => Promise<void>;
  addCubeToInventory: (cubeId: string, quantity?: number) => Promise<void>;
  updatePowerUps: (powerUps: Partial<Pick<UserGameData, 'active_shard_multiplier' | 'active_speed_boost' | 'active_protection' | 'shard_multiplier_rooms_left' | 'speed_boost_rooms_left' | 'protection_rooms_left'>>) => Promise<void>;
  clearUserData: () => void;
}

export const useUserDataStore = create<UserDataStore>((set, get) => ({
  // Initial state
  user: null,
  gameData: null,
  inventory: [],
  loading: false,
  error: null,

  // Actions
  setUser: (user) => {
    console.log('Setting user in store:', user);
    console.log('User email:', user?.email);
    console.log('User ID:', user?.id);
    set({ user });
    if (user && user.id) {
      console.log('User exists with ID, loading data...');
      get().loadUserData();
    } else {
      console.log('No user or no user ID, clearing data...');
      set({ gameData: null, inventory: [] });
    }
  },

  loadUserData: async () => {
    const { user } = get();
    if (!user) {
      console.log('No user found, cannot load data');
      return;
    }

    console.log('Loading user data for:', user.email);
    set({ loading: true, error: null });

    try {
      // Load game data
      console.log('Fetching game data for user:', user.id);
      const { data: gameData, error: gameError } = await supabase
        .from('user_game_data')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      console.log('Game data result:', gameData, 'Error:', gameError);

      if (gameError) throw gameError;

      // If no game data exists, create it
      if (!gameData) {
        const { data: newGameData, error: createError } = await supabase
          .from('user_game_data')
          .insert({
            user_id: user.id,
            total_shards: 0,
            active_shard_multiplier: 1.0,
            active_speed_boost: 1.0,
            active_protection: 0,
            shard_multiplier_rooms_left: 0,
            speed_boost_rooms_left: 0,
            protection_rooms_left: 0
          })
          .select()
          .single();

        if (createError) throw createError;
        set({ gameData: newGameData });
      } else {
        set({ gameData });
      }

      // Load inventory
      console.log('Fetching inventory for user:', user.id);
      const { data: inventory, error: inventoryError } = await supabase
        .from('user_inventory')
        .select('*')
        .eq('user_id', user.id)
        .order('purchased_at', { ascending: false });

      console.log('Inventory result:', inventory, 'Error:', inventoryError);

      if (inventoryError) throw inventoryError;

      set({ inventory: inventory || [] });
      console.log('User data loaded successfully. Game data:', gameData, 'Inventory items:', inventory?.length || 0);

    } catch (error: any) {
      console.error('Failed to load user data:', error);
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  updateShards: async (amount: number) => {
    const { user, gameData } = get();
    if (!user || !gameData) return;

    try {
      const newTotal = Math.max(0, gameData.total_shards + amount);
      
      const { data, error } = await supabase
        .from('user_game_data')
        .update({ total_shards: newTotal })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      set({ gameData: data });
    } catch (error: any) {
      console.error('Failed to update shards:', error);
      set({ error: error.message });
    }
  },

  addCubeToInventory: async (cubeId: string, quantity = 1) => {
    const { user, inventory } = get();
    if (!user) return;

    try {
      // Check if cube already exists in inventory
      const existingItem = inventory.find(item => item.cube_id === cubeId);
      
      if (existingItem) {
        // Update quantity
        const { data, error } = await supabase
          .from('user_inventory')
          .update({ quantity: existingItem.quantity + quantity })
          .eq('id', existingItem.id)
          .select()
          .single();

        if (error) throw error;

        set({
          inventory: inventory.map(item => 
            item.id === existingItem.id ? data : item
          )
        });
      } else {
        // Add new item
        const { data, error } = await supabase
          .from('user_inventory')
          .insert({
            user_id: user.id,
            cube_id: cubeId,
            quantity
          })
          .select()
          .single();

        if (error) throw error;

        set({ inventory: [data, ...inventory] });
      }
    } catch (error: any) {
      console.error('Failed to add cube to inventory:', error);
      set({ error: error.message });
    }
  },

  updatePowerUps: async (powerUps) => {
    const { user, gameData } = get();
    if (!user || !gameData) return;

    try {
      const { data, error } = await supabase
        .from('user_game_data')
        .update(powerUps)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      set({ gameData: data });
    } catch (error: any) {
      console.error('Failed to update power-ups:', error);
      set({ error: error.message });
    }
  },

  clearUserData: () => {
    set({
      user: null,
      gameData: null,
      inventory: [],
      loading: false,
      error: null
    });
  }
}));