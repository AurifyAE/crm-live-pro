import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter, 
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import axiosInstance from '../api/axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const initialFormState = {
  ACCOUNT_HEAD: '',
  ACCODE: '',
  Account_Type: '',
  margin: 0,
  AMOUNTFC: 0,
  METAL_WT: 0,
  created_by: 'admin'
};

// Account Modal Component
function AccountModal({
  isModalOpen,
  handleCloseModal,
  isEditMode,
  formData,
  handleInputChange,
  handleSubmit,
  formSubmitting
}) {
  const modalInitialFocusRef = useRef(null);

  // Modal focus management
  useEffect(() => {
    if (isModalOpen && modalInitialFocusRef.current) {
      // Focus first field when modal opens
      setTimeout(() => {
        modalInitialFocusRef.current.focus();
      }, 50);
    }
  }, [isModalOpen]);

  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-100/90 flex items-center justify-center z-50">
      <div 
        className="bg-white rounded-lg shadow-xl w-11/12 max-w-2xl p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 id="modal-title" className="text-2xl font-bold text-gray-800">
            {isEditMode ? 'Edit Account' : 'Add New Account'}
          </h2>
          <button 
            onClick={handleCloseModal} 
            className="text-gray-500 hover:text-gray-700"
            disabled={formSubmitting}
            aria-label="Close modal"
          >
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="account-head" className="block text-sm font-medium text-gray-700">
              Account Name *
            </label>
            <input
              id="account-head"
              type="text"
              name="ACCOUNT_HEAD"
              value={formData.ACCOUNT_HEAD}
              onChange={handleInputChange}
              ref={modalInitialFocusRef}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              disabled={formSubmitting}
              required
            />
          </div>
          
          <div>
            <label htmlFor="account-code" className="block text-sm font-medium text-gray-700">
              Account Code *
            </label>
            <input
              id="account-code"
              type="text"
              name="ACCODE"
              value={formData.ACCODE}
              onChange={handleInputChange}
              disabled={isEditMode || formSubmitting}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
              required
            />
          </div>
          
          <div>
            <label htmlFor="account-type" className="block text-sm font-medium text-gray-700">
              Account Type *
            </label>
            <select
              id="account-type"
              name="Account_Type"
              value={formData.Account_Type}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              disabled={formSubmitting}
              required
            >
              <option value="">Select Account Type</option>
              <option value="LP">Liquidity Provider</option>
              <option value="BANK">Bank</option>
              <option value="DEBTOR">Debtor</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="margin" className="block text-sm font-medium text-gray-700">
              Margin (%)
            </label>
            <input
              id="margin"
              type="number"
              name="margin"
              value={formData.margin}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              disabled={formSubmitting}
              min="0"
              step="0.1"
            />
          </div>
          
          <div className="col-span-2 mt-4 border-t pt-4">
            <h3 className="font-medium text-gray-700 mb-3">Transaction Details</h3>
          </div>
          
          <div>
            <label htmlFor="amount-fc" className="block text-sm font-medium text-gray-700">
              Amount FC
            </label>
            <input
              id="amount-fc"
              type="number"
              name="AMOUNTFC"
              value={formData.AMOUNTFC}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              disabled={formSubmitting}
              min="0"
              step="0.01"
            />
          </div>
          
          <div>
            <label htmlFor="metal-wt" className="block text-sm font-medium text-gray-700">
              Metal Weight
            </label>
            <input
              id="metal-wt"
              type="number"
              name="METAL_WT"
              value={formData.METAL_WT}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              disabled={formSubmitting}
              min="0"
              step="0.01"
            />
          </div>
          
          <div className="col-span-2 flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={handleCloseModal}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50"
              disabled={formSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center"
              disabled={formSubmitting}
            >
              {formSubmitting && (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {isEditMode ? 'Update Account' : 'Add Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const UnifiedAccountManagement = () => {
  // Core states
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Search and filtering states
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchInputRef = useRef(null);
  
  // Pagination and sorting states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: 'ACCODE', direction: 'ascending' });
  
  // Modal and form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({ ...initialFormState });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [currentAccount, setCurrentAccount] = useState(null);
  
  // Toast styles
  const toastStyles = {
    success: {
      style: {
        border: '2px solid #10B981',
        padding: '16px',
        color: '#10B981',
        backgroundColor: '#ECFDF5',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        borderRadius: '12px',
      },
      icon: <CheckCircle className="text-green-500" />,
    },
    error: {
      style: {
        border: '2px solid #EF4444',
        padding: '16px',
        color: '#EF4444',
        backgroundColor: '#FEE2E2',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        borderRadius: '12px',
      },
      icon: <AlertCircle className="text-red-500" />,
    },
  };

  const showSuccessToast = (message) => {
    toast.success(message, {
      style: toastStyles.success.style,
      icon: toastStyles.success.icon,
      duration: 3000,
      position: "top-right",
    });
  };

  const showErrorToast = (message) => {
    toast.error(message, {
      style: toastStyles.error.style,
      icon: toastStyles.error.icon,
      duration: 3000,
      position: "top-right",
    });
  };

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300); // 300ms debounce delay
    
    return () => clearTimeout(timer);
  }, [search]);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  // Fetch data from API
  const fetchData = useCallback(async () => {
    const loadingToast = toast.loading("Loading accounts...", {
      style: {
        border: '2px solid #3B82F6',
        padding: '16px',
        color: '#3B82F6',
        backgroundColor: '#EFF6FF',
        borderRadius: '12px',
      },
    });
    
    try {
      setLoading(true);
      const response = await axiosInstance.get('/fetch-data');
      
      toast.dismiss(loadingToast);
      
      if (response.data.status === 200) {
        const adminAccounts = response.data.data.filter(account => 
          account.created_by === 'admin'
        );
        setAccounts(adminAccounts);
        setError(null);
      } else {
        throw new Error('Failed to fetch accounts');
      }
    } catch (err) {
      toast.dismiss(loadingToast);
      console.error('Fetch error:', err);
      setError(err.message || 'Error fetching accounts');
      showErrorToast('Error fetching accounts');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load data on component mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Modal handlers
  const handleOpenAddModal = useCallback(() => {
    setFormData({ ...initialFormState });
    setIsEditMode(false);
    setCurrentAccount(null);
    setIsModalOpen(true);
  }, []);

  const handleOpenEditModal = useCallback((account) => {
    setFormData({
      ACCOUNT_HEAD: account.ACCOUNT_HEAD || '',
      ACCODE: account.ACCODE || '',
      Account_Type: account.Account_Type || '',
      margin: account.margin || 0,
      AMOUNTFC: account.AMOUNTFC || 0,
      METAL_WT: account.METAL_WT || 0,
      created_by: 'admin'
    });
    setIsEditMode(true);
    setCurrentAccount(account);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  // Form handlers
  const handleInputChange = useCallback((e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (parseFloat(value) || 0) : value
    }));
  }, []);

  const validateForm = () => {
    if (!formData.ACCOUNT_HEAD.trim()) {
      showErrorToast('Account Name is required');
      return false;
    }
    if (!formData.ACCODE.trim()) {
      showErrorToast('Account Code is required');
      return false;
    }
    if (!formData.Account_Type) {
      showErrorToast('Account Type is required');
      return false;
    }
    return true;
  };

  const resetForm = () => {
    setFormData({ ...initialFormState });
    setCurrentAccount(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    const loadingToast = toast.loading(isEditMode ? "Updating account..." : "Adding account...", {
      style: {
        border: '2px solid #3B82F6',
        padding: '16px',
        color: '#3B82F6',
        backgroundColor: '#EFF6FF',
        borderRadius: '12px',
      },
    });
    
    setFormSubmitting(true);
    try {
      const accountData = {
        ACCOUNT_HEAD: formData.ACCOUNT_HEAD,
        ACCODE: formData.ACCODE,
        Account_Type: formData.Account_Type,
        margin: formData.margin,
        created_by: 'admin'
      };
      
      const transactionData = {
        ACCODE: formData.ACCODE,
        AMOUNTFC: formData.AMOUNTFC,
        METAL_WT: formData.METAL_WT
      };

      if (isEditMode) {
        const [accountResponse, transactionResponse] = await Promise.all([
          axiosInstance.put(`/accounts/${formData.ACCODE}`, accountData),
          axiosInstance.put(`/account-transaction/${formData.ACCODE}`, transactionData)
        ]);

        toast.dismiss(loadingToast);
        
        if (accountResponse.data.status === 201 && transactionResponse.data.status === 201) {
          showSuccessToast('Account updated successfully');
          await fetchData();
          handleCloseModal();
          resetForm();
        } else {
          throw new Error('Failed to update account data');
        }
      } else {
        const accountResponse = await axiosInstance.post('/accounts', accountData);
        
        if (accountResponse.data.status === 201) {
          try {
            const transactionResponse = await axiosInstance.post('/insert-transaction', transactionData);
            
            toast.dismiss(loadingToast);
            
            if (transactionResponse.data.status === 201) {
              showSuccessToast('Account added successfully');
              await fetchData();
              handleCloseModal();
              resetForm();
            } else {
              throw new Error('Transaction failed');
            }
          } catch (transError) {
            // Rollback account creation if transaction fails
            await axiosInstance.delete(`/accounts/${formData.ACCODE}`);
            throw transError;
          }
        } else {
          throw new Error('Account creation failed');
        }
      }
    } catch (err) {
      toast.dismiss(loadingToast);
      console.error('Form submission error:', err);
      showErrorToast(err.message || (isEditMode ? 'Error updating account' : 'Error adding account'));
    } finally {
      setFormSubmitting(false);
    }
  };

  // Delete handler
  const handleDeleteAccount = useCallback((accode) => {
    toast((t) => (
      <div className="flex flex-col space-y-2">
        <div className="flex items-center space-x-2">
          <AlertCircle className="text-yellow-500" />
          <span className="font-bold">Confirm Deletion</span>
        </div>
        <p className="text-sm">
          Are you sure you want to delete this account?
        </p>
        <div className="flex space-x-2">
          <button
            onClick={() => {
              toast.dismiss(t.id);
              performDeletion(accode);
            }}
            className="bg-red-500 text-white px-3 py-1 rounded-md text-sm hover:bg-red-600"
          >
            Delete
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="bg-gray-200 text-gray-700 px-3 py-1 rounded-md text-sm hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </div>
    ), {
      style: {
        border: '2px solid #FBBF24',
        padding: '16px',
        backgroundColor: '#FEF3C7',
        borderRadius: '12px',
      },
      duration: Infinity,
    });

    const performDeletion = async (accode) => {
      const loadingToast = toast.loading("Deleting account...", {
        style: {
          border: '2px solid #3B82F6',
          padding: '16px',
          color: '#3B82F6',
          backgroundColor: '#EFF6FF',
          borderRadius: '12px',
        },
      });

      try {
        setLoading(true);
        await Promise.all([
          axiosInstance.delete(`/account-transaction/${accode}`),
          axiosInstance.delete(`/accounts/${accode}`)
        ]);
        
        toast.dismiss(loadingToast);
        showSuccessToast('Account deleted successfully');
        
        // Update local state immediately
        setAccounts(prevAccounts => 
          prevAccounts.filter(account => account.ACCODE !== accode)
        );
      } catch (err) {
        toast.dismiss(loadingToast);
        console.error('Delete error:', err);
        showErrorToast('Error deleting account');
      } finally {
        setLoading(false);
      }
    };
  }, []);

  // Search focus handler
  const focusSearchInput = useCallback(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // Key event handlers for accessibility
  const handleKeyDown = useCallback((e) => {
    // Implement keyboard shortcuts if needed
    if (e.key === 'f' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      focusSearchInput();
    }
  }, [focusSearchInput]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Sorting handler
  const requestSort = useCallback((key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'ascending' ? 'descending' : 'ascending'
    }));
  }, []);

  // Memoized filtered and sorted data
  const filteredAccounts = useMemo(() => {
    return accounts
      .filter(account => {
        const searchLower = debouncedSearch.toLowerCase();
        return (
          (account.ACCOUNT_HEAD?.toLowerCase() || '').includes(searchLower) ||
          (account.ACCODE?.toLowerCase() || '').includes(searchLower)
        );
      })
      .sort((a, b) => {
        const aValue = a[sortConfig.key] ?? '';
        const bValue = b[sortConfig.key] ?? '';
        return sortConfig.direction === 'ascending' 
          ? String(aValue).localeCompare(String(bValue))
          : String(bValue).localeCompare(String(aValue));
      });
  }, [accounts, debouncedSearch, sortConfig]);

  // Memoized paginated data
  const paginatedAccounts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAccounts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAccounts, currentPage, itemsPerPage]);

  // Loading state display
  if (loading && accounts.length === 0) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 w-full">
      <div className="container mx-auto">
        <div className="bg-white shadow-md rounded-lg">
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <h1 className="text-3xl font-bold text-gray-800">Account Management</h1>
            <button 
              onClick={handleOpenAddModal}
              className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
              disabled={loading}
            >
              <Plus className="mr-2" size={18} /> Add New Account
            </button>
          </div>

          <div className="p-6">
            <div className="flex space-x-4 mb-6">
              <div className="relative flex-grow">
                <input
                  type="text"
                  placeholder="Search accounts..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={loading}
                  ref={searchInputRef}
                />
                <Search className="absolute left-3 top-3 text-gray-400" size={18} />
              </div>
              <button 
                className="bg-gray-100 p-2 rounded-md hover:bg-gray-200 disabled:opacity-50"
                title="Filter"
                disabled={loading}
              >
                <Filter size={18} />
              </button>
            </div>

            <div className="relative">
              {loading && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                </div>
              )}
              
              {paginatedAccounts.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full bg-white">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 cursor-pointer" 
                            onClick={() => requestSort('ACCOUNT_HEAD')}>
                          Account Name {sortConfig.key === 'ACCOUNT_HEAD' && (
                            <span>{sortConfig.direction === 'ascending' ? '↑' : '↓'}</span>
                          )}
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 cursor-pointer"
                            onClick={() => requestSort('ACCODE')}>
                          Account Code {sortConfig.key === 'ACCODE' && (
                            <span>{sortConfig.direction === 'ascending' ? '↑' : '↓'}</span>
                          )}
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 cursor-pointer"
                            onClick={() => requestSort('Account_Type')}>
                          Account Type {sortConfig.key === 'Account_Type' && (
                            <span>{sortConfig.direction === 'ascending' ? '↑' : '↓'}</span>
                          )}
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 cursor-pointer"
                            onClick={() => requestSort('margin')}>
                          Margin (%) {sortConfig.key === 'margin' && (
                            <span>{sortConfig.direction === 'ascending' ? '↑' : '↓'}</span>
                          )}
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 cursor-pointer"
                            onClick={() => requestSort('AMOUNTFC')}>
                          Amount FC {sortConfig.key === 'AMOUNTFC' && (
                            <span>{sortConfig.direction === 'ascending' ? '↑' : '↓'}</span>
                          )}
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 cursor-pointer"
                            onClick={() => requestSort('METAL_WT')}>
                          Metal Weight {sortConfig.key === 'METAL_WT' && (
                            <span>{sortConfig.direction === 'ascending' ? '↑' : '↓'}</span>
                          )}
                        </th>
                        <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedAccounts.map((account) => (
                        <tr key={account.ACCODE} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3">{account.ACCOUNT_HEAD}</td>
                          <td className="px-4 py-3">{account.ACCODE}</td>
                          <td className="px-4 py-3">
                            {account.Account_Type ? (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                {account.Account_Type}
                              </span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">{account.margin ? `${account.margin}%` : '0%'}</td>
                          <td className="px-4 py-3">{account.AMOUNTFC || 0}</td>
                          <td className="px-4 py-3">{account.METAL_WT || 0}</td>
                          <td className="px-4 py-3 flex justify-center space-x-2">
                            <button 
                              onClick={() => handleOpenEditModal(account)}
                              className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
                              title="Edit Account"
                              disabled={loading}
                            >
                              <Edit size={18} />
                            </button>
                            <button 
                              onClick={() => handleDeleteAccount(account.ACCODE)}
                              className="text-red-600 hover:text-red-800 disabled:opacity-50"
                              title="Delete Account"
                              disabled={loading}
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    {error ? `Error: ${error}` : 
                      debouncedSearch ? 'No accounts found matching your search.' : 
                      'No accounts found with creator "admin". Add your first account!'}
                  </p>
                </div>
              )}
            </div>

            {filteredAccounts.length > 0 && (
              <div className="flex justify-between items-center mt-4 px-4">
                <div className="text-sm text-gray-600">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                  {Math.min(currentPage * itemsPerPage, filteredAccounts.length)} of{' '}
                  {filteredAccounts.length} entries
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Rows per page:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={loading}
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1 || loading}
                    className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50"
                  >
                    First
                  </button>
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1 || loading}
                    className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50"
                  >
                    Prev
                  </button>
                  {[...Array(Math.min(5, Math.ceil(filteredAccounts.length / itemsPerPage)))].map((_, index) => {
                    const pageNum = index + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        disabled={loading}
                        className={`px-3 py-1 text-sm border rounded-md ${
                          currentPage === pageNum
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white border-gray-300 hover:bg-gray-100'
                        } ${loading ? 'opacity-50' : ''}`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage >= Math.ceil(filteredAccounts.length / itemsPerPage) || loading}
                    className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50"
                  >
                    Next
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.ceil(filteredAccounts.length / itemsPerPage))}
                    disabled={currentPage >= Math.ceil(filteredAccounts.length / itemsPerPage) || loading}
                    className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50"
                  >
                    Last
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Account Modal */}
      <AccountModal 
        isModalOpen={isModalOpen}
        handleCloseModal={handleCloseModal}
        isEditMode={isEditMode}
        formData={formData}
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmit}
        formSubmitting={formSubmitting}
      />

      {/* Toast Container */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
};

export default UnifiedAccountManagement;