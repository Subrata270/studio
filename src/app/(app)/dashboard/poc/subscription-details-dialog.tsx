"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Subscription } from "@/lib/types";
import { useAppStore } from "@/store/app-store";
import { format, differenceInCalendarDays } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Calendar, DollarSign, FileText, User, MapPin, Clock, Building2, AlertCircle, CheckCircle, XCircle, Hourglass, Hash } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface SubscriptionDetailsDialogProps {
    subscription: Subscription | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function POCSubscriptionDetailsDialog({ subscription, open, onOpenChange }: SubscriptionDetailsDialogProps) {
    const { users } = useAppStore();

    if (!subscription) return null;

    const getUserName = (userId: string | undefined) => {
        if (!userId) return 'N/A';
        return users.find(u => u.id === userId)?.name || 'Unknown User';
    };

    const pocName = getUserName(subscription.requestedBy);
    const approverName = getUserName(subscription.approvedBy);
    const hodName = getUserName(subscription.hodId);
    const amVerifierName = subscription.finance?.amLog?.by ? getUserName(subscription.finance.amLog.by) : 'N/A';
    const apaExecutorName = subscription.finance?.apaExecution?.by ? getUserName(subscription.finance.apaExecution.by) : 'N/A';

    // Calculate subscription period
    const startDate = subscription.approvalDate || subscription.requestDate;
    const endDate = subscription.expiryDate;
    const dayLimit = subscription.duration * 30;

    // Calculate days remaining
    const daysRemaining = endDate ? differenceInCalendarDays(new Date(endDate), new Date()) : null;
    const progressPercentage = endDate && daysRemaining !== null ? Math.max(0, Math.min(100, ((dayLimit - daysRemaining) / dayLimit) * 100)) : 0;

    // Payment information
    const paymentInfo = subscription.finance?.apaExecution;
    const invoiceNumber = paymentInfo?.invoiceNumber || subscription.invoiceNumber || 'N/A';
    const paymentDate = paymentInfo?.at ? new Date(paymentInfo.at) : (subscription.paymentDate ? new Date(subscription.paymentDate) : null);
    const amountPaid = paymentInfo?.amountPaid || subscription.cost;
    const currency = paymentInfo?.currency || 'USD';

    // Status icon and color
    const getStatusInfo = () => {
        switch (subscription.status) {
            case 'Active':
                return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' };
            case 'Pending':
            case 'Approved':
            case 'ForwardedToAM':
            case 'VerifiedByAM':
                return { icon: Hourglass, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' };
            case 'Declined':
                return { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' };
            case 'Expired':
                return { icon: AlertCircle, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' };
            default:
                return { icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' };
        }
    };

    const statusInfo = getStatusInfo();
    const StatusIcon = statusInfo.icon;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        <FileText className="h-6 w-6 text-primary" />
                        <span className="font-mono text-primary">[{subscription.id}]</span> {subscription.toolName}
                    </DialogTitle>
                    <DialogDescription>
                        Complete information about your subscription request
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="max-h-[70vh] pr-4">
                    <div className="space-y-6">
                        {/* Status Banner */}
                        <Card className={`${statusInfo.border} ${statusInfo.bg}`}>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <StatusIcon className={`h-8 w-8 ${statusInfo.color}`} />
                                        <div>
                                            <p className="text-lg font-bold">{subscription.status}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {subscription.status === 'Pending' && 'Awaiting HOD approval'}
                                                {subscription.status === 'Approved' && 'Approved by HOD, forwarded to Finance'}
                                                {subscription.status === 'ForwardedToAM' && 'Under Finance AM verification'}
                                                {subscription.status === 'VerifiedByAM' && 'Verified, awaiting payment execution'}
                                                {subscription.status === 'Active' && 'Currently active and running'}
                                                {subscription.status === 'Declined' && 'Request was declined'}
                                                {subscription.status === 'Expired' && 'Subscription has expired'}
                                                {subscription.status === 'PaymentCompleted' && 'Payment completed successfully'}
                                            </p>
                                        </div>
                                    </div>
                                    <Badge className={`${statusInfo.color} text-lg px-4 py-2`} variant="outline">
                                        {subscription.status}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Active Subscription Progress */}
                        {subscription.status === 'Active' && endDate && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Clock className="h-5 w-5" />
                                        Subscription Progress
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span>Days Remaining: <strong className={daysRemaining && daysRemaining < 10 ? 'text-red-600' : 'text-green-600'}>{daysRemaining} days</strong></span>
                                        <span>Total Duration: <strong>{dayLimit} days</strong></span>
                                    </div>
                                    <Progress value={progressPercentage} className="h-3" />
                                    <p className="text-xs text-muted-foreground text-center">
                                        {daysRemaining && daysRemaining < 10 ? '⚠️ Renewal needed soon!' : '✓ Subscription running smoothly'}
                                    </p>
                                </CardContent>
                            </Card>
                        )}

                        {/* Basic Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    Subscription Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                                        <Hash className="h-4 w-4" />
                                        Subscription ID
                                    </p>
                                    <p className="font-mono font-semibold text-primary">{subscription.id}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                                        <FileText className="h-4 w-4" />
                                        Tool Name
                                    </p>
                                    <p className="font-semibold">{subscription.toolName}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                                        <Building2 className="h-4 w-4" />
                                        Vendor
                                    </p>
                                    <p className="font-semibold">{subscription.vendorName || 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                                        <Building2 className="h-4 w-4" />
                                        Department
                                    </p>
                                    <p className="font-semibold">{subscription.department}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                                        <MapPin className="h-4 w-4" />
                                        Location
                                    </p>
                                    <p className="font-semibold">{subscription.location || 'N/A'}</p>
                                </div>
                                <div className="space-y-1 col-span-2">
                                    <p className="text-sm text-muted-foreground">Purpose</p>
                                    <p className="font-semibold">{subscription.purpose}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Request Type</p>
                                    <Badge variant="outline">{subscription.typeOfRequest || 'N/A'}</Badge>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Frequency</p>
                                    <Badge variant="outline">{subscription.frequencyNew || subscription.frequency || 'N/A'}</Badge>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Timeline & Duration */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Calendar className="h-5 w-5" />
                                    Timeline & Duration
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        Request Date
                                    </p>
                                    <p className="font-semibold">
                                        {format(new Date(subscription.requestDate), "PPP")}
                                    </p>
                                </div>
                                {subscription.approvalDate && (
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                                            <Calendar className="h-4 w-4" />
                                            Approval Date
                                        </p>
                                        <p className="font-semibold text-green-600">
                                            {format(new Date(subscription.approvalDate), "PPP")}
                                        </p>
                                    </div>
                                )}
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        Start Date
                                    </p>
                                    <p className="font-semibold">
                                        {format(new Date(startDate), "PPP")}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        End Date
                                    </p>
                                    <p className="font-semibold">
                                        {endDate ? format(new Date(endDate), "PPP") : 'N/A'}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                                        <Clock className="h-4 w-4" />
                                        Duration
                                    </p>
                                    <p className="font-semibold">{subscription.duration} months ({dayLimit} days approx.)</p>
                                </div>
                                {daysRemaining !== null && subscription.status === 'Active' && (
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                                            <AlertCircle className="h-4 w-4" />
                                            Days Remaining
                                        </p>
                                        <p className={`font-bold text-lg ${daysRemaining < 10 ? 'text-red-600' : 'text-green-600'}`}>
                                            {daysRemaining} days
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Budget & Cost Information */}
                        <Card className="border-primary/20 bg-primary/5">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <DollarSign className="h-5 w-5" />
                                    Budget & Cost Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Total Cost</p>
                                    <p className="font-bold text-2xl text-primary">${subscription.cost.toFixed(2)}</p>
                                </div>
                                {subscription.baseMonthlyUSD && (
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">Base Monthly (USD)</p>
                                        <p className="font-semibold text-lg">${subscription.baseMonthlyUSD.toFixed(2)}</p>
                                    </div>
                                )}
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Currency</p>
                                    <Badge>{subscription.currencyNew || currency}</Badge>
                                </div>
                                {paymentDate && (
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">Payment Date</p>
                                        <p className="font-semibold">{format(paymentDate, "PPP")}</p>
                                    </div>
                                )}
                                {paymentInfo && (
                                    <>
                                        <div className="space-y-1">
                                            <p className="text-sm text-muted-foreground">Amount Paid</p>
                                            <p className="font-bold text-lg text-green-600">
                                                {amountPaid.toFixed(2)} {currency}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm text-muted-foreground">Payment Status</p>
                                            <Badge variant="default">Paid</Badge>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        {/* People & Approval Chain */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <User className="h-5 w-5" />
                                    People & Approval Chain
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                                            {pocName.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-semibold">{pocName}</p>
                                            <p className="text-xs text-muted-foreground">POC / Requester</p>
                                        </div>
                                    </div>
                                    <Badge variant="default">You</Badge>
                                </div>

                                {hodName !== 'N/A' && (
                                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">
                                                {hodName.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-semibold">{hodName}</p>
                                                <p className="text-xs text-muted-foreground">Department HOD</p>
                                            </div>
                                        </div>
                                        {subscription.approvedBy ? (
                                            <Badge variant="default" className="bg-green-600">Approved</Badge>
                                        ) : subscription.status === 'Declined' ? (
                                            <Badge variant="destructive">Declined</Badge>
                                        ) : (
                                            <Badge variant="secondary">Pending</Badge>
                                        )}
                                    </div>
                                )}

                                {amVerifierName !== 'N/A' && (
                                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold">
                                                {amVerifierName.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-semibold">{amVerifierName}</p>
                                                <p className="text-xs text-muted-foreground">Finance AM / Verifier</p>
                                            </div>
                                        </div>
                                        <Badge variant="default" className="bg-purple-600">Verified</Badge>
                                    </div>
                                )}

                                {apaExecutorName !== 'N/A' && (
                                    <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">
                                                {apaExecutorName.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-semibold">{apaExecutorName}</p>
                                                <p className="text-xs text-muted-foreground">Finance APA / Executor</p>
                                            </div>
                                        </div>
                                        <Badge variant="default" className="bg-emerald-600">Payment Done</Badge>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Invoice & Documents */}
                        {(subscription.invoiceUrl || invoiceNumber !== 'N/A') && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <FileText className="h-5 w-5" />
                                        Invoice & Documents
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {invoiceNumber !== 'N/A' && (
                                        <div className="space-y-1">
                                            <p className="text-sm text-muted-foreground">Invoice Number</p>
                                            <p className="font-semibold">{invoiceNumber}</p>
                                        </div>
                                    )}
                                    {subscription.invoiceUrl && (
                                        <a 
                                            href={subscription.invoiceUrl} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 text-blue-600 hover:underline"
                                        >
                                            <FileText className="h-4 w-4" />
                                            View Invoice Document
                                        </a>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Remarks & Notes */}
                        {(subscription.remarks || subscription.finance?.amLog?.verificationNote) && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Notes & Remarks</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {subscription.remarks && (
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium text-muted-foreground">
                                                {subscription.status === 'Declined' ? 'Decline Reason:' : 'HOD Remarks:'}
                                            </p>
                                            <p className={`text-sm italic p-3 rounded-md ${
                                                subscription.status === 'Declined' ? 'bg-red-50 text-red-800 border-l-4 border-red-600' : 'bg-muted/50'
                                            }`}>
                                                "{subscription.remarks.replace('Declined by HOD: ', '').replace('Declined by Finance (APA): ', '')}"
                                            </p>
                                        </div>
                                    )}
                                    {subscription.finance?.amLog?.verificationNote && (
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium text-muted-foreground">Finance AM Note:</p>
                                            <p className="text-sm italic bg-blue-50 p-3 rounded-md">
                                                "{subscription.finance.amLog.verificationNote}"
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
