
import { useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { PasswordResetHeader } from "@/components/password-reset/PasswordResetHeader";
import { PasswordResetForm } from "@/components/password-reset/PasswordResetForm";
import { NewPasswordForm } from "@/components/password-reset/NewPasswordForm";

const PasswordReset = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const isResetMode = !!token;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <PasswordResetHeader isResetMode={isResetMode} />
        
        <CardContent>
          {isResetMode ? (
            <NewPasswordForm token={token} />
          ) : (
            <PasswordResetForm />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PasswordReset;
