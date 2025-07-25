
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

interface PasswordResetHeaderProps {
  isResetMode: boolean;
}

export const PasswordResetHeader = ({ isResetMode }: PasswordResetHeaderProps) => {
  const navigate = useNavigate();

  return (
    <CardHeader className="space-y-1">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/auth')}
          className="gap-2 group transition-all duration-200 hover:scale-105"
        >
          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          العودة
        </Button>
      </div>
      
      <CardTitle className="text-2xl font-bold text-center">
        {isResetMode ? "تحديث كلمة المرور" : "استعادة كلمة المرور"}
      </CardTitle>
      
      <CardDescription className="text-center">
        {isResetMode 
          ? "أدخل كلمة المرور الجديدة"
          : "أدخل بريدك الإلكتروني لاستعادة كلمة المرور"
        }
      </CardDescription>
    </CardHeader>
  );
};
