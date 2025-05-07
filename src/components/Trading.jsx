import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  ArrowUp,
  ArrowDown,
  RefreshCw,
  PlusCircle,
  Clock,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  User,
} from "lucide-react";
import useMarketData from "../components/marketData";
import TradingViewWidget from "./TradingViewWidget";
import OrderDialog from "./OrderDialog";
import axios from "../api/axios";

export default function Trading() {
  const adminId = localStorage.getItem("adminId");
  const { marketData, refreshData } = useMarketData(["GOLD"]);
  const [goldData, setGoldData] = useState({
    symbol: "GOLD",
    bid: null,
    ask: null,
    direction: null,
    previousBid: null,
    previousAsk: null,
    dailyChange: "0.00",
    dailyChangePercent: "0.00%",
    high: null,
    low: null,
    marketStatus: "LOADING",
    marketOpenTimestamp: null,
    bidChanged: null,
    askChanged: null,
    priceUpdateTimestamp: null,
  });

  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [showTotalProfit, setShowTotalProfit] = useState(false);

  console.log(orders);
  const [tableHeaders, setTableHeaders] = useState([
    { key: "orderNo", label: "Order ID", align: "left" },
    { key: "symbol", label: "Symbol", align: "left" },
    { key: "type", label: "Type", align: "left" },
    { key: "volume", label: "Size", align: "right" },
    { key: "openingPrice", label: "Open Price", align: "right" },
    { key: "currentPrice", label: "Current Price", align: "right" },
    { key: "accountHead", label: "Account Head", align: "left" },
    // { key: "userName", label: "User", align: "left" },
    { key: "openingDate", label: "Open Time", align: "left" },
    { key: "profit", label: "Profit/Loss", align: "right" },
    { key: "actions", label: "Actions", align: "center" },
  ]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const toggleTotalProfit = () => {
    setShowTotalProfit((prevState) => !prevState);
  };

  const calculateTotalProfit = () => {
    if (orders.length === 0) return "0.00";
    const total = orders.reduce((sum, order) => {
      const profitValue =
        order.rawProfit !== undefined
          ? order.rawProfit
          : parseFloat(order.profit.replace(/[^0-9.-]+/g, "")) *
            (order.profit.includes("-") ? -1 : 1);

      return sum + (isNaN(profitValue) ? 0 : profitValue);
    }, 0);

    return total.toFixed(2);
  };

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`/order/${adminId}`);
      if (response.data.success && response.data.data) {
        // Filter orders with status "PROCESSING"
        const processingOrders = response.data.data.filter(
          (order) => order.orderStatus === "PROCESSING"
        );

        // Process orders to include user information
        const processedOrders = processingOrders.map((order) => {
          return {
            ...order,
            profit: order.profit,
            rawProfit: parseFloat(order.profit || 0),
            accountHead: order.user?.ACCOUNT_HEAD || "N/A",
            userName:
              `${order.user?.firstName || ""} ${
                order.user?.lastName || ""
              }`.trim() || "N/A",
            // We'll update the currentPrice and profit in the useEffect for goldData
          };
        });

        setOrders(processedOrders);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  // Handle market data updates more efficiently
  const updateGoldData = useCallback((newMarketData) => {
    if (!newMarketData) return;

    setGoldData((prevData) => {
      const bid = parseFloat(newMarketData.bid);
      const ask = parseFloat(newMarketData.offer || newMarketData.ask);
      const high = parseFloat(newMarketData.high) || prevData.high;
      const low = parseFloat(newMarketData.low) || prevData.low;
      const marketStatus = newMarketData.marketStatus || "TRADEABLE";

      // Determine if bid/ask changed and direction
      const bidChanged =
        prevData.bid !== null && bid !== prevData.bid
          ? bid > prevData.bid
            ? "up"
            : "down"
          : null;

      const askChanged =
        prevData.ask !== null && ask !== prevData.ask
          ? ask > prevData.ask
            ? "up"
            : "down"
          : null;

      const direction = bidChanged || prevData.direction;

      // Calculate daily change based on opening price
      const openPrice =
        parseFloat(newMarketData.openPrice) ||
        prevData.openPrice ||
        (prevData.bid === null ? bid : prevData.bid);

      const dailyChange = bid !== null ? (bid - openPrice).toFixed(2) : "0.00";

      const dailyChangePercent =
        bid !== null && openPrice !== 0
          ? (((bid - openPrice) / openPrice) * 100).toFixed(2) + "%"
          : "0.00%";

      return {
        ...prevData,
        bid,
        ask,
        high,
        low,
        marketStatus,
        marketOpenTimestamp:
          newMarketData.marketOpenTimestamp || prevData.marketOpenTimestamp,
        previousBid: prevData.bid !== null ? prevData.bid : bid,
        previousAsk: prevData.ask !== null ? prevData.ask : ask,
        direction,
        openPrice: prevData.openPrice || openPrice,
        dailyChange,
        dailyChangePercent,
        bidChanged,
        askChanged,
        priceUpdateTimestamp: new Date().toISOString(),
      };
    });
  }, []);

  // Update gold data with real market data when available
  useEffect(() => {
    updateGoldData(marketData);
  }, [marketData, updateGoldData]);

  // Reset price change indicators after a short delay
  useEffect(() => {
    if (goldData.bidChanged || goldData.askChanged) {
      const timer = setTimeout(() => {
        setGoldData((prevData) => ({
          ...prevData,
          bidChanged: null,
          askChanged: null,
        }));
      }, 1000); // Reset after 1 second

      return () => clearTimeout(timer);
    }
  }, [goldData.priceUpdateTimestamp]);

  const TROY_OUNCE_TO_GRAM = 31.103;
  const USD_TO_AED = 3.674;
  const TTB_FACTOR = 116.64;

  useEffect(() => {
    if (goldData.bid !== null && goldData.ask !== null) {
      setOrders((prevOrders) =>
        prevOrders.map((order) => {
          // Use the appropriate price based on order type
          const currentPrice =
            order.type === "BUY" ? goldData.bid : goldData.ask;

          // Convert opening price to AED and TTB
          const openingPriceConverted =
            (parseFloat(order.openingPrice) / TROY_OUNCE_TO_GRAM) *
            USD_TO_AED *
            TTB_FACTOR;

          // Convert current price to AED and TTB
          const currentPriceConverted =
            (currentPrice / TROY_OUNCE_TO_GRAM) * USD_TO_AED * TTB_FACTOR;

          // Calculate price difference based on order type with conversion
          const priceDifference =
            order.type === "BUY"
              ? currentPriceConverted - openingPriceConverted
              : openingPriceConverted - currentPriceConverted;

          // Multiply by volume to get actual profit/loss
          const rawProfit = priceDifference * parseFloat(order.volume);

          // Format for display - now showing as AED
          const formattedProfit =
            (rawProfit >= 0 ? "+" : "-") +
            "AED " +
            Math.abs(rawProfit).toFixed(2);

          return {
            ...order,
            currentPrice: currentPrice.toFixed(2),
            rawProfit: rawProfit, // Store raw value for calculations
            profit: formattedProfit,
          };
        })
      );
    }
  }, [goldData.bid, goldData.ask]);
  // Handler for opening the order dialog
  const handleOpenOrderDialog = () => {
    setIsOrderDialogOpen(true);
  };

  // Handler for closing the order dialog
  const handleCloseOrderDialog = () => {
    setIsOrderDialogOpen(false);
  };

  // Handler for placing new orders
  const handlePlaceOrder = async (orderDetails) => {
    try {
      console.log(orderDetails);
      // Generate unique order number if not provided
      const orderNo = orderDetails.orderNo || `ORD-${Date.now()}`;

      const orderData = {
        orderNo: orderNo,
        type: orderDetails.type,
        volume: parseFloat(orderDetails.volume),
        symbol: orderDetails.symbol,
        price: parseFloat(orderDetails.price).toFixed(2),
        openingPrice: parseFloat(orderDetails.openingPrice).toFixed(2),
        stopLoss: parseFloat(orderDetails.stopLoss || 0),
        takeProfit: parseFloat(orderDetails.takeProfit || 0),
        orderStatus: "PROCESSING",
        openingDate: orderDetails.openingDate || new Date().toISOString(),
        time: orderDetails.timestamp || new Date().toISOString(),
        size: parseFloat(orderDetails.volume),
        profit: orderDetails.profit || "0.00",
        adminId: adminId,
        userId: orderDetails.user,
        comment: orderDetails.comment || "",
        userSpread: orderDetails.userSpread,
      };

      // Send order to the server
      const response = await axios.post(`/create-order/${adminId}`, orderData);

      if (response.data.success) {
        // Refresh orders list to include the new order
        fetchOrders();
        // Close the dialog
        // handleCloseOrderDialog();
      } else {
        console.error("Failed to create order:", response.data.message);
      }
    } catch (error) {
      console.error("Error creating order:", error);
    }
  };

  // Handler for closing an existing order
  const handleCloseOrder = async (orderId) => {
    try {
      // Get the appropriate closing price based on order type
      const orderToClose = orders.find((order) => order._id === orderId);

      const closingPrice = orderToClose
        ? orderToClose.type === "BUY"
          ? goldData.bid
          : goldData.ask
        : goldData.bid;

      // Update order status to "CLOSED" with correct parameters
      const response = await axios.patch(`/order/${adminId}/${orderId}`, {
        orderStatus: "CLOSED",
        closingDate: new Date().toISOString(),
        closingPrice: closingPrice,
        profit: orderToClose ? orderToClose.rawProfit : 0, // Send the raw profit value
      });

      if (response.data.success) {
        // Refresh orders list
        fetchOrders();
      }
    } catch (error) {
      console.error("Error closing order:", error);
    }
  };

  // Format timestamp to readable date/time
  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  // Calculate spread - memoized to avoid recalculation
  const spread = useMemo(() => {
    return goldData.bid !== null && goldData.ask !== null
      ? (goldData.ask - goldData.bid).toFixed(2)
      : "0.00";
  }, [goldData.bid, goldData.ask]);

  // Price display helper functions
  const getBidTextColor = (change) => {
    if (change === "up") return "text-green-500";
    if (change === "down") return "text-red-500";
    return "text-gray-800";
  };

  const getBidBgColor = (change) => {
    if (change === "up") return "bg-green-100";
    if (change === "down") return "bg-red-100";
    return "";
  };

  const getPriceArrow = (change) => {
    if (change === "up") {
      return <ArrowUp size={16} className="text-green-500" />;
    } else if (change === "down") {
      return <ArrowDown size={16} className="text-red-500" />;
    }
    return null;
  };

  // Helper function to get profit/loss color
  const getProfitColor = (profitValue) => {
    if (profitValue === null || profitValue === undefined)
      return "text-gray-600";

    // Check if profitValue is a string or number
    if (typeof profitValue === "string") {
      return profitValue.includes("+") ? "text-green-600" : "text-red-600";
    } else {
      // If it's a number, check if it's positive or negative
      return profitValue >= 0 ? "text-green-600" : "text-red-600";
    }
  };

  return (
    <div className="p-6 h-screen bg-gray-50">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Trading Dashboard</h1>
        <p className="text-gray-600">Live market data and trading interface</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4 h-2/3">
        {/* Left Panel - Market Watch - GOLD Only */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="bg-gradient-to-r from-blue-700 to-blue-500 text-white p-4 flex justify-between items-center">
            <div>
              <h2 className="font-bold text-lg">Market Watch</h2>
              <p className="text-xs opacity-80">
                {new Date().toLocaleTimeString()}
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={refreshData}
                className="p-2 hover:bg-blue-600 rounded-full flex items-center transition-colors"
              >
                <RefreshCw size={18} />
              </button>
            </div>
          </div>
          <div className="p-4">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-yellow-100 rounded-full p-2 mr-3">
                  <DollarSign size={24} className="text-yellow-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">
                    {goldData.symbol}
                  </h3>
                  <span className="text-xs text-gray-500">Gold Spot</span>
                </div>
              </div>
              <div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    goldData.marketStatus === "TRADEABLE"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {goldData.marketStatus}
                </span>
              </div>
            </div>
          </div>

          {/* GOLD Symbol Price Table - Enhanced */}
          <div className="px-2 ">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-600 border-b border-gray-200">
                  <th className="py-2 px-2 text-left">Symbol</th>
                  <th className="py-2 px-2 text-right">Bid</th>
                  <th className="py-2 px-2 text-right">Ask</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  className="hover:bg-yellow-50 cursor-pointer border-b border-gray-100"
                  onClick={handleOpenOrderDialog}
                >
                  <td className="py-3 px-2 font-medium flex items-center">
                    <span
                      className={`mr-1 text-${
                        goldData.direction === "up" ? "green" : "red"
                      }-500`}
                    >
                      {goldData.direction === "up" ? "▲" : "▼"}
                    </span>
                    GOLD
                  </td>
                  <td className="py-3 px-2 text-right">
                    <div className="flex flex-row items-center justify-end">
                      <div className="w-4 h-4 flex items-center justify-center">
                        {getPriceArrow(goldData.bidChanged)}
                      </div>
                      <span
                        className={`text-lg font-bold ${getBidTextColor(
                          goldData.bidChanged
                        )} transition-colors duration-300`}
                      >
                        {goldData.bid !== null
                          ? goldData.bid.toFixed(2)
                          : "Loading..."}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-right">
                    <div className="flex flex-row items-center justify-end">
                      <div className="w-4 h-4 flex items-center justify-center">
                        {getPriceArrow(goldData.askChanged)}
                      </div>
                      <span
                        className={`text-lg font-bold ${getBidTextColor(
                          goldData.askChanged
                        )} transition-colors duration-300`}
                      >
                        {goldData.ask !== null
                          ? goldData.ask.toFixed(2)
                          : "Loading..."}
                      </span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Symbol details section */}
          <div className="p-4">
            {/* Market News Teaser */}
            <div className="border-l-4 mt-4 border-yellow-400 bg-yellow-50 p-3 rounded-r-md shadow-sm">
              <div className="flex items-start">
                <AlertTriangle
                  size={18}
                  className="text-yellow-600 mr-2 mt-1 flex-shrink-0"
                />
                <div>
                  <div className="font-medium text-sm">Market Alert</div>
                  <p className="text-xs text-gray-600">
                    Gold prices volatile ahead of Fed interest rate decision
                    expected later today. Traders anticipate increased market
                    activity.
                  </p>
                </div>
              </div>
              <button className="text-xs text-blue-600 hover:text-blue-800 mt-2 ml-6 font-medium">
                Read more
              </button>
            </div>
          </div>
        </div>

        {/* Middle & Right Panel - Chart */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow overflow-hidden">
          <div className="bg-gradient-to-r from-blue-700 to-blue-500 text-white p-4 flex justify-between items-center">
            <div className="flex items-center">
              <TrendingUp size={20} className="mr-2" />
              <h2 className="font-bold">GOLD Live Chart</h2>
            </div>
            <div className="text-xs">
              <span className="opacity-75">
                Last updated: {formatDate(new Date())}
              </span>
            </div>
          </div>
          <div className="h-[calc(100%-56px)]">
            <TradingViewWidget />
          </div>
        </div>
      </div>

      {/* Bottom Panel - Orders - Enhanced */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="bg-gradient-to-r from-blue-700 to-blue-500 text-white p-4 flex justify-between items-center">
          <div className="flex items-center">
            <h2 className="font-bold">Open Positions</h2>
            <button
              onClick={handleOpenOrderDialog}
              className="ml-4 bg-white/20 hover:bg-white/30 text-white text-xs rounded-full py-1 px-3 flex items-center"
            >
              <PlusCircle size={14} className="mr-1" />
              New Order
            </button>
            <button
              onClick={toggleTotalProfit}
              className="ml-2 bg-white/20 hover:bg-white/30 text-white text-xs rounded-full py-1 px-3 flex items-center"
            >
              {showTotalProfit ? "Hide Total" : "Show Total"}
            </button>
          </div>
          <div className="text-sm flex items-center">
            <div className="bg-white/10 rounded-md px-3 py-1 mr-3 text-xs">
              <span className="opacity-75 mr-1">Balance:</span>
              <span className="font-medium">$3,808.59</span>
            </div>
            <div className="bg-white/10 rounded-md px-3 py-1 mr-3 text-xs">
              <span className="opacity-75 mr-1">Equity:</span>
              <span className="font-medium">$3,816.49</span>
            </div>
            <div className="bg-white/10 rounded-md px-3 py-1 text-xs">
              <span className="opacity-75 mr-1">Margin Level:</span>
              <span className="font-medium">125%</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                {tableHeaders.map((header) => (
                  <th
                    key={header.key}
                    className={`py-3 px-3 text-${header.align} text-xs font-medium text-gray-600 uppercase tracking-wider`}
                  >
                    {header.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.length > 0 ? (
                <>
                  {orders.map((order) => (
                    <tr
                      key={order._id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-3 px-3 whitespace-nowrap text-left font-medium">
                        {order.orderNo}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-left">
                        {order.symbol}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            order.type === "BUY"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {order.type}
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-right">
                        {order.volume}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-right">
                        ${parseFloat(order.price).toFixed(2)}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-right font-medium">
                        ${order.currentPrice}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap text-left">
                        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium">
                          {order.accountHead}
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <Clock size={14} className="mr-1 text-gray-400" />
                          {formatDate(order.openingDate)}
                        </div>
                      </td>
                      <td
                        className={`py-3 px-3 whitespace-nowrap text-right font-medium ${getProfitColor(
                          order.profit
                        )}`}
                      >
                        {order.profit}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-center">
                        <button
                          onClick={() => handleCloseOrder(order._id)}
                          className="bg-red-100 text-red-600 px-3 py-1 rounded hover:bg-red-200 mr-2 text-xs font-medium transition-colors"
                        >
                          Close
                        </button>
                      </td>
                    </tr>
                  ))}

                  {/* Total Profit Row - Only shown when toggled */}
                  {showTotalProfit && (
                    <tr className="bg-gray-100 font-bold border-t-2 border-gray-300">
                      <td colSpan={8} className="py-3 px-3 text-right">
                        Total Profit/Loss:
                      </td>
                      <td
                        className={`py-3 px-3 whitespace-nowrap text-right font-bold ${
                          parseFloat(calculateTotalProfit()) >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {parseFloat(calculateTotalProfit()) >= 0 ? "+" : ""}$
                        {Math.abs(parseFloat(calculateTotalProfit())).toFixed(
                          2
                        )}
                      </td>
                      <td></td>
                    </tr>
                  )}
                </>
              ) : (
                <tr>
                  <td
                    colSpan={tableHeaders.length}
                    className="py-6 text-center text-gray-500"
                  >
                    No open positions found. Click "New Order" to place a trade.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Dialog */}
      <OrderDialog
        isOpen={isOrderDialogOpen}
        onClose={handleCloseOrderDialog}
        marketData={goldData}
        onPlaceOrder={handlePlaceOrder}
      />
    </div>
  );
}
