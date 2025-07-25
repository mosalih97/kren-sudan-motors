
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface NavigationArrowsProps {
  prevPage?: {
    url: string;
    title: string;
  };
  nextPage?: {
    url: string;
    title: string;
  };
  showScrollTop?: boolean;
  className?: string;
}

export const NavigationArrows = ({ 
  prevPage, 
  nextPage, 
  showScrollTop = true, 
  className = "" 
}: NavigationArrowsProps) => {
  const navigate = useNavigate();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 ${className}`}>
      <div className="flex items-center gap-3">
        {/* Previous Page */}
        {prevPage && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate(prevPage.url)}
            className="group bg-background/80 backdrop-blur-sm border border-border/30 shadow-lg hover:shadow-xl hover:bg-background/90 transition-all duration-300 hover:-translate-y-1"
          >
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            <span className="text-sm font-medium">{prevPage.title}</span>
          </Button>
        )}

        {/* Scroll to Top */}
        {showScrollTop && (
          <Button
            variant="outline"
            size="sm"
            onClick={scrollToTop}
            className="group bg-background/80 backdrop-blur-sm border border-border/30 shadow-lg hover:shadow-xl hover:bg-background/90 transition-all duration-300 hover:-translate-y-1"
          >
            <ChevronUp className="h-4 w-4 transition-transform duration-200 group-hover:-translate-y-1" />
            <span className="sr-only">العودة إلى الأعلى</span>
          </Button>
        )}

        {/* Next Page */}
        {nextPage && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate(nextPage.url)}
            className="group bg-background/80 backdrop-blur-sm border border-border/30 shadow-lg hover:shadow-xl hover:bg-background/90 transition-all duration-300 hover:-translate-y-1"
          >
            <span className="text-sm font-medium">{nextPage.title}</span>
            <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
          </Button>
        )}
      </div>
    </div>
  );
};
