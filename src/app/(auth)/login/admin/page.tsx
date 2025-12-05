"use client";

import LoginForm from '@/app/components/auth/login-form';
import Logo from '@/components/logo';
import Link from 'next/link';

export default function AdminLoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 via-blue-50 to-indigo-100 p-4">
            <div className="w-full max-w-6xl flex items-center justify-center gap-8">
                {/* Left Side - Logo and Info */}
                <div className="hidden lg:flex flex-col items-center justify-center space-y-6 flex-1">
                    <div className="scale-150">
                        <Logo size="lg" />
                    </div>
                    <div className="text-center space-y-2">
                        <h1 className="text-4xl font-bold text-primary">Admin Portal</h1>
                        <p className="text-muted-foreground">
                            Manage all subscriptions and users across departments
                        </p>
                    </div>
                </div>

                {/* Right Side - Login Form */}
                <div className="flex-1 flex justify-center">
                    <LoginForm 
                        role="admin" 
                        title="Admin Login"
                    />
                </div>
            </div>
            
            <div className="absolute bottom-4 text-center w-full text-sm text-muted-foreground">
                Don't have an account? <Link href="/register" className="underline">Register</Link>
            </div>
        </div>
    );
}
