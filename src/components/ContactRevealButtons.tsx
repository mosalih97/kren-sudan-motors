
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Phone, MessageSquare, Heart, Share2, Crown } from 'lucide-react';
import { useUserPoints } from '@/hooks/useUserPoints';
import { PointsConfirmDialog } from './PointsConfirmDialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
interface ContactRevealButtonsProps {
  adId: string;
  phone?: string;
  whatsapp?: string;
  sellerId: string;
  sellerName: string;
  adTitle: string;
}

export const ContactRevealButtons = ({
  adId,
  phone,
  whatsapp,
  sellerId,
  sellerName,
  adTitle
}: ContactRevealButtonsProps) => {
  const [revealedPhone, setRevealedPhone] = useState(false);
  const [revealedWhatsapp, setRevealedWhatsapp] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<'phone' | 'whatsapp' | null>(null);
  const { pointsData, deductPoints } = useUserPoints();
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isOwner = user?.id === sellerId;

  const handleRevealContact = async (type: 'phone' | 'whatsapp') => {
    if (!pointsData) return;

    // Premium users don't need to spend points
    if (pointsData.membershipType === 'premium') {
      if (type === 'phone') {
        setRevealedPhone(true);
      } else {
        setRevealedWhatsapp(true);
      }
      
      // Record interaction for premium users (no points deducted)
      await supabase.from('ad_interactions').insert({
        ad_id: adId,
        user_id: user?.id,
        interaction_type: type === 'phone' ? 'phone_view' : 'whatsapp_view',
        points_spent: 0
      });
      
      return;
    }

    // Check if user has enough points
    if (pointsData.totalPoints < 1) {
      toast({
        title: "نقاط غير كافية",
        description: "تحتاج إلى نقطة واحدة على الأقل لعرض معلومات التواصل",
        variant: "destructive"
      });
      return;
    }

    // Show confirmation dialog for free users
    setPendingAction(type);
    setShowDialog(true);
  };

  const confirmReveal = async () => {
    if (!pendingAction || !pointsData || !user) return;

    const success = await deductPoints(1);
    if (success) {
      if (pendingAction === 'phone') {
        setRevealedPhone(true);
      } else {
        setRevealedWhatsapp(true);
      }

      // Record interaction
      await supabase.from('ad_interactions').insert({
        ad_id: adId,
        user_id: user.id,
        interaction_type: pendingAction === 'phone' ? 'phone_view' : 'whatsapp_view',
        points_spent: 1
      });

      toast({
        title: "تم عرض معلومات التواصل",
        description: "تم خصم نقطة واحدة من رصيدك"
      });
    } else {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء عرض معلومات التواصل",
        variant: "destructive"
      });
    }

    setShowDialog(false);
    setPendingAction(null);
  };

  const formatPhoneNumber = (phoneNumber: string) => {
    // Remove country code and format for display
    if (phoneNumber.startsWith('+249')) {
      return '0' + phoneNumber.substring(4);
    }
    return phoneNumber;
  };

  const handleWhatsAppClick = (number: string) => {
    const cleanNumber = number.replace(/\D/g, '');
    const whatsappNumber = cleanNumber.startsWith('249') ? cleanNumber : `249${cleanNumber.substring(1)}`;
    window.open(`https://wa.me/${whatsappNumber}`, '_blank');
  };

  const handleCall = (number: string) => {
    window.open(`tel:${number}`, '_self');
  };

  const handleMessage = () => {
    // Navigate to messages page or open messaging modal
    console.log('Open messaging');
  };

  const handleFavorite = async () => {
    if (!user) return;
    
    try {
      // Check if already favorited
      const { data: existing } = await supabase
        .from('favorites')
        .select('id')
        .eq('ad_id', adId)
        .eq('user_id', user.id)
        .single();

      if (existing) {
        // Remove from favorites
        await supabase.from('favorites').delete().eq('ad_id', adId).eq('user_id', user.id);
        toast({
          title: "تم إزالة الإعلان من المفضلة",
        });
      } else {
        // Add to favorites
        await supabase.from('favorites').insert({
          ad_id: adId,
          user_id: user.id
        });
        toast({
          title: "تم إضافة الإعلان للمفضلة",
        });
      }
    } catch (error) {
      console.error('Error handling favorite:', error);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: adTitle,
        text: `تحقق من هذا الإعلان: ${adTitle}`,
        url: window.location.href
      });
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "تم نسخ الرابط",
        description: "تم نسخ رابط الإعلان إلى الحافظة"
      });
    }
  };

  return (
    <>
      <Card className="card-gradient border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">معلومات البائع</h3>
            {pointsData?.membershipType === 'premium' && (
              <Badge variant="premium" className="gap-1">
                <Crown className="h-3 w-3" />
                مميز
              </Badge>
            )}
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">الاسم:</span>
              <span className="font-medium">{sellerName}</span>
            </div>

            {/* Phone Number */}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">رقم الهاتف:</span>
              <div className="flex items-center gap-2">
                {revealedPhone && phone ? (
                  <>
                    <span className="font-medium text-primary">{formatPhoneNumber(phone)}</span>
                    <Button
                      size="sm"
                      onClick={() => handleCall(phone)}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Phone className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleRevealContact('phone')}
                    className="bg-primary hover:bg-primary/90 text-white gap-2"
                  >
                    <Phone className="h-4 w-4" />
                    {pointsData?.membershipType === 'premium' ? 'مجاني' : '1 نقطة'}
                  </Button>
                )}
              </div>
            </div>

            {/* WhatsApp */}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">واتساب:</span>
              <div className="flex items-center gap-2">
                {revealedWhatsapp && whatsapp ? (
                  <>
                    <span className="font-medium text-primary">{formatPhoneNumber(whatsapp)}</span>
                    <Button
                      size="sm"
                      onClick={() => handleWhatsAppClick(whatsapp)}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleRevealContact('whatsapp')}
                    className="bg-green-600 hover:bg-green-700 text-white gap-2"
                  >
                    <MessageSquare className="h-4 w-4" />
                    {pointsData?.membershipType === 'premium' ? 'مجاني' : '1 نقطة'}
                  </Button>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={handleMessage}
                className="flex-1 gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                رسالة
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleFavorite}
                className="flex-1 gap-2"
              >
                <Heart className="h-4 w-4" />
                حفظ
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="flex-1 gap-2"
              >
                <Share2 className="h-4 w-4" />
                مشاركة
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <PointsConfirmDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        onConfirm={confirmReveal}
        actionType={pendingAction || 'phone'}
        userPoints={pointsData?.totalPoints || 0}
      />
    </>
  );
};
