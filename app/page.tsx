/* app/page.tsx */
"use client";

import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/navigation";

/* Smaller helpers -------------------------------------------- */
const fmtDate = () =>
  new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

/* Main component --------------------------------------------- */
export default function Login() {
  const router = useRouter();

  /* form state */
  const [user, setUser] = useState("");
  const [pwd, setPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  /* modal / progress state */
  const [open, setOpen] = useState(false);
  const [progress, setProgress] = useState(0);

  /* animate progress bar when modal opens */
  useEffect(() => {
    if (!open) return;
    setProgress(0);
    const id = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(id);
          // fake redirect after a brief pause
          setTimeout(() => router.push("/"), 300);
          return 100;
        }
        return p + 2;
      });
    }, 50);
    return () => clearInterval(id);
  }, [open, router]);

  /* handle submit */
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (user && pwd) setOpen(true);
  };

  return (
    <>
      <Head>
        <title>School Admin Portal – Login</title>

        {/* Inter font + Tailwind CDN (only fonts loaded here) */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>

      {/* page background */}
      <div className="gradient-bg min-h-screen flex items-center justify-center p-4 relative overflow-hidden font-[Inter]">
        {/* floating shapes */}
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className={`shape absolute rounded-full bg-white/10 ${
              i === 0
                ? "w-20 h-20 top-[20%] left-[10%] animate-float1"
                : i === 1
                ? "w-32 h-32 top-[60%] right-[15%] animate-float2"
                : "w-16 h-16 bottom-[20%] left-[20%] animate-float3"
            }`}
          />
        ))}

        {/* login card */}
        <div className="glass-effect rounded-2xl p-8 w-full max-w-md shadow-2xl relative z-10">
          <header className="text-center mb-8">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-white"
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
            <h1 className="text-2xl font-bold text-white mb-2">
              School Admin Portal
            </h1>
            <p className="text-white/80 text-sm">
              Sign in to access your dashboard
            </p>
          </header>

          {/* form */}
          <form onSubmit={onSubmit} className="space-y-6">
            {/* user */}
            <div>
              <label
                htmlFor="user"
                className="block text-white text-sm font-medium mb-2"
              >
                Administrator&nbsp;ID
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="fas fa-user-graduate text-gray-300" />
                </span>
                <input
                  id="user"
                  value={user}
                  onChange={(e) => setUser(e.target.value)}
                  required
                  placeholder="Enter your administrator ID"
                  className="input-focus w-full pl-10 pr-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 transition"
                />
              </div>
            </div>

            {/* password */}
            <div>
              <label
                htmlFor="password"
                className="block text-white text-sm font-medium mb-2"
              >
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="fas fa-lock text-gray-300" />
                </span>
                <input
                  id="password"
                  type={showPwd ? "text" : "password"}
                  value={pwd}
                  onChange={(e) => setPwd(e.target.value)}
                  required
                  placeholder="Enter your password"
                  className="input-focus w-full pl-10 pr-12 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <i
                    className={`fas ${
                      showPwd ? "fa-eye-slash" : "fa-eye"
                    } text-gray-300 hover:text-white transition`}
                  />
                </button>
              </div>
            </div>

            {/* remember / forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-blue-600 bg-white/20 border-white/30 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-white/80">Remember me</span>
              </label>
              <a
                href="#"
                className="text-sm text-white/80 hover:text-white transition"
              >
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              className="login-btn w-full bg-white/20 hover:bg-white/30 text-white font-semibold py-3 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              Sign In to Dashboard
            </button>
          </form>

          {/* footer */}
          <footer className="mt-8 text-center text-white/60 text-xs">
            Secure access for authorized personnel only
            <div className="flex items-center justify-center mt-2">
              <i className="w-4 h-4 fas fa-lock text-green-400 mr-1" />
              <span className="text-green-400">SSL Secured</span>
            </div>
          </footer>
        </div>

        {/* modal */}
        {open && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setOpen(false)}
          >
            <div
              className="bg-white rounded-2xl p-8 max-w-sm w-full text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-check text-green-600 text-2xl" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Login successful!
              </h3>
              <p className="text-gray-600 mb-6">
                Redirecting to your admin dashboard…
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* keyframes + extra styles (scoped to this file) */}
      <style jsx global>{`
        .gradient-bg {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        @keyframes float1 {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(180deg);
          }
        }
        @keyframes float2 {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(180deg);
          }
        }
        @keyframes float3 {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(180deg);
          }
        }
      `}</style>
    </>
  );
}
