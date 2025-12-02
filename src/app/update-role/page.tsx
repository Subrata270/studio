"use client";

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/app-store';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Role, SubRole } from '@/lib/types';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

export default function UpdateRolePage() {
  const [email, setEmail] = useState('');
  const [newRole, setNewRole] = useState<Role>('poc');
  const [newSubRole, setNewSubRole] = useState<SubRole | null>(null);
  const [newDepartment, setNewDepartment] = useState('');
  const { users, currentUser } = useAppStore();
  const { toast } = useToast();
  const router = useRouter();

  // Pre-fill with current user's data
  useEffect(() => {
    if (currentUser) {
      setEmail(currentUser.email);
      setNewRole(currentUser.role);
      setNewSubRole(currentUser.subrole);
      setNewDepartment(currentUser.department || '');
    }
  }, [currentUser]);

  const handleUpdate = async () => {
    if (!email) {
      toast({
        variant: "destructive",
        title: "Email Required",
        description: "Please enter an email address.",
      });
      return;
    }

    try {
      await useAppStore.getState().updateUserRole(email, newRole, newSubRole, newDepartment);

      toast({
        title: "Role Updated Successfully",
        description: `User role has been updated to ${newRole}. Redirecting...`,
      });

      // If updating current user, redirect to their new dashboard
      if (currentUser?.email.toLowerCase() === email.toLowerCase()) {
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || "Could not update user role. Please try again.",
      });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Update User Role</CardTitle>
          <CardDescription>
            Change the role and department for a user account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentUser && (
            <Alert>
              <InfoIcon className="h-4 w-4" />
              <AlertDescription>
                Currently logged in as: <strong>{currentUser.email}</strong>
                <br />
                Current role: <strong>{currentUser.role}</strong>
                {currentUser.subrole && ` (${currentUser.subrole})`}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">New Role</Label>
            <Select value={newRole} onValueChange={(value) => setNewRole(value as Role)}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="poc">Department POC</SelectItem>
                <SelectItem value="hod">HOD</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {newRole === 'finance' && (
            <div className="space-y-2">
              <Label htmlFor="subrole">Finance Role</Label>
              <Select value={newSubRole || ''} onValueChange={(value) => setNewSubRole(value as SubRole)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select finance role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="apa">APA</SelectItem>
                  <SelectItem value="am">AM</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="department">Department (Optional)</Label>
            <Input
              id="department"
              placeholder="e.g., IT, HR, Marketing"
              value={newDepartment}
              onChange={(e) => setNewDepartment(e.target.value)}
            />
          </div>

          <Button onClick={handleUpdate} className="w-full">
            Update Role
          </Button>

          <Button variant="outline" onClick={() => router.push('/')} className="w-full">
            Back to Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
