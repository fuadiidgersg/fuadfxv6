//+------------------------------------------------------------------+
//|                                                FuadFXTradeSyncEA |
//|                       Closed trade sync for FUADFX trading journal |
//+------------------------------------------------------------------+
#property copyright "FUADFX"
#property version   "1.00"
#property strict

input string InpApiUrl = "https://fuadfx-api.onrender.com/trades/bulk";
input string InpBearerToken = "";      // FUADFX EA API key
input string InpAccountId = "";        // FUADFX account UUID
input int    InpLookbackDays = 30;
input int    InpSyncEverySeconds = 60;
input int    InpBatchSize = 50;
input bool   InpSyncOnInit = true;
input bool   InpDebugLogs = true;
input bool   InpSyncOpenPositionsLater = false; // Reserved for phase 2

string g_api_url = "";
string g_bearer_token = "";
string g_account_id = "";
int g_lookback_days = 30;
int g_sync_every_seconds = 60;
int g_batch_size = 50;
bool g_sync_on_init = true;
bool g_debug_logs = true;
bool g_sync_open_positions_later = false;
string STATE_FILE = "";
datetime g_last_sync = 0;
datetime g_last_scan = 0;
ulong g_synced_position_ids[];
ulong g_synced_deal_ids[];
ulong g_synced_order_ids[];

struct ClosedTradePayload
{
   ulong position_id;
   ulong entry_deal_ticket;
   ulong exit_deal_ticket;
   ulong entry_order_ticket;
   ulong exit_order_ticket;
   long magic_number;
   string symbol;
   string direction;
   double volume;
   double entry_price;
   double exit_price;
   datetime open_time;
   datetime close_time;
   double profit;
   double commission;
   double swap;
   double stop_loss;
   double take_profit;
   long account_number;
   string broker_server;
};

//+------------------------------------------------------------------+
//| Utility                                                          |
//+------------------------------------------------------------------+
void Log(const string message)
{
   if(g_debug_logs)
      Print("[FUADFX Sync] ", message);
}

string TrimString(string value)
{
   StringTrimLeft(value);
   StringTrimRight(value);
   return value;
}

string SanitizedAccountServer()
{
   string value = AccountInfoString(ACCOUNT_SERVER);
   StringReplace(value, " ", "_");
   StringReplace(value, ":", "_");
   StringReplace(value, "\\", "_");
   StringReplace(value, "/", "_");
   return value;
}

string JsonEscape(string value)
{
   StringReplace(value, "\\", "\\\\");
   StringReplace(value, "\"", "\\\"");
   StringReplace(value, "\r", "\\r");
   StringReplace(value, "\n", "\\n");
   StringReplace(value, "\t", "\\t");
   return value;
}

string IsoTime(datetime value)
{
   MqlDateTime parts;
   TimeToStruct(value, parts);
   return StringFormat("%04d-%02d-%02dT%02d:%02d:%02dZ",
                       parts.year,
                       parts.mon,
                       parts.day,
                       parts.hour,
                       parts.min,
                       parts.sec);
}

void ResolveRuntimeConfig()
{
   g_api_url = InpApiUrl;
   g_bearer_token = InpBearerToken;
   g_account_id = InpAccountId;
   g_lookback_days = InpLookbackDays;
   g_sync_every_seconds = InpSyncEverySeconds;
   g_batch_size = InpBatchSize;
   g_sync_on_init = InpSyncOnInit;
   g_debug_logs = InpDebugLogs;
   g_sync_open_positions_later = InpSyncOpenPositionsLater;

   LoadRuntimeConfigFile("FUADFX_MT5_Sync_Config.ini");
   LoadRuntimeConfigFile(StringFormat("FUADFX_MT5_Sync_%I64d_%s.ini",
                                      AccountInfoInteger(ACCOUNT_LOGIN),
                                      SanitizedAccountServer()));

   if(g_bearer_token != "" && g_account_id != "")
      return;

   // Account-specific downloads are named:
   // FuadFXTradeSyncEA__<account_id>__<ea_api_key>.ex5
   string program_name = MQLInfoString(MQL_PROGRAM_NAME);
   StringReplace(program_name, ".ex5", "");
   StringReplace(program_name, ".EX5", "");

   const int first_sep = StringFind(program_name, "__");
   if(first_sep < 0)
      return;

   const int second_sep = StringFind(program_name, "__", first_sep + 2);
   if(second_sep < 0)
      return;

   if(g_account_id == "")
      g_account_id = StringSubstr(program_name, first_sep + 2, second_sep - first_sep - 2);

   if(g_bearer_token == "")
      g_bearer_token = StringSubstr(program_name, second_sep + 2);
}

