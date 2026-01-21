// components/auth/login-form.tsx
"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { Loader2, Eye, EyeOff, Info } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

import { login } from "@/lib/auth"
import { loginSchema, LoginValues } from "@/lib/schemas/login"

export function LoginForm() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [generalError, setGeneralError] = useState("")
  const [forgotMsg, setForgotMsg] = useState(false)
  
  // 1. Setup Form with Zod Resolver
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  })

  const { isSubmitting } = form.formState

  // 2. Handle Submission
  const onSubmit = async (values: LoginValues) => {
    setGeneralError("")
    setForgotMsg(false)

    try {
      const response = await login(values.email, values.password, values.rememberMe)

      if (response.success) {
        router.push("/portal")
      } else {
        setGeneralError(response.error || "Login failed")
      }
    } catch (err) {
      setGeneralError("An unexpected error occurred")
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Email Field */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Enter your email" 
                  type="email" 
                  className="h-11"
                  disabled={isSubmitting}
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Password Field */}
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="h-11 pr-10"
                    disabled={isSubmitting}
                    {...field}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between">
          <FormField
            control={form.control}
            name="rememberMe"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-sm font-medium leading-none text-muted-foreground cursor-pointer">
                    Keep me signed in
                  </FormLabel>
                </div>
              </FormItem>
            )}
          />
          
          <button
            type="button"
            onClick={() => setForgotMsg(!forgotMsg)}
            className="text-xs font-medium text-primary hover:underline"
          >
            Forgot password?
          </button>
        </div>

        {/* Error Messages */}
        {generalError && (
          <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive font-medium border border-destructive/20 animate-in fade-in slide-in-from-top-2">
            {generalError}
          </div>
        )}

        {forgotMsg && (
          <div className="rounded-md bg-blue-50 dark:bg-blue-900/20 p-3 text-sm text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-start gap-2 animate-in fade-in slide-in-from-top-2">
            <Info className="h-4 w-4 mt-0.5 shrink-0" />
            <span>Please contact MIS Support to reset your password.</span>
          </div>
        )}

        {/* Submit Button */}
        <Button 
          type="submit" 
          className="w-full h-11 font-semibold shadow-sm" 
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>
    </Form>
  )
}