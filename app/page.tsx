'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LandingPage() {
  const router = useRouter();

  // --- handlers
  function adminLogin() {
    // Send admins to the login screen (we'll place it at /admin/login)
    router.push('/admin/login');
  }
  function learnMore() {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  }
  function requestDemo() {
    // CHANGED: route to /contact
    router.push('/contact');
  }
  function toggleMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    if (menu) menu.classList.toggle('hidden');
  }

  useEffect(() => {
    // Smooth scrolling for in-page anchors
    const anchors = Array.from(document.querySelectorAll('a[href^="#"]')) as HTMLAnchorElement[];
    const onClick = (e: Event) => {
      e.preventDefault();
      const href = (e.currentTarget as HTMLAnchorElement).getAttribute('href');
      if (!href) return;
      const target = document.querySelector(href);
      if (target) (target as HTMLElement).scrollIntoView({ behavior: 'smooth' });
    };
    anchors.forEach(a => a.addEventListener('click', onClick));
    return () => anchors.forEach(a => a.removeEventListener('click', onClick));
  }, []);

  return (
    <main className="font-montserrat bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen">
      {/* Animated Background Elements */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-gradient-to-br from-brand-blue/20 to-brand-light/10 blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-gradient-to-tr from-accent-purple/15 to-brand-blue/10 blur-3xl animate-pulse [animation-delay:2s]" />
        <div className="absolute left-1/4 top-1/3 h-64 w-64 rounded-full bg-gradient-to-r from-accent-emerald/10 to-brand-light/15 blur-2xl animate-pulse [animation-delay:4s]" />
      </div>

      {/* Navigation Header */}
      <nav className="relative border-b border-white/20 bg-white/80 shadow-sm backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            {/* Logo and Brand */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-blue to-brand-dark shadow-lg shadow-brand-blue/25">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5-7a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="absolute -right-1 -top-1 h-4 w-4 animate-ping rounded-full bg-accent-emerald" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Safer Attendance</h1>
                <p className="text-sm text-gray-600">Innovative Safety Technology</p>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="hidden items-center space-x-8 md:flex">
              <a href="/features" className="font-medium text-gray-600 transition-colors duration-300 hover:text-brand-dark">Features</a>
              <a href="/about" className="font-medium text-gray-600 transition-colors duration-300 hover:text-brand-dark">About</a>
              <a href="/contact" className="font-medium text-gray-600 transition-colors duration-300 hover:text-brand-dark">Contact</a>
              <button onClick={adminLogin} className="rounded-xl bg-gradient-to-r from-brand-blue to-brand-dark px-6 py-3 font-medium text-white transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-brand-blue/30">
                Admin Login
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button onClick={toggleMobileMenu} className="text-gray-600 transition-colors duration-300 hover:text-brand-dark" aria-label="Open menu">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          <div id="mobileMenu" className="hidden pb-6 md:hidden">
            <div className="flex flex-col space-y-4">
              {/* CHANGED: fixed #/ paths */}
              <a href="/features" className="font-medium text-gray-600 transition-colors duration-300 hover:text-brand-dark">Features</a>
              <a href="/about" className="font-medium text-gray-600 transition-colors duration-300 hover:text-brand-dark">About</a>
              <a href="/contact" className="font-medium text-gray-600 transition-colors duration-300 hover:text-brand-dark">Contact</a>
              <button onClick={adminLogin} className="w-full rounded-xl bg-gradient-to-r from-brand-blue to-brand-dark px-6 py-3 font-medium text-white transition-all duration-300 hover:shadow-lg hover:shadow-brand-blue/30">
                Admin Login
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Status Badge */}
            <div className="mb-8 inline-flex items-center rounded-full bg-accent-emerald/10 px-4 py-2 text-sm font-medium text-accent-emerald">
              <span className="mr-2 h-2 w-2 animate-pulse rounded-full bg-accent-emerald" />
              Innovative Safety Technology
            </div>

            {/* Main Headline */}
            <h1 className="mb-8 text-5xl font-bold leading-tight text-gray-800 md:text-7xl">
              <span className="bg-gradient-to-r from-brand-blue to-brand-dark bg-clip-text text-transparent">Safer</span>
              <br />
              Attendance
            </h1>

            {/* Tagline */}
            <p className="mb-6 text-2xl font-medium text-gray-600 md:text-3xl">Ensuring safety one class at a time</p>

            {/* Description */}
            <p className="mx-auto mb-12 max-w-4xl text-xl leading-relaxed text-gray-600">
              Promoting attendance through innovative technology that prioritizes student safety, streamlines administrative processes, and creates a secure learning environment for educational institutions.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col items-center justify-center gap-6 sm:flex-row">
              <button onClick={learnMore} className="flex items-center space-x-3 rounded-xl bg-gradient-to-r from-brand-blue to-brand-dark px-8 py-4 text-lg font-semibold text-white transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-brand-blue/30">
                <span>Learn More</span>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
              <button onClick={requestDemo} className="flex items-center space-x-3 rounded-xl border border-white/30 bg-white/70 px-8 py-4 text-lg font-semibold text-gray-700 transition-all duration-300 hover:scale-105 hover:bg-white/90">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Request Demo</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative bg-white/30 py-20 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="mb-6 text-4xl font-bold text-gray-800 md:text-5xl">
              Why Choose <span className="bg-gradient-to-r from-brand-blue to-brand-dark bg-clip-text text-transparent">Safer Attendance?</span>
            </h2>
            <p className="mx-auto max-w-3xl text-xl text-gray-600">
              Our innovative platform combines cutting-edge technology with user-friendly design to create the safest attendance tracking solution.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Safety First */}
            <div className="group rounded-2xl border border-white/20 bg-white/70 p-8 shadow-lg shadow-gray-200/50 backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:shadow-xl hover:shadow-accent-emerald/20">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-accent-emerald to-emerald-600 shadow-lg shadow-accent-emerald/25 transition-transform duration-300 group-hover:scale-110">
                <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5-7a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="mb-4 text-2xl font-semibold text-gray-800">Safety First</h3>
              <p className="leading-relaxed text-gray-600">
                Advanced security protocols ensure student data protection while maintaining real-time safety monitoring across all educational facilities.
              </p>
            </div>

            {/* Real-Time Tracking */}
            <div className="group rounded-2xl border border-white/20 bg-white/70 p-8 shadow-lg shadow-gray-200/50 backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:shadow-xl hover:shadow-brand-blue/20">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-brand-blue to-brand-dark shadow-lg shadow-brand-blue/25 transition-transform duration-300 group-hover:scale-110">
                <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="mb-4 text-2xl font-semibold text-gray-800">Real-Time Tracking</h3>
              <p className="leading-relaxed text-gray-600">
                Instant attendance updates with live dashboards providing administrators immediate insights into student presence and safety status.
              </p>
            </div>

            {/* Smart Analytics */}
            <div className="group rounded-2xl border border-white/20 bg-white/70 p-8 shadow-lg shadow-gray-200/50 backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:shadow-xl hover:shadow-accent-purple/20">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-accent-purple to-purple-600 shadow-lg shadow-accent-purple/25 transition-transform duration-300 group-hover:scale-110">
                <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="mb-4 text-2xl font-semibold text-gray-800">Smart Analytics</h3>
              <p className="leading-relaxed text-gray-600">
                Comprehensive reporting and predictive analytics help identify attendance patterns and potential safety concerns before they escalate.
              </p>
            </div>

            {/* Easy Integration */}
            <div className="group rounded-2xl border border-white/20 bg-white/70 p-8 shadow-lg shadow-gray-200/50 backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:shadow-xl hover:shadow-accent-orange/20">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-accent-orange to-orange-600 shadow-lg shadow-accent-orange/25 transition-transform duration-300 group-hover:scale-110">
                <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4 4 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="mb-4 text-2xl font-semibold text-gray-800">Easy Integration</h3>
              <p className="leading-relaxed text-gray-600">
                Seamlessly integrates with existing school management systems, requiring minimal setup while maximizing functionality and user adoption.
              </p>
            </div>

            {/* 24/7 Support */}
            <div className="group rounded-2xl border border-white/20 bg-white/70 p-8 shadow-lg shadow-gray-200/50 backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:shadow-xl hover:shadow-rose-400/20">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-rose-400 to-pink-500 shadow-lg shadow-rose-400/25 transition-transform duration-300 group-hover:scale-110">
                <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="mb-4 text-2xl font-semibold text-gray-800">24/7 Support</h3>
              <p className="leading-relaxed text-gray-600">
                Round-the-clock technical support and monitoring ensure your attendance system operates smoothly without interruption.
              </p>
            </div>

            {/* Compliance Ready */}
            <div className="group rounded-2xl border border-white/20 bg-white/70 p-8 shadow-lg shadow-gray-200/50 backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:shadow-xl hover:shadow-indigo-400/20">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-600 shadow-lg shadow-indigo-400/25 transition-transform duration-300 group-hover:scale-110">
                <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <h3 className="mb-4 text-2xl font-semibold text-gray-800">Compliance Ready</h3>
              <p className="leading-relaxed text-gray-600">
                Built to meet educational compliance standards and privacy regulations, ensuring your institution stays protected and compliant.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="relative py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
            <div>
              <h2 className="mb-8 text-4xl font-bold text-gray-800 md:text-5xl">
                Revolutionizing <span className="bg-gradient-to-r from-brand-blue to-brand-dark bg-clip-text text-transparent">Educational Safety</span>
              </h2>
              <p className="mb-8 text-xl leading-relaxed text-gray-600">
                Safer Attendance was born from the need to create a comprehensive solution that doesn't just track attendance, but ensures every student's safety and well-being throughout their educational journey.
              </p>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-accent-emerald to-emerald-600">
                    <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="mb-2 text-lg font-semibold text-gray-800">Innovative Technology</h3>
                    <p className="text-gray-600">Cutting-edge solutions designed specifically for educational environments.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-blue to-brand-dark">
                    <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="mb-2 text-lg font-semibold text-gray-800">Safety Focused</h3>
                    <p className="text-gray-600">Every feature is built with student safety and security as the top priority.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-accent-purple to-purple-600">
                    <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="mb-2 text-lg font-semibold text-gray-800">User-Friendly</h3>
                    <p className="text-gray-600">Intuitive design that makes complex attendance management simple and efficient.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="rounded-3xl border border-white/20 bg-gradient-to-br from-brand-blue/20 to-brand-dark/10 p-8 backdrop-blur-sm">
                <div className="rounded-2xl bg-white/80 p-8 shadow-xl backdrop-blur-sm">
                  <div className="text-center">
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-blue to-brand-dark shadow-lg shadow-brand-blue/25">
                      <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <h3 className="mb-4 text-2xl font-bold text-gray-800">Trusted by 500+ Schools</h3>
                    <p className="mb-6 text-gray-600">Educational institutions worldwide trust Safer Attendance to protect their students.</p>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-brand-dark">99.9%</p>
                        <p className="text-sm text-gray-600">Uptime</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-brand-dark">500K+</p>
                        <p className="text-sm text-gray-600">Students</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-brand-dark">24/7</p>
                        <p className="text-sm text-gray-600">Support</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative bg-gradient-to-r from-brand-blue to-brand-dark py-20">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-8 text-4xl font-bold text-white md:text-5xl">Ready to Make Your School Safer?</h2>
          <p className="mx-auto mb-12 max-w-3xl text-xl text-blue-100">
            Join hundreds of educational institutions that have already transformed their attendance tracking with our innovative safety-first approach.
          </p>
          <div className="flex flex-col items-center justify-center gap-6 sm:flex-row">
            <button onClick={requestDemo} className="flex items-center space-x-3 rounded-xl bg-white px-8 py-4 text-lg font-semibold text-brand-dark transition-all duration-300 hover:scale-105 hover:bg-gray-50 shadow-lg">
              <span>Get Started Today</span>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
            <button onClick={adminLogin} className="rounded-xl border border-white/30 bg-white/20 px-8 py-4 text-lg font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-white/30">
              Admin Access
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="relative bg-gray-900 py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            <div className="col-span-1 md:col-span-2">
              <div className="mb-6 flex items-center space-x-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-blue to-brand-dark">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5-7a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Safer Attendance</h3>
                  <p className="text-gray-400">Ensuring safety one class at a time</p>
                </div>
              </div>
              <p className="mb-6 max-w-md text-gray-400">
                Innovative attendance tracking technology designed to prioritize student safety while streamlining administrative processes.
              </p>
            </div>
            <div>
              <h4 className="mb-4 text-lg font-semibold">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/features" className="transition-colors duration-300 hover:text-white">Features</a></li>
                <li><a href="/about" className="transition-colors duration-300 hover:text-white">About</a></li>
                <li><a href="PrivacyPolicy" className="transition-colors duration-300 hover:text-white">Privacy Policy</a></li>
                <li><a href="Terms" className="transition-colors duration-300 hover:text-white">Terms of Service</a></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-lg font-semibold">Contact</h4>
              <ul className="space-y-2 text-gray-400">
                <li>support@saferattendance.com</li>
                <li>1-800-SAFER-01</li>
                <li>24/7 Support Available</li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Safer Attendance. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