void ApplyRuntimeConfigValue(const string key, const string value)
{
   if(value == "")
      return;

   if(key == "api_url")
      g_api_url = value;
   else if(key == "bearer_token")
      g_bearer_token = value;
   else if(key == "account_id")
      g_account_id = value;
   else if(key == "lookback_days")
      g_lookback_days = (int)MathMax(1, StringToInteger(value));
   else if(key == "sync_every_seconds")
      g_sync_every_seconds = (int)MathMax(10, StringToInteger(value));
   else if(key == "batch_size")
      g_batch_size = (int)MathMax(1, StringToInteger(value));
   else if(key == "sync_on_init")
      g_sync_on_init = (StringToInteger(value) != 0 || value == "true");
   else if(key == "debug_logs")
      g_debug_logs = (StringToInteger(value) != 0 || value == "true");
   else if(key == "sync_open_positions_later")
      g_sync_open_positions_later = (StringToInteger(value) != 0 || value == "true");
}

bool LoadRuntimeConfigFile(const string filename)
{
   const int handle = FileOpen(filename, FILE_READ | FILE_TXT | FILE_COMMON);
   if(handle == INVALID_HANDLE)
      return false;

   while(!FileIsEnding(handle))
   {
      string line = TrimString(FileReadString(handle));
      if(line == "" || StringSubstr(line, 0, 1) == "#")
         continue;

      const int sep = StringFind(line, "=");
      if(sep <= 0)
         continue;

      const string key = TrimString(StringSubstr(line, 0, sep));
      const string value = TrimString(StringSubstr(line, sep + 1));
      ApplyRuntimeConfigValue(key, value);
   }

   FileClose(handle);
   return true;
}

void ResetTrade(ClosedTradePayload &trade)
{
   trade.position_id = 0;
   trade.entry_deal_ticket = 0;
   trade.exit_deal_ticket = 0;
   trade.entry_order_ticket = 0;
   trade.exit_order_ticket = 0;
   trade.magic_number = 0;
   trade.symbol = "";
   trade.direction = "long";
   trade.volume = 0.0;
   trade.entry_price = 0.0;
   trade.exit_price = 0.0;
   trade.open_time = 0;
   trade.close_time = 0;
   trade.profit = 0.0;
   trade.commission = 0.0;
   trade.swap = 0.0;
   trade.stop_loss = 0.0;
   trade.take_profit = 0.0;
   trade.account_number = 0;
   trade.broker_server = "";
}

bool ArrayHasUlong(const ulong &items[], const ulong value)
{
   for(int i = 0; i < ArraySize(items); i++)
   {
      if(items[i] == value)
         return true;
   }
   return false;
}

void ArrayAddUniqueUlong(ulong &items[], const ulong value)
{
   if(value == 0 || ArrayHasUlong(items, value))
      return;
   const int size = ArraySize(items);
   ArrayResize(items, size + 1);
   items[size] = value;
}

bool IsSynced(const ClosedTradePayload &trade)
{
   return ArrayHasUlong(g_synced_position_ids, trade.position_id) ||
          ArrayHasUlong(g_synced_deal_ids, trade.exit_deal_ticket) ||
          ArrayHasUlong(g_synced_order_ids, trade.exit_order_ticket);
}

