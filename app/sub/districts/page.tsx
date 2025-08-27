"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

// -----------------------------
// Types
// -----------------------------
type Role = "SUB" | "ADMIN" | string;

type Session = {
  role: Role;
  user: { id: string; first_name: string; last_name: string; email: string };
};

type MembershipStatus =
  | "PENDING"
  | "APPROVED"
  | "DENIED"
  | "ACTION_REQUIRED"
  | "SUSPENDED"
  | string;

type Membership = {
  membership_id: string;
  district_id: string;
  district_name: string;
  district_location?: string;
  status: MembershipStatus;
  is_default?: boolean;
  requirements?: string[];
  denial_reason?: string;
  suspension_reason?: string;
  cooldown_until?: string; // ISO
  created_at?: string; // ISO
  updated_at?: string; // ISO
};

type District = {
  district_id: string;
  name: string;
  location?: string;
  school_count?: number;
};

// -----------------------------
// Config
// -----------------------------
const API_ENDPOINTS = {
  memberships: "/api/sub/memberships",
  districts: "/api/sub/districts",
  requestAccess: "/api/sub/memberships",
  leaveDistrict: "/api/sub/memberships",
  setDefault: "/api/sub/memberships/default",
  session: "/api/auth/session",
};

// -----------------------------
// Utilities
// -----------------------------
const classNames = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");

function sanitize(text?: string) {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function parseDate(d?: string | Date) {
  return typeof d === "string" ? new Date(d) : d ?? new Date();
}

function formatDate(d?: string | Date) {
  const date = parseDate(d);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function canRequestAgain(m: Membership) {
  const until = m.cooldown_until
    ? new Date(m.cooldown_until)
    : new Date(new Date(m.updated_at ?? Date.now()).getTime() + 24 * 60 * 60 * 1000);
  return new Date() >= until;
}

async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const config: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
    credentials: "same-origin",
    ...options,
  };

  const res = await fetch(endpoint, config);
  if (res.status === 401) throw new Error("UNAUTHORIZED");
  if (res.status === 403) throw new Error("FORBIDDEN");
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const code = (data?.code as string) || "REQUEST_FAILED";
    const message =
      code === "DUPLICATE_REQUEST"
        ? "You already have a pending request for this district"
        : code === "COOLDOWN_ACTIVE"
        ? `Please wait until ${formatDate(data?.cooldown_until)} before re-requesting`
        : code === "RATE_LIMITED"
        ? "Too many requests. Please try again later"
        : data?.message || "Request failed";
    const err = new Error(message) as Error & { code?: string };
    err.code = code;
    throw err;
  }
  return data as T;
}

// -----------------------------
// Demo fallback (optional)
// -----------------------------
const SAMPLE_MEMBERSHIPS: Membership[] = [
  {
    membership_id: "1",
    district_id: "dist_1",
    district_name: "Springfield School District",
    district_location: "Springfield, IL",
    status: "APPROVED",
    is_default: true,
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-16T14:30:00Z",
  },
  {
    membership_id: "2",
    district_id: "dist_2",
    district_name: "Riverside Unified",
    district_location: "Riverside, CA",
    status: "ACTION_REQUIRED",
    requirements: ["Background Check", "Teaching Certificate"],
    created_at: "2024-01-20T09:15:00Z",
    updated_at: "2024-01-20T09:15:00Z",
  },
  {
    membership_id: "3",
    district_id: "dist_3",
    district_name: "Mountain View Elementary",
    district_location: "Mountain View, CO",
    status: "DENIED",
    denial_reason: "Insufficient experience in elementary education",
    cooldown_until: "2024-02-13T16:45:00Z",
    created_at: "2024-01-10T11:00:00Z",
    updated_at: "2024-01-12T16:45:00Z",
  },
  {
    membership_id: "4",
    district_id: "dist_4",
    district_name: "Central Valley USD",
    district_location: "Fresno, CA",
    status: "SUSPENDED",
    suspension_reason: "Pending investigation",
    created_at: "2024-01-18T10:00:00Z",
    updated_at: "2024-01-19T14:30:00Z",
  },
];

const SAMPLE_DISTRICTS: District[] = [
  { district_id: "dist_5", name: "North Shore Schools", location: "Chicago, IL", school_count: 23 },
  { district_id: "dist_6", name: "Desert Hills District", location: "Phoenix, AZ", school_count: 18 },
  { district_id: "dist_7", name: "Coastal Elementary", location: "San Diego, CA", school_count: 12 },
  { district_id: "dist_8", name: "Pine Ridge Schools", location: "Denver, CO", school_count: 31 },
];

