

"use client"

import { useAppStore } from "@/store/app-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, formatDistanceToNow } from "date-fns";
import { AlertCircle, CheckCircle, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Subscription } from "@/lib/types";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import SubscriptionHistory from "../../components/subscription-history";
import DeclineDetailsDialog from "../poc/decline-details-dialog";
import HODSubscriptionDetailsDialog from "./subscription-details-dialog";
import { cn } from "@/lib/utils";

const ApprovalActions = ({ subscription }: { subscription: Subscription }) => {
    const { updateSubscriptionStatus, users } = useAppStore();
    const [isDeclineOpen, setIsDeclineOpen] = useState(false);
    const [declineReason, setDeclineReason] = useState("");
    const [isApproveOpen, setIsApproveOpen] = useState(false);
    const [hodNote, setHodNote] = useState("");
    const { currentUser } = useAppStore();

    const requester = users.find(u => u.id === subscription.requestedBy);

    const handleApprove = () => {
        if(!currentUser) return;
        updateSubscriptionStatus(subscription.id, 'Approved', hodNote || currentUser.id);
        setIsApproveOpen(false);
        setHodNote("");
    }

    const handleDecline = () => {
        if(!currentUser) return;
        updateSubscriptionStatus(subscription.id, 'Declined', declineReason);
        setIsDeclineOpen(false);
        setDeclineReason("");
    }

    return (
        <div className="flex gap-2 justify-end">
             <Dialog open={isApproveOpen} onOpenChange={setIsApproveOpen}>
                <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700 transition-all hover:scale-105">
                        <CheckCircle className="mr-2 h-4 w-4"/>Approve
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Approval — Forward to Finance APA</DialogTitle>
                        <DialogDescription>Approving this request will forward it to the Finance APA team for review and processing. You can add an optional note for Finance below.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="text-sm space-y-2 p-3 bg-muted/50 rounded-lg border">
                           <p><strong>Tool:</strong> {subscription.toolName}</p>
                           <p><strong>Cost:</strong> ${subscription.cost.toFixed(2)}</p>
                           <p><strong>Requested By:</strong> {requester?.name || 'N/A'}</p>
                           <p><strong>Department:</strong> {subscription.department}</p>
                        </div>
                        <div className="grid gap-2">
                           <Label htmlFor="hod-note">Note for Finance (Optional)</Label>
                           <Textarea id="hod-note" value={hodNote} onChange={(e) => setHodNote(e.target.value)} placeholder="e.g., Approved for Q4 marketing campaign..." />
                           <p className="text-xs text-muted-foreground">This action will set status to "Approved" and push the request to the Finance APA queue.</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                        <Button onClick={handleApprove} className="bg-gradient-to-r from-primary to-accent text-white">Confirm & Forward</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isDeclineOpen} onOpenChange={setIsDeclineOpen}>
                <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700 transition-all hover:scale-105">
                        <XCircle className="mr-2 h-4 w-4"/>Decline
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Decline Request</DialogTitle>
                        <DialogDescription>Please provide a reason for declining this subscription request for {subscription.toolName}.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <Label htmlFor="decline-reason">Reason for Decline</Label>
                        <Textarea id="decline-reason" value={declineReason} onChange={(e) => setDeclineReason(e.target.value)} placeholder="e.g., Budget constraints, duplicate tool, etc." />
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                        <Button variant="destructive" onClick={handleDecline} disabled={!declineReason}>Confirm Decline</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default function HODDashboardPage() {
    const { currentUser, subscriptions, users } = useAppStore();
    const [selectedDeclinedSub, setSelectedDeclinedSub] = useState<Subscription | null>(null);
    const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);

    if (!currentUser || currentUser.role !== 'hod') return null;

    const departmentSubscriptions = subscriptions.filter(s => s.department === currentUser.department);
    const pendingApprovals = subscriptions.filter(s => s.hodId === currentUser.id && s.status === 'Pending');
    const expiringSoon = departmentSubscriptions.filter(s => s.status === 'Active' && s.expiryDate && new Date(s.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
    
    const getUserName = (userId: string) => users.find(u => u.id === userId)?.name || 'Unknown User';

    const approvedHistory = departmentSubscriptions.filter(s => ['Approved', 'Active', 'Expired', 'Payment Pending'].includes(s.status));
    const declinedHistory = departmentSubscriptions.filter(s => s.status === 'Declined');

    const handleRowDoubleClick = (sub: Subscription) => {
        if (sub.status === 'Declined') {
            setSelectedDeclinedSub(sub);
        } else {
            setSelectedSubscription(sub);
        }
    };

    const handleRowClick = (sub: Subscription) => {
        setSelectedSubscription(sub);
    };

    return (
        <div className="space-y-8">
            <header className="text-center md:text-left">
                <h1 className="text-2xl md:text-3xl font-bold">Welcome, {currentUser.name}</h1>
                <p className="text-muted-foreground mt-1">Manage your department’s subscription requests efficiently.</p>
            </header>

            {selectedDeclinedSub && (
                <DeclineDetailsDialog
                    subscription={selectedDeclinedSub}
                    open={!!selectedDeclinedSub}
                    onOpenChange={(isOpen) => {
                        if (!isOpen) {
                            setSelectedDeclinedSub(null);
                        }
                    }}
                />
            )}
            {selectedSubscription && (
                <HODSubscriptionDetailsDialog
                    subscription={selectedSubscription}
                    open={!!selectedSubscription}
                    onOpenChange={(isOpen) => {
                        if (!isOpen) {
                            setSelectedSubscription(null);
                        }
                    }}
                />
            )}

            <div className="mt-6 space-y-8">
                {expiringSoon.length > 0 && (
                    <Card className="bg-amber-50 border-amber-200/80 rounded-2xl shadow-sm hover:shadow-md transition-shadow hover:-translate-y-1">
                        <CardHeader className="flex flex-row items-center gap-4">
                            <AlertCircle className="h-6 w-6 text-amber-600"/>
                            <CardTitle className="text-amber-800">Expiring Soon</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-3">
                            {expiringSoon.map(sub => (
                                <li key={sub.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-sm">
                                    <span className="mb-2 sm:mb-0">
                                        Your department’s subscription for <strong>{sub.toolName}</strong> is expiring {formatDistanceToNow(new Date(sub.expiryDate!), { addSuffix: true })}.
                                    </span>
                                </li>
                            ))}
                            </ul>
                        </CardContent>
                    </Card>
                )}

                <Card className="rounded-2xl shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-slate-800"><Clock /> Pending Approvals</CardTitle>
                        <CardDescription>Review and act on new subscription requests.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* For Mobile - stacked cards */}
                        <div className="md:hidden space-y-4">
                            {pendingApprovals.length > 0 ? pendingApprovals.map(sub => (
                                <div key={sub.id} className="border rounded-lg p-4 space-y-3 bg-background shadow-sm">
                                    <div className="font-bold text-lg">{sub.toolName}</div>
                                    <div className="text-sm text-muted-foreground space-y-1">
                                        <p><strong>Requested By:</strong> {getUserName(sub.requestedBy)}</p>
                                        <p><strong>Cost:</strong> <span className="font-semibold text-foreground">${sub.cost.toFixed(2)}</span></p>
                                        <p><strong>Date:</strong> {format(new Date(sub.requestDate), "PP")}</p>
                                    </div>
                                    <div className="pt-2">
                                    <ApprovalActions subscription={sub} />
                                    </div>
                                </div>
                            )) : <div className="text-center text-muted-foreground py-8">No pending approvals.</div>}
                        </div>
                        
                        {/* For Desktop - table */}
                        <div className="hidden md:block">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ID</TableHead>
                                        <TableHead>Tool</TableHead>
                                        <TableHead>Requested By</TableHead>
                                        <TableHead>Cost</TableHead>
                                        <TableHead>Requested On</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {pendingApprovals.length > 0 ? pendingApprovals.map(sub => (
                                        <TableRow 
                                            key={sub.id}
                                            onClick={() => handleRowClick(sub)}
                                            className="cursor-pointer hover:bg-blue-50/50 transition-colors"
                                        >
                                            <TableCell className="font-mono text-xs text-muted-foreground">{sub.id}</TableCell>
                                            <TableCell className="font-medium">{sub.toolName}</TableCell>
                                            <TableCell>{getUserName(sub.requestedBy)}</TableCell>
                                            <TableCell>${sub.cost.toFixed(2)}</TableCell>
                                            <TableCell>{format(new Date(sub.requestDate), "PP")}</TableCell>
                                            <TableCell className="text-right">
                                                <ApprovalActions subscription={sub} />
                                            </TableCell>
                                        </TableRow>
                                    )) : <TableRow><TableCell colSpan={5} className="text-center h-24">No pending approvals for your department.</TableCell></TableRow>}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                 <SubscriptionHistory
                    approvedHistory={approvedHistory}
                    declinedHistory={declinedHistory}
                    onDeclineDoubleClick={handleRowDoubleClick}
                    onApproveDoubleClick={handleRowClick}
                />
            </div>
        </div>
    );
}

    
