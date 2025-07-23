
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Crown } from "lucide-react";

interface PointsConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  actionType: 'phone' | 'whatsapp';
  userPoints: number;
}

export function PointsConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  actionType,
  userPoints
}: PointsConfirmDialogProps) {
  const actionText = actionType === 'phone' ? 'عرض رقم الهاتف' : 'عرض رقم واتساب';
  
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-sm mx-auto">
        <AlertDialogHeader className="text-center">
          <div className="flex justify-center mb-2">
            <Crown className="h-8 w-8 text-primary" />
          </div>
          <AlertDialogTitle className="text-lg">تأكيد استخدام النقاط</AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            سيتم خصم <span className="font-bold text-primary">1 نقطة</span> من رصيدك لـ{actionText}
            <br />
            <span className="text-sm text-muted-foreground">
              رصيدك الحالي: {userPoints} نقطة
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex gap-2">
          <AlertDialogCancel className="flex-1">إلغاء</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className="flex-1 bg-primary hover:bg-primary/90"
            disabled={userPoints < 1}
          >
            موافق
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