void MarkSynced(const ClosedTradePayload &trade)
{
   ArrayAddUniqueUlong(g_synced_position_ids, trade.position_id);
   ArrayAddUniqueUlong(g_synced_deal_ids, trade.entry_deal_ticket);
   ArrayAddUniqueUlong(g_synced_deal_ids, trade.exit_deal_ticket);
   ArrayAddUniqueUlong(g_synced_order_ids, trade.entry_order_ticket);
   ArrayAddUniqueUlong(g_synced_order_ids, trade.exit_order_ticket);
   if(trade.close_time > g_last_sync)
      g_last_sync = trade.close_time;
}

string StatePath()
{
   return STATE_FILE;
}

void LoadState()
{
   STATE_FILE = StringFormat("FUADFX_MT5_Sync_%I64d_%s.csv",
                             AccountInfoInteger(ACCOUNT_LOGIN),
                             AccountInfoString(ACCOUNT_SERVER));
   StringReplace(STATE_FILE, " ", "_");
   StringReplace(STATE_FILE, ":", "_");
   StringReplace(STATE_FILE, "\\", "_");
   StringReplace(STATE_FILE, "/", "_");

   const int handle = FileOpen(StatePath(), FILE_READ | FILE_CSV | FILE_COMMON, ';');
   if(handle == INVALID_HANDLE)
   {
      g_last_sync = TimeCurrent() - g_lookback_days * 86400;
      Log("No prior sync state. Starting from lookback window.");
      return;
   }

   while(!FileIsEnding(handle))
   {
      const string kind = FileReadString(handle);
      if(kind == "")
         continue;

      if(kind == "last_sync")
      {
         g_last_sync = (datetime)StringToInteger(FileReadString(handle));
      }
      else if(kind == "position")
      {
         ArrayAddUniqueUlong(g_synced_position_ids, (ulong)StringToInteger(FileReadString(handle)));
      }
      else if(kind == "deal")
      {
         ArrayAddUniqueUlong(g_synced_deal_ids, (ulong)StringToInteger(FileReadString(handle)));
      }
      else if(kind == "order")
      {
         ArrayAddUniqueUlong(g_synced_order_ids, (ulong)StringToInteger(FileReadString(handle)));
      }
   }

   FileClose(handle);
   if(g_last_sync <= 0)
      g_last_sync = TimeCurrent() - g_lookback_days * 86400;

   Log(StringFormat("Loaded state: %d positions, %d deals, %d orders. Last sync %s.",
                    ArraySize(g_synced_position_ids),
                    ArraySize(g_synced_deal_ids),
                    ArraySize(g_synced_order_ids),
                    IsoTime(g_last_sync)));
}

void SaveState()
{
   const int handle = FileOpen(StatePath(), FILE_WRITE | FILE_CSV | FILE_COMMON, ';');
   if(handle == INVALID_HANDLE)
   {
      Print("[FUADFX Sync] Failed to save state. Error ", GetLastError());
      return;
   }

   FileWrite(handle, "last_sync", (long)g_last_sync);
   for(int i = 0; i < ArraySize(g_synced_position_ids); i++)
      FileWrite(handle, "position", (long)g_synced_position_ids[i]);
   for(int i = 0; i < ArraySize(g_synced_deal_ids); i++)
      FileWrite(handle, "deal", (long)g_synced_deal_ids[i]);
   for(int i = 0; i < ArraySize(g_synced_order_ids); i++)
      FileWrite(handle, "order", (long)g_synced_order_ids[i]);

   FileClose(handle);
}

