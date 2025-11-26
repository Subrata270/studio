

"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Subscription } from "@/lib/types";
import { useAppStore } from "@/store/app-store";
import { format } from "date-fns";
import { CheckCircle, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SubscriptionHistoryProps {
    approvedHistory: Subscription[];
    declinedHistory: Subscription[];
    onDeclineDoubleClick?: (subscription: Subscription) => void;
    onApproveDoubleClick?: (subscription: Subscription) => void;
}

export default function SubscriptionHistory({ approvedHistory, declinedHistory, onDeclineDoubleClick, onApproveDoubleClick }: SubscriptionHistoryProps) {
    const { users } = useAppStore();
    const getUserName = (userId: string) => users.find(u => u.id === userId)?.name || 'N/A';

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

    return (
        <div className="mt-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Subscription History</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={0}>
                    <Card className="rounded-2xl shadow-lg bg-green-50/50 border-green-200/60 h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-green-800">
                                <CheckCircle /> Approved History
                            </CardTitle>
                            <CardDescription>A log of all approved and active subscriptions.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[300px]">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Tool</TableHead>
                                            <TableHead>Approved By</TableHead>
                                            <TableHead>Date</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {approvedHistory.length > 0 ? approvedHistory.map(sub => (
                                            <TableRow 
                                                key={sub.id}
                                                onDoubleClick={() => onApproveDoubleClick?.(sub)}
                                                className={cn(onApproveDoubleClick && 'cursor-pointer hover:bg-green-100/50')}
                                            >
                                                <TableCell className="font-medium">{sub.toolName}</TableCell>
                                                <TableCell>{getUserName(sub.approvedBy || '')}</TableCell>
                                                <TableCell>{format(new Date(sub.approvalDate || sub.requestDate), "PP")}</TableCell>
                                            </TableRow>
                                        )) : <TableRow><TableCell colSpan={3} className="text-center">No approved history.</TableCell></TableRow>}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                            {approvedHistory.length > 5 && <Button variant="link" className="mt-4">View All History</Button>}
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={1}>
                     <Card className="rounded-2xl shadow-lg bg-red-50/50 border-red-200/60 h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-red-800">
                                <XCircle /> Declined History
                            </CardTitle>
                            <CardDescription>A log of all declined subscription requests.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <ScrollArea className="h-[300px]">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Tool</TableHead>
                                            <TableHead>Declined By</TableHead>
                                            <TableHead>Date</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {declinedHistory.length > 0 ? declinedHistory.map(sub => (
                                            <TableRow 
                                                key={sub.id} 
                                                onDoubleClick={() => onDeclineDoubleClick?.(sub)}
                                                className={cn(
                                                    onDeclineDoubleClick && 'cursor-pointer hover:bg-red-100/50'
                                                )}
                                            >
                                                <TableCell className="font-medium">{sub.toolName}</TableCell>
                                                <TableCell>{sub.approvedBy ? getUserName(sub.approvedBy) : 'N/A'}</TableCell>
                                                <TableCell>{format(new Date(sub.approvalDate || sub.requestDate), "PP")}</TableCell>
                                            </TableRow>
                                        )) : <TableRow><TableCell colSpan={3} className="text-center">No declined history.</TableCell></TableRow>}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                            {declinedHistory.length > 5 && <Button variant="link" className="mt-4">View All History</Button>}
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    )
}
