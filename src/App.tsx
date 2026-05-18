import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Search, MapPin, Building2, CheckCircle2, XCircle, 
  GraduationCap, User, Upload, Database, Loader2, 
  Check, AlertCircle, RefreshCw, FileText, Layers,
  LayoutGrid, LogOut, ClipboardList, ShieldCheck, Mail, Calendar, Users, Filter, Download, Trash2, Lock, ArrowLeft, Plus, IdCard, Phone, Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DatabaseStudent, VISITS_REQUIREMENTS, TechnicalVisit, Registration } from './types';
import { parseStudentReport, parseComplementReport } from './lib/parser';
import { supabase } from './lib/supabase';

// --- Components ---

function StudentTable({ data, sticky = false }: { data: DatabaseStudent[], sticky?: boolean }) {
  return (
    <div className={`overflow-auto border border-slate-50 rounded-2xl ${sticky ? 'max-h-[600px]' : 'max-h-[400px]'}`}>
      <table className="w-full text-left text-xs border-collapse">
        <thead className={sticky ? 'sticky top-0 z-10' : ''}>
          <tr className="bg-slate-50/80 backdrop-blur border-b border-slate-100">
            <th className="p-4 font-black uppercase tracking-widest text-slate-400">Reg</th>
            <th className="p-4 font-black uppercase tracking-widest text-slate-400">Nombre</th>
            <th className="p-4 font-black uppercase tracking-widest text-slate-400 text-center">Niv</th>
            <th className="p-4 font-black uppercase tracking-widest text-slate-400">CI</th>
            <th className="p-4 font-black uppercase tracking-widest text-slate-400">Celular</th>
            <th className="p-4 font-black uppercase tracking-widest text-slate-400">Correo</th>
            <th className="p-4 font-black uppercase tracking-widest text-slate-400">Lugar</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 bg-white/50">
          {data.slice(0, 100).map(s => (
            <tr key={s.registro} className="hover:bg-white transition-colors">
              <td className="p-4 font-mono font-bold text-slate-600">{s.registro}</td>
              <td className="p-4 font-bold text-slate-800">{s.nombre}</td>
              <td className="p-4 text-center"><span className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-md font-bold">{s.niv || s.nivel || s.semestre_activo?.split('-')[0] || '---'}</span></td>
              <td className="p-4 text-slate-500 font-mono">{s.ci || '---'}</td>
              <td className="p-4 text-slate-800 font-bold">{s.celular || '---'}</td>
              <td className="p-4 text-indigo-500 font-medium">{s.correo || '---'}</td>
              <td className="p-4 text-slate-400 italic truncate max-w-[200px]">{s.lugar || '---'}</td>
            </tr>
          ))}
          {data.length > 100 && (
            <tr><td colSpan={7} className="p-4 text-center text-slate-400 bg-slate-50/30">Mostrando solo los primeros 100 para rendimiento...</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// --- Main App ---

export default function App() {
  const [userRole, setUserRole] = useState<'guest' | 'student' | 'admin'>('guest');
  const [loginMode, setLoginMode] = useState<'select' | 'student' | 'admin'>('select');
  const [currentStudent, setCurrentStudent] = useState<DatabaseStudent | null>(null);
  
  // Login State
  const [loginId, setLoginId] = useState(''); // Registro for student
  const [loginPass, setLoginPass] = useState(''); // CI for student, Password for admin
  const [adminUser, setAdminUser] = useState(''); // Manual admin user
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Admin View State
  const [adminTab, setAdminTab] = useState<'stats' | 'sync' | 'registrations' | 'validator' | 'visitas'>('registrations');
  
  // Visit Management State
  const [editingVisit, setEditingVisit] = useState<TechnicalVisit | null>(null);
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [selectedVisitForStatus, setSelectedVisitForStatus] = useState<TechnicalVisit | null>(null);
  const [enrolledStudents, setEnrolledStudents] = useState<any[]>([]);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [visitForm, setVisitForm] = useState({
    nombre: '',
    descripcion: '',
    fecha: '',
    horario: '',
    horario_inicio: '',
    horario_fin: '',
    cupos_max: 30,
    min_nivel: 1
  });
  const [isSavingVisit, setIsSavingVisit] = useState(false);
  
  // Student View State
  const [availableVisits, setAvailableVisits] = useState<TechnicalVisit[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<string[]>([]); // Array of visit IDs
  const [isBooking, setIsBooking] = useState<string | null>(null);

  // New Registration Form State
  const [showRegModal, setShowRegModal] = useState<string | null>(null); // visitId
  const [regStep, setRegStep] = useState(1);
  const [regForm, setRegForm] = useState({
    tiene_seguro: false,
    tiene_epp: false,
    problema_salud: '',
    contacto_referencia: '',
  });
  const [comprobanteFile, setComprobanteFile] = useState<File | null>(null);
  const [regError, setRegError] = useState('');

  // Existing Logic States (Used in Admin Sync)
  const [baseStudents, setBaseStudents] = useState<DatabaseStudent[]>([]);
  const [compStudents, setCompStudents] = useState<DatabaseStudent[]>([]);
  const [finalStudents, setFinalStudents] = useState<DatabaseStudent[]>([]);
  const [syncProgress, setSyncProgress] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [lastSyncCount, setLastSyncCount] = useState(0);

  // Registration Data (Admin)
  const [allRegistrations, setAllRegistrations] = useState<Registration[]>([]);
  const [filterVisit, setFilterVisit] = useState<string>('all');
  const [filterQuery, setFilterQuery] = useState('');

  // Validator States
  const [searchTerm, setSearchState] = useState('');
  const [dbStudents, setDbStudents] = useState<DatabaseStudent[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<DatabaseStudent | null>(null);

  // Registration Details Modal
  const [viewRegDetails, setViewRegDetails] = useState<Registration | null>(null);

  // Admin Stats - Students Table
  const [adminStatsStudents, setAdminStatsStudents] = useState<DatabaseStudent[]>([]);
  const [adminStatsSearch, setAdminStatsSearch] = useState('');
  const [isAdminStatsLoading, setIsAdminStatsLoading] = useState(false);

  const fileInputBaseRef = useRef<HTMLInputElement>(null);
  const fileInputCompRef = useRef<HTMLInputElement>(null);

  // Load Initial Data
  useEffect(() => {
    fetchVisits();
    if (userRole === 'admin') {
      fetchAllRegistrations();
    }
  }, [userRole]);

  const fetchVisits = async () => {
    try {
      const { data, error } = await supabase.from('visitas').select('*');
      if (error) throw error;
      if (data) setAvailableVisits(data);
    } catch (err) {
      console.error("Error fetching visits:", err);
      // No fallback with numeric IDs to avoid UUID cast errors
    }
  };

  const fetchVisitStatus = async (visit: TechnicalVisit) => {
    setSelectedVisitForStatus(visit);
    setIsLoadingStatus(true);
    try {
      const { data, error } = await supabase
        .from('inscripciones')
        .select('*, student:estudiantes(*)')
        .eq('visita_id', visit.id);
      
      if (error) throw error;
      setEnrolledStudents(data || []);
    } catch (err) {
      console.error('Error fetching visit status:', err);
      alert('Error al cargar la lista de inscritos');
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const fetchAllRegistrations = async () => {
    // We select * which includes the manually added columns: nombre_estudiante and nombre_visita
    // We still try the join for additional details like 'carrera' which might not be in 'inscripciones'
    const { data, error } = await supabase
      .from('inscripciones')
      .select(`
        *,
        estudiantes (nombre, carrera, registro, niv, ci)
      `);
    
    if (error) {
      console.error("Error fetching registrations:", error);
      // Fallback selection if the join fails due to missing relationships
      const { data: fallbackData } = await supabase.from('inscripciones').select('*');
      if (fallbackData) {
        setAllRegistrations(fallbackData);
      }
      return;
    }

    if (data) {
      setAllRegistrations(data.map((r: any) => ({
        ...r,
        // Prioritize manual columns added by the user, fallback to join if needed
        nombre_estudiante: r.nombre_estudiante || r.estudiantes?.nombre || 'Estudiante N/D',
        nombre_visita: r.nombre_visita || 'Visita N/D'
      })));
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    if (loginMode === 'admin') {
      // Manual Admin check
      if (adminUser === 'admin' && loginPass === 'dirico21') {
        setUserRole('admin');
        setIsLoggingIn(false);
      } else {
        setLoginError('Usuario o contraseña administrativa incorrectos.');
        setIsLoggingIn(false);
      }
      return;
    }

    // Student login path
    try {
      const { data, error } = await supabase
        .from('estudiantes')
        .select('*')
        .eq('registro', loginId)
        .maybeSingle();

      if (error || !data) {
        setLoginError('No se encontró el estudiante. Verifique su Registro.');
      } else {
        // CI Logic: Only compare numbers, ignore extensions like -SCZ
        const cleanedInputCI = loginPass.split('-')[0].trim();
        const cleanedDbCI = (data.ci || '').split('-')[0].trim();

        if (cleanedInputCI === cleanedDbCI && cleanedInputCI !== '') {
          setCurrentStudent(data);
          setUserRole('student');
          // Fetch student registrations
          const { data: regs } = await supabase
            .from('inscripciones')
            .select('visita_id')
            .eq('estudiante_registro', data.registro);
          if (regs) setMyRegistrations(regs.map((r: any) => r.visita_id));
        } else {
          setLoginError('Cédula de Identidad incorrecta.');
        }
      }
    } catch (err) {
      setLoginError('Error de conexión.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRegisterForVisit = (visitId: string) => {
    if (!currentStudent) return;
    setShowRegModal(visitId);
    setRegForm({
      tiene_seguro: false,
      tiene_epp: false,
      problema_salud: '',
      contacto_referencia: '',
    });
    setComprobanteFile(null);
    setRegError('');
    setRegStep(1);
  };

  const submitRegistration = async () => {
    if (!currentStudent || !showRegModal) return;
    
    // Validation
    if (!regForm.tiene_seguro) {
      setRegError('El seguro Uni Vida es obligatorio para asistir.');
      return;
    }
    if (!comprobanteFile && regForm.tiene_seguro) {
      setRegError('Debe adjuntar el comprobante del seguro.');
      return;
    }
    if (!regForm.contacto_referencia.trim()) {
      setRegError('El contacto de referencia es obligatorio.');
      return;
    }

    setIsBooking(showRegModal);
    setRegError('');
    
    try {
      // Create a clean payload object to avoid stale state issues
      const registroId = currentStudent.registro;
      const visitId = String(showRegModal); // Ensure it's string (UUID)
      const visitName = availableVisits.find(v => v.id === visitId)?.nombre || 'Visita Técnica';

      let comprobanteUrl = '';

      if (comprobanteFile) {
        // 1. Upload to Supabase Storage
        const fileExt = comprobanteFile.name.split('.').pop();
        const fileName = `${registroId}_${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('comprobantes')
          .upload(filePath, comprobanteFile);

        if (uploadError) throw new Error('Error al subir el comprobante: ' + uploadError.message);

        // 2. Get Public URL
        const { data: urlData } = supabase.storage
          .from('comprobantes')
          .getPublicUrl(filePath);
        
        comprobanteUrl = urlData.publicUrl;
      }

      // Final Insert
      const { error } = await supabase
        .from('inscripciones')
        .insert({
          estudiante_registro: registroId,
          visita_id: visitId,
          nombre_estudiante: currentStudent.nombre, 
          nombre_visita: visitName,
          tiene_seguro: regForm.tiene_seguro,
          tiene_epp: regForm.tiene_epp,
          problema_salud: regForm.problema_salud,
          contacto_referencia: String(regForm.contacto_referencia).trim(),
          comprobante_seguro_url: comprobanteUrl
        });

      if (error) {
        if (error.code === '23505') {
          setRegError('Ya estás inscrito en esta visita.');
        } else if (error.code === '22P02') {
          setRegError('Error de Formato (UUID): La visita seleccionada no tiene un ID válido en la base de datos.');
          console.error("UUID Error payload:", { visitId, registroId });
        } else {
          throw error;
        }
      } else {
        setMyRegistrations(prev => [...prev, visitId]);
        setShowRegModal(null);
        alert('¡Inscripción completada con éxito!');
      }
    } catch (err: any) {
      console.error(err);
      setRegError(err.message || 'Error desconocido al registrar asistencia.');
    } finally {
      setIsBooking(null);
    }
  };

  const handleResetVisitForm = () => {
    setVisitForm({
      nombre: '',
      descripcion: '',
      fecha: '',
      horario: '',
      horario_inicio: '',
      horario_fin: '',
      cupos_max: 30,
      min_nivel: 1
    });
    setEditingVisit(null);
    setShowVisitModal(false);
  };

  const handleSaveVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingVisit(true);
    try {
      // Combined horario for database
      const finalHorario = `${visitForm.horario_inicio} - ${visitForm.horario_fin}`;
      const payload = {
        nombre: visitForm.nombre,
        descripcion: visitForm.descripcion,
        fecha: visitForm.fecha,
        horario: finalHorario,
        cupos_max: visitForm.cupos_max,
        min_nivel: visitForm.min_nivel
      };

      if (editingVisit) {
        const { error } = await supabase
          .from('visitas')
          .update(payload)
          .eq('id', editingVisit.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('visitas')
          .insert([payload]);
        if (error) throw error;
      }
      await fetchVisits();
      handleResetVisitForm();
      alert('Visita guardada correctamente');
    } catch (err: any) {
      console.error(err);
      alert('Error al guardar visita: ' + err.message);
    } finally {
      setIsSavingVisit(false);
    }
  };

  const handleDeleteVisit = async (id: string) => {
    if (!confirm('¿Seguro que desea eliminar esta visita técnica? Esto también podría afectar a inscripciones existentes.')) return;
    try {
      const { error } = await supabase
        .from('visitas')
        .delete()
        .eq('id', id);
      if (error) throw error;
      await fetchVisits();
    } catch (err: any) {
      alert('Error al eliminar visita: ' + err.message);
    }
  };
  const handleLogout = () => {
    setUserRole('guest');
    setLoginMode('select');
    setCurrentStudent(null);
    setLoginId('');
    setLoginPass('');
    setAdminUser('');
  };

  // --- Admin Sync Functions ---
  const handleFileUpload = (type: 'base' | 'comp') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsed = type === 'base' ? parseStudentReport(text) : parseComplementReport(text);
      if (type === 'base') setBaseStudents(parsed);
      else setCompStudents(parsed);
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  const executeMerge = () => {
    const mergeMap = new Map<string, DatabaseStudent>();
    const getLvl = (st: DatabaseStudent) => st.nivel || parseInt(st.semestre_activo?.split('-')[0]) || 0;
    baseStudents.forEach(s => mergeMap.set(s.registro, { ...s, nivel: getLvl(s) }));
    compStudents.forEach(s => {
      const sLvl = getLvl(s);
      if (mergeMap.has(s.registro)) {
        const existing = mergeMap.get(s.registro)!;
        mergeMap.set(s.registro, {
          ...existing,
          nombre: existing.nombre || s.nombre,
          correo: s.correo || existing.correo,
          celular: s.celular || existing.celular,
          carrera: existing.carrera || s.carrera,
          semestre_activo: existing.semestre_activo || s.semestre_activo,
          ci: existing.ci || s.ci,
          obs: existing.obs || s.obs || s.correo || '', 
          lugar: existing.lugar || s.lugar,
          nivel: getLvl(existing) || sLvl,
        });
      } else {
        mergeMap.set(s.registro, { ...s, nivel: sLvl, obs: s.obs || s.correo || '' });
      }
    });
    setFinalStudents(Array.from(mergeMap.values()).sort((a, b) => a.nombre.localeCompare(b.nombre)));
  };

  const handleSync = async () => {
    if (finalStudents.length === 0) return;
    setIsSyncing(true);
    setSyncStatus('idle');
    setSyncProgress(0);
    const batchSize = 100;
    const total = finalStudents.length;
    let count = 0;
    try {
      for (let i = 0; i < total; i += batchSize) {
        const batch = finalStudents.slice(i, i + batchSize);
        const dbBatch = batch.map((s) => ({
          registro: s.registro,
          nombre: s.nombre,
          carrera: s.carrera || '',
          semestre_activo: String(s.semestre_activo || ''),
          niv: s.nivel || 0,
          ci: s.ci || '',
          obs: s.obs || '',
          lugar: s.lugar || '',
          correo: s.correo || '',
          celular: s.celular || ''
        }));
        const { error } = await supabase.from('estudiantes').upsert(dbBatch, { onConflict: 'registro' });
        if (error) throw error;
        count += batch.length;
        setSyncProgress(Math.round((count / total) * 100));
      }
      setLastSyncCount(total);
      setSyncStatus('success');
      setBaseStudents([]); setCompStudents([]); setFinalStudents([]);
    } catch (err) {
      setSyncStatus('error');
    } finally {
      setIsSyncing(false);
    }
  };

  // --- Search Logic (Admin Validator) ---
  useEffect(() => {
    if (adminTab !== 'validator' || !searchTerm.trim()) return;
    const searchDB = async () => {
      const { data } = await supabase
        .from('estudiantes')
        .select('*')
        .or(`registro.ilike.%${searchTerm}%,nombre.ilike.%${searchTerm}%`)
        .limit(10);
      setDbStudents(data || []);
    };
    const timer = setTimeout(searchDB, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, adminTab]);

  // --- Admin Stats Students Search ---
  useEffect(() => {
    if (adminTab !== 'stats') return;
    const fetchAdminStatsStudents = async () => {
      setIsAdminStatsLoading(true);
      let query = supabase.from('estudiantes').select('*').order('nombre', { ascending: true }).limit(20);
      
      if (adminStatsSearch.trim()) {
        query = query.or(`registro.ilike.%${adminStatsSearch}%,nombre.ilike.%${adminStatsSearch}%`);
      }
      
      const { data } = await query;
      setAdminStatsStudents(data || []);
      setIsAdminStatsLoading(false);
    };
    
    const timer = setTimeout(fetchAdminStatsStudents, 400);
    return () => clearTimeout(timer);
  }, [adminStatsSearch, adminTab]);

  const filteredRegistrations = useMemo(() => {
    return allRegistrations.filter(r => {
      const matchesVisit = filterVisit === 'all' || r.visita_id === filterVisit;
      const matchesSearch = !filterQuery || 
        r.nombre_estudiante?.toLowerCase().includes(filterQuery.toLowerCase()) || 
        r.estudiante_registro.includes(filterQuery);
      return matchesVisit && matchesSearch;
    });
  }, [allRegistrations, filterVisit, filterQuery]);

  const handleDeleteRegistration = async (id: string) => {
    if (!confirm('¿Seguro que desea eliminar esta inscripción?')) return;
    const { error } = await supabase.from('inscripciones').delete().eq('id', id);
    if (!error) fetchAllRegistrations();
  };

  const exportConsolidated = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Estudiante,Registro,Carrera,Visita,Fecha"].join(",") + "\n"
      + filteredRegistrations.map(r => [r.nombre_estudiante, r.estudiante_registro, r.estudiantes?.carrera, r.nombre_visita, r.fecha_inscripcion].join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "consolidado_visitas.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Views ---

  if (userRole === 'guest') {
    return (
      <div className="min-h-screen bg-[#001f3f] flex flex-col items-center justify-center p-6 text-white font-sans overflow-hidden">
        <AnimatePresence mode="wait">
          {loginMode === 'select' ? (
            <motion.div 
              key="select"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl w-full grid grid-cols-1 md:grid-cols-2 gap-8"
            >
              <div className="md:col-span-2 flex flex-col items-center mb-6">
                <div className="p-4 bg-white rounded-3xl shadow-xl mb-6">
                  <Building2 className="w-12 h-12 text-[#001f3f]" />
                </div>
                <h1 className="text-4xl font-black text-center tracking-tight mb-2 uppercase text-white">UAGRM - FacuT</h1>
                <p className="text-indigo-200 font-medium text-center">Gestión de Visitas Técnicas</p>
              </div>

              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setLoginMode('student')}
                className="bg-white/10 backdrop-blur-md border border-white/20 p-10 rounded-[2.5rem] flex flex-col items-center gap-6 hover:bg-white/20 transition-all group"
              >
                <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center shadow-2xl group-hover:bg-indigo-50 transition-colors">
                  <GraduationCap className="w-12 h-12 text-[#001f3f]" />
                </div>
                <div className="text-center">
                  <h2 className="text-2xl font-black mb-2">Estudiantes</h2>
                  <p className="text-indigo-200 text-sm font-medium">Inscripción y gestión de visitas</p>
                </div>
              </motion.button>

              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setLoginMode('admin')}
                className="bg-white/10 backdrop-blur-md border border-white/20 p-10 rounded-[2.5rem] flex flex-col items-center gap-6 hover:bg-white/20 transition-all group"
              >
                <div className="w-24 h-24 rounded-full bg-indigo-600 flex items-center justify-center shadow-2xl group-hover:bg-indigo-500 transition-colors">
                  <ShieldCheck className="w-12 h-12 text-white" />
                </div>
                <div className="text-center">
                  <h2 className="text-2xl font-black mb-2">Administración</h2>
                  <p className="text-indigo-200 text-sm font-medium">Panel de control y reportes</p>
                </div>
              </motion.button>
            </motion.div>
          ) : (
            <motion.div 
              key="form"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="max-w-md w-full bg-white text-slate-900 p-10 rounded-[2.5rem] shadow-2xl relative"
            >
              <button 
                onClick={() => { setLoginMode('select'); setLoginError(''); }}
                className="absolute top-8 left-8 text-slate-400 hover:text-[#001f3f] transition-colors"
                title="Volver"
              >
                <ArrowLeft size={24} />
              </button>

              <div className="flex flex-col items-center mb-8 pt-4">
                <div className="p-4 bg-[#001f3f] rounded-2xl shadow-lg mb-4 text-white">
                  {loginMode === 'student' ? <GraduationCap size={32}/> : <ShieldCheck size={32}/>}
                </div>
                <h2 className="text-2xl font-black text-[#001f3f]">Acceso {loginMode === 'student' ? 'Estudiante' : 'Administrador'}</h2>
                <p className="text-slate-400 text-sm font-medium">Ingrese sus credenciales para continuar</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-6">
                {loginMode === 'admin' && (
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2 mb-2 block">Usuario Administrador</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                      <input 
                        type="text" 
                        value={adminUser}
                        onChange={(e) => setAdminUser(e.target.value)}
                        placeholder="Ej: admin"
                        className="w-full h-14 bg-slate-50 border-2 border-slate-100 focus:border-[#001f3f] focus:ring-4 focus:ring-indigo-100 rounded-2xl pl-12 outline-none transition-all placeholder:text-slate-300 font-bold"
                        required
                      />
                    </div>
                  </div>
                )}
                
                {loginMode === 'student' && (
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2 mb-2 block">Número de Registro</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                      <input 
                        type="text" 
                        value={loginId}
                        onChange={(e) => setLoginId(e.target.value)}
                        placeholder="Ingrese su registro"
                        className="w-full h-14 bg-slate-50 border-2 border-slate-100 focus:border-[#001f3f] focus:ring-4 focus:ring-indigo-100 rounded-2xl pl-12 outline-none transition-all placeholder:text-slate-300 font-bold"
                        required
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2 mb-2 block">
                    {loginMode === 'student' ? 'Cédula de Identidad (CI)' : 'Contraseña'}
                  </label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input 
                      type="password" 
                      value={loginPass}
                      onChange={(e) => setLoginPass(e.target.value)}
                      placeholder={loginMode === 'student' ? "Ingrese su CI" : "Contraseña de acceso"}
                      className="w-full h-14 bg-slate-50 border-2 border-slate-100 focus:border-[#001f3f] focus:ring-4 focus:ring-indigo-100 rounded-2xl pl-12 outline-none transition-all placeholder:text-slate-300 font-bold"
                      required
                    />
                  </div>
                </div>

                {loginError && <p className="text-rose-500 text-xs font-black text-center bg-rose-50 p-3 rounded-xl border border-rose-100">{loginError}</p>}

                <button disabled={isLoggingIn} type="submit" className="w-full h-16 bg-[#001f3f] text-white rounded-2xl font-black text-lg hover:bg-[#002f5f] transition-all flex items-center justify-center gap-2 transform active:scale-95 shadow-xl disabled:opacity-50">
                  {isLoggingIn ? <Loader2 className="animate-spin" /> : "INGRESAR AL SISTEMA"}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (userRole === 'student') {
    const studentLvl = currentStudent?.niv || parseInt(currentStudent?.semestre_activo?.split('-')[0]) || 0;
    
    return (
      <div className="min-h-screen bg-slate-50 font-sans p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          <header className="flex justify-between items-center mb-12">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg"><Building2 size={24}/></div>
              <h1 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Portal Estudiante</h1>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 hover:text-rose-500 hover:border-rose-100 transition-all shadow-sm">
              <LogOut size={18}/> Salir
            </button>
          </header>

          <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-2xl shadow-indigo-100 border border-slate-100 mb-10 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -mr-20 -mt-20 opacity-50"></div>
            <div className="flex flex-col md:flex-row gap-8 items-center mb-10 relative z-10">
              <div className="w-24 h-24 rounded-3xl bg-indigo-600 flex items-center justify-center text-white shadow-2xl shadow-indigo-200"><User size={48} /></div>
              <div className="text-center md:text-left">
                <h2 className="text-3xl font-black text-slate-800 capitalize leading-tight mb-2">{currentStudent?.nombre.toLowerCase()}</h2>
                <div className="flex flex-wrap justify-center md:justify-start gap-4">
                  <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl font-black text-xs uppercase tracking-widest">REG: {currentStudent?.registro}</span>
                  <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl font-black text-xs uppercase tracking-widest">Semestre: {studentLvl}</span>
                </div>
              </div>
            </div>

            <h3 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-3">
              <Calendar className="text-indigo-600" /> Próximas Visitas Técnicas
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableVisits.map(visit => {
                const isEligible = studentLvl >= visit.min_nivel;
                const isRegistered = myRegistrations.includes(visit.id);
                
                return (
                  <div key={visit.id} className={`group p-6 rounded-[2rem] border-2 transition-all relative overflow-hidden ${isRegistered ? 'bg-emerald-50 border-emerald-200' : isEligible ? 'bg-white border-slate-100 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-50' : 'bg-slate-50 border-slate-100'}`}>
                    {!isEligible && !isRegistered && (
                      <div className="absolute inset-0 bg-slate-900/5 backdrop-blur-[1px] flex items-center justify-center z-20">
                        <div className="bg-white/90 p-4 rounded-3xl shadow-2xl border border-slate-200 flex flex-col items-center gap-2 scale-90 md:scale-100">
                          <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl">
                            <Lock size={28}/>
                          </div>
                          <span className="text-[10px] font-black text-rose-700 uppercase tracking-widest text-center">Nivel insuficiente<br/>(Mínimo: {visit.min_nivel})</span>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-start mb-6">
                      <div className={`p-3 rounded-2xl ${isRegistered ? 'bg-emerald-500/10 text-emerald-600' : 'bg-indigo-500/10 text-indigo-600'}`}>
                        {isRegistered ? <CheckCircle2 size={24}/> : <Calendar size={24}/>}
                      </div>
                      <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter ${isEligible ? 'bg-indigo-100 text-[#001f3f]' : 'bg-rose-100 text-rose-700'}`}>
                        Mín Lvl {visit.min_nivel}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-800 mb-2 leading-snug">{visit.nombre}</h4>
                    <p className="text-slate-500 text-xs mb-6 line-clamp-2">{visit.descripcion}</p>
                    
                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-slate-400">{new Date(visit.fecha).toLocaleDateString()}</span>
                        {visit.horario && <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-tighter">{visit.horario}</span>}
                      </div>
                      {isRegistered ? (
                        <div className="flex items-center gap-1 text-emerald-600 font-black text-xs">
                          <Check size={14}/> INSCRITO
                        </div>
                      ) : (
                        <button 
                          disabled={!isEligible || isBooking === visit.id}
                          onClick={() => handleRegisterForVisit(visit.id)}
                          className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${isEligible ? 'bg-[#001f3f] text-white hover:bg-[#002f5f] shadow-lg shadow-indigo-100' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                        >
                          {isBooking === visit.id ? <Loader2 className="animate-spin w-4 h-4" /> : "Iniciar Inscripción"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="p-8 bg-indigo-900 rounded-3xl text-white flex flex-col md:flex-row items-center gap-6 justify-between border border-white/10">
            <div className="flex items-center gap-4">
              <Mail className="text-indigo-400" />
              <div>
                <p className="text-xs font-black uppercase text-indigo-400 tracking-widest leading-none mb-1">Dpto. de Bienestar Estudiantil</p>
                <p className="font-bold text-sm">¿Dudas? Contáctanos: bienestar.facut@uagrm.edu.bo</p>
              </div>
            </div>
            <div className="px-6 py-2 bg-white/10 rounded-2xl border border-white/20 text-xs font-mono">APP_VERSION: 2.1.0-STABLE</div>
          </div>

          <AnimatePresence>
            {showRegModal && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-[#001f3f]/80 backdrop-blur-xl z-[100] flex items-center justify-center p-0 md:p-8 overflow-y-auto"
              >
                <motion.div 
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="bg-white rounded-none md:rounded-[3rem] w-full max-w-5xl min-h-screen md:min-h-0 shadow-2xl relative overflow-hidden flex flex-col md:flex-row"
                >
                  {/* Left Sidebar - Steps Indicator */}
                  <div className="w-full md:w-80 bg-slate-50 p-8 md:p-12 border-b md:border-b-0 md:border-r border-slate-100 flex flex-col">
                    <button 
                      onClick={() => setShowRegModal(null)}
                      className="absolute top-8 left-8 p-2 bg-white text-slate-400 hover:text-rose-500 rounded-full shadow-sm hover:shadow-md transition-all z-[110]"
                    >
                      <XCircle size={32} />
                    </button>

                    <div className="mt-12 flex-1">
                      <div className="p-4 bg-indigo-600 w-fit rounded-2xl text-white shadow-xl mb-6">
                        <ClipboardList size={32} />
                      </div>
                      <h2 className="text-2xl font-black text-slate-800 leading-tight mb-2">Proceso de Inscripción</h2>
                      <p className="text-slate-400 text-sm font-medium mb-12">{availableVisits.find(v => v.id === showRegModal)?.nombre}</p>

                      <div className="space-y-10">
                        <div className={`flex items-center gap-4 transition-all ${regStep === 1 ? 'scale-105' : 'opacity-40'}`}>
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black ${regStep === 1 ? 'bg-[#001f3f] text-white' : 'bg-slate-200 text-slate-500'}`}>1</div>
                          <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Paso 1</p>
                            <p className="font-bold text-slate-700">Seguro y EPP</p>
                          </div>
                        </div>
                        <div className={`flex items-center gap-4 transition-all ${regStep === 2 ? 'scale-105' : 'opacity-40'}`}>
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black ${regStep === 2 ? 'bg-[#001f3f] text-white' : 'bg-slate-200 text-slate-500'}`}>2</div>
                          <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Paso 2</p>
                            <p className="font-bold text-slate-700">Salud y Contacto</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-auto pt-8">
                       <button onClick={() => setShowRegModal(null)} className="text-xs font-black text-slate-400 hover:text-rose-500 uppercase tracking-widest flex items-center gap-2 transition-colors">
                          <XCircle size={14}/> Cancelar Inscripción
                       </button>
                    </div>
                  </div>

                  {/* Main Form Area */}
                  <div className="flex-1 p-8 md:p-16 flex flex-col">
                    <AnimatePresence mode="wait">
                      {regStep === 1 ? (
                        <motion.div 
                          key="step1" 
                          initial={{ opacity: 0, x: 20 }} 
                          animate={{ opacity: 1, x: 0 }} 
                          exit={{ opacity: 0, x: -20 }}
                          className="flex-1"
                        >
                          <h3 className="text-4xl font-black text-slate-800 mb-4 tracking-tighter">Seguridad Industrial</h3>
                          <p className="text-slate-500 mb-10 font-medium max-w-md">Para el ingreso a planta, el seguro y el equipo de protección son requisitos obligatorios por normativa.</p>

                          <div className="space-y-12">
                            {/* Seguro Section */}
                            <div className="relative">
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                  <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl"><ShieldCheck size={24}/></div>
                                  <label className="text-lg font-bold text-slate-800 tracking-tight">¿Cuenta con seguro Uni Vida?</label>
                                </div>
                                <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl">
                                  <button onClick={() => setRegForm({...regForm, tiene_seguro: true})} className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${regForm.tiene_seguro ? 'bg-white text-emerald-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>SÍ</button>
                                  <button onClick={() => setRegForm({...regForm, tiene_seguro: false})} className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${!regForm.tiene_seguro ? 'bg-white text-rose-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>NO</button>
                                </div>
                              </div>

                              <AnimatePresence>
                                {regForm.tiene_seguro ? (
                                  <motion.div 
                                    initial={{ height: 0, opacity: 0 }} 
                                    animate={{ height: 'auto', opacity: 1 }} 
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="p-6 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 mt-2">
                                      <div className="flex flex-col items-center">
                                         <Upload className="text-slate-300 mb-3" size={32} />
                                         <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Adjuntar Comprobante (FOTO/PDF)</p>
                                         <input 
                                           type="file" 
                                           accept="image/*,.pdf"
                                           onChange={(e) => setComprobanteFile(e.target.files?.[0] || null)}
                                           className="text-xs text-slate-500 file:mr-4 file:py-2 file:px-6 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-[#001f3f] file:text-white hover:file:bg-indigo-700 cursor-pointer"
                                         />
                                         {comprobanteFile && <div className="mt-4 flex items-center gap-2 text-emerald-600 font-bold text-sm bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100"><Check size={18}/> {comprobanteFile.name}</div>}
                                      </div>
                                    </div>
                                  </motion.div>
                                ) : (
                                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 mt-4">
                                    <AlertCircle className="text-rose-600" />
                                    <p className="text-rose-700 text-xs font-black uppercase tracking-widest">El seguro es obligatorio para asistir a la visita.</p>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>

                            {/* EPP Section */}
                            <div className="relative">
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl"><Database size={24}/></div>
                                    <label className="text-lg font-bold text-slate-800 tracking-tight">¿Cuenta con equipo de protección (EPP)?</label>
                                  </div>
                                  <span className="mt-1 text-[10px] text-slate-400 font-black uppercase tracking-wider pl-[44px]">(Casco, botines, pantalón jean y camisa jean)</span>
                                </div>
                                <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl shrink-0">
                                  <button onClick={() => setRegForm({...regForm, tiene_epp: true})} className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${regForm.tiene_epp ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>SÍ</button>
                                  <button onClick={() => setRegForm({...regForm, tiene_epp: false})} className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${!regForm.tiene_epp ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>NO</button>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="mt-auto flex justify-end pt-12">
                            <button 
                              onClick={() => setRegStep(2)}
                              disabled={!regForm.tiene_seguro || !comprobanteFile}
                              className="h-16 px-12 bg-[#001f3f] text-white rounded-[2rem] font-black text-sm hover:scale-105 transition-all shadow-xl disabled:opacity-50 disabled:grayscale flex items-center gap-3"
                            >Siguiente Paso <CheckCircle2 size={20}/></button>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div 
                          key="step2" 
                          initial={{ opacity: 0, x: 20 }} 
                          animate={{ opacity: 1, x: 0 }} 
                          exit={{ opacity: 0, x: -20 }}
                          className="flex-1 flex flex-col"
                        >
                          <h3 className="text-4xl font-black text-slate-800 mb-4 tracking-tighter">Información Médica</h3>
                          <p className="text-slate-500 mb-10 font-medium max-w-md">Estos datos son confidenciales y se usarán únicamente en caso de emergencia durante la visita.</p>

                          <div className="space-y-8 flex-1">
                            <div>
                               <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 block pl-2">Estado de Salud / Discapacidad</label>
                               <textarea 
                                 value={regForm.problema_salud}
                                 onChange={(e) => setRegForm({...regForm, problema_salud: e.target.value})}
                                 placeholder="Describa si padece alguna afección médica relevante..."
                                 className="w-full h-40 p-6 bg-slate-50 border-2 border-slate-100 rounded-3xl outline-none focus:border-[#001f3f] focus:bg-white transition-all text-slate-700 font-medium resize-none shadow-inner"
                               />
                            </div>

                            <div>
                               <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 block pl-2">Celular de Emergencia (Referencia)</label>
                               <div className="relative">
                                  <Users className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={24} />
                                  <input 
                                    type="number"
                                    value={regForm.contacto_referencia}
                                    onChange={(e) => setRegForm({...regForm, contacto_referencia: e.target.value})}
                                    placeholder="Número de contacto actualizado"
                                    className="w-full h-20 pl-16 pr-8 bg-slate-50 border-2 border-slate-100 rounded-3xl outline-none focus:border-[#001f3f] focus:bg-white transition-all text-xl font-black shadow-inner"
                                  />
                               </div>
                            </div>
                          </div>

                          <div className="mt-12 flex justify-between items-center bg-slate-50 p-4 rounded-[2.5rem]">
                            <button 
                              onClick={() => setRegStep(1)}
                              className="h-16 px-8 text-slate-400 font-black text-sm uppercase tracking-widest hover:text-slate-600 transition-colors"
                            >Volver</button>

                            <button 
                              onClick={submitRegistration}
                              disabled={isBooking !== null || !regForm.contacto_referencia.trim()}
                              className="h-16 px-12 bg-emerald-600 text-white rounded-2xl font-black text-lg hover:scale-105 transition-all shadow-xl flex items-center gap-3 disabled:opacity-50 disabled:grayscale"
                            >
                              {isBooking ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={24}/>}
                              CONFIRMAR ASISTENCIA
                            </button>
                          </div>
                          {regError && <p className="mt-4 text-center text-xs font-black text-rose-500 uppercase tracking-widest animate-pulse">{regError}</p>}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // --- Admin View ---
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <div className="flex flex-col md:flex-row min-h-screen">
        {/* Sidebar */}
        <aside className="w-full md:w-72 bg-white border-r border-slate-100 flex flex-col p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-10 px-2 leading-none">
            <div className="p-2.5 bg-indigo-600 text-white rounded-2xl">
              <ShieldCheck size={28} />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-800 tracking-tighter uppercase">ADMIN</h1>
              <span className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase">Panel de Control</span>
            </div>
          </div>

          <nav className="flex-1 space-y-2">
              {[
                { id: 'registrations', label: 'Inscritos', icon: ClipboardList },
                { id: 'visitas', label: 'Gestión de Visitas', icon: Calendar },
                { id: 'validator', label: 'Validador Estudiantil', icon: Search },
                { id: 'stats', label: 'Resumen', icon: Filter },
                { id: 'sync', label: 'Sync & Import', icon: RefreshCw },
              ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setAdminTab(tab.id as any)}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                  adminTab === tab.id 
                    ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' 
                    : 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/50'
                }`}
              >
                <tab.icon size={20} />
                {tab.label}
              </button>
            ))}
          </nav>

          <button onClick={handleLogout} className="mt-auto flex items-center gap-4 px-4 py-3 text-slate-400 font-bold hover:text-rose-500 transition-colors">
            <LogOut size={20}/> Salir
          </button>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 md:p-12 overflow-y-auto">
          <AnimatePresence mode="wait">
            {adminTab === 'visitas' && (
              <motion.div key="vis" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-black text-slate-800">Gestión de Visitas</h2>
                    <p className="text-sm text-slate-400 font-medium tracking-tight">Administre las visitas técnicas y empresas registradas.</p>
                  </div>
                  <button 
                    onClick={() => { handleResetVisitForm(); setShowVisitModal(true); }}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                  >
                    <Plus size={18}/> Nueva Visita
                  </button>
                </div>

                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100">
                          <th className="p-5 text-[10px] font-black uppercase text-slate-400 tracking-widest pl-8">Empresa / Visita</th>
                          <th className="p-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Ubicación</th>
                          <th className="p-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Fecha / Hora</th>
                          <th className="p-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Nivel</th>
                          <th className="p-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Cupos</th>
                          <th className="p-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right pr-8">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {availableVisits.map(v => (
                          <tr key={v.id} className="hover:bg-slate-50/30 transition-colors group">
                            <td className="p-5 pl-8">
                              <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                                  <Calendar size={18}/>
                                </div>
                                <div>
                                  <div className="font-extrabold text-slate-800">{v.nombre}</div>
                                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">ID: {v.id.split('-')[0]}...</div>
                                </div>
                              </div>
                            </td>
                            <td className="p-5 text-center">
                              <span className="text-sm font-medium text-slate-500">{v.descripcion}</span>
                            </td>
                            <td className="p-5 text-center">
                              <div className="flex flex-col items-center">
                                <span className="text-sm font-bold text-slate-700">{new Date(v.fecha).toLocaleDateString()}</span>
                                <span className="text-[10px] font-black text-indigo-400 uppercase">{v.horario || 'N/D'}</span>
                              </div>
                            </td>
                            <td className="p-5 text-center">
                              <span className="px-3 py-1 bg-slate-50 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest">NVL {v.min_nivel}+</span>
                            </td>
                            <td className="p-5 text-center">
                              <div className="flex flex-col items-center">
                                <div className="flex items-center gap-1.5 text-sm font-bold text-slate-800">
                                  <Users size={14} className="text-slate-300"/>
                                  {allRegistrations.filter(r => r.visita_id === v.id).length} / {v.cupos_max}
                                </div>
                                  <div className="w-16 h-1 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                                    <div 
                                      className="h-full bg-indigo-500 rounded-full transition-all" 
                                      style={{
                                        width: `${Math.min(100, 
                                          (v.cupos_max > 0) 
                                            ? (allRegistrations.filter(r => r.visita_id === v.id).length / v.cupos_max) * 100 
                                            : 0
                                        )}%`
                                      }}
                                    ></div>
                                  </div>
                              </div>
                            </td>
                            <td className="p-5 text-right pr-8">
                              <div className="flex justify-end gap-2">
                                <button 
                                  onClick={() => {
                                    setEditingVisit(v);
                                    const times = (v.horario || '').split(' - ');
                                    setVisitForm({
                                      nombre: v.nombre,
                                      descripcion: v.descripcion,
                                      fecha: v.fecha,
                                      horario: v.horario || '',
                                      horario_inicio: times[0] || '',
                                      horario_fin: times[1] || '',
                                      cupos_max: v.cupos_max,
                                      min_nivel: v.min_nivel
                                    });
                                    setShowVisitModal(true);
                                  }}
                                  className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                                  title="Editar"
                                >
                                  <RefreshCw size={16}/>
                                </button>
                                <button 
                                  onClick={() => fetchVisitStatus(v)}
                                  className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"
                                  title="Ver Estado"
                                >
                                  <Eye size={16}/>
                                </button>
                                <button 
                                  onClick={() => handleDeleteVisit(v.id)}
                                  className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors"
                                  title="Eliminar"
                                >
                                  <Trash2 size={16}/>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {availableVisits.length === 0 && (
                    <div className="py-20 text-center bg-slate-50/30">
                      <Calendar size={48} className="mx-auto text-slate-200 mb-4"/>
                      <p className="text-slate-400 font-bold">No hay visitas configuradas en la base de datos.</p>
                      <button 
                        onClick={() => { handleResetVisitForm(); setShowVisitModal(true); }}
                        className="mt-4 px-6 py-2 bg-white border border-slate-200 rounded-xl text-indigo-600 font-black text-xs uppercase tracking-widest hover:bg-slate-50"
                      >Crear la primera visita</button>
                    </div>
                  )}
                </div>

                <AnimatePresence>
                  {showVisitModal && (
                    <motion.div 
                      initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                      className="fixed inset-0 bg-[#001f3f]/60 backdrop-blur-md z-[200] flex items-center justify-center p-4"
                    >
                      <motion.div 
                        initial={{scale:0.9, y:20}} animate={{scale:1, y:0}} exit={{scale:0.9, y:20}}
                        className="bg-white rounded-[2.5rem] p-10 max-w-2xl w-full shadow-2xl relative"
                      >
                        <button onClick={handleResetVisitForm} className="absolute top-8 right-8 text-slate-300 hover:text-rose-500 transition-colors"><XCircle size={32}/></button>
                        
                        <div className="flex items-center gap-4 mb-8">
                          <div className="p-4 bg-indigo-600 text-white rounded-3xl shadow-lg shadow-indigo-100"><Calendar size={32}/></div>
                          <div>
                            <h2 className="text-2xl font-black text-slate-800">{editingVisit ? 'Editar Visita' : 'Nueva Visita Técnica'}</h2>
                            <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Información de la empresa y logística</p>
                          </div>
                        </div>

                        <form onSubmit={handleSaveVisit} className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block pl-2">Nombre de la Empresa</label>
                              <input 
                                type="text"
                                placeholder="Ej: YPFB Refinería"
                                value={visitForm.nombre}
                                onChange={(e) => setVisitForm({...visitForm, nombre: e.target.value})}
                                required
                                className="w-full h-14 px-6 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-600 focus:bg-white transition-all font-bold"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block pl-2">Fecha de Visita</label>
                              <input 
                                type="date"
                                value={visitForm.fecha}
                                onChange={(e) => setVisitForm({...visitForm, fecha: e.target.value})}
                                required
                                className="w-full h-14 px-6 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-600 focus:bg-white transition-all font-bold"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block pl-2">Horario Inicio</label>
                                <input 
                                  type="time"
                                  value={visitForm.horario_inicio}
                                  onChange={(e) => setVisitForm({...visitForm, horario_inicio: e.target.value})}
                                  required
                                  className="w-full h-14 px-6 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-600 focus:bg-white transition-all font-bold"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block pl-2">Horario Fin</label>
                                <input 
                                  type="time"
                                  value={visitForm.horario_fin}
                                  onChange={(e) => setVisitForm({...visitForm, horario_fin: e.target.value})}
                                  required
                                  className="w-full h-14 px-6 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-600 focus:bg-white transition-all font-bold"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block pl-2">Cupos Disponibles</label>
                              <input 
                                type="number"
                                value={visitForm.cupos_max}
                                onChange={(e) => setVisitForm({...visitForm, cupos_max: parseInt(e.target.value)})}
                                required
                                min="1"
                                className="w-full h-14 px-6 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-600 focus:bg-white transition-all font-bold"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block pl-2">Nivel Mínimo (Semestre)</label>
                              <input 
                                type="number"
                                value={visitForm.min_nivel}
                                onChange={(e) => setVisitForm({...visitForm, min_nivel: parseInt(e.target.value)})}
                                required
                                min="1"
                                max="10"
                                className="w-full h-14 px-6 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-600 focus:bg-white transition-all font-bold"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block pl-2">Ubicación / Descripción</label>
                              <textarea 
                                placeholder="Dirección exacta o detalles logísticos"
                                value={visitForm.descripcion}
                                onChange={(e) => setVisitForm({...visitForm, descripcion: e.target.value})}
                                required
                                className="w-full h-28 p-6 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-600 focus:bg-white transition-all font-medium resize-none shadow-inner"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-3 pt-4">
                            <button type="button" onClick={handleResetVisitForm} className="h-14 px-6 font-black text-slate-400 text-[10px] uppercase tracking-widest hover:text-slate-600 transition-colors">Cancelar</button>
                            <button 
                              type="submit" 
                              disabled={isSavingVisit}
                              className="h-14 px-10 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-indigo-200 flex items-center gap-3 disabled:opacity-50 disabled:grayscale"
                            >
                              {isSavingVisit ? <Loader2 className="animate-spin" size={18}/> : <Database size={18}/>}
                              {editingVisit ? 'ACTUALIZAR VISITA' : 'CREAR VISITA'}
                            </button>
                          </div>
                        </form>
                      </motion.div>
                    </motion.div>
                  )}

                  {selectedVisitForStatus && (
                    <motion.div 
                      key="visit-status"
                      initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                      className="fixed inset-0 bg-[#001f3f]/60 backdrop-blur-md z-[200] flex items-center justify-center p-4"
                    >
                      <motion.div 
                        initial={{scale:0.9, y:20}} animate={{scale:1, y:0}} exit={{scale:0.9, y:20}}
                        className="bg-white rounded-[2.5rem] p-10 max-w-4xl w-full shadow-2xl relative max-h-[90vh] overflow-hidden flex flex-col"
                      >
                        <button onClick={() => setSelectedVisitForStatus(null)} className="absolute top-8 right-8 text-slate-300 hover:text-rose-500 transition-colors"><XCircle size={32}/></button>
                        
                        <div className="flex items-center gap-4 mb-8">
                          <div className="p-4 bg-emerald-600 text-white rounded-3xl shadow-lg shadow-emerald-100"><Eye size={32}/></div>
                          <div>
                            <h2 className="text-2xl font-black text-slate-800">Estado: {selectedVisitForStatus.nombre}</h2>
                            <div className="flex items-center gap-3">
                              <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">{selectedVisitForStatus.fecha} | {selectedVisitForStatus.horario}</p>
                              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${enrolledStudents.length >= selectedVisitForStatus.cupos_max ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                {enrolledStudents.length} / {selectedVisitForStatus.cupos_max} Inscritos
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex-1 overflow-auto bg-slate-50/50 rounded-2xl p-4 border border-slate-100">
                          {isLoadingStatus ? (
                            <div className="py-20 text-center">
                              <Loader2 className="animate-spin mx-auto text-indigo-600 mb-4" size={48}/>
                              <p className="text-slate-400 font-bold">Cargando lista de estudiantes...</p>
                            </div>
                          ) : enrolledStudents.length > 0 ? (
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-widest font-black text-[10px]">
                                  <th className="p-4">Estudiante</th>
                                  <th className="p-4">Registro</th>
                                  <th className="p-4">Carrera</th>
                                  <th className="p-4">Contacto</th>
                                </tr>
                              </thead>
                              <tbody>
                                {enrolledStudents.map((reg: any) => (
                                  <tr key={reg.id} className="border-b border-slate-50 last:border-0 hover:bg-white transition-colors">
                                    <td className="p-4 font-bold text-slate-800">{reg.student?.nombre || reg.nombre_estudiante || '---'}</td>
                                    <td className="p-4 font-mono text-indigo-600">{reg.estudiante_registro}</td>
                                    <td className="p-4 text-slate-500">{reg.student?.carrera || '---'}</td>
                                    <td className="p-4 text-slate-500 font-mono text-[10px]">{reg.student?.celular || reg.student?.telefono || '---'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <div className="py-20 text-center">
                              <Users className="mx-auto text-slate-200 mb-4" size={48}/>
                              <p className="text-slate-300 font-bold text-lg">No hay estudiantes inscritos aún.</p>
                            </div>
                          )}
                        </div>

                        <div className="mt-8 flex justify-end gap-4">
                          <button 
                            onClick={() => {
                              const csvContent = "data:text/csv;charset=utf-8," 
                                + "Nombre,Registro,Carrera,Celular\n"
                                + enrolledStudents.map(e => `${e.student?.nombre || e.nombre_estudiante},${e.estudiante_registro},${e.student?.carrera},${e.student?.celular || e.student?.telefono}`).join("\n");
                              const encodedUri = encodeURI(csvContent);
                              const link = document.createElement("a");
                              link.setAttribute("href", encodedUri);
                              link.setAttribute("download", `Inscritos_${selectedVisitForStatus.nombre.replace(/\s/g, '_')}.csv`);
                              document.body.appendChild(link);
                              link.click();
                            }}
                            disabled={enrolledStudents.length === 0}
                            className="bg-indigo-600 text-white px-8 h-14 rounded-2xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:grayscale"
                          >
                            <Download size={20}/>
                            Exportar CSV
                          </button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {adminTab === 'stats' && (
               <motion.div key="st" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="space-y-10">
                  <header>
                    <h2 className="text-3xl font-black text-slate-800 leading-none mb-3">Resumen de Elegibilidad</h2>
                    <p className="text-slate-500 font-medium">Análisis de la base de datos actual para visitas técnicas.</p>
                  </header>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><Users size={24}/></div>
                        <span className="text-xs font-black uppercase text-slate-400 tracking-widest">Estudiantes Totales</span>
                      </div>
                      <div className="text-5xl font-black text-slate-800">2,078</div>
                      <p className="text-emerald-500 font-bold text-xs mt-4 flex items-center gap-1"><Check size={14}/> Sincronizado con Supabase</p>
                    </div>
                    {availableVisits.map(v => (
                       <div key={v.id} className="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100">
                        <div className="flex items-center gap-4 mb-6">
                          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><Calendar size={24}/></div>
                          <span className="text-xs font-black uppercase text-slate-400 tracking-widest">{v.nombre}</span>
                        </div>
                        <div className="text-5xl font-black text-slate-800">
                          {allRegistrations.filter(r => r.visita_id === v.id).length}<span className="text-2xl text-slate-300">/{v.cupos_max}</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full mt-6 overflow-hidden">
                          <div 
                            className="bg-emerald-500 h-full rounded-full transition-all duration-1000" 
                            style={{
                              width: `${Math.min(100, (v.cupos_max > 0) 
                                ? (allRegistrations.filter(r => r.visita_id === v.id).length / v.cupos_max) * 100 
                                : 0)}%`
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Students Table for Stats */}
                  <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                       <div>
                         <h3 className="text-xl font-black text-slate-800">Base de Estudiantes</h3>
                         <p className="text-sm text-slate-400 font-medium">Buscador global en tiempo real de registros estudiantiles.</p>
                       </div>
                       <div className="relative w-full md:w-96">
                         <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                         <input 
                           type="text" 
                           placeholder="Buscar por nombre o registro..."
                           className="w-full h-12 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium focus:border-indigo-500 transition-all shadow-inner"
                           value={adminStatsSearch}
                           onChange={(e) => setAdminStatsSearch(e.target.value)}
                         />
                         {isAdminStatsLoading && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500 animate-spin" />}
                       </div>
                    </div>

                    <div className="overflow-x-auto border border-slate-50 rounded-2xl">
                       <table className="w-full text-left text-sm whitespace-nowrap">
                          <thead className="bg-slate-50 text-slate-400 font-black uppercase text-[10px] tracking-widest">
                             <tr>
                                <th className="p-5">Estudiante</th>
                                <th className="p-5">Registro</th>
                                <th className="p-5">Contacto</th>
                                <th className="p-5">Celular</th>
                                <th className="p-5">Semestre / Carrera</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                             {adminStatsStudents.map(s => (
                                <tr key={s.registro} className="hover:bg-slate-50/50 transition-colors">
                                   <td className="p-5">
                                      <div className="font-bold text-slate-800">{s.nombre}</div>
                                      <div className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">CI: {s.ci || '---'}</div>
                                   </td>
                                   <td className="p-5">
                                      <div className="font-mono text-indigo-600 font-black text-xs bg-indigo-50 px-2 py-1 rounded-lg inline-block">{s.registro}</div>
                                   </td>
                                   <td className="p-5">
                                      <div className="flex flex-col">
                                         <span className="font-medium text-slate-600 flex items-center gap-2"><Mail size={12} className="text-slate-300"/> {s.correo || 'S/E'}</span>
                                         <span className="text-xs text-slate-400 font-bold">{s.telefono || 'S/T'}</span>
                                      </div>
                                   </td>
                                   <td className="p-5">
                                      <div className="font-bold text-slate-800">{s.celular || '---'}</div>
                                   </td>
                                   <td className="p-5">
                                      <div className="font-bold text-slate-700 truncate max-w-[200px]">{s.carrera}</div>
                                      <div className="text-[10px] font-black text-indigo-400 uppercase">Nivel: {s.niv || s.semestre_activo || '?'}</div>
                                   </td>
                                </tr>
                             ))}
                             {adminStatsStudents.length === 0 && !isAdminStatsLoading && (
                               <tr><td colSpan={5} className="p-10 text-center font-bold text-slate-300 italic">No hay estudiantes que correspondan a la búsqueda.</td></tr>
                             )}
                          </tbody>
                       </table>
                    </div>
                    <div className="mt-6 flex justify-center">
                       <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Mostrando resultados limitados (Base de 2,078 registros)</p>
                    </div>
                  </div>
               </motion.div>
            )}

            {adminTab === 'registrations' && (
              <motion.div key="reg" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100">
                 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 pb-8 border-b border-slate-50">
                    <div>
                      <h2 className="text-2xl font-black text-slate-800 mb-1">Gestión de Inscritos</h2>
                      <p className="text-sm text-slate-400 font-medium">Listado en tiempo real de los registros de estudiantes.</p>
                    </div>
                    <div className="flex flex-wrap gap-4">
                      <select 
                        value={filterVisit} 
                        onChange={(e) => setFilterVisit(e.target.value)}
                        className="h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-sm text-slate-600 focus:border-indigo-500 transition-all"
                      >
                        <option value="all">Todas las visitas</option>
                        {availableVisits.map(v => <option key={v.id} value={v.id}>{v.nombre}</option>)}
                      </select>
                      <button onClick={exportConsolidated} className="h-12 px-6 bg-slate-800 text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-slate-700 transition-all">
                        <Download size={18}/> Exportar CSV
                      </button>
                    </div>
                 </div>

                 <div className="relative mb-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input 
                      type="text" 
                      placeholder="Filtrar por nombre o registro..."
                      className="w-full h-12 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium focus:border-indigo-500 transition-all"
                      value={filterQuery}
                      onChange={(e) => setFilterQuery(e.target.value)}
                    />
                 </div>

                 <div className="overflow-hidden border border-slate-100 rounded-2xl">
                    <table className="w-full text-left text-sm">
                       <thead className="bg-slate-50 text-slate-400 font-black uppercase text-[10px] tracking-widest">
                          <tr>
                             <th className="p-4">Estudiante</th>
                             <th className="p-4">Registro</th>
                             <th className="p-4">Visita Técnica</th>
                             <th className="p-4 text-center">Seguro/EPP</th>
                             <th className="p-4">Ref</th>
                             <th className="p-4 text-right">Detalles</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-50">
                          {filteredRegistrations.map(r => (
                             <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-4">
                                   <div className="font-bold text-slate-800">{r.nombre_estudiante}</div>
                                   <div className="text-[10px] text-slate-400 font-black uppercase">{r.estudiantes?.carrera || 'Carrera N/D'}</div>
                                </td>
                                <td className="p-4 font-mono text-slate-500">{r.estudiante_registro}</td>
                                <td className="p-4">
                                   <div className="font-bold text-indigo-600">{r.nombre_visita}</div>
                                   <div className="text-[10px] text-slate-400">{new Date(r.fecha_inscripcion!).toLocaleDateString()}</div>
                                </td>
                                <td className="p-4">
                                   <div className="flex justify-center gap-2">
                                      <span title="Seguro" className={`w-2.5 h-2.5 rounded-full ${r.tiene_seguro ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                                      <span title="EPP" className={`w-2.5 h-2.5 rounded-full ${r.tiene_epp ? 'bg-emerald-500' : 'bg-indigo-500'}`}></span>
                                   </div>
                                </td>
                                <td className="p-4 font-bold text-slate-600">{r.contacto_referencia || '---'}</td>
                                <td className="p-4 text-right">
                                   <div className="flex justify-end items-center gap-2">
                                      {r.comprobante_seguro_url && (
                                        <a 
                                          href={r.comprobante_seguro_url} 
                                          target="_blank" 
                                          rel="noopener noreferrer" 
                                          className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"
                                          title="Ver Seguro"
                                        >
                                          <ShieldCheck size={18}/>
                                        </a>
                                      )}
                                      <button onClick={() => setViewRegDetails(r)} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"><FileText size={18}/></button>
                                      <button onClick={() => handleDeleteRegistration(r.id!)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={18}/></button>
                                   </div>
                                </td>
                             </tr>
                          ))}
                          {filteredRegistrations.length === 0 && (
                            <tr><td colSpan={6} className="p-10 text-center font-bold text-slate-300 italic">No hay registros que coincidan con los filtros.</td></tr>
                          )}
                       </tbody>
                    </table>
                 </div>
              </motion.div>
            )}

            {adminTab === 'validator' && (
              <motion.div key="val" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}}>
                <section className="relative mb-12">
                   <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Investigar Registro o Nombre..."
                      className="w-full h-16 pl-12 pr-4 bg-white border-2 border-slate-100 rounded-3xl shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-xl font-medium"
                      value={searchTerm}
                      onChange={(e) => setSearchState(e.target.value)}
                    />
                  </div>
                  <AnimatePresence>
                    {dbStudents.length > 0 && (
                      <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0}} className="absolute top-full left-0 right-0 mt-3 bg-white border border-slate-100 rounded-3xl shadow-2xl z-50 overflow-hidden">
                        {dbStudents.map(s => (
                          <button key={s.registro} onClick={() => { setSelectedStudent(s); setDbStudents([]); setSearchState(''); }} className="w-full p-5 flex items-center gap-5 hover:bg-indigo-50/50 transition-colors border-b last:border-none border-slate-50 text-left">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-lg">{s.niv || (s.semestre_activo ? s.semestre_activo.split('-')[0] : '?')}</div>
                            <div>
                              <div className="font-bold text-slate-800">{s.nombre}</div>
                              <div className="text-xs text-slate-500 font-mono">ID: {s.registro} | {s.carrera}</div>
                            </div>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </section>

                {selectedStudent ? (
                  <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} className="bg-white rounded-[2.5rem] p-10 shadow-2xl shadow-indigo-100 border border-slate-100">
                    <div className="flex justify-between items-start mb-12">
                      <div className="flex gap-8 items-center">
                        <div className="w-24 h-24 rounded-[2rem] bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-200"><User size={48} /></div>
                        <div>
                          <h2 className="text-3xl font-black text-slate-800 tracking-tighter mb-2">{selectedStudent.nombre}</h2>
                          <div className="flex items-center gap-3">
                            <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-xs font-black uppercase tracking-widest">{selectedStudent.carrera}</span>
                            <span className="w-1.5 h-1.5 bg-slate-200 rounded-full"></span>
                            <span className="text-sm font-bold text-slate-400">ID Estudiantil: {selectedStudent.registro}</span>
                          </div>
                        </div>
                      </div>
                      <button onClick={() => setSelectedStudent(null)} className="p-3 bg-slate-50 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"><XCircle size={32}/></button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                      <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center gap-5 group hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all">
                         <div className="p-4 bg-white rounded-2xl text-indigo-600 shadow-sm transition-transform group-hover:scale-110"><IdCard size={24}/></div>
                         <div>
                           <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-0.5">Carnet CI</p>
                           <p className="text-lg font-black text-slate-800">{selectedStudent.ci || '---'}</p>
                         </div>
                      </div>
                      <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center gap-5 group hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all">
                         <div className="p-4 bg-white rounded-2xl text-indigo-600 shadow-sm transition-transform group-hover:scale-110"><Database size={24}/></div>
                         <div>
                           <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-0.5">Registro</p>
                           <p className="text-lg font-black text-indigo-600">{selectedStudent.registro}</p>
                         </div>
                      </div>
                      <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center gap-5 group hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all">
                         <div className="p-4 bg-white rounded-2xl text-indigo-600 shadow-sm transition-transform group-hover:scale-110"><Phone size={24}/></div>
                         <div>
                           <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-0.5">Contacto</p>
                           <p className="text-lg font-black text-slate-800">{selectedStudent.celular || selectedStudent.telefono || '---'}</p>
                         </div>
                      </div>
                      <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center gap-5 group hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all">
                         <div className="p-4 bg-white rounded-2xl text-indigo-600 shadow-sm transition-transform group-hover:scale-110"><GraduationCap size={24}/></div>
                         <div>
                           <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-0.5">Nivel Académico</p>
                           <p className="text-lg font-black text-slate-800">{selectedStudent.niv || selectedStudent.nivel || '?'}</p>
                         </div>
                      </div>
                      <div className="md:col-span-2 lg:col-span-4 p-6 bg-indigo-50 rounded-3xl border border-indigo-100 flex items-center gap-5">
                         <div className="p-4 bg-white rounded-2xl text-indigo-600 shadow-sm"><Mail size={24}/></div>
                         <div className="flex-1">
                           <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest mb-0.5">Correo Electrónico Institucional</p>
                           <p className="text-lg font-black text-slate-800">{selectedStudent.correo || `${selectedStudent.registro}@est.edu.bo`}</p>
                         </div>
                      </div>
                    </div>

                    <div className="pt-10 border-t border-slate-100">
                      <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-6 flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-indigo-400" /> 
                        Validación de Elegibilidad para Visitas
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                         {availableVisits.map(v => {
                            const isEligible = (selectedStudent.niv || 0) >= v.min_nivel;
                            return (
                              <div key={v.id} className={`p-6 rounded-[2rem] border-2 transition-all ${isEligible ? 'bg-emerald-50/50 border-emerald-100' : 'bg-rose-50/50 border-rose-100'}`}>
                                 <div className="flex justify-between items-start mb-4">
                                   <p className="text-[10px] font-black uppercase text-slate-400 tracking-tighter leading-tight max-w-[70%]">{v.nombre}</p>
                                   <div className={`p-1.5 rounded-lg ${isEligible ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                     {isEligible ? <Check size={14}/> : <XCircle size={14}/>}
                                   </div>
                                 </div>
                                 <div className="flex items-end justify-between">
                                   <div>
                                     <p className={`text-xl font-black ${isEligible ? 'text-emerald-700' : 'text-rose-700'} tracking-tighter`}>
                                       {isEligible ? 'HABILITADO' : ' RESTRINGIDO'}
                                     </p>
                                     <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">Mínimo Nivel: {v.min_nivel}</p>
                                   </div>
                                 </div>
                              </div>
                            );
                         })}
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-[2.5rem]"><Search className="mx-auto text-slate-200 mb-4" size={48}/><p className="text-slate-300 font-bold italic">Seleccione un estudiante para validar su perfil en tiempo real.</p></div>
                )}
              </motion.div>
            )}

            {adminTab === 'sync' && (
              <motion.div key="sy" initial={{opacity:0, x:-20}} animate={{opacity:1, x:0}} className="space-y-8">
                <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100 overflow-hidden">
                   <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-8 border-b border-slate-50">
                    <div className="flex flex-wrap gap-10">
                      <div className="flex flex-col"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Carga A</span><span className="text-xl font-black text-slate-700">{baseStudents.length}</span></div>
                      <div className="flex flex-col"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Carga B</span><span className="text-xl font-black text-slate-700">{compStudents.length}</span></div>
                      <div className="flex flex-col"><span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Unificados</span><span className="text-2xl font-black text-indigo-600">{finalStudents.length}</span></div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <button onClick={executeMerge} className="h-12 px-6 bg-indigo-600 text-white rounded-xl font-black text-sm hover:scale-105 transition-all shadow-lg flex items-center gap-2 disabled:opacity-50">
                        <Layers size={18}/> COMBINAR
                      </button>
                      <button disabled={isSyncing || finalStudents.length === 0} onClick={handleSync} className="h-12 px-8 bg-emerald-600 text-white rounded-xl font-black text-sm hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-lg disabled:opacity-50">
                        {isSyncing ? <Loader2 className="animate-spin" size={18}/> : <Database size={18}/>}
                        SYNC ({finalStudents.length})
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                       <h4 className="font-black text-xs uppercase text-slate-400 mb-4 flex items-center gap-2"><Upload size={14}/> Archivo Base (.TXT)</h4>
                       <input type="file" accept=".txt" className="hidden" ref={fileInputBaseRef} onChange={handleFileUpload('base')}/>
                       <button onClick={() => fileInputBaseRef.current?.click()} className="w-full py-3 bg-white border-2 border-indigo-100 text-indigo-600 rounded-xl font-bold hover:bg-indigo-50 transition-all">Seleccionar Archivo A</button>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                       <h4 className="font-black text-xs uppercase text-slate-400 mb-4 flex items-center gap-2"><FileText size={14}/> Archivo Complemento (.TXT)</h4>
                       <input type="file" accept=".txt" className="hidden" ref={fileInputCompRef} onChange={handleFileUpload('comp')}/>
                       <button onClick={() => fileInputCompRef.current?.click()} className="w-full py-3 bg-white border-2 border-indigo-100 text-indigo-600 rounded-xl font-bold hover:bg-indigo-50 transition-all">Seleccionar Archivo B</button>
                    </div>
                  </div>

                  {syncStatus === 'success' && (
                    <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-100 mb-8 font-bold flex items-center gap-3">
                      <Check size={20}/> Carga Exitosa de {lastSyncCount} registros
                    </div>
                  )}

                  {finalStudents.length > 0 && <StudentTable data={finalStudents} sticky />}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <AnimatePresence>
          {viewRegDetails && (
            <motion.div 
              initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            >
              <motion.div 
                initial={{scale:0.9, y:20}} animate={{scale:1, y:0}} exit={{scale:0.9, y:20}}
                className="bg-white rounded-[2.5rem] p-10 max-w-2xl w-full shadow-2xl relative"
              >
                <button 
                  onClick={() => setViewRegDetails(null)}
                  className="absolute top-8 right-8 text-slate-300 hover:text-rose-500 transition-colors"
                >
                  <XCircle size={32} />
                </button>

                <div className="flex items-center gap-5 mb-8">
                  <div className="p-4 bg-indigo-50 text-indigo-600 rounded-3xl"><FileText size={40}/></div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-800">{viewRegDetails.nombre_estudiante}</h2>
                    <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">{viewRegDetails.nombre_visita}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <div className="space-y-6">
                    <div>
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Seguro Uni Vida</span>
                      <div className="flex items-center gap-3">
                        {viewRegDetails.tiene_seguro ? (
                          <div className="flex items-center gap-2 text-emerald-600 font-bold">
                            <CheckCircle2 size={24}/> <span className="bg-emerald-50 px-3 py-1 rounded-lg">PRESENTADO</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-rose-600 font-bold">
                            <XCircle size={24}/> <span className="bg-rose-50 px-3 py-1 rounded-lg">PENDIENTE</span>
                          </div>
                        )}
                      </div>
                      {viewRegDetails.comprobante_seguro_url && (
                        <div className="mt-3">
                          <a 
                            href={viewRegDetails.comprobante_seguro_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-xs font-black text-indigo-600 hover:underline"
                          >
                            <Download size={14}/> VER COMPROBANTE
                          </a>
                        </div>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Equipo de Protección (EPP)</span>
                      <div className={`inline-flex items-center gap-2 font-bold ${viewRegDetails.tiene_epp ? 'text-[#001f3f]' : 'text-slate-400'}`}>
                        {viewRegDetails.tiene_epp ? <CheckCircle2 size={20}/> : <AlertCircle size={20}/>}
                        {viewRegDetails.tiene_epp ? 'Cuenta con EPP completo' : 'No reporta EPP'}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Contacto de Referencia</span>
                      <div className="p-4 bg-slate-50 rounded-2xl font-black text-slate-700 flex items-center gap-3">
                        <Users size={20} className="text-slate-400"/>
                        {viewRegDetails.contacto_referencia || 'No proporcionado'}
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Estado de Salud / Obs</span>
                      <div className="p-4 bg-slate-50 rounded-2xl text-sm font-medium text-slate-600 min-h-[80px]">
                        {viewRegDetails.problema_salud || 'Sin observaciones reportadas.'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button 
                    onClick={() => setViewRegDetails(null)}
                    className="h-14 px-10 bg-slate-900 text-white rounded-2xl font-black text-sm hover:scale-105 transition-all shadow-xl"
                  >Cerrar Detalles</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
