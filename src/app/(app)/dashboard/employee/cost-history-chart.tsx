
"use client";

import { useMemo, useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Subscription } from "@/lib/types";
import { format, parseISO, subMonths, getYear, getMonth, startOfMonth } from "date-fns";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BarChart as BarChartIcon } from "lucide-react";

const colors = [
    '#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F', 
    '#FFBB28', '#FF8042', '#a4de6c', '#d0ed57', '#ffc658', '#ff7300'
];
const inactiveColor = "hsl(var(--muted))";

interface CostHistoryChartProps {
    subscriptions: Subscription[];
    title: string;
}

export default function CostHistoryChart({ subscriptions, title }: CostHistoryChartProps) {
    const [range, setRange] = useState(12);
    const [activeData, setActiveData] = useState<{ name: string; cost: number } | null>(null);

    const monthlyCostData = useMemo(() => {
        const today = new Date();
        
        const monthObjects = Array.from({ length: range }, (_, i) => {
            const date = subMonths(today, range - 1 - i); 
            return {
                date: startOfMonth(date),
                year: getYear(date),
                month: getMonth(date),
                label: format(date, 'MMM'),
            };
        });

        const data = monthObjects.map(({ year, month, label }) => {
            const totalCost = subscriptions.reduce((acc, sub) => {
                if (sub.paymentDate) {
                    const paymentDate = parseISO(sub.paymentDate);
                    if (getYear(paymentDate) === year && getMonth(paymentDate) === month) {
                        return acc + sub.cost;
                    }
                }
                return acc;
            }, 0);
            return { name: label, cost: totalCost };
        });

        return data;
    }, [subscriptions, range]);
    
    useEffect(() => {
        // Set default active data to the last month with spending
        const lastMonthWithData = [...monthlyCostData].reverse().find(d => d.cost > 0);
        setActiveData(lastMonthWithData || monthlyCostData[monthlyCostData.length - 1] || null);
    }, [monthlyCostData]);

    const handleMouseMove = (state: any) => {
        if (state.isTooltipActive && state.activePayload && state.activePayload.length) {
            setActiveData(state.activePayload[0].payload);
        }
    };

    const handleMouseLeave = () => {
       const lastMonthWithData = [...monthlyCostData].reverse().find(d => d.cost > 0);
       setActiveData(lastMonthWithData || monthlyCostData[monthlyCostData.length - 1] || null);
    };
    
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const cost = payload[0].value;
            return (
                <div className="p-2 bg-background/80 backdrop-blur-sm border rounded-lg shadow-lg">
                    <p className="font-bold">{label}</p>
                    <p className="text-sm">Cost: <span className="font-semibold">${cost.toLocaleString()}</span></p>
                </div>
            );
        }
        return null;
    };

    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <BarChartIcon className="h-5 w-5"/>
                            {title}
                        </CardTitle>
                        <CardDescription>Total subscription costs per month.</CardDescription>
                    </div>
                    <div className="flex gap-2 mt-4 sm:mt-0">
                        {[3, 6, 12].map(r => (
                            <Button
                                key={r}
                                size="sm"
                                variant={range === r ? 'default' : 'outline'}
                                onClick={() => setRange(r)}
                                className="transition-all"
                            >
                                {r}M
                            </Button>
                        ))}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
                <div className="flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={monthlyCostData}
                            margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                            onMouseMove={handleMouseMove}
                            onMouseLeave={handleMouseLeave}
                        >
                            <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={10} className="text-xs" />
                            <YAxis tickLine={false} axisLine={false} tickMargin={10} width={80} className="text-xs" tickFormatter={(value) => `$${value.toLocaleString()}`} domain={[0, 1600]} />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--accent) / 0.1)' }} />
                            <Bar dataKey="cost" radius={[8, 8, 8, 8]} barSize={30} minPointSize={2}>
                                {monthlyCostData.map((entry, index) => (
                                    <Cell 
                                        key={`cell-${index}`} 
                                        fill={entry.cost > 0 ? colors[index % colors.length] : inactiveColor} 
                                        className={cn(
                                            "transition-opacity cursor-pointer",
                                            activeData && activeData.name !== entry.name ? "opacity-30" : "opacity-100"
                                        )}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                 <div className="mt-6 p-4 bg-background rounded-lg border text-center">
                    {activeData ? (
                        <>
                            <p className="text-sm text-muted-foreground">{activeData.name}</p>
                            <p className="text-2xl font-bold">${activeData.cost.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">Total Cost</p>
                        </>
                    ) : (
                         <>
                            <p className="text-sm text-muted-foreground">Hover over a bar</p>
                            <p className="text-2xl font-bold">-</p>
                             <p className="text-xs text-muted-foreground">Total Cost</p>
                        </>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
