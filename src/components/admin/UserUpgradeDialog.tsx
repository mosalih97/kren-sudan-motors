
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Crown, User } from 'lucide-react';

interface UserProfile {
  user_id: string;
  display_name: string;
  phone: string;
  city: string;
  membership_type: string;
  is_premium: boolean;
  points: number;
  credits: number;
  created_at: string;
  premium_expires_at: string;
  days_remaining: number;
  ads_count: number;
  user_id_display: string;
}

interface UserUpgradeDialogProps {
  user: UserProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: (userId: string, targetMembership: string, notes: string) => Promise<boolean>;
  loading?: boolean;
}

const UserUpgradeDialog: React.FC<UserUpgradeDialogProps> = ({
  user,
  isOpen,
  onClose,
  onUpgrade,
  loading = false
}) => {
  const [notes, setNotes] = useState('');
  const [upgrading, setUpgrading] = useState(false);

  if (!user) return null;

  const handleUpgrade = async (targetMembership: string) => {
    setUpgrading(true);
    try {
      const success = await onUpgrade(user.user_id, targetMembership, notes);
      if (success) {
        setNotes('');
        onClose();
      }
    } catch (error) {
      console.error('Upgrade error:', error);
    } finally {
      setUpgrading(false);
    }
  };

  const getMembershipText = (membership: string) => {
    switch (membership) {
      case 'premium': return 'مميز';
      case 'admin': return 'إداري';
      default: return 'مجاني';
    }
  };

  const getMembershipBadgeColor = (membership: string) => {
    switch (membership) {
      case 'premium': return 'bg-yellow-500';
      case 'admin': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            ترقية المستخدم
          </DialogTitle>
          <DialogDescription>
            إدارة عضوية المستخدم وترقيته - سيتم تفعيل الترقية لمدة 30 يوم تلقائياً
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* User Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <User className="h-5 w-5" />
              <div>
                <h3 className="font-semibold">{user.display_name || 'غير محدد'}</h3>
                <p className="text-sm text-gray-600">{user.phone || 'لا يوجد هاتف'}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">المدينة:</span> {user.city || 'غير محدد'}
              </div>
              <div>
                <span className="text-gray-600">النقاط:</span> {user.points}
              </div>
              <div>
                <span className="text-gray-600">الأرصدة:</span> {user.credits}
              </div>
              <div>
                <span className="text-gray-600">الإعلانات:</span> {user.ads_count}
              </div>
            </div>
          </div>

          {/* Current Membership */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">العضوية الحالية:</span>
            <Badge className={getMembershipBadgeColor(user.membership_type)}>
              {getMembershipText(user.membership_type)}
            </Badge>
          </div>

          {/* Premium Expiry Info */}
          {user.is_premium && (
            <div className="flex items-center gap-2 text-sm">
              <CalendarDays className="h-4 w-4" />
              <span>
                {user.days_remaining > 0 ? 
                  `متبقي ${user.days_remaining} يوم` : 
                  'انتهت الصلاحية'}
              </span>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="text-sm font-medium mb-2 block">ملاحظات الترقية</label>
            <Textarea
              placeholder="أضف ملاحظات حول هذه الترقية (اختياري)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button 
              onClick={() => handleUpgrade('premium')}
              className="flex-1"
              disabled={user.membership_type === 'premium' || loading || upgrading}
            >
              <Crown className="h-4 w-4 mr-2" />
              {upgrading ? 'جاري الترقية...' : 'ترقية إلى مميز (30 يوم)'}
            </Button>
            
            <Button 
              onClick={() => handleUpgrade('free')}
              variant="outline"
              className="flex-1"
              disabled={user.membership_type === 'free' || loading || upgrading}
            >
              <User className="h-4 w-4 mr-2" />
              {upgrading ? 'جاري التحويل...' : 'تحويل إلى مجاني'}
            </Button>
          </div>

          {/* Info Text */}
          <div className="text-xs text-gray-600 bg-blue-50 p-3 rounded">
            <p>• الترقية إلى العضوية المميزة ستضيف 100 رصيد إضافي</p>
            <p>• مدة العضوية المميزة: 30 يوم من تاريخ الترقية</p>
            <p>• سيتم تسجيل جميع الترقيات في سجل النظام</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserUpgradeDialog;
