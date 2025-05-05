// src/components/LpStatements/LpFundManagement.jsx
import React, { useState } from "react";
import useLpTransactions from "../../hooks/useLpTransactions";
import {
  RefreshCw,
  AlertCircle,
  DollarSign,
  Plus,
  ArrowDownUp,
  XCircle,
  AlertTriangle,
  History,
  Wallet,
} from "lucide-react";

const LpFundManagement = () => {
  const adminId = localStorage.getItem("adminId");
  const [activeTab, setActiveTab] = useState("transactions");
  
  const {
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
    setCurrentTransactionPage,
    setItemsPerPage,
    setTransactionForm,
    setShowTransactionModal,
    getBalanceDisplay,
    handleTransactionFormChange,
    handleTransactionSubmit,
    handleFilterChange,
    resetFilters,
    formatDate,
    getCurrentTransactions,
  } = useLpTransactions(adminId);

  // Get current transactions for pagination
  const currentTransactions = getCurrentTransactions();

  // Tab switching handler
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  return (
    <div className="p-6 h-full w-full bg-gray-50">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-800">LP Fund Management</h1>
        <p className="text-gray-600">Manage LP transactions and balances</p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex -mb-px space-x-8">
          <button
            onClick={() => handleTabChange("transactions")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "transactions"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } flex items-center`}
          >
            <History size={16} className="mr-2" />
            Transaction History
          </button>
          <button
            onClick={() => handleTabChange("management")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "management"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } flex items-center`}
          >
            <Wallet size={16} className="mr-2" />
            Fund Management
          </button>
        </nav>
      </div>

      {/* Transaction List Tab */}
      {activeTab === "transactions" && (
        <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-blue-700 to-blue-500 text-white p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="font-bold text-lg">Transaction History</h2>
                <p className="text-xs opacity-80">View all LP transactions</p>
              </div>
              <div className="flex space-x-2 mt-2 md:mt-0">
                <button
                  onClick={resetFilters}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-md text-sm flex items-center"
                >
                  <RefreshCw size={14} className="mr-1" /> Reset Filters
                </button>
              </div>
            </div>
          </div>

          {/* Filter section */}
          <div className="p-4 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  name="type"
                  value={filters.type}
                  onChange={handleFilterChange}
                  className="w-full rounded-md border border-gray-300 py-1.5 px-3 text-sm focus:ring-blue-500"
                >
                  <option value="">All Types</option>
                  <option value="DEPOSIT">Deposit</option>
                  <option value="WITHDRAWAL">Withdrawal</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Asset
                </label>
                <select
                  name="asset"
                  value={filters.asset}
                  onChange={handleFilterChange}
                  className="w-full rounded-md border border-gray-300 py-1.5 px-3 text-sm focus:ring-blue-500"
                >
                  <option value="">All Assets</option>
                  <option value="CASH">Cash</option>
                  <option value="GOLD">Gold</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  className="w-full rounded-md border border-gray-300 py-1.5 px-3 text-sm focus:ring-blue-500"
                >
                  <option value="">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="FAILED">Failed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date Range
                </label>
                <select
                  name="dateRange"
                  value={filters.dateRange}
                  onChange={handleFilterChange}
                  className="w-full rounded-md border border-gray-300 py-1.5 px-3 text-sm focus:ring-blue-500"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>

              {filters.dateRange === "custom" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      name="startDate"
                      value={filters.startDate}
                      onChange={handleFilterChange}
                      className="w-full rounded-md border border-gray-300 py-1.5 px-3 text-sm focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      name="endDate"
                      value={filters.endDate}
                      onChange={handleFilterChange}
                      className="w-full rounded-md border border-gray-300 py-1.5 px-3 text-sm focus:ring-blue-500"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search
                </label>
                <input
                  type="text"
                  name="searchTerm"
                  value={filters.searchTerm}
                  onChange={handleFilterChange}
                  placeholder="Search transactions..."
                  className="w-full rounded-md border border-gray-300 py-1.5 px-3 text-sm focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Transaction table */}
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
          </div>

          {/* Pagination */}
          {currentTransactions.length > 0 && (
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-sm text-gray-700">
                  Showing{" "}
                  <span className="font-semibold">
                    {(currentTransactionPage - 1) * 10 + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-semibold">
                    {Math.min(currentTransactionPage * 10, totalTransactions)}
                  </span>{" "}
                  of <span className="font-semibold">{totalTransactions}</span>{" "}
                  transactions
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() =>
                    setCurrentTransactionPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentTransactionPage === 1}
                  className={`px-3 py-1 rounded-md ${
                    currentTransactionPage === 1
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Previous
                </button>
                <span className="text-sm text-gray-700">
                  Page {currentTransactionPage} of {totalTransactionPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentTransactionPage((prev) =>
                      Math.min(prev + 1, totalTransactionPages)
                    )
                  }
                  disabled={currentTransactionPage === totalTransactionPages}
                  className={`px-3 py-1 rounded-md ${
                    currentTransactionPage === totalTransactionPages
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Manage transactions section */}
      {activeTab === "management" && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="bg-gradient-to-r from-blue-700 to-blue-500 text-white p-4">
            <h2 className="font-bold">Manage LP Account Balance</h2>
            <p className="text-xs opacity-80">
              Create new cash or gold transactions for your LP account
            </p>
          </div>
          <div className="p-6">
            {/* Balance Display */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-500">
                    Cash Balance
                  </span>
                  <DollarSign size={16} className="text-green-600" />
                </div>
                <div className="text-2xl font-bold text-gray-800">
                  {getBalanceDisplay("CASH")}
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
                  {getBalanceDisplay("GOLD")}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Last updated: {new Date().toLocaleString()}
                </div>
              </div>
            </div>

            {/* Transaction Management */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg border border-blue-100 p-6">
                <div className="flex items-center mb-4">
                  <DollarSign size={24} className="text-green-500 mr-2" />
                  <h3 className="font-bold text-lg text-gray-800">
                    Cash Management
                  </h3>
                </div>
                <p className="text-gray-600 mb-4">
                  Process cash transactions for your LP account.
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
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md text-sm flex items-center justify-center"
                  >
                    <Plus size={16} className="mr-2" /> Deposit Cash
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
                      setShowTransactionModal(true);
                    }}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm flex items-center justify-center"
                  >
                    <ArrowDownUp size={16} className="mr-2" /> Withdraw Cash
                  </button>
                </div>
              </div>

              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg border border-yellow-100 p-6">
                <div className="flex items-center mb-4">
                  <span className="text-yellow-500 text-lg mr-2">●</span>
                  <h3 className="font-bold text-lg text-gray-800">
                    Gold Management
                  </h3>
                </div>
                <p className="text-gray-600 mb-4">
                  Process gold transactions for your LP account.
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
                    className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded-md text-sm flex items-center justify-center"
                  >
                    <Plus size={16} className="mr-2" /> Deposit Gold
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
                      setShowTransactionModal(true);
                    }}
                    className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded-md text-sm flex items-center justify-center"
                  >
                    <ArrowDownUp size={16} className="mr-2" /> Withdraw Gold
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Modal */}
      {showTransactionModal && (
        <div className="fixed inset-0 bg-white/50  flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="bg-gradient-to-r from-blue-700 to-blue-500 text-white p-4 rounded-t-lg flex justify-between items-center">
              <h3 className="font-bold">
                {transactionForm.type === "DEPOSIT"
                  ? "Deposit to LP Account"
                  : "Withdraw from LP Account"}
              </h3>
              <button onClick={() => setShowTransactionModal(false)}>
                <XCircle size={20} />
              </button>
            </div>
            <form onSubmit={handleTransactionSubmit} className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transaction Type
                </label>
                <div className="flex space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="type"
                      value="DEPOSIT"
                      checked={transactionForm.type === "DEPOSIT"}
                      onChange={handleTransactionFormChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-gray-700">Deposit</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="type"
                      value="WITHDRAWAL"
                      checked={transactionForm.type === "WITHDRAWAL"}
                      onChange={handleTransactionFormChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-gray-700">Withdrawal</span>
                  </label>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Asset Type
                </label>
                <div className="flex space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="asset"
                      value="CASH"
                      checked={transactionForm.asset === "CASH"}
                      onChange={handleTransactionFormChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-gray-700">Cash</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="asset"
                      value="GOLD"
                      checked={transactionForm.asset === "GOLD"}
                      onChange={handleTransactionFormChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-gray-700">Gold</span>
                  </label>
                </div>
              </div>

              <div className="mb-4">
                <label
                  htmlFor="amount"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Amount
                </label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={transactionForm.amount}
                  onChange={handleTransactionFormChange}
                  placeholder={`Enter ${transactionForm.asset.toLowerCase()} amount`}
                  className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Current {transactionForm.asset.toLowerCase()} balance:{" "}
                  {getBalanceDisplay(transactionForm.asset)}
                </p>
              </div>

              <div className="mb-4">
                <label
                  htmlFor="reference"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Reference (Optional)
                </label>
                <input
                  type="text"
                  id="reference"
                  name="reference"
                  value={transactionForm.reference}
                  onChange={handleTransactionFormChange}
                  placeholder="Add reference or note"
                  className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                />
              </div>

              {balanceError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm flex items-center">
                  <AlertTriangle size={16} className="mr-2" />
                  {balanceError}
                </div>
              )}

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowTransactionModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Submit Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center">
          <AlertCircle size={20} className="mr-2" />
          <div>
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LpFundManagement;