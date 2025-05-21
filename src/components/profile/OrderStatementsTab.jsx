import React from "react";
import { Spinner } from "./Spinner";
import { Badge } from "./Badge";
import Pagination from "./Pagination";
import { FileText, Search, RefreshCw, ArrowDownUp } from "lucide-react";

const OrderStatementsTab = ({
  orders,
  loading,
  orderSearch,
  setOrderSearch,
  orderStatusFilter,
  setOrderStatusFilter,
  sortOrderField,
  setSortOrderField,
  sortOrderDirection,
  setSortOrderDirection,
  currentPageOrders,
  setCurrentPageOrders,
  itemsPerPage,
  setItemsPerPage,
  fetchOrders,
  getStatusBadgeColor,
  formatDate,
}) => {
  const filteredOrders = orders.filter(order => {
    const searchMatch = orderSearch
      ? order.orderNo?.toString().toLowerCase().includes(orderSearch.toLowerCase()) ||
        order.type?.toLowerCase().includes(orderSearch.toLowerCase())
      : true;
    const statusMatch = orderStatusFilter === "all" ? true : order.orderStatus === orderStatusFilter;
    return searchMatch && statusMatch;
  });

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    let compareA = a[sortOrderField], compareB = b[sortOrderField];
    if (["volume", "openingPrice", "closingPrice", "profit"].includes(sortOrderField)) {
      compareA = parseFloat(compareA) || 0;
      compareB = parseFloat(compareB) || 0;
    } else if (sortOrderField === "time") {
      compareA = new Date(compareA).getTime();
      compareB = new Date(compareB).getTime();
    }
    return sortOrderDirection === "asc" ? compareA - compareB : compareB - compareA;
  });

  const totalPagesOrders = Math.ceil(sortedOrders.length / itemsPerPage);
  const indexOfLastOrder = currentPageOrders * itemsPerPage;
  const indexOfFirstOrder = indexOfLastOrder - itemsPerPage;
  const currentOrders = sortedOrders.slice(indexOfFirstOrder, indexOfLastOrder);

  const handleOrderSort = (field) => {
    if (field === sortOrderField) {
      setSortOrderDirection(sortOrderDirection === "asc" ? "desc" : "asc");
    } else {
      setSortOrderField(field);
      setSortOrderDirection("asc");
    }
    setCurrentPageOrders(1);
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
        <FileText className="h-6 w-6 mr-2 text-blue-600" />
        Order Statements
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
              onChange={(e) => { setOrderSearch(e.target.value); setCurrentPageOrders(1); }}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div className="ml-2">
            <select
              value={orderStatusFilter}
              onChange={(e) => { setOrderStatusFilter(e.target.value); setCurrentPageOrders(1); }}
              className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="all">All Status</option>
              <option value="OPEN">Open</option>
              <option value="PROCESSING">Processing</option>
              <option value="CLOSED">Closed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>
        <button
          onClick={fetchOrders}
          className="flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>
      {loading ? (
        <div className="text-center p-10">
          <Spinner size="lg" />
        </div>
      ) : currentOrders.length > 0 ? (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 bg-white rounded-lg shadow-md">
              <thead className="bg-gray-50">
                <tr>
                  {["orderNo", "type", "volume", "openingPrice", "closingPrice", "profit", "orderStatus", "time"].map((field, idx) => (
                    <th
                      key={idx}
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleOrderSort(field)}
                    >
                      <div className="flex items-center">
                        {field === "orderNo" ? "Order ID" : field === "volume" ? "Size" : field === "openingPrice" ? "Open Price" : field === "closingPrice" ? "Close Price" : field === "profit" ? "Profit/Loss" : field === "orderStatus" ? "Status" : "Date"}
                        {sortOrderField === field && <ArrowDownUp size={14} className="ml-1" />}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentOrders.map((order, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.orderNo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Badge color={order.type === "BUY" ? "green" : "red"}>{order.type}</Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.volume} oz</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$ {order?.openingPrice}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order?.closingPrice ? `$${order?.closingPrice}` : "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`font-medium ${order.profit > 0 ? "text-green-600" : order.profit < 0 ? "text-red-600" : "text-gray-500"}`}>
                        {order.profit ? order.profit.toFixed(2) : "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Badge color={getStatusBadgeColor(order.orderStatus)}>{order.orderStatus}</Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(order.time)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={currentPageOrders}
            totalPages={totalPagesOrders}
            paginate={setCurrentPageOrders}
            itemsPerPage={itemsPerPage}
            setItemsPerPage={setItemsPerPage}
            totalItems={filteredOrders.length}
          />
        </>
      ) : (
        <div className="text-center p-10 bg-white rounded-lg shadow-md">
          <p className="text-gray-500">No order statements found.</p>
        </div>
      )}
    </div>
  );
};

export default OrderStatementsTab;