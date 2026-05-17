
import React from 'react';
import { LayoutDashboard, BookOpen, BarChart3, Settings, Database, History, Newspaper, BrainCircuit } from 'lucide-react';

export const SESSIONS = {
  LONDON: { start: 8, end: 16 },
  NEW_YORK: { start: 13, end: 21 },
  ASIA: { start: 0, end: 9 }
};

export const NAV_ITEMS = [
  { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/' },
  { icon: <BookOpen size={20} />, label: 'Trade Journal', path: '/journal' },
  { icon: <Newspaper size={20} />, label: 'Market News', path: '/news' },
  { icon: <BrainCircuit size={20} />, label: 'AI Insights', path: '/ai-analysis' },
  { icon: <BarChart3 size={20} />, label: 'Advanced Analytics', path: '/analytics' },
  { icon: <Database size={20} />, label: 'Import Trades', path: '/import' },
  { icon: <History size={20} />, label: 'Accounts', path: '/accounts' },
  { icon: <Settings size={20} />, label: 'Settings', path: '/settings' },
];

export const EMOTION_COLORS = {
  Neutral: 'bg-slate-500',
  Confident: 'bg-emerald-500',
  Anxious: 'bg-amber-500',
  FOMO: 'bg-orange-500',
  Frustrated: 'bg-rose-500',
  Greedy: 'bg-purple-500',
};
