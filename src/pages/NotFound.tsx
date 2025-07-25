
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Header } from "@/components/Header";
import { BackButton } from "@/components/BackButton";
import { NavigationArrows } from "@/components/NavigationArrows";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Home, Search } from "lucide-react";
import { Link } from "react-router-dom";

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
      <BackButton variant="floating" />
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <Card className="card-gradient border-0 shadow-lg">
            <CardContent className="p-12 text-center">
              <AlertCircle className="h-20 w-20 mx-auto text-destructive mb-6" />
              <h1 className="text-6xl font-bold text-destructive mb-4">404</h1>
              <h2 className="text-2xl font-bold mb-4">الصفحة غير موجودة</h2>
              <p className="text-muted-foreground mb-8">
                عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها
              </p>
              
              <div className="flex flex-col gap-4">
                <Link to="/">
                  <Button className="w-full gap-2">
                    <Home className="h-4 w-4" />
                    العودة للرئيسية
                  </Button>
                </Link>
                
                <Link to="/cars">
                  <Button variant="outline" className="w-full gap-2">
                    <Search className="h-4 w-4" />
                    تصفح السيارات
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <NavigationArrows
        prevPage={{
          url: "/",
          title: "الرئيسية"
        }}
        nextPage={{
          url: "/cars",
          title: "السيارات"
        }}
      />
    </div>
  );
};

export default NotFound;
