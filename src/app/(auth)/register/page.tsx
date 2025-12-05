"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAppStore } from '@/store/app-store';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Role } from '@/lib/types';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import { Separator } from '@/components/ui/separator';

const formSchema = z.object({
  name: z.string().min(1, 'Please enter your name.'),
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  role: z.enum(['poc', 'hod', 'finance', 'admin'], { required_error: 'Please select a role.' }),
  subrole: z.enum(['apa', 'am']).optional(),
  department: z.string().optional(),
}).refine((data) => {
  // If role is finance, subrole is required
  if (data.role === 'finance') {
    return data.subrole !== undefined;
  }
  return true;
}, {
  message: "Please select a finance role (AM or APA)",
  path: ["subrole"],
}).refine((data) => {
  // If role is not admin, department is required
  if (data.role !== 'admin') {
    return data.department !== undefined && data.department.length > 0;
  }
  return true;
}, {
  message: "Please enter your department",
  path: ["department"],
});

export default function RegisterPage() {
  const [isSuccess, setIsSuccess] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const { register, registerWithGoogle, registerWithMicrosoft, hasFetchedFromFirestore, isSyncing, users } = useAppStore((state) => ({
    register: state.register,
    registerWithGoogle: state.registerWithGoogle,
    registerWithMicrosoft: state.registerWithMicrosoft,
    hasFetchedFromFirestore: state.hasFetchedFromFirestore,
    isSyncing: state.isSyncing,
    users: state.users,
  }));
  const { toast } = useToast();
  const router = useRouter();
  const isStoreReady = hasFetchedFromFirestore && !isSyncing;

  // Check if an admin user already exists
  const adminExists = users.some(user => user.role === 'admin');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      department: '',
    },
  });

  const selectedRole = form.watch("role");

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!isStoreReady) {
      toast({
        variant: 'destructive',
        title: 'Sync in progress',
        description: 'Please wait until data sync completes.',
      });
      return;
    }

    // Prevent admin registration if admin already exists
    if (values.role === 'admin' && adminExists) {
      toast({
        variant: 'destructive',
        title: 'Admin Already Exists',
        description: 'Only one admin account is allowed. Please contact the system administrator.',
      });
      return;
    }

    try {
      const userData = {
        ...values,
        subrole: values.subrole || null, // Ensure subrole is null if not provided
        department: values.role === 'admin' ? 'Administration' : values.department || '', // Set department for admin
      };
      register(userData);
      setIsSuccess(true);
      toast({
        title: "Registration Successful! ✨",
        description: `Welcome, ${values.name}! Redirecting to login...`,
      });
      setTimeout(() => {
        router.push(`/login/${values.role}`);
      }, 2000);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.message || "An unexpected error occurred.",
      });
    }
  };

  const handleGoogleRegister = async () => {
    if (!isStoreReady) {
      toast({
        variant: 'destructive',
        title: 'Sync in progress',
        description: 'Please wait until data sync completes.',
      });
      return;
    }

    setIsPending(true);
    try {
      const user = await registerWithGoogle();
      if (user) {
        setIsSuccess(true);
        toast({
          title: "Google Registration Successful! ✨",
          description: `Welcome, ${user.name}! Redirecting to dashboard...`,
        });
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Google Registration Failed",
        description: error.message || "Could not register with Google.",
      });
    } finally {
      setIsPending(false);
    }
  };

  const handleMicrosoftRegister = async () => {
    // Validate that user has selected required fields
    const role = form.getValues('role');
    const department = form.getValues('department');
    const subrole = form.getValues('subrole');

    if (!role) {
      toast({
        variant: 'destructive',
        title: 'Role Required',
        description: 'Please select your role before signing up with Microsoft.',
      });
      return;
    }

    if (!department) {
      toast({
        variant: 'destructive',
        title: 'Department Required',
        description: 'Please enter your department before signing up with Microsoft.',
      });
      return;
    }

    if (role === 'finance' && !subrole) {
      toast({
        variant: 'destructive',
        title: 'Finance Role Required',
        description: 'Please select your finance role (AM or APA) before signing up with Microsoft.',
      });
      return;
    }

    if (!isStoreReady) {
      toast({
        variant: 'destructive',
        title: 'Sync in progress',
        description: 'Please wait until data sync completes.',
      });
      return;
    }

    setIsPending(true);
    try {
      const user = await registerWithMicrosoft(role, subrole, department);
      if (user) {
        setIsSuccess(true);
        toast({
          title: "Microsoft Registration Successful! ✨",
          description: `Welcome, ${user.name}! Redirecting to dashboard...`,
        });
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Microsoft Registration Failed",
        description: error.message || "Could not register with Microsoft.",
      });
    } finally {
      setIsPending(false);
    }
  };

  const cardVariants = {
    initial: { opacity: 0, y: 50, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: "easeOut" } },
  };

  return (
    <motion.div initial="initial" animate="animate" variants={cardVariants}>
      <Card className="w-full max-w-md min-w-[400px]">
         <div className="p-1 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20"></div>
        <CardHeader>
          <CardTitle>Create an Account</CardTitle>
          <CardDescription>
            Fill out the form below to create your AutoTrack Pro account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="john.doe@example.com" {...field} />
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
                <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Role</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="poc">POC (Department POC)</SelectItem>
                            <SelectItem value="hod">HOD (Head of Department)</SelectItem>
                            <SelectItem value="finance">Finance</SelectItem>
                            {!adminExists && <SelectItem value="admin">Admin</SelectItem>}
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />                {selectedRole !== 'admin' && (
                  <FormField
                      control={form.control}
                      name="department"
                      render={({ field }) => (
                      <FormItem>
                          <FormLabel>Department</FormLabel>
                          <FormControl>
                          <Input placeholder="e.g., Marketing" {...field} />
                          </FormControl>
                          <FormMessage />
                      </FormItem>
                      )}
                  />
                )}
                {selectedRole === 'admin' && (
                  <div className="flex items-center justify-center p-3 text-sm text-muted-foreground bg-muted/50 rounded-md">
                    Admin role has access to all departments
                  </div>
                )}
               
               <AnimatePresence>
                 {selectedRole === 'finance' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <FormField
                      control={form.control}
                      name="subrole"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Finance Role</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select your finance role" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="apa">APA (Accounts Payable Associate)</SelectItem>
                              <SelectItem value="am">AM (Account Manager)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </motion.div>
                )}
               </AnimatePresence>
              
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting || !isStoreReady || isSuccess}>
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : isSuccess ? (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Account Created!
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>
          </Form>
          
          <div className="relative my-4">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
              OR CONTINUE WITH
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={handleMicrosoftRegister}
              disabled={isPending || isSuccess || !isStoreReady}
            >
              {isPending ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <>
                  <span className="mr-2 text-lg">🪟</span>
                  Sign up with Microsoft
                </>
              )}
            </Button>
          </div>

          <div className="mt-6 text-center">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Already registered?
                </span>
              </div>
            </div>
            <Link href="/">
              <Button variant="outline" className="mt-4 w-full">
                Go to Login
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}