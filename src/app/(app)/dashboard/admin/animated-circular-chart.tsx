
"use client";

import { motion, useInView, useAnimation } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface ChartDataItem {
    name: string;
    count: number;
}

interface AnimatedCircularChartProps {
    data: ChartDataItem[];
    size?: number;
    strokeWidth?: number;
}

const colors = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
];

export default function AnimatedCircularChart({ data, size = 250, strokeWidth = 25 }: AnimatedCircularChartProps) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });
    const controls = useAnimation();
    
    const totalCount = data.reduce((acc, item) => acc + item.count, 0);
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    let accumulatedOffset = 0;

    useEffect(() => {
        if (isInView) {
            controls.start("visible");
        }
    }, [isInView, controls]);

    return (
        <div className="flex flex-col md:flex-row items-center gap-8">
            <div ref={ref} className="relative cursor-pointer group" style={{ width: size, height: size }}>
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="transparent"
                        stroke="hsl(var(--muted))"
                        strokeWidth={strokeWidth}
                    />
                    {data.map((item, index) => {
                        const percentage = item.count / totalCount;
                        const strokeDashoffset = circumference * (1 - percentage);
                        const rotation = (accumulatedOffset / totalCount) * 360;
                        const color = colors[index % colors.length];
                        accumulatedOffset += item.count;

                        return (
                            <motion.circle
                                key={item.name}
                                cx={size / 2}
                                cy={size / 2}
                                r={radius}
                                fill="transparent"
                                stroke={color}
                                strokeWidth={strokeWidth}
                                strokeDasharray={circumference}
                                strokeDashoffset={strokeDashoffset}
                                initial="hidden"
                                animate={controls}
                                variants={{
                                    hidden: { strokeDashoffset: circumference },
                                    visible: { 
                                        strokeDashoffset: strokeDashoffset, 
                                        transition: { 
                                            duration: 1.5, 
                                            ease: 'easeInOut', 
                                            delay: index * 0.2 
                                        } 
                                    },
                                }}
                                transform={`rotate(-90 ${size / 2} ${size / 2}) rotate(${rotation} ${size / 2} ${size / 2})`}
                                className="transition-all duration-300 group-hover:stroke-[30px] group-hover:opacity-80"
                            />
                        );
                    })}
                </svg>
                 <div className="absolute inset-0 flex items-center justify-center flex-col text-center pointer-events-none">
                    <p className="text-3xl font-bold">{totalCount}</p>
                    <p className="text-sm text-muted-foreground">Total</p>
                </div>
            </div>
            <div className="flex flex-col gap-2">
                {data.map((item, index) => {
                    const percentage = Math.round((item.count / totalCount) * 100);
                     const color = colors[index % colors.length];
                    return (
                        <div key={item.name} className="flex items-center gap-3 text-sm">
                            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
                            <span className="font-medium">{item.name}</span>
                            <span className="text-muted-foreground ml-auto">{item.count} ({percentage}%)</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

