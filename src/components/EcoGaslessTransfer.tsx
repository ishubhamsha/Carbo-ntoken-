import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Send, CheckCircle, XCircle, Clock, Zap, Shield, Wallet, Coins } from 'lucide-react';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../constants/contract';
import toast from 'react-hot-toast';

// EcoMetaTransfer contract address
const ECO_META_TRANSFER_ADDRESS = "0xB4E765140cefB7E14B97899Ab573C1e27b5E12b6";

interface EcoGaslessTransferProps {
  provider: ethers.BrowserProvider | null;
  address: string | null;
  isConnected: boolean;
}

interface TransferRequest {
  from: string;
  to: string;
  amount: string;
  nonce: number;
  deadline: number;
}

export const EcoGaslessTransfer: React.FC<EcoGaslessTransferProps> = ({
  provider,
  address,
  isConnected
}) => {
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [tokenBalance, setTokenBalance] = useState('0');
  const [loading, setLoading] = useState(false);
  const [transferHistory, setTransferHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (isConnected && address && provider) {
      fetchTokenBalance();
    }
  }, [isConnected, address, provider]);

  const fetchTokenBalance = async () => {
    if (!provider || !address) return;

    try {
      // Use the main ECO token contract to get balance
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      const balance = await contract.balanceOf(address);
      setTokenBalance(ethers.formatEther(balance));
    } catch (error) {
      console.error('Error fetching token balance:', error);
      toast.error('Failed to fetch token balance');
    }
  };

  const validateAddress = (address: string): boolean => {
    return ethers.isAddress(address);
  };

  const validateAmount = (amount: string): boolean => {
    const numAmount = parseFloat(amount);
    return !isNaN(numAmount) && numAmount > 0 && numAmount <= parseFloat(tokenBalance);
  };

  // EIP-712 Domain for EcoMetaTransfer
  const getDomain = async () => {
    if (!provider) throw new Error('Provider not available');
    const network = await provider.getNetwork();
    
    return {
      name: 'EcoMetaTransfer',
      version: '1',
      chainId: network.chainId,
      verifyingContract: ECO_META_TRANSFER_ADDRESS
    };
  };

  const getTypes = () => ({
    Transfer: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' }
    ]
  });

  const getNonce = async (): Promise<number> => {
    if (!provider || !address) throw new Error('Provider or address not available');
    
    try {
      const contract = new ethers.Contract(ECO_META_TRANSFER_ADDRESS, [
        'function nonces(address owner) view returns (uint256)'
      ], provider);
      
      const nonce = await contract.nonces(address);
      return Number(nonce);
    } catch (error) {
      console.error('Error getting nonce:', error);
      // Fallback to timestamp-based nonce
      return Math.floor(Date.now() / 1000);
    }
  };

  const createTransferRequest = async (): Promise<TransferRequest> => {
    if (!address) throw new Error('Address not available');
    
    const nonce = await getNonce();
    const deadline = Math.floor(Date.now() / 1000) + 900; // 15 minutes from now
    
    return {
      from: address,
      to: recipientAddress,
      amount: ethers.parseEther(amount).toString(),
      nonce,
      deadline
    };
  };

  const signTransferRequest = async (transferRequest: TransferRequest): Promise<string> => {
    if (!provider || !address) throw new Error('Provider or address not available');
    
    const signer = await provider.getSigner();
    const domain = await getDomain();
    const types = getTypes();

    const signature = await signer.signTypedData(domain, types, transferRequest);
    return signature;
  };

  const relayTransfer = async (transferRequest: TransferRequest, signature: string): Promise<string> => {
    const response = await fetch('/api/relay-transfer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: transferRequest.from,
        to: transferRequest.to,
        amount: transferRequest.amount,
        nonce: transferRequest.nonce,
        deadline: transferRequest.deadline,
        signature: signature
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Relay request failed');
    }

    const result = await response.json();
    return result.txHash;
  };

  const handleGaslessTransfer = async () => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!validateAddress(recipientAddress)) {
      toast.error('Please enter a valid recipient address');
      return;
    }

    if (!validateAmount(amount)) {
      toast.error('Please enter a valid amount (must be greater than 0 and not exceed your balance)');
      return;
    }

    setLoading(true);
    const transferId = Date.now().toString();
    
    // Add to history as pending
    const newTransfer = {
      id: transferId,
      to: recipientAddress,
      amount,
      timestamp: new Date(),
      status: 'pending' as const,
      type: 'gasless'
    };
    
    setTransferHistory(prev => [newTransfer, ...prev]);

    try {
      // Step 1: Create transfer request
      const transferRequest = await createTransferRequest();
      
      // Step 2: Sign the transfer request
      const signature = await signTransferRequest(transferRequest);
      
      // Step 3: Send to relayer
      const txHash = await relayTransfer(transferRequest, signature);
      
      // Update history with transaction hash
      setTransferHistory(prev => 
        prev.map(transfer => 
          transfer.id === transferId 
            ? { ...transfer, txHash, status: 'success' as const }
            : transfer
        )
      );

      toast.success('Gasless transfer completed successfully!');
      
      // Reset form
      setRecipientAddress('');
      setAmount('');
      
      // Refresh token balance
      await fetchTokenBalance();
      
    } catch (error) {
      console.error('Gasless transfer error:', error);
      
      // Update history as failed
      setTransferHistory(prev => 
        prev.map(transfer => 
          transfer.id === transferId 
            ? { ...transfer, status: 'failed' as const, error: error instanceof Error ? error.message : 'Unknown error' }
            : transfer
        )
      );

      if (error instanceof Error) {
        if (error.message.includes('user rejected')) {
          toast.error('Transaction was cancelled');
        } else if (error.message.includes('relay')) {
          toast.error('Relay service error. Please try again.');
        } else {
          toast.error('Transfer failed. Please try again.');
        }
      } else {
        toast.error('Transfer failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'success':
        return 'Success';
      case 'failed':
        return 'Failed';
      default:
        return 'Unknown';
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-green-100 p-3 rounded-lg">
            <Zap className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">Eco Gasless Transfer</h3>
        </div>
        <div className="text-center py-8">
          <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Please connect your wallet to use gasless transfers.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-green-100 p-3 rounded-lg">
          <Zap className="w-6 h-6 text-green-600" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Eco Gasless Transfer</h3>
          <p className="text-sm text-gray-600">Transfer ECO tokens without gas fees</p>
        </div>
      </div>

      {/* Wallet Info */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Wallet className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Wallet Address</span>
        </div>
        <p className="text-sm text-gray-900 font-mono break-all">{address}</p>
      </div>

      {/* Gasless Transfer Info */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 mb-6 border border-green-200">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-4 h-4 text-green-600" />
          <span className="text-sm font-medium text-green-700">EIP-712 Meta-Transaction</span>
        </div>
        <p className="text-xs text-green-600">
          Sign a message to authorize the transfer. A relayer will execute the transaction for you.
        </p>
      </div>

      {/* Token Balance */}
      <div className="bg-emerald-50 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-700">ECO Balance</span>
          </div>
          <span className="text-lg font-semibold text-emerald-900">
            {parseFloat(tokenBalance).toFixed(2)} ECO
          </span>
        </div>
      </div>

      {/* Transfer Form */}
      <div className="space-y-4 mb-6">
        <div>
          <label htmlFor="eco-recipient" className="block text-sm font-medium text-gray-700 mb-2">
            Recipient Address
          </label>
          <input
            type="text"
            id="eco-recipient"
            value={recipientAddress}
            onChange={(e) => setRecipientAddress(e.target.value)}
            placeholder="0x..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
            disabled={loading}
          />
          {recipientAddress && !validateAddress(recipientAddress) && (
            <p className="text-red-500 text-sm mt-1">Invalid address format</p>
          )}
        </div>

        <div>
          <label htmlFor="eco-amount" className="block text-sm font-medium text-gray-700 mb-2">
            Amount (ECO)
          </label>
          <input
            type="number"
            id="eco-amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            step="0.01"
            min="0"
            max={tokenBalance}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
            disabled={loading}
          />
          {amount && !validateAmount(amount) && (
            <p className="text-red-500 text-sm mt-1">
              Amount must be greater than 0 and not exceed your balance
            </p>
          )}
        </div>

        <button
          onClick={handleGaslessTransfer}
          disabled={loading || !recipientAddress || !amount || !validateAddress(recipientAddress) || !validateAmount(amount)}
          className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Processing Gasless Transfer...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              Gasless Transfer
            </>
          )}
        </button>
      </div>

      {/* Transfer History */}
      {transferHistory.length > 0 && (
        <div className="border-t border-gray-200 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-900">Transfer History</h4>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2 text-sm text-green-600 hover:text-green-700"
            >
              {showHistory ? 'Hide' : 'Show'} History
            </button>
          </div>

          {showHistory && (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {transferHistory.map((transfer) => (
                <div
                  key={transfer.id}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(transfer.status)}
                      <span className={`text-sm font-medium ${
                        transfer.status === 'success' ? 'text-green-700' :
                        transfer.status === 'failed' ? 'text-red-700' :
                        'text-yellow-700'
                      }`}>
                        {getStatusText(transfer.status)}
                      </span>
                      {transfer.type === 'gasless' && (
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">
                          Gasless
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {transfer.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-700">
                    <p><span className="font-medium">To:</span> {transfer.to}</p>
                    <p><span className="font-medium">Amount:</span> {transfer.amount} ECO</p>
                    {transfer.txHash && (
                      <p className="text-xs text-gray-500 mt-1">
                        <span className="font-medium">Tx:</span> {transfer.txHash.slice(0, 10)}...{transfer.txHash.slice(-8)}
                      </p>
                    )}
                    {transfer.error && (
                      <p className="text-xs text-red-500 mt-1">
                        <span className="font-medium">Error:</span> {transfer.error}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}; 