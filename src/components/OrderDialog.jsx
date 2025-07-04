import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  ReferenceLine,
  AreaChart,
} from "recharts";
import {
  AlertCircle,
  Check,
  User,
  AlertTriangle,
  Info,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import axiosInstance from "../api/axios";
import Sound from "../assets/sound.mp3";

const OrderDialog = ({ isOpen, onClose, marketData, onPlaceOrder }) => {
  const [volume, setVolume] = useState("1.0");
  const [stopLoss, setStopLoss] = useState("0.00");
  const [takeProfit, setTakeProfit] = useState("0.00");
  const [comment, setComment] = useState("");
  const [chartData, setChartData] = useState([]);
  const [timeframe, setTimeframe] = useState("1D");
  const [chartType, setChartType] = useState("area");
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  const [userOpenOrders, setUserOpenOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const chartRef = React.useRef(null);
  const [showIndicators, setShowIndicators] = useState(true);
  const [showInsufficientBalanceAlert, setShowInsufficientBalanceAlert] =
    useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showBalanceInfo, setShowBalanceInfo] = useState(false);

  const buySoundRef = useRef(null);
  const sellSoundRef = useRef(null);

  const bidPrice = marketData?.bid ? marketData.bid.toFixed(2) : "3283.21";
  const askPrice = marketData?.ask ? marketData.ask.toFixed(2) : "3283.51";

  const selectedUserData = useMemo(() => {
    return users.find((user) => user._id === selectedUser) || {};
  }, [selectedUser, users]);

  const userSpread = selectedUserData.userSpread || 0;

  const MINIMUM_BALANCE_PERCENTAGE = 20; // 20%
  const BASE_AMOUNT_PER_VOLUME = 500; // 500 per volume unit

  // Update volume input handler to allow decimals with one decimal place
  const handleVolumeChange = (e) => {
    let value = e.target.value;
    // Allow numbers with up to one decimal place
    if (value === "" || /^\d*\.?\d{0,1}$/.test(value)) {
      setVolume(value);
    }
  };

  // Fetch users data when component mounts
  useEffect(() => {
    if (!isOpen) return;

    const fetchUsers = async () => {
      try {
        setLoading(true);
        const adminId = localStorage.getItem("adminId");
        const response = await axiosInstance.get(`/fetch-data/${adminId}`);
        if (response.data && response.data.data) {
          setUsers(response.data.data);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching users:", error);
        setLoading(false);
      }
    };

    fetchUsers();
  }, [isOpen]);

  // Fetch user's open orders when user is selected
  useEffect(() => {
    if (!selectedUser) {
      setUserOpenOrders([]);
      return;
    }

    const fetchUserOrders = async () => {
      try {
        setLoadingOrders(true);
        const adminId = localStorage.getItem("adminId");
        const response = await axiosInstance.get(
          `/user-orders/${adminId}/${selectedUser}`
        );
        if (response.data && response.data.data) {
          const openOrders = response.data.data.filter(
            (order) => order.orderStatus !== "CLOSED"
          );
          setUserOpenOrders(openOrders);
        }
        setLoadingOrders(false);
      } catch (error) {
        console.error("Error fetching user orders:", error);
        setLoadingOrders(false);
      }
    };

    fetchUserOrders();
  }, [selectedUser]);

  // Generate chart data
  useEffect(() => {
    if (!isOpen) return;

    const generateData = () => {
      const basePrice = parseFloat(bidPrice) || 3270;
      const points =
        timeframe === "1H"
          ? 60
          : timeframe === "1D"
          ? 96
          : timeframe === "1W"
          ? 168
          : 120;
      const volatility =
        timeframe === "1H"
          ? 0.4
          : timeframe === "1D"
          ? 0.8
          : timeframe === "1W"
          ? 1.5
          : 2.5;
      const spread = parseFloat(askPrice) - parseFloat(bidPrice);

      let data = [];
      let currentBid = basePrice;
      let currentAsk = basePrice + spread;
      let timestamp = new Date();

      let trend = Math.random() > 0.5 ? 0.2 : -0.2;
      let trendChangeProbability =
        timeframe === "1H" ? 0.1 : timeframe === "1D" ? 0.05 : 0.03;

      for (let i = points; i >= 0; i--) {
        let pointTime = new Date(timestamp);
        if (timeframe === "1H") {
          pointTime.setMinutes(pointTime.getMinutes() - i);
        } else if (timeframe === "1D") {
          pointTime.setMinutes(pointTime.getMinutes() - i * 15);
        } else if (timeframe === "1W") {
          pointTime.setHours(pointTime.getHours() - i);
        } else {
          pointTime.setHours(pointTime.getHours() - i * 6);
        }

        const random = (Math.random() - 0.5) * volatility;
        const trendFactor = Math.sin(i / (points / 6)) * (volatility / 2);

        currentBid += random + trend * (volatility / 4) + trendFactor;
        currentAsk = currentBid + spread + Math.random() * 0.1;

        if (Math.random() < trendChangeProbability) {
          trend = -trend;
        }

        if (timeframe === "1D") {
          const hour = pointTime.getHours();
          if (hour === 9 || hour === 16) {
            currentBid += (Math.random() - 0.5) * volatility * 1.5;
          }
        }

        let ma20 = null;
        if (i >= 20 && data.length >= 20) {
          let sum = 0;
          for (let j = 0; j < 20; j++) {
            sum += data[data.length - 1 - j].bid;
          }
          ma20 = sum / 20;
        }

        const rsi = 30 + Math.random() * 40;
        const macd = (Math.random() - 0.5) * 0.5;
        const macdSignal = macd + (Math.random() - 0.5) * 0.2;

        const open =
          i === points ? currentBid : data[data.length - 1]?.bid || currentBid;
        const close = currentBid;
        const high = Math.max(open, close) + Math.random() * (volatility / 2);
        const low = Math.min(open, close) - Math.random() * (volatility / 2);

        data.push({
          time: pointTime.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }),
          date: pointTime.toLocaleDateString(),
          timestamp: pointTime.getTime(),
          bid: currentBid,
          ask: currentAsk,
          ma20: ma20,
          volume: Math.floor(Math.random() * 100) + 20,
          rsi: rsi,
          macd: macd,
          macdSignal: macdSignal,
          open: open,
          close: close,
          high: high,
          low: low,
        });
      }

      if (data.length > 0) {
        data[data.length - 1].bid = parseFloat(bidPrice);
        data[data.length - 1].ask = parseFloat(askPrice);
      }

      setChartData(data);
    };

    generateData();
  }, [bidPrice, askPrice, timeframe, isOpen]);

  const generateOrderNo = () => {
    const timestamp = Date.now().toString();
    const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `OR-${timestamp.substring(timestamp.length - 7)}`;
  };

  const calculateProfit = (orderType, volume) => {
    const volumeValue = parseFloat(volume);
    const spreadValue = parseFloat(userSpread);
    return (volumeValue * spreadValue).toFixed(2);
  };

  const calculateTotalOpenOrdersVolume = () => {
    return userOpenOrders.reduce((total, order) => {
      return total + (parseFloat(order.volume) || 0);
    }, 0);
  };

  const checkSufficientBalance = (price, volumeInput) => {
    if (!selectedUserData || !selectedUserData.AMOUNTFC) {
      setErrorMessage("User account information not available");
      return false;
    }

    const volume = parseFloat(volumeInput) || 0;
    if (volume <= 0) {
      setErrorMessage("Volume must be at least 0.1");
      return false;
    }

    const userBalance = parseFloat(selectedUserData.AMOUNTFC);
    const baseAmount = volume * BASE_AMOUNT_PER_VOLUME;
    const marginRequirement = baseAmount * (MINIMUM_BALANCE_PERCENTAGE / 100);
    const totalRequiredAmount = baseAmount + marginRequirement;

    const existingVolume = calculateTotalOpenOrdersVolume();
    const existingOrdersAmount = existingVolume * BASE_AMOUNT_PER_VOLUME;
    const existingOrdersMargin =
      existingOrdersAmount * (MINIMUM_BALANCE_PERCENTAGE / 100);
    const totalNeededAmount =
      totalRequiredAmount + existingOrdersAmount + existingOrdersMargin;

    if (userBalance < totalNeededAmount) {
      const maxAllowedVolume = Math.floor(
        (userBalance - existingOrdersAmount - existingOrdersMargin) /
          (BASE_AMOUNT_PER_VOLUME * (1 + MINIMUM_BALANCE_PERCENTAGE / 100)) * 10
      ) / 10;

      setErrorMessage(
        `Insufficient balance for this trade. 
        Required amount: $${totalRequiredAmount.toFixed(2)} for new trade + $${(
          existingOrdersAmount + existingOrdersMargin
        ).toFixed(2)} for existing orders.
        Available balance: $${userBalance.toFixed(2)}.
        Your current open orders volume: ${existingVolume.toFixed(1)} units.
        Maximum new volume allowed: ${Math.max(0, maxAllowedVolume).toFixed(1)}`
      );
      return false;
    }

    return true;
  };

  const handleBuy = () => {
    if (!checkSufficientBalance(bidPrice, volume)) {
      setShowInsufficientBalanceAlert(true);
      return;
    }

    if (buySoundRef.current) {
      buySoundRef.current.play().catch((error) => {
        console.warn("Audio play failed:", error);
      });
    }
    const marginPercentage = parseFloat(selectedUserData.margin || 5);
    const volumeValue = parseFloat(volume);
    const baseAmount = volumeValue * BASE_AMOUNT_PER_VOLUME;
    const marginRequirement = baseAmount * (MINIMUM_BALANCE_PERCENTAGE / 100);

    const tradeDetails = calculateTradeDetails();
    const totalNeededAmount = tradeDetails
      ? tradeDetails.totalNeededAmount
      : (baseAmount + marginRequirement).toFixed(2);

    const orderNo = generateOrderNo();
    const profit = calculateProfit("BUY", volume);
    const orderData = {
      type: "BUY",
      price: bidPrice,
      openingPrice: bidPrice,
      openingDate: new Date(),
      volume: volumeValue,
      stopLoss: parseFloat(stopLoss),
      takeProfit: parseFloat(takeProfit),
      comment,
      user: selectedUser,
      margin: marginRequirement.toFixed(2),
      marginPercentage,
      userSpread,
      profit,
      timestamp: new Date().toISOString(),
      orderStatus: "PROCESSING",
      symbol: "GOLD",
      orderNo: orderNo,
      baseAmount: baseAmount,
      totalNeededAmount: totalNeededAmount,
    };

    onPlaceOrder(orderData);
    setOrderDetails({
      orderNo: orderNo,
      type: "BUY",
      price: bidPrice,
      volume: volumeValue,
      symbol: "GOLD",
      margin: marginRequirement.toFixed(2),
      baseAmount: baseAmount,
      totalAmount: (baseAmount + marginRequirement).toFixed(2),
      totalNeededAmount: totalNeededAmount,
    });

    setShowConfirmation(true);
  };

  const handleSell = () => {
    if (!checkSufficientBalance(askPrice, volume)) {
      setShowInsufficientBalanceAlert(true);
      return;
    }

    if (sellSoundRef.current) {
      sellSoundRef.current.play().catch((error) => {
        console.warn("Audio play failed:", error);
      });
    }
    const marginPercentage = parseFloat(selectedUserData.margin || 5);
    const volumeValue = parseFloat(volume);
    const baseAmount = volumeValue * BASE_AMOUNT_PER_VOLUME;
    const marginRequirement = baseAmount * (MINIMUM_BALANCE_PERCENTAGE / 100);

    const tradeDetails = calculateTradeDetails();
    const totalNeededAmount = tradeDetails
      ? tradeDetails.totalNeededAmount
      : (baseAmount + marginRequirement).toFixed(2);

    const orderNo = generateOrderNo();
    const profit = calculateProfit("SELL", volume);
    const orderData = {
      type: "SELL",
      price: askPrice,
      openingPrice: askPrice,
      openingDate: new Date(),
      volume: volumeValue,
      stopLoss: parseFloat(stopLoss),
      takeProfit: parseFloat(takeProfit),
      comment,
      userSpread,
      profit,
      margin: marginRequirement.toFixed(2),
      marginPercentage,
      user: selectedUser,
      timestamp: new Date().toISOString(),
      orderStatus: "PROCESSING",
      symbol: "GOLD",
      orderNo: orderNo,
      baseAmount: baseAmount,
      totalNeededAmount: totalNeededAmount,
    };

    onPlaceOrder(orderData);
    setOrderDetails({
      orderNo: orderNo,
      type: "SELL",
      price: askPrice,
      volume: volumeValue,
      symbol: "GOLD",
      margin: marginRequirement.toFixed(2),
      baseAmount: baseAmount,
      totalAmount: (baseAmount + marginRequirement).toFixed(2),
      totalNeededAmount: totalNeededAmount,
    });

    setShowConfirmation(true);
  };

  const handleConfirmationClose = () => {
    setShowConfirmation(false);
    onClose();
  };

  const handleInsufficientBalanceAlertClose = () => {
    setShowInsufficientBalanceAlert(false);
  };

  const handleIncrement = () => {
    const currentVolume = parseFloat(volume) || 0;
    setVolume((currentVolume + 0.1).toFixed(1));
  };

  const handleDecrement = () => {
    const currentVolume = parseFloat(volume) || 0;
    setVolume(Math.max(0.1, (currentVolume - 0.1)).toFixed(1));
  };

  const calculateOptimalLevels = (type) => {
    const basePrice =
      type === "BUY" ? parseFloat(askPrice) : parseFloat(bidPrice);
    const volatility = parseFloat(askPrice) - parseFloat(bidPrice) * 10;

    if (type === "BUY") {
      setStopLoss((basePrice - volatility * 2).toFixed(2));
      setTakeProfit((basePrice + volatility * 3).toFixed(2));
    } else {
      setStopLoss((basePrice + volatility * 2).toFixed(2));
      setTakeProfit((basePrice - volatility * 3).toFixed(2));
    }
  };

  const handleAdjustVolume = () => {
    if (selectedUserData && selectedUserData.AMOUNTFC) {
      const userBalance = parseFloat(selectedUserData.AMOUNTFC);
      const existingVolume = calculateTotalOpenOrdersVolume();
      const existingOrdersAmount = existingVolume * BASE_AMOUNT_PER_VOLUME;
      const existingOrdersMargin =
        existingOrdersAmount * (MINIMUM_BALANCE_PERCENTAGE / 100);
      const availableBalance =
        userBalance - existingOrdersAmount - existingOrdersMargin;
      const maxVolume = Math.floor(
        (availableBalance /
          (BASE_AMOUNT_PER_VOLUME * (1 + MINIMUM_BALANCE_PERCENTAGE / 100))) *
          10
      ) / 10;
      const newVolume = Math.max(0.1, maxVolume);

      setVolume(newVolume.toFixed(1));

      if (newVolume <= 0.1) {
        setErrorMessage(
          `Cannot place new trades. You have ${existingVolume.toFixed(1)} volume in open orders requiring $${(
            existingOrdersAmount + existingOrdersMargin
          ).toFixed(2)} of your balance.`
        );
        setShowInsufficientBalanceAlert(true);
      } else {
        setErrorMessage(
          `Volume adjusted to ${newVolume.toFixed(1)} to maintain minimum required balance.`
        );
        setShowInsufficientBalanceAlert(true);
      }
    }
  };

  const calculateTradeDetails = () => {
    if (!selectedUserData || !selectedUserData.AMOUNTFC) return null;

    const userBalance = parseFloat(selectedUserData.AMOUNTFC);
    const volumeValue = parseFloat(volume) || 0;
    const baseAmount = volumeValue * BASE_AMOUNT_PER_VOLUME;
    const marginRequirement = baseAmount * (MINIMUM_BALANCE_PERCENTAGE / 100);
    const totalRequiredAmount = baseAmount + marginRequirement;
    const existingVolume = calculateTotalOpenOrdersVolume();
    const existingOrdersAmount = existingVolume * BASE_AMOUNT_PER_VOLUME;
    const existingOrdersMargin =
      existingOrdersAmount * (MINIMUM_BALANCE_PERCENTAGE / 100);
    const totalExistingAmount = existingOrdersAmount + existingOrdersMargin;
    const totalNeededAmount = totalRequiredAmount + totalExistingAmount;
    const remainingBalance = userBalance - totalNeededAmount;
    const maxAllowedVolume = Math.floor(
      (userBalance - totalExistingAmount) /
        (BASE_AMOUNT_PER_VOLUME * (1 + MINIMUM_BALANCE_PERCENTAGE / 100)) * 10
    ) / 10;
    const isTradeValid = remainingBalance >= 0 && volumeValue >= 0.1;

    return {
      userBalance: userBalance.toFixed(2),
      baseAmount: baseAmount.toFixed(2),
      marginAmount: marginRequirement.toFixed(2),
      totalAmount: totalRequiredAmount.toFixed(2),
      existingVolume,
      existingAmount: totalExistingAmount.toFixed(2),
      totalNeededAmount: totalNeededAmount.toFixed(2),
      remainingBalance: remainingBalance.toFixed(2),
      remainingPercentage: ((remainingBalance / userBalance) * 100).toFixed(1),
      maxAllowedVolume,
      isTradeValid,
    };
  };

  const volumeSuggestions = [0.1, 0.5, 1.0, 2.0, 5.0];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length > 0) {
      return (
        <div className="p-3 rounded-lg shadow-lg border border-gray-200 bg-white text-xs">
          <p className="text-gray-700 mb-1 font-medium">{`${
            payload[0]?.payload?.date || "N/A"
          } ${payload[0]?.payload?.time || "N/A"}`}</p>
          <div className="border-t border-gray-200 pt-1">
            <p className="text-red-600 flex justify-between">
              <span>Bid:</span>{" "}
              <span className="font-mono ml-4">
                {payload[0]?.value?.toFixed(2) || "N/A"}
              </span>
            </p>
            {payload[1] && (
              <p className="text-blue-600 flex justify-between">
                <span>Ask:</span>{" "}
                <span className="font-mono ml-4">
                  {payload[1]?.value?.toFixed(2) || "N/A"}
                </span>
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const tradeDetails = calculateTradeDetails();
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-opacity-80 flex items-center justify-center z-50 p-2">
      <audio
        ref={buySoundRef}
        src={Sound}
        preload="auto"
      />
      <audio
        ref={sellSoundRef}
        src={Sound}
        preload="auto"
      />

      <div className="bg-white rounded-lg shadow-2xl border border-gray-200 w-full max-w-5xl overflow-hidden text-gray-800">
        <div className="flex justify-between items-center bg-gradient-to-r from-blue-700 to-blue-500 text-white py-3 px-4 border-b border-gray-200">
          <div className="flex items-center">
            <span className="font-bold text-lg text-yellow-600 mr-2">
              XAU/USD
            </span>
            <h3 className="font-semibold text-white">GOLD</h3>
            <div className="ml-3 text-gray-700 text-sm">
              <span className="px-2 py-1 rounded bg-gray-100 shadow-inner">
                Market Execution
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="bg-red-500 hover:bg-red-600 text-white h-8 w-8 flex items-center justify-center rounded-full transition-colors shadow-md"
          >
            ×
          </button>
        </div>

        <div className="flex flex-col md:flex-row">
          <div className="w-full md:w-3/5 p-3 border-r border-gray-200">
            <div className="flex justify-between mb-2 border-b border-gray-200 pb-2">
              <div className="text-lg font-semibold text-gray-700">Chart</div>
              <div className="flex items-center">
                <span className="text-xs text-gray-500 mr-2">Chart Type:</span>
                <div className="flex bg-gray-100 rounded-md p-1">
                  <button
                    onClick={() => setChartType("area")}
                    className={`px-2 py-1 text-xs rounded ${
                      chartType === "area"
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-600 hover:text-gray-700"
                    }`}
                  >
                    Area
                  </button>
                  <button
                    onClick={() => setChartType("line")}
                    className={`px-2 py-1 text-xs rounded ${
                      chartType === "line"
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-600 hover:text-gray-700"
                    }`}
                  >
                    Line
                  </button>
                </div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg bg-white p-2 shadow-lg">
              <div className="flex justify-between mb-2 p-2 bg-gray-50 rounded-lg shadow-inner border border-gray-200">
                <div className="text-center w-1/2">
                  <span className="text-xs text-gray-500">Bid</span>
                  <div className="text-red-600 font-bold text-lg">
                    {bidPrice}
                  </div>
                </div>
                <div className="text-center w-1/2">
                  <span className="text-xs text-gray-500">Ask</span>
                  <div className="text-green-600 font-bold text-lg">
                    {askPrice}
                  </div>
                </div>
              </div>

              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === "area" ? (
                    <AreaChart
                      data={chartData}
                      margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                    >
                      <defs>
                        <linearGradient
                          id="bidGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#ef4444"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor="#ef4444"
                            stopOpacity={0}
                          />
                        </linearGradient>
                        <linearGradient
                          id="askGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#3b82f6"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor="#3b82f6"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#e5e7eb"
                        opacity={0.6}
                      />
                      <XAxis
                        dataKey="time"
                        tick={{ fill: "#6b7280", fontSize: 10 }}
                        stroke="#d1d5db"
                        tickCount={6}
                      />
                      <YAxis
                        domain={["auto", "auto"]}
                        tick={{ fill: "#6b7280", fontSize: 10 }}
                        stroke="#d1d5db"
                        width={40}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="bid"
                        fill="url(#bidGradient)"
                        stroke="#ef4444"
                        strokeWidth={2}
                        activeDot={{
                          r: 6,
                          stroke: "#ef4444",
                          strokeWidth: 2,
                          fill: "#fff",
                        }}
                        name="Bid"
                      />
                      <Area
                        type="monotone"
                        dataKey="ask"
                        fill="url(#askGradient)"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{
                          r: 6,
                          stroke: "#3b82f6",
                          strokeWidth: 2,
                          fill: "#fff",
                        }}
                        name="Ask"
                      />
                      <Line
                        type="monotone"
                        dataKey="ma20"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        strokeDasharray="3 3"
                        dot={false}
                        name="MA20"
                      />
                      <ReferenceLine
                        y={parseFloat(bidPrice)}
                        stroke="#ef4444"
                        strokeDasharray="3 3"
                      />
                      <ReferenceLine
                        y={parseFloat(askPrice)}
                        stroke="#3b82f6"
                        strokeDasharray="3 3"
                      />
                    </AreaChart>
                  ) : (
                    <LineChart
                      data={chartData}
                      margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#e5e7eb"
                        opacity={0.6}
                      />
                      <XAxis
                        dataKey="time"
                        tick={{ fill: "#6b7280", fontSize: 10 }}
                        stroke="#d1d5db"
                        tickCount={6}
                      />
                      <YAxis
                        domain={["auto", "auto"]}
                        tick={{ fill: "#6b7280", fontSize: 10 }}
                        stroke="#d1d5db"
                        width={40}
                      />
                      {showIndicators && (
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          domain={[0, 100]}
                          tick={{ fill: "#d97706", fontSize: 10 }}
                          stroke="#d97706"
                          opacity={0.7}
                          width={30}
                        />
                      )}
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="bid"
                        stroke="#ef4444"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 6, fill: "#ef4444" }}
                        name="Bid"
                      />
                      <Line
                        type="monotone"
                        dataKey="ask"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 6, fill: "#3b82f6" }}
                        name="Ask"
                      />
                      <ReferenceLine
                        y={parseFloat(bidPrice)}
                        stroke="#ef4444"
                        strokeDasharray="3 3"
                      />
                      <ReferenceLine
                        y={parseFloat(askPrice)}
                        stroke="#3b82f6"
                        strokeDasharray="3 3"
                      />
                      {parseFloat(stopLoss) > 0 && (
                        <ReferenceLine
                          y={parseFloat(stopLoss)}
                          stroke="#ef4444"
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          label={{
                            value: `SL: ${stopLoss}`,
                            fill: "#ef4444",
                            fontSize: 10,
                            position: "insideBottomLeft",
                          }}
                        />
                      )}
                      {parseFloat(takeProfit) > 0 && (
                        <ReferenceLine
                          y={parseFloat(takeProfit)}
                          stroke="#10b981"
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          label={{
                            value: `TP: ${takeProfit}`,
                            fill: "#10b981",
                            fontSize: 10,
                            position: "insideTopLeft",
                          }}
                        />
                      )}
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </div>

              <div className="flex justify-between gap-2 mt-2 border-t border-gray-200 pt-2">
                <div className="flex gap-1">
                  <button
                    onClick={() => setTimeframe("1H")}
                    className={`px-2 py-1 text-xs rounded-md ${
                      timeframe === "1H"
                        ? "bg-blue-100 text-blue-700 font-medium shadow-inner"
                        : "bg-gray-100 hover:bg-gray-200 shadow"
                    }`}
                  >
                    1H
                  </button>
                  <button
                    onClick={() => setTimeframe("1D")}
                    className={`px-2 py-1 text-xs rounded-md ${
                      timeframe === "1D"
                        ? "bg-blue-100 text-blue-700 font-medium shadow-inner"
                        : "bg-gray-100 hover:bg-gray-200 shadow"
                    }`}
                  >
                    1D
                  </button>
                  <button
                    onClick={() => setTimeframe("1W")}
                    className={`px-2 py-1 text-xs rounded-md ${
                      timeframe === "1W"
                        ? "bg-blue-100 text-blue-700 font-medium shadow-inner"
                        : "bg-gray-100 hover:bg-gray-200 shadow"
                    }`}
                  >
                    1W
                  </button>
                  <button
                    onClick={() => setTimeframe("1M")}
                    className={`px-2 py-1 text-xs rounded-md ${
                      timeframe === "1M"
                        ? "bg-blue-100 text-blue-700 font-medium shadow-inner"
                        : "bg-gray-100 hover:bg-gray-200 shadow"
                    }`}
                  >
                    1M
                  </button>
                </div>
                <button
                  onClick={() => setShowIndicators(!showIndicators)}
                  className={`px-2 py-1 text-xs rounded-md ${
                    showIndicators
                      ? "bg-indigo-100 text-indigo-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {showIndicators ? "Hide Indicators" : "Show Indicators"}
                </button>
              </div>
            </div>
          </div>

          <div className="w-full md:w-2/5 p-4 bg-gray-50">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Symbol:
              </label>
              <select className="w-full rounded-md border border-gray-300 p-2 bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-inner">
                <option>GOLD (XAU/USD)</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-1 text-blue-600" />
                  Assign to User:
                </div>
              </label>
              {loading ? (
                <div className="p-2 text-sm text-gray-500">
                  Loading users...
                </div>
              ) : (
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full rounded-md border border-gray-300 p-2 bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-inner"
                >
                  <option value="">Select a user</option>
                  {users && users.length > 0 ? (
                    users.map((user, index) => (
                      <option key={index} value={user._id}>
                        {user.ACCOUNT_HEAD}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>
                      No users available
                    </option>
                  )}
                </select>
              )}
            </div>

            {selectedUser && tradeDetails && (
              <div className="mb-4 p-2 border border-gray-200 rounded-md bg-gray-50 text-xs">
                <div className="flex justify-between mb-1">
                  <span className="text-gray-600">Account Balance:</span>
                  <span className="font-medium">
                    ${tradeDetails.userBalance}
                  </span>
                </div>
                <div className="flex justify-between mb-1">
                  <div className="flex items-center">
                    <span className="text-gray-600">Trade Amount:</span>
                    <div
                      className="relative inline-block ml-1"
                      onMouseEnter={() => setShowBalanceInfo(true)}
                      onMouseLeave={() => setShowBalanceInfo(false)}
                    >
                      <Info size={12} className="text-blue-500 cursor-help" />
                      {showBalanceInfo && (
                        <div className="absolute left-0 bottom-full mb-2 p-2 bg-white shadow-lg border border-gray-200 rounded text-xs w-48 z-10">
                          <p className="text-gray-700">
                            Trade amount is calculated as price × volume.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <span
                    className={`font-medium ${
                      tradeDetails.isTradeValid
                        ? "text-gray-800"
                        : "text-red-600"
                    }`}
                  >
                    ${tradeDetails.totalNeededAmount}
                  </span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-gray-600">Remaining Balance:</span>
                  <span
                    className={`font-medium ${
                      tradeDetails.isTradeValid
                        ? "text-gray-800"
                        : "text-red-600"
                    }`}
                  >
                    ${tradeDetails.remainingBalance} (
                    {tradeDetails.remainingPercentage}%)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Max Volume:</span>
                  <span className="font-medium text-blue-600">
                    {tradeDetails.maxAllowedVolume.toFixed(1)}
                  </span>
                </div>
                <button
                  onClick={handleAdjustVolume}
                  className="mt-2 w-full bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs py-1 rounded border border-blue-200 transition-colors"
                >
                  Auto-Adjust Volume
                </button>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Volume (TT BAR):
              </label>
              <div className="flex items-center">
                <button
                  onClick={handleDecrement}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-l-md border border-gray-300"
                >
                  -
                </button>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-full text-center py-2 border-t border-b border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={handleIncrement}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-r-md border border-gray-300"
                >
                  +
                </button>
              </div>
              <div className="flex space-x-1 mt-1">
                {volumeSuggestions.map((vol) => (
                  <button
                    key={vol}
                    onClick={() => setVolume(vol.toFixed(1))}
                    className="px-2 py-1 text-xs rounded bg-gray-100 hover:bg-gray-200 text-gray-700"
                  >
                    {vol.toFixed(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stop Loss:
                </label>
                <input
                  type="number"
                  value={stopLoss}
                  onChange={(e) => setStopLoss(e.target.value)}
                  className="w-full rounded-md border border-gray-300 p-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Take Profit:
                </label>
                <input
                  type="number"
                  value={takeProfit}
                  onChange={(e) => setTakeProfit(e.target.value)}
                  className="w-full rounded-md border border-gray-300 p-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <button
                onClick={handleBuy}
                disabled={!selectedUser}
                className={`py-3 rounded-md font-semibold text-white shadow-lg ${
                  selectedUser
                    ? "bg-green-600 hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                    : "bg-gray-400 cursor-not-allowed"
                }`}
              >
                BUY at {bidPrice}
              </button>
              <button
                onClick={handleSell}
                disabled={!selectedUser}
                className={`py-3 rounded-md font-semibold text-white shadow-lg ${
                  selectedUser
                    ? "bg-red-600 hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    : "bg-gray-400 cursor-not-allowed"
                }`}
              >
                SELL at {askPrice}
              </button>
            </div>

            {!selectedUser && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-700 text-sm flex items-start mb-4">
                <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 text-amber-500" />
                <span>Please select a user before placing an order.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {showConfirmation && orderDetails && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full animate-in fade-in duration-300 overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white">
              <div className="flex items-center justify-center mb-3">
                <CheckCircle size={56} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold text-center">
                Order Placed Successfully
              </h3>
            </div>

            <div className="p-6">
              <div className="flex items-center justify-between mb-6 bg-gray-50 p-3 rounded-lg border border-gray-200">
                <div>
                  <div className="text-xs text-gray-500">Order Number</div>
                  <div className="font-medium">{orderDetails.orderNo}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-y-4 mb-6">
                <div>
                  <div className="text-xs text-gray-500">Type</div>
                  <div
                    className={`font-medium ${
                      orderDetails.type === "BUY"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {orderDetails.type}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-500">Symbol</div>
                  <div className="font-medium">{orderDetails.symbol}</div>
                </div>

                <div>
                  <div className="text-xs text-gray-500">Price</div>
                  <div className="font-medium">${orderDetails.price}</div>
                </div>

                <div>
                  <div className="text-xs text-gray-500">Volume</div>
                  <div className="font-medium">{orderDetails.volume} TTBAR</div>
                </div>

                <div>
                  <div className="text-xs text-gray-500">Date</div>
                  <div className="font-medium">{orderDetails.date}</div>
                </div>

                <div>
                  <div className="text-xs text-gray-500">Time</div>
                  <div className="font-medium">{orderDetails.time}</div>
                </div>
              </div>

              <div className="flex flex-col space-y-3">
                <button
                  onClick={handleConfirmationClose}
                  className="bg-white hover:bg-gray-50 text-gray-700 py-3 px-6 rounded-lg border border-gray-300 transition-colors w-full font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showInsufficientBalanceAlert && (
        <div className="fixed inset-0 bg-white/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full animate-fade-in">
            <div className="flex items-center justify-center text-red-500 mb-4">
              <AlertTriangle size={48} className="text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-center text-gray-800 mb-4">
              Insufficient Balance
            </h3>
            <p className="text-gray-600 mb-4 text-center">{errorMessage}</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={handleAdjustVolume}
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-md shadow-md transition-colors"
              >
                Adjust Volume
              </button>
              <button
                onClick={handleInsufficientBalanceAlertClose}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-6 rounded-md shadow-md transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDialog;