
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasShownWelcome, setHasShownWelcome] = useState(false);

  useEffect(() => {
    let isInitialLoad = true;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Log security events
        if (event === 'SIGNED_IN' && session?.user) {
          try {
            await supabase.rpc('log_security_event', {
              event_type: 'user_login',
              event_data: {
                user_id: session.user.id,
                timestamp: new Date().toISOString()
              }
            });
          } catch (error) {
            console.error('Failed to log security event:', error);
          }
        } else if (event === 'SIGNED_OUT') {
          try {
            await supabase.rpc('log_security_event', {
              event_type: 'user_logout',
              event_data: {
                timestamp: new Date().toISOString()
              }
            });
          } catch (error) {
            console.error('Failed to log security event:', error);
          }
        }
        
        // Handle auth events - only show toast for actual sign in/out actions, not initial load
        if (event === 'SIGNED_IN' && !isInitialLoad && !hasShownWelcome) {
          toast({
            title: "تم تسجيل الدخول بنجاح",
            description: "مرحباً بك في منصة الكرين",
          });
          setHasShownWelcome(true);
        } else if (event === 'SIGNED_OUT') {
          toast({
            title: "تم تسجيل الخروج",
            description: "نراك قريباً",
          });
          setHasShownWelcome(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      isInitialLoad = false;
    });

    return () => subscription.unsubscribe();
  }, [hasShownWelcome]);

  const signUp = async (email: string, password: string, displayName?: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: displayName ? { display_name: displayName } : undefined
        }
      });

      if (error) {
        // Log failed signup attempt
        try {
          await supabase.rpc('log_security_event', {
            event_type: 'signup_failed',
            event_data: {
              email,
              error: error.message,
              timestamp: new Date().toISOString()
            }
          });
        } catch (logError) {
          console.error('Failed to log security event:', logError);
        }

        let errorMessage = "حدث خطأ أثناء التسجيل";
        if (error.message.includes('already registered')) {
          errorMessage = "هذا البريد الإلكتروني مسجل مسبقاً";
        } else if (error.message.includes('Invalid email')) {
          errorMessage = "البريد الإلكتروني غير صحيح";
        } else if (error.message.includes('Password')) {
          errorMessage = "كلمة المرور ضعيفة جداً";
        }
        
        toast({
          variant: "destructive",
          title: "خطأ في التسجيل",
          description: errorMessage,
        });
      } else {
        // Log successful signup
        try {
          await supabase.rpc('log_security_event', {
            event_type: 'signup_successful',
            event_data: {
              email,
              timestamp: new Date().toISOString()
            }
          });
        } catch (logError) {
          console.error('Failed to log security event:', logError);
        }

        toast({
          title: "تم إنشاء الحساب بنجاح",
          description: "يمكنك الآن تسجيل الدخول",
        });
      }

      return { error };
    } catch (err) {
      console.error('Sign up error:', err);
      return { error: err };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Log failed login attempt
        try {
          await supabase.rpc('log_security_event', {
            event_type: 'login_failed',
            event_data: {
              email,
              error: error.message,
              timestamp: new Date().toISOString()
            }
          });
        } catch (logError) {
          console.error('Failed to log security event:', logError);
        }

        let errorMessage = "خطأ في البريد الإلكتروني أو كلمة المرور";
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = "البريد الإلكتروني أو كلمة المرور غير صحيحة";
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = "يرجى تأكيد البريد الإلكتروني أولاً";
        }
        
        toast({
          variant: "destructive",
          title: "خطأ في تسجيل الدخول",
          description: errorMessage,
        });
      }

      return { error };
    } catch (err) {
      console.error('Sign in error:', err);
      return { error: err };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast({
          variant: "destructive",
          title: "خطأ في تسجيل الخروج",
          description: "حاول مرة أخرى",
        });
      }
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
