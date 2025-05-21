import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "../../api/axios";
import { Tabs, Tab } from "./Tabs";
import { Spinner } from "./Spinner";
import ProfileTab from "./ProfileTab";
import OrderStatementsTab from "./OrderStatementsTab";
import OpenOrdersTab from "./OpenOrdersTab";
import TransactionsTab from "./TransactionsTab";
import LedgerTab from "../lpStatements/LedgerTab";
import { formatDate } from "../../utils/formatters";
import useMarketData from "../../components/marketData";

const ProfileManagement = () => {
  const { userId } = useParams();
  const adminId = localStorage.getItem("adminId");
  const { marketData, refreshData } = useMarketData(["GOLD"]);
  const [goldData, setGoldData] = useState({
    symbol: "GOLD",
    bid: null,
    ask: null,
    high: null,
    low: null,
    marketStatus: "LOADING",
    priceUpdateTimestamp: null,
  });
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [orders, setOrders] = useState([]);
  const [openOrders, setOpenOrders] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [currentPageOrders, setCurrentPageOrders] = useState(1);
  const [currentPageOpenOrders, setCurrentPageOpenOrders] = useState(1);
  const [currentPageTransactions, setCurrentPageTransactions] = useState(1);
  const [currentLedgerPage, setCurrentLedgerPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalLedgerItems, setTotalLedgerItems] = useState(0);
  const [totalLedgerPages, setTotalLedgerPages] = useState(0);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [sortOrderField, setSortOrderField] = useState("time");
  const [sortOrderDirection, setSortOrderDirection] = useState("desc");
  const [sortField, setSortField] = useState("date");
  const [sortDirection, setSortDirection] = useState("desc");

  // Update goldData based on marketData
  const updateGoldData = useCallback((newMarketData) => {
    if (!newMarketData) return;

    setGoldData((prevData) => ({
      ...prevData,
      bid: parseFloat(newMarketData.bid) || null,
      ask: parseFloat(newMarketData.offer || newMarketData.ask) || null,
      high: parseFloat(newMarketData.high) || prevData.high,
      low: parseFloat(newMarketData.low) || prevData.low,
      marketStatus: newMarketData.marketStatus || "TRADEABLE",
      priceUpdateTimestamp: new Date().toISOString(),
    }));
  }, []);

  useEffect(() => {
    updateGoldData(marketData);
  }, [marketData, updateGoldData]);

  // Fallback formatDate function
  const formatDateFallback = (date) => {
    if (!date) return "N/A";
    try {
      return new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Invalid Date";
    }
  };

  useEffect(() => {
    if (userId && adminId) {
      fetchUserData();
    }
  }, [userId, adminId]);

  useEffect(() => {
    if (activeTab === "orders" || activeTab === "open-order") {
      fetchOrders();
      setCurrentPageOrders(1);
      setCurrentPageOpenOrders(1);
    } else if (activeTab === "transactions") {
      fetchTransactionStatements();
      setCurrentPageTransactions(1);
    } else if (activeTab === "ledger") {
      fetchLedgerEntries();
      setCurrentLedgerPage(1);
    }
  }, [activeTab]);

  // Monitor market data errors
  useEffect(() => {
    if (!marketData && activeTab === "open-order") {
      setError("Failed to load market data. Please try refreshing.");
    }
  }, [marketData, activeTab]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.get(`/user-orders/${adminId}/${userId}`);
      if (response.data.status === 200) {
        const allOrders = response.data.data || [];
        setOrders(allOrders);
        setOpenOrders(allOrders.filter((order) => ["OPEN", "PROCESSING"].includes(order.orderStatus)));
        if (allOrders.length === 0) {
          setError("No orders found for this user.");
        }
      } else {
        setError(response.data.message || "Failed to retrieve orders.");
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      setError(error.response?.data?.message || "Failed to load orders. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/user-profile/${adminId}/${userId}`);
      if (response.data.success) {
        const userData = response.data.data;
        const formattedUserData = {
          id: userId,
          accountId: userData.REFMID,
          firstName: userData.firstName?.split(" ")[0] || "",
          lastName: userData.lastName?.split(" ").slice(1).join(" ") || "",
          email: userData.email || "",
          phone: userData.phoneNumber || "",
          address: userData.address
            ? `${userData.address.street || ""}, ${userData.address.city || ""}, ${userData.address.state || ""}, ${userData.address.country || ""}, ${userData.address.zipCode || ""}`
            : "",
          accountNumber: userData.ACCODE || "",
          status: userData.accountStatus || "pending",
          joinDate: userData.joinDate,
          accountBalance: { cash: userData.AMOUNTFC || 0, gold: userData.METAL_WT || 0 },
          tradingPreferences: { 
            riskLevel: userData.Account_Type || "",
            autoTrading: false,
            notificationFrequency: "Daily"
          },
          askSpread: parseFloat(userData.askSpread) || 0,
          bidSpread: parseFloat(userData.bidSpread) || 0,
        };
        console.log("API userData:", userData); // Debug log
        console.log("Formatted userData:", formattedUserData); // Debug log
        setUserData(formattedUserData);
        setFormData(formattedUserData);
      } else {
        throw new Error("Failed to fetch user data");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      setError("Failed to load user data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactionStatements = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.get(`/user-transactions/${adminId}/${userId}`);
      if (response.data.status === 200) {
        setTransactions(response.data.data);
        if (response.data.data.length === 0) {
          setError("No transaction history found for this user.");
        }
      } else {
        setError(response.data.message || "Failed to retrieve transaction history.");
      }
    } catch (error) {
      console.error("Error fetching transaction statements:", error);
      setError(error.response?.data?.message || "Failed to load transaction history. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const fetchLedgerEntries = async () => {
    try {
      setLedgerLoading(true);
      setError(null);
      const params = { adminId, userId, page: currentLedgerPage, limit: itemsPerPage, sortField, sortDirection };
      const response = await axiosInstance.get("/fetch-ledger", { params });
      if (response.data.success && response.data.data) {
        const filteredEntries = response.data.data?.filter((entry) => entry.entryType !== "LP_POSITION");
        setLedgerEntries(filteredEntries);
        setTotalLedgerItems(response.data.pagination.total || 0);
        setTotalLedgerPages(response.data.pagination.pages || 1);
      } else {
        setError(response.data.message || "Failed to retrieve ledger entries.");
      }
    } catch (error) {
      console.error("Error fetching ledger entries:", error);
      setError(error.response?.data?.message || "Failed to load ledger entries. Please try again later.");
    } finally {
      setLedgerLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    setError("");
    setSuccess("");
    try {
      const updateData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phoneNumber: formData.phone,
        address: formData.address
          ? {
              street: formData.address.split(",")[0]?.trim() || null,
              city: formData.address.split(",")[1]?.trim() || null,
              state: formData.address.split(",")[2]?.trim() || null,
              country: formData.address.split(",")[3]?.trim() || null,
              zipCode: formData.address.split(",")[4]?.trim() || null,
            }
          : {},
        accountStatus: formData.status,
        askSpread: parseFloat(formData.askSpread) || 0,
        bidSpread: parseFloat(formData.bidSpread) || 0,
        Account_Type: formData.tradingPreferences?.riskLevel || "LP",
      };
      await axiosInstance.put(`/user-profile/${adminId}/${userId}`, updateData);
      setUserData(formData);
      setIsEditing(false);
      setSuccess("User profile updated successfully");
      fetchUserData();
    } catch (error) {
      console.error("Error updating user data:", error);
      setError("Failed to update user profile. Please try again.");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleCloseOrder = async (orderId) => {
    try {
      const orderToClose = openOrders.find((order) => order._id === orderId);
      const closingPrice = orderToClose
        ? orderToClose.type === "BUY"
          ? goldData.bid
          : goldData.ask
        : goldData.bid;

      const response = await axiosInstance.patch(`/order/${adminId}/${orderId}`, {
        orderStatus: "CLOSED",
        closingDate: new Date().toISOString(),
        closingPrice: closingPrice,
        profit: orderToClose ? orderToClose.rawProfit : 0,
      });

      if (response.data.success) {
        fetchOrders();
      }
    } catch (error) {
      console.error("Error closing order:", error);
      setError("Failed to close order. Please try again.");
    }
  };

  const getStatusBadgeColor = (status) => {
    const statusMap = {
      active: "green",
      inactive: "gray",
      suspended: "red",
      pending: "yellow",
      verified: "blue",
      unverified: "orange",
      not_submitted: "orange",
      completed: "green",
      open: "blue",
      closed: "gray",
      credit: "green",
      debit: "red",
    };
    return statusMap[status?.toLowerCase()] || "gray";
  };

  const mapAccountStatusToDisplay = (status) => {
    const statusMap = { pending: "Pending", active: "Active", inactive: "Inactive", suspended: "Suspended" };
    return statusMap[status] || status;
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
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center">
              <svg className="h-8 w-8 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              User Profile Management
            </h1>
            <p className="text-gray-600">Manage user details, view order history and transaction statements</p>
          </div>
        </div>
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded-lg">
            <p className="text-red-700 flex items-center">
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </p>
          </div>
        )}
        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4 rounded-lg">
            <p className="text-green-700 flex items-center">
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {success}
            </p>
          </div>
        )}
        <div className="mb-6">
          <Tabs activeTab={activeTab} onChange={setActiveTab}>
            <Tab id="profile" label="Profile" />
            <Tab id="orders" label="Order Statements" />
            <Tab id="transactions" label="Transaction History" />
            <Tab id="ledger" label="Ledger Entries" />
            <Tab id="open-order" label="Opening Orders" />
          </Tabs>
        </div>
        <div className="mt-4">
          {activeTab === "profile" && userData && (
            <ProfileTab
              userData={userData}
              isEditing={isEditing}
              formData={formData}
              setFormData={setFormData}
              setIsEditing={setIsEditing}
              handleSubmit={handleSubmit}
              saveLoading={saveLoading}
              getStatusBadgeColor={getStatusBadgeColor}
              mapAccountStatusToDisplay={mapAccountStatusToDisplay}
              formatDate={formatDate || formatDateFallback}
            />
          )}
          {activeTab === "orders" && (
            <OrderStatementsTab
              orders={orders}
              loading={loading}
              orderSearch={orderSearch}
              setOrderSearch={setOrderSearch}
              orderStatusFilter={orderStatusFilter}
              setOrderStatusFilter={setOrderStatusFilter}
              sortOrderField={sortOrderField}
              setSortOrderField={setSortOrderField}
              sortOrderDirection={sortOrderDirection}
              setSortOrderDirection={setSortOrderDirection}
              currentPageOrders={currentPageOrders}
              setCurrentPageOrders={setCurrentPageOrders}
              itemsPerPage={itemsPerPage}
              setItemsPerPage={setItemsPerPage}
              fetchOrders={fetchOrders}
              getStatusBadgeColor={getStatusBadgeColor}
              formatDate={formatDate || formatDateFallback}
            />
          )}
          {activeTab === "open-order" && (
            <OpenOrdersTab
              orders={openOrders}
              setOrders={setOpenOrders}
              loading={loading}
              orderSearch={orderSearch}
              setOrderSearch={setOrderSearch}
              orderStatusFilter={orderStatusFilter}
              setOrderStatusFilter={setOrderStatusFilter}
              sortOrderField={sortOrderField}
              setSortOrderField={setSortOrderField}
              sortOrderDirection={sortOrderDirection}
              setSortOrderDirection={setSortOrderDirection}
              currentPageOpenOrders={currentPageOpenOrders}
              setCurrentPageOpenOrders={setCurrentPageOpenOrders}
              itemsPerPage={itemsPerPage}
              setItemsPerPage={setItemsPerPage}
              fetchOrders={fetchOrders}
              getStatusBadgeColor={getStatusBadgeColor}
              formatDate={formatDate || formatDateFallback}
              handleCloseOrder={handleCloseOrder}
              goldData={goldData}
              refreshData={refreshData}
              axiosInstance={axiosInstance}
              adminId={adminId}
            />
          )}
          {activeTab === "transactions" && (
            <TransactionsTab
              transactions={transactions}
              loading={loading}
              currentPageTransactions={currentPageTransactions}
              setCurrentPageTransactions={setCurrentPageTransactions}
              itemsPerPage={itemsPerPage}
              setItemsPerPage={setItemsPerPage}
              getStatusBadgeColor={getStatusBadgeColor}
              formatDate={formatDate || formatDateFallback}
            />
          )}
          {activeTab === "ledger" && (
            <LedgerTab
              loading={ledgerLoading}
              ledgerEntries={ledgerEntries}
              currentLedgerPage={currentLedgerPage}
              totalLedgerPages={totalLedgerPages}
              totalLedgerItems={totalLedgerItems}
              itemsPerPage={itemsPerPage}
              setItemsPerPage={setItemsPerPage}
              setCurrentLedgerPage={setCurrentLedgerPage}
              formatDate={formatDate || formatDateFallback}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileManagement;