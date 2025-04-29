import React, { useState, useEffect } from "react";
import {
  ArrowDownUp,
  RefreshCw,
  Search,
  Filter,
  FileText,
  AlertCircle,
  BarChart2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import axiosInstance from "../api/axios";

export default function LpStatements() {
  const adminId = localStorage.getItem("adminId");
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState("orders"); // "orders" or "profit"
  const [loading, setLoading] = useState(false);
  const [statements, setStatements] = useState([]);
  const [filters, setFilters] = useState({
    id: "",
    type: "",
    status: "",
    dateRange: "all", // all, today, week, month
    profitRange: "all", // all, positive, negative
    minProfit: "",
    maxProfit: "",
  });
  const [showFilters, setShowFilters] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Stats for profit dashboard
  const [profitStats, setProfitStats] = useState({
    totalProfit: 0,
    totalLoss: 0,
    netProfit: 0,
    averageProfit: 0,
    bestTrade: { symbol: "", profit: 0 },
    worstTrade: { symbol: "", profit: 0 },
    profitableTradesCount: 0,
    profitableTradesPercentage: 0,
  });

  // Fetch users and statements on component mount
  useEffect(() => {
    fetchUsers();
    fetchOrderStatements();
  }, []);

  // Update total pages when data or items per page changes
  useEffect(() => {
    if (statements.length > 0) {
      setTotalPages(Math.ceil(filteredStatements.length / itemsPerPage));
    }
  }, [statements, filters, itemsPerPage]);

  // Calculate profit statistics when statements change or when switching to profit tab
  useEffect(() => {
    if (statements.length > 0) {
      calculateProfitStats(statements);
    }
  }, [statements, activeTab]);

  // Fetch user data from the API
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/fetch-data/${adminId}`);
      if (response.data && response.data.data) {
        setUsers(response.data.data);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching users:", error);
      setLoading(false);
    }
  };

  // Fetch order statements
  const fetchOrderStatements = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/lp-order/${adminId}`);
      if (response.data.success && response.data.data) {
        setStatements(response.data.data);
        setTotalPages(Math.ceil(response.data.data.length / itemsPerPage));
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching order statements:", error);
      setLoading(false);
    }
  };

  // Calculate profit statistics
  const calculateProfitStats = (data) => {
    let totalProfit = 0;
    let totalLoss = 0;
    let profitableTradesCount = 0;
    let bestTrade = { symbol: "", profit: 0 };
    let worstTrade = { symbol: "", profit: 0 };
    let allProfits = [];

    data.forEach((statement) => {
      const profitValue = parseFloat(statement.profit) || 0;
      allProfits.push(profitValue);

      if (profitValue > 0) {
        totalProfit += profitValue;
        profitableTradesCount++;
        
        if (profitValue > bestTrade.profit) {
          bestTrade = { 
            symbol: statement.symbol, 
            profit: profitValue,
            type: statement.type,
            volume: statement.volume,
            openDate: statement.openDate
          };
        }
      } else if (profitValue < 0) {
        totalLoss += Math.abs(profitValue);
        
        if (profitValue < worstTrade.profit) {
          worstTrade = { 
            symbol: statement.symbol, 
            profit: profitValue,
            type: statement.type,
            volume: statement.volume,
            openDate: statement.openDate
          };
        }
      }
    });

    const netProfit = totalProfit - totalLoss;
    const averageProfit = data.length > 0 ? netProfit / data.length : 0;
    const profitableTradesPercentage = data.length > 0 ? (profitableTradesCount / data.length) * 100 : 0;

    setProfitStats({
      totalProfit,
      totalLoss,
      netProfit,
      averageProfit,
      bestTrade,
      worstTrade,
      profitableTradesCount,
      profitableTradesPercentage,
      allProfits
    });
  };

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Reset to first page when filters change
    setCurrentPage(1);
  };

  // Apply filters to statements
  const filteredStatements = statements.filter((statement) => {
    // Filter by ID or position ID
    if (
      filters.id &&
      !statement.positionId?.toLowerCase().includes(filters.id.toLowerCase()) &&
      !statement.orderNo?.toLowerCase().includes(filters.id.toLowerCase())
    ) {
      return false;
    }

    // Filter by type
    if (filters.type && statement.type !== filters.type) {
      return false;
    }

    // Filter by status
    if (filters.status && statement.status !== filters.status) {
      return false;
    }

    // Filter by profit range
    if (filters.profitRange !== "all") {
      const profit = parseFloat(statement.profit) || 0;
      if (filters.profitRange === "positive" && profit <= 0) {
        return false;
      } else if (filters.profitRange === "negative" && profit >= 0) {
        return false;
      }
    }

    // Filter by min profit
    if (filters.minProfit && !isNaN(parseFloat(filters.minProfit))) {
      const profit = parseFloat(statement.profit) || 0;
      if (profit < parseFloat(filters.minProfit)) {
        return false;
      }
    }

    // Filter by max profit
    if (filters.maxProfit && !isNaN(parseFloat(filters.maxProfit))) {
      const profit = parseFloat(statement.profit) || 0;
      if (profit > parseFloat(filters.maxProfit)) {
        return false;
      }
    }

    // Filter by date range
    if (filters.dateRange !== "all") {
      const statementDate = new Date(statement.openDate);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);

      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);

      if (
        filters.dateRange === "today" &&
        statementDate.toDateString() !== today.toDateString()
      ) {
        return false;
      } else if (
        filters.dateRange === "yesterday" &&
        statementDate.toDateString() !== yesterday.toDateString()
      ) {
        return false;
      } else if (filters.dateRange === "week" && statementDate < weekAgo) {
        return false;
      } else if (filters.dateRange === "month" && statementDate < monthAgo) {
        return false;
      }
    }

    return true;
  });

  // Get current page data
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredStatements.slice(indexOfFirstItem, indexOfLastItem);

  // Format date for display
  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  // Format profit/loss with color
  const formatProfitLoss = (value) => {
    const numValue = parseFloat(value) || 0;
    const color = numValue >= 0 ? "text-green-600" : "text-red-600";
    return (
      <span className={`font-medium ${color} flex items-center`}>
        {numValue >= 0 ? (
          <ArrowUpRight size={16} className="mr-1" />
        ) : (
          <ArrowDownRight size={16} className="mr-1" />
        )}
        ${Math.abs(numValue).toFixed(2)}
      </span>
    );
  };

  // Reset all filters
  const resetFilters = () => {
    setFilters({
      id: "",
      type: "",
      status: "",
      dateRange: "all",
      profitRange: "all",
      minProfit: "",
      maxProfit: "",
    });
    setCurrentPage(1);
  };

  // Pagination component
  const Pagination = ({
    currentPage,
    totalPages,
    paginate,
    itemsPerPage,
    setItemsPerPage,
    totalItems,
  }) => {
    return (
      <div className="flex items-center justify-between bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
        <div className="flex items-center text-sm text-gray-700">
          <span>
            Showing {totalItems > 0 ? indexOfFirstItem + 1 : 0} to{" "}
            {Math.min(indexOfLastItem, totalItems)} of {totalItems} results
          </span>
          <div className="ml-4">
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                paginate(1);
              }}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            >
              <option value={5}>5 per page</option>
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
            </select>
          </div>
        </div>
        <div className="flex items-center">
          <nav
            className="relative z-0 inline-flex rounded-md shadow-sm"
            aria-label="Pagination"
          >
            <button
              onClick={() => paginate(1)}
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              disabled={currentPage === 1}
            >
              <span className="sr-only">First Page</span>
              <ChevronsLeft size={18} />
            </button>
            <button
              onClick={() => paginate(currentPage - 1)}
              className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              disabled={currentPage === 1}
            >
              <span className="sr-only">Previous</span>
              <ChevronLeft size={18} />
            </button>

            {/* Page numbers logic */}
            {[...Array(totalPages).keys()].map((number) => {
              // Only show a limited number of pages
              if (
                number + 1 === 1 ||
                number + 1 === totalPages ||
                (number + 1 >= currentPage - 1 && number + 1 <= currentPage + 1)
              ) {
                return (
                  <button
                    key={number + 1}
                    onClick={() => paginate(number + 1)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      currentPage === number + 1
                        ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                        : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    {number + 1}
                  </button>
                );
              } else if (
                (number + 1 === currentPage - 2 && currentPage > 3) ||
                (number + 1 === currentPage + 2 && currentPage < totalPages - 2)
              ) {
                return (
                  <span
                    key={number + 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                  >
                    ...
                  </span>
                );
              }
              return null;
            })}

            <button
              onClick={() => paginate(currentPage + 1)}
              className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              disabled={currentPage === totalPages}
            >
              <span className="sr-only">Next</span>
              <ChevronRight size={18} />
            </button>
            <button
              onClick={() => paginate(totalPages)}
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              disabled={currentPage === totalPages}
            >
              <span className="sr-only">Last Page</span>
              <ChevronsRight size={18} />
            </button>
          </nav>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 h-full w-full bg-gray-50">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-800">LP Statements</h1>
        <p className="text-gray-600">View and analyze your trading performance</p>
      </div>

      {/* User Selection and Tab Navigation */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-4">
        <div className="bg-gradient-to-r from-blue-700 to-blue-500 text-white p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-bold text-lg">Account Statements</h2>
            </div>
          </div>
        </div>

        <div className="border-b border-gray-200">
          <nav className="flex" aria-label="Tabs">
            <button
              onClick={() => setActiveTab("orders")}
              className={`px-4 py-3 text-sm font-medium ${
                activeTab === "orders"
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } transition-colors`}
            >
              <div className="flex items-center">
                <BarChart2 size={16} className="mr-2" />
                Trading Orders
              </div>
            </button>
            <button
              onClick={() => setActiveTab("profit")}
              className={`px-4 py-3 text-sm font-medium ${
                activeTab === "profit"
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } transition-colors`}
            >
              <div className="flex items-center">
                <DollarSign size={16} className="mr-2" />
                Profit Analysis
              </div>
            </button>
          </nav>
        </div>

        {/* Filters and search */}
        <div className="p-4 bg-gray-50 border-b">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="relative">
                <input
                  type="text"
                  name="id"
                  value={filters.id}
                  onChange={handleFilterChange}
                  placeholder="Search order ID..."
                  className="rounded-md border border-gray-300 pl-9 pr-4 py-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm w-full md:w-64"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={16} className="text-gray-400" />
                </div>
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="ml-2 flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 bg-white rounded-md border border-gray-300 px-3 py-2"
              >
                <Filter size={16} className="mr-1" /> Filters
              </button>
              {(filters.type ||
                filters.status ||
                filters.dateRange !== "all" ||
                filters.profitRange !== "all" ||
                filters.minProfit ||
                filters.maxProfit) && (
                <button
                  onClick={resetFilters}
                  className="ml-2 flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 bg-white rounded-md border border-gray-300 px-3 py-2"
                >
                  <RefreshCw size={16} className="mr-1" /> Reset
                </button>
              )}
            </div>
          </div>

          {/* Advanced filters */}
          {showFilters && (
            <div className={`mt-4 grid grid-cols-1 md:grid-cols-${activeTab === "orders" ? "4" : "6"} gap-4`}>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  name="type"
                  value={filters.type}
                  onChange={handleFilterChange}
                  className="rounded-md border border-gray-300 py-2 px-3 w-full text-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Types</option>
                  <option value="BUY">Buy</option>
                  <option value="SELL">Sell</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  className="rounded-md border border-gray-300 py-2 px-3 w-full text-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Statuses</option>
                  <option value="OPEN">Open</option>
                  <option value="CLOSED">Closed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Date Range
                </label>
                <select
                  name="dateRange"
                  value={filters.dateRange}
                  onChange={handleFilterChange}
                  className="rounded-md border border-gray-300 py-2 px-3 w-full text-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                </select>
              </div>
              
              {activeTab === "profit" && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Profit Range
                    </label>
                    <select
                      name="profitRange"
                      value={filters.profitRange}
                      onChange={handleFilterChange}
                      className="rounded-md border border-gray-300 py-2 px-3 w-full text-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">All</option>
                      <option value="positive">Profitable Only</option>
                      <option value="negative">Loss Only</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Min Profit ($)
                    </label>
                    <input
                      type="number"
                      name="minProfit"
                      value={filters.minProfit}
                      onChange={handleFilterChange}
                      placeholder="Min"
                      className="rounded-md border border-gray-300 py-2 px-3 w-full text-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Max Profit ($)
                    </label>
                    <input
                      type="number"
                      name="maxProfit"
                      value={filters.maxProfit}
                      onChange={handleFilterChange}
                      placeholder="Max"
                      className="rounded-md border border-gray-300 py-2 px-3 w-full text-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Profit Dashboard */}
        {activeTab === "profit" && (
          <div className="p-4 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Net Profit</p>
                    <p className={`text-2xl font-bold ${profitStats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${profitStats.netProfit.toFixed(2)}
                    </p>
                  </div>
                  <div className={`rounded-full p-2 ${profitStats.netProfit >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                    {profitStats.netProfit >= 0 ? (
                      <TrendingUp size={20} className="text-green-600" />
                    ) : (
                      <TrendingDown size={20} className="text-red-600" />
                    )}
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Total Profit</p>
                    <p className="text-2xl font-bold text-green-600">
                      ${profitStats.totalProfit.toFixed(2)}
                    </p>
                  </div>
                  <div className="rounded-full p-2 bg-green-100">
                    <ArrowUpRight size={20} className="text-green-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-lg shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Total Loss</p>
                    <p className="text-2xl font-bold text-red-600">
                      ${profitStats.totalLoss.toFixed(2)}
                    </p>
                  </div>
                  <div className="rounded-full p-2 bg-red-100">
                    <ArrowDownRight size={20} className="text-red-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Profitability</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {profitStats.profitableTradesPercentage.toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500">
                      {profitStats.profitableTradesCount} of {statements.length} trades
                    </p>
                  </div>
                  <div className="rounded-full p-2 bg-purple-100">
                    <BarChart2 size={20} className="text-purple-600" />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Best Trade */}
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
                  <TrendingUp size={20} className="mr-2 text-green-600" /> Best Performing Trade
                </h3>
                {profitStats.bestTrade.symbol ? (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">Symbol</span>
                      <span className="font-medium">{profitStats.bestTrade.symbol}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">Type</span>
                      <span className={`font-medium ${profitStats.bestTrade.type === 'BUY' ? 'text-green-600' : 'text-red-600'}`}>
                        {profitStats.bestTrade.type}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">Volume</span>
                      <span className="font-medium">{profitStats.bestTrade.volume}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">Date</span>
                      <span className="font-medium">{formatDate(profitStats.bestTrade.openDate)}</span>
                    </div>
                    <div className="flex justify-between items-center text-lg">
                      <span className="text-gray-600">Profit</span>
                      <span className="font-bold text-green-600">${profitStats.bestTrade.profit.toFixed(2)}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">No profitable trades found</p>
                )}
              </div>
              
              {/* Worst Trade */}
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
                  <TrendingDown size={20} className="mr-2 text-red-600" /> Worst Performing Trade
                </h3>
                {profitStats.worstTrade.symbol ? (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">Symbol</span>
                      <span className="font-medium">{profitStats.worstTrade.symbol}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">Type</span>
                      <span className={`font-medium ${profitStats.worstTrade.type === 'BUY' ? 'text-green-600' : 'text-red-600'}`}>
                        {profitStats.worstTrade.type}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">Volume</span>
                      <span className="font-medium">{profitStats.worstTrade.volume}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">Date</span>
                      <span className="font-medium">{formatDate(profitStats.worstTrade.openDate)}</span>
                    </div>
                    <div className="flex justify-between items-center text-lg">
                      <span className="text-gray-600">Loss</span>
                      <span className="font-bold text-red-600">${Math.abs(profitStats.worstTrade.profit).toFixed(2)}</span>
                    </div>
                  </div>
                ) : (
                    <p className="text-gray-500">No loss trades found</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Orders Table */}
        {activeTab === "orders" && (
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex justify-center items-center p-8">
                <RefreshCw size={24} className="animate-spin text-blue-500" />
                <span className="ml-2 text-gray-600">Loading data...</span>
              </div>
            ) : filteredStatements.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <FileText size={48} className="text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No statements found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  There are no statements matching your filters or no data available yet.
                </p>
                {(filters.id || filters.type || filters.status || filters.dateRange !== "all") && (
                  <button
                    onClick={resetFilters}
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <RefreshCw size={16} className="mr-2" /> Reset Filters
                  </button>
                )}
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Order ID
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      <div className="flex items-center">
                        Symbol
                        <button
                          onClick={() => {
                            // Implement sorting by symbol
                          }}
                          className="ml-1"
                        >
                          <ArrowDownUp size={14} className="text-gray-400" />
                        </button>
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Type
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Volume
                    </th>
                     <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Open Price
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Close Price
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Open Date
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Close Date
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      <div className="flex items-center">
                        Profit/Loss
                        <button
                          onClick={() => {
                            // Implement sorting by profit
                          }}
                          className="ml-1"
                        >
                          <ArrowDownUp size={14} className="text-gray-400" />
                        </button>
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentItems.map((statement, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {statement.orderNo || statement.positionId || "--"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {statement.symbol}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            statement.type === "BUY"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {statement.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {statement.volume}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {statement.entryPrice.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {statement.closingPrice.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(statement.openDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {statement.closeDate ? formatDate(statement.closeDate) : "--"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {formatProfitLoss(statement.profit)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            statement.status === "OPEN"
                              ? "bg-blue-100 text-blue-800"
                              : statement.status === "CLOSED"
                              ? "bg-gray-100 text-gray-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {statement.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Pagination */}
        {!loading && filteredStatements.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            paginate={setCurrentPage}
            itemsPerPage={itemsPerPage}
            setItemsPerPage={setItemsPerPage}
            totalItems={filteredStatements.length}
          />
        )}
      </div>
      
      {/* Warning for no data */}
      {statements.length === 0 && !loading && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle size={24} className="text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                No LP statements data available. Once trading activity occurs, statements will appear here.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}