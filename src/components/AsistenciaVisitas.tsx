import React, { useState, useEffect, useRef } from 'react';
import { 
  QrCode, Camera, Check, XCircle, AlertTriangle, 
  Loader2, Search, UserCheck, Trash2, Calendar, 
  Users, UserPlus, Clock, ShieldCheck
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { supabase } from '../lib/supabase';
import { TechnicalVisit } from '../types';

interface AsistenciaRegistro {
  id: string;
  visita_id: string;
  estudiante_registro: string;
  nombre_estudiante: string;
  fecha_ingreso: string;
  is_eligible_pre?: boolean; // locally resolved or database field
}

interface AsistenciaVisitasProps {
  visits?: TechnicalVisit[];
  onSupabaseError?: (err: any) => boolean;
}

// Play feedback beep sound using standard Web Audio API
const playBeep = (type: 'success' | 'error') => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (type === 'success') {
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } else {
      osc.frequency.setValueAtTime(220, ctx.currentTime); // A3 note
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    }
  } catch (e) {
    console.warn("Could not play audio feedback beep:", e);
  }
};

export default function AsistenciaVisitas({ visits: propVisits, onSupabaseError }: AsistenciaVisitasProps) {
  const [visits, setVisits] = useState<TechnicalVisit[]>(propVisits || []);
  const [selectedVisitId, setSelectedVisitId] = useState<string>('');
  const [loadingVisits, setLoadingVisits] = useState(false);
  
  // Scanner state
  const [isScannerActive, setIsScannerActive] = useState(false);
  const [scanStatus, setScanStatus] = useState<string>('Escáner inactivo');
  const [scannedResult, setScannedResult] = useState<{
    studentName: string;
    studentReg: string;
    status: 'success' | 'warning' | 'error';
    message: string;
  } | null>(null);

  // Manual Check-in state
  const [manualReg, setManualReg] = useState('');
  const [isManualSubmitting, setIsManualSubmitting] = useState(false);

  // Checked-in students list
  const [registros, setRegistros] = useState<AsistenciaRegistro[]>([]);
  const [loadingRegistros, setLoadingRegistros] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Refs for QR controller
  const qrRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = "qr-scanner-viewport";

  // Load visits if not passed through props
  useEffect(() => {
    if (propVisits && propVisits.length > 0) {
      setVisits(propVisits);
      if (!selectedVisitId && propVisits.length > 0) {
        setSelectedVisitId(propVisits[0].id);
      }
    } else {
      fetchVisitsFromDB();
    }
  }, [propVisits]);

  // Handle selected visit change
  useEffect(() => {
    if (selectedVisitId) {
      fetchAsistenciaList(selectedVisitId);
    } else {
      setRegistros([]);
    }
  }, [selectedVisitId]);

  // Clean up scanner on unmount
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  const fetchVisitsFromDB = async () => {
    setLoadingVisits(true);
    try {
      const { data, error } = await supabase
        .from('visitas')
        .select('*')
        .order('fecha', { ascending: false });

      if (error) {
        if (onSupabaseError) onSupabaseError(error);
        throw error;
      }
      
      if (data && data.length > 0) {
        setVisits(data);
        setSelectedVisitId(data[0].id);
      }
    } catch (err) {
      console.error("Error fetching technical visits:", err);
    } finally {
      setLoadingVisits(false);
    }
  };

  const fetchAsistenciaList = async (visitId: string) => {
    setLoadingRegistros(true);
    try {
      const { data, error } = await supabase
        .from('asistencia_visitas')
        .select('*')
        .eq('visita_id', visitId);

      if (error) {
        // If there's an error, it might be due to tables under permission issues
        // or something. We catch it gracefully.
        console.warn("Could not query 'asistencia_visitas':", error);
        if (onSupabaseError) onSupabaseError(error);
      } else if (data) {
        // Sort most recent first
        const sorted = [...data].sort((a, b) => {
          const dateA = new Date(a.fecha_ingreso || a.created_at || 0).getTime();
          const dateB = new Date(b.fecha_ingreso || b.created_at || 0).getTime();
          return dateB - dateA;
        });
        setRegistros(sorted);
      }
    } catch (err) {
      console.error("Error loading checked-in list:", err);
    } finally {
      setLoadingRegistros(false);
    }
  };

  const startScanner = async () => {
    if (!selectedVisitId) {
      alert('Por favor, seleccione una Visita Técnica antes de iniciar el escáner.');
      return;
    }

    setScanStatus('Iniciando dispositivo de cámara...');
    setScannedResult(null);
    setIsScannerActive(true);

    // Give DOM a tick to render element with id
    setTimeout(async () => {
      try {
        const html5QrCode = new Html5Qrcode(scannerContainerId);
        qrRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 12,
            qrbox: (width, height) => {
              const exactDim = Math.min(width, height) * 0.7;
              return { width: exactDim, height: exactDim };
            }
          },
          async (decodedText) => {
            // Success callback
            await processScannedCode(decodedText);
          },
          (errorMessage) => {
            // Ignore normal noise/spam errors from camera feeds
          }
        );
        setScanStatus('Cámara activa. Acerque el código QR del estudiante...');
      } catch (err: any) {
        console.error("Error starting camera qr scanner:", err);
        setScanStatus(`Error al abrir cámara: ${err.message || err}`);
        setIsScannerActive(false);
      }
    }, 100);
  };

  const stopScanner = async () => {
    if (qrRef.current) {
      try {
        if (qrRef.current.isScanning) {
          await qrRef.current.stop();
        }
      } catch (err) {
        console.error("Error stopping camera device:", err);
      }
      qrRef.current = null;
    }
    setIsScannerActive(false);
    setScanStatus('Escáner apagado.');
  };

  const processScannedCode = async (codeText: string) => {
    // Cooldown/Pause scanning during processing
    if (qrRef.current && qrRef.current.isScanning) {
      try {
        await qrRef.current.pause(true);
      } catch (e) {
        console.warn("Could not pause QR code engine:", e);
      }
    }

    setScanStatus('Procesando código scanned...');
    const cleanedCode = codeText.trim();

    try {
      // Step 1: Look up student information in DB
      let studentRegistro = cleanedCode;
      let studentNombre = 'Estudiante Registrado';
      let isPreRegistered = false;

      // 1.a: Check in general congress registrations
      const { data: congressoData, error: congErr } = await supabase
        .from('inscripciones_congreso')
        .select('*')
        .or(`registro_universitario.eq."${cleanedCode}",id_ticket.eq."${cleanedCode}",cedula_identidad.eq."${cleanedCode}"`);

      if (congErr) console.warn("inscripciones_congreso lookup error:", congErr);

      if (congressoData && congressoData.length > 0) {
        const match = congressoData[0];
        studentRegistro = match.registro_universitario || match.id_ticket || cleanedCode;
        studentNombre = match.nombre || match.nombre_completo || 'Estudiante';
      } else {
        // 1.b: Fallback to general students table
        const { data: localData, error: localErr } = await supabase
          .from('estudiantes')
          .select('*')
          .or(`registro.eq."${cleanedCode}",ci.eq."${cleanedCode}"`);

        if (localErr) console.warn("estudiantes lookup error:", localErr);

        if (localData && localData.length > 0) {
          const match = localData[0];
          studentRegistro = match.registro || cleanedCode;
          studentNombre = match.nombre || 'Estudiante';
        }
      }

      // Step 2: Check if student has a pre-inscription/ticket for this technical visit
      const { data: inscData, error: inscErr } = await supabase
        .from('inscripciones')
        .select('*')
        .eq('visita_id', selectedVisitId)
        .eq('estudiante_registro', studentRegistro)
        .eq('estado', 'INSCRITO')
        .maybeSingle();

      if (inscErr) console.warn("Checking pre-registration returned info:", inscErr);
      if (inscData) {
        isPreRegistered = true;
      }

      // Step 3: Check if already registered in attendance table to avoid duplicates
      const isDuplicate = registros.some(r => r.estudiante_registro === studentRegistro);
      if (isDuplicate) {
        playBeep('error');
        setScannedResult({
          studentName: studentNombre,
          studentReg: studentRegistro,
          status: 'warning',
          message: 'Este código ya ha sido escaneado. La asistencia ya está registrada.'
        });
        setScanStatus('Escaneo duplicado.');
        resumeScannerAfterDelay();
        return;
      }

      // Step 4: Save attendance to supabase table 'asistencia_visitas'
      const payload = {
        visita_id: selectedVisitId,
        estudiante_registro: studentRegistro,
        nombre_estudiante: studentNombre,
        fecha_ingreso: new Date().toISOString()
      };

      const { error: insertErr } = await supabase
        .from('asistencia_visitas')
        .insert([payload]);

      if (insertErr) {
        if (onSupabaseError && onSupabaseError(insertErr)) return;
        throw insertErr;
      }

      // Success feedback
      playBeep('success');
      
      setScannedResult({
        studentName: studentNombre,
        studentReg: studentRegistro,
        status: isPreRegistered ? 'success' : 'warning',
        message: isPreRegistered 
          ? '¡Asistencia registrada con éxito! El estudiante está pre-inscrito.' 
          : '¡Asistencia registrada! ATENCIÓN: El estudiante NO figuraba en la lista de pre-inscripción del sistema.'
      });

      setScanStatus('Asistencia guardada correctamente.');
      
      // Auto-reload check-ins
      await fetchAsistenciaList(selectedVisitId);

    } catch (err: any) {
      console.error("Failed to persist QR attendance:", err);
      playBeep('error');
      setScannedResult({
        studentName: 'Código Desconocido',
        studentReg: cleanedCode,
        status: 'error',
        message: `Error al persistir asistencia en Supabase: ${err.message || err}`
      });
      setScanStatus('Fallo de registro.');
    }

    resumeScannerAfterDelay();
  };

  const resumeScannerAfterDelay = () => {
    // Wait 3.5 seconds before starting again to avoid double scanning the same QR
    setTimeout(async () => {
      if (qrRef.current) {
        try {
          await qrRef.current.resume();
          setScanStatus('Cámara activa. Acerque el código QR del estudiante...');
        } catch (e) {
          console.warn("Could not resume camera qr code engine:", e);
        }
      }
    }, 3500);
  };

  const handleManualCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVisitId) {
      alert('Por favor, escoja una visita primero.');
      return;
    }
    const targetId = manualReg.trim();
    if (!targetId) return;

    setIsManualSubmitting(true);
    try {
      // Look up values
      let studentRegistro = targetId;
      let studentNombre = 'Estudiante Manual';
      let isPreReg = false;

      const { data: congressoData } = await supabase
        .from('inscripciones_congreso')
        .select('*')
        .or(`registro_universitario.eq."${targetId}",id_ticket.eq."${targetId}",cedula_identidad.eq."${targetId}"`);

      if (congressoData && congressoData.length > 0) {
        const match = congressoData[0];
        studentRegistro = match.registro_universitario || match.id_ticket || targetId;
        studentNombre = match.nombre || match.nombre_completo || 'Estudiante';
      } else {
        const { data: localData } = await supabase
          .from('estudiantes')
          .select('*')
          .or(`registro.eq."${targetId}",ci.eq."${targetId}"`);

        if (localData && localData.length > 0) {
          const match = localData[0];
          studentRegistro = match.registro || targetId;
          studentNombre = match.nombre || 'Estudiante';
        }
      }

      // Check pre-registered
      const { data: inscData } = await supabase
        .from('inscripciones')
        .select('*')
        .eq('visita_id', selectedVisitId)
        .eq('estudiante_registro', studentRegistro)
        .eq('estado', 'INSCRITO')
        .maybeSingle();

      if (inscData) isPreReg = true;

      // Duplicate check
      const isDuplicate = registros.some(r => r.estudiante_registro === studentRegistro);
      if (isDuplicate) {
        alert('Este estudiante ya cuenta con asistencia registrada para esta visita.');
        setIsManualSubmitting(false);
        return;
      }

      const { error } = await supabase
        .from('asistencia_visitas')
        .insert([{
          visita_id: selectedVisitId,
          estudiante_registro: studentRegistro,
          nombre_estudiante: studentNombre,
          fecha_ingreso: new Date().toISOString()
        }]);

      if (error) {
        if (onSupabaseError && onSupabaseError(error)) return;
        throw error;
      }

      // Success
      setManualReg('');
      alert(`Asistencia registrada: ${studentNombre} (${studentRegistro})` + (isPreReg ? ' - Inscrito correctamente.' : ' - NO inscrito ⚠️'));
      await fetchAsistenciaList(selectedVisitId);
    } catch (err: any) {
      alert('Error en registro manual de asistencia: ' + err.message);
    } finally {
      setIsManualSubmitting(false);
    }
  };

  const handleDeleteCheckIn = async (regId: string, name: string) => {
    if (!confirm(`¿Desea eliminar el registro de asistencia de ${name}?`)) return;

    try {
      const { error } = await supabase
        .from('asistencia_visitas')
        .delete()
        .eq('id', regId);

      if (error) {
        if (onSupabaseError && onSupabaseError(error)) return;
        throw error;
      }

      alert('Registro de asistencia eliminado con éxito.');
      await fetchAsistenciaList(selectedVisitId);
    } catch (err: any) {
      alert('Error eliminando asistencia: ' + err.message);
    }
  };

  // Filter local checkins list based on search bar
  const filteredRegistros = registros.filter(r => {
    const term = searchTerm.toLowerCase();
    return (
      r.nombre_estudiante.toLowerCase().includes(term) ||
      r.estudiante_registro.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-8">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-emerald-500/10 pb-6">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <QrCode className="text-emerald-400" size={32}/> CONTROL DE ASISTENCIA QR
          </h2>
          <p className="text-sm text-emerald-300/60 font-bold tracking-tight">
            Registre los ingresos de estudiantes autorizados para las visitas técnicas usando códigos QR.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Selector & Scanner Box */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Selector Card */}
          <div className="p-6 bg-slate-950/40 backdrop-blur-md border border-emerald-500/15 rounded-[2rem] space-y-4">
            <label className="text-xs uppercase tracking-widest font-black text-emerald-400 block">
              Paso 1: Seleccione la Visita Técnica
            </label>
            <div className="relative">
              <select
                disabled={isScannerActive}
                value={selectedVisitId}
                onChange={(e) => setSelectedVisitId(e.target.value)}
                className="w-full h-14 pl-12 pr-4 bg-[#021814] border border-emerald-500/20 text-white rounded-2xl appearance-none font-bold outline-none text-sm transition-all focus:border-amber-500/40 disabled:opacity-50"
              >
                {visits.length === 0 ? (
                  <option value="">No hay visitas disponibles</option>
                ) : (
                  visits.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.nombre} ({v.fecha})
                    </option>
                  ))
                )}
              </select>
              <Calendar className="absolute left-4 top-4.5 text-emerald-400/60" size={20} />
              <div className="absolute right-4 top-5.5 pointer-events-none w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-white" />
            </div>
          </div>

          {/* Scanner Card */}
          <div className="p-6 bg-slate-950/40 backdrop-blur-md border border-emerald-500/15 rounded-[2rem] text-center space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-widest font-black text-emerald-400">
                Paso 2: Escaneo de Credencial
              </span>
              <span className={`px-2.5 py-1 text-[10px] font-black rounded-lg uppercase tracking-wider ${isScannerActive ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 animate-pulse' : 'bg-slate-900 border border-slate-800 text-slate-500'}`}>
                {isScannerActive ? "CÁMARA EN VIVO" : "APAGADO"}
              </span>
            </div>

            {/* QR Scanner Viewport Window */}
            <div className="relative w-full max-w-sm mx-auto aspect-square bg-[#010c0a] border border-emerald-500/10 rounded-3xl overflow-hidden flex flex-col items-center justify-center shadow-inner">
              
              {/* Outer Neon corner bracket styling */}
              <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-emerald-400 rounded-tl-lg z-10" />
              <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-emerald-400 rounded-tr-lg z-10" />
              <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-emerald-400 rounded-bl-lg z-10" />
              <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-emerald-400 rounded-br-lg z-10" />

              {/* Viewport for html5-qrcode */}
              <div id={scannerContainerId} className="w-full h-full object-cover">
                {!isScannerActive && (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-slate-600 p-8">
                    <div className="p-4 bg-[#011411] border border-emerald-500/10 rounded-2xl">
                      <Camera size={44} className="text-emerald-500/40" />
                    </div>
                    <p className="text-xs font-bold text-emerald-400/30 uppercase tracking-widest text-center">
                      El Feed de la Cámara se desplegará aquí un vez se active el escáner.
                    </p>
                  </div>
                )}
              </div>

              {/* Overlay laser effect */}
              {isScannerActive && (
                <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-emerald-400 shadow-[0_0_12px_3px_rgb(52,211,153)] top-1/2 left-0 right-0 animate-bounce pointer-events-none" />
              )}
            </div>

            {/* Helper State Text banner */}
            <div className="p-3 bg-[#021814] border border-emerald-500/10 rounded-xl text-center">
              <p className="text-xs font-black tracking-tight text-emerald-300">
                {scanStatus}
              </p>
            </div>

            {/* Toggle button */}
            {isScannerActive ? (
              <button
                onClick={stopScanner}
                className="w-full h-14 bg-rose-950 border border-rose-500/35 hover:bg-rose-900 text-rose-300 rounded-2xl font-black text-sm tracking-widest transition-all shadow-xl shadow-rose-950/20 uppercase"
              >
                APAGAR CÁMARA
              </button>
            ) : (
              <button
                onClick={startScanner}
                disabled={!selectedVisitId || loadingVisits}
                className="w-full h-15 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-2xl font-black text-sm tracking-widest transition-all shadow-xl shadow-emerald-900/40 uppercase"
              >
                INICIAR ESCÁNER QR
              </button>
            )}
          </div>

          {/* Quick manual entry form */}
          <div className="p-6 bg-slate-950/40 backdrop-blur-md border border-emerald-500/15 rounded-[2rem] space-y-4">
            <h3 className="text-xs uppercase tracking-widest font-black text-emerald-400 flex items-center gap-2">
              <UserPlus size={16}/> Registro Manual Supletorio
            </h3>
            <p className="text-[11px] text-slate-400 leading-normal">
              En caso de falla con el código QR, ingrese el Registro Universitario, ID de Ticket o C.I. para forzar el marcaje.
            </p>
            <form onSubmit={handleManualCheckIn} className="flex gap-2">
              <input
                type="text"
                value={manualReg}
                onChange={(e) => setManualReg(e.target.value)}
                placeholder="Registro Estudiantil..."
                className="flex-1 h-12 px-4 bg-[#021814] border border-emerald-500/20 text-white rounded-xl placeholder-slate-600 outline-none text-xs font-extrabold focus:border-amber-500/40"
              />
              <button
                type="submit"
                disabled={isManualSubmitting || !manualReg.trim()}
                className="h-12 px-5 bg-emerald-950 border border-emerald-500/20 text-emerald-400 font-bold hover:bg-emerald-900 disabled:opacity-40 rounded-xl"
              >
                {isManualSubmitting ? <Loader2 className="animate-spin w-4 h-4" /> : "Marcar"}
              </button>
            </form>
          </div>

        </div>

        {/* Right Column: Scan Feed result overlay and live checked-in students list */}
        <div className="lg:col-span-7 space-y-6">

          {/* Large Overlay Feed Indicator for Scanned Student */}
          {scannedResult && (
            <div className={`p-6 border-2 rounded-[2rem] flex flex-col md:flex-row items-center gap-5 transition-all shadow-xl ${
              scannedResult.status === 'success' ? 'bg-emerald-950/50 border-emerald-400/50 text-white' :
              scannedResult.status === 'warning' ? 'bg-amber-950/50 border-amber-500/50 text-white' :
              'bg-rose-950/50 border-rose-500/50 text-white'
            }`}>
              <div className={`p-4 rounded-2xl border ${
                scannedResult.status === 'success' ? 'bg-emerald-900/40 border-emerald-400/30 text-emerald-400' :
                scannedResult.status === 'warning' ? 'bg-amber-900/40 border-amber-500/30 text-amber-400' :
                'bg-rose-900/40 border-rose-500/30 text-rose-400'
              }`}>
                {scannedResult.status === 'success' ? <UserCheck size={36}/> :
                 scannedResult.status === 'warning' ? <AlertTriangle size={36}/> :
                 <XCircle size={36}/>}
              </div>
              <div className="flex-1 text-center md:text-left space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Último Código Leído</span>
                <h4 className="text-xl font-black tracking-tight">{scannedResult.studentName}</h4>
                <div className="flex flex-wrap gap-2 items-center justify-center md:justify-start">
                  <span className="font-mono text-xs text-emerald-400 px-2 py-0.5 bg-slate-900 border border-emerald-500/10 rounded-md">Reg: {scannedResult.studentReg}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase ${scannedResult.status === 'success' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                    {scannedResult.status === 'success' ? 'Pre-Inscrito Validado ✅' : 'No Pre-Inscrito ⚠️'}
                  </span>
                </div>
                <p className="text-xs text-slate-300 pt-1 font-semibold">{scannedResult.message}</p>
              </div>
            </div>
          )}

          {/* Registered Checkins Table List */}
          <div className="p-6 md:p-8 bg-slate-950/40 backdrop-blur-md border border-emerald-500/15 rounded-[2.5rem] space-y-6">
            
            {/* Table controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Users className="text-emerald-400" size={20}/> Ingresos Confirmados
                </h3>
                <p className="text-xs text-slate-400">
                  Estudiantes registrados para esta visita técnica en tiempo real.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="px-4 h-10 border border-emerald-500/25 bg-[#021814] rounded-xl flex items-center justify-center font-black text-xs text-emerald-400">
                  TOTAL: {registros.length}
                </div>
              </div>
            </div>

            {/* Filter control */}
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre o registro..."
                className="w-full h-12 pl-12 pr-4 bg-[#021814] border border-emerald-500/20 text-white rounded-xl placeholder-slate-600 outline-none text-xs font-extrabold focus:border-amber-500/40"
              />
              <Search className="absolute left-4 top-3.5 text-slate-600" size={18} />
            </div>

            {/* Registered tables visual layout */}
            <div className="overflow-auto max-h-[420px] border border-emerald-500/10 rounded-2xl bg-slate-950/30">
              {loadingRegistros ? (
                <div className="p-12 flex flex-col items-center justify-center gap-2 text-slate-500">
                  <Loader2 className="animate-spin text-emerald-400 w-8 h-8" />
                  <p className="text-xs font-black uppercase tracking-widest">Cargando registros...</p>
                </div>
              ) : filteredRegistros.length === 0 ? (
                <div className="p-12 text-center text-slate-600">
                  <p className="text-xs font-black uppercase tracking-widest">Sin estudiantes registrados en esta visita</p>
                  <p className="text-[11px] text-slate-500 mt-1">Inicie el escaneo de QRs o registre manualmente.</p>
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#021c17] text-emerald-300 border-b border-emerald-500/15">
                      <th className="p-4 font-black uppercase tracking-widest">Hora</th>
                      <th className="p-4 font-black uppercase tracking-widest">Estudiante / Registro</th>
                      <th className="p-4 font-black uppercase tracking-widest text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-950 bg-transparent text-slate-200">
                    {filteredRegistros.map((reg, index) => {
                      const entryTime = reg.fecha_ingreso || reg.created_at || new Date().toISOString();
                      const formattedTime = new Date(entryTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                      
                      return (
                        <tr key={reg.id || `checkin-row-${index}`} className="hover:bg-emerald-950/10 transition-colors group">
                          <td className="p-4">
                            <div className="flex items-center gap-2 text-emerald-400 font-mono font-bold">
                              <Clock size={14} className="opacity-70" />
                              {formattedTime}
                            </div>
                          </td>
                          <td className="p-4">
                            <div>
                              <p className="font-extrabold text-white text-sm max-w-[200px] md:max-w-xs truncate">{reg.nombre_estudiante}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="font-mono text-[10px] text-slate-500 bg-slate-950/70 border border-slate-900 px-1.5 py-0.5 rounded">
                                  {reg.estudiante_registro}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => handleDeleteCheckIn(reg.id, reg.nombre_estudiante)}
                              className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-xl transition-all"
                              title="Anular asistencia"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
