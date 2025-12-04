"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Subscription } from "@/lib/types";
import { useAppStore } from "@/store/app-store";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, DollarSign, FileText, User, MapPin, Clock, CreditCard, Hash, Building2, Receipt } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SubscriptionDetailsDialogProps {
    subscription: Subscription | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function HODSubscriptionDetailsDialog({ subscription, open, onOpenChange }: SubscriptionDetailsDialogProps) {
    const { users } = useAppStore();

    if (!subscription) return null;

    const getUserName = (userId: string | undefined) => {
        if (!userId) return 'N/A';
        return users.find(u => u.id === userId)?.name || 'Unknown User';
    };

    const pocName = getUserName(subscription.requestedBy);
    const approverName = getUserName(subscription.approvedBy);
    const amVerifierName = subscription.finance?.amLog?.by ? getUserName(subscription.finance.amLog.by) : 'N/A';
    const apaExecutorName = subscription.finance?.apaExecution?.by ? getUserName(subscription.finance.apaExecution.by) : 'N/A';

    // Calculate subscription period
    const startDate = subscription.approvalDate || subscription.requestDate;
    const endDate = subscription.expiryDate;
    const dayLimit = subscription.duration * 30; // Approximate days

    // Payment information
    const paymentInfo = subscription.finance?.apaExecution;
    const invoiceNumber = paymentInfo?.invoiceNumber || subscription.invoiceNumber || 'N/A';
    const paymentDate = paymentInfo?.at ? new Date(paymentInfo.at) : (subscription.paymentDate ? new Date(subscription.paymentDate) : null);
    const transactionId = paymentInfo?.transactionId || subscription.transactionId || 'N/A';
    const amountPaid = paymentInfo?.amountPaid || subscription.cost;
    const currency = paymentInfo?.currency || 'USD';
    const paymentMethod = paymentInfo?.paymentType || subscription.paymentMode || 'N/A';

    const getBudgetInfo = () => {
        if (subscription.finance?.amLog) {
            return {
                planned: `${subscription.finance.amLog.plannedAmount.toFixed(2)} ${subscription.finance.amLog.plannedCurrency}`,
                actual: paymentInfo ? `${paymentInfo.amountPaid.toFixed(2)} ${paymentInfo.currency}` : 'Pending',
            };
        }
        return {
            planned: `${subscription.cost.toFixed(2)} USD`,
            actual: paymentInfo ? `${paymentInfo.amountPaid.toFixed(2)} ${paymentInfo.currency}` : 'N/A',
        };
    };

    const budget = getBudgetInfo();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        <FileText className="h-6 w-6 text-primary" />
                        <span className="font-mono text-primary">[{subscription.id}]</span> {subscription.toolName}
                    </DialogTitle>
                    <DialogDescription>
                        Complete subscription and payment information
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="max-h-[70vh] pr-4">
                    <div className="space-y-6">
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
                                    <p className="text-sm text-muted-foreground">Status</p>
                                    <Badge variant={subscription.status === 'Active' ? 'default' : 'secondary'}>
                                        {subscription.status}
                                    </Badge>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Request Type</p>
                                    <Badge variant="outline">{subscription.typeOfRequest || 'N/A'}</Badge>
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
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                                        <Clock className="h-4 w-4" />
                                        Frequency
                                    </p>
                                    <p className="font-semibold">{subscription.frequencyNew || subscription.frequency || 'N/A'}</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Payment Information */}
                        <Card className="border-primary/20 bg-primary/5">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <DollarSign className="h-5 w-5" />
                                    Payment Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        Payment Date
                                    </p>
                                    <p className="font-semibold">
                                        {paymentDate ? format(paymentDate, "PPP") : 'N/A'}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                                        <Receipt className="h-4 w-4" />
                                        Invoice Number
                                    </p>
                                    <p className="font-semibold">{invoiceNumber}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                                        <Hash className="h-4 w-4" />
                                        Transaction ID
                                    </p>
                                    <p className="font-semibold text-xs break-all">{transactionId}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                                        <CreditCard className="h-4 w-4" />
                                        Payment Method
                                    </p>
                                    <p className="font-semibold">{paymentMethod}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                                        <DollarSign className="h-4 w-4" />
                                        Amount Paid
                                    </p>
                                    <p className="font-bold text-lg text-primary">
                                        {amountPaid.toFixed(2)} {currency}
                                    </p>
                                </div>
                                {paymentInfo?.exchangeRate && (
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">Exchange Rate</p>
                                        <p className="font-semibold">1 USD = {paymentInfo.exchangeRate} INR</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Budget Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <DollarSign className="h-5 w-5" />
                                    Budget Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Planned Budget</p>
                                    <p className="font-bold text-lg text-blue-600">{budget.planned}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Actual Spend</p>
                                    <p className="font-bold text-lg text-green-600">{budget.actual}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Original Request Cost</p>
                                    <p className="font-semibold">${subscription.cost.toFixed(2)}</p>
                                </div>
                                {subscription.baseMonthlyUSD && (
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">Base Monthly (USD)</p>
                                        <p className="font-semibold">${subscription.baseMonthlyUSD.toFixed(2)}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* People & Roles */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <User className="h-5 w-5" />
                                    People & Responsibilities
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                                        <User className="h-4 w-4" />
                                        POC (Requester)
                                    </p>
                                    <p className="font-semibold">{pocName}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                                        <User className="h-4 w-4" />
                                        HOD (Approver)
                                    </p>
                                    <p className="font-semibold">{approverName}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                                        <User className="h-4 w-4" />
                                        Finance AM (Verifier)
                                    </p>
                                    <p className="font-semibold">{amVerifierName}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                                        <User className="h-4 w-4" />
                                        Finance APA (Executor)
                                    </p>
                                    <p className="font-semibold">{apaExecutorName}</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Additional Notes */}
                        {(subscription.remarks || subscription.finance?.amLog?.verificationNote || paymentInfo?.notes) && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Notes & Remarks</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {subscription.remarks && (
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium text-muted-foreground">HOD Remarks:</p>
                                            <p className="text-sm italic bg-muted/50 p-3 rounded-md">"{subscription.remarks}"</p>
                                        </div>
                                    )}
                                    {subscription.finance?.amLog?.verificationNote && (
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium text-muted-foreground">AM Verification Note:</p>
                                            <p className="text-sm italic bg-blue-50 p-3 rounded-md">"{subscription.finance.amLog.verificationNote}"</p>
                                        </div>
                                    )}
                                    {paymentInfo?.notes && (
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium text-muted-foreground">APA Payment Notes:</p>
                                            <p className="text-sm italic bg-green-50 p-3 rounded-md">"{paymentInfo.notes}"</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Invoice & Receipt Links */}
                        {(subscription.invoiceUrl || paymentInfo?.receiptUrl) && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Documents</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {subscription.invoiceUrl && (
                                        <a 
                                            href={subscription.invoiceUrl} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 text-blue-600 hover:underline"
                                        >
                                            <FileText className="h-4 w-4" />
                                            View Invoice
                                        </a>
                                    )}
                                    {paymentInfo?.receiptUrl && (
                                        <a 
                                            href={paymentInfo.receiptUrl} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 text-blue-600 hover:underline"
                                        >
                                            <Receipt className="h-4 w-4" />
                                            View Payment Receipt
                                        </a>
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
