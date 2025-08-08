
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, Star, Zap, Shield, Phone, CheckCircle } from 'lucide-react';

const UploadReceipt = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // SEO: title, meta description, and canonical
  useEffect(() => {
    document.title = 'العضوية المميزة - 30 إعلان + 130 نقطة';
    const description = 'اشترك في العضوية المميزة: 30 إعلاناً إضافياً + 130 نقطة إضافية لعرض وسائل التواصل ومزايا حصرية.';

    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', description);

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', window.location.href);
  }, []);
  const handleWhatsAppSubscription = () => {
    const phoneNumber = "+249966960202";
    const message = "مرحباً، أريد الاشتراك في العضوية المميزة لتطبيق الكرين";
    const whatsappUrl = `https://wa.me/${phoneNumber.replace('+', '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">
              يرجى تسجيل الدخول للوصول إلى هذه الصفحة
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const premiumFeatures = [
    {
      icon: <Crown className="h-6 w-6" />,
      title: "تمييز إعلاناتك",
      description: "إعلاناتك تظهر في المقدمة دائماً مع علامة مميزة"
    },
    {
      icon: <Star className="h-6 w-6" />,
      title: "30 إعلان إضافي + 130 نقطة إضافية",
      description: "احصل على 30 إعلاناً إضافياً للنشر و130 نقطة لعرض وسائل التواصل"
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "وصول أسرع للمشترين",
      description: "إعلاناتك تصل للمشترين المهتمين بشكل أسرع"
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "دعم فني مخصص",
      description: "دعم فني متخصص ومعالجة سريعة للمشاكل"
    },
    {
      icon: <CheckCircle className="h-6 w-6" />,
      title: "شارة التحقق",
      description: "شارة تحقق مميزة تزيد من ثقة المشترين"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Crown className="h-16 w-16 text-orange-600" />
          </div>
          <h1 className="text-4xl font-bold text-orange-800 mb-2">
            العضوية المميزة
          </h1>
          <p className="text-gray-600 text-lg">
            انضم لعضوية الكرين المميزة واستمتع بمزايا حصرية
          </p>
        </div>

        {/* Price Card */}
        <Card className="mb-8 shadow-xl border-2 border-orange-200">
          <CardHeader className="text-center bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-t-lg">
            <CardTitle className="text-3xl font-bold mb-2">
              25,000 جنيه سوداني
            </CardTitle>
            <CardDescription className="text-orange-100 text-lg">
              اشتراك شهري - مزايا حصرية
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <Badge className="px-4 py-2 text-lg bg-green-100 text-green-800 border-green-200">
                وفر 40% من التكلفة العادية
              </Badge>
            </div>
            
            {/* Premium Features Grid */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {premiumFeatures.map((feature, index) => (
                <div key={index} className="flex items-start space-x-4 space-x-reverse">
                  <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <div className="text-orange-600">
                      {feature.icon}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* WhatsApp Subscription Button */}
            <div className="text-center">
              <Button
                onClick={handleWhatsAppSubscription}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                size="lg"
              >
                <div className="flex items-center space-x-3 space-x-reverse">
                  <Phone className="h-6 w-6" />
                  <span>قم بالاشتراك الآن</span>
                </div>
              </Button>
              <p className="text-sm text-gray-500 mt-3">
                سيتم تحويلك إلى الواتساب لإتمام عملية الاشتراك
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Additional Benefits */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center text-orange-800">
              لماذا تختار العضوية المميزة؟
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div className="p-6 bg-orange-50 rounded-lg">
                <Star className="h-12 w-12 text-orange-600 mx-auto mb-4" />
                <h3 className="font-bold text-lg mb-2">تميز حقيقي</h3>
                <p className="text-gray-600">
                  إعلاناتك تظهر في المقدمة دائماً مع تمييز بصري واضح
                </p>
              </div>
              <div className="p-6 bg-green-50 rounded-lg">
                <Zap className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="font-bold text-lg mb-2">مبيعات أكثر</h3>
                <p className="text-gray-600">
                  زيادة فرص البيع بنسبة تصل إلى 300% مقارنة بالإعلانات العادية
                </p>
              </div>
              <div className="p-6 bg-blue-50 rounded-lg">
                <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="font-bold text-lg mb-2">أمان وثقة</h3>
                <p className="text-gray-600">
                  شارة التحقق تزيد من ثقة المشترين وتحسن سمعتك
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Info */}
        <div className="text-center mt-8 p-6 bg-white rounded-lg shadow-md">
          <h3 className="font-bold text-lg mb-2">هل لديك أسئلة؟</h3>
          <p className="text-gray-600 mb-4">
            تواصل معنا عبر الواتساب للحصول على المزيد من المعلومات
          </p>
          <div className="flex justify-center items-center space-x-2 space-x-reverse text-green-600">
            <Phone className="h-5 w-5" />
            <span className="font-mono">+249966960202</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadReceipt;
