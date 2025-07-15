import React, { useState } from 'react';
import { Shield, CheckCircle, Sparkles } from 'lucide-react';

interface AuditorPanelProps {
  loading: boolean;
  onVerifyAction: (manufacturerAddress: string, actionId: number) => Promise<void>;
}

export const AuditorPanel: React.FC<AuditorPanelProps> = ({
  loading,
  onVerifyAction,
}) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [formData, setFormData] = useState({
    manufacturerAddress: '',
    actionId: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.manufacturerAddress || !formData.actionId) {
      return;
    }

    setIsVerifying(true);
    try {
      await onVerifyAction(formData.manufacturerAddress, parseInt(formData.actionId));
      setFormData({ manufacturerAddress: '', actionId: '' });
    } catch (error) {
      console.error('Error verifying action:', error);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="rounded-2xl shadow-lg p-6 border border-yellow-400 bg-gradient-to-br from-[#F3F4F5] to-[#FF9408] text-black">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-6 h-6 text-green-500" />
        <h2 className="text-2xl font-bold text-gray-800">Verify Eco-Action</h2>
      </div>
      
      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200 mb-6">
        <div className="flex items-center gap-3 mb-3">
          <CheckCircle className="w-6 h-6 text-green-600" />
          <h3 className="text-lg font-semibold text-green-800">Auditor Privileges</h3>
        </div>
        <p className="text-green-700 text-sm">
          As an auditor, you can verify manufacturer eco-actions after reviewing their documentation 
          and confirming the environmental impact claims.
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="manufacturerAddress" className="block text-sm font-medium text-gray-700 mb-2">
            Manufacturer Address
          </label>
          <input
            type="text"
            id="manufacturerAddress"
            name="manufacturerAddress"
            value={formData.manufacturerAddress}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200"
            placeholder="0x1234567890123456789012345678901234567890"
            required
          />
        </div>
        
        <div>
          <label htmlFor="actionId" className="block text-sm font-medium text-gray-700 mb-2">
            Action ID
          </label>
          <input
            type="number"
            id="actionId"
            name="actionId"
            value={formData.actionId}
            onChange={handleInputChange}
            min="0"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200"
            placeholder="0"
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={isVerifying || loading}
          className="w-full bg-gradient-to-r from-green-400 via-blue-400 to-purple-500 text-white font-bold py-3 px-8 rounded-full shadow-2xl hover:scale-105 transition-transform duration-300 text-lg animate-pulse focus:ring-4 focus:ring-blue-200 focus:outline-none border-2 border-transparent hover:border-blue-400 flex items-center justify-center gap-2 relative"
        >
          {isVerifying ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Verifying...
            </>
          ) : (
            <>
              <Sparkles className="w-6 h-6 animate-bounce" />
              Verify Action
            </>
          )}
        </button>
        <span className="block text-center mt-2 text-green-600 animate-fade-in">Help keep the system honest. Verify now!</span>
      </form>
    </div>
  );
};