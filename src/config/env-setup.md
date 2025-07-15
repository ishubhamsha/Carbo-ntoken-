# Environment Variables Setup

## Required Environment Variables

Create a `.env` file in your project root with the following variables:

```env
# Gasless Transfer Configuration
RPC_URL=https://sepolia.infura.io/v3/32aee738d2d34c9b902e52d758a9e57d
RELAYER_PRIVATE_KEY=0x7de3a59033f814c6cd861a664971c12573cd4231a97cf9bbbfe0d4c15dc92938
# EcoMetaTransfer Contract Address
ECO_META_CONTRACT=0xB4E765140cefB7E14B97899Ab573C1e27b5E12b6

# Network Configuration
NETWORK_CHAIN_ID=11155111
NETWORK_NAME=Sepolia

# Optional: Gas settings for relayer
GAS_LIMIT=300000
GAS_PRICE=20000000000
```

## Setup Instructions

### 1. Create .env file
Create a `.env` file in your project root directory.

### 2. Add RPC URL
The RPC URL is already provided for Sepolia testnet:
```
RPC_URL=https://sepolia.infura.io/v3/32aee738d2d34c9b902e52d758a9e57d
```

### 3. Add Relayer Private Key
Replace `<your_relayer_wallet_private_key>` with your actual relayer wallet private key:

```env
RELAYER_PRIVATE_KEY=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
```

**⚠️ Security Notes:**
- Never commit your `.env` file to version control
- Keep your private key secure
- Use a dedicated wallet for relayer operations
- Ensure the relayer wallet has sufficient ETH for gas fees

### 4. Verify Contract Address
The EcoMetaTransfer contract address is already set:
```
ECO_META_CONTRACT=0xB4E765140cefB7E14B97899Ab573C1e27b5E12b6
```

## Relayer Wallet Setup

### 1. Create Relayer Wallet
You can create a new wallet specifically for relayer operations:

```bash
# Using ethers.js to generate a new wallet
npx ts-node -e "
import { ethers } from 'ethers';
const wallet = ethers.Wallet.createRandom();
console.log('Address:', wallet.address);
console.log('Private Key:', wallet.privateKey);
"
```

### 2. Fund the Relayer Wallet
Send some ETH to the relayer wallet address for gas fees:
- Network: Sepolia Testnet
- Amount: At least 0.1 ETH for testing

### 3. Test the Setup
You can test if your environment is properly configured by running:

```bash
# Check if environment variables are loaded
node -e "
console.log('RPC_URL:', process.env.RPC_URL);
console.log('RELAYER_PRIVATE_KEY:', process.env.RELAYER_PRIVATE_KEY ? 'Set' : 'Not set');
console.log('ECO_META_CONTRACT:', process.env.ECO_META_CONTRACT);
"
```

## Usage in Code

The environment variables are used in the relay-transfer API:

```typescript
// From src/api/relay-transfer-example.ts
const RELAYER_PRIVATE_KEY = process.env.RELAYER_PRIVATE_KEY!;
const RPC_URL = process.env.RPC_URL || "https://sepolia.infura.io/v3/your-project-id";
const ECO_META_CONTRACT = "0xB4E765140cefB7E14B97899Ab573C1e27b5E12b6";
```

## Troubleshooting

### Common Issues:

1. **"Relayer has insufficient funds for gas"**
   - Fund your relayer wallet with more ETH

2. **"Invalid signature"**
   - Check that the EIP-712 domain and types match the contract

3. **"Transaction would fail"**
   - Ensure users have approved the EcoMetaTransfer contract
   - Check that users have sufficient ECO token balance

4. **"Invalid nonce"**
   - The nonce system prevents replay attacks
   - Each user's nonce increments with each transfer 