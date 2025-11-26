

"use client";

import { useAppStore } from "@/store/app-store";
import { useMemo } from "react";
import { motion } from "framer-motion";
import DepartmentUsageChart from "../../../dashboard/employee/department-usage-chart";
import VendorHistory from "../../../dashboard/employee/vendor-history";
import CostHistoryChart from "../../../dashboard/employee/cost-history-chart";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

export default function HODHistoryPage() {
    const { subscriptions, currentUser } = useAppStore();

    const departmentSubscriptions = useMemo(() => {
        if (!currentUser) return [];
        return subscriptions.filter(s => s.department === currentUser.department);
    }, [subscriptions, currentUser]);

    const departmentUsageData = useMemo(() => {
        const usage = subscriptions.reduce((acc, sub) => {
            if (!acc[sub.department]) {
                acc[sub.department] = { name: sub.department, count: 0 };
            }
            acc[sub.department].count++;
            return acc;
        }, {} as Record<string, { name: string, count: number }>);
        return Object.values(usage);
    }, [subscriptions]);
    
    return (
        <div className="space-y-8">
             <header>
                <h1 className="text-3xl font-bold text-slate-800">Department Spending History</h1>
                <p className="text-slate-500">A detailed breakdown of monthly spending for your department.</p>
            </header>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle>Department-wise Tool Usage</CardTitle>
                            <CardDescription>Overall distribution of subscriptions. Click to see detailed history.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex items-center justify-center">
                            <DepartmentUsageChart data={departmentUsageData} />
                        </CardContent>
                    </Card>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                <CostHistoryChart subscriptions={departmentSubscriptions} title="Overall Monthly Spending" />
                </motion.div>
            </div>
             <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
            >
                <VendorHistory subscriptions={departmentSubscriptions.filter(s => s.status === 'Active' || s.status === 'Expired')} />
            </motion.div>
        </div>
    );
}
