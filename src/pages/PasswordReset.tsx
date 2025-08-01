import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2 } from 'lucide-react';

const passwordResetSchema = z.object({
  password: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
  confirmPassword: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"], // path of error
})

const PasswordReset = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const token = searchParams.get('token');

  const form = useForm<z.infer<typeof passwordResetSchema>>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  })

  useEffect(() => {
    if (!token) {
      toast({
        variant: "destructive",
        title: "Invalid Request",
        description: "Missing token",
      })
      navigate('/auth');
    } else {
      verifyToken(token);
    }
  }, [token, navigate]);

  const verifyToken = async (token: string) => {
    try {
      const { data, error } = await supabase.rpc('verify_password_reset_token', { reset_token: token });

      if (error) {
        toast({
          variant: "destructive",
          title: "خطأ في التحقق",
          description: "رمز إعادة تعيين كلمة المرور غير صالح أو منتهي الصلاحية",
        });
        navigate('/auth');
        return;
      }

      // Type-safe handling of the RPC response
      const result = data as { valid: boolean } | boolean;
      const isValid = typeof result === 'boolean' ? result : result?.valid;

      if (!isValid) {
        toast({
          variant: "destructive",
          title: "رمز غير صالح",
          description: "رمز إعادة تعيين كلمة المرور غير صالح",
        });
        navigate('/auth');
      }
    } catch (error) {
      console.error("Token verification error:", error);
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "حدث خطأ أثناء التحقق من الرمز",
      });
      navigate('/auth');
    }
  };

  const onSubmit = async (values: z.infer<typeof passwordResetSchema>) => {
    if (!token) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "رمز إعادة تعيين كلمة المرور مفقود",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.rpc('reset_password_with_token', {
        reset_token: token,
        new_password: values.password,
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "خطأ",
          description: "فشل إعادة تعيين كلمة المرور",
        });
      } else {
        toast({
          title: "تم إعادة تعيين كلمة المرور بنجاح",
          description: "يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة",
        });
        navigate('/auth');
      }
    } catch (error) {
      console.error("Password reset error:", error);
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "حدث خطأ أثناء إعادة تعيين كلمة المرور",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid h-screen place-items-center bg-gray-100">
      <Card className="w-[550px]">
        <CardHeader>
          <CardTitle>إعادة تعيين كلمة المرور</CardTitle>
          <CardDescription>أدخل كلمة المرور الجديدة</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>كلمة المرور الجديدة</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="أدخل كلمة المرور الجديدة" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تأكيد كلمة المرور</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="تأكيد كلمة المرور" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    جاري التحميل <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  </>
                ) : (
                  "إعادة تعيين كلمة المرور"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PasswordReset;
