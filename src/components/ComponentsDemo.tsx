import React from 'react';
import { ethers } from 'ethers';
import { ComplianceReport } from './ComplianceReport';
import { SellTokenForm } from './SellTokenForm';
import { EcoProfile } from './EcoProfile';

interface ComponentsDemoProps {
  provider: ethers.BrowserProvider | null;
  address: string | null;
  isConnected: boolean;
}

export const ComponentsDemo: React.FC<ComponentsDemoProps> = ({
  provider,
  address,
  isConnected
}) => {
  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2 dark:text-yellow-300">Carbon Credit Platform Components</h2>
        <p className="text-gray-600 dark:text-yellow-200">Modular React components for the EcoToken dApp</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="rounded-2xl shadow-lg p-6 border relative bg-gradient-to-br from-[#F3F4F5] to-[#FF9408] border-yellow-400 text-black">
          {/* Compliance Report */}
          <ComplianceReport provider={provider} address={address} isConnected={isConnected} />
        </div>
        <div className="rounded-2xl shadow-lg p-6 border relative bg-gradient-to-br from-[#DBE0E1] to-[#CA3F16] border-orange-800 text-black">
          {/* Sell Token Form (Transfer Tokens) */}
          <SellTokenForm provider={provider} address={address} isConnected={isConnected} />
        </div>
      </div>
      <div className="rounded-2xl shadow-lg p-6 border relative bg-gradient-to-br from-[#FF9408] to-[#95122C] border-red-900 text-white">
        {/* Eco Profile - Full Width */}
        <EcoProfile provider={provider} address={address} isConnected={isConnected} />
      </div>
    </div>
  );
}; 