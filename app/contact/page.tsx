// app/contact/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import Script from 'next/script';

export default function ContactPage() {
  const router = useRouter();

  // Mobile menu
  const [mobileOpen, setMobileOpen] = useState(false);
  const toggleMobileMenu = useCallback(() => setMobileOpen(o => !o), []);

  // Smooth-scroll helper
  const smoothScroll = useCallback((selector: string) => {
    const el = document.querySelector(selector) as HTMLElement | null;
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  // Nav actions
  const adminLogin = useCallback(() => router.push('/admin/login'), [router]);
  const goHome = useCallback(() => router.push('/'), [router]);

  // Quick actions
  const callSales = useCallback(() => {
    window.location.href = 'tel:1-800-SAFER-01';
  }, []);

  const startLiveChat = useCallback(() => {
    // Wire this to your chat provider (Intercom/Crisp/Drift) as desired
    alert('Live chat opening... Connect with our support team instantly!');
  }, []);

  const sendQuickEmail = useCallback(() => {
    window.location.href = 'mailto:sales@saferattendance.com?subject=Contact%20Safer%20Attendance';
  }, []);

  const openMap = useCallback(() => {
    window.open('https://maps.google.com/?q=Safer+Attendance+Headquarters', '_blank');
  }, []);

  const contactExecutive = useCallback((name: string, title: string) => {
    const pretty = name.charAt(0).toUpperCase() + name.slice(1);
    alert(`Connecting you with ${pretty}, our ${title}. They'll be in touch within 24 hours!`);
  }, []);

  // Entrance animations for leadership cards
  useEffect(() => {
    const cards = Array.from(document.querySelectorAll('#team-contact .bg-white\\/70'));
    if (!cards.length || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).style.opacity = '1';
            (entry.target as HTMLElement).style.transform = 'translateY(0)';
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    cards.forEach((card, i) => {
      const el = card as HTMLElement;
      el.style.opacity = '0';
      el.style.transform = 'translateY(30px)';
      el.style.transition = `all 0.8s cubic-bezier(0.4, 0, 0.2, 1) ${i * 0.1}s`;
      observer.observe(card);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <main className="font-montserrat bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen">
      {/* Calendly script */}
      <Script src="https://assets.calendly.com/assets/external/widget.js" strategy="lazyOnload" />

      {/* Animated Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-gradient-to-br from-brand-blue/20 to-brand-light/10 blur-3xl animate-pulse" />
        <div
          className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-gradient-to-tr from-accent-purple/15 to-brand-blue/10 blur-3xl animate-pulse"
          style={{ animationDelay: '2s' }}
        />
        <div
          className="absolute left-1/4 top-1/3 h-64 w-64 rounded-full bg-gradient-to-r from-accent-emerald/10 to-brand-light/15 blur-2xl animate-pulse"
          style={{ animationDelay: '4s' }}
        />
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
                <p className="text-sm text-gray-600">Get In Touch</p>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="hidden items-center space-x-8 md:flex">
              <button onClick={goHome} className="font-medium text-gray-600 transition-colors duration-300 hover:text-brand-dark">
                Home
              </button>
              <button
                onClick={() => smoothScroll('#contact-info')}
                className="font-medium text-gray-600 transition-colors duration-300 hover:text-brand-dark"
              >
                Contact Info
              </button>
              <button
                onClick={() => smoothScroll('#quick-contact')}
                className="font-medium text-gray-600 transition-colors duration-300 hover:text-brand-dark"
              >
                Send Message
              </button>
              <button
                onClick={() => smoothScroll('#team-contact')}
                className="font-medium text-gray-600 transition-colors duration-300 hover:text-brand-dark"
              >
                Our Team
              </button>
              <button
                onClick={adminLogin}
                className="rounded-xl bg-gradient-to-r from-brand-blue to-brand-dark px-6 py-3 font-medium text-white transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-brand-blue/30"
              >
                Admin Login
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={toggleMobileMenu}
                className="text-gray-600 transition-colors duration-300 hover:text-brand-dark"
                aria-label="Open menu"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          <div className={`${mobileOpen ? '' : 'hidden'} pb-6 md:hidden`} id="mobileMenu">
            <div className="flex flex-col space-y-4">
              <button
                onClick={() => {
                  goHome();
                  setMobileOpen(false);
                }}
                className="text-left font-medium text-gray-600 transition-colors duration-300 hover:text-brand-dark"
              >
                Home
              </button>
              <button
                onClick={() => {
                  smoothScroll('#contact-info');
                  setMobileOpen(false);
                }}
                className="text-left font-medium text-gray-600 transition-colors duration-300 hover:text-brand-dark"
              >
                Contact Info
              </button>
              <button
                onClick={() => {
                  smoothScroll('#quick-contact');
                  setMobileOpen(false);
                }}
                className="text-left font-medium text-gray-600 transition-colors duration-300 hover:text-brand-dark"
              >
                Send Message
              </button>
              <button
                onClick={() => {
                  smoothScroll('#team-contact');
                  setMobileOpen(false);
                }}
                className="text-left font-medium text-gray-600 transition-colors duration-300 hover:text-brand-dark"
              >
                Our Team
              </button>
              <button
                onClick={() => {
                  adminLogin();
                  setMobileOpen(false);
                }}
                className="w-full rounded-xl bg-gradient-to-r from-brand-blue to-brand-dark px-6 py-3 font-medium text-white transition-all duration-300 hover:shadow-lg hover:shadow-brand-blue/30"
              >
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
            {/* Response Time Badge */}
            <div className="mb-8 inline-flex items-center rounded-full bg-accent-emerald/10 px-6 py-3 text-lg font-semibold text-accent-emerald">
              <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              We respond within 24 hours
            </div>

            {/* Main Headline */}
            <h1 className="mb-8 text-5xl font-bold leading-tight text-gray-800 md:text-7xl">
              Contact{' '}
              <span className="bg-gradient-to-r from-brand-blue to-brand-dark bg-clip-text text-transparent">Our Team</span>
            </h1>

            {/* Tagline */}
            <p className="mb-6 text-2xl font-medium text-gray-600 md:text-3xl">Ready to make your school safer?</p>

            {/* Description */}
            <p className="mx-auto mb-12 max-w-4xl text-xl leading-relaxed text-gray-600">
              Our team of education and safety experts is here to help you implement the perfect attendance solution for your school.
              Get in touch today for a personalized consultation.
            </p>

            {/* Simple CTA buttons (scroll) */}
            <div className="mx-auto flex max-w-4xl justify-center gap-4">
              <button
                onClick={() => smoothScroll('#schedule')}
                className="rounded-xl bg-gradient-to-r from-brand-blue to-brand-dark px-8 py-3 font-semibold text-white transition-all duration-300 hover:shadow-lg"
              >
                Schedule Meeting
              </button>
              <button
                onClick={() => smoothScroll('#quick-contact')}
                className="rounded-xl border border-gray-200 bg-white/70 px-8 py-3 font-semibold text-gray-700 transition-all duration-300 hover:bg-white/90"
              >
                Send Message
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Schedule Section (Calendly) */}
      <section id="schedule" className="relative py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <div className="rounded-3xl border border-white/20 bg-white/70 p-2 shadow-lg shadow-gray-200/50 backdrop-blur-xl">
              <div
                className="calendly-inline-widget"
                data-url="https://calendly.com/safer-attendance/30min"
                style={{ minWidth: '320px', height: '800px' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Quick Answers (chat-style FAQ) */}
      <section className="relative py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="mb-6 text-4xl font-bold text-gray-800 md:text-5xl">
              Quick <span className="bg-gradient-to-r from-brand-blue to-brand-dark bg-clip-text text-transparent">Answers</span>
            </h2>
            <p className="text-xl text-gray-600">Common questions before you contact us.</p>
          </div>

          <div className="mx-auto max-w-2xl">
            <div className="rounded-3xl border border-white/20 bg-white/70 p-6 shadow-lg shadow-gray-200/50 backdrop-blur-xl">
              {/* Chat Header */}
              <div className="mb-6 flex items-center space-x-3 border-b border-gray-200 pb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-blue to-brand-dark">
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Safer Attendance Support</h3>
                  <p className="flex items-center text-sm text-green-500">
                    <span className="mr-2 h-2 w-2 rounded-full bg-green-500" />
                    Online now
                  </p>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {/* Q1 */}
                <div className="flex justify-end">
                  <div className="max-w-xs rounded-2xl rounded-br-md bg-brand-blue px-4 py-3 text-sm text-white">
                    <p>How quickly can we get started?</p>
                    <p className="mt-1 text-xs opacity-75">2:14 PM</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-blue to-brand-dark">
                    <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="max-w-sm rounded-2xl rounded-bl-md bg-gray-100 px-4 py-3 text-gray-800">
                    <p className="text-sm">Most schools can be up and running within 1–2 weeks. We handle all setup, training, and data migration for you! 🚀</p>
                    <p className="mt-1 text-xs text-gray-500">2:14 PM</p>
                  </div>
                </div>

                {/* Q2 */}
                <div className="flex justify-end">
                  <div className="max-w-xs rounded-2xl rounded-br-md bg-brand-blue px-4 py-3 text-sm text-white">
                    <p>Do you offer free trials?</p>
                    <p className="mt-1 text-xs opacity-75">2:15 PM</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-blue to-brand-dark">
                    <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="max-w-sm rounded-2xl rounded-bl-md bg-gray-100 px-4 py-3 text-gray-800">
                    <p className="text-sm">Yes! We offer a 30-day free trial with full access to all features. No credit card required to start. ✨</p>
                    <p className="mt-1 text-xs text-gray-500">2:15 PM</p>
                  </div>
                </div>

                {/* Q3 */}
                <div className="flex justify-end">
                  <div className="max-w-xs rounded-2xl rounded-br-md bg-brand-blue px-4 py-3 text-sm text-white">
                    <p>What support do you provide?</p>
                    <p className="mt-1 text-xs opacity-75">2:16 PM</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-blue to-brand-dark">
                    <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="max-w-sm rounded-2xl rounded-bl-md bg-gray-100 px-4 py-3 text-gray-800">
                    <p className="text-sm">We provide 24/7 emergency support, comprehensive training, ongoing technical assistance, and dedicated account management. 💪</p>
                    <p className="mt-1 text-xs text-gray-500">2:16 PM</p>
                  </div>
                </div>

                {/* Q4 */}
                <div className="flex justify-end">
                  <div className="max-w-xs rounded-2xl rounded-br-md bg-brand-blue px-4 py-3 text-sm text-white">
                    <p>How much does it cost?</p>
                    <p className="mt-1 text-xs opacity-75">2:17 PM</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-blue to-brand-dark">
                    <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="max-w-sm rounded-2xl rounded-bl-md bg-gray-100 px-4 py-3 text-gray-800">
                    <p className="text-sm">Pricing varies by school size and features. Let's schedule a call to discuss your specific needs and get you a custom quote! 💰</p>
                    <p className="mt-1 text-xs text-gray-500">2:17 PM</p>
                  </div>
                </div>

                {/* Typing indicator */}
                <div className="flex items-start space-x-2">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-blue to-brand-dark">
                    <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="rounded-2xl rounded-bl-md bg-gray-100 px-4 py-2">
                    <div className="flex space-x-1">
                      <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" />
                      <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '0.1s' }} />
                      <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Chat Input */}
              <div className="mt-6 border-t border-gray-200 pt-4">
                <div className="flex items-center space-x-3">
                  <div className="flex-1 rounded-full bg-gray-100 px-4 py-2">
                    <input
                      type="text"
                      placeholder="Ask us anything..."
                      className="w-full bg-transparent text-sm text-gray-600 placeholder-gray-400 focus:outline-none"
                      readOnly
                    />
                  </div>
                  <button
                    onClick={startLiveChat}
                    className="rounded-full bg-gradient-to-r from-brand-blue to-brand-dark p-2 text-white transition-all duration-300 hover:shadow-lg"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
                <p className="mt-2 text-center text-xs text-gray-500">Click the send button to start a real conversation with our team!</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Information Section */}
      <section id="contact-info" className="relative bg-white/30 py-20 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="mb-6 text-4xl font-bold text-gray-800 md:text-5xl">
              Contact <span className="bg-gradient-to-r from-brand-blue to-brand-dark bg-clip-text text-transparent">Information</span>
            </h2>
            <p className="text-xl text-gray-600">Multiple ways to reach us for all your needs.</p>
          </div>

          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
            {/* Contact Details */}
            <div className="space-y-8">
              {/* Office Address */}
              <div className="rounded-2xl border border-white/20 bg-white/70 p-8 shadow-lg shadow-gray-200/50 backdrop-blur-xl">
                <div className="flex items-start space-x-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent-rose to-rose-600">
                    <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="mb-2 text-xl font-semibold text-gray-800">Office Address</h3>
                    <p className="leading-relaxed text-gray-600">
                      Safer Attendance Headquarters
                      <br />
                      1234 Education Drive, Suite 500
                      <br />
                      Innovation City, IC 12345
                      <br />
                      United States
                    </p>
                  </div>
                </div>
              </div>

              {/* Phone Numbers */}
              <div className="rounded-2xl border border-white/20 bg-white/70 p-8 shadow-lg shadow-gray-200/50 backdrop-blur-xl">
                <div className="flex items-start space-x-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent-emerald to-emerald-600">
                    <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="mb-2 text-xl font-semibold text-gray-800">Phone Support</h3>
                    <div className="space-y-2 text-gray-600">
                      <p>
                        <strong>Sales:</strong> 1-800-SAFER-01
                      </p>
                      <p>
                        <strong>Support:</strong> 1-800-SAFER-02
                      </p>
                      <p>
                        <strong>Emergency:</strong> 1-800-SAFER-911
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Email Addresses */}
              <div className="rounded-2xl border border-white/20 bg-white/70 p-8 shadow-lg shadow-gray-200/50 backdrop-blur-xl">
                <div className="flex items-start space-x-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent-purple to-purple-600">
                    <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="mb-2 text-xl font-semibold text-gray-800">Email Contacts</h3>
                    <div className="space-y-2 text-gray-600">
                      <p>
                        <strong>General:</strong> info@saferattendance.com
                      </p>
                      <p>
                        <strong>Sales:</strong> sales@saferattendance.com
                      </p>
                      <p>
                        <strong>Support:</strong> support@saferattendance.com
                      </p>
                      <p>
                        <strong>Partnerships:</strong> partners@saferattendance.com
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Business Hours & Map */}
            <div className="space-y-8">
              {/* Business Hours */}
              <div className="rounded-2xl border border-white/20 bg-white/70 p-8 shadow-lg shadow-gray-200/50 backdrop-blur-xl">
                <div className="flex items-start space-x-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent-orange to-orange-600">
                    <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="mb-4 text-xl font-semibold text-gray-800">Business Hours</h3>
                    <div className="space-y-2 text-gray-600">
                      <div className="flex justify-between">
                        <span>Monday - Friday:</span>
                        <span>8:00 AM - 6:00 PM EST</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Saturday:</span>
                        <span>9:00 AM - 2:00 PM EST</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Sunday:</span>
                        <span>Closed</span>
                      </div>
                      <div className="mt-4 border-t border-gray-200 pt-4">
                        <p className="text-sm">
                          <strong>Emergency Support:</strong> 24/7 Available
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive Map Placeholder */}
              <div className="rounded-2xl border border-white/20 bg-white/70 p-8 shadow-lg shadow-gray-200/50 backdrop-blur-xl">
                <h3 className="mb-4 text-xl font-semibold text-gray-800">Find Us</h3>
                <div className="flex h-64 items-center justify-center rounded-xl bg-gradient-to-br from-brand-blue/20 to-brand-light/10">
                  <div className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-brand-blue to-brand-dark">
                      <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <p className="mb-4 text-gray-600">Interactive Map</p>
                    <button
                      onClick={openMap}
                      className="rounded-lg bg-brand-blue px-6 py-2 text-white transition-colors duration-300 hover:bg-brand-dark"
                    >
                      Get Directions
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Contact Section */}
      <section id="team-contact" className="relative bg-white/30 py-20 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="mb-6 text-4xl font-bold text-gray-800 md:text-5xl">
              Contact Our{' '}
              <span className="bg-gradient-to-r from-brand-blue to-brand-dark bg-clip-text text-transparent">Leadership</span>
            </h2>
            <p className="text-xl text-gray-600">Reach out directly to our executive team for specialized assistance.</p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {/* CEO */}
            <div className="rounded-2xl border border-white/20 bg-white/70 p-6 text-center shadow-lg shadow-gray-200/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl backdrop-blur-xl">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-brand-blue to-brand-dark">
                <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="mb-1 text-lg font-bold text-gray-800">Nicholas Wagner</h3>
              <p className="mb-3 font-medium text-brand-dark">CEO</p>
              <p className="mb-4 text-sm text-gray-600">Strategic partnerships &amp; vision</p>
              <button
                onClick={() => contactExecutive('nicholas', 'CEO')}
                className="w-full rounded-lg bg-gradient-to-r from-brand-blue to-brand-dark py-2 text-sm font-medium text-white transition-all duration-300 hover:shadow-md"
              >
                Contact Nicholas
              </button>
            </div>

            {/* CFO */}
            <div className="rounded-2xl border border-white/20 bg-white/70 p-6 text-center shadow-lg shadow-gray-200/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl backdrop-blur-xl">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-accent-emerald to-emerald-600">
                <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="mb-1 text-lg font-bold text-gray-800">Ashley Wagner</h3>
              <p className="mb-3 font-medium text-accent-emerald">CFO</p>
              <p className="mb-4 text-sm text-gray-600">Pricing &amp; financial planning</p>
              <button
                onClick={() => contactExecutive('ashley', 'CFO')}
                className="w-full rounded-lg bg-gradient-to-r from-accent-emerald to-emerald-600 py-2 text-sm font-medium text-white transition-all duration-300 hover:shadow-md"
              >
                Contact Ashley
              </button>
            </div>

            {/* CTO */}
            <div className="rounded-2xl border border-white/20 bg-white/70 p-6 text-center shadow-lg shadow-gray-200/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl backdrop-blur-xl">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-accent-purple to-purple-600">
                <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="mb-1 text-lg font-bold text-gray-800">Kira Quidort</h3>
              <p className="mb-3 font-medium text-accent-purple">CTO</p>
              <p className="mb-4 text-sm text-gray-600">Technical integrations</p>
              <button
                onClick={() => contactExecutive('kira', 'CTO')}
                className="w-full rounded-lg bg-gradient-to-r from-accent-purple to-purple-600 py-2 text-sm font-medium text-white transition-all duration-300 hover:shadow-md"
              >
                Contact Kira
              </button>
            </div>

            {/* CMO */}
            <div className="rounded-2xl border border-white/20 bg-white/70 p-6 text-center shadow-lg shadow-gray-200/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl backdrop-blur-xl">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-accent-orange to-orange-600">
                <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="mb-1 text-lg font-bold text-gray-800">Eric Quidort</h3>
              <p className="mb-3 font-medium text-accent-orange">CMO</p>
              <p className="mb-4 text-sm text-gray-600">Marketing &amp; outreach</p>
              <button
                onClick={() => contactExecutive('eric', 'CMO')}
                className="w-full rounded-lg bg-gradient-to-r from-accent-orange to-orange-600 py-2 text-sm font-medium text-white transition-all duration-300 hover:shadow-md"
              >
                Contact Eric
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Contact Options */}
      <section id="quick-contact" className="relative bg-white/30 py-20 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="mb-6 text-4xl font-bold text-gray-800 md:text-5xl">
              Quick <span className="bg-gradient-to-r from-brand-blue to-brand-dark bg-clip-text text-transparent">Contact</span>
            </h2>
            <p className="text-xl text-gray-600">Get in touch with us instantly through your preferred method.</p>
          </div>

          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-3">
            <button
              onClick={callSales}
              className="group rounded-2xl border border-white/20 bg-white/70 p-6 shadow-lg shadow-gray-200/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl backdrop-blur-xl"
            >
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-accent-emerald to-emerald-600 transition-transform duration-300 group-hover:scale-110">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-800">Call Sales</h3>
              <p className="font-medium text-brand-dark">1-800-SAFER-01</p>
            </button>

            <button
              onClick={startLiveChat}
              className="group rounded-2xl border border-white/20 bg-white/70 p-6 shadow-lg shadow-gray-200/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl backdrop-blur-xl"
            >
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-blue to-brand-dark transition-transform duration-300 group-hover:scale-110">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-800">Live Chat</h3>
              <p className="font-medium text-brand-dark">Instant Support</p>
            </button>

            <button
              onClick={sendQuickEmail}
              className="group rounded-2xl border border-white/20 bg-white/70 p-6 shadow-lg shadow-gray-200/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl backdrop-blur-xl"
            >
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-accent-purple to-purple-600 transition-transform duration-300 group-hover:scale-110">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-800">Email Us</h3>
              <p className="font-medium text-brand-dark">sales@saferattendance.com</p>
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-gray-900 py-16 text-white">
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
                  <p className="text-gray-400">We're here to help</p>
                </div>
              </div>
              <p className="mb-6 max-w-md text-gray-400">
                Ready to make your school safer? Contact our team today for a personalized consultation and see how Safer Attendance can protect your students.
              </p>
            </div>
            <div>
              <h4 className="mb-4 text-lg font-semibold">Quick Contact</h4>
              <ul className="space-y-2 text-gray-400">
                <li>📞 1-800-SAFER-01</li>
                <li>✉️ sales@saferattendance.com</li>
                <li>💬 Live Chat Available</li>
                <li>🚨 24/7 Emergency Support</li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-lg font-semibold">Office Hours</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Mon-Fri: 8AM-6PM EST</li>
                <li>Saturday: 9AM-2PM EST</li>
                <li>Sunday: Closed</li>
                <li>Emergency: Always Available</li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Safer Attendance. All rights reserved. We respond within 24 hours.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
