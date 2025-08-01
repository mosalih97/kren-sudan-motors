
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Header } from "@/components/Header";
import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Home, Search, Car } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <BackButton />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="card-gradient border-0 shadow-lg max-w-md w-full">
            <CardContent className="p-8 text-center">
              <div className="text-6xl font-bold text-primary mb-4">404</div>
              <h1 className="text-2xl font-bold mb-4 text-foreground">
                الصفحة غير موجودة
              </h1>
              <p className="text-muted-foreground mb-6">
                عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/">
                  <Button className="gap-2 w-full sm:w-auto">
                    <Home className="h-4 w-4" />
                    الرئيسية
                  </Button>
                </Link>
                <Link to="/cars">
                  <Button variant="outline" className="gap-2 w-full sm:w-auto">
                    <Car className="h-4 w-4" />
                    تصفح السيارات
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
