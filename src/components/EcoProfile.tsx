import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { User, Award, FileText, ExternalLink, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../constants/contract';
import { EcoAction } from '../types';
import toast from 'react-hot-toast';

interface EcoProfileProps {
  provider: ethers.BrowserProvider | null;
  address: string | null;
  isConnected: boolean;
}

interface ManufacturerAction {
  description: string;
  reductionAmount: number;
  ipfsHash: string;
  verified: boolean;
  actionId: number;
}

export const EcoProfile: React.FC<EcoProfileProps> = ({
  provider,
  address,
  isConnected
}) => {
  const [actions, setActions] = useState<ManufacturerAction[]>([]);
  const [tokenBalance, setTokenBalance] = useState('0');
  const [loading, setLoading] = useState(false);
  const [totalReduction, setTotalReduction] = useState(0);
  const [verifiedActions, setVerifiedActions] = useState(0);

  useEffect(() => {
    if (isConnected && address && provider) {
      fetchProfileData();
    }
  }, [isConnected, address, provider]);

  const fetchProfileData = async () => {
    if (!provider || !address) return;

    setLoading(true);
    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      
      // Get token balance
      const balance = await contract.balanceOf(address);
      setTokenBalance(ethers.formatEther(balance));

      // Fetch all manufacturer actions
      const manufacturerActions: ManufacturerAction[] = [];
      let actionId = 0;
      let totalReductionAmount = 0;
      let verifiedCount = 0;

      while (true) {
        try {
          const action = await contract.manufacturerActions(address, actionId);
          
          const actionData: ManufacturerAction = {
            description: action.description,
            reductionAmount: Number(action.reductionAmount),
            ipfsHash: action.ipfsHash,
            verified: action.verified,
            actionId
          };

          manufacturerActions.push(actionData);
          
          if (action.verified) {
            verifiedCount++;
          }
          
          totalReductionAmount += Number(action.reductionAmount);
          actionId++;
        } catch {
          // No more actions found
          break;
        }
      }

      setActions(manufacturerActions);
      setTotalReduction(totalReductionAmount);
      setVerifiedActions(verifiedCount);
    } catch (error) {
      console.error('Error fetching profile data:', error);
      toast.error('Failed to fetch profile data');
    } finally {
      setLoading(false);
    }
  };

  const getEcoScore = (): number => {
    const balance = parseFloat(tokenBalance);
    const verifiedRatio = actions.length > 0 ? verifiedActions / actions.length : 0;
    const reductionBonus = totalReduction * 0.1; // 10% bonus per reduction unit
    
    return Math.round(balance + (verifiedRatio * 50) + reductionBonus);
  };

  const getScoreColor = (score: number): string => {
    if (score >= 100) return 'text-emerald-600 bg-emerald-100';
    if (score >= 50) return 'text-blue-600 bg-blue-100';
    if (score >= 25) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

  const getScoreLevel = (score: number): string => {
    if (score >= 100) return 'Eco Champion';
    if (score >= 50) return 'Eco Advocate';
    if (score >= 25) return 'Eco Enthusiast';
    return 'Eco Beginner';
  };

  const openIPFSLink = (ipfsHash: string) => {
    const ipfsUrl = `https://ipfs.io/ipfs/${ipfsHash}`;
    window.open(ipfsUrl, '_blank');
  };

  if (!isConnected) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-blue-100 p-3 rounded-lg">
            <User className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">Eco Profile</h3>
        </div>
        <div className="text-center py-8">
          <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Please connect your wallet to view your eco profile.</p>
        </div>
      </div>
    );
  }

  const ecoScore = getEcoScore();
  const scoreColor = getScoreColor(ecoScore);
  const scoreLevel = getScoreLevel(ecoScore);

  return (
    <div className="rounded-xl shadow-lg p-6 border border-red-900 bg-gradient-to-br from-[#F3F4F5] to-[#FF9408] text-black">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-emerald-100 p-3 rounded-lg">
          <User className="w-6 h-6 text-emerald-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900">Eco Profile</h3>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile data...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Eco Score Section */}
          <div className="bg-gradient-to-br from-[#7226ff] via-[#160078] to-[#010030] rounded-xl p-6 border border-emerald-200 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Award className="w-8 h-8 text-emerald-600" />
                <div>
                  <h4 className="text-lg font-semibold">Eco Score</h4>
                  <p className="text-sm">{scoreLevel}</p>
                </div>
              </div>
              <div className={`px-4 py-2 rounded-full text-emerald-600 bg-emerald-100 font-bold text-lg bg-white bg-opacity-20 text-green-200`}>
                {ecoScore} pts
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Stat Boxes */}
              <div className="bg-gradient-to-br from-[#87f5f5] via-[#ffe5f1] to-[#f042ff] rounded-lg p-4 text-black">
                <div className="text-sm">Token Balance</div>
                <div className="text-lg font-semibold">{parseFloat(tokenBalance).toFixed(2)} ECO</div>
              </div>
              <div className="bg-gradient-to-br from-[#87f5f5] via-[#ffe5f1] to-[#f042ff] rounded-lg p-4 text-black">
                <div className="text-sm">Total Actions</div>
                <div className="text-lg font-semibold">{actions.length}</div>
              </div>
              <div className="bg-gradient-to-br from-[#87f5f5] via-[#ffe5f1] to-[#f042ff] rounded-lg p-4 text-black">
                <div className="text-sm">Verified Actions</div>
                <div className="text-lg font-semibold">{verifiedActions}</div>
              </div>
            </div>
          </div>
          {/* Actions List and Summary */}
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {actions.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No eco actions submitted yet.</p>
                <p className="text-sm text-gray-500 mt-2">
                  Submit your first eco action to start earning tokens!
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {actions.map((action, index) => (
                  <div
                    key={action.actionId}
                    className="bg-gradient-to-br from-[#87f5f5] via-[#ffe5f1] to-[#f042ff] rounded-lg p-4 mb-4 text-black"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {action.verified ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <Clock className="w-5 h-5 text-yellow-500" />
                        )}
                        <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                          action.verified 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {action.verified ? 'Verified' : 'Pending'}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">Action #{action.actionId}</span>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <span className="text-sm font-medium text-gray-700">Description:</span>
                        <p className="text-gray-900 mt-1">{action.description}</p>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium text-gray-700">Reduction Amount:</span>
                          <p className="text-emerald-700 font-semibold">
                            {action.reductionAmount} units
                          </p>
                        </div>

                        {action.ipfsHash && (
                          <button
                            onClick={() => openIPFSLink(action.ipfsHash)}
                            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                            View Document
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {actions.length > 0 && (
            <div className="bg-gradient-to-br from-[#87f5f5] via-[#ffe5f1] to-[#f042ff] rounded-lg p-4 text-black">
              <h5 className="text-sm font-medium mb-2">Summary</h5>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span>Total Reduction:</span>
                  <p className="font-semibold">{totalReduction} units</p>
                </div>
                <div>
                  <span>Verification Rate:</span>
                  <p className="font-semibold">
                    {actions.length > 0 ? Math.round((verifiedActions / actions.length) * 100) : 0}%
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}; 