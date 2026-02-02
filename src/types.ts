/* ===============================
   GLOBAL TYPES (SQL MATCHED)
   =============================== */

export type Role = 'ADMIN' | 'PLAYER';

/* ---------- USERS TABLE ---------- */
export interface User {
  id: string;                 // uuid
  username: string;
  password: string;
  role: Role;
  wallet_balance: number;
  is_blocked: boolean;
  is_chat_blocked: boolean;
  last_tx_at: string;         // timestamptz
  joined_at: string;          // timestamptz
}

/* ---------- TOURNAMENTS TABLE ---------- */
export interface Tournament {
  id: string;
  name: string;
  game_name: string;
  mode: string;
  rules: string | null;
  banner_url: string | null;
  date: string;
  time: string;
  day: string;
  prize_pool: number;
  entry_fee: number;
  max_slots: number;
  status: string;
  game_id: string | null;
  game_password: string | null;
  winner_id: string | null;
  created_at: string;
}

/* ---------- PARTICIPANTS ---------- */
export interface Participant {
  id: number;
  tournament_id: string;
  user_id: string;
  ff_name: string;
  ff_uid: string;
  slot_no: number;
}

/* ---------- JOIN REQUESTS ---------- */
export interface JoinRequest {
  id: string;
  tournament_id: string;
  user_id: string;
  ff_name: string;
  ff_uid: string;
  utr_number: string;
  status: string;
  timestamp: number;
}

/* ---------- WALLET ADDS ---------- */
export interface WalletAdd {
  id: string;
  user_id: string;
  amount: number;
  utr: string;
  status: string;
  timestamp: number;
}

/* ---------- WITHDRAWALS ---------- */
export interface Withdrawal {
  id: string;
  user_id: string;
  username: string;
  amount: number;
  upi_id: string;
  status: string;
  timestamp: number;
}

/* ---------- MESSAGES ---------- */
export interface Message {
  id: string;
  sender_id: string;
  sender_name: string;
  receiver_id: string;
  text: string;
  timestamp: number;
  read: boolean;
}

/* ---------- CONFIG ---------- */
export interface Config {
  id: number;
  upi_id: string;
  qr_url: string | null;
  chat_disabled: boolean;
  auto_payment_enabled: boolean;
}