//+------------------------------------------------------------------+
//| History parsing                                                  |
//+------------------------------------------------------------------+
bool BuildClosedTrade(const ulong position_id, ClosedTradePayload &trade)
{
   ResetTrade(trade);
   trade.position_id = position_id;
   trade.account_number = AccountInfoInteger(ACCOUNT_LOGIN);
   trade.broker_server = AccountInfoString(ACCOUNT_SERVER);

   datetime first_time = 0;
   datetime last_time = 0;
   double entry_volume = 0.0;
   double exit_volume = 0.0;
   double weighted_entry = 0.0;
   double weighted_exit = 0.0;
   long entry_type = -1;

   const int total = HistoryDealsTotal();
   for(int i = 0; i < total; i++)
   {
      const ulong deal_ticket = HistoryDealGetTicket(i);
      if(deal_ticket == 0)
         continue;
      if((ulong)HistoryDealGetInteger(deal_ticket, DEAL_POSITION_ID) != position_id)
         continue;

      const long entry = HistoryDealGetInteger(deal_ticket, DEAL_ENTRY);
      const long deal_type = HistoryDealGetInteger(deal_ticket, DEAL_TYPE);
      const double volume = HistoryDealGetDouble(deal_ticket, DEAL_VOLUME);
      const double price = HistoryDealGetDouble(deal_ticket, DEAL_PRICE);
      const datetime time = (datetime)HistoryDealGetInteger(deal_ticket, DEAL_TIME);
      const ulong order_ticket = (ulong)HistoryDealGetInteger(deal_ticket, DEAL_ORDER);

      if(trade.symbol == "")
         trade.symbol = HistoryDealGetString(deal_ticket, DEAL_SYMBOL);

      trade.profit += HistoryDealGetDouble(deal_ticket, DEAL_PROFIT);
      trade.commission += HistoryDealGetDouble(deal_ticket, DEAL_COMMISSION);
      trade.swap += HistoryDealGetDouble(deal_ticket, DEAL_SWAP);

      const long magic = HistoryDealGetInteger(deal_ticket, DEAL_MAGIC);
      if(magic != 0)
         trade.magic_number = magic;

      if(entry == DEAL_ENTRY_IN || entry == DEAL_ENTRY_INOUT)
      {
         entry_volume += volume;
         weighted_entry += price * volume;
         if(first_time == 0 || time < first_time)
            first_time = time;
         if(trade.entry_deal_ticket == 0 || time < trade.open_time)
         {
            trade.entry_deal_ticket = deal_ticket;
            trade.entry_order_ticket = order_ticket;
         }
         if(deal_type == DEAL_TYPE_BUY || deal_type == DEAL_TYPE_SELL)
            entry_type = deal_type;
      }

      if(entry == DEAL_ENTRY_OUT || entry == DEAL_ENTRY_INOUT || entry == DEAL_ENTRY_OUT_BY)
      {
         exit_volume += volume;
         weighted_exit += price * volume;
         if(time > last_time)
         {
            last_time = time;
            trade.exit_deal_ticket = deal_ticket;
            trade.exit_order_ticket = order_ticket;
         }
      }
   }

   if(entry_volume <= 0.0 || exit_volume <= 0.0 || last_time <= 0)
      return false;

   trade.volume = exit_volume;
   trade.entry_price = weighted_entry / entry_volume;
   trade.exit_price = weighted_exit / exit_volume;
   trade.open_time = first_time;
   trade.close_time = last_time;
   trade.direction = entry_type == DEAL_TYPE_SELL ? "short" : "long";

   if(trade.exit_order_ticket > 0 && HistoryOrderSelect(trade.exit_order_ticket))
   {
      trade.stop_loss = HistoryOrderGetDouble(trade.exit_order_ticket, ORDER_SL);
      trade.take_profit = HistoryOrderGetDouble(trade.exit_order_ticket, ORDER_TP);
   }
   if((trade.stop_loss == 0.0 || trade.take_profit == 0.0) &&
      trade.entry_order_ticket > 0 && HistoryOrderSelect(trade.entry_order_ticket))
   {
      if(trade.stop_loss == 0.0)
         trade.stop_loss = HistoryOrderGetDouble(trade.entry_order_ticket, ORDER_SL);
      if(trade.take_profit == 0.0)
         trade.take_profit = HistoryOrderGetDouble(trade.entry_order_ticket, ORDER_TP);
   }

   return true;
}

