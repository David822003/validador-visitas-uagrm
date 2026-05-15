/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DatabaseStudent } from '../types';

/**
 * Parses the UAGRM student report text format into structured data.
 * Handles different formats by detecting column patterns.
 */
/**
 * Parses the UAGRM student report text format into structured data.
 * Handles different formats by detecting column patterns.
 */
export function parseStudentReport(text: string): DatabaseStudent[] {
  const lines = text.split('\n');
  const students: DatabaseStudent[] = [];

  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Pattern: Number followed by 7-9 digit registration
    if (/^\d+\s+\d{7,9}/.test(trimmedLine)) {
      const parts = trimmedLine.split(/\s{2,}/);
      
      if (parts.length >= 4) {
        const registro = parts[1]?.trim() || '';
        const nombre = parts[2]?.trim() || '';
        
        let level = 0;
        let carrera = '';
        let semestre_activo = '';
        let ci = '';
        let obs = '';
        let lugar = '';

        const levelMatch = trimmedLine.match(/\(\s*(\d+)\s*\)/);
        if (levelMatch) {
          level = parseInt(levelMatch[1], 10);
          lugar = parts[parts.length - 1]; // Direction is usually at the end
        }

        if (parts.length >= 8) {
          const periodPart = parts.find(p => /^\d-\d{4}$/.test(p));
          if (periodPart) {
            semestre_activo = periodPart;
            carrera = parts[3] || '';
            level = level || parseInt(parts[5], 10) || 0;
            ci = parts[6] || '';
            obs = parts[7] || '';
            lugar = parts[8] || '';
          }
        }

        students.push({
          registro,
          nombre,
          carrera,
          semestre_activo,
          nivel: level,
          ci,
          obs,
          lugar
        });
      }
    }
  }

  return students;
}

/**
 * Parses the complementary data format focusing on Registro, Nombre and Correo.
 */
export function parseComplementReport(text: string): DatabaseStudent[] {
  const lines = text.split('\n');
  const students: DatabaseStudent[] = [];

  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // 1. Identify Registro (8-9 digits)
    const registroMatch = trimmedLine.match(/(\s|^)(\d{7,9})(\s|$)/);
    if (!registroMatch) continue;
    
    const registro = registroMatch[2].trim();
    
    // 2. Identify email
    const emailMatch = trimmedLine.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const correo = emailMatch ? emailMatch[0].toLowerCase() : '';

    // 2.1 Identify phone number (8 digits starting with 6 or 7 usually in Bolivia)
    const phoneMatch = trimmedLine.match(/(\s|^)([67]\d{7})(\s|$)/);
    const celular = phoneMatch ? phoneMatch[2].trim() : '';
    
    // 3. Extract Name (All-caps between registro and next significant data)
    // We look for everything after registro that contains uppercase letters and spaces
    let nombre = '';
    const afterRegistro = trimmedLine.substring(trimmedLine.indexOf(registro) + registro.length);
    // Regex for uppercase Spanish letters and spaces
    const nameMatch = afterRegistro.match(/^\s+([A-ZÁÉÍÓÚÑ\s]+?)\s{2,}/) || afterRegistro.match(/^\s+([A-ZÁÉÍÓÚÑ\s]+)/);
    
    if (nameMatch) {
      nombre = nameMatch[1].trim();
      // Clean up common numbering or noise at start if it leaked in
      nombre = nombre.replace(/^[^A-ZÁÉÍÓÚÑ]+/, '');
    }

    if (registro && nombre) {
      students.push({
        registro,
        nombre,
        correo,
        celular,
        carrera: '',
        semestre_activo: '',
        nivel: 0,
        ci: '',
        obs: '',
        lugar: ''
      });
    }
  }

  return students;
}
