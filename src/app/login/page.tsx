"use client";

import { useState } from "react";
import { Poppins } from "next/font/google";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
    // Hardcoded test credentials
    const { email, password } = formData;
    if (email === "admin@company.com" && password === "admin123") {
      router.push("/homepage");
    } else {
      throw new Error("Invalid credentials");
    }
  } catch (err: unknown) {
    if (err instanceof Error) setError(err.message);
    else setError("Something went wrong. Please try again.");
  } finally {
    setIsLoading(false);
  }
};

 return (
    <div className="min-h-screen flex items-center justify-end bg-gray-100 relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 bg-[url('/bg/theme-park.png')] bg-cover bg-center" />

      {/* Optional Overlay */}
      {/* <div className="absolute inset-0 bg-white/70" /> */}

      {/* Top-left Logo 
      <div className="absolute top-6 left-8 z-10 flex items-center gap-2">
        <Image src="/logo/icity-logo.svg" alt="I-City Logo" width={110} height={50} />
      </div>
      */}

      {/* Login Card */}
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 z-10 mr-24 ${poppins.className}`}
      >
        <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">Login</h2>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email */}
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Username or Email"
              className="w-full py-3.5 pl-11 pr-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B5FEF] text-gray-900 placeholder-gray-400 bg-white shadow-sm"
            />
          </div>

          {/* Password */}
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Password"
              className="w-full py-3.5 pl-11 pr-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B5FEF] text-gray-900 placeholder-gray-400 bg-white shadow-sm"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Remember Me + Forgot Password */}
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="text-gray-600">Remember me</span>
            </label>
            <a
              href="/forgot-password"
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Forgot Password?
            </a>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={isLoading || !formData.email || !formData.password}
            className="w-full bg-[#5B5FEF] hover:bg-[#7C83FF] text-white font-semibold py-4 rounded-lg transition-all duration-200 disabled:cursor-not-allowed shadow-lg hover:shadow-xl text-lg"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-5 w-5"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Logging in...
              </span>
            ) : (
              "Login"
            )}
          </button>
        </form>

        {/* Sign Up Link */}
        <p className="text-center mt-6 text-gray-600">
          Don&apos;t have an account?{" "}
          <a
            href="/signup"
            className="text-indigo-600 hover:text-indigo-700 font-semibold"
          >
            Sign Up
          </a>
        </p>

        {/* Demo credentials */}
        <p className="text-center text-gray-500 text-xs mt-4">
          Demo credentials: <br />
          <span className="font-mono">admin@company.com / admin123</span>
        </p>
      </div>
    </div>
  );
}