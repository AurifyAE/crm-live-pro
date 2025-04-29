import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "../../api/axios";
import { Tabs, Tab } from "./Tabs";
import { Spinner } from "./Spinner";
import { Badge } from "./Badge";
import { formatDate } from "../../utils/formatters";

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
  // Pagination states
  const [currentPageOrders, setCurrentPageOrders] = useState(1);
  const [currentPageTransactions, setCurrentPageTransactions] = useState(1);
  const itemsPerPage = 10; // Number of items per page

  useEffect(() => {
    if (userId && adminId) {
      fetchUserData();
    }
  }, [userId, adminId]);

  useEffect(() => {
    if (activeTab === "orders") {
      fetchOrderStatements();
      setCurrentPageOrders(1); // Reset to first page when tab changes
    } else if (activeTab === "transactions") {
      fetchTransactionStatements();
      setCurrentPageTransactions(1); // Reset to first page when tab changes
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

  // Pagination component
  const Pagination = ({ currentPage, totalPages, paginate }) => {
    return (
      <div className="flex justify-center mt-6">
        <nav className="inline-flex rounded-md shadow">
          <button
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-3 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 ${
              currentPage === 1 ? "cursor-not-allowed" : ""
            }`}
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, index) => (
            <button
              key={index + 1}
              onClick={() => paginate(index + 1)}
              className={`px-3 py-2 border border-gray-300 bg-white text-sm font-medium ${
                currentPage === index + 1
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              {index + 1}
            </button>
          ))}
          <button
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`px-3 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 ${
              currentPage === totalPages ? "cursor-not-allowed" : ""
            }`}
          >
            Next
          </button>
        </nav>
      </div>
    );
  };

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
        <div className="mb-6">
          <Tabs activeTab={activeTab} onChange={setActiveTab}>
            <Tab id="profile" label="Profile" />
            <Tab id="orders" label="Order Statements" />
            <Tab id="transactions" label="Transaction History" />
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
                        {currentOrders.map((order) => (
                          <tr key={order.id} className="hover:bg-gray-50">
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
                              $ {order.openingPrice + order.user.userSpread}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {order.closingPrice
                                ? `$${order.closingPrice + order.user.userSpread}`
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
                        {currentTransactions.map((transaction) => (
                          <tr key={transaction.id} className="hover:bg-gray-50">
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
        </div>
      </div>
    </div>
  );
};

export default ProfileManagement;