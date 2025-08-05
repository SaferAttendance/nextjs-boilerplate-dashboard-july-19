'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';

export default function AboutPage() {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const adminLogin = useCallback(() => {
    router.push('/admin/login');
  }, [router]);

  const goHome = useCallback(() => {
    router.push('/');
  }, [router]);

  const contactTeam = useCallback(() => {
    // adjust to your contact route if you have one
    router.push('/contact');
  }, [router]);

  const toggleMobileMenu = useCallback(() => setMobileOpen((v) => !v), []);

  useEffect(() => {
    // Smooth scrolling for in-page anchors
    const anchors = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]'));
    const onClick = (e: Event) => {
      e.preventDefault();
      const el = e.currentTarget as HTMLAnchorElement;
      const target = document.querySelector(el.getAttribute('href') || '');
      if (target) target.scrollIntoView({ behavior: 'smooth' });
      setMobileOpen(false);
    };
    anchors.forEach((a) => a.addEventListener('click', onClick));

    // Reveal-on-scroll animations
    const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const t = entry.target as HTMLElement;
          t.style.opacity = '1';
          t.style.transform = 'translateY(0)';
          io.unobserve(t);
        }
      });
    }, observerOptions);

    const cards = Array.from(document.querySelectorAll<HTMLElement>('.reveal-card'));
    cards.forEach((card, index) => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(30px)';
      card.style.transition = `all 0.8s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.1}s`;
      io.observe(card);
    });

    return () => {
      anchors.forEach((a) => a.removeEventListener('click', onClick));
      io.disconnect();
    };
  }, []);

  return (
    <body className="font-montserrat bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-brand-blue/20 to-brand-light/10 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-accent-purple/15 to-brand-blue/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: '2s' }}
        />
        <div
          className="absolute top-1/3 left-1/4 w-64 h-64 bg-gradient-to-r from-accent-emerald/10 to-brand-light/15 rounded-full blur-2xl animate-pulse"
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
                <div className="w-12 h-12 bg-gradient-to-br from-brand-blue to-brand-dark rounded-xl flex items-center justify-center shadow-lg shadow-brand-blue/25">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5-7a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-accent-emerald rounded-full animate-ping" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Safer Attendance</h1>
                <p className="text-sm text-gray-600">About Our Team</p>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <a onClick={goHome} className="cursor-pointer text-gray-600 hover:text-brand-dark transition-colors duration-300 font-medium">
                Home
              </a>
              <a href="#story" className="text-gray-600 hover:text-brand-dark transition-colors duration-300 font-medium">
                Our Story
              </a>
              <a href="#team" className="text-gray-600 hover:text-brand-dark transition-colors duration-300 font-medium">
                Leadership
              </a>
              <a href="#values" className="text-gray-600 hover:text-brand-dark transition-colors duration-300 font-medium">
                Values
              </a>
              <button
                onClick={adminLogin}
                className="bg-gradient-to-r from-brand-blue to-brand-dark text-white px-6 py-3 rounded-xl hover:shadow-lg hover:shadow-brand-blue/30 transition-all duration-300 font-medium hover:scale-105"
              >
                Admin Login
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button onClick={toggleMobileMenu} className="text-gray-600 hover:text-brand-dark transition-colors duration-300">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          <div className={`${mobileOpen ? '' : 'hidden'} md:hidden pb-6`}>
            <div className="flex flex-col space-y-4">
              <a onClick={goHome} className="cursor-pointer text-gray-600 hover:text-brand-dark transition-colors duration-300 font-medium">
                Home
              </a>
              <a href="#story" className="text-gray-600 hover:text-brand-dark transition-colors duration-300 font-medium">
                Our Story
              </a>
              <a href="#team" className="text-gray-600 hover:text-brand-dark transition-colors duration-300 font-medium">
                Leadership
              </a>
              <a href="#values" className="text-gray-600 hover:text-brand-dark transition-colors duration-300 font-medium">
                Values
              </a>
              <button
                onClick={adminLogin}
                className="bg-gradient-to-r from-brand-blue to-brand-dark text-white px-6 py-3 rounded-xl hover:shadow-lg hover:shadow-brand-blue/30 transition-all duration-300 font-medium w-full"
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
            {/* Mission Badge */}
            <div className="inline-flex items-center px-6 py-3 bg-brand-blue/10 rounded-full text-brand-dark text-lg font-semibold mb-8">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              Protecting Students Everywhere
            </div>

            {/* Main Headline */}
            <h1 className="text-5xl md:text-7xl font-bold text-gray-800 mb-8 leading-tight">
              About <span className="bg-gradient-to-r from-brand-blue to-brand-dark bg-clip-text text-transparent">Safer Attendance</span>
            </h1>

            {/* Tagline */}
            <p className="text-2xl md:text-3xl text-gray-600 mb-6 font-medium">Innovating student safety through technology</p>

            {/* Description */}
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed mb-12">
              We&apos;re a passionate team of educators, technologists, and safety experts dedicated to creating the most comprehensive and
              user-friendly attendance tracking system for schools worldwide.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-brand-dark mb-2">500+</div>
                <div className="text-sm text-gray-600">Schools Protected</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-accent-emerald mb-2">250K+</div>
                <div className="text-sm text-gray-600">Students Safe</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-accent-purple mb-2">2019</div>
                <div className="text-sm text-gray-600">Founded</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-accent-orange mb-2">24/7</div>
                <div className="text-sm text-gray-600">Support</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section id="story" className="relative py-20 bg-white/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
                Our <span className="bg-gradient-to-r from-brand-blue to-brand-dark bg-clip-text text-transparent">Story</span>
              </h2>
              <p className="text-xl text-gray-600">Born from a shared vision to make schools safer for every child.</p>
            </div>

            <div className="space-y-12">
              {/* Story Content */}
              <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-10 shadow-lg shadow-gray-200/50 border border-white/20">
                <div className="prose prose-lg max-w-none text-gray-600 leading-relaxed">
                  <p className="text-xl mb-6">
                    Safer Attendance was founded in 2019 by a team of passionate educators and technology experts who recognized a critical gap in
                    school safety systems. After witnessing firsthand the challenges schools faced with traditional attendance tracking methods, we knew
                    there had to be a better way.
                  </p>

                  <p className="mb-6">
                    Our founders, Nicholas and Ashley Wagner, along with Kira and Eric Quidort, combined their expertise in education, finance,
                    technology, and marketing to create a solution that would revolutionize how schools monitor and protect their students. What
                    started as a simple idea to improve attendance tracking has evolved into a comprehensive safety platform trusted by hundreds of
                    schools nationwide.
                  </p>

                  <p className="mb-6">
                    We believe that every child deserves to learn in a safe environment, and every parent deserves peace of mind knowing their child
                    is protected. This belief drives everything we do, from our innovative technology solutions to our commitment to exceptional
                    customer service.
                  </p>

                  <p>
                    Today, Safer Attendance continues to grow and evolve, always with our core mission at heart: ensuring the safety and security of
                    students through cutting-edge technology and unwavering dedication to educational excellence.
                  </p>
                </div>
              </div>

              {/* Mission, Vision, Values Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="reveal-card bg-white/70 backdrop-blur-xl rounded-2xl p-8 shadow-lg shadow-gray-200/50 border border-white/20 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-brand-blue to-brand-dark rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-brand-blue/25">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Our Mission</h3>
                  <p className="text-gray-600 leading-relaxed">
                    To provide schools with the most advanced, user-friendly, and affordable attendance tracking system that enhances student safety
                    and administrative efficiency.
                  </p>
                </div>

                <div className="reveal-card bg-white/70 backdrop-blur-xl rounded-2xl p-8 shadow-lg shadow-gray-200/50 border border-white/20 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-accent-emerald to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-accent-emerald/25">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Our Vision</h3>
                  <p className="text-gray-600 leading-relaxed">
                    A world where every student is safe, every parent has peace of mind, and every educator can focus on what they do best - teaching.
                  </p>
                </div>

                <div className="reveal-card bg-white/70 backdrop-blur-xl rounded-2xl p-8 shadow-lg shadow-gray-200/50 border border-white/20 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-accent-purple to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-accent-purple/25">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Our Values</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Safety first, innovation always, transparency in everything we do, and unwavering commitment to the educational community we
                    serve.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Leadership Team Section */}
      <section id="team" className="relative py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
              Leadership <span className="bg-gradient-to-r from-brand-blue to-brand-dark bg-clip-text text-transparent">Team</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Meet the passionate leaders driving innovation in educational safety technology.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Nicholas */}
            <div className="reveal-card group bg-white/70 backdrop-blur-xl rounded-3xl p-8 shadow-lg shadow-gray-200/50 border border-white/20 hover:shadow-xl hover:-translate-y-2 transition-all duration-500 text-center">
              <div className="relative mb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-brand-blue to-brand-dark rounded-full flex items-center justify-center mx-auto shadow-lg shadow-brand-blue/25 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-accent-emerald rounded-full flex items-center justify-center shadow-lg">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Nicholas Wagner</h3>
              <p className="text-brand-dark font-semibold mb-4">Chief Executive Officer</p>
              <p className="text-gray-600 text-sm leading-relaxed mb-6">
                Visionary leader with 15+ years in educational technology. Nicholas drives our mission to revolutionize school safety through
                innovative solutions.
              </p>
              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => window.open('https://www.linkedin.com', '_blank')}
                  className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors duration-300"
                >
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452z" />
                  </svg>
                </button>
                <button
                  onClick={() => (window.location.href = 'mailto:info@saferattendance.com')}
                  className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors duration-300"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Ashley */}
            <div className="reveal-card group bg-white/70 backdrop-blur-xl rounded-3xl p-8 shadow-lg shadow-gray-200/50 border border-white/20 hover:shadow-xl hover:-translate-y-2 transition-all duration-500 text-center">
              <div className="relative mb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-accent-emerald to-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-accent-emerald/25 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-accent-orange rounded-full flex items-center justify-center shadow-lg">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Ashley Wagner</h3>
              <p className="text-accent-emerald font-semibold mb-4">Chief Financial Officer</p>
              <p className="text-gray-600 text-sm leading-relaxed mb-6">
                Financial strategist ensuring sustainable growth and operational excellence. Ashley&apos;s expertise keeps us financially strong and
                customer-focused.
              </p>
              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => window.open('https://www.linkedin.com', '_blank')}
                  className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors duration-300"
                >
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452z" />
                  </svg>
                </button>
                <button
                  onClick={() => (window.location.href = 'mailto:info@saferattendance.com')}
                  className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors duration-300"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Kira */}
            <div className="reveal-card group bg-white/70 backdrop-blur-xl rounded-3xl p-8 shadow-lg shadow-gray-200/50 border border-white/20 hover:shadow-xl hover:-translate-y-2 transition-all duration-500 text-center">
              <div className="relative mb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-accent-purple to-purple-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-accent-purple/25 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-accent-cyan rounded-full flex items-center justify-center shadow-lg">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Kira Quidort</h3>
              <p className="text-accent-purple font-semibold mb-4">Chief Technology Officer</p>
              <p className="text-gray-600 text-sm leading-relaxed mb-6">
                Technology innovator architecting our cutting-edge platform. Kira&apos;s technical expertise ensures our solutions are secure, scalable,
                and reliable.
              </p>
              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => window.open('https://www.linkedin.com', '_blank')}
                  className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors duration-300"
                >
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452z" />
                  </svg>
                </button>
                <button
                  onClick={() => (window.location.href = 'mailto:info@saferattendance.com')}
                  className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors duration-300"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Eric */}
            <div className="reveal-card group bg-white/70 backdrop-blur-xl rounded-3xl p-8 shadow-lg shadow-gray-200/50 border border-white/20 hover:shadow-xl hover:-translate-y-2 transition-all duration-500 text-center">
              <div className="relative mb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-accent-orange to-orange-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-accent-orange/25 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-accent-rose rounded-full flex items-center justify-center shadow-lg">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Eric Quidort</h3>
              <p className="text-accent-orange font-semibold mb-4">Chief Marketing Officer</p>
              <p className="text-gray-600 text-sm leading-relaxed mb-6">
                Marketing strategist connecting schools with our solutions. Eric&apos;s passion for education drives our outreach and customer success
                initiatives.
              </p>
              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => window.open('https://www.linkedin.com', '_blank')}
                  className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors duration-300"
                >
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452z" />
                  </svg>
                </button>
                <button
                  onClick={() => (window.location.href = 'mailto:info@saferattendance.com')}
                  className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors duration-300"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Company Values Section */}
      <section id="values" className="relative py-20 bg-white/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
              Our <span className="bg-gradient-to-r from-brand-blue to-brand-dark bg-clip-text text-transparent">Values</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">The principles that guide everything we do at Safer Attendance.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Value cards */}
            {[
              {
                title: 'Safety First',
                iconWrap: 'from-accent-rose to-rose-600',
                text: 'Student safety is our top priority in every decision we make. We never compromise on security features or data protection.',
              },
              {
                title: 'Innovation',
                iconWrap: 'from-accent-cyan to-cyan-600',
                text:
                  "We continuously push the boundaries of what's possible in educational technology, always seeking better solutions.",
              },
              {
                title: 'Transparency',
                iconWrap: 'from-accent-emerald to-emerald-600',
                text:
                  'Open communication, honest pricing, and clear processes build trust with our educational partners.',
              },
              {
                title: 'Excellence',
                iconWrap: 'from-accent-purple to-purple-600',
                text:
                  'We strive for excellence in every aspect of our service, from product quality to customer support.',
              },
              {
                title: 'Community',
                iconWrap: 'from-accent-orange to-orange-600',
                text:
                  "We're committed to supporting the educational community and building lasting partnerships with schools.",
              },
              {
                title: 'Accessibility',
                iconWrap: 'from-accent-indigo to-indigo-600',
                text:
                  'Our solutions are designed to be accessible and affordable for schools of all sizes and budgets.',
              },
            ].map((v) => (
              <div
                key={v.title}
                className="reveal-card bg-white/70 backdrop-blur-xl rounded-2xl p-8 shadow-lg shadow-gray-200/50 border border-white/20 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div
                  className={`w-16 h-16 bg-gradient-to-br ${v.iconWrap} rounded-2xl flex items-center justify-center mb-6 shadow-lg`}
                >
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5-7a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-4">{v.title}</h3>
                <p className="text-gray-600 leading-relaxed">{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 bg-gradient-to-r from-brand-blue to-brand-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">Ready to Work With Us?</h2>
          <p className="text-xl text-blue-100 mb-12 max-w-3xl mx-auto">
            Join hundreds of schools that trust Safer Attendance to protect their students. Let&apos;s make your school safer together.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <button
              onClick={contactTeam}
              className="bg-white text-brand-dark px-8 py-4 rounded-xl hover:bg-gray-50 transition-all duration-300 font-semibold text-lg hover:scale-105 flex items-center space-x-3 shadow-lg"
            >
              <span>Contact Our Team</span>
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
                <div className="w-12 h-12 bg-gradient-to-br from-brand-blue to-brand-dark rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5-7a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Safer Attendance</h3>
                  <p className="text-gray-400">Protecting students everywhere</p>
                </div>
              </div>
              <p className="text-gray-400 mb-6 max-w-md">
                Founded by passionate educators and technologists, we&apos;re dedicated to making schools safer through innovative attendance tracking
                solutions.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#story" className="hover:text-white transition-colors duration-300">
                    Our Story
                  </a>
                </li>
                <li>
                  <a href="#team" className="hover:text-white transition-colors duration-300">
                    Leadership
                  </a>
                </li>
                <li>
                  <a href="#values" className="hover:text-white transition-colors duration-300">
                    Values
                  </a>
                </li>
                <li>
                  <a className="hover:text-white transition-colors duration-300" onClick={() => router.push('/careers')}>
                    Careers
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-gray-400">
                <li>info@saferattendance.com</li>
                <li>(856) 712-9455</li>
                <li>24/7 Support Available</li>
                <li>Press Inquiries</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Safer Attendance. All rights reserved. Founded in 2019.</p>
          </div>
        </div>
      </footer>
    </body>
  );
}
