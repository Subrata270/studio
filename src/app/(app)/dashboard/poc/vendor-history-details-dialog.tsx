
"use client";

import { Subscription } from '@/lib/types';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, parseISO } from 'date-fns';
import { Calendar, Clock, FileText, Info, Tag, Users, Wallet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import CostHistoryChart from './cost-history-chart';
import { useMemo } from 'react';
import { useAppStore } from '@/store/app-store';

interface VendorHistoryDetailsDialogProps {
    toolName: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const DetailItem = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: React.ReactNode }) => (
    <div className="flex items-start gap-4">
        <div className="text-muted-foreground mt-1">{icon}</div>
        <div>
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <div className="text-md font-semibold">{value}</div>
        </div>
    </div>
);

export default function VendorHistoryDetailsDialog({ toolName, open, onOpenChange }: VendorHistoryDetailsDialogProps) {
    const { subscriptions } = useAppStore();
    
    const toolSubscriptions = useMemo(() => 
        subscriptions.filter(s => s.toolName === toolName && (s.status === 'Active' || s.status === 'Expired' || s.status === 'PaymentCompleted'))
    , [subscriptions, toolName]);

    const latestSubscription = useMemo(() => 
        toolSubscriptions.sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime())[0]
    , [toolSubscriptions]);
    
    if (!latestSubscription) return null;
    
    const statusVariant = (status?: string) => {
        switch (status) {
            case 'Active': return 'default';
            case 'Pending': return 'secondary';
            case 'Declined':
            case 'Expired': return 'destructive';
            default: return 'outline';
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95%] sm:w-[90%] md:max-w-4xl rounded-xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl flex items-center gap-3">
                        <FileText className="text-primary"/>
                        Tool History: {toolName}
                    </DialogTitle>
                    <DialogDescription>
                       Read-only spending history for the <strong>{toolName}</strong> subscription.
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] pr-4">
                    <div className="py-4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        <div className="md:col-span-2">
                             <CostHistoryChart subscriptions={toolSubscriptions} title="Monthly Spending" />
                        </div>
                        <DetailItem icon={<Tag className="h-5 w-5" />} label="Tool Name" value={latestSubscription.toolName} />
                        <DetailItem icon={<Users className="h-5 w-5" />} label="Department" value={latestSubscription.department} />
                        <DetailItem icon={<Wallet className="h-5 w-5" />} label="Last Cost (USD)" value={`$${latestSubscription.cost.toFixed(2)}`} />
                         <DetailItem 
                            icon={<Info className="h-5 w-5" />} 
                            label="Status" 
                            value={<Badge variant={statusVariant(latestSubscription.status)} className="capitalize">{latestSubscription.status}</Badge>} 
                        />
                        <DetailItem 
                            icon={<Calendar className="h-5 w-5" />} 
                            label="Last Start Date" 
                            value={latestSubscription.requestDate ? format(parseISO(latestSubscription.requestDate), "PPP") : 'N/A'}
                        />
                        <DetailItem 
                            icon={<Calendar className="h-5 w-5" />} 
                            label="Current Expiry Date" 
                            value={latestSubscription.expiryDate ? format(parseISO(latestSubscription.expiryDate), "PPP") : 'N/A'}
                        />
                    </div>
                </ScrollArea>
                <DialogFooter className="pt-4">
                    <Button type="button" onClick={() => onOpenChange(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
