
"use client";

import SubscriptionHistory from "@/app/(app)/components/subscription-history";
import { useAppStore } from "@/store/app-store";
import { motion } from "framer-motion";
import { useState } from "react";
import { Subscription } from "@/lib/types";
import DeclineDetailsDialog from "../decline-details-dialog";
import POCSubscriptionDetailsDialog from "../subscription-details-dialog";


export default function EmployeeReportsPage() {
    const { currentUser, subscriptions } = useAppStore();
    const [selectedDeclinedSub, setSelectedDeclinedSub] = useState<Subscription | null>(null);
    const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);

    if (!currentUser) return null;

    const departmentSubscriptions = subscriptions.filter(s => s.department === currentUser.department);

    const approvedHistory = departmentSubscriptions.filter(s => s.status === 'Approved' || s.status === 'Active' || s.status === 'Expired');
    const declinedHistory = departmentSubscriptions.filter(s => s.status === 'Declined');

    const handleDeclineClick = (sub: Subscription) => {
        setSelectedDeclinedSub(sub);
    };

    const handleApproveClick = (sub: Subscription) => {
        setSelectedSubscription(sub);
    };

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
        <div className="space-y-8">
             <header>
                <h1 className="text-3xl font-bold text-slate-800">Subscription Reports</h1>
                <p className="text-slate-500">View historical data for approved and declined subscriptions in your department.</p>
            </header>

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

            <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={0}>
                <SubscriptionHistory
                    approvedHistory={approvedHistory}
                    declinedHistory={declinedHistory}
                    onDeclineDoubleClick={handleDeclineClick}
                    onApproveDoubleClick={handleApproveClick}
                />
            </motion.div>
        </div>
    )
}
