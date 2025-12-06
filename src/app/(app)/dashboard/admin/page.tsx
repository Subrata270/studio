'use client';

import { useState } from 'react';
import { useAppStore } from '@/store/app-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Edit, Trash2, FileText } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { Subscription } from '@/lib/types';
import EditSubscriptionDialog from '@/app/(app)/dashboard/admin/edit-subscription-dialog';
import { useToast } from '@/hooks/use-toast';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

export default function AdminPage() {
    const { subscriptions, deleteSubscription, addDeletedSubscription } = useAppStore();
    const { toast } = useToast();
    const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [subscriptionToDelete, setSubscriptionToDelete] = useState<Subscription | null>(null);
    const [deleteJustification, setDeleteJustification] = useState('');
    const [showJustificationDialog, setShowJustificationDialog] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    const handleEditClick = (subscription: Subscription) => {
        setSelectedSubscription(subscription);
        setIsEditDialogOpen(true);
    };

    const handleDeleteClick = (subscription: Subscription) => {
        setSubscriptionToDelete(subscription);
        setDeleteJustification('');
        setShowJustificationDialog(true);
    };

    const handleJustificationSubmit = () => {
        if (!deleteJustification.trim()) {
            toast({
                title: 'Justification Required',
                description: 'Please provide a reason for deleting this subscription.',
                variant: 'destructive',
            });
            return;
        }
        setShowJustificationDialog(false);
        setShowConfirmDialog(true);
    };

    const confirmDelete = () => {
        if (subscriptionToDelete) {
            addDeletedSubscription(subscriptionToDelete, deleteJustification);
            deleteSubscription(subscriptionToDelete.id);
            setSubscriptionToDelete(null);
            setDeleteJustification('');
            setShowConfirmDialog(false);
            toast({
                title: 'Subscription Deleted',
                description: `${subscriptionToDelete.toolName} has been deleted successfully.`,
            });
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Active':
                return 'bg-green-500';
            case 'Pending':
                return 'bg-yellow-500';
            case 'Declined':
                return 'bg-red-500';
            case 'Approved':
                return 'bg-blue-500';
            default:
                return 'bg-gray-500';
        }
    };

    const calculateExpiresIn = (requestDate: string, duration: number) => {
        const start = new Date(requestDate);
        const end = addDays(start, duration);
        const now = new Date();
        const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysLeft < 0) return 'Expired';
        if (daysLeft === 0) return 'in about 4 hours';
        if (daysLeft < 30) return `in ${daysLeft} days`;
        const monthsLeft = Math.floor(daysLeft / 30);
        return `in ${monthsLeft} month${monthsLeft > 1 ? 's' : ''}`;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-3 rounded-xl shadow-lg">
                        <FileText className="h-8 w-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                            Admin Dashboard
                        </h1>
                        <p className="text-gray-600 mt-1">Manage all subscriptions</p>
                    </div>
                </div>

                {/* Department Subscriptions Table */}
                <Card className="shadow-xl border-0 bg-white/80 backdrop-blur">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-2xl">
                            <FileText className="h-6 w-6 text-purple-600" />
                            Department Subscriptions
                        </CardTitle>
                        <CardDescription>View and manage all department subscriptions</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tool</TableHead>
                                    <TableHead>Cost</TableHead>
                                    <TableHead>Expires In</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {subscriptions.map((sub) => (
                                    <TableRow key={sub.id}>
                                        <TableCell className="font-medium">{sub.toolName}</TableCell>
                                        <TableCell>
                                            {sub.currencyNew || 'USD'} {sub.cost.toFixed(2)}
                                        </TableCell>
                                        <TableCell>
                                            {sub.requestDate ? calculateExpiresIn(sub.requestDate, sub.duration) : 'N/A'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={getStatusColor(sub.status)}>
                                                {sub.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEditClick(sub)}
                                                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                >
                                                    <Edit className="h-4 w-4 mr-1" />
                                                    Edit
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDeleteClick(sub)}
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    <Trash2 className="h-4 w-4 mr-1" />
                                                    Delete
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            {/* Edit Dialog */}
            {selectedSubscription && (
                <EditSubscriptionDialog
                    subscription={selectedSubscription}
                    open={isEditDialogOpen}
                    onOpenChange={setIsEditDialogOpen}
                />
            )}

            {/* Justification Dialog */}
            <Dialog open={showJustificationDialog} onOpenChange={setShowJustificationDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Justification Required</DialogTitle>
                        <DialogDescription>
                            Please provide a reason for deleting <strong>{subscriptionToDelete?.toolName}</strong>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="justification">Reason for Deletion</Label>
                            <Textarea
                                id="justification"
                                placeholder="e.g., Duplicate entry, No longer needed, Budget constraints..."
                                value={deleteJustification}
                                onChange={(e) => setDeleteJustification(e.target.value)}
                                className="min-h-[100px]"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => {
                            setShowJustificationDialog(false);
                            setSubscriptionToDelete(null);
                            setDeleteJustification('');
                        }}>
                            Cancel
                        </Button>
                        <Button onClick={handleJustificationSubmit}>
                            Continue
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Final Confirmation Dialog */}
            <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you really sure you want to delete?</AlertDialogTitle>
                        <AlertDialogDescription className="space-y-2">
                            <p>This will permanently delete the subscription for <strong>{subscriptionToDelete?.toolName}</strong>.</p>
                            <p className="text-sm"><strong>Reason:</strong> {deleteJustification}</p>
                            <p className="text-red-600 font-semibold">This action cannot be undone.</p>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => {
                            setShowConfirmDialog(false);
                            setSubscriptionToDelete(null);
                            setDeleteJustification('');
                        }}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Yes, Delete Permanently
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
