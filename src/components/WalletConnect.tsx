import React, { useState } from 'react';
import { Wallet, LogOut, ArrowRightCircle, X, Loader2, QrCode } from 'lucide-react';
import { ethers } from 'ethers';
import { QRCodeCanvas } from 'qrcode.react';

interface WalletConnectProps {
  isConnected: boolean;
  isConnecting: boolean;
  address: string | null;
  balance: string;
  tokenBalance: string;
  onConnect: () => void;
  onDisconnect: () => void;
  provider?: ethers.BrowserProvider | null; // Add provider prop
  contract?: ethers.Contract | null; // Add contract prop (ERC20)
  onRefreshBalance?: () => void; // Optional callback to refresh balance
}

export const WalletConnect: React.FC<WalletConnectProps> = ({
  isConnected,
  isConnecting,
  address,
  balance,
  tokenBalance,
  onConnect,
  onDisconnect,
  provider,
  contract,
  onRefreshBalance,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [txStatus, setTxStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [txError, setTxError] = useState('');
  const [modalTab, setModalTab] = useState<'send' | 'receive'>('send');
  const [copySuccess, setCopySuccess] = useState(false);
  const [sendType, setSendType] = useState<'eco' | 'eth'>('eco');

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const resetModal = () => {
    setRecipient('');
    setAmount('');
    setTxStatus('idle');
    setTxError('');
    setIsSending(false);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!provider) {
      setTxError('Wallet not connected.');
      return;
    }
    if (!ethers.isAddress(recipient)) {
      setTxError('Invalid recipient address.');
      return;
    }
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setTxError('Enter a valid amount.');
      return;
    }
    setIsSending(true);
    setTxStatus('pending');
    setTxError('');
    try {
      const signer = await provider.getSigner();
      if (sendType === 'eco') {
        if (!contract) {
          setTxError('Token contract not connected.');
          setIsSending(false);
          return;
        }
        const decimals = 18;
        const amountInWei = ethers.parseUnits(amount, decimals);
        // @ts-ignore: dynamic contract method
        const tx = await contract.connect(signer)['transfer'](recipient, amountInWei);
        await tx.wait();
        setTxStatus('success');
        resetModal();
        setShowModal(false);
        if (typeof onRefreshBalance === 'function') {
          onRefreshBalance();
        }
      } else if (sendType === 'eth') {
        const tx = await signer.sendTransaction({
          to: recipient,
          value: ethers.parseEther(amount)
        });
        await tx.wait();
        setTxStatus('success');
        resetModal();
        setShowModal(false);
      }
    } catch (err: any) {
      setTxStatus('error');
      setTxError(err.message || 'Transaction failed');
    } finally {
      setIsSending(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="flex justify-center mb-8">
        <button
          onClick={onConnect}
          disabled={isConnecting}
          className="flex items-center gap-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none dark:bg-yellow-400 dark:text-black dark:border-2 dark:border-yellow-400 dark:shadow-yellow-400/40 dark:hover:bg-yellow-300 dark:hover:text-black"
        >
          <Wallet size={24} />
          {isConnecting ? 'Connecting...' : 'Connect MetaMask'}
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl shadow-lg p-6 mb-8 border border-yellow-400 bg-gradient-to-br from-[#F3F4F5] to-[#FF9408] text-black">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Wallet Connected</h2>
        <button onClick={onDisconnect} className="flex items-center gap-2 text-red-600 hover:text-red-700 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors duration-200 focus:ring-2 focus:ring-red-300 focus:outline-none shadow-md">
          <LogOut size={18} />
          Disconnect
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
          <div className="text-blue-600 text-sm font-medium mb-1">Address</div>
          <div className="text-blue-800 font-mono text-lg font-semibold">
            {formatAddress(address!)}
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
          <div className="text-purple-600 text-sm font-medium mb-1">ETH Balance</div>
          <div className="text-purple-800 font-mono text-lg font-semibold">
            {parseFloat(balance).toFixed(4)} ETH
          </div>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200">
          <div className="text-emerald-600 text-sm font-medium mb-1">Token Balance</div>
          <div className="text-emerald-800 font-mono text-lg font-semibold">
            {parseFloat(tokenBalance).toFixed(2)} ECO
          </div>
        </div>
      </div>
      {/* Animated Make Transaction Button */}
      <div className="flex flex-col items-center mt-2">
        <button
          className="flex items-center gap-3 bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-500 text-white font-bold py-4 px-10 rounded-full shadow-2xl hover:scale-105 transition-transform duration-300 text-lg animate-pulse focus:ring-4 focus:ring-blue-200 focus:outline-none border-2 border-transparent hover:border-blue-400 relative"
          onClick={() => { setShowModal(true); resetModal(); }}
        >
          <ArrowRightCircle className="w-7 h-7 animate-bounce" />
          Make Transaction
        </button>
        <span className="mt-2 text-sm text-blue-500 animate-fade-in">Try a transaction and see the magic!</span>
      </div>
      {/* Modal for Send Token */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative animate-fade-in">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-red-500"
              onClick={() => setShowModal(false)}
              disabled={isSending}
            >
              <X className="w-6 h-6" />
            </button>
            <div className="flex justify-center mb-6 gap-4">
              <button
                className={`px-4 py-2 rounded-lg font-bold text-lg transition-colors duration-200 ${modalTab === 'send' ? 'bg-gradient-to-r from-emerald-400 to-purple-400 text-white shadow' : 'bg-gray-100 text-gray-600'}`}
                onClick={() => setModalTab('send')}
                disabled={isSending}
              >
                Send
              </button>
              <button
                className={`px-4 py-2 rounded-lg font-bold text-lg transition-colors duration-200 ${modalTab === 'receive' ? 'bg-gradient-to-r from-blue-400 to-purple-400 text-white shadow' : 'bg-gray-100 text-gray-600'}`}
                onClick={() => setModalTab('receive')}
                disabled={isSending}
              >
                Receive
              </button>
            </div>
            {modalTab === 'send' ? (
              <>
                <h3 className="text-2xl font-bold mb-6 text-center text-emerald-600">Send Tokens</h3>
                <form onSubmit={handleSend} className="space-y-5">
                  <div className="flex justify-center gap-4 mb-2">
                    <button
                      type="button"
                      className={`px-4 py-2 rounded-lg font-bold text-base transition-colors duration-200 ${sendType === 'eco' ? 'bg-gradient-to-r from-emerald-400 to-purple-400 text-white shadow' : 'bg-gray-100 text-gray-600'}`}
                      onClick={() => setSendType('eco')}
                      disabled={isSending}
                    >
                      Send ECO Token
                    </button>
                    <button
                      type="button"
                      className={`px-4 py-2 rounded-lg font-bold text-base transition-colors duration-200 ${sendType === 'eth' ? 'bg-gradient-to-r from-blue-400 to-purple-400 text-white shadow' : 'bg-gray-100 text-gray-600'}`}
                      onClick={() => setSendType('eth')}
                      disabled={isSending}
                    >
                      Send ETH
                    </button>
                  </div>
                  <div className="text-center text-xs text-gray-500 mb-2">
                    {sendType === 'eco' ? `Your ECO Balance: ${parseFloat(tokenBalance).toFixed(2)} ECO` : `Your ETH Balance: ${parseFloat(balance).toFixed(4)} ETH`}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Address</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors duration-200"
                      value={recipient}
                      onChange={e => setRecipient(e.target.value)}
                      placeholder="0x..."
                      disabled={isSending}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount {sendType === 'eco' ? '(ECO)' : '(ETH)'}</label>
                    <input
                      type="number"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors duration-200"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      min="0"
                      step="0.0001"
                      disabled={isSending}
                      required
                    />
                  </div>
                  {txError && <div className="text-red-500 text-sm text-center">{txError}</div>}
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-emerald-500 to-purple-500 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:scale-105 transition-transform duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isSending}
                  >
                    {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRightCircle className="w-5 h-5" />}
                    {isSending ? (sendType === 'eco' ? 'Sending ECO...' : 'Sending ETH...') : (sendType === 'eco' ? 'Send ECO Tokens' : 'Send ETH')}
                  </button>
                  {txStatus === 'success' && <div className="text-green-600 text-center mt-2">Transaction successful!</div>}
                </form>
              </>
            ) : (
              <>
                <h3 className="text-2xl font-bold mb-6 text-center text-blue-600">Receive Tokens</h3>
                <div className="flex flex-col items-center gap-4">
                  <div className="flex items-center gap-2 bg-gradient-to-r from-blue-100 to-purple-100 px-4 py-3 rounded-xl">
                    <QrCode className="w-7 h-7 text-blue-500" />
                    <span className="font-mono text-base text-blue-700 select-all">{address}</span>
                  </div>
                  {/* Simple QR code using qrcode.react */}
                  {address && (
                    <QRCodeCanvas
                      value={address}
                      size={200}
                      bgColor="#fff"
                      fgColor="#2563eb"
                      className="rounded-lg border border-blue-200 shadow-md"
                    />
                  )}
                  <button
                    className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600 transition-colors duration-200 font-semibold"
                    onClick={async () => {
                      if (address) {
                        await navigator.clipboard.writeText(address);
                        setCopySuccess(true);
                        setTimeout(() => setCopySuccess(false), 1500);
                      }
                    }}
                  >
                    {copySuccess ? 'Copied!' : 'Copy Address'}
                  </button>
                  <span className="text-sm text-gray-500">Scan or copy your address to receive ECO tokens.</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};