import React from "react";
import { 
  RefreshCw, 
  FileText, 
  ArrowDownUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight 
} from "lucide-react";

const OrdersTab = ({
  loading,
  filteredStatements,
  currentItems,
  resetFilters,
  filters,
  formatDate,
  currentPage,
  setCurrentPage,
  totalPages,
  itemsPerPage,
  setItemsPerPage,
  indexOfFirstItem,
  indexOfLastItem
}) => {
  // Format profit/loss with color
  const formatProfitLoss = (value) => {
    const numValue = parseFloat(value) || 0;
    const color = numValue >= 0 ? "text-green-600" : "text-red-600";
    return (
      <span className={`font-medium ${color} flex items-center`}>
        {numValue >= 0 ? (
          <ArrowUpRight size={16} className="mr-1" />
        ) : (
          <ArrowDownRight size={16} className="mr-1" />
        )}
        ${Math.abs(numValue).toFixed(2)}
      </span>
    );
  };

  // Pagination component
  const Pagination = () => {
    return (
      <div className="flex items-center justify-between bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
        <div className="flex items-center text-sm text-gray-700">
          <span>
            Showing {filteredStatements.length > 0 ? indexOfFirstItem + 1 : 0} to{" "}
            {Math.min(indexOfLastItem, filteredStatements.length)} of {filteredStatements.length} results
          </span>
          <div className="ml-4">
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="rounded border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>
          </div>
        </div>
        
        <div className="flex items-center justify-between sm:justify-end">
          <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ${
                currentPage === 1 ? 'cursor-not-allowed' : 'hover:bg-gray-50'
              }`}
            >
              <span className="sr-only">First</span>
              <ChevronsLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className={`relative inline-flex items-center px-2 py-2 text-gray-400 ${
                currentPage === 1 ? 'cursor-not-allowed' : 'hover:bg-gray-50'
              }`}
            >
              <span className="sr-only">Previous</span>
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 focus:outline-offset-0">
              {currentPage} / {totalPages || 1}
            </span>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages || totalPages === 0}
              className={`relative inline-flex items-center px-2 py-2 text-gray-400 ${
                currentPage === totalPages || totalPages === 0 ? 'cursor-not-allowed' : 'hover:bg-gray-50'
              }`}
            >
              <span className="sr-only">Next</span>
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages || totalPages === 0}
              className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ${
                currentPage === totalPages || totalPages === 0 ? 'cursor-not-allowed' : 'hover:bg-gray-50'
              }`}
            >
              <span className="sr-only">Last</span>
              <ChevronsRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </nav>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-gray-200">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Orders History</h3>
        <div className="flex items-center space-x-2">
          {(filters.dateRange || filters.orderType || filters.searchTerm) && (
            <button
              onClick={resetFilters}
              className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Clear Filters
            </button>
          )}
          <button
            onClick={() => {/* Add refresh function here */}}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <RefreshCw size={16} className="mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="px-4 py-16 sm:px-6 flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-500">Loading order data...</p>
        </div>
      ) : filteredStatements.length === 0 ? (
        <div className="px-4 py-16 sm:px-6 flex flex-col items-center justify-center">
          <FileText size={48} className="text-gray-400 mb-4" />
          <p className="text-gray-500 text-lg mb-2">No orders found</p>
          <p className="text-gray-400 text-sm">
            {filters.dateRange || filters.orderType || filters.searchTerm
              ? "Try adjusting your filters"
              : "No orders have been placed yet"}
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
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
                                  <div className="flex items-center">
                                    Symbol
                                    <button
                                      onClick={() => {
                                        // Implement sorting by symbol
                                      }}
                                      className="ml-1"
                                    >
                                      <ArrowDownUp size={14} className="text-gray-400" />
                                    </button>
                                  </div>
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
                                  Volume
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
                                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                  Open Date
                                </th>
                                <th
                                  scope="col"
                                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                  Close Date
                                </th>
                                <th
                                  scope="col"
                                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                  <div className="flex items-center">
                                    Profit/Loss
                                    <button
                                      onClick={() => {
                                        // Implement sorting by profit
                                      }}
                                      className="ml-1"
                                    >
                                      <ArrowDownUp size={14} className="text-gray-400" />
                                    </button>
                                  </div>
                                </th>
                                <th
                                  scope="col"
                                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                  Status
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {currentItems?.map((statement, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                    {statement.orderNo || statement.positionId || "--"}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {statement.symbol}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm">
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
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                    {statement.volume}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                    {statement.entryPrice?.toFixed(2)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                    {statement.closingPrice?.toFixed(2)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {formatDate(statement.openDate)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {statement.closeDate
                                      ? formatDate(statement.closeDate)
                                      : "--"}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    {formatProfitLoss(statement.profit)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span
                                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        statement.status === "OPEN"
                                          ? "bg-blue-100 text-blue-800"
                                          : statement.status === "CLOSED"
                                          ? "bg-gray-100 text-gray-800"
                                          : "bg-yellow-100 text-yellow-800"
                                      }`}
                                    >
                                      {statement.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
          </div>
          
          {/* Pagination controls */}
          <Pagination />
        </>
      )}
    </div>
  );
};

export default OrdersTab;