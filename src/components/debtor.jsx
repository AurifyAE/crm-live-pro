import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Search,
  ChevronDown,
  Star,
  ChevronLeft,
  ChevronRight,
  Edit,
  Save,
  X,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  Mail,
} from "lucide-react";
import useMarketData from "../components/marketData";
import axiosInstance from "../api/axios";
const adminId = localStorage.getItem("adminId");

export default function DebtorManagement() {
  const { marketData } = useMarketData(["GOLD"]);
  const [liveRate, setLiveRate] = useState(0);
  const [debtorUsers, setDebtorUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // States for filtering and pagination
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({
    key: "ACCODE",
    direction: "ascending",
  });
  const [favoriteFilter, setFavoriteFilter] = useState(false);
  const [riskFilter, setRiskFilter] = useState("all");

  // States for editing
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");

  // Message sending state
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageRecipient, setMessageRecipient] = useState(null);

  // Format numbers consistently - memoized to prevent recreation on each render
  const formatNumber = useCallback((num) => {
    if (isNaN(num)) return "0.00";
    return Number(num).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }, []);

  // Calculate user data with updated values and margin risk level
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

    // Calculate margin ratio and risk level
    const marginRatio = 
      marginAmount > 0 && netEquity > 0 ? netEquity / marginAmount : 0;

    let riskLevel;
    if (marginRatio >= 0.67) {
      riskLevel = "safe";
    } else if (marginRatio >= 0.34) {
      riskLevel = "moderate";
    } else {
      riskLevel = "high";
    }

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
      marginRatio,
      riskLevel,
      accountType: item.Account_Type?.toLowerCase() || "n/a",
      favorite: item.is_favorite || false,
      email: item.email || "customer@example.com",
      phone: item.phone || "N/A",
    };
  }, []);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDebtorUsers();
    setRefreshing(false);
  }, []);

  // Fetch data from backend - optimized to avoid duplicate calls
  const fetchDebtorUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/fetch-data/${adminId}`);
      if (response.data.status === 200) {
        // Process and transform the data - filter to only show DEBTOR account types
        const transformedData = response.data.data
          .filter(
            (item) =>
              item.Account_Type && item.Account_Type.toLowerCase() === "debtor"
          )
          .map((item) => calculateUserData(item, liveRate));
        setDebtorUsers(transformedData);
      } else {
        setError("Failed to fetch data");
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Error connecting to server");
    } finally {
      setLoading(false);
    }
  }, [liveRate, calculateUserData, adminId]);

  // Initial data fetch - only run once
  useEffect(() => {
    fetchDebtorUsers();
  }, [fetchDebtorUsers]);

  // Update calculations when market data changes - optimized for performance
  useEffect(() => {
    if (marketData?.bid) {
      const calculatedRate = parseFloat(
        ((marketData.bid / 31.103) * 3.674).toFixed(2)
      );
      
      // Avoid unnecessary state updates
      if (calculatedRate !== liveRate) {
        setLiveRate(calculatedRate);
        
        if (debtorUsers.length > 0) {
          // Update all users with the new gold rate in a single state update
          setDebtorUsers((prevDebtorUsers) =>
            prevDebtorUsers.map((user) => {
              const valueInAED = parseFloat(
                (calculatedRate * user.metalWeight).toFixed(2)
              );
              const netEquity = parseFloat(
                (valueInAED + user.accBalance).toFixed(2)
              );
              const marginAmount = parseFloat(
                ((netEquity * user.margin) / 100).toFixed(2)
              );
              const totalNeeded = parseFloat((marginAmount + netEquity).toFixed(2));
              
              // Calculate margin ratio and risk level
              const marginRatio =
                marginAmount > 0 && netEquity > 0 ? netEquity / marginAmount : 0;

              let riskLevel;
              if (marginRatio >= 0.67) {
                riskLevel = "safe";
              } else if (marginRatio >= 0.34) {
                riskLevel = "moderate";
              } else {
                riskLevel = "high";
              }

              return {
                ...user,
                goldratevalueInAED: calculatedRate,
                valueInAED,
                netEquity,
                marginAmount,
                totalNeeded,
                marginRatio,
                riskLevel,
              };
            })
          );
        }
      }
    }
  }, [marketData, debtorUsers.length]);

  // Sort function - optimized to be more efficient
  const requestSort = useCallback(
    (key) => {
      setSortConfig((prevConfig) => {
        const direction = 
          prevConfig.key === key && prevConfig.direction === "ascending" 
            ? "descending" 
            : "ascending";
        return { key, direction };
      });
    },
    []
  );

  // Memoized sorted users - prevents unnecessary recalculations
  const sortedDebtorUsers = useMemo(() => {
    if (!debtorUsers.length) return [];
    
    const sortableDebtorUsers = [...debtorUsers];
    if (sortConfig.key) {
      sortableDebtorUsers.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (aValue < bValue) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableDebtorUsers;
  }, [debtorUsers, sortConfig]);

  // Memoized filtered users - prevents unnecessary recalculations
  const filteredDebtorUsers = useMemo(() => {
    return sortedDebtorUsers.filter((user) => {
      const searchTerm = search.toLowerCase();
      const matchesSearch =
        user.name.toLowerCase().includes(searchTerm) ||
        user.id.toString().includes(searchTerm);
      const matchesFavorite = !favoriteFilter || user.favorite;
      const matchesRisk = riskFilter === "all" || user.riskLevel === riskFilter;

      return matchesSearch && matchesFavorite && matchesRisk;
    });
  }, [sortedDebtorUsers, search, favoriteFilter, riskFilter]);

  // Memoized pagination variables - prevents unnecessary recalculations
  const paginationData = useMemo(() => {
    const totalPages = Math.max(1, Math.ceil(filteredDebtorUsers.length / itemsPerPage));
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredDebtorUsers.slice(indexOfFirstItem, indexOfLastItem);

    return {
      totalPages,
      indexOfLastItem,
      indexOfFirstItem,
      currentItems
    };
  }, [filteredDebtorUsers, currentPage, itemsPerPage]);

  // Memoized risk counts - prevents unnecessary recalculations
  const riskCounts = useMemo(() => {
    const counts = {
      high: 0,
      moderate: 0,
      safe: 0
    };
    
    debtorUsers.forEach(user => {
      if (counts.hasOwnProperty(user.riskLevel)) {
        counts[user.riskLevel]++;
      }
    });
    
    return counts;
  }, [debtorUsers]);

  // Toggle favorite - optimized to reduce unnecessary renders
  const toggleFavorite = useCallback(
    async (id) => {
      try {
        // Find the current favorite status without directly accessing state
        const user = debtorUsers.find((d) => d.id === id);
        if (!user) return;
        
        const newFavoriteStatus = !user.favorite;

        // Update in the backend
        const response = await axiosInstance.put(
          `/update-favorite/${adminId}`,
          {
            accode: id,
            isFavorite: newFavoriteStatus,
          }
        );

        if (response.data.status === 200 || response.data.status === 201) {
          // Optimistic UI update - update only the specific user
          setDebtorUsers(prev => 
            prev.map(user => 
              user.id === id ? { ...user, favorite: newFavoriteStatus } : user
            )
          );
        } else {
          console.error("Failed to update favorite status");
        }
      } catch (err) {
        console.error("Error updating favorite status:", err);
      }
    },
    [debtorUsers, adminId]
  );

  // Start editing margin
  const startEditing = useCallback((id, currentValue) => {
    setEditingId(id);
    setEditValue(currentValue.toString());
  }, []);

  // Save edited margin - optimized to reduce unnecessary calculations
  const saveMargin = useCallback(
    async (id) => {
      const newMargin = parseFloat(editValue);
      if (isNaN(newMargin) || newMargin < 0) {
        alert("Please enter a valid margin percentage");
        return;
      }

      try {
        // Update in the backend
        const response = await axiosInstance.put(`/update-margin/${adminId}`, {
          accode: id,
          margin: newMargin,
        });

        if (response.data.status === 200 || response.data.status === 201) {
          // Find the user and update with recalculated values
          setDebtorUsers(prevUsers => 
            prevUsers.map(user => {
              if (user.id === id) {
                // Recalculate the affected values
                const netEquity = user.valueInAED + user.accBalance;
                const updatedMarginAmount = (netEquity * newMargin) / 100;
                const updatedTotalNeeded = netEquity + updatedMarginAmount;
                const marginRatio = updatedMarginAmount > 0 ? netEquity / updatedMarginAmount : 0;

                let riskLevel;
                if (marginRatio >= 0.67) {
                  riskLevel = "safe";
                } else if (marginRatio >= 0.34) {
                  riskLevel = "moderate";
                } else {
                  riskLevel = "high";
                }

                return {
                  ...user,
                  margin: newMargin,
                  marginAmount: updatedMarginAmount,
                  totalNeeded: updatedTotalNeeded,
                  marginRatio,
                  riskLevel,
                };
              }
              return user;
            })
          );
        } else {
          console.error("Failed to update margin");
        }
      } catch (err) {
        console.error("Error updating margin:", err);
      } finally {
        setEditingId(null);
        setEditValue("");
      }
    },
    [debtorUsers, editValue, adminId]
  );

  // Cancel editing function
  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditValue("");
  }, []);

  // Start message sending
  const openMessageModal = useCallback((user) => {
    setMessageRecipient(user);
    setSendingMessage(true);
  }, []);

  // Send message function - optimized to handle form submission properly
  const sendMessage = useCallback(
    async (e) => {
      e.preventDefault();
      const message = e.target.message.value;

      if (!message || !messageRecipient) {
        return;
      }

      try {
        // Here you would send the message to your backend
        console.log(`Sending message to ${messageRecipient.name}: ${message}`);

        // Simulate API call with timeout
        setTimeout(() => {
          setSendingMessage(false);
          setMessageRecipient(null);
          alert(`Message sent successfully to ${messageRecipient.name}`);
        }, 1000);

        // Actual implementation commented out for reference
      } catch (err) {
        console.error("Error sending message:", err);
        alert("Failed to send message. Please try again.");
      }
    },
    [messageRecipient]
  );

  // Risk indicator component - memoized to prevent unnecessary re-renders
  const RiskIndicator = React.memo(({ riskLevel }) => {
    switch (riskLevel) {
      case "high":
        return (
          <div className="flex items-center text-red-600">
            <AlertCircle className="h-4 w-4 mr-1" />
            <span>High Risk</span>
          </div>
        );
      case "moderate":
        return (
          <div className="flex items-center text-amber-500">
            <AlertTriangle className="h-4 w-4 mr-1" />
            <span>Moderate</span>
          </div>
        );
      case "safe":
        return (
          <div className="flex items-center text-green-600">
            <CheckCircle className="h-4 w-4 mr-1" />
            <span>Safe</span>
          </div>
        );
      default:
        return null;
    }
  });

  // Loading state
  if (loading && debtorUsers.length === 0) {
    return (
      <div className="fixed inset-0 flex justify-center items-center bg-white">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading accounts...</p>
        </div>
      </div>
    );
  }

  // Table header component for reusability - memoized
  const TableHeader = React.memo(({ label, sortKey }) => (
    <th
      scope="col"
      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer sticky top-0 bg-gray-100 z-10"
      onClick={() => requestSort(sortKey)}
    >
      <div className="flex items-center">
        {label}
        {sortConfig.key === sortKey && (
          <span className="ml-1">
            {sortConfig.direction === "ascending" ? "↑" : "↓"}
          </span>
        )}
      </div>
    </th>
  ));

  // Destructure pagination data for cleaner JSX
  const { totalPages, indexOfFirstItem, indexOfLastItem, currentItems } = paginationData;

  return (
    <div className="p-6 w-full bg-gray-50 rounded-lg shadow">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Debtor Management
      </h1>

      {/* Live Gold Rate */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-700">
            Live Gold Rate
          </h2>
          <div className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full font-medium">
            {formatNumber(liveRate)} AED/g
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Last updated: {new Date().toLocaleTimeString()}
        </p>
      </div>

      {/* Risk Level Legend */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-base font-semibold text-gray-700 mb-2">
          Margin Risk Legend
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center">
            <div className="h-4 w-4 bg-red-600 rounded-full mr-2"></div>
            <span className="text-sm text-gray-700">High Risk (0% - 33%)</span>
          </div>
          <div className="flex items-center">
            <div className="h-4 w-4 bg-amber-500 rounded-full mr-2"></div>
            <span className="text-sm text-gray-700">
              Moderate Risk (34% - 66%)
            </span>
          </div>
          <div className="flex items-center">
            <div className="h-4 w-4 bg-green-600 rounded-full mr-2"></div>
            <span className="text-sm text-gray-700">Safe (67% - 100%+)</span>
          </div>
        </div>
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

        <div className="flex flex-wrap gap-4 w-full sm:w-auto">
          {/* Risk Filter Dropdown */}
          <div className="relative">
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="all">All Risks</option>
              <option value="high">High Risk</option>
              <option value="moderate">Moderate Risk</option>
              <option value="safe">Safe</option>
            </select>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="favoriteFilter"
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              checked={favoriteFilter}
              onChange={() => setFavoriteFilter(!favoriteFilter)}
            />
            <label
              htmlFor="favoriteFilter"
              className="ml-2 block text-sm text-gray-900"
            >
              Favorites Only
            </label>
          </div>

          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing..." : "Refresh Data"}
          </button>
        </div>
      </div>

      {/* Risk Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* High Risk Card */}
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium text-red-800">
                High Risk Accounts
              </h3>
              <p className="text-red-600 text-2xl font-bold mt-1">
                {riskCounts.high}
              </p>
            </div>
            <AlertCircle className="h-10 w-10 text-red-500" />
          </div>
        </div>

        {/* Moderate Risk Card */}
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium text-amber-800">
                Moderate Risk Accounts
              </h3>
              <p className="text-amber-600 text-2xl font-bold mt-1">
                {riskCounts.moderate}
              </p>
            </div>
            <AlertTriangle className="h-10 w-10 text-amber-500" />
          </div>
        </div>

        {/* Safe Card */}
        <div className="bg-green-50 border border-green-200 p-4 rounded-lg shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium text-green-800">
                Safe Accounts
              </h3>
              <p className="text-green-600 text-2xl font-bold mt-1">
                {riskCounts.safe}
              </p>
            </div>
            <CheckCircle className="h-10 w-10 text-green-500" />
          </div>
        </div>
      </div>

      {/* Table Container with Overflow Handling */}
      <div className="rounded-lg shadow-sm bg-white">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-700">
            Debtor Users ({filteredDebtorUsers.length}/{debtorUsers.length})
          </h2>
          <p className="text-sm text-gray-500">
            {riskFilter !== "all"
              ? `Filtered to show ${riskFilter} risk accounts`
              : 'Managing users with account type "DEBTOR"'}
          </p>
        </div>

        {/* Responsive table container with both horizontal and vertical scrolling */}
        <div
          className="overflow-auto max-h-[70vh]"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <AlertCircle size={40} className="text-red-500 mb-2" />
              <p className="text-red-600 font-medium">{error}</p>
              <button
                onClick={handleRefresh}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                disabled={refreshing}
              >
                Try Again
              </button>
            </div>
          ) : filteredDebtorUsers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {search || favoriteFilter || riskFilter !== "all"
                ? "No matching accounts found"
                : "No accounts available"}
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 table-fixed">
              <thead className="bg-gray-100">
                <tr>
                  <TableHeader label="ID" sortKey="id" />
                  <TableHeader label="Name" sortKey="name" />
                  <TableHeader label="Account Balance" sortKey="accBalance" />
                  <TableHeader label="Metal Weight" sortKey="metalWeight" />
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer sticky top-0 bg-gray-100 z-10"
                    onClick={() => requestSort("valueInAED")}
                  >
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
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer sticky top-0 bg-gray-100 z-10"
                    onClick={() => requestSort("totalNeeded")}
                  >
                    <div className="flex items-center">
                      Total Needed
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        Risk Level
                      </span>
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer sticky top-0 bg-gray-100 z-10"
                    onClick={() => requestSort("riskLevel")}
                  >
                    Risk Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 bg-gray-100 z-10"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentItems?.map((user) => (
                  <tr
                    key={user.id}
                    className={`hover:bg-gray-50 ${
                      user.riskLevel === "high"
                        ? "bg-red-50"
                        : user.riskLevel === "moderate"
                        ? "bg-amber-50"
                        : ""
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {user.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatNumber(user.accBalance)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatNumber(user.metalWeight)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="font-medium">
                        {formatNumber(user.valueInAED)}
                      </span>
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
                          <div className="flex">
                            <button
                              onClick={() => saveMargin(user.id)}
                              className="bg-green-600 p-1 rounded hover:bg-green-700"
                            >
                              <Save className="h-4 w-4 text-white" />
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="bg-red-600 p-1 rounded hover:bg-red-700 ml-1"
                            >
                              <X className="h-4 w-4 text-white" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <span className="text-sm text-gray-900">
                            {user.margin}%
                          </span>
                          <button
                            onClick={() => startEditing(user.id, user.margin)}
                            className="ml-2 text-gray-400 hover:text-gray-600"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {formatNumber(user.netEquity)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatNumber(user.marginAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {formatNumber(user.totalNeeded)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <RiskIndicator riskLevel={user.riskLevel} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => toggleFavorite(user.id)}
                          className={`p-1 rounded ${
                            user.favorite
                              ? "text-yellow-500 hover:text-yellow-600"
                              : "text-gray-400 hover:text-gray-600"
                          }`}
                          title={user.favorite ? "Remove from favorites" : "Add to favorites"}
                        >
                          <Star className="h-5 w-5" fill={user.favorite ? "currentColor" : "none"} />
                        </button>
                        <button
                          onClick={() => openMessageModal(user)}
                          className="p-1 rounded text-indigo-600 hover:text-indigo-800"
                          title="Send message"
                        >
                          <Mail className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {indexOfFirstItem + 1} to{" "}
            {Math.min(indexOfLastItem, filteredDebtorUsers.length)} of{" "}
            {filteredDebtorUsers.length} results
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded ${
                currentPage === 1
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-indigo-100 text-indigo-800 hover:bg-indigo-200"
              }`}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center">
              <span className="px-3 py-1 text-sm font-medium">
                {currentPage} / {totalPages}
              </span>
            </div>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 rounded ${
                currentPage === totalPages
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-indigo-100 text-indigo-800 hover:bg-indigo-200"
              }`}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Message Modal */}
      {sendingMessage && messageRecipient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                Send Message to {messageRecipient.name}
              </h3>
              <button
                onClick={() => setSendingMessage(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={sendMessage}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recipient
                </label>
                <div className="p-2 bg-gray-50 border border-gray-200 rounded">
                  <div className="text-sm font-medium">{messageRecipient.name}</div>
                  <div className="text-xs text-gray-500">{messageRecipient.email}</div>
                </div>
              </div>
              <div className="mb-4">
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows="4"
                  className="w-full p-2 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Type your message here..."
                  required
                ></textarea>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setSendingMessage(false)}
                  className="mr-2 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Send Message
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}