int CollectClosedTrades(ClosedTradePayload &trades[])
{
   ArrayResize(trades, 0);

   datetime from = g_last_sync - 86400;
   const datetime lookback_from = TimeCurrent() - g_lookback_days * 86400;
   if(from < lookback_from)
      from = lookback_from;
   const datetime to = TimeCurrent();

   if(!HistorySelect(from, to))
   {
      Print("[FUADFX Sync] HistorySelect failed. Error ", GetLastError());
      return 0;
   }

   ulong position_ids[];
   const int total = HistoryDealsTotal();
   for(int i = 0; i < total; i++)
   {
      const ulong deal_ticket = HistoryDealGetTicket(i);
      if(deal_ticket == 0)
         continue;

      const long entry = HistoryDealGetInteger(deal_ticket, DEAL_ENTRY);
      if(entry != DEAL_ENTRY_OUT && entry != DEAL_ENTRY_INOUT && entry != DEAL_ENTRY_OUT_BY)
         continue;

      const ulong position_id = (ulong)HistoryDealGetInteger(deal_ticket, DEAL_POSITION_ID);
      if(position_id == 0 || ArrayHasUlong(position_ids, position_id))
         continue;

      ArrayAddUniqueUlong(position_ids, position_id);
   }

   for(int i = 0; i < ArraySize(position_ids); i++)
   {
      ClosedTradePayload trade;
      if(!BuildClosedTrade(position_ids[i], trade))
         continue;
      if(IsSynced(trade))
         continue;

      const int size = ArraySize(trades);
      ArrayResize(trades, size + 1);
      trades[size] = trade;
   }

   return ArraySize(trades);
}

//+------------------------------------------------------------------+
//| JSON and HTTP                                                    |
//+------------------------------------------------------------------+
string TradeToJson(const ClosedTradePayload &trade)
{
   const string notes = StringFormat(
      "MT5 sync | position=%I64u | entry_deal=%I64u | exit_deal=%I64u | entry_order=%I64u | exit_order=%I64u | commission=%.2f | swap=%.2f | account=%I64d | server=%s | magic=%I64d",
      trade.position_id,
      trade.entry_deal_ticket,
      trade.exit_deal_ticket,
      trade.entry_order_ticket,
      trade.exit_order_ticket,
      trade.commission,
      trade.swap,
      trade.account_number,
      trade.broker_server,
      trade.magic_number
   );

   string json = "{";
   json += "\"id\":\"mt5-" + (string)trade.account_number + "-" + (string)trade.position_id + "\",";
   json += "\"pair\":\"" + JsonEscape(trade.symbol) + "\",";
   json += "\"direction\":\"" + trade.direction + "\",";
   json += "\"entry\":" + DoubleToString(trade.entry_price, 8) + ",";
   json += "\"exit\":" + DoubleToString(trade.exit_price, 8) + ",";
   json += "\"stopLoss\":" + DoubleToString(trade.stop_loss, 8) + ",";
   json += "\"takeProfit\":" + DoubleToString(trade.take_profit, 8) + ",";
   json += "\"lotSize\":" + DoubleToString(trade.volume, 2) + ",";
   json += "\"pnl\":" + DoubleToString(trade.profit + trade.commission + trade.swap, 2) + ",";
   json += "\"strategy\":\"Unassigned\",";
   json += "\"session\":\"London\",";
   json += "\"status\":\"" + (trade.profit > 0.0 ? "win" : (trade.profit < 0.0 ? "loss" : "breakeven")) + "\",";
   json += "\"openedAt\":\"" + IsoTime(trade.open_time) + "\",";
   json += "\"closedAt\":\"" + IsoTime(trade.close_time) + "\",";
   json += "\"account\":\"" + JsonEscape((string)trade.account_number + " - " + trade.broker_server) + "\",";
   json += "\"tags\":[\"mt5\",\"auto-sync\",\"ticket:" + (string)trade.position_id + "\"],";
   json += "\"notes\":\"" + JsonEscape(notes) + "\",";
   json += "\"mt5\":{";
   json += "\"positionId\":" + (string)trade.position_id + ",";
   json += "\"entryDealTicket\":" + (string)trade.entry_deal_ticket + ",";
   json += "\"exitDealTicket\":" + (string)trade.exit_deal_ticket + ",";
   json += "\"entryOrderTicket\":" + (string)trade.entry_order_ticket + ",";
   json += "\"exitOrderTicket\":" + (string)trade.exit_order_ticket + ",";
   json += "\"commission\":" + DoubleToString(trade.commission, 2) + ",";
   json += "\"swap\":" + DoubleToString(trade.swap, 2) + ",";
   json += "\"accountNumber\":" + (string)trade.account_number + ",";
   json += "\"brokerServer\":\"" + JsonEscape(trade.broker_server) + "\",";
   json += "\"magicNumber\":" + (string)trade.magic_number;
   json += "}";
   json += "}";
   return json;
}

string BuildRequestJson(ClosedTradePayload &trades[], const int start, const int count)
{
   string json = "{";
   json += "\"accountId\":\"" + JsonEscape(g_account_id) + "\",";
   json += "\"source\":\"mt5-ea\",";
   json += "\"accountNumber\":" + (string)AccountInfoInteger(ACCOUNT_LOGIN) + ",";
   json += "\"brokerServer\":\"" + JsonEscape(AccountInfoString(ACCOUNT_SERVER)) + "\",";
   json += "\"syncOpenPositions\":" + (g_sync_open_positions_later ? "true" : "false") + ",";
   json += "\"trades\":[";
   for(int i = 0; i < count; i++)
   {
      if(i > 0)
         json += ",";
      json += TradeToJson(trades[start + i]);
   }
   json += "]}";
   return json;
}

bool PostJson(const string json, string &response)
{
   if(g_api_url == "" || g_bearer_token == "" || g_account_id == "")
   {
      Print("[FUADFX Sync] Missing API URL, EA API key, or FUADFX account ID.");
      return false;
   }

   char data[];
   char result[];
   string result_headers = "";
   const int data_size = StringToCharArray(
      json,
      data,
      0,
      StringLen(json),
      CP_UTF8
   );
   if(data_size <= 0)
   {
      Print("[FUADFX Sync] Could not encode the request body. MT5 error=", GetLastError());
      return false;
   }

   const string headers =
      "Content-Type: application/json\r\n" +
      "Authorization: Bearer " + g_bearer_token + "\r\n";

   ResetLastError();
   const int status = WebRequest(
      "POST",
      g_api_url,
      headers,
      30000,
      data,
      result,
      result_headers
   );

   response = CharArrayToString(result, 0, ArraySize(result), CP_UTF8);

   if(status < 200 || status >= 300)
   {
      Print("[FUADFX Sync] Upload failed. HTTP/status=", status,
            " MT5 error=", GetLastError(), " response=", response);
      return false;
   }

   return true;
}

void SyncClosedTrades()
{
   ClosedTradePayload trades[];
   const int total = CollectClosedTrades(trades);
   if(total <= 0)
   {
      Log("No new closed trades to sync.");
      return;
   }

   Log(StringFormat("Found %d new closed trade(s).", total));

   const int batch_size = MathMax(1, g_batch_size);
   for(int start = 0; start < total; start += batch_size)
   {
      const int count = (int)MathMin(batch_size, total - start);
      const string json = BuildRequestJson(trades, start, count);
      string response = "";

      if(!PostJson(json, response))
      {
         Log("Stopping sync cycle after failed upload.");
         SaveState();
         return;
      }

      for(int i = 0; i < count; i++)
         MarkSynced(trades[start + i]);

      SaveState();
      Log(StringFormat("Uploaded %d trade(s). Response: %s", count, response));
   }
}

//+------------------------------------------------------------------+
//| Expert lifecycle                                                 |
//+------------------------------------------------------------------+
int OnInit()
{
   ResolveRuntimeConfig();
   LoadState();
   EventSetTimer(MathMax(10, g_sync_every_seconds));

   if(g_sync_on_init)
      SyncClosedTrades();

   Log("Initialized. Add your API domain to MT5: Tools > Options > Expert Advisors > Allow WebRequest.");
   return INIT_SUCCEEDED;
}

void OnDeinit(const int reason)
{
   EventKillTimer();
   SaveState();
   Log("Stopped.");
}

void OnTimer()
{
   if(TimeCurrent() - g_last_scan < MathMax(10, g_sync_every_seconds - 1))
      return;
   g_last_scan = TimeCurrent();
   SyncClosedTrades();
}

void OnTick()
{
   // Timer-driven. Open position sync will be added in a later phase.
}
