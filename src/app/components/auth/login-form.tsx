"use client";

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { ArrowRight, Loader2, LogIn } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';

import { Role, SubRole } from '@/lib/types';
import { useAppStore } from '@/store/app-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { mockUsers } from '@/lib/data';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';


interface LoginFormProps {
  role: Role;
  title: string;
  subRoleOptions?: SubRole[];
}

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
  subrole: z.string().optional(),
});

export default function LoginForm({ role, title, subRoleOptions }: LoginFormProps) {
  const [isPending, startTransition] = useTransition();
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();
  const { login, loginWithGoogle, loginWithMicrosoft, hasFetchedFromFirestore, isSyncing } = useAppStore((state) => ({
    login: state.login,
    loginWithGoogle: state.loginWithGoogle,
    loginWithMicrosoft: state.loginWithMicrosoft,
    hasFetchedFromFirestore: state.hasFetchedFromFirestore,
    isSyncing: state.isSyncing,
  }));
  const { toast } = useToast();
  const isStoreReady = hasFetchedFromFirestore && !isSyncing;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: mockUsers.find(u => u.role === role)?.email || '',
      password: 'password',
      subrole: subRoleOptions ? (subRoleOptions[0] as string) : undefined,
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!isStoreReady) {
      toast({
        variant: 'destructive',
        title: 'Sync in progress',
        description: 'Please wait until data sync completes.',
      });
      return;
    }

    startTransition(() => {
      try {
        const user = login(values.email, values.password, role, values.subrole as SubRole);
        if (user) {
            setIsSuccess(true);
            toast({
            title: "Login Successful",
            description: `Welcome back, ${user.name}!`,
            });
            setTimeout(() => router.push(`/dashboard`), 1200);
        }
      } catch (error: any) {
         const errorMessage = error.message || "Invalid credentials or wrong portal.";
         const isUserNotFound = errorMessage.includes("Invalid credentials");
         
         toast({
          variant: "destructive",
          title: "Login Failed",
          description: isUserNotFound 
            ? "Account not found. Please register first." 
            : errorMessage,
        });
      }
    });
  };
  
  const handleGoogleLogin = () => {
    if (!isStoreReady) {
      toast({
        variant: 'destructive',
        title: 'Sync in progress',
        description: 'Please wait until data sync completes.',
      });
      return;
    }

    startTransition(async () => {
       try {
        const user = await loginWithGoogle(role, form.getValues('subrole') as SubRole);
        if (user) {
            setIsSuccess(true);
            toast({
                title: "Google Login Successful",
                description: `Welcome back, ${user.name}!`,
            });
            setTimeout(() => router.push(`/dashboard`), 1200);
        }
       } catch (error: any) {
         toast({
            variant: "destructive",
            title: "Google Login Failed",
            description: error.message || "Could not sign in with Google.",
        });
       }
    })
  }

  const handleMicrosoftLogin = () => {
    if (!isStoreReady) {
      toast({
        variant: 'destructive',
        title: 'Sync in progress',
        description: 'Please wait until data sync completes.',
      });
      return;
    }

    startTransition(async () => {
      try {
        const user = await loginWithMicrosoft(role, form.getValues('subrole') as SubRole);
        if (user) {
          setIsSuccess(true);
          toast({
            title: "Microsoft Login Successful",
            description: `Welcome back, ${user.name}!`,
          });
          setTimeout(() => router.push(`/dashboard`), 1200);
        }
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Microsoft Login Failed",
          description: error.message || "Could not sign in with Microsoft.",
        });
      }
    });
  };

  const cardVariants = {
    initial: { opacity: 0, y: 50, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: "easeOut" } },
    exit: { opacity: 0, scale: 1.1, transition: { duration: 0.3, ease: "easeIn" } },
  };

  return (
    <motion.div initial="initial" animate="animate" variants={cardVariants}>
      <Card className="w-full max-w-sm min-w-[380px] overflow-hidden">
        <div className="p-1 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20"></div>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription>Enter your credentials to access the portal</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="name@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {subRoleOptions && (
                <FormField
                  control={form.control}
                  name="subrole"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sub-Role</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your sub-role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {subRoleOptions.map((subRole) => (
                            <SelectItem key={subRole} value={subRole!}>
                              {subRole?.toUpperCase()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <Button type="submit" className="w-full group" disabled={isPending || isSuccess || !isStoreReady}>
                {isPending && form.formState.isSubmitting ? (
                  <Loader2 className="animate-spin" />
                ) : isSuccess ? (
                  "Redirecting..."
                ) : (
                  <>
                    Login <LogIn className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </Button>
            </form>
          </Form>
           <div className="relative my-4">
              <Separator />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">OR</span>
           </div>
            <div className="flex flex-col gap-2">
            <Button variant="outline" className="w-full group" onClick={handleGoogleLogin} disabled={isPending || isSuccess || !isStoreReady}>
                {isPending && !form.formState.isSubmitting ? (
                    <Loader2 className="animate-spin" />
                ) : (
                    <>
                     <FcGoogle className="mr-2 h-5 w-5"/> Sign in with Google
                    </>
                )}
            </Button>
            <Button variant="outline" className="w-full group" onClick={handleMicrosoftLogin} disabled={isPending || isSuccess || !isStoreReady}>
                {isPending && !form.formState.isSubmitting ? (
                    <Loader2 className="animate-spin" />
                ) : (
                    <>
                     <span className="mr-2 text-lg">🪟</span> Sign in with Microsoft
                    </>
                )}
            </Button>
            </div>
            <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="underline text-primary font-medium hover:text-primary/80">
              Create Account
            </Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}