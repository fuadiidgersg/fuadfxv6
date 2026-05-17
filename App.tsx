
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  TrendingUp, TrendingDown, Wallet, Plus, 
  ChevronRight, LogOut, Menu, X, 
  LayoutDashboard, BookOpen, BarChart3, Database, Settings,
  Upload, Zap, Activity, PieChart, Info, Calendar as CalendarIcon, Filter,
  ArrowRight, Target, BrainCircuit, ShieldCheck, Globe, CreditCard,
  User, Bell, Search, History, PlusCircle, Clock, Wifi, Signal, Battery, Link2, Key, Newspaper, CalendarDays, ExternalLink, RefreshCw, Loader2, Sparkles, MessageSquare, AlertTriangle, Lightbulb, FileSpreadsheet, Download, FilterX, Calendar,
  Trophy, AlertCircle, Eye, Trash2, Clock3, Share2, Bookmark
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { GoogleGenAI, Type } from "@google/genai";
import { TradingAccount, Trade, DashboardStats, TradeType, Emotion, AccountCategory, TradeStatus, CalendarEvent, MarketNews } from './types';
import { NAV_ITEMS } from './constants';
import { calculateStats, getEquityCurve, getStatsBySymbol, filterTradesByTimeframe, type SymbolPnlRow } from './services/analyticsService';
import { parseMT5CSV, parseMT5Excel } from './services/parserService';

// --- UI Components ---

const Card: React.FC<{ children?: React.ReactNode; className?: string; noPadding?: boolean; onClick?: () => void }> = ({ children, className = "", noPadding = false, onClick }) => (
  <div onClick={onClick} className={`fp-card ${noPadding ? '' : 'p-5'} ${className}`}>
    {children}
  </div>
);

const Badge = ({ children, variant = "default" }: { children?: React.ReactNode, variant?: "default" | "success" | "danger" | "info" | "warning" | "prop" | "live" | "high" | "medium" }) => {
  const variants = {
    default: "bg-[#1c2128] text-slate-400",
    success: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    danger: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
    info: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    warning: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    prop: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
    live: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse",
    high: "bg-rose-600/20 text-rose-500 border border-rose-500/30",
    medium: "bg-amber-600/20 text-amber-500 border border-amber-500/30",
  };
  return (
    <span className={`${variants[variant]} text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider`}>
      {children}
    </span>
  );
};

const MetricBox = ({ label, value, subtext, icon: Icon, trend }: { label: string, value: string, subtext: string, icon: any, trend?: string }) => (
  <Card className="flex flex-col justify-between h-full bg-[#0d1117] border-[#1c2128] p-5">
    <div className="flex justify-between items-start mb-3">
      <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
        <Icon size={20} />
      </div>
      {trend && <span className={`text-[10px] font-bold ${trend.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'}`}>{trend}</span>}
    </div>
    <div>
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{label}</p>
      <h3 className="text-xl font-bold text-white tracking-tight">{value}</h3>
      <p className="text-[10px] text-slate-600 font-medium">{subtext}</p>
    </div>
  </Card>
);

// --- Market News Page Components ---

// Fix: Define NewsCard with React.FC to correctly handle the 'key' prop when used in lists.
const NewsCard: React.FC<{ news: MarketNews }> = ({ news }) => (
  <Card className="flex flex-col h-full hover:border-blue-500/30 group transition-all">
    <div className="flex justify-between items-start mb-4">
      <div className="flex gap-2">
        <Badge variant={news.impact.toLowerCase() as any}>{news.impact}</Badge>
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{news.category}</span>
      </div>
      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="text-slate-600 hover:text-white"><Bookmark size={14} /></button>
        <button className="text-slate-600 hover:text-white"><Share2 size={14} /></button>
      </div>
    </div>
    <h3 className="text-[15px] font-black text-white leading-tight mb-3 group-hover:text-blue-400 transition-colors">
      {news.title}
    </h3>
    <p className="text-[12px] text-slate-500 leading-relaxed mb-6 line-clamp-3">
      {news.summary}
    </p>
    <div className="mt-auto pt-4 border-t border-slate-800/60 flex justify-between items-center">
      <div className="flex flex-col">
        <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{news.source}</span>
        <div className="flex items-center gap-1.5 text-[9px] text-slate-600 font-bold uppercase mt-0.5">
          <Clock3 size={10} />
          {news.time}
        </div>
      </div>
      <a 
        href={news.url} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="p-2 rounded-lg bg-slate-900 text-slate-400 hover:text-white hover:bg-blue-600/20 transition-all"
      >
        <ExternalLink size={14} />
      </a>
    </div>
  </Card>
);

