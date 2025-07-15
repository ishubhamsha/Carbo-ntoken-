import React from 'react';
import { UserRole } from '../types';
import { Shield, Factory, CheckCircle, AlertCircle, Sparkles, Hand } from 'lucide-react';

interface DashboardProps {
  userRole: UserRole;
  address: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ userRole, address }) => {
  const getRoleInfo = () => {
    if (userRole.isAdmin) {
      return {
        icon: <Shield className="w-8 h-8 text-red-500" />,
        title: 'Admin',
        description: 'Full platform access with role management capabilities',
        bgColor: 'from-red-50 to-red-100',
        borderColor: 'border-red-200',
        textColor: 'text-red-700',
      };
    } else if (userRole.isManufacturer) {
      return {
        icon: <Factory className="w-8 h-8 text-blue-500" />,
        title: 'Manufacturer',
        description: 'Submit eco-actions and track carbon reduction efforts',
        bgColor: 'from-blue-50 to-blue-100',
        borderColor: 'border-blue-200',
        textColor: 'text-blue-700',
      };
    } else if (userRole.isAuditor) {
      return {
        icon: <CheckCircle className="w-8 h-8 text-green-500" />,
        title: 'Auditor',
        description: 'Verify and validate manufacturer eco-actions',
        bgColor: 'from-green-50 to-green-100',
        borderColor: 'border-green-200',
        textColor: 'text-green-700',
      };
    } else {
      return {
        icon: <AlertCircle className="w-8 h-8 text-gray-500" />,
        title: 'No Role Assigned',
        description: 'Contact an admin to get assigned a role',
        bgColor: 'from-gray-50 to-gray-100',
        borderColor: 'border-gray-200',
        textColor: 'text-gray-700',
      };
    }
  };

  const roleInfo = getRoleInfo();

  return (
    <div className="rounded-2xl shadow-2xl p-6 mb-8 border border-yellow-400 bg-gradient-to-br from-[#F3F4F5] to-[#FF9408] text-black relative overflow-hidden">
      <Sparkles className="absolute right-6 top-6 w-10 h-10 text-purple-200 animate-pulse pointer-events-none" />
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        Dashboard
        <span className="inline-block animate-bounce">
          <Hand className="w-6 h-6 text-emerald-400" />
        </span>
      </h2>
      <div className="rounded-xl p-6 border border-gray-200 bg-gradient-to-br from-[#87f5f5] via-[#ffe5f1] to-[#f042ff] text-black mb-8">
        <div className="flex items-center gap-4 mb-4">
          {roleInfo.icon}
          <div>
            <h3 className={`text-xl font-semibold ${roleInfo.textColor}`}>{roleInfo.title}</h3>
            <p className={`text-sm ${roleInfo.textColor} opacity-80`}>{roleInfo.description}</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="text-sm font-medium text-gray-600 mb-1">Wallet Address</div>
          <div className="font-mono text-sm bg-white px-3 py-2 rounded-lg border">
            {address}
          </div>
        </div>
      </div>
    </div>
  );
};