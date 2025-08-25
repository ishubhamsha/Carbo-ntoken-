import React, { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { Leaf, Instagram, Mail } from 'lucide-react';
import { useWallet } from './hooks/useWallet';
import { useContract } from './hooks/useContract';
import { WalletConnect } from './components/WalletConnect';
import { Dashboard } from './components/Dashboard';
import { ManufacturerPanel } from './components/ManufacturerPanel';
import { AuditorPanel } from './components/AuditorPanel';
import { AdminPanel } from './components/AdminPanel';
import { ComplianceReport } from './components/ComplianceReport';
import { SellTokenForm } from './components/SellTokenForm';
import { EcoProfile } from './components/EcoProfile';
import { SEPOLIA_CHAIN_ID } from './constants/contract';
import { ThemeToggle } from './components/ThemeToggle';
import Typewriter from './components/Typewriter';

function App() {
  const { wallet, provider, connectWallet, disconnect, updateTokenBalance } = useWallet();
  const {
    userRole,
    userActions,
    allUsers,
    roleEvents,
    loading,
    getTokenBalance,
    submitEcoAction,
    verifyAction,
    addManufacturer,
    addAuditor,
    removeRole,
    loadUserActions,
    checkUserRole, // <-- import checkUserRole
  } = useContract(provider, wallet.address);

  // Theme state and persistence
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
    }
    return 'light';
  });

  useEffect(() => {
    // Set the class on <html> for Tailwind dark mode
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const fetchTokenBalance = async () => {
      if (wallet.isConnected && wallet.address) {
        try {
          const balance = await getTokenBalance();
          updateTokenBalance(balance);
        } catch (error) {
          console.error('Error fetching token balance:', error);
        }
      }
    };

    fetchTokenBalance();
    if (wallet.isConnected && wallet.address) {
      checkUserRole(); // <-- refresh roles after wallet connect
    }
  }, [wallet.isConnected, wallet.address, getTokenBalance, updateTokenBalance, checkUserRole]);

  const isWrongNetwork = wallet.chainId !== null && wallet.chainId !== SEPOLIA_CHAIN_ID;

  // Add scroll to wallet connect
  const scrollToWallet = () => {
    const walletSection = document.getElementById('wallet-connect-section');
    if (walletSection) {
      walletSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FF9408] via-[#CA3F16] to-[#F3F4F5] relative overflow-hidden transition-colors duration-500">
      {/* Dark mode toggle button */}
      <div className="fixed top-4 right-4 z-50">
        {/* ThemeToggle will be created next */}
        <ThemeToggle theme={theme} setTheme={setTheme} />
      </div>
      {/* Extra crispy background layers */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="w-full h-full bg-gradient-to-tr from-emerald-300/40 via-blue-200/30 to-purple-300/40 blur-2xl opacity-80 animate-fade-in"></div>
        <div className="absolute left-1/4 top-0 w-1/2 h-1/2 bg-gradient-to-br from-purple-200 via-blue-100 to-emerald-200 rounded-full blur-3xl opacity-60 animate-bounce" style={{ filter: 'blur(80px)' }}></div>
        <div className="absolute right-0 bottom-0 w-1/3 h-1/3 bg-gradient-to-tr from-emerald-200 via-blue-100 to-purple-200 rounded-full blur-2xl opacity-50 animate-pulse" style={{ filter: 'blur(60px)' }}></div>
      </div>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: theme === 'dark' ? '#000' : '#ffffff',
            color: theme === 'dark' ? '#FFD600' : '#374151',
            border: theme === 'dark' ? '1px solid #FFD600' : '1px solid #e5e7eb',
            borderRadius: '12px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          },
          success: {
            iconTheme: {
              primary: theme === 'dark' ? '#FFD600' : '#10b981',
              secondary: theme === 'dark' ? '#000' : '#ffffff',
            },
          },
          error: {
            iconTheme: {
              primary: theme === 'dark' ? '#FFD600' : '#ef4444',
              secondary: theme === 'dark' ? '#000' : '#ffffff',
            },
          },
        }}
      />
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Hero Section */}
        <div className="relative mb-16">
          <div className="relative z-10 text-center py-16 bg-gradient-to-br from-[#7226ff] via-[#160078] to-[#010030] transition-colors duration-500 rounded-3xl text-white">
            <div className="flex items-center justify-center gap-3 mb-6 animate-fade-in">
              <div className="bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500 p-4 rounded-3xl shadow-2xl animate-bounce">
                <Leaf className="w-12 h-12 text-white drop-shadow-lg" />
              </div>
              <h1 className="text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 bg-clip-text text-transparent drop-shadow-lg">
                Carbon-Wise dApp
              </h1>
            </div>
            <p className="text-xl md:text-2xl text-gray-200 max-w-3xl mx-auto mb-8 font-medium">
              <Typewriter
                messages={[
                  'Track, verify, and earn for your carbon reduction efforts.',
                  'Join the movement for a greener future.',
                  'Get rewarded for every eco action.'
                ]}
                className="px-2 py-1 rounded-xl bg-gradient-to-r from-emerald-400 via-blue-500 via-purple-600 to-pink-500 text-gray-900 font-extrabold shadow-sm animated-gradient text-shadow-strong"
                typingSpeed={45}
                pauseTime={1500}
                eraseSpeed={30}
              />
              <br />
              <span className="text-emerald-200 font-semibold">Decentralized. Transparent. Rewarding.</span>
            </p>
            <div className="flex justify-center gap-4 mb-6">
              <button
                onClick={scrollToWallet}
                className="bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500 text-white font-bold py-4 px-10 rounded-full shadow-xl hover:scale-105 transition-transform duration-300 text-lg animate-pulse"
              >
                Get Started
              </button>
              <a
                href="https://sepolia.etherscan.io/address/0x6dbB1F7De2514efb1104F18E251F4BEe507dFC05"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white border border-emerald-400 text-emerald-700 font-bold py-4 px-10 rounded-full shadow-xl hover:bg-emerald-50 hover:scale-105 transition-transform duration-300 text-lg"
              >
                View Smart Contract
              </a>
            </div>
            <div className="flex justify-center gap-6 mt-8">
              <div className="flex flex-col items-center">
                <span className="bg-gradient-to-br from-blue-400 to-blue-600 p-3 rounded-full shadow-lg">
                  <Leaf className="w-8 h-8 text-white" />
                </span>
                <span className="mt-2 text-blue-200 font-semibold">Eco Actions</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="bg-gradient-to-br from-green-400 to-green-600 p-3 rounded-full shadow-lg">
                  <Leaf className="w-8 h-8 text-white" />
                </span>
                <span className="mt-2 text-green-200 font-semibold">Auditor Verification</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="bg-gradient-to-br from-purple-400 to-purple-600 p-3 rounded-full shadow-lg">
                  <Leaf className="w-8 h-8 text-white" />
                </span>
                <span className="mt-2 text-purple-200 font-semibold">Earn Carbon Credits</span>
              </div>
            </div>
          </div>
        </div>

        {/* Wrong Network Warning */}
        {isWrongNetwork && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 dark:bg-yellow-900/40 dark:border-yellow-400">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 p-2 rounded-lg dark:bg-yellow-400">
                <Leaf className="w-5 h-5 text-red-600 dark:text-black" />
              </div>
              <div>
                <h3 className="font-semibold text-red-800 dark:text-yellow-400">Wrong Network</h3>
                <p className="text-red-700 text-sm dark:text-yellow-300">
                  Please switch to Sepolia network to use this application.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="max-w-4xl mx-auto space-y-8">
          <div id="wallet-connect-section">
            <WalletConnect
              isConnected={wallet.isConnected}
              isConnecting={wallet.isConnecting}
              address={wallet.address}
              balance={wallet.balance}
              tokenBalance={wallet.tokenBalance}
              onConnect={connectWallet}
              onDisconnect={disconnect}
              provider={provider}
              contract={useContract(provider, wallet.address).contract}
              onRefreshBalance={async () => {
                if (wallet.isConnected && wallet.address) {
                  const balance = await getTokenBalance();
                  updateTokenBalance(balance);
                }
              }}
            />
          </div>

          {wallet.isConnected && wallet.address && !isWrongNetwork && (
            <>
              <Dashboard userRole={userRole} address={wallet.address} />

              {userRole.isAdmin && (
                <AdminPanel
                  allUsers={allUsers}
                  roleEvents={roleEvents}
                  loading={loading}
                  onAddManufacturer={async (address) => {
                    await addManufacturer(address);
                    await checkUserRole(); // <-- refresh roles after role change
                  }}
                  onAddAuditor={async (address) => {
                    await addAuditor(address);
                    await checkUserRole(); // <-- refresh roles after role change
                  }}
                  onRemoveRole={async (address, role) => {
                    await removeRole(address, role);
                    await checkUserRole(); // <-- refresh roles after role change
                  }}
                />
              )}

              {userRole.isManufacturer && (
                <ManufacturerPanel
                  userActions={userActions}
                  loading={loading}
                  onSubmitAction={async (description, reductionAmount, ipfsHash) => {
                    await submitEcoAction(description, reductionAmount, ipfsHash);
                    await loadUserActions();
                  }}
                />
              )}

              {userRole.isAuditor && (
                <AuditorPanel
                  loading={loading}
                  onVerifyAction={verifyAction}
                />
              )}

              {!userRole.isAdmin && !userRole.isManufacturer && !userRole.isAuditor && (
                <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 text-center">
                  <Leaf className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">No Role Assigned</h2>
                  <p className="text-gray-600 mb-6">
                    You don't have any role assigned yet. Contact an administrator to get started.
                  </p>
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
                    <p className="text-sm text-gray-700">
                      <strong>Available Roles:</strong>
                    </p>
                    <ul className="text-sm text-gray-600 mt-2 space-y-1">
                      <li>• <strong>Manufacturer:</strong> Submit eco-actions and track carbon reduction</li>
                      <li>• <strong>Auditor:</strong> Verify and validate manufacturer actions</li>
                      <li>• <strong>Admin:</strong> Manage user roles and permissions</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* New Modular Components */}
              <div className="space-y-8">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Carbon Credit Platform Tools</h2>
                  <p className="text-gray-600">Additional tools for managing your eco tokens and compliance</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Compliance Report */}
                  <ComplianceReport
                    provider={provider}
                    address={wallet.address}
                    isConnected={wallet.isConnected}
                  />

                  {/* Sell Token Form */}
                  <SellTokenForm
                    provider={provider}
                    address={wallet.address}
                    isConnected={wallet.isConnected}
                  />
                </div>

                {/* Eco Profile - Full Width */}
                <EcoProfile
                  provider={provider}
                  address={wallet.address}
                  isConnected={wallet.isConnected}
                />
              </div>
            </>
          )}
        </div>
      </div>
      {/* Footer */}
      <footer className="w-full flex flex-col items-center justify-center gap-2 py-6 mt-12 relative z-20">
        <div className="flex items-center gap-6">
          <a href="https://instagram.com/ishubhamsha" target="_blank" rel="noopener noreferrer" className="group flex items-center gap-2 text-pink-600 hover:text-pink-700 transition-colors duration-300">
            <span className="inline-block animate-bounce">
              <Instagram className="w-7 h-7" />
            </span>
            <span className="font-semibold text-lg">@ishubhamsha</span>
          </a>
          <span className="w-1 h-6 bg-gradient-to-b from-emerald-400 via-blue-400 to-purple-400 rounded-full opacity-60"></span>
          <a href="mailto:ishubhamsharma3@gmail.com" className="group flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors duration-300">
            <span className="inline-block animate-pulse">
              <Mail className="w-7 h-7" />
            </span>
            <span className="font-semibold text-lg">ishubhamsharma3@gmail.com</span>
          </a>
        </div>
        <span className="text-xs text-gray-400 mt-2">&copy; {new Date().getFullYear()} EcoToken dApp. All rights reserved.</span>
      </footer>
    </div>
  );
}

export default App;
