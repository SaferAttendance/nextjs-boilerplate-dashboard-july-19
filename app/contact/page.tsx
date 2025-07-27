'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Script from 'next/script';

export default function ContactPage() {
  const router = useRouter();

  // ---------------- Handlers (ported from inline <script>)
  const adminLogin = () => {
    router.push('/admin/login');
  };

  const goHome = () => {
    router.push('/');
  };

  const callSales = () => {
    console.log('Calling sales...');
    alert('Calling 1-800-SAFER-01... Our sales team is ready to help!');
  };

  const startLiveChat = () => {
    console.log('Starting live chat...');
    alert('Live chat opening... Connect with our support team instantly!');
  };

  const sendQuickEmail = () => {
    console.log('Opening email...');
    alert('Opening email to sales@saferattendance.com...');
  };

  const openMap = () => {
    console.log('Opening map...');
    alert('Opening directions to our office...');
  };

  const contactExecutive = (name: string, title: string) => {
    console.log(`Contacting ${name} (${title})`);
    const proper =
      name.charAt(0).toUpperCase() + name.slice(1);
    alert(
      `Connecting you with ${proper}, our ${title}. They'll be in touch within 24 hours!`
    );
  };

  const [activeTab, setActiveTab] = useState<'calendar' | 'form'>('calendar');

  const toggleMobileMenu = () => {
    const menu = document.getElementById('mobileMenu');
    if (menu) menu.classList.toggle('hidden');
  };

  // ---------------- Form submit (ported)
  const onSubmitContactForm: React.FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData.entries());

    if (
      !data.firstName ||
      !data.lastName ||
      !data.email ||
      !data.organization ||
      !data.inquiryType ||
      !data.message
    ) {
      alert('Please fill in all required fields.');
      return;
    }

    // consent is a checkbox; if not checked, it isn't present
    if (!formData.get('consent')) {
      alert('Please agree to receive communications to proceed.');
      return;
    }

    console.log('Form submitted:', data);
    alert("Thank you for your message! We'll get back to you within 24 hours.");
    (event.currentTarget as HTMLFormElement).reset();
  };

  // ---------------- Effects: smooth scrolling + entrance animations + realtime validation
  useEffect(() => {
    // Smooth scrolling for in-page anchors
    const anchors = Array.from(
      document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')
    );

    const onAnchorClick = (e: Event) => {
      e.preventDefault();
      const href = (e.currentTarget as HTMLAnchorElement).getAttribute('href');
      if (!href) return;
      const target = document.querySelector(href);
      if (target) (target as HTMLElement).scrollIntoView({ behavior: 'smooth' });
    };

    anchors.forEach((a) => a.addEventListener('click', onAnchorClick));

    // Intersection-based entrance animations for team-contact cards
    const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          (entry.target as HTMLElement).style.opacity = '1';
          (entry.target as HTMLElement).style.transform = 'translateY(0)';
        }
      });
    }, observerOptions);

    const cards = Array.from(
      document.querySelectorAll<HTMLElement>('#team-contact .bg-white\\/70')
    );
    cards.forEach((card, index) => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(30px)';
      card.style.transition = `all 0.8s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.1}s`;
      observer.observe(card);
    });

    // Real-time validation similar to original script
    const form = document.getElementById('contactForm') as HTMLFormElement | null;
    const cleanup: Array<() => void> = [];

    if (form) {
      const inputs = Array.from(
        form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
          'input[required], select[required], textarea[required]'
        )
      );

      inputs.forEach((input) => {
        const handler = () => {
          if (input.value.trim() === '') {
            input.classList.add('border-red-300');
            input.classList.remove('border-gray-200');
          } else {
            input.classList.remove('border-red-300');
            input.classList.add('border-gray-200');
          }
        };
        input.addEventListener('blur', handler);
        cleanup.push(() => input.removeEventListener('blur', handler));
      });

      const emailInput = document.getElementById('email') as HTMLInputElement | null;
      if (emailInput) {
        const emailHandler = () => {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (emailInput.value && !emailRegex.test(emailInput.value)) {
            emailInput.classList.add('border-red-300');
            emailInput.classList.remove('border-gray-200');
          } else if (emailInput.value) {
            emailInput.classList.remove('border-red-300');
            emailInput.classList.add('border-gray-200');
          }
        };
        emailInput.addEventListener('blur', emailHandler);
        cleanup.push(() => emailInput.removeEventListener('blur', emailHandler));
      }
    }

    return () => {
      anchors.forEach((a) => a.removeEventListener('click', onAnchorClick));
      cleanup.forEach((fn) => fn());
      observer.disconnect();
    };
  }, []);

  // Helper for tab button styles (match original classes when active/inactive)
  const tabClass = (isActive: boolean) =>
    isActive
      ? 'px-8 py-3 bg-gradient-to-r from-brand-blue to-brand-dark text-white rounded-xl font-semibold transition-all duration-300 hover:shadow-lg'
      : 'px-8 py-3 bg-white/70 text-gray-700 rounded-xl font-semibold transition-all duration-300 hover:bg-white/90 border border-gray-200';

  return (
    <main className="font-montserrat bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen">
      {/* Calendly script (keeps original widget behavior) */}
      <Script
        src="https://assets.calendly.com/assets/external/widget.js"
        strategy="lazyOnload"
      />

      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-brand-blue/20 to-brand-light/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-accent-purple/15 to-brand-blue/10 rounded-full blur-3xl animate-pulse [animation-delay:2s]"></div>
        <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-gradient-to-r from-accent-emerald/10 to-brand-light/15 rounded-full blur-2xl animate-pulse [animation-delay:4s]"></div>
      </div>

      {/* Navigation Header */}
      <nav className="relative bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            {/* Logo and Brand */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-brand-blue to-brand-dark rounded-xl flex items-center justify-center shadow-lg shadow-brand-blue/25">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5-7a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-accent-emerald rounded-full animate-ping"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Safer Attendance</h1>
                <p className="text-sm text-gray-600">Get In Touch</p>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#" onClick={(e) => { e.preventDefault(); goHome(); }} className="text-gray-600 hover:text-brand-dark transition-colors duration-300 font-medium">Home</a>
              <a href="#contact-info" className="text-gray-600 hover:text-brand-dark transition-colors duration-300 font-medium">Contact Info</a>
              <a href="#contact-form" className="text-gray-600 hover:text-brand-dark transition-colors duration-300 font-medium">Send Message</a>
              <a href="#team-contact" className="text-gray-600 hover:text-brand-dark transition-colors duration-300 font-medium">Our Team</a>
              <button onClick={adminLogin} className="bg-gradient-to-r from-brand-blue to-brand-dark text-white px-6 py-3 rounded-xl hover:shadow-lg hover:shadow-brand-blue/30 transition-all duration-300 font-medium hover:scale-105">
                Admin Login
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button onClick={toggleMobileMenu} className="text-gray-600 hover:text-brand-dark transition-colors duration-300" aria-label="Open menu">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          <div id="mobileMenu" className="hidden md:hidden pb-6">
            <div className="flex flex-col space-y-4">
              <a href="#" onClick={(e) => { e.preventDefault(); goHome(); }} className="text-gray-600 hover:text-brand-dark transition-colors duration-300 font-medium">Home</a>
              <a href="#contact-info" className="text-gray-600 hover:text-brand-dark transition-colors duration-300 font-medium">Contact Info</a>
              <a href="#contact-form" className="text-gray-600 hover:text-brand-dark transition-colors duration-300 font-medium">Send Message</a>
              <a href="#team-contact" className="text-gray-600 hover:text-brand-dark transition-colors duration-300 font-medium">Our Team</a>
              <button onClick={adminLogin} className="bg-gradient-to-r from-brand-blue to-brand-dark text-white px-6 py-3 rounded-xl hover:shadow-lg hover:shadow-brand-blue/30 transition-all duration-300 font-medium w-full">
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
            {/* Response Time Badge */}
            <div className="inline-flex items-center px-6 py-3 bg-accent-emerald/10 rounded-full text-accent-emerald text-lg font-semibold mb-8">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              We respond within 24 hours
            </div>

            {/* Main Headline */}
            <h1 className="text-5xl md:text-7xl font-bold text-gray-800 mb-8 leading-tight">
              Contact <span className="bg-gradient-to-r from-brand-blue to-brand-dark bg-clip-text text-transparent">Our Team</span>
            </h1>

            {/* Tagline */}
            <p className="text-2xl md:text-3xl text-gray-600 mb-6 font-medium">
              Ready to make your school safer?
            </p>

            {/* Description */}
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed mb-12">
              Our team of education and safety experts is here to help you implement the perfect attendance solution for your school. Get in touch today for a personalized consultation.
            </p>

            {/* Contact Method Tabs */}
            <div className="max-w-4xl mx-auto mb-8">
              <div className="flex justify-center space-x-4 mb-8">
                <button onClick={() => setActiveTab('calendar')} className={tabClass(activeTab === 'calendar')} id="calendar-tab">
                  Schedule Meeting
                </button>
                <button onClick={() => setActiveTab('form')} className={tabClass(activeTab === 'form')} id="form-tab">
                  Send Message
                </button>
              </div>

              {/* Schedule Your Consultation Box */}
              <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-lg shadow-gray-200/50 border border-white/20 mb-8">
                <div className="text-center">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Schedule Your Consultation</h3>
                  <p className="text-gray-600">Choose a time that works best for you to discuss your school's attendance needs.</p>
                </div>
              </div>
            </div>

            {/* Quick Contact Options */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <button onClick={callSales} className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-lg shadow-gray-200/50 border border-white/20 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                <div className="w-12 h-12 bg-gradient-to-br from-accent-emerald to-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Call Sales</h3>
                <p className="text-brand-dark font-medium">1-800-SAFER-01</p>
              </button>

              <button onClick={startLiveChat} className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-lg shadow-gray-200/50 border border-white/20 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                <div className="w-12 h-12 bg-gradient-to-br from-brand-blue to-brand-dark rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Live Chat</h3>
                <p className="text-brand-dark font-medium">Instant Support</p>
              </button>

              <button onClick={sendQuickEmail} className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-lg shadow-gray-200/50 border border-white/20 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                <div className="w-12 h-12 bg-gradient-to-br from-accent-purple to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Email Us</h3>
                <p className="text-brand-dark font-medium">sales@saferattendance.com</p>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section id="contact-form" className="relative py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
              Get In <span className="bg-gradient-to-r from-brand-blue to-brand-dark bg-clip-text text-transparent">Touch</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Send us a message or schedule a meeting directly with our team.
            </p>
          </div>

          {/* Contact Form Container (visible only when 'form' tab is active) */}
          {activeTab === 'form' && (
            <div id="contact-form-container" className="max-w-4xl mx-auto">
              <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 lg:p-12 shadow-lg shadow-gray-200/50 border border-white/20">
                <form id="contactForm" onSubmit={onSubmitContactForm} className="space-y-6">
                  {/* Personal Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-semibold text-gray-800 mb-2">First Name *</label>
                      <input type="text" id="firstName" name="firstName" required
                        className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue transition-all duration-300"
                        placeholder="Enter your first name" />
                    </div>
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-semibold text-gray-800 mb-2">Last Name *</label>
                      <input type="text" id="lastName" name="lastName" required
                        className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue transition-all duration-300"
                        placeholder="Enter your last name" />
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="email" className="block text-sm font-semibold text-gray-800 mb-2">Email Address *</label>
                      <input type="email" id="email" name="email" required
                        className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue transition-all duration-300"
                        placeholder="your.email@school.edu" />
                    </div>
                    <div>
                      <label htmlFor="phone" className="block text-sm font-semibold text-gray-800 mb-2">Phone Number</label>
                      <input type="tel" id="phone" name="phone"
                        className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue transition-all duration-300"
                        placeholder="(555) 123-4567" />
                    </div>
                  </div>

                  {/* Organization Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="organization" className="block text-sm font-semibold text-gray-800 mb-2">School/Organization *</label>
                      <input type="text" id="organization" name="organization" required
                        className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue transition-all duration-300"
                        placeholder="Your School Name" />
                    </div>
                    <div>
                      <label htmlFor="title" className="block text-sm font-semibold text-gray-800 mb-2">Job Title</label>
                      <input type="text" id="title" name="title"
                        className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue transition-all duration-300"
                        placeholder="Principal, IT Director, etc." />
                    </div>
                  </div>

                  {/* Student Count and Inquiry Type */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="studentCount" className="block text-sm font-semibold text-gray-800 mb-2">Number of Students</label>
                      <select id="studentCount" name="studentCount"
                        className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue transition-all duration-300">
                        <option value="">Select range</option>
                        <option value="1-100">1-100 students</option>
                        <option value="101-500">101-500 students</option>
                        <option value="501-1000">501-1,000 students</option>
                        <option value="1001-2500">1,001-2,500 students</option>
                        <option value="2501-5000">2,501-5,000 students</option>
                        <option value="5000+">5,000+ students</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="inquiryType" className="block text-sm font-semibold text-gray-800 mb-2">Inquiry Type *</label>
                      <select id="inquiryType" name="inquiryType" required
                        className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue transition-all duration-300">
                        <option value="">Select inquiry type</option>
                        <option value="sales">Sales & Pricing</option>
                        <option value="demo">Request Demo</option>
                        <option value="support">Technical Support</option>
                        <option value="partnership">Partnership Opportunities</option>
                        <option value="integration">System Integration</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label htmlFor="message" className="block text-sm font-semibold text-gray-800 mb-2">Message *</label>
                    <textarea id="message" name="message" rows={6} required
                      className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue transition-all duration-300 resize-none"
                      placeholder="Tell us about your school's needs and how we can help..."></textarea>
                  </div>

                  {/* File Upload */}
                  <div>
                    <label htmlFor="attachment" className="block text-sm font-semibold text-gray-800 mb-2">Attachment (Optional)</label>
                    <div className="relative">
                      <input type="file" id="attachment" name="attachment" accept=".pdf,.doc,.docx,.txt"
                        className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue transition-all duration-300" />
                      <p className="text-sm text-gray-500 mt-2">Accepted formats: PDF, DOC, DOCX, TXT (Max 10MB)</p>
                    </div>
                  </div>

                  {/* Consent Checkbox */}
                  <div className="flex items-start space-x-3">
                    <input type="checkbox" id="consent" name="consent" required
                      className="mt-1 w-5 h-5 text-brand-blue bg-white border-gray-300 rounded focus:ring-brand-blue/50 focus:ring-2" />
                    <label htmlFor="consent" className="text-sm text-gray-600 leading-relaxed">
                      I agree to receive communications from Safer Attendance regarding my inquiry. You can unsubscribe at any time.{' '}
                      <a href="/privacy-policy" className="text-brand-dark hover:underline">Privacy Policy</a>
                    </label>
                  </div>

                  {/* Submit Button */}
                  <div className="text-center pt-6">
                    <button
                      type="submit"
                      className="bg-gradient-to-r from-brand-blue to-brand-dark text-white px-12 py-4 rounded-xl hover:shadow-lg hover:shadow-brand-blue/30 transition-all duration-300 font-semibold text-lg hover:scale-105 flex items-center space-x-3 mx-auto"
                    >
                      <span>Send Message</span>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                      </svg>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Calendly Container (visible only when 'calendar' tab is active) */}
          {activeTab === 'calendar' && (
            <div id="calendly-container" className="max-w-6xl mx-auto">
              <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 shadow-lg shadow-gray-200/50 border border-white/20">
                <div
                  className="calendly-inline-widget"
                  data-url="https://calendly.com/safer-attendance/30min"
                  style={{ minWidth: 320, height: 700 }}
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Contact Information Section */}
      <section id="contact-info" className="relative py-20 bg-white/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
              Contact <span className="bg-gradient-to-r from-brand-blue to-brand-dark bg-clip-text text-transparent">Information</span>
            </h2>
            <p className="text-xl text-gray-600">Multiple ways to reach us for all your needs.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Details */}
            <div className="space-y-8">
              {/* Office Address */}
              <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-8 shadow-lg shadow-gray-200/50 border border-white/20">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-accent-rose to-rose-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Office Address</h3>
                    <p className="text-gray-600 leading-relaxed">
                      Safer Attendance Headquarters<br />
                      1234 Education Drive, Suite 500<br />
                      Innovation City, IC 12345<br />
                      United States
                    </p>
                  </div>
                </div>
              </div>

              {/* Phone Numbers */}
              <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-8 shadow-lg shadow-gray-200/50 border border-white/20">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-accent-emerald to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Phone Support</h3>
                    <div className="space-y-2 text-gray-600">
                      <p><strong>Sales:</strong> 1-800-SAFER-01</p>
                      <p><strong>Support:</strong> 1-800-SAFER-02</p>
                      <p><strong>Emergency:</strong> 1-800-SAFER-911</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Email Addresses */}
              <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-8 shadow-lg shadow-gray-200/50 border border-white/20">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-accent-purple to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Email Contacts</h3>
                    <div className="space-y-2 text-gray-600">
                      <p><strong>General:</strong> info@saferattendance.com</p>
                      <p><strong>Sales:</strong> sales@saferattendance.com</p>
                      <p><strong>Support:</strong> support@saferattendance.com</p>
                      <p><strong>Partnerships:</strong> partners@saferattendance.com</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Business Hours & Map */}
            <div className="space-y-8">
              {/* Business Hours */}
              <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-8 shadow-lg shadow-gray-200/50 border border-white/20">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-accent-orange to-orange-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Business Hours</h3>
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
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-sm"><strong>Emergency Support:</strong> 24/7 Available</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive Map Placeholder */}
              <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-8 shadow-lg shadow-gray-200/50 border border-white/20">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Find Us</h3>
                <div className="bg-gradient-to-br from-brand-blue/20 to-brand-light/10 rounded-xl h-64 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-brand-blue to-brand-dark rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                      </svg>
                    </div>
                    <p className="text-gray-600 mb-4">Interactive Map</p>
                    <button onClick={openMap} className="bg-brand-blue text-white px-6 py-2 rounded-lg hover:bg-brand-dark transition-colors duration-300">
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
      <section id="team-contact" className="relative py-20 bg-white/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
              Contact Our <span className="bg-gradient-to-r from-brand-blue to-brand-dark bg-clip-text text-transparent">Leadership</span>
            </h2>
            <p className="text-xl text-gray-600">Reach out directly to our executive team for specialized assistance.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Nicholas Wagner - CEO */}
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-lg shadow-gray-200/50 border border-white/20 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-brand-blue to-brand-dark rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-1">Nicholas Wagner</h3>
              <p className="text-brand-dark font-medium mb-3">CEO</p>
              <p className="text-sm text-gray-600 mb-4">Strategic partnerships & vision</p>
              <button onClick={() => contactExecutive('nicholas', 'CEO')} className="w-full bg-gradient-to-r from-brand-blue to-brand-dark text-white py-2 rounded-lg hover:shadow-md transition-all duration-300 text-sm font-medium">
                Contact Nicholas
              </button>
            </div>

            {/* Ashley Wagner - CFO */}
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-lg shadow-gray-200/50 border border-white/20 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-accent-emerald to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-1">Ashley Wagner</h3>
              <p className="text-accent-emerald font-medium mb-3">CFO</p>
              <p className="text-sm text-gray-600 mb-4">Pricing & financial planning</p>
              <button onClick={() => contactExecutive('ashley', 'CFO')} className="w-full bg-gradient-to-r from-accent-emerald to-emerald-600 text-white py-2 rounded-lg hover:shadow-md transition-all duration-300 text-sm font-medium">
                Contact Ashley
              </button>
            </div>

            {/* Kira Quidort - CTO */}
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-lg shadow-gray-200/50 border border-white/20 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-accent-purple to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-1">Kira Quidort</h3>
              <p className="text-accent-purple font-medium mb-3">CTO</p>
              <p className="text-sm text-gray-600 mb-4">Technical integrations</p>
              <button onClick={() => contactExecutive('kira', 'CTO')} className="w-full bg-gradient-to-r from-accent-purple to-purple-600 text-white py-2 rounded-lg hover:shadow-md transition-all duration-300 text-sm font-medium">
                Contact Kira
              </button>
            </div>

            {/* Eric Quidort - CMO */}
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-lg shadow-gray-200/50 border border-white/20 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-accent-orange to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-1">Eric Quidort</h3>
              <p className="text-accent-orange font-medium mb-3">CMO</p>
              <p className="text-sm text-gray-600 mb-4">Marketing & outreach</p>
              <button onClick={() => contactExecutive('eric', 'CMO')} className="w-full bg-gradient-to-r from-accent-orange to-orange-600 text-white py-2 rounded-lg hover:shadow-md transition-all duration-300 text-sm font-medium">
                Contact Eric
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ / Chat Section */}
      <section className="relative py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
              Quick <span className="bg-gradient-to-r from-brand-blue to-brand-dark bg-clip-text text-transparent">Answers</span>
            </h2>
            <p className="text-xl text-gray-600">Common questions before you contact us.</p>
          </div>

          {/* Chat interface */}
          <div className="max-w-2xl mx-auto">
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-6 shadow-lg shadow-gray-200/50 border border-white/20">
              {/* Chat Header */}
              <div className="flex items-center space-x-3 pb-4 border-b border-gray-200 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-brand-blue to-brand-dark rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Safer Attendance Support</h3>
                  <p className="text-sm text-green-500 flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    Online now
                  </p>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {/* Q1 */}
                <div className="flex justify-end">
                  <div className="bg-brand-blue text-white rounded-2xl rounded-br-md px-4 py-3 max-w-xs">
                    <p className="text-sm">How quickly can we get started?</p>
                    <p className="text-xs opacity-75 mt-1">2:14 PM</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-brand-blue to-brand-dark rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                  </div>
                  <div className="bg-gray-100 text-gray-800 rounded-2xl rounded-bl-md px-4 py-3 max-w-sm">
                    <p className="text-sm">Most schools can be up and running within 1-2 weeks. We handle all setup, training, and data migration for you! 🚀</p>
                    <p className="text-xs text-gray-500 mt-1">2:14 PM</p>
                  </div>
                </div>

                {/* Q2 */}
                <div className="flex justify-end">
                  <div className="bg-brand-blue text-white rounded-2xl rounded-br-md px-4 py-3 max-w-xs">
                    <p className="text-sm">Do you offer free trials?</p>
                    <p className="text-xs opacity-75 mt-1">2:15 PM</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-brand-blue to-brand-dark rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                  </div>
                  <div className="bg-gray-100 text-gray-800 rounded-2xl rounded-bl-md px-4 py-3 max-w-sm">
                    <p className="text-sm">Yes! We offer a 30-day free trial with full access to all features. No credit card required to start. ✨</p>
                    <p className="text-xs text-gray-500 mt-1">2:15 PM</p>
                  </div>
                </div>

                {/* Q3 */}
                <div className="flex justify-end">
                  <div className="bg-brand-blue text-white rounded-2xl rounded-br-md px-4 py-3 max-w-xs">
                    <p className="text-sm">What support do you provide?</p>
                    <p className="text-xs opacity-75 mt-1">2:16 PM</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-brand-blue to-brand-dark rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                  </div>
                  <div className="bg-gray-100 text-gray-800 rounded-2xl rounded-bl-md px-4 py-3 max-w-sm">
                    <p className="text-sm">We provide 24/7 emergency support, comprehensive training, ongoing technical assistance, and dedicated account management. 💪</p>
                    <p className="text-xs text-gray-500 mt-1">2:16 PM</p>
                  </div>
                </div>

                {/* Q4 */}
                <div className="flex justify-end">
                  <div className="bg-brand-blue text-white rounded-2xl rounded-br-md px-4 py-3 max-w-xs">
                    <p className="text-sm">How much does it cost?</p>
                    <p className="text-xs opacity-75 mt-1">2:17 PM</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-brand-blue to-brand-dark rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                  </div>
                  <div className="bg-gray-100 text-gray-800 rounded-2xl rounded-bl-md px-4 py-3 max-w-sm">
                    <p className="text-sm">Pricing varies by school size and features. Let's schedule a call to discuss your specific needs and get you a custom quote! 💰</p>
                    <p className="text-xs text-gray-500 mt-1">2:17 PM</p>
                  </div>
                </div>

                {/* Typing indicator */}
                <div className="flex items-start space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-brand-blue to-brand-dark rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                  </div>
                  <div className="bg-gray-100 text-gray-800 rounded-2xl rounded-bl-md px-4 py-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.1s]"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chat Input */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="flex-1 bg-gray-100 rounded-full px-4 py-2">
                    <input
                      type="text"
                      placeholder="Ask us anything..."
                      className="w-full bg-transparent text-gray-600 placeholder-gray-400 focus:outline-none text-sm"
                      readOnly
                    />
                  </div>
                  <button onClick={startLiveChat} className="bg-gradient-to-r from-brand-blue to-brand-dark text-white p-2 rounded-full hover:shadow-lg transition-all duration-300">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                    </svg>
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">Click the send button to start a real conversation with our team!</p>
              </div>
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
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5-7a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Safer Attendance</h3>
                  <p className="text-gray-400">We're here to help</p>
                </div>
              </div>
              <p className="text-gray-400 mb-6 max-w-md">
                Ready to make your school safer? Contact our team today for a personalized consultation and see how Safer Attendance can protect your students.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Contact</h4>
              <ul className="space-y-2 text-gray-400">
                <li>📞 1-800-SAFER-01</li>
                <li>✉️ sales@saferattendance.com</li>
                <li>💬 Live Chat Available</li>
                <li>🚨 24/7 Emergency Support</li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Office Hours</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Mon-Fri: 8AM-6PM EST</li>
                <li>Saturday: 9AM-2PM EST</li>
                <li>Sunday: Closed</li>
                <li>Emergency: Always Available</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Safer Attendance. All rights reserved. We respond within 24 hours.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
