'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';

export const metadata = {
  title: 'Features - Safer Attendance',
};

export default function FeaturesPage() {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const adminLogin = useCallback(() => {
    router.push('/admin/login');
  }, [router]);

  const goHome = useCallback(() => {
    router.push('/');
  }, [router]);

  // Animate cards on scroll (replicates your IntersectionObserver behavior)
  useEffect(() => {
    const opts = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          (entry.target as HTMLElement).classList.add('opacity-100', 'translate-y-0');
        }
      });
    }, opts);

    document.querySelectorAll<HTMLElement>('[data-animate]').forEach((el, index) => {
      // initial hidden state (matches your inline style approach)
      el.style.transition = `all 0.8s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.1}s`;
      el.classList.add('opacity-0', 'translate-y-8');
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // Smooth scrolling for hash links
  useEffect(() => {
    const handleClick = (e: Event) => {
      const anchor = e.currentTarget as HTMLAnchorElement;
      const href = anchor.getAttribute('href');
      if (href && href.startsWith('#')) {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) target.scrollIntoView({ behavior: 'smooth' });
      }
    };

    const anchors = Array.from(document.querySelectorAll('a[href^="#"]'));
    anchors.forEach((a) => a.addEventListener('click', handleClick));
    return () => anchors.forEach((a) => a.removeEventListener('click', handleClick));
  }, []);

  return (
    <div
      className="font-montserrat bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen"
      style={{ scrollBehavior: 'smooth' }}
    >
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl animate-pulse bg-gradient-to-br from-[#93BEE6]/20 to-[#B8D4F0]/10" />
        <div
          className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full blur-3xl animate-pulse bg-gradient-to-tr from-[#8B5CF6]/15 to-[#93BEE6]/10"
          style={{ animationDelay: '2s' }}
        />
        <div
          className="absolute top-1/3 left-1/4 w-64 h-64 rounded-full blur-2xl animate-pulse bg-gradient-to-r from-[#10B981]/10 to-[#B8D4F0]/15"
          style={{ animationDelay: '4s' }}
        />
      </div>

      {/* Navigation Header */}
      <nav className="relative bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            {/* Logo and Brand */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg shadow-[#93BEE6]/25 bg-gradient-to-br from-[#93BEE6] to-[#6B9BD9]">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5-7a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#10B981] rounded-full animate-ping" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Safer Attendance</h1>
                <p className="text-sm text-gray-600">Features Overview</p>
              </div>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center space-x-8">
              <button onClick={goHome} className="text-gray-600 hover:text-[#6B9BD9] transition-colors duration-300 font-medium">
                Home
              </button>
              <a href="#core-features" className="text-gray-600 hover:text-[#6B9BD9] transition-colors duration-300 font-medium">
                Core Features
              </a>
              <a href="#advanced" className="text-gray-600 hover:text-[#6B9BD9] transition-colors duration-300 font-medium">
                Advanced
              </a>
              <a href="#integrations" className="text-gray-600 hover:text-[#6B9BD9] transition-colors duration-300 font-medium">
                Integrations
              </a>
              <button
                onClick={adminLogin}
                className="bg-gradient-to-r from-[#93BEE6] to-[#6B9BD9] text-white px-6 py-3 rounded-xl hover:shadow-lg hover:shadow-[#93BEE6]/30 transition-all duration-300 font-medium hover:scale-105"
              >
                Admin Login
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileOpen((s) => !s)}
                className="text-gray-600 hover:text-[#6B9BD9] transition-colors duration-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          <div className={`${mobileOpen ? '' : 'hidden'} md:hidden pb-6`}>
            <div className="flex flex-col space-y-4">
              <button onClick={goHome} className="text-gray-600 hover:text-[#6B9BD9] transition-colors duration-300 font-medium text-left">
                Home
              </button>
              <a href="#core-features" className="text-gray-600 hover:text-[#6B9BD9] transition-colors duration-300 font-medium">
                Core Features
              </a>
              <a href="#advanced" className="text-gray-600 hover:text-[#6B9BD9] transition-colors duration-300 font-medium">
                Advanced
              </a>
              <a href="#integrations" className="text-gray-600 hover:text-[#6B9BD9] transition-colors duration-300 font-medium">
                Integrations
              </a>
              <button
                onClick={adminLogin}
                className="bg-gradient-to-r from-[#93BEE6] to-[#6B9BD9] text-white px-6 py-3 rounded-xl hover:shadow-lg hover:shadow-[#93BEE6]/30 transition-all duration-300 font-medium w-full"
              >
                Admin Login
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Breadcrumb */}
            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium mb-8 bg-[#93BEE6]/10 text-[#6B9BD9]">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Comprehensive Feature Set
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-7xl font-bold text-gray-800 mb-8 leading-tight">
              Powerful <span className="bg-gradient-to-r from-[#93BEE6] to-[#6B9BD9] bg-clip-text text-transparent">Features</span>
            </h1>

            {/* Description */}
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed mb-12">
              Discover the comprehensive suite of tools and capabilities that make Safer Attendance the most advanced and secure attendance
              tracking solution for educational institutions.
            </p>

            {/* Feature Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-[#6B9BD9] mb-2">50+</div>
                <div className="text-sm text-gray-600">Core Features</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[#10B981] mb-2">99.9%</div>
                <div className="text-sm text-gray-600">Accuracy Rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[#8B5CF6] mb-2">24/7</div>
                <div className="text-sm text-gray-600">Monitoring</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[#F59E0B] mb-2">100+</div>
                <div className="text-sm text-gray-600">Integrations</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Section */}
      <section id="core-features" className="relative py-20 bg-white/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
              Core <span className="bg-gradient-to-r from-[#93BEE6] to-[#6B9BD9] bg-clip-text text-transparent">Features</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Essential tools that form the foundation of our comprehensive attendance management system.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Real-Time Attendance Tracking */}
            <div
              data-animate
              className="group bg-white/70 backdrop-blur-xl rounded-3xl p-10 shadow-lg shadow-gray-200/50 border border-white/20 hover:shadow-xl hover:shadow-[#93BEE6]/20 hover:-translate-y-2 transition-all duration-500"
            >
              <div className="flex items-start space-x-6">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg shadow-[#93BEE6]/25 group-hover:scale-110 transition-transform duration-300 flex-shrink-0 bg-gradient-to-br from-[#93BEE6] to-[#6B9BD9]">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-gray-800 mb-4">Real-Time Attendance Tracking</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    Instant attendance updates with live dashboards providing administrators immediate insights into student presence across
                    all classes and locations.
                  </p>
                  <ul className="space-y-3">
                    {['Live attendance dashboard', 'Instant notifications', 'Multi-location support'].map((t) => (
                      <li key={t} className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-[#10B981] rounded-full" />
                        <span className="text-gray-600">{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Advanced Security Protocols */}
            <div
              data-animate
              className="group bg-white/70 backdrop-blur-xl rounded-3xl p-10 shadow-lg shadow-gray-200/50 border border-white/20 hover:shadow-xl hover:shadow-[#10B981]/20 hover:-translate-y-2 transition-all duration-500"
            >
              <div className="flex items-start space-x-6">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg shadow-[#10B981]/25 group-hover:scale-110 transition-transform duration-300 flex-shrink-0 bg-gradient-to-br from-[#10B981] to-emerald-600">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5-7a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-gray-800 mb-4">Advanced Security Protocols</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    Military-grade encryption and multi-layered security ensure student data protection while maintaining compliance with
                    educational privacy regulations.
                  </p>
                  <ul className="space-y-3">
                    {['End-to-end encryption', 'FERPA compliance', 'Role-based access control'].map((t) => (
                      <li key={t} className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-[#10B981] rounded-full" />
                        <span className="text-gray-600">{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Smart Analytics & Reporting */}
            <div
              data-animate
              className="group bg-white/70 backdrop-blur-xl rounded-3xl p-10 shadow-lg shadow-gray-200/50 border border-white/20 hover:shadow-xl hover:shadow-[#8B5CF6]/20 hover:-translate-y-2 transition-all duration-500"
            >
              <div className="flex items-start space-x-6">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg shadow-[#8B5CF6]/25 group-hover:scale-110 transition-transform duration-300 flex-shrink-0 bg-gradient-to-br from-[#8B5CF6] to-purple-600">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-gray-800 mb-4">Smart Analytics &amp; Reporting</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    Comprehensive reporting with predictive analytics to identify attendance patterns, trends, and potential safety concerns
                    before they escalate.
                  </p>
                  <ul className="space-y-3">
                    {['Predictive analytics', 'Custom report builder', 'Automated insights'].map((t) => (
                      <li key={t} className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-[#10B981] rounded-full" />
                        <span className="text-gray-600">{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Multi-Platform Integration */}
            <div
              data-animate
              className="group bg-white/70 backdrop-blur-xl rounded-3xl p-10 shadow-lg shadow-gray-200/50 border border-white/20 hover:shadow-xl hover:shadow-[#F59E0B]/20 hover:-translate-y-2 transition-all duration-500"
            >
              <div className="flex items-start space-x-6">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg shadow-[#F59E0B]/25 group-hover:scale-110 transition-transform duration-300 flex-shrink-0 bg-gradient-to-br from-[#F59E0B] to-orange-600">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-gray-800 mb-4">Multi-Platform Integration</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    Seamlessly integrates with existing school management systems, student information systems, and third-party educational
                    tools.
                  </p>
                  <ul className="space-y-3">
                    {['SIS integration', 'LMS compatibility', 'API access'].map((t) => (
                      <li key={t} className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-[#10B981] rounded-full" />
                        <span className="text-gray-600">{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Advanced Features Section */}
      <section id="advanced" className="relative py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
              Advanced <span className="bg-gradient-to-r from-[#93BEE6] to-[#6B9BD9] bg-clip-text text-transparent">Capabilities</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Cutting-edge features that set Safer Attendance apart from traditional attendance systems.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: 'AI-Powered Insights',
                desc:
                  'Machine learning algorithms analyze attendance patterns to predict potential issues and suggest proactive interventions.',
                chip: 'from-[#06B6D4] to-cyan-600',
                chipShadow: 'shadow-[#06B6D4]/25',
                linkColor: 'text-[#06B6D4]',
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                ),
              },
              {
                title: 'Geofencing Technology',
                desc:
                  'Location-based attendance verification ensures students are physically present in designated areas for accurate tracking.',
                chip: 'from-[#6366F1] to-indigo-600',
                chipShadow: 'shadow-[#6366F1]/25',
                linkColor: 'text-[#6366F1]',
                icon: (
                  <>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </>
                ),
              },
              {
                title: 'Emergency Response',
                desc:
                  'Instant emergency protocols with automated notifications to parents, staff, and emergency services during critical situations.',
                chip: 'from-[#F43F5E] to-rose-600',
                chipShadow: 'shadow-[#F43F5E]/25',
                linkColor: 'text-[#F43F5E]',
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                ),
              },
              {
                title: 'Biometric Integration',
                desc:
                  'Optional biometric verification including fingerprint and facial recognition for enhanced security and fraud prevention.',
                chip: 'from-[#8B5CF6] to-purple-600',
                chipShadow: 'shadow-[#8B5CF6]/25',
                linkColor: 'text-[#8B5CF6]',
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                ),
              },
              {
                title: 'Parent Portal',
                desc:
                  'Dedicated parent dashboard with real-time attendance updates, notifications, and communication tools for enhanced engagement.',
                chip: 'from-[#10B981] to-emerald-600',
                chipShadow: 'shadow-[#10B981]/25',
                linkColor: 'text-[#10B981]',
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                  />
                ),
              },
              {
                title: 'Mobile App',
                desc:
                  'Native iOS and Android apps for teachers, administrators, and parents with offline capability and push notifications.',
                chip: 'from-[#F59E0B] to-orange-600',
                chipShadow: 'shadow-[#F59E0B]/25',
                linkColor: 'text-[#F59E0B]',
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                ),
              },
            ].map((card) => (
              <div
                key={card.title}
                data-animate
                className={`group bg-white/70 backdrop-blur-xl rounded-2xl p-8 shadow-lg shadow-gray-200/50 border border-white/20 hover:shadow-xl hover:-translate-y-2 transition-all duration-500 hover:shadow-${card.chip.split(' ')[0]}/20`}
              >
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 shadow-lg ${card.chipShadow} group-hover:scale-110 transition-transform duration-300 bg-gradient-to-br ${card.chip}`}>
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {card.icon}
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">{card.title}</h3>
                <p className="text-gray-600 leading-relaxed mb-4">{card.desc}</p>
                <div className={`flex items-center font-medium ${card.linkColor}`}>
                  <span className="text-sm">Learn More</span>
                  <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations Section */}
      <section id="integrations" className="relative py-20 bg-white/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
              Seamless <span className="bg-gradient-to-r from-[#93BEE6] to-[#6B9BD9] bg-clip-text text-transparent">Integrations</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Connect with your existing educational technology stack for a unified experience.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
            {[
              { name: 'PowerSchool', chip: 'from-blue-500 to-blue-600' },
              { name: 'Canvas LMS', chip: 'from-green-500 to-green-600' },
              { name: 'Google Classroom', chip: 'from-purple-500 to-purple-600' },
              { name: 'Infinite Campus', chip: 'from-red-500 to-red-600' },
              { name: 'Skyward', chip: 'from-orange-500 to-orange-600' },
              { name: 'Blackboard', chip: 'from-indigo-500 to-indigo-600' },
            ].map((i) => (
              <div
                key={i.name}
                className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-lg shadow-gray-200/50 border border-white/20 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-center"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 bg-gradient-to-br ${i.chip}`}>
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
                  </svg>
                </div>
                <h4 className="font-semibold text-gray-800 text-sm">{i.name}</h4>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 mb-6">And 100+ more integrations available</p>
            <button
              onClick={() => router.push('/integrations')}
              className="bg-gradient-to-r from-[#93BEE6] to-[#6B9BD9] text-white px-8 py-4 rounded-xl hover:shadow-lg hover:shadow-[#93BEE6]/30 transition-all duration-300 font-medium hover:scale-105"
            >
              View All Integrations
            </button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 bg-gradient-to-r from-[#93BEE6] to-[#6B9BD9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">Ready to Experience These Features?</h2>
          <p className="text-xl text-blue-100 mb-12 max-w-3xl mx-auto">
            See how Safer Attendance can transform your institution&apos;s attendance management with our comprehensive feature set.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <button
              onClick={() => router.push('/contact')}
              className="bg-white text-[#1f2937] px-8 py-4 rounded-xl hover:bg-gray-50 transition-all duration-300 font-semibold text-lg hover:scale-105 flex items-center space-x-3 shadow-lg"
            >
              <span>Request Demo</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
            <button
              onClick={adminLogin}
              className="bg-white/20 backdrop-blur-sm text-white px-8 py-4 rounded-xl hover:bg-white/30 transition-all duration-300 font-semibold text-lg border border-white/30 hover:scale-105"
            >
              Admin Login
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#93BEE6] to-[#6B9BD9]">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5-7a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Safer Attendance</h3>
                  <p className="text-gray-400">Ensuring safety one class at a time</p>
                </div>
              </div>
              <p className="text-gray-400 mb-6 max-w-md">
                Comprehensive attendance tracking with advanced safety features for educational institutions worldwide.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Features</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#core-features" className="hover:text-white transition-colors duration-300">Core Features</a></li>
                <li><a href="#advanced" className="hover:text-white transition-colors duration-300">Advanced Tools</a></li>
                <li><a href="#integrations" className="hover:text-white transition-colors duration-300">Integrations</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-300">Security</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li>support@saferattendance.com</li>
                <li>1-800-SAFER-01</li>
                <li>24/7 Technical Support</li>
                <li>Documentation</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} Safer Attendance. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
