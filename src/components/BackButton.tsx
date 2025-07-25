
import { Button } from '@/components/ui/button';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BackButtonProps {
  to?: string;
  className?: string;
  variant?: 'default' | 'floating' | 'minimal';
  showText?: boolean;
  text?: string;
}

export const BackButton = ({ 
  to, 
  className = "", 
  variant = 'floating',
  showText = true,
  text = "العودة"
}: BackButtonProps) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'default':
        return "bg-background/95 hover:bg-background border border-border/50 hover:border-border shadow-sm hover:shadow-md";
      case 'floating':
        return "bg-background/80 backdrop-blur-sm border border-border/30 shadow-lg hover:shadow-xl hover:bg-background/90";
      case 'minimal':
        return "bg-transparent hover:bg-muted/50 border-0 shadow-none";
      default:
        return "bg-background/80 backdrop-blur-sm border border-border/30 shadow-lg hover:shadow-xl hover:bg-background/90";
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleBack}
      className={`fixed top-20 right-4 z-50 transition-all duration-300 hover:-translate-y-0.5 hover:scale-105 ${getVariantStyles()} ${className}`}
    >
      <div className="flex items-center gap-2">
        <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
        {showText && <span className="text-sm font-medium">{text}</span>}
      </div>
    </Button>
  );
};
