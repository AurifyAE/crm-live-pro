import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  ArrowDownUp,
  RefreshCw,
  Search,
  Filter,
  AlertCircle,
  Plus,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Settings,
  AlertTriangle,
  DollarSign,
  CreditCard,
} from "lucide-react";
import axiosInstance from "../api/axios";

export default function Statements() {
  const adminId = localStorage.getItem("adminId");
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("All");
  const [activeTab, setActiveTab] = useState("transactions");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [dateRange, setDateRange] = useState({ startDate: "", endDate: "" });
  const [filters, setFilters] = useState({
    id: "",
    type: "",
    status: "",
    dateRange: "all",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [currentTransactionPage, setCurrentTransactionPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalTransactionPages, setTotalTransactionPages] = useState(1);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [transactionForm, setTransactionForm] = useState({
    type: "DEPOSIT",
    asset: "CASH",
    amount: "",
    reference: "",
    userId: "",
  });
  const [balanceError, setBalanceError] = useState("");
  const [userBalances, setUserBalances] = useState({});

  // Fetch users on mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get(`/fetch-data/${adminId}`);
        if (response.data?.data) {
          setUsers(response.data.data);
          const balances = response.data.data.reduce(
            (acc, user) => ({
              ...acc,
              [user._id]: {
                cash: parseFloat(user.AMOUNTFC) || 0,
                gold: parseFloat(user.METAL_WT) || 0,
                name: user.ACCOUNT_HEAD,
              },
            }),
            {}
          );
          setUserBalances(balances);
        }
      } catch (error) {
        setError("Failed to fetch users");
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [adminId]);

  // Fetch transactions when filters or page changes
  useEffect(() => {
    if (activeTab === "transactions") {
      fetchTransactionStatements();
    }
  }, [
    selectedUser,
    activeTab,
    currentTransactionPage,
    itemsPerPage,
    filters,
    dateRange,
  ]);

  // Fetch transaction statements
  const fetchTransactionStatements = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: currentTransactionPage,
        limit: itemsPerPage,
        adminId,
      });

      if (selectedUser !== "All") queryParams.append("userId", selectedUser);
      if (filters.type) queryParams.append("type", filters.type);
      if (filters.status) queryParams.append("status", filters.status);

      if (filters.dateRange !== "all") {
        const today = new Date();
        let startDate;
        if (filters.dateRange === "today") {
          startDate = new Date(today.setHours(0, 0, 0, 0));
        } else if (filters.dateRange === "yesterday") {
          startDate = new Date(today);
          startDate.setDate(startDate.getDate() - 1);
          startDate.setHours(0, 0, 0, 0);
        } else if (filters.dateRange === "week") {
          startDate = new Date(today);
          startDate.setDate(startDate.getDate() - 7);
        } else if (filters.dateRange === "month") {
          startDate = new Date(today);
          startDate.setMonth(startDate.getMonth() - 1);
        }
        queryParams.append("startDate", startDate.toISOString());
        queryParams.append("endDate", today.toISOString());
      } else if (dateRange.startDate && dateRange.endDate) {
        queryParams.append("startDate", dateRange.startDate);
        queryParams.append("endDate", dateRange.endDate);
      }

      const response = await axiosInstance.get(
        `/fetch-transaction?${queryParams}`
      );
      if (response.data?.data?.transactions) {
        setTransactions(response.data.data.transactions);
        setTotalTransactions(response.data.data.pagination.total || 0);
        setTotalTransactionPages(response.data.data.pagination.pages || 1);
      } else {
        setTransactions([]);
        setTotalTransactions(0);
        setTotalTransactionPages(1);
      }
    } catch (error) {
      setError("Failed to fetch transactions");
      console.error("Error fetching transactions:", error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle filter changes
  const handleFilterChange = useCallback((e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentTransactionPage(1);
  }, []);

  // Handle transaction form changes
  const handleTransactionFormChange = useCallback((e) => {
    const { name, value } = e.target;
    setTransactionForm((prev) => ({ ...prev, [name]: value }));
    if (["amount", "userId", "asset", "type"].includes(name)) {
      setBalanceError("");
    }
  }, []);

  // Validate withdrawal
  const validateWithdrawal = useCallback(
    (userId, asset, amount) => {
      if (transactionForm.type !== "WITHDRAWAL") return true;
      const numericAmount = parseFloat(amount);
      if (userId && userBalances[userId]) {
        const balance =
          asset === "CASH"
            ? userBalances[userId].cash
            : userBalances[userId].gold;
        if (numericAmount > balance) {
          setBalanceError(
            `Insufficient ${asset.toLowerCase()} balance. Available: ${
              asset === "CASH"
                ? "$" + balance.toFixed(2)
                : balance.toFixed(2) + " oz"
            }`
          );
          return false;
        }
      }
      return true;
    },
    [userBalances, transactionForm.type]
  );

  // Submit transaction
  const handleTransactionSubmit = async (e) => {
    e.preventDefault();
    const { userId, asset, amount, type, reference } = transactionForm;

    if (type === "WITHDRAWAL" && !validateWithdrawal(userId, asset, amount)) {
      return;
    }

    try {
      setLoading(true);
      const transactionData = {
        userId,
        type,
        asset,
        amount: parseFloat(amount),
        reference:
          reference ||
          `REF-${type === "DEPOSIT" ? "D" : "W"}${Math.floor(
            10000 + Math.random() * 90000
          )}`,
      };

      await axiosInstance.post(
        `/create-transaction/${adminId}`,
        transactionData
      );

      // Update local balances
      setUserBalances((prev) => ({
        ...prev,
        [userId]: {
          ...prev[userId],
          [asset.toLowerCase()]:
            type === "DEPOSIT"
              ? prev[userId][asset.toLowerCase()] + parseFloat(amount)
              : prev[userId][asset.toLowerCase()] - parseFloat(amount),
        },
      }));

      // Reset form and close modal
      setTransactionForm({
        type: "DEPOSIT",
        asset: "CASH",
        amount: "",
        reference: "",
        userId: "",
      });
      setShowTransactionModal(false);
      setBalanceError("");
      setActiveTab("transactions");
      setCurrentTransactionPage(1);
      await fetchTransactionStatements();
    } catch (error) {
      setError("Failed to create transaction");
      console.error("Error creating transaction:", error);
    } finally {
      setLoading(false);
    }
  };

  // Apply filters to transactions
  const filteredTransactions = transactions.filter((transaction) => {
    if (
      filters.id &&
      !transaction.transactionId
        .toLowerCase()
        .includes(filters.id.toLowerCase())
    ) {
      return false;
    }
    if (filters.type && transaction.type !== filters.type) {
      return false;
    }
    if (filters.status && transaction.status !== filters.status) {
      return false;
    }
    return true;
  });

  // Pagination calculations
  const indexOfLastTransaction = currentTransactionPage * itemsPerPage;
  const indexOfFirstTransaction = indexOfLastTransaction - itemsPerPage;
  const currentTransactions = filteredTransactions.slice(
    indexOfFirstTransaction,
    indexOfLastTransaction
  );

  // Pagination handlers
  const paginate = (pageNumber) => setCurrentTransactionPage(pageNumber);
  const goToFirstPage = () => setCurrentTransactionPage(1);
  const goToPreviousPage = () => {
    if (currentTransactionPage > 1)
      setCurrentTransactionPage(currentTransactionPage - 1);
  };
  const goToNextPage = () => {
    if (currentTransactionPage < totalTransactionPages) {
      setCurrentTransactionPage(currentTransactionPage + 1);
    }
  };
  const goToLastPage = () => setCurrentTransactionPage(totalTransactionPages);

  // Utility functions
  const formatDate = (timestamp) => new Date(timestamp).toLocaleString();
  const getUserBalanceDisplay = (userId, assetType) => {
    // Return not available if userId is invalid or user doesn't exist
    if (!userId || !userBalances[userId]) return "Not available";

    // Return user name if assetType is "user"
    if (assetType === "user") {
      return `${userBalances[userId].name}`;
    }

    // Return cash balance with $ sign if assetType is "CASH"
    if (assetType === "CASH") {
      return `$${userBalances[userId].cash.toFixed(2)}`;
    }

    // Return gold balance with oz unit if assetType is "GOLD"
    if (assetType === "GOLD") {
      return `${userBalances[userId].gold.toFixed(2)} oz`;
    }

    // Default case if assetType is not recognized
    return "Invalid asset type";
  };

  const resetFilters = () => {
    setFilters({ id: "", type: "", status: "", dateRange: "all" });
    setDateRange({ startDate: "", endDate: "" });
    setCurrentTransactionPage(1);
  };

  // Pagination Component
  const Pagination = ({ currentPage, totalPages, totalItems }) => (
    <div className="flex items-center justify-between bg-white px-4 py-3 border-t border-gray-200">
      <div className="flex items-center text-sm text-gray-700">
        <span>
          Showing {totalItems > 0 ? indexOfFirstTransaction + 1 : 0} to{" "}
          {Math.min(indexOfLastTransaction, totalItems)} of {totalItems} results
        </span>
        <select
          value={itemsPerPage}
          onChange={(e) => {
            setItemsPerPage(Number(e.target.value));
            setCurrentTransactionPage(1);
          }}
          className="ml-4 border border-gray-300 rounded px-2 py-1 text-sm"
        >
          <option value={5}>5 per page</option>
          <option value={10}>10 per page</option>
          <option value={20}>20 per page</option>
          <option value={50}>50 per page</option>
        </select>
      </div>
      <nav className="flex rounded-md shadow-sm">
        <button
          onClick={goToFirstPage}
          className="px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm text-gray-500 hover:bg-gray-50 disabled:opacity-50"
          disabled={currentPage === 1}
        >
          <ChevronsLeft size={18} />
        </button>
        <button
          onClick={goToPreviousPage}
          className="px-2 py-2 border border-gray-300 bg-white text-sm text-gray-500 hover:bg-gray-50 disabled:opacity-50"
          disabled={currentPage === 1}
        >
          <ChevronLeft size={18} />
        </button>
        {[...Array(totalPages).keys()].map((number) => {
          if (
            number + 1 === 1 ||
            number + 1 === totalPages ||
            (number + 1 >= currentPage - 1 && number + 1 <= currentPage + 1)
          ) {
            return (
              <button
                key={number + 1}
                onClick={() => paginate(number + 1)}
                className={`px-4 py-2 border text-sm ${
                  currentPage === number + 1
                    ? "bg-blue-50 border-blue-500 text-blue-600"
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
                className="px-4 py-2 border border-gray-300 bg-white text-sm text-gray-700"
              >
                ...
              </span>
            );
          }
          return null;
        })}
        <button
          onClick={goToNextPage}
          className="px-2 py-2 border border-gray-300 bg-white text-sm text-gray-500 hover:bg-gray-50 disabled:opacity-50"
          disabled={currentPage === totalPages}
        >
          <ChevronRight size={18} />
        </button>
        <button
          onClick={goToLastPage}
          className="px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm text-gray-500 hover:bg-gray-50 disabled:opacity-50"
          disabled={currentPage === totalPages}
        >
          <ChevronsRight size={18} />
        </button>
      </nav>
    </div>
  );

  // Transaction Modal Component
  const TransactionModal = () => {
    const amountInputRef = useRef(null);

    useEffect(() => {
      if (showTransactionModal && amountInputRef.current) {
        amountInputRef.current.focus();
      }
    }, [showTransactionModal]);

    const currentBalance =
      transactionForm.userId && transactionForm.asset
        ? getUserBalanceDisplay(transactionForm.userId, transactionForm.asset)
        : "Select a user";

    if (!showTransactionModal) return null;

    return (
      <div className="fixed inset-0 flex items-center justify-center z-50 bg-white/50 bg-opacity-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
          <div className="bg-gradient-to-r from-blue-700 to-blue-500 text-white p-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg">
                {transactionForm.type === "DEPOSIT" ? "Deposit" : "Withdrawal"}{" "}
                {transactionForm.asset}
              </h3>
              <button
                onClick={() => setShowTransactionModal(false)}
                className="hover:bg-blue-600 rounded-full p-1"
              >
                <XCircle size={20} />
              </button>
            </div>
          </div>
          <form onSubmit={handleTransactionSubmit} className="p-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select User
              </label>
              <select
                name="userId"
                value={transactionForm.userId}
                onChange={handleTransactionFormChange}
                className="w-full rounded-md border border-gray-300 p-2 text-gray-700 focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select a user</option>
                {users.map((user) => (
                  <option key={user.ACCOUNT_HEAD} value={user._id}>
                    {user.ACCOUNT_HEAD}
                  </option>
                ))}
              </select>
            </div>
            {transactionForm.userId && (
              <div className="mb-4 p-3 bg-gray-50 rounded-md border border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    Current {transactionForm.asset.toLowerCase()} balance:
                  </span>
                  <span className="font-medium text-gray-900">
                    {currentBalance}
                  </span>
                </div>
              </div>
            )}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transaction Type
              </label>
              <div className="flex w-full rounded-md overflow-hidden">
                <button
                  type="button"
                  onClick={() =>
                    setTransactionForm((prev) => ({ ...prev, type: "DEPOSIT" }))
                  }
                  className={`flex-1 py-2 px-4 text-center ${
                    transactionForm.type === "DEPOSIT"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  Deposit
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setTransactionForm((prev) => ({
                      ...prev,
                      type: "WITHDRAWAL",
                    }))
                  }
                  className={`flex-1 py-2 px-4 text-center ${
                    transactionForm.type === "WITHDRAWAL"
                      ? "bg-rose-600 text-white"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  Withdrawal
                </button>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Asset Type
              </label>
              <div className="flex w-full rounded-md overflow-hidden">
                <button
                  type="button"
                  onClick={() =>
                    setTransactionForm((prev) => ({ ...prev, asset: "CASH" }))
                  }
                  className={`flex-1 py-2 px-4 text-center ${
                    transactionForm.asset === "CASH"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  Cash
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setTransactionForm((prev) => ({ ...prev, asset: "GOLD" }))
                  }
                  className={`flex-1 py-2 px-4 text-center ${
                    transactionForm.asset === "GOLD"
                      ? "bg-amber-600 text-white"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  Gold
                </button>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount ({transactionForm.asset === "CASH" ? "$" : "oz"})
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  {transactionForm.asset === "CASH" ? (
                    <DollarSign size={16} className="text-gray-400" />
                  ) : (
                    <span className="text-gray-400">oz</span>
                  )}
                </div>
                <input
                  ref={amountInputRef}
                  type="number"
                  name="amount"
                  step={transactionForm.asset === "CASH" ? "0.01" : "0.001"}
                  min="0.01"
                  value={transactionForm.amount}
                  onChange={handleTransactionFormChange}
                  className={`w-full pl-10 pr-3 py-2 rounded-md border ${
                    balanceError
                      ? "border-red-300 text-red-900"
                      : "border-gray-300 text-gray-700"
                  } focus:ring-2 focus:ring-blue-500`}
                  placeholder={`Enter ${transactionForm.asset.toLowerCase()} amount`}
                  required
                />
              </div>
              {balanceError && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertTriangle size={16} className="mr-1" />
                  {balanceError}
                </p>
              )}
            </div>
            {/* <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reference (Optional)
              </label>
              <input
                type="text"
                name="reference"
                value={transactionForm.reference}
                onChange={handleTransactionFormChange}
                className="w-full px-3 py-2 rounded-md border border-gray-300 text-gray-700 focus:ring-2 focus:ring-blue-500"
                placeholder="Transaction reference"
              />
            </div> */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowTransactionModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-4 py-2 rounded-md text-white ${
                  transactionForm.type === "DEPOSIT"
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-rose-600 hover:bg-rose-700"
                } ${loading ? "opacity-75 cursor-not-allowed" : ""}`}
                disabled={loading || !!balanceError}
              >
                {loading ? (
                  <div className="flex items-center">
                    <RefreshCw size={16} className="animate-spin mr-2" />
                    Processing...
                  </div>
                ) : (
                  `Process ${transactionForm.type.toLowerCase()}`
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 bg-gray-50 w-full min-h-screen">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Fund Management</h1>
        <p className="text-gray-600">View and manage transaction history</p>
      </div>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm flex items-center">
          <AlertCircle size={16} className="mr-2" />
          {error}
        </div>
      )}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="bg-gradient-to-r from-blue-700 to-blue-500 text-white p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="mb-4 md:mb-0">
              <h2 className="font-bold text-lg">Account Statements</h2>
              <p className="text-xs opacity-80">
                Select a user to view their statement history
              </p>
            </div>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full md:w-1/3 rounded-md border border-blue-300 p-2 bg-white text-gray-700 focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Users</option>
              {users.map((user) => (
                <option key={user.ACCOUNT_HEAD} value={user._id}>
                  {user.ACCOUNT_HEAD}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => setActiveTab("transactions")}
              className={`px-4 py-3 text-sm font-medium ${
                activeTab === "transactions"
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <div className="flex items-center">
                <CreditCard size={16} className="mr-2" />
                Transactions
              </div>
            </button>
            <button
              onClick={() => setActiveTab("manage")}
              className={`px-4 py-3 text-sm font-medium ${
                activeTab === "manage"
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <div className="flex items-center">
                <Settings size={16} className="mr-2" />
                Manage Transactions
              </div>
            </button>
          </nav>
        </div>
        <div className="p-4 bg-gray-50 border-b">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="relative">
                <input
                  type="text"
                  name="id"
                  value={filters.id}
                  onChange={handleFilterChange}
                  placeholder="Search Transaction ID..."
                  className="rounded-md border border-gray-300 pl-9 pr-4 py-2 focus:ring-blue-500 sm:text-sm w-full md:w-64"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={16} className="text-gray-400" />
                </div>
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="ml-2 flex items-center text-sm text-gray-600 hover:text-gray-900 bg-white rounded-md border border-gray-300 px-3 py-2"
              >
                <Filter size={16} className="mr-1" /> Filters
              </button>
              {(filters.id ||
                filters.type ||
                filters.status ||
                filters.dateRange !== "all") && (
                <button
                  onClick={resetFilters}
                  className="ml-2 flex items-center text-sm text-gray-600 hover:text-gray-900 bg-white rounded-md border border-gray-300 px-3 py-2"
                >
                  <RefreshCw size={16} className="mr-1" /> Reset
                </button>
              )}
            </div>
          </div>
          {showFilters && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  name="type"
                  value={filters.type}
                  onChange={handleFilterChange}
                  className="rounded-md border border-gray-300 py-2 px-3 w-full text-sm focus:ring-blue-500"
                >
                  <option value="">All Types</option>
                  <option value="DEPOSIT">Deposit</option>
                  <option value="WITHDRAWAL">Withdrawal</option>
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
                  className="rounded-md border border-gray-300 py-2 px-3 w-full text-sm focus:ring-blue-500"
                >
                  <option value="">All Statuses</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="PENDING">Pending</option>
                  <option value="FAILED">Failed</option>
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
                  className="rounded-md border border-gray-300 py-2 px-3 w-full text-sm focus:ring-blue-500"
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
                      setDateRange({ ...dateRange, startDate: e.target.value })
                    }
                    className="rounded-md border border-gray-300 py-2 px-3 w-full text-sm focus:ring-blue-500"
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) =>
                      setDateRange({ ...dateRange, endDate: e.target.value })
                    }
                    className="rounded-md border border-gray-300 py-2 px-3 w-full text-sm focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
        {activeTab === "transactions" && (
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex justify-center items-center p-8">
                <RefreshCw size={24} className="animate-spin text-blue-500" />
              </div>
            ) : currentTransactions.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Transaction ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Asset
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date/Time
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Balance
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentTransactions.map((transaction) => (
                    <tr key={transaction._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {transaction.transactionId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                            transaction.type === "DEPOSIT"
                              ? "bg-green-100 text-green-800"
                              : "bg-purple-100 text-purple-800"
                          }`}
                        >
                          {transaction.type === "DEPOSIT" ? (
                            <Plus size={14} className="mr-1" />
                          ) : (
                            <ArrowDownUp size={14} className="mr-1" />
                          )}
                          {transaction.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {transaction.asset === "CASH" ? (
                          <span className="inline-flex items-center">
                            <DollarSign
                              size={16}
                              className="mr-1 text-green-500"
                            />{" "}
                            Cash
                          </span>
                        ) : (
                          <span className="inline-flex items-center">
                            <span className="text-yellow-500 mr-1">●</span> Gold
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {transaction.amount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            transaction.status === "COMPLETED"
                              ? "bg-green-100 text-green-800"
                              : transaction.status === "PENDING"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {transaction.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(transaction.date)}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {transaction.newBalance}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center p-8 text-gray-500">
                <AlertCircle size={24} className="mx-auto text-gray-400 mb-4" />
                <p className="text-lg font-semibold">No transactions found</p>
                <p className="mt-1">
                  Try adjusting your filters or search criteria
                </p>
              </div>
            )}
            {filteredTransactions.length > 0 && (
              <Pagination
                currentPage={currentTransactionPage}
                totalPages={totalTransactionPages}
                totalItems={totalTransactions}
              />
            )}
          </div>
        )}
        {activeTab === "manage" && (
          <div className="mt-2">
            <div className="bg-gradient-to-r from-blue-700 to-blue-500 text-white p-4">
              <h2 className="font-bold">Manage Transactions</h2>
              <p className="text-xs opacity-80">
                Create new cash or gold transactions for users
              </p>
            </div>
            <div className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select User Account
                </label>
                <select
                  value={transactionForm.userId}
                  onChange={(e) => {
                    setTransactionForm((prev) => ({
                      ...prev,
                      userId: e.target.value,
                    }));
                    setBalanceError("");
                  }}
                  className="rounded-md border border-gray-300 py-2 px-3 text-sm focus:ring-blue-500 w-full"
                >
                  <option value="">-- Select User --</option>
                  {users.map((user) => (
                    <option key={user.ACCOUNT_HEAD} value={user._id}>
                      {user.ACCOUNT_HEAD}
                    </option>
                  ))}
                </select>
              </div>
              {transactionForm.userId && (
                <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-500">
                        Cash Balance
                      </span>
                      <DollarSign size={16} className="text-green-600" />
                    </div>
                    <div className="text-2xl font-bold text-gray-800">
                      {getUserBalanceDisplay(transactionForm.userId, "CASH")}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Last updated: {new Date().toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-500">
                        Gold Balance
                      </span>
                      <span className="text-yellow-500 text-lg">●</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-800">
                      {getUserBalanceDisplay(transactionForm.userId, "GOLD")}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Last updated: {new Date().toLocaleString()}
                    </div>
                  </div>
                </div>
              )}
              {transactionForm.userId ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg border border-blue-100 p-6">
                    <div className="flex items-center mb-4">
                      <DollarSign size={24} className="text-green-500 mr-2" />
                      <h3 className="font-bold text-lg text-gray-800">
                        Cash Management
                      </h3>
                    </div>
                    <p className="text-gray-600 mb-4">
                      Process cash transactions for {getUserBalanceDisplay(transactionForm.userId, "user")}.
                    </p>
                    {balanceError && transactionForm.asset === "CASH" && (
                      <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm flex items-center">
                        <AlertCircle size={16} className="mr-2" />
                        {balanceError}
                      </div>
                    )}
                    <div className="flex space-x-3">
                      <button
                        onClick={() => {
                          setTransactionForm((prev) => ({
                            ...prev,
                            type: "DEPOSIT",
                            asset: "CASH",
                            amount: "",
                            reference: "",
                          }));
                          setShowTransactionModal(true);
                        }}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded flex items-center justify-center"
                      >
                        <Plus size={16} className="mr-1" /> Deposit Cash
                      </button>
                      <button
                        onClick={() => {
                          setTransactionForm((prev) => ({
                            ...prev,
                            type: "WITHDRAWAL",
                            asset: "CASH",
                            amount: "",
                            reference: "",
                          }));
                          if (userBalances[transactionForm.userId]?.cash <= 0) {
                            setBalanceError(
                              `Insufficient cash balance. Available: $${userBalances[
                                transactionForm.userId
                              ].cash.toFixed(2)}`
                            );
                          } else {
                            setBalanceError("");
                            setShowTransactionModal(true);
                          }
                        }}
                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded flex items-center justify-center disabled:opacity-50"
                        disabled={
                          userBalances[transactionForm.userId]?.cash <= 0
                        }
                      >
                        <ArrowDownUp size={16} className="mr-1" /> Withdraw Cash
                      </button>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg border border-yellow-100 p-6">
                    <div className="flex items-center mb-4">
                      <span className="text-yellow-500 text-2xl mr-2">●</span>
                      <h3 className="font-bold text-lg text-gray-800">
                        Gold Management
                      </h3>
                    </div>
                    <p className="text-gray-600 mb-4">
                      Process gold transactions for  {getUserBalanceDisplay(transactionForm.userId, "user")}.
                    </p>
                    {balanceError && transactionForm.asset === "GOLD" && (
                      <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm flex items-center">
                        <AlertCircle size={16} className="mr-2" />
                        {balanceError}
                      </div>
                    )}
                    <div className="flex space-x-3">
                      <button
                        onClick={() => {
                          setTransactionForm((prev) => ({
                            ...prev,
                            type: "DEPOSIT",
                            asset: "GOLD",
                            amount: "",
                            reference: "",
                          }));
                          setShowTransactionModal(true);
                        }}
                        className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white py-2 rounded flex items-center justify-center"
                      >
                        <Plus size={16} className="mr-1" /> Deposit Gold
                      </button>
                      <button
                        onClick={() => {
                          setTransactionForm((prev) => ({
                            ...prev,
                            type: "WITHDRAWAL",
                            asset: "GOLD",
                            amount: "",
                            reference: "",
                          }));
                          if (userBalances[transactionForm.userId]?.gold <= 0) {
                            setBalanceError(
                              `Insufficient gold balance. Available: ${userBalances[
                                transactionForm.userId
                              ].gold.toFixed(2)} oz`
                            );
                          } else {
                            setBalanceError("");
                            setShowTransactionModal(true);
                          }
                        }}
                        className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-2 rounded flex items-center justify-center disabled:opacity-50"
                        disabled={
                          userBalances[transactionForm.userId]?.gold <= 0
                        }
                      >
                        <ArrowDownUp size={16} className="mr-1" /> Withdraw Gold
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center p-8 text-gray-500">
                  <AlertCircle
                    size={24}
                    className="mx-auto text-gray-400 mb-4"
                  />
                  <p className="text-lg font-semibold">No User Selected</p>
                  <p className="mt-1">
                    Please select a user to manage transactions
                  </p>
                </div>
              )}
              <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-800">
                    Recent Transactions
                  </h3>
                  <button
                    onClick={() => setActiveTab("transactions")}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View All
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          ID
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          User
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Type
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Asset
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Amount
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {(transactionForm.userId
                        ? transactions.filter(
                            (t) => t.user._id === transactionForm.userId
                          )
                        : transactions
                      )
                        .slice(0, 3)
                        .map((transaction) => (
                          <tr key={transaction.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                              {transaction.transactionId}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {transaction.user.ACCOUNT_HEAD ||
                                transaction.userName ||
                                "Unknown User"}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  transaction.type === "DEPOSIT"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-purple-100 text-purple-800"
                                }`}
                              >
                                {transaction.type}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {transaction.asset === "CASH" ? (
                                <span className="flex items-center">
                                  <DollarSign
                                    size={14}
                                    className="mr-1 text-green-500"
                                  />
                                  Cash
                                </span>
                              ) : (
                                <span className="flex items-center">
                                  <span className="text-yellow-500 inline-block mr-1">
                                    ●
                                  </span>
                                  Gold
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {transaction.amount}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  transaction.status === "COMPLETED"
                                    ? "bg-green-100 text-green-800"
                                    : transaction.status === "PENDING"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {transaction.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(transaction.date)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <TransactionModal />
    </div>
  );
}
