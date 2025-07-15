// Example API implementation for relay-transfer endpoint
// This can be adapted for Express, Next.js, or other frameworks

import { ethers } from "ethers";

// EcoMetaTransfer contract ABI (minimal version for transferWithSig)
const ECO_META_TRANSFER_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "internalType": "address", 
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "nonce",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "deadline",
        "type": "uint256"
      },
      {
        "internalType": "bytes",
        "name": "signature",
        "type": "bytes"
      }
    ],
    "name": "transferWithSig",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "nonces",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// Environment variables (should be set in your .env file)
const RELAYER_PRIVATE_KEY = process.env.RELAYER_PRIVATE_KEY!;
const RPC_URL = process.env.RPC_URL || "https://sepolia.infura.io/v3/your-project-id";
const ECO_META_CONTRACT = "0xB4E765140cefB7E14B97899Ab573C1e27b5E12b6";

// Initialize provider and relayer wallet
const provider = new ethers.JsonRpcProvider(RPC_URL);
const relayerWallet = new ethers.Wallet(RELAYER_PRIVATE_KEY, provider);

const contract = new ethers.Contract(
  ECO_META_CONTRACT,
  ECO_META_TRANSFER_ABI,
  relayerWallet
);

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

interface RelayRequest {
  from: string;
  to: string;
  amount: string;
  nonce: number;
  deadline: number;
  signature: string;
}

export async function relayTransfer(request: RelayRequest): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    const { from, to, amount, nonce, deadline, signature } = request;

    // Validate required fields
    if (!from || !to || !amount || nonce === undefined || !deadline || !signature) {
      return { success: false, error: "Missing required fields" };
    }

    // Validate addresses
    if (!ethers.isAddress(from) || !ethers.isAddress(to)) {
      return { success: false, error: "Invalid address format" };
    }

    // Check if deadline has passed
    const currentTime = Math.floor(Date.now() / 1000);
    if (deadline < currentTime) {
      return { success: false, error: "Transfer deadline has passed" };
    }

    // Step 1: Recover the signer from the signature
    const recovered = ethers.verifyTypedData(
      DOMAIN,
      TYPES,
      { from, to, amount, nonce, deadline },
      signature
    );

    // Verify the recovered address matches the 'from' address
    if (recovered.toLowerCase() !== from.toLowerCase()) {
      return { success: false, error: "Invalid signature" };
    }

    // Step 2: Verify nonce to prevent replay attacks
    try {
      const currentNonce = await contract.nonces(from);
      if (Number(currentNonce) !== nonce) {
        return { success: false, error: "Invalid nonce" };
      }
    } catch (error) {
      console.error("Error checking nonce:", error);
      return { success: false, error: "Failed to verify nonce" };
    }

    // Step 3: Call the contract's transferWithSig function
    const tx = await contract.transferWithSig(
      from,
      to,
      amount,
      nonce,
      deadline,
      signature
    );

    // Wait for transaction confirmation
    const receipt = await tx.wait();

    console.log("Gasless transfer successful:", {
      from,
      to,
      amount: ethers.formatEther(amount),
      txHash: tx.hash,
      blockNumber: receipt.blockNumber
    });

    // Step 4: Return the transaction hash
    return { success: true, txHash: tx.hash };

  } catch (err: any) {
    console.error("Relay transfer error:", err);

    // Handle specific contract errors
    if (err.code === "INSUFFICIENT_FUNDS") {
      return { success: false, error: "Relayer has insufficient funds for gas" };
    }

    if (err.code === "UNPREDICTABLE_GAS_LIMIT") {
      return { success: false, error: "Transaction would fail (likely insufficient token balance or approval)" };
    }

    if (err.message?.includes("execution reverted")) {
      return { success: false, error: "Transaction reverted by contract" };
    }

    return { success: false, error: err.message || "Internal server error" };
  }
}

// Example usage for different frameworks:

// For Express.js:
/*
import express from 'express';
const app = express();

app.post('/api/relay-transfer', async (req, res) => {
  try {
    const result = await relayTransfer(req.body);
    if (result.success) {
      res.json({ success: true, txHash: result.txHash });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});
*/

// For Next.js App Router:
/*
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await relayTransfer(body);
    
    if (result.success) {
      return NextResponse.json({ success: true, txHash: result.txHash });
    } else {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
*/

// For Vite/React (using a proxy or separate backend):
/*
// In your EcoGaslessTransfer component, you can call this directly:
const response = await fetch('/api/relay-transfer', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    from: transferRequest.from,
    to: transferRequest.to,
    amount: transferRequest.amount,
    nonce: transferRequest.nonce,
    deadline: transferRequest.deadline,
    signature: signature
  })
});

const result = await response.json();
if (result.success) {
  console.log('Transfer successful:', result.txHash);
} else {
  console.error('Transfer failed:', result.error);
}
*/ 