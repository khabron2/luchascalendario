/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Play, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Filter,
  Tv,
  Info,
  Loader2,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  eachDayOfInterval,
  parseISO
} from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utilities ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Constants & Types ---
const GOOGLE_SHEET_JSON_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS-YOUR_SHEET_ID/pub?output=csv"; 
// Note: In a real app, you'd use a proper JSON endpoint or parse CSV. 
// For this demo, we'll use a mock data structure and provide a way to connect.

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwRjKIW20klexS3TzFaspCLKwOLicfmTfmEK1_AcbS_zI61mn93HKiCFKYqDOFDL_1M/exec";

interface LuchaEvent {
  id: string | number;
  fecha: string;
  nombre: string;
  empresa: string;
  tipo: 'RAW' | 'SmackDown' | 'Collision' | 'Dynamite' | 'PPV' | string;
  video_url: string;
  descripcion: string;
  img?: string;
}

const IMAGENES_DEFAULT: Record<string, string> = {
  RAW: "https://images.unsplash.com/photo-1599058917233-35835bc486e3?q=80&w=800&auto=format&fit=crop", // Placeholder for RAW
  SmackDown: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=800&auto=format&fit=crop", // Placeholder for SD
  Collision: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=800&auto=format&fit=crop", // Placeholder for Collision
  Dynamite: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?q=80&w=800&auto=format&fit=crop", // Placeholder for Dynamite
  PPV: "https://images.unsplash.com/photo-1555661530-68c8e98db4e6?q=80&w=800&auto=format&fit=crop" // Generic PPV
};

function obtenerImagen(evento: Partial<LuchaEvent>) {
  if (evento.img && evento.img !== "") return evento.img;
  return IMAGENES_DEFAULT[evento.tipo || ""] || IMAGENES_DEFAULT["PPV"];
}

// --- Components ---

const EventCard: React.FC<{ event: LuchaEvent, onClick: () => void, isFocused?: boolean }> = ({ event, onClick, isFocused }) => (
  <motion.div
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className={cn(
      "relative group cursor-pointer overflow-hidden rounded-xl bg-zinc-900 border border-zinc-800 transition-all duration-300",
      isFocused && "ring-4 ring-rose-600 scale-105 z-10"
    )}
  >
    <div className="aspect-video relative">
      <img 
        src={obtenerImagen(event)} 
        alt={event.nombre}
        referrerPolicy="no-referrer"
        className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
      <div className="absolute bottom-2 left-2 right-2">
        <p className="text-xs font-bold text-rose-500 uppercase tracking-wider">{event.tipo}</p>
        <h3 className="text-sm font-semibold text-white truncate">{event.nombre}</h3>
      </div>
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="bg-rose-600 p-3 rounded-full shadow-lg">
          <Play className="w-6 h-6 text-white fill-current" />
        </div>
      </div>
    </div>
  </motion.div>
);

const VideoModal = ({ event, onClose }: { event: LuchaEvent, onClose: () => void }) => {
  // Simple YouTube embed logic
  const getEmbedUrl = (url: string) => {
    if (url.includes('youtube.com/watch?v=')) {
      return url.replace('watch?v=', 'embed/');
    }
    if (url.includes('youtu.be/')) {
      return url.replace('youtu.be/', 'youtube.com/embed/');
    }
    return url;
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 md:p-8"
    >
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white transition-colors z-50"
      >
        <X size={32} />
      </button>

      <div className="w-full max-w-6xl flex flex-col gap-6">
        <div className="aspect-video w-full bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl border border-zinc-800">
          <iframe
            src={getEmbedUrl(event.video_url)}
            className="w-full h-full"
            allowFullScreen
            title={event.nombre}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-rose-600 text-white text-xs font-bold rounded uppercase">
              {event.tipo}
            </span>
            <span className="text-zinc-400 text-sm">
              {format(parseISO(event.fecha), "d 'de' MMMM, yyyy", { locale: es })}
            </span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">
            {event.nombre}
          </h2>
          <p className="text-zinc-400 text-lg max-w-3xl leading-relaxed">
            {event.descripcion}
          </p>
          <div className="flex gap-4 pt-4">
            <button className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-lg font-bold hover:bg-zinc-200 transition-colors">
              <Play size={20} fill="black" /> Reproducir ahora
            </button>
            <button className="flex items-center gap-2 bg-zinc-800 text-white px-6 py-3 rounded-lg font-bold hover:bg-zinc-700 transition-colors">
              <Info size={20} /> Más información
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const AddEventModal = ({ onClose, onAdd }: { onClose: () => void, onAdd: (e: LuchaEvent) => void }) => {
  const [formData, setFormData] = useState<Partial<LuchaEvent>>({
    fecha: format(new Date(), 'yyyy-MM-dd'),
    nombre: '',
    empresa: 'WWE',
    tipo: 'RAW',
    video_url: '',
    descripcion: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call to Google Sheets
    setTimeout(() => {
      onAdd({
        ...formData,
        id: Date.now(),
      } as LuchaEvent);
      setIsSubmitting(false);
      onClose();
    }, 1000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Plus className="text-rose-500" /> Cargar Evento
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-500 uppercase">Fecha</label>
              <input 
                type="date" 
                required
                value={formData.fecha}
                onChange={e => setFormData({...formData, fecha: e.target.value})}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:ring-4 focus:ring-rose-500 outline-none text-lg"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-500 uppercase">Empresa</label>
              <select 
                value={formData.empresa}
                onChange={e => setFormData({...formData, empresa: e.target.value})}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:ring-4 focus:ring-rose-500 outline-none text-lg"
              >
                <option>WWE</option>
                <option>AEW</option>
                <option>NJPW</option>
                <option>AAA</option>
                <option>CMLL</option>
                <option>Otro</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-500 uppercase">Nombre del Evento</label>
            <input 
              type="text" 
              required
              placeholder="Ej: WrestleMania 40"
              value={formData.nombre}
              onChange={e => setFormData({...formData, nombre: e.target.value})}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:ring-4 focus:ring-rose-500 outline-none text-lg"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-500 uppercase">Tipo de Show</label>
            <select 
              value={formData.tipo}
              onChange={e => setFormData({...formData, tipo: e.target.value})}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:ring-4 focus:ring-rose-500 outline-none text-lg"
            >
              <option>RAW</option>
              <option>SmackDown</option>
              <option>Dynamite</option>
              <option>Collision</option>
              <option>Rampage</option>
              <option>NXT</option>
              <option>PPV</option>
              <option>Indie</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-500 uppercase">Link del Video</label>
            <input 
              type="url" 
              required
              placeholder="YouTube, Dailymotion, etc."
              value={formData.video_url}
              onChange={e => setFormData({...formData, video_url: e.target.value})}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:ring-4 focus:ring-rose-500 outline-none text-lg"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-500 uppercase">Descripción</label>
            <textarea 
              rows={3}
              value={formData.descripcion}
              onChange={e => setFormData({...formData, descripcion: e.target.value})}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:ring-4 focus:ring-rose-500 outline-none resize-none text-lg"
            />
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-rose-600 hover:bg-rose-700 text-white font-black py-4 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-3 text-xl shadow-lg shadow-rose-600/20"
          >
            {isSubmitting ? <Loader2 className="animate-spin" /> : <Plus size={24} />}
            {isSubmitting ? 'Guardando...' : 'Publicar Evento'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
};

// --- Main App ---

export default function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<LuchaEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<LuchaEvent | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterEmpresa, setFilterEmpresa] = useState("Todas");
  const [isLoading, setIsLoading] = useState(true);

  // Keyboard navigation state
  const [focusedIndex, setFocusedIndex] = useState(-1);

  // Fetch Events from Google Sheets
  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      // Solo intentamos fetch si la URL está configurada
      if (APPS_SCRIPT_URL.includes("YOUR_SCRIPT_ID")) {
        console.log("Usando datos de ejemplo (Configura APPS_SCRIPT_URL para usar Google Sheets)");
        setEvents([
          {
            id: 1,
            fecha: format(new Date(), 'yyyy-MM-dd'),
            nombre: "RAW: After WrestleMania",
            empresa: "WWE",
            tipo: "RAW",
            video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            descripcion: "El show más esperado del año después de la vitrina de los inmortales.",
            img: IMAGENES_DEFAULT["RAW"]
          },
          {
            id: 2,
            fecha: format(addDays(new Date(), 2), 'yyyy-MM-dd'),
            nombre: "Dynamite: New Era",
            empresa: "AEW",
            tipo: "Dynamite",
            video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            descripcion: "AEW presenta un show cargado de acción y sorpresas.",
            img: IMAGENES_DEFAULT["Dynamite"]
          }
        ]);
      } else {
        const response = await fetch(APPS_SCRIPT_URL);
        const data = await response.json();
        setEvents(data);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleAddEvent = async (newEvent: LuchaEvent) => {
    try {
      if (APPS_SCRIPT_URL.includes("YOUR_SCRIPT_ID")) {
        // Mock local update
        setEvents(prev => [...prev, { ...newEvent, img: obtenerImagen(newEvent) }]);
      } else {
        const response = await fetch(APPS_SCRIPT_URL, {
          method: 'POST',
          body: JSON.stringify(newEvent)
        });
        const result = await response.json();
        if (result.status === "success") {
          fetchEvents(); // Refresh list
        }
      }
    } catch (error) {
      console.error("Error adding event:", error);
    }
  };

  // Calendar Logic
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      const matchesSearch = e.nombre.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           e.tipo.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterEmpresa === "Todas" || e.empresa === filterEmpresa;
      return matchesSearch && matchesFilter;
    });
  }, [events, searchQuery, filterEmpresa]);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedEvent || showAddModal) return;

      if (e.key === 'ArrowRight') {
        setFocusedIndex(prev => Math.min(prev + 1, filteredEvents.length - 1));
      } else if (e.key === 'ArrowLeft') {
        setFocusedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && focusedIndex >= 0) {
        setSelectedEvent(filteredEvents[focusedIndex]);
      } else if (e.key === 'f') {
        document.documentElement.requestFullscreen().catch(() => {});
      } else if (e.key === 'r' || e.key === 'R') {
        fetchEvents();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredEvents, focusedIndex, selectedEvent, showAddModal]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-rose-500/30">
      {/* Navigation / Header */}
      <nav className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-zinc-800 px-4 md:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-rose-600 p-2 rounded-lg">
              <Tv className="text-white" size={24} />
            </div>
            <h1 className="text-xl font-black tracking-tighter uppercase italic">
              Lucha<span className="text-rose-600">Cal</span> TV
            </h1>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input 
                type="text"
                placeholder="Buscar eventos..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-rose-500 outline-none transition-all"
              />
            </div>
            
            <select 
              value={filterEmpresa}
              onChange={e => setFilterEmpresa(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-500"
            >
              <option>Todas</option>
              <option>WWE</option>
              <option>AEW</option>
            </select>

            <button 
              onClick={() => fetchEvents()}
              disabled={isLoading}
              className={cn(
                "p-3 rounded-full transition-all active:scale-95 bg-zinc-900 border-2 border-zinc-800 hover:bg-zinc-800 hover:border-rose-500 focus:ring-4 focus:ring-rose-500 outline-none",
                isLoading && "opacity-50 cursor-not-allowed"
              )}
              title="Actualizar Datos (R)"
            >
              <RefreshCw size={28} className={cn(isLoading && "animate-spin text-rose-500")} />
            </button>

            <button 
              onClick={() => setShowAddModal(true)}
              className="bg-rose-600 hover:bg-rose-700 p-3 rounded-full transition-transform active:scale-95 border-2 border-transparent hover:border-white focus:ring-4 focus:ring-rose-500 outline-none"
              title="Cargar Evento"
            >
              <Plus size={28} />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-12">
        {isLoading && events.length === 0 ? (
          <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-12 h-12 text-rose-600 animate-spin" />
            <p className="text-zinc-500 font-medium animate-pulse">Cargando eventos desde Google Sheets...</p>
          </div>
        ) : (
          <>
            {/* Calendar Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <CalendarIcon className="text-rose-500" size={28} />
              <h2 className="text-2xl font-bold capitalize">
                {format(currentDate, 'MMMM yyyy', { locale: es })}
              </h2>
            </div>
            <div className="flex gap-2">
              <button onClick={prevMonth} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors">
                <ChevronLeft size={24} />
              </button>
              <button onClick={nextMonth} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors">
                <ChevronRight size={24} />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {calendarDays
              .filter(day => isSameMonth(day, monthStart))
              .filter(day => events.some(e => isSameDay(parseISO(e.fecha), day)))
              .map((day, idx) => {
                const dayEvents = events.filter(e => isSameDay(parseISO(e.fecha), day));
                const isToday = isSameDay(day, new Date());
                
                return (
                  <motion.div 
                    key={idx} 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    className={cn(
                      "w-full p-4 md:p-6 rounded-2xl border transition-all duration-300 flex flex-col md:flex-row gap-6",
                      isToday 
                        ? "bg-zinc-900 border-rose-600/50 shadow-xl shadow-rose-600/5" 
                        : "bg-zinc-900/60 border-zinc-800 hover:border-zinc-700"
                    )}
                  >
                    {/* Date Column */}
                    <div className="flex flex-row md:flex-col items-center justify-center md:justify-start gap-2 md:min-w-[100px] text-center">
                      <span className={cn(
                        "text-4xl font-black tracking-tighter",
                        isToday ? "text-rose-500" : "text-white"
                      )}>
                        {format(day, 'd')}
                      </span>
                      <div className="flex flex-col items-start md:items-center">
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                          {format(day, 'EEEE', { locale: es })}
                        </span>
                        {isToday && (
                          <span className="text-[10px] font-black text-rose-600 uppercase mt-1">Hoy</span>
                        )}
                      </div>
                    </div>

                    {/* Events Column */}
                    <div className="flex-1 flex flex-col justify-center">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {dayEvents.map(event => (
                          <button
                            key={event.id}
                            onClick={() => setSelectedEvent(event)}
                            className="group flex items-center gap-4 p-3 rounded-xl bg-zinc-800/40 border border-zinc-700/50 hover:bg-rose-600 hover:border-rose-500 transition-all text-left"
                          >
                            <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                              <img 
                                src={obtenerImagen(event)} 
                                alt="" 
                                className="w-full h-full object-cover opacity-80 group-hover:opacity-100"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-black text-rose-500 uppercase leading-none mb-1 group-hover:text-rose-100">
                                {event.tipo}
                              </p>
                              <p className="text-sm font-bold text-zinc-100 truncate group-hover:text-white">
                                {event.nombre}
                              </p>
                              <p className="text-[11px] text-zinc-500 group-hover:text-rose-200 truncate">
                                {event.empresa}
                              </p>
                            </div>
                            <Play size={16} className="text-zinc-600 group-hover:text-white" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            
            {/* Empty State for the month */}
            {calendarDays
              .filter(day => isSameMonth(day, monthStart))
              .filter(day => events.some(e => isSameDay(parseISO(e.fecha), day)))
              .length === 0 && (
                <div className="h-64 flex flex-col items-center justify-center text-zinc-600 border-2 border-dashed border-zinc-800 rounded-2xl">
                  <CalendarIcon size={48} className="mb-4 opacity-20" />
                  <p>No hay eventos programados para este mes.</p>
                </div>
              )}
          </div>
        </section>

        {/* Featured / Grid Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Play className="text-rose-500 fill-current" size={24} /> 
              Próximos Eventos
            </h2>
            <p className="text-zinc-500 text-sm">{filteredEvents.length} eventos encontrados</p>
          </div>

          {filteredEvents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredEvents.map((event, index) => (
                <EventCard 
                  key={event.id} 
                  event={event} 
                  onClick={() => setSelectedEvent(event)}
                  isFocused={index === focusedIndex}
                />
              ))}
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-zinc-600 border-2 border-dashed border-zinc-800 rounded-2xl">
              <Search size={48} className="mb-4 opacity-20" />
              <p>No se encontraron eventos para esta búsqueda.</p>
            </div>
          )}
        </section>
      </>
    )}
  </main>

      {/* Modals */}
      <AnimatePresence>
        {selectedEvent && (
          <VideoModal 
            event={selectedEvent} 
            onClose={() => setSelectedEvent(null)} 
          />
        )}
        {showAddModal && (
          <AddEventModal 
            onClose={() => setShowAddModal(false)} 
            onAdd={handleAddEvent}
          />
        )}
      </AnimatePresence>

      {/* TV Mode Hint */}
      <div className="fixed bottom-4 left-4 flex items-center gap-4 text-[10px] text-zinc-500 uppercase tracking-widest hidden md:flex bg-black/40 backdrop-blur-md p-2 rounded-lg border border-zinc-800/50">
        <div className="flex items-center gap-1"><span className="bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-300">Arrows</span> Navegar</div>
        <div className="flex items-center gap-1"><span className="bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-300">Enter</span> Ver</div>
        <div className="flex items-center gap-1"><span className="bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-300">F</span> Fullscreen</div>
        <div className="flex items-center gap-1"><span className="bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-300">R</span> Actualizar</div>
      </div>

      {/* Footer */}
      <footer className="border-t border-zinc-800 mt-20 py-12 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 text-zinc-500 text-sm">
          <div className="flex items-center gap-2">
            <Tv size={20} />
            <span className="font-bold text-zinc-400">LuchaCal TV v1.0</span>
          </div>
          <div className="flex gap-8">
            <a href="#" className="hover:text-white transition-colors">Términos</a>
            <a href="#" className="hover:text-white transition-colors">Privacidad</a>
            <a href="#" className="hover:text-white transition-colors">Contacto</a>
          </div>
          <p>© 2026 Lucha Libre Calendar. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
