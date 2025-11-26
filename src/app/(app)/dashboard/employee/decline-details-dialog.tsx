
"use client";

import { useAppStore } from "@/store/app-store";
import { Subscription } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { Copy, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DeclineDetailsDialogProps {
  subscription: Subscription;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function DeclineDetailsDialog({
  subscription,
  open,
  onOpenChange,
}: DeclineDetailsDialogProps) {
  const { users } = useAppStore();
  const { toast } = useToast();
  const requester = users.find((u) => u.id === subscription.requestedBy);

  if (!subscription) return null;

  const declineReason = subscription.remarks?.replace("Declined by HOD: ", "") || "No reason provided.";

  const handleCopy = () => {
    navigator.clipboard.writeText(declineReason);
    toast({
      title: "Copied!",
      description: "Decline reason has been copied to your clipboard.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-800 text-xl">
            <XCircle className="text-red-500" />
            Decline Details
          </DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4 text-sm text-slate-600">
          <div className="flex justify-between">
            <span className="font-medium text-slate-700">Tool Name:</span>
            <span>{subscription.toolName}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-slate-700">Requested By:</span>
            <span>{requester?.name || "Unknown"}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-slate-700">Date:</span>
            <span>{subscription.approvalDate ? format(new Date(subscription.approvalDate), "PP") : format(new Date(subscription.requestDate), "PP")}</span>
          </div>
          <div className="space-y-2">
            <p className="font-medium text-slate-700">Reason for Decline:</p>
            <blockquote className="border-l-4 border-red-500 bg-red-50/50 p-3 rounded-r-lg italic text-red-700">
              "{declineReason}"
            </blockquote>
          </div>
        </div>
        <DialogFooter className="sm:justify-between gap-2">
           <Button variant="ghost" size="sm" onClick={handleCopy} className="text-muted-foreground">
             <Copy className="mr-2 h-4 w-4" /> Copy Message
           </Button>
           <Button type="button" onClick={() => onOpenChange(false)} className="bg-gradient-to-r from-primary to-accent text-white transition-transform duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/30">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
