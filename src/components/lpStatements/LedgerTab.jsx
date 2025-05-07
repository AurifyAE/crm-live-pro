import React, { useState, useEffect } from "react";
import {
  ArrowDownUp,
  ChevronDown,
  ChevronRight,
  X,
  DollarSign,
  Package,
  Layers,
  Info,
  Clock,
  Calendar,
  FileText,
  Download,
  Printer,
  AlertTriangle,
  Filter,
  Coins,
  FileSpreadsheet,
  
} from "lucide-react";
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const LedgerTab = ({
  loading,
  ledgerEntries,
  currentLedgerPage,
  totalLedgerPages,
  itemsPerPage,
  setItemsPerPage,
  setCurrentLedgerPage,
  totalLedgerItems,
  formatDate,
}) => {
  // State for financial totals
  const [totalAEDDebit, setTotalAEDDebit] = useState(0);
  const [totalAEDCredit, setTotalAEDCredit] = useState(0);
  const [netAEDBalance, setNetAEDBalance] = useState(0);

  // Gold specific totals
  const [totalGoldDebit, setTotalGoldDebit] = useState(0);
  const [totalGoldCredit, setTotalGoldCredit] = useState(0);
  const [netGoldBalance, setNetGoldBalance] = useState(0);

  // Filter states
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [filterType, setFilterType] = useState("ALL");
  const [filterAsset, setFilterAsset] = useState("ALL");

  // Calculate filtered page data
  const [filteredPageCount, setFilteredPageCount] = useState(1);
  const [filteredItemCount, setFilteredItemCount] = useState(0);
  
  // Export dropdown state
  const [showExportOptions, setShowExportOptions] = useState(false);

  // Calculate totals based on entries
  useEffect(() => {
    if (ledgerEntries && ledgerEntries.length > 0) {
      // AED calculations
      const aedDebitTotal = ledgerEntries
        .filter(
          (entry) =>
            entry.entryNature === "DEBIT" &&
            (!entry.transactionDetails ||
              entry.transactionDetails.asset !== "GOLD")
        )
        .reduce((sum, entry) => sum + (entry.amount || 0), 0);

      const aedCreditTotal = ledgerEntries
        .filter(
          (entry) =>
            entry.entryNature === "CREDIT" &&
            (!entry.transactionDetails ||
              entry.transactionDetails.asset !== "GOLD")
        )
        .reduce((sum, entry) => sum + (entry.amount || 0), 0);

      // Gold calculations
      const goldDebitTotal = ledgerEntries
        .filter(
          (entry) =>
            entry.entryNature === "DEBIT" &&
            entry.transactionDetails &&
            entry.transactionDetails.asset === "GOLD"
        )
        .reduce((sum, entry) => sum + (entry.amount || 0), 0);

      const goldCreditTotal = ledgerEntries
        .filter(
          (entry) =>
            entry.entryNature === "CREDIT" &&
            entry.transactionDetails &&
            entry.transactionDetails.asset === "GOLD"
        )
        .reduce((sum, entry) => sum + (entry.amount || 0), 0);

      setTotalAEDDebit(aedDebitTotal);
      setTotalAEDCredit(aedCreditTotal);
      setNetAEDBalance(aedCreditTotal - aedDebitTotal);

      setTotalGoldDebit(goldDebitTotal);
      setTotalGoldCredit(goldCreditTotal);
      setNetGoldBalance(goldCreditTotal - goldDebitTotal);

      // Initial filtered entries is all entries
      handleFilterChange("ALL", "ALL");
    }
  }, [ledgerEntries]);

  // Update pagination data whenever filtered entries change
  useEffect(() => {
    if (filteredEntries) {
      setFilteredItemCount(filteredEntries.length);
      setFilteredPageCount(
        Math.ceil(filteredEntries.length / itemsPerPage) || 1
      );

      // Reset to page 1 when filters change
      if (
        currentLedgerPage > Math.ceil(filteredEntries.length / itemsPerPage)
      ) {
        setCurrentLedgerPage(1);
      }
    }
  }, [filteredEntries, itemsPerPage]);

  // Function to filter entries
  const handleFilterChange = (type, asset = filterAsset) => {
    setFilterType(type);
    setFilterAsset(asset);

    let filtered = [...ledgerEntries];

    // Filter by entry nature (DEBIT/CREDIT)
    if (type !== "ALL") {
      filtered = filtered.filter((entry) => entry.entryNature === type);
    }

    // Filter by asset type
    if (asset !== "ALL") {
      if (asset === "GOLD") {
        filtered = filtered.filter(
          (entry) =>
            entry.transactionDetails &&
            entry.transactionDetails.asset === "GOLD"
        );
      } else if (asset === "AED") {
        filtered = filtered.filter(
          (entry) =>
            !entry.transactionDetails ||
            entry.transactionDetails.asset !== "GOLD"
        );
      }
    }

    setFilteredEntries(filtered);
    // Reset to page 1 when filters change
    setCurrentLedgerPage(1);
  };

  // Function to handle pagination
  const paginate = (pageNumber) => {
    if (pageNumber < 1) pageNumber = 1;
    if (pageNumber > filteredPageCount) pageNumber = filteredPageCount;
    setCurrentLedgerPage(pageNumber);
  };

  // Format amount based on asset type
  const formatAmount = (amount, asset) => {
    if (!amount && amount !== 0) return "0.00";

    if (asset === "GOLD") {
      return `${amount.toFixed(3)} Oz`;
    } else {
      return `AED ${amount.toFixed(2)}`;
    }
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
    return entryNature === "CREDIT"
      ? "bg-green-100 text-green-800"
      : "bg-red-100 text-red-800";
  };

  // Get asset icon
  const getAssetIcon = (asset) => {
    if (asset === "GOLD") {
      return <Coins size={16} className="text-yellow-600" />;
    } else {
      return <DollarSign size={16} className="text-blue-600" />;
    }
  };

  // EXPORT FUNCTIONS
  // Function to prepare ledger data for export
  const prepareExportData = () => {
    return filteredEntries.map(entry => {
      const isGoldAsset = entry.transactionDetails && entry.transactionDetails.asset === "GOLD";
      const formattedDate = entry.date ? formatDate(new Date(entry.date)) : "N/A";
      
      return {
        "Entry ID": entry.entryId || "N/A",
        "User": entry.user?.ACCOUNT_HEAD || "LP",
        "Description": entry.description,
        "Reference": entry.referenceNumber || "N/A",
        "Type": entry.entryType,
        "Asset": isGoldAsset ? "GOLD" : "AED",
        "Nature": entry.entryNature,
        "Debit": entry.entryNature === "DEBIT" ? entry.amount : 0,
        "Credit": entry.entryNature === "CREDIT" ? entry.amount : 0,
        "Balance": entry.runningBalance,
        "Date": formattedDate
      };
    });
  };


  // Export to CSV
  const exportToCSV = () => {
    const data = prepareExportData();
    
    // Convert to CSV
    const worksheet = XLSX.utils.json_to_sheet(data);
    const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
    
    // Create download link
    const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Ledger_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setShowExportOptions(false);
  };


  // Print function
  const printLedger = () => {
    // Create a printable version of the ledger
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print the ledger');
      return;
    }
    
    // Get current date and time
    const currentDate = new Date().toLocaleString();
    
    // Prepare styles for printing
    const printStyles = `
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { font-size: 20px; margin-bottom: 10px; }
        .print-date { font-size: 12px; margin-bottom: 20px; color: #666; }
        .summary-table { margin-bottom: 30px; border-collapse: collapse; width: 60%; }
        .summary-table th, .summary-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .summary-table th { background-color: #f2f2f2; }
        
        .ledger-table { width: 100%; border-collapse: collapse; }
        .ledger-table th, .ledger-table td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
        .ledger-table th { background-color: #f2f2f2; }
        .ledger-table tr:nth-child(even) { background-color: #f9f9f9; }
        
        .credit { color: #3cb371; }
        .debit { color: #dc3545; }
        .print-footer { margin-top: 30px; font-size: 12px; text-align: center; }
        @media print {
          .no-print { display: none; }
        }
      </style>
    `;
    
    // Create the HTML content
    const exportData = prepareExportData();
    
    let entriesHTML = '';
    exportData.forEach((entry) => {
      const isGoldAsset = entry.Asset === "GOLD";
      entriesHTML += `
        <tr>
          <td>${entry["Entry ID"]}</td>
          <td>${entry.Description}</td>
          <td>${entry.Reference}</td>
          <td>${entry.Type}</td>
          <td>${entry.Asset}</td>
          <td class="debit">${entry.Debit > 0 ? (isGoldAsset ? `${entry.Debit.toFixed(3)} Oz` : `AED ${entry.Debit.toFixed(2)}`) : '-'}</td>
          <td class="credit">${entry.Credit > 0 ? (isGoldAsset ? `${entry.Credit.toFixed(3)} Oz` : `AED ${entry.Credit.toFixed(2)}`) : '-'}</td>
          <td>${isGoldAsset ? `${entry.Balance.toFixed(3)} Oz` : `AED ${entry.Balance.toFixed(2)}`}</td>
          <td>${entry.Date}</td>
        </tr>
      `;
    });
    
    // Build the full HTML document
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Ledger Report</title>
        ${printStyles}
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 20px;">
          <button onclick="window.print()" style="padding: 10px; background: #4CAF50; color: white; border: none; cursor: pointer;">Print Ledger</button>
          <button onclick="window.close()" style="padding: 10px; background: #f44336; color: white; border: none; cursor: pointer; margin-left: 10px;">Close</button>
        </div>
        
        <h1>Ledger Report</h1>
        <div class="print-date">Generated on: ${currentDate}</div>
        
        <h2>Account Summary</h2>
        <table class="summary-table">
          <tr>
            <th>Category</th>
            <th>AED</th>
            <th>Gold</th>
          </tr>
          <tr>
            <td>Debits</td>
            <td>AED ${totalAEDDebit.toFixed(2)}</td>
            <td>${totalGoldDebit.toFixed(3)} Oz</td>
          </tr>
          <tr>
            <td>Credits</td>
            <td>AED ${totalAEDCredit.toFixed(2)}</td>
            <td>${totalGoldCredit.toFixed(3)} Oz</td>
          </tr>
          <tr>
            <td>Net Balance</td>
            <td>AED ${netAEDBalance.toFixed(2)}</td>
            <td>${netGoldBalance.toFixed(3)} Oz</td>
          </tr>
        </table>
        
        <h2>Ledger Entries</h2>
        <table class="ledger-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Description</th>
              <th>Reference</th>
              <th>Type</th>
              <th>Asset</th>
              <th>Debit</th>
              <th>Credit</th>
              <th>Balance</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            ${entriesHTML}
          </tbody>
        </table>
        
        <div class="print-footer">End of Report</div>
      </body>
      </html>
    `;
    
    // Write to the new window and trigger print
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    setShowExportOptions(false);
  };

  // Expandable Row component
  const ExpandableRow = ({ entry, index }) => {
    const [expanded, setExpanded] = useState(false);

    const toggleExpanded = () => {
      setExpanded(!expanded);
    };

    // Determine if entry is a gold asset
    const isGoldAsset =
      entry.transactionDetails && entry.transactionDetails.asset === "GOLD";

    const formattedDate = entry.date ? formatDate(new Date(entry.date)) : "N/A";

    return (
      <React.Fragment>
        <tr
          className={`border-b border-gray-200 hover:bg-gray-50 ${
            expanded ? "bg-gray-50" : ""
          }`}
        >
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
          <td className="px-4 py-4 whitespace-nowrap">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-900">
                {entry.entryId || "N/A"}
              </span>
              <span className="text-xs text-gray-500">
                {entry.user?.ACCOUNT_HEAD || "LP"}
              </span>
            </div>
          </td>
          <td className="px-4 py-4 whitespace-nowrap">
            <div className="flex flex-col">
              <div className="flex items-center">
                <span className="text-sm text-gray-900">
                  {entry.description}
                </span>
                {isGoldAsset && (
                  <span className="ml-2 bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full flex items-center">
                    <Coins size={12} className="mr-1" />
                    Gold
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-500">
                {entry.referenceNumber}
              </span>
            </div>
          </td>
          <td className="px-4 py-4 whitespace-nowrap">
            <span
              className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getEntryTypeBadgeStyle(
                entry.entryType
              )}`}
            >
              {entry.entryType}
            </span>
          </td>
          <td className="px-4 py-4 whitespace-nowrap text-sm">
            {entry.entryNature === "DEBIT" ? (
              <div className="flex items-center text-red-600 font-medium">
                {formatAmount(entry.amount, isGoldAsset ? "GOLD" : null)}
              </div>
            ) : (
              <div className="text-center">-</div>
            )}
          </td>
          <td className="px-4 py-4 whitespace-nowrap text-sm">
            {entry.entryNature === "CREDIT" ? (
              <div className="flex items-center text-green-600 font-medium">
                {formatAmount(entry.amount, isGoldAsset ? "GOLD" : null)}
              </div>
            ) : (
              <div className="text-center">-</div>
            )}
          </td>
          <td className="px-4 py-4 whitespace-nowrap text-sm">
            <div className="font-medium text-gray-900">
              {formatAmount(entry.runningBalance, isGoldAsset ? "GOLD" : null)}
            </div>
          </td>
          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
            <div className="flex items-center">
              <Clock size={14} className="mr-1" />
              {formattedDate}
            </div>
          </td>
        </tr>
        {expanded && (
          <tr>
            <td
              colSpan="8"
              className="px-4 py-4 bg-gray-50 border-b border-gray-200"
            >
              <div className="rounded-md bg-white p-4 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <h4 className="text-lg font-semibold text-gray-700">
                      Transaction Details
                    </h4>
                    <span
                      className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${getEntryNatureBadgeStyle(
                        entry.entryNature
                      )}`}
                    >
                      {entry.entryNature}
                    </span>
                    {isGoldAsset && (
                      <span className="ml-2 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full flex items-center">
                        <Coins size={12} className="mr-1" />
                        Gold Asset
                      </span>
                    )}
                  </div>
                  <button
                    onClick={toggleExpanded}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-4">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Entry ID</div>
                    <div className="font-medium">{entry.entryId || "N/A"}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Reference</div>
                    <div className="font-medium">
                      {entry.referenceNumber || "N/A"}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">
                      Date & Time
                    </div>
                    <div className="font-medium">{formattedDate}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Amount</div>
                    <div
                      className={`font-medium ${
                        entry.entryNature === "CREDIT"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {formatAmount(entry.amount, isGoldAsset ? "GOLD" : null)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Balance</div>
                    <div className="font-medium">
                      {formatAmount(
                        entry.runningBalance,
                        isGoldAsset ? "GOLD" : null
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">User</div>
                    <div className="font-medium">
                      {entry.user?.ACCOUNT_HEAD || "LP"}
                    </div>
                  </div>
                </div>

                {/* Type-specific details */}
                {entry.entryType === "TRANSACTION" &&
                  entry.transactionDetails && (
                    <div
                      className={`${
                        isGoldAsset ? "bg-yellow-50" : "bg-blue-50"
                      } rounded-md p-4 mb-3`}
                    >
                      <div className="flex items-center mb-2">
                        {isGoldAsset ? (
                          <Coins size={16} className="text-yellow-600 mr-1" />
                        ) : (
                          <DollarSign
                            size={16}
                            className="text-blue-600 mr-1"
                          />
                        )}
                        <h5
                          className={`text-md font-semibold ${
                            isGoldAsset ? "text-yellow-700" : "text-blue-700"
                          }`}
                        >
                          Transaction Details {isGoldAsset && "- Gold Asset"}
                        </h5>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {entry.transactionDetails.type && (
                          <div className="text-sm">
                            <div
                              className={`${
                                isGoldAsset
                                  ? "text-yellow-600"
                                  : "text-blue-600"
                              } text-xs mb-1`}
                            >
                              Type
                            </div>
                            <div className="font-medium">
                              {entry.transactionDetails.type}
                            </div>
                          </div>
                        )}
                        {entry.transactionDetails.asset && (
                          <div className="text-sm">
                            <div
                              className={`${
                                isGoldAsset
                                  ? "text-yellow-600"
                                  : "text-blue-600"
                              } text-xs mb-1`}
                            >
                              Asset
                            </div>
                            <div className="font-medium flex items-center">
                              {getAssetIcon(entry.transactionDetails.asset)}
                              <span className="ml-1">
                                {entry.transactionDetails.asset}
                              </span>
                            </div>
                          </div>
                        )}
                        {entry.transactionDetails.previousBalance !== null && (
                          <div className="text-sm">
                            <div
                              className={`${
                                isGoldAsset
                                  ? "text-yellow-600"
                                  : "text-blue-600"
                              } text-xs mb-1`}
                            >
                              Previous Balance
                            </div>
                            <div className="font-medium">
                              {formatAmount(
                                entry.transactionDetails.previousBalance,
                                entry.transactionDetails.asset === "GOLD"
                                  ? "GOLD"
                                  : null
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

{entry.entryType === "ORDER" && entry.orderDetails && (
                  <div className="bg-green-50 rounded-md p-4 mb-3">
                    <div className="flex items-center mb-2">
                      <Package size={16} className="text-green-600 mr-1" />
                      <h5 className="text-md font-semibold text-green-700">
                        Order Details
                      </h5>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {entry.orderDetails.orderId && (
                        <div className="text-sm">
                          <div className="text-green-600 text-xs mb-1">
                            Order ID
                          </div>
                          <div className="font-medium">
                            {entry.orderDetails.orderId}
                          </div>
                        </div>
                      )}
                      {entry.orderDetails.orderType && (
                        <div className="text-sm">
                          <div className="text-green-600 text-xs mb-1">
                            Order Type
                          </div>
                          <div className="font-medium">
                            {entry.orderDetails.orderType}
                          </div>
                        </div>
                      )}
                      {entry.orderDetails.status && (
                        <div className="text-sm">
                          <div className="text-green-600 text-xs mb-1">
                            Status
                          </div>
                          <div className="font-medium">
                            {entry.orderDetails.status}
                          </div>
                        </div>
                      )}
                      {entry.orderDetails.createdAt && (
                        <div className="text-sm">
                          <div className="text-green-600 text-xs mb-1">
                            Created
                          </div>
                          <div className="font-medium">
                            {formatDate(new Date(entry.orderDetails.createdAt))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {entry.entryType === "LP_POSITION" && entry.positionDetails && (
                  <div className="bg-purple-50 rounded-md p-4 mb-3">
                    <div className="flex items-center mb-2">
                      <Layers size={16} className="text-purple-600 mr-1" />
                      <h5 className="text-md font-semibold text-purple-700">
                        LP Position Details
                      </h5>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {entry.positionDetails.positionId && (
                        <div className="text-sm">
                          <div className="text-purple-600 text-xs mb-1">
                            Position ID
                          </div>
                          <div className="font-medium">
                            {entry.positionDetails.positionId}
                          </div>
                        </div>
                      )}
                      {entry.positionDetails.lpAmount && (
                        <div className="text-sm">
                          <div className="text-purple-600 text-xs mb-1">
                            LP Amount
                          </div>
                          <div className="font-medium">
                            {entry.positionDetails.lpAmount}
                          </div>
                        </div>
                      )}
                      {entry.positionDetails.status && (
                        <div className="text-sm">
                          <div className="text-purple-600 text-xs mb-1">
                            Status
                          </div>
                          <div className="font-medium">
                            {entry.positionDetails.status}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-4 text-sm text-gray-600">
                  <div className="flex items-center mb-2">
                    <Info size={14} className="mr-1" />
                    <div className="font-medium">Notes & Description</div>
                  </div>
                  <p className="pl-5">{entry.description}</p>
                </div>
              </div>
            </td>
          </tr>
        )}
      </React.Fragment>
    );
  };

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="p-4 border-b">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-3 md:mb-0">
            Ledger Entries
          </h2>
          
          {/* Export & Print Buttons */}
          <div className="flex items-center space-x-2 relative">
            <button
              onClick={() => setShowExportOptions(!showExportOptions)}
              className="flex items-center px-3 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
            >
              <Download size={16} className="mr-1" />
              Export
              <ChevronDown size={14} className="ml-1" />
            </button>
            
            {showExportOptions && (
              <div className="absolute right-0 top-10 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                <ul className="py-1">
                 
                  <li>
                    <button
                      onClick={exportToCSV}
                      className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <FileText size={16} className="mr-2 text-blue-600" />
                      Export to CSV
                    </button>
                  </li>
                  
                  <li className="border-t border-gray-200">
                    <button
                      onClick={printLedger}
                      className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Printer size={16} className="mr-2 text-gray-600" />
                      Print Ledger
                    </button>
                  </li>
                </ul>
              </div>
            )}
            
            <button
              onClick={printLedger}
              className="flex items-center px-3 py-2 bg-gray-50 text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
            >
              <Printer size={16} className="mr-1" />
              Print
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* AED Summary */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
            <div className="flex items-center mb-3">
              <DollarSign size={18} className="text-blue-600 mr-2" />
              <h3 className="text-sm font-semibold text-blue-800">AED Summary</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-xs text-blue-600 mb-1">Debits</div>
                <div className="text-red-600 font-semibold">
                  AED {totalAEDDebit.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-xs text-blue-600 mb-1">Credits</div>
                <div className="text-green-600 font-semibold">
                  AED {totalAEDCredit.toFixed(2)}
                </div>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-blue-100">
              <div className="text-xs text-blue-600 mb-1">Net Balance</div>
              <div className={`font-bold text-lg ${netAEDBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                AED {netAEDBalance.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Gold Summary */}
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-100">
            <div className="flex items-center mb-3">
              <Coins size={18} className="text-yellow-600 mr-2" />
              <h3 className="text-sm font-semibold text-yellow-800">Gold Summary</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-xs text-yellow-600 mb-1">Debits</div>
                <div className="text-red-600 font-semibold">
                  {totalGoldDebit.toFixed(3)} Oz
                </div>
              </div>
              <div>
                <div className="text-xs text-yellow-600 mb-1">Credits</div>
                <div className="text-green-600 font-semibold">
                  {totalGoldCredit.toFixed(3)} Oz
                </div>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-yellow-100">
              <div className="text-xs text-yellow-600 mb-1">Net Balance</div>
              <div className={`font-bold text-lg ${netGoldBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {netGoldBalance.toFixed(3)} Oz
              </div>
            </div>
          </div>

          {/* Entries Summary */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
            <div className="flex items-center mb-3">
              <FileText size={18} className="text-gray-600 mr-2" />
              <h3 className="text-sm font-semibold text-gray-800">Entries Summary</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-xs text-gray-600 mb-1">Total Entries</div>
                <div className="text-gray-800 font-semibold">
                  {totalLedgerItems}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-600 mb-1">Filtered</div>
                <div className="text-gray-800 font-semibold">
                  {filteredItemCount}
                </div>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-gray-100">
              <div className="text-xs text-gray-600 mb-1">Showing</div>
              <div className="text-gray-800 font-semibold">
                Page {currentLedgerPage} of {filteredPageCount}
              </div>
            </div>
          </div>

          {/* Filter Card */}
          <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100">
            <div className="flex items-center mb-3">
              <Filter size={18} className="text-indigo-600 mr-2" />
              <h3 className="text-sm font-semibold text-indigo-800">Filters</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-indigo-600 mb-1 block">Entry Type</label>
                <select
                  value={filterType}
                  onChange={(e) => handleFilterChange(e.target.value, filterAsset)}
                  className="w-full text-sm rounded border border-indigo-200 bg-white px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-300"
                >
                  <option value="ALL">All Types</option>
                  <option value="DEBIT">Debits</option>
                  <option value="CREDIT">Credits</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-indigo-600 mb-1 block">Asset Type</label>
                <select
                  value={filterAsset}
                  onChange={(e) => handleFilterChange(filterType, e.target.value)}
                  className="w-full text-sm rounded border border-indigo-200 bg-white px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-300"
                >
                  <option value="ALL">All Assets</option>
                  <option value="AED">AED Only</option>
                  <option value="GOLD">Gold Only</option>
                </select>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-indigo-100">
              <button
                onClick={() => handleFilterChange("ALL", "ALL")}
                className="w-full text-xs text-center py-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded transition-colors"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-8 text-center">
            <div className="animate-spin w-8 h-8 border-t-2 border-b-2 border-blue-500 rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500">Loading ledger entries...</p>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="py-8 text-center border rounded-lg">
            <AlertTriangle size={32} className="mx-auto mb-2 text-yellow-500" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No entries found</h3>
            <p className="text-gray-500">
              No ledger entries match your current filters.
            </p>
            <button
              onClick={() => handleFilterChange("ALL", "ALL")}
              className="mt-4 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-md transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="w-10 px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                  ></th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    <div className="flex items-center">
                      ID / User
                      <button className="ml-1 text-gray-400">
                        <ArrowDownUp size={14} />
                      </button>
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    <div className="flex items-center">
                      Description / Ref
                      <button className="ml-1 text-gray-400">
                        <ArrowDownUp size={14} />
                      </button>
                    </div>
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
                    Debit
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Credit
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    <div className="flex items-center">
                      Balance
                      <button className="ml-1 text-gray-400">
                        <ArrowDownUp size={14} />
                      </button>
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    <div className="flex items-center">
                      Date
                      <button className="ml-1 text-gray-400">
                        <ArrowDownUp size={14} />
                      </button>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEntries
                  .slice(
                    (currentLedgerPage - 1) * itemsPerPage,
                    currentLedgerPage * itemsPerPage
                  )
                  .map((entry, index) => (
                    <ExpandableRow key={entry.entryId || index} entry={entry} index={index} />
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        <div className="border-t border-gray-200 px-4 py-3 flex items-center justify-between">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => paginate(currentLedgerPage - 1)}
              disabled={currentLedgerPage === 1}
              className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                currentLedgerPage === 1
                  ? "text-gray-300 bg-gray-50"
                  : "text-gray-700 bg-white hover:bg-gray-50"
              }`}
            >
              Previous
            </button>
            <button
              onClick={() => paginate(currentLedgerPage + 1)}
              disabled={currentLedgerPage === filteredPageCount}
              className={`ml-3 relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                currentLedgerPage === filteredPageCount
                  ? "text-gray-300 bg-gray-50"
                  : "text-gray-700 bg-white hover:bg-gray-50"
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
                  {filteredEntries.length > 0
                    ? (currentLedgerPage - 1) * itemsPerPage + 1
                    : 0}
                </span>{" "}
                to{" "}
                <span className="font-medium">
                  {Math.min(
                    currentLedgerPage * itemsPerPage,
                    filteredEntries.length
                  )}
                </span>{" "}
                of <span className="font-medium">{filteredEntries.length}</span>{" "}
                results
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div>
                <label className="text-sm text-gray-600 mr-2">Show:</label>
                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="text-sm border-gray-300 rounded py-1 px-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
              <nav
                className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                aria-label="Pagination"
              >
                <button
                  onClick={() => paginate(1)}
                  disabled={currentLedgerPage === 1}
                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md border text-sm font-medium ${
                    currentLedgerPage === 1
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <span className="sr-only">First</span>
                  <svg
                    className="h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => paginate(currentLedgerPage - 1)}
                  disabled={currentLedgerPage === 1}
                  className={`relative inline-flex items-center px-2 py-2 border text-sm font-medium ${
                    currentLedgerPage === 1
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <span className="sr-only">Previous</span>
                  <svg
                    className="h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>

                {/* Page numbers */}
                {Array.from(
                  { length: Math.min(5, filteredPageCount) },
                  (_, i) => {
                    let pageNum;
                    if (filteredPageCount <= 5) {
                      pageNum = i + 1;
                    } else if (currentLedgerPage <= 3) {
                      pageNum = i + 1;
                    } else if (
                      currentLedgerPage >= filteredPageCount - 2
                    ) {
                      pageNum = filteredPageCount - 4 + i;
                    } else {
                      pageNum = currentLedgerPage - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => paginate(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentLedgerPage === pageNum
                            ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                            : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                )}

                <button
                  onClick={() => paginate(currentLedgerPage + 1)}
                  disabled={currentLedgerPage === filteredPageCount}
                  className={`relative inline-flex items-center px-2 py-2 border text-sm font-medium ${
                    currentLedgerPage === filteredPageCount
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <span className="sr-only">Next</span>
                  <svg
                    className="h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => paginate(filteredPageCount)}
                  disabled={currentLedgerPage === filteredPageCount}
                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md border text-sm font-medium ${
                    currentLedgerPage === filteredPageCount
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <span className="sr-only">Last</span>
                  <svg
                    className="h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LedgerTab;