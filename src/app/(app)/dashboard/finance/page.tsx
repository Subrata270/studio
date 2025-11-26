

"use client"

import { useAppStore } from "@/store/app-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, formatDistanceToNow, formatISO } from "date-fns";
import { AlertTriangle, Check, CheckCircle, Forward, History, Hourglass, Send, Wallet, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import { Subscription } from "@/lib/types";
import SubscriptionHistory from "../../components/subscription-history";
import DeclineDetailsDialog from "../employee/decline-details-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

const paymentExecutionSchema = z.object({
    paymentType: z.string().min(1, "Payment type is required"),
    paymentDate: z.date({ required_error: "Payment date is required" }),
    transactionId: z.string().min(1, "Transaction ID is required"),
    amountPaid: z.coerce.number().min(0.01, "Amount must be positive"),
    currency: z.enum(['USD', 'INR']),
    exchangeRate: z.coerce.number().optional(),
    receiptUrl: z.any().refine(files => files?.length > 0, "A receipt attachment is required."),
    notes: z.string().optional(),
    invoiceNumber: z.string().min(1, 'Invoice Number is required')
});

const APAPaymentExecutionDialog = ({ subscription, open, onOpenChange }: { subscription: Subscription; open: boolean; onOpenChange: (open: boolean) => void; }) => {
    const { currentUser, markAsPaid } = useAppStore();
    const { toast } = useToast();

    const form = useForm<z.infer<typeof paymentExecutionSchema>>({
        resolver: zodResolver(paymentExecutionSchema),
        defaultValues: {
            paymentType: subscription.finance?.amLog?.recommendedPaymentType || 'Corporate Card',
            paymentDate: new Date(),
            transactionId: '',
            invoiceNumber: '',
            amountPaid: subscription.finance?.amLog?.plannedAmount || subscription.cost,
            currency: subscription.finance?.amLog?.plannedCurrency || 'USD',
            exchangeRate: 83,
            notes: '',
        }
    });

    const onSubmit = (values: z.infer<typeof paymentExecutionSchema>) => {
        if (!currentUser) return;
        markAsPaid(subscription.id, currentUser.id, values);
        toast({
            title: "Payment Recorded",
            description: `Payment for ${subscription.toolName} has been successfully recorded.`
        })
        onOpenChange(false);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>APA - Payment Log Form</DialogTitle>
                    <DialogDescription>Manually execute payment, then record the details here. This completes the request.</DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[70vh] pr-4">
                <div className="text-sm space-y-2 p-3 my-4 bg-muted/50 rounded-lg border">
                    <p><strong>Tool:</strong> {subscription.toolName}</p>
                    <p><strong>AM Note:</strong> <em className="text-muted-foreground">"{subscription.finance?.amLog?.verificationNote}"</em></p>
                    <p><strong>Planned Amount:</strong> {subscription.finance?.amLog?.plannedAmount} {subscription.finance?.amLog?.plannedCurrency}</p>
                </div>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="paymentType" render={({ field }) => (
                                <FormItem><FormLabel>Payment Method</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                                        <SelectItem value="NEFT/RTGS">NEFT/RTGS</SelectItem>
                                        <SelectItem value="Cheque">Cheque</SelectItem>
                                        <SelectItem value="Corporate Card">Corporate Card</SelectItem>
                                        <SelectItem value="Online Gateway">Online Gateway</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage /></FormItem>
                            )}/>
                             <FormField control={form.control} name="paymentDate" render={({ field }) => (
                                <FormItem><FormLabel>Payment Date</FormLabel>
                                <Popover><PopoverTrigger asChild><FormControl>
                                    <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                    {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover>
                                <FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name="transactionId" render={({ field }) => (
                                <FormItem><FormLabel>Transaction / Reference ID</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                             <div className="flex items-end gap-2">
                                <FormField control={form.control} name="amountPaid" render={({ field }) => (
                                    <FormItem className="flex-1"><FormLabel>Amount Paid</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name="currency" render={({ field }) => (
                                    <FormItem><Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger className="w-[80px]"><SelectValue /></SelectTrigger></FormControl>
                                        <SelectContent><SelectItem value="USD">USD</SelectItem><SelectItem value="INR">INR</SelectItem></SelectContent>
                                    </Select></FormItem>
                                )}/>
                             </div>
                             {form.watch('currency') === 'INR' && <FormField control={form.control} name="exchangeRate" render={({ field }) => (
                                <FormItem><FormLabel>Exchange Rate Used</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>}
                            <FormField control={form.control} name="invoiceNumber" render={({ field }) => (
                                <FormItem><FormLabel>Invoice Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name="receiptUrl" render={({ field }) => (
                                <FormItem className="col-span-2"><FormLabel>Payment Receipt / Screenshot</FormLabel><FormControl><Input type="file" {...field} value={undefined} /></FormControl><FormMessage /></FormItem>
                            )}/>
                             <FormField control={form.control} name="notes" render={({ field }) => (
                                <FormItem className="col-span-2"><FormLabel>Notes / Accounting Reference (Optional)</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                        </div>
                        <DialogFooter className="pt-4">
                            <Button variant="ghost" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
                            <Button type="submit"><Check className="mr-2 h-4 w-4" />Save Payment Log & Mark as Completed</Button>
                        </DialogFooter>
                    </form>
                </Form>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
};

const amLogSchema = z.object({
    verificationNote: z.string().min(10, 'Note must be at least 10 characters.'),
    recommendedPaymentType: z.string().min(1, "Please recommend a payment type."),
    suggestedPaymentAccount: z.string().optional(),
    plannedAmount: z.coerce.number().min(0.01, "Amount must be positive."),
    plannedCurrency: z.enum(['USD', 'INR']),
    plannedDate: z.date({ required_error: 'Planned payment date is required.' }),
    attachments: z.any().optional(),
});


const AMLogDialog = ({ subscription, open, onOpenChange }: { subscription: Subscription; open: boolean; onOpenChange: (open: boolean) => void; }) => {
    const { currentUser, submitAMLog } = useAppStore();
    const { toast } = useToast();
    const [isVerifyOpen, setIsVerifyOpen] = useState(false);

    const form = useForm<z.infer<typeof amLogSchema>>({
        resolver: zodResolver(amLogSchema),
        defaultValues: {
            verificationNote: '',
            recommendedPaymentType: 'Corporate Card',
            suggestedPaymentAccount: '',
            plannedAmount: subscription.cost,
            plannedCurrency: 'USD',
            plannedDate: new Date(),
        }
    });
    
    const handleSubmitAndVerify = () => {
        // Manually trigger validation
        form.trigger().then(isValid => {
            if (isValid) {
                setIsVerifyOpen(true);
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Validation Error',
                    description: 'Please fill all required fields before submitting.'
                })
            }
        });
    }

    const onConfirmVerify = () => {
        if (!currentUser) return;
        submitAMLog(subscription.id, form.getValues());
        toast({
            title: "Request verified and sent to Finance APA for payment.",
        })
        setIsVerifyOpen(false);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>AM - Payment Log (Verification)</DialogTitle>
                    <DialogDescription>Verify the request and provide payment details. This will be sent back to APA for final execution.</DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[70vh] pr-4">
                    <div className="grid grid-cols-2 gap-8">
                        <div className="text-sm space-y-3 p-3 my-4 bg-muted/50 rounded-lg border">
                           <p><strong>Tool:</strong> {subscription.toolName}</p>
                           <p><strong>Vendor:</strong> {subscription.vendorName}</p>
                           <p><strong>Department:</strong> {subscription.department}</p>
                           <p><strong>Requested Cost:</strong> <span className="font-bold">${subscription.cost.toFixed(2)}</span></p>
                           <p><strong>HOD Note:</strong> <em className="text-muted-foreground">"{subscription.remarks}"</em></p>
                        </div>
                        <Form {...form}>
                            <form className="space-y-4">
                                <FormField control={form.control} name="verificationNote" render={({ field }) => (
                                    <FormItem><FormLabel>AM Verification Note</FormLabel><FormControl><Textarea {...field} placeholder="e.g., Verified invoice, vendor details are correct..."/></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name="recommendedPaymentType" render={({ field }) => (
                                    <FormItem><FormLabel>Recommended Payment Type</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                                            <SelectItem value="NEFT/RTGS">NEFT/RTGS</SelectItem>
                                            <SelectItem value="Cheque">Cheque</SelectItem>
                                            <SelectItem value="Corporate Card">Corporate Card</SelectItem>
                                            <SelectItem value="Online Gateway">Online Gateway</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage /></FormItem>
                                )}/>
                                <div className="flex items-end gap-2">
                                    <FormField control={form.control} name="plannedAmount" render={({ field }) => (
                                        <FormItem className="flex-1"><FormLabel>Planned Amount</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                    )}/>
                                     <FormField control={form.control} name="plannedCurrency" render={({ field }) => (
                                        <FormItem><Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger className="w-[80px]"><SelectValue /></SelectTrigger></FormControl>
                                            <SelectContent><SelectItem value="USD">USD</SelectItem><SelectItem value="INR">INR</SelectItem></SelectContent>
                                        </Select></FormItem>
                                    )}/>
                                </div>
                                <FormField control={form.control} name="plannedDate" render={({ field }) => (
                                    <FormItem><FormLabel>Planned Payment Date</FormLabel>
                                    <Popover><PopoverTrigger asChild><FormControl>
                                        <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover>
                                    <FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name="attachments" render={({ field }) => (
                                    <FormItem><FormLabel>Attachments (Invoices, etc.)</FormLabel><FormControl><Input type="file" multiple /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <DialogFooter className="pt-4">
                                    <Button variant="ghost" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
                                    <Button type="button" onClick={handleSubmitAndVerify}><Send className="mr-2 h-4 w-4" />Verify & Send to APA for Payment</Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </div>
                </ScrollArea>
                <Dialog open={isVerifyOpen} onOpenChange={setIsVerifyOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Confirm Verification</DialogTitle>
                            <DialogDescription>You are about to verify this subscription request. After verification, this request will be forwarded to the Finance APA team for manual payment processing.</DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setIsVerifyOpen(false)}>Cancel</Button>
                            <Button onClick={onConfirmVerify}>Confirm & Forward</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </DialogContent>
        </Dialog>
    );
};


const APAApprovalActions = ({ subscription }: { subscription: Subscription }) => {
    const { currentUser, forwardToAM, updateSubscriptionStatus } = useAppStore();
    const [isDeclineOpen, setIsDeclineOpen] = useState(false);
    const [declineReason, setDeclineReason] = useState("");

    const handleForward = () => {
        if (!currentUser) return;
        forwardToAM(subscription.id, currentUser.id);
    };

    const handleDecline = () => {
        if (!currentUser) return;
        updateSubscriptionStatus(subscription.id, 'Declined', `Declined by Finance (APA): ${declineReason}`);
        setIsDeclineOpen(false);
    };

    return (
        <div className="flex gap-2 justify-end">
            <Button size="sm" variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50 hover:text-blue-700" onClick={handleForward}>
                <Forward className="mr-2 h-4 w-4" />Forward to AM
            </Button>
            <Dialog open={isDeclineOpen} onOpenChange={setIsDeclineOpen}>
                <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700">
                        <XCircle className="mr-2 h-4 w-4" />Decline
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Decline Finance Request</DialogTitle>
                        <DialogDescription>Provide a reason for declining this request.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <Label htmlFor="decline-reason">Reason for Decline</Label>
                        <Textarea id="decline-reason" value={declineReason} onChange={(e) => setDeclineReason(e.target.value)} placeholder="e.g., Budget issues, incorrect invoice, etc." />
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsDeclineOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDecline} disabled={!declineReason}>Confirm Decline</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};


export default function FinanceDashboardPage() {
    const { currentUser, subscriptions, users } = useAppStore();
    const [selectedDeclinedSub, setSelectedDeclinedSub] = useState<Subscription | null>(null);
    const [paymentSub, setPaymentSub] = useState<Subscription | null>(null);
    const [amLogSub, setAmLogSub] = useState<Subscription | null>(null);

    if (!currentUser || currentUser.role !== 'finance') return null;

    const isApa = currentUser.subrole === 'apa';
    const isAm = currentUser.subrole === 'am';

    const requestsForApaApproval = subscriptions.filter(s => s.status === 'Approved');
    const requestsForApaExecution = subscriptions.filter(s => s.status === 'VerifiedByAM');
    const requestsForAmVerification = subscriptions.filter(s => s.status === 'ForwardedToAM');
    
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcomingRenewals = subscriptions.filter(s => s.status === 'Active' && s.expiryDate && new Date(s.expiryDate) <= nextWeek && new Date(s.expiryDate) > now);
    
    const paymentHistory = subscriptions.filter(s => s.status === 'PaymentCompleted' || s.status === 'Active' || s.status === 'Expired');
    const declinedHistory = subscriptions.filter(s => s.status === 'Declined');

    const getUserName = (userId: string) => users.find(u => u.id === userId)?.name || 'Unknown';
    
    const handleRowDoubleClick = (sub: Subscription) => {
        if (sub.status === 'Declined') {
            setSelectedDeclinedSub(sub);
        } else if (isAm && sub.status === 'ForwardedToAM') {
            setAmLogSub(sub);
        } else if (isApa && sub.status === 'VerifiedByAM') {
            setPaymentSub(sub);
        }
    };
    
    const handleOpenPaymentDialog = (sub: Subscription) => setPaymentSub(sub);
    const handleOpenAMLogDialog = (sub: Subscription) => setAmLogSub(sub);


    return (
        <div className="space-y-8">
            <header className="text-center md:text-left">
                <h1 className="text-2xl md:text-3xl font-bold">Welcome, Finance Team ({currentUser.subrole?.toUpperCase()})</h1>
                <p className="text-muted-foreground mt-1">Manage your department’s subscriptions, approvals, and renewals efficiently.</p>
            </header>

            {selectedDeclinedSub && <DeclineDetailsDialog subscription={selectedDeclinedSub} open={!!selectedDeclinedSub} onOpenChange={(isOpen) => !isOpen && setSelectedDeclinedSub(null)} />}
            {paymentSub && <APAPaymentExecutionDialog subscription={paymentSub} open={!!paymentSub} onOpenChange={(isOpen) => !isOpen && setPaymentSub(null)} />}
            {amLogSub && <AMLogDialog subscription={amLogSub} open={!!amLogSub} onOpenChange={(isOpen) => !isOpen && setAmLogSub(null)} />}
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mt-6">
                <Card className="bg-gradient-to-br from-blue-100 to-blue-200">
                    <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">APA Pending Approval</CardTitle><Hourglass className="h-4 w-4 text-blue-800" /></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{requestsForApaApproval.length}</div><p className="text-xs text-muted-foreground">Requests awaiting APA review.</p></CardContent>
                </Card>
                 <Card className="bg-gradient-to-br from-cyan-100 to-cyan-200">
                    <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">AM Pending Verification</CardTitle><Forward className="h-4 w-4 text-cyan-800" /></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{requestsForAmVerification.length}</div><p className="text-xs text-muted-foreground">Requests for AM to verify.</p></CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-100 to-purple-200">
                    <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">APA Pending Execution</CardTitle><Wallet className="h-4 w-4 text-purple-800" /></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{requestsForApaExecution.length}</div><p className="text-xs text-muted-foreground">Requests awaiting payment.</p></CardContent>
                </Card>
                 <Card className="bg-gradient-to-br from-amber-100 to-amber-200">
                    <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Upcoming Renewals</CardTitle><AlertTriangle className="h-4 w-4 text-amber-800" /></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{upcomingRenewals.length}</div><p className="text-xs text-muted-foreground">In the next 7 days.</p></CardContent>
                </Card>
            </div>

            {isApa && (
                <>
                <Card className="rounded-2xl shadow-lg">
                    <CardHeader>
                        <CardTitle>APA Queue - New Requests from HODs</CardTitle>
                        <CardDescription>Requests approved by HODs and awaiting your finance verification.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader><TableRow><TableHead>Tool</TableHead><TableHead>Department</TableHead><TableHead>Cost</TableHead><TableHead>HOD</TableHead><TableHead>Requested</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {requestsForApaApproval.length > 0 ? requestsForApaApproval.map(sub => (
                                    <TableRow key={sub.id}>
                                        <TableCell className="font-medium">{sub.toolName}</TableCell>
                                        <TableCell>{sub.department}</TableCell>
                                        <TableCell>${sub.cost.toFixed(2)}</TableCell>
                                        <TableCell>{sub.approvedBy ? getUserName(sub.approvedBy) : 'N/A'}</TableCell>
                                        <TableCell>{formatDistanceToNow(new Date(sub.requestDate), { addSuffix: true })}</TableCell>
                                        <TableCell className="text-right"><APAApprovalActions subscription={sub} /></TableCell>
                                    </TableRow>
                                )) : <TableRow><TableCell colSpan={6} className="text-center h-24">No new requests awaiting your approval.</TableCell></TableRow>}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                 <Card className="rounded-2xl shadow-lg">
                    <CardHeader><CardTitle>APA Queue - Pending Payment Execution</CardTitle><CardDescription>Requests verified by AM and ready for final manual payment.</CardDescription></CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader><TableRow><TableHead>Tool</TableHead><TableHead>Department</TableHead><TableHead>Planned Cost</TableHead><TableHead>AM Verifier</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {requestsForApaExecution.length > 0 ? requestsForApaExecution.map(sub => (
                                    <TableRow key={sub.id} onDoubleClick={() => handleRowDoubleClick(sub)} className="cursor-pointer hover:bg-muted/50">
                                        <TableCell className="font-medium">{sub.toolName}</TableCell>
                                        <TableCell>{sub.department}</TableCell>
                                        <TableCell>${sub.finance?.amLog?.plannedAmount.toFixed(2)} {sub.finance?.amLog?.plannedCurrency}</TableCell>
                                        <TableCell>{sub.finance?.amLog?.by ? getUserName(sub.finance.amLog.by) : 'N/A'}</TableCell>
                                        <TableCell className="text-right">
                                            <Button size="sm" className="bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:scale-105 transition-transform" onClick={() => handleOpenPaymentDialog(sub)}>
                                                Record Payment
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )) : <TableRow><TableCell colSpan={5} className="text-center h-24">No payments pending execution.</TableCell></TableRow>}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                </>
            )}

            {isAm && (
                 <Card className="rounded-2xl shadow-lg">
                    <CardHeader><CardTitle>AM Queue - Payment Verification</CardTitle><CardDescription>Requests forwarded by APA for your review and payment planning.</CardDescription></CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader><TableRow><TableHead>Tool</TableHead><TableHead>Department</TableHead><TableHead>Cost</TableHead><TableHead>APA Forwarder</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {requestsForAmVerification.length > 0 ? requestsForAmVerification.map(sub => (
                                    <TableRow key={sub.id} onDoubleClick={() => handleRowDoubleClick(sub)} className="cursor-pointer hover:bg-muted/50">
                                        <TableCell className="font-medium">{sub.toolName}</TableCell>
                                        <TableCell>{sub.department}</TableCell>
                                        <TableCell>${sub.cost.toFixed(2)}</TableCell>
                                        <TableCell>{sub.apaApproverId ? getUserName(sub.apaApproverId) : 'N/A'}</TableCell>
                                        <TableCell className="text-right">
                                            <Button size="sm" onClick={() => handleOpenAMLogDialog(sub)}>Fill Payment Log</Button>
                                        </TableCell>
                                    </TableRow>
                                )) : <TableRow><TableCell colSpan={5} className="text-center h-24">No requests pending your verification.</TableCell></TableRow>}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            <SubscriptionHistory
                approvedHistory={paymentHistory}
                declinedHistory={declinedHistory}
                onDeclineDoubleClick={handleRowDoubleClick}
            />
        </div>
    );
}

    