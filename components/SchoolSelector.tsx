'use client';

import React, { useEffect, useState } from 'react';

type School = {
  school_code: string;
  school_name: string;
  school_type: string;
  start_time: string;
  end_time: string;
  total_periods: number;
  is_default: boolean;
};

type SchoolSelectorProps = {
  onSchoolChange?: (schoolCode: string, school: School) => void;
  className?: string;
};

export default function SchoolSelector({ onSchoolChange, className = '' }: SchoolSelectorProps) {
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Get current school from cookie
  const getCurrentSchoolFromCookie = (): string => {
    const match = document.cookie.match(/school_code=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
  };

  // Set school cookie
  const setSchoolCookie = (schoolCode: string) => {
    const maxAge = 60 * 60 * 24 * 30; // 30 days
    document.cookie = `school_code=${encodeURIComponent(schoolCode)};path=/;max-age=${maxAge};SameSite=Lax`;
  };

  // Fetch schools on mount
  useEffect(() => {
    async function fetchSchools() {
      // Get email from cookie
      const emailMatch = document.cookie.match(/email=([^;]+)/);
      const email = emailMatch ? decodeURIComponent(emailMatch[1]) : '';
      
      if (!email) {
        console.error('SchoolSelector: No email cookie found');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `https://xgeu-jqgf-nnju.n7e.xano.io/api:aeQ3kHz2/admin/my-schools?email=${encodeURIComponent(email)}`
        );
        const data = await response.json();

        if (!data.error && data.schools && data.schools.length > 0) {
          setSchools(data.schools);
          
          // Use cookie value if set, otherwise use default from API
          const cookieSchool = getCurrentSchoolFromCookie();
          const validSchool = data.schools.find((s: School) => s.school_code === cookieSchool);
          
          if (validSchool) {
            setSelectedSchool(cookieSchool);
          } else {
            const defaultSchool = data.schools.find((s: School) => s.is_default) || data.schools[0];
            setSelectedSchool(defaultSchool.school_code);
            setSchoolCookie(defaultSchool.school_code);
          }
        }
      } catch (e) {
        console.error('SchoolSelector: Failed to fetch schools:', e);
      } finally {
        setLoading(false);
      }
    }

    fetchSchools();
  }, []);

  // Handle school selection
  const handleSelectSchool = (school: School) => {
    setSelectedSchool(school.school_code);
    setSchoolCookie(school.school_code);
    setIsOpen(false);
    
    if (onSchoolChange) {
      onSchoolChange(school.school_code, school);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.school-selector-container')) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Don't render if loading or no schools
  if (loading) {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg text-sm text-gray-500 ${className}`}>
        <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Loading...
      </div>
    );
  }

  if (schools.length === 0) {
    return null;
  }

  const currentSchool = schools.find(s => s.school_code === selectedSchool);

  return (
    <div className={`relative school-selector-container ${className}`}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all shadow-sm"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
<span className="font-medium max-w-[200px] truncate">
          {selectedSchool === 'all' ? '📊 All Schools' : (currentSchool?.school_name || 'Select School')}
        </span>
        <svg 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <p className="text-sm font-medium text-gray-700">Switch School</p>
            <p className="text-xs text-gray-500">
              {schools.length} school{schools.length !== 1 ? 's' : ''} available
            </p>
          </div>

        {/* School List */}
          <div className="max-h-72 overflow-y-auto">
            {/* All Schools Option */}
            <button
              onClick={() => {
                setSelectedSchool('all');
                setSchoolCookie('all');
                setIsOpen(false);
                if (onSchoolChange) {
                  onSchoolChange('all', { 
                    school_code: 'all', 
                    school_name: 'All Schools', 
                    school_type: 'all',
                    start_time: '07:30',
                    end_time: '15:00',
                    total_periods: 8,
                    is_default: false 
                  });
                }
              }}
              className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center justify-between ${
                selectedSchool === 'all' ? 'bg-indigo-50' : ''
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className={`font-medium ${selectedSchool === 'all' ? 'text-indigo-700' : 'text-gray-900'}`}>
                  📊 All Schools
                </p>
                <p className="text-xs text-gray-500">
                  View combined data across all {schools.length} schools
                </p>
              </div>
              {selectedSchool === 'all' && (
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
            
            <div className="border-t border-gray-100 my-1"></div>
            
            {schools.map((school) => (
              <button
                key={school.school_code}
                onClick={() => handleSelectSchool(school)}
                className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center justify-between ${
                  selectedSchool === school.school_code ? 'bg-indigo-50' : ''
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className={`font-medium truncate ${
                    selectedSchool === school.school_code ? 'text-indigo-700' : 'text-gray-900'
                  }`}>
                    {school.school_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {school.school_type} • {school.start_time} - {school.end_time} • {school.total_periods} periods
                  </p>
                </div>
                <div className="flex-shrink-0 ml-2">
                  {selectedSchool === school.school_code ? (
                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : school.is_default ? (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">Default</span>
                  ) : null}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
