import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin,
  Stethoscope
} from 'lucide-react';
import { 
  startOfWeek, 
  addDays, 
  addWeeks, 
  subWeeks, 
  format, 
  isSameDay, 
  isToday,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
  endOfWeek
} from 'date-fns';
import { Appointment, Resident } from '../types';

interface AppointmentCalendarProps {
  appointments: Appointment[];
  residents: Resident[];
  getDoctorNameDisplay: (apt: Appointment) => string;
  onAppointmentClick: (apt: Appointment) => void;
}

export function AppointmentCalendar({ 
  appointments, 
  residents,
  getDoctorNameDisplay,
  onAppointmentClick 
}: AppointmentCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');

  const goToPrevious = () => {
    if (viewMode === 'week') setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subMonths(currentDate, 1));
  };

  const goToNext = () => {
    if (viewMode === 'week') setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addMonths(currentDate, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const days = useMemo(() => {
    if (viewMode === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 0 }); // Sunday
      return Array.from({ length: 7 }).map((_, i) => addDays(start, i));
    } else {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
      const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });
      return eachDayOfInterval({ start: startDate, end: endDate });
    }
  }, [currentDate, viewMode]);

  const appointmentsByDay = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    appointments.forEach(apt => {
      if (!apt.date) return;
      // Convert to Date. Assuming apt.date is YYYY-MM-DD
      const dateParts = apt.date.split('-');
      if (dateParts.length !== 3) return;
      const d = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
      const dateStr = format(d, 'yyyy-MM-dd');
      
      const existing = map.get(dateStr) || [];
      existing.push(apt);
      map.set(dateStr, existing);
    });
    
    // Sort appointments in each day by time
    map.forEach(list => {
      list.sort((a, b) => (a.time || '').localeCompare(b.time || ''));
    });
    
    return map;
  }, [appointments]);

  const getHeaderLabel = () => {
    if (viewMode === 'week') {
      const start = days[0];
      const end = days[6];
      if (start.getMonth() === end.getMonth()) {
        return `${format(start, 'MMMM yyyy')}`;
      }
      if (start.getFullYear() === end.getFullYear()) {
        return `${format(start, 'MMM')} - ${format(end, 'MMM yyyy')}`;
      }
      return `${format(start, 'MMM yyyy')} - ${format(end, 'MMM yyyy')}`;
    }
    return format(currentDate, 'MMMM yyyy');
  };

  return (
    <div className="bg-white rounded-2xl border border-[#d6deeb] shadow-[0_6px_16px_rgba(11,42,111,.10)] overflow-hidden flex flex-col h-full bg-slate-50/50">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#d6deeb] bg-[rgba(11,42,111,.03)] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-[#d6deeb] flex items-center justify-center text-brand">
            <CalendarIcon size={20} />
          </div>
          <div>
            <h3 className="font-black text-slate-800 tracking-tight text-lg">Calendar View</h3>
            <p className="text-sm text-slate-500 font-medium">{getHeaderLabel()}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-white rounded-xl border border-[#d6deeb] p-1 shadow-sm">
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'week' ? 'bg-[rgba(11,42,111,.06)] text-brand' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'month' ? 'bg-[rgba(11,42,111,.06)] text-brand' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Month
            </button>
          </div>
          
          <div className="flex items-center gap-1 bg-white rounded-xl border border-[#d6deeb] p-1 shadow-sm">
            <button onClick={goToPrevious} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-600">
              <ChevronLeft size={18} />
            </button>
            <button onClick={goToToday} className="px-3 py-1.5 hover:bg-slate-100 rounded-lg transition-colors text-xs font-bold text-slate-600">
              Today
            </button>
            <button onClick={goToNext} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-600">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-x-auto">
        <div className="min-w-[800px] h-full flex flex-col p-4">
          <div className="grid grid-cols-7 gap-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-xs font-black text-slate-400 uppercase tracking-wider mb-2">
                {day}
              </div>
            ))}
            
            {days.map((day, i) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const dayAppts = appointmentsByDay.get(dateStr) || [];
              const today = isToday(day);
              const isCurrentMonth = day.getMonth() === currentDate.getMonth();
              
              return (
                <div 
                  key={day.toISOString()} 
                  className={`min-h-[140px] flex flex-col rounded-2xl border ${today ? 'border-brand/30 bg-brand/5 shadow-sm' : 'border-[#d6deeb] bg-white'} ${!isCurrentMonth && viewMode === 'month' ? 'opacity-50 bg-slate-50' : ''} overflow-hidden`}
                >
                  <div className={`px-3 py-2 border-b border-[#d6deeb]/50 flex justify-between items-center ${today ? 'bg-brand/10' : 'bg-slate-50/50'}`}>
                    <span className={`text-sm font-black ${today ? 'text-brand' : 'text-slate-600'}`}>
                      {format(day, 'd')}
                    </span>
                    {dayAppts.length > 0 && (
                      <span className="text-[10px] font-bold bg-white border border-[#d6deeb] px-1.5 py-0.5 rounded-full text-slate-500">
                        {dayAppts.length}
                      </span>
                    )}
                  </div>
                  
                  <div className="p-2 space-y-2 flex-grow overflow-y-auto custom-scrollbar max-h-[300px]">
                    <AnimatePresence>
                      {dayAppts.map(apt => (
                        <motion.button
                          layout
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          key={apt.id}
                          onClick={() => onAppointmentClick(apt)}
                          className="w-full text-left bg-white border border-[#e2e8f0] hover:border-brand/40 hover:shadow-md transition-all rounded-xl p-2.5 group relative"
                        >
                          <div className="flex items-center gap-1.5 mb-1.5 text-brand">
                            <Clock size={12} className="opacity-70" />
                            <span className="text-[10px] font-black">{apt.time || 'TBD'}</span>
                          </div>
                          
                          <div className="font-bold text-slate-800 text-xs mb-0.5 line-clamp-1 group-hover:text-brand transition-colors">
                            {apt.residentName}
                          </div>
                          
                          <div className="flex items-center gap-1 text-slate-500 mb-1 text-[10px]">
                            <Stethoscope size={10} className="shrink-0" />
                            <span className="line-clamp-1">{getDoctorNameDisplay(apt)}</span>
                          </div>

                          <div className="flex items-center gap-1 text-slate-500 text-[10px]">
                            <MapPin size={10} className="shrink-0" />
                            <span className="line-clamp-1">{apt.type || apt.description || 'Visit'}</span>
                          </div>
                          
                          {/* Status Indicator */}
                          <div className={`absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full ${
                             apt.status === 'Completed' ? 'bg-emerald-500' :
                             apt.status === 'Cancelled' ? 'bg-red-500' :
                             apt.status === 'Pending' ? 'bg-amber-500' :
                             'bg-brand-2'
                          }`} />
                        </motion.button>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
