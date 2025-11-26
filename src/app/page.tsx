
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import Logo from "@/components/logo"
import { useAppStore } from "@/store/app-store"
import { Role, SubRole } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(1, { message: "Password is required." }),
  portal: z.string().min(1, { message: "Please select a portal." }),
  financeRole: z.string().optional(),
})

const portalMapping: { [key: string]: { role: Role; path: string } } = {
  "Department POC Portal": { role: "employee", path: "/login/employee" },
  "HOD Portal": { role: "hod", path: "/login/hod" },
  "Finance Portal": { role: "finance", path: "/login/finance" },
}

export default function UnifiedLoginPage() {
  const [isPending, setIsPending] = useState(false)
  const router = useRouter()
  const { login } = useAppStore()
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      portal: "",
      financeRole: "",
    },
  })

  const selectedPortal = form.watch("portal")

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    setIsPending(true)
    const portalInfo = portalMapping[values.portal]
    if (!portalInfo) {
      toast({
        variant: "destructive",
        title: "Invalid Portal",
        description: "Please select a valid portal.",
      })
      setIsPending(false)
      return
    }

    try {
      const user = login(
        values.email,
        values.password,
        portalInfo.role,
        values.financeRole as SubRole
      )
      if (user) {
        toast({
          title: "Login Successful",
          description: `Welcome back, ${user.name}! Redirecting...`,
        })
        router.push("/dashboard")
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "Invalid credentials or wrong portal.",
      })
    } finally {
      setIsPending(false)
    }
  }

  const FADE_IN_ANIMATION_VARIANTS = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: "spring" } },
  }

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center p-4">
      <motion.div
        initial="hidden"
        animate="show"
        viewport={{ once: true }}
        variants={{
          hidden: {},
          show: {
            transition: {
              staggerChildren: 0.15,
            },
          },
        }}
        className="flex w-full max-w-md flex-col items-center space-y-6 text-center"
      >
        <motion.div variants={FADE_IN_ANIMATION_VARIANTS}>
          <Logo />
        </motion.div>
        <motion.h1
          className="text-4xl font-bold tracking-tighter text-foreground"
          variants={FADE_IN_ANIMATION_VARIANTS}
        >
          Welcome to AutoTrack Pro
        </motion.h1>
        <motion.p
          className="text-muted-foreground"
          variants={FADE_IN_ANIMATION_VARIANTS}
        >
          Login to access your subscription management portal.
        </motion.p>
        <motion.div
          className="w-full"
          variants={FADE_IN_ANIMATION_VARIANTS}
        >
          <Card className="text-left shadow-xl">
            <CardContent className="p-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="name@example.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="••••••••"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="portal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select Portal</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose a portal to log into" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Department POC Portal">
                              Department POC Portal
                            </SelectItem>
                            <SelectItem value="HOD Portal">
                              HOD Portal
                            </SelectItem>
                            <SelectItem value="Finance Portal">
                              Finance Portal
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <AnimatePresence>
                    {selectedPortal === "Finance Portal" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <FormField
                          control={form.control}
                          name="financeRole"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Select Role</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select your finance role" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="apa">APA</SelectItem>
                                  <SelectItem value="am">AM</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <Button type="submit" className="w-full" disabled={isPending}>
                    {isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Login
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </main>
  )
}
