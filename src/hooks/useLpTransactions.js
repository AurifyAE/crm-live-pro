// src/hooks/useLpTransactions.js
import { useState, useEffect, useCallback } from "react";
import axiosInstance from "../api/axios";

/**
 * Custom hook for managing LP transactions
 * @param {string} adminId - The admin ID
 * @returns {Object} - Transaction management functions and state
 */
const useLpTransactions = (adminId) => {
  // Transaction states
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [adminBalance, setAdminBalance] = useState({
    name: "Admin Account",
    cash: 0,
    gold: 0,
  });

  // Transaction form
  const [transactionForm, setTransactionForm] = useState({
    type: "DEPOSIT",
    asset: "CASH",
    amount: "",
    reference: "",
  });

  // UI states
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [balanceError, setBalanceError] = useState("");
  const [currentTransactionPage, setCurrentTransactionPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalTransactionPages, setTotalTransactionPages] = useState(1);
  const [totalTransactions, setTotalTransactions] = useState(0);

  // Filters
  const [filters, setFilters] = useState({
    type: "",
    asset: "",
    status: "",
    startDate: "",
    endDate: "",
    searchTerm: "",
    dateRange: "all",
  });

  // Fetch transactions
  const fetchTransactionStatements = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: currentTransactionPage,
        limit: itemsPerPage,
        adminId,
      });

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
      } else if (filters.startDate && filters.endDate) {
        queryParams.append("startDate", filters.startDate);
        queryParams.append("endDate", filters.endDate);
      }

      const response = await axiosInstance.get(
        `/fetch-transaction?${queryParams}`
      );

      if (response.data?.data?.transactions) {
        const filteredTransactions = response.data.data.transactions.filter(
          (transaction) => transaction.entityType === "ADMIN"
        );
        setTransactions(filteredTransactions);
        setTotalTransactionPages(response.data.data.pagination.pages);
        setTotalTransactions(response.data.data.pagination.total);
      } else {
        setError("Failed to fetch transactions");
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
      setError("Failed to fetch transactions");
    } finally {
      setLoading(false);
    }
  }, [adminId, currentTransactionPage, filters, itemsPerPage]);

  // Fetch admin profile and balances
  const fetchAdminProfile = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/profile/${adminId}`);

      if (response.data.success && response.data.data) {
        const adminData = response.data.data;
        setAdminBalance({
          name: adminData.name || "Admin Account",
          cash: parseFloat(adminData.cashBalance) || 0,
          gold: parseFloat(adminData.goldBalance) || 0,
        });
      } else {
        setError("Failed to fetch admin profile");
      }
    } catch (error) {
      console.error("Error fetching admin profile:", error);
      setError("Failed to fetch admin profile");
    } finally {
      setLoading(false);
    }
  }, [adminId]);

  // Get balance display
  const getBalanceDisplay = useCallback(
    (assetType) => {
      // Return not available if admin balance isn't loaded
      if (!adminBalance) return "Not available";

      // Return user name if assetType is "user"
      if (assetType === "user") {
        return adminBalance.name;
      }

      // Return cash balance with $ sign if assetType is "CASH"
      if (assetType === "CASH") {
        return `$${adminBalance.cash.toFixed(2)}`;
      }

      // Return gold balance with oz unit if assetType is "GOLD"
      if (assetType === "GOLD") {
        return `${adminBalance.gold.toFixed(2)} oz`;
      }

      // Default case if assetType is not recognized
      return "Invalid asset type";
    },
    [adminBalance]
  );

  // Handle transaction form changes
  const handleTransactionFormChange = useCallback((e) => {
    const { name, value } = e.target;
    setTransactionForm((prev) => ({ ...prev, [name]: value }));
    if (["amount", "asset", "type"].includes(name)) {
      setBalanceError("");
    }
  }, []);

  // Validate withdrawal
  const validateWithdrawal = useCallback(
    (asset, amount) => {
      if (transactionForm.type !== "WITHDRAWAL") return true;
      const numericAmount = parseFloat(amount);

      if (adminBalance) {
        const balance =
          asset === "CASH" ? adminBalance.cash : adminBalance.gold;

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
    [adminBalance, transactionForm.type]
  );

  // Submit transaction
  const handleTransactionSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      const { asset, amount, type, reference } = transactionForm;

      if (type === "WITHDRAWAL" && !validateWithdrawal(asset, amount)) {
        return;
      }

      try {
        setLoading(true);
        const transactionData = {
          type,
          asset,
          amount: parseFloat(amount),
          reference:
            reference ||
            `REF-${type === "DEPOSIT" ? "D" : "W"}${Math.floor(
              10000 + Math.random() * 90000
            )}`,
        };

        const response = await axiosInstance.post(
          `/create-transaction/${adminId}`,
          transactionData
        );

        if (response.data.success) {
          // Update local balance
          setAdminBalance((prev) => ({
            ...prev,
            [asset.toLowerCase()]:
              type === "DEPOSIT"
                ? prev[asset.toLowerCase()] + parseFloat(amount)
                : prev[asset.toLowerCase()] - parseFloat(amount),
          }));

          // Reset form and close modal
          setTransactionForm({
            type: "DEPOSIT",
            asset: "CASH",
            amount: "",
            reference: "",
          });
          setShowTransactionModal(false);
          setBalanceError("");
          setCurrentTransactionPage(1);
          await fetchTransactionStatements();
        } else {
          setError(response.data.message || "Failed to create transaction");
        }
      } catch (error) {
        setError("Failed to create transaction");
        console.error("Error creating transaction:", error);
      } finally {
        setLoading(false);
      }
    },
    [adminId, fetchTransactionStatements, transactionForm, validateWithdrawal]
  );

  // Handle filter changes
  const handleFilterChange = useCallback((e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentTransactionPage(1);
  }, []);

  // Reset filters
  const resetFilters = useCallback(() => {
    setFilters({
      type: "",
      asset: "",
      status: "",
      startDate: "",
      endDate: "",
      searchTerm: "",
      dateRange: "all",
    });
    setCurrentTransactionPage(1);
  }, []);

  // Get filtered transactions
  const filteredTransactions = transactions.filter((transaction) => {
    // Filter by search term across multiple fields
    if (filters.searchTerm) {
      const search = filters.searchTerm.toLowerCase();
      const matchesSearch =
        transaction.transactionId?.toLowerCase().includes(search) ||
        transaction.reference?.toLowerCase().includes(search);

      if (!matchesSearch) return false;
    }

    // Return true if all filters pass
    return true;
  });

  // Get paginated transactions
  const getCurrentTransactions = useCallback(() => {
    return filteredTransactions;
  }, [filteredTransactions]);

  // Load data on mount
  useEffect(() => {
    if (adminId) {
      fetchAdminProfile();
    }
  }, [adminId, fetchAdminProfile]);

  // Load transactions when page changes
  useEffect(() => {
    if (adminId) {
      fetchTransactionStatements();
    }
  }, [
    adminId,
    currentTransactionPage,
    filters,
    itemsPerPage,
    fetchTransactionStatements,
  ]);

  // Format date utility
  const formatDate = useCallback((dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  return {
    // State
    transactions,
    loading,
    error,
    adminBalance,
    transactionForm,
    showTransactionModal,
    balanceError,
    currentTransactionPage,
    totalTransactionPages,
    totalTransactions,
    filters,

    // Actions
    setCurrentTransactionPage,
    setItemsPerPage,
    setTransactionForm,
    setShowTransactionModal,

    // Methods
    fetchTransactionStatements,
    getBalanceDisplay,
    handleTransactionFormChange,
    handleTransactionSubmit,
    handleFilterChange,
    resetFilters,
    formatDate,
    getCurrentTransactions,
  };
};

export default useLpTransactions;