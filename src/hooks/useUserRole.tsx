import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export const useUserRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserRole();
    } else {
      setRole(null);
      setLoading(false);
    }
  }, [user]);

  const fetchUserRole = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();
      
      if (error) {
        console.error('Error fetching user role:', error);
        setRole('staff'); // Default to staff
      } else {
        setRole(data?.role || 'staff');
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
      setRole('staff');
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = role === 'admin';
  const isStaff = role === 'staff' || role === 'admin';

  return {
    role,
    loading,
    isAdmin,
    isStaff,
    refetch: fetchUserRole
  };
};