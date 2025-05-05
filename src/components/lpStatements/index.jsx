// src/components/LpStatements/index.jsx
import React, { useState, useEffect } from "react";
import axiosInstance from "../../api/axios";
import LpNavigation from "./LpNavigation";
import OrdersTab from "./OrdersTab";
import ProfitTab from "./ProfitTab";
import LedgerTab from "./LedgerTab";
import LpFundManagement from "./LpFundManagement";
import FilterContainer from "./FilterContainer";

import { AlertCircle } from "lucide-react";

export default function LpStatements() {
  const adminId = localStorage.getItem("adminId");
  const [activeTab, setActiveTab] = useState("orders");
  const [loading, setLoading] = useState(false);
  const [statements, setStatements] = useState([]);
  const [filters, setFilters] = useState({
    id: "",
    type: "",
    status: "",
    dateRange: "all",
    profitRange: "all",
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

  // Ledger states
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [currentLedgerPage, setCurrentLedgerPage] = useState(1);
  const [totalLedgerPages, setTotalLedgerPages] = useState(1);
  const [totalLedgerItems, setTotalLedgerItems] = useState(0);
  const [ledgerFilters, setLedgerFilters] = useState({
    entryType: "",
    entryNature: "",
    dateRange: "all",
    startDate: "",
    endDate: "",
    minAmount: "",
    maxAmount: "",
    transactionType: "",
    asset: "",
    orderType: "",
    orderStatus: "",
    symbol: "",
    positionId: "",
    positionStatus: "",
    entryId: "",
    referenceNumber: "",
    searchTerm: "",
    sortBy: "date",
    sortOrder: "desc",
  });

  // Fetch data based on active tab
  useEffect(() => {
    if (activeTab === "orders" || activeTab === "profit") {
      fetchOrderStatements();
    } else if (activeTab === "ledger") {
      fetchLedgerEntries();
    }
  }, [activeTab, currentLedgerPage, itemsPerPage]);

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

  // Fetch ledger entries
  const fetchLedgerEntries = async () => {
    try {
      setLoading(true);

      // Prepare parameters for API call
      const params = new URLSearchParams({
        adminId,
        page: currentLedgerPage,
        limit: itemsPerPage,
        sortBy: ledgerFilters.sortBy,
        sortOrder: ledgerFilters.sortOrder,
      });

      // Add other filters if they exist
      if (ledgerFilters.entryId)
        params.append("entryId", ledgerFilters.entryId);
      if (ledgerFilters.entryType)
        params.append("entryType", ledgerFilters.entryType);
      if (ledgerFilters.entryNature)
        params.append("entryNature", ledgerFilters.entryNature);
      if (ledgerFilters.referenceNumber)
        params.append("referenceNumber", ledgerFilters.referenceNumber);
      if (ledgerFilters.searchTerm)
        params.append("searchTerm", ledgerFilters.searchTerm);

      // Handle date filters
      if (ledgerFilters.dateRange === "custom") {
        if (ledgerFilters.startDate)
          params.append("startDate", ledgerFilters.startDate);
        if (ledgerFilters.endDate)
          params.append("endDate", ledgerFilters.endDate);
      } else if (ledgerFilters.dateRange && ledgerFilters.dateRange !== "all") {
        // Convert dateRange to actual start/end dates
        const today = new Date();
        let startDate = new Date(today);

        if (ledgerFilters.dateRange === "today") {
          startDate = new Date(today.setHours(0, 0, 0, 0));
        } else if (ledgerFilters.dateRange === "yesterday") {
          startDate = new Date(today);
          startDate.setDate(startDate.getDate() - 1);
          startDate.setHours(0, 0, 0, 0);
        } else if (ledgerFilters.dateRange === "week") {
          startDate.setDate(startDate.getDate() - 7);
        } else if (ledgerFilters.dateRange === "month") {
          startDate.setMonth(startDate.getMonth() - 1);
        }

        params.append("startDate", startDate.toISOString());
        if (ledgerFilters.dateRange !== "today") {
          params.append("endDate", new Date().toISOString());
        }
      }

      // Amount range filters
      if (ledgerFilters.minAmount)
        params.append("minAmount", ledgerFilters.minAmount);
      if (ledgerFilters.maxAmount)
        params.append("maxAmount", ledgerFilters.maxAmount);

      // Transaction details filters
      if (ledgerFilters.transactionType)
        params.append("transactionType", ledgerFilters.transactionType);
      if (ledgerFilters.asset) params.append("asset", ledgerFilters.asset);

      // Order details filters
      if (ledgerFilters.orderType)
        params.append("orderType", ledgerFilters.orderType);
      if (ledgerFilters.orderStatus)
        params.append("orderStatus", ledgerFilters.orderStatus);
      if (ledgerFilters.symbol) params.append("symbol", ledgerFilters.symbol);

      // LP details filters
      if (ledgerFilters.positionId)
        params.append("positionId", ledgerFilters.positionId);
      if (ledgerFilters.positionStatus)
        params.append("positionStatus", ledgerFilters.positionStatus);

      const response = await axiosInstance.get(`/fetch-ledger`, { params });
      if (response.data.success && response.data.data) {
        setLedgerEntries(response.data.data || []);
        setTotalLedgerPages(response.data.pagination.pages);
        setTotalLedgerItems(response.data.pagination.total);
      } else {
        console.error(
          "Failed to fetch ledger entries:",
          response.data?.message || "Unknown error"
        );
      }
    } catch (error) {
      console.error("Error fetching ledger entries:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle ledger filter changes
  const handleLedgerFilterChange = (e) => {
    const { name, value } = e.target;
    setLedgerFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
    setCurrentLedgerPage(1); // Reset to first page when filters change
  };

  // Reset ledger filters
  const resetLedgerFilters = () => {
    setLedgerFilters({
      entryType: "",
      entryNature: "",
      dateRange: "all",
      startDate: "",
      endDate: "",
      minAmount: "",
      maxAmount: "",
      transactionType: "",
      asset: "",
      orderType: "",
      orderStatus: "",
      symbol: "",
      positionId: "",
      positionStatus: "",
      entryId: "",
      referenceNumber: "",
      searchTerm: "",
      sortBy: "date",
      sortOrder: "desc",
    });
    setCurrentLedgerPage(1);
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
            openDate: statement.openDate,
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
            openDate: statement.openDate,
          };
        }
      }
    });

    const netProfit = totalProfit - totalLoss;
    const averageProfit = data.length > 0 ? netProfit / data.length : 0;
    const profitableTradesPercentage =
      data.length > 0 ? (profitableTradesCount / data.length) * 100 : 0;

    setProfitStats({
      totalProfit,
      totalLoss,
      netProfit,
      averageProfit,
      bestTrade,
      worstTrade,
      profitableTradesCount,
      profitableTradesPercentage,
      allProfits,
    });
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1); // Reset pagination when switching tabs

    if (tab === "ledger") {
      setCurrentLedgerPage(1); // Reset ledger pagination
    }
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

  // Date formatting utility
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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
  const currentItems = filteredStatements.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  return (
    <div className="p-6 h-full w-full bg-gray-50">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-800">LP Statements</h1>
        <p className="text-gray-600">
          View and analyze your trading performance
        </p>
      </div>

      {/* Main content card */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-4">
        <div className="bg-gradient-to-r from-blue-700 to-blue-500 text-white p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-bold text-lg">Account Statements</h2>
            </div>
          </div>
        </div>

        {/* Navigation tabs */}
        <LpNavigation activeTab={activeTab} setActiveTab={handleTabChange} />

        {/* Filter Container - Using our new component */}
        <FilterContainer
          activeTab={activeTab}
          filters={filters}
          handleFilterChange={handleFilterChange}
          resetFilters={resetFilters}
          ledgerFilters={ledgerFilters}
          handleLedgerFilterChange={handleLedgerFilterChange}
          resetLedgerFilters={resetLedgerFilters}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
        />

        {/* Tab content */}
        {activeTab === "profit" ? (
          <ProfitTab profitStats={profitStats} formatDate={formatDate} />
        ) : activeTab === "ledger" ? (
          <LedgerTab
            loading={loading}
            ledgerEntries={ledgerEntries}
            currentLedgerPage={currentLedgerPage}
            totalLedgerPages={totalLedgerPages}
            totalLedgerItems={totalLedgerItems}
            itemsPerPage={itemsPerPage}
            setItemsPerPage={setItemsPerPage}
            setCurrentLedgerPage={setCurrentLedgerPage}
            formatDate={formatDate}
          />
        ) : activeTab === "fund-management" ? (
          <LpFundManagement />
        ) : (
          <OrdersTab
            loading={loading}
            filteredStatements={filteredStatements}
            currentItems={currentItems}
            resetFilters={resetFilters}
            filters={filters}
            formatDate={formatDate}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            setItemsPerPage={setItemsPerPage}
            indexOfFirstItem={indexOfFirstItem}
          />
        )}
      </div>

      {/* No data message */}
      {!loading &&
        ((activeTab === "orders" && filteredStatements.length === 0) ||
          (activeTab === "ledger" && ledgerEntries.length === 0)) && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 flex items-start mt-4">
            <AlertCircle className="text-yellow-500 mr-3 mt-0.5" size={18} />
            <div>
              <h3 className="font-medium text-yellow-800">No data found</h3>
              <p className="text-yellow-700 text-sm mt-1">
                {activeTab === "orders"
                  ? "No order statements match your current filters. Try adjusting your filters or clear them to see all statements."
                  : "No ledger entries found. Try adjusting your filters or clear them to see all entries."}
              </p>
              <button
                onClick={
                  activeTab === "orders" ? resetFilters : resetLedgerFilters
                }
                className="text-yellow-800 underline text-sm mt-2 hover:text-yellow-900"
              >
                Clear all filters
              </button>
            </div>
          </div>
        )}
    </div>
  );
}