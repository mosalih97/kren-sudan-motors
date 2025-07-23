
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SearchFilters } from '@/components/SearchFilters';
import { Car, Users, Star, TrendingUp, Shield, Clock } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              الآن في السودان - منصة السيارات الأكثر تطوراً
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              أكبر سوق إلكتروني للسيارات في السودان. 
              آلاف السيارات، أسعار تنافسية، وتجربة فريدة نثراء
              استثنائية
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3">
                <Link to="/cars">تصفح السيارات</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="px-8 py-3">
                <Link to="/ads/new">أضف إعلانك</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
              ابحث عن سيارتك المثالية
            </h2>
            <SearchFilters />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              لماذا الكرين؟
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Car className="h-8 w-8 text-blue-600" />
                  </div>
                  <CardTitle>آلاف السيارات</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    اكتشف أكبر مجموعة من السيارات الجديدة والمستعملة في السودان
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="h-8 w-8 text-green-600" />
                  </div>
                  <CardTitle>أمان وثقة</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    نظام تحقق متقدم للبائعين وحماية شاملة للمشترين
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="h-8 w-8 text-purple-600" />
                  </div>
                  <CardTitle>أسعار تنافسية</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    احصل على أفضل العروض والأسعار في السوق السوداني
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-orange-600" />
                  </div>
                  <CardTitle>مجتمع موثوق</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    انضم إلى آلاف المستخدمين الذين يثقون بمنصتنا
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="h-8 w-8 text-red-600" />
                  </div>
                  <CardTitle>سرعة في الاستجابة</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    تواصل فوري مع البائعين والحصول على إجابات سريعة
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Star className="h-8 w-8 text-yellow-600" />
                  </div>
                  <CardTitle>تجربة مميزة</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    واجهة سهلة الاستخدام وتجربة تسوق استثنائية
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold mb-2">10,000+</div>
                <div className="text-blue-100">سيارة متاحة</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">5,000+</div>
                <div className="text-blue-100">مستخدم راضٍ</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">50+</div>
                <div className="text-blue-100">مدينة مغطاة</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              هل أنت مستعد لبيع سيارتك؟
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              أضف إعلانك الآن واوصل إلى آلاف المشترين المحتملين
            </p>
            <Button asChild size="lg" className="bg-green-600 hover:bg-green-700 text-white px-8 py-3">
              <Link to="/ads/new">أضف إعلانك مجاناً</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
