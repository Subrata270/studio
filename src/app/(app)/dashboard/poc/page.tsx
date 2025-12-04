

"use client"

import { useAppStore } from "@/store/app-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format, formatDistanceToNow, differenceInCalendarDays, isToday, formatISO, getDate, getMonth, getYear } from "date-fns";
import { Bell, FileText, Info, Check, X, CalendarCheck } from "lucide-react";
import RenewRequestDialog from "./renew-request-dialog";
import { Button } from "@/components/ui/button";
import NewRequestDialog from "./new-request-dialog";
import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Subscription } from "@/lib/types";
import DeclineDetailsDialog from "./decline-details-dialog";
import POCSubscriptionDetailsDialog from "./subscription-details-dialog";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";

const StatusBadge = ({ status }: { status: string }) => {
    const variant: "default" | "secondary" | "destructive" | "outline" =
        status === 'Active' ? 'default' :
        status === 'Pending' ? 'secondary' :
        status === 'Declined' ? 'destructive' : 'outline';
    
    let colorClass = 'bg-gray-200 text-gray-800';
    if (status === 'Active') colorClass = 'bg-gradient-to-r from-green-400 to-emerald-500 text-white';
    if (status === 'Pending' || status === 'Approved') colorClass = 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white';
    if (status === 'Expired' || status === 'Declined') colorClass = 'bg-gradient-to-r from-red-400 to-rose-500 text-white';


    return <Badge className={`capitalize border-none ${colorClass}`}>{status.toLowerCase()}</Badge>;
};

