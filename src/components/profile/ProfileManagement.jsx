import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "../../api/axios";
import { Tabs, Tab } from "./Tabs";
import { Spinner } from "./Spinner";
import { Badge } from "./Badge";
import { formatDate } from "../../utils/formatters";
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

const ProfileManagement = () => {
  const { userId } = useParams();
  const adminId = localStorage.getItem("adminId");
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [statements, setStatements] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Pagination states for different tabs
  const [currentPageOrders, setCurrentPageOrders] = useState(1);
  const [currentPageTransactions, setCurrentPageTransactions] = useState(1);
  const [currentLedgerPage, setCurrentLedgerPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Ledger state
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [totalLedgerItems, setTotalLedgerItems] = useState(0);
  const [totalLedgerPages, setTotalLedgerPages] = useState(0);
  const [expandedRow, setExpandedRow] = useState(null);
  const [sortField, setSortField] = useState("date");
  const [sortDirection, setSortDirection] = useState("desc");
  const [ledgerLoading, setLedgerLoading] = useState(false);

  useEffect(() => {
    if (userId && adminId) {
      fetchUserData();
    }
  }, [userId, adminId]);

  useEffect(() => {
    // Reset pagination when tab changes
    if (activeTab === "orders") {
      fetchOrderStatements();
      setCurrentPageOrders(1);
    } else if (activeTab === "transactions") {
      fetchTransactionStatements();
      setCurrentPageTransactions(1);
    } else if (activeTab === "ledger") {
      fetchLedgerEntries();
      setCurrentLedgerPage(1);
    }
  }, [activeTab]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(
        `/user-profile/${adminId}/${userId}`
      );

      if (response.data.success) {
        const userData = response.data.data;

        // Transform API data to match our component structure
        const formattedUserData = {
          id: userId,
          accountId: userData.REFMID,
          firstName: userData.firstName?.split(" ")[0] || "",
          lastName: userData.lastName?.split(" ").slice(1).join(" ") || "",
          email: userData.email || "",
          phone: userData.phoneNumber || "",
          address: userData.address
            ? `${userData.address.street || ""}, ${
                userData.address.city || ""
              }, ${userData.address.state || ""}, ${
                userData.address.country || ""
              }, ${userData.address.zipCode || ""}`
            : "",
          accountNumber: userData.ACCODE || "",
          status: userData.accountStatus || "pending",
          kycStatus: userData.kycStatus || "not_submitted",
          joinDate: userData.joinDate,
          accountBalance: {
            cash: userData.AMOUNTFC || 0,
            gold: userData.METAL_WT || 0,
          },
          tradingPreferences: {
            riskLevel: userData.Account_Type || "",
            autoTrading: false,
            notificationFrequency: "Daily",
          },
          spread: userData.userSpread || 0,
        };

        setUserData(formattedUserData);
        setFormData(formattedUserData);
      } else {
        throw new Error("Failed to fetch user data");
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching user data:", error);
      setLoading(false);
      setError("Failed to load user data. Please try again later.");
    }
  };

  // Format address from form data for API submission
  const formatAddressForSubmission = (addressString) => {
    if (!addressString) return {};
    const parts = addressString.split(",").map((part) => part.trim());

    return {
      street: parts[0] || null,
      city: parts[1] || null,
      state: parts[2] || null,
      country: parts[3] || null,
      zipCode: parts[4] || null,
    };
  };

  // Format name for API submission
  const formatNameForSubmission = (firstName, lastName) => {
    return [firstName, lastName].filter(Boolean).join(" ");
  };

  // Fetch order statements
  const fetchOrderStatements = async () => {
    try {
      setLoading(true);
      setError(null); // Clear any previous errors

      const response = await axiosInstance.get(
        `/user-orders/${adminId}/${userId}`
      );

      if (response.data.status === 200) {
        setStatements(response.data.data);

        // If data is empty, you might want to show a message
        if (response.data.data.length === 0) {
          setError("No order statements found for this user.");
        }
      } else {
        // Handle unsuccessful response
        setError(
          response.data.message || "Failed to retrieve order statements."
        );
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching order statements:", error);
      setLoading(false);

      // Provide more specific error messages if available
      const errorMessage =
        error.response?.data?.message ||
        "Failed to load order statements. Please try again later.";
      setError(errorMessage);
    }
  };

  // Fetch transaction statements
  const fetchTransactionStatements = async () => {
    try {
      setLoading(true);
      setError(null); // Clear any previous errors

      const response = await axiosInstance.get(
        `/user-transactions/${adminId}/${userId}`
      );

      if (response.data.status === 200) {
        setTransactions(response.data.data);

        // If data is empty, you might want to show a message
        if (response.data.data.length === 0) {
          setError("No transaction history found for this user.");
        }
      } else {
        // Handle unsuccessful response
        setError(
          response.data.message || "Failed to retrieve transaction history."
        );
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching transaction statements:", error);
      setLoading(false);

      // Provide more specific error messages if available
      const errorMessage =
        error.response?.data?.message ||
        "Failed to load transaction history. Please try again later.";
      setError(errorMessage);
    }
  };

  // Fetch ledger entries
  const fetchLedgerEntries = async () => {
    try {
      setLedgerLoading(true);
      setError(null);

      const params = {
        adminId,
        userId,
        page: currentLedgerPage,
        limit: itemsPerPage,
        sortField,
        sortDirection,
      };

      const response = await axiosInstance.get("/fetch-ledger", { params });

      if (response.data.success && response.data.data) {
        const filteredEntries = response.data.data?.filter(
          (entry) => entry.entryType !== "LP_POSITION"
        );
        setLedgerEntries(filteredEntries);
        setTotalLedgerItems(response.data.pagination.total || 0);
        setTotalLedgerPages(response.data.pagination.pages || 1);
      } else {
        setError(response.data.message || "Failed to retrieve ledger entries.");
      }

      setLedgerLoading(false);
    } catch (error) {
      console.error("Error fetching ledger entries:", error);
      setLedgerLoading(false);
      setError(
        error.response?.data?.message ||
          "Failed to load ledger entries. Please try again later."
      );
    }
  };

  const handleSort = (field) => {
    // If clicking the same field, toggle direction
    if (field === sortField) {
      const newDirection = sortDirection === "asc" ? "desc" : "asc";
      setSortDirection(newDirection);
    } else {
      // New field, default to ascending
      setSortField(field);
      setSortDirection("asc");
    }
    // Refetch with new sort parameters
    setCurrentLedgerPage(1);
    fetchLedgerEntries();
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: type === "checkbox" ? checked : value,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: type === "checkbox" ? checked : value,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    setError("");
    setSuccess("");

    try {
      // Prepare data for API submission
      const updateData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phoneNumber: formData.phone,
        address: formatAddressForSubmission(formData.address),
        accountStatus: formData.status,
        kycStatus: formData.kycStatus,
        userSpread: parseFloat(formData.spread),
        Account_Type: formData.tradingPreferences?.riskLevel || "LP",
      };

      await axiosInstance.put(`/user-profile/${adminId}/${userId}`, updateData);

      setUserData(formData);
      setIsEditing(false);
      setSuccess("User profile updated successfully");
      // Refresh user data after update
      fetchUserData();
    } catch (error) {
      console.error("Error updating user data:", error);
      setError("Failed to update user profile. Please try again.");
    } finally {
      setSaveLoading(false);
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "green";
      case "inactive":
        return "gray";
      case "suspended":
        return "red";
      case "pending":
        return "yellow";
      case "verified":
        return "blue";
      case "unverified":
      case "not_submitted":
        return "orange";
      case "completed":
        return "green";
      case "open":
        return "blue";
      case "closed":
        return "gray";
      case "credit":
        return "green";
      case "debit":
        return "red";
      default:
        return "gray";
    }
  };

  const formatProfit = (profit) => {
    if (!profit) return "-";
    const isPositive = profit.startsWith("+");
    return (
      <span className={isPositive ? "text-green-600" : "text-red-600"}>
        {profit}
      </span>
    );
  };

  const mapKycStatusToDisplay = (status) => {
    const statusMap = {
      not_submitted: "Not Submitted",
      pending: "Pending",
      verified: "Verified",
      rejected: "Rejected",
    };
    return statusMap[status] || status;
  };

  const mapAccountStatusToDisplay = (status) => {
    const statusMap = {
      pending: "Pending",
      active: "Active",
      inactive: "Inactive",
      suspended: "Suspended",
    };
    return statusMap[status] || status;
  };

  // Pagination logic for orders
  const indexOfLastOrder = currentPageOrders * itemsPerPage;
  const indexOfFirstOrder = indexOfLastOrder - itemsPerPage;
  const currentOrders = statements.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPagesOrders = Math.ceil(statements.length / itemsPerPage);

  const paginateOrders = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPagesOrders) {
      setCurrentPageOrders(pageNumber);
    }
  };

  // Pagination logic for transactions
  const indexOfLastTransaction = currentPageTransactions * itemsPerPage;
  const indexOfFirstTransaction = indexOfLastTransaction - itemsPerPage;
  const currentTransactions = transactions.slice(
    indexOfFirstTransaction,
    indexOfLastTransaction
  );
  const totalPagesTransactions = Math.ceil(transactions.length / itemsPerPage);

  const paginateTransactions = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPagesTransactions) {
      setCurrentPageTransactions(pageNumber);
    }
  };

  // Pagination for ledger (server-side pagination)
  const paginateLedger = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalLedgerPages) {
      setCurrentLedgerPage(pageNumber);
      fetchLedgerEntries();
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
      <div className="flex flex-col md:flex-row justify-between items-center bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
        <div className="flex items-center text-sm text-gray-700 mb-4 md:mb-0">
          <span>Showing </span>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              paginate(1); // Reset to first page when changing items per page
            }}
            className="mx-1 border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span>
            of <span className="font-medium">{totalItems}</span> results
          </span>
        </div>

        <div className="flex items-center justify-center space-x-1">
          <button
            onClick={() => paginate(1)}
            disabled={currentPage === 1}
            className={`relative inline-flex items-center px-2 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium ${
              currentPage === 1
                ? "text-gray-300 cursor-not-allowed"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <span className="sr-only">First page</span>
            <ChevronsLeft size={16} />
          </button>
          <button
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className={`relative inline-flex items-center px-2 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium ${
              currentPage === 1
                ? "text-gray-300 cursor-not-allowed"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <span className="sr-only">Previous</span>
            <ChevronLeft size={16} />
          </button>

          {/* Page numbers */}
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              // If 5 or fewer pages, show all
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              // If near start, show first 5
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              // If near end, show last 5
              pageNum = totalPages - 4 + i;
            } else {
              // Otherwise show current and 2 on each side
              pageNum = currentPage - 2 + i;
            }

            return (
              <button
                key={pageNum}
                onClick={() => paginate(pageNum)}
                className={`relative inline-flex items-center px-4 py-2 border ${
                  currentPage === pageNum
                    ? "bg-blue-50 border-blue-500 text-blue-600"
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                } text-sm font-medium`}
              >
                {pageNum}
              </button>
            );
          })}

          <button
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`relative inline-flex items-center px-2 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium ${
              currentPage === totalPages
                ? "text-gray-300 cursor-not-allowed"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <span className="sr-only">Next</span>
            <ChevronRight size={16} />
          </button>
          <button
            onClick={() => paginate(totalPages)}
            disabled={currentPage === totalPages}
            className={`relative inline-flex items-center px-2 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium ${
              currentPage === totalPages
                ? "text-gray-300 cursor-not-allowed"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <span className="sr-only">Last page</span>
            <ChevronsRight size={16} />
          </button>
        </div>
      </div>
    );
  };

  // Loading state
  if (loading && !userData) {
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
    <div className="w-full bg-gray-50">
      <div className="bg-gray-50 p-6 mx-auto backdrop-blur-lg bg-opacity-95">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 mr-2 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              User Profile Management
            </h1>
            <p className="text-gray-600">
              Manage user details, view order history and transaction statements
            </p>
          </div>
        </div>

        {/* Error and Success Messages */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded-lg">
            <p className="text-red-700 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {error}
            </p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4 rounded-lg">
            <p className="text-green-700 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              {success}
            </p>
          </div>
        )}

        {/* Navigation Tabs */}
        {/* Navigation Tabs */}
        <div className="mb-6">
          <Tabs activeTab={activeTab} onChange={setActiveTab}>
            <Tab id="profile" label="Profile" />
            <Tab id="orders" label="Order Statements" />
            <Tab id="transactions" label="Transaction History" />
            <Tab id="ledger" label="Ledger Entries" />
          </Tabs>
        </div>

        {/* Tab Content */}
        <div className="mt-4">
          {/* Profile Tab */}
          {activeTab === "profile" && userData && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-700">
                  User Information
                </h2>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center shadow-md"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                    Edit Profile
                  </button>
                ) : (
                  <div className="space-x-2">
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setFormData(userData);
                      }}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition flex items-center shadow-md"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={saveLoading}
                      className="px-4 mt-2 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center shadow-md"
                    >
                      {saveLoading ? (
                        <>
                          <span className="mr-2">Saving</span>
                          <Spinner size="sm" />
                        </>
                      ) : (
                        <>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 mr-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* User Summary Card */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl mb-6 flex justify-between shadow-md">
                <div>
                  <h3 className="text-lg font-medium flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2 text-blue-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    {userData.firstName || userData.lastName
                      ? `${userData.firstName} ${userData.lastName}`
                      : "New User"}
                  </h3>
                  <p className="text-gray-600 mt-1 flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1 text-blue-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
                      />
                    </svg>
                    Account: {userData.accountNumber || "N/A"} (ID:{" "}
                    {userData.accountId})
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Badge color={getStatusBadgeColor(userData.status)}>
                      {mapAccountStatusToDisplay(userData.status)}
                    </Badge>
                    <Badge color={getStatusBadgeColor(userData.kycStatus)}>
                      KYC: {mapKycStatusToDisplay(userData.kycStatus)}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <h4 className="font-medium text-gray-700">Account Balance</h4>
                  <p className="text-green-600 font-bold text-xl flex items-center justify-end mt-1">
                    AED {userData.accountBalance?.cash.toFixed(2)}
                  </p>
                  <p className="text-yellow-600 font-medium flex items-center justify-end">
                    {userData.accountBalance?.gold} Gold
                  </p>
                </div>
              </div>

              {isEditing ? (
                /* Edit Form */
                <form className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-xl shadow-md">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName || ""}
                        onChange={handleChange}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName || ""}
                        onChange={handleChange}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email || ""}
                        onChange={handleChange}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone
                      </label>
                      <input
                        type="text"
                        name="phone"
                        value={formData.phone || ""}
                        onChange={handleChange}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address (Street, City, State, Country, Zip)
                      </label>
                      <textarea
                        name="address"
                        value={formData.address || ""}
                        onChange={handleChange}
                        rows="3"
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Street, City, State, Country, Zip"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Account Status
                      </label>
                      <select
                        name="status"
                        value={formData.status || "pending"}
                        onChange={handleChange}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="suspended">Suspended</option>
                        <option value="pending">Pending</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        KYC Status
                      </label>
                      <select
                        name="kycStatus"
                        value={formData.kycStatus || "not_submitted"}
                        onChange={handleChange}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="verified">Verified</option>
                        <option value="pending">Pending</option>
                        <option value="rejected">Rejected</option>
                        <option value="not_submitted">Not Submitted</option>
                      </select>
                    </div>
                  </div>

                  {/* Trading Preferences */}
                  <div className="col-span-1 md:col-span-2">
                    <h3 className="text-lg font-medium border-b pb-2 mb-4 flex items-center text-blue-700">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                      </svg>
                      Trading Preferences
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Account Type
                        </label>
                        <select
                          name="tradingPreferences.riskLevel"
                          value={formData.tradingPreferences?.riskLevel || "LP"}
                          onChange={handleChange}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="LP">Liquidity Provider</option>
                          <option value="BANK">Bank</option>
                          <option value="DEBTOR">Debtor</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          User Spread
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          name="spread"
                          value={formData.spread || 0}
                          onChange={handleChange}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div className="flex items-center mt-6">
                        <input
                          type="checkbox"
                          id="autoTrading"
                          name="tradingPreferences.autoTrading"
                          checked={
                            formData.tradingPreferences?.autoTrading || false
                          }
                          onChange={handleChange}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label
                          htmlFor="autoTrading"
                          className="ml-2 block text-sm text-gray-700"
                        >
                          Enable Auto Trading
                        </label>
                      </div>
                    </div>
                  </div>
                </form>
              ) : (
                /* View Profile */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-xl shadow-md">
                  <div>
                    <h3 className="text-lg font-medium border-b pb-2 mb-4 flex items-center text-blue-700">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      Personal Information
                    </h3>
                    <dl className="grid grid-cols-1 gap-3">
                      <div className="sm:grid sm:grid-cols-3 sm:gap-4">
                        <dt className="text-sm font-medium text-gray-500">
                          Full name
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          {userData.firstName} {userData.lastName}
                        </dd>
                      </div>
                      <div className="sm:grid sm:grid-cols-3 sm:gap-4">
                        <dt className="text-sm font-medium text-gray-500">
                          Email
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          {userData.email || "Not provided"}
                        </dd>
                      </div>
                      <div className="sm:grid sm:grid-cols-3 sm:gap-4">
                        <dt className="text-sm font-medium text-gray-500">
                          Phone
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          {userData.phone || "Not provided"}
                        </dd>
                      </div>
                      <div className="sm:grid sm:grid-cols-3 sm:gap-4">
                        <dt className="text-sm font-medium text-gray-500">
                          Address
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          {userData.address || "Not provided"}
                        </dd>
                      </div>
                      <div className="sm:grid sm:grid-cols-3 sm:gap-4">
                        <dt className="text-sm font-medium text-gray-500">
                          Account Number
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          ACC {userData.accountNumber || "Not assigned"}
                        </dd>
                      </div>
                      <div className="sm:grid sm:grid-cols-3 sm:gap-4">
                        <dt className="text-sm font-medium text-gray-500">
                          Join Date
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          {userData.joinDate
                            ? formatDate(userData.joinDate)
                            : "Not available"}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium border-b pb-2 mb-4 flex items-center text-blue-700">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                      </svg>
                      Account Information
                    </h3>
                    <dl className="grid grid-cols-1 gap-3">
                      <div className="sm:grid sm:grid-cols-3 sm:gap-4">
                        <dt className="text-sm font-medium text-gray-500">
                          Account Status
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          <Badge color={getStatusBadgeColor(userData.status)}>
                            {mapAccountStatusToDisplay(userData.status)}
                          </Badge>
                        </dd>
                      </div>
                      <div className="sm:grid sm:grid-cols-3 sm:gap-4">
                        <dt className="text-sm font-medium text-gray-500">
                          KYC Status
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          <Badge
                            color={getStatusBadgeColor(userData.kycStatus)}
                          >
                            {mapKycStatusToDisplay(userData.kycStatus)}
                          </Badge>
                        </dd>
                      </div>
                      <div className="sm:grid sm:grid-cols-3 sm:gap-4">
                        <dt className="text-sm font-medium text-gray-500">
                          Risk Level
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          {userData.tradingPreferences?.riskLevel || "Not set"}
                        </dd>
                      </div>
                      <div className="sm:grid sm:grid-cols-3 sm:gap-4">
                        <dt className="text-sm font-medium text-gray-500">
                          User Spread
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          {userData.spread}
                        </dd>
                      </div>
                      {/* <div className="sm:grid sm:grid-cols-3 sm:gap-4">
                        <dt className="text-sm font-medium text-gray-500">
                          Auto Trading
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          {userData.tradingPreferences?.autoTrading
                            ? "Enabled"
                            : "Disabled"}
                        </dd>
                      </div> */}
                    </dl>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === "orders" && (
            <div>
              <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 mr-2 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Order Statements
              </h2>

              {loading ? (
                <div className="text-center p-10">
                  <Spinner size="lg" />
                </div>
              ) : statements.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 bg-white rounded-lg shadow-md">
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
                            Type
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Size
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Open Price
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Close Price
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Profit/Loss
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Status
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Date
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {currentOrders.map((order, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {order.orderNo}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <Badge
                                color={order.type === "BUY" ? "green" : "red"}
                              >
                                {order.type}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {order.size} oz
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              $ {order?.openingPrice + order.user.userSpread}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {order?.closingPrice
                                ? `$${
                                    order?.closingPrice + order.user.userSpread
                                  }`
                                : "-"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span
                                className={`font-medium ${
                                  order.profit > 0
                                    ? "text-green-600"
                                    : order.profit < 0
                                    ? "text-red-600"
                                    : "text-gray-500"
                                }`}
                              >
                                {order.profit ? order.profit.toFixed(2) : "-"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <Badge
                                color={getStatusBadgeColor(order.orderStatus)}
                              >
                                {order.orderStatus}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(order.time)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Pagination
                    currentPage={currentPageOrders}
                    totalPages={totalPagesOrders}
                    paginate={paginateOrders}
                  />
                </>
              ) : (
                <div className="text-center p-10 bg-white rounded-lg shadow-md">
                  <p className="text-gray-500">No order statements found.</p>
                </div>
              )}
            </div>
          )}

          {/* Transactions Tab */}
          {activeTab === "transactions" && (
            <div>
              <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 mr-2 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                Transaction History
              </h2>

              {loading ? (
                <div className="text-center p-10">
                  <Spinner size="lg" />
                </div>
              ) : transactions.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 bg-white rounded-lg shadow-md">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Transaction ID
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
                            Asset
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Amount
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Status
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Date
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Balance After
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {currentTransactions.map((transaction, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {transaction.transactionId}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <Badge
                                color={
                                  transaction.type === "DEPOSIT"
                                    ? "green"
                                    : "blue"
                                }
                              >
                                {transaction.type}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {transaction.asset}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                              {transaction.amount}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <Badge
                                color={getStatusBadgeColor(transaction.status)}
                              >
                                {transaction.status}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(transaction.date)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {transaction.newBalance}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Pagination
                    currentPage={currentPageTransactions}
                    totalPages={totalPagesTransactions}
                    paginate={paginateTransactions}
                  />
                </>
              ) : (
                <div className="text-center p-10 bg-white rounded-lg shadow-md">
                  <p className="text-gray-500">No transaction history found.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "ledger" && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="w-10 px-3 py-3"></th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      <div className="flex items-center">
                        <span>Entry ID</span>
                        <ArrowDownUp size={14} className="ml-1 text-gray-400" />
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      <div className="flex items-center">
                        <span>User</span>
                        <ArrowDownUp size={14} className="ml-1 text-gray-400" />
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      <div className="flex items-center">
                        <span>Type</span>
                        <ArrowDownUp size={14} className="ml-1 text-gray-400" />
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      <div className="flex items-center">
                        <span>Nature</span>
                        <ArrowDownUp size={14} className="ml-1 text-gray-400" />
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      <div className="flex items-center">
                        <span>Reference</span>
                        <ArrowDownUp size={14} className="ml-1 text-gray-400" />
                      </div>
                    </th>

                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      <div className="flex items-center">
                        <span>Amount</span>
                        <ArrowDownUp size={14} className="ml-1 text-gray-400" />
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      <div className="flex items-center">
                        <span>Date</span>
                        <ArrowDownUp size={14} className="ml-1 text-gray-400" />
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      <div className="flex items-center">
                        <span>Actions</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {ledgerEntries.length > 0 ? (
                    ledgerEntries?.map((entry, index) => (
                      <ExpandableRow
                        key={entry._id || index}
                        entry={entry}
                        index={index}
                      />
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="10"
                        className="px-6 py-12 text-center text-sm text-gray-500"
                      >
                        <div className="flex flex-col items-center justify-center">
                          <AlertTriangle
                            size={36}
                            className="text-gray-400 mb-3"
                          />
                          <p className="font-medium">No ledger entries found</p>
                          <p className="text-xs text-gray-400 mt-1">
                            Try changing your filters or select a different user
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Ledger pagination */}
              {ledgerEntries.length > 0 && (
                <Pagination
                  currentPage={currentPageTransactions}
                  totalPages={totalPagesTransactions}
                  paginate={paginateTransactions}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileManagement;
