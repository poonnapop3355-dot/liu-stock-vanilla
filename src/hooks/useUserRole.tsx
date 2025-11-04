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
        // Security: Deny access on error instead of defaulting to staff
        setRole(null);
        setLoading(false);
        return;
      }
      
      if (data?.role) {
        setRole(data.role);
      } else {
        // User exists but has no role assigned
        setRole(null);
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
      // Security: Deny access on exception instead of defaulting to staff
      setRole(null);
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