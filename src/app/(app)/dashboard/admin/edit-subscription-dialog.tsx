'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
    FileText, 
    Building2, 
    MapPin, 
    Calendar, 
    Clock, 
    DollarSign,
    User,
    CheckCircle2,
    AlertCircle,
    Hash
} from 'lucide-react';
import { Subscription } from '@/lib/types';
import { useAppStore } from '@/store/app-store';
import { format } from 'date-fns';
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

interface EditSubscriptionDialogProps {
    subscription: Subscription;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function EditSubscriptionDialog({ subscription, open, onOpenChange }: EditSubscriptionDialogProps) {
    const { updateSubscription } = useAppStore();
    const [showSaveAlert, setShowSaveAlert] = useState(false);
    const [formData, setFormData] = useState({
        toolName: subscription.toolName,
        vendorName: subscription.vendorName || '',
        department: subscription.department,
        location: subscription.location || 'Other' as any,
        purpose: subscription.purpose,
        typeOfRequest: subscription.typeOfRequest || 'Invoice' as any,
        frequencyNew: subscription.frequencyNew || 'Monthly' as any,
        cost: subscription.cost,
        currencyNew: subscription.currencyNew || 'IND' as any,
        duration: subscription.duration,
        requestDate: subscription.requestDate,
        expiryDate: subscription.expiryDate || '',
    });

    useEffect(() => {
        setFormData({
            toolName: subscription.toolName,
            vendorName: subscription.vendorName || '',
            department: subscription.department,
            location: subscription.location || 'Other' as any,
            purpose: subscription.purpose,
            typeOfRequest: subscription.typeOfRequest || 'Invoice' as any,
            frequencyNew: subscription.frequencyNew || 'Monthly' as any,
            cost: subscription.cost,
            currencyNew: subscription.currencyNew || 'IND' as any,
            duration: subscription.duration,
            requestDate: subscription.requestDate,
            expiryDate: subscription.expiryDate || '',
        });
    }, [subscription]);

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSaveClick = () => {
        setShowSaveAlert(true);
    };

    const confirmSave = () => {
        updateSubscription(subscription.id, formData);
        setShowSaveAlert(false);
        onOpenChange(false);
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

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-4xl max-h-[90vh]">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                            <FileText className="h-6 w-6 text-primary" />
                            Subscription Details - {formData.toolName}
                        </DialogTitle>
                        <p className="text-sm text-muted-foreground">Complete information about your subscription request</p>
                    </DialogHeader>

                    <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
                        <div className="space-y-6">
                            {/* Status Banner */}
                            <Card className="border-2 bg-gradient-to-r from-green-50 to-emerald-50">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <CheckCircle2 className="h-8 w-8 text-green-600" />
                                            <div>
                                                <h3 className="font-semibold text-lg text-green-900">{subscription.status}</h3>
                                                <p className="text-sm text-green-700">
                                                    {subscription.status === 'Active' ? 'Currently active and running' : 'Subscription status'}
                                                </p>
                                            </div>
                                        </div>
                                        <Badge className={getStatusColor(subscription.status)}>
                                            {subscription.status}
                                        </Badge>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Subscription Information */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <FileText className="h-5 w-5 text-primary" />
                                        Subscription Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Label className="text-sm text-muted-foreground flex items-center gap-2">
                                            <FileText className="h-4 w-4" />
                                            Tool Name
                                        </Label>
                                        <Input
                                            value={formData.toolName}
                                            onChange={(e) => handleInputChange('toolName', e.target.value)}
                                            className="font-semibold"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-sm text-muted-foreground flex items-center gap-2">
                                            <Building2 className="h-4 w-4" />
                                            Vendor
                                        </Label>
                                        <Input
                                            value={formData.vendorName}
                                            onChange={(e) => handleInputChange('vendorName', e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-sm text-muted-foreground flex items-center gap-2">
                                            <Building2 className="h-4 w-4" />
                                            Department
                                        </Label>
                                        <Input
                                            value={formData.department}
                                            onChange={(e) => handleInputChange('department', e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-sm text-muted-foreground flex items-center gap-2">
                                            <MapPin className="h-4 w-4" />
                                            Location
                                        </Label>
                                        <Input
                                            value={formData.location}
                                            onChange={(e) => handleInputChange('location', e.target.value)}
                                        />
                                    </div>

                                    <div className="col-span-2 space-y-1">
                                        <Label className="text-sm text-muted-foreground">Purpose</Label>
                                        <Textarea
                                            value={formData.purpose}
                                            onChange={(e) => handleInputChange('purpose', e.target.value)}
                                            className="min-h-[60px]"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-sm text-muted-foreground">Request Type</Label>
                                        <Input
                                            value={formData.typeOfRequest}
                                            onChange={(e) => handleInputChange('typeOfRequest', e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-sm text-muted-foreground">Frequency</Label>
                                        <Input
                                            value={formData.frequencyNew}
                                            onChange={(e) => handleInputChange('frequencyNew', e.target.value)}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Timeline & Duration */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Calendar className="h-5 w-5 text-primary" />
                                        Timeline & Duration
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Label className="text-sm text-muted-foreground flex items-center gap-2">
                                            <Calendar className="h-4 w-4" />
                                            Request Date
                                        </Label>
                                        <Input
                                            type="date"
                                            value={formData.requestDate ? format(new Date(formData.requestDate), 'yyyy-MM-dd') : ''}
                                            onChange={(e) => handleInputChange('requestDate', e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-sm text-muted-foreground flex items-center gap-2">
                                            <Calendar className="h-4 w-4" />
                                            Expiry Date
                                        </Label>
                                        <Input
                                            type="date"
                                            value={formData.expiryDate ? format(new Date(formData.expiryDate), 'yyyy-MM-dd') : ''}
                                            onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-sm text-muted-foreground flex items-center gap-2">
                                            <Clock className="h-4 w-4" />
                                            Duration (days)
                                        </Label>
                                        <Input
                                            type="number"
                                            value={formData.duration}
                                            onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Budget Information */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <DollarSign className="h-5 w-5 text-primary" />
                                        Budget Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Label className="text-sm text-muted-foreground flex items-center gap-2">
                                            <DollarSign className="h-4 w-4" />
                                            Cost
                                        </Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={formData.cost}
                                            onChange={(e) => handleInputChange('cost', parseFloat(e.target.value))}
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-sm text-muted-foreground flex items-center gap-2">
                                            <DollarSign className="h-4 w-4" />
                                            Currency
                                        </Label>
                                        <Input
                                            value={formData.currencyNew}
                                            onChange={(e) => handleInputChange('currencyNew', e.target.value)}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </ScrollArea>

                    <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveClick} className="bg-blue-600 hover:bg-blue-700">
                            Save Changes
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Save Confirmation Dialog */}
            <AlertDialog open={showSaveAlert} onOpenChange={setShowSaveAlert}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Save Changes?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to save these changes to <strong>{formData.toolName}</strong>? 
                            This will update the subscription information.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmSave}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            Save Changes
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
