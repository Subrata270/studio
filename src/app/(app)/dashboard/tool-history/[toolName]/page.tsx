
"use client";

import { useAppStore } from "@/store/app-store";
import { useMemo, use, useState, useEffect } from "react";
import { notFound } from "next/navigation";
import { BarChart as BarChartIcon, PieChartIcon } from "lucide-react";
import { motion } from "framer-motion";
import AnimatedCircularChart from "../../admin/animated-circular-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { ResponsiveContainer, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, BarChart } from "recharts";
import { ChartTooltipContent } from "@/components/ui/chart";
import { format, parseISO, getYear, startOfYear } from "date-fns";

const colors = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
    '#F49EBC', '#F7C873', '#A1E8A1', '#9AD9F4', '#C3A3F7', '#F4ADA3', '#F7E273'
];

const chartConfig = {
  cost: {
    label: "Cost ($)",
  },
};

export default function ToolHistoryPage({ params }: { params: Promise<{ toolName: string }> }) {
    const { toolName: encodedToolName } = use(params);
    const { subscriptions, currentUser } = useAppStore();
    const toolName = decodeURIComponent(encodedToolName);
    const [activeData, setActiveData] = useState<{ name: string; cost: number } | null>(null);

    const toolSubscriptions = useMemo(() => {
        let filteredSubs = subscriptions.filter(s => s.toolName === toolName && (s.status === 'Active' || s.status === 'Expired' || s.status === 'PaymentCompleted'));

        if (currentUser?.role === 'hod') {
            filteredSubs = filteredSubs.filter(s => s.department === currentUser.department);
        }

        return filteredSubs;
    }, [subscriptions, toolName, currentUser]);
    
    useEffect(() => {
        // Set default active data to the last month with spending
        const lastMonthWithData = [...monthlyCostData].reverse().find(d => d.cost > 0);
        setActiveData(lastMonthWithData || monthlyCostData[monthlyCostData.length - 1] || null);
    }, [toolSubscriptions]);


    if (toolSubscriptions.length === 0) {
        return notFound();
    }

    const totalSpendingData = useMemo(() => {
        const spendingByMonth: { [key: string]: number } = {};

        toolSubscriptions.forEach(sub => {
            if (sub.paymentDate) {
                const month = format(parseISO(sub.paymentDate), 'MMM');
                if (!spendingByMonth[month]) {
                    spendingByMonth[month] = 0;
                }
                spendingByMonth[month] += sub.cost;
            }
        });

        return Object.entries(spendingByMonth).map(([name, count]) => ({ name, count }));
    }, [toolSubscriptions]);

    const monthlyCostData = useMemo(() => {
        const earliestYear = toolSubscriptions.reduce((year, sub) => {
            if (!sub.paymentDate) return year;
            const subYear = getYear(parseISO(sub.paymentDate));
            return Math.min(year, subYear);
        }, getYear(new Date()));

        const allMonths = Array.from({ length: 12 }, (_, i) => {
            const monthDate = new Date(earliestYear, i, 1);
            return format(monthDate, 'MMM yyyy');
        });

        const monthlyCosts: { [key: string]: number } = {};
        toolSubscriptions.forEach(sub => {
            if (sub.paymentDate) {
                const month = format(parseISO(sub.paymentDate), 'MMM yyyy');
                monthlyCosts[month] = (monthlyCosts[month] || 0) + sub.cost;
            }
        });

        return allMonths.map(monthName => {
            const cost = monthlyCosts[monthName] || 0;
            return { name: monthName.split(' ')[0], cost: cost };
        });
    }, [toolSubscriptions]);

    const handleMouseMove = (state: any) => {
        if (state.isTooltipActive && state.activePayload && state.activePayload.length) {
            setActiveData(state.activePayload[0].payload);
        }
    };

    const handleMouseLeave = () => {
       const lastMonthWithData = [...monthlyCostData].reverse().find(d => d.cost > 0);
       setActiveData(lastMonthWithData || monthlyCostData[monthlyCostData.length - 1] || null);
    };

    return (
        <div className="space-y-8">
            <header>
                <h1 className="text-3xl font-bold text-slate-800">Tool Spending History: {toolName}</h1>
                <p className="text-slate-500">A detailed breakdown of monthly and total spending for this tool.</p>
            </header>

            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><PieChartIcon /> Total Spending Breakdown</CardTitle>
                        <CardDescription>Total spending on {toolName} distributed by month.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center">
                        <AnimatedCircularChart data={totalSpendingData} />
                    </CardContent>
                </Card>

                 <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={{
                        visible: {
                            transition: {
                                staggerChildren: 0.1
                            }
                        }
                    }}
                >
                <Card className="h-full flex flex-col">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><BarChartIcon /> Monthly Spending</CardTitle>
                        <CardDescription>Total subscription costs per month for {toolName}.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col">
                       <ChartContainer config={chartConfig} className="h-[350px] w-full">
                         <ResponsiveContainer>
                            <BarChart 
                                data={monthlyCostData}
                                margin={{ top: 20, right: 20, left: -10, bottom: 5 }}
                                onMouseMove={handleMouseMove}
                                onMouseLeave={handleMouseLeave}
                            >
                                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                                <XAxis 
                                    dataKey="name" 
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={10}
                                    className="text-sm"
                                />
                                <YAxis 
                                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                                  tickLine={false}
                                  axisLine={false}
                                  tickMargin={10}
                                  width={80}
                                  className="text-xs"
                                />
                                <Tooltip 
                                    cursor={{ fill: 'hsl(var(--accent) / 0.1)' }} 
                                    content={<ChartTooltipContent formatter={(value: number) => `$${value.toLocaleString()}`} />} 
                                />
                                <Bar dataKey="cost" barSize={30} radius={[8, 8, 8, 8]}>
                                     {monthlyCostData.map((entry, index) => (
                                         <Cell 
                                            key={`cell-${index}`} 
                                            fill={entry.cost > 0 ? colors[index % colors.length] : 'hsl(var(--muted))'}
                                            className="transition-opacity cursor-pointer"
                                         />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                       </ChartContainer>
                       <div className="mt-6 p-4 bg-background rounded-lg border text-center">
                            {activeData ? (
                                <>
                                    <p className="text-sm text-muted-foreground">{activeData.name}</p>
                                    <p className="text-2xl font-bold">${activeData.cost.toLocaleString()}</p>
                                    <p className="text-xs text-muted-foreground">Monthly Cost</p>
                                </>
                            ) : (
                                <>
                                    <p className="text-sm text-muted-foreground">Hover over a bar</p>
                                    <p className="text-2xl font-bold">-</p>
                                    <p className="text-xs text-muted-foreground">Monthly Cost</p>
                                </>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            </div>
        </div>
    )
}