// -----------------------------
// Toasts
// -----------------------------
 type ToastType = "success" | "warning" | "error" | "info";
 type Toast = { id: string; type: ToastType; message: string };

 function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const srMsgRef = useRef("");
  const add = (type: ToastType, message: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((t) => [...t, { id, type, message }]);
    srMsgRef.current = message;
    setTimeout(() => remove(id), 5000);
  };
  const remove = (id: string) => setToasts((t) => t.filter((x) => x.id !== id));
  return { toasts, add, remove, srMsgRef } as const;
 }

// -----------------------------
// Page Component
// -----------------------------
export default function DistrictAccessPage() {
  const router = useRouter();

  const [session, setSession] = useState<Session | null>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [loadingMemberships, setLoadingMemberships] = useState(true);
  const [loadingDistricts, setLoadingDistricts] = useState(true);
  const [filters, setFilters] = useState<{ q: string; state: string; sort: string }>({ q: "", state: "", sort: "relevance" });
  const [requesting, setRequesting] = useState<Record<string, boolean>>({});

  const lastFocusRef = useRef<HTMLElement | null>(null);
  const { toasts, add: toast, remove: removeToast, srMsgRef } = useToasts();

  // Auth check on mount
  useEffect(() => {
    (async () => {
      try {
        const data = await apiCall<Session>(API_ENDPOINTS.session);
        if (data.role !== "SUB") {
          router.push("/unauthorized");
          return;
        }
        setSession(data);
      } catch {
        router.push("/sub/login");
        return;
      }
    })();
  }, [router]);

  // Load data when authed
  useEffect(() => {
    if (!session) return;
    void refreshMemberships();
    void refreshDistricts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  async function refreshMemberships() {
    setLoadingMemberships(true);
    try {
      const res = await apiCall<{ data: Membership[]; total?: number }>(API_ENDPOINTS.memberships);
      setMemberships(res?.data ?? []);
    } catch (e) {
      // Demo fallback
      setMemberships(SAMPLE_MEMBERSHIPS);
      toast("warning", "Using sample memberships (API error)");
    } finally {
      setLoadingMemberships(false);
      restoreFocus();
    }
  }

  async function refreshDistricts() {
    setLoadingDistricts(true);
    try {
      const query = new URLSearchParams({ q: filters.q, state: filters.state, sort: filters.sort }).toString();
      const res = await apiCall<{ data: District[]; total?: number }>(`${API_ENDPOINTS.districts}?${query}`);
      setDistricts(res?.data ?? []);
    } catch (e) {
      setDistricts(SAMPLE_DISTRICTS);
      toast("warning", "Using sample districts (API error)");
    } finally {
      setLoadingDistricts(false);
    }
  }

  const filteredDistricts = useMemo(() => {
    let list = [...districts];
    if (filters.q) {
      const q = filters.q.toLowerCase();
      list = list.filter((d) => d.name.toLowerCase().includes(q) || (d.location ?? "").toLowerCase().includes(q));
    }
    if (filters.state) list = list.filter((d) => (d.location ?? "").includes(filters.state));
    return list;
  }, [districts, filters]);

  function preserveFocus(el: HTMLElement | null) {
    lastFocusRef.current = el;
  }
  function restoreFocus() {
    if (lastFocusRef.current && document.contains(lastFocusRef.current)) {
      setTimeout(() => lastFocusRef.current?.focus(), 80);
    }
  }

  async function onRequestAccess(districtId: string, district: District, btn?: HTMLButtonElement | null) {
    if (requesting[districtId]) return;
    preserveFocus(btn ?? null);
    setRequesting((r) => ({ ...r, [districtId]: true }));
    try {
      await apiCall(API_ENDPOINTS.requestAccess, {
        method: "POST",
        body: JSON.stringify({ district_id: districtId }),
      });
      toast("success", "Access request sent. You'll be notified when reviewed.");

      // Optimistic update
      setMemberships((prev) => {
        const next = [...prev];
        const idx = next.findIndex((m) => m.district_id === districtId);
        const newM: Membership = {
          membership_id: `${Date.now()}`,
          district_id: districtId,
          district_name: district.name,
          district_location: district.location,
          status: "PENDING",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        if (idx >= 0) next[idx] = newM;
        else next.push(newM);
        return next;
      });
    } catch (e: any) {
      const msg = typeof e?.message === "string" ? e.message : "Couldn't submit request — try again";
      toast(e?.code === "DUPLICATE_REQUEST" ? "warning" : "error", msg);
    } finally {
      setRequesting((r) => ({ ...r, [districtId]: false }));
      restoreFocus();
    }
  }

  async function onSetDefault(districtId: string, btn?: HTMLButtonElement | null) {
    preserveFocus(btn ?? null);
    try {
      await apiCall(API_ENDPOINTS.setDefault, { method: "POST", body: JSON.stringify({ district_id: districtId }) });
      toast("success", "Default district updated");
      await refreshMemberships();
    } catch {
      toast("error", "Failed to set default district");
    }
  }

  async function onLeaveDistrict(districtId: string, btn?: HTMLButtonElement | null) {
    if (!confirm("Are you sure you want to leave this district? You'll need to re-apply for access.")) return;
    preserveFocus(btn ?? null);
    try {
      await apiCall(`${API_ENDPOINTS.leaveDistrict}/${districtId}`, { method: "DELETE" });
      toast("success", "Left district successfully");
      await refreshMemberships();
    } catch {
      toast("error", "Failed to leave district");
    }
  }

  const approvedExists = memberships.some((m) => m.status === "APPROVED");

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="bg-surface border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Safer Attendance</h1>
                <p className="text-xs text-gray-500">Substitute Portal</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-primary to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {(session?.user.first_name ?? "S").charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {session ? `${session.user.first_name} ${session.user.last_name}` : ""}
                </span>
              </div>
              <button
                onClick={() => router.push("/sub")}
                className="text-gray-500 hover:text-gray-700 text-sm font-medium"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">District Access</h1>
          <p className="text-lg text-gray-600">Request approval from districts. Once approved, you can browse and claim assignments.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Card A: Your District Access */}
          <section className="bg-surface rounded-xl border border-gray-200 shadow-sm">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Your District Access</h2>
                  <p className="text-sm text-gray-600 mt-1">Your access to districts</p>
                </div>
                <button
                  onClick={() => refreshMemberships()}
                  id="refreshBtn"
                  className="text-primary hover:text-blue-700 text-sm font-medium flex items-center space-x-1 min-h-[44px] px-2"
                  aria-label="Refresh district access"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Refresh</span>
                </button>
              </div>

              {loadingMemberships ? (
                <div className="text-center py-12">
                  <svg className="w-8 h-8 loading-spinner text-primary mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <p className="text-gray-600">Loading your district access...</p>
                </div>
              ) : memberships.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No District Access Yet</h3>
                  <p className="text-gray-600 mb-1">Districts approve you once your documents are verified.</p>
                  <p className="text-gray-600">Request access to start finding substitute assignments.</p>
                </div>
              ) : (
                <div className="space-y-4" id="membershipsList">
                  {memberships.map((m) => (
                    <div key={m.membership_id} className="flex items-start justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-gray-900 truncate">{m.district_name}</h4>
                          {m.is_default && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">Default</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{m.district_location || "School District"}</p>
                        {m.status === "DENIED" && m.denial_reason && (
                          <p className="text-xs text-red-600 mt-2">
                            Reason: {sanitize(m.denial_reason)} <a className="underline" href="/sub/requirements">Review requirements</a>
                          </p>
                        )}
                        {m.status === "SUSPENDED" && m.suspension_reason && (
                          <p className="text-xs text-red-600 mt-2">Suspended: {m.suspension_reason}</p>
                        )}
                        {m.status === "DENIED" && !canRequestAgain(m) && (
                          <p className="text-xs text-gray-500 mt-1">Re-request available on {formatDate(m.cooldown_until ?? m.updated_at)}</p>
                        )}
                        {m.status === "ACTION_REQUIRED" && m.requirements?.length ? (
                          <div className="mt-2 p-2 bg-yellow-50 rounded border border-yellow-200">
                            <p className="text-xs font-medium text-yellow-700 mb-1">Required Actions:</p>
                            <ul className="text-xs text-gray-700 space-y-1 list-disc pl-4">
                              {m.requirements.map((r, i) => (
                                <li key={i}>{sanitize(r)}</li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                      </div>
                      <div className="flex flex-col items-end space-y-2 ml-4">
                        <span
                          className={classNames(
                            "px-3 py-1 rounded-full text-xs font-medium",
                            m.status === "PENDING" && "status-pending",
                            m.status === "APPROVED" && "status-approved",
                            m.status === "DENIED" && "status-denied",
                            m.status === "ACTION_REQUIRED" && "bg-yellow-100 text-yellow-800 border border-yellow-200",
                            m.status === "SUSPENDED" && "bg-red-100 text-red-800 border border-red-200",
                            !["PENDING", "APPROVED", "DENIED", "ACTION_REQUIRED", "SUSPENDED"].includes(m.status) &&
                              "bg-gray-100 text-gray-800"
                          )}
                        >
                          {m.status === "ACTION_REQUIRED" ? "Action Required" : m.status}
                        </span>
                        <div className="flex gap-2">
                          {m.status === "APPROVED" && !m.is_default && (
                            <button
                              className="text-xs text-primary hover:text-blue-700 font-medium min-h-[32px] px-2"
                              onClick={(e) => onSetDefault(m.district_id, e.currentTarget)}
                            >
                              Set Default
                            </button>
                          )}
                          {m.status === "APPROVED" && (
                            <button
                              className="text-xs text-red-600 hover:text-red-700 font-medium min-h-[32px] px-2"
                              onClick={(e) => onLeaveDistrict(m.district_id, e.currentTarget)}
                            >
                              Leave
                            </button>
                          )}
                          {m.status === "DENIED" && (
                            <button
                              className={classNames(
                                "text-xs font-medium min-h-[32px] px-2",
                                canRequestAgain(m)
                                  ? "text-primary hover:text-blue-700"
                                  : "text-gray-400 cursor-not-allowed tooltip"
                              )}
                              disabled={!canRequestAgain(m)}
                              aria-disabled={!canRequestAgain(m)}
                              data-tooltip={!canRequestAgain(m) ? `Re-request on ${formatDate(m.cooldown_until ?? m.updated_at)}` : undefined}
                              onClick={(e) => canRequestAgain(m) && onRequestAccess(m.district_id, { district_id: m.district_id, name: m.district_name, location: m.district_location }, e.currentTarget as HTMLButtonElement)}
                            >
                              Re-request
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {approvedExists && (
                    <div id="browseSection" className="mt-6 pt-6 border-t border-gray-200">
                      <button
                        onClick={() => router.push("/sub/browse")}
                        className="w-full bg-primary hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-colors min-h-[44px] flex items-center justify-center space-x-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <span>Browse Available Assignments</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Card B: Request District Access */}
          <section className="bg-surface rounded-xl border border-gray-200 shadow-sm">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Request District Access</h2>

              {/* Search and Filters */}
              <div className="mb-6 space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    value={filters.q}
                    onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
                    onKeyUp={() => void refreshDistricts()}
                    onFocus={(e) => e.currentTarget.parentElement?.classList.add("search-focus")}
                    onBlur={(e) => e.currentTarget.parentElement?.classList.remove("search-focus")}
                    placeholder="Search districts..."
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-10 text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                    aria-label="Search districts"
                  />
                  <svg className="absolute right-3 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>

                <div className="flex flex-wrap gap-3 items-center">
                  <select
                    value={filters.state}
                    onChange={(e) => setFilters((f) => ({ ...f, state: e.target.value }))}
                    onBlur={() => void refreshDistricts()}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                    aria-label="Filter by state"
                  >
                    <option value="">All States</option>
                    <option value="CA">California</option>
                    <option value="IL">Illinois</option>
                    <option value="CO">Colorado</option>
                    <option value="AZ">Arizona</option>
                  </select>

                  <select
                    value={filters.sort}
                    onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value }))}
                    onBlur={() => void refreshDistricts()}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                    aria-label="Sort districts"
                  >
                    <option value="relevance">Sort by Relevance</option>
                    <option value="distance">Distance</option>
                    <option value="schools">Most Schools</option>
                    <option value="activity">Recent Activity</option>
                  </select>

                  <div className="text-sm text-gray-600 ml-auto" role="status" aria-live="polite">
                    {loadingDistricts
                      ? "Loading…"
                      : filteredDistricts.length === 0
                      ? "No results"
                      : filteredDistricts.length === 1
                      ? "1 district"
                      : `${filteredDistricts.length} districts`}
                  </div>
                </div>
              </div>

              {/* Districts Container */}
              {loadingDistricts ? (
                <div className="grid grid-cols-1 gap-4" aria-hidden>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
                      <div className="text-center">
                        <div className="w-12 h-12 bg-gray-200 rounded-lg mx-auto mb-4" />
                        <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2" />
                        <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto mb-4" />
                        <div className="h-8 bg-gray-200 rounded w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredDistricts.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <p className="text-gray-600">No districts found matching your search.</p>
                </div>
              ) : (
                <div id="districtsList" className="grid grid-cols-1 gap-4">
                  {filteredDistricts.map((d) => {
                    const m = memberships.find((x) => x.district_id === d.district_id);
                    const req = requesting[d.district_id];
                    const deniedButCooldown = m?.status === "DENIED" && !canRequestAgain(m);
                    return (
                      <div key={d.district_id} className="bg-white rounded-lg border border-gray-200 p-6 card-hover">
                        <div className="text-center">
                          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          </div>
                          <h4 className="font-semibold text-gray-900 mb-2">{d.name}</h4>
                          <p className="text-sm text-gray-600 mb-2">{d.location || "School District"}</p>
                          {typeof d.school_count === "number" && (
                            <p className="text-xs text-gray-500 mb-4">{d.school_count} schools</p>
                          )}

                          {/* Action area */}
                          {!m ? (
                            <button
                              className="w-full bg-primary hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors min-h-[44px]"
                              disabled={!!req}
                              onClick={(e) => onRequestAccess(d.district_id, d, e.currentTarget)}
                            >
                              {req ? "Requesting…" : "Request Access"}
                            </button>
                          ) : m.status === "PENDING" ? (
                            <div className="w-full flex justify-center">
                              <span className="px-3 py-1 rounded-full text-xs font-medium status-pending">Pending Review</span>
                            </div>
                          ) : m.status === "APPROVED" ? (
                            <div className="w-full flex justify-center">
                              <span className="px-3 py-1 rounded-full text-xs font-medium status-approved">Approved</span>
                            </div>
                          ) : m.status === "DENIED" && !deniedButCooldown ? (
                            <button
                              className="w-full bg-primary hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors min-h-[44px]"
                              disabled={!!req}
                              onClick={(e) => onRequestAccess(d.district_id, d, e.currentTarget)}
                            >
                              {req ? "Requesting…" : "Re-request Access"}
                            </button>
                          ) : (
                            <div className="w-full flex justify-center">
                              <span className="px-3 py-1 rounded-full text-xs font-medium status-denied">Denied</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* Toasts */}
      <div id="toastContainer" className="fixed top-4 right-4 z-50 space-y-2" aria-live="polite" aria-label="Notifications">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="alert"
            aria-live="assertive"
            tabIndex={-1}
            className={classNames(
              "toast px-6 py-4 rounded-lg text-sm font-medium text-white max-w-sm shadow-lg",
              t.type === "success" && "bg-accent",
              t.type === "warning" && "bg-warning",
              t.type === "error" && "bg-danger",
              t.type === "info" && "bg-primary"
            )}
          >
            {t.message}
          </div>
        ))}
      </div>

      {/* Screen reader announcements */}
      <p className="sr-only" aria-live="polite" aria-atomic="true">{srMsgRef.current}</p>

      {/* Local styles mirroring your prototype */}
      <style jsx global>{`
        :root { --bg: #F8FAFC; --primary: #2563EB; --accent: #22C55E; --warning: #F59E0B; --danger: #EF4444; }
        .card-hover { transition: all 0.2s ease; }
        .card-hover:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(37, 99, 235, 0.15); }
        .loading-spinner { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }
        .toast { animation: slideInRight 0.3s ease-out; }
        @keyframes slideInRight { from { transform: translateX(100%); opacity: 0;} to { transform: translateX(0); opacity: 1;} }
        .status-pending { background: linear-gradient(135deg, #FEF3C7, #FDE68A); color: #92400E; border: 1px solid #F59E0B20; }
        .status-approved { background: linear-gradient(135deg, #D1FAE5, #A7F3D0); color: #065F46; border: 1px solid #22C55E20; }
        .status-denied { background: linear-gradient(135deg, #FEE2E2, #FECACA); color: #991B1B; border: 1px solid #EF444420; }
        .search-focus { box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1); border-radius: 0.5rem; }
        .tooltip { position: relative; }
        .tooltip:hover::after { content: attr(data-tooltip); position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%); background: #1f2937; color: white; padding: 8px 12px; border-radius: 6px; font-size: 12px; white-space: nowrap; z-index: 1000; margin-bottom: 5px; }
        .tooltip:hover::before { content: ''; position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%); border: 5px solid transparent; border-top-color: #1f2937; margin-bottom: -5px; }
        .bg-bg { background-color: var(--bg); }
        .bg-primary { background-color: var(--primary); }
        .bg-accent { background-color: var(--accent); }
        .bg-warning { background-color: var(--warning); }
        .bg-danger { background-color: var(--danger); }
        .text-primary { color: var(--primary); }
      `}</style>
    </div>
  );
}
