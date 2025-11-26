
"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAppStore } from '@/store/app-store';
import { Subscription, categoryOptions, departmentOptions, User } from '@/lib/types';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon, Clock, User as UserIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { addMonths, differenceInCalendarMonths, format, isValid } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const USD_TO_INR_RATE = 83;

const formSchema = z.object({
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0.'),
  currency: z.enum(['USD', 'INR']),
  startDate: z.date({ required_error: "A start date is required."}),
  endDate: z.date({ required_error: "An end date is required."}),
  duration: z.string().min(1, 'Duration is required.'),
  durationCustom: z.coerce.number().optional(),
  frequency: z.enum(['Monthly', 'Quarterly', 'Yearly', 'One-time']),
  category: z.string().min(1, 'Please select a category.'),
  department: z.string().min(1, 'Please select a department.'),
  poc: z.string().min(1, 'Person of contact is required.'),
  justification: z.string().min(20, 'Justification must be at least 20 characters.'),
  alertDays: z.coerce.number().min(1, 'Must be at least 1 day.').max(60, 'Cannot be more than 60 days.'),
});

interface RenewRequestDialogProps {
    subscription: Subscription;
    trigger: React.ReactNode;
    disabled?: boolean;
    tooltip?: string;
}

const durationOptions = ["1", "3", "6", "12"];

