import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Send, CheckCircle, XCircle, Clock, History } from 'lucide-react';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../constants/contract';
import toast from 'react-hot-toast';

interface SellTokenFormProps {
  provider: ethers.BrowserProvider | null;
  address: string | null;
  isConnected: boolean;
}

interface TransferHistory {
  id: string;
  to: string;
  amount: string;
  timestamp: Date;
  status: 'pending' | 'success' | 'failed';
  txHash?: string;
}

export const SellTokenForm: React.FC<SellTokenFormProps> = ({
  provider,
  address,
  isConnected
}) => {
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [tokenBalance, setTokenBalance] = useState('0');
  const [loading, setLoading] = useState(false);
  const [transferHistory, setTransferHistory] = useState<TransferHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (isConnected && address && provider) {
      fetchTokenBalance();
    }
  }, [isConnected, address, provider]);

  const fetchTokenBalance = async () => {
    if (!provider || !address) return;

    try {
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

  const handleTransfer = async () => {
    if (!provider || !address) {
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
    const newTransfer: TransferHistory = {
      id: transferId,
      to: recipientAddress,
      amount,
      timestamp: new Date(),
      status: 'pending'
    };
    
    setTransferHistory(prev => [newTransfer, ...prev]);

    try {
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      
      const amountWei = ethers.parseEther(amount);
      const tx = await contract.transfer(recipientAddress, amountWei);
      
      // Update history with transaction hash
      setTransferHistory(prev => 
        prev.map(transfer => 
          transfer.id === transferId 
            ? { ...transfer, txHash: tx.hash, status: 'pending' as const }
            : transfer
        )
      );

      toast.success('Transaction submitted! Waiting for confirmation...');
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      
      // Update history as successful
      setTransferHistory(prev => 
        prev.map(transfer => 
          transfer.id === transferId 
            ? { ...transfer, status: 'success' as const }
            : transfer
        )
      );

      toast.success('Transfer completed successfully!');
      
      // Reset form
      setRecipientAddress('');
      setAmount('');
      
      // Refresh token balance
      await fetchTokenBalance();
      
    } catch (error) {
      console.error('Transfer error:', error);
      
      // Update history as failed
      setTransferHistory(prev => 
        prev.map(transfer => 
          transfer.id === transferId 
            ? { ...transfer, status: 'failed' as const }
            : transfer
        )
      );

      if (error instanceof Error) {
        if (error.message.includes('insufficient balance')) {
          toast.error('Insufficient token balance');
        } else if (error.message.includes('user rejected')) {
          toast.error('Transaction was cancelled');
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

  const getStatusIcon = (status: TransferHistory['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusText = (status: TransferHistory['status']) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'success':
        return 'Success';
      case 'failed':
        return 'Failed';
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-gradient-to-br from-[#87f5f5] via-[#ffe5f1] to-[#f042ff] rounded-lg p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-blue-100 p-3 rounded-lg">
            <Send className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-black">Transfer Tokens</h3>
        </div>
        <div className="text-center py-8">
          <Send className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Please connect your wallet to transfer tokens.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-[#87f5f5] via-[#ffe5f1] to-[#f042ff] rounded-lg p-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-emerald-100 p-3 rounded-lg">
          <Send className="w-6 h-6 text-emerald-600" />
        </div>
        <h3 className="text-xl font-semibold text-black">Transfer Tokens</h3>
      </div>

      {/* Token Balance */}
      <div className="bg-gradient-to-br from-[#87f5f5] via-[#ffe5f1] to-[#f042ff] rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-emerald-700">Available Balance</span>
          <span className="text-lg font-semibold text-emerald-900">
            {parseFloat(tokenBalance).toFixed(2)} ECO
          </span>
        </div>
      </div>

      {/* Transfer Form */}
      <div className="bg-gradient-to-br from-[#87f5f5] via-[#ffe5f1] to-[#f042ff] rounded-lg p-4 mb-6">
        <div>
          <label htmlFor="recipient" className="block text-sm font-medium text-gray-700 mb-2">
            Recipient Address
          </label>
          <input
            type="text"
            id="recipient"
            value={recipientAddress}
            onChange={(e) => setRecipientAddress(e.target.value)}
            placeholder="0x..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            disabled={loading}
          />
          {recipientAddress && !validateAddress(recipientAddress) && (
            <p className="text-red-500 text-sm mt-1">Invalid address format</p>
          )}
        </div>

        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
            Amount (ECO)
          </label>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            step="0.01"
            min="0"
            max={tokenBalance}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            disabled={loading}
          />
          {amount && !validateAmount(amount) && (
            <p className="text-red-500 text-sm mt-1">
              Amount must be greater than 0 and not exceed your balance
            </p>
          )}
        </div>

        <button
          onClick={handleTransfer}
          disabled={loading || !recipientAddress || !amount || !validateAddress(recipientAddress) || !validateAmount(amount)}
          className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Processing...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Transfer Tokens
            </>
          )}
        </button>
      </div>

      {/* Transfer History */}
      {transferHistory.length > 0 && (
        <div className="border-t border-gray-200 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-black">Transfer History</h4>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700"
            >
              <History className="w-4 h-4" />
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