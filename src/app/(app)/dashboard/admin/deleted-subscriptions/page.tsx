'use client';

import { useState } from 'react';
import { useAppStore } from '@/store/app-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Trash2, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { DeletedSubscription } from '@/lib/types';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function DeletedSubscriptionsPage() {
    const { deletedSubscriptions, users } = useAppStore();
    const [selectedDeleted, setSelectedDeleted] = useState<DeletedSubscription | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const handleViewDetails = (deletedSub: DeletedSubscription) => {
        setSelectedDeleted(deletedSub);
        setIsDialogOpen(true);
    };

    const getDeletedByName = (userId: string) => {
        const user = users.find(u => u.id === userId);
        return user ? user.name : 'Unknown User';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <div className="bg-gradient-to-br from-red-500 to-orange-600 p-3 rounded-xl shadow-lg">
                        <Trash2 className="h-8 w-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                            Deleted Subscriptions
                        </h1>
                        <p className="text-gray-600 mt-1">
                            View all deleted subscriptions with justifications
                        </p>
                    </div>
                </div>

                {/* Deleted Subscriptions Table */}
                <Card className="shadow-xl border-0 bg-white/80 backdrop-blur">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-2xl">
                            <FileText className="h-6 w-6 text-red-600" />
                            Deleted Records
                        </CardTitle>
                        <CardDescription>
                            {deletedSubscriptions.length} subscription{deletedSubscriptions.length !== 1 ? 's' : ''} deleted
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {deletedSubscriptions.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <Trash2 className="h-16 w-16 mx-auto mb-4 opacity-20" />
                                <p className="text-lg">No deleted subscriptions</p>
                                <p className="text-sm">All deleted subscriptions will appear here</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Tool Name</TableHead>
                                        <TableHead>Department</TableHead>
                                        <TableHead>Cost</TableHead>
                                        <TableHead>Deleted By</TableHead>
                                        <TableHead>Deleted At</TableHead>
                                        <TableHead>Justification</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {deletedSubscriptions.map((deleted) => (
                                        <TableRow key={deleted.id}>
                                            <TableCell className="font-medium">
                                                {deleted.subscription.toolName}
                                            </TableCell>
                                            <TableCell>{deleted.subscription.department}</TableCell>
                                            <TableCell>
                                                {deleted.subscription.currencyNew || 'USD'} {deleted.subscription.cost.toFixed(2)}
                                            </TableCell>
                                            <TableCell>{getDeletedByName(deleted.deletedBy)}</TableCell>
                                            <TableCell>
                                                {format(new Date(deleted.deletedAt), 'MMM dd, yyyy HH:mm')}
                                            </TableCell>
                                            <TableCell>
                                                <p className="max-w-xs truncate text-sm text-muted-foreground">
                                                    {deleted.justification}
                                                </p>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleViewDetails(deleted)}
                                                >
                                                    <Eye className="h-4 w-4 mr-1" />
                                                    View Details
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Details Dialog */}
            {selectedDeleted && (
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="max-w-3xl max-h-[90vh]">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-red-600">
                                <Trash2 className="h-6 w-6" />
                                Deleted Subscription Details
                            </DialogTitle>
                            <DialogDescription>
                                Complete information about the deleted subscription
                            </DialogDescription>
                        </DialogHeader>

                        <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
                            <div className="space-y-6">
                                {/* Deletion Info */}
                                <Card className="border-2 border-red-200 bg-red-50">
                                    <CardContent className="p-4">
                                        <h3 className="font-semibold text-lg mb-3 text-red-900">
                                            Deletion Information
                                        </h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm text-muted-foreground">Deleted By</p>
                                                <p className="font-semibold">
                                                    {getDeletedByName(selectedDeleted.deletedBy)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Deleted At</p>
                                                <p className="font-semibold">
                                                    {format(new Date(selectedDeleted.deletedAt), 'PPpp')}
                                                </p>
                                            </div>
                                            <div className="col-span-2">
                                                <p className="text-sm text-muted-foreground">Justification</p>
                                                <p className="font-semibold text-red-900 mt-1">
                                                    {selectedDeleted.justification}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Subscription Details */}
                                <Card>
                                    <CardContent className="p-4">
                                        <h3 className="font-semibold text-lg mb-3">Subscription Details</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm text-muted-foreground">Tool Name</p>
                                                <p className="font-semibold">
                                                    {selectedDeleted.subscription.toolName}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Vendor</p>
                                                <p className="font-semibold">
                                                    {selectedDeleted.subscription.vendorName || 'N/A'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Department</p>
                                                <p className="font-semibold">
                                                    {selectedDeleted.subscription.department}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Status</p>
                                                <Badge>{selectedDeleted.subscription.status}</Badge>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Cost</p>
                                                <p className="font-semibold">
                                                    {selectedDeleted.subscription.currencyNew || 'USD'}{' '}
                                                    {selectedDeleted.subscription.cost.toFixed(2)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Duration</p>
                                                <p className="font-semibold">
                                                    {selectedDeleted.subscription.duration} days
                                                </p>
                                            </div>
                                            <div className="col-span-2">
                                                <p className="text-sm text-muted-foreground">Purpose</p>
                                                <p className="mt-1">{selectedDeleted.subscription.purpose}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </ScrollArea>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
