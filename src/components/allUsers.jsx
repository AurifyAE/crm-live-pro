import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, ChevronDown, Star, ChevronLeft, ChevronRight, Edit, Save, X, RefreshCw } from 'lucide-react';
import useMarketData from '../components/marketData';
import axiosInstance from '../api/axios';

export default function AllUsers() {
  const { marketData } = useMarketData(["GOLD"]);
  const [liveRate, setLiveRate] = useState(0);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // States for filtering and pagination
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: 'ACCODE', direction: 'ascending' });
  const [favoriteFilter, setFavoriteFilter] = useState(false);
  
  // States for editing
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [isChangingType, setIsChangingType] = useState(null);
  const [newAccountType, setNewAccountType] = useState('');
  
  // Format numbers consistently
  const formatNumber = useCallback((num) => {
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }, []);

  // Calculate user data with updated values
  const calculateUserData = useCallback((item, goldRate) => {
    const accBalance = parseFloat(item.AMOUNTFC) || 0;
    const metalWeight = parseFloat(item.METAL_WT) || 0;
    const margin = parseFloat(item.margin) || 0;
    const goldRateValue = goldRate || 0;
    
    // Calculate values
    const valueInAED = parseFloat((goldRateValue * metalWeight).toFixed(2));
    const netEquity = parseFloat((valueInAED + accBalance).toFixed(2));
    const marginAmount = parseFloat(((netEquity * margin) / 100).toFixed(2));
    const totalNeeded = parseFloat((marginAmount + netEquity).toFixed(2));
    
    return {
      id: item.ACCODE,
      name: item.ACCOUNT_HEAD,
      accBalance,
      metalWeight,
      goldratevalueInAED: goldRateValue,
      margin: margin || 0,
      valueInAED,
      netEquity,
      marginAmount,
      totalNeeded,
      accountType: item.Account_Type?.toLowerCase() || 'n/a',
      favorite: item.is_favorite || false
    };
  }, []);
  
  // Fetch data from backend
  const fetchAllUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/fetch-data');
      if (response.data.status === 200) {
        // Process and transform the data
        console.log(response.data.data);
        const transformedData = response.data.data
          .filter(item => 
            !item.Account_Type || 
            item.Account_Type.toLowerCase() === 'n/a' || 
            item.Account_Type === '' || 
            item.Account_Type === null)
          .map(item => calculateUserData(item, liveRate));
        setAllUsers(transformedData);
      } else {
        setError('Failed to fetch data');
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Error connecting to server');
    } finally {
      setLoading(false);
    }
  }, [liveRate, calculateUserData]);

  // Initial data fetch
  useEffect(() => {
    fetchAllUsers();
  }, [fetchAllUsers]);

  // Update calculations when market data changes
  useEffect(() => {
    if (marketData?.bid) {
      const calculatedRate = parseFloat(((marketData.bid / 31.103) * 3.674).toFixed(2));
      setLiveRate(calculatedRate);
      
      // Update all users with the new gold rate and recalculate values
      setAllUsers(prevAllUsers => 
        prevAllUsers.map(user => {
          const valueInAED = parseFloat((calculatedRate * user.metalWeight).toFixed(2));
          const netEquity = parseFloat((valueInAED + user.accBalance).toFixed(2));
          const marginAmount = parseFloat(((netEquity * user.margin) / 100).toFixed(2));
          const totalNeeded = parseFloat((marginAmount + netEquity).toFixed(2));
          
          return {
            ...user,
            goldratevalueInAED: calculatedRate,
            valueInAED,
            netEquity,
            marginAmount,
            totalNeeded
          };
        })
      );
    }
  }, [marketData]);

  // Sort function
  const requestSort = useCallback((key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  }, [sortConfig]);

  // Sorted users
  const sortedAllUsers = useMemo(() => {
    const sortableAllUsers = [...allUsers];
    if (sortConfig.key) {
      sortableAllUsers.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableAllUsers;
  }, [allUsers, sortConfig]);

  // Filtered users
  const filteredAllUsers = useMemo(() => {
    return sortedAllUsers.filter(user => {
      const matchesSearch = 
        user.name.toLowerCase().includes(search.toLowerCase()) || 
        user.id.toString().includes(search);
      const matchesFavorite = !favoriteFilter || user.favorite;
      
      return matchesSearch && matchesFavorite;
    });
  }, [sortedAllUsers, search, favoriteFilter]);

  // Pagination
  const totalPages = useMemo(() => Math.ceil(filteredAllUsers.length / itemsPerPage), [filteredAllUsers, itemsPerPage]);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = useMemo(() => 
    filteredAllUsers.slice(indexOfFirstItem, indexOfLastItem),
    [filteredAllUsers, indexOfFirstItem, indexOfLastItem]
  );

  // Toggle favorite
  const toggleFavorite = useCallback(async (id) => {
    try {
      // Find the current favorite status
      const user = allUsers.find(d => d.id === id);
      const newFavoriteStatus = !user.favorite;
      
      // Update in the backend
      const response = await axiosInstance.put('/update-favorite', {
        accode: id,
        is_favorite: newFavoriteStatus
      });
      
      if (response.data.status === 200 || response.data.status === 201) {
        // Update local state
        setAllUsers(
          allUsers.map(user => 
            user.id === id ? { ...user, favorite: newFavoriteStatus } : user
          )
        );
      } else {
        console.error('Failed to update favorite status');
      }
    } catch (err) {
      console.error('Error updating favorite status:', err);
    }
  }, [allUsers]);

  // Start editing margin
  const startEditing = useCallback((id, currentValue) => {
    setEditingId(id);
    setEditValue(currentValue);
  }, []);

  // Save edited margin
  const saveMargin = useCallback(async (id) => {
    const newMargin = parseFloat(editValue);
    if (isNaN(newMargin) || newMargin < 0) {
      alert("Please enter a valid margin percentage");
      return;
    }
    
    try {
      // Update in the backend
      const response = await axiosInstance.put('/update-margin', {
        accode: id,
        margin: newMargin
      });
      
      if (response.data.status === 200 || response.data.status === 201) {
        // Update local state with recalculated values
        setAllUsers(
          allUsers.map(user => {
            if (user.id === id) {
              const netEquity = user.valueInAED + user.accBalance;
              const updatedMarginAmount = (netEquity * newMargin) / 100;
              const updatedTotalNeeded = netEquity + updatedMarginAmount;
              
              return {
                ...user, 
                margin: newMargin,
                marginAmount: updatedMarginAmount,
                totalNeeded: updatedTotalNeeded
              };
            }
            return user;
          })
        );
      } else {
        console.error('Failed to update margin');
      }
    } catch (err) {
      console.error('Error updating margin:', err);
    } finally {
      setEditingId(null);
      setEditValue('');
    }
  }, [allUsers, editValue]);

  // Start changing account type
  const startChangingType = useCallback((id, currentType) => {
    setIsChangingType(id);
    setNewAccountType(currentType === 'n/a' ? 'lp' : currentType);
  }, []);

  // Save account type change
  const saveAccountType = useCallback(async (id) => {
    try {
      // Update in the backend
      const response = await axiosInstance.put('/update-accountType', {
        accode: id,
        accountType: newAccountType.toUpperCase()
      });
      
      if (response.data.status === 200 || response.data.status === 201) {
        // Remove the user with the updated account type from the list
        setAllUsers(allUsers.filter(user => user.id !== id));
      } else {
        console.error('Failed to update account type');
      }
    } catch (err) {
      console.error('Error updating account type:', err);
    } finally {
      setIsChangingType(null);
      setNewAccountType('');
    }
  }, [allUsers, newAccountType]);

  // Cancel editing functions
  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditValue('');
  }, []);

  const cancelTypeChange = useCallback(() => {
    setIsChangingType(null);
    setNewAccountType('');
  }, []);

  // Loading state
  if (loading && allUsers.length === 0) {
    return (
      <div className="p-6 max-w-full bg-gray-50 rounded-lg shadow flex justify-center items-center h-64">
        <p className="text-lg text-gray-600">Loading data...</p>
      </div>
    );
  }

  // Error state
  if (error && allUsers.length === 0) {
    return (
      <div className="p-6 max-w-full bg-gray-50 rounded-lg shadow flex flex-col justify-center items-center h-64">
        <p className="text-lg text-red-600 mb-4">{error}</p>
        <button 
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={fetchAllUsers}
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
    <div className="p-6 max-w-full bg-gray-50 rounded-lg shadow">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">User Management</h1>
      
      {/* Live Gold Rate */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-700">Live Gold Rate</h2>
          <div className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full font-medium">
            {formatNumber(liveRate)} AED/g
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
            onClick={fetchAllUsers}
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
            Users with Unassigned Account Type ({allUsers.length})
          </h2>
          <p className="text-sm text-gray-500">
            These users will be removed from the list once an account type is assigned
          </p>
        </div>
        
        {allUsers.length === 0 && !loading ? (
          <div className="p-6 text-center">
            <p className="text-gray-600">No users with unassigned account type found.</p>
          </div>
        ) : (
          <>
            {/* Responsive table container with both horizontal and vertical scrolling */}
            <div className="overflow-auto max-h-[70vh]" style={{ WebkitOverflowScrolling: 'touch' }}>
              <table className="min-w-full divide-y divide-gray-200 table-fixed">
                <thead className="bg-gray-100">
                  <tr>
                    <TableHeader label="ID" sortKey="id" />
                    <TableHeader label="Name" sortKey="name" />
                    <TableHeader label="Account Balance" sortKey="accBalance" />
                    <TableHeader label="Metal Weight" sortKey="metalWeight" />
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer sticky top-0 bg-gray-100 z-10" onClick={() => requestSort('valueInAED')}>
                      <div className="flex items-center">
                        Value of Metal Balance
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          Live
                        </span>
                      </div>
                    </th>
                    <TableHeader label="Margin %" sortKey="margin" />
                    <TableHeader label="Net Equity" sortKey="netEquity" />
                    <TableHeader label="Margin Amount" sortKey="marginAmount" />
                    <TableHeader label="Total Needed" sortKey="totalNeeded" />
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 bg-gray-100 z-10">
                      Account Type
                    </th>
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatNumber(user.accBalance)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatNumber(user.metalWeight)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="font-medium text-green-600">{formatNumber(user.valueInAED)}</span>
                      </td>
                      
                      {/* Editable Margin Field */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingId === user.id ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              min="0"
                              step="0.1"
                              className="w-16 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              autoFocus
                            />
                            <button 
                              onClick={() => saveMargin(user.id)}
                              className="text-green-600 hover:text-green-900 focus:outline-none"
                            >
                              <Save className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={cancelEdit}
                              className="text-red-600 hover:text-red-900 focus:outline-none"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                              {user.margin}%
                            </span>
                            <button 
                              onClick={() => startEditing(user.id, user.margin)}
                              className="ml-2 text-gray-400 hover:text-gray-600 focus:outline-none"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatNumber(user.netEquity)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatNumber(user.marginAmount)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatNumber(user.totalNeeded)}</td>
                      
                      {/* Assign Account Type */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isChangingType === user.id ? (
                          <div className="flex items-center space-x-2">
                            <select
                              className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              value={newAccountType}
                              onChange={(e) => setNewAccountType(e.target.value)}
                              autoFocus
                            >
                              <option value="lp">LP</option>
                              <option value="bank">BANK</option>
                              <option value="debtor">DEBTOR</option>
                            </select>
                            <button 
                              onClick={() => saveAccountType(user.id)}
                              className="text-green-600 hover:text-green-900 focus:outline-none"
                            >
                              <Save className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={cancelTypeChange}
                              className="text-red-600 hover:text-red-900 focus:outline-none"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                              {user.accountType === 'n/a' ? 'UNASSIGNED' : user.accountType.toUpperCase()}
                            </span>
                            <button 
                              onClick={() => startChangingType(user.id, user.accountType)}
                              className="ml-2 text-gray-400 hover:text-gray-600 focus:outline-none"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </button>
                          </div>
                        )}
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
                    Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to <span className="font-medium">{Math.min(indexOfLastItem, filteredAllUsers.length)}</span> of{' '}
                    <span className="font-medium">{filteredAllUsers.length}</span> results
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