import { useEffect, useState, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Shield } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface RoleGuardProps {
  children: ReactNode;
  requiredRole?: 'admin' | 'staff';
  fallback?: ReactNode;
}

const RoleGuard = ({ children, requiredRole = 'staff', fallback }: RoleGuardProps) => {
  const { user, loading: authLoading } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && !authLoading) {
      fetchUserRole();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading]);

  const fetchUserRole = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Error fetching user role:', error);
        setUserRole('staff');
      } else if (data && data.length > 0) {
        // If user has admin role, set that as primary
        // Otherwise, set staff if they have it, or default to staff
        const roles = data.map(r => r.role);
        if (roles.includes('admin')) {
          setUserRole('admin');
        } else if (roles.includes('staff')) {
          setUserRole('staff');
        } else {
          setUserRole('staff');
        }
      } else {
        setUserRole('staff');
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
      setUserRole('staff');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return fallback || (
      <Card className="max-w-md mx-auto mt-8">
        <CardContent className="p-6 text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-semibold mb-2">Authentication Required</h3>
          <p className="text-muted-foreground">Please sign in to access this feature.</p>
        </CardContent>
      </Card>
    );
  }

  const hasPermission = () => {
    if (!userRole) return false;
    
    if (requiredRole === 'admin') {
      return userRole === 'admin';
    }
    
    if (requiredRole === 'staff') {
      return userRole === 'admin' || userRole === 'staff';
    }
    
    return false;
  };

  if (!hasPermission()) {
    return fallback || (
      <Card className="max-w-md mx-auto mt-8">
        <CardContent className="p-6 text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 text-destructive" />
          <h3 className="font-semibold mb-2">Access Denied</h3>
          <p className="text-muted-foreground">
            You don't have the required permissions to access this feature.
            {requiredRole === 'admin' && ' Administrator access required.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
};

export default RoleGuard;