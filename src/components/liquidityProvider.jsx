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


export default function LiquidityProviderManagement() {
  const { marketData } = useMarketData(["GOLD"]);
  const [liveRate, setLiveRate] = useState(0);
  const [lpUsers, setLpUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  // Format numbers consistently
  const formatNumber = useCallback((num) => {
    return num.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }, []);

  // Calculate risk level based on margin ratio (reversed logic)
  const calculateRiskLevel = useCallback((marginRatio) => {
    if (marginRatio <= 0.33) {
      return "safe"; // Low margin ratio (0%-33%) - Now considered safe
    } else if (marginRatio <= 0.66) {
      return "moderate"; // Medium margin ratio (34%-66%) - Moderate risk
    } else {
      return "high"; // High margin ratio (67%-100%+) - Now considered high risk
    }
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

    const marginRatio = marginAmount > 0 && netEquity > 0 
      ? netEquity / marginAmount 
      : 0;

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
      riskLevel: calculateRiskLevel(marginRatio),
      accountType: item.Account_Type?.toLowerCase() || "n/a",
      favorite: item.is_favorite || false,
      email: item.email || "customer@example.com",
      phone: item.phone || "N/A",
    };
  }, [calculateRiskLevel]);

  // Fetch data from backend - filtered to only show liquidity providers
  const fetchLpUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/fetch-data");
      if (response.data.status === 200) {
        // Process and transform the data - filter to only show LP account types
        const transformedData = response.data.data
          .filter(item => item.Account_Type && item.Account_Type.toLowerCase() === "lp")
          .map(item => calculateUserData(item, liveRate));
        setLpUsers(transformedData);
      } else {
        setError("Failed to fetch data");
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Error connecting to server");
    } finally {
      setLoading(false);
    }
  }, [liveRate, calculateUserData]);

  // Initial data fetch
  useEffect(() => {
    fetchLpUsers();
  }, [fetchLpUsers]);

  // Update calculations when market data changes
  useEffect(() => {
    if (marketData?.bid) {
      const calculatedRate = parseFloat(((marketData.bid / 31.103) * 3.674).toFixed(2));
      setLiveRate(calculatedRate);

      // Update all users with the new gold rate
      setLpUsers(prevLpUsers =>
        prevLpUsers.map(user => {
          const valueInAED = parseFloat((calculatedRate * user.metalWeight).toFixed(2));
          const netEquity = parseFloat((valueInAED + user.accBalance).toFixed(2));
          const marginAmount = parseFloat(((netEquity * user.margin) / 100).toFixed(2));
          const totalNeeded = parseFloat((marginAmount + netEquity).toFixed(2));

          const marginRatio = marginAmount > 0 && netEquity > 0 
            ? netEquity / marginAmount 
            : 0;

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
  }, [marketData, calculateRiskLevel]);

  // Sort function
  const requestSort = useCallback((key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  }, [sortConfig]);

  // Sorted users
  const sortedLpUsers = useMemo(() => {
    const sortableLpUsers = [...lpUsers];
    if (sortConfig.key) {
      sortableLpUsers.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableLpUsers;
  }, [lpUsers, sortConfig]);

  // Filtered users
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

  // Pagination
  const totalPages = useMemo(() => 
    Math.ceil(filteredLpUsers.length / itemsPerPage), 
    [filteredLpUsers, itemsPerPage]
  );
  
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  
  const currentItems = useMemo(() => 
    filteredLpUsers.slice(indexOfFirstItem, indexOfLastItem),
    [filteredLpUsers, indexOfFirstItem, indexOfLastItem]
  );

  // Toggle favorite
  const toggleFavorite = useCallback(async (id) => {
    try {
      // Find the current favorite status
      const user = lpUsers.find((d) => d.id === id);
      const newFavoriteStatus = !user.favorite;

      // Update in the backend
      const response = await axiosInstance.put("/update-favorite", {
        accode: id,
        is_favorite: newFavoriteStatus,
      });

      if (response.data.status === 200 || response.data.status === 201) {
        // Update local state
        setLpUsers(lpUsers.map((user) =>
          user.id === id ? { ...user, favorite: newFavoriteStatus } : user
        ));
      } else {
        console.error("Failed to update favorite status");
      }
    } catch (err) {
      console.error("Error updating favorite status:", err);
    }
  }, [lpUsers]);

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
      const response = await axiosInstance.put("/update-margin", {
        accode: id,
        margin: newMargin,
      });

      if (response.data.status === 200 || response.data.status === 201) {
        // Update local state with recalculated values
        setLpUsers(lpUsers.map((user) => {
          if (user.id === id) {
            const netEquity = user.valueInAED + user.accBalance;
            const updatedMarginAmount = (netEquity * newMargin) / 100;
            const updatedTotalNeeded = netEquity + updatedMarginAmount;

            const marginRatio = updatedMarginAmount > 0 && netEquity > 0
              ? netEquity / updatedMarginAmount
              : 0;

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
      } else {
        console.error("Failed to update margin");
      }
    } catch (err) {
      console.error("Error updating margin:", err);
    } finally {
      setEditingId(null);
      setEditValue("");
    }
  }, [lpUsers, editValue, calculateRiskLevel]);

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

  // Send message function
  const sendMessage = useCallback(
    async (e) => {
      e.preventDefault();
      const message = e.target.message.value;

      if (!message || !messageRecipient) {
        return;
      }

      try {
        // Here you would send the message to your backend
        // For now, we'll just simulate success
        console.log(`Sending message to ${messageRecipient.name}: ${message}`);

        // Simulate API call with timeout
        setTimeout(() => {
          setSendingMessage(false);
          setMessageRecipient(null);
          alert(`Message sent successfully to ${messageRecipient.name}`);
        }, 1000);

        // Actual implementation would look like:
        /*
        const response = await axiosInstance.post('/send-message', {
          recipient_id: messageRecipient.id,
          message,
          message_type: 'margin_warning'
        });
        
        if (response.data.status === 200 || response.data.status === 201) {
          setSendingMessage(false);
          setMessageRecipient(null);
          alert('Message sent successfully');
        } else {
          throw new Error('Failed to send message');
        }
        */
      } catch (err) {
        console.error("Error sending message:", err);
        alert("Failed to send message. Please try again.");
      }
    },
    [messageRecipient]
  );

  // Risk indicator component
  const RiskIndicator = ({ riskLevel }) => {
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
  };
  // Loading state
  if (loading && lpUsers.length === 0) {
    return (
      <div className="p-6 max-w-full bg-gray-50 rounded-lg shadow flex justify-center items-center h-64">
        <p className="text-lg text-gray-600">
          Loading liquidity provider data...
        </p>
      </div>
    );
  }

  // Error state
  if (error && lpUsers.length === 0) {
    return (
      <div className="p-6 max-w-full bg-gray-50 rounded-lg shadow flex flex-col justify-center items-center h-64">
        <p className="text-lg text-red-600 mb-4">{error}</p>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={fetchLpUsers}
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
            {sortConfig.direction === "ascending" ? "↑" : "↓"}
          </span>
        )}
      </div>
    </th>
  );

  return (
    <div className="p-6 max-w-full bg-gray-50 rounded-lg shadow">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Liquidity Provider Management
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
            <span className="text-sm text-gray-700">
              High Risk (67% - 100%+)
            </span>
          </div>
          <div className="flex items-center">
            <div className="h-4 w-4 bg-amber-500 rounded-full mr-2"></div>
            <span className="text-sm text-gray-700">
              Moderate Risk (34% - 66%)
            </span>
          </div>
          <div className="flex items-center">
            <div className="h-4 w-4 bg-green-600 rounded-full mr-2"></div>
            <span className="text-sm text-gray-700">Safe (0% - 33%)</span>
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
            onClick={fetchLpUsers}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
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
                {lpUsers.filter((user) => user.riskLevel === "high").length}
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
                {lpUsers.filter((user) => user.riskLevel === "moderate").length}
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
                {lpUsers.filter((user) => user.riskLevel === "safe").length}
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
            Liquidity Provider Users ({lpUsers.length})
          </h2>
          <p className="text-sm text-gray-500">
            Managing users with account type "LP"
          </p>
        </div>

        {lpUsers.length === 0 && !loading ? (
          <div className="p-6 text-center">
            <p className="text-gray-600">No liquidity provider users found.</p>
          </div>
        ) : (
          <>
            {/* Responsive table container with both horizontal and vertical scrolling */}
            <div
              className="overflow-auto max-h-[70vh]"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
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

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatNumber(user.netEquity)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatNumber(user.marginAmount)}
                      </td>

                      {/* Total Needed with Risk Coloring */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div
                          className={`text-sm font-medium ${
                            user.riskLevel === "high"
                              ? "text-red-600"
                              : user.riskLevel === "moderate"
                              ? "text-amber-500"
                              : "text-green-600"
                          }`}
                        >
                          {formatNumber(user.totalNeeded)}
                        </div>
                      </td>

                      {/* Risk Status Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <RiskIndicator riskLevel={user.riskLevel} />
                      </td>

                      {/* Actions Column */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => toggleFavorite(user.id)}
                            className="text-gray-400 hover:text-yellow-500 focus:outline-none"
                          >
                            <Star
                              className={`h-5 w-5 ${
                                user.favorite
                                  ? "text-yellow-500 fill-yellow-500"
                                  : "text-gray-400"
                              }`}
                            />
                          </button>

                          {/* Send Message Button for High Risk Users */}
                          {user.riskLevel === "high" && (
                            <button
                              onClick={() => openMessageModal(user)}
                              className="text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 px-2 py-1 rounded flex items-center"
                            >
                              <Mail className="h-4 w-4 mr-1" />
                              <span>Alert</span>
                            </button>
                          )}
                        </div>
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
                    Showing{" "}
                    <span className="font-medium">{indexOfFirstItem + 1}</span>{" "}
                    to{" "}
                    <span className="font-medium">
                      {Math.min(indexOfLastItem, filteredLpUsers.length)}
                    </span>{" "}
                    of{" "}
                    <span className="font-medium">
                      {filteredLpUsers.length}
                    </span>{" "}
                    results
                  </p>
                </div>
                <div className="flex justify-center">
                  <nav
                    className="isolate inline-flex -space-x-px rounded-md shadow-sm"
                    aria-label="Pagination"
                  >
                    <button
                      onClick={() =>
                        setCurrentPage(Math.max(1, currentPage - 1))
                      }
                      disabled={currentPage === 1}
                      className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 ${
                        currentPage === 1
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                      }`}
                    >
                      <span className="sr-only">Previous</span>
                      <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                    </button>

                    {/* Pagination numbers - limited for mobile */}
                    <div className="hidden sm:flex">
                      {Array.from({ length: Math.min(5, totalPages) }).map(
                        (_, i) => {
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
                                  ? "z-10 bg-indigo-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                                  : "text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        }
                      )}
                    </div>

                    {/* Current page indicator for mobile */}
                    <div className="sm:hidden inline-flex items-center px-4 py-2 text-sm font-semibold ring-1 ring-inset ring-gray-300">
                      Page {currentPage} of {totalPages}
                    </div>

                    <button
                      onClick={() =>
                        setCurrentPage(Math.min(totalPages, currentPage + 1))
                      }
                      disabled={currentPage === totalPages}
                      className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 ${
                        currentPage === totalPages
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                      }`}
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
      {/* Message Modal */}
      {sendingMessage && messageRecipient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Send Alert to {messageRecipient.name}
              </h3>
              <button
                onClick={() => {
                  setSendingMessage(false);
                  setMessageRecipient(null);
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                <div>
                  <h3 className="text-sm font-medium text-red-800">
                    High Risk Account
                  </h3>
                  <div className="mt-1 text-sm text-red-700">
                    <p>Current Margin: {messageRecipient.margin}%</p>
                    <p>
                      Net Equity: {formatNumber(messageRecipient.netEquity)}
                    </p>
                    <p>
                      Margin Amount:{" "}
                      {formatNumber(messageRecipient.marginAmount)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={sendMessage}>
              <div className="mb-4">
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-gray-700"
                >
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  defaultValue={`Dear ${messageRecipient.name},\n\nThis is to inform you that your account requires immediate attention. Your current margin level is below the required threshold. Please deposit additional funds or reduce your positions to meet the margin requirements.\n\nRegards,\nRisk Management Team`}
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setSendingMessage(false);
                    setMessageRecipient(null);
                  }}
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
      )}
    </div>
  );
}
