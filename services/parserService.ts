import * as XLSX from 'xlsx';
import { Trade, TradeType, TradeStatus } from '../types';

function norm(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

function parseNum(v: unknown): number {
  if (typeof v === 'number' && !Number.isNaN(v)) return v;
  if (v == null || v === '') return 0;
  const s = String(v).replace(/,/g, '').replace(/\s/g, '');
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

function parseType(cell: string): TradeType {
  const u = cell.toUpperCase();
  if (u.includes('SELL') || u === 'S') return TradeType.SELL;
  return TradeType.BUY;
}

function parseIsoMaybe(s: string): string {
  const t = Date.parse(s);
  if (!Number.isNaN(t)) return new Date(t).toISOString();
  return new Date().toISOString();
}

/** Build trades from table rows using a header → column index map. */
function rowsToTrades(
  rows: string[][],
  headerIdx: Record<string, number>,
  accountId: string
): Trade[] {
  const get = (row: string[], key: string) => {
    const i = headerIdx[key];
    if (i == null || row[i] == null) return '';
    return String(row[i]).trim();
  };

  const out: Trade[] = [];
  for (const row of rows) {
    if (row.every((c) => !String(c).trim())) continue;

    const symbol = get(row, 'symbol');
    const profitRaw = get(row, 'profit');
    if (!symbol || profitRaw === '') continue;

    const ticket = get(row, 'ticket') || String(out.length);
    let openTime = get(row, 'open time');
    const closeTime = get(row, 'close time') || openTime || '';
    if (!openTime) openTime = closeTime;

    const typeCell = get(row, 'type');
    const volume = parseNum(get(row, 'volume'));
    const openPrice = parseNum(get(row, 'open price'));
    const closePrice = parseNum(get(row, 'close price'));
    const commission = parseNum(get(row, 'commission'));
    const swap = parseNum(get(row, 'swap'));

    const profit = parseNum(profitRaw);

    out.push({
      id: crypto.randomUUID(),
      ticket,
      openTime: openTime ? parseIsoMaybe(openTime) : new Date().toISOString(),
      closeTime: closeTime ? parseIsoMaybe(closeTime) : new Date().toISOString(),
      symbol,
      type: parseType(typeCell || 'buy'),
      lots: volume || 0.01,
      entryPrice: openPrice,
      exitPrice: closePrice || openPrice,
      commission,
      swap,
      profit,
      balanceAfter: 0,
      accountId,
      tags: [],
      notes: '',
      status: TradeStatus.CLOSED,
    });
  }
  return out;
}

function detectHeaderMap(headerRow: string[]): Record<string, number> | null {
  const idx: Record<string, number> = {};
  headerRow.forEach((h, i) => {
    const n = norm(h);
    if (!n) return;
    idx[n] = i;
  });

  const aliases: [string, string[]][] = [
    ['symbol', ['symbol', 'instrument', 'pair', 'item', 'currency']],
    ['profit', ['profit', 'p/l', 'pl', 'net profit']],
    ['ticket', ['ticket', 'deal', 'order', 'position', 'position id']],
    ['open time', ['open time', 'opening time', 'time open']],
    ['close time', ['close time', 'closing time', 'time close', 'time']],
    ['type', ['type', 'direction', 'action', 'cmd', 'side']],
    ['volume', ['volume', 'size', 'lots', 'qty']],
    ['open price', ['open price', 'open', 'openprice', 'entry price']],
    ['close price', ['close price', 'close', 'closeprice', 'exit price', 'price']],
    ['commission', ['commission', 'comission']],
    ['swap', ['swap', 'rollover', 'storage']],
  ];

  const headerIdx: Record<string, number> = {};
  for (const [canonical, names] of aliases) {
    for (const name of names) {
      const j = idx[name];
      if (j != null) {
        headerIdx[canonical] = j;
        break;
      }
    }
  }

  if (headerIdx['symbol'] == null || headerIdx['profit'] == null) return null;
  return headerIdx;
}

/** Split a CSV / TSV line respecting quoted fields. */
function splitRow(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      q = !q;
      continue;
    }
    if (!q && (c === ',' || c === '\t' || c === ';')) {
      out.push(cur);
      cur = '';
      continue;
    }
    cur += c;
  }
  out.push(cur);
  return out.map((s) => s.replace(/^"|"$/g, '').trim());
}

export function parseMT5CSV(text: string, accountId: string): Trade[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) return [];

  for (let start = 0; start < Math.min(5, lines.length); start++) {
    const headerCells = splitRow(lines[start]);
    const headerMap = detectHeaderMap(headerCells);
    if (!headerMap) continue;

    const body: string[][] = [];
    for (let r = start + 1; r < lines.length; r++) {
      body.push(splitRow(lines[r]));
    }
    return rowsToTrades(body, headerMap, accountId);
  }
  return [];
}

export async function parseMT5Excel(file: File, accountId: string): Promise<Trade[]> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  if (!sheet) return [];

  const matrix = XLSX.utils.sheet_to_json<string[]>(sheet, {
    header: 1,
    defval: '',
  }) as string[][];

  for (let r = 0; r < Math.min(matrix.length, 10); r++) {
    const row = matrix[r].map((c) => String(c ?? ''));
    const headerMap = detectHeaderMap(row);
    if (!headerMap) continue;

    const body = matrix.slice(r + 1) as string[][];
    return rowsToTrades(body, headerMap, accountId);
  }
  return [];
}
