<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Browse Assignments - Substitute Portal</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        'primary': '#2563EB',
                        'accent': '#22C55E',
                        'warning': '#F59E0B',
                        'danger': '#EF4444',
                        'bg': '#F8FAFC',
                        'surface': '#FFFFFF'
                    }
                }
            }
        }
    </script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        body {
            font-family: 'Inter', sans-serif;
            background-color: #F8FAFC;
        }
        
        .card-hover {
            transition: all 0.2s ease;
        }
        
        .card-hover:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(37, 99, 235, 0.15);
        }
        
        .loading-spinner {
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        
        .fade-in {
            animation: fadeIn 0.3s ease-out;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .toast {
            animation: slideInRight 0.3s ease-out;
        }
        
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        .drawer-overlay {
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(4px);
        }
        
        .drawer-slide {
            animation: slideInFromRight 0.3s ease-out;
        }
        
        @keyframes slideInFromRight {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
        }
        
        .drawer-slide-out {
            animation: slideOutToRight 0.3s ease-out;
        }
        
        @keyframes slideOutToRight {
            from { transform: translateX(0); }
            to { transform: translateX(100%); }
        }
        
        .filter-chip {
            background: linear-gradient(135deg, #EBF4FF, #DBEAFE);
            color: #1E40AF;
            border: 1px solid #2563EB20;
        }
        
        .badge-single {
            background: linear-gradient(135deg, #EBF4FF, #DBEAFE);
            color: #1E40AF;
            border: 1px solid #2563EB20;
        }
        
        .badge-multi {
            background: linear-gradient(135deg, #F0F9FF, #E0F2FE);
            color: #0C4A6E;
            border: 1px solid #0EA5E920;
        }
        
        .badge-partial {
            background: linear-gradient(135deg, #FEF3C7, #FDE68A);
            color: #92400E;
            border: 1px solid #F59E0B20;
        }
        
        .badge-requested {
            background: linear-gradient(135deg, #FEF3C7, #FDE68A);
            color: #92400E;
            border: 1px solid #F59E0B20;
        }
        
        .badge-claimed {
            background: linear-gradient(135deg, #D1FAE5, #A7F3D0);
            color: #065F46;
            border: 1px solid #22C55E20;
        }
        
        .search-focus {
            box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }
        
        @media (max-width: 768px) {
            .drawer-slide {
                animation: slideInFromBottom 0.3s ease-out;
            }
            
            @keyframes slideInFromBottom {
                from { transform: translateY(100%); }
                to { transform: translateY(0); }
            }
            
            .drawer-slide-out {
                animation: slideOutToBottom 0.3s ease-out;
            }
            
            @keyframes slideOutToBottom {
                from { transform: translateY(0); }
                to { transform: translateY(100%); }
            }
        }
        
        /* Accessibility: Reduced motion */
        @media (prefers-reduced-motion: reduce) {
            .loading-spinner { animation: none; }
            .fade-in, .drawer-slide, .drawer-slide-out, .toast { animation: none; }
            .card-hover:hover { transform: none; }
        }
    </style>
</head>
<body class="min-h-screen">
    <!-- Header -->
    <header class="bg-surface border-b border-gray-200 sticky top-0 z-40">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center h-16">
                <div class="flex items-center space-x-3">
                    <div class="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                    </div>
                    <div>
                        <h1 class="text-lg font-semibold text-gray-900">Safer Attendance</h1>
                        <p class="text-xs text-gray-500">Substitute Portal</p>
                    </div>
                </div>
                
                <div class="flex items-center space-x-3">
                    <div class="flex items-center space-x-2">
                        <div class="w-8 h-8 bg-gradient-to-r from-primary to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium" id="userAvatar">
                            S
                        </div>
                        <span class="text-sm font-medium text-gray-900" id="userName">Sarah Thompson</span>
                    </div>
                    <button onclick="logout()" class="text-gray-500 hover:text-gray-700 text-sm font-medium">
                        Sign out
                    </button>
                </div>
            </div>
        </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <!-- Page Title -->
        <div class="mb-8">
            <h1 class="text-3xl font-bold text-gray-900 mb-2">Browse Assignments</h1>
            <p class="text-lg text-gray-600">Search openings by district and school, then request the ones that fit.</p>
        </div>

        <!-- Filters Card -->
        <div class="bg-surface rounded-xl border border-gray-200 shadow-sm mb-8">
            <div class="p-6">
                <!-- Filter Row 1 -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
                    <div>
                        <label for="districtFilter" class="block text-sm font-medium text-gray-700 mb-2">District</label>
                        <select 
                            id="districtFilter" 
                            onchange="handleDistrictChange()"
                            class="w-full border border-gray-300 rounded-lg px-3 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-primary min-h-[44px]"
                            aria-label="Select district"
                        >
                            <option value="">Select District</option>
                        </select>
                    </div>
                    
                    <div>
                        <label for="schoolFilter" class="block text-sm font-medium text-gray-700 mb-2">School</label>
                        <select 
                            id="schoolFilter" 
                            onchange="handleFilterChange()"
                            class="w-full border border-gray-300 rounded-lg px-3 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-primary min-h-[44px]"
                            aria-label="Select school"
                            disabled
                        >
                            <option value="">Any School</option>
                        </select>
                    </div>
                    
                    <div>
                        <label for="dateFrom" class="block text-sm font-medium text-gray-700 mb-2">From</label>
                        <input 
                            type="date" 
                            id="dateFrom"
                            onchange="handleFilterChange()"
                            class="w-full border border-gray-300 rounded-lg px-3 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-primary min-h-[44px]"
                            aria-label="Start date"
                        >
                    </div>
                    
                    <div>
                        <label for="dateTo" class="block text-sm font-medium text-gray-700 mb-2">To</label>
                        <input 
                            type="date" 
                            id="dateTo"
                            onchange="handleFilterChange()"
                            class="w-full border border-gray-300 rounded-lg px-3 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-primary min-h-[44px]"
                            aria-label="End date"
                        >
                    </div>
                    
                    <div>
                        <label for="searchFilter" class="block text-sm font-medium text-gray-700 mb-2">Search</label>
                        <div class="relative">
                            <input 
                                type="text" 
                                id="searchFilter"
                                onkeyup="handleSearchChange()"
                                onfocus="this.parentElement.classList.add('search-focus')"
                                onblur="this.parentElement.classList.remove('search-focus')"
                                placeholder="Subject, grade, notes..."
                                class="w-full border border-gray-300 rounded-lg px-3 py-3 pr-10 text-sm focus:ring-2 focus:ring-primary focus:border-primary min-h-[44px]"
                                aria-label="Search assignments"
                            >
                            <svg class="absolute right-3 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                            </svg>
                        </div>
                    </div>
                </div>
                
                <!-- Filter Row 2 -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <div>
                        <label for="gradeFilter" class="block text-sm font-medium text-gray-700 mb-2">Grade</label>
                        <input 
                            type="text" 
                            id="gradeFilter"
                            onchange="handleFilterChange()"
                            placeholder="e.g., K, 3, 9-12"
                            class="w-full border border-gray-300 rounded-lg px-3 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-primary min-h-[44px]"
                            aria-label="Grade level"
                        >
                    </div>
                    
                    <div>
                        <label for="subjectFilter" class="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                        <input 
                            type="text" 
                            id="subjectFilter"
                            onchange="handleFilterChange()"
                            placeholder="e.g., Math, Science"
                            class="w-full border border-gray-300 rounded-lg px-3 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-primary min-h-[44px]"
                            aria-label="Subject area"
                        >
                    </div>
                    
                    <div class="flex items-center">
                        <label class="flex items-center space-x-2 cursor-pointer min-h-[44px]">
                            <input 
                                type="checkbox" 
                                id="openOnlyFilter"
                                onchange="handleFilterChange()"
                                class="w-4 h-4 text-primary border-gray-300 rounded focus:ring-2 focus:ring-primary"
                            >
                            <span class="text-sm font-medium text-gray-700">Show only open</span>
                        </label>
                    </div>
                    
                    <div class="flex justify-end">
                        <button 
                            onclick="openAvailabilityDrawer()"
                            class="bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-medium transition-colors min-h-[44px] flex items-center space-x-2"
                        >
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                            </svg>
                            <span>Set multi-day availability</span>
                        </button>
                    </div>
                </div>
                
                <!-- Active Filters -->
                <div id="activeFilters" class="hidden mt-4 pt-4 border-t border-gray-200">
                    <div class="flex flex-wrap gap-2 items-center">
                        <span class="text-sm font-medium text-gray-700">Active filters:</span>
                        <div id="filterChips" class="flex flex-wrap gap-2"></div>
                        <button 
                            onclick="clearAllFilters()"
                            class="text-sm text-primary hover:text-blue-700 font-medium ml-2"
                        >
                            Clear all
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Results Section -->
        <div class="mb-4 flex justify-between items-center">
            <div class="text-sm text-gray-600" id="resultsCount" role="status" aria-live="polite">
                <!-- Results count will be inserted here -->
            </div>
            <button 
                onclick="refreshAssignments()" 
                id="refreshBtn"
                class="text-primary hover:text-blue-700 text-sm font-medium flex items-center space-x-1 min-h-[44px] px-2"
                aria-label="Refresh assignments"
            >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
                <span>Refresh</span>
            </button>
        </div>

        <!-- Assignments Container -->
        <div id="assignmentsContainer" aria-busy="true" aria-live="polite">
            <!-- Loading State -->
            <div id="assignmentsLoading" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Skeleton Cards -->
                <div class="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
                    <div class="flex justify-between items-start mb-4">
                        <div class="flex-1">
                            <div class="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                            <div class="h-5 bg-gray-200 rounded w-2/3 mb-3"></div>
                            <div class="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
                            <div class="flex gap-2">
                                <div class="h-6 bg-gray-200 rounded-full w-20"></div>
                            </div>
                        </div>
                        <div class="h-10 bg-gray-200 rounded w-24"></div>
                    </div>
                </div>
                <div class="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
                    <div class="flex justify-between items-start mb-4">
                        <div class="flex-1">
                            <div class="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                            <div class="h-5 bg-gray-200 rounded w-2/3 mb-3"></div>
                            <div class="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
                            <div class="flex gap-2">
                                <div class="h-6 bg-gray-200 rounded-full w-20"></div>
                            </div>
                        </div>
                        <div class="h-10 bg-gray-200 rounded w-24"></div>
                    </div>
                </div>
            </div>

            <!-- Empty State -->
            <div id="assignmentsEmpty" class="hidden">
                <div class="bg-white rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
                    <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                    <h3 class="text-lg font-medium text-gray-900 mb-2">No assignments match your filters</h3>
                    <p class="text-gray-600 mb-4">Try adjusting your search criteria or check back later for new openings.</p>
                    <button 
                        onclick="clearAllFilters()"
                        class="text-primary hover:text-blue-700 font-medium"
                    >
                        Clear filters
                    </button>
                </div>
            </div>

            <!-- Assignments Grid -->
            <div id="assignmentsList" class="hidden grid grid-cols-1 lg:grid-cols-2 gap-6"></div>
        </div>
    </main>

    <!-- Availability Drawer -->
    <div id="availabilityDrawer" class="hidden fixed inset-0 z-50">
        <!-- Overlay -->
        <div class="drawer-overlay absolute inset-0" onclick="closeAvailabilityDrawer()"></div>
        
        <!-- Drawer Panel -->
        <div id="availabilityPanel" 
             class="drawer-slide absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl md:max-w-lg"
             role="dialog" 
             aria-modal="true" 
             aria-labelledby="availabilityTitle"
             tabindex="-1">
            <div class="flex flex-col h-full">
                <!-- Header -->
                <div class="flex items-center justify-between p-6 border-b border-gray-200">
                    <div>
                        <h2 id="availabilityTitle" class="text-xl font-bold text-gray-900">Submit availability</h2>
                        <p class="text-sm text-gray-600 mt-1">Let districts know when you're available for multi-day assignments</p>
                    </div>
                    <button 
                        onclick="closeAvailabilityDrawer()"
                        class="text-gray-400 hover:text-gray-600 p-2"
                        aria-label="Close drawer"
                    >
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                
                <!-- Form -->
                <div class="flex-1 p-6 overflow-y-auto">
                    <form id="availabilityForm" class="space-y-6">
                        <div>
                            <label for="availabilityDistrict" class="block text-sm font-medium text-gray-700 mb-2">District</label>
                            <select 
                                id="availabilityDistrict" 
                                required
                                class="w-full border border-gray-300 rounded-lg px-3 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-primary min-h-[44px]"
                            >
                                <option value="">Select District</option>
                            </select>
                        </div>
                        
                        <div>
                            <label for="availabilitySchool" class="block text-sm font-medium text-gray-700 mb-2">School</label>
                            <select 
                                id="availabilitySchool"
                                class="w-full border border-gray-300 rounded-lg px-3 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-primary min-h-[44px]"
                            >
                                <option value="">Any school</option>
                            </select>
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label for="availabilityStartDate" class="block text-sm font-medium text-gray-700 mb-2">Start date</label>
                                <input 
                                    type="date" 
                                    id="availabilityStartDate"
                                    required
                                    class="w-full border border-gray-300 rounded-lg px-3 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-primary min-h-[44px]"
                                >
                            </div>
                            
                            <div>
                                <label for="availabilityEndDate" class="block text-sm font-medium text-gray-700 mb-2">End date</label>
                                <input 
                                    type="date" 
                                    id="availabilityEndDate"
                                    required
                                    class="w-full border border-gray-300 rounded-lg px-3 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-primary min-h-[44px]"
                                >
                            </div>
                        </div>
                        
                        <div>
                            <label for="availabilityNotes" class="block text-sm font-medium text-gray-700 mb-2">Notes (optional)</label>
                            <textarea 
                                id="availabilityNotes"
                                rows="3"
                                placeholder="Any specific preferences or requirements..."
                                class="w-full border border-gray-300 rounded-lg px-3 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-primary resize-none"
                            ></textarea>
                        </div>
                    </form>
                </div>
                
                <!-- Footer -->
                <div class="p-6 border-t border-gray-200 bg-gray-50">
                    <div class="flex gap-3">
                        <button 
                            onclick="closeAvailabilityDrawer()"
                            class="flex-1 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 py-3 px-6 rounded-lg font-medium transition-colors min-h-[44px]"
                        >
                            Cancel
                        </button>
                        <button 
                            onclick="submitAvailability()"
                            id="submitAvailabilityBtn"
                            class="flex-1 bg-primary hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-colors min-h-[44px]"
                        >
                            Submit
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Toast Container -->
    <div id="toastContainer" class="fixed top-4 right-4 z-50 space-y-2" aria-live="polite" aria-label="Notifications"></div>
    
    <!-- Screen Reader Announcements -->
    <div id="srAnnouncements" class="sr-only" aria-live="polite" aria-atomic="true"></div>

    <script>
        // Global State
        let currentUser = null;
        let userDistricts = [];
        let allAssignments = [];
        let filteredAssignments = [];
        let requestInProgress = new Set();
        let lastFocus = null;
        let currentFilters = {
            district: '',
            school: '',
            dateFrom: '',
            dateTo: '',
            search: '',
            grade: '',
            subject: '',
            openOnly: false
        };

        // API Configuration
        const API_ENDPOINTS = {
            assignments: '/api/sub/assignments',
            districts: '/api/sub/memberships',
            schools: '/api/sub/schools',
            requestAssignment: '/api/sub/assignments/request',
            submitAvailability: '/api/sub/availability'
        };

        // Sample Data
        const sampleDistricts = [
            { district_id: 'dist_1', district_name: 'Springfield School District', status: 'APPROVED', is_default: true },
            { district_id: 'dist_2', district_name: 'Riverside Unified', status: 'APPROVED', is_default: false },
            { district_id: 'dist_3', district_name: 'Mountain View Elementary', status: 'APPROVED', is_default: false }
        ];

        const sampleSchools = {
            'dist_1': [
                { school_id: 'school_1', name: 'Lincoln Elementary' },
                { school_id: 'school_2', name: 'Washington Middle School' },
                { school_id: 'school_3', name: 'Roosevelt High School' }
            ],
            'dist_2': [
                { school_id: 'school_4', name: 'Riverside Elementary' },
                { school_id: 'school_5', name: 'Central High School' }
            ],
            'dist_3': [
                { school_id: 'school_6', name: 'Mountain View Elementary' }
            ]
        };

        const sampleAssignments = [
            {
                assignment_id: 'assign_1',
                district_id: 'dist_1',
                district_name: 'Springfield School District',
                school_id: 'school_1',
                school_name: 'Lincoln Elementary',
                subject: 'Mathematics',
                grade: '3',
                start_date: '2024-02-15T08:00:00Z',
                end_date: '2024-02-15T15:30:00Z',
                type: 'SINGLE_DAY',
                status: 'OPEN',
                notes: 'Lesson plans provided. Experience with elementary math preferred.',
                created_at: '2024-02-10T10:00:00Z'
            },
            {
                assignment_id: 'assign_2',
                district_id: 'dist_1',
                district_name: 'Springfield School District',
                school_id: 'school_2',
                school_name: 'Washington Middle School',
                subject: 'Science',
                grade: '6-8',
                start_date: '2024-02-16T08:30:00Z',
                end_date: '2024-02-18T15:00:00Z',
                type: 'MULTI_DAY',
                status: 'OPEN',
                notes: 'Long-term substitute needed for teacher on medical leave.',
                created_at: '2024-02-11T14:30:00Z'
            },
            {
                assignment_id: 'assign_3',
                district_id: 'dist_2',
                district_name: 'Riverside Unified',
                school_id: 'school_4',
                school_name: 'Riverside Elementary',
                subject: 'Art',
                grade: 'K-5',
                start_date: '2024-02-17T09:00:00Z',
                end_date: '2024-02-17T12:00:00Z',
                type: 'PARTIAL_DAY',
                status: 'REQUESTED',
                notes: 'Morning art classes only.',
                created_at: '2024-02-12T09:15:00Z'
            },
            {
                assignment_id: 'assign_4',
                district_id: 'dist_1',
                district_name: 'Springfield School District',
                school_id: 'school_3',
                school_name: 'Roosevelt High School',
                subject: 'English Literature',
                grade: '11',
                start_date: '2024-02-19T08:00:00Z',
                end_date: '2024-02-19T15:30:00Z',
                type: 'SINGLE_DAY',
                status: 'CLAIMED',
                notes: 'Teaching Shakespeare unit. Detailed lesson plans available.',
                created_at: '2024-02-13T11:00:00Z'
            },
            {
                assignment_id: 'assign_5',
                district_id: 'dist_3',
                district_name: 'Mountain View Elementary',
                school_id: 'school_6',
                school_name: 'Mountain View Elementary',
                subject: 'Physical Education',
                grade: '1-3',
                start_date: '2024-02-20T10:00:00Z',
                end_date: '2024-02-20T14:00:00Z',
                type: 'PARTIAL_DAY',
                status: 'OPEN',
                notes: 'Outdoor activities weather permitting.',
                created_at: '2024-02-14T08:45:00Z'
            }
        ];

        // Auth Check
        function checkAuth() {
            const token = localStorage.getItem('authToken');
            const userProfile = localStorage.getItem('userProfile');
            
            if (!token || !userProfile) {
                window.location.href = '/sub';
                return false;
            }
            
            try {
                currentUser = JSON.parse(userProfile);
                
                // Verify user has SUB role
                if (currentUser.role !== 'SUB') {
                    localStorage.clear();
                    window.location.href = '/sub';
                    return false;
                }
                
                return true;
            } catch (error) {
                localStorage.clear();
                window.location.href = '/sub';
                return false;
            }
        }

        // Security: Text sanitization
        function sanitizeText(text) {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        // API Helper with improved error handling
        async function apiCall(endpoint, options = {}) {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'same-origin',
                ...options
            };
            
            try {
                const response = await fetch(endpoint, config);
                const text = await response.text();
                
                let data;
                try {
                    data = JSON.parse(text);
                } catch {
                    data = { message: text || 'Request failed' };
                }
                
                if (response.status === 401) {
                    window.location.href = '/sub';
                    throw new Error('Session expired');
                }
                
                if (!response.ok) {
                    throw new Error(data.message || 'Request failed');
                }
                
                return data;
            } catch (error) {
                // For demo purposes, return sample data
                if (endpoint.includes('memberships')) {
                    return { data: sampleDistricts };
                } else if (endpoint.includes('assignments')) {
                    return { data: sampleAssignments, total: sampleAssignments.length };
                } else if (endpoint.includes('schools')) {
                    const districtId = endpoint.split('district_id=')[1];
                    return { data: sampleSchools[districtId] || [] };
                }
                throw error;
            }
        }

        // Date formatting
        function formatDate(dateString) {
            const date = new Date(dateString);
            return new Intl.DateTimeFormat('en-US', { 
                month: 'short', 
                day: 'numeric', 
                hour: 'numeric', 
                minute: '2-digit' 
            }).format(date);
        }

        function formatDateRange(startDate, endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            
            if (start.toDateString() === end.toDateString()) {
                // Same day
                return `${formatDate(startDate)} → ${new Intl.DateTimeFormat('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit' 
                }).format(end)}`;
            } else {
                // Different days
                return `${formatDate(startDate)} → ${formatDate(endDate)}`;
            }
        }

        // URL Parameter Management
        function syncFiltersToUrl() {
            const params = new URLSearchParams();
            Object.keys(currentFilters).forEach(key => {
                if (currentFilters[key]) {
                    params.set(key, currentFilters[key]);
                }
            });
            history.replaceState(null, '', `?${params.toString()}`);
        }

        function loadFiltersFromUrl() {
            const params = new URLSearchParams(location.search);
            ['district', 'school', 'dateFrom', 'dateTo', 'search', 'grade', 'subject'].forEach(key => {
                const value = params.get(key);
                if (value) {
                    currentFilters[key] = value;
                    const element = document.getElementById(key + 'Filter') || document.getElementById(key);
                    if (element) element.value = value;
                }
            });
            currentFilters.openOnly = params.get('openOnly') === 'true';
            document.getElementById('openOnlyFilter').checked = currentFilters.openOnly;
        }

        // Filter Management
        function handleDistrictChange() {
            const districtSelect = document.getElementById('districtFilter');
            const schoolSelect = document.getElementById('schoolFilter');
            
            currentFilters.district = districtSelect.value;
            currentFilters.school = ''; // Reset school when district changes
            
            // Update school options
            updateSchoolOptions(districtSelect.value);
            
            handleFilterChange();
        }

        async function updateSchoolOptions(districtId) {
            const schoolSelect = document.getElementById('schoolFilter');
            
            // Clear existing options
            schoolSelect.innerHTML = '<option value="">Any School</option>';
            
            if (!districtId) {
                schoolSelect.disabled = true;
                return;
            }
            
            try {
                const response = await apiCall(`${API_ENDPOINTS.schools}?district_id=${districtId}`);
                const schools = response.data || [];
                
                schools.forEach(school => {
                    const option = document.createElement('option');
                    option.value = school.school_id;
                    option.textContent = school.name;
                    schoolSelect.appendChild(option);
                });
                
                schoolSelect.disabled = false;
            } catch (error) {
                console.error('Failed to load schools:', error);
                schoolSelect.disabled = true;
            }
        }

        function handleFilterChange() {
            // Update filter state
            currentFilters.district = document.getElementById('districtFilter').value;
            currentFilters.school = document.getElementById('schoolFilter').value;
            currentFilters.dateFrom = document.getElementById('dateFrom').value;
            currentFilters.dateTo = document.getElementById('dateTo').value;
            currentFilters.grade = document.getElementById('gradeFilter').value;
            currentFilters.subject = document.getElementById('subjectFilter').value;
            currentFilters.openOnly = document.getElementById('openOnlyFilter').checked;
            
            // Validate date range
            if (currentFilters.dateFrom && currentFilters.dateTo &&
                new Date(currentFilters.dateFrom) > new Date(currentFilters.dateTo)) {
                showToast('warning', '"From" date is after "To" date');
                return;
            }
            
            applyFilters();
            updateActiveFilters();
        }

        function handleSearchChange() {
            clearTimeout(window.searchTimeout);
            window.searchTimeout = setTimeout(() => {
                currentFilters.search = document.getElementById('searchFilter').value;
                applyFilters();
                updateActiveFilters();
            }, 300);
        }

        function applyFilters() {
            let filtered = [...allAssignments];
            
            // District filter
            if (currentFilters.district) {
                filtered = filtered.filter(a => a.district_id === currentFilters.district);
            }
            
            // School filter
            if (currentFilters.school) {
                filtered = filtered.filter(a => a.school_id === currentFilters.school);
            }
            
            // Date filters
            if (currentFilters.dateFrom) {
                const fromDate = new Date(currentFilters.dateFrom);
                filtered = filtered.filter(a => new Date(a.start_date) >= fromDate);
            }
            
            if (currentFilters.dateTo) {
                const toDate = new Date(currentFilters.dateTo);
                toDate.setHours(23, 59, 59); // End of day
                filtered = filtered.filter(a => new Date(a.end_date) <= toDate);
            }
            
            // Search filter
            if (currentFilters.search) {
                const query = currentFilters.search.toLowerCase();
                filtered = filtered.filter(a => 
                    a.subject?.toLowerCase().includes(query) ||
                    a.grade?.toLowerCase().includes(query) ||
                    a.notes?.toLowerCase().includes(query) ||
                    a.school_name?.toLowerCase().includes(query)
                );
            }
            
            // Grade filter
            if (currentFilters.grade) {
                const gradeQuery = currentFilters.grade.toLowerCase();
                filtered = filtered.filter(a => 
                    a.grade?.toLowerCase().includes(gradeQuery)
                );
            }
            
            // Subject filter
            if (currentFilters.subject) {
                const subjectQuery = currentFilters.subject.toLowerCase();
                filtered = filtered.filter(a => 
                    a.subject?.toLowerCase().includes(subjectQuery)
                );
            }
            
            // Open only filter
            if (currentFilters.openOnly) {
                filtered = filtered.filter(a => a.status === 'OPEN');
            }
            
            filteredAssignments = filtered;
            renderAssignments();
            updateResultsCount();
            syncFiltersToUrl();
        }

        function updateActiveFilters() {
            const activeFiltersEl = document.getElementById('activeFilters');
            const filterChipsEl = document.getElementById('filterChips');
            
            const activeFilters = [];
            
            if (currentFilters.district) {
                const districtName = userDistricts.find(d => d.district_id === currentFilters.district)?.district_name || 'Selected District';
                activeFilters.push({ key: 'district', label: districtName, value: currentFilters.district });
            }
            
            if (currentFilters.school) {
                const schoolSelect = document.getElementById('schoolFilter');
                const schoolName = schoolSelect.options[schoolSelect.selectedIndex]?.text || 'School';
                activeFilters.push({ key: 'school', label: schoolName, value: currentFilters.school });
            }
            
            if (currentFilters.dateFrom) {
                activeFilters.push({ key: 'dateFrom', label: `From ${currentFilters.dateFrom}`, value: currentFilters.dateFrom });
            }
            
            if (currentFilters.dateTo) {
                activeFilters.push({ key: 'dateTo', label: `To ${currentFilters.dateTo}`, value: currentFilters.dateTo });
            }
            
            if (currentFilters.search) {
                activeFilters.push({ key: 'search', label: `"${currentFilters.search}"`, value: currentFilters.search });
            }
            
            if (currentFilters.grade) {
                activeFilters.push({ key: 'grade', label: `Grade ${currentFilters.grade}`, value: currentFilters.grade });
            }
            
            if (currentFilters.subject) {
                activeFilters.push({ key: 'subject', label: currentFilters.subject, value: currentFilters.subject });
            }
            
            if (currentFilters.openOnly) {
                activeFilters.push({ key: 'openOnly', label: 'Open only', value: true });
            }
            
            if (activeFilters.length > 0) {
                filterChipsEl.innerHTML = activeFilters.map(filter => `
                    <span class="filter-chip px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
                        <span>${sanitizeText(filter.label)}</span>
                        <button onclick="clearFilter('${filter.key}')" class="ml-1 hover:text-red-600" aria-label="Remove ${filter.label} filter">
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        </button>
                    </span>
                `).join('');
                activeFiltersEl.classList.remove('hidden');
            } else {
                activeFiltersEl.classList.add('hidden');
            }
        }

        function clearFilter(filterKey) {
            switch (filterKey) {
                case 'district':
                    document.getElementById('districtFilter').value = '';
                    currentFilters.district = '';
                    // Also clear school when district is cleared
                    document.getElementById('schoolFilter').value = '';
                    document.getElementById('schoolFilter').disabled = true;
                    currentFilters.school = '';
                    break;
                case 'school':
                    document.getElementById('schoolFilter').value = '';
                    currentFilters.school = '';
                    break;
                case 'dateFrom':
                    document.getElementById('dateFrom').value = '';
                    currentFilters.dateFrom = '';
                    break;
                case 'dateTo':
                    document.getElementById('dateTo').value = '';
                    currentFilters.dateTo = '';
                    break;
                case 'search':
                    document.getElementById('searchFilter').value = '';
                    currentFilters.search = '';
                    break;
                case 'grade':
                    document.getElementById('gradeFilter').value = '';
                    currentFilters.grade = '';
                    break;
                case 'subject':
                    document.getElementById('subjectFilter').value = '';
                    currentFilters.subject = '';
                    break;
                case 'openOnly':
                    document.getElementById('openOnlyFilter').checked = false;
                    currentFilters.openOnly = false;
                    break;
            }
            
            applyFilters();
            updateActiveFilters();
        }

        function clearAllFilters() {
            // Reset all form elements
            document.getElementById('districtFilter').value = '';
            document.getElementById('schoolFilter').value = '';
            document.getElementById('schoolFilter').disabled = true;
            document.getElementById('dateFrom').value = '';
            document.getElementById('dateTo').value = '';
            document.getElementById('searchFilter').value = '';
            document.getElementById('gradeFilter').value = '';
            document.getElementById('subjectFilter').value = '';
            document.getElementById('openOnlyFilter').checked = false;
            
            // Reset filter state
            currentFilters = {
                district: '',
                school: '',
                dateFrom: '',
                dateTo: '',
                search: '',
                grade: '',
                subject: '',
                openOnly: false
            };
            
            applyFilters();
            updateActiveFilters();
            
            showToast('success', 'All filters cleared');
        }

        function updateResultsCount() {
            const countEl = document.getElementById('resultsCount');
            const count = filteredAssignments.length;
            
            if (count === 0) {
                countEl.textContent = 'No results';
            } else if (count === 1) {
                countEl.textContent = '1 assignment';
            } else {
                countEl.textContent = `${count} assignments`;
            }
        }

        // Assignment Management
        async function loadAssignments() {
            const loadingEl = document.getElementById('assignmentsLoading');
            const listEl = document.getElementById('assignmentsList');
            const emptyEl = document.getElementById('assignmentsEmpty');
            const container = document.getElementById('assignmentsContainer');
            
            // Show loading
            container.setAttribute('aria-busy', 'true');
            loadingEl.classList.remove('hidden');
            listEl.classList.add('hidden');
            emptyEl.classList.add('hidden');
            
            try {
                const response = await apiCall(API_ENDPOINTS.assignments);
                allAssignments = response.data || response;
                
                applyFilters();
                
                container.setAttribute('aria-busy', 'false');
                loadingEl.classList.add('hidden');
                
                if (filteredAssignments.length === 0) {
                    emptyEl.classList.remove('hidden');
                } else {
                    listEl.classList.remove('hidden');
                }
                
            } catch (error) {
                container.setAttribute('aria-busy', 'false');
                loadingEl.classList.add('hidden');
                showToast('error', 'Failed to load assignments');
            }
        }

        function renderAssignments() {
            const container = document.getElementById('assignmentsList');
            const emptyEl = document.getElementById('assignmentsEmpty');
            
            container.innerHTML = '';
            
            if (filteredAssignments.length === 0) {
                container.classList.add('hidden');
                emptyEl.classList.remove('hidden');
                return;
            }
            
            container.classList.remove('hidden');
            emptyEl.classList.add('hidden');
            
            filteredAssignments.forEach(assignment => {
                const card = createAssignmentCard(assignment);
                container.appendChild(card);
            });
        }

        function createAssignmentCard(assignment) {
            const card = document.createElement('div');
            card.className = 'bg-white rounded-xl border border-gray-200 p-6 card-hover fade-in';
            
            const isRequested = assignment.status === 'REQUESTED';
            const isClaimed = assignment.status === 'CLAIMED';
            const isOpen = assignment.status === 'OPEN';
            
            // Create card content
            const contentDiv = document.createElement('div');
            contentDiv.className = 'flex justify-between items-start';
            
            // Left column - assignment details
            const detailsDiv = document.createElement('div');
            detailsDiv.className = 'flex-1 min-w-0 pr-4';
            
            // School name (small, muted)
            const schoolName = document.createElement('p');
            schoolName.className = 'text-sm text-gray-500 mb-2';
            schoolName.textContent = assignment.school_name;
            
            // Title line (bold)
            const titleDiv = document.createElement('div');
            titleDiv.className = 'flex items-center gap-2 mb-2';
            
            const title = document.createElement('h3');
            title.className = 'font-bold text-gray-900 text-lg';
            const titleText = assignment.subject;
            if (assignment.grade) {
                title.textContent = `${titleText} • Grade ${assignment.grade}`;
            } else {
                title.textContent = titleText;
            }
            
            titleDiv.appendChild(title);
            
            // Date range
            const dateRange = document.createElement('p');
            dateRange.className = 'text-sm text-gray-600 mb-3';
            dateRange.textContent = formatDateRange(assignment.start_date, assignment.end_date);
            
            // Badge row
            const badgeRow = document.createElement('div');
            badgeRow.className = 'flex gap-2 mb-3';
            
            const typeBadge = createTypeBadge(assignment.type);
            badgeRow.appendChild(typeBadge);
            
            // Notes (if exists)
            let notesEl = null;
            if (assignment.notes) {
                notesEl = document.createElement('p');
                notesEl.className = 'text-sm text-gray-600 mt-3';
                notesEl.textContent = assignment.notes;
            }
            
            // Assemble left column
            detailsDiv.appendChild(schoolName);
            detailsDiv.appendChild(titleDiv);
            detailsDiv.appendChild(dateRange);
            detailsDiv.appendChild(badgeRow);
            if (notesEl) {
                detailsDiv.appendChild(notesEl);
            }
            
            // Right column - action button/status
            const actionDiv = document.createElement('div');
            actionDiv.className = 'flex flex-col items-end space-y-2';
            
            if (isOpen) {
                const requestBtn = document.createElement('button');
                requestBtn.className = 'bg-primary hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors min-h-[44px] whitespace-nowrap';
                requestBtn.textContent = 'Request';
                requestBtn.disabled = requestInProgress.has(assignment.assignment_id);
                
                // Rich accessible label
                const ariaLabel = `Request ${assignment.subject}${assignment.grade ? ' grade ' + assignment.grade : ''} at ${assignment.school_name} from ${formatDate(assignment.start_date)} to ${formatDate(assignment.end_date)}`;
                requestBtn.setAttribute('aria-label', ariaLabel);
                
                requestBtn.onclick = (e) => requestAssignment(e, assignment.assignment_id);
                actionDiv.appendChild(requestBtn);
            } else if (isRequested) {
                const requestedBadge = document.createElement('span');
                requestedBadge.className = 'badge-requested px-3 py-1 rounded-full text-xs font-medium';
                requestedBadge.textContent = 'Requested';
                actionDiv.appendChild(requestedBadge);
            } else if (isClaimed) {
                const claimedBadge = document.createElement('span');
                claimedBadge.className = 'badge-claimed px-3 py-1 rounded-full text-xs font-medium';
                claimedBadge.textContent = 'Claimed';
                actionDiv.appendChild(claimedBadge);
            }
            
            contentDiv.appendChild(detailsDiv);
            contentDiv.appendChild(actionDiv);
            card.appendChild(contentDiv);
            
            return card;
        }

        function createTypeBadge(type) {
            const badge = document.createElement('span');
            badge.className = 'px-3 py-1 rounded-full text-xs font-medium';
            
            switch (type) {
                case 'SINGLE_DAY':
                    badge.className += ' badge-single';
                    badge.textContent = 'Single day';
                    break;
                case 'MULTI_DAY':
                    badge.className += ' badge-multi';
                    badge.textContent = 'Multi day';
                    break;
                case 'PARTIAL_DAY':
                    badge.className += ' badge-partial';
                    badge.textContent = 'Partial day';
                    break;
                default:
                    badge.className += ' bg-gray-100 text-gray-800';
                    badge.textContent = type;
            }
            
            return badge;
        }

        async function requestAssignment(e, assignmentId) {
            if (requestInProgress.has(assignmentId)) return;
            
            const button = e.currentTarget;
            const originalText = button.textContent;
            
            requestInProgress.add(assignmentId);
            button.disabled = true;
            button.setAttribute('aria-disabled', 'true');
            button.setAttribute('aria-busy', 'true');
            button.textContent = 'Requesting...';
            
            try {
                await apiCall(API_ENDPOINTS.requestAssignment, {
                    method: 'POST',
                    body: JSON.stringify({ assignment_id: assignmentId })
                });
                
                // Optimistic update
                const assignment = allAssignments.find(a => a.assignment_id === assignmentId);
                if (assignment) {
                    assignment.status = 'REQUESTED';
                }
                
                applyFilters();
                showToast('success', 'Assignment requested successfully');
                announceToScreenReader('Assignment request submitted');
                
            } catch (error) {
                showToast('error', 'Failed to request assignment');
            } finally {
                requestInProgress.delete(assignmentId);
                button.disabled = false;
                button.removeAttribute('aria-disabled');
                button.removeAttribute('aria-busy');
                button.textContent = originalText;
            }
        }

        async function refreshAssignments() {
            const refreshBtn = document.getElementById('refreshBtn');
            const originalContent = refreshBtn.innerHTML;
            
            refreshBtn.innerHTML = `
                <svg class="w-4 h-4 loading-spinner" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
                <span>Refreshing...</span>
            `;
            refreshBtn.disabled = true;
            
            try {
                await loadAssignments();
                showToast('success', 'Assignments refreshed');
            } catch (error) {
                showToast('error', 'Failed to refresh');
            } finally {
                setTimeout(() => {
                    refreshBtn.innerHTML = originalContent;
                    refreshBtn.disabled = false;
                }, 1000);
            }
        }

        // Availability Drawer with focus trap and scroll lock
        let trapHandler = null;
        
        function lockScroll(lock) {
            document.documentElement.style.overflowY = lock ? 'hidden' : '';
        }
        
        function trapFocus(e) {
            if (e.key !== 'Tab') return;
            
            const panel = document.getElementById('availabilityPanel');
            const focusableElements = panel.querySelectorAll(
                'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            
            if (focusableElements.length === 0) return;
            
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];
            
            if (e.shiftKey && document.activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
            } else if (!e.shiftKey && document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
            }
        }
        
        function openAvailabilityDrawer() {
            lastFocus = document.activeElement;
            const drawer = document.getElementById('availabilityDrawer');
            const panel = document.getElementById('availabilityPanel');
            drawer.classList.remove('hidden');
            
            // Set default dates
            const today = new Date();
            const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
            
            document.getElementById('availabilityStartDate').value = today.toISOString().split('T')[0];
            document.getElementById('availabilityEndDate').value = nextWeek.toISOString().split('T')[0];
            
            // Add focus trap and lock scroll
            trapHandler = trapFocus;
            panel.addEventListener('keydown', trapHandler);
            lockScroll(true);
            
            // Focus panel for accessibility
            setTimeout(() => {
                panel.focus();
            }, 100);
        }

        function closeAvailabilityDrawer() {
            const drawer = document.getElementById('availabilityDrawer');
            const panel = document.getElementById('availabilityPanel');
            
            panel.classList.add('drawer-slide-out');
            
            // Remove focus trap and unlock scroll
            if (trapHandler) {
                panel.removeEventListener('keydown', trapHandler);
                trapHandler = null;
            }
            lockScroll(false);
            
            setTimeout(() => {
                drawer.classList.add('hidden');
                panel.classList.remove('drawer-slide-out');
                
                // Reset form
                document.getElementById('availabilityForm').reset();
                
                // Return focus to trigger element
                if (lastFocus && document.body.contains(lastFocus)) {
                    lastFocus.focus();
                }
            }, 300);
        }

        async function submitAvailability() {
            const form = document.getElementById('availabilityForm');
            const submitBtn = document.getElementById('submitAvailabilityBtn');
            
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }
            
            const formData = {
                district_id: document.getElementById('availabilityDistrict').value,
                school_id: document.getElementById('availabilitySchool').value || null,
                start_date: document.getElementById('availabilityStartDate').value,
                end_date: document.getElementById('availabilityEndDate').value,
                notes: document.getElementById('availabilityNotes').value || null
            };
            
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.setAttribute('aria-disabled', 'true');
            submitBtn.setAttribute('aria-busy', 'true');
            submitBtn.textContent = 'Submitting...';
            
            try {
                await apiCall(API_ENDPOINTS.submitAvailability, {
                    method: 'POST',
                    body: JSON.stringify(formData)
                });
                
                closeAvailabilityDrawer();
                showToast('success', 'Availability submitted');
                announceToScreenReader('Your availability has been submitted to the district');
                
            } catch (error) {
                showToast('error', 'Failed to submit availability');
            } finally {
                submitBtn.disabled = false;
                submitBtn.removeAttribute('aria-disabled');
                submitBtn.removeAttribute('aria-busy');
                submitBtn.textContent = originalText;
            }
        }

        // District Management
        async function loadUserDistricts() {
            try {
                const response = await apiCall(API_ENDPOINTS.districts);
                userDistricts = (response.data || response).filter(d => d.status === 'APPROVED');
                
                populateDistrictSelects();
                
                // Set default district if available
                const defaultDistrict = userDistricts.find(d => d.is_default);
                if (defaultDistrict) {
                    document.getElementById('districtFilter').value = defaultDistrict.district_id;
                    currentFilters.district = defaultDistrict.district_id;
                    await updateSchoolOptions(defaultDistrict.district_id);
                }
                
            } catch (error) {
                console.error('Failed to load districts:', error);
            }
        }

        function populateDistrictSelects() {
            const districtFilter = document.getElementById('districtFilter');
            const availabilityDistrict = document.getElementById('availabilityDistrict');
            
            // Clear existing options (keep first option)
            districtFilter.innerHTML = '<option value="">Select District</option>';
            availabilityDistrict.innerHTML = '<option value="">Select District</option>';
userDistricts.forEach(district => {
                const option1 = document.createElement('option');
                option1.value = district.district_id;
                option1.textContent = district.district_name;
                districtFilter.appendChild(option1);
                
                const option2 = document.createElement('option');
                option2.value = district.district_id;
                option2.textContent = district.district_name;
                availabilityDistrict.appendChild(option2);
            });
        }

        // Utility Functions
        function announceToScreenReader(message) {
            const announcer = document.getElementById('srAnnouncements');
            announcer.textContent = message;
            setTimeout(() => {
                announcer.textContent = '';
            }, 1000);
        }

        function showToast(type, message) {
            const toast = document.createElement('div');
            toast.className = `toast px-6 py-4 rounded-lg text-sm font-medium text-white max-w-sm shadow-lg ${getToastColor(type)}`;
            toast.textContent = message;
            toast.setAttribute('role', 'alert');
            toast.setAttribute('aria-live', 'assertive');
            toast.tabIndex = -1;
            
            const container = document.getElementById('toastContainer');
            container.appendChild(toast);
            
            toast.focus();
            announceToScreenReader(message);
            
            setTimeout(() => {
                toast.remove();
            }, 5000);
        }

        function getToastColor(type) {
            switch(type) {
                case 'success': return 'bg-accent';
                case 'warning': return 'bg-warning';
                case 'error': return 'bg-danger';
                default: return 'bg-primary';
            }
        }

        function logout() {
            localStorage.removeItem('authToken');
            localStorage.removeItem('userProfile');
            
            showToast('success', 'Signed out successfully');
            
            setTimeout(() => {
                window.location.href = '/sub';
            }, 1000);
        }

        // Initialize App
        document.addEventListener('DOMContentLoaded', async function() {
            // Check authentication
            if (!checkAuth()) {
                return;
            }
            
            // Initialize user info
            if (currentUser) {
                document.getElementById('userName').textContent = `${currentUser.first_name} ${currentUser.last_name}`;
                document.getElementById('userAvatar').textContent = currentUser.first_name.charAt(0).toUpperCase();
            } else {
                // Demo user fallback
                document.getElementById('userName').textContent = 'Sarah Thompson';
                document.getElementById('userAvatar').textContent = 'S';
            }
            
            // Load filters from URL
            loadFiltersFromUrl();
            
            // Load initial data
            try {
                await Promise.all([
                    loadUserDistricts(),
                    loadAssignments()
                ]);
                
                // Apply initial filters if any were loaded from URL
                if (Object.values(currentFilters).some(v => v)) {
                    applyFilters();
                    updateActiveFilters();
                }
                
            } catch (error) {
                console.error('Failed to load initial data:', error);
                showToast('error', 'Failed to load page data');
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                const drawer = document.getElementById('availabilityDrawer');
                if (!drawer.classList.contains('hidden')) {
                    closeAvailabilityDrawer();
                    return;
                }
                
                const searchInput = document.getElementById('searchFilter');
                if (searchInput && searchInput.value) {
                    searchInput.value = '';
                    currentFilters.search = '';
                    applyFilters();
                    updateActiveFilters();
                    searchInput.blur();
                }
            }
            
            if (e.key === '/' && !e.target.matches('input, textarea, select')) {
                e.preventDefault();
                document.getElementById('searchFilter').focus();
            }
        });

        // Close drawer when clicking outside
        document.addEventListener('click', function(e) {
            const drawer = document.getElementById('availabilityDrawer');
            if (!drawer.classList.contains('hidden') && e.target.classList.contains('drawer-overlay')) {
                closeAvailabilityDrawer();
            }
        });

        // Handle browser back/forward with URL filters
        window.addEventListener('popstate', function() {
            loadFiltersFromUrl();
            applyFilters();
            updateActiveFilters();
        });
    </script>
</body>
</html>
