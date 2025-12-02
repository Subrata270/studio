/**
 * InlineAmountWithCurrency - Usage Examples
 * 
 * This file demonstrates how the InlineAmountWithCurrency component
 * is integrated into the subscription forms.
 */

import { InlineAmountWithCurrency, type CurrencyValue } from '@/components/InlineAmountWithCurrency';

// ============================================================================
// Example 1: Basic Integration with useState
// ============================================================================

function BasicExample() {
  const [amountData, setAmountData] = useState<CurrencyValue>({
    amount: 34,
    currency: 'US'
  });

  const conversionRates = {
    INS: 1,    // 1 INR = 1 INR (base)
    US: 82,    // 1 USD = 82 INR
    SWZ: 90,   // 1 CHF = 90 INR
  };

  return (
    <div className="space-y-4">
      <InlineAmountWithCurrency
        value={amountData}
        onChange={setAmountData}
        label="Subscription Amount"
        baseCurrency="INS"
        conversionRates={conversionRates}
        min={0}
      />
      
      <p>Selected: {amountData.amount} {amountData.currency}</p>
    </div>
  );
}

// ============================================================================
// Example 2: React Hook Form Integration (New Subscription Form)
// ============================================================================

function NewSubscriptionForm() {
  const formSchema = z.object({
    vendorName: z.string().min(1),
    toolName: z.array(z.string()).min(1),
    amountWithCurrency: z.object({
      amount: z.number().min(0, 'Amount must be positive'),
      currency: z.enum(['INS', 'SWZ', 'US']),
    }),
    startDate: z.date(),
    endDate: z.date(),
    // ... other fields
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      vendorName: '',
      toolName: [],
      amountWithCurrency: { amount: 0, currency: 'INS' },
      // ... other defaults
    },
  });

  const conversionRates = {
    INS: 1,
    US: 82,
    SWZ: 90,
  };

  const onSubmit = (values) => {
    // Convert to base currency (INR) for storage
    const costInINR = 
      values.amountWithCurrency.amount * 
      conversionRates[values.amountWithCurrency.currency];

    addSubscriptionRequest({
      toolName: values.toolName.join(', '),
      cost: costInINR,  // Store in INR
      originalCurrency: values.amountWithCurrency.currency,
      originalAmount: values.amountWithCurrency.amount,
      // ... other fields
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Vendor and Tool fields */}
        
        {/* Amount with Currency - Replaces old Amount + Currency fields */}
        <FormField
          control={form.control}
          name="amountWithCurrency"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <InlineAmountWithCurrency
                  value={field.value}
                  onChange={field.onChange}
                  label="Amount"
                  baseCurrency="INS"
                  conversionRates={conversionRates}
                  min={0}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Other form fields */}
        
        <Button type="submit">Submit Request</Button>
      </form>
    </Form>
  );
}

// ============================================================================
// Example 3: Renew Subscription Form
// ============================================================================

function RenewSubscriptionForm({ subscription }) {
  const formSchema = z.object({
    amountWithCurrency: z.object({
      amount: z.number().min(0.01, 'Amount must be greater than 0'),
      currency: z.enum(['INS', 'SWZ', 'US']),
    }),
    duration: z.string(),
    // ... other fields
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amountWithCurrency: { 
        amount: subscription.cost, 
        currency: 'INS' 
      },
      // ... other defaults
    },
  });

  const conversionRates = {
    INS: 1,
    US: 82,
    SWZ: 90,
  };

  return (
    <Form {...form}>
      <FormField
        control={form.control}
        name="amountWithCurrency"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <InlineAmountWithCurrency
                value={field.value}
                onChange={field.onChange}
                label="Renewal Amount"
                baseCurrency="INS"
                conversionRates={conversionRates}
                min={0.01}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </Form>
  );
}

// ============================================================================
// Example 4: With Dynamic Rate Fetching
// ============================================================================