export default function DepartmentPOCDashboardPage() {
    const { currentUser, subscriptions, triggerRenewalAlert, addSubscriptionRequest, updateSubscriptionDetails } = useAppStore();
    const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);
    const [selectedDeclinedSub, setSelectedDeclinedSub] = useState<Subscription | null>(null);
    const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
    const { toast } = useToast();

    if (!currentUser) return null;

    const departmentSubscriptions = subscriptions.filter(s => s.department === currentUser.department);
    
    const activeSubscriptions = departmentSubscriptions.filter(s => s.status === 'Active');
    const pendingRequests = departmentSubscriptions.filter(s => ['Pending', 'Approved', 'Declined'].includes(s.status));

    const continuationNeeded = useMemo(() => {
        const today = new Date();
        const currentMonthKey = `${getYear(today)}-${getMonth(today)}`;

        return activeSubscriptions.filter(sub => {
            if (!sub.requestDate || sub.status !== 'Active') return false;
            
            const startDate = new Date(sub.requestDate);
            const startDay = getDate(startDate);
            const checkDay = new Date(getYear(today), getMonth(today), startDay - 10);
            
            const isWithinWindow = today >= checkDay && today < new Date(getYear(today), getMonth(today), startDay);

            // Check if a decision has already been made for the current month
            const alreadyHandled = sub.monthlyContinuation && sub.monthlyContinuation[currentMonthKey];

            return isWithinWindow && !alreadyHandled;
        });
    }, [activeSubscriptions]);
    
    const handleContinuation = (subscription: Subscription, decision: 'continue' | 'decline') => {
        const today = new Date();
        const currentMonthKey = `${getYear(today)}-${getMonth(today)}`;

        updateSubscriptionDetails(subscription.id, {
            monthlyContinuation: {
                ...subscription.monthlyContinuation,
                [currentMonthKey]: decision === 'continue' ? 'continued' : 'declined',
            }
        });

        if (decision === 'continue') {
            const renewalRequest = {
                toolName: subscription.toolName,
                duration: 1, // Assuming monthly cycle
                cost: subscription.cost / (subscription.duration || 1), // Estimate monthly cost
                purpose: `Monthly continuation for ${subscription.toolName}.`,
                department: subscription.department,
                vendorName: subscription.vendorName,
                alertDays: subscription.alertDays || 10,
                expiryDate: formatISO(new Date()), // Placeholder, will be updated
                hodId: subscription.hodId!,
            };
            addSubscriptionRequest(renewalRequest);
            toast({
                title: "Continuation Request Sent",
                description: `Your request to continue ${subscription.toolName} has been sent for HOD approval.`,
            });
        } else {
             toast({
                title: "Subscription Declined for this Cycle",
                description: `${subscription.toolName} will not be renewed for this month.`,
                variant: 'destructive'
            });
        }
    };
    
    const renewalAlerts = useMemo(() => {
        return activeSubscriptions.filter(sub => {
            if (!sub.expiryDate) return false;
            const daysLeft = differenceInCalendarDays(new Date(sub.expiryDate), new Date());
            return daysLeft <= (sub.alertDays || 10) && daysLeft >= 0;
        });
    }, [activeSubscriptions]);

    useEffect(() => {
        renewalAlerts.forEach(sub => {
            const todayStr = formatISO(new Date(), { representation: 'date' });
            const lastTriggeredStr = sub.lastAlertTriggered ? formatISO(new Date(sub.lastAlertTriggered), { representation: 'date' }) : null;

            if (lastTriggeredStr !== todayStr) {
                triggerRenewalAlert(sub.id);
            }
        });
    }, [renewalAlerts, triggerRenewalAlert]);

    
    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: (i: number) => ({
            opacity: 1,
            y: 0,
            transition: {
                delay: i * 0.1,
                duration: 0.5,
                ease: "easeOut"
            }
        })
    };

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

    const isRenewable = (sub: Subscription) => {
      if (!sub.expiryDate) return false;
      const daysLeft = differenceInCalendarDays(new Date(sub.expiryDate), new Date());
      if (daysLeft < 0) return true; // Expired
      return daysLeft <= (sub.alertDays || 10);
    };

    const firstRenewal = renewalAlerts[0];

    return (
        <div className="space-y-8">
            <header>
                <h1 className="text-3xl font-bold text-slate-800">Welcome to the Department of POC Dashboard!</h1>
                <p className="text-slate-500">Manage your department's active subscriptions and renewal alerts efficiently.</p>
            </header>
            
            <NewRequestDialog open={isNewRequestOpen} onOpenChange={setIsNewRequestOpen} />
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
                <POCSubscriptionDetailsDialog
                    subscription={selectedSubscription}
                    open={!!selectedSubscription}
                    onOpenChange={(isOpen) => {
                        if (!isOpen) {
                            setSelectedSubscription(null);
                        }
                    }}
                />
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
                <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={0}>
                     <Card className="rounded-2xl bg-[#FFF6EB] border-amber-200/60 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl h-full">
                         {firstRenewal && (
                            <RenewRequestDialog 
                                subscription={firstRenewal} 
                                trigger={
                                    <CardContent className="p-6 flex justify-between items-center cursor-pointer">
                                        <div>
                                            <CardTitle className="flex items-center gap-2 font-bold text-amber-800 text-lg">
                                                <Bell className="h-5 w-5"/>
                                                Renewal Alerts
                                            </CardTitle>
                                            <CardDescription className="mt-2 text-amber-700/80">
                                                Your subscription for <strong>{firstRenewal.toolName}</strong> is expiring {formatDistanceToNow(new Date(firstRenewal.expiryDate!), { addSuffix: true })}. (Alert set for {firstRenewal.alertDays || 10} days)
                                            </CardDescription>
                                        </div>
                                        <Button 
                                            variant="outline"
                                            className="whitespace-nowrap bg-[#1abc9c] border-none text-white hover:bg-[#16a085] transition-all duration-300 shadow-sm hover:shadow-lg"
                                        >
                                            Renew Now
                                        </Button>
                                    </CardContent>
                                } 
                            />
                        )}
                         {!firstRenewal && (
                            <CardContent className="p-6 flex justify-between items-center">
                                <div>
                                    <CardTitle className="flex items-center gap-2 font-bold text-slate-800 text-lg">
                                        <Bell className="h-5 w-5"/>
                                        No Urgent Renewals
                                    </CardTitle>
                                    <CardDescription className="mt-2 text-slate-600">
                                        There are no subscriptions that need renewal in the next 10 days.
                                    </CardDescription>
                                </div>
                            </CardContent>
                        )}
                    </Card>
                </motion.div>

                <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={1}>
                   <Card className="rounded-2xl bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-100 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl h-full">
                        <CardContent className="p-6 flex justify-between items-center">
                            <div>
                                <CardTitle className="flex items-center gap-2 font-bold text-slate-800 text-lg">
                                    <span className="inline-block h-3 w-3 rounded-full bg-primary"></span>
                                    New Subscription Request
                                </CardTitle>
                                <CardDescription className="mt-2 text-slate-600">
                                    Easily request a new software subscription for your department.
                                </CardDescription>
                            </div>
                             <Button 
                                onClick={() => setIsNewRequestOpen(true)} 
                                className="bg-gradient-to-r from-primary to-accent text-white transition-transform duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/30 whitespace-nowrap"
                            >
                                Request Now
                            </Button>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

             {continuationNeeded.length > 0 && (
                <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={0}>
                    <Card className="rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-100 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl h-full">
                        <CardHeader className="flex flex-row items-center gap-4">
                            <CalendarCheck className="h-6 w-6 text-indigo-600"/>
                            <CardTitle className="text-indigo-800">Monthly Continuation Review</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">Please decide whether to continue the following subscriptions for the next cycle.</p>
                            <ul className="space-y-4">
                            {continuationNeeded.map(sub => (
                                <li key={sub.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-sm p-3 bg-white/50 rounded-lg">
                                    <span className="mb-2 sm:mb-0">
                                        Do you want to continue your subscription for <strong>{sub.toolName}</strong> for the next month?
                                    </span>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="outline" className="text-green-600 border-green-600 hover:bg-green-50" onClick={() => handleContinuation(sub, 'continue')}><Check className="mr-2 h-4 w-4"/>Continue</Button>
                                        <Button size="sm" variant="outline" className="text-red-600 border-red-600 hover:bg-red-50" onClick={() => handleContinuation(sub, 'decline')}><X className="mr-2 h-4 w-4"/>Decline</Button>
                                    </div>
                                </li>
                            ))}
                            </ul>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            
                {renewalAlerts.length > 1 && (
                     <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={0}>
                        <Card className="rounded-2xl bg-gradient-to-br from-amber-50 to-orange-100 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl h-full">
                            <CardHeader className="flex flex-row items-center gap-4">
                                <Bell className="h-6 w-6 text-amber-600"/>
                                <CardTitle className="text-amber-800">Other Renewal Alerts</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-3">
                                {renewalAlerts.slice(1).map(sub => (
                                    <li key={sub.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-sm">
                                        <span className="mb-2 sm:mb-0">
                                            Your subscription for <strong>{sub.toolName}</strong> is expiring {formatDistanceToNow(new Date(sub.expiryDate!), { addSuffix: true })}. (Alert set for {sub.alertDays || 10} days)
                                        </span>
                                        <RenewRequestDialog 
                                            subscription={sub} 
                                            trigger={<Button variant="outline" size="sm">Renew Now</Button>} 
                                        />
                                    </li>
                                ))}
                                </ul>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}


            <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={2}>
                <Card className="rounded-2xl shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-slate-800">📋 Department Subscriptions</CardTitle>
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
                                {activeSubscriptions.length > 0 ? activeSubscriptions.map(sub => {
                                    const canRenew = isRenewable(sub);
                                    const daysLeft = sub.expiryDate ? differenceInCalendarDays(new Date(sub.expiryDate), new Date()) : null;
                                    
                                    return (
                                        <TableRow 
                                            key={sub.id}
                                            onClick={() => handleRowClick(sub)}
                                            className="cursor-pointer hover:bg-blue-50/50 transition-colors"
                                        >
                                            <TableCell className="font-medium">{sub.toolName}</TableCell>
                                            <TableCell>${sub.cost.toFixed(2)}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {sub.expiryDate ? formatDistanceToNow(new Date(sub.expiryDate), { addSuffix: true }) : 'N/A'}
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger>
                                                                <Info className="h-4 w-4 text-muted-foreground" />
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>Alert triggers {sub.alertDays || 10} days before expiry.</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </div>
                                            </TableCell>
                                            <TableCell><StatusBadge status={sub.status} /></TableCell>
                                            <TableCell className="text-right">
                                            <RenewRequestDialog 
                                                subscription={sub} 
                                                disabled={!canRenew}
                                                tooltip={!canRenew ? `Available ${daysLeft !== null ? daysLeft - (sub.alertDays || 10) : ''} days before expiry` : undefined}
                                                trigger={
                                                    <Button variant="ghost" size="sm" disabled={!canRenew} className={cn("text-primary hover:bg-primary/10", { "opacity-50 cursor-not-allowed": !canRenew })}>
                                                        Renew
                                                    </Button>
                                                } 
                                            />
                                            </TableCell>
                                        </TableRow>
                                    )
                                }) : <TableRow><TableCell colSpan={5} className="text-center">No active subscriptions found.</TableCell></TableRow>}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </motion.div>
            
            <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={3}>
                <Card className="rounded-2xl shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-slate-800"><FileText /> Pending Requests</CardTitle>
                        <CardDescription>Track the status of your new and renewal requests.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tool</TableHead>
                                    <TableHead>Department</TableHead>
                                    <TableHead>Requested On</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pendingRequests.length > 0 ? pendingRequests.map(sub => (
                                    <TableRow 
                                        key={sub.id}
                                        onClick={() => sub.status === 'Declined' ? handleRowDoubleClick(sub) : handleRowClick(sub)}
                                        className={cn(
                                            'cursor-pointer transition-colors',
                                            sub.status === 'Declined' ? 'hover:bg-red-50/50' : 'hover:bg-blue-50/50'
                                        )}
                                    >
                                        <TableCell className="font-medium">{sub.toolName}</TableCell>
                                        <TableCell>{sub.department}</TableCell>
                                        <TableCell>{format(new Date(sub.requestDate), "PP")}</TableCell>
                                        <TableCell><StatusBadge status={sub.status} /></TableCell>
                                    </TableRow>
                                )) : <TableRow><TableCell colSpan={4} className="text-center">No pending requests found.</TableCell></TableRow>}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </motion.div>

        </div>
    );
}

    