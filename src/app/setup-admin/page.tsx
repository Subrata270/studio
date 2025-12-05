'use client';

import { useState } from 'react';
import { useAppStore } from '@/store/app-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Shield, UserPlus } from 'lucide-react';

export default function AdminSetupPage() {
    const [isAdding, setIsAdding] = useState(false);
    const { register, users } = useAppStore();
    const { toast } = useToast();

    const adminUser = {
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'admin123',
        role: 'admin' as const,
        subrole: null,
        department: 'Administration',
    };

    const checkAdminExists = () => {
        return users.some(user => user.email === adminUser.email);
    };

    const handleAddAdmin = () => {
        setIsAdding(true);
        try {
            if (checkAdminExists()) {
                toast({
                    title: 'Admin Already Exists',
                    description: 'The admin user is already registered in the system.',
                    variant: 'default',
                });
            } else {
                register(adminUser);
                toast({
                    title: 'Admin User Created! ✅',
                    description: `Email: ${adminUser.email}\nPassword: ${adminUser.password}`,
                });
            }
        } catch (error: any) {
            toast({
                title: 'Error Creating Admin',
                description: error.message || 'Failed to create admin user',
                variant: 'destructive',
            });
        } finally {
            setIsAdding(false);
        }
    };

    const adminExists = checkAdminExists();

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-4 rounded-xl">
                            <Shield className="h-12 w-12 text-white" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl">Admin User Setup</CardTitle>
                    <CardDescription>
                        Create the default admin user for system management
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="bg-muted p-4 rounded-lg space-y-2">
                        <h3 className="font-semibold flex items-center gap-2">
                            <UserPlus className="h-4 w-4" />
                            Admin Credentials
                        </h3>
                        <div className="text-sm space-y-1">
                            <p><strong>Email:</strong> {adminUser.email}</p>
                            <p><strong>Password:</strong> {adminUser.password}</p>
                            <p><strong>Role:</strong> Admin</p>
                            <p><strong>Department:</strong> {adminUser.department}</p>
                        </div>
                    </div>

                    {adminExists && (
                        <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-lg">
                            <p className="font-semibold">✅ Admin user already exists</p>
                            <p className="text-sm mt-1">You can log in using the credentials above</p>
                        </div>
                    )}

                    <Button
                        onClick={handleAddAdmin}
                        disabled={isAdding || adminExists}
                        className="w-full"
                        size="lg"
                    >
                        {isAdding ? 'Creating Admin...' : adminExists ? 'Admin Already Created' : 'Create Admin User'}
                    </Button>

                    <div className="text-center">
                        <a href="/login/admin" className="text-sm text-primary hover:underline">
                            Go to Admin Login →
                        </a>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
