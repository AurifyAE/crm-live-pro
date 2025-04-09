import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Star, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import axiosInstance from '../api/axios';

export default function BankManagement() {
  const [bankUsers, setBankUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalBalance, setTotalBalance] = useState(0);

  // States for filtering and pagination
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: 'ACCODE', direction: 'ascending' });
  const [favoriteFilter, setFavoriteFilter] = useState(false);
  
  // Format numbers consistently
  const formatNumber = useCallback((num) => {
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }, []);

  // Calculate total balance
  const calculateTotalBalance = useCallback((users) => {
    return users.reduce((total, user) => total + (parseFloat(user.accBalance) || 0), 0);
  }, []);

  // Fetch data from backend - filtered to only show bank accounts
  const fetchBankUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/fetch-data');
      if (response.data.status === 200) {
        // Process and transform the data - filter to only show Bank account types
        const transformedData = response.data.data
          .filter(item => 
            item.Account_Type && 
            item.Account_Type.toLowerCase() === 'bank')
          .map(item => ({
            id: item.ACCODE,
            name: item.ACCOUNT_HEAD,
            accBalance: parseFloat(item.AMOUNTFC) || 0,
            favorite: item.is_favorite || false
          }));
          
        setBankUsers(transformedData);
        
        // Calculate total balance
        const total = calculateTotalBalance(transformedData);
        setTotalBalance(total);
      } else {
        setError('Failed to fetch data');
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Error connecting to server');
    } finally {
      setLoading(false);
    }
  }, [calculateTotalBalance]);

  // Initial data fetch
  useEffect(() => {
    fetchBankUsers();
  }, [fetchBankUsers]);

  // Sort function
  const requestSort = useCallback((key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  }, [sortConfig]);

  // Sorted users
  const sortedBankUsers = useMemo(() => {
    const sortableUsers = [...bankUsers];
    if (sortConfig.key) {
      sortableUsers.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableUsers;
  }, [bankUsers, sortConfig]);

  // Filtered users
  const filteredBankUsers = useMemo(() => {
    return sortedBankUsers.filter(user => {
      const matchesSearch = 
        user.name.toLowerCase().includes(search.toLowerCase()) || 
        user.id.toString().includes(search);
      const matchesFavorite = !favoriteFilter || user.favorite;
      
      return matchesSearch && matchesFavorite;
    });
  }, [sortedBankUsers, search, favoriteFilter]);

  // Pagination
  const totalPages = useMemo(() => Math.ceil(filteredBankUsers.length / itemsPerPage), [filteredBankUsers, itemsPerPage]);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = useMemo(() => 
    filteredBankUsers.slice(indexOfFirstItem, indexOfLastItem),
    [filteredBankUsers, indexOfFirstItem, indexOfLastItem]
  );

  // Toggle favorite
  const toggleFavorite = useCallback(async (id) => {
    try {
      // Find the current favorite status
      const user = bankUsers.find(d => d.id === id);
      const newFavoriteStatus = !user.favorite;
      
      // Update in the backend
      const response = await axiosInstance.put('/update-favorite', {
        accode: id,
        is_favorite: newFavoriteStatus
      });
      
      if (response.data.status === 200 || response.data.status === 201) {
        // Update local state
        setBankUsers(
          bankUsers.map(user => 
            user.id === id ? { ...user, favorite: newFavoriteStatus } : user
          )
        );
      } else {
        console.error('Failed to update favorite status');
      }
    } catch (err) {
      console.error('Error updating favorite status:', err);
    }
  }, [bankUsers]);

  // Loading state
  if (loading && bankUsers.length === 0) {
    return (
      <div className="p-6 max-w-full bg-gray-50 rounded-lg shadow flex justify-center items-center h-64">
        <p className="text-lg text-gray-600">Loading bank data...</p>
      </div>
    );
  }

  // Error state
  if (error && bankUsers.length === 0) {
    return (
      <div className="p-6 max-w-full bg-gray-50 rounded-lg shadow flex flex-col justify-center items-center h-64">
        <p className="text-lg text-red-600 mb-4">{error}</p>
        <button 
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={fetchBankUsers}
        >
          Retry
        </button>
      </div>
    );
  }

  // Table header component for reusability
  const TableHeader = ({ label, sortKey }) => (
    <th 
      scope="col" 
      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer sticky top-0 bg-gray-100 z-10" 
      onClick={() => requestSort(sortKey)}
    >
      <div className="flex items-center">
        {label}
        {sortConfig.key === sortKey && (
          <span className="ml-1">
            {sortConfig.direction === 'ascending' ? '↑' : '↓'}
          </span>
        )}
      </div>
    </th>
  );

  return (
    <div className="p-6 w-full bg-gray-50 rounded-lg shadow">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Bank  Management</h1>
      
      {/* Total Balance Summary */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-700">Total Bank Balance</h2>
          <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
            {formatNumber(totalBalance)} AED
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-1">Last updated: {new Date().toLocaleTimeString()}</p>
      </div>
      
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <div className="relative flex-1 max-w-md w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Search by name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex gap-4 w-full sm:w-auto">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="favoriteFilter"
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              checked={favoriteFilter}
              onChange={() => setFavoriteFilter(!favoriteFilter)}
            />
            <label htmlFor="favoriteFilter" className="ml-2 block text-sm text-gray-900">
              Favorites Only
            </label>
          </div>
          
          <button 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
            onClick={fetchBankUsers}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </button>
        </div>
      </div>
      
      {/* Table Container with Overflow Handling */}
      <div className="rounded-lg shadow-sm bg-white">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-700">
            Bank Accounts ({bankUsers.length})
          </h2>
          <p className="text-sm text-gray-500">
            Managing accounts with account type "Bank"
          </p>
        </div>
        
        {bankUsers.length === 0 && !loading ? (
          <div className="p-6 text-center">
            <p className="text-gray-600">No bank accounts found.</p>
          </div>
        ) : (
          <>
            {/* Responsive table container with both horizontal and vertical scrolling */}
            <div className="overflow-auto max-h-[70vh]" style={{ WebkitOverflowScrolling: 'touch' }}>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <TableHeader label="ID" sortKey="id" />
                    <TableHeader label="Name" sortKey="name" />
                    <TableHeader label="Account Balance" sortKey="accBalance" />
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 bg-gray-100 z-10">
                      Favorite
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentItems?.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-green-600">{formatNumber(user.accBalance)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button 
                          onClick={() => toggleFavorite(user.id)}
                          className="text-gray-400 hover:text-yellow-500 focus:outline-none"
                        >
                          <Star className={`h-5 w-5 ${user.favorite ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400'}`} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination - Fixed at the bottom of the container */}
            <div className="border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-b-lg">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="mb-4 sm:mb-0">
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to <span className="font-medium">{Math.min(indexOfLastItem, filteredBankUsers.length)}</span> of{' '}
                    <span className="font-medium">{filteredBankUsers.length}</span> results
                  </p>
                </div>
                <div className="flex justify-center">
                  <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 focus:z-20 focus:outline-offset-0'}`}
                    >
                      <span className="sr-only">Previous</span>
                      <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                    </button>
                    
                    {/* Pagination numbers - limited for mobile */}
                    <div className="hidden sm:flex">
                      {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                        // Show pages around current page
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <button
                            key={i}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                              currentPage === pageNum
                                ? 'z-10 bg-indigo-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
                                : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    
                    {/* Current page indicator for mobile */}
                    <div className="sm:hidden inline-flex items-center px-4 py-2 text-sm font-semibold ring-1 ring-inset ring-gray-300">
                      Page {currentPage} of {totalPages}
                    </div>
                    
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 focus:z-20 focus:outline-offset-0'}`}
                    >
                      <span className="sr-only">Next</span>
                      <ChevronRight className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}