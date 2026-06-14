/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Student {
  id: string; // Registro
  name: string;
  level: number;
  id_ticket?: string;
  registro_universitario?: string;
}

export interface DatabaseStudent {
  registro: string;
  nombre: string;
  carrera: string;
  semestre_activo: string;
  ci: string;
  obs: string;
  lugar: string;
  nivel: number;
  niv?: number; // Database field for level
  correo?: string; // New field for complementary data
  telefono?: string;
  celular?: string;
  isExternal?: boolean;
  id_ticket?: string;
  registro_universitario?: string;
  cedula_identidad?: string;
  nombre_completo?: string;
  nivel_semestre?: number | string;
}

export interface TechnicalVisit {
  id: string;
  nombre: string;
  descripcion: string;
  fecha: string;
  horario?: string;
  cupos_max: number;
  min_nivel: number;
  requiereSeguro?: boolean;
}

export interface Registration {
  id?: string;
  estudiante_registro: string;
  visita_id: string;
  fecha_inscripcion?: string;
  nombre_estudiante?: string;
  nombre_visita?: string;
  // New details
  tiene_seguro?: boolean;
  comprobante_seguro_url?: string;
  tiene_epp?: boolean;
  problema_salud?: string;
  contacto_referencia?: string;
  estado?: string;
  motivo_anulacion?: string;
}

export interface CompanyRequirement {
  name: string;
  minLevel: number;
  description: string;
}

export const VISITS_REQUIREMENTS: CompanyRequirement[] = [
  {
    name: "Empresa Minera X",
    minLevel: 7,
    description: "7mo semestre en adelante"
  },
  {
    name: "Planta Fotovoltaica Y",
    minLevel: 4,
    description: "4to semestre en adelante"
  },
  {
    name: "Taller de Tornería Z",
    minLevel: 2,
    description: "2do semestre en adelante"
  }
];
