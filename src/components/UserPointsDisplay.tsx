
import { Crown, Coins } from "lucide-react";
import { useUserPoints } from "@/hooks/useUserPoints";
import { Badge } from "@/components/ui/badge";

interface UserPointsDisplayProps {
  variant?: 'full' | 'compact' | 'sidebar';
}

export function UserPointsDisplay({ variant = 'compact' }: UserPointsDisplayProps) {
  const { data: pointsData, isLoading } = useUserPoints();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 bg-muted animate-pulse rounded" />
        <div className="w-8 h-4 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  if (!pointsData) return null;

  const totalPoints = pointsData.total_points;
  const basePoints = pointsData.base_points;
  const premiumCredits = pointsData.premium_credits;
  const isPremium = pointsData.membership_type === 'premium';

  if (variant === 'full') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Crown className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">النقاط المتاحة</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Coins className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">النقاط الأساسية</span>
            </div>
            <p className="text-2xl font-bold">{basePoints}</p>
          </div>
          
          {isPremium && (
            <div className="p-4 bg-primary/10 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-4 h-4 text-primary" />
                <span className="text-sm text-primary">نقاط العضوية المميزة</span>
              </div>
              <p className="text-2xl font-bold text-primary">{premiumCredits}</p>
            </div>
          )}
        </div>
        
        <div className="p-4 bg-background border rounded-lg">
          <div className="flex items-center justify-between">
            <span className="font-medium">إجمالي النقاط</span>
            <span className="text-2xl font-bold text-primary">{totalPoints}</span>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'sidebar') {
    return (
      <div className="flex items-center gap-2">
        <Coins className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium">{totalPoints}</span>
        {isPremium && (
          <Badge variant="outline" className="text-xs">
            <Crown className="w-3 h-3 ml-1" />
            مميز
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Coins className="w-4 h-4 text-muted-foreground" />
      <span className="text-sm font-medium">{totalPoints} نقطة</span>
      {isPremium && <Crown className="w-4 h-4 text-primary" />}
    </div>
  );
}
