// src/components/LpStatements/ProfitFilter.jsx
import React from "react";

export default function ProfitFilter({ 
  filters, 
  handleFilterChange, 
  resetFilters, 
  showFilters, 
  setShowFilters 
}) {
  return (
    <div className="p-4 bg-gray-50 border-b">
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div className="flex items-center mb-4 md:mb-0">
          <input
            type="text"
            name="id"
            value={filters.id}
            onChange={handleFilterChange}
            placeholder="Search order ID..."
            className="rounded-md border border-gray-300 pl-9 pr-4 py-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm w-full md:w-64"
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="ml-2 flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 bg-white rounded-md border border-gray-300 px-3 py-2"
          >
            Filters
          </button>
          {(filters.type ||
            filters.status ||
            filters.dateRange !== "all" ||
            filters.profitRange !== "all" ||
            filters.minProfit ||
            filters.maxProfit) && (
            <button
              onClick={resetFilters}
              className="ml-2 flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 bg-white rounded-md border border-gray-300 px-3 py-2"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Advanced filters for profit tab */}
      {showFilters && (
        <>
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
                <option value="BUY">Buy</option>
                <option value="SELL">Sell</option>
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
                className="rounded-md border border-gray-300 py-2 px-3 w-full text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="OPEN">Open</option>
                <option value="CLOSED">Closed</option>
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
                Profit Range
              </label>
              <select
                name="profitRange"
                value={filters.profitRange}
                onChange={handleFilterChange}
                className="rounded-md border border-gray-300 py-2 px-3 w-full text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All</option>
                <option value="positive">Profitable Only</option>
                <option value="negative">Loss Only</option>
              </select>
            </div>
          </div>

          {/* Profit-specific filters */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Min Profit ($)
              </label>
              <input
                type="number"
                name="minProfit"
                value={filters.minProfit}
                onChange={handleFilterChange}
                placeholder="Min"
                className="rounded-md border border-gray-300 py-2 px-3 w-full text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Max Profit ($)
              </label>
              <input
                type="number"
                name="maxProfit"
                value={filters.maxProfit}
                onChange={handleFilterChange}
                placeholder="Max"
                className="rounded-md border border-gray-300 py-2 px-3 w-full text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}