import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useUserDataStore } from '@/stores/userDataStore';
import { Gift } from 'lucide-react';

export const useGiftNotifications = () => {
  const { user, loadUserData } = useUserDataStore();
  const [isInGame, setIsInGame] = useState(false);

  // Function to check for unclaimed gifts
  const checkForGifts = async () => {
    if (!user?.email) return;

    try {
      const { data: gifts, error } = await supabase
        .from('gifts')
        .select('*')
        .eq('recipient', user.email)
        .eq('recipient_type', 'email')
        .eq('claimed', false);

      if (error) {
        console.error('Error checking for gifts:', error);
        return;
      }

      if (gifts && gifts.length > 0) {
        // Auto-claim all gifts and show notifications
        for (const gift of gifts) {
          await claimGift(gift.id, gift.cube_name, gift.sender_email, gift.message);
        }
      }
    } catch (error) {
      console.error('Error in checkForGifts:', error);
    }
  };

  const claimGift = async (giftId: string, cubeName: string, senderEmail: string, message: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('claim-gift', {
        body: { giftId }
      });

      if (error) {
        console.error('Error claiming gift:', error);
        return;
      }

      // Show in-game notification if user is in game
      if (isInGame) {
        toast({
          title: "🎁 Gift Received!",
          description: `${cubeName} from ${senderEmail.split('@')[0]}${message ? `: "${message}"` : ''}`,
          duration: 5000,
        });
      }

      // Reload user data to update inventory
      await loadUserData();
      
      console.log('✅ Gift claimed successfully:', cubeName);
    } catch (error) {
      console.error('Error claiming gift:', error);
    }
  };

  // Set up real-time subscription for new gifts
  useEffect(() => {
    if (!user?.email) return;

    const channel = supabase
      .channel('gift-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'gifts',
          filter: `recipient=eq.${user.email}`
        },
        async (payload) => {
          console.log('🎁 New gift received:', payload.new);
          const gift = payload.new;
          
          // Auto-claim the gift
          await claimGift(gift.id, gift.cube_name, gift.sender_email, gift.message);
        }
      )
      .subscribe();

    // Check for existing unclaimed gifts on mount
    checkForGifts();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.email, isInGame]);

  return {
    setIsInGame,
    checkForGifts
  };
};