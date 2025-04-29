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
  Settings,
  AlertTriangle,
} from "lucide-react";
import axiosInstance from "../api/axios";

export default function Statements() {
  const adminId = localStorage.getItem("adminId");
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("All");
  const [activeTab, setActiveTab] = useState("orders"); // "orders" or "transactions" or "manage"
  const [loading, setLoading] = useState(false);
  const [statements, setStatements] = useState([]);
  const [transactions, setTransactions] = useState([]);
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
  const [showFilters, setShowFilters] = useState(false);

  // Pagination states
  const [currentOrderPage, setCurrentOrderPage] = useState(1);
  const [currentTransactionPage, setCurrentTransactionPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalOrderPages, setTotalOrderPages] = useState(1);
  const [totalTransactionPages, setTotalTransactionPages] = useState(1);

  // States for transaction management
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
  // Fetch users and statements on component mount
  useEffect(() => {
    fetchUsers();
    // Load default statements
    fetchOrderStatements();
    fetchTransactionStatements();
  }, []);

  // Fetch user data from the API
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const adminId = localStorage.getItem("adminId");
      const response = await axiosInstance.get(`/fetch-data/${adminId}`);
      if (response.data && response.data.data) {
        setUsers(response.data.data);

        // Process user balances
        const balances = {};
        response.data.data.forEach((user) => {
          balances[user.ACCOUNT_HEAD] = {
            cash: user.AMOUNTFC || 0,
            gold: user.METAL_WT || 0,
          };
        });
        setUserBalances(balances);
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
      } else if (activeTab === "transactions") {
        fetchTransactionStatements();
        setCurrentTransactionPage(1); // Reset to first page when changing user or tab
      }
    }
  }, [selectedUser, activeTab]);

  // Update total pages when data or items per page changes
  useEffect(() => {
    if (statements.length > 0) {
      setTotalOrderPages(Math.ceil(filteredStatements.length / itemsPerPage));
    }
    if (transactions.length > 0) {
      setTotalTransactionPages(
        Math.ceil(filteredTransactions.length / itemsPerPage)
      );
    }
  }, [statements, transactions, filters, itemsPerPage]);

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

  // Fetch transaction statements
  const fetchTransactionStatements = async () => {
    try {
      setLoading(true);
      // This is a placeholder - replace with your actual API call
      // const response = await axiosInstance.get(`/user-transactions/${selectedUser}`);

      // Mock data for demonstration
      const mockTransactionData = [
        {
          id: "TRX-2001",
          type: "DEPOSIT",
          asset: "CASH",
          amount: "$500.00",
          status: "COMPLETED",
          timestamp: "2025-04-21T08:30:15Z",
          reference: "REF-D10023",
          balance: "$3,500.00",
        },
        {
          id: "TRX-2002",
          type: "WITHDRAWAL",
          asset: "CASH",
          amount: "$200.00",
          status: "COMPLETED",
          timestamp: "2025-04-22T14:15:30Z",
          reference: "REF-W10045",
          balance: "$3,300.00",
        },
        {
          id: "TRX-2003",
          type: "DEPOSIT",
          asset: "GOLD",
          amount: "0.05 oz",
          status: "COMPLETED",
          timestamp: "2025-04-23T09:20:10Z",
          reference: "REF-D10067",
          balance: "0.15 oz",
        },
        {
          id: "TRX-2004",
          type: "WITHDRAWAL",
          asset: "GOLD",
          amount: "0.02 oz",
          status: "PENDING",
          timestamp: "2025-04-24T10:45:22Z",
          reference: "REF-W10089",
          balance: "0.13 oz",
        },
        {
          id: "TRX-2005",
          type: "DEPOSIT",
          asset: "CASH",
          amount: "$750.00",
          status: "COMPLETED",
          timestamp: "2025-04-24T16:30:45Z",
          reference: "REF-D10112",
          balance: "$4,050.00",
        },
        {
          id: "TRX-2006",
          type: "DEPOSIT",
          asset: "CASH",
          amount: "$1000.00",
          status: "COMPLETED",
          timestamp: "2025-04-24T16:45:45Z",
          reference: "REF-D10113",
          balance: "$5,050.00",
        },
        {
          id: "TRX-2007",
          type: "WITHDRAWAL",
          asset: "CASH",
          amount: "$300.00",
          status: "PENDING",
          timestamp: "2025-04-24T17:30:45Z",
          reference: "REF-W10114",
          balance: "$4,750.00",
        },
        {
          id: "TRX-2008",
          type: "DEPOSIT",
          asset: "GOLD",
          amount: "0.1 oz",
          status: "COMPLETED",
          timestamp: "2025-04-25T10:30:45Z",
          reference: "REF-D10115",
          balance: "0.23 oz",
        },
        {
          id: "TRX-2009",
          type: "WITHDRAWAL",
          asset: "GOLD",
          amount: "0.05 oz",
          status: "COMPLETED",
          timestamp: "2025-04-25T14:30:45Z",
          reference: "REF-W10116",
          balance: "0.18 oz",
        },
        {
          id: "TRX-2010",
          type: "DEPOSIT",
          asset: "CASH",
          amount: "$1500.00",
          status: "COMPLETED",
          timestamp: "2025-04-26T09:30:45Z",
          reference: "REF-D10117",
          balance: "$6,250.00",
        },
        {
          id: "TRX-2011",
          type: "WITHDRAWAL",
          asset: "CASH",
          amount: "$500.00",
          status: "PENDING",
          timestamp: "2025-04-26T10:30:45Z",
          reference: "REF-W10118",
          balance: "$5,750.00",
        },
        {
          id: "TRX-2012",
          type: "DEPOSIT",
          asset: "GOLD",
          amount: "0.2 oz",
          status: "COMPLETED",
          timestamp: "2025-04-26T11:30:45Z",
          reference: "REF-D10119",
          balance: "0.38 oz",
        },
      ];

      setTransactions(mockTransactionData);
      setTotalTransactionPages(
        Math.ceil(mockTransactionData.length / itemsPerPage)
      );
      setLoading(false);
    } catch (error) {
      console.error("Error fetching transaction statements:", error);
      setLoading(false);
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
    if (activeTab === "orders") {
      setCurrentOrderPage(1);
    } else if (activeTab === "transactions") {
      setCurrentTransactionPage(1);
    }
  };

  const handleTransactionFormChange = useCallback(
    (e) => {
      const { name, value } = e.target;

      // Clear balance error when form changes
      if (
        balanceError &&
        (name === "amount" ||
          name === "userId" ||
          name === "asset" ||
          name === "type")
      ) {
        setBalanceError("");
      }

      setTransactionForm((prev) => ({ ...prev, [name]: value }));
    },
    [balanceError]
  );

  // Validate withdrawal against user balance
  const validateWithdrawal = (userId, asset, amount) => {
    // Skip validation for deposits
    if (transactionForm.type !== "WITHDRAWAL") return true;

    // Parse the amount
    const numericAmount = parseFloat(amount);

    // Check if the user has sufficient balance
    if (userId && userBalances[userId]) {
      const userBalance =
        asset === "CASH"
          ? parseFloat(userBalances[userId].cash)
          : parseFloat(userBalances[userId].gold);

      if (numericAmount > userBalance) {
        setBalanceError(
          `Insufficient ${asset.toLowerCase()} balance. Available: ${
            asset === "CASH"
              ? "$" + userBalance.toFixed(2)
              : userBalance.toFixed(2) + " oz"
          }`
        );
        return false;
      }
    }

    return true;
  };

  // Submit transaction form
  const handleTransactionSubmit = async (e) => {
    e.preventDefault();

    // Validate the withdrawal against user balance
    const { userId, asset, amount, type } = transactionForm;

    if (type === "WITHDRAWAL" && !validateWithdrawal(userId, asset, amount)) {
      // Balance validation failed
      return;
    }

    try {
      setLoading(true);
      // Format amount based on asset type
      const formattedAmount =
        transactionForm.asset === "CASH"
          ? `$${parseFloat(transactionForm.amount).toFixed(2)}`
          : `${parseFloat(transactionForm.amount).toFixed(2)} oz`;

      // Get user name for the transaction record
      const selectedUserObj = users.find(
        (user) => user.ACCOUNT_HEAD === userId
      );
      const userName = selectedUserObj
        ? selectedUserObj.ACCOUNT_HEAD
        : "Unknown User";

      // Generate a new transaction ID
      const newTransactionId = `TRX-${Math.floor(2000 + Math.random() * 1000)}`;

      // Generate reference if none provided
      const reference =
        transactionForm.reference ||
        `REF-${transactionForm.type === "DEPOSIT" ? "D" : "W"}${Math.floor(
          10000 + Math.random() * 90000
        )}`;

      // Create new transaction with user information
      const newTransaction = {
        id: newTransactionId,
        userId: userId,
        userName: userName,
        type: transactionForm.type,
        asset: transactionForm.asset,
        amount: formattedAmount,
        status: "PENDING", // New transactions start as pending
        timestamp: new Date().toISOString(),
        reference: reference,
        // Calculate new balance (this is a mock, in production would fetch the actual balance)
        balance: transactionForm.asset === "CASH" ? "$4,050.00" : "0.15 oz",
      };

      // Here you would send the transaction to your API
      // await axiosInstance.post('/create-transaction', newTransaction);

      // For demo, just add to local state
      setTransactions([newTransaction, ...transactions]);
      setTotalTransactionPages(
        Math.ceil((transactions.length + 1) / itemsPerPage)
      );

      // Update local balance tracking for the user
      if (userId && userBalances[userId]) {
        const updatedBalances = { ...userBalances };
        const numAmount = parseFloat(amount);

        if (asset === "CASH") {
          if (type === "DEPOSIT") {
            updatedBalances[userId].cash += numAmount;
          } else {
            updatedBalances[userId].cash -= numAmount;
          }
        } else {
          // GOLD
          if (type === "DEPOSIT") {
            updatedBalances[userId].gold += numAmount;
          } else {
            updatedBalances[userId].gold -= numAmount;
          }
        }

        setUserBalances(updatedBalances);
      }

      // Close modal and reset form
      setShowTransactionModal(false);
      setTransactionForm({
        type: "DEPOSIT",
        asset: "CASH",
        amount: "",
        reference: "",
        userId: "", // Reset user selection
      });
      setBalanceError("");

      setLoading(false);

      // Switch to transactions tab to show the new transaction
      setActiveTab("transactions");
      setCurrentTransactionPage(1); // Show first page to see the new transaction
    } catch (error) {
      console.error("Error creating transaction:", error);
      setLoading(false);
    }
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

  // Apply filters to transactions
  const filteredTransactions = transactions.filter((transaction) => {
    // Filter by ID
    if (
      filters.id &&
      !transaction.id.toLowerCase().includes(filters.id.toLowerCase())
    ) {
      return false;
    }

    // Filter by type
    if (filters.type && transaction.type !== filters.type) {
      return false;
    }

    // Filter by status
    if (filters.status && transaction.status !== filters.status) {
      return false;
    }

    // Filter by date range
    if (filters.dateRange !== "all") {
      const transactionDate = new Date(transaction.timestamp);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);

      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);

      if (
        filters.dateRange === "today" &&
        transactionDate.toDateString() !== today.toDateString()
      ) {
        return false;
      } else if (
        filters.dateRange === "yesterday" &&
        transactionDate.toDateString() !== yesterday.toDateString()
      ) {
        return false;
      } else if (filters.dateRange === "week" && transactionDate < weekAgo) {
        return false;
      } else if (filters.dateRange === "month" && transactionDate < monthAgo) {
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

  // Get current transactions page data
  const indexOfLastTransaction = currentTransactionPage * itemsPerPage;
  const indexOfFirstTransaction = indexOfLastTransaction - itemsPerPage;
  const currentTransactions = filteredTransactions.slice(
    indexOfFirstTransaction,
    indexOfLastTransaction
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
  const getUserBalanceDisplay = (userId, assetType) => {
    if (!userId || !userBalances[userId]) return "Not available";

    if (assetType === "CASH") {
      return `$${parseFloat(userBalances[userId].cash).toFixed(2)}`;
    } else {
      return `${parseFloat(userBalances[userId].gold).toFixed(2)} oz`;
    }
  };
  // Reset all filters
  const resetFilters = () => {
    setFilters({
      id: "",
      type: "",
      status: "",
      dateRange: "all",
    });

    // Reset pagination
    if (activeTab === "orders") {
      setCurrentOrderPage(1);
    } else if (activeTab === "transactions") {
      setCurrentTransactionPage(1);
    }
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
            Showing {totalItems > 0 ? indexOfFirstOrder + 1 : 0} to{" "}
            {Math.min(indexOfLastOrder, totalItems)} of {totalItems} results
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
                    : setCurrentTransactionPage
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
                    : setCurrentTransactionPage
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
                    : setCurrentTransactionPage
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
                          : setCurrentTransactionPage
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
                    : setCurrentTransactionPage
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
                    : setCurrentTransactionPage
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

  const TransactionModal = () => {
    // Create a ref for the amount input
    const amountInputRef = React.useRef(null);

    // Focus on the amount input when modal opens
    React.useEffect(() => {
      if (showTransactionModal && amountInputRef.current) {
        amountInputRef.current.focus();
      }
    }, [showTransactionModal]);

    // Get user balance for the selected user and asset
    const currentBalance =
      transactionForm.userId && transactionForm.asset
        ? getUserBalanceDisplay(transactionForm.userId, transactionForm.asset)
        : "Select a user";

    if (!showTransactionModal) return null;

    return (
      <div className="fixed inset-0 flex items-center bg-white/70 justify-center z-50 bg-wh bg-opacity-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md transform overflow-hidden">
          <div className="bg-gradient-to-r from-blue-700 to-blue-500 text-white p-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg">
                {transactionForm.type === "DEPOSIT" ? "Deposit" : "Withdrawal"}{" "}
                {transactionForm.asset}
              </h3>
              <button
                onClick={() => setShowTransactionModal(false)}
                className="text-white hover:bg-blue-600 rounded-full p-1"
              >
                <XCircle size={20} />
              </button>
            </div>
          </div>

          <form onSubmit={handleTransactionSubmit} className="p-6">
            {/* User Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select User
              </label>
              <select
                name="userId"
                value={transactionForm.userId}
                onChange={handleTransactionFormChange}
                className="w-full rounded-md border border-gray-300 p-2 bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-inner"
                required
              >
                <option value="">Select a user</option>
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

            {/* Current Balance Display */}
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
                    setTransactionForm({ ...transactionForm, type: "DEPOSIT" })
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
                    setTransactionForm({
                      ...transactionForm,
                      type: "WITHDRAWAL",
                    })
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
                    setTransactionForm({ ...transactionForm, asset: "CASH" })
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
                    setTransactionForm({ ...transactionForm, asset: "GOLD" })
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
                  } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-inner`}
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

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reference (Optional)
              </label>
              <input
                type="text"
                name="reference"
                value={transactionForm.reference}
                onChange={handleTransactionFormChange}
                className="w-full px-3 py-2 rounded-md border border-gray-300 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-inner"
                placeholder="Transaction reference"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowTransactionModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-4 py-2 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  transactionForm.type === "DEPOSIT"
                    ? "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
                    : "bg-rose-600 hover:bg-rose-700 focus:ring-rose-500"
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

        <div className="border-b  border-gray-200">
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
                  placeholder={`Search ${
                    activeTab === "orders" ? "order" : "transaction"
                  } ID...`}
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
                filters.dateRange !== "all") && (
                <button
                  onClick={resetFilters}
                  className="ml-2 flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 bg-white rounded-md border border-gray-300 px-3 py-2"
                >
                  <RefreshCw size={16} className="mr-1" /> Reset
                </button>
              )}
            </div>

            {activeTab === "transactions" && (
              <button
                onClick={() => setShowTransactionModal(true)}
                className="flex items-center text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md"
              >
                <Plus size={16} className="mr-1" /> New Transaction
              </button>
            )}
          </div>

          {/* Advanced filters */}
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
                  className="rounded-md border border-gray-300 py-2 px-3 w-full text-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Types</option>
                  {activeTab === "orders" ? (
                    <>
                      <option value="BUY">Buy</option>
                      <option value="SELL">Sell</option>
                    </>
                  ) : (
                    <>
                      <option value="DEPOSIT">Deposit</option>
                      <option value="WITHDRAWAL">Withdrawal</option>
                    </>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  name={activeTab === "orders" ? "orderStatus" : "status"}
                  value={
                    activeTab === "orders"
                      ? filters.orderStatus
                      : filters.status
                  }
                  onChange={handleFilterChange}
                  className="rounded-md border border-gray-300 py-2 px-3 w-full text-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Statuses</option>
                  {activeTab === "orders" ? (
                    <>
                      <option value="COMPLETED">Completed</option>
                      <option value="PENDING">Pending</option>
                      <option value="CANCELLED">Cancelled</option>
                    </>
                  ) : (
                    <>
                      <option value="COMPLETED">Completed</option>
                      <option value="PENDING">Pending</option>
                      <option value="FAILED">Failed</option>
                    </>
                  )}
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
                      setDateRange({ ...dateRange, startDate: e.target.value })
                    }
                    className="rounded-md border border-gray-300 py-2 px-3 w-full text-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) =>
                      setDateRange({ ...dateRange, endDate: e.target.value })
                    }
                    className="rounded-md border border-gray-300 py-2 px-3 w-full text-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Orders Tab Content */}
        {activeTab === "orders" && (
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
                        {statement.volume}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {statement.openingPrice + statement.user.userSpread}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {statement.closingPrice
                          ? `${
                              statement.closingPrice + statement.user.userSpread
                            }`
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

      </div>

      {/* Transaction Modal */}
      <TransactionModal />
    </div>
  );
}
