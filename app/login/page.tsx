import { LoginForm } from "@/components/auth/login-form"
import { Building2 } from "lucide-react"
import { APP_VERSION } from "@/lib/constants"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">

      {/* Background image layer */}
      <div className="absolute inset-0 bg-[url('/bg/theme-park.png')] bg-cover bg-center opacity-15 z-0"></div>

      <div className="relative z-10 w-full max-w-md space-y-8 ">
        {/* Logo and Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center">
              <Building2 className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-balance">Welcome back</h1>
            <p className="text-muted-foreground text-balance">Sign in to your account to continue</p>
          </div>
        </div>

        {/* Login Form Card */}
        <div className="rounded-xl border bg-card p-8 shadow-sm">
          <LoginForm />
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          Theme Park Portal v{APP_VERSION} - Secure Authentication System
        </p>
      </div>
    </div>
  )
}
