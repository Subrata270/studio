
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
import { Copy, XCircle, Calendar, DollarSign, FileText, User, MapPin, Clock, Building2, AlertTriangle, Hash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

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

  if (!subscription) return null;

  const getUserName = (userId: string | undefined) => {
    if (!userId) return 'N/A';
    return users.find(u => u.id === userId)?.name || 'Unknown User';
  };

  const pocName = getUserName(subscription.requestedBy);
  const approverName = getUserName(subscription.approvedBy);
  const hodName = getUserName(subscription.hodId);

  // Extract decline reason
  const declineReason = subscription.remarks?.replace("Declined by HOD: ", "").replace("Declined by Finance (APA): ", "") || "No reason provided.";
  const declinedBy = subscription.remarks?.includes("Finance (APA)") ? "Finance APA" : "HOD";

  // Calculate subscription period
  const startDate = subscription.requestDate;
  const endDate = subscription.expiryDate;
  const dayLimit = subscription.duration * 30; // Approximate days

  const handleCopy = () => {
    navigator.clipboard.writeText(declineReason);
    toast({
      title: "Copied!",
      description: "Decline reason has been copied to your clipboard.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-red-600">
                        <XCircle className="h-6 w-6" />
                        <span className="font-mono">[{subscription.id}]</span> {subscription.toolName}
                    </DialogTitle>
                    <DialogDescription>
                        This subscription request was declined. Review the complete details and decline reason below.
                    </DialogDescription>
                </DialogHeader>        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-6">
            {/* Decline Alert Banner */}
            <Card className="border-red-500 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-red-900">Declined by {declinedBy}</p>
                      <Badge variant="destructive" className="text-xs">DECLINED</Badge>
                    </div>
                    <p className="text-sm text-red-700">
                      <span className="font-medium">Date: </span>
                      {subscription.approvalDate ? format(new Date(subscription.approvalDate), "PPP") : format(new Date(subscription.requestDate), "PPP")}
                    </p>
                    <blockquote className="border-l-4 border-red-600 bg-white p-3 rounded-r-lg italic text-red-800">
                      "{declineReason}"
                    </blockquote>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Subscription Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Tool Name
                  </p>
                  <p className="font-semibold">{subscription.toolName}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Vendor
                  </p>
                  <p className="font-semibold">{subscription.vendorName || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Department
                  </p>
                  <p className="font-semibold">{subscription.department}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Location
                  </p>
                  <p className="font-semibold">{subscription.location || 'N/A'}</p>
                </div>
                <div className="space-y-1 col-span-2">
                  <p className="text-sm text-muted-foreground">Purpose</p>
                  <p className="font-semibold">{subscription.purpose}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Request Type</p>
                  <Badge variant="outline">{subscription.typeOfRequest || 'N/A'}</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Frequency</p>
                  <Badge variant="outline">{subscription.frequencyNew || subscription.frequency || 'N/A'}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Timeline & Duration */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Requested Timeline & Duration
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Request Date
                  </p>
                  <p className="font-semibold">
                    {format(new Date(startDate), "PPP")}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Intended End Date
                  </p>
                  <p className="font-semibold">
                    {endDate ? format(new Date(endDate), "PPP") : 'Not specified'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Duration Requested
                  </p>
                  <p className="font-semibold">{subscription.duration} months ({dayLimit} days approx.)</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Decline Date
                  </p>
                  <p className="font-semibold text-red-600">
                    {subscription.approvalDate ? format(new Date(subscription.approvalDate), "PPP") : format(new Date(subscription.requestDate), "PPP")}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Budget Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Budget Information (Requested)
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total Cost Requested</p>
                  <p className="font-bold text-2xl text-red-600">${subscription.cost.toFixed(2)}</p>
                </div>
                {subscription.baseMonthlyUSD && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Base Monthly Cost (USD)</p>
                    <p className="font-semibold text-lg">${subscription.baseMonthlyUSD.toFixed(2)}</p>
                  </div>
                )}
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Currency</p>
                  <Badge>{subscription.currencyNew || 'USD'}</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Payment Status</p>
                  <Badge variant="destructive">Not Processed - Declined</Badge>
                </div>
              </CardContent>
            </Card>

            {/* People & Roles */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  People Involved
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <User className="h-4 w-4" />
                    POC (Requester)
                  </p>
                  <p className="font-semibold">{pocName}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Department HOD
                  </p>
                  <p className="font-semibold">{hodName}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Declined By
                  </p>
                  <p className="font-semibold text-red-600">{approverName}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Role
                  </p>
                  <Badge variant="destructive">{declinedBy}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Invoice Information (if available) */}
            {(subscription.invoiceUrl || subscription.invoiceNumber) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Invoice Information (Submitted)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {subscription.invoiceNumber && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Invoice Number</p>
                      <p className="font-semibold">{subscription.invoiceNumber}</p>
                    </div>
                  )}
                  {subscription.invoiceUrl && (
                    <a 
                      href={subscription.invoiceUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:underline"
                    >
                      <FileText className="h-4 w-4" />
                      View Submitted Invoice
                    </a>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Additional Context */}
            {subscription.purpose && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Request Context</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Purpose/Justification:</p>
                    <p className="text-sm bg-muted/50 p-3 rounded-md">{subscription.purpose}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="sm:justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={handleCopy} className="text-muted-foreground">
            <Copy className="mr-2 h-4 w-4" /> Copy Decline Reason
          </Button>
          <Button type="button" onClick={() => onOpenChange(false)} className="bg-gradient-to-r from-primary to-accent text-white transition-transform duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/30">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
