
"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAppStore } from '@/store/app-store';
import { departmentOptions, User, locationOptions, frequencyOptions, currencyOptions, typeOfRequestOptions } from '@/lib/types';
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from '@/hooks/use-toast';
import CustomSelect from './custom-select';
import { ToolMultiSelect } from './tool-multi-select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon, Upload, Clock, User as UserIcon, Check, ChevronsUpDown } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { format, addMonths, differenceInCalendarMonths, isValid, formatISO } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LocationDropdown, LocationOption } from '@/components/LocationDropdown';
import { CompactInlineCurrencyAmount, type CurrencyAmountValue } from '@/components/CompactInlineCurrencyAmount';
import { useState, useEffect, useMemo } from 'react';
import { vendorToolMapping, pricingRules, USD_TO_INR_RATE } from '@/lib/pricing';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const formSchema = z.object({
  vendorName: z.string().min(1, 'Vendor name is required.'),
  toolName: z.array(z.string()).min(1, 'Please select at least one tool.'),
  toolNameCustom: z.string().optional(),
  frequency: z.enum(['Monthly', 'Quarterly', 'Yearly', 'One-time']),
  amountWithCurrency: z.object({
    amount: z.number().min(0, 'Amount must be a positive number.'),
    currency: z.enum(['IND', 'SWZ', 'US']),
  }),
  startDate: z.date({ required_error: "A start date is required."}),

  endDate: z.date({ required_error: "An end date is required."}),
  poc: z.string().min(1, 'Person of contact is required.'),
  purpose: z.string().min(20, 'Purpose must be at least 20 characters.'),
  department: z.string().min(1, 'Please select a department.'),
  departmentCustom: z.string().optional(),
  alertDays: z.coerce.number().min(1, 'Must be at least 1 day.').max(60, 'Cannot be more than 60 days.'),
  location: z.enum(['Office - Hyd Brigade', 'Office - Hyd KKH', 'Office - Hyd Other', 'NIAT - Aurora', 'NIAT - Yenepoya Managlore', 'NIAT - CDU', 'NIAT - Takshasila', 'NIAT - S-Vyasa', 'NIAT - BITS - Farah', 'NIAT - AMET', 'NIAT - CIET - LAM', 'NIAT - NIU', 'NIAT - ADYPU', 'NIAT - VGU', 'NIAT - CITY - Mothadaka', 'NIAT - NSRIT', 'NIAT - NRI', 'NIAT - Mallareddy', 'NIAT - Annamacharya', 'NIAT - SGU', 'NIAT - Sharda', 'NIAT - Crescent', 'Other']),
  locationCustom: z.string().optional(),
  frequencyNew: z.enum(['Quarterly', 'Monthly', 'Yearly', 'Usage-based']),
  typeOfRequest: z.enum(['Invoice', 'Quotation']),
});

