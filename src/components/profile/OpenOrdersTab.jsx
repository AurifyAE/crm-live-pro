import React, { useEffect } from "react";
import { Spinner } from "./Spinner";
import { Badge } from "./Badge";
import Pagination from "./Pagination";
import { Package, Search, RefreshCw, ArrowDownUp } from "lucide-react";

const OpenOrdersTab = ({
  orders,
  setOrders,
  loading,
  orderSearch,
  setOrderSearch,
  orderStatusFilter,
  setOrderStatusFilter,
  sortOrderField,
  setSortOrderField,
  sortOrderDirection,
  setSortOrderDirection,
  currentPageOpenOrders,
  setCurrentPageOpenOrders,
  itemsPerPage,
  setItemsPerPage,
  fetchOrders,
  getStatusBadgeColor,
  formatDate,
  handleCloseOrder,
  goldData,
  refreshData,
  axiosInstance,
  adminId,
}) => {
  const TROY_OUNCE_TO_GRAM = 31.103;
  const USD_TO_AED = 3.674;
  const TTB_FACTOR = 116.64;

  useEffect(() => {
    if (!goldData || goldData.bid === null || goldData.ask === null) {
      return; // Skip if goldData is undefined or bid/ask are null
    }
    setOrders((prevOrders) =>
      prevOrders.map((order) => {
        const currentPrice = order.type === "BUY" ? goldData.bid : goldData.ask;
        const openingPriceConverted =
          (parseFloat(order.openingPrice) / TROY_OUNCE_TO_GRAM) * USD_TO_AED * TTB_FACTOR;
        const currentPriceConverted =
          (currentPrice / TROY_OUNCE_TO_GRAM) * USD_TO_AED * TTB_FACTOR;
        const priceDifference =
          order.type === "BUY"
            ? currentPriceConverted - openingPriceConverted
            : openingPriceConverted - currentPriceConverted;
        const rawProfit = priceDifference * parseFloat(order.volume);
        const formattedProfit =
          (rawProfit >= 0 ? "+" : "-") + "AED " + Math.abs(rawProfit).toFixed(2);

        return {
          ...order,
          currentPrice: currentPrice.toFixed(2),
          rawProfit: rawProfit,
          profit: formattedProfit,
        };
      })
    );
  }, [goldData, setOrders]);

  const filteredOrders = orders.filter((order) => {
    const searchMatch = orderSearch
      ? order.orderNo?.toString().toLowerCase().includes(orderSearch.toLowerCase()) ||
        order.type?.toLowerCase().includes(orderSearch.toLowerCase()) ||
        order.symbol?.toLowerCase().includes(orderSearch.toLowerCase()) ||
        order.accountHead?.toLowerCase().includes(orderSearch.toLowerCase())
      : true;
    const statusMatch = orderStatusFilter === "all" ? true : order.orderStatus === orderStatusFilter;
    return searchMatch && statusMatch;
  });

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    let compareA = a[sortOrderField] ?? "";
    let compareB = b[sortOrderField] ?? "";
    if (["volume", "openingPrice", "currentPrice", "rawProfit"].includes(sortOrderField)) {
      compareA = parseFloat(compareA) || 0;
      compareB = parseFloat(compareB) || 0;
    } else if (sortOrderField === "time") {
      compareA = new Date(compareA).getTime();
      compareB = new Date(compareB).getTime();
    } else {
      compareA = compareA.toString().toLowerCase();
      compareB = compareB.toString().toLowerCase();
    }
    return sortOrderDirection === "asc" ? (compareA < compareB ? -1 : 1) : (compareA > compareB ? -1 : 1);
  });

  const totalPagesOpenOrders = Math.ceil(sortedOrders.length / itemsPerPage);
  const indexOfLastOpenOrder = currentPageOpenOrders * itemsPerPage;
  const indexOfFirstOpenOrder = indexOfLastOpenOrder - itemsPerPage;
  const currentOpenOrders = sortedOrders.slice(indexOfFirstOpenOrder, indexOfLastOpenOrder);

  const handleOrderSort = (field) => {
    if (field === sortOrderField) {
      setSortOrderDirection(sortOrderDirection === "asc" ? "desc" : "asc");
    } else {
      setSortOrderField(field);
      setSortOrderDirection("asc");
    }
    setCurrentPageOpenOrders(1);
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
        <Package className="h-6 w-6 mr-2 text-blue-600" />
        Open Orders
      </h2>
      <div className="mb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
        <div className="flex flex-1 max-w-md">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search orders..."
              value={orderSearch}
              onChange={(e) => {
                setOrderSearch(e.target.value);
                setCurrentPageOpenOrders(1);
              }}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div className="ml-2">
            <select
              value={orderStatusFilter}
              onChange={(e) => {
                setOrderStatusFilter(e.target.value);
                setCurrentPageOpenOrders(1);
              }}
              className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="all">All Status</option>
              <option value="OPEN">Open</option>
              <option value="PROCESSING">Processing</option>
            </select>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchOrders}
            className="flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Orders
          </button>
          <button
            onClick={refreshData}
            className="flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Market Data
          </button>
        </div>
      </div>
      {loading ? (
        <div className="text-center p-10">
          <Spinner size="lg" />
        </div>
      ) : currentOpenOrders.length > 0 ? (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 bg-white rounded-lg shadow-md">
              <thead className="bg-gray-50">
                <tr>
                  {["orderNo", "symbol", "type", "volume", "openingPrice", "currentPrice",  "time", "rawProfit"].map((field, idx) => (
                    <th
                      key={idx}
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleOrderSort(field)}
                    >
                      <div className="flex items-center">
                        {field === "orderNo" ? "Order ID" :
                         field === "symbol" ? "Symbol" :
                         field === "type" ? "Type" :
                         field === "volume" ? "Size" :
                         field === "openingPrice" ? "Open Price" :
                         field === "currentPrice" ? "Current Price" :
                         field === "time" ? "Open Time" :
                         "Profit/Loss"}
                        {sortOrderField === field && <ArrowDownUp size={14} className="ml-1" />}
                      </div>
                    </th>
                  ))}
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentOpenOrders.map((order, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.orderNo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.symbol || "GOLD"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Badge color={order.type === "BUY" ? "green" : "red"}>{order.type}</Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.volume} TTBAR</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$ {order.openingPrice}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {goldData.bid && order.currentPrice ? `$ ${order.currentPrice}` : "Loading..."}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(order.time)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`font-medium ${order.rawProfit > 0 ? "text-green-600" : order.rawProfit < 0 ? "text-red-600" : "text-gray-500"}`}>
                        {goldData.bid && order.profit ? order.profit : "Loading..."}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <button
                        onClick={() => handleCloseOrder(order._id)}
                        className="bg-red-100 text-red-600 px-3 py-1 rounded hover:bg-red-200 text-xs font-medium transition-colors"
                        disabled={!goldData.bid || !goldData.ask}
                      >
                        Close
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={currentPageOpenOrders}
            totalPages={totalPagesOpenOrders}
            paginate={setCurrentPageOpenOrders}
            itemsPerPage={itemsPerPage}
            setItemsPerPage={setItemsPerPage}
            totalItems={filteredOrders.length}
          />
        </>
      ) : (
        <div className="text-center p-10 bg-white rounded-lg shadow-md">
          <p className="text-gray-500">No open orders found.</p>
        </div>
      )}
    </div>
  );
};

export default OpenOrdersTab;