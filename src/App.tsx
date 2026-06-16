import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Search, MapPin, Building2, CheckCircle2, XCircle, 
  GraduationCap, User, Upload, Database, Loader2, 
  Check, AlertCircle, RefreshCw, FileText, Layers,
  LayoutGrid, LogOut, ClipboardList, ShieldCheck, Mail, Calendar, Users, Filter, Download, Trash2, Lock, ArrowLeft, Plus, IdCard, Phone, Eye, AlertTriangle, QrCode, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DatabaseStudent, VISITS_REQUIREMENTS, TechnicalVisit, Registration } from './types';
import { parseStudentReport, parseComplementReport } from './lib/parser';
import { supabase } from './lib/supabase';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import AsistenciaVisitas from './components/AsistenciaVisitas';

// --- Helpers ---

const getDayAndDateStr = (fechaStr: string) => {
  if (!fechaStr) return '';
  const parts = fechaStr.split('-');
  if (parts.length !== 3) return fechaStr;
  const year = parseInt(parts[0]);
  const month = parseInt(parts[1]) - 1;
  const day = parseInt(parts[2]);
  const date = new Date(year, month, day);
  const formatter = new Intl.DateTimeFormat('es-ES', { weekday: 'long' });
  const dayName = formatter.format(date);
  const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
  return `${capitalizedDay}, ${parts[2]}/${parts[1]}/${parts[0]}`;
};

// --- Components ---

function CEICBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {/* Blueprint Grid - Architectural Drafting Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />

      {/* Wave Accent 1 - Deep Emerald/Teal Blur */}
      <div className="absolute -bottom-48 -left-48 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-emerald-600/15 via-[#012621]/15 to-transparent blur-3xl" />
      
      {/* Wave Accent 2 - Ribbon flow mimicking the bottom wavy bands in gold/amber */}
      <div className="absolute -bottom-16 -right-12 w-[900px] h-[350px] rounded-full bg-gradient-to-l from-amber-500/10 via-[#c49a3c]/5 to-transparent/0 rotate-[-10deg] blur-2xl border-t border-amber-500/10" />
      
      {/* Top Banner Ribbon styling accent */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-gradient-to-bl from-emerald-700/10 to-transparent blur-3xl pointer-events-none" />
      
      {/* Decorative Golden Orbit Curves from the 58th anniversary CEIC graphical brand */}
      <div className="absolute top-24 -right-24 w-80 h-80 rounded-full border-2 border-dashed border-amber-500/5 animate-[spin_120s_linear_infinite]" />
      <div className="absolute top-28 -right-20 w-[290px] h-[290px] rounded-full border border-emerald-400/10 rotate-45" />

      {/* SVG Structural Bridge Relief (Right corner) */}
      <svg className="absolute bottom-0 right-10 w-[600px] h-[300px] text-emerald-400/5 pointer-events-none" viewBox="0 0 600 300" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M 50 250 L 550 250 M 50 150 L 550 150" />
        <path d="M 50 250 L 50 150 L 150 250 L 150 150 L 250 250 L 250 150 L 350 250 L 350 150 L 450 250 L 450 150 L 550 250 L 550 150" />
        <path d="M 50 150 L 150 250 M 150 150 L 250 250 M 250 150 L 350 250 M 350 150 L 450 250 M 450 150 L 550 250" />
        <path d="M 150 150 L 50 250 M 250 150 L 150 250 M 350 150 L 250 250 M 450 150 L 350 250 M 550 150 L 450 250" />
        <path d="M 50 250 L 50 280 M 150 250 L 150 280 M 250 250 L 250 280 M 350 250 L 350 280 M 450 250 L 450 280 M 550 250 L 550 280" />
      </svg>

      {/* SVG Skyscrapers and Architect blueprint mockup (Left corner) */}
      <svg className="absolute bottom-10 left-10 w-[400px] h-[400px] text-emerald-400/4 pointer-events-none" viewBox="0 0 400 400" fill="none" stroke="currentColor" strokeWidth="1.2">
        <line x1="50" y1="50" x2="350" y2="50" strokeDasharray="3 3"/>
        <line x1="50" y1="150" x2="350" y2="150" strokeDasharray="3 3"/>
        <line x1="50" y1="250" x2="350" y2="250" strokeDasharray="3 3"/>
        <line x1="50" y1="50" x2="50" y2="350" strokeDasharray="3 3"/>
        <line x1="150" y1="50" x2="150" y2="350" strokeDasharray="3 3"/>
        <line x1="250" y1="50" x2="250" y2="350" strokeDasharray="3 3"/>
        <rect x="80" y="100" width="80" height="250" />
        <rect x="200" y="150" width="100" height="200" />
        <circle cx="250" cy="150" r="30" strokeDasharray="5 5" />
        <line x1="120" y1="100" x2="120" y2="350" />
        <line x1="250" y1="180" x2="250" y2="350" />
        <path d="M 80 120 L 160 120 M 80 140 L 160 140 M 80 160 L 160 160 M 80 180 L 160 180" />
        <path d="M 200 170 L 300 170 M 200 190 L 300 190 M 200 210 L 300 210" />
      </svg>

      {/* Subtle organic green stripes in bottom corners */}
      <div className="absolute bottom-4 left-1/4 w-[400px] h-[100px] bg-emerald-500/5 rounded-full blur-[90px] rotate-12" />
    </div>
  );
}

