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
import { AlertCircle, Check, User } from "lucide-react";
import axiosInstance from "../api/axios";
import Sound from "../assets/sound.mp3";
const OrderDialog = ({ isOpen, onClose, marketData, onPlaceOrder }) => {
  const [volume, setVolume] = useState("1.00");
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
  const chartRef = React.useRef(null);
  const [showIndicators, setShowIndicators] = useState(true);

  // Add audio refs for buy and sell sounds
  const buySoundRef = useRef(null);
  const sellSoundRef = useRef(null);

  const bidPrice = marketData?.bid ? marketData.bid.toFixed(2) : "3283.21";
  const askPrice = marketData?.ask ? marketData.ask.toFixed(2) : "3283.51";

  const selectedUserData = useMemo(() => {
    return users.find((user) => user._id === selectedUser) || {};
  }, [selectedUser, users]);

  const userSpread = selectedUserData.userSpread || 0;

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

  // Generate chart data on component mount or when timeframe changes
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

    // Calculate profit based on spread and volume
    return (volumeValue * spreadValue).toFixed(2);
  };

  const handleBuy = () => {
    // Play buy sound
    if (buySoundRef.current) {
      buySoundRef.current.play().catch((error) => {
        console.warn("Audio play failed:", error);
      });
    }

    const orderNo = generateOrderNo();
    const profit = calculateProfit("BUY", volume);
    const orderData = {
      type: "BUY",
      price: bidPrice,
      openingPrice: bidPrice,
      openingDate: new Date(),
      volume: parseFloat(volume),
      stopLoss: parseFloat(stopLoss),
      takeProfit: parseFloat(takeProfit),
      comment,
      user: selectedUser,
      userSpread,
      profit,
      timestamp: new Date().toISOString(),
      orderStatus: "PROCESSING",
      symbol: "GOLD",
      orderNo: orderNo,
    };

    onPlaceOrder(orderData);
    setOrderDetails({
      orderNo: orderNo,
      type: "BUY",
      price: bidPrice,
      volume: parseFloat(volume),
      symbol: "GOLD",
    });

    setShowConfirmation(true);
  };

  const handleSell = () => {
    // Play sell sound
    if (sellSoundRef.current) {
      sellSoundRef.current.play().catch((error) => {
        console.warn("Audio play failed:", error);
      });
    }

    const orderNo = generateOrderNo();
    const profit = calculateProfit("SELL", volume);
    const orderData = {
      type: "SELL",
      price: askPrice,
      openingPrice: askPrice,
      openingDate: new Date(),
      volume: parseFloat(volume),
      stopLoss: parseFloat(stopLoss),
      takeProfit: parseFloat(takeProfit),
      comment,
      userSpread,
      profit,
      user: selectedUser,
      timestamp: new Date().toISOString(),
      orderStatus: "PROCESSING",
      symbol: "GOLD",
      orderNo: orderNo,
    };

    onPlaceOrder(orderData);
    setOrderDetails({
      orderNo: orderNo,
      type: "SELL",
      price: askPrice,
      volume: parseFloat(volume),
      symbol: "GOLD",
    });

    setShowConfirmation(true);
  };

  const handleConfirmationClose = () => {
    setShowConfirmation(false);
    onClose();
  };

  const handleIncrement = (setter, value, increment = 0.01) => {
    setter((parseFloat(value) + increment).toFixed(2));
  };

  const handleDecrement = (setter, value, decrement = 0.01) => {
    const result = parseFloat(value) - decrement;
    setter((result >= 0 ? result : 0).toFixed(2));
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

  const volumeSuggestions = [1, 2, 3, 4, 5];

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-opacity-80 flex items-center justify-center z-50 p-2">
      {/* Audio elements for trading sounds */}
      <audio
        ref={buySoundRef}
        src={Sound} // Update this path to match your sound file location
        preload="auto"
      />
      <audio
        ref={sellSoundRef}
        src={Sound} // Update this path to match your sound file location
        preload="auto"
      />

      <div className="bg-white rounded-lg shadow-2xl border border-gray-200 w-full max-w-5xl overflow-hidden text-gray-800">
        {/* Header */}
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
          {/* Left side - Chart */}
          <div className="w-full md:w-3/5 p-3 border-r border-gray-200">
            {/* Chart Header */}
            <div className="flex justify-between mb-2 border-b border-gray-200 pb-2">
              <div className="text-lg font-semibold text-gray-700">Chart</div>

              {/* Chart Type Selector */}
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
              {/* Price display - removed spread, only showing bid and ask */}
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

              {/* Chart View */}
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

              {/* Chart Controls */}
              <div className="flex justify-between gap-2 mt-2 border-t border-gray-200 pt-2">
                {/* Time frame selector */}
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

                {/* Indicators toggle */}
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

          {/* Right side - Order form */}
          <div className="w-full md:w-2/5 p-4 bg-gray-50">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Symbol:
              </label>
              <select className="w-full rounded-md border border-gray-300 p-2 bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-inner">
                <option>GOLD (XAU/USD)</option>
              </select>
            </div>

            {/* User assignment section */}
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

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Volume (Oz) :{" "}
              </label>
              <div className="flex">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={volume}
                    onChange={(e) => setVolume(e.target.value)}
                    className="w-full rounded-md border border-gray-300 p-2 bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-inner"
                  />
                  <div className="absolute inset-y-0 right-0 flex flex-col">
                    <button
                      onClick={() => handleIncrement(setVolume, volume)}
                      className="border-l border-b border-gray-300 px-2 h-1/2 bg-gray-100 hover:bg-gray-200 rounded-tr-md text-gray-700"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => handleDecrement(setVolume, volume)}
                      className="border-l border-gray-300 px-2 h-1/2 bg-gray-100 hover:bg-gray-200 rounded-br-md text-gray-700"
                    >
                      ▼
                    </button>
                  </div>
                </div>
              </div>

              {/* Volume quick select */}
              <div className="flex gap-1 mt-1">
                {volumeSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setVolume(suggestion.toFixed(2))}
                    className="flex-1 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded text-center transition text-gray-700 shadow"
                  >
                    {suggestion.toFixed(2)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex mb-4 gap-4">
              <div className="w-1/2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stop Loss:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={stopLoss}
                    onChange={(e) => setStopLoss(e.target.value)}
                    className="w-full rounded-md border border-gray-300 p-2 bg-white text-gray-700 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition shadow-inner"
                  />
                  <div className="absolute inset-y-0 right-0 flex flex-col">
                    <button
                      onClick={() => handleIncrement(setStopLoss, stopLoss)}
                      className="border-l border-b border-gray-300 px-2 h-1/2 bg-gray-100 hover:bg-gray-200 rounded-tr-md text-gray-700"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => handleDecrement(setStopLoss, stopLoss)}
                      className="border-l border-gray-300 px-2 h-1/2 bg-gray-100 hover:bg-gray-200 rounded-br-md text-gray-700"
                    >
                      ▼
                    </button>
                  </div>
                </div>
              </div>

              <div className="w-1/2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Take Profit:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={takeProfit}
                    onChange={(e) => setTakeProfit(e.target.value)}
                    className="w-full rounded-md border border-gray-300 p-2 bg-white text-gray-700 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition shadow-inner"
                  />
                  <div className="absolute inset-y-0 right-0 flex flex-col">
                    <button
                      onClick={() => handleIncrement(setTakeProfit, takeProfit)}
                      className="border-l border-b border-gray-300 px-2 h-1/2 bg-gray-100 hover:bg-gray-200 rounded-tr-md text-gray-700"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => handleDecrement(setTakeProfit, takeProfit)}
                      className="border-l border-gray-300 px-2 h-1/2 bg-gray-100 hover:bg-gray-200 rounded-br-md text-gray-700"
                    >
                      ▼
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Comment (Optional):
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full rounded-md border border-gray-300 p-2 bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-inner"
                placeholder="Add a comment to this order..."
                rows={2}
              ></textarea>
            </div>

            {/* Order buttons */}
            <div className="mt-6 flex gap-4">
              <button
                onClick={handleBuy}
                disabled={!selectedUser}
                className={`w-1/2 py-3 rounded-md text-white font-medium text-lg transition shadow-lg
    ${
      selectedUser
        ? "bg-gradient-to-r from-blue-500 to-blue-600  hover:from-blue-600 hover:to-blue-700"
        : "bg-gray-400 cursor-not-allowed"
    }`}
              >
              <span>Buy {bidPrice}</span>
              </button>
              <button
                onClick={handleSell}
                disabled={!selectedUser}
                className={`w-1/2 py-3 rounded-md text-white font-medium text-lg transition shadow-lg
    ${
      selectedUser
        ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
        : "bg-gray-400 cursor-not-allowed"
    }`}
              >
               <span>Sell {askPrice}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Order confirmation modal */}
        {showConfirmation && (
          <div className="fixed inset-0 bg-black/50 bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-96 shadow-2xl overflow-hidden">
              <div className="bg-green-50 p-4 border-b border-green-100">
                <div className="flex items-center justify-center mb-2">
                  <div className="bg-green-100 rounded-full p-2">
                    <Check className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-center text-green-800">
                  Order Placed Successfully
                </h3>
              </div>

              <div className="p-4">
                <div className="text-sm mb-4">
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="text-gray-600">Order Number:</div>
                    <div className="font-semibold text-gray-800">
                      {orderDetails?.orderNo}
                    </div>

                    <div className="text-gray-600">Type:</div>
                    <div
                      className={`font-semibold ${
                        orderDetails?.type === "BUY"
                          ? "text-green-700"
                          : "text-red-700"
                      }`}
                    >
                      {orderDetails?.type}
                    </div>

                    <div className="text-gray-600">Symbol:</div>
                    <div className="font-semibold text-gray-800">
                      {orderDetails?.symbol}
                    </div>

                    <div className="text-gray-600">Price:</div>
                    <div className="font-semibold text-gray-800">
                      ${orderDetails?.price}
                    </div>

                    <div className="text-gray-600">Volume:</div>
                    <div className="font-semibold text-gray-800">
                      {orderDetails?.volume} oz
                    </div>
                  </div>

                  <p className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-sm text-yellow-800 flex items-start">
                    <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0 text-yellow-600" />
                    Your order has been placed and is being processed. You can
                    view and manage this order from the Orders panel.
                  </p>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleConfirmationClose}
                    className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition shadow"
                  >
                    OK
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDialog;
