
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, Search, Star, Users, TrendingUp, Shield } from "lucide-react";
import { Header } from "@/components/Header";
import { AdminAccessButton } from "@/components/AdminAccessButton";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const stats = [
    { icon: Car, title: "إجمالي الإعلانات", value: "1,247", change: "+12%" },
    { icon: Users, title: "المستخدمين النشطين", value: "892", change: "+8%" },
    { icon: Star, title: "إعلانات مميزة", value: "156", change: "+15%" },
    { icon: TrendingUp, title: "معدل النمو", value: "24.8%", change: "+3.2%" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20 pb-16">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            اعثر على سيارتك المثالية
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            أكبر منصة لبيع وشراء السيارات في المنطقة. ابحث، قارن، واشتر بثقة
          </p>
          
          <form onSubmit={handleSearch} className="max-w-md mx-auto">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="ابحث عن سيارة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-right"
              />
              <Button type="submit">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </section>

        {/* Statistics Section */}
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">
            إحصائياتنا
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <Card key={index} className="text-center">
                <CardHeader className="pb-2">
                  <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <stat.icon className="h-6 w-6 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-2xl mb-1">{stat.value}</CardTitle>
                  <CardDescription className="text-sm mb-1">{stat.title}</CardDescription>
                  <p className="text-xs text-green-600">{stat.change}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-16">
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl font-bold mb-4">هل تريد بيع سيارتك؟</h2>
              <p className="text-xl mb-8 opacity-90">
                انشر إعلانك الآن واوصل لآلاف المشترين المهتمين
              </p>
              <Button 
                variant="secondary" 
                size="lg"
                onClick={() => navigate("/add-ad")}
              >
                <Car className="mr-2 h-5 w-5" />
                أضف إعلانك مجاناً
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>

      <AdminAccessButton />
    </div>
  );
};

export default Index;