function DynamicRatesExample() {
  const [amountData, setAmountData] = useState<CurrencyValue>({
    amount: 100,
    currency: 'US'
  });

  // Fetch live conversion rates from an API
  const fetchLiveRates = async () => {
    try {
      const response = await fetch('https://api.exchangerate.host/latest?base=INR');
      const data = await response.json();
      
      return {
        INS: 1,
        US: 1 / data.rates.USD,  // Convert from INR-based rate
        SWZ: 1 / data.rates.CHF,
      };
    } catch (error) {
      console.error('Failed to fetch rates:', error);
      // Return fallback rates
      return { INS: 1, US: 82, SWZ: 90 };
    }
  };

  return (
    <InlineAmountWithCurrency
      value={amountData}
      onChange={setAmountData}
      label="Amount"
      baseCurrency="INS"
      fetchRates={fetchLiveRates}  // Component will fetch on mount
    />
  );
}

// ============================================================================
// Example 5: Validation with Min/Max
// ============================================================================

function ValidatedExample() {
  const [amountData, setAmountData] = useState<CurrencyValue>({
    amount: 50,
    currency: 'INS'
  });

  return (
    <InlineAmountWithCurrency
      value={amountData}
      onChange={setAmountData}
      label="Donation Amount"
      baseCurrency="INS"
      conversionRates={{ INS: 1, US: 82, SWZ: 90 }}
      min={10}           // Minimum 10
      max={10000}        // Maximum 10,000
      allowDecimals={true}
    />
  );
}

// ============================================================================
// Example 6: Read-Only for History/Audit
// ============================================================================

function HistoricalRecord({ historicalData }) {
  return (
    <InlineAmountWithCurrency
      value={historicalData.amountWithCurrency}
      onChange={() => {}}  // No-op
      label="Original Amount"
      baseCurrency="INS"
      conversionRates={{ INS: 1, US: 82, SWZ: 90 }}
      lockConversion={true}  // Don't show conversion for historical records
      disabled={true}
    />
  );
}

// ============================================================================
// Migration Guide: Before and After
// ============================================================================

/**
 * BEFORE: Separate Amount and Currency fields
 */
function OldApproach() {
  // Old schema
  const oldSchema = z.object({
    amount: z.coerce.number().min(0),
    currency: z.enum(['USD', 'INR']),
  });

  // Old form structure
  return (
    <>
      <FormField name="amount">
        <FormLabel>Amount</FormLabel>
        <div className="relative">
          <span className="absolute left-3">{currency === 'USD' ? '$' : '₹'}</span>
          <Input type="number" {...field} className="pl-7" />
        </div>
      </FormField>
      
      <FormField name="currency">
        <Select>
          <SelectItem value="USD">USD</SelectItem>
          <SelectItem value="INR">INR</SelectItem>
        </Select>
      </FormField>
      
      {/* Separate Equivalent In field */}
      <FormItem>
        <FormLabel>Equivalent In</FormLabel>
        <Input readOnly value={calculatedEquivalent} />
      </FormItem>
    </>
  );
}

/**
 * AFTER: Inline Amount with Currency
 */
function NewApproach() {
  // New schema
  const newSchema = z.object({
    amountWithCurrency: z.object({
      amount: z.number().min(0),
      currency: z.enum(['INS', 'SWZ', 'US']),
    }),
  });

  // New form structure - Single field!
  return (
    <FormField name="amountWithCurrency">
      <FormControl>
        <InlineAmountWithCurrency
          value={field.value}
          onChange={field.onChange}
          label="Amount"
          baseCurrency="INS"
          conversionRates={{ INS: 1, US: 82, SWZ: 90 }}
        />
        {/* Equivalent In is built-in! */}
      </FormControl>
    </FormField>
  );
}

// ============================================================================
// Current Integration Status
// ============================================================================

/**
 * Files where InlineAmountWithCurrency is integrated:
 * 
 * 1. src/app/(app)/dashboard/poc/new-request-dialog.tsx
 *    - New subscription request form
 *    - Uses amountWithCurrency field
 *    - Converts to INR on submission
 * 
 * 2. src/app/(app)/dashboard/poc/renew-request-dialog.tsx
 *    - Subscription renewal form
 *    - Uses amountWithCurrency field
 *    - Converts to INR on submission
 * 
 * Schema Changes:
 * - Removed: amount (number), currency (enum)
 * - Added: amountWithCurrency (object with amount and currency)
 * 
 * Conversion on Submit:
 * const costInINR = values.amountWithCurrency.amount * 
 *                   conversionRates[values.amountWithCurrency.currency];
 */

export {
  BasicExample,
  NewSubscriptionForm,
  RenewSubscriptionForm,
  DynamicRatesExample,
  ValidatedExample,
  HistoricalRecord,
};
