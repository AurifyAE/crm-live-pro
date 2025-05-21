import React, { useState, useEffect, useCallback } from "react";
import {
  ArrowDownUp,
  RefreshCw,
  Search,
  Filter,
  FileText,
  Download,
  Clock,
  DollarSign,
  Calendar,
  CreditCard,
  AlertCircle,
  BarChart2,
  Plus,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Book,
  Settings,
  AlertTriangle,
  ChevronDown,
  Layers,
  Info,
  Package,
  X,
} from "lucide-react";
import axiosInstance from "../api/axios";
import LedgerTab from "./lpStatements/LedgerTab";

export default function Statements() {
  const adminId = localStorage.getItem("adminId");
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("All");
  const [activeTab, setActiveTab] = useState("orders"); // "orders" or "ledger"
  const [loading, setLoading] = useState(false);
  const [statements, setStatements] = useState([]);
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });
  const [filters, setFilters] = useState({
    id: "",
    type: "",
    status: "",
    dateRange: "all", // all, today, week, month
  });
  const [ledgerFilters, setLedgerFilters] = useState({
    entryId: "",
    entryType: "",
    entryNature: "",
    referenceNumber: "",
    transactionType: "",
    asset: "",
    orderType: "",
    orderStatus: "",
    symbol: "",
    positionId: "",
    positionStatus: "",
    searchTerm: "",
    minAmount: "",
    maxAmount: "",
    dateRange: "all", // all, today, week, month
  });
  const [showFilters, setShowFilters] = useState(false);

  // Pagination states
  const [currentOrderPage, setCurrentOrderPage] = useState(1);
  const [currentLedgerPage, setCurrentLedgerPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalOrderPages, setTotalOrderPages] = useState(1);
  const [totalLedgerPages, setTotalLedgerPages] = useState(1);
  const [totalLedgerItems, setTotalLedgerItems] = useState(0);

  // Fetch users and statements on component mount
  useEffect(() => {
    fetchUsers();
    // Load default statements
    fetchOrderStatements();
  }, []);

  // Fetch user data from the API
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const adminId = localStorage.getItem("adminId");
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

  // Fetch statements based on selected user and active tab
  useEffect(() => {
    if (selectedUser) {
      if (activeTab === "orders") {
        fetchOrderStatements();
        setCurrentOrderPage(1); // Reset to first page when changing user or tab
      } else if (activeTab === "ledger") {
        fetchLedgerEntries();
        setCurrentLedgerPage(1);
      }
    }
  }, [selectedUser, activeTab]);

  // Update total pages when data or items per page changes
  useEffect(() => {
    if (statements.length > 0) {
      setTotalOrderPages(Math.ceil(filteredStatements.length / itemsPerPage));
    }

    // No need to calculate total ledger pages here as it's handled by the API pagination
  }, [statements, filters, itemsPerPage]);

  // Fetch order statements
  const fetchOrderStatements = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/order/${adminId}`);
      if (response.data.success && response.data.data) {
        setStatements(response.data?.data);
        setTotalOrderPages(Math.ceil(response.data.data.length / itemsPerPage));
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching order statements:", error);
      setLoading(false);
    }
  };

  // Fetch ledger entries with filters and pagination
  const fetchLedgerEntries = async () => {
    try {
      setLoading(true);

      // Build query parameters
      const params = {
        page: currentLedgerPage,
        limit: itemsPerPage,
        sortBy: "date",
        sortOrder: "desc",
      };

      // Add user filter if a specific user is selected
      if (selectedUser && selectedUser !== "All") {
        params.userId = users.find(
          (user) => user.ACCOUNT_HEAD === selectedUser
        )?._id;
      }

      // Add date range filters if specified
      if (dateRange.startDate) {
        params.startDate = dateRange.startDate;
      }
      if (dateRange.endDate) {
        params.endDate = dateRange.endDate;
      }

      // Apply ledger-specific filters
      Object.entries(ledgerFilters).forEach(([key, value]) => {
        if (value && key !== "dateRange") {
          params[key] = value;
        }
      });

      // Apply date range filter
      if (ledgerFilters.dateRange !== "all") {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);

        if (ledgerFilters.dateRange === "today") {
          params.startDate = today.toISOString().split("T")[0];
          params.endDate = new Date(
            today.setHours(23, 59, 59, 999)
          ).toISOString();
        } else if (ledgerFilters.dateRange === "yesterday") {
          params.startDate = yesterday.toISOString().split("T")[0];
          params.endDate = new Date(
            yesterday.setHours(23, 59, 59, 999)
          ).toISOString();
        } else if (ledgerFilters.dateRange === "week") {
          params.startDate = weekAgo.toISOString();
        } else if (ledgerFilters.dateRange === "month") {
          params.startDate = monthAgo.toISOString();
        }
      }

      const response = await axiosInstance.get(`/fetch-ledger`, { params });

      if (response.data.success && response.data.data) {
        const filteredEntries = response.data.data.filter(
          (entry) => entry.entryType !== "LP_POSITION"
        );
        setLedgerEntries(filteredEntries);
        setTotalLedgerPages(response.data.pagination.pages);
        setTotalLedgerItems(response.data.pagination.total);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching ledger entries:", error);
      setLoading(false);
    }
  };

  // Refetch ledger when filters or pagination changes
  useEffect(() => {
    if (activeTab === "ledger") {
      fetchLedgerEntries();
    }
  }, [currentLedgerPage, itemsPerPage, ledgerFilters, dateRange, selectedUser]);

  // Handle filter changes for orders
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Reset to first page when filters change
    if (activeTab === "orders") {
      setCurrentOrderPage(1);
    }
  };

  // Handle filter changes for ledger
  const handleLedgerFilterChange = (e) => {
    const { name, value } = e.target;
    setLedgerFilters((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Reset to first page when filters change
    setCurrentLedgerPage(1);
  };

  // Apply filters to statements
  const filteredStatements = statements.filter((statement) => {
    // Filter by ID
    if (selectedUser && selectedUser !== "All") {
      if (!statement.user || statement.user.ACCOUNT_HEAD !== selectedUser) {
        return false;
      }
    }
    if (
      filters.id &&
      !statement.orderNo.toLowerCase().includes(filters.id.toLowerCase())
    ) {
      return false;
    }

    // Filter by type
    if (filters.type && statement.type !== filters.type) {
      return false;
    }

    // Filter by status
    if (filters.orderStatus && statement.orderStatus !== filters.orderStatus) {
      return false;
    }

    // Filter by date range
    if (filters.dateRange !== "all") {
      const statementDate = new Date(statement.openingDate);
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

  // Get current orders page data
  const indexOfLastOrder = currentOrderPage * itemsPerPage;
  const indexOfFirstOrder = indexOfLastOrder - itemsPerPage;
  const currentOrders = filteredStatements.slice(
    indexOfFirstOrder,
    indexOfLastOrder
  );

  // Change page handlers
  const paginate = (pageNumber, setPage) => {
    setPage(pageNumber);
  };

  // Go to first, previous, next, or last page
  const goToFirstPage = (setPage) => {
    setPage(1);
  };

  const goToPreviousPage = (currentPage, setPage) => {
    if (currentPage > 1) {
      setPage(currentPage - 1);
    }
  };

  const goToNextPage = (currentPage, totalPages, setPage) => {
    if (currentPage < totalPages) {
      setPage(currentPage + 1);
    }
  };

  const goToLastPage = (totalPages, setPage) => {
    setPage(totalPages);
  };

  // Format date for display
  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  // Reset all filters
  const resetFilters = () => {
    if (activeTab === "orders") {
      setFilters({
        id: "",
        type: "",
        status: "",
        dateRange: "all",
      });
      setCurrentOrderPage(1);
    } else if (activeTab === "ledger") {
      setLedgerFilters({
        entryId: "",
        entryType: "",
        entryNature: "",
        referenceNumber: "",
        transactionType: "",
        asset: "",
        orderType: "",
        orderStatus: "",
        symbol: "",
        positionId: "",
        positionStatus: "",
        searchTerm: "",
        minAmount: "",
        maxAmount: "",
        dateRange: "all",
      });
      setCurrentLedgerPage(1);
      setDateRange({
        startDate: "",
        endDate: "",
      });
    }
  };

  // Get entry type badge style
  const getEntryTypeBadgeStyle = (entryType) => {
    switch (entryType) {
      case "TRANSACTION":
        return "bg-blue-100 text-blue-800";
      case "ORDER":
        return "bg-green-100 text-green-800";
      case "LP_POSITION":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get entry nature badge style
  const getEntryNatureBadgeStyle = (entryNature) => {
    switch (entryNature) {
      case "CREDIT":
        return "bg-green-100 text-green-800";
      case "DEBIT":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  const ExpandableRow = ({ entry, index }) => {
    const [expanded, setExpanded] = useState(false);

    // Function to toggle expanded state
    const toggleExpanded = () => {
      setExpanded(!expanded);
    };

    // Get entry type badge style
    const getEntryTypeBadgeStyle = (entryType) => {
      switch (entryType) {
        case "TRANSACTION":
          return "bg-blue-100 text-blue-800";
        case "ORDER":
          return "bg-green-100 text-green-800";
        case "LP_POSITION":
          return "bg-purple-100 text-purple-800";
        default:
          return "bg-gray-100 text-gray-800";
      }
    };

    // Get entry nature badge style
    const getEntryNatureBadgeStyle = (entryNature) => {
      switch (entryNature) {
        case "CREDIT":
          return "bg-green-100 text-green-800";
        case "DEBIT":
          return "bg-red-100 text-red-800";
        default:
          return "bg-gray-100 text-gray-800";
      }
    };

    // Function to format amount based on asset type
    const formatAmount = (amount, asset) => {
      if (asset === "GOLD") {
        return `${amount ? amount.toFixed(2) : "0.00"} Oz`;
      } else {
        return `AED ${amount ? amount.toFixed(2) : "0.00"}`;
      }
    };

    // Check if this entry has GOLD as an asset (for transactions)
    const isGoldAsset =
      entry.entryType === "TRANSACTION" &&
      entry.transactionDetails &&
      entry.transactionDetails.asset === "GOLD";

    return (
      <React.Fragment>
        <tr className={`hover:bg-gray-50 ${expanded ? "bg-gray-50" : ""}`}>
          <td className="px-3 py-4 text-center">
            <button
              onClick={toggleExpanded}
              className="text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              {expanded ? (
                <ChevronDown size={18} />
              ) : (
                <ChevronRight size={18} />
              )}
            </button>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
            {entry.entryId || "N/A"}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            {entry.user?.ACCOUNT_HEAD || "N/A"}
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <span
              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getEntryTypeBadgeStyle(
                entry.entryType
              )}`}
            >
              {entry.entryType}
            </span>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <span
              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getEntryNatureBadgeStyle(
                entry.entryNature
              )}`}
            >
              {entry.entryNature}
            </span>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            {entry.referenceNumber || "N/A"}
          </td>

          <td className="px-6 py-4 whitespace-nowrap text-sm">
            <div className="flex items-center">
              <span
                className={
                  entry.entryNature === "CREDIT"
                    ? "text-green-600"
                    : "text-red-600"
                }
              >
                {formatAmount(entry.amount, isGoldAsset ? "GOLD" : null)}
              </span>
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            <div className="flex items-center">
              <Clock size={14} className="mr-1" />
              {entry.date ? formatDate(entry.date) : "N/A"}
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            <button
              className="text-blue-600 hover:text-blue-900 flex items-center"
              onClick={toggleExpanded} // Add click handler here
            >
              <Settings size={16} />
              <span className="ml-1 text-xs">{expanded ? "Hide" : "View"}</span>
            </button>
          </td>
        </tr>
        {expanded && (
          <tr>
            <td
              colSpan="10"
              className="px-8 py-4 bg-gray-50 border-t border-b border-gray-200"
            >
              <div className="rounded-md bg-white p-4 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <h4 className="text-sm font-semibold text-gray-700">
                      Details
                    </h4>
                    <div className="ml-2 px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                      {entry.description}
                    </div>
                  </div>
                  <button
                    onClick={toggleExpanded}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-3">
                  <div className="text-sm">
                    <div className="text-gray-500 text-xs">Entry ID</div>
                    <div className="font-medium">{entry.entryId || "N/A"}</div>
                  </div>
                  <div className="text-sm">
                    <div className="text-gray-500 text-xs">
                      Reference Number
                    </div>
                    <div className="font-medium">
                      {entry.referenceNumber || "N/A"}
                    </div>
                  </div>
                  <div className="text-sm">
                    <div className="text-gray-500 text-xs">Running Balance</div>
                    <div className="font-medium">
                      {formatAmount(
                        entry.runningBalance,
                        isGoldAsset ? "GOLD" : null
                      )}
                    </div>
                  </div>
                </div>

                {/* Type-specific details */}
                {entry.entryType === "TRANSACTION" &&
                  entry.transactionDetails && (
                    <div className="bg-blue-50 rounded-md p-3 mb-3">
                      <div className="flex items-center mb-2">
                        <DollarSign size={14} className="text-blue-600 mr-1" />
                        <h5 className="text-sm font-semibold text-blue-700">
                          Transaction Details
                        </h5>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="text-sm">
                          <div className="text-blue-600 text-xs">Type</div>
                          <div className="font-medium">
                            {entry.transactionDetails.type || "N/A"}
                          </div>
                        </div>
                        <div className="text-sm">
                          <div className="text-blue-600 text-xs">Asset</div>
                          <div className="font-medium">
                            {entry.transactionDetails.asset || "N/A"}
                          </div>
                        </div>
                        <div className="text-sm">
                          <div className="text-blue-600 text-xs">
                            Previous Balance
                          </div>
                          <div className="font-medium">
                            {formatAmount(
                              entry.transactionDetails.previousBalance,
                              entry.transactionDetails.asset
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                {entry.entryType === "ORDER" && entry.orderDetails && (
                  <div className="bg-green-50 rounded-md p-3 mb-3">
                    <div className="flex items-center mb-2">
                      <Package size={14} className="text-green-600 mr-1" />
                      <h5 className="text-sm font-semibold text-green-700">
                        Order Details
                      </h5>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-sm">
                        <div className="text-green-600 text-xs">Type</div>
                        <div className="font-medium">
                          {entry.orderDetails.type || "N/A"}
                        </div>
                      </div>
                      <div className="text-sm">
                        <div className="text-green-600 text-xs">Symbol</div>
                        <div className="font-medium">
                          {entry.orderDetails.symbol || "N/A"}
                        </div>
                      </div>
                      <div className="text-sm">
                        <div className="text-green-600 text-xs">Volume</div>
                        <div className="font-medium">
                          {entry.orderDetails.volume || "N/A"}
                        </div>
                      </div>
                      <div className="text-sm">
                        <div className="text-green-600 text-xs">
                          Entry Price
                        </div>
                        <div className="font-medium">
                          ${entry.orderDetails.entryPrice?.toFixed(2) || "N/A"}
                        </div>
                      </div>
                      <div className="text-sm">
                        <div className="text-green-600 text-xs">
                          Closing Price
                        </div>
                        <div className="font-medium">
                          $
                          {entry.orderDetails.closingPrice?.toFixed(2) || "N/A"}
                        </div>
                      </div>
                      <div className="text-sm">
                        <div className="text-green-600 text-xs">
                          Profit/Loss
                        </div>
                        <div
                          className={`font-medium ${
                            entry.orderDetails.profit > 0
                              ? "text-green-600"
                              : entry.orderDetails.profit < 0
                              ? "text-red-600"
                              : ""
                          }`}
                        >
                          {entry.orderDetails.profit
                            ? `$${entry.orderDetails.profit.toFixed(2)}`
                            : "N/A"}
                        </div>
                      </div>
                      <div className="text-sm">
                        <div className="text-green-600 text-xs">Status</div>
                        <div className="font-medium">
                          {entry.orderDetails.status || "N/A"}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {entry.entryType === "LP_POSITION" && entry.lpDetails && (
                  <div className="bg-purple-50 rounded-md p-3 mb-3">
                    <div className="flex items-center mb-2">
                      <Layers size={14} className="text-purple-600 mr-1" />
                      <h5 className="text-sm font-semibold text-purple-700">
                        LP Position Details
                      </h5>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-sm">
                        <div className="text-purple-600 text-xs">
                          Position ID
                        </div>
                        <div className="font-medium">
                          {entry.lpDetails.positionId || "N/A"}
                        </div>
                      </div>
                      <div className="text-sm">
                        <div className="text-purple-600 text-xs">Type</div>
                        <div className="font-medium">
                          {entry.lpDetails.type || "N/A"}
                        </div>
                      </div>
                      <div className="text-sm">
                        <div className="text-purple-600 text-xs">Symbol</div>
                        <div className="font-medium">
                          {entry.lpDetails.symbol || "N/A"}
                        </div>
                      </div>
                      <div className="text-sm">
                        <div className="text-purple-600 text-xs">Volume</div>
                        <div className="font-medium">
                          {entry.lpDetails.volume || "N/A"}
                        </div>
                      </div>
                      <div className="text-sm">
                        <div className="text-purple-600 text-xs">
                          Entry Price
                        </div>
                        <div className="font-medium">
                          ${entry.lpDetails.entryPrice?.toFixed(2) || "N/A"}
                        </div>
                      </div>
                      <div className="text-sm">
                        <div className="text-purple-600 text-xs">
                          Closing Price
                        </div>
                        <div className="font-medium">
                          ${entry.lpDetails.closingPrice?.toFixed(2) || "N/A"}
                        </div>
                      </div>
                      <div className="text-sm">
                        <div className="text-purple-600 text-xs">
                          Profit/Loss
                        </div>
                        <div
                          className={`font-medium ${
                            entry.lpDetails.profit > 0
                              ? "text-green-600"
                              : entry.lpDetails.profit < 0
                              ? "text-red-600"
                              : ""
                          }`}
                        >
                          {entry.lpDetails.profit
                            ? `$${entry.lpDetails.profit.toFixed(2)}`
                            : "N/A"}
                        </div>
                      </div>
                      <div className="text-sm">
                        <div className="text-purple-600 text-xs">Status</div>
                        <div className="font-medium">
                          {entry.lpDetails.status || "N/A"}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {entry.notes && (
                  <div className="text-sm mt-2">
                    <div className="flex items-center">
                      <Info size={14} className="text-gray-400 mr-1" />
                      <span className="text-gray-500 text-xs">Notes</span>
                    </div>
                    <div className="text-gray-700 mt-1 bg-gray-50 p-2 rounded">
                      {entry.notes}
                    </div>
                  </div>
                )}
              </div>
            </td>
          </tr>
        )}
      </React.Fragment>
    );
  };
  // Pagination component
  const Pagination = ({
    currentPage,
    totalPages,
    paginate,
    itemsPerPage,
    setItemsPerPage,
    totalItems,
    firstItemIndex,
    lastItemIndex,
  }) => {
    return (
      <div className="flex items-center justify-between bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
        <div className="flex items-center text-sm text-gray-700">
          <span>
            Showing {totalItems > 0 ? firstItemIndex + 1 : 0} to{" "}
            {Math.min(lastItemIndex, totalItems)} of {totalItems} results
          </span>
          <div className="ml-4">
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                paginate(
                  1,
                  activeTab === "orders"
                    ? setCurrentOrderPage
                    : setCurrentLedgerPage
                );
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
              onClick={() =>
                goToFirstPage(
                  activeTab === "orders"
                    ? setCurrentOrderPage
                    : setCurrentLedgerPage
                )
              }
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              disabled={currentPage === 1}
            >
              <span className="sr-only">First Page</span>
              <ChevronsLeft size={18} />
            </button>
            <button
              onClick={() =>
                goToPreviousPage(
                  currentPage,
                  activeTab === "orders"
                    ? setCurrentOrderPage
                    : setCurrentLedgerPage
                )
              }
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
                    onClick={() =>
                      paginate(
                        number + 1,
                        activeTab === "orders"
                          ? setCurrentOrderPage
                          : setCurrentLedgerPage
                      )
                    }
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
              onClick={() =>
                goToNextPage(
                  currentPage,
                  totalPages,
                  activeTab === "orders"
                    ? setCurrentOrderPage
                    : setCurrentLedgerPage
                )
              }
              className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              disabled={currentPage === totalPages}
            >
              <span className="sr-only">Next</span>
              <ChevronRight size={18} />
            </button>
            <button
              onClick={() =>
                goToLastPage(
                  totalPages,
                  activeTab === "orders"
                    ? setCurrentOrderPage
                    : setCurrentLedgerPage
                )
              }
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
    <div className="p-6 h-screen w-full bg-gray-50">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Statements</h1>
        <p className="text-gray-600">
          View and filter your transaction history
        </p>
      </div>

      {/* User Selection and Tab Navigation */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-4">
        <div className="bg-gradient-to-r from-blue-700 to-blue-500 text-white p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="mb-4 md:mb-0">
              <h2 className="font-bold text-lg">Account Statements</h2>
              <p className="text-xs opacity-80">
                Select a user to view their statement history
              </p>
            </div>
            <div className="w-full md:w-1/3">
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full rounded-md border border-blue-300 p-2 bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-inner"
              >
                <option value="All">All Users</option>
                {users && users.length > 0 ? (
                  users.map((user, index) => (
                    <option key={index} value={user.ACCOUNT_HEAD}>
                      {user.ACCOUNT_HEAD}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>
                    No users available
                  </option>
                )}
              </select>
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
              onClick={() => setActiveTab("ledger")}
              className={`px-4 py-3 text-sm font-medium ${
                activeTab === "ledger"
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } transition-colors`}
            >
              <div className="flex items-center">
                <Book size={16} className="mr-2" />
                Ledger Entries
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
                  name={activeTab === "orders" ? "id" : "searchTerm"}
                  value={
                    activeTab === "orders"
                      ? filters.id
                      : ledgerFilters.searchTerm
                  }
                  onChange={
                    activeTab === "orders"
                      ? handleFilterChange
                      : handleLedgerFilterChange
                  }
                  placeholder={`Search ${
                    activeTab === "orders" ? "order ID" : "ledger entries"
                  }...`}
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
              {((activeTab === "orders" &&
                (filters.type ||
                  filters.status ||
                  filters.dateRange !== "all")) ||
                (activeTab === "ledger" &&
                  (Object.values(ledgerFilters).some(
                    (val) => val && val !== "all"
                  ) ||
                    dateRange.startDate ||
                    dateRange.endDate))) && (
                <button
                  onClick={resetFilters}
                  className="ml-2 flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 bg-white rounded-md border border-gray-300 px-3 py-2"
                >
                  <RefreshCw size={16} className="mr-1" /> Reset
                </button>
              )}

              {activeTab === "ledger" && (
                <button
                  onClick={fetchLedgerEntries}
                  className="ml-2 flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 bg-white rounded-md border border-blue-300 px-3 py-2"
                >
                  <RefreshCw size={16} className="mr-1" /> Refresh
                </button>
              )}
            </div>
          </div>

          {/* Advanced filters */}
          {showFilters && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
              {activeTab === "orders" ? (
                // Order filters
                <>
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
                      name="orderStatus"
                      value={filters.orderStatus}
                      onChange={handleFilterChange}
                      className="rounded-md border border-gray-300 py-2 px-3 w-full text-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">All Statuses</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="PENDING">Pending</option>
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
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Custom Range
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={dateRange.startDate}
                        onChange={(e) =>
                          setDateRange({
                            ...dateRange,
                            startDate: e.target.value,
                          })
                        }
                        className="rounded-md border border-gray-300 py-2 px-3 w-full text-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                      <span className="text-gray-500">to</span>
                      <input
                        type="date"
                        value={dateRange.endDate}
                        onChange={(e) =>
                          setDateRange({
                            ...dateRange,
                            endDate: e.target.value,
                          })
                        }
                        className="rounded-md border border-gray-300 py-2 px-3 w-full text-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </>
              ) : (
                // Ledger filters
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Entry Type
                    </label>
                    <select
                      name="entryType"
                      value={ledgerFilters.entryType}
                      onChange={handleLedgerFilterChange}
                      className="rounded-md border border-gray-300 py-2 px-3 w-full text-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">All Types</option>
                      <option value="TRANSACTION">Transaction</option>
                      <option value="ORDER">Order</option>
                      <option value="LP_POSITION">LP Position</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Entry Nature
                    </label>
                    <select
                      name="entryNature"
                      value={ledgerFilters.entryNature}
                      onChange={handleLedgerFilterChange}
                      className="rounded-md border border-gray-300 py-2 px-3 w-full text-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">All</option>
                      <option value="CREDIT">Credit</option>
                      <option value="DEBIT">Debit</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Asset
                    </label>
                    <select
                      name="asset"
                      value={ledgerFilters.asset}
                      onChange={handleLedgerFilterChange}
                      className="rounded-md border border-gray-300 py-2 px-3 w-full text-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">All Assets</option>
                      <option value="CASH">Cash</option>
                      <option value="GOLD">Gold</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Symbol
                    </label>
                    <input
                      type="text"
                      name="symbol"
                      value={ledgerFilters.symbol}
                      onChange={handleLedgerFilterChange}
                      placeholder="Enter symbol"
                      className="rounded-md border border-gray-300 py-2 px-3 w-full text-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Reference Number
                    </label>
                    <input
                      type="text"
                      name="referenceNumber"
                      value={ledgerFilters.referenceNumber}
                      onChange={handleLedgerFilterChange}
                      placeholder="Enter reference number"
                      className="rounded-md border border-gray-300 py-2 px-3 w-full text-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Order/Position ID
                    </label>
                    <input
                      type="text"
                      name="positionId"
                      value={ledgerFilters.positionId}
                      onChange={handleLedgerFilterChange}
                      placeholder="Order or position ID"
                      className="rounded-md border border-gray-300 py-2 px-3 w-full text-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Order Status
                    </label>
                    <select
                      name="orderStatus"
                      value={ledgerFilters.orderStatus}
                      onChange={handleLedgerFilterChange}
                      className="rounded-md border border-gray-300 py-2 px-3 w-full text-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">All</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="PENDING">Pending</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Date Range
                    </label>
                    <select
                      name="dateRange"
                      value={ledgerFilters.dateRange}
                      onChange={handleLedgerFilterChange}
                      className="rounded-md border border-gray-300 py-2 px-3 w-full text-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">All Time</option>
                      <option value="today">Today</option>
                      <option value="yesterday">Yesterday</option>
                      <option value="week">Last 7 Days</option>
                      <option value="month">Last 30 Days</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Custom Range
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={dateRange.startDate}
                        onChange={(e) =>
                          setDateRange({
                            ...dateRange,
                            startDate: e.target.value,
                          })
                        }
                        className="rounded-md border border-gray-300 py-2 px-3 w-full text-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                      <span className="text-gray-500">to</span>
                      <input
                        type="date"
                        value={dateRange.endDate}
                        onChange={(e) =>
                          setDateRange({
                            ...dateRange,
                            endDate: e.target.value,
                          })
                        }
                        className="rounded-md border border-gray-300 py-2 px-3 w-full text-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Amount Range
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        name="minAmount"
                        value={ledgerFilters.minAmount}
                        onChange={handleLedgerFilterChange}
                        placeholder="Min"
                        className="rounded-md border border-gray-300 py-2 px-3 w-full text-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                      <span className="text-gray-500">to</span>
                      <input
                        type="number"
                        name="maxAmount"
                        value={ledgerFilters.maxAmount}
                        onChange={handleLedgerFilterChange}
                        placeholder="Max"
                        className="rounded-md border border-gray-300 py-2 px-3 w-full text-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex justify-center items-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}

        {/* Orders tab content */}
        {!loading && activeTab === "orders" && (
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex justify-center items-center p-8">
                <RefreshCw size={24} className="animate-spin text-blue-500" />
              </div>
            ) : currentOrders.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Order ID
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Symbol
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Type
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Size
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
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Assigned user
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Profit/Loss
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Open Time
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Close Time
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStatements.map((statement) => (
                    <tr key={statement._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {statement.orderNo}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {statement.symbol}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
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
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {statement.volume} TTBAR
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {statement.openingPrice}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {statement.closingPrice
                          ? `${statement.closingPrice}`
                          : "-"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {statement.user.ACCOUNT_HEAD}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <span
                          className={`font-medium ${
                            statement.profit > 0
                              ? "text-green-600"
                              : statement.profit < 0
                              ? "text-red-600"
                              : "text-gray-500"
                          }`}
                        >
                          {statement.profit ? "AED" : "-"}{" "}
                          {statement.profit ? statement.profit.toFixed(2) : "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(statement.time)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {statement.closingDate
                          ? formatDate(statement.closingDate)
                          : "-"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            statement.orderStatus === "OPEN"
                              ? "bg-blue-100 text-blue-800"
                              : statement.orderStatus === "CLOSED"
                              ? "bg-gray-100 text-gray-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {statement.orderStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center p-8 text-gray-500">
                <div className="inline-flex rounded-full bg-gray-100 p-4 mb-4">
                  <AlertCircle size={24} className="text-gray-400" />
                </div>
                <p className="text-lg font-semibold">No orders found</p>
                <p className="mt-1">
                  Try adjusting your filters or search criteria
                </p>
              </div>
            )}

            {/* Pagination for Orders */}
            {filteredStatements.length > 0 && (
              <Pagination
                currentPage={currentOrderPage}
                totalPages={totalOrderPages}
                paginate={(page) => paginate(page, setCurrentOrderPage)}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={setItemsPerPage}
                totalItems={filteredStatements.length}
              />
            )}
          </div>
        )}
        {/* Ledger tab content */}
        {!loading && activeTab === "ledger" && (
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
        )}
      </div>
    </div>
  );
}
