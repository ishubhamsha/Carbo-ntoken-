// Example API endpoint for gasless transfer relay
// This would typically be a backend service that executes meta-transactions

import { ethers } from 'ethers';
import EcoMetaTransferAbi from '../abi/EcoMetaTransfer.json';

// Environment variables
const RPC_URL = process.env.RPC_URL || "https://sepolia.infura.io/v3/32aee738d2d34c9b902e52d758a9e57d";
const RELAYER_PRIVATE_KEY = process.env.RELAYER_PRIVATE_KEY!;
const ECO_META_CONTRACT = "0xB4E765140cefB7E14B97899Ab573C1e27b5E12b6";

// Initialize provider and relayer wallet
const provider = new ethers.JsonRpcProvider(RPC_URL);
const relayer = new ethers.Wallet(RELAYER_PRIVATE_KEY, provider);

const contract = new ethers.Contract(
  ECO_META_CONTRACT,
  EcoMetaTransferAbi,
  relayer
);

// EIP-712 Domain and Types for signature verification
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

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { from, to, amount, nonce, deadline, signature } = req.body as RelayRequest;

  try {
    // Validate required fields
    if (!from || !to || !amount || nonce === undefined || !deadline || !signature) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate addresses
    if (!ethers.isAddress(from) || !ethers.isAddress(to)) {
      return res.status(400).json({ error: 'Invalid address format' });
    }

    // Check if deadline has passed
    const currentTime = Math.floor(Date.now() / 1000);
    if (deadline < currentTime) {
      return res.status(400).json({ error: 'Transfer deadline has passed' });
    }

    // Verify EIP-712 signature
    try {
      const recovered = ethers.verifyTypedData(
        DOMAIN,
        TYPES,
        { from, to, amount, nonce, deadline },
        signature
      );

      if (recovered.toLowerCase() !== from.toLowerCase()) {
        return res.status(400).json({ error: 'Invalid signature' });
      }
    } catch (error) {
      console.error('Signature verification error:', error);
      return res.status(400).json({ error: 'Signature verification failed' });
    }

    // Verify nonce to prevent replay attacks
    try {
      const currentNonce = await contract.nonces(from);
      if (Number(currentNonce) !== nonce) {
        return res.status(400).json({ error: 'Invalid nonce' });
      }
    } catch (error) {
      console.error('Nonce verification error:', error);
      return res.status(500).json({ error: 'Failed to verify nonce' });
    }

    // Execute the gasless transfer
    console.log('Executing gasless transfer:', {
      from,
      to,
      amount: ethers.formatEther(amount),
      nonce,
      deadline: new Date(deadline * 1000).toLocaleString()
    });

    const tx = await contract.transferWithSig(from, to, amount, nonce, deadline, signature);
    
    // Wait for transaction confirmation
    const receipt = await tx.wait();

    console.log('Gasless transfer successful:', {
      txHash: tx.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed?.toString()
    });

    res.status(200).json({ 
      success: true,
      txHash: tx.hash,
      blockNumber: receipt.blockNumber
    });

  } catch (err: any) {
    console.error('Relayer Error:', err);

    // Handle specific contract errors
    if (err.code === "INSUFFICIENT_FUNDS") {
      return res.status(500).json({ 
        error: 'Relayer has insufficient funds for gas' 
      });
    }

    if (err.code === "UNPREDICTABLE_GAS_LIMIT") {
      return res.status(400).json({ 
        error: 'Transaction would fail (likely insufficient token balance or approval)' 
      });
    }

    if (err.message?.includes("execution reverted")) {
      return res.status(400).json({ 
        error: 'Transaction reverted by contract' 
      });
    }

    if (err.message?.includes("user rejected")) {
      return res.status(400).json({ 
        error: 'Transaction was rejected by user' 
      });
    }

    res.status(500).json({ 
      error: err.message || 'Failed to relay transaction' 
    });
  }
}

// Optional: Add a GET endpoint to check relayer status
export async function getRelayerStatus(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const relayerBalance = await provider.getBalance(relayer.address);
    
    res.status(200).json({
      relayerAddress: relayer.address,
      relayerBalance: ethers.formatEther(relayerBalance),
      contractAddress: ECO_META_CONTRACT,
      network: "Sepolia"
    });
  } catch (error) {
    console.error('Error getting relayer status:', error);
    res.status(500).json({ error: 'Failed to get relayer status' });
  }
} 