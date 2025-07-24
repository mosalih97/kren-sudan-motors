
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
import { Phone, MessageSquare, Coins } from "lucide-react";

interface PointsConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  actionType: 'phone' | 'whatsapp';
  userPoints: number;
}

export const PointsConfirmDialog = ({
  open,
  onOpenChange,
  onConfirm,
  actionType,
  userPoints
}: PointsConfirmDialogProps) => {
  const getIcon = () => {
    return actionType === 'phone' ? <Phone className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />;
  };

  const getTitle = () => {
    return actionType === 'phone' ? 'عرض رقم الهاتف' : 'عرض رقم الواتساب';
  };

  const getDescription = () => {
    return actionType === 'phone' 
      ? 'سيتم خصم نقطة واحدة من رصيدك لعرض رقم الهاتف'
      : 'سيتم خصم نقطة واحدة من رصيدك لعرض رقم الواتساب';
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="card-gradient border-0 shadow-xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-xl">
            {getIcon()}
            {getTitle()}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base">
            {getDescription()}
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="py-4">
          <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg">
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-primary" />
              <span className="font-medium">رصيدك الحالي:</span>
            </div>
            <span className="text-lg font-bold text-primary">{userPoints} نقطة</span>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg mt-2">
            <span className="font-medium text-red-800">التكلفة:</span>
            <span className="text-lg font-bold text-red-600">1 نقطة</span>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg mt-2">
            <span className="font-medium text-green-800">الرصيد بعد الخصم:</span>
            <span className="text-lg font-bold text-green-600">{userPoints - 1} نقطة</span>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>إلغاء</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-primary hover:bg-primary/90">
            تأكيد العملية
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
