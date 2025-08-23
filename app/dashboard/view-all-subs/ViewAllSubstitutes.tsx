// app/dashboard/view-all-subs/ViewAllSubstitutes.tsx
'use client';

import React, { useEffect, useState } from 'react';

type Substitute = {
  id?: number | string;
  sub_email?: string;
  email?: string;
  name?: string;
  sub_name?: string;
  phone?: string;
  school_code?: string;
  district_code?: string;
  created_at?: string;
  status?: string;
  classes_assigned?: number;
};

const cardGradients = [
  'from-blue-400 to-blue-600',
  'from-green-400 to-green-600',
  'from-purple-400 to-purple-600',
  'from-orange-400 to-orange-600',
  'from-pink-400 to-pink-600',
  'from-indigo-400 to-indigo-600',
  'from-teal-400 to-teal-600',
  'from-red-400 to-red-600',
];

export default function ViewAllSubstitutes() {
  const [loading, setLoading] = useState(false);
  const [substitutes, setSubstitutes] = useState<Substitute[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSub, setSelectedSub] = useState<Substitute | null>(null);

  async function fetchSubstitutes() {
    setLoading(true);
    setError(null);
    setSubstitutes(null);
    
    try {
      const res = await fetch('/api/xano/view-all-subs', { 
        method: 'GET', 
        cache: 'no-store' 
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data?.error || `Failed to fetch substitutes (${res.status})`);
      }
      
      // Accept either array or {records: []}
      const list: Substitute[] = Array.isArray(data) ? data : data?.records ?? [];
      setSubstitutes(list);
    } catch (e: any) {
      setError(e?.message || 'Failed to load substitutes');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSubstitutes();
  }, []);

  // Filter substitutes based on search query
  const filteredSubstitutes = substitutes?.filter(sub => {
    const email = sub.sub_email || sub.email || '';
    const name = sub.sub_name || sub.name || '';
    const query = searchQuery.toLowerCase();
    
    return email.toLowerCase().includes(query) || 
           name.toLowerCase().includes(query);
  }) ?? [];

  const total = substitutes?.length ?? 0;
  const filtered = filteredSubstitutes.length;

  return (
    <>
      {/* Header with Search */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">Registered Substitutes</h2>
            <p className="text-gray-600">Browse all substitute teachers registered in the system</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-sm border border-white/20 text-sm">
              Total: <span className="font-semibold text-brand-dark">{total}</span>
              {searchQuery && filtered < total && (
                <span className="ml-2 text-gray-500">
                  (Showing {filtered})
                </span>
              )}
            </div>
            <button
              onClick={fetchSubstitutes}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-blue to-brand-dark text-white px-4 py-2 shadow-lg hover:shadow-xl transition-all"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 4v6h6M20 20v-6h-6M20 4l-7 7M4 20l7-7"/>
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 pl-10 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent shadow-sm"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-16">
          <div className="w-12 h-12 border-4 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading substitutes…</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="text-center py-6">
          <p className="text-sm text-red-600" role="alert">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredSubstitutes.length === 0 && (
        <div className="text-center py-12">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <p className="text-gray-600">
            {searchQuery 
              ? `No substitutes found matching "${searchQuery}"`
              : 'No substitutes registered in the system'}
          </p>
        </div>
      )}

      {/* Grid of Substitutes */}
      {!loading && !error && filteredSubstitutes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSubstitutes.map((sub, i) => {
            const email = sub.sub_email || sub.email || '—';
            const name = sub.sub_name || sub.name || 'Substitute Teacher';
            const initials = name.split(' ').map(n => n[0]).join('').toUpperCase() || 'ST';
            
            return (
              <button
                key={sub.id || email || i}
                onClick={() => setSelectedSub(sub)}
                className="text-left bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 bg-gradient-to-r ${cardGradients[i % cardGradients.length]} rounded-xl flex items-center justify-center shadow-lg text-white font-semibold`}>
                    {initials}
                  </div>
                  {sub.status === 'active' && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  )}
                </div>

                <h4 className="text-lg font-bold text-gray-800 mb-1">{name}</h4>
                <p className="text-sm text-gray-600 mb-3 break-all">{email}</p>

                <div className="space-y-2 text-sm text-gray-600">
                  {sub.phone && (
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span>{sub.phone}</span>
                    </div>
                  )}
                  {sub.school_code && (
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <span>School: {sub.school_code}</span>
                    </div>
                  )}
                  {sub.classes_assigned != null && sub.classes_assigned > 0 && (
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      <span>Classes: {sub.classes_assigned}</span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selectedSub && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedSub(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-800">
                  Substitute Details
                </h3>
                <button
                  onClick={() => setSelectedSub(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-brand-blue to-brand-dark rounded-xl flex items-center justify-center shadow-lg text-white font-bold text-xl mr-4">
                  {(selectedSub.sub_name || selectedSub.name || 'S').split(' ').map(n => n[0]).join('').toUpperCase()}
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-800">
                    {selectedSub.sub_name || selectedSub.name || 'Substitute Teacher'}
                  </h4>
                  <p className="text-gray-600">
                    {selectedSub.sub_email || selectedSub.email || '—'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Info label="Email" value={selectedSub.sub_email || selectedSub.email || '—'} />
                <Info label="Phone" value={selectedSub.phone || '—'} />
                <Info label="School Code" value={selectedSub.school_code || '—'} />
                <Info label="District Code" value={selectedSub.district_code || '—'} />
                <Info label="Status" value={selectedSub.status || 'Active'} />
                <Info label="Classes Assigned" value={selectedSub.classes_assigned != null ? String(selectedSub.classes_assigned) : '0'} />
                {selectedSub.created_at && (
                  <Info 
                    label="Registration Date" 
                    value={new Date(selectedSub.created_at).toLocaleDateString()} 
                  />
                )}
                {selectedSub.id && (
                  <Info label="ID" value={String(selectedSub.id)} />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <p className="text-sm text-gray-600 mb-1">{label}</p>
      <p className="font-semibold text-gray-800 break-words">{value || '—'}</p>
    </div>
  );
}
