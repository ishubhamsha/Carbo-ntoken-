import { ethers } from 'ethers';

// Test the gasless transfer data structure
export interface GaslessTransferData {
  from: string;
  to: string;
  amount: string;
  nonce: number;
  deadline: number;
  signature: string;
}

// EcoMetaTransfer contract address
const ECO_META_CONTRACT = "0xB4E765140cefB7E14B97899Ab573C1e27b5E12b6";

// EIP-712 Domain and Types
const DOMAIN = {
  name: "EcoMetaTransfer",
  version: "1",
  chainId: 11155111, // Sepolia
  verifyingContract: ECO_META_CONTRACT,
};

const TYPES = {
  Transfer: [
    { name: "from", type: "address" },
    { name: "to", type: "address" },
    { name: "amount", type: "uint256" },
    { name: "nonce", type: "uint256" },
    { name: "deadline", type: "uint256" },
  ],
};

export function validateGaslessTransferData(data: GaslessTransferData): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate required fields
  if (!data.from) errors.push("Missing 'from' address");
  if (!data.to) errors.push("Missing 'to' address");
  if (!data.amount) errors.push("Missing 'amount'");
  if (data.nonce === undefined) errors.push("Missing 'nonce'");
  if (!data.deadline) errors.push("Missing 'deadline'");
  if (!data.signature) errors.push("Missing 'signature'");

  // Validate addresses
  if (data.from && !ethers.isAddress(data.from)) {
    errors.push("Invalid 'from' address format");
  }
  if (data.to && !ethers.isAddress(data.to)) {
    errors.push("Invalid 'to' address format");
  }

  // Validate amount
  if (data.amount) {
    try {
      const amount = ethers.parseUnits(data.amount, 18);
      if (amount <= 0n) {
        errors.push("Amount must be greater than 0");
      }
    } catch {
      errors.push("Invalid amount format");
    }
  }

  // Validate deadline
  if (data.deadline) {
    const currentTime = Math.floor(Date.now() / 1000);
    if (data.deadline < currentTime) {
      errors.push("Deadline has already passed");
    }
  }

  // Validate signature format
  if (data.signature && !data.signature.startsWith('0x')) {
    errors.push("Signature must start with '0x'");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function createTestGaslessTransferData(): GaslessTransferData {
  const currentTime = Math.floor(Date.now() / 1000);
  
  return {
    from: "0x1234567890123456789012345678901234567890",
    to: "0x0987654321098765432109876543210987654321",
    amount: "1000000000000000000", // 1 ECO token (18 decimals)
    nonce: 0,
    deadline: currentTime + 900, // 15 minutes from now
    signature: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1b"
  };
}

export function logGaslessTransferData(data: GaslessTransferData) {
  console.log("🔍 Gasless Transfer Data Structure:");
  console.log("📋 Data:", {
    from: data.from,
    to: data.to,
    amount: data.amount,
    nonce: data.nonce,
    deadline: data.deadline,
    signature: data.signature.substring(0, 20) + "..."
  });

  const validation = validateGaslessTransferData(data);
  
  if (validation.isValid) {
    console.log("✅ Data structure is valid");
  } else {
    console.log("❌ Validation errors:");
    validation.errors.forEach(error => console.log(`   - ${error}`));
  }

  console.log("\n📊 Data Analysis:");
  console.log(`   From: ${data.from}`);
  console.log(`   To: ${data.to}`);
  console.log(`   Amount: ${ethers.formatEther(data.amount)} ECO`);
  console.log(`   Nonce: ${data.nonce}`);
  console.log(`   Deadline: ${new Date(data.deadline * 1000).toLocaleString()}`);
  console.log(`   Signature Length: ${data.signature.length} characters`);
}

// Test function
export async function testGaslessTransfer() {
  console.log("🧪 Testing Gasless Transfer Data Structure\n");
  
  const testData = createTestGaslessTransferData();
  logGaslessTransferData(testData);
  
  console.log("\n🔧 Expected API Request Format:");
  console.log("POST /api/relay-transfer");
  console.log("Content-Type: application/json");
  console.log("Body:", JSON.stringify(testData, null, 2));
  
  console.log("\n📝 Environment Variables Check:");
  console.log("RPC_URL:", process.env.RPC_URL ? "✅ Set" : "❌ Not set");
  console.log("RELAYER_PRIVATE_KEY:", process.env.RELAYER_PRIVATE_KEY ? "✅ Set" : "❌ Not set");
  console.log("ECO_META_CONTRACT:", ECO_META_CONTRACT);
}

// Example usage in browser console or Node.js
if (typeof window !== 'undefined') {
  // Browser environment
  (window as any).testGaslessTransfer = testGaslessTransfer;
  (window as any).validateGaslessTransferData = validateGaslessTransferData;
  (window as any).createTestGaslessTransferData = createTestGaslessTransferData;
} 