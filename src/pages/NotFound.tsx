
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Home, ArrowRight } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <div className="container mx-auto px-4">
        <Card className="max-w-md mx-auto card-gradient border-0 shadow-lg">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-16 w-16 mx-auto text-warning mb-4" />
            <h1 className="text-4xl font-bold text-foreground mb-2">404</h1>
            <h2 className="text-xl font-semibold text-foreground mb-4">
              الصفحة غير موجودة
            </h2>
            <p className="text-muted-foreground mb-6">
              عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها إلى موقع آخر
            </p>
            
            <div className="flex flex-col gap-3">
              <Link to="/">
                <Button className="w-full">
                  <Home className="h-4 w-4 ml-2" />
                  العودة للصفحة الرئيسية
                </Button>
              </Link>
              
              <Link to="/cars">
                <Button variant="outline" className="w-full">
                  <ArrowRight className="h-4 w-4 ml-2" />
                  تصفح السيارات
                </Button>
              </Link>
            </div>
            
            <div className="mt-6 text-sm text-muted-foreground">
              <p>المسار المطلوب: <code className="bg-muted px-2 py-1 rounded">{location.pathname}</code></p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NotFound;