function StudentTable({ data, sticky = false }: { data: DatabaseStudent[], sticky?: boolean }) {
  return (
    <div className={`overflow-auto border border-emerald-500/10 rounded-2xl ${sticky ? 'max-h-[600px]' : 'max-h-[400px]'} bg-slate-950/40 backdrop-blur-md`}>
      <table className="w-full text-left text-xs border-collapse">
        <thead className={sticky ? 'sticky top-0 z-10' : ''}>
          <tr className="bg-[#021c17] backdrop-blur border-b border-emerald-500/15">
            <th className="p-4 font-black uppercase tracking-widest text-emerald-300">Reg</th>
            <th className="p-4 font-black uppercase tracking-widest text-emerald-100">Nombre</th>
            <th className="p-4 font-black uppercase tracking-widest text-emerald-300 text-center">Niv</th>
            <th className="p-4 font-black uppercase tracking-widest text-emerald-300">CI</th>
            <th className="p-4 font-black uppercase tracking-widest text-emerald-300">Celular</th>
            <th className="p-4 font-black uppercase tracking-widest text-emerald-300">Correo</th>
            <th className="p-4 font-black uppercase tracking-widest text-emerald-300">Lugar</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-emerald-900/20 bg-emerald-950/10">
          {data.slice(0, 100).map(s => (
            <tr key={s.registro} className="hover:bg-emerald-900/20 transition-colors">
              <td className="p-4 font-mono font-bold text-amber-400">{s.registro}</td>
              <td className="p-4 font-bold text-white">{s.nombre}</td>
              <td className="p-4 text-center">
                <span className="px-2 py-1 bg-emerald-950 text-emerald-300 border border-emerald-500/20 rounded-md font-bold text-[10px]">
                  {s.niv || s.nivel || s.semestre_activo?.split('-')[0] || '---'}
                </span>
              </td>
              <td className="p-4 text-emerald-100/75 font-mono">{s.ci || '---'}</td>
              <td className="p-4 text-emerald-50 font-bold">{s.celular || '---'}</td>
              <td className="p-4 text-emerald-300 font-medium">{s.correo || '---'}</td>
              <td className="p-4 text-emerald-200/50 italic truncate max-w-[200px]">{s.lugar || '---'}</td>
            </tr>
          ))}
          {data.length > 100 && (
            <tr>
              <td colSpan={7} className="p-4 text-center text-emerald-400/60 bg-[#001410]/50">
                Mostrando solo los primeros 100 para rendimiento...
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// --- Main App ---

export default function App() {
  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const [userRole, setUserRole] = useState<'guest' | 'student' | 'admin' | 'operator'>(() => {
    return (localStorage.getItem('ceic_userRole') as any) || 'guest';
  });
  const [loginMode, setLoginMode] = useState<'select' | 'student' | 'admin'>(() => {
    return (localStorage.getItem('ceic_loginMode') as any) || 'select';
  });
  const [currentStudent, setCurrentStudent] = useState<DatabaseStudent | null>(() => {
    try {
      const stored = localStorage.getItem('ceic_currentStudent');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  
  // Operator Access States
  const [showOperatorModal, setShowOperatorModal] = useState(false);
  const [operatorPassword, setOperatorPassword] = useState('');
  const [operatorError, setOperatorError] = useState('');
  
  // Login State
  const [loginId, setLoginId] = useState(''); // Registro for student
  const [loginPass, setLoginPass] = useState(''); // CI for student, Password for admin
  const [adminUser, setAdminUser] = useState(''); // Manual admin user
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Admin View State
  const [adminTab, setAdminTab] = useState<'stats' | 'sync' | 'registrations' | 'validator' | 'visitas' | 'qr_asistencia'>(() => {
    return (localStorage.getItem('ceic_adminTab') as any) || 'registrations';
  });

  // Keep localStorage perfectly in sync
  useEffect(() => {
    localStorage.setItem('ceic_userRole', userRole);
  }, [userRole]);

  useEffect(() => {
    localStorage.setItem('ceic_loginMode', loginMode);
  }, [loginMode]);

  useEffect(() => {
    if (currentStudent) {
      localStorage.setItem('ceic_currentStudent', JSON.stringify(currentStudent));
    } else {
      localStorage.removeItem('ceic_currentStudent');
    }
  }, [currentStudent]);

  useEffect(() => {
    localStorage.setItem('ceic_adminTab', adminTab);
  }, [adminTab]);

  // Route Protection (Session Check)
  useEffect(() => {
    if (userRole && !['guest', 'student', 'admin', 'operator'].includes(userRole)) {
      handleLogout();
    }
  }, [userRole]);

  // Handle Supabase error and log out immediately in case of invalid session / perm problems
  const handleSupabaseError = (err: any): boolean => {
    if (!err) return false;
    const msg = err.message ? err.message.toLowerCase() : '';
    const code = err.code ? String(err.code) : '';
    const status = err.status ? Number(err.status) : 0;
    
    const isAuthError = 
      status === 401 || 
      status === 403 || 
      code === '42501' || 
      code === 'PGRST301' || 
      msg.includes('permission') || 
      msg.includes('denied') || 
      msg.includes('policy') || 
      msg.includes('authorized') ||
      msg.includes('jwt') ||
      msg.includes('unauthorized');

    if (isAuthError) {
      alert('Error de autenticación o permisos insuficientes. Acceso denegado, redirigiendo al inicio...');
      handleLogout();
      window.location.reload();
      return true;
    }
    return false;
  };
  
  // Visit Management State
  const [editingVisit, setEditingVisit] = useState<TechnicalVisit | null>(null);
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [selectedVisitForStatus, setSelectedVisitForStatus] = useState<TechnicalVisit | null>(null);
  const [enrolledStudents, setEnrolledStudents] = useState<any[]>([]);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [visitForm, setVisitForm] = useState({
    nombre: '',
    descripcion: '',
    fecha: '',
    horario: '',
    horario_inicio: '',
    horario_fin: '',
    cupos_max: 30,
    min_nivel: 1,
    requiereSeguro: true
  });
  const [isSavingVisit, setIsSavingVisit] = useState(false);
  
  // Student View State
  const [availableVisits, setAvailableVisits] = useState<TechnicalVisit[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<string[]>([]); // Array of visit IDs
  const [canceledRegistrations, setCanceledRegistrations] = useState<string[]>([]); // Canceled visit IDs
  const [isBooking, setIsBooking] = useState<string | null>(null);

  // Cancellation State
  const [showCancelModal, setShowCancelModal] = useState<string | null>(null); // visitId to cancel
  const [cancelReason, setCancelReason] = useState('');
  const [isCanceling, setIsCanceling] = useState(false);

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
  
  const activeRegVisit = showRegModal ? availableVisits.find(v => v.id === showRegModal) : null;
  const activeRegVisitRequiresInsurance = activeRegVisit ? activeRegVisit.requiereSeguro !== false : true;

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
    fetchAllRegistrations();
    if (userRole === 'student' && currentStudent) {
      fetchStudentRegistrations(currentStudent.registro);
    }
  }, [userRole, currentStudent]);

  const fetchVisits = async () => {
    try {
      const { data, error } = await supabase.from('visitas').select('*');
      if (error) throw error;
      if (data) {
        const parsed = data.map((v: any) => {
          const descParts = (v.descripcion || '').split(' ||| ');
          const actualDesc = descParts[0];
          const requiereSeguro = descParts[1] ? descParts[1] === 'requiereSeguro:true' : true;
          return {
            ...v,
            descripcion: actualDesc,
            requiereSeguro: requiereSeguro
          };
        });
        setAvailableVisits(parsed);
      }
    } catch (err) {
      console.error("Error fetching visits:", err);
      // No fallback with numeric IDs to avoid UUID cast errors
    }
  };

  const fetchStudentRegistrations = async (studentReg: string) => {
    try {
      const { data: regs, error } = await supabase
        .from('inscripciones')
        .select('visita_id, estado')
        .eq('estudiante_registro', studentReg);
      if (error) throw error;
      if (regs) {
        setMyRegistrations(regs.filter((r: any) => r.estado !== 'ANULADO').map((r: any) => r.visita_id));
        setCanceledRegistrations(regs.filter((r: any) => r.estado === 'ANULADO').map((r: any) => r.visita_id));
      }
    } catch (err) {
      console.error("Error fetching student registrations:", err);
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
        setAllRegistrations(fallbackData.map((r: any) => ({
          ...r,
          estado: r.estado || 'INSCRITO',
          motivo_anulacion: r.motivo_anulacion || ''
        })));
      }
      return;
    }

    if (data) {
      setAllRegistrations(data.map((r: any) => ({
        ...r,
        // Prioritize manual columns added by the user, fallback to join if needed
        nombre_estudiante: r.nombre_estudiante || r.estudiantes?.nombre || 'Estudiante N/D',
        nombre_visita: r.nombre_visita || 'Visita N/D',
        estado: r.estado || 'INSCRITO',
        motivo_anulacion: r.motivo_anulacion || ''
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
      const input = loginId.trim();
      if (!input) {
        setLoginError('Por favor ingrese su identificación.');
        setIsLoggingIn(false);
        return;
      }

      // Paso 1 (Buscar Usuario): Buscar coincidencia en número de registro o número de ticket en la tabla inscripciones_congreso
      const cleanInput = input.trim();
      const enteredPassword = loginPass.trim();

      const { data, error } = await supabase
        .from('inscripciones_congreso')
        .select('*')
        .or(`registro_universitario.eq.${cleanInput},id_ticket.eq.${cleanInput},registro_universitario.ilike.%${cleanInput}%,id_ticket.ilike.%${cleanInput}%`);

      if (error) {
        console.error("Supabase query error:", error);
        throw error;
      }

      if (!data || data.length === 0) {
        setLoginError('No se encuentra inscrito en el congreso. Por favor, asegúrese de completar su inscripción general primero.');
        setIsLoggingIn(false);
        return;
      }

      // Find the best match in-memory to safely bypass trailing/leading spaces or cases in identification and password
      const match = data.find(row => {
        const isIdMatched = (row.registro_universitario || '').trim().toLowerCase() === cleanInput.toLowerCase() || 
                            (row.id_ticket || '').trim().toLowerCase() === cleanInput.toLowerCase();
        const isPassMatched = (row.cedula_identidad || '').trim() === enteredPassword;
        return isIdMatched && isPassMatched;
      });

      if (!match) {
        setLoginError('No se encuentra inscrito en el congreso. Por favor, asegúrese de completar su inscripción general primero.');
        setIsLoggingIn(false);
        return;
      }

      const trimmed_registro = (match.registro_universitario || '').trim();
      const trimmed_ticket = (match.id_ticket || '').trim();
      const final_registro = trimmed_registro || trimmed_ticket || cleanInput;

      let finalNivel: number = 10;
      let finalSemestreActivo: string = '10';
      let isExternal = true;

      // Detect if user has a UAGRM/internal registration type
      if (match.tipo_inscripcion && match.tipo_inscripcion.toLowerCase().includes('uagrm')) {
        isExternal = false;
      }

      // PASO 3: PARSEO Y TRADUCCIÓN DE TEXTO A NÚMERO
      function parsearSemestreDelCongreso(semestreTexto: string): number {
        if (!semestreTexto) return 10; // Valor seguro por defecto si está vacío
        const texto = semestreTexto.toLowerCase().trim();
        
        // Si es egresado o graduado, le damos nivel máximo para que acceda a todas las visitas
        if (texto.includes('egresado') || texto.includes('graduado') || texto.includes('externo')) {
          return 10; 
        }
        
        // Extraer los dígitos numéricos (ej. "8vo Semestre" -> 8, "10mo Semestre" -> 10)
        const coincidencia = texto.match(/\d+/);
        return coincidencia ? parseInt(coincidencia[0], 10) : 10;
      }

      const parsedCongresSem = parsearSemestreDelCongreso(match.semestre);

      if (final_registro) {
        // PASO 1: VERIFICACIÓN EN LA TABLA MAESTRA
        const { data: localStudentData, error: localErr } = await supabase
          .from('estudiantes')
          .select('id, niv, semestre_activo')
          .eq('registro', final_registro)
          .maybeSingle();

        // PASO 2: CONDICIONAL DE SEMESTRE (EL NÚCLEO DEL BUG)
        if (!localErr && localStudentData) {
          // El estudiante ya existe en la tabla estudiantes.
          isExternal = false;
          
          let parsedLvl = 1;
          if (localStudentData.niv !== undefined && localStudentData.niv !== null) {
            parsedLvl = Number(localStudentData.niv);
          } else if (localStudentData.semestre_activo) {
            const cleanSem = String(localStudentData.semestre_activo).trim();
            if (cleanSem.includes('-')) {
              parsedLvl = parseInt(cleanSem.split('-')[0], 10) || 1;
            } else {
              parsedLvl = parseInt(cleanSem, 10) || 1;
            }
          }

          // Reparación activa si tiene un semestre incorrecto (por ejemplo, autoguardado antes como "Egresado/Externo" o nivel 1)
          // O si el semestre del congreso ("10mo Semestre", etc.) indica un nivel más alto.
          const isAutoregisteredWithLowLevel = (localStudentData.semestre_activo === 'Egresado/Externo' && parsedLvl === 1);
          const needsFix = isAutoregisteredWithLowLevel || parsedCongresSem > parsedLvl;

          if (needsFix) {
            finalNivel = parsedCongresSem;
            finalSemestreActivo = String(parsedCongresSem);
            
            // Corrige de forma transparente la base de datos
            await supabase
              .from('estudiantes')
              .update({
                semestre_activo: finalSemestreActivo,
                niv: finalNivel
              })
              .eq('id', localStudentData.id);
            console.log("Auto-registration fix: updated existing record with correct level:", finalNivel);
          } else {
            // Respeta el nivel de la tabla estudiantes si ya es correcto o es mayor
            finalNivel = parsedLvl;
            finalSemestreActivo = localStudentData.semestre_activo || String(parsedLvl);
          }
        } else {
          // El estudiante NO existe (Egresado/Externo nuevo)
          finalNivel = parsedCongresSem;
          finalSemestreActivo = String(parsedCongresSem);

          // AUTO-REGISTRO (UPSERT) DE EGRESADOS/EXTERNOS
          const isUagrm = match.tipo_inscripcion && match.tipo_inscripcion.toLowerCase().includes('uagrm');
          
          const studentRecord = {
            registro: final_registro,
            nombre: (match.nombre_completo || match.nombre || 'Asistente').trim().toUpperCase(),
            carrera: match.carrera || 'Ingeniería Civil',
            semestre_activo: finalSemestreActivo,
            niv: finalNivel,
            ci: (match.cedula_identidad || '').trim(),
            obs: trimmed_ticket || '',
            correo: match.correo_electronico || '',
            celular: match.celular_whatsapp || '',
            lugar: match.lugar || ''
          };

          const { error: insertErr } = await supabase
            .from('estudiantes')
            .upsert(studentRecord, { onConflict: 'registro' });
          
          if (insertErr) {
            console.error("Auto-registration in estudiantes table failed:", insertErr);
          } else {
            console.log("Auto-registration in estudiantes table succeeded for:", final_registro, "assigned level:", finalNivel);
            if (isUagrm) {
              isExternal = false;
            }
          }
        }
      }

      // Map to standard DatabaseStudent model
      const studentData: DatabaseStudent = {
        registro: final_registro,
        nombre: match.nombre || match.nombre_completo || 'Asistente',
        carrera: match.carrera || 'Ingeniería Civil',
        semestre_activo: finalSemestreActivo,
        ci: (match.cedula_identidad || '').trim(),
        obs: trimmed_ticket || '',
        lugar: match.lugar || '',
        nivel: finalNivel,
        niv: finalNivel,
        isExternal: isExternal
      };

      setCurrentStudent(studentData);
      setUserRole('student');

      // Fetch student registrations using identity reference
      const { data: regs } = await supabase
        .from('inscripciones')
        .select('visita_id, estado')
        .eq('estudiante_registro', studentData.registro);
      if (regs) {
        setMyRegistrations(regs.filter((r: any) => r.estado !== 'ANULADO').map((r: any) => r.visita_id));
        setCanceledRegistrations(regs.filter((r: any) => r.estado === 'ANULADO').map((r: any) => r.visita_id));
      }

    } catch (err) {
      console.error(err);
      setLoginError('Error de conexión.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRegisterForVisit = (visitId: string) => {
    if (!currentStudent) return;
    const selectedVisitObj = availableVisits.find(v => v.id === visitId);
    const requiresInsurance = selectedVisitObj ? selectedVisitObj.requiereSeguro !== false : true;
    setShowRegModal(visitId);
    setRegForm({
      tiene_seguro: requiresInsurance,
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
    if (activeRegVisitRequiresInsurance) {
      if (!regForm.tiene_seguro) {
        setRegError('El seguro Uni Vida es obligatorio para esta visita.');
        return;
      }
      if (!comprobanteFile) {
        setRegError('Debe adjuntar el comprobante del seguro.');
        return;
      }
    } else {
      if (regForm.tiene_seguro && !comprobanteFile) {
        setRegError('Debe adjuntar el comprobante del seguro o marcar que no tiene seguro.');
        return;
      }
    }
    if (!regForm.contacto_referencia.trim()) {
      setRegError('El contacto de referencia es obligatorio.');
      return;
    }

    setIsBooking(showRegModal);
       try {
      // Create a clean payload object to avoid stale state issues and apply strict .trim()
      const registroId = String(currentStudent.registro || '').trim();
      const visitId = String(showRegModal); // Ensure it's string (UUID)
      const visitName = availableVisits.find(v => v.id === visitId)?.nombre || 'Visita Técnica';

      // --- RULE 1 & 2: Verify the visit identity and fetch live capacity limits and currently enrolled ---
      const { data: liveVisit, error: visitFetchError } = await supabase
        .from('visitas')
        .select('cupos_max, nombre')
        .eq('id', visitId)
        .single();

      if (visitFetchError || !liveVisit) {
        throw new Error('No se pudo encontrar la visita seleccionada.');
      }

      const limit = liveVisit.cupos_max;

      // Fetch live count of non-canceled registrations
      const { data: liveRegs, error: countError } = await supabase
        .from('inscripciones')
        .select('id, estado')
        .eq('visita_id', visitId)
        .neq('estado', 'ANULADO');

      if (countError) {
        throw new Error('No se pudo verificar la disponibilidad de cupos.');
      }

      const currentCount = liveRegs ? liveRegs.length : 0;

      // --- RULE 3: Strict mathematical restriction (Inscritos >= Capacity) ---
      // Rejects the enrollment immediately and does NOT generate any insertion or updating query whatsoever.
      if (currentCount >= limit) {
        const errorMsg = {
          "status": "error",
          "message": "Lo sentimos, los cupos para esta visita técnica se han agotado por completo. No es posible procesar más registros."
        };
        throw new Error(JSON.stringify(errorMsg));
      }

      // --- PROCEED ONLY IF UNDER CAPACITY ---
      // Ensure that this student actually exists in the 'estudiantes' master table
      // to avoid violating the foreign key constraint: 'inscripciones_estudiante_registro_fkey'
      const { data: existingEst, error: checkEstErr } = await supabase
        .from('estudiantes')
        .select('registro')
        .eq('registro', registroId)
        .maybeSingle();

      if (!existingEst) {
        console.log(`Student ${registroId} not found in 'estudiantes' table. Searching in 'inscripciones_congreso' to perform dynamic fallback registration...`);
        // Query to search across congressional records
        const { data: congData, error: congErr } = await supabase
          .from('inscripciones_congreso')
          .select('*')
          .or(`registro_universitario.eq.${registroId},id_ticket.eq.${registroId},cedula_identidad.eq.${registroId}`);

        if (congData && congData.length > 0) {
          const match = congData[0];
          let resolvedLevel = 10;
          if (match.semestre) {
            const semText = match.semestre.toLowerCase().trim();
            if (semText.includes('egresado') || semText.includes('graduado') || semText.includes('externo')) {
              resolvedLevel = 10;
            } else {
              const semMatch = semText.match(/\d+/);
              resolvedLevel = semMatch ? parseInt(semMatch[0], 10) : 10;
            }
          }

          const studentRecord = {
            registro: registroId,
            nombre: (match.nombre_completo || match.nombre || currentStudent.nombre || 'Asistente').trim().toUpperCase(),
            carrera: match.carrera || currentStudent.carrera || 'Ingeniería Civil',
            semestre_activo: match.semestre || String(resolvedLevel),
            niv: resolvedLevel,
            ci: (match.cedula_identidad || currentStudent.ci || '').trim(),
            obs: match.id_ticket || '',
            correo: match.correo_electronico || '',
            celular: match.celular_whatsapp || '',
            lugar: match.lugar || ''
          };

          const { error: insertErr } = await supabase
            .from('estudiantes')
            .upsert(studentRecord, { onConflict: 'registro' });

          if (insertErr) {
            console.error("Fallback auto-registration in estudiantes failed:", insertErr);
          } else {
            console.log("Fallback auto-registration in estudiantes completed for:", registroId);
          }
        } else {
          // If they aren't even in inscripciones_congreso, create a basic record to protect the foreign key constraint
          console.log(`Student ${registroId} not found in 'inscripciones_congreso' either. Pre-creating basic row in 'estudiantes' to avoid foreign key violation.`);
          const basicRecord = {
            registro: registroId,
            nombre: String(currentStudent.nombre || 'Estudiante').trim().toUpperCase(),
            carrera: String(currentStudent.carrera || 'Ingeniería Civil'),
            semestre_activo: String(currentStudent.semestre_activo || '10'),
            niv: currentStudent.nivel || currentStudent.niv || 10,
            ci: String(currentStudent.ci || '').trim()
          };
          const { error: insertErr } = await supabase
            .from('estudiantes')
            .upsert(basicRecord, { onConflict: 'registro' });
          
          if (insertErr) {
            console.error("Basic record pre-creation in 'estudiantes' failed:", insertErr);
          }
        }
      }

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
          if (handleSupabaseError(error)) return;
          throw error;
        }
      } else {
        await fetchStudentRegistrations(registroId);
        await fetchVisits();
        await fetchAllRegistrations();
        setShowRegModal(null);
        alert('¡Inscripción completada con éxito!');
      }
    } catch (err: any) {
      console.error(err);
      let parsedMessage = err.message || 'Error desconocido al registrar asistencia.';
      try {
        const parsed = JSON.parse(err.message);
        if (parsed && parsed.status === 'error' && parsed.message) {
          parsedMessage = parsed.message;
        }
      } catch (e) {
        // Not JSON formatted error
      }

      if (!handleSupabaseError(err)) {
        setRegError(parsedMessage);
      }
    } finally {
      setIsBooking(null);
    }
  };

  const handleCloseCancelModal = () => {
    setShowCancelModal(null);
    setTimeout(() => {
      if (isMounted.current) {
        setCancelReason('');
        setRegError('');
      }
    }, 400);
  };

  const submitCancellation = async () => {
    if (!currentStudent || !showCancelModal) return;
    if (!cancelReason.trim()) {
      setRegError('El motivo de anulación es obligatorio.');
      return;
    }

    setIsCanceling(true);
    setRegError('');

    try {
      const visitId = showCancelModal;
      const registroId = currentStudent.registro;

      // Update enrollment status to 'ANULADO' and store the reason in a text column
      const { error } = await supabase
        .from('inscripciones')
        .update({
          estado: 'ANULADO',
          motivo_anulacion: cancelReason.trim(),
          problema_salud: `ANULADO. Motivo: ${cancelReason.trim()}`
        })
        .eq('estudiante_registro', registroId)
        .eq('visita_id', visitId);

      if (error) {
        if (handleSupabaseError(error)) return;
        throw error;
      }

      if (!isMounted.current) return;

      // Update state immediately
      setMyRegistrations(prev => prev.filter(id => id !== visitId));
      setCanceledRegistrations(prev => [...prev, visitId]);
      
      // Update allRegistrations state immediately so that any administrative views re-render in real-time
      setAllRegistrations(prev => prev.map(r => {
        if (r.estudiante_registro === registroId && r.visita_id === visitId) {
          return { ...r, estado: 'ANULADO', motivo_anulacion: cancelReason.trim() };
        }
        return r;
      }));

      // Also update enrolledStudents if visible
      setEnrolledStudents(prev => prev.map(r => {
        if (r.estudiante_registro === registroId && r.visita_id === visitId) {
          return { ...r, estado: 'ANULADO', motivo_anulacion: cancelReason.trim() };
        }
        return r;
      }));

      // Update counts globally by fetching all registrations
      try {
        await fetchAllRegistrations();
      } catch (e) {
        console.error("Non-critical error updating all registrations:", e);
      }

      if (!isMounted.current) return;

      handleCloseCancelModal();
      alert('¡Inscripción anulada con éxito!');
      window.location.reload();
    } catch (err: any) {
      if (!isMounted.current) return;
      console.error(err);
      if (!handleSupabaseError(err)) {
        setRegError(err.message || 'Error al anular la inscripción.');
      }
    } finally {
      if (isMounted.current) {
        setIsCanceling(false);
      }
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
      min_nivel: 1,
      requiereSeguro: true
    });
    setEditingVisit(null);
    setShowVisitModal(false);
  };

  const handleCloseVisitModal = () => {
    setShowVisitModal(false);
    // Keep form data and editingVisit intact during the 400ms exit transition
    setTimeout(() => {
      if (isMounted.current) {
        setVisitForm({
          nombre: '',
          descripcion: '',
          fecha: '',
          horario: '',
          horario_inicio: '',
          horario_fin: '',
          cupos_max: 30,
          min_nivel: 1,
          requiereSeguro: true
        });
        setEditingVisit(null);
      }
    }, 400);
  };

  const handleSaveVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingVisit(true);
    try {
      // Combined horario for database
      const finalHorario = `${visitForm.horario_inicio} - ${visitForm.horario_fin}`;
      
      // Combined description to include requiereSeguro
      const finalDescripcion = `${visitForm.descripcion} ||| requiereSeguro:${visitForm.requiereSeguro}`;
      const payload = {
        nombre: visitForm.nombre,
        descripcion: finalDescripcion,
        fecha: visitForm.fecha,
        horario: finalHorario,
        cupos_max: visitForm.cupos_max,
        min_nivel: visitForm.min_nivel
      };

      const parseRow = (rowItem: any) => {
        const descParts = (rowItem.descripcion || '').split(' ||| ');
        return {
          ...rowItem,
          descripcion: descParts[0],
          requiereSeguro: descParts[1] ? descParts[1] === 'requiereSeguro:true' : true
        };
      };

      if (editingVisit) {
        const { data, error } = await supabase
          .from('visitas')
          .update(payload)
          .eq('id', editingVisit.id)
          .select();
        
        if (error) {
          if (handleSupabaseError(error)) return;
          throw error;
         }

        if (!isMounted.current) return;

        // Update local state immediately for instant UI response
        if (data && data.length > 0) {
          setAvailableVisits(prev => prev.map(v => v.id === editingVisit.id ? parseRow(data[0]) : v));
        } else {
          setAvailableVisits(prev => prev.map(v => v.id === editingVisit.id ? { ...v, ...payload, requiereSeguro: visitForm.requiereSeguro, descripcion: visitForm.descripcion } as any : v));
        }
      } else {
        const { data, error } = await supabase
          .from('visitas')
          .insert([payload])
          .select();
        
        if (error) {
          if (handleSupabaseError(error)) return;
          throw error;
        }

        if (!isMounted.current) return;

        // Insert in local state immediately
        if (data && data.length > 0) {
          setAvailableVisits(prev => [...prev, parseRow(data[0])]);
        }
      }

      // Re-fetch from DB to ensure perfect consistency
      await fetchVisits();
      if (userRole === 'admin') {
        await fetchAllRegistrations();
      }

      if (!isMounted.current) return;

      handleCloseVisitModal();
      alert('Visita guardada correctamente');
      window.location.reload();
    } catch (err: any) {
      if (!isMounted.current) return;
      console.error(err);
      if (!handleSupabaseError(err)) {
        alert('Error al guardar visita: ' + err.message);
      }
    } finally {
      if (isMounted.current) {
        setIsSavingVisit(false);
      }
    }
  };

  const handleDeleteVisit = async (id: string) => {
    if (!confirm('¿Seguro que desea eliminar esta visita técnica? Esto también podría afectar a inscripciones existentes.')) return;
    try {
      const { error } = await supabase
        .from('visitas')
        .delete()
        .eq('id', id);
      if (error) {
        if (handleSupabaseError(error)) return;
        throw error;
      }
      await fetchVisits();
      alert('Visita eliminada con éxito');
      window.location.reload();
    } catch (err: any) {
      if (!handleSupabaseError(err)) {
        alert('Error al eliminar visita: ' + err.message);
      }
    }
  };

  const exportVisitsToPDF = () => {
    // Create new PDF layout (A4 landscape for wide table)
    const doc = new jsPDF('l', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;

    // Elegant Top Header Accent Banner Bar in green esmeralda oscuro #047857
    doc.setFillColor(4, 120, 87); // #047857
    doc.rect(0, 0, pageWidth, 28, 'F');

    // Title inside the banner in white letters
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text("UNIVERSIDAD AUTÓNOMA GABRIEL RENÉ MORENO - UAGRM", pageWidth / 2, 10, { align: "center" });
    doc.setFontSize(14);
    doc.text("REPORTE DE VISITAS TÉCNICAS PROGRAMADAS - INGENIERÍA CIVIL", pageWidth / 2, 18, { align: "center" });

    // Current date and time
    const today = new Date();
    const dateStr = today.toLocaleDateString('es-ES', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
    const timeStr = today.toLocaleTimeString('es-ES', {
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });

    // Content Metadata Section
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text(`Fecha y Hora de Emisión: ${dateStr} ${timeStr}`, margin, 36);
    doc.text(`Total Visitas: ${availableVisits.length}`, pageWidth - margin - 35, 36);

    // Dynamic row building
    const headers = [['N°', 'Empresa / Visita', 'Ubicación / Planta', 'Fecha / Hora', 'Nivel Mínimo', 'Cupos (Ocupados / Máx)', 'Seguro UniVida']];
    const bodyRows = availableVisits.map((v, index) => {
      const registeredCount = allRegistrations.filter(r => r.visita_id === v.id && r.estado !== 'ANULADO').length;
      
      const dateParts = (v.fecha || '').split('-');
      const formattedDate = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : v.fecha;
      
      const abbreviatedId = v.id ? v.id.split('-')[0] : '';
      const displayVisitName = `${v.nombre}\n(ID: ${abbreviatedId})`;
      
      return [
        index + 1,
        displayVisitName,
        v.descripcion || 'No especificada',
        `${formattedDate}\n${v.horario || 'N/D'}`,
        `Nivel ${v.min_nivel}+`,
        `${registeredCount} / ${v.cupos_max}`,
        v.requiereSeguro !== false ? 'Requerido' : 'Opcional'
      ];
    });

    autoTable(doc, {
      startY: 42,
      head: headers,
      body: bodyRows,
      margin: { left: margin, right: margin },
      styles: {
        fontSize: 9,
        cellPadding: 4.5,
        font: "helvetica",
        lineColor: [226, 232, 240], // #e2e8f0 fine lines
        lineWidth: 0.1,
        valign: 'middle'
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { fontStyle: 'bold' },
        3: { halign: 'center' },
        4: { halign: 'center' },
        5: { halign: 'center', fontStyle: 'bold' },
        6: { halign: 'center' }
      },
      headStyles: {
        fillColor: [4, 120, 87], // #047857 esmeralda oscuro
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252] // Alternating with sutil slate background
      },
      theme: 'striped'
    });

    // Executive Footer block
    const footerY = pageHeight - 12;
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.5);
    doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);

    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text("Coordinación de Ingeniería Civil - Centro de Estudiantes de Ingeniería Civil (CEIC)", margin, footerY + 1);
    doc.text(`Documento de emisión oficial y validación de visitas académicas.`, margin, footerY + 5);

    doc.setFont("helvetica", "normal");
    doc.text(`Pág. 1 de 1`, pageWidth - margin - 15, footerY + 3);

    // Format download filename: reporte_visitas_tecnicas_[fecha].pdf
    const fileSuffix = dateStr.replace(/\//g, '_');
    doc.save(`reporte_visitas_tecnicas_${fileSuffix}.pdf`);
  };

  const exportToPDF = async () => {
    if (!selectedVisitForStatus) return;
    
    // Filter out canceled or annulled registrations strictly so only "INSCRITO" active students are shown
    const activeEnrolledStudents = enrolledStudents.filter((r: any) => (r.estado || 'INSCRITO').trim().toUpperCase() !== 'ANULADO');

    // Fetch corresponding celular_whatsapp and cedula_identidad from 'inscripciones_congreso'
    let phonesMap: Record<string, string> = {};
    let ciMap: Record<string, string> = {};
    
    try {
      const { data: phoneData, error: phoneErr } = await supabase
        .from('inscripciones_congreso')
        .select('registro_universitario, id_ticket, celular_whatsapp, cedula_identidad')
        .limit(2000);
      
      if (!phoneErr && phoneData) {
        phoneData.forEach((row: any) => {
          const phone = (row.celular_whatsapp || '').trim() || '---';
          const rCi = (row.cedula_identidad || '').trim() || '---';
          if (row.registro_universitario) {
            const key = row.registro_universitario.trim().toLowerCase();
            phonesMap[key] = phone;
            ciMap[key] = rCi;
          }
          if (row.id_ticket) {
            const key = row.id_ticket.trim().toLowerCase();
            phonesMap[key] = phone;
            ciMap[key] = rCi;
          }
        });
      }
    } catch (err) {
      console.error("Error fetching phone numbers and CI from inscripciones_congreso:", err);
    }

    // Create new PDF layout (A4 vertical)
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;

    // Elegant Top Header Accent Banner Bar in green esmeralda oscuro #047857
    doc.setFillColor(4, 120, 87); // #047857
    doc.rect(0, 0, pageWidth, 28, 'F');

    // Title inside the banner in white letters
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text("CONGRESO DE ESTUDIANTES DE INGENIERÍA CIVIL - CEIC 2026", pageWidth / 2, 11, { align: "center" });
    doc.setFontSize(13);
    doc.text("REPORTE OFICIAL DE ASISTENCIA A VISITA TÉCNICA", pageWidth / 2, 18, { align: "center" });

    // Highlighted Callout box with General Visit Info
    const boxY = 34;
    const boxHeight = 35;
    doc.setFillColor(248, 250, 252); // slate-50 background / #f8fafc sutil
    doc.setDrawColor(226, 232, 240); // slate-200 boundary
    doc.setLineWidth(0.1);
    doc.roundedRect(margin, boxY, pageWidth - (margin * 2), boxHeight, 3, 3, 'FD');
    
    // Left boundary accent strip in deep green
    doc.setFillColor(4, 120, 87);
    doc.rect(margin, boxY, 3, boxHeight, 'F');

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(`Visita: ${selectedVisitForStatus.nombre}`, margin + 8, boxY + 8);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text(`Ubicación / Planta:`, margin + 8, boxY + 16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(`${selectedVisitForStatus.descripcion || 'No especificada'}`, margin + 42, boxY + 16);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(`Fecha y Hora:`, margin + 8, boxY + 23);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(`${selectedVisitForStatus.fecha} | ${selectedVisitForStatus.horario || 'N/D'}`, margin + 31, boxY + 23);

    const totalInscritos = activeEnrolledStudents.length;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(`Cupos de Asistencia:`, margin + 8, boxY + 30);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(`${totalInscritos} Ocupados / ${selectedVisitForStatus.cupos_max} Totales`, margin + 42, boxY + 30);

    // Build Table Rows With Columns: N°, Registro, Nombre, C.I., Tipo, Celular / WhatsApp, Estado
    const formattedData = activeEnrolledStudents.map((reg: any, index: number) => {
      const student = reg.student || reg.estudiantes;
      const isExt = !student || !student.registro;
      const studentReg = (reg.estudiante_registro || '').trim().toLowerCase();
      
      let phone = phonesMap[studentReg] || '---';
      let ci = student?.ci || ciMap[studentReg] || '---';
      
      // Fallback: If no match, clean up and do fuzzy match on keys
      if (phone === '---' && studentReg) {
        const foundKey = Object.keys(phonesMap).find(k => {
          return k === studentReg || k.includes(studentReg) || studentReg.includes(k);
        });
        if (foundKey) {
          phone = phonesMap[foundKey];
        }
      }

      if (ci === '---' && studentReg) {
        const foundKey = Object.keys(ciMap).find(k => {
          return k === studentReg || k.includes(studentReg) || studentReg.includes(k);
        });
        if (foundKey) {
          ci = ciMap[foundKey];
        }
      }

      return {
        num: index + 1,
        registro: reg.estudiante_registro || '---',
        nombre: reg.student?.nombre || reg.nombre_estudiante || '---',
        ci: ci,
        tipo: isExt ? 'Externo' : 'Interno',
        ref: phone,
        estado: reg.estado || 'INSCRITO',
        isAnulado: false
      };
    });

    const headers = [['N°', 'Registro/Ticket', 'Nombre del Estudiante', 'C.I. / Carnet', 'Tipo', 'Celular / WhatsApp', 'Estado']];
    const bodyRows = formattedData.map(r => [
      r.num,
      r.registro,
      r.nombre,
      r.ci,
      r.tipo,
      r.ref,
      r.estado
    ]);

    autoTable(doc, {
      startY: boxY + boxHeight + 8,
      head: headers,
      body: bodyRows,
      margin: { left: margin, right: margin },
      styles: {
        fontSize: 8.5,
        cellPadding: { top: 1.5, bottom: 1.5, left: 1.8, right: 1.8 }, // Extremely compact padding for clean design
        font: "helvetica",
        lineColor: [226, 232, 240], // #e2e8f0 fine lines
        lineWidth: 0.1
      },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 26 },
        2: { cellWidth: 'auto' },
        3: { cellWidth: 20, halign: 'center' },
        4: { cellWidth: 15, halign: 'center' },
        5: { cellWidth: 32, halign: 'center' },
        6: { cellWidth: 20, halign: 'center' }
      },
      headStyles: {
        fillColor: [4, 120, 87], // #047857 esmeralda oscuro
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [241, 245, 249] // Alternancia con gris muy claro #f1f5f9
      },
      theme: 'striped',
      didParseCell: function (data) {
        const rowIndex = data.row.index;
        const rowData = formattedData[rowIndex];
        if (rowData && rowData.isAnulado) {
          data.cell.styles.textColor = [220, 38, 38]; // clear soft red highlight for annulled rows
          data.cell.styles.fontStyle = 'normal';
        }
      }
    });

    // Executive Footer block
    const footerY = pageHeight - 15;
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.5);
    doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(4, 120, 87);
    doc.text("Dirección de Carrera de Ingeniería Civil - CEIC", pageWidth / 2, footerY, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(`Reporte generado de forma dinámica el ${new Date().toLocaleString()}`, pageWidth / 2, footerY + 5, { align: "center" });

    const safeName = selectedVisitForStatus.nombre.replace(/[^a-z0-9]/gi, '_');
    doc.save(`Reporte_Visita_${safeName}.pdf`);
  };

  const exportToExcel = () => {
    if (!selectedVisitForStatus) return;

    // Build general info block at rows 1-4
    const headerRows = [
      ["CONGRESO DE ESTUDIANTES DE INGENIERÍA CIVIL - REPORTE DE ASISTENCIA"],
      ["Empresa / Visita:", selectedVisitForStatus.nombre],
      ["Fecha / Hora de Visita:", `${selectedVisitForStatus.fecha} | ${selectedVisitForStatus.horario || 'N/D'}`],
      ["Ubicación / Planta:", selectedVisitForStatus.descripcion || 'No especificada'],
      [], // Blank separator row
      ["N°", "Registro / Ticket", "Nombre Completo", "Tipo de Inscripción", "Número de Referencia (REF)", "Estado", "Observación / Motivo"] // Table Header at Row 6
    ];

    const studentRows = enrolledStudents.map((reg: any, index: number) => {
      const student = reg.student || reg.estudiantes;
      const isExt = !student || !student.registro;
      return [
        index + 1,
        reg.estudiante_registro || '---',
        reg.student?.nombre || reg.nombre_estudiante || '---',
        isExt ? 'Externo' : 'Interno',
        reg.contacto_referencia || '---',
        reg.estado || 'INSCRITO',
        reg.motivo_anulacion || '---'
      ];
    });

    const finalAoa = [...headerRows, ...studentRows];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(finalAoa);

    // Apply auto-fit column widths
    const colWidths = [6, 22, 35, 18, 25, 18, 35]; // minimum lengths
    finalAoa.forEach((row) => {
      row.forEach((value, colIndex) => {
        if (colIndex < colWidths.length) {
          const textValue = value !== undefined && value !== null ? String(value) : '';
          if (textValue.length + 3 > colWidths[colIndex]) {
            colWidths[colIndex] = textValue.length + 3;
          }
        }
      });
    });

    ws['!cols'] = colWidths.map(w => ({ wch: w }));

    XLSX.utils.book_append_sheet(wb, ws, "Asistencia_CEIC");

    const safeName = selectedVisitForStatus.nombre.replace(/[^a-z0-9]/gi, '_');
    XLSX.writeFile(wb, `Reporte_Visita_${safeName}.xlsx`);
  };

  const handleLogout = () => {
    localStorage.removeItem('ceic_userRole');
    localStorage.removeItem('ceic_loginMode');
    localStorage.removeItem('ceic_currentStudent');
    localStorage.removeItem('ceic_adminTab');
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
    try {
      const { error } = await supabase.from('inscripciones').delete().eq('id', id);
      if (error) {
        if (handleSupabaseError(error)) return;
        throw error;
      }
      alert('Inscripción eliminada con éxito');
      window.location.reload();
    } catch (err: any) {
      if (!handleSupabaseError(err)) {
        alert('Error al eliminar inscripción: ' + err.message);
      }
    }
  };

  const exportRegistrationsToPDF = async () => {
    // Filter out canceled or annulled registrations strictly so only "INSCRITO" active students are shown
    const activeFilteredRegistrations = filteredRegistrations.filter((r: any) => (r.estado || 'INSCRITO').trim().toUpperCase() !== 'ANULADO');

    // Fetch corresponding celular_whatsapp and cedula_identidad from 'inscripciones_congreso'
    let phonesMap: Record<string, string> = {};
    let ciMap: Record<string, string> = {};
    
    try {
      const { data: phoneData, error: phoneErr } = await supabase
        .from('inscripciones_congreso')
        .select('registro_universitario, id_ticket, celular_whatsapp, cedula_identidad')
        .limit(2000);
      
      if (!phoneErr && phoneData) {
        phoneData.forEach((row: any) => {
          const phone = (row.celular_whatsapp || '').trim() || '---';
          const rCi = (row.cedula_identidad || '').trim() || '---';
          if (row.registro_universitario) {
            const key = row.registro_universitario.trim().toLowerCase();
            phonesMap[key] = phone;
            ciMap[key] = rCi;
          }
          if (row.id_ticket) {
            const key = row.id_ticket.trim().toLowerCase();
            phonesMap[key] = phone;
            ciMap[key] = rCi;
          }
        });
      }
    } catch (err) {
      console.error("Error fetching phone numbers and CI from inscripciones_congreso:", err);
    }

    // Create new PDF layout (A4 vertical)
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;

    const selectedVisitObj = availableVisits.find(v => v.id === filterVisit);
    const visitName = selectedVisitObj ? selectedVisitObj.nombre : "Consolidado - Todas las Visitas";
    const visitDate = selectedVisitObj ? selectedVisitObj.fecha : "Múltiples Fechas";
    const visitLocation = selectedVisitObj ? (selectedVisitObj.descripcion || "No especificada") : "Múltiples Ubicaciones";
    const totalCuposMax = selectedVisitObj ? selectedVisitObj.cupos_max : undefined;

    // Elegant Top Header Accent Banner Bar in green esmeralda oscuro #047857
    doc.setFillColor(4, 120, 87); // #047857
    doc.rect(0, 0, pageWidth, 28, 'F');

    // Title inside the banner in white letters
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text("CONGRESO DE ESTUDIANTES DE INGENIERÍA CIVIL - CEIC 2026", pageWidth / 2, 11, { align: "center" });
    doc.setFontSize(13);
    doc.text("REPORTE OFICIAL DE ASISTENCIA", pageWidth / 2, 18, { align: "center" });

    // Highlighted Callout box with General Visit Info
    const boxY = 34;
    const boxHeight = 35;
    doc.setFillColor(248, 250, 252); // slate-50 background / #f8fafc sutil
    doc.setDrawColor(226, 232, 240); // slate-200 boundary
    doc.setLineWidth(0.1);
    doc.roundedRect(margin, boxY, pageWidth - (margin * 2), boxHeight, 3, 3, 'FD');
    
    // Left boundary accent strip in deep green
    doc.setFillColor(4, 120, 87);
    doc.rect(margin, boxY, 3, boxHeight, 'F');

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(`Visita: ${visitName}`, margin + 8, boxY + 8);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text(`Ubicación / Planta:`, margin + 8, boxY + 16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(`${visitLocation}`, margin + 42, boxY + 16);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(`Fecha y Hora:`, margin + 8, boxY + 23);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(`${selectedVisitObj ? `${selectedVisitObj.fecha} | ${selectedVisitObj.horario || 'N/D'}` : 'Consolidado General'}`, margin + 31, boxY + 23);

    const totalInscritos = activeFilteredRegistrations.length;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(`Cupos de Asistencia:`, margin + 8, boxY + 30);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(`${totalInscritos} Ocupados ${totalCuposMax ? `/ ${totalCuposMax} Totales` : ''}`, margin + 42, boxY + 30);

    // Build Table Rows With Columns: N°, Registro, Nombre, C.I., Tipo, Celular / WhatsApp, Estado
    const formattedData = activeFilteredRegistrations.map((reg: any, index: number) => {
      const student = reg.student || reg.estudiantes;
      const isExt = !student || !student.registro;
      const studentReg = (reg.estudiante_registro || '').trim().toLowerCase();
      
      let phone = phonesMap[studentReg] || '---';
      let ci = student?.ci || ciMap[studentReg] || '---';
      
      // Fallback: If no match, clean up and do fuzzy match on keys
      if (phone === '---' && studentReg) {
        const foundKey = Object.keys(phonesMap).find(k => {
          return k === studentReg || k.includes(studentReg) || studentReg.includes(k);
        });
        if (foundKey) {
          phone = phonesMap[foundKey];
        }
      }

      if (ci === '---' && studentReg) {
        const foundKey = Object.keys(ciMap).find(k => {
          return k === studentReg || k.includes(studentReg) || studentReg.includes(k);
        });
        if (foundKey) {
          ci = ciMap[foundKey];
        }
      }

      return {
        num: index + 1,
        registro: reg.estudiante_registro || '---',
        nombre: reg.nombre_estudiante || student?.nombre || '---',
        ci: ci,
        tipo: isExt ? 'Externo' : 'Interno',
        ref: phone,
        estado: reg.estado || 'INSCRITO',
        isAnulado: false
      };
    });

    const headers = [['N°', 'Registro/Ticket', 'Nombre del Estudiante', 'C.I. / Carnet', 'Tipo', 'Celular / WhatsApp', 'Estado']];
    const bodyRows = formattedData.map(r => [
      r.num,
      r.registro,
      r.nombre,
      r.ci,
      r.tipo,
      r.ref,
      r.estado
    ]);

    autoTable(doc, {
      startY: boxY + boxHeight + 8,
      head: headers,
      body: bodyRows,
      margin: { left: margin, right: margin },
      styles: {
        fontSize: 8.5,
        cellPadding: { top: 1.5, bottom: 1.5, left: 1.8, right: 1.8 }, // Extremely compact padding for clean design
        font: "helvetica",
        lineColor: [226, 232, 240], // Fine division lines
        lineWidth: 0.1
      },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 26 },
        2: { cellWidth: 'auto' },
        3: { cellWidth: 20, halign: 'center' },
        4: { cellWidth: 15, halign: 'center' },
        5: { cellWidth: 32, halign: 'center' },
        6: { cellWidth: 20, halign: 'center' }
      },
      headStyles: {
        fillColor: [4, 120, 87], // #047857 esmeralda oscuro
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [241, 245, 249] // Alternancia con gris muy claro #f1f5f9
      },
      theme: 'striped',
      didParseCell: function (data) {
        const rowIndex = data.row.index;
        const rowData = formattedData[rowIndex];
        if (rowData && rowData.isAnulado) {
          data.cell.styles.textColor = [220, 38, 38]; // Soft/clear red color for annulled rows
          data.cell.styles.fontStyle = 'normal';
        }
      }
    });

    // Executive Footer block
    const footerY = pageHeight - 15;
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.5);
    doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(4, 120, 87);
    doc.text("Dirección de Carrera de Ingeniería Civil - CEIC", pageWidth / 2, footerY, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(`Reporte generado de forma dinámica el ${new Date().toLocaleString()}`, pageWidth / 2, footerY + 5, { align: "center" });

    const safeFilename = visitName.replace(/[^a-z0-9]/gi, '_');
    doc.save(`Reporte_Visita_${safeFilename}.pdf`);
  };

  const exportRegistrationsToExcel = () => {
    const selectedVisitObj = availableVisits.find(v => v.id === filterVisit);
    const visitName = selectedVisitObj ? selectedVisitObj.nombre : "Consolidado - Todas las Visitas";
    const visitDate = selectedVisitObj ? selectedVisitObj.fecha : "Múltiples Fechas";
    const visitLocation = selectedVisitObj ? (selectedVisitObj.descripcion || "No especificada") : "Múltiples Ubicaciones";

    const headerRows = [
      ["CONGRESO DE ESTUDIANTES DE INGENIERÍA CIVIL - CEIC 2026"],
      ["Reporte Oficial de Asistencias - CEIC 2026"],
      ["Empresa / Visita:", visitName],
      ["Fecha / Ubicación:", `${visitDate} | Planta/Lugar: ${visitLocation}`],
      [], // Blank separator row
      ["N°", "Registro / Ticket", "Nombre Completo", "Tipo de Inscripción", "Número de Referencia (REF)", "Estado", "Observación / Motivo"] // Table Header at Row 6
    ];

    const studentRows = filteredRegistrations.map((reg: any, index: number) => {
      const student = reg.student || reg.estudiantes;
      const isExt = !student || !student.registro;
      return [
        index + 1,
        reg.estudiante_registro || '---',
        reg.nombre_estudiante || student?.nombre || '---',
        isExt ? 'Externo' : 'Interno',
        reg.contacto_referencia || '---',
        reg.estado || 'INSCRITO',
        reg.motivo_anulacion || '---'
      ];
    });

    const finalAoa = [...headerRows, ...studentRows];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(finalAoa);

    // Apply auto-fit column widths
    const colWidths = [6, 22, 35, 18, 25, 18, 35]; // minimum lengths
    finalAoa.forEach((row) => {
      row.forEach((value, colIndex) => {
        if (colIndex < colWidths.length) {
          const textValue = value !== undefined && value !== null ? String(value) : '';
          if (textValue.length + 3 > colWidths[colIndex]) {
            colWidths[colIndex] = textValue.length + 3;
          }
        }
      });
    });

    ws['!cols'] = colWidths.map(w => ({ wch: w }));
    XLSX.utils.book_append_sheet(wb, ws, "Asistencia_CEIC");

    const safeFilename = visitName.replace(/[^a-z0-9]/gi, '_');
    XLSX.writeFile(wb, `Reporte_Visita_${safeFilename}.xlsx`);
  };

  // --- Views ---

  if (userRole === 'guest') {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-6 text-[#111827] font-sans overflow-hidden relative">
        <CEICBackground />
        
        <AnimatePresence mode="wait">
          {loginMode === 'select' ? (
            <motion.div 
              key="select"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10"
            >
              <div className="md:col-span-3 flex flex-col items-center mb-6">
                <div className="p-4 bg-emerald-50 rounded-3xl shadow-sm mb-6 border border-emerald-100">
                  <Building2 className="w-12 h-12 text-emerald-700" />
                </div>
                <h1 className="text-4xl font-black text-center tracking-tight mb-2 uppercase text-[#111827]">UAGRM - Carrera de Ingeniería Civil</h1>
                <p className="text-emerald-700 font-extrabold text-center tracking-wide uppercase text-sm">CONGRESO DE ESTUDIANTES - GESTIÓN DE VISITAS TÉCNICAS</p>
              </div>

              <motion.button 
                initial={{ borderColor: 'rgba(226, 232, 240, 1)' }}
                whileHover={{ scale: 1.05, borderColor: 'rgba(16, 185, 129, 0.4)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setLoginMode('student')}
                className="bg-white border p-8 rounded-[2.5rem] flex flex-col items-center gap-6 hover:bg-slate-50 transition-all group shadow-sm justify-between min-h-[300px]"
              >
                <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center shadow-inner group-hover:bg-emerald-100 transition-colors border border-emerald-100">
                  <GraduationCap className="w-10 h-10 text-emerald-700" />
                </div>
                <div className="text-center">
                  <h2 className="text-xl font-black mb-2 text-[#111827] group-hover:text-emerald-700 transition-colors">Estudiantes</h2>
                  <p className="text-[#6B7280] text-xs font-medium px-2">Inscripción y gestión de visitas</p>
                </div>
              </motion.button>

              <motion.button 
                initial={{ borderColor: 'rgba(226, 232, 240, 1)' }}
                whileHover={{ scale: 1.05, borderColor: 'rgba(13, 148, 136, 0.4)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowOperatorModal(true)}
                className="bg-white border p-8 rounded-[2.5rem] flex flex-col items-center gap-6 hover:bg-slate-50 transition-all group shadow-sm justify-between min-h-[300px]"
              >
                <div className="w-20 h-20 rounded-full bg-teal-50 flex items-center justify-center shadow-inner group-hover:bg-teal-100 transition-colors border border-teal-100 items-center justify-center">
                  <QrCode className="w-10 h-10 text-teal-700" />
                </div>
                <div className="text-center">
                  <h2 className="text-xl font-black mb-2 text-[#111827] group-hover:text-teal-700 transition-colors">Asistencia QR</h2>
                  <p className="text-[#6B7280] text-xs font-medium px-2">Ingreso rápido para encargados de visitas técnicas</p>
                </div>
              </motion.button>

              <motion.button 
                initial={{ borderColor: 'rgba(226, 232, 240, 1)' }}
                whileHover={{ scale: 1.05, borderColor: 'rgba(245, 158, 11, 0.4)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setLoginMode('admin')}
                className="bg-white border p-8 rounded-[2.5rem] flex flex-col items-center gap-6 hover:bg-slate-50 transition-all group shadow-sm justify-between min-h-[300px]"
              >
                <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center shadow-inner group-hover:bg-amber-100 transition-colors border border-amber-100">
                  <ShieldCheck className="w-10 h-10 text-amber-600" />
                </div>
                <div className="text-center">
                  <h2 className="text-xl font-black mb-2 text-[#111827] group-hover:text-amber-655 transition-colors">Administración</h2>
                  <p className="text-[#6B7280] text-xs font-medium px-2">Panel de control y reportes</p>
                </div>
              </motion.button>
            </motion.div>
          ) : (
            <motion.div 
              key="form"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="max-w-md w-full bg-white text-[#111827] p-10 rounded-[2.5rem] shadow-xl border border-slate-200 relative z-10"
            >
              <button 
                onClick={() => { setLoginMode('select'); setLoginError(''); }}
                className="absolute top-8 left-8 text-slate-400 hover:text-emerald-700 transition-colors"
                title="Volver"
              >
                <ArrowLeft size={24} />
              </button>

              <div className="flex flex-col items-center mb-8 pt-4">
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 mb-4 text-emerald-600">
                  {loginMode === 'student' ? <GraduationCap size={32}/> : <ShieldCheck size={32}/>}
                </div>
                <h2 className="text-2xl font-black text-[#111827]">Acceso {loginMode === 'student' ? 'Estudiante' : 'Administrador'}</h2>
                <p className="text-[#6B7280] text-sm font-medium">Ingrese sus credenciales para continuar</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-6">
                {loginMode === 'admin' && (
                  <>
                    <div>
                      <label className="text-[10px] font-black uppercase text-emerald-700 tracking-widest pl-2 mb-2 block font-black">Usuario Administrador</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input 
                          type="text" 
                          value={adminUser}
                          onChange={(e) => setAdminUser(e.target.value)}
                          placeholder="Ej: admin"
                          className="w-full h-14 bg-slate-50 border-2 border-slate-200 focus:border-emerald-600 focus:bg-white text-[#111827] placeholder:text-slate-400 rounded-2xl pl-12 outline-none transition-all font-bold shadow-sm"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase text-emerald-700 tracking-widest pl-2 mb-2 block font-black">
                        Contraseña
                      </label>
                      <div className="relative">
                        <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input 
                          type="password" 
                          value={loginPass}
                          onChange={(e) => setLoginPass(e.target.value)}
                          placeholder="Contraseña de acceso"
                          className="w-full h-14 bg-slate-50 border-2 border-slate-200 focus:border-emerald-600 focus:bg-white text-[#111827] placeholder:text-slate-400 rounded-2xl pl-12 outline-none transition-all font-bold shadow-sm"
                          required
                        />
                      </div>
                    </div>
                  </>
                )}
                
                {loginMode === 'student' && (
                  <>
                    <div>
                      <label className="text-[10px] font-black uppercase text-emerald-700 tracking-widest pl-2 mb-2 block font-black">Usuario (Registro o Ticket)</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input 
                          type="text" 
                          value={loginId}
                          onChange={(e) => setLoginId(e.target.value)}
                          placeholder="Ingrese su Registro o Ticket"
                          className="w-full h-14 bg-slate-50 border-2 border-slate-200 focus:border-emerald-600 focus:bg-white text-[#111827] placeholder:text-slate-400 rounded-2xl pl-12 outline-none transition-all font-bold shadow-sm"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase text-emerald-700 tracking-widest pl-2 mb-2 block font-black">Contraseña (Cédula de Identidad)</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input 
                          type="password" 
                          value={loginPass}
                          onChange={(e) => setLoginPass(e.target.value)}
                          placeholder="Ingrese su Cédula de Identidad"
                          className="w-full h-14 bg-slate-50 border-2 border-slate-200 focus:border-emerald-600 focus:bg-white text-[#111827] placeholder:text-slate-400 rounded-2xl pl-12 outline-none transition-all font-bold shadow-sm"
                          required
                        />
                      </div>
                    </div>
                  </>
                )}

                {loginError && <p className="text-rose-700 text-xs font-black text-center bg-rose-50 p-3 rounded-xl border border-rose-200">{loginError}</p>}

                <button disabled={isLoggingIn} type="submit" className="w-full h-16 bg-gradient-to-r from-emerald-600 to-emerald-750 text-white rounded-2xl font-black text-lg hover:from-emerald-500 hover:to-emerald-650 transition-all flex items-center justify-center gap-2 transform active:scale-95 shadow-md disabled:opacity-50">
                  {isLoggingIn ? <Loader2 className="animate-spin" /> : "INGRESAR AL SISTEMA"}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Password Modal for Quick Operator Access */}
        <AnimatePresence>
          {showOperatorModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              {/* Overlay */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  setShowOperatorModal(false);
                  setOperatorPassword('');
                  setOperatorError('');
                }}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              />
              
              {/* Modal Card */}
              <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl border border-slate-150 relative z-10 text-slate-800"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="p-4 bg-teal-50 rounded-2xl border border-teal-100 mb-4 text-teal-600 flex items-center justify-center">
                    <QrCode size={36} />
                  </div>
                  <h3 className="text-2xl font-black text-[#111827]">Acceso Encargados</h3>
                  <p className="text-[#6B7280] text-sm font-medium mt-1">Ingrese la contraseña rápida de asistencia</p>
                </div>

                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (operatorPassword === 'C1V1L2026_*') {
                      setUserRole('operator');
                      setShowOperatorModal(false);
                      setOperatorPassword('');
                      setOperatorError('');
                    } else {
                      setOperatorError('Contraseña incorrecta. Intente nuevamente.');
                    }
                  }}
                  className="mt-6 space-y-4"
                >
                  <div>
                    <label className="text-[10px] font-black uppercase text-teal-700 tracking-widest pl-2 mb-2 block">
                      Contraseña de Acceso Rápido
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                      <input 
                        type="password" 
                        value={operatorPassword}
                        onChange={(e) => setOperatorPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full h-14 bg-slate-50 border-2 border-slate-200 focus:border-teal-600 focus:bg-white text-[#111827] placeholder:text-slate-400 rounded-2xl pl-12 outline-none transition-all font-bold shadow-sm"
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  {operatorError && (
                    <p className="text-rose-700 text-xs font-black text-center bg-rose-50 p-3 rounded-xl border border-rose-200">
                      {operatorError}
                    </p>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button 
                      type="button"
                      onClick={() => {
                        setShowOperatorModal(false);
                        setOperatorPassword('');
                        setOperatorError('');
                      }}
                      className="flex-1 h-14 bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all rounded-2xl font-bold text-sm"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 h-14 bg-teal-600 text-white hover:bg-teal-700 transition-all rounded-2xl font-black text-sm shadow-md"
                    >
                      Ingresar
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (userRole === 'student') {
    const studentLvl = currentStudent?.niv || parseInt(currentStudent?.semestre_activo?.split('-')[0]) || 0;
    
    return (
      <div className="min-h-screen bg-[#F8F9FA] font-sans p-4 md:p-8 text-[#111827] relative overflow-hidden">
        <CEICBackground />
        
        <div className="max-w-5xl mx-auto relative z-10">
          <header className="flex justify-between items-center mb-12">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-700 rounded-xl text-white shadow-lg border border-emerald-400/25"><Building2 size={24}/></div>
              <h1 className="text-xl font-black text-[#111827] uppercase tracking-tighter">Portal Estudiante</h1>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 hover:border-rose-500/30 rounded-xl font-extrabold text-slate-700 hover:text-rose-600 shadow-sm transition-all">
              <LogOut size={18}/> Salir
            </button>
          </header>

          <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-md border border-slate-100 mb-10 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50/40 rounded-full blur-3xl -mr-20 -mt-20 opacity-30 pointer-events-none"></div>
            <div className="flex flex-col md:flex-row gap-8 items-center mb-10 relative z-10">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-800 flex items-center justify-center text-white shadow-lg border border-emerald-400/30"><User size={48} /></div>
              <div className="text-center md:text-left">
                <h2 className="text-3xl font-black text-[#111827] capitalize leading-tight mb-2">{currentStudent?.nombre.toLowerCase()}</h2>
                <div className="flex flex-wrap justify-center md:justify-start gap-4">
                  <span className="px-4 py-1.5 bg-slate-100 text-slate-700 border border-slate-200/65 rounded-xl font-black text-xs uppercase tracking-widest">REG: {currentStudent?.registro}</span>
                  {currentStudent?.isExternal ? (
                    <span className="px-4 py-1.5 bg-amber-50 text-amber-700 border border-amber-200/50 rounded-xl font-black text-xs uppercase tracking-widest">Estudiante Externo</span>
                  ) : (
                    <span className="px-4 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200/50 rounded-xl font-black text-xs uppercase tracking-widest">SEMESTRE: {currentStudent?.niv !== undefined ? currentStudent.niv : studentLvl}</span>
                  )}
                </div>
              </div>
            </div>

            <h3 className="text-xl font-black text-[#111827] mb-8 flex items-center gap-3">
              <Calendar className="text-emerald-650" /> Próximas Visitas Técnicas
            </h3>

            <div className="flex flex-col gap-4">
              {availableVisits.map((visit, index) => {
                const isEligible = currentStudent?.isExternal ? true : (studentLvl >= visit.min_nivel);
                const isRegistered = myRegistrations.includes(visit.id);
                const isCanceled = canceledRegistrations.includes(visit.id);
                
                const totalInscritos = allRegistrations.filter(r => r.visita_id === visit.id && r.estado !== 'ANULADO').length;
                const remainingCupos = Math.max(0, visit.cupos_max - totalInscritos);

                return (
                  <div 
                    key={visit.id || `visit-row-${index}`} 
                    className={`group flex flex-col lg:flex-row lg:items-center justify-between gap-5 p-5 md:p-6 rounded-2xl border transition-all ${
                      isRegistered 
                        ? 'bg-emerald-50/40 border-emerald-500/35 shadow-sm' 
                        : isEligible 
                          ? 'bg-white hover:bg-slate-50 border-slate-200/80 hover:border-slate-350 shadow-sm' 
                          : 'bg-slate-50/70 border-slate-150/40 opacity-60'
                    }`}
                  >
                    {/* Date & Time Block */}
                    <div className="flex flex-col min-w-[200px]">
                      <div className="flex items-center gap-1.5">
                        {isRegistered && <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />}
                        <p className="text-xs font-black text-[#111827] uppercase tracking-widest leading-none">
                          {getDayAndDateStr(visit.fecha)}
                        </p>
                      </div>
                      <p className="text-xs text-[#4B5563] font-bold mt-1.5 flex items-center gap-1.5 pl-0.5">
                        <Clock size={12} className="text-[#6B7280] shrink-0" /> 
                        {visit.horario || 'Sin Horario'}
                      </p>
                    </div>

                    {/* Company / Place Details */}
                    <div className="flex-1 flex flex-col justify-center">
                      <h4 className="font-extrabold text-[#111827] text-base leading-snug group-hover:text-emerald-700 transition-colors">
                        {visit.nombre}
                      </h4>
                      <p className="text-xs text-[#6B7280] font-medium mt-1 line-clamp-2 max-w-2xl leading-relaxed">
                        {visit.descripcion}
                      </p>
                    </div>

                    {/* Meta Indicators: Cupos & Requirements */}
                    <div className="flex items-center gap-5 sm:gap-8 min-w-[250px] py-1 border-y border-slate-100 lg:border-none lg:py-0">
                      {/* Cupos */}
                      <div className="flex flex-col">
                        <span className={`text-xs font-black flex items-center gap-1 ${remainingCupos <= 0 ? 'text-rose-600 animate-pulse' : 'text-emerald-600'}`}>
                          <Users size={12} className={remainingCupos <= 0 ? 'text-rose-600 shrink-0' : 'text-emerald-600 shrink-0'} />
                          {remainingCupos} / {visit.cupos_max} cupos
                        </span>
                        <span className={`text-[10px] font-bold uppercase mt-0.5 tracking-wider leading-none ${remainingCupos <= 0 ? 'text-rose-600 font-extrabold' : 'text-slate-500'}`}>
                          {remainingCupos <= 0 ? 'AGOTADOS' : 'disponibles'}
                        </span>
                      </div>

                      {/* Level */}
                      <div className="flex flex-col">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest text-center border mt-0.5 self-start ${
                          isEligible 
                            ? 'bg-emerald-50 text-emerald-750 border-emerald-500/20' 
                            : 'bg-rose-50 text-rose-600 border-rose-500/20'
                        }`}>
                          MIN LVL {visit.min_nivel}
                        </span>
                        <span className="text-[10px] text-slate-500 font-bold uppercase mt-0.5 tracking-wider leading-none">
                          Restricción
                        </span>
                      </div>
                    </div>

                    {/* Actions / Status */}
                    <div className="flex items-center justify-start lg:justify-end min-w-[180px] pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 lg:border-none">
                      {isRegistered ? (
                        <div className="flex items-center lg:flex-col lg:items-end gap-3 lg:gap-1.5 w-full lg:w-auto justify-between lg:justify-center">
                          <span className="flex items-center gap-1 text-emerald-700 font-black text-xs uppercase tracking-wider bg-emerald-50 border border-emerald-500/20 px-3 py-1 rounded-lg">
                            <Check size={14} /> Inscrito
                          </span>
                          <button
                            onClick={() => {
                              setShowCancelModal(visit.id);
                              setCancelReason('');
                              setRegError('');
                            }}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-extrabold rounded-lg text-[10px] uppercase tracking-wider transition-colors shadow-sm"
                          >
                            Anular Inscripción
                          </button>
                        </div>
                      ) : isCanceled ? (
                        <span className="flex items-center gap-1 px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg font-black text-[10px] uppercase tracking-wider">
                          <XCircle size={12} /> Inscripción Anulada
                        </span>
                      ) : !isEligible ? (
                        <div className="flex items-center gap-1.5 text-rose-700 font-bold text-xs uppercase tracking-wider py-1 pl-1">
                          <Lock size={12} className="text-rose-500 shrink-0" />
                          <span className="text-[10px] leading-tight text-rose-700 bg-rose-50 px-2.5 py-1 rounded border border-rose-200">Semestre insuficiente (Requerido: Nivel {visit.min_nivel})</span>
                        </div>
                      ) : remainingCupos <= 0 ? (
                        <div className="flex flex-col items-stretch lg:items-end gap-1.5 w-full">
                          <span className="text-[10px] font-black uppercase text-rose-600 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl flex items-center justify-center gap-1 text-center">
                            <XCircle size={12} className="text-rose-600 shrink-0" />
                            Cupos Agotados
                          </span>
                          <button 
                            disabled={true}
                            className="w-full lg:w-auto px-4 py-2.5 rounded-xl text-xs font-black bg-slate-100 text-slate-400 border border-slate-200/80 cursor-not-allowed uppercase tracking-wider flex items-center justify-center gap-1.5"
                          >
                            Cupo Lleno
                          </button>
                        </div>
                      ) : (
                        <button 
                          disabled={isBooking === visit.id}
                          onClick={() => handleRegisterForVisit(visit.id)}
                          className="w-full lg:w-auto px-4 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-600 to-emerald-750 text-white shadow-md hover:shadow-lg transition-all uppercase tracking-wider transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-1.5"
                        >
                          {isBooking === visit.id ? (
                            <>
                              <Loader2 size={12} className="animate-spin" />
                              Ingresando...
                            </>
                          ) : (
                            'Iniciar Inscripción'
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="p-8 bg-white rounded-3xl text-slate-800 flex flex-col md:flex-row items-center gap-6 justify-between border border-slate-200 shadow-sm">
            <div className="flex items-center gap-4">
              <Mail className="text-emerald-600" />
              <div>
                <p className="text-xs font-black uppercase text-emerald-700 tracking-widest leading-none mb-1">Dirección de Carrera de Ingeniería Civil</p>
                <p className="font-bold text-sm text-slate-600">72191068 Coordinación de Carrera | 72191592 Secretaría de Ingeniería Civil</p>
              </div>
            </div>
            <div className="px-6 py-2 bg-slate-50 rounded-2xl border border-slate-200 text-xs font-mono text-slate-600">APP_VERSION: 2.1.0-STABLE</div>
          </div>

          <AnimatePresence>
            {showRegModal && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-0 md:p-8 overflow-y-auto"
              >
                <motion.div 
                   initial={{ scale: 0.95, opacity: 0 }}
                   animate={{ scale: 1, opacity: 1 }}
                   exit={{ scale: 0.95, opacity: 0 }}
                   className="bg-white text-[#111827] rounded-none md:rounded-[3rem] w-full max-w-5xl min-h-screen md:min-h-0 shadow-2xl relative overflow-hidden flex flex-col md:flex-row border border-slate-200"
                >
                  {/* Left Sidebar - Steps Indicator */}
                  <div className="w-full md:w-80 bg-slate-50 p-8 md:p-12 border-b md:border-b-0 md:border-r border-slate-200 flex flex-col">
                    <button 
                      onClick={() => setShowRegModal(null)}
                      className="absolute top-8 left-8 p-2 bg-white text-slate-600 hover:text-rose-600 rounded-full shadow-sm border border-slate-200 transition-all z-[110]"
                    >
                      <XCircle size={32} />
                    </button>

                    <div className="mt-12 flex-1">
                      <div className="p-4 bg-emerald-600 w-fit rounded-2xl text-white shadow-md mb-6">
                        <ClipboardList size={32} />
                      </div>
                      <h2 className="text-2xl font-black text-[#111827] leading-tight mb-2">Inscripción Civil</h2>
                      <p className="text-emerald-700 text-xs font-bold uppercase tracking-wider mb-12">{availableVisits.find(v => v.id === showRegModal)?.nombre}</p>

                      <div className="space-y-10">
                        <div className={`flex items-center gap-4 transition-all ${regStep === 1 ? 'scale-105' : 'opacity-40'}`}>
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black ${regStep === 1 ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-200 text-slate-600'}`}>1</div>
                          <div>
                            <p className="text-[10px] font-black uppercase text-emerald-700 tracking-widest leading-none mb-1">Paso 1</p>
                            <p className="font-bold text-[#111827]">Seguro y EPP</p>
                          </div>
                        </div>
                        <div className={`flex items-center gap-4 transition-all ${regStep === 2 ? 'scale-105' : 'opacity-40'}`}>
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black ${regStep === 2 ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-200 text-slate-600'}`}>2</div>
                          <div>
                            <p className="text-[10px] font-black uppercase text-emerald-700 tracking-widest leading-none mb-1">Paso 2</p>
                            <p className="font-bold text-[#111827]">Salud y Emergencia</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-auto pt-8">
                       <button onClick={() => setShowRegModal(null)} className="text-xs font-black text-rose-600 hover:text-rose-700 uppercase tracking-widest flex items-center gap-2 transition-colors">
                          <XCircle size={14}/> Cancelar Inscripción
                       </button>
                    </div>
                  </div>

                  {/* Main Form Area */}
                  <div className="flex-1 p-8 md:p-16 flex flex-col justify-between bg-white text-[#111827]">
                    <AnimatePresence mode="wait">
                      {regStep === 1 ? (
                        <motion.div 
                          key="step1" 
                          initial={{ opacity: 0, x: 20 }} 
                          animate={{ opacity: 1, x: 0 }} 
                          exit={{ opacity: 0, x: -20 }}
                          className="flex-1 flex flex-col justify-between"
                        >
                          <div>
                            <h3 className="text-4xl font-black text-[#111827] mb-4 tracking-tighter">Seguridad Industrial</h3>
                            <p className="text-slate-600 text-sm mb-10 font-bold max-w-md">
                              {activeRegVisitRequiresInsurance 
                                ? "Para el ingreso a planta, el seguro de accidentes y el equipamiento de protección son requisitos institucionales obligatorios."
                                : "Para esta visita técnica el seguro de accidentes Uni Vida es opcional, pero el equipamiento de protección sigue siendo requerido."}
                            </p>

                            <div className="space-y-12">
                              {/* Seguro Section */}
                              <div className="relative">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                  <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100"><ShieldCheck size={24}/></div>
                                    <label className="text-lg font-bold text-[#111827] tracking-tight">¿Cuenta con seguro vigente Uni Vida?</label>
                                  </div>
                                  <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-200 shrink-0">
                                    <button onClick={() => setRegForm({...regForm, tiene_seguro: true})} className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${regForm.tiene_seguro ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-850'}`}>SÍ</button>
                                    <button onClick={() => setRegForm({...regForm, tiene_seguro: false})} className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${!regForm.tiene_seguro ? 'bg-rose-100 text-rose-700 shadow-sm border border-rose-200' : 'text-slate-600 hover:text-slate-850'}`}>NO</button>
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
                                           <Upload className="text-slate-400 mb-3" size={32} />
                                           <p className="text-xs font-black text-[#111827] uppercase tracking-widest mb-4">Adjuntar Comprobante (FOTO/PDF/PNG)</p>
                                           <input 
                                             type="file" 
                                             accept="image/*,.pdf"
                                             onChange={(e) => setComprobanteFile(e.target.files?.[0] || null)}
                                             className="text-xs text-slate-600 file:mr-4 file:py-2 file:px-6 file:rounded-full file:border file:border-slate-200 file:text-xs file:font-black file:bg-slate-100 file:text-[#111827] hover:file:bg-slate-200 cursor-pointer"
                                           />
                                           {comprobanteFile && <div className="mt-4 flex items-center gap-2 text-emerald-700 font-extrabold text-xs bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-500/20"><Check size={18}/> {comprobanteFile.name}</div>}
                                        </div>
                                      </div>
                                    </motion.div>
                                  ) : activeRegVisitRequiresInsurance ? (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-4 mt-4">
                                      <AlertCircle className="text-red-700 shrink-0 shadow-sm" />
                                      <p className="text-red-800 text-xs font-extrabold uppercase tracking-widest leading-loose">EL SEGURO ES REQUISITO OBLIGATORIO PARA VALIDAR SU PARTICIPACIÓN.</p>
                                    </motion.div>
                                  ) : (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-4 mt-4">
                                      <CheckCircle2 className="text-emerald-700 shrink-0 shadow-sm" />
                                      <p className="text-emerald-800 text-xs font-extrabold uppercase tracking-widest leading-loose">EL SEGURO ES OPCIONAL PARA ESTA VISITA. PUEDE CONTINUAR SIN ADJUNTARLO.</p>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>

                              {/* EPP Section */}
                              <div className="relative">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                  <div className="flex flex-col">
                                    <div className="flex items-center gap-3">
                                      <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100"><Database size={24}/></div>
                                      <label className="text-lg font-bold text-[#111827] tracking-tight">¿Cuenta con Equipo de Protección (EPP)?</label>
                                    </div>
                                    <span className="mt-1 text-[10px] text-slate-500 font-bold uppercase tracking-wider pl-[44px]">(Pantalón de jean, camisa manga larga, casco, botas con punta de acero)</span>
                                  </div>
                                  <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-200 shrink-0">
                                    <button onClick={() => setRegForm({...regForm, tiene_epp: true})} className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${regForm.tiene_epp ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-850'}`}>SÍ</button>
                                    <button onClick={() => setRegForm({...regForm, tiene_epp: false})} className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${!regForm.tiene_epp ? 'bg-rose-100 text-rose-700 shadow-sm border border-rose-200' : 'text-slate-600 hover:text-slate-850'}`}>NO</button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="mt-8 flex justify-end pt-8 border-t border-slate-200">
                            <button 
                              onClick={() => setRegStep(2)}
                              disabled={activeRegVisitRequiresInsurance ? (!regForm.tiene_seguro || !comprobanteFile) : (regForm.tiene_seguro && !comprobanteFile)}
                              className="h-16 px-12 bg-gradient-to-r from-emerald-600 to-emerald-750 text-white rounded-[2rem] font-black text-sm hover:scale-105 transition-all shadow-md disabled:opacity-30 disabled:grayscale flex items-center gap-3"
                            >Siguiente Paso <CheckCircle2 size={20}/></button>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div 
                          key="step2" 
                          initial={{ opacity: 0, x: 20 }} 
                          animate={{ opacity: 1, x: 0 }} 
                          exit={{ opacity: 0, x: -20 }}
                          className="flex-1 flex flex-col justify-between"
                        >
                          <div>
                            <h3 className="text-4xl font-black text-[#111827] mb-4 tracking-tighter">Información Médica</h3>
                            <p className="text-slate-600 mb-10 font-bold text-sm max-w-md">Estos datos son de carácter estrictamente confidencial para uso médico preventivo en la visita.</p>

                            <div className="space-y-8 flex-1">
                              <div>
                                 <label className="text-[10px] font-black uppercase text-emerald-700 tracking-widest mb-3 block pl-2">Estado de Salud / Alergias relevantes</label>
                                 <textarea 
                                   value={regForm.problema_salud}
                                   onChange={(e) => setRegForm({...regForm, problema_salud: e.target.value})}
                                   placeholder="Indique si padece alguna afección de salud, alergia relevante o si prefiere reportar estado saludable..."
                                   className="w-full h-40 p-6 bg-slate-50 border-2 border-slate-200 focus:border-emerald-500 text-[#111827] rounded-3xl outline-none transition-all placeholder:text-slate-400 font-medium resize-none shadow-sm"
                                 />
                              </div>

                              <div>
                                 <label className="text-[10px] font-black uppercase text-emerald-700 tracking-widest mb-3 block pl-2">Teléfono de Emergencia (Referencia familiar)</label>
                                 <div className="relative">
                                    <Users className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={24} />
                                    <input 
                                      type="number"
                                      value={regForm.contacto_referencia}
                                      onChange={(e) => setRegForm({...regForm, contacto_referencia: e.target.value})}
                                      placeholder="Número celular de contacto de emergencia"
                                      className="w-full h-20 pl-16 pr-8 bg-slate-50 border-2 border-slate-200 focus:border-emerald-500 text-[#111827] rounded-3xl outline-none transition-all text-xl font-black shadow-sm"
                                    />
                                 </div>
                              </div>
                            </div>
                          </div>

                          <div className="mt-8 flex justify-between items-center bg-slate-50 p-4 rounded-[2.5rem] border border-slate-200">
                            <button 
                              onClick={() => setRegStep(1)}
                              className="h-16 px-8 text-slate-600 font-extrabold text-sm uppercase tracking-widest hover:text-slate-800 transition-colors"
                            >Volver</button>

                            <button 
                              onClick={submitRegistration}
                              disabled={isBooking !== null || !regForm.contacto_referencia.trim()}
                              className="h-16 px-12 bg-gradient-to-r from-emerald-600 to-emerald-750 text-white rounded-2xl font-black text-lg hover:scale-105 transition-all shadow-md flex items-center justify-center gap-3 disabled:opacity-40"
                            >
                              {isBooking !== null ? (
                                <>
                                  <Loader2 className="animate-spin text-white" size={24} />
                                  PROCESANDO...
                                </>
                              ) : (
                                "CONFIRMAR ASISTENCIA"
                              )}
                            </button>
                          </div>
                          {regError && <p className="mt-4 text-center text-xs font-black text-rose-600 uppercase tracking-widest animate-pulse">{regError}</p>}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {showCancelModal && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto"
              >
                <motion.div 
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="bg-white text-[#111827] rounded-[2.5rem] w-full max-w-lg p-8 md:p-10 shadow-2xl relative border border-slate-200"
                >
                  <button 
                    onClick={() => setShowCancelModal(null)}
                    className="absolute top-6 right-6 p-2 bg-slate-100 text-slate-600 hover:text-rose-600 rounded-full transition-all border border-slate-200"
                  >
                    <XCircle size={24} />
                  </button>

                  <div className="mb-6 mt-2">
                    <div className="p-4 bg-rose-50 border border-rose-200 text-rose-600 w-fit rounded-2xl shadow-sm mb-4">
                      <AlertTriangle size={32} />
                    </div>
                    <h2 className="text-2xl font-black text-[#111827] leading-tight">Anular Inscripción</h2>
                    <p className="text-slate-600 text-xs font-extrabold mt-1 leading-normal">
                      ¿Está seguro que desea anular su inscripción para <strong>{availableVisits.find(v => v.id === showCancelModal)?.nombre}</strong>?
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black uppercase text-rose-600 tracking-widest pl-2 mb-2 block">
                        Motivo de la Anulación (Obligatorio)
                      </label>
                      <textarea
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        placeholder="Ej. Cruce de materias, enfermedad, etc."
                        className="w-full h-32 p-4 bg-slate-50 border-2 border-slate-200 focus:border-rose-500 text-[#111827] rounded-2xl outline-none transition-all placeholder:text-slate-400 font-bold text-sm resize-none shadow-sm"
                        required
                      />
                    </div>
                  </div>

                  {regError && (
                    <p className="mt-4 text-[10px] font-black text-rose-600 uppercase tracking-widest text-center animate-pulse">
                      {regError}
                    </p>
                  )}

                  <div className="mt-8 flex gap-4 justify-end">
                    <button
                      onClick={() => setShowCancelModal(null)}
                      className="px-6 h-12 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 hover:text-slate-800 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={submitCancellation}
                      disabled={isCanceling || !cancelReason.trim()}
                      className="px-8 h-12 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 disabled:opacity-30 rounded-xl font-black text-xs uppercase tracking-widest shadow-sm flex items-center justify-center transition-all hover:scale-105"
                    >
                      Confirmar Anulación
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  if (userRole === 'operator') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0c2e25] via-[#051e18] to-[#041511] font-sans text-white relative overflow-hidden flex flex-col">
        <CEICBackground />
        
        {/* Header bar */}
        <header className="relative z-10 bg-[#011a15]/80 backdrop-blur-md border-b border-emerald-500/10 px-6 py-4 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-teal-400 to-emerald-600 border border-teal-300/20 text-teal-950 rounded-xl shadow-md">
              <QrCode size={22} />
            </div>
            <div>
              <h1 className="text-md font-black tracking-tight text-white uppercase leading-none">ASISTENCIA QR</h1>
              <span className="text-[9px] font-bold text-teal-400 tracking-[0.1em] uppercase">Control Solo Registro</span>
            </div>
          </div>
          
          <button 
            onClick={handleLogout} 
            className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/45 rounded-xl font-black text-xs text-rose-400 uppercase tracking-wider transition-all active:scale-95 cursor-pointer shadow-sm shadow-rose-950/25"
          >
            <LogOut size={16} /> Salir
          </button>
        </header>

        {/* Content body containing only the AsistenciaVisitas module */}
        <main className="flex-1 p-6 z-10 overflow-y-auto max-w-5xl w-full mx-auto">
          <div className="space-y-6">
            <div className="bg-emerald-950/20 border border-emerald-500/10 p-5 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  Panel de Registro de Asistencia
                </h2>
                <p className="text-xs text-emerald-300/60 font-medium mt-1">
                  Use la cámara de su dispositivo o ingrese el registro manualmente para marcar el ingreso de los estudiantes a las visitas técnicas oficiales del congreso.
                </p>
              </div>
              <div className="px-3.5 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[10px] font-black text-emerald-400 uppercase tracking-wider">
                Modo Restringido
              </div>
            </div>

            <AsistenciaVisitas visits={availableVisits} onSupabaseError={handleSupabaseError} />
          </div>
        </main>
      </div>
    );
  }

  // --- Admin View ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-950 via-emerald-900 to-teal-950 font-sans text-white relative overflow-hidden">
      <CEICBackground />
      
      <div className="flex flex-col md:flex-row min-h-screen relative z-10 bg-[#001410]/40 backdrop-blur-md">
        {/* Sidebar */}
        <aside className="w-full md:w-72 bg-[#011a15]/85 backdrop-blur-md border-r border-emerald-500/10 flex flex-col p-6 shadow-xl relative z-20">
          <div className="flex items-center gap-3 mb-10 px-2 leading-none">
            <div className="p-2.5 bg-gradient-to-br from-amber-400 to-amber-600 border border-amber-300/20 text-teal-950 rounded-2xl">
              <ShieldCheck size={28} />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tighter uppercase">ADMIN</h1>
              <span className="text-[9px] font-black text-emerald-400 tracking-[0.2em] uppercase">Panel de Control</span>
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
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-800 text-white shadow-xl border border-emerald-400/20' 
                    : 'text-emerald-300/70 hover:text-amber-400 hover:bg-emerald-950/40'
                }`}
              >
                <tab.icon size={20} />
                {tab.label}
              </button>
            ))}
          </nav>

          <button onClick={handleLogout} className="mt-auto flex items-center gap-4 px-4 py-3 text-emerald-400 font-extrabold hover:text-rose-400 transition-colors">
            <LogOut size={20}/> Salir
          </button>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 md:p-12 overflow-y-auto">
          <AnimatePresence mode="wait">
            {adminTab === 'qr_asistencia' && (
              <motion.div key="qr" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="space-y-6">
                <AsistenciaVisitas visits={availableVisits} onSupabaseError={handleSupabaseError} />
              </motion.div>
            )}

            {adminTab === 'visitas' && (
              <motion.div key="vis" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                  <div>
                    <h2 className="text-2xl font-black text-white">Gestión de Visitas</h2>
                    <p className="text-sm text-emerald-300/60 font-bold tracking-tight">Administre las visitas técnicas y empresas registradas.</p>
                  </div>
                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <button 
                      onClick={exportVisitsToPDF}
                      className="px-5 py-3 bg-[#0d503c] hover:bg-[#0f5c45] border border-emerald-500/30 text-white rounded-2xl font-black text-sm flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-teal-950/20"
                    >
                      <FileText size={18} className="text-emerald-400"/> Exportar PDF
                    </button>
                    <button 
                      onClick={() => { handleResetVisitForm(); setShowVisitModal(true); }}
                      className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-teal-950 rounded-2xl font-black text-sm flex items-center gap-2 hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg shadow-amber-950/35"
                    >
                      <Plus size={18}/> Nueva Visita
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-[2rem] shadow-xl border border-slate-200 overflow-hidden text-slate-800">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="p-5 text-[10px] font-black uppercase text-slate-500 tracking-widest pl-8 animate-fade-in">Empresa / Visita</th>
                          <th className="p-5 text-[10px] font-black uppercase text-slate-500 tracking-widest text-center">Ubicación</th>
                          <th className="p-5 text-[10px] font-black uppercase text-slate-500 tracking-widest text-center">Fecha / Hora</th>
                          <th className="p-5 text-[10px] font-black uppercase text-slate-500 tracking-widest text-center">Nivel</th>
                          <th className="p-5 text-[10px] font-black uppercase text-slate-500 tracking-widest text-center">Cupos</th>
                          <th className="p-5 text-[10px] font-black uppercase text-slate-500 tracking-widest text-right pr-8">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                        {availableVisits.map((v, idx) => (
                          <tr key={v.id || `visit-row-${idx}`} className="hover:bg-slate-50/70 transition-colors group">
                            <td className="p-5 pl-8">
                              <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-xl">
                                  <Calendar size={18}/>
                                </div>
                                <div>
                                  <div className="font-extrabold text-slate-900 text-base">{v.nombre}</div>
                                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">ID: {v.id.split('-')[0]}...</div>
                                </div>
                              </div>
                            </td>
                            <td className="p-5 text-center">
                              <span className="text-sm font-bold text-slate-600">{v.descripcion}</span>
                            </td>
                            <td className="p-5 text-center">
                              <div className="flex flex-col items-center">
                                <span className="text-sm font-extrabold text-slate-800">
                                  {(() => {
                                    const parts = (v.fecha || '').split('-');
                                    return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : v.fecha;
                                  })()}
                                </span>
                                <span className="text-[10px] font-black text-amber-600 uppercase tracking-tight">{v.horario || 'N/D'}</span>
                              </div>
                            </td>
                            <td className="p-5 text-center">
                              <span className="px-3 py-1 bg-slate-100 border border-slate-200 text-slate-700 rounded-full text-[10px] font-black uppercase tracking-wider">NVL {v.min_nivel}+</span>
                            </td>
                            <td className="p-5 text-center">
                              <div className="flex flex-col items-center">
                                <div className="flex items-center gap-1.5 text-sm font-black text-slate-800">
                                  <Users size={14} className="text-slate-400"/>
                                  {allRegistrations.filter(r => r.visita_id === v.id && r.estado !== 'ANULADO').length} / {v.cupos_max}
                                </div>
                                  <div className="w-16 h-1 bg-slate-100 rounded-full mt-1.5 overflow-hidden border border-slate-200">
                                    <div 
                                      className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all" 
                                      style={{
                                        width: `${Math.min(100, 
                                          (v.cupos_max > 0) 
                                            ? (allRegistrations.filter(r => r.visita_id === v.id && r.estado !== 'ANULADO').length / v.cupos_max) * 100 
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
                                      min_nivel: v.min_nivel,
                                      requiereSeguro: v.requiereSeguro !== false
                                    });
                                    setShowVisitModal(true);
                                  }}
                                  className="p-2 bg-slate-50 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-100 hover:text-slate-800 transition-colors"
                                  title="Editar"
                                >
                                  <RefreshCw size={16}/>
                                </button>
                                <button 
                                  onClick={() => fetchVisitStatus(v)}
                                  className="p-2 bg-slate-50 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-100 hover:text-slate-800 transition-colors"
                                  title="Ver Estado"
                                >
                                  <Eye size={16}/>
                                </button>
                                <button 
                                  onClick={() => handleDeleteVisit(v.id)}
                                  className="p-2 bg-rose-50 border border-rose-100 text-rose-600 rounded-lg hover:bg-rose-100 hover:text-rose-700 transition-colors"
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
                    <div className="py-20 text-center bg-slate-50 border border-slate-200 rounded-[2rem]">
                      <Calendar size={48} className="mx-auto text-slate-300 mb-4"/>
                      <p className="text-slate-500 font-bold">No hay visitas configuradas en la base de datos.</p>
                      <button 
                        onClick={() => { handleResetVisitForm(); setShowVisitModal(true); }}
                        className="mt-4 px-6 py-2 bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl text-teal-950 font-black text-xs uppercase tracking-widest hover:scale-105 transition-all"
                      >Crear la primera visita</button>
                    </div>
                  )}
                </div>

                {showVisitModal && (
                  <div 
                    className="fixed inset-0 bg-slate-950/85 backdrop-blur-xl z-[200] flex items-center justify-center p-4"
                  >
                    <div 
                      className="bg-[#021c17] text-white rounded-[2.5rem] p-10 max-w-2xl w-full border border-emerald-500/15 shadow-2xl relative"
                    >
                        <button onClick={handleCloseVisitModal} className="absolute top-8 right-8 text-emerald-400 bg-[#022a22] p-1.5 border border-emerald-500/20 rounded-full hover:text-rose-400 transition-colors"><XCircle size={24}/></button>
                        
                        <div className="flex items-center gap-4 mb-8">
                          <div className="p-4 bg-gradient-to-br from-emerald-500 to-teal-850 border border-emerald-400/20 text-white rounded-3xl shadow-lg"><Calendar size={32}/></div>
                          <div>
                            <h2 className="text-2xl font-black text-white">{editingVisit ? 'Editar Visita' : 'Nueva Visita Técnica'}</h2>
                            <p className="text-xs text-amber-400 font-extrabold uppercase tracking-widest leading-none mt-1">Información de la empresa y logística</p>
                          </div>
                        </div>

                        <form onSubmit={handleSaveVisit} className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                              <label className="text-[10px] font-black uppercase text-emerald-300 tracking-widest mb-2 block pl-2">Nombre de la Empresa</label>
                              <input 
                                type="text"
                                placeholder="Ej: YPFB Refinería"
                                value={visitForm.nombre}
                                onChange={(e) => setVisitForm({...visitForm, nombre: e.target.value})}
                                required
                                className="w-full h-14 px-6 bg-[#011411]/60 border-2 border-emerald-500/15 focus:border-amber-400 focus:bg-transparent text-white rounded-2xl outline-none transition-all font-bold placeholder:text-emerald-800"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-black uppercase text-emerald-300 tracking-widest mb-2 block pl-2">Fecha de Visita</label>
                              <input 
                                type="date"
                                value={visitForm.fecha}
                                onChange={(e) => setVisitForm({...visitForm, fecha: e.target.value})}
                                required
                                className="w-full h-14 px-6 bg-[#011411]/60 border-2 border-emerald-500/15 focus:border-amber-400 focus:bg-transparent text-white rounded-2xl outline-none transition-all font-bold placeholder:text-emerald-800"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-[10px] font-black uppercase text-emerald-300 tracking-widest mb-2 block pl-2">Horario Inicio</label>
                                <input 
                                  type="time"
                                  value={visitForm.horario_inicio}
                                  onChange={(e) => setVisitForm({...visitForm, horario_inicio: e.target.value})}
                                  required
                                  className="w-full h-14 px-6 bg-[#011411]/60 border-2 border-emerald-500/15 focus:border-amber-400 focus:bg-transparent text-white rounded-2xl outline-none transition-all font-bold"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-black uppercase text-emerald-300 tracking-widest mb-2 block pl-2">Horario Fin</label>
                                <input 
                                  type="time"
                                  value={visitForm.horario_fin}
                                  onChange={(e) => setVisitForm({...visitForm, horario_fin: e.target.value})}
                                  required
                                  className="w-full h-14 px-6 bg-[#011411]/60 border-2 border-emerald-500/15 focus:border-amber-400 focus:bg-transparent text-white rounded-2xl outline-none transition-all font-bold"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="text-[10px] font-black uppercase text-emerald-300 tracking-widest mb-2 block pl-2">Cupos Disponibles</label>
                              <input 
                                type="number"
                                value={visitForm.cupos_max}
                                onChange={(e) => setVisitForm({...visitForm, cupos_max: parseInt(e.target.value)})}
                                required
                                min="1"
                                className="w-full h-14 px-6 bg-[#011411]/60 border-2 border-emerald-500/15 focus:border-amber-400 focus:bg-transparent text-white rounded-2xl outline-none transition-all font-bold"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-black uppercase text-emerald-300 tracking-widest mb-2 block pl-2">Nivel Mínimo (Semestre)</label>
                              <input 
                                type="number"
                                value={visitForm.min_nivel}
                                onChange={(e) => setVisitForm({...visitForm, min_nivel: parseInt(e.target.value)})}
                                required
                                min="1"
                                max="10"
                                className="w-full h-14 px-6 bg-[#011411]/60 border-2 border-emerald-500/15 focus:border-amber-400 focus:bg-transparent text-white rounded-2xl outline-none transition-all font-bold"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="text-[10px] font-black uppercase text-emerald-300 tracking-widest mb-2 block pl-2">Ubicación / Descripción</label>
                              <textarea 
                                placeholder="Dirección exacta o detalles logísticos"
                                value={visitForm.descripcion}
                                onChange={(e) => setVisitForm({...visitForm, descripcion: e.target.value})}
                                required
                                className="w-full h-28 p-6 bg-[#011411]/60 border-2 border-emerald-500/15 focus:border-amber-400 focus:bg-transparent text-white rounded-2xl outline-none transition-all font-medium resize-none shadow-inner placeholder:text-emerald-800 animate-none"
                              />
                            </div>
                            <div className="md:col-span-2 flex items-center justify-between p-4 bg-[#011411]/40 border-2 border-emerald-500/10 rounded-2xl">
                              <div>
                                <label className="text-xs font-black uppercase text-emerald-300 tracking-widest block">Requerir Seguro UniVida para esta visita</label>
                                <p className="text-[11px] text-emerald-600 font-bold mt-0.5">Define si los estudiantes deben subir obligatoriamente su comprobante de seguro para inscribirse</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => setVisitForm({ ...visitForm, requiereSeguro: !visitForm.requiereSeguro })}
                                className={`w-14 h-8 rounded-full p-1 transition-colors duration-200 outline-none shrink-0 cursor-pointer ${visitForm.requiereSeguro ? 'bg-emerald-500' : 'bg-emerald-950 border border-emerald-500/20'}`}
                              >
                                <div
                                  className={`w-6 h-6 rounded-full bg-white transition-transform duration-200 shadow-md ${visitForm.requiereSeguro ? 'translate-x-6' : 'translate-x-0'}`}
                                />
                              </button>
                            </div>
                          </div>
                          <div className="flex justify-end gap-3 pt-4">
                            <button type="button" onClick={handleCloseVisitModal} className="h-14 px-6 font-black text-emerald-400 text-xs uppercase tracking-widest hover:text-emerald-200 transition-colors">Cancelar</button>
                            <button 
                              type="submit" 
                              disabled={isSavingVisit}
                              className="h-14 px-10 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl font-black text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-xl flex items-center justify-center disabled:opacity-40"
                            >
                              GUARDAR VISITA
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}

                  {selectedVisitForStatus && (
                    <div 
                      className="fixed inset-0 bg-slate-950/85 backdrop-blur-xl z-[200] flex items-center justify-center p-4"
                    >
                      <div 
                        className="bg-[#021c17] text-white rounded-[2.5rem] p-10 max-w-4xl w-full border border-emerald-500/15 shadow-2xl relative max-h-[90vh] overflow-hidden flex flex-col"
                      >
                        <button onClick={() => setSelectedVisitForStatus(null)} className="absolute top-8 right-8 text-emerald-400 bg-[#022a22] p-1.5 border border-emerald-500/20 rounded-full hover:text-rose-400 transition-colors"><XCircle size={24}/></button>
                        
                        <div className="flex items-center gap-4 mb-8">
                          <div className="p-4 bg-gradient-to-br from-emerald-500 to-teal-850 border border-emerald-400/20 text-white rounded-3xl shadow-lg"><Eye size={32}/></div>
                          <div>
                            <h2 className="text-2xl font-black text-white">Estado: {selectedVisitForStatus.nombre}</h2>
                            <div className="flex items-center gap-3 mt-1.5">
                              <p className="text-xs text-amber-400 font-extrabold uppercase tracking-widest">{selectedVisitForStatus.fecha} | {selectedVisitForStatus.horario}</p>
                              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${enrolledStudents.filter((r: any) => r.estado !== 'ANULADO').length >= selectedVisitForStatus.cupos_max ? 'bg-rose-950/30 border border-rose-500/20 text-rose-400' : 'bg-emerald-950 border border-emerald-500/25 text-emerald-300'}`}>
                                {enrolledStudents.filter((r: any) => r.estado !== 'ANULADO').length} / {selectedVisitForStatus.cupos_max} Inscritos
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex-1 overflow-auto bg-[#011411]/50 rounded-2xl p-6 border border-emerald-500/10">
                          {isLoadingStatus ? (
                            <div className="py-20 text-center">
                              <Loader2 className="animate-spin mx-auto text-emerald-500 mb-4" size={48}/>
                              <p className="text-emerald-300/80 font-bold">Cargando lista de estudiantes...</p>
                            </div>
                          ) : enrolledStudents.length > 0 ? (
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="border-b border-emerald-500/20 text-emerald-400 uppercase tracking-widest font-black text-[10px]">
                                  <th className="p-4">Estudiante</th>
                                  <th className="p-4">Registro</th>
                                  <th className="p-4">Carrera</th>
                                  <th className="p-4">Contacto</th>
                                </tr>
                              </thead>
                              <tbody>
                                {enrolledStudents.map((reg: any) => (
                                  <tr key={reg.id} className={`border-b border-emerald-500/5 last:border-0 hover:bg-emerald-950/30 transition-colors ${reg.estado === 'ANULADO' ? 'bg-rose-950/20 text-emerald-550/40 opacity-50' : ''}`}>
                                    <td className="p-4 font-bold text-white">
                                      <span className={reg.estado === 'ANULADO' ? 'line-through text-rose-300/40 font-normal' : ''}>
                                        {reg.student?.nombre || reg.nombre_estudiante || '---'}
                                      </span>
                                      {reg.estado === 'ANULADO' && (
                                        <span className="ml-2 px-1.5 py-0.5 bg-rose-950/40 border border-rose-500/30 text-rose-400 rounded text-[9px] font-black uppercase tracking-wider">ANULADO</span>
                                      )}
                                    </td>
                                    <td className="p-4 font-mono text-amber-400 font-extrabold">{reg.estudiante_registro}</td>
                                    <td className="p-4 text-emerald-100/70">{reg.student?.carrera || '---'}</td>
                                    <td className="p-4 text-emerald-100/70 font-mono text-[10px]">{reg.student?.celular || reg.student?.telefono || '---'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <div className="py-20 text-center">
                              <Users className="mx-auto text-emerald-600/40 mb-4" size={48}/>
                              <p className="text-emerald-300/80 font-bold text-lg">No hay estudiantes inscritos aún.</p>
                            </div>
                          )}
                        </div>

                        <div className="mt-8 flex justify-end gap-4 relative">
                          <div className="relative">
                            <button 
                              onClick={() => setShowExportDropdown(!showExportDropdown)}
                              disabled={enrolledStudents.length === 0}
                              className="bg-gradient-to-r from-amber-500 to-amber-600 text-teal-950 px-8 h-14 rounded-2xl font-black shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 disabled:opacity-30"
                            >
                              <Download size={20}/>
                              Exportar...
                            </button>

                            <AnimatePresence>
                              {showExportDropdown && (
                                <>
                                  <div className="fixed inset-0 z-30" onClick={() => setShowExportDropdown(false)}></div>
                                  <motion.div 
                                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                    className="absolute right-0 bottom-full mb-3 w-48 rounded-2xl bg-[#011411] border border-emerald-500/20 text-white shadow-2xl z-40 overflow-hidden divide-y divide-emerald-500/10"
                                  >
                                    <button 
                                      onClick={() => { exportToPDF(); setShowExportDropdown(false); }} 
                                      className="w-full text-left px-5 py-4 hover:bg-emerald-950/40 transition-colors flex items-center gap-3 font-bold text-xs uppercase tracking-wider text-emerald-300 hover:text-white"
                                    >
                                      <FileText size={16} className="text-emerald-400"/>
                                      Exportar PDF
                                    </button>
                                    <button 
                                      onClick={() => { exportToExcel(); setShowExportDropdown(false); }} 
                                      className="w-full text-left px-5 py-4 hover:bg-emerald-950/40 transition-colors flex items-center gap-3 font-bold text-xs uppercase tracking-wider text-amber-400 hover:text-white"
                                    >
                                      <Database size={16} className="text-amber-500"/>
                                      Exportar Excel
                                    </button>
                                  </motion.div>
                                </>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
              </motion.div>
            )}

            {adminTab === 'stats' && (
               <motion.div key="st" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="space-y-10 text-slate-800">
                  <header>
                     <h2 className="text-3xl font-black text-white leading-none mb-3">Resumen de Elegibilidad</h2>
                     <p className="text-emerald-100 font-medium opacity-90">Análisis de la base de datos actual para visitas técnicas.</p>
                  </header>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-200 text-slate-800">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-slate-100 text-slate-700 border border-slate-200 rounded-2xl"><Users size={24}/></div>
                        <span className="text-xs font-black uppercase text-slate-400 tracking-widest">Estudiantes Totales</span>
                      </div>
                      <div className="text-5xl font-black text-amber-500">2,078</div>
                      <p className="text-slate-500 font-bold text-xs mt-4 flex items-center gap-1"><Check size={14}/> Sincronizado con Supabase</p>
                    </div>
                    {availableVisits.map(v => (
                       <div key={v.id} className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-200 text-slate-800">
                        <div className="flex items-center gap-4 mb-6">
                          <div className="p-3 bg-slate-100 text-slate-700 border border-slate-200 rounded-2xl"><Calendar size={24}/></div>
                          <span className="text-xs font-black uppercase text-slate-400 tracking-widest truncate max-w-[200px]" title={v.nombre}>{v.nombre}</span>
                        </div>
                        <div className="text-5xl font-black text-slate-800">
                          {allRegistrations.filter(r => r.visita_id === v.id && r.estado !== 'ANULADO').length}<span className="text-2xl text-slate-350">/{v.cupos_max}</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full mt-6 overflow-hidden border border-slate-200">
                          <div 
                            className="bg-gradient-to-r from-emerald-500 to-amber-500 h-full rounded-full transition-all duration-1000" 
                            style={{
                              width: `${Math.min(100, (v.cupos_max > 0) 
                                ? (allRegistrations.filter(r => r.visita_id === v.id && r.estado !== 'ANULADO').length / v.cupos_max) * 100 
                                : 0)}%`
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Students Table for Stats */}
                  <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-slate-200 text-slate-850">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                       <div>
                         <h3 className="text-xl font-black text-slate-800">Base de Estudiantes</h3>
                         <p className="text-xs text-slate-500 font-medium">Buscador global en tiempo real de registros estudiantiles.</p>
                       </div>
                       <div className="relative w-full md:w-96">
                         <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                         <input 
                           type="text" 
                           placeholder="Buscar por nombre o registro..."
                           className="w-full h-12 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium focus:border-emerald-500 focus:bg-white text-slate-800 transition-all shadow-inner"
                           value={adminStatsSearch}
                           onChange={(e) => setAdminStatsSearch(e.target.value)}
                         />
                         {isAdminStatsLoading && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500 animate-spin" />}
                       </div>
                    </div>

                    <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                       <table className="w-full text-left text-sm whitespace-nowrap">
                          <thead className="bg-slate-50 text-slate-500 font-black uppercase text-[10px] tracking-widest border-b border-slate-200">
                             <tr>
                                <th className="p-5">Estudiante</th>
                                <th className="p-5">Registro</th>
                                <th className="p-5">Contacto</th>
                                <th className="p-5">Celular</th>
                                <th className="p-5">Semestre / Carrera</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                             {adminStatsStudents.map(s => (
                                <tr key={s.registro} className="hover:bg-slate-50/70 transition-colors border-b border-slate-100">
                                   <td className="p-5">
                                      <div className="font-bold text-slate-800">{s.nombre}</div>
                                      <div className="text-[10px] text-slate-450 font-black uppercase tracking-tighter">CI: {s.ci || '---'}</div>
                                   </td>
                                   <td className="p-5">
                                      <div className="font-mono text-amber-600 font-black text-xs bg-slate-50 px-2.5 py-1.5 rounded-lg inline-block border border-slate-200">{s.registro}</div>
                                   </td>
                                   <td className="p-5">
                                      <div className="flex flex-col">
                                         <span className="font-medium text-slate-700 flex items-center gap-2"><Mail size={12} className="text-slate-450"/> {s.correo || 'S/E'}</span>
                                         <span className="text-xs text-slate-400 font-bold">{s.telefono || 'S/T'}</span>
                                      </div>
                                   </td>
                                   <td className="p-5">
                                      <div className="font-bold text-slate-700">{s.celular || '---'}</div>
                                   </td>
                                   <td className="p-5">
                                      <div className="font-bold text-slate-700 truncate max-w-[200px]">{s.carrera}</div>
                                      <div className="text-[10px] font-black text-amber-600 uppercase">Nivel: {s.niv || s.semestre_activo || '?'}</div>
                                   </td>
                                </tr>
                             ))}
                             {adminStatsStudents.length === 0 && !isAdminStatsLoading && (
                               <tr><td colSpan={5} className="p-10 text-center font-bold text-slate-400 italic">No hay estudiantes que correspondan a la búsqueda.</td></tr>
                             )}
                          </tbody>
                       </table>
                    </div>
                    <div className="mt-6 flex justify-center">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mostrando resultados limitados (Base de 2,078 registros)</p>
                    </div>
                  </div>
               </motion.div>
            )}

            {adminTab === 'registrations' && (
              <motion.div key="reg" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="bg-white rounded-[2rem] p-8 shadow-xl border border-slate-200 text-slate-800">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 pb-8 border-b border-slate-100">
                     <div>
                        <h2 className="text-2xl font-black text-slate-850 mb-1">Gestión de Inscritos</h2>
                        <p className="text-xs text-slate-500 font-medium">Listado en tiempo real de los registros de estudiantes.</p>
                     </div>
                     <div className="flex flex-wrap gap-4">
                       <select 
                         value={filterVisit} 
                         onChange={(e) => setFilterVisit(e.target.value)}
                         className="h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-sm text-slate-700 focus:border-emerald-500 transition-all cursor-pointer"
                       >
                         <option value="all">Todas las visitas</option>
                         {availableVisits.map(v => {
                           const dateParts = (v.fecha || '').split('-');
                           const formattedDate = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : v.fecha;
                           const optionLabel = v.fecha ? `${v.nombre} (${formattedDate})` : v.nombre;
                           return (
                             <option key={v.id} value={v.id}>
                               {optionLabel}
                             </option>
                           );
                         })}
                       </select>
                       <button onClick={exportRegistrationsToExcel} className="h-12 px-5 bg-[#107c41] hover:bg-[#0d6132] text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-md border border-transparent">
                         <FileText size={18} /> Exportar Excel
                       </button>
                       <button 
                         onClick={exportRegistrationsToPDF} 
                         className="h-12 px-5 bg-[#b30b0b] hover:bg-[#910909] text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-md border border-transparent"
                         id="btn-registrations-pdf"
                       >
                         <FileText size={18} /> Exportar PDF
                       </button>
                     </div>
                  </div>

                  <div className="relative mb-6">
                     <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                     <input 
                       type="text" 
                       placeholder="Filtrar por nombre o registro..."
                       className="w-full h-12 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium focus:border-emerald-500 focus:bg-white text-slate-800 transition-all shadow-inner"
                       value={filterQuery}
                       onChange={(e) => setFilterQuery(e.target.value)}
                     />
                  </div>

                  <div className="overflow-hidden border border-slate-100 rounded-2xl">
                     <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 font-black uppercase text-[10px] tracking-widest border-b border-slate-200">
                           <tr>
                              <th className="p-4 pl-6">Estudiante</th>
                              <th className="p-4">Registro</th>
                              <th className="p-4">Visita Técnica</th>
                              <th className="p-4 text-center">Seguro/EPP</th>
                              <th className="p-4">Ref</th>
                              <th className="p-4 text-right pr-6">Detalles</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                           {filteredRegistrations.map(r => (
                              <tr key={r.id} className={`hover:bg-slate-50/70 transition-colors ${r.estado === 'ANULADO' ? 'bg-rose-50/50 text-rose-600/60 opacity-55 font-normal' : ''}`}>
                                 <td className="p-4 pl-6">
                                    <div className={`font-bold ${r.estado === 'ANULADO' ? 'line-through text-rose-400/80 font-normal' : 'text-slate-800'}`}>{r.nombre_estudiante}</div>
                                    <div className="text-[10px] text-slate-500 font-black uppercase tracking-wider mt-0.5">{r.estudiantes?.carrera || 'Carrera N/D'}</div>
                                 </td>
                                 <td className="p-4 font-mono text-amber-600 font-bold">{r.estudiante_registro}</td>
                                 <td className="p-4">
                                    <div className={`font-bold ${r.estado === 'ANULADO' ? 'line-through text-rose-450/45 font-normal' : 'text-slate-700'}`}>{r.nombre_visita}</div>
                                    <div className="text-[10px] text-slate-400 font-medium">
                                       {new Date(r.fecha_inscripcion!).toLocaleDateString()}
                                       {r.estado === 'ANULADO' && (
                                          <span className="ml-2 px-1.5 py-0.5 bg-rose-100 border border-rose-200 text-rose-700 rounded text-[9px] font-black uppercase tracking-wider">ANULADO</span>
                                       )}
                                    </div>
                                 </td>
                                 <td className="p-4">
                                    <div className="flex justify-center gap-2">
                                       <span title="Seguro" className={`w-2.5 h-2.5 rounded-full ${r.tiene_seguro ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                                       <span title="EPP" className={`w-2.5 h-2.5 rounded-full ${r.tiene_epp ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                                    </div>
                                 </td>
                                 <td className="p-4 font-bold text-slate-600">{r.contacto_referencia || '---'}</td>
                                 <td className="p-4 text-right pr-6">
                                    <div className="flex justify-end items-center gap-2">
                                       {r.comprobante_seguro_url && (
                                         <a 
                                           href={r.comprobante_seguro_url} 
                                           target="_blank" 
                                           rel="noopener noreferrer" 
                                           className="p-2 bg-slate-50 text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-100 hover:text-slate-850 transition-colors"
                                           title="Ver Seguro"
                                         >
                                           <ShieldCheck size={18}/>
                                         </a>
                                       )}
                                       <button onClick={() => setViewRegDetails(r)} className="p-2 bg-slate-50 text-amber-600 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"><FileText size={18}/></button>
                                       <button onClick={() => handleDeleteRegistration(r.id!)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"><Trash2 size={18}/></button>
                                    </div>
                                 </td>
                              </tr>
                           ))}
                           {filteredRegistrations.length === 0 && (
                             <tr><td colSpan={6} className="p-10 text-center font-bold text-slate-450 italic">No hay registros que coincidan con los filtros.</td></tr>
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
                      className="w-full h-16 pl-12 pr-4 bg-white border border-slate-200 rounded-3xl outline-none font-medium focus:border-emerald-500 text-slate-800 transition-all text-xl shadow-xl"
                      value={searchTerm}
                      onChange={(e) => setSearchState(e.target.value)}
                    />
                  </div>
                  <AnimatePresence>
                    {dbStudents.length > 0 && (
                      <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0}} className="absolute top-full left-0 right-0 mt-3 bg-white border border-slate-200 rounded-3xl shadow-2xl z-50 overflow-hidden">
                        {dbStudents.map(s => (
                          <button key={s.registro} onClick={() => { setSelectedStudent(s); setDbStudents([]); setSearchState(''); }} className="w-full p-5 flex items-center gap-5 hover:bg-slate-50 transition-colors border-b last:border-none border-slate-100 text-left">
                            <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-amber-600 font-black text-lg">{s.niv || (s.semestre_activo ? s.semestre_activo.split('-')[0] : '?')}</div>
                            <div>
                              <div className="font-bold text-slate-800">{s.nombre}</div>
                              <div className="text-xs text-slate-400 font-mono">ID: {s.registro} | {s.carrera}</div>
                            </div>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </section>

                {selectedStudent ? (
                  <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-slate-200 text-slate-800">
                    <div className="flex justify-between items-start mb-12">
                      <div className="flex gap-8 items-center">
                        <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-emerald-600 to-teal-850 flex items-center justify-center text-white shadow-xl border border-emerald-400/25"><User size={48} /></div>
                        <div>
                          <h2 className="text-3xl font-black text-slate-900 tracking-tighter mb-2">{selectedStudent.nombre}</h2>
                          <div className="flex items-center gap-3">
                            <span className="px-4 py-1.5 bg-slate-50 border border-slate-200 text-slate-700 rounded-full text-xs font-black uppercase tracking-widest">{selectedStudent.carrera}</span>
                            <span className="w-1.5 h-1.5 bg-slate-200 rounded-full"></span>
                            <span className="text-sm font-bold text-slate-450">ID Estudiantil: {selectedStudent.registro}</span>
                          </div>
                        </div>
                      </div>
                      <button onClick={() => setSelectedStudent(null)} className="p-3 bg-slate-50 text-slate-400 hover:text-rose-650 hover:bg-rose-50 rounded-2xl border border-slate-200 transition-all"><XCircle size={32}/></button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                      <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl flex items-center gap-5 group hover:bg-white hover:shadow-md hover:border-slate-350 transition-all">
                         <div className="p-4 bg-slate-100 rounded-2xl text-amber-600 border border-slate-250 shadow-sm transition-transform group-hover:scale-110"><IdCard size={24}/></div>
                         <div>
                           <p className="text-[10px] font-black uppercase text-slate-450 tracking-widest mb-0.5">Carnet CI</p>
                           <p className="text-lg font-black text-slate-800">{selectedStudent.ci || '---'}</p>
                         </div>
                      </div>
                      <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl flex items-center gap-5 group hover:bg-white hover:shadow-md hover:border-slate-350 transition-all">
                         <div className="p-4 bg-slate-100 rounded-2xl text-amber-600 border border-slate-250 shadow-sm transition-transform group-hover:scale-110"><Database size={24}/></div>
                         <div>
                           <p className="text-[10px] font-black uppercase text-slate-450 tracking-widest mb-0.5">Registro</p>
                           <p className="text-lg font-black text-amber-600">{selectedStudent.registro}</p>
                         </div>
                      </div>
                      <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl flex items-center gap-5 group hover:bg-white hover:shadow-md hover:border-slate-350 transition-all">
                         <div className="p-4 bg-slate-100 rounded-2xl text-amber-600 border border-slate-250 shadow-sm transition-transform group-hover:scale-110"><Phone size={24}/></div>
                         <div>
                           <p className="text-[10px] font-black uppercase text-slate-450 tracking-widest mb-0.5">Contacto</p>
                           <p className="text-lg font-black text-slate-800">{selectedStudent.celular || selectedStudent.telefono || '---'}</p>
                         </div>
                      </div>
                      <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl flex items-center gap-5 group hover:bg-white hover:shadow-md hover:border-slate-350 transition-all">
                         <div className="p-4 bg-slate-100 rounded-2xl text-amber-600 border border-slate-250 shadow-sm transition-transform group-hover:scale-110"><GraduationCap size={24}/></div>
                         <div>
                           <p className="text-[10px] font-black uppercase text-slate-450 tracking-widest mb-0.5">Nivel Académico</p>
                           <p className="text-lg font-black text-slate-800">{selectedStudent.niv || selectedStudent.nivel || '?'}</p>
                         </div>
                      </div>
                      <div className="md:col-span-2 lg:col-span-4 p-6 bg-slate-50 border border-slate-200 rounded-3xl flex items-center gap-5">
                         <div className="p-4 bg-slate-100 rounded-2xl text-amber-600 border border-slate-200 shadow-sm"><Mail size={24}/></div>
                         <div className="flex-1">
                           <p className="text-[10px] font-black uppercase text-slate-450 tracking-widest mb-0.5">Correo Electrónico Institucional</p>
                           <p className="text-lg font-black text-slate-700">{selectedStudent.correo || `${selectedStudent.registro}@est.edu.bo`}</p>
                         </div>
                      </div>
                    </div>

                    <div className="pt-10 border-t border-slate-200">
                      <h3 className="text-xs font-black uppercase text-slate-700 tracking-widest mb-6 flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-emerald-600" /> 
                        Validación de Elegibilidad para Visitas
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                         {availableVisits.map(v => {
                            const isEligible = (selectedStudent.niv || 0) >= v.min_nivel;
                            return (
                              <div key={v.id} className={`p-6 rounded-[2rem] border transition-all ${isEligible ? 'bg-emerald-50/80 border-emerald-250 text-slate-800' : 'bg-rose-50/80 border-rose-250 text-slate-800'}`}>
                                 <div className="flex justify-between items-start mb-4">
                                   <p className={`text-[10px] font-black uppercase tracking-tighter leading-tight max-w-[70%] ${isEligible ? 'text-emerald-950' : 'text-rose-950'}`}>{v.nombre}</p>
                                   <div className={`p-1.5 rounded-lg border ${isEligible ? 'bg-emerald-100 border-emerald-300 text-emerald-700' : 'bg-rose-100 border border-rose-300 text-rose-700'}`}>
                                     {isEligible ? <Check size={14}/> : <XCircle size={14}/>}
                                   </div>
                                 </div>
                                 <div className="flex items-end justify-between">
                                   <div>
                                     <p className={`text-xl font-black ${isEligible ? 'text-emerald-700' : 'text-rose-700'} tracking-tighter`}>
                                       {isEligible ? 'HABILITADO' : ' RESTRINGIDO'}
                                     </p>
                                     <p className={`text-[10px] font-bold uppercase mt-0.5 ${isEligible ? 'text-emerald-600/70' : 'text-rose-600/70'}`}>Mínimo Nivel: {v.min_nivel}</p>
                                   </div>
                                 </div>
                              </div>
                            );
                         })}
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="py-20 text-center border border-dashed border-slate-200 bg-white shadow-xl rounded-[2.5rem]">
                    <Search className="mx-auto text-slate-300 mb-4 animate-pulse" size={48} />
                    <p className="text-slate-500 font-bold italic">Seleccione un estudiante para validar su perfil en tiempo real o use el buscador lateral.</p>
                  </div>
                )}
              </motion.div>
            )}

            {adminTab === 'sync' && (
              <motion.div key="sy" initial={{opacity:0, x:-20}} animate={{opacity:1, x:0}} className="space-y-8">
                <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-slate-200 text-slate-800 overflow-hidden animate-fade-in">
                   <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-8 border-b border-slate-200">
                    <div className="flex flex-wrap gap-10">
                      <div className="flex flex-col"><span className="text-[10px] font-black text-slate-450 uppercase tracking-widest mb-1">Carga A</span><span className="text-xl font-black text-slate-800">{baseStudents.length}</span></div>
                      <div className="flex flex-col"><span className="text-[10px] font-black text-slate-450 uppercase tracking-widest mb-1">Carga B</span><span className="text-xl font-black text-slate-800">{compStudents.length}</span></div>
                      <div className="flex flex-col"><span className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Unificados</span><span className="text-2xl font-black text-amber-600">{finalStudents.length}</span></div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <button onClick={executeMerge} className="h-12 px-6 bg-slate-100 border border-slate-200 text-slate-700 rounded-xl font-black text-sm hover:bg-slate-200 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50">
                        <Layers size={18}/> COMBINAR
                      </button>
                      <button disabled={isSyncing || finalStudents.length === 0} onClick={handleSync} className="h-12 px-8 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-xl font-black text-sm hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 shadow-lg shadow-emerald-900/20 disabled:opacity-50">
                        {isSyncing ? <Loader2 className="animate-spin" size={18}/> : <Database size={18}/>}
                        SYNC ({finalStudents.length})
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                    <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl">
                       <h4 className="font-black text-xs uppercase text-slate-700 mb-4 flex items-center gap-2"><Upload size={14} className="text-emerald-600"/> Archivo Base (.TXT)</h4>
                       <input type="file" accept=".txt" className="hidden" ref={fileInputBaseRef} onChange={handleFileUpload('base')}/>
                       <button onClick={() => fileInputBaseRef.current?.click()} className="w-full py-3 bg-white border-2 border-slate-200 hover:border-slate-300 text-emerald-700 hover:text-emerald-800 rounded-xl font-bold hover:bg-slate-50 transition-all shadow-sm">Seleccionar Archivo A</button>
                    </div>
                    <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl">
                       <h4 className="font-black text-xs uppercase text-slate-700 mb-4 flex items-center gap-2"><FileText size={14} className="text-emerald-600"/> Archivo Complemento (.TXT)</h4>
                       <input type="file" accept=".txt" className="hidden" ref={fileInputCompRef} onChange={handleFileUpload('comp')}/>
                       <button onClick={() => fileInputCompRef.current?.click()} className="w-full py-3 bg-white border-2 border-slate-200 hover:border-slate-300 text-emerald-700 hover:text-emerald-800 rounded-xl font-bold hover:bg-slate-50 transition-all shadow-sm">Seleccionar Archivo B</button>
                    </div>
                  </div>

                  {syncStatus === 'success' && (
                    <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 mb-8 font-bold flex items-center gap-3">
                      <Check size={20} className="text-emerald-600"/> Carga Exitosa de {lastSyncCount} registros
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
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-2xl font-black text-slate-800">{viewRegDetails.nombre_estudiante}</h2>
                      {viewRegDetails.estado === 'ANULADO' && (
                        <span className="px-2.5 py-1 bg-rose-100 text-rose-700 rounded-lg text-xs font-black uppercase tracking-wider">ANULADO</span>
                      )}
                    </div>
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

                    {viewRegDetails.estado === 'ANULADO' && (
                      <div className="animate-in fade-in duration-200">
                        <span className="text-[10px] font-black uppercase text-rose-500 tracking-widest block mb-2 font-black">Motivo de Anulación</span>
                        <div className="p-4 bg-rose-50 border border-rose-100 text-rose-800 rounded-2xl text-sm font-extrabold shadow-sm">
                          {viewRegDetails.motivo_anulacion || 'No especificado (Anulado por estudiante)'}
                        </div>
                      </div>
                    )}
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
