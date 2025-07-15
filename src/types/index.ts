export interface EcoAction {
  description: string;
  reductionAmount: number;
  ipfsHash: string;
  verified: boolean;
}

export interface UserRole {
  isManufacturer: boolean;
  isAuditor: boolean;
  isAdmin: boolean;
}

export interface User {
  address: string;
  roles: UserRole;
  tokenBalance: string;
  actionsCount: number;
}

export interface RoleChangeEvent {
  user: string;
  role: string;
  granted: boolean;
  timestamp: number;
}

export interface WalletState {
  address: string | null;
  balance: string;
  tokenBalance: string;
  isConnected: boolean;
  isConnecting: boolean;
  chainId: number | null;
}