const MarketNewsPage = () => {
  const [newsList, setNewsList] = useState<MarketNews[]>([]);
  // Fix: Adjusted sources state type to match the properties actually used (uri, title).
  const [sources, setSources] = useState<{uri: string, title: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const fetchLiveNews = useCallback(async () => {
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: "Provide the 8 latest high-impact news stories for Forex, Gold (XAUUSD), and Global Equity indices (US30, NAS100). For each news item, provide: TITLE, SUMMARY, SOURCE, TIME_AGO, IMPACT (High/Medium/Low), and CATEGORY (Forex/Metals/Indices). Use real-time data.",
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                summary: { type: Type.STRING },
                source: { type: Type.STRING },
                time: { type: Type.STRING },
                impact: { type: Type.STRING },
                category: { type: Type.STRING },
                url: { type: Type.STRING }
              },
              required: ["title", "summary", "source", "time", "impact", "category"]
            }
          }
        },
      });

      // Correctly access response.text property
      const text = response.text || "[]";
      const parsedNews = JSON.parse(text);
      
      // Extract grounding sources: the tool returns [{web: {uri, title}}, ...]
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const webSources = groundingChunks.filter((c: any) => c.web).map((c: any) => c.web);
      
      // Add local IDs and map URLs if missing from grounding
      const enrichedNews = parsedNews.map((n: any, idx: number) => ({
        ...n,
        id: crypto.randomUUID(),
        url: n.url || (webSources.length > 0 ? webSources[idx % webSources.length]?.uri : '#')
      }));

      setNewsList(enrichedNews);
      setSources(webSources);
      setLastRefreshed(new Date());
    } catch (e) {
      console.error("Failed to fetch live news", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveNews();
    const interval = setInterval(fetchLiveNews, 300000); // Refresh every 5 mins
    return () => clearInterval(interval);
  }, [fetchLiveNews]);

  return (
    <div className="space-y-8 animate-fade-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-5">
        <div>
           <div className="flex items-center gap-3 mb-1.5">
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Market Pulse</h2>
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded text-[9px] font-black uppercase tracking-[0.1em]">
                 <div className="h-1.5 w-1.5 bg-rose-500 rounded-full animate-pulse" />
                 Live Feed
              </div>
           </div>
           <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">Global Institutional News Matrix</p>
        </div>
        <div className="flex items-center gap-4">
           {lastRefreshed && (
             <div className="text-right hidden sm:block">
                <p className="text-[9px] font-black text-slate-600 uppercase mb-0.5">Last Sync</p>
                <p className="text-[11px] font-bold text-slate-400 font-mono">
                  {lastRefreshed.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                </p>
             </div>
           )}
           <button 
             onClick={fetchLiveNews} 
             disabled={loading}
             className="h-10 px-5 rounded-xl bg-[#0d1117] border border-slate-800 hover:border-blue-500/40 text-slate-300 hover:text-white transition-all flex items-center gap-2"
           >
             <RefreshCw size={16} className={loading ? 'animate-spin text-blue-500' : ''} />
             <span className="text-[10px] font-black uppercase tracking-widest">{loading ? 'Syncing...' : 'Sync Feed'}</span>
           </button>
        </div>
      </div>

      {loading && newsList.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="h-64 animate-pulse border-slate-800/50 flex flex-col justify-between">
              <div className="h-4 w-1/3 bg-slate-800 rounded mb-4" />
              <div className="space-y-2">
                <div className="h-3 w-full bg-slate-800 rounded" />
                <div className="h-3 w-full bg-slate-800 rounded" />
                <div className="h-3 w-2/3 bg-slate-800 rounded" />
              </div>
              <div className="h-8 w-full bg-slate-900 rounded-lg mt-auto" />
            </Card>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {newsList.map(news => <NewsCard key={news.id} news={news} />)}
          </div>

          <Card className="border-blue-500/10 bg-blue-500/[0.01] p-6">
            <div className="flex items-center gap-3 mb-6">
              <Globe className="text-blue-500" size={18} />
              <h4 className="text-[11px] font-black text-white uppercase tracking-widest">Grounding Verification</h4>
            </div>
            <div className="flex flex-wrap gap-4">
              {sources.length > 0 ? sources.map((s, idx) => (
                <a 
                  key={idx} 
                  href={s.uri} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center gap-2 px-3 py-1.5 bg-[#06080f] border border-slate-800 rounded-lg text-[10px] font-bold text-slate-500 hover:text-blue-400 hover:border-blue-500/30 transition-all"
                >
                  <Link2 size={12} />
                  {s.title || 'Institutional Source'}
                </a>
              )) : (
                <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest italic">Verification trace currently encrypted.</p>
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

// --- Other Page Components ---

const PropFirmObjectiveTracker = ({ account, stats }: { account: TradingAccount, stats: DashboardStats }) => {
  if (account.category !== AccountCategory.PROP_FIRM) return null;

  const profitProgress = account.profitTarget ? Math.min(100, (stats.netProfit / account.profitTarget) * 100) : 0;
  const drawdownUsage = account.maxDrawdownLimit ? Math.min(100, (stats.maxDrawdown / account.maxDrawdownLimit) * 100) : 0;

  return (
    <Card className="border-blue-500/20 bg-blue-500/[0.02]">
      <div className="flex items-center gap-3 mb-6">
        <Trophy className="text-blue-500" size={20} />
        <h4 className="text-[11px] font-black text-white uppercase tracking-widest">Challenge Protocol</h4>
      </div>
      <div className="space-y-6">
        {account.profitTarget && (
          <div>
            <div className="flex justify-between items-end mb-2">
              <div>
                <p className="text-[9px] font-black text-slate-600 uppercase mb-0.5">Objective Goal</p>
                <p className="text-[13px] font-black text-white font-mono">${stats.netProfit.toLocaleString()} / ${account.profitTarget.toLocaleString()}</p>
              </div>
              <span className="text-[11px] font-black text-emerald-400">{profitProgress.toFixed(1)}%</span>
            </div>
            <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${Math.max(2, profitProgress)}%` }} />
            </div>
          </div>
        )}
        {account.maxDrawdownLimit && (
          <div>
            <div className="flex justify-between items-end mb-2">
              <div>
                <p className="text-[9px] font-black text-slate-600 uppercase mb-0.5">Max Drawdown Limit</p>
                <p className="text-[13px] font-black text-white font-mono">${stats.maxDrawdown.toFixed(0)} / ${account.maxDrawdownLimit.toLocaleString()}</p>
              </div>
              <span className={`text-[11px] font-black ${drawdownUsage > 80 ? 'text-rose-500' : 'text-slate-400'}`}>{drawdownUsage.toFixed(1)}% usage</span>
            </div>
            <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
              <div className="h-full bg-rose-500 transition-all duration-500" style={{ width: `${Math.max(2, drawdownUsage)}%` }} />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

const TradeCalendar = ({ trades, onSelectDate, selectedDate }: { trades: Trade[], onSelectDate: (date: Date | null) => void, selectedDate: Date | null }) => {
  const [currentViewDate, setCurrentViewDate] = useState(new Date());
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  
  const daysInMonth = new Date(currentViewDate.getFullYear(), currentViewDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentViewDate.getFullYear(), currentViewDate.getMonth(), 1).getDay();
  
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);
  
  const tradesByDay = useMemo(() => {
    const map: Record<number, { 
      trades: Trade[], 
      profit: number, 
      wins: number, 
      losses: number, 
      symbols: Set<string>,
      maxDD: number
    }> = {};

    trades.forEach(t => {
      const d = new Date(t.closeTime);
      if (d.getMonth() === currentViewDate.getMonth() && d.getFullYear() === currentViewDate.getFullYear()) {
        const day = d.getDate();
        if (!map[day]) {
          map[day] = { trades: [], profit: 0, wins: 0, losses: 0, symbols: new Set(), maxDD: 0 };
        }
        map[day].trades.push(t);
        map[day].profit += t.profit;
        map[day].symbols.add(t.symbol);
        if (t.profit > 0) map[day].wins++;
        else map[day].losses++;
        if (t.profit < map[day].maxDD) map[day].maxDD = t.profit;
      }
    });
    return map;
  }, [trades, currentViewDate]);

  return (
    <Card className="p-5">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
           <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg"><CalendarDays size={18} /></div>
           <div>
             <h4 className="text-[11px] font-black text-white uppercase tracking-widest">Performance Heatmap</h4>
             <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Historical trace</p>
           </div>
        </div>
        <div className="flex items-center gap-3">
           <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">{currentViewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
           <div className="flex gap-1">
             <button onClick={() => setCurrentViewDate(new Date(currentViewDate.setMonth(currentViewDate.getMonth() - 1)))} className="p-1.5 hover:bg-slate-800 rounded-md text-slate-500 transition-colors"><ChevronRight size={14} className="rotate-180" /></button>
             <button onClick={() => setCurrentViewDate(new Date())} className="p-1.5 hover:bg-slate-800 rounded-md text-slate-500 transition-colors"><RefreshCw size={14} /></button>
             <button onClick={() => setCurrentViewDate(new Date(currentViewDate.setMonth(currentViewDate.getMonth() + 1)))} className="p-1.5 hover:bg-slate-800 rounded-md text-slate-500 transition-colors"><ChevronRight size={14} /></button>
           </div>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (<div key={d} className="text-center text-[9px] font-black text-slate-600 uppercase mb-2 tracking-tighter">{d}</div>))}
        {blanks.map(b => <div key={`b-${b}`} className="aspect-[4/3] bg-transparent" />)}
        {days.map(d => {
          const dayData = tradesByDay[d];
          const hasTrades = dayData && dayData.trades.length > 0;
          const isPositive = hasTrades && dayData.profit >= 0;
          const isSelected = selectedDate?.getDate() === d && selectedDate?.getMonth() === currentViewDate.getMonth() && selectedDate?.getFullYear() === currentViewDate.getFullYear();
          const isHovered = hoveredDay === d;

          let bgColor = 'bg-slate-900/10';
          let borderColor = 'border-slate-800/40';
          let textColor = 'text-slate-600';

          if (hasTrades) {
            bgColor = isPositive ? 'bg-emerald-500/[0.08]' : 'bg-rose-500/[0.08]';
            borderColor = isPositive ? 'border-emerald-500/20' : 'border-rose-500/20';
            textColor = isPositive ? 'text-emerald-400' : 'text-rose-400';
          }
          if (isSelected) {
            borderColor = 'border-blue-500/60 scale-[1.02] z-10 shadow-lg';
            bgColor = isPositive ? 'bg-emerald-500/20' : (hasTrades ? 'bg-rose-500/20' : 'bg-blue-600/10');
            textColor = 'text-white';
          }

          return (
            <div key={d} className="relative">
              <button 
                onMouseEnter={() => setHoveredDay(d)}
                onMouseLeave={() => setHoveredDay(null)}
                onClick={() => onSelectDate(new Date(currentViewDate.getFullYear(), currentViewDate.getMonth(), d))}
                className={`w-full aspect-[4/3] rounded-lg border transition-all p-1.5 flex flex-col justify-between text-left ${bgColor} ${borderColor} hover:z-20 hover:scale-[1.02] hover:border-blue-500/40`}
              >
                <div className="flex justify-between items-start w-full">
                  <span className={`text-[10px] font-black ${isSelected ? 'text-white' : (hasTrades ? 'text-slate-300' : 'text-slate-600')}`}>{d}</span>
                  {hasTrades && (<span className="text-[8px] font-black text-slate-500 uppercase">{dayData.wins}W / {dayData.losses}L</span>)}
                </div>
                {hasTrades && (<div className={`font-mono font-black leading-none mb-0.5 truncate w-full text-[9px] sm:text-[11px] md:text-[12px] ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>{isPositive ? '+' : '-'}${Math.abs(Math.round(dayData.profit))}</div>)}
              </button>
              {isHovered && hasTrades && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 z-[100] bg-[#0d1117] border border-[#1c2128] rounded-xl p-3 shadow-2xl animate-fade-up pointer-events-none">
                  <h5 className="text-[10px] font-black text-white uppercase tracking-widest border-b border-slate-800 pb-2 mb-2">{currentViewDate.toLocaleString('default', { month: 'short' })} {d} Trace Audit</h5>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center"><span className="text-[9px] font-bold text-slate-500 uppercase">Executions</span><span className="text-[10px] font-black text-white font-mono">{dayData.trades.length}</span></div>
                    <div className="flex justify-between items-center"><span className="text-[9px] font-bold text-slate-500 uppercase">Win Rate</span><span className="text-[10px] font-black text-emerald-400 font-mono">{((dayData.wins / dayData.trades.length) * 100).toFixed(0)}%</span></div>
                    <div className="flex justify-between items-center"><span className="text-[9px] font-bold text-slate-500 uppercase">Risk Hit</span><span className="text-[10px] font-black text-rose-400 font-mono">-${Math.abs(dayData.maxDD).toFixed(0)}</span></div>
                    <div className="pt-2 border-t border-slate-800">
                      <p className="text-[8px] font-black text-slate-600 uppercase mb-1">Pairs</p>
                      <div className="flex flex-wrap gap-1">{Array.from(dayData.symbols).map(s => (<span key={s} className="text-[8px] font-black bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded border border-slate-800">{s}</span>))}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
};

// --- Dashboard Page ---

const DashboardPage = ({ trades, stats, account }: { trades: Trade[], stats: DashboardStats, account: TradingAccount }) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [timeframe, setTimeframe] = useState<'1W' | '1M' | '3M' | 'ALL'>('ALL');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'WINS' | 'LOSSES' | 'OPEN'>('ALL');
  const [assetFilter, setAssetFilter] = useState('ALL');

  const assets = useMemo(() => ['ALL', ...Array.from(new Set(trades.map(t => t.symbol)))], [trades]);

  const filteredBlotterTrades = useMemo(() => {
    return trades.filter(t => {
      const matchesSearch = t.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || t.ticket.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || (statusFilter === 'WINS' && t.profit > 0) || (statusFilter === 'LOSSES' && t.profit < 0) || (statusFilter === 'OPEN' && t.status === TradeStatus.OPEN);
      const matchesAsset = assetFilter === 'ALL' || t.symbol === assetFilter;
      return matchesSearch && matchesStatus && matchesAsset;
    }).sort((a,b) => new Date(b.closeTime).getTime() - new Date(a.closeTime).getTime());
  }, [trades, searchQuery, statusFilter, assetFilter]);

  const latestTrades = useMemo(() => filteredBlotterTrades.slice(0, 10), [filteredBlotterTrades]);

  const selectedDateTrades = useMemo(() => {
    if (!selectedDate) return [];
    return trades.filter(t => {
      const d = new Date(t.closeTime);
      return d.getDate() === selectedDate.getDate() && d.getMonth() === selectedDate.getMonth() && d.getFullYear() === selectedDate.getFullYear();
    });
  }, [trades, selectedDate]);

  const equityData = useMemo(
    () => getEquityCurve(filterTradesByTimeframe(trades, timeframe), account.initialBalance),
    [trades, timeframe, account.initialBalance]
  );

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-5">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
             <h2 className="text-2xl font-black text-white tracking-tighter uppercase">{account.name}</h2>
             <Badge variant={account.category === AccountCategory.PROP_FIRM ? "prop" : "info"}>{account.category}</Badge>
             <Badge variant="success">{account.type}</Badge>
          </div>
          <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em]">
             <span>Account: <span className="text-slate-300">#{account.accountNumber}</span></span>
             <div className="h-2.5 w-px bg-slate-800" />
             <span>Platform: <span className="text-slate-300">{account.broker}</span></span>
          </div>
        </div>
        <div className="flex items-center gap-5">
           <div className="flex gap-1">
              <div className="text-right px-4 border-r border-slate-800">
                 <p className="text-[9px] font-black text-slate-600 uppercase mb-0.5">Initial</p>
                 <p className="text-base font-black text-slate-400 font-mono">${account.initialBalance.toLocaleString()}</p>
              </div>
              <div className="text-right px-4">
                 <p className="text-[9px] font-black text-slate-600 uppercase mb-0.5">Balance</p>
                 <p className="text-xl font-black text-blue-500 font-mono tracking-tighter">${(account.initialBalance + stats.netProfit).toLocaleString()}</p>
              </div>
           </div>
           <button className="h-10 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-black uppercase tracking-[0.1em] transition-all border-b-4 border-blue-800"><PlusCircle size={16} className="inline mr-2" /> New Trade</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className={`${account.category === AccountCategory.PROP_FIRM ? 'lg:col-span-3' : 'lg:col-span-4'} grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4`}>
          <MetricBox label="Profit Factor" value={stats.profitFactor.toFixed(2)} subtext="Yield Efficiency" icon={Zap} />
          <MetricBox label="Win Rate" value={`${stats.winRate.toFixed(1)}%`} subtext="Accuracy" icon={Activity} />
          <MetricBox label="Expectancy" value={`$${stats.expectancy.toFixed(2)}`} subtext="Avg Payoff" icon={PieChart} />
          <MetricBox label="Max Drawdown" value={`${stats.maxDrawdownPercent.toFixed(2)}%`} subtext="Exposure" icon={ShieldCheck} />
        </div>
        {account.category === AccountCategory.PROP_FIRM && <PropFirmObjectiveTracker account={account} stats={stats} />}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <Card className="lg:col-span-8 h-[400px] p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-sm font-black text-slate-200 uppercase tracking-wider">Equity Curve</h4>
            <div className="flex gap-1 bg-slate-900/50 p-0.5 rounded-lg border border-slate-800">
              {(['1W', '1M', '3M', 'ALL'] as const).map(tf => (<button key={tf} onClick={() => setTimeframe(tf)} className={`px-3 py-1 text-[9px] font-black rounded-md transition-all uppercase ${timeframe === tf ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>{tf}</button>))}
            </div>
          </div>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={equityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1c2128" vertical={false} />
                <XAxis dataKey="name" hide />
                <YAxis stroke="#484f58" fontSize={10} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(1)}k`} domain={['auto', 'auto']} />
                <Tooltip contentStyle={{ backgroundColor: '#0d1117', border: '1px solid #30363d', borderRadius: '8px' }} itemStyle={{ color: '#3b82f6', fontSize: '11px', fontWeight: 'bold' }} />
                <Area type="monotone" dataKey="balance" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={0.1} fill="#3b82f6" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div className="lg:col-span-4 space-y-4">
           <Card className="p-6 h-[190px] flex flex-col justify-between">
              <div>
                <h4 className="text-[10px] font-black uppercase text-slate-600 tracking-widest mb-4">Risk Compliance</h4>
                <div className="flex items-center gap-3">
                   <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500"><ShieldCheck size={20} /></div>
                   <div>
                      <p className="text-[13px] font-black text-white">Nominal Risk Status</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Parameters within verified range</p>
                   </div>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-800/60">
                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Neural Status: <span className="text-emerald-400">Stable</span></span>
              </div>
           </Card>
           <Card className="p-6 h-[190px] bg-gradient-to-br from-blue-600/[0.05] to-transparent border-blue-500/10">
              <h4 className="text-[10px] font-black uppercase text-slate-600 tracking-widest mb-4">Alpha Sentinel</h4>
              <p className="text-[13px] text-slate-300 leading-relaxed font-semibold">High conviction execution identified on <span className="text-emerald-400 font-black">XAUUSD</span>. London sync verified.</p>
           </Card>
        </div>
      </div>

      <Card noPadding className="overflow-hidden border-[#1c2128]">
        <div className="px-6 py-4 border-b border-slate-800 bg-[#0d1117] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3"><div className="h-2.5 w-2.5 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_#3b82f6]" /><h4 className="text-[11px] font-black text-slate-200 uppercase tracking-widest">Execution Blotter</h4></div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative group">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within:text-blue-500 transition-colors" size={12} />
               <input type="text" placeholder="Trace Symbol..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="bg-[#161b22]/60 border border-slate-800/60 rounded-lg py-1.5 pl-8 pr-3 text-[10px] font-bold text-slate-300 w-32 focus:outline-none focus:ring-1 focus:ring-blue-500/20" />
            </div>
            <select value={assetFilter} onChange={e => setAssetFilter(e.target.value)} className="bg-[#161b22]/60 border border-slate-800/60 rounded-lg py-1.5 px-3 text-[10px] font-bold text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500/20 appearance-none min-w-[80px]">
              {assets.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="bg-[#161b22]/60 border border-slate-800/60 rounded-lg py-1.5 px-3 text-[10px] font-bold text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500/20 appearance-none min-w-[80px]">
              <option value="ALL">STATUS: ALL</option>
              <option value="WINS">WINS ONLY</option>
              <option value="LOSSES">LOSSES ONLY</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left table-fixed min-w-[800px]">
            <thead>
              <tr className="text-slate-500 font-black text-[10px] uppercase tracking-[0.15em] border-b border-slate-800 bg-[#090c12]">
                <th className="px-6 py-4 w-[20%]">Symbol</th><th className="px-6 py-4 w-[12%]">Dir</th><th className="px-6 py-4 w-[12%]">Lot</th><th className="px-6 py-4 w-[18%]">Entry</th><th className="px-6 py-4 w-[18%]">Exit</th><th className="px-6 py-4 w-[20%] text-right">P/L</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/30">
              {latestTrades.length > 0 ? latestTrades.map((t) => (
                <tr key={t.id} className="hover:bg-slate-900/40 transition-all cursor-default group">
                  <td className="px-6 py-4"><div className="flex flex-col"><span className="text-[13px] font-black text-white uppercase tracking-tight">{t.symbol}</span><span className="text-[10px] text-slate-600 font-mono mt-0.5 font-bold">#{t.ticket.slice(-8)}</span></div></td>
                  <td className="px-6 py-4"><Badge variant={t.type === TradeType.BUY ? 'success' : 'danger'}>{t.type}</Badge></td>
                  <td className="px-6 py-4 text-[12px] font-mono text-slate-400 font-black">{t.lots.toFixed(2)}</td>
                  <td className="px-6 py-4 text-[12px] font-mono text-slate-400 font-black">{t.entryPrice.toFixed(2)}</td>
                  <td className="px-6 py-4 text-[12px] font-mono text-slate-400 font-black">{t.exitPrice.toFixed(2)}</td>
                  <td className={`px-6 py-4 text-right font-black font-mono text-[14px] ${t.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{t.profit >= 0 ? '+' : '-'}${Math.abs(t.profit).toFixed(2)}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-700 font-black uppercase text-[10px] tracking-widest">No matching executions in current filter range.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <TradeCalendar trades={trades} onSelectDate={setSelectedDate} selectedDate={selectedDate} />

      {selectedDate && (
        <Card noPadding className="overflow-hidden border-blue-500/30 bg-blue-500/[0.02] animate-fade-up">
           <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-[#0d1117]">
             <div className="flex items-center gap-4">
               <Target className="text-blue-500" size={24} />
               <h3 className="text-base font-black text-white uppercase tracking-tighter">Day Trace: {selectedDate.toDateString()}</h3>
             </div>
             <button onClick={() => setSelectedDate(null)} className="p-2 text-slate-500 hover:text-white"><X size={20} /></button>
           </div>
           <div className="overflow-x-auto">
             <table className="w-full text-left table-fixed min-w-[700px]">
               <thead>
                 <tr className="text-slate-500 font-black text-[10px] uppercase border-b border-slate-800 bg-[#090c12]">
                   <th className="px-6 py-4">Symbol</th><th className="px-6 py-4">Bias</th><th className="px-6 py-4">P/L</th><th className="px-6 py-4 text-right">Notes</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-800/30">
                 {selectedDateTrades.map(t => (
                   <tr key={t.id} className="hover:bg-slate-900/60">
                     <td className="px-6 py-4 text-[12px] font-black text-white uppercase">{t.symbol}</td>
                     <td className="px-6 py-4"><Badge variant={t.type === TradeType.BUY ? 'success' : 'danger'}>{t.type}</Badge></td>
                     <td className={`px-6 py-4 text-[13px] font-mono font-black ${t.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>${t.profit.toFixed(2)}</td>
                     <td className="px-6 py-4 text-[10px] text-slate-500 italic text-right truncate">{t.notes || 'No log entry.'}</td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        </Card>
      )}
    </div>
  );
};

// --- Accounts Page ---

const AddAccountModal = ({ isOpen, onClose, onAdd }: { isOpen: boolean, onClose: () => void, onAdd: (acc: TradingAccount) => void }) => {
  const [formData, setFormData] = useState({
    name: '', broker: '', accountNumber: '', type: 'Evaluation', category: AccountCategory.PROP_FIRM, initialBalance: 100000,
    profitTarget: 10000, maxDrawdownLimit: 8000, dailyLossLimit: 5000
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-fade-in">
      <Card className="w-full max-w-xl p-8 bg-[#0d1117] border-[#1c2128] shadow-2xl">
        <div className="flex justify-between items-center mb-8">
           <div className="flex items-center gap-3">
             <div className="p-2 bg-blue-600/10 text-blue-500 rounded-lg"><PlusCircle size={20} /></div>
             <h3 className="text-xl font-black text-white uppercase tracking-tighter">New Portfolio</h3>
           </div>
           <button onClick={onClose} className="p-2 text-slate-600 hover:text-white"><X size={20} /></button>
        </div>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1.5 block">Portfolio Name</label>
                <input type="text" placeholder="Institutional Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-[#06080f] border border-[#1c2128] rounded-xl px-4 py-2.5 text-[12px] font-bold text-white focus:outline-none focus:ring-1 focus:ring-blue-500/20" />
             </div>
             <div>
                <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1.5 block">Category</label>
                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as AccountCategory})} className="w-full bg-[#06080f] border border-[#1c2128] rounded-xl px-4 py-2.5 text-[12px] font-bold text-white focus:outline-none">
                   <option value={AccountCategory.BROKER}>{AccountCategory.BROKER}</option>
                   <option value={AccountCategory.PROP_FIRM}>{AccountCategory.PROP_FIRM}</option>
                </select>
             </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1.5 block">Broker / Firm</label>
                <input type="text" placeholder="e.g. IC Markets" value={formData.broker} onChange={e => setFormData({...formData, broker: e.target.value})} className="w-full bg-[#06080f] border border-[#1c2128] rounded-xl px-4 py-2.5 text-[12px] font-bold text-white focus:outline-none focus:ring-1 focus:ring-blue-500/20" />
             </div>
             <div>
                <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1.5 block">Starting Balance</label>
                <input type="number" value={formData.initialBalance} onChange={e => setFormData({...formData, initialBalance: Number(e.target.value)})} className="w-full bg-[#06080f] border border-[#1c2128] rounded-xl px-4 py-2.5 text-[12px] font-bold text-white focus:outline-none" />
             </div>
          </div>

          {formData.category === AccountCategory.PROP_FIRM && (
            <div className="p-6 bg-blue-600/[0.03] border border-blue-500/10 rounded-2xl space-y-4 animate-fade-up">
               <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2"><Trophy size={14} /> Challenge Parameters</h4>
               <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[8px] font-black text-slate-600 uppercase mb-1 block">Target</label>
                    <input type="number" value={formData.profitTarget} onChange={e => setFormData({...formData, profitTarget: Number(e.target.value)})} className="w-full bg-[#06080f] border border-slate-800 rounded-lg px-3 py-1.5 text-[11px] font-bold text-white focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-[8px] font-black text-slate-600 uppercase mb-1 block">Max DD</label>
                    <input type="number" value={formData.maxDrawdownLimit} onChange={e => setFormData({...formData, maxDrawdownLimit: Number(e.target.value)})} className="w-full bg-[#06080f] border border-slate-800 rounded-lg px-3 py-1.5 text-[11px] font-bold text-white focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-[8px] font-black text-slate-600 uppercase mb-1 block">Daily Loss</label>
                    <input type="number" value={formData.dailyLossLimit} onChange={e => setFormData({...formData, dailyLossLimit: Number(e.target.value)})} className="w-full bg-[#06080f] border border-slate-800 rounded-lg px-3 py-1.5 text-[11px] font-bold text-white focus:outline-none" />
                  </div>
               </div>
            </div>
          )}

          <button 
            onClick={() => onAdd({ id: crypto.randomUUID(), ...formData, currency: 'USD', server: 'Archive-Default', createdAt: new Date().toISOString(), accountNumber: 'Pending' })} 
            className="w-full bg-blue-600 hover:bg-blue-500 text-white h-12 rounded-xl text-[12px] font-black uppercase tracking-widest transition-all active:scale-[0.98] border-b-4 border-blue-800 mt-4"
          >
            Create Portfolio
          </button>
        </div>
      </Card>
    </div>
  );
};

const AccountsPage = ({ accounts, currentAccountId, onSelect, onAdd }: { 
  accounts: TradingAccount[], currentAccountId: string, onSelect: (id: string) => void, onAdd: (acc: TradingAccount) => void 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-8 animate-fade-up">
      <div className="flex justify-between items-center">
        <div>
           <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Portfolios</h2>
           <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1">Institutional Data Management</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="h-10 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-black uppercase transition-all border-b-4 border-blue-800 flex items-center gap-2"><Plus size={18} /> New Account</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map(acc => {
          const isActive = acc.id === currentAccountId;
          return (
            <Card key={acc.id} onClick={() => onSelect(acc.id)} className={`cursor-pointer border-2 p-8 group transition-all relative overflow-hidden ${isActive ? 'border-blue-500 bg-blue-500/[0.03] shadow-2xl scale-[1.02]' : 'border-[#1c2128]'}`}>
              {isActive && <div className="absolute top-0 right-0 p-3 bg-blue-600 text-white rounded-bl-xl"><Activity size={14} className="animate-pulse" /></div>}
              <div className="flex justify-between items-start mb-6">
                <div className={`p-3 rounded-xl border transition-colors ${isActive ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-900 text-blue-500 border-slate-800'}`}><Wallet size={20} /></div>
                <Badge variant={acc.category === AccountCategory.PROP_FIRM ? 'prop' : 'info'}>{acc.category}</Badge>
              </div>
              <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-1">{acc.name}</h3>
              <p className="text-[10px] text-slate-600 font-black uppercase mb-6">Firm: <span className="text-slate-400">{acc.broker}</span></p>
              
              <div className="space-y-4 pt-5 border-t border-slate-800/60">
                <div className="flex justify-between items-center">
                   <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Initial Capital</span>
                   <span className="text-base font-black text-slate-400 font-mono tracking-tighter">${acc.initialBalance.toLocaleString()}</span>
                </div>
                {acc.category === AccountCategory.PROP_FIRM && (
                   <div className="grid grid-cols-2 gap-2 pt-2">
                      <div className="p-3 bg-blue-500/[0.03] rounded-lg border border-blue-500/10">
                         <p className="text-[8px] font-black text-slate-600 uppercase mb-1">Target</p>
                         <p className="text-[11px] font-black text-emerald-400 font-mono">${acc.profitTarget?.toLocaleString()}</p>
                      </div>
                      <div className="p-3 bg-rose-500/[0.03] rounded-lg border border-rose-500/10">
                         <p className="text-[8px] font-black text-slate-600 uppercase mb-1">Max DD</p>
                         <p className="text-[11px] font-black text-rose-500 font-mono">${acc.maxDrawdownLimit?.toLocaleString()}</p>
                      </div>
                   </div>
                )}
              </div>
              {!isActive && (
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all backdrop-blur-[2px]">
                   <span className="bg-blue-600 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-xl">Activate Portfolio</span>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <AddAccountModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAdd={(acc) => { onAdd(acc); setIsModalOpen(false); }} />
    </div>
  );
};

// --- App Root ---

export default function App() {
  const [accounts, setAccounts] = useLocalStorage<TradingAccount[]>('fuadfx_accounts', [
    { 
      id: 'acc_1', 
      name: 'Elite Performance Challenge', 
      broker: 'FundingPips', 
      accountNumber: '29910', 
      server: 'BlackBull-Live', 
      type: 'Evaluated', 
      category: AccountCategory.PROP_FIRM, 
      currency: 'USD', 
      initialBalance: 100000, 
      profitTarget: 10000, 
      maxDrawdownLimit: 8000, 
      dailyLossLimit: 5000, 
      createdAt: new Date().toISOString() 
    },
    { 
      id: 'acc_2', 
      name: 'Standard Growth Portfolio', 
      broker: 'IC Markets', 
      accountNumber: '88201', 
      server: 'ICMarkets-SC', 
      type: 'Standard', 
      category: AccountCategory.BROKER, 
      currency: 'USD', 
      initialBalance: 10000, 
      createdAt: new Date().toISOString() 
    }
  ]);
  const [currentAccountId, setCurrentAccountId] = useState(accounts[0]?.id);
  const [trades, setTrades] = useLocalStorage<Trade[]>('fuadfx_trades', (() => {
    const symbols = ['XAUUSD', 'US30', 'NAS100', 'GBPUSD'];
    const now = new Date();
    const demoTrades: Trade[] = [];

    // Prop trades
    for (let i = 0; i < 40; i++) {
      const isWin = Math.random() > 0.4;
      const profit = isWin ? Math.random() * 1500 : -(Math.random() * 800);
      const date = new Date(now.getTime() - (Math.random() * 30) * 86400000);
      demoTrades.push({
        id: crypto.randomUUID(), ticket: String(9000000 + i),
        openTime: new Date(date.getTime() - 14400000).toISOString(),
        closeTime: date.toISOString(), symbol: symbols[Math.floor(Math.random() * symbols.length)],
        type: Math.random() > 0.5 ? TradeType.BUY : TradeType.SELL,
        lots: 2.0, entryPrice: 2030.00, exitPrice: 2045.00, commission: 7.00, swap: 0, profit, balanceAfter: 0,
        accountId: 'acc_1', tags: [], notes: '', emotion: Emotion.NEUTRAL, status: TradeStatus.CLOSED
      });
    }

    // Broker trades
    for (let i = 0; i < 25; i++) {
      const isWin = Math.random() > 0.5;
      const profit = isWin ? Math.random() * 300 : -(Math.random() * 150);
      const date = new Date(now.getTime() - (Math.random() * 30) * 86400000);
      demoTrades.push({
        id: crypto.randomUUID(), ticket: String(8000000 + i),
        openTime: new Date(date.getTime() - 7200000).toISOString(),
        closeTime: date.toISOString(), symbol: symbols[Math.floor(Math.random() * symbols.length)],
        type: Math.random() > 0.5 ? TradeType.BUY : TradeType.SELL,
        lots: 0.5, entryPrice: 1.2500, exitPrice: 1.2550, commission: 2.00, swap: 0, profit, balanceAfter: 0,
        accountId: 'acc_2', tags: [], notes: '', emotion: Emotion.NEUTRAL, status: TradeStatus.CLOSED
      });
    }

    return demoTrades;
  })());

  const currentAccount = accounts.find(a => a.id === currentAccountId) || accounts[0];
  const accountTrades = useMemo(() => trades.filter(t => t.accountId === currentAccountId), [trades, currentAccountId]);
  const stats = useMemo(() => calculateStats(accountTrades, currentAccount?.initialBalance), [accountTrades, currentAccount]);
  return (
    <HashRouter>
      <Layout accounts={accounts} currentAccount={currentAccount} onSelectAccount={(acc) => setCurrentAccountId(acc.id)}>
        <Routes>
          <Route path="/" element={<DashboardPage trades={accountTrades} stats={stats} account={currentAccount} />} />
          <Route path="/accounts" element={<AccountsPage accounts={accounts} currentAccountId={currentAccountId} onSelect={setCurrentAccountId} onAdd={(acc) => setAccounts([...accounts, acc])} />} />
          <Route path="/journal" element={<JournalPage trades={accountTrades} onUpdateTrade={(id, up) => setTrades(prev => prev.map(t => t.id === id ? { ...t, ...up } : t))} />} />
          <Route path="/analytics" element={<AdvancedAnalyticsPage trades={accountTrades} />} />
          <Route path="/news" element={<MarketNewsPage />} />
          <Route path="/ai-analysis" element={<AIDeepAnalysisPage trades={accountTrades} />} />
          <Route path="/import" element={
            <div className="max-w-2xl mx-auto py-16 animate-fade-up">
               <Card className="p-16 text-center border-dashed border-2 border-slate-800 bg-[#0d1117]/60 shadow-2xl relative overflow-hidden group">
                  <div className="w-16 h-16 bg-blue-600/10 rounded-2xl mx-auto mb-6 flex items-center justify-center border border-blue-500/20 relative z-10 shadow-xl"><Database className="text-blue-500" size={32} /></div>
                  <h2 className="text-2xl font-black text-white mb-3 uppercase relative z-10 tracking-tighter">Sync Archive</h2>
                  <p className="text-[11px] text-slate-500 mb-10 px-12 uppercase tracking-widest relative z-10 font-bold">Process Institutional MT5 Statement</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
                    <label className="flex flex-col items-center justify-center p-10 bg-[#06080f] border border-slate-800 rounded-3xl hover:border-blue-500/50 transition-all cursor-pointer group/item">
                      <input type="file" className="hidden" accept=".csv" onChange={async (e) => { if (e.target.files?.[0]) { const text = await e.target.files[0].text(); const res = parseMT5CSV(text, currentAccountId); setTrades([...trades, ...res.map((t: Trade) => ({...t, accountId: currentAccountId}))]); } }} />
                      <Upload size={40} className="text-slate-700 mb-3 group-hover/item:text-blue-500 transition-colors" /><span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover/item:text-white">CSV Stream</span>
                    </label>
                    <label className="flex flex-col items-center justify-center p-10 bg-[#06080f] border border-slate-800 rounded-3xl hover:border-emerald-500/50 transition-all cursor-pointer group/item">
                      <input type="file" className="hidden" accept=".xlsx,.xls" onChange={async (e) => { if (e.target.files?.[0]) { const res = await parseMT5Excel(e.target.files[0], currentAccountId); setTrades([...trades, ...res.map((t: Trade) => ({...t, accountId: currentAccountId}))]); } }} />
                      <FileSpreadsheet size={40} className="text-slate-700 mb-3 group-hover/item:text-emerald-500 transition-colors" /><span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover/item:text-white">XLSX Data</span>
                    </label>
                  </div>
                  <div className="absolute top-0 right-0 p-8 text-blue-500/5"><Activity size={140} /></div>
               </Card>
            </div>
          } />
        </Routes>
      </Layout>
    </HashRouter>
  );
}

// --- Layout ---

const Layout = ({ children, accounts, currentAccount, onSelectAccount }: { 
  children?: React.ReactNode, accounts: TradingAccount[], currentAccount?: TradingAccount, onSelectAccount: (acc: TradingAccount) => void
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  return (
    <div className="h-screen flex overflow-hidden bg-[#06080f]">
      <aside className={`w-64 bg-[#0d1117] border-r border-[#1c2128] flex flex-col shrink-0 transition-all duration-300 ${sidebarOpen ? 'ml-0' : '-ml-64'}`}>
        <div className="p-6 flex items-center gap-3"><Zap className="text-blue-500" fill="currentColor" size={22} /><span className="text-lg font-black text-white uppercase tracking-tighter">FUADFX</span></div>
        <div className="px-5 mb-8 relative">
          <select 
            onChange={(e) => { const acc = accounts.find(a => a.id === e.target.value); if (acc) onSelectAccount(acc); }} 
            value={currentAccount?.id} 
            className="w-full bg-[#161b22] border border-[#30363d] text-[10px] font-black uppercase tracking-widest rounded-xl p-3 appearance-none focus:outline-none text-slate-300 cursor-pointer shadow-inner"
          >
            {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
          </select>
          <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600"><ChevronRight size={12} className="rotate-90" /></div>
        </div>
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto hide-scrollbar">
          {NAV_ITEMS.map((item) => (
            <Link key={item.path} to={item.path} className={`flex items-center gap-4 px-5 py-4 rounded-xl transition-all text-[11px] font-black uppercase tracking-widest ${location.pathname === item.path ? 'sidebar-active shadow-xl shadow-blue-500/5' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/40'}`}>
              <span className="shrink-0">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-6 mt-auto border-t border-slate-800/40">
           <div className="flex items-center gap-3 p-2 bg-slate-900/20 rounded-xl">
              <div className="h-9 w-9 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-500 font-black border border-blue-500/20 shadow-lg">JD</div>
              <div className="overflow-hidden">
                 <p className="text-[11px] font-black text-white uppercase truncate">Alpha Trader</p>
                 <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">Master Acc</p>
              </div>
           </div>
        </div>
      </aside>
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-[#0d1117] border-b border-[#1c2128] flex items-center justify-between px-8 shrink-0 z-50">
          <div className="flex items-center gap-8 flex-1">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 text-slate-500 hover:text-white transition-colors bg-[#06080f] rounded-lg border border-slate-800"><Menu size={18} /></button>
            <div className="max-w-[300px] w-full hidden sm:block">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within:text-blue-500 transition-colors" size={16} />
                <input type="text" placeholder="Trace ID or Symbol..." className="w-full bg-[#161b22]/40 border border-slate-800/40 rounded-full py-2 pl-10 pr-4 text-[11px] font-bold text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500/20 transition-all placeholder:text-slate-700" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2.5">
              <Signal size={14} className="text-slate-600" />
              <div className="text-[14px] font-black text-white tabular-nums tracking-tighter font-mono"><LiveClock /></div>
            </div>
            <button className="p-2 text-slate-500 hover:text-white transition-all bg-[#06080f] rounded-lg border border-slate-800"><Settings size={18} /></button>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-10 bg-[#06080f] hide-scrollbar">
          <div className="max-w-[1500px] mx-auto">{children}</div>
        </div>
      </main>
    </div>
  );
};

const LiveClock = () => {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const timer = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(timer); }, []);
  return <>{time.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</>;
};

const AIDeepAnalysisPage = ({ trades }: { trades: Trade[] }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const generate = async () => {
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
      const stats = calculateStats(trades);
      const res = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Audit stats: Net $${stats.netProfit.toFixed(2)}, PF ${stats.profitFactor.toFixed(2)}, WR ${stats.winRate.toFixed(2)}%. Last 10 trades: ${JSON.stringify(trades.slice(-10))}.`,
        config: { systemInstruction: "Analyze performance and identify edge or risk." },
      });
      // Extract text from response correctly
      setAnalysis(res.text || "Report empty.");
    } catch (e) { setAnalysis("Neural link failure."); } finally { setLoading(false); }
  };
  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3"><BrainCircuit className="text-blue-500" /> Neural Insight</h2>
        {!analysis && !loading && <button onClick={generate} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all border-b-4 border-blue-800">Initialize Scan</button>}
      </div>
      {loading ? <Card className="p-20 text-center"><Loader2 className="animate-spin text-blue-500 mx-auto mb-4" size={40} /><p className="text-slate-600 text-[10px] font-black uppercase animate-pulse">Parsing...</p></Card> : analysis ? <Card className="p-10 font-mono text-slate-300 text-[13px] border border-slate-800/40 leading-relaxed whitespace-pre-wrap">{analysis}</Card> : <Card className="p-20 text-center text-slate-700 uppercase font-black text-[11px] tracking-widest border-dashed border-2 border-slate-800">Ready for sync.</Card>}
    </div>
  );
};

const AdvancedAnalyticsPage = ({ trades }: { trades: Trade[] }) => {
  const symbolStats = useMemo(() => getStatsBySymbol(trades), [trades]);
  return (
    <div className="space-y-6 animate-fade-up">
      <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Analytics Matrix</h2>
      <Card className="h-[400px]">
        <h3 className="text-[10px] font-bold text-slate-500 uppercase mb-6">Asset P&L Distribution</h3>
        <ResponsiveContainer width="100%" height="80%">
          <BarChart data={symbolStats}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1c2128" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 10 }} />
            <YAxis hide />
            <Tooltip cursor={{ fill: '#1e293b' }} contentStyle={{ backgroundColor: '#0d1117', border: '1px solid #30363d' }} />
            <Bar dataKey="profit" radius={[4, 4, 0, 0]}>
              {symbolStats.map((entry: SymbolPnlRow, index: number) => (<Cell key={`cell-${index}`} fill={entry.profit >= 0 ? '#10b981' : '#f43f5e'} />))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};

const JournalPage = ({ trades, onUpdateTrade }: { trades: Trade[], onUpdateTrade: (id: string, updates: Partial<Trade>) => void }) => {
  const sorted = useMemo(() => [...trades].sort((a,b) => new Date(b.closeTime).getTime() - new Date(a.closeTime).getTime()), [trades]);
  return (
    <div className="space-y-5 animate-fade-up">
      <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Execution Terminal</h2>
      <div className="grid grid-cols-1 gap-4">
        {sorted.map(t => (
          <Card key={t.id} className="p-6">
            <div className="flex flex-col md:flex-row gap-8">
              <div className="md:w-64 border-r border-slate-800 pr-8">
                <div className="flex justify-between mb-4">
                  <span className="text-xl font-black text-white uppercase">{t.symbol}</span>
                  <span className={`text-lg font-black font-mono ${t.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>${t.profit.toFixed(2)}</span>
                </div>
                <Badge variant={t.type === TradeType.BUY ? 'success' : 'danger'}>{t.type}</Badge>
                <p className="text-[10px] text-slate-500 font-black mt-4 uppercase">{new Date(t.closeTime).toDateString()}</p>
              </div>
              <div className="flex-1 space-y-4">
                <div className="flex gap-2">
                   {Object.values(Emotion).map(emo => (
                     <button key={emo} onClick={() => onUpdateTrade(t.id, { emotion: emo })} className={`text-[9px] font-black px-3 py-1.5 rounded-lg border transition-all ${t.emotion === emo ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-600 hover:text-slate-400'}`}>{emo}</button>
                   ))}
                </div>
                <textarea value={t.notes} onChange={e => onUpdateTrade(t.id, { notes: e.target.value })} placeholder="Log trace brief..." className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-[12px] text-slate-400 focus:outline-none min-h-[80px]" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

// Custom hook to handle local storage sync
function useLocalStorage<T,>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => { try { const item = window.localStorage.getItem(key); return item ? JSON.parse(item) : initialValue; } catch (error) { return initialValue; } });
  const setValue = (value: T | ((val: T) => T)) => { try { const valueToStore = value instanceof Function ? value(storedValue) : value; setStoredValue(valueToStore); window.localStorage.setItem(key, JSON.stringify(valueToStore)); } catch (error) { console.log(error); } };
  return [storedValue, setValue] as const;
}
