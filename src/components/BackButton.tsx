
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BackButtonProps {
  to?: string;
  className?: string;
}

export const BackButton = ({ to, className = "" }: BackButtonProps) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleBack}
      className={`fixed top-20 right-4 z-10 bg-background/80 backdrop-blur-sm border shadow-md hover:bg-background/90 ${className}`}
    >
      <ChevronRight className="h-4 w-4" />
      <span className="sr-only">العودة</span>
    </Button>
  );
};
