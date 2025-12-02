"use client";

import { useAppStore } from '@/store/app-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';
import { ScrollArea } from "@/components/ui/scroll-area";

export default function ViewUsersPage() {
  const { users, currentUser } = useAppStore();
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-6xl">
        <CardHeader>
          <CardTitle>All Users in Database</CardTitle>
          <CardDescription>
            View all registered users and their roles. Collection: <code className="bg-muted px-1 py-0.5 rounded">users</code>
          </CardDescription>
          {currentUser && (
            <div className="mt-2 text-sm text-muted-foreground">
              Currently logged in as: <strong>{currentUser.email}</strong> ({currentUser.role})
            </div>
          )}
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>SubRole</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Microsoft</TableHead>
                  <TableHead>Google</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} className={user.email === currentUser?.email ? 'bg-muted/50' : ''}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>
                      <code className="text-xs">{user.email}</code>
                    </TableCell>
                    <TableCell>
                      <Badge variant="default">
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.subrole ? (
                        <Badge variant="outline">{user.subrole}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{user.department || '-'}</TableCell>
                    <TableCell>
                      {user.microsoftUid ? (
                        <Badge variant="secondary" className="text-xs">
                          ✓ Linked
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">Not linked</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.googleUid ? (
                        <Badge variant="secondary" className="text-xs">
                          ✓ Linked
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">Not linked</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>

          <div className="mt-4 flex gap-2">
            <Button onClick={() => router.push('/update-role')} variant="outline">
              Update Role
            </Button>
            <Button onClick={() => router.push('/')} variant="outline">
              Back to Home
            </Button>
          </div>

          <div className="mt-4 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm font-semibold mb-2">Database Info:</p>
            <ul className="text-xs space-y-1 text-muted-foreground">
              <li>• <strong>Collection:</strong> users</li>
              <li>• <strong>Total Users:</strong> {users.length}</li>
              <li>• <strong>Microsoft Accounts:</strong> {users.filter(u => u.microsoftUid).length}</li>
              <li>• <strong>Google Accounts:</strong> {users.filter(u => u.googleUid).length}</li>
              <li>• <strong>HOD Users:</strong> {users.filter(u => u.role === 'hod').length}</li>
              <li>• <strong>POC Users:</strong> {users.filter(u => u.role === 'poc').length}</li>
              <li>• <strong>Finance Users:</strong> {users.filter(u => u.role === 'finance').length}</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
