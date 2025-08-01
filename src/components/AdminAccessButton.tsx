
import { Button } from '@/components/ui/button';
import { Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AdminAccessButton = () => {
  const navigate = useNavigate();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => navigate('/admin/login')}
      className="fixed bottom-4 left-4 z-50 bg-background/95 backdrop-blur-sm border-2 border-primary/20 hover:border-primary/40 transition-all duration-200"
    >
      <Shield className="h-4 w-4 mr-2" />
      لوحة الإدارة
    </Button>
  );
};
