"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Handlers (matching your UX)
  const adminLogin = useCallback(() => {
    router.push("/admin/login");
  }, [router]);

  const requestDemo = useCallback(() => {
    console.log("Demo requested");
    alert(
      "Thank you for your interest! Our team will contact you within 24 hours to schedule your personalized demo."
    );
  }, []);

  const startFreeTrial = useCallback(() => {
    console.log("Free trial started");
    alert(
      "Starting your 30-day free trial! You'll receive setup instructions via email within minutes."
    );
  }, []);

  const selectPlan = useCallback((plan: string) => {
    console.log("Plan selected:", plan);
    alert(
      `Starting your free trial with the ${plan} plan! No credit card required.`
    );
  }, []);

  const contactSales = useCallback(() => {
    console.log("Sales contact requested");
    alert(
      "Our enterprise sales team will contact you within 4 hours to discuss your district's needs."
    );
  }, []);

  // Smooth scrolling + entrance animations (client-only)
  useEffect(() => {
    // Smooth scrolling for anchor links (href starts with #)
    const anchors = Array.from(
      document.querySelectorAll('a[href^="#"]')
    ) as HTMLAnchorElement[];

    const anchorHandlers: Array<{
      el: HTMLAnchorElement;
      handler: (e: Event) => void;
    }> = [];

    anchors.forEach((anchor) => {
      const handler = (e: Event) => {
        e.preventDefault();
        const href = anchor.getAttribute("href");
        if (!href) return;
        const target = document.querySelector(href);
        if (target) target.scrollIntoView({ behavior: "smooth" });
      };
      anchor.addEventListener("click", handler);
      anchorHandlers.push({ el: anchor, handler });
    });

    // Intersection Observer for cards with translucent white backgrounds
    const observerOptions: IntersectionObserverInit = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    };

    const observed: Element[] = [];
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target as HTMLElement;
          el.style.opacity = "1";
          el.style.transform = "translateY(0)";
          io.unobserve(el);
        }
      });
    }, observerOptions);

    const animated = Array.from(
      document.querySelectorAll(".bg-white\\/70, .bg-white\\/80")
    ) as HTMLElement[];

    animated.forEach((element, index) => {
      element.style.opacity = "0";
      element.style.transform = "translateY(30px)";
      element.style.transition = `all 0.8s cubic-bezier(0.4, 0, 0.2, 1) ${
        index * 0.1
      }s`;
      io.observe(element);
      observed.push(element);
    });

    return () => {
      // Cleanup anchor listeners
      anchorHandlers.forEach(({ el, handler }) =>
        el.removeEventListener("click", handler)
      );
      // Cleanup observer
      observed.forEach((el) => io.unobserve(el));
      io.disconnect();
    };
  }, []);

  return (
    <main className="font-montserrat bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen relative">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-brand-blue/20 to-brand-light/10 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-accent-purple/15 to-brand-blue/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        />
        <div
          className="absolute top-1/3 left-1/4 w-64 h-64 bg-gradient-to-r from-accent-emerald/10 to-brand-light/15 rounded-full blur-2xl animate-pulse"
          style={{ animationDelay: "4s" }}
        />
      </div>

      {/* Navigation */}
      <nav className="relative bg-white/90 backdrop-blur-xl border-b border-white/20 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-brand-blue to-brand-dark rounded-xl flex items-center justify-center shadow-lg shadow-brand-blue/25">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5-7a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-safety-green rounded-full animate-ping" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">
                  Safer Attendance
                </h1>
                <p className="text-xs text-gray-600">School Safety Platform</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-8">
              <a
                href="/features"
                className="text-gray-600 hover:text-brand-dark transition-colors font-medium"
              >
                Features
              </a>
  <a
                href="/about"
                className="text-gray-600 hover:text-brand-dark transition-colors font-medium"
              >
                About Us
              </a>
  <a
                href="/contact"
                className="text-gray-600 hover:text-brand-dark transition-colors font-medium"
              >
                Contact
              </a>
              <a
                href="#pricing"
                className="text-gray-600 hover:text-brand-dark transition-colors font-medium"
              >
                Pricing
              </a>
              <a
                href="#testimonials"
                className="text-gray-600 hover:text-brand-dark transition-colors font-medium"
              >
                Schools
              </a>
              <a
                href="#security"
                className="text-gray-600 hover:text-brand-dark transition-colors font-medium"
              >
                Security
              </a>
              <button
                onClick={requestDemo}
                className="bg-gradient-to-r from-brand-blue to-brand-dark text-white px-6 py-2 rounded-xl hover:shadow-lg hover:shadow-brand-blue/30 transition-all duration-300 font-medium"
              >
                Request Demo
              </button>
              <button
                onClick={adminLogin}
                className="border border-brand-blue text-brand-dark px-6 py-2 rounded-xl hover:bg-brand-blue hover:text-white transition-all duration-300 font-medium"
              >
                Login
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden">
              <button
                onClick={() => setIsMobileOpen((v) => !v)}
                className="text-gray-600 hover:text-brand-dark"
                aria-label="Toggle menu"
                aria-expanded={isMobileOpen}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          <div className={`${isMobileOpen ? "" : "hidden"} lg:hidden pb-4`}>
            <div className="flex flex-col space-y-3">
              <a
                href="/features"
                className="text-gray-600 hover:text-brand-dark transition-colors font-medium"
              >
                Features
              </a>
<a
                href="/about"
                className="text-gray-600 hover:text-brand-dark transition-colors font-medium"
              >
                About Us
              </a>
<a
                href="/contact"
                className="text-gray-600 hover:text-brand-dark transition-colors font-medium"
              >
                Contact
              </a>
              <a
                href="#pricing"
                className="text-gray-600 hover:text-brand-dark transition-colors font-medium"
              >
                Pricing
              </a>
              <a
                href="#testimonials"
                className="text-gray-600 hover:text-brand-dark transition-colors font-medium"
              >
                Schools
              </a>
              <a
                href="#security"
                className="text-gray-600 hover:text-brand-dark transition-colors font-medium"
              >
                Security
              </a>
              <button
                onClick={requestDemo}
                className="bg-gradient-to-r from-brand-blue to-brand-dark text-white px-6 py-3 rounded-xl font-medium w-full"
              >
                Request Demo
              </button>
              <button
                onClick={adminLogin}
                className="border border-brand-blue text-brand-dark px-6 py-3 rounded-xl font-medium w-full"
              >
                Login
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Content */}
            <div className="text-center lg:text-left">
              {/* Trust Badge */}
              <div className="inline-flex items-center px-4 py-2 bg-safety-green/10 rounded-full text-safety-green text-sm font-semibold mb-6">
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5-7a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Trusted by 500+ Schools Nationwide
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-gray-900 mb-6 leading-tight">
                Every Student{" "}
                <span className="bg-gradient-to-r from-brand-blue to-brand-dark bg-clip-text text-transparent">
                  Accounted For
                </span>
                <br />
                Every Parent{" "}
                <span className="bg-gradient-to-r from-emerald-700 to-emerald-900 bg-clip-text text-transparent drop-shadow-md">
  Informed
