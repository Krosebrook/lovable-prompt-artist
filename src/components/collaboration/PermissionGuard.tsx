import { ReactNode, useEffect, useState } from "react";
import { hasPermission } from "@/lib/permissions";

interface PermissionGuardProps {
  projectId: string;
  action: 'view' | 'edit' | 'comment' | 'manage_collaborators' | 'delete';
  children: ReactNode;
  fallback?: ReactNode;
}

export const PermissionGuard = ({ projectId, action, children, fallback = null }: PermissionGuardProps) => {
  const [allowed, setAllowed] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkPermission();
  }, [projectId, action]);

  const checkPermission = async () => {
    const hasAccess = await hasPermission(projectId, action);
    setAllowed(hasAccess);
    setLoading(false);
  };

  if (loading) return null;
  if (!allowed) return <>{fallback}</>;
  
  return <>{children}</>;
};
