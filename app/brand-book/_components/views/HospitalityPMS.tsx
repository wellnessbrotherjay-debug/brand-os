
import React, { useState } from 'react';
import { useAppStore } from '../store';
import { 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  MoreHorizontal, 
  Filter, 
  Download, 
  ChevronDown, 
  Plus, 
  Search, 
  XCircle, 
  RefreshCw,
  LayoutDashboard,
  List,
  BedDouble
} from 'lucide-react';
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, getDay } from 'date-fns';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend
} from 'recharts';

type Tab = 'dashboard' | 'calendar' | 'bookings' | 'housekeeping';

export const HospitalityPMS: React.FC = () => {
  const { rooms, bookings, activeBrandId, brands, identities } = useAppStore();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [actionsOpen, setActionsOpen] = useState(false);

  const activeBrand = brands.find(b => b.id === activeBrandId);
  const activeIdentity = identities.find(i => i.brand_id === activeBrandId);
  
  const activeRooms = rooms.filter(r => r.brand_id === activeBrandId);
  const activeBookings = bookings.filter(b => b.brand_id === activeBrandId);

  // --- THEME COLORS ---
  const THEME_ACCENT = activeIdentity?.color_accent_hex || '#04594d'; 
  const THEME_PRIMARY = activeIdentity?.color_primary_hex || '#ffffff';

  // --- CALCULATIONS ---
  const currentMonth = format(new Date(), 'MMMM yyyy');
  const totalRevenue = activeBookings.reduce((sum, b) => sum + b.total_amount, 0);
  const totalBookings = activeBookings.length;
  // Mock available logic
  const availableRooms = Math.max(0, (activeRooms.length * 30) - (activeBookings.length * 2)); 

  // Chart Data Mocks
  const occupancyData = Array.from({ length: 10 }, (_, i) => ({
    date: `2025-11-${String(i * 3 + 1).padStart(2, '0')}`,
    rate: Math.floor(Math.random() * 60) + 20
  }));

  const sourceData = [
    { name: 'Direct', value: 45, fill: '#047857' }, // Emerald
    { name: 'Booking.com', value: 35, fill: '#1e3a8a' }, // Blue
    { name: 'Traveloka', value: 20, fill: '#0ea5e9' }, // Sky
  ];

  // --- SUB-COMPONENTS ---

  const ActionsDropdown = () => (
    <div className="relative">
      <button 
        onClick={() => setActionsOpen(!actionsOpen)}
        className="flex items-center gap-2 px-6 py-3 rounded-lg text-white font-medium shadow-sm hover:opacity-90 transition-all"
        style={{ backgroundColor: THEME_ACCENT }}
      >
        Actions <ChevronDown size={16} />
      </button>
      
      {actionsOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-100 z-50 py-2 animate-in fade-in zoom-in-95 duration-100">
          <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2">
            <Plus size={14} /> Create Reservation
          </button>
          <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2" onClick={() => setActiveTab('bookings')}>
            <List size={14} /> Reservation List
          </button>
          <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2" onClick={() => setActiveTab('calendar')}>
            <CalendarIcon size={14} /> Reservation Calendar
          </button>
          <div className="border-t border-gray-100 my-1"></div>
          <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-500">
            <RefreshCw size={14} /> Refresh Data
          </button>
        </div>
      )}
    </div>
  );

  const DashboardView = () => (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Total Revenue</p>
          <div className="flex items-baseline gap-2">
             <span className="text-4xl font-bold text-gray-900">${totalRevenue.toLocaleString()}</span>
          </div>
          <p className="text-xs text-gray-400 mt-2">vs last month: $12,500</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Total Bookings</p>
          <div className="flex items-baseline gap-2">
             <span className="text-4xl font-bold text-gray-900">{totalBookings}</span>
          </div>
          <p className="text-xs text-gray-400 mt-2">vs last month: 12</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Available Units</p>
          <div className="flex items-baseline gap-2">
             <span className="text-4xl font-bold text-gray-900">{availableRooms}</span>
          </div>
          <p className="text-xs text-gray-400 mt-2">Capacity Health: Good</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Occupancy Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-6 text-center text-lg">Occupancy Rate</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={occupancyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 10, fill: '#9ca3af'}} 
                  angle={-45}
                  textAnchor="end"
                  height={50}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 10, fill: '#9ca3af'}} 
                />
                <Tooltip cursor={{fill: '#f9fafb'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}} />
                <Bar dataKey="rate" radius={[4, 4, 0, 0]}>
                  {occupancyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={THEME_ACCENT} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Source Donut */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-2 text-sm text-gray-500">Source of Booking</h3>
          <div className="h-64 w-full relative">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sourceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={0}
                    dataKey="value"
                  >
                    {sourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} />
                </PieChart>
             </ResponsiveContainer>
             {/* Center text simulation */}
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-8">
                <span className="text-xs text-gray-400">Total</span>
             </div>
          </div>
        </div>
      </div>

      {/* Activity Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-100 flex">
          <button className="px-6 py-4 text-sm font-bold border-b-2 border-gray-800 text-gray-900">Today Check-In</button>
          <button className="px-6 py-4 text-sm font-medium text-gray-400 hover:text-gray-600">In House</button>
          <button className="px-6 py-4 text-sm font-medium text-gray-400 hover:text-gray-600">Today Check-Out</button>
        </div>
        <div className="p-12 text-center">
           <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <List className="text-gray-300" />
           </div>
           <h3 className="text-gray-900 font-medium mb-1">No data available today</h3>
           <p className="text-gray-400 text-sm mb-6">You haven't added any data yet.</p>
           <div className="flex justify-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 rounded-md text-white text-sm font-medium shadow-sm" style={{ backgroundColor: THEME_ACCENT }}>
                 <Plus size={16} /> Add Data
              </button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-md border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50">
                 <RefreshCw size={16} /> Refresh
              </button>
           </div>
        </div>
      </div>
    </div>
  );

  const CalendarGridView = () => {
    const start = startOfMonth(new Date());
    const end = endOfMonth(new Date());
    const days = eachDayOfInterval({ start, end });

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in duration-300">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
           <div className="flex gap-2">
              <button className="px-4 py-2 text-white text-sm font-medium rounded" style={{ backgroundColor: THEME_ACCENT }}>Calendar</button>
              <button className="px-4 py-2 bg-white text-gray-500 hover:bg-gray-50 text-sm font-medium rounded border border-transparent hover:border-gray-200">Table</button>
           </div>
           <div className="font-bold text-gray-700">{format(new Date(), 'MMMM yyyy')}</div>
           <button className="px-4 py-2 text-white text-sm font-medium rounded" style={{ backgroundColor: THEME_ACCENT }}>Create</button>
        </div>
        
        <div className="overflow-x-auto">
          <div className="min-w-[1000px]">
            {/* Header Row */}
            <div className="flex border-b border-gray-200">
               <div className="w-32 shrink-0 p-3 font-bold text-gray-700 text-sm border-r border-gray-200 bg-gray-50 sticky left-0 z-10">Units</div>
               {days.map(day => (
                 <div key={day.toString()} className="w-24 shrink-0 p-2 text-center border-r border-gray-100">
                    <div className="text-xs font-bold text-gray-800">{format(day, 'EEE d')}</div>
                 </div>
               ))}
            </div>

            {/* Rows */}
            {activeRooms.map(room => (
              <div key={room.id} className="flex border-b border-gray-100 hover:bg-gray-50">
                 <div className="w-32 shrink-0 p-3 text-sm font-medium text-gray-700 border-r border-gray-200 bg-gray-50/50 sticky left-0 z-10 flex flex-col justify-center">
                    {room.name}
                    <span className="text-[10px] text-gray-400">{room.type}</span>
                 </div>
                 {days.map((day, idx) => {
                    // Mock booking placement
                    const hasBooking = activeBookings.some(b => b.room_id === room.id && isSameDay(parseISO(b.check_in), day));
                    const isStart = activeBookings.some(b => b.room_id === room.id && isSameDay(parseISO(b.check_in), day));
                    
                    // Booking pill style
                    let cellContent = null;
                    if (isStart) {
                       cellContent = (
                         <div className="absolute left-1 top-2 h-8 bg-blue-600 text-white text-xs rounded shadow-sm z-10 px-2 flex items-center whitespace-nowrap w-[200px] pointer-events-none">
                            Guest Name • Booking.com
                         </div>
                       );
                    }

                    return (
                      <div key={day.toString()} className="w-24 shrink-0 h-12 border-r border-gray-100 relative">
                         {cellContent}
                      </div>
                    );
                 })}
              </div>
            ))}
            
            {activeRooms.length === 0 && (
                <div className="p-12 text-center text-gray-400">
                    No units configured for this brand yet.
                </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const HousekeepingView = () => (
    <div className="animate-in fade-in duration-300">
       <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200 text-sm text-gray-600 flex justify-between items-center">
          <span>Room Status Settings</span>
          <a href="#" className="text-blue-600 hover:underline">Direct link for housekeeping</a>
       </div>

       <h2 className="text-center font-bold text-gray-800 mb-6 text-lg">{activeBrand?.name} Housekeeping</h2>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeRooms.map(room => (
            <div key={room.id} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
               {/* Header */}
               <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                  <div>
                     <p className="text-xs text-gray-500 font-medium uppercase">Unit</p>
                     <p className="text-xl font-bold text-gray-900">{room.name}</p>
                  </div>
                  <div className="bg-green-500 text-white px-6 py-1 rounded-full text-sm font-medium shadow-sm">
                     available
                  </div>
               </div>

               {/* Body */}
               <div className="p-4 space-y-4">
                  <div className="flex justify-between items-center">
                     <span className="font-bold text-sm text-gray-700">Condition:</span>
                     {room.status === 'Dirty' ? (
                        <div className="flex flex-col items-center">
                           <span className="text-xs font-bold text-gray-600 mb-1">Dirty</span>
                           <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white shadow-sm">
                              <XCircle size={14} />
                           </div>
                        </div>
                     ) : (
                        <div className="flex flex-col items-center">
                           <span className="text-xs font-bold text-gray-600 mb-1">Clean</span>
                           <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white shadow-sm">
                              <CheckCircle2 size={14} />
                           </div>
                        </div>
                     )}
                  </div>

                  <div className="space-y-2">
                     <div className="flex justify-between text-sm">
                        <span className="font-bold text-gray-700">Checkin Today:</span>
                        <span className="text-gray-400">-</span>
                     </div>
                     <div className="flex justify-between text-sm">
                        <span className="font-bold text-gray-700">Arrival Date:</span>
                        <span className="text-gray-600 font-mono">2025-11-24</span>
                     </div>
                     <div className="flex justify-between text-sm">
                        <span className="font-bold text-gray-700">Departure Date:</span>
                        <span className="text-gray-600 font-mono">2025-11-25</span>
                     </div>
                     <div className="flex justify-between text-sm">
                        <span className="font-bold text-gray-700">Frontdesk Status:</span>
                        <span className="text-red-500 font-bold">Checked Out</span>
                     </div>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-100 flex justify-between items-center text-sm">
                     <span className="font-bold text-gray-700">Comment:</span>
                     <span className="text-red-500 font-bold tracking-wider text-xs">EMPTY</span>
                  </div>
               </div>
            </div>
          ))}
          
           {activeRooms.length === 0 && (
                <div className="col-span-3 text-center py-12 text-gray-400 bg-white border border-dashed rounded-xl">
                    No housekeeping units needed for this brand.
                </div>
            )}
       </div>
    </div>
  );

  const BookingsView = () => (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-in fade-in duration-300">
       {/* Filters Sidebar */}
       <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
          <div className="flex justify-between items-center mb-6">
             <h3 className="font-bold text-gray-900"><Filter size={16} className="inline mr-2"/> Filters</h3>
             <button className="text-xs text-green-700 font-medium">Reset</button>
          </div>
          
          <div className="space-y-4">
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Guest Name</label>
                <div className="relative">
                   <Search size={14} className="absolute left-3 top-3 text-gray-400" />
                   <input type="text" placeholder="Search..." className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-green-600" />
                </div>
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Type</label>
                <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:border-green-600">
                   <option>Check In</option>
                   <option>Check Out</option>
                   <option>Created At</option>
                </select>
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <div className="flex flex-wrap gap-2">
                   <span className="flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-1 rounded border border-green-100"><div className="w-2 h-2 bg-green-500 rounded-full"></div> Confirmed</span>
                   <span className="flex items-center gap-1 text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded border border-orange-100"><div className="w-2 h-2 bg-orange-500 rounded-full"></div> Modified</span>
                   <span className="flex items-center gap-1 text-xs bg-red-50 text-red-700 px-2 py-1 rounded border border-red-100"><div className="w-2 h-2 bg-red-500 rounded-full"></div> Cancelled</span>
                </div>
             </div>
             
             <button className="w-full py-2 text-white rounded-lg text-sm font-medium mt-4" style={{ backgroundColor: THEME_ACCENT }}>Apply Filter</button>
          </div>
       </div>

       {/* List */}
       <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
             <h3 className="font-bold text-gray-900">Booking List</h3>
             <div className="flex gap-2">
                <button className="px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 flex items-center gap-2">
                   <Download size={14}/> Export
                </button>
                <button className="px-3 py-2 text-white rounded-lg text-xs font-medium flex items-center gap-2" style={{ backgroundColor: THEME_ACCENT }}>
                   <Plus size={14}/> Create
                </button>
             </div>
          </div>
          
          <table className="w-full text-left text-sm">
             <thead className="bg-gray-50 text-gray-500 font-bold text-xs uppercase tracking-wider">
                <tr>
                   <th className="px-6 py-4">Reservation</th>
                   <th className="px-6 py-4 text-center">OTA Name</th>
                   <th className="px-6 py-4">Property</th>
                   <th className="px-6 py-4 text-right">Amount</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-gray-100">
                {activeBookings.map(booking => (
                   <tr key={booking.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-6 py-4">
                         <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded flex items-center justify-center text-white font-bold text-xs shadow-sm ${
                               booking.status === 'Confirmed' ? 'bg-green-500' : 
                               booking.status === 'Cancelled' ? 'bg-red-500' : 'bg-gray-500'
                            }`}>
                               {booking.id.substring(0, 2)}
                            </div>
                            <div>
                               <div className="font-bold text-gray-900">{booking.guest_name}</div>
                               <div className="text-xs text-gray-400 font-mono">{booking.id.substring(0, 12)}</div>
                            </div>
                         </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                         <span className="font-bold text-gray-700">{booking.source}</span>
                      </td>
                      <td className="px-6 py-4">
                         <div className="text-gray-900 font-medium">{activeBrand?.name}</div>
                         <div className="text-xs text-gray-400">{activeRooms.find(r => r.id === booking.room_id)?.name}</div>
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-gray-900 font-bold">
                         ${booking.total_amount}
                      </td>
                   </tr>
                ))}
                {activeBookings.length === 0 && (
                     <tr>
                        <td colSpan={4} className="px-6 py-10 text-center text-gray-400">
                           No bookings found.
                        </td>
                     </tr>
                )}
             </tbody>
          </table>
       </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center sticky top-0 z-40 shadow-sm">
            <div className="flex items-center gap-4">
               {/* Brand Avatar */}
               <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm font-serif-brand shadow-md border border-black/5"
                    style={{ backgroundColor: THEME_ACCENT }}
                >
                  {activeBrand?.name.substring(0, 2).toUpperCase()}
               </div>
               <div>
                  <h1 className="text-xl font-bold text-gray-900 leading-none">{activeBrand?.name || 'Loading...'}</h1>
                  <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                     <div className="w-2 h-2 bg-green-500 rounded-full"></div> Operational
                  </p>
               </div>
            </div>
            
            <div className="flex items-center gap-6">
               {/* Tab Navigation (Top Level for Demo) */}
               <nav className="hidden md:flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
                  {(['dashboard', 'calendar', 'bookings', 'housekeeping'] as Tab[]).map(t => (
                     <button 
                        key={t}
                        onClick={() => setActiveTab(t)}
                        className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-all ${
                           activeTab === t ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
                        }`}
                        style={{ color: activeTab === t ? THEME_ACCENT : undefined }}
                     >
                        {t}
                     </button>
                  ))}
               </nav>

               <ActionsDropdown />
               
               <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-100 cursor-pointer">
                  <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="User" />
               </div>
            </div>
        </div>

        {/* Content Area */}
        <div className="p-8 max-w-[1600px] mx-auto">
           {activeTab === 'dashboard' && <DashboardView />}
           {activeTab === 'calendar' && <CalendarGridView />}
           {activeTab === 'housekeeping' && <HousekeepingView />}
           {activeTab === 'bookings' && <BookingsView />}
        </div>
    </div>
  );
};