interface NewRequestDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function NewRequestDialog({ open, onOpenChange }: NewRequestDialogProps) {
  const { currentUser, users, addSubscriptionRequest } = useAppStore();
  const { toast } = useToast();
  const [inrValue, setInrValue] = useState('0.00');
  const [hod, setHod] = useState<User | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      vendorName: '',
      toolName: [],
      toolNameCustom: '',
      frequency: 'Monthly',
      amountWithCurrency: { amount: 0, currency: 'IND' as const },
      poc: currentUser?.email || '',
      purpose: '',
      department: currentUser?.department || '',
      departmentCustom: '',
      alertDays: 10,
      location: 'Office - Hyd Brigade',
      locationCustom: '',
      frequencyNew: 'Monthly',
      typeOfRequest: 'Invoice',
    },
  });

  const { watch, setValue, getValues, trigger, control } = form;

  const vendorName = watch('vendorName');
  const toolName = watch('toolName');
  const frequency = watch('frequency');
  const amountWithCurrency = watch('amountWithCurrency');
  const location = watch('location');
  const startDate = watch('startDate');
  const department = watch('department');

  useEffect(() => {
    if (department) {
      const foundHod = users.find(u => u.isHOD && u.department === department);
      setHod(foundHod || null);
    } else {
      setHod(null);
    }
  }, [department, users]);

  const availableTools = useMemo(() => {
    return vendorToolMapping[vendorName] || [];
  }, [vendorName]);

  // Auto-populate amount based on vendor, tool, and frequency
  useEffect(() => {
    if (vendorName && toolName.length > 0 && frequency) {
      // Calculate total price for all selected tools
      let totalAmount = 0;
      const multipliers = { Monthly: 1, Quarterly: 3, Yearly: 12, 'One-time': 1 };
      
      toolName.forEach((tool) => {
        const toolPricing = pricingRules[tool];
        if (toolPricing) {
          totalAmount += toolPricing * multipliers[frequency];
        }
      });
      
      setValue('amountWithCurrency', { ...amountWithCurrency, amount: totalAmount });
      trigger('amountWithCurrency');
    } else {
      setValue('amountWithCurrency', { ...amountWithCurrency, amount: 0 });
    }
  }, [vendorName, toolName, frequency, setValue, trigger]);

  // Conversion rates for inline currency selector
  const conversionRates = {
    IND: 1,
    US: 82,
    SWZ: 90,
  };

  // Update End Date when Start Date or Frequency changes
  useEffect(() => {
    if (isValid(startDate) && frequency) {
      const multipliers = { Monthly: 1, Quarterly: 3, Yearly: 12, 'One-time': 1 };
      const durationInMonths = multipliers[frequency];
      const newEndDate = addMonths(startDate, durationInMonths);
      setValue('endDate', newEndDate);
    }
  }, [startDate, frequency, setValue]);
  
  const calculatedDuration = useMemo(() => {
    if (isValid(getValues('startDate')) && isValid(getValues('endDate'))) {
      const months = differenceInCalendarMonths(getValues('endDate'), getValues('startDate'));
      if (months === 0) return "1 month (One-time)";
      if (months === 1) return "1 month";
      if (months === 3) return "3 months";
      if (months === 12) return "12 months";
      return `${months} months`;
    }
    return '';
  }, [watch('startDate'), watch('endDate')]);


  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!currentUser) return;
    if (!hod) {
        toast({
            variant: 'destructive',
            title: "HOD Not Found",
            description: `No HOD configured for the ${values.department} department. Please contact an admin.`
        })
        return;
    }
    
    // Convert to INR for storage (base currency)
    const costInINR = values.amountWithCurrency.amount * conversionRates[values.amountWithCurrency.currency];
    const finalToolNames = values.toolName.join(', '); // Join multiple tools with comma
    const finalDepartment = getValues('department') === 'add-custom' ? getValues('departmentCustom') : getValues('department');
    const durationInMonths = differenceInCalendarMonths(values.endDate, values.startDate) || 1;

    addSubscriptionRequest({
      toolName: finalToolNames,
      duration: durationInMonths,
      cost: costInINR,
      purpose: values.purpose,
      department: finalDepartment!,
      vendorName: values.vendorName,
      alertDays: values.alertDays,
      expiryDate: formatISO(values.endDate),
      hodId: hod.id,
      location: values.location === 'Other' && values.locationCustom ? values.locationCustom : values.location,
      frequencyNew: values.frequencyNew,
      typeOfRequest: values.typeOfRequest,
    });
    toast({
        title: "Request Submitted!",
        description: `Your request for ${finalToolNames} has been sent to ${hod.name} for approval.`,
    })
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95%] sm:w-[90%] md:max-w-3xl rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl group">
            New Subscription Request
            <span className="block h-0.5 max-w-0 bg-primary transition-all duration-500 group-hover:max-w-full"></span>
          </DialogTitle>
          <DialogDescription>
            Fill out the form below to request a new software subscription.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                    
                    <FormField
                        control={form.control}
                        name="vendorName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Vendor Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g., Adobe Inc." {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="toolName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Tool Name</FormLabel>
                                <FormControl>
                                    <ToolMultiSelect
                                        options={availableTools}
                                        value={field.value}
                                        onChange={field.onChange}
                                        placeholder="Select tools..."
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="frequency"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Frequency</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select frequency" />
                                        </SelectTrigger>
                                    </FormControl>
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
                        name="location"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Location</FormLabel>
                                <FormControl>
                                    <LocationDropdown
                                        options={locationOptions.map(loc => ({ label: loc, value: loc }))}
                                        value={field.value}
                                        onChange={(value, otherText) => {
                                            field.onChange(value);
                                            if (otherText) {
                                                form.setValue('locationCustom', otherText);
                                            }
                                        }}
                                        placeholder="Select location"
                                        className="w-full"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {location === 'Other' && (
                        <FormField
                            control={form.control}
                            name="locationCustom"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Custom Location</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter custom location" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        Please specify the location
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}

                    <FormField
                        control={form.control}
                        name="frequencyNew"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Frequency (Billing)</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select frequency" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {frequencyOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="typeOfRequest"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Type of Request</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {typeOfRequestOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="amountWithCurrency"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Amount</FormLabel>
                                <FormControl>
                                    <CompactInlineCurrencyAmount
                                        value={field.value}
                                        onChange={field.onChange}
                                        baseCurrency="IND"
                                        conversionRates={conversionRates}
                                        min={0}
                                        placeholder="Enter amount"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    
                    <div className='md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-6 items-end'>
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
                        <FormItem>
                            <FormLabel>Duration</FormLabel>
                            <Input readOnly value={calculatedDuration} className="bg-muted" />
                        </FormItem>
                    </div>

                    <div>
                        <CustomSelect
                            form={form}
                            name="department"
                            label="Department"
                            placeholder="Select a department"
                            options={departmentOptions}
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
                        name="poc"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>POC (Person of Contact)</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g., poc@example.com" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    
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
                </div>
                
                <div className="col-span-1 md:col-span-2">
                    <FormField
                    control={form.control}
                    name="purpose"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Purpose & Justification</FormLabel>
                        <FormControl>
                            <Textarea rows={4} placeholder="Explain why this subscription is needed and how it supports your department's goals..." {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
                 <div className="col-span-1 md:col-span-2">
                     <FormItem>
                        <FormLabel>Attachment (Optional)</FormLabel>
                        <FormControl>
                            <div className="relative flex items-center justify-center w-full">
                                <label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/80">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                                        <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                        <p className="text-xs text-muted-foreground">PDF, PNG, JPG or GIF (MAX. 800x400px)</p>
                                    </div>
                                    <Input id="file-upload" type="file" className="hidden" />
                                </label>
                            </div> 
                        </FormControl>
                        <FormMessage />
                     </FormItem>
                </div>
                
                <DialogFooter className="pt-8">
                    <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button type="submit" disabled={!hod} className="bg-gradient-to-r from-primary to-accent text-white transition-transform duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/30">Submit Request</Button>
                </DialogFooter>
            </form>
            </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
