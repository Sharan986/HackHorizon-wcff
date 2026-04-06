/**
 * Medora Design System
 * Original light color scheme + Glassmorphism effects
 */

// ─── Original Color Palette (unchanged) ────────────────────
export const COLORS = {
  background: '#F4F6F7',
  white: '#FFFFFF',
  textPrimary: '#1B1E22',
  textSecondary: '#7A8188',
  border: '#E6EBF0',
  accent1: '#EAF1F6',   // Blue tint
  accent2: '#E7F3EA',   // Green tint
  accent3: '#EEEAF7',   // Purple tint
  black: '#000000',
};

// ─── Glassmorphism Card Styles ─────────────────────────────
export const glassCard = {
  backgroundColor: 'rgba(255,255,255,0.55)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.75)',
  shadowColor: '#8BA4BD',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.12,
  shadowRadius: 24,
  // elevation removed for Android glassmorphism transparency
};

export const glassCardSolid = {
  backgroundColor: 'rgba(255,255,255,0.72)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.85)',
  shadowColor: '#8BA4BD',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.1,
  shadowRadius: 20,
  // elevation removed for Android glassmorphism transparency
};

export const glassPill = {
  backgroundColor: 'rgba(255,255,255,0.5)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.7)',
};

export const glassTabBar = {
  backgroundColor: 'rgba(255,255,255,0.9)',
  borderRadius: 35,
  position: 'absolute' as const,
  bottom: 20,
  left: 20,
  right: 20,
  height: 64,
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.8)',
  borderTopWidth: 1,
  borderTopColor: 'rgba(255,255,255,0.8)',
  shadowColor: '#8BA4BD',
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.15,
  shadowRadius: 30,
};

export const glassInput = {
  backgroundColor: 'rgba(244,246,247,0.7)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.6)',
};

export const buttonShadow = {
  shadowColor: '#1B1E22',
  shadowOpacity: 0.15,
  shadowRadius: 20,
  elevation: 10,
  shadowOffset: { width: 0, height: 6 },
};
