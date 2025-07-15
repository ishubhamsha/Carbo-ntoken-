import React, { useState } from 'react';
import { Shield, UserPlus, Factory, Users, Trash2, Eye, Award, Activity } from 'lucide-react';
import { User, RoleChangeEvent } from '../types';

interface AdminPanelProps {
  loading: boolean;
  allUsers: User[];
  roleEvents: RoleChangeEvent[];
  onAddManufacturer: (address: string) => Promise<void>;
  onAddAuditor: (address: string) => Promise<void>;
  onRemoveRole: (address: string, role: 'manufacturer' | 'auditor') => Promise<void>;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  loading,
  allUsers,
  roleEvents,
  onAddManufacturer,
  onAddAuditor,
  onRemoveRole,
}) => {
  const [isAddingManufacturer, setIsAddingManufacturer] = useState(false);
  const [isAddingAuditor, setIsAddingAuditor] = useState(false);
  const [manufacturerAddress, setManufacturerAddress] = useState('');
  const [auditorAddress, setAuditorAddress] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'add-roles' | 'activity'>('users');

  const handleAddManufacturer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manufacturerAddress) return;

    setIsAddingManufacturer(true);
    try {
      await onAddManufacturer(manufacturerAddress);
      setManufacturerAddress('');
    } catch (error) {
      console.error('Error adding manufacturer:', error);
    } finally {
      setIsAddingManufacturer(false);
    }
  };

  const handleAddAuditor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auditorAddress) return;

    setIsAddingAuditor(true);
    try {
      await onAddAuditor(auditorAddress);
      setAuditorAddress('');
    } catch (error) {
      console.error('Error adding auditor:', error);
    } finally {
      setIsAddingAuditor(false);
    }
  };

  const handleRemoveRole = async (address: string, role: 'manufacturer' | 'auditor') => {
    if (window.confirm(`Are you sure you want to remove ${role} role from ${address}?`)) {
      try {
        await onRemoveRole(address, role);
      } catch (error) {
        console.error(`Error removing ${role}:`, error);
      }
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getRolesBadges = (user: User) => {
    const badges = [];
    if (user.roles.isAdmin) {
      badges.push(
        <span key="admin" className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <Shield className="w-3 h-3 mr-1" />
          Admin
        </span>
      );
    }
    if (user.roles.isManufacturer) {
      badges.push(
        <span key="manufacturer" className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <Factory className="w-3 h-3 mr-1" />
          Manufacturer
        </span>
      );
    }
    if (user.roles.isAuditor) {
      badges.push(
        <span key="auditor" className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <Award className="w-3 h-3 mr-1" />
          Auditor
        </span>
      );
    }
    if (badges.length === 0) {
      badges.push(
        <span key="none" className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          No Role
        </span>
      );
    }
    return badges;
  };

  return (
    <div className="space-y-8">
      {/* Admin Header */}
      {/* AI_GRADIENT_START:F3F4F5-FF9408-header */}
      <div className="rounded-2xl shadow-lg p-6 border border-yellow-400 bg-gradient-to-br from-[#F3F4F5] to-[#FF9408] text-black">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-6 h-6 text-red-500" />
          <h2 className="text-2xl font-bold text-gray-800">Admin Panel</h2>
        </div>
        {/* AI_GRADIENT_START:ded1c6-a77693-174871-0f2d4d */}
        <div
          className="border border-gray-200 rounded-xl p-6 mb-4 text-teal-200"
          style={{ background: 'linear-gradient(135deg, #ded1c6 0%, #a77693 35%, #174871 70%, #0f2d4d 100%)' }}
        >
          <div className="flex items-center gap-3 mb-3">
            <Shield className="w-6 h-6 text-teal-200" />
            <h3 className="text-lg font-semibold text-teal-200">Administrator Privileges</h3>
          </div>
          <p className="text-teal-100 text-sm">
            As an admin, you can manage user roles, view all users in the system, and track role changes.
          </p>
        </div>
        {/* AI_GRADIENT_END */}
      </div>
      {/* AI_GRADIENT_END */}

      {/* Navigation Tabs */}
      {/* AI_GRADIENT_START:F3F4F5-FF9408 */}
      <div
        className="rounded-2xl shadow-lg border border-yellow-400 bg-gradient-to-br from-[#F3F4F5] to-[#FF9408] text-black"
      >
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                All Users ({allUsers.length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab('add-roles')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'add-roles'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Manage Roles
              </div>
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'activity'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Recent Activity
              </div>
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">System Users</h3>
                <div className="text-sm text-gray-500">
                  Total: {allUsers.length} users
                </div>
              </div>

              {allUsers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No users found</p>
                  <p className="text-gray-400 text-sm mt-2">Users will appear here once they interact with the contract</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {allUsers.map((user) => (
                    <div
                      key={user.address}
                      className="bg-gradient-to-br from-[#87f5f5] via-[#ffe5f1] to-[#f042ff] border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow duration-200 text-black mb-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="bg-transparent p-2 rounded-lg">
                              <Eye className="w-5 h-5 text-gray-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-800">
                                {formatAddress(user.address)}
                              </h4>
                              <p className="text-sm text-gray-500 font-mono">
                                {user.address}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 mb-4">
                            {getRolesBadges(user)}
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Token Balance:</span>
                              <span className="ml-2 font-semibold text-emerald-600">
                                {parseFloat(user.tokenBalance).toFixed(2)} ECO
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">Actions Submitted:</span>
                              <span className="ml-2 font-semibold text-blue-600">
                                {user.actionsCount}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 ml-4">
                          {user.roles.isManufacturer && (
                            <button
                              onClick={() => handleRemoveRole(user.address, 'manufacturer')}
                              disabled={loading}
                              className="flex items-center gap-1 px-3 py-1 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors duration-200 disabled:opacity-50"
                            >
                              <Trash2 className="w-3 h-3" />
                              Remove Manufacturer
                            </button>
                          )}
                          {user.roles.isAuditor && (
                            <button
                              onClick={() => handleRemoveRole(user.address, 'auditor')}
                              disabled={loading}
                              className="flex items-center gap-1 px-3 py-1 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors duration-200 disabled:opacity-50"
                            >
                              <Trash2 className="w-3 h-3" />
                              Remove Auditor
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Add Roles Tab */}
          {activeTab === 'add-roles' && (
            <>
              {/* AI_GRADIENT_START:87f5f5-ffe5f1-f042ff */}
              <div
                className="space-y-8 border border-gray-200 rounded-xl p-6 mb-4 bg-gradient-to-br from-[#87f5f5] via-[#ffe5f1] to-[#f042ff] text-black"
              >
                {/* Add Manufacturer */}
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <Factory className="w-6 h-6 text-blue-500" />
                    <h3 className="text-xl font-bold text-gray-800">Add Manufacturer</h3>
                  </div>
                  
                  <form onSubmit={handleAddManufacturer} className="space-y-4">
                    <div>
                      <label htmlFor="manufacturerAddress" className="block text-sm font-medium text-gray-700 mb-2">
                        Manufacturer Address
                      </label>
                      <input
                        type="text"
                        id="manufacturerAddress"
                        value={manufacturerAddress}
                        onChange={(e) => setManufacturerAddress(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                        placeholder="0x1234567890123456789012345678901234567890"
                        required
                      />
                    </div>
                    
                    <button
                      type="submit"
                      disabled={isAddingManufacturer || loading}
                      className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                    >
                      {isAddingManufacturer ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Adding...
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-5 h-5" />
                          Add Manufacturer
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* Add Auditor */}
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <Award className="w-6 h-6 text-green-500" />
                    <h3 className="text-xl font-bold text-gray-800">Add Auditor</h3>
                  </div>
                  
                  <form onSubmit={handleAddAuditor} className="space-y-4">
                    <div>
                      <label htmlFor="auditorAddress" className="block text-sm font-medium text-gray-700 mb-2">
                        Auditor Address
                      </label>
                      <input
                        type="text"
                        id="auditorAddress"
                        value={auditorAddress}
                        onChange={(e) => setAuditorAddress(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200"
                        placeholder="0x1234567890123456789012345678901234567890"
                        required
                      />
                    </div>
                    
                    <button
                      type="submit"
                      disabled={isAddingAuditor || loading}
                      className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                    >
                      {isAddingAuditor ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Adding...
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-5 h-5" />
                          Add Auditor
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>
              {/* AI_GRADIENT_END */}
            </>
          )}

          {/* Activity Tab */}
          {activeTab === 'activity' && (
            <>
              {/* AI_GRADIENT_START:87f5f5-ffe5f1-f042ff */}
              <div
                className="space-y-4 border border-gray-200 rounded-xl p-6 mb-4 bg-gradient-to-br from-[#87f5f5] via-[#ffe5f1] to-[#f042ff] text-black"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-800">Recent Role Changes</h3>
                  <div className="text-sm text-gray-500">
                    Last {roleEvents.length} events
                  </div>
                </div>

                {roleEvents.length === 0 ? (
                  <div className="text-center py-12">
                    <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No recent activity</p>
                    <p className="text-gray-400 text-sm mt-2">Role changes will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {roleEvents.map((event, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg"
                      >
                        <div className={`p-2 rounded-lg ${event.granted ? 'bg-green-100' : 'bg-red-100'}`}>
                          {event.granted ? (
                            <UserPlus className={`w-4 h-4 ${event.granted ? 'text-green-600' : 'text-red-600'}`} />
                          ) : (
                            <Trash2 className="w-4 h-4 text-red-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800">
                            {event.role} role {event.granted ? 'granted to' : 'revoked from'} {formatAddress(event.user)}
                          </p>
                          <p className="text-xs text-gray-500 font-mono">
                            {event.user}
                          </p>
                        </div>
                        <div className="text-xs text-gray-500">
                          Block #{event.timestamp}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* AI_GRADIENT_END */}
            </>
          )}
        </div>
      </div>
      {/* AI_GRADIENT_END */}
    </div>
  );
};