export default function RenewRequestDialog({ subscription, trigger, disabled, tooltip }: RenewRequestDialogProps) {
  const { renewSubscription, users } = useAppStore();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [inrValue, setInrValue] = useState('0.00');
  const [isCustomDuration, setIsCustomDuration] = useState(false);
  const [hod, setHod] = useState<User | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: subscription.cost,
      currency: 'USD',
      startDate: new Date(),
      endDate: addMonths(new Date(), subscription.duration),
      duration: subscription.duration.toString(),
      durationCustom: undefined,
      frequency: 'Monthly',
      category: 'Others',
      department: subscription.department,
      poc: subscription.poc || subscription.requestedBy,
      justification: '',
      alertDays: subscription.alertDays || 10,
    },
  });

  const { watch, setValue, getValues } = form;
  const amount = watch('amount');
  const currency = watch('currency');
  const startDate = watch('startDate');
  const endDate = watch('endDate');
  const duration = watch('duration');
  const department = watch('department');

  useEffect(() => {
    if (department) {
      const foundHod = users.find(u => u.isHOD && u.department === department);
      setHod(foundHod || null);
    } else {
      setHod(null);
    }
  }, [department, users]);

  useEffect(() => {
    let newInrValue = 0;
    if (currency === 'USD') {
        newInrValue = amount * USD_TO_INR_RATE;
    } else {
        newInrValue = amount;
    }
    setInrValue(newInrValue.toFixed(2));
  }, [amount, currency]);

  // Sync End Date when Start Date or Duration changes
  useEffect(() => {
    if (isValid(startDate) && duration) {
        const currentDuration = duration === 'custom' ? getValues('durationCustom') : parseInt(duration, 10);
        if (currentDuration && currentDuration > 0) {
            const newEndDate = addMonths(startDate, currentDuration);
            setValue('endDate', newEndDate);
        }
    }
  }, [startDate, duration, getValues, setValue]);

  // Sync Duration when End Date changes
  useEffect(() => {
    if (isValid(startDate) && isValid(endDate) && endDate > startDate) {
        const diffInMonths = differenceInCalendarMonths(endDate, startDate);
        if (durationOptions.includes(diffInMonths.toString())) {
            setValue('duration', diffInMonths.toString());
            setIsCustomDuration(false);
        } else {
            setValue('duration', 'custom');
            setValue('durationCustom', diffInMonths);
            setIsCustomDuration(true);
        }
    }
  }, [endDate, startDate, setValue]);

  const handleDurationChange = (value: string) => {
    setValue('duration', value);
    if (value === 'custom') {
      setIsCustomDuration(true);
    } else {
      setIsCustomDuration(false);
      setValue('durationCustom', undefined);
    }
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!hod) {
        toast({
            variant: 'destructive',
            title: "HOD Not Found",
            description: `No HOD configured for the ${values.department} department. Please contact an admin.`
        })
        return;
    }
    const finalDuration = values.duration === 'custom' ? values.durationCustom || 0 : parseInt(values.duration, 10);
    
    renewSubscription(subscription.id, finalDuration, values.amount, values.justification, values.alertDays);
    toast({
        title: "Renewal Request Submitted!",
        description: `Your renewal request for ${subscription.toolName} has been sent to ${hod.name} for approval.`,
    })
    form.reset();
    setOpen(false);
  };
  
  const dialogTrigger = disabled && tooltip ? (
      <TooltipProvider>
          <Tooltip>
              <TooltipTrigger asChild>{trigger}</TooltipTrigger>
              <TooltipContent><p>{tooltip}</p></TooltipContent>
          </Tooltip>
      </TooltipProvider>
  ) : trigger;


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{dialogTrigger}</DialogTrigger>
      <DialogContent className="w-[95%] sm:w-[90%] md:max-w-3xl rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">Renew Subscription</DialogTitle>
          <DialogDescription>
            Renewing for <strong>{subscription.toolName}</strong>. Please provide the renewal details.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                    <FormItem>
                        <FormLabel>Tool Name</FormLabel>
                        <Input readOnly value={subscription.toolName} className="bg-muted" />
                    </FormItem>
                    <FormItem>
                        <FormLabel>Vendor Name</FormLabel>
                        <Input readOnly value={subscription.vendorName} className="bg-muted" />
                    </FormItem>
                    
                    <div className="flex items-end gap-2">
                        <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                                <FormItem className="flex-1">
                                    <FormLabel>Amount</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                                                {getValues('currency') === 'USD' ? '$' : '₹'}
                                            </span>
                                            <Input type="number" {...field} className="pl-7" />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="currency"
                            render={({ field }) => (
                                <FormItem>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                    <SelectTrigger className="w-[80px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="USD">USD</SelectItem>
                                        <SelectItem value="INR">INR</SelectItem>
                                    </SelectContent>
                                </Select>
                                </FormItem>
                            )}
                        />
                    </div>

                    <FormItem>
                        <FormLabel>Equivalent In</FormLabel>
                        <div className="relative">
                           <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                                {getValues('currency') === 'USD' ? '₹' : '$'}
                            </span>
                            <Input readOnly value={getValues('currency') === 'USD' ? inrValue : (amount / USD_TO_INR_RATE).toFixed(2)} className="pl-7 bg-muted" />
                        </div>
                    </FormItem>

                    <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Start Date</FormLabel>
                                 <Popover>
                                    <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                        variant={"outline"}
                                        className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                                        >
                                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                     <FormField
                        control={form.control}
                        name="endDate"
                        render={({ field }) => (
                             <FormItem>
                                <FormLabel>End Date</FormLabel>
                                 <Popover>
                                    <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                        variant={"outline"}
                                        className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                                        >
                                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < (getValues('startDate') || new Date("1900-01-01"))} initialFocus />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    
                    <div className="space-y-2">
                      <FormField
                        control={form.control}
                        name="duration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Duration</FormLabel>
                            <Select onValueChange={handleDurationChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select duration" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {durationOptions.map(opt => <SelectItem key={opt} value={opt}>{opt} month(s)</SelectItem>)}
                                <SelectItem value="custom" className="text-primary font-semibold">+ Custom Duration</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {isCustomDuration && (
                        <FormField
                            control={form.control}
                            name="durationCustom"
                            render={({ field }) => (
                                <FormItem>
                                <FormControl>
                                    <Input type="number" autoFocus placeholder="Enter custom months (e.g. 9)" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                      )}
                    </div>


                     <FormField
                        control={form.control}
                        name="frequency"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Frequency</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select frequency" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="Monthly">Monthly</SelectItem>
                                        <SelectItem value="Quarterly">Quarterly</SelectItem>
                                        <SelectItem value="Yearly">Yearly</SelectItem>
                                        <SelectItem value="One-time">One-time</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Category</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger></FormControl>
                                    <SelectContent>{categoryOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div>
                        <FormField
                            control={form.control}
                            name="department"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Department</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select a department" /></SelectTrigger></FormControl>
                                        <SelectContent>{departmentOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         {hod ? (
                            <div className="mt-2 text-xs p-2 bg-green-50 border border-green-200 rounded-md text-green-800 flex items-start gap-2">
                                <UserIcon className="h-4 w-4 mt-0.5 shrink-0" />
                                <div>
                                    This request will be sent for approval to: <br />
                                    <span className="font-semibold">{hod.name}</span> ({hod.email})
                                </div>
                            </div>
                        ) : department && (
                            <FormDescription className="text-red-500 mt-2">
                                HOD not found for this department. Please contact admin.
                            </FormDescription>
                        )}
                    </div>

                     <FormField
                        control={form.control}
                        name="alertDays"
                        render={({ field }) => (
                            <FormItem>
                                 <FormLabel className="flex items-center gap-2">
                                     <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Clock className="h-4 w-4 text-muted-foreground" />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p className="max-w-xs">Enter how many days before the expiry date the renewal alert should appear and the Renew button becomes active.</p>
                                            </TooltipContent>
                                        </Tooltip>
                                     </TooltipProvider>
                                     Renewal Alert (Days Before Expiry)
                                 </FormLabel>
                                <FormControl>
                                    <Input type="number" min={1} max={60} {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="poc"
                        render={({ field }) => (
                            <FormItem className="md:col-span-2">
                                <FormLabel>POC (Person of Contact)</FormLabel>
                                <FormControl><Input placeholder="e.g., poc@example.com" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                
                <div className="col-span-1 md:col-span-2">
                    <FormField
                    control={form.control}
                    name="justification"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Justification - Why renewal is required</FormLabel>
                        <FormControl>
                            <Textarea rows={4} placeholder="Explain why this renewal is needed and the expected benefits..." {...field} />
                        </FormControl>
                         <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
                
                <DialogFooter className="pt-8">
                    <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={!hod} className="bg-gradient-to-r from-primary to-accent text-white transition-transform duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/30">Submit Renewal</Button>
                </DialogFooter>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
