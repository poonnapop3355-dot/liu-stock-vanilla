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
        // Security: Deny access on error instead of defaulting to staff
        setUserRole(null);
        setLoading(false);
        return;
      }
      
      if (data && data.length > 0) {
        // If user has admin role, set that as primary
        // Otherwise, set staff if they have it
        const roles = data.map(r => r.role);
        if (roles.includes('admin')) {
          setUserRole('admin');
        } else if (roles.includes('staff')) {
          setUserRole('staff');
        } else {
          // User exists but has no valid roles
          setUserRole(null);
        }
      } else {
        // User exists but has no roles assigned
        setUserRole(null);
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
      // Security: Deny access on exception instead of defaulting to staff
      setUserRole(null);
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

  // If role is null (error or no role assigned), show error state
  if (userRole === null) {
    return fallback || (
      <Card className="max-w-md mx-auto mt-8">
        <CardContent className="p-6 text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 text-destructive" />
          <h3 className="font-semibold mb-2">Permission Verification Failed</h3>
          <p className="text-muted-foreground">
            Unable to verify your permissions. Please refresh the page or contact support if the issue persists.
          </p>
        </CardContent>
      </Card>
    );
  }

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