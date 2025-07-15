import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import jsPDF from 'jspdf';
import { QRCodeSVG } from 'qrcode.react';
import { Download, FileText, Wallet, Coins } from 'lucide-react';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../constants/contract';
import toast from 'react-hot-toast';

interface ComplianceReportProps {
  provider: ethers.BrowserProvider | null;
  address: string | null;
  isConnected: boolean;
}

interface WalletData {
  address: string;
  balance: string;
  tokenBalance: string;
}

export const ComplianceReport: React.FC<ComplianceReportProps> = ({
  provider,
  address,
  isConnected
}) => {
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  useEffect(() => {
    if (isConnected && address && provider) {
      fetchWalletData();
    }
  }, [isConnected, address, provider]);

  const fetchWalletData = async () => {
    if (!provider || !address) return;

    setLoading(true);
    try {
      // Get ETH balance
      const balance = await provider.getBalance(address);
      const ethBalance = ethers.formatEther(balance);

      // Get token balance
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      const tokenBalance = await contract.balanceOf(address);
      const formattedTokenBalance = ethers.formatEther(tokenBalance);

      setWalletData({
        address,
        balance: ethBalance,
        tokenBalance: formattedTokenBalance
      });
    } catch (error) {
      console.error('Error fetching wallet data:', error);
      toast.error('Failed to fetch wallet data');
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = async () => {
    if (!walletData) return;

    setGeneratingPdf(true);
    try {
      const doc = new jsPDF();
      const timestamp = new Date().toLocaleString();
      const etherscanUrl = `https://sepolia.etherscan.io/address/${walletData.address}`;

      // Title
      doc.setFontSize(20);
      doc.setTextColor(16, 185, 129); // emerald-500
      doc.text('EcoToken Compliance Report', 20, 30);

      // Timestamp
      doc.setFontSize(12);
      doc.setTextColor(107, 114, 128); // gray-500
      doc.text(`Generated: ${timestamp}`, 20, 45);

      // Wallet Information
      doc.setFontSize(14);
      doc.setTextColor(17, 24, 39); // gray-900
      doc.text('Wallet Information:', 20, 65);

      doc.setFontSize(10);
      doc.setTextColor(55, 65, 81); // gray-700
      doc.text(`Address: ${walletData.address}`, 20, 80);
      doc.text(`ETH Balance: ${parseFloat(walletData.balance).toFixed(4)} ETH`, 20, 90);
      doc.text(`Eco Token Balance: ${parseFloat(walletData.tokenBalance).toFixed(2)} ECO`, 20, 100);

      // QR Code (SVG not supported in jsPDF, so we add the Etherscan link as text)
      doc.setFontSize(12);
      doc.setTextColor(17, 24, 39);
      doc.text('View on Etherscan:', 20, 120);
      doc.setTextColor(37, 99, 235); // blue-600
      doc.textWithLink(etherscanUrl, 20, 130, { url: etherscanUrl });

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128);
      doc.text('EcoToken Carbon Credit Platform - Sepolia Testnet', 20, 280);

      // Save PDF
      doc.save(`eco-compliance-report-${Date.now()}.pdf`);
      toast.success('PDF report generated successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF report');
    } finally {
      setGeneratingPdf(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-blue-100 p-3 rounded-lg">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">Compliance Report</h3>
        </div>
        <div className="text-center py-8">
          <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Please connect your wallet to generate a compliance report.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl shadow-lg p-6 border border-yellow-400 bg-gradient-to-br from-[#F3F4F5] to-[#FF9408] text-black">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-emerald-100 p-3 rounded-lg">
          <FileText className="w-6 h-6 text-emerald-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900">Compliance Report</h3>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading wallet data...</p>
        </div>
      ) : walletData ? (
        <div className="space-y-6">
          {/* Wallet Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-[#87f5f5] via-[#ffe5f1] to-[#f042ff] rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Wallet Address</span>
              </div>
              <p className="text-sm text-gray-900 font-mono break-all">{walletData.address}</p>
            </div>

            <div className="bg-gradient-to-br from-[#87f5f5] via-[#ffe5f1] to-[#f042ff] rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Coins className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-700">Eco Token Balance</span>
              </div>
              <p className="text-lg font-semibold text-emerald-900">
                {parseFloat(walletData.tokenBalance).toFixed(2)} ECO
              </p>
            </div>
          </div>

          {/* QR Code */}
          <div className="bg-gradient-to-br from-[#87f5f5] via-[#ffe5f1] to-[#f042ff] rounded-lg p-4 mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Etherscan QR Code</h4>
            <div className="flex justify-center">
              <QRCodeSVG
                value={`https://sepolia.etherscan.io/address/${walletData.address}`}
                size={120}
                level="M"
                fgColor="#10b981"
                bgColor="#ffffff"
              />
            </div>
            <p className="text-xs text-gray-500 text-center mt-2">
              Scan to view on Etherscan
            </p>
          </div>

          {/* Generate PDF Button */}
          <div className="flex justify-center">
            <button
              onClick={generatePDF}
              disabled={generatingPdf}
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generatingPdf ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Generate PDF Report
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-600">Failed to load wallet data.</p>
          <button
            onClick={fetchWalletData}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}; 