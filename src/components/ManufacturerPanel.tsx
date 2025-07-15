import React, { useState } from 'react';
import { EcoAction } from '../types';
import { Plus, FileText, CheckCircle, Clock, Leaf, Sparkles } from 'lucide-react';
import { keccak256, toUtf8Bytes } from 'ethers';

interface ManufacturerPanelProps {
  userActions: EcoAction[];
  loading: boolean;
  onSubmitAction: (description: string, reductionAmount: number, ipfsHash: string) => Promise<void>;
}

export const ManufacturerPanel: React.FC<ManufacturerPanelProps> = ({
  userActions,
  loading,
  onSubmitAction,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    reductionAmount: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || !formData.reductionAmount) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Generate a mock IPFS hash using keccak256 of description + reductionAmount
      const hashInput = `${formData.description}:${formData.reductionAmount}`;
      const ipfsHash = keccak256(toUtf8Bytes(hashInput));
      await onSubmitAction(
        formData.description,
        parseFloat(formData.reductionAmount),
        ipfsHash
      );
      setFormData({ description: '', reductionAmount: '' });
    } catch (error) {
      console.error('Error submitting action:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-8">
      {/* Submit New Action Form */}
      {/* AI_GRADIENT_START:F3F4F5-FF9408-ecoaction */}
      <div className="rounded-2xl shadow-lg p-6 border border-yellow-400 bg-gradient-to-br from-[#F3F4F5] to-[#FF9408] text-black">
        <div className="flex items-center gap-3 mb-6">
          <Plus className="w-6 h-6 text-emerald-500" />
          <h2 className="text-2xl font-bold text-gray-800">Submit New Eco-Action</h2>
        </div>
        <div className="rounded-xl p-6 bg-gradient-to-br from-[#87f5f5] via-[#ffe5f1] to-[#f042ff] text-black">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-pink-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors duration-200 bg-gradient-to-br from-[#ffe5f1] to-[#FF9408] text-gray-800 placeholder:text-pink-400"
                placeholder="Describe your eco-action and environmental impact..."
                required
              />
            </div>
            
            <div>
              <label htmlFor="reductionAmount" className="block text-sm font-medium text-orange-700 mb-2">
                CO2 Reduction Amount (tons)
              </label>
              <input
                type="number"
                id="reductionAmount"
                name="reductionAmount"
                value={formData.reductionAmount}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors duration-200 bg-gradient-to-br from-[#ffe5f1] to-[#FF9408] text-gray-800 placeholder:text-orange-400"
                placeholder="0.00"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="w-full bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-500 text-white font-bold py-3 px-8 rounded-full shadow-2xl hover:scale-105 transition-transform duration-300 text-lg animate-pulse focus:ring-4 focus:ring-blue-200 focus:outline-none border-2 border-transparent hover:border-blue-400 flex items-center justify-center gap-2 relative"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Sparkles className="w-6 h-6 animate-bounce" />
                  Submit Eco-Action
                </>
              )}
            </button>
            <span className="block text-center mt-2 text-blue-500 animate-fade-in">Make a difference and submit your action!</span>
          </form>
        </div>
      </div>
      {/* AI_GRADIENT_END */}

      {/* Actions List */}
      {/* AI_GRADIENT_START:F3F4F5-FF9408-ecoactions */}
      <div className="rounded-2xl shadow-lg p-6 border border-yellow-400 bg-gradient-to-br from-[#F3F4F5] to-[#FF9408] text-black">
        <div className="flex items-center gap-3 mb-6">
          <FileText className="w-6 h-6 text-blue-500" />
          <h2 className="text-2xl font-bold text-gray-800">Your Eco-Actions</h2>
        </div>
        
        {userActions.length === 0 ? (
          <div className="text-center py-12">
            <Leaf className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No eco-actions submitted yet</p>
            <p className="text-gray-400 text-sm mt-2">Submit your first eco-action to get started!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {userActions.map((action, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow duration-200 dark:border-pink-400 dark:bg-gradient-to-br dark:from-[#ffb6d5] dark:via-[#e782f9] dark:to-[#a259c6]"
                // To revert to black bg, change dark:bg-gradient-to-br... back to dark:bg-black
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg dark:bg-blue-900">
                      <FileText className="w-5 h-5 text-blue-600 dark:text-blue-200" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 dark:text-yellow-200">Action #{index + 1}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {action.verified ? (
                          <div className="flex items-center gap-1 text-green-600 dark:text-green-300">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-sm font-medium">Verified</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-300">
                            <Clock className="w-4 h-4" />
                            <span className="text-sm font-medium">Pending Verification</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-yellow-300 mb-1">Description</p>
                    <p className="text-gray-800 dark:text-yellow-200">{action.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-yellow-300 mb-1">CO2 Reduction</p>
                      <p className="text-lg font-semibold text-green-600 dark:text-yellow-200">
                        {action.reductionAmount} tons
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-yellow-300 mb-1">IPFS Hash</p>
                      <p className="font-mono text-sm text-blue-600 dark:text-blue-300 break-all">
                        {action.ipfsHash}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* AI_GRADIENT_END */}
    </div>
  );
};