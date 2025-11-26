
"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAppStore } from '@/store/app-store';
import { Subscription, departmentOptions } from '@/lib/types';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect, useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon, Upload, Clock } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { addMonths, differenceInCalendarMonths, format, isValid, parseISO } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { pricingRules, vendorToolMapping, USD_TO_INR_RATE } from '@/lib/pricing';
import CustomSelect from './custom-select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const formSchema = z.object({
    vendorName: z.string().min(1, 'Vendor name is required.'),
    toolName: z.string().min(1, 'Please select a tool.'),
    toolNameCustom: z.string().optional(),
    department: z.string().min(1, 'Please select a department.'),
    alertDays: z.coerce.number().min(1, 'Must be at least 1 day.').max(60, 'Cannot be more than 60 days.'),
    baseMonthlyUSD: z.coerce.number().optional(),
    frequency: z.enum(['Monthly', 'Quarterly', 'Yearly', 'One-time']),
    cost: z.coerce.number().min(0, 'Amount must be a positive number.'),
    startDate: z.date({ required_error: "A start date is required." }),
    endDate: z.date({ required_error: "An end date is required." }),
    poc: z.string().min(1, "Person of contact is required."),
    purpose: z.string().optional(),
});

interface VendorDetailsDialogProps {
    subscription: Subscription;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function VendorDetailsDialog({ subscription, open, onOpenChange }: VendorDetailsDialogProps) {
    const { updateSubscriptionDetails } = useAppStore();
    const { toast } = useToast();
    const [inrValue, setInrValue] = useState('0.00');

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            vendorName: subscription.vendorName || '',
            toolName: subscription.toolName || '',
            toolNameCustom: '',
            department: subscription.department || '',
            alertDays: subscription.alertDays || 10,
            baseMonthlyUSD: subscription.baseMonthlyUSD || 0,
            frequency: subscription.frequency || 'Monthly',
            cost: subscription.cost || 0,
            startDate: subscription.requestDate ? parseISO(subscription.requestDate) : new Date(),
            endDate: subscription.expiryDate ? parseISO(subscription.expiryDate) : addMonths(new Date(), 1),
            poc: subscription.poc || '',
            purpose: subscription.purpose || '',
        },
    });

    const { watch, setValue, getValues, control } = form;

    const vendorName = watch('vendorName');
    const toolName = watch('toolName');
    const frequency = watch('frequency');
    const cost = watch('cost');
    const startDate = watch('startDate');

    const availableTools = useMemo(() => vendorToolMapping[vendorName] || [], [vendorName]);

    useEffect(() => {
        setInrValue((cost * USD_TO_INR_RATE).toFixed(2));
    }, [cost]);
    
    useEffect(() => {
        if (isValid(startDate) && frequency) {
            const multipliers = { Monthly: 1, Quarterly: 3, Yearly: 12, 'One-time': 1 };
            const durationInMonths = multipliers[frequency];
            setValue('endDate', addMonths(startDate, durationInMonths));
        }
    }, [startDate, frequency, setValue]);

    const calculatedDuration = useMemo(() => {
        if (isValid(getValues('startDate')) && isValid(getValues('endDate'))) {
            const months = differenceInCalendarMonths(getValues('endDate'), getValues('startDate'));
            if (months === 0) return "1 month (One-time)";
            if (months === 1) return "1 month";
            return `${months} months`;
        }
        return '';
    }, [watch('startDate'), watch('endDate')]);

    const onSubmit = (values: z.infer<typeof formSchema>) => {
        const finalToolName = values.toolName === 'add-custom' ? values.toolNameCustom : values.toolName;
        
        updateSubscriptionDetails(subscription.id, {
            ...values,
            toolName: finalToolName!,
            expiryDate: values.endDate.toISOString(),
            requestDate: values.startDate.toISOString(),
        });

        toast({
            title: "Success",
            description: "Vendor details have been updated successfully.",
        });
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95%] sm:w-[90%] md:max-w-4xl rounded-xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl">
                        Edit Vendor Details - {subscription.vendorName} / {subscription.toolName}
                    </DialogTitle>
                    <DialogDescription>
                        Modify the configuration for this subscription.
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[70vh] pr-4">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                                
                                <FormField name="vendorName" control={control} render={({ field }) => (
                                    <FormItem><FormLabel>Vendor Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                
                                <CustomSelect form={form} name="toolName" label="Tool Name" placeholder="Select a tool" options={availableTools} />

                                <FormField name="department" control={control} render={({ field }) => (
                                    <FormItem><FormLabel>Department</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                        <SelectContent>{departmentOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent>
                                    </Select><FormMessage /></FormItem>
                                )}/>

                                <FormField name="alertDays" control={control} render={({ field }) => (
                                    <FormItem><FormLabel className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" />Renewal Alert (Days)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>

                                <FormField name="baseMonthlyUSD" control={control} render={({ field }) => (
                                    <FormItem><FormLabel>Base Price (USD monthly)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                
                                <FormField name="frequency" control={control} render={({ field }) => (
                                    <FormItem><FormLabel>Frequency</FormLabel>
                                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="Monthly">Monthly</SelectItem>
                                            <SelectItem value="Quarterly">Quarterly</SelectItem>
                                            <SelectItem value="Yearly">Yearly</SelectItem>
                                            <SelectItem value="One-time">One-time</SelectItem>
                                        </SelectContent>
                                    </Select><FormMessage /></FormItem>
                                )}/>

                                <FormField name="cost" control={control} render={({ field }) => (
                                    <FormItem><FormLabel>Current Amount (USD)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>

                                <FormItem>
                                    <FormLabel>Equivalent INR</FormLabel>
                                    <Input readOnly value={inrValue} className="bg-muted" />
                                </FormItem>

                                <FormField control={control} name="startDate" render={({ field }) => (
                                    <FormItem><FormLabel>Start Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>
                                )}/>
                                
                                <FormField control={control} name="endDate" render={({ field }) => (
                                     <FormItem><FormLabel>End Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < (getValues('startDate') || new Date("1900-01-01"))} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>
                                )}/>

                                <FormItem>
                                    <FormLabel>Duration</FormLabel>
                                    <Input readOnly value={calculatedDuration} className="bg-muted" />
                                </FormItem>

                                <FormField name="poc" control={control} render={({ field }) => (
                                    <FormItem><FormLabel>POC / Contact</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>

                                <FormField name="purpose" control={control} render={({ field }) => (
                                    <FormItem className="md:col-span-2"><FormLabel>Notes / Admin Comments</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>

                                <FormItem className="md:col-span-2">
                                    <FormLabel>Attachments</FormLabel>
                                    <div className="relative flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/80">
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                                            <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                        </div>
                                        <Input id="file-upload" type="file" className="hidden" />
                                    </div>
                                </FormItem>
                            </div>
                            <DialogFooter className="pt-8">
                                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                                <Button type="submit" className="bg-gradient-to-r from-primary to-accent text-white">Save Changes</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}