</span>
              </h1>

              {/* Subheadline */}
              <p className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed max-w-2xl">
                The complete school safety platform that transforms attendance
                tracking into comprehensive student protection with real-time
                alerts and emergency response.
              </p>

              {/* Key Benefits */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-safety-green/10 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-safety-green"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                  <span className="text-gray-700 font-medium">
                    Instant Emergency Alerts
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-brand-blue/10 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-brand-blue"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <span className="text-gray-700 font-medium">
                    Real-Time Parent Updates
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-accent-purple/10 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-accent-purple"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  </div>
                  <span className="text-gray-700 font-medium">
                    Advanced Analytics
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-accent-emerald/10 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-accent-emerald"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                  <span className="text-gray-700 font-medium">
                    FERPA Compliant
                  </span>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <button
                  onClick={startFreeTrial}
                  className="bg-gradient-to-r from-brand-blue to-brand-dark text-white px-8 py-4 rounded-xl hover:shadow-xl hover:shadow-brand-blue/30 transition-all duration-300 font-bold text-lg hover:scale-105"
                >
                  Start Free Trial
                </button>
                <button
                  onClick={requestDemo}
                  className="border-2 border-brand-blue text-brand-dark px-8 py-4 rounded-xl hover:bg-brand-blue hover:text-white transition-all duration-300 font-bold text-lg"
                >
                  Watch Demo
                </button>
              </div>

              {/* Social Proof */}
              <div className="mt-12 pt-8 border-t border-gray-200">
                <p className="text-sm text-gray-500 mb-4">
                  Trusted by leading school districts:
                </p>
                <div className="flex flex-wrap justify-center lg:justify-start items-center gap-6 opacity-60">
                  <div className="text-gray-400 font-semibold">
                    Springfield USD
                  </div>
                  <div className="text-gray-400 font-semibold">
                    Metro Academy
                  </div>
                  <div className="text-gray-400 font-semibold">
                    Riverside Schools
                  </div>
                  <div className="text-gray-400 font-semibold">
                    Valley District
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Visual */}
            <div className="relative">
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl shadow-gray-200/50 border border-white/20">
                {/* Mock Dashboard */}
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-800">
                      Live Dashboard
                    </h3>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-safety-green rounded-full animate-pulse" />
                      <span className="text-sm text-gray-600">Live</span>
                    </div>
                  </div>

                  {/* Stats Cards */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-safety-green/10 to-emerald-50 rounded-xl p-4 border border-safety-green/20">
                      <div className="text-2xl font-bold text-safety-green">
                        1,247
                      </div>
                      <div className="text-sm text-gray-600">
                        Students Present
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-accent-orange/10 to-orange-50 rounded-xl p-4 border border-accent-orange/20">
                      <div className="text-2xl font-bold text-accent-orange">
                        23
                      </div>
                      <div className="text-sm text-gray-600">Absent Today</div>
                    </div>
                  </div>

                  {/* Recent Alerts */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-800">
                      Recent Activity
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-3 p-3 bg-brand-blue/10 rounded-lg border border-brand-blue/20">
                        <div className="w-2 h-2 bg-brand-blue rounded-full" />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-800">
                            Parent notification sent
                          </div>
                          <div className="text-xs text-gray-600">
                            Sarah Johnson - Absent Period 3
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">2m ago</div>
                      </div>
                      <div className="flex items-center space-x-3 p-3 bg-safety-green/10 rounded-lg border border-safety-green/20">
                        <div className="w-2 h-2 bg-safety-green rounded-full" />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-800">
                            Attendance verified
                          </div>
                          <div className="text-xs text-gray-600">
                            Room 204 - All students accounted
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">5m ago</div>
                      </div>
                    </div>
                  </div>

                  {/* Emergency Button */}
                  <button className="w-full bg-gradient-to-r from-safety-red to-red-600 text-white py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-red-500/30 transition-all duration-300">
                    🚨 Emergency Protocol
                  </button>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br from-accent-emerald/20 to-emerald-200/30 rounded-full blur-xl animate-pulse" />
              <div
                className="absolute -bottom-4 -left-4 w-16 h-16 bg-gradient-to-br from-brand-blue/20 to-blue-200/30 rounded-full blur-xl animate-pulse"
                style={{ animationDelay: "1s" }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Problem Statement */}
      <section className="relative py-20 bg-gradient-to-r from-gray-900 to-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              School Safety Can&apos;t Wait for{" "}
              <span className="text-safety-red">Manual Processes</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Every minute counts in an emergency. Traditional attendance
              methods leave dangerous gaps in student accountability and parent
              communication.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-safety-red/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-safety-red"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">
                Delayed Emergency Response
              </h3>
              <p className="text-gray-300">
                Paper-based systems create critical delays when every second
                matters for student safety.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-accent-orange/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-accent-orange"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">
                Parent Communication Gaps
              </h3>
              <p className="text-gray-300">
                Parents left wondering about their child&apos;s safety due to
                outdated notification systems.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-accent-purple/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-accent-purple"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Incomplete Data Insights</h3>
              <p className="text-gray-300">
                Missing patterns and trends that could prevent issues before
                they become emergencies.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Complete Safety Platform{" "}
              <span className="bg-gradient-to-r from-brand-blue to-brand-dark bg-clip-text text-transparent">
                Built for Schools
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to keep students safe, parents informed, and
              administrators confident in one integrated platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Real-Time Tracking */}
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-8 shadow-lg shadow-gray-200/50 border border-white/20 hover:shadow-xl transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-brand-blue to-brand-dark rounded-xl flex items-center justify-center mb-6">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Real-Time Tracking
              </h3>
              <p className="text-gray-600 mb-4">
                Instant attendance updates across all classrooms with live
                dashboard monitoring and automated alerts.
              </p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-brand-blue rounded-full mr-2" />
                  Live classroom status
                </li>
                <li className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-brand-blue rounded-full mr-2" />
                  Automated period tracking
                </li>
                <li className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-brand-blue rounded-full mr-2" />
                  Mobile teacher access
                </li>
              </ul>
            </div>

            {/* Emergency Alerts */}
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-8 shadow-lg shadow-gray-200/50 border border-white/20 hover:shadow-xl transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-safety-red to-red-600 rounded-xl flex items-center justify-center mb-6">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Emergency Response
              </h3>
              <p className="text-gray-600 mb-4">
                Instant emergency protocols with automated parent notifications
                and real-time student accountability.
              </p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-safety-red rounded-full mr-2" />
                  One-click emergency mode
                </li>
                <li className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-safety-red rounded-full mr-2" />
                  Mass parent notifications
                </li>
                <li className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-safety-red rounded-full mr-2" />
                  Student location tracking
                </li>
              </ul>
            </div>

            {/* Parent Communication */}
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-8 shadow-lg shadow-gray-200/50 border border-white/20 hover:shadow-xl transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-accent-emerald to-emerald-600 rounded-xl flex items-center justify-center mb-6">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Smart Notifications
              </h3>
              <p className="text-gray-600 mb-4">
                Automated parent alerts for absences, tardies, and emergencies
                via SMS, email, and app notifications.
              </p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-accent-emerald rounded-full mr-2" />
                  Multi-channel messaging
                </li>
                <li className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-accent-emerald rounded-full mr-2" />
                  Customizable alerts
                </li>
                <li className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-accent-emerald rounded-full mr-2" />
                  Parent portal access
                </li>
              </ul>
            </div>

            {/* Analytics */}
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-8 shadow-lg shadow-gray-200/50 border border-white/20 hover:shadow-xl transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-accent-purple to-purple-600 rounded-xl flex items-center justify-center mb-6">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Advanced Analytics
              </h3>
              <p className="text-gray-600 mb-4">
                Comprehensive reporting and insights to identify patterns and
                improve student engagement.
              </p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-accent-purple rounded-full mr-2" />
                  Attendance trends
                </li>
                <li className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-accent-purple rounded-full mr-2" />
                  Custom reports
                </li>
                <li className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-accent-purple rounded-full mr-2" />
                  Predictive insights
                </li>
              </ul>
            </div>

            {/* Integration */}
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-8 shadow-lg shadow-gray-200/50 border border-white/20 hover:shadow-xl transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-accent-cyan to-cyan-600 rounded-xl flex items-center justify-center mb-6">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                System Integration
              </h3>
              <p className="text-gray-600 mb-4">
                Seamless integration with existing school information systems
                and student databases.
              </p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-accent-cyan rounded-full mr-2" />
                  SIS compatibility
                </li>
                <li className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-accent-cyan rounded-full mr-2" />
                  API access
                </li>
                <li className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-accent-cyan rounded-full mr-2" />
                  Data synchronization
                </li>
              </ul>
            </div>

            {/* Security */}
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-8 shadow-lg shadow-gray-200/50 border border-white/20 hover:shadow-xl transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-accent-indigo to-indigo-600 rounded-xl flex items-center justify-center mb-6">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Enterprise Security
              </h3>
              <p className="text-gray-600 mb-4">
                Bank-level security with FERPA compliance and comprehensive data
                protection protocols.
              </p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-accent-indigo rounded-full mr-2" />
                  FERPA compliant
                </li>
                <li className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-accent-indigo rounded-full mr-2" />
                  End-to-end encryption
                </li>
                <li className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-accent-indigo rounded-full mr-2" />
                  Role-based access
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section
        id="testimonials"
        className="relative py-20 bg-gradient-to-br from-brand-blue/5 to-brand-light/10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Trusted by School Leaders{" "}
              <span className="bg-gradient-to-r from-brand-blue to-brand-dark bg-clip-text text-transparent">
                Nationwide
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See how schools are transforming safety and communication with
              Safer Attendance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-lg shadow-gray-200/50 border border-white/20">
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
              <p className="text-gray-600 mb-6 italic">
                &quot;Safer Attendance transformed our emergency response
                capabilities. During our last drill, we had complete student
                accountability in under 3 minutes. Parents received instant
                updates, and our stress levels dropped dramatically.&quot;
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-brand-blue to-brand-dark rounded-full flex items-center justify-center text-white font-bold mr-4">
                  SM
                </div>
                <div>
                  <div className="font-semibold text-gray-900">
                    Sarah Martinez
                  </div>
                  <div className="text-sm text-gray-600">
                    Principal, Springfield Elementary
                  </div>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-lg shadow-gray-200/50 border border-white/20">
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
              <p className="text-gray-600 mb-6 italic">
                &quot;The parent communication features are incredible. Parents
                love getting instant notifications, and our office calls have
                decreased by 80%. The system pays for itself in administrative
                time savings alone.&quot;
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-accent-emerald to-emerald-600 rounded-full flex items-center justify-center text-white font-bold mr-4">
                  MJ
                </div>
                <div>
                  <div className="font-semibold text-gray-900">
                    Michael Johnson
                  </div>
                  <div className="text-sm text-gray-600">
                    Superintendent, Metro District
                  </div>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-lg shadow-gray-200/50 border border-white/20">
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
              <p className="text-gray-600 mb-6 italic">
                &quot;Implementation was seamless, and our teachers adapted
                quickly. The mobile app makes attendance tracking effortless,
                and the analytics help us identify students who need additional
                support before issues escalate.&quot;
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-accent-purple to-purple-600 rounded-full flex items-center justify-center text-white font-bold mr-4">
                  LW
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Lisa Wang</div>
                  <div className="text-sm text-gray-600">
                    Assistant Principal, Valley High
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Simple, Transparent{" "}
              <span className="bg-gradient-to-r from-brand-blue to-brand-dark bg-clip-text text-transparent">
                Pricing
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choose the plan that fits your school&apos;s size and needs. All
              plans include our core safety features.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Starter Plan */}
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-8 shadow-lg shadow-gray-200/50 border border-white/20 hover:shadow-xl transition-all duration-300">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Starter
                </h3>
                <p className="text-gray-600 mb-4">Perfect for small schools</p>
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  $2.99
                </div>
                <div className="text-gray-600">per student/month</div>
                <div className="text-sm text-gray-500 mt-2">
                  Up to 500 students
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {[
                  "Real-time attendance tracking",
                  "Parent notifications (SMS/Email)",
                  "Basic reporting",
                  "Mobile app access",
                  "Email support",
                ].map((item) => (
                  <li key={item} className="flex items-center">
                    <svg
                      className="w-5 h-5 text-safety-green mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => selectPlan("starter")}
                className="w-full border-2 border-brand-blue text-brand-dark py-3 rounded-xl hover:bg-brand-blue hover:text-white transition-all duration-300 font-semibold"
              >
                Start Free Trial
              </button>
            </div>

            {/* Professional Plan (Most Popular) */}
            <div className="bg-gradient-to-br from-brand-blue/10 to-brand-light/20 backdrop-blur-xl rounded-2xl p-8 shadow-xl shadow-brand-blue/20 border-2 border-brand-blue/30 hover:shadow-2xl transition-all duration-300 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <div className="bg-gradient-to-r from-brand-blue to-brand-dark text-white px-6 py-2 rounded-full text-sm font-bold">
                  Most Popular
                </div>
              </div>

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Professional
                </h3>
                <p className="text-gray-600 mb-4">Ideal for most schools</p>
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  $1.99
                </div>
                <div className="text-gray-600">per student/month</div>
                <div className="text-sm text-gray-500 mt-2">
                  Up to 2,000 students
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {[
                  "Everything in Starter",
                  "Emergency response protocols",
                  "Advanced analytics & insights",
                  "SIS integration",
                  "Priority phone support",
                  "Custom reporting",
                ].map((item) => (
                  <li key={item} className="flex items-center">
                    <svg
                      className="w-5 h-5 text-safety-green mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => selectPlan("professional")}
                className="w-full bg-gradient-to-r from-brand-blue to-brand-dark text-white py-3 rounded-xl hover:shadow-lg hover:shadow-brand-blue/30 transition-all duration-300 font-semibold hover:scale-105"
              >
                Start Free Trial
              </button>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-8 shadow-lg shadow-gray-200/50 border border-white/20 hover:shadow-xl transition-all duration-300">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Enterprise
                </h3>
                <p className="text-gray-600 mb-4">For large districts</p>
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  Custom
                </div>
                <div className="text-gray-600">pricing</div>
                <div className="text-sm text-gray-500 mt-2">
                  Unlimited students
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {[
                  "Everything in Professional",
                  "Multi-school district support",
                  "Advanced API access",
                  "Dedicated account manager",
                  "24/7 priority support",
                  "Custom integrations",
                ].map((item) => (
                  <li key={item} className="flex items-center">
                    <svg
                      className="w-5 h-5 text-safety-green mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>

              <button
                onClick={contactSales}
                className="w-full border-2 border-gray-800 text-gray-800 py-3 rounded-xl hover:bg-gray-800 hover:text-white transition-all duration-300 font-semibold"
              >
                Contact Sales
              </button>
            </div>
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">
              All plans include a 30-day free trial. No credit card required.
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
              <div className="flex items-center">
                <svg
                  className="w-4 h-4 text-safety-green mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                FERPA Compliant
              </div>
              <div className="flex items-center">
                <svg
                  className="w-4 h-4 text-safety-green mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                99.9% Uptime SLA
              </div>
              <div className="flex items-center">
                <svg
                  className="w-4 h-4 text-safety-green mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Cancel Anytime
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section
        id="security"
        className="relative py-20 bg-gradient-to-br from-gray-900 to-gray-800 text-white"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Bank-Level Security{" "}
              <span className="text-accent-emerald">You Can Trust</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Your student data deserves the highest level of protection. We
              exceed industry standards for educational data security.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-accent-emerald/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-accent-emerald"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-2">FERPA Compliant</h3>
              <p className="text-gray-300 text-sm">
                Full compliance with educational privacy regulations
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-brand-blue/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-brand-blue"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5-7a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-2">End-to-End Encryption</h3>
              <p className="text-gray-300 text-sm">
                256-bit SSL encryption for all data transmission
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-accent-purple/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-accent-purple"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-2">Role-Based Access</h3>
              <p className="text-gray-300 text-sm">
                Granular permissions for different user types
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-accent-orange/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-accent-orange"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2m0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-2">Audit Trails</h3>
              <p className="text-gray-300 text-sm">
                Complete logging of all system activities
              </p>
            </div>
          </div>

          <div className="mt-16 text-center">
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 max-w-4xl mx-auto">
              <h3 className="text-2xl font-bold mb-4">
                Trusted by School Districts Nationwide
              </h3>
              <p className="text-gray-300 mb-6">
                Our security practices are regularly audited and certified by
                independent third parties. We maintain SOC 2 Type II compliance
                and undergo annual penetration testing.
              </p>
              <div className="flex flex-wrap justify-center gap-8 text-sm">
                {[
                  "SOC 2 Type II Certified",
                  "Annual Penetration Testing",
                  "24/7 Security Monitoring",
                ].map((item) => (
                  <div key={item} className="flex items-center">
                    <div className="w-8 h-8 bg-accent-emerald/20 rounded-lg flex items-center justify-center mr-3">
                      <svg
                        className="w-4 h-4 text-accent-emerald"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-brand-blue to-brand-dark rounded-3xl p-12 lg:p-20 text-center text-white relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full -translate-x-20 -translate-y-20" />
              <div className="absolute bottom-0 right-0 w-60 h-60 bg-white rounded-full translate-x-30 translate-y-30" />
            </div>

            <div className="relative z-10">
              <h2 className="text-4xl md:text-6xl font-bold mb-6">
                Ready to Make Your School{" "}
                <span className="text-accent-emerald">Safer?</span>
              </h2>
              <p className="text-xl md:text-2xl mb-8 opacity-90 max-w-3xl mx-auto">
                Join hundreds of schools already using Safer Attendance to
                protect their students and keep parents informed.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <button
                  onClick={startFreeTrial}
                  className="bg-white text-brand-dark px-8 py-4 rounded-xl hover:shadow-xl transition-all duration-300 font-bold text-lg hover:scale-105"
                >
                  Start 30-Day Free Trial
                </button>
                <button
                  onClick={requestDemo}
                  className="border-2 border-white text-white px-8 py-4 rounded-xl hover:bg-white hover:text-brand-dark transition-all duration-300 font-bold text-lg"
                >
                  Schedule Demo
                </button>
              </div>

              <p className="text-sm opacity-75">
                No credit card required • Setup in under 24 hours • Cancel
                anytime
              </p>
            </div>
          </div>
        </div>
      </section>

{/* Footer */}
      <footer className="relative bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-brand-blue to-brand-dark rounded-xl flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5-7a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Safer Attendance</h3>
                  <p className="text-gray-400">Complete School Safety Platform</p>
                </div>
              </div>
              <p className="text-gray-400 mb-6 max-w-md">
                Transforming school safety through intelligent attendance
                management, real-time communication, and emergency response
                capabilities.
              </p>
              <div className="flex space-x-4">
                {/* Social buttons (placeholders) */}
                {["twitter", "x", "linkedin"].map((key) => (
                  <a
                    key={key}
                    href="#"
                    className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-brand-blue transition-colors"
                    aria-label={key}
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" />
                    </svg>
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="/features" className="hover:text-white transition-colors">
                    Features
                  </a>
                </li>
 <li>
                  <a href="/about" className="hover:text-white transition-colors">
                    About Us
                  </a>
                </li>
 <li>
                  <a href="/contact" className="hover:text-white transition-colors">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-white transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#security" className="hover:text-white transition-colors">
                    Security
                  </a>
                </li>               
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="/contact" className="hover:text-white transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="/contact" className="hover:text-white transition-colors">
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    info@saferattendance.com
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    (856) 712-9455
                  </a>
                </li>
                <li>
                  <a href="/privacy" className="hover:text-white transition-colors">
                    Privacy & Security Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>
              &copy; 2025 Safer Attendance. All rights reserved. Keeping schools
              safe, one student at a time.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}

    
