import { COLORS } from './colors';

export function getTileBg(subject: string): string {
  const lower = subject.toLowerCase();
  if (lower.includes('anat')) return COLORS.tileAnatomy;
  if (lower.includes('phys')) return COLORS.tilePhysics;
  if (lower.includes('chem')) return COLORS.tileChemistry;
  if (lower.includes('bot')) return COLORS.tileBotany;
  if (lower.includes('zoo')) return COLORS.tileZoology;
  if (lower.includes('pyq') || lower.includes('prev')) return COLORS.tilePYQ;
  if (subject === 'Biology') return COLORS.tileBotany;
  if (subject === 'Physics') return COLORS.tilePhysics;
  if (subject === 'Chemistry') return COLORS.tileChemistry;
  return COLORS.tileAnatomy;
}

export function getGlyphColor(subject: string): string {
  const lower = subject.toLowerCase();
  if (lower.includes('anat')) return COLORS.glyphAnatomy;
  if (lower.includes('phys')) return COLORS.glyphPhysics;
  if (lower.includes('chem')) return COLORS.glyphChemistry;
  if (lower.includes('bot')) return COLORS.glyphBotany;
  if (lower.includes('zoo')) return COLORS.glyphZoology;
  if (lower.includes('pyq') || lower.includes('prev')) return COLORS.glyphPYQ;
  if (subject === 'Biology') return COLORS.glyphBotany;
  if (subject === 'Physics') return COLORS.glyphPhysics;
  if (subject === 'Chemistry') return COLORS.glyphChemistry;
  return COLORS.glyphAnatomy;
}

export function getGlyphLetter(subject: string): string {
  const lower = subject.toLowerCase();
  if (lower.includes('anat')) return 'A';
  if (lower.includes('phys')) return 'P';
  if (lower.includes('chem')) return 'C';
  if (lower.includes('bot')) return 'B';
  if (lower.includes('zoo')) return 'Z';
  if (lower.includes('pyq') || lower.includes('prev')) return 'PY';
  if (subject === 'Biology') return 'B';
  if (subject === 'Physics') return 'P';
  if (subject === 'Chemistry') return 'C';
  if (subject === 'Practice') return 'Que';
  return subject.charAt(0).toUpperCase();
}