
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Subscription } from "@/lib/types";
import { format } from "date-fns";
import { FileText, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface VendorHistoryProps {
    subscriptions: Subscription[];
}

export default function VendorHistory({ subscriptions }: VendorHistoryProps) {
    if (!subscriptions || subscriptions.length === 0) {
        return null; // Don't render the component if there's no history
    }

    const uniqueTools = Array.from(new Set(subscriptions.map(s => s.toolName)))
        .map(toolName => {
            return subscriptions.find(s => s.toolName === toolName)!;
        });

    return (
        <>
            <Card className="rounded-2xl shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-slate-800"><FileText /> Tool-wise History</CardTitle>
                    <CardDescription>View detailed spending history for each tool.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tool</TableHead>
                                <TableHead>Vendor</TableHead>
                                <TableHead>Department</TableHead>
                                <TableHead>Last Activity</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {uniqueTools.map(sub => (
                                <TableRow key={sub.id}>
                                    <TableCell className="font-medium">{sub.toolName}</TableCell>
                                    <TableCell>{sub.vendorName}</TableCell>
                                    <TableCell>{sub.department}</TableCell>
                                    <TableCell>
                                        {sub.paymentDate ? format(new Date(sub.paymentDate), "PP") : 'N/A'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button asChild variant="ghost" size="sm" className="group">
                                            <Link href={`/dashboard/tool-history/${encodeURIComponent(sub.toolName)}`}>
                                                View History
                                                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                            </Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </>
    );
}
