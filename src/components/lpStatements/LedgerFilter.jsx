// src/components/LpStatements/LedgerFilter.jsx
import React, { useState } from "react";
import { Search, X, ChevronDown, ChevronUp } from "lucide-react";

export default function LedgerFilter({ 
  ledgerFilters, 
  handleLedgerFilterChange, 
  resetLedgerFilters, 
  showFilters, 
  setShowFilters 
}) {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Check if any filter is active
  const isAnyFilterActive = () => {
    const { 
      entryType, entryNature, dateRange, startDate, endDate, 
      minAmount, maxAmount, transactionType, asset, 
      orderType, orderStatus, symbol, positionId, positionStatus,
      searchTerm, entryId, referenceNumber
    } = ledgerFilters;

    return (
      entryType || 
      entryNature || 
      dateRange !== "all" || 
      startDate || 
      endDate || 
      minAmount || 
      maxAmount || 
      transactionType || 
      asset || 
      orderType || 
      orderStatus || 
      symbol || 
      positionId || 
      positionStatus ||
      searchTerm ||
      entryId ||
      referenceNumber
    );
  };

  return (
    <div className="p-4 bg-gray-50 border-b">
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div className="flex items-center mb-4 md:mb-0">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 bg-white rounded-md border border-gray-300 px-3 py-2"
          >
            {showFilters ? "Hide Filters" : "Show Filters"}
            {showFilters ? 
              <ChevronUp className="ml-1" size={16} /> : 
              <ChevronDown className="ml-1" size={16} />
            }
          </button>
          {isAnyFilterActive() && (
            <button
              onClick={resetLedgerFilters}
              className="ml-2 flex items-center text-sm font-medium text-red-600 hover:text-red-800 bg-white rounded-md border border-red-300 px-3 py-2"
            >
              <X size={16} className="mr-1" />
              Reset All
            </button>
          )}
        </div>
        
        {/* Search bar - always visible */}
        <div className="relative flex items-center w-full md:w-64">
          <Search size={18} className="absolute left-3 text-gray-400" />
          <input
            type="text"
            name="searchTerm"
            value={ledgerFilters.searchTerm || ""}
            onChange={handleLedgerFilterChange}
            placeholder="Search entries..."
            className="pl-10 pr-4 py-2 rounded-md border border-gray-300 w-full focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>
      </div>

      {/* Ledger basic filters */}
      {showFilters && (
        <>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Entry Type
              </label>
              <select
                name="entryType"
                value={ledgerFilters.entryType || ""}
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
                value={ledgerFilters.entryNature || ""}
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
                Date Range
              </label>
              <select
                name="dateRange"
                value={ledgerFilters.dateRange || "all"}
                onChange={handleLedgerFilterChange}
                className="rounded-md border border-gray-300 py-2 px-3 w-full text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>
          </div>
          
          {/* Custom date range */}
          {ledgerFilters.dateRange === "custom" && (
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={ledgerFilters.startDate || ""}
                  onChange={handleLedgerFilterChange}
                  className="rounded-md border border-gray-300 py-2 px-3 w-full text-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={ledgerFilters.endDate || ""}
                  onChange={handleLedgerFilterChange}
                  className="rounded-md border border-gray-300 py-2 px-3 w-full text-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          )}
          
          {/* Advanced filters toggle button */}
          <div className="mt-4">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
            >
              {showAdvancedFilters ? "Hide" : "Show"} Advanced Filters
              {showAdvancedFilters ? 
                <ChevronUp className="ml-1" size={16} /> : 
                <ChevronDown className="ml-1" size={16} />
              }
            </button>
          </div>

          {/* Advanced filters */}
          {showAdvancedFilters && (
            <>
              {/* ID and Reference filters */}
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Entry ID
                  </label>
                  <input
                    type="text"
                    name="entryId"
                    value={ledgerFilters.entryId || ""}
                    onChange={handleLedgerFilterChange}
                    placeholder="e.g. ORD-12345-XYZ"
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
                    value={ledgerFilters.referenceNumber || ""}
                    onChange={handleLedgerFilterChange}
                    placeholder="e.g. OR-1234567"
                    className="rounded-md border border-gray-300 py-2 px-3 w-full text-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Amount range filters */}
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Min Amount
                  </label>
                  <input
                    type="number"
                    name="minAmount"
                    value={ledgerFilters.minAmount || ""}
                    onChange={handleLedgerFilterChange}
                    placeholder="0.00"
                    className="rounded-md border border-gray-300 py-2 px-3 w-full text-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Max Amount
                  </label>
                  <input
                    type="number"
                    name="maxAmount"
                    value={ledgerFilters.maxAmount || ""}
                    onChange={handleLedgerFilterChange}
                    placeholder="0.00"
                    className="rounded-md border border-gray-300 py-2 px-3 w-full text-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Transaction specific filters */}
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Transaction Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Transaction Type
                    </label>
                    <select
                      name="transactionType"
                      value={ledgerFilters.transactionType || ""}
                      onChange={handleLedgerFilterChange}
                      className="rounded-md border border-gray-300 py-2 px-3 w-full text-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">All Types</option>
                      <option value="DEPOSIT">Deposit</option>
                      <option value="WITHDRAWAL">Withdrawal</option>
                      <option value="TRANSFER">Transfer</option>
                      <option value="MARGIN">Margin</option>
                      <option value="SETTLEMENT">Settlement</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Asset
                    </label>
                    <select
                      name="asset"
                      value={ledgerFilters.asset || ""}
                      onChange={handleLedgerFilterChange}
                      className="rounded-md border border-gray-300 py-2 px-3 w-full text-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">All Assets</option>
                      <option value="CASH">Cash</option>
                      <option value="GOLD">Gold</option>
                      <option value="SILVER">Silver</option>
                      <option value="BTC">BTC</option>
                      <option value="ETH">ETH</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Order specific filters */}
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Order Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Order Type
                    </label>
                    <select
                      name="orderType"
                      value={ledgerFilters.orderType || ""}
                      onChange={handleLedgerFilterChange}
                      className="rounded-md border border-gray-300 py-2 px-3 w-full text-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">All Types</option>
                      <option value="BUY">Buy</option>
                      <option value="SELL">Sell</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Symbol
                    </label>
                    <input
                      type="text"
                      name="symbol"
                      value={ledgerFilters.symbol || ""}
                      onChange={handleLedgerFilterChange}
                      placeholder="e.g. GOLD, BTC, ETH"
                      className="rounded-md border border-gray-300 py-2 px-3 w-full text-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Order Status
                    </label>
                    <select
                      name="orderStatus"
                      value={ledgerFilters.orderStatus || ""}
                      onChange={handleLedgerFilterChange}
                      className="rounded-md border border-gray-300 py-2 px-3 w-full text-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">All Statuses</option>
                      <option value="OPEN">Open</option>
                      <option value="PROCESSING">Processing</option>
                      <option value="CLOSED">Closed</option>
                      <option value="CANCELLED">Cancelled</option>
                      <option value="REJECTED">Rejected</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* LP Position specific filters */}
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">LP Position Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Position ID
                    </label>
                    <input
                      type="text"
                      name="positionId"
                      value={ledgerFilters.positionId || ""}
                      onChange={handleLedgerFilterChange}
                      placeholder="e.g. OR-1234567"
                      className="rounded-md border border-gray-300 py-2 px-3 w-full text-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Position Status
                    </label>
                    <select
                      name="positionStatus"
                      value={ledgerFilters.positionStatus || ""}
                      onChange={handleLedgerFilterChange}
                      className="rounded-md border border-gray-300 py-2 px-3 w-full text-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">All Statuses</option>
                      <option value="OPEN">Open</option>
                      <option value="CLOSED">Closed</option>
                    </select>
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}