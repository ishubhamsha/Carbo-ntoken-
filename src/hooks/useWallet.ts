import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { WalletState } from '../types';
import { SEPOLIA_CHAIN_ID } from '../constants/contract';
import toast from 'react-hot-toast';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export const useWallet = () => {
  const [wallet, setWallet] = useState<WalletState>({
    address: null,
    balance: '0',
    tokenBalance: '0',
    isConnected: false,
    isConnecting: false,
    chainId: null,
  });

  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);

  useEffect(() => {
    checkConnection();
    setupEventListeners();
  }, []);

  const checkConnection = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        setProvider(provider);
        
        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
          const network = await provider.getNetwork();
          const balance = await provider.getBalance(accounts[0].address);
          
          setWallet({
            address: accounts[0].address,
            balance: ethers.formatEther(balance),
            tokenBalance: '0',
            isConnected: true,
            isConnecting: false,
            chainId: Number(network.chainId),
          });
        }
      } catch (error) {
        console.error('Error checking connection:', error);
      }
    }
  };

  const setupEventListeners = () => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    }
  };

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      disconnect();
    } else {
      checkConnection();
    }
  };

  const handleChainChanged = () => {
    checkConnection();
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      toast.error('MetaMask is not installed. Please install MetaMask to continue.');
      return;
    }

    setWallet(prev => ({ ...prev, isConnecting: true }));

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      
      const network = await provider.getNetwork();
      if (Number(network.chainId) !== SEPOLIA_CHAIN_ID) {
        await switchToSepolia();
      }
      
      await checkConnection();
      toast.success('Wallet connected successfully!');
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      toast.error(error.message || 'Failed to connect wallet');
      setWallet(prev => ({ ...prev, isConnecting: false }));
    }
  };

  const switchToSepolia = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${SEPOLIA_CHAIN_ID.toString(16)}` }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: `0x${SEPOLIA_CHAIN_ID.toString(16)}`,
                chainName: 'Sepolia',
                nativeCurrency: {
                  name: 'Sepolia ETH',
                  symbol: 'ETH',
                  decimals: 18,
                },
                rpcUrls: ['https://sepolia.infura.io/v3/'],
                blockExplorerUrls: ['https://sepolia.etherscan.io/'],
              },
            ],
          });
        } catch (addError) {
          throw new Error('Failed to add Sepolia network');
        }
      } else {
        throw switchError;
      }
    }
  };

  const disconnect = () => {
    setWallet({
      address: null,
      balance: '0',
      tokenBalance: '0',
      isConnected: false,
      isConnecting: false,
      chainId: null,
    });
    setProvider(null);
    toast.success('Wallet disconnected');
  };

  const updateTokenBalance = (balance: string) => {
    setWallet(prev => ({ ...prev, tokenBalance: balance }));
  };

  return {
    wallet,
    provider,
    connectWallet,
    disconnect,
    updateTokenBalance,
  };
};