import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../constants/contract';
import { UserRole, EcoAction, User, RoleChangeEvent } from '../types';
import toast from 'react-hot-toast';

export const useContract = (provider: ethers.BrowserProvider | null, address: string | null) => {
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [userRole, setUserRole] = useState<UserRole>({
    isManufacturer: false,
    isAuditor: false,
    isAdmin: false,
  });
  const [userActions, setUserActions] = useState<EcoAction[]>([]);
  const [loading, setLoading] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [roleEvents, setRoleEvents] = useState<RoleChangeEvent[]>([]);

  useEffect(() => {
    if (provider && address) {
      const contractInstance = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        provider
      );
      setContract(contractInstance);
      checkUserRole();
      loadUserActions();
      if (userRole.isAdmin) {
        loadAllUsers();
        loadRoleEvents();
      }
    }
  }, [provider, address, userRole.isAdmin]);

  const loadAllUsers = async () => {
    if (!contract) return;

    try {
      // Listen to past role events to build user list
      const filter = contract.filters.RoleGranted();
      const events = await contract.queryFilter(filter, 0, 'latest');
      
      const userAddresses = new Set<string>();
      events.forEach(event => {
        if (event.args) {
          userAddresses.add(event.args.account);
        }
      });

      // Add current user if not in list
      if (address) {
        userAddresses.add(address);
      }

      const users: User[] = [];
      for (const userAddress of userAddresses) {
        try {
          const manufacturerRole = await contract.MANUFACTURER_ROLE();
          const auditorRole = await contract.AUDITOR_ROLE();
          const defaultAdminRole = await contract.DEFAULT_ADMIN_ROLE();

          const isManufacturer = await contract.hasRole(manufacturerRole, userAddress);
          const isAuditor = await contract.hasRole(auditorRole, userAddress);
          const isAdmin = await contract.hasRole(defaultAdminRole, userAddress);

          const tokenBalance = await contract.balanceOf(userAddress);
          
          // Count actions for manufacturers
          let actionsCount = 0;
          if (isManufacturer) {
            let actionId = 0;
            while (true) {
              try {
                await contract.manufacturerActions(userAddress, actionId);
                actionsCount++;
                actionId++;
              } catch {
                break;
              }
            }
          }

          users.push({
            address: userAddress,
            roles: { isManufacturer, isAuditor, isAdmin },
            tokenBalance: ethers.formatEther(tokenBalance),
            actionsCount,
          });
        } catch (error) {
          console.error(`Error loading user ${userAddress}:`, error);
        }
      }

      setAllUsers(users);
    } catch (error) {
      console.error('Error loading all users:', error);
    }
  };

  const loadRoleEvents = async () => {
    if (!contract) return;

    try {
      const grantedFilter = contract.filters.RoleGranted();
      const revokedFilter = contract.filters.RoleRevoked();
      
      const [grantedEvents, revokedEvents] = await Promise.all([
        contract.queryFilter(grantedFilter, 0, 'latest'),
        contract.queryFilter(revokedFilter, 0, 'latest')
      ]);

      const events: RoleChangeEvent[] = [];
      
      grantedEvents.forEach(event => {
        if (event.args) {
          const block = event.blockNumber;
          events.push({
            user: event.args.account,
            role: getRoleName(event.args.role),
            granted: true,
            timestamp: block, // In a real app, you'd get the block timestamp
          });
        }
      });

      revokedEvents.forEach(event => {
        if (event.args) {
          const block = event.blockNumber;
          events.push({
            user: event.args.account,
            role: getRoleName(event.args.role),
            granted: false,
            timestamp: block,
          });
        }
      });

      // Sort by timestamp (block number) descending
      events.sort((a, b) => b.timestamp - a.timestamp);
      setRoleEvents(events.slice(0, 20)); // Keep last 20 events
    } catch (error) {
      console.error('Error loading role events:', error);
    }
  };

  const getRoleName = (roleHash: string): string => {
    // These are the keccak256 hashes of the role names
    const roles: { [key: string]: string } = {
      '0x0000000000000000000000000000000000000000000000000000000000000000': 'Admin',
      '0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6': 'Manufacturer',
      '0x1e4c11d3c2f3e3b3e3b3e3b3e3b3e3b3e3b3e3b3e3b3e3b3e3b3e3b3e3b3e3b3': 'Auditor'
    };
    return roles[roleHash] || 'Unknown';
  };

  const checkUserRole = async () => {
    if (!contract || !address) return;

    try {
      const manufacturerRole = await contract.MANUFACTURER_ROLE();
      const auditorRole = await contract.AUDITOR_ROLE();
      const defaultAdminRole = await contract.DEFAULT_ADMIN_ROLE();

      const isManufacturer = await contract.hasRole(manufacturerRole, address);
      const isAuditor = await contract.hasRole(auditorRole, address);
      const isAdmin = await contract.hasRole(defaultAdminRole, address);

      setUserRole({ isManufacturer, isAuditor, isAdmin });
    } catch (error) {
      console.error('Error checking user role:', error);
    }
  };

  const loadUserActions = async () => {
    if (!contract || !address || !userRole.isManufacturer) return;

    try {
      const actions: EcoAction[] = [];
      let actionId = 0;

      // Try to load actions until we hit an error (no more actions)
      while (true) {
        try {
          const action = await contract.manufacturerActions(address, actionId);
          actions.push({
            description: action.description,
            reductionAmount: Number(action.reductionAmount),
            ipfsHash: action.ipfsHash,
            verified: action.verified,
          });
          actionId++;
        } catch {
          break;
        }
      }

      setUserActions(actions);
    } catch (error) {
      console.error('Error loading user actions:', error);
    }
  };

  const getTokenBalance = async (): Promise<string> => {
    if (!contract || !address) return '0';

    try {
      const balance = await contract.balanceOf(address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Error getting token balance:', error);
      return '0';
    }
  };

  const submitEcoAction = async (description: string, reductionAmount: number, ipfsHash: string) => {
    if (!contract || !provider) throw new Error('Contract not initialized');

    const signer = await provider.getSigner();
    const contractWithSigner = contract.connect(signer);

    setLoading(true);
    const loadingToast = toast.loading('Submitting eco-action...');

    try {
      const tx = await contractWithSigner.submitEcoAction(
        description,
        ethers.parseEther(reductionAmount.toString()),
        ipfsHash
      );

      toast.loading('Transaction pending...', { id: loadingToast });
      await tx.wait();

      toast.success('Eco-action submitted successfully!', { id: loadingToast });
      await loadUserActions();
    } catch (error: any) {
      console.error('Error submitting eco-action:', error);
      toast.error(error.message || 'Failed to submit eco-action', { id: loadingToast });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const verifyAction = async (manufacturerAddress: string, actionId: number) => {
    if (!contract || !provider) throw new Error('Contract not initialized');

    const signer = await provider.getSigner();
    const contractWithSigner = contract.connect(signer);

    setLoading(true);
    const loadingToast = toast.loading('Verifying action...');

    try {
      const tx = await contractWithSigner.verifyAction(manufacturerAddress, actionId);

      toast.loading('Transaction pending...', { id: loadingToast });
      await tx.wait();

      toast.success('Action verified successfully!', { id: loadingToast });
    } catch (error: any) {
      console.error('Error verifying action:', error);
      toast.error(error.message || 'Failed to verify action', { id: loadingToast });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const addManufacturer = async (userAddress: string) => {
    if (!contract || !provider) throw new Error('Contract not initialized');

    const signer = await provider.getSigner();
    const contractWithSigner = contract.connect(signer);

    setLoading(true);
    const loadingToast = toast.loading('Adding manufacturer...');

    try {
      const tx = await contractWithSigner.addManufacturer(userAddress);

      toast.loading('Transaction pending...', { id: loadingToast });
      await tx.wait();

      toast.success('Manufacturer added successfully!', { id: loadingToast });
      await loadAllUsers(); // Refresh user list
      await checkUserRole(); // <-- Refresh current user's roles
    } catch (error: any) {
      console.error('Error adding manufacturer:', error);
      toast.error(error.message || 'Failed to add manufacturer', { id: loadingToast });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const addAuditor = async (userAddress: string) => {
    if (!contract || !provider) throw new Error('Contract not initialized');

    const signer = await provider.getSigner();
    const contractWithSigner = contract.connect(signer);

    setLoading(true);
    const loadingToast = toast.loading('Adding auditor...');

    try {
      const tx = await contractWithSigner.addAuditor(userAddress);

      toast.loading('Transaction pending...', { id: loadingToast });
      await tx.wait();

      toast.success('Auditor added successfully!', { id: loadingToast });
      await loadAllUsers(); // Refresh user list
      await checkUserRole(); // <-- Refresh current user's roles
    } catch (error: any) {
      console.error('Error adding auditor:', error);
      toast.error(error.message || 'Failed to add auditor', { id: loadingToast });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const removeRole = async (userAddress: string, roleType: 'manufacturer' | 'auditor') => {
    if (!contract || !provider) throw new Error('Contract not initialized');

    const signer = await provider.getSigner();
    const contractWithSigner = contract.connect(signer);

    setLoading(true);
    const loadingToast = toast.loading(`Removing ${roleType}...`);

    try {
      let roleHash;
      if (roleType === 'manufacturer') {
        roleHash = await contract.MANUFACTURER_ROLE();
      } else {
        roleHash = await contract.AUDITOR_ROLE();
      }

      const tx = await contractWithSigner.revokeRole(roleHash, userAddress);

      toast.loading('Transaction pending...', { id: loadingToast });
      await tx.wait();

      toast.success(`${roleType} role removed successfully!`, { id: loadingToast });
      await loadAllUsers(); // Refresh user list
    } catch (error: any) {
      console.error(`Error removing ${roleType}:`, error);
      toast.error(error.message || `Failed to remove ${roleType}`, { id: loadingToast });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    contract,
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
    checkUserRole,
    loadUserActions,
    loadAllUsers,
    removeRole,
  };
};