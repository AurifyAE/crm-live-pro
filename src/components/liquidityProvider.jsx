import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Search,
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

// Constants to avoid magic numbers and strings
const ITEMS_PER_PAGE = 10;
const RISK_LEVELS = {
  HIGH: "high",
  MODERATE: "moderate",
  SAFE: "safe",
};

// Separate components for better organization
const RiskIndicator = React.memo(({ riskLevel }) => {
  switch (riskLevel) {
    case RISK_LEVELS.HIGH:
      return (
        <div className="flex items-center text-red-600">
          <AlertCircle className="h-4 w-4 mr-1" />
          <span>High Risk</span>
        </div>
      );
    case RISK_LEVELS.MODERATE:
      return (
        <div className="flex items-center text-amber-500">
          <AlertTriangle className="h-4 w-4 mr-1" />
          <span>Moderate</span>
        </div>
      );
    case RISK_LEVELS.SAFE:
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

const TableHeader = React.memo(({ label, sortKey, sortConfig, requestSort }) => (
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

// Message modal as a separate component
const MessageModal = React.memo(({ recipient, onClose, onSend, formatNumber }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    const message = e.target.message.value;
    onSend(recipient, message);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Send Alert to {recipient.name}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-red-800">High Risk Account</h3>
              <div className="mt-1 text-sm text-red-700">
                <p>Current Margin: {recipient.margin}%</p>
                <p>Net Equity: {formatNumber(recipient.netEquity)}</p>
                <p>Margin Amount: {formatNumber(recipient.marginAmount)}</p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="message" className="block text-sm font-medium text-gray-700">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              rows={4}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              defaultValue={`Dear ${recipient.name},\n\nThis is to inform you that your account requires immediate attention. Your current margin level is below the required threshold. Please deposit additional funds or reduce your positions to meet the margin requirements.\n\nRegards,\nRisk Management Team`}
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Send Alert
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

export default function LiquidityProviderManagement() {
  // Fetch admin ID once on component mount
  const adminId = React.useMemo(() => localStorage.getItem("adminId"), []);
  const { marketData } = useMarketData(["GOLD"]);
  
  // Core states
  const [liveRate, setLiveRate] = useState(0);
  const [lpUsers, setLpUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // Separate refreshing state
  const [error, setError] = useState(null);

  // UI control states
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({
    key: "ACCODE",
    direction: "ascending",
  });
  const [favoriteFilter, setFavoriteFilter] = useState(false);
  const [riskFilter, setRiskFilter] = useState("all");
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [messageRecipient, setMessageRecipient] = useState(null);

  // Refs to prevent unnecessary re-renders
  const lpUsersRef = useRef(lpUsers);
  lpUsersRef.current = lpUsers;
  
  const liveRateRef = useRef(liveRate);
  liveRateRef.current = liveRate;

  // Format numbers consistently - memoized to avoid recreating on every render
  const formatNumber = useCallback((num) => {
    return Number(num).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }, []);

  // Calculate risk level based on margin ratio - memoized
  const calculateRiskLevel = useCallback((marginRatio) => {
    if (marginRatio <= 0.33) {
      return RISK_LEVELS.SAFE;
    } else if (marginRatio <= 0.66) {
      return RISK_LEVELS.MODERATE;
    } else {
      return RISK_LEVELS.HIGH;
    }
  }, []);

  // Process user data - memoized to prevent recalculation
  const calculateUserData = useCallback(
    (item, goldRate) => {
      // Parse values safely
      const accBalance = parseFloat(item.AMOUNTFC) || 0;
      const metalWeight = parseFloat(item.METAL_WT) || 0;
      const margin = parseFloat(item.margin) || 0;
      const goldRateValue = goldRate || 0;

      // Calculate values
      const valueInAED = parseFloat((goldRateValue * metalWeight).toFixed(2));
      const netEquity = parseFloat((valueInAED + accBalance).toFixed(2));
      const marginAmount = parseFloat(((netEquity * margin) / 100).toFixed(2));
      const totalNeeded = parseFloat((marginAmount + netEquity).toFixed(2));

      const marginRatio = marginAmount > 0 && netEquity > 0 ? netEquity / marginAmount : 0;

      return {
        id: item.ACCODE,
        name: item.ACCOUNT_HEAD,
        accBalance,
        metalWeight,
        goldratevalueInAED: goldRateValue,
        margin,
        valueInAED,
        netEquity,
        marginAmount,
        totalNeeded,
        marginRatio,
        riskLevel: calculateRiskLevel(marginRatio),
        accountType: item.Account_Type?.toLowerCase() || "n/a",
        favorite: !!item.is_favorite,
        email: item.email || "customer@example.com",
        phone: item.phone || "N/A",
      };
    },
    [calculateRiskLevel]
  );

  // Fetch data from backend - memoized with dependencies
  const fetchLpUsers = useCallback(async (isRefresh = false) => {
    if (!adminId) return;
    
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const response = await axiosInstance.get(`/fetch-data/${adminId}`);
      
      if (response.data.status === 200) {
        // Only process liquidity provider accounts
        const transformedData = response.data.data
          .filter(item => item.Account_Type?.toLowerCase() === "lp")
          .map(item => calculateUserData(item, liveRateRef.current));
        
        setLpUsers(transformedData);
        setError(null);
      } else {
        setError("Failed to fetch data");
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Error connecting to server");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [adminId, calculateUserData]); // Removed liveRate dependency to avoid unnecessary re-fetches

  // Function to explicitly request a refresh
  const handleRefresh = useCallback(() => {
    fetchLpUsers(true);
  }, [fetchLpUsers]);

  // Initial data fetch - fetch only once on mount
  useEffect(() => {
    fetchLpUsers();
  }, [fetchLpUsers]);

  // Update calculations when market data changes - without re-fetching data
  useEffect(() => {
    if (marketData?.bid) {
      const calculatedRate = parseFloat(((marketData.bid / 31.103) * 3.674).toFixed(2));
      setLiveRate(calculatedRate);

      // Only update users if we have them already to avoid unnecessary work
      if (lpUsers.length > 0) {
        setLpUsers(prevUsers => 
          prevUsers.map(user => {
            // Recalculate values based on new gold rate
            const valueInAED = parseFloat((calculatedRate * user.metalWeight).toFixed(2));
            const netEquity = parseFloat((valueInAED + user.accBalance).toFixed(2));
            const marginAmount = parseFloat(((netEquity * user.margin) / 100).toFixed(2));
            const totalNeeded = parseFloat((marginAmount + netEquity).toFixed(2));
            const marginRatio = marginAmount > 0 && netEquity > 0 ? netEquity / marginAmount : 0;

            return {
              ...user,
              goldratevalueInAED: calculatedRate,
              valueInAED,
              netEquity, 
              marginAmount,
              totalNeeded,
              marginRatio,
              riskLevel: calculateRiskLevel(marginRatio),
            };
          })
        );
      }
    }
  }, [marketData, calculateRiskLevel, lpUsers.length]);

  // Request sort - memoized to avoid recreation
  const requestSort = useCallback(
    (key) => {
      let direction = "ascending";
      if (sortConfig.key === key && sortConfig.direction === "ascending") {
        direction = "descending";
      }
      setSortConfig({ key, direction });
    },
    [sortConfig]
  );

  // Memoized sorted users list
  const sortedLpUsers = useMemo(() => {
    const sortableLpUsers = [...lpUsers];
    if (sortConfig.key) {
      sortableLpUsers.sort((a, b) => {
        // Handle null/undefined values
        const valA = a[sortConfig.key] ?? "";
        const valB = b[sortConfig.key] ?? "";
        
        if (valA < valB) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (valA > valB) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableLpUsers;
  }, [lpUsers, sortConfig]);

  // Memoized filtered users list
  const filteredLpUsers = useMemo(() => {
    return sortedLpUsers.filter((user) => {
      const matchesSearch = 
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.id.toString().includes(search);
      const matchesFavorite = !favoriteFilter || user.favorite;
      const matchesRisk = riskFilter === "all" || user.riskLevel === riskFilter;

      return matchesSearch && matchesFavorite && matchesRisk;
    });
  }, [sortedLpUsers, search, favoriteFilter, riskFilter]);

  // Memoized pagination calculations
  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(filteredLpUsers.length / ITEMS_PER_PAGE);
    const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
    const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
    const currentItems = filteredLpUsers.slice(indexOfFirstItem, indexOfLastItem);

    return {
      totalPages,
      indexOfFirstItem,
      indexOfLastItem,
      currentItems
    };
  }, [filteredLpUsers, currentPage]);

  // Risk counts for summary cards
  const riskCounts = useMemo(() => {
    return {
      high: lpUsers.filter(user => user.riskLevel === RISK_LEVELS.HIGH).length,
      moderate: lpUsers.filter(user => user.riskLevel === RISK_LEVELS.MODERATE).length,
      safe: lpUsers.filter(user => user.riskLevel === RISK_LEVELS.SAFE).length
    };
  }, [lpUsers]);

  // Toggle favorite - optimized to update backend and then local state
  const toggleFavorite = useCallback(async (id) => {
    try {
      const user = lpUsersRef.current.find(d => d.id === id);
      if (!user) return;
      
      const newFavoriteStatus = !user.favorite;

      // First update local state optimistically for responsive UI
      setLpUsers(prev => prev.map(user => 
        user.id === id ? { ...user, favorite: newFavoriteStatus } : user
      ));

      // Then update backend
      await axiosInstance.put(`/update-favorite/${adminId}`, {
        accode: id,
        isFavorite: newFavoriteStatus,
      });
    } catch (err) {
      console.error("Error updating favorite status:", err);
      // Revert the optimistic update on error
      setLpUsers(prev => prev.map(user => 
        user.id === id ? { ...user, favorite: !user.favorite } : user
      ));
    }
  }, [adminId]);

  // Editing functions
  const startEditing = useCallback((id, currentValue) => {
    setEditingId(id);
    setEditValue(currentValue);
  }, []);

  const saveMargin = useCallback(async (id) => {
    const newMargin = parseFloat(editValue);
    if (isNaN(newMargin) || newMargin < 0) {
      alert("Please enter a valid margin percentage");
      return;
    }

    try {
      // First update local state optimistically
      setLpUsers(prev => prev.map(user => {
        if (user.id === id) {
          const netEquity = user.valueInAED + user.accBalance;
          const updatedMarginAmount = (netEquity * newMargin) / 100;
          const updatedTotalNeeded = netEquity + updatedMarginAmount;
          const marginRatio = updatedMarginAmount > 0 && netEquity > 0 ? 
            netEquity / updatedMarginAmount : 0;

          return {
            ...user,
            margin: newMargin,
            marginAmount: updatedMarginAmount,
            totalNeeded: updatedTotalNeeded,
            marginRatio,
            riskLevel: calculateRiskLevel(marginRatio),
          };
        }
        return user;
      }));

      // Then update in the backend
      await axiosInstance.put(`/update-margin/${adminId}`, {
        accode: id,
        margin: newMargin,
      });
    } catch (err) {
      console.error("Error updating margin:", err);
      // On error, refresh data to restore correct state
      fetchLpUsers(true);
    } finally {
      setEditingId(null);
      setEditValue("");
    }
  }, [adminId, editValue, calculateRiskLevel, fetchLpUsers]);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditValue("");
  }, []);

  // Message handling
  const handleSendMessage = useCallback(async (recipient, message) => {
    if (!message || !recipient) return;

    try {
      console.log(`Sending message to ${recipient.name}: ${message}`);
      // Simulate API call
      setTimeout(() => {
        setMessageRecipient(null);
        alert(`Message sent successfully to ${recipient.name}`);
      }, 1000);
    } catch (err) {
      console.error("Error sending message:", err);
      alert("Failed to send message. Please try again.");
    }
  }, []);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, favoriteFilter, riskFilter]);

  // Loading display - only show for initial load, not refreshes
  if (loading && lpUsers.length === 0) {
    return (
      <div className="fixed inset-0 flex justify-center items-center bg-white">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading accounts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 w-full bg-gray-50 rounded-lg shadow">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4 md:mb-6">
        Liquidity Provider Management
      </h1>

      {/* Live Gold Rate */}
      <div className="mb-4 md:mb-6 bg-white p-3 md:p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-700">Live Gold Rate</h2>
          <div className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full font-medium">
            {formatNumber(liveRate)} AED/g
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Last updated: {new Date().toLocaleTimeString()}
        </p>
      </div>

      {/* Risk Level Legend */}
      <div className="mb-4 md:mb-6 bg-white p-3 md:p-4 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-base font-semibold text-gray-700 mb-2">
          Margin Risk Legend
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-4">
          <div className="flex items-center">
            <div className="h-4 w-4 bg-red-600 rounded-full mr-2"></div>
            <span className="text-sm text-gray-700">High Risk (67% - 100%+)</span>
          </div>
          <div className="flex items-center">
            <div className="h-4 w-4 bg-amber-500 rounded-full mr-2"></div>
            <span className="text-sm text-gray-700">Moderate Risk (34% - 66%)</span>
          </div>
          <div className="flex items-center">
            <div className="h-4 w-4 bg-green-600 rounded-full mr-2"></div>
            <span className="text-sm text-gray-700">Safe (0% - 33%)</span>
          </div>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start mb-4 md:mb-6 gap-3 md:gap-4">
        <div className="relative w-full sm:max-w-md">
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

        <div className="flex flex-wrap gap-2 md:gap-4 w-full sm:w-auto">
          {/* Risk Filter Dropdown */}
          <div className="relative">
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="all">All Risks</option>
              <option value={RISK_LEVELS.HIGH}>High Risk</option>
              <option value={RISK_LEVELS.MODERATE}>Moderate Risk</option>
              <option value={RISK_LEVELS.SAFE}>Safe</option>
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
            <label htmlFor="favoriteFilter" className="ml-2 block text-sm text-gray-900">
              Favorites Only
            </label>
          </div>

          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? (
              <>
                <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                <span>Refreshing...</span>
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                <span>Refresh Data</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Risk Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-6">
        {/* High Risk Card */}
        <div className="bg-red-50 border border-red-200 p-3 md:p-4 rounded-lg shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium text-red-800">High Risk Accounts</h3>
              <p className="text-red-600 text-2xl font-bold mt-1">{riskCounts.high}</p>
            </div>
            <AlertCircle className="h-10 w-10 text-red-500" />
          </div>
        </div>

        {/* Moderate Risk Card */}
        <div className="bg-amber-50 border border-amber-200 p-3 md:p-4 rounded-lg shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium text-amber-800">Moderate Risk Accounts</h3>
              <p className="text-amber-600 text-2xl font-bold mt-1">{riskCounts.moderate}</p>
            </div>
            <AlertTriangle className="h-10 w-10 text-amber-500" />
          </div>
        </div>

        {/* Safe Card */}
        <div className="bg-green-50 border border-green-200 p-3 md:p-4 rounded-lg shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium text-green-800">Safe Accounts</h3>
              <p className="text-green-600 text-2xl font-bold mt-1">{riskCounts.safe}</p>
            </div>
            <CheckCircle className="h-10 w-10 text-green-500" />
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-lg shadow-sm bg-white">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-700">
            Liquidity Provider Users ({lpUsers.length})
          </h2>
          <p className="text-sm text-gray-500">
            Managing users with account type "LP"
          </p>
        </div>

        {/* Table with error/empty states */}
        <div className="overflow-auto max-h-[70vh]" style={{ WebkitOverflowScrolling: "touch" }}>
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
          ) : filteredLpUsers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {search || favoriteFilter || riskFilter !== "all" ? "No matching accounts found" : "No accounts available"}
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <TableHeader 
                    label="ID" 
                    sortKey="id" 
                    sortConfig={sortConfig} 
                    requestSort={requestSort} 
                  />
                  <TableHeader 
                    label="Name" 
                    sortKey="name" 
                    sortConfig={sortConfig} 
                    requestSort={requestSort} 
                  />
                  <TableHeader 
                    label="Account Balance" 
                    sortKey="accBalance" 
                    sortConfig={sortConfig} 
                    requestSort={requestSort} 
                  />
                  <TableHeader 
                    label="Metal Weight" 
                    sortKey="metalWeight" 
                    sortConfig={sortConfig} 
                    requestSort={requestSort} 
                  />
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer sticky top-0 bg-gray-100 z-10"
                    onClick={() => requestSort("valueInAED")}
                  >
                    <div className="flex items-center">
                      Value of Metal
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        Live
                      </span>
                      {sortConfig.key === "valueInAED" && (
                        <span className="ml-1">
                          {sortConfig.direction === "ascending" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </th>
                  <TableHeader 
                    label="Margin %" 
                    sortKey="margin" 
                    sortConfig={sortConfig} 
                    requestSort={requestSort} 
                  />
                  <TableHeader 
                    label="Net Equity" 
                    sortKey="netEquity" 
                    sortConfig={sortConfig} 
                    requestSort={requestSort} 
                  />
                  <TableHeader 
                    label="Margin Amount" 
                    sortKey="marginAmount" 
                    sortConfig={sortConfig} 
                    requestSort={requestSort} 
                  />
                  <TableHeader 
                    label="Total Needed" 
                    sortKey="totalNeeded" 
                    sortConfig={sortConfig} 
                    requestSort={requestSort} 
                  />
                  <TableHeader 
                    label="Risk Level" 
                    sortKey="riskLevel" 
                    sortConfig={sortConfig} 
                    requestSort={requestSort} 
                  />
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 bg-gray-100 z-10">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginationData.currentItems.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <button
                          onClick={() => toggleFavorite(user.id)}
                          className="mr-2 focus:outline-none"
                          aria-label={user.favorite ? "Remove from favorites" : "Add to favorites"}
                        >
                          <Star
                            className={`h-5 w-5 ${
                              user.favorite
                                ? "text-yellow-400 fill-current"
                                : "text-gray-300"
                            }`}
                          />
                        </button>
                        <span className="text-sm font-medium text-gray-900">
                          {user.id}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {user.name}
                      </div>
                    
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatNumber(user.accBalance)} AED
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatNumber(user.metalWeight)} g
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatNumber(user.valueInAED)} AED
                      </div>
                      <div className="text-xs text-gray-500">
                        @ {formatNumber(user.goldratevalueInAED)} AED/g
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === user.id ? (
                        <div className="flex items-center">
                          <input
                            type="number"
                            className="block w-20 px-2 py-1 border border-gray-300 rounded-md text-sm"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            min="0"
                            max="100"
                            step="0.01"
                          />
                          <div className="ml-2 flex space-x-1">
                            <button
                              onClick={() => saveMargin(user.id)}
                              className="p-1 rounded-full text-green-600 hover:bg-green-100"
                            >
                              <Save className="h-4 w-4" />
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="p-1 rounded-full text-red-600 hover:bg-red-100"
                            >
                              <X className="h-4 w-4" />
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
                            className="ml-2 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatNumber(user.netEquity)} AED
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatNumber(user.marginAmount)} AED
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatNumber(user.totalNeeded)} AED
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <RiskIndicator riskLevel={user.riskLevel} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setMessageRecipient(user)}
                        className={`inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded ${
                          user.riskLevel === RISK_LEVELS.HIGH
                            ? "bg-red-100 text-red-700 hover:bg-red-200"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        <Mail className="h-4 w-4 mr-1" />
                        Alert
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {filteredLpUsers.length > 0 && (
          <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{" "}
                  <span className="font-medium">{paginationData.indexOfFirstItem + 1}</span> to{" "}
                  <span className="font-medium">
                    {Math.min(paginationData.indexOfLastItem, filteredLpUsers.length)}
                  </span>{" "}
                  of <span className="font-medium">{filteredLpUsers.length}</span> accounts
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                      currentPage === 1
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    <span className="sr-only">Previous</span>
                    <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                  </button>
                  
                  {Array.from({ length: paginationData.totalPages }, (_, i) => i + 1)
                    .filter(
                      (pageNum) =>
                        pageNum === 1 ||
                        pageNum === paginationData.totalPages ||
                        Math.abs(pageNum - currentPage) <= 1
                    )
                    .map((pageNum, i, arr) => {
                      // Add ellipsis
                      if (i > 0 && pageNum - arr[i - 1] > 1) {
                        return (
                          <span
                            key={`ellipsis-${pageNum}`}
                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                          >
                            ...
                          </span>
                        );
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === pageNum
                              ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-600"
                              : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  
                  <button
                    onClick={() => setCurrentPage(Math.min(paginationData.totalPages, currentPage + 1))}
                    disabled={currentPage === paginationData.totalPages}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                      currentPage === paginationData.totalPages
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    <span className="sr-only">Next</span>
                    <ChevronRight className="h-5 w-5" aria-hidden="true" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Message Modal */}
      {messageRecipient && (
        <MessageModal
          recipient={messageRecipient}
          onClose={() => setMessageRecipient(null)}
          onSend={handleSendMessage}
          formatNumber={formatNumber}
        />
      )}
    </div>
  );
}