
export enum UserRole {
  ADMIN = 'ADMIN',
  PLAYER = 'PLAYER'
}

export interface User {
  id: string;
  username: string;
  password?: string;
  role: UserRole;
  joined_at: string;
  wallet_balance: number;
  is_blocked?: boolean;
  is_chat_blocked?: boolean;
  last_tx_at?: string;
}

export interface GlobalConfig {
  upiId: string;
  qrUrl: string;
  chatDisabled: boolean;
  autoPaymentEnabled: boolean; // Future Razorpay/Gateway toggle
  razorpayKeyId?: string;       // Secret holder for future use
}

export interface JoinRequest {
  id: string;
  tournamentId: string;
  userId: string;
  ffName: string;
  ffUid: string;
  utrNumber: string;
  timestamp: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  username: string;
  amount: number;
  upiId: string;
  timestamp: number;
  status: 'PENDING' | 'PAID' | 'REJECTED';
}

export interface WalletAddRequest {
  id: string;
  userId: string;
  amount: number;
  utr: string;
  timestamp: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface ParticipantInfo {
  userId: string;
  ffName: string;
  ffUid: string;
  slotNo: number;
}

export interface Tournament {
  id: string;
  name: string;
  gameName: string;
  mode: string;
  rules: string;
  bannerUrl?: string;
  date: string;
  time: string;
  day: string;
  prizePool: string;
  entryFee: string;
  maxSlots: number;
  participants: ParticipantInfo[]; 
  status: 'UPCOMING' | 'LIVE' | 'COMPLETED';
  gameId?: string;
  gamePassword?: string;
  winnerId?: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  text: string;
  timestamp: number;
  read: boolean;
}
