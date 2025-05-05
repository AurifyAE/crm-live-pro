// src/components/LpStatements/LedgerTab.jsx
import React, { useState } from "react";
import { 
  ArrowDownUp, 
  AlertTriangle, 
  ChevronDown, 
  ChevronRight, 
  X, 
  DollarSign, 
  Package, 
  Layers, 
  Info, 
  Clock, 
  Settings 
} from "lucide-react";

const LedgerTab = ({ 
  loading, 
  ledgerEntries, 
  currentLedgerPage, 
  totalLedgerPages, 
  itemsPerPage, 
  setItemsPerPage, 
  setCurrentLedgerPage, 
  totalLedgerItems, 
  formatDate 
}) => {

  // Function to handle pagination
  const paginate = (pageNumber) => {
    setCurrentLedgerPage(pageNumber);
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
    lastItemIndex 
  }) => {
    return (
      <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
        <div className="flex-1 flex justify-between sm:hidden">
          <button
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white ${
              currentPage === 1 ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"
            }`}
          >
            Previous
          </button>
          <button
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white ${
              currentPage === totalPages ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"
            }`}
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing{" "}
              <span className="font-medium">
                {totalItems === 0 ? 0 : firstItemIndex + 1}
              </span>{" "}
              to{" "}
              <span className="font-medium">
                {Math.min(lastItemIndex, totalItems)}
              </span>{" "}
              of <span className="font-medium">{totalItems}</span> results
            </p>
          </div>
          <div className="flex items-center">
            <div className="mr-4">
              <label htmlFor="itemsPerPage" className="text-sm text-gray-600 mr-2">
                Show:
              </label>
              <select
                id="itemsPerPage"
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="rounded-md border border-gray-300 py-1 px-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
              <button
                onClick={() => paginate(1)}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 ${
                  currentPage === 1 ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"
                }`}
              >
                <span className="sr-only">First</span>
                &laquo;
              </button>
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 ${
                  currentPage === 1 ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"
                }`}
              >
                <span className="sr-only">Previous</span>
                &lsaquo;
              </button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                // Calculate start page
                let startPage = Math.max(1, currentPage - 2);
                
                // Adjust startPage if we're near the end
                if (currentPage > totalPages - 2) {
                  startPage = Math.max(1, totalPages - 4);
                }
                
                const page = startPage + i;
                
                // Only render buttons for valid page numbers
                if (page <= totalPages) {
                  return (
                    <button
                      key={page}
                      onClick={() => paginate(page)}
                      className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium ${
                        currentPage === page
                          ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                          : "bg-white text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </button>
                  );
                }
                return null;
              })}
              
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 ${
                  currentPage === totalPages ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"
                }`}
              >
                <span className="sr-only">Next</span>
                &rsaquo;
              </button>
              <button
                onClick={() => paginate(totalPages)}
                disabled={currentPage === totalPages}
                className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 ${
                  currentPage === totalPages ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"
                }`}
              >
                <span className="sr-only">Last</span>
                &raquo;
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  };

  // Expandable Row component
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
            {entry.user?.ACCOUNT_HEAD || "LP"}
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
              onClick={toggleExpanded}
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

  return (
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
            ledgerEntries.map((entry, index) => (
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
                    Try changing your filters or check again later
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
          currentPage={currentLedgerPage}
          totalPages={totalLedgerPages}
          paginate={paginate}
          itemsPerPage={itemsPerPage}
          setItemsPerPage={setItemsPerPage}
          totalItems={totalLedgerItems}
          firstItemIndex={(currentLedgerPage - 1) * itemsPerPage}
          lastItemIndex={currentLedgerPage * itemsPerPage}
        />
      )}
    </div>
  );
};

export default LedgerTab;