"use client";

import { useState } from "react";
import Head from "next/head";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, getIdToken } from "firebase/auth";
import { auth } from "@/lib/firebaseClient";

export default function AdminLogin() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !pwd) {
      setError("Please enter email and password.");
      return;
    }

    try {
      setLoading(true);

      // 🔥 Authenticate with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, pwd);

      // 🎫 Get the Firebase ID token
      const idToken = await getIdToken(userCredential.user);

      // 🍪 Save token in cookie for middleware
      document.cookie = `firebaseToken=${idToken}; path=/;`;

      // 🚀 Redirect to dashboard
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>School Attendance – Admin Login</title>
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>

      <div className="gradient-bg min-h-screen flex items-center justify-center p-4 font-[Montserrat]">
        <div className="login-animation w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 shadow-lg bg-[#1976D2]">
              <svg
                className="w-8 h-8 text-[#B3E5FC]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold mb-2 text-[#1976D2]">
              School Attendance
            </h1>
            <p className="text-sm text-[#1976D2]/80">Admin Dashboard Login</p>
          </div>

          {/* Form */}
          <div className="bg-white rounded-2xl p-8 shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium mb-2 text-[#1976D2]"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-focus w-full px-4 py-3 border rounded-lg bg-[#1976D2]/10 border-[#1976D2]/30 text-[#1976D2] placeholder:text-[#1976D2]/60"
                  placeholder="admin@school.edu"
                />
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium mb-2 text-[#1976D2]"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPwd ? "text" : "password"}
                    required
                    value={pwd}
                    onChange={(e) => setPwd(e.target.value)}
                    className="input-focus w-full px-4 py-3 border rounded-lg pr-12 bg-[#1976D2]/10 border-[#1976D2]/30 text-[#1976D2] placeholder:text-[#1976D2]/60"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1976D2]/60 hover:text-[#1976D2] transition"
                  >
                    <i className={`fas ${showPwd ? "fa-eye-slash" : "fa-eye"}`} />
                  </button>
                </div>
              </div>

              {/* Remember / Forgot */}
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded accent-[#1976D2] bg-[#1976D2]/10 border-[#1976D2]/30"
                  />
                  <span className="ml-2 text-sm text-[#1976D2]/80">
                    Remember me
                  </span>
                </label>
                <a
                  href="#"
                  className="text-sm text-[#1976D2]/80 hover:text-[#1976D2] transition"
                >
                  Forgot password?
                </a>
              </div>

              {/* Error */}
              {error && (
                <p className="text-sm text-red-600 font-medium -mt-4">{error}</p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg font-semibold bg-[#1976D2] text-[#B3E5FC] hover:bg-[#1565C0] transition transform hover:scale-[1.02]"
              >
                {loading ? "Signing in…" : "Sign In to Dashboard"}
              </button>
            </form>

            {/* Footer Help */}
            <div className="mt-6 pt-6 border-t border-[#1976D2]/20 text-center">
              <p className="text-sm text-[#1976D2]/60">
                Need help? Contact{" "}
                <a href="#" className="hover:underline text-[#1976D2]">
                  IT Support
                </a>
              </p>
            </div>
          </div>

          {/* Site Footer */}
          <footer className="text-center mt-8">
            <p className="text-xs text-[#1976D2]/60">
              © 2024 School Attendance System. All rights reserved.
            </p>
          </footer>
        </div>
      </div>

      {/* global styles */}
      <style jsx global>{`
        .gradient-bg {
          background: linear-gradient(135deg, #b3e5fc 0%, #81d4fa 100%);
        }
        .login-animation {
          animation: slideUp 0.6s ease-out;
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}
