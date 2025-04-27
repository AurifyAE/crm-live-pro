import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  ChevronRight,
  RefreshCw,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  DollarSign,
  PieChart,
  TrendingUp,
  TrendingDown,
  Filter,
  Scale,
  Clock,
  Sliders,
  Save,
  ArrowRight,
  Info,
  Database,
  BarChart2,
  LineChartIcon,
  CreditCard,
  Users,
  Activity,
  Shield,
  Globe,
  Zap,
} from "lucide-react";
import {
  PieChart as RechartsPC,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  Area,
  AreaChart,
  ReferenceLine,
} from "recharts";
import useMarketData from "../components/marketData";
import axiosInstance from "../api/axios";
const adminId = localStorage.getItem("adminId");

export default function HypotheticalAnalysis() {
  // Current market data
  const { marketData, isLoading: marketDataLoading } = useMarketData(["GOLD"]);
  const [liveRate, setLiveRate] = useState(0);
  const [customRate, setCustomRate] = useState(0);
  const [bidValue, setBidValue] = useState(0); // New state for direct bid value input
  const [useCustomRate, setUseCustomRate] = useState(false);
  const [users, setUsers] = useState([]);
  const [originalUsers, setOriginalUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rateHistory, setRateHistory] = useState([]);
  const [riskHistory, setRiskHistory] = useState([]); // New state for tracking risk changes

  // Custom margin adjustment
  const [customMargin, setCustomMargin] = useState(0);
  const [applyCustomMargin, setApplyCustomMargin] = useState(false);
  const [marginAdjustmentType, setMarginAdjustmentType] = useState("all");

  // States for filtering and pagination
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({
    key: "id",
    direction: "ascending",
  });

  // Filtering states
  const [accountTypeFilter, setAccountTypeFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  const [marginFilter, setMarginFilter] = useState("all");

  // Analysis scenario name
  const [scenarioName, setScenarioName] = useState("Default Scenario");
  const [savedScenarios, setSavedScenarios] = useState([]);

  // Dashboard view toggle
  const [showCards, setShowCards] = useState(true);
  const [showCharts, setShowCharts] = useState(true);
  const [activeChart, setActiveChart] = useState("goldRateTrend");
  // const [timeRange, setTimeRange] = useState("1M");
  // Selected card for detailed view
  const [selectedCard, setSelectedCard] = useState(null);

  // Summary statistics with default values
  const [summaryStats, setSummaryStats] = useState({
    totalBankBalance: 0,
    totalDebtorEquity: 0,
    totalLPEquity: 0,
    totalGoldValue: 0,
    totalGoldWeight: 0,
    highRiskCount: 0,
    moderateRiskCount: 0,
    safeRiskCount: 0,
    lpHighRiskCount: 0,
    lpModerateRiskCount: 0,
    lpSafeRiskCount: 0,
    debtorHighRiskCount: 0,
    debtorModerateRiskCount: 0,
    debtorSafeRiskCount: 0,
    surplusMargin: 0,
    deficitMargin: 0,
    surplusAccounts: 0,
    deficitAccounts: 0,
    averageSurplus: 0,
    averageDeficit: 0,
    netPosition: 0,
  });

  const formatNumber = useCallback((num) => {
    // Handle edge cases: undefined, null, NaN, zero, or negative zero
    if (
      num === undefined ||
      num === null ||
      isNaN(num) ||
      num === 0 ||
      num === -0
    ) {
      return "0.00";
    }

    // Ensure positive zero for display
    const parsedNum = parseFloat(num);
    if (Math.abs(parsedNum) < 0.005) {
      return "0.00";
    }

    return parsedNum.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }, []);

  const formatCurrency = useCallback((value) => {
    // Handle edge cases: undefined, null, NaN, zero, or negative zero
    if (
      value === undefined ||
      value === null ||
      isNaN(value) ||
      value === 0 ||
      value === -0
    ) {
      return "AED 0";
    }

    // Ensure positive zero for display
    const parsedValue = parseFloat(value);
    if (Math.abs(parsedValue) < 0.5) {
      return "AED 0";
    }

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "AED",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(parsedValue);
  }, []);

  // Calculate risk level based on account type and margin ratio
  const calculateRiskLevel = useCallback((accountType, marginRatio) => {
    if (!accountType) return "N/A";

    switch (accountType.toLowerCase()) {
      case "lp":
        // Inverted risk calculation for LP accounts
        if (marginRatio <= 0.33) return "safe";
        if (marginRatio <= 0.66) return "moderate";
        return "high";
      case "debtor":
        // Standard risk calculation for Debtors
        if (marginRatio >= 0.67) return "safe";
        if (marginRatio >= 0.34) return "moderate";
        return "high";
      case "bank":
        return "N/A"; // Bank accounts don't have risk levels
      default:
        return "N/A";
    }
  }, []);

  // Calculate user data with updated values (optimized)
  const calculateUserData = useCallback(
    (item, goldRate, marginAdjustment = 0, adjustmentType = "all") => {
      const accountType = item.Account_Type?.toLowerCase() || "n/a";
      const accBalance = parseFloat(item.AMOUNTFC) || 0;

      // Fix metal weight extraction - ensure it's properly parsed
      // Check multiple possible field names and handle null/undefined gracefully
      let metalWeight = 0;
      if (item.METAL_WT !== undefined && item.METAL_WT !== null) {
        metalWeight = parseFloat(item.METAL_WT) || 0;
      } else if (item.metal_wt !== undefined && item.metal_wt !== null) {
        metalWeight = parseFloat(item.metal_wt) || 0;
      } else if (item.metalWeight !== undefined && item.metalWeight !== null) {
        metalWeight = parseFloat(item.metalWeight) || 0;
      }

      // Add console logging to debug
      console.log(
        `User ${item.ACCODE} - Raw metal weight: ${item.METAL_WT}, Parsed: ${metalWeight}`
      );

      let margin = parseFloat(item.margin) || 0;
      const goldRateValue = goldRate || 0;

      // Apply margin adjustment based on type
      const shouldAdjustMargin =
        adjustmentType === "all" ||
        (adjustmentType === "lp" && accountType === "lp") ||
        (adjustmentType === "debtor" && accountType === "debtor");

      if (shouldAdjustMargin) {
        margin += marginAdjustment;
      }

      // Calculate values - ensure proper calculation even with zero values
      const valueInAED =
        metalWeight > 0
          ? parseFloat((goldRateValue * metalWeight).toFixed(2))
          : 0;
      const netEquity = parseFloat((valueInAED + accBalance).toFixed(2));
      const marginAmount = parseFloat(((netEquity * margin) / 100).toFixed(2));
      const surplusDeficit = netEquity - marginAmount;

      // Calculate margin ratio based on account type
      let marginRatio = 0;
      if (accountType === "lp") {
        marginRatio = netEquity > 0 ? marginAmount / netEquity : 0;
      } else if (accountType === "debtor") {
        marginRatio = marginAmount > 0 ? netEquity / marginAmount : 0;
      }

      const riskLevel = calculateRiskLevel(accountType, marginRatio);

      // Log the calculated values for debugging
      console.log(
        `User ${item.ACCODE} - Account type: ${accountType}, Metal weight: ${metalWeight}, Value: ${valueInAED}`
      );

      return {
        id: item.ACCODE,
        name: item.ACCOUNT_HEAD,
        accBalance,
        metalWeight,
        goldratevalueInAED: goldRateValue,
        margin,
        valueInAED,
        netEquity,
        marginAmount,
        surplusDeficit,
        marginRatio,
        riskLevel,
        accountType,
        favorite: item.is_favorite || false,
        email: item.email || "customer@example.com",
        phone: item.phone || "N/A",
      };
    },
    [calculateRiskLevel]
  );

  // Calculate summary statistics (optimized)
  const calculateSummaryStats = useCallback(
    (userData) => {
      console.log("Calculate summary stats with", userData.length, "users");

      // Use reduce to calculate multiple values in one pass
      const stats = userData.reduce(
        (acc, user) => {
          // Track values by account type
          if (user.accountType === "bank") {
            acc.totalBankBalance += user.accBalance;
          } else if (user.accountType === "debtor") {
            acc.totalDebtorEquity += user.netEquity;

            // Track debtor risk levels
            if (user.riskLevel === "high") acc.debtorHighRiskCount++;
            else if (user.riskLevel === "moderate")
              acc.debtorModerateRiskCount++;
            else if (user.riskLevel === "safe") acc.debtorSafeRiskCount++;

            // Track surplus/deficit for non-bank accounts
            if (user.surplusDeficit > 0) {
              acc.surplusMargin += user.surplusDeficit;
              acc.surplusAccounts++;
            } else {
              acc.deficitMargin += Math.abs(user.surplusDeficit);
              acc.deficitAccounts++;
            }
          } else if (user.accountType === "lp") {
            acc.totalLPEquity += user.netEquity;

            // Track LP risk levels
            if (user.riskLevel === "high") acc.lpHighRiskCount++;
            else if (user.riskLevel === "moderate") acc.lpModerateRiskCount++;
            else if (user.riskLevel === "safe") acc.lpSafeRiskCount++;

            // Track surplus/deficit for non-bank accounts
            if (user.surplusDeficit > 0) {
              acc.surplusMargin += user.surplusDeficit;
              acc.surplusAccounts++;
            } else {
              acc.deficitMargin += Math.abs(user.surplusDeficit);
              acc.deficitAccounts++;
            }
          }

          // Track gold metrics for all accounts
          // Make sure to explicitly handle the metal weight
          if (user.metalWeight && user.metalWeight > 0) {
            acc.totalGoldWeight += user.metalWeight;
            console.log(
              `Added ${user.metalWeight}g for user ${user.id}, new total: ${acc.totalGoldWeight}g`
            );
          }

          // Make sure to explicitly handle the gold value
          if (user.valueInAED && user.valueInAED > 0) {
            acc.totalGoldValue += user.valueInAED;
            console.log(
              `Added ${user.valueInAED} AED for user ${user.id}, new total: ${acc.totalGoldValue} AED`
            );
          }

          return acc;
        },
        {
          totalBankBalance: 0,
          totalDebtorEquity: 0,
          totalLPEquity: 0,
          totalGoldWeight: 0,
          totalGoldValue: 0,
          lpHighRiskCount: 0,
          lpModerateRiskCount: 0,
          lpSafeRiskCount: 0,
          debtorHighRiskCount: 0,
          debtorModerateRiskCount: 0,
          debtorSafeRiskCount: 0,
          surplusMargin: 0,
          deficitMargin: 0,
          surplusAccounts: 0,
          deficitAccounts: 0,
        }
      );

      // Log final calculations for debugging
      console.log("Final gold weight:", stats.totalGoldWeight);
      console.log("Final gold value:", stats.totalGoldValue);

      // Calculate derived metrics
      const highRiskCount = stats.lpHighRiskCount + stats.debtorHighRiskCount;
      const moderateRiskCount =
        stats.lpModerateRiskCount + stats.debtorModerateRiskCount;
      const safeRiskCount = stats.lpSafeRiskCount + stats.debtorSafeRiskCount;
      const netPosition = stats.surplusMargin - stats.deficitMargin;
      const averageSurplus =
        stats.surplusAccounts > 0
          ? stats.surplusMargin / stats.surplusAccounts
          : 0;
      const averageDeficit =
        stats.deficitAccounts > 0
          ? stats.deficitMargin / stats.deficitAccounts
          : 0;

      // Ensure values are never negative zeros
      const finalGoldWeight = Math.max(
        0,
        parseFloat(stats.totalGoldWeight.toFixed(2))
      );
      const finalGoldValue = Math.max(
        0,
        parseFloat(stats.totalGoldValue.toFixed(2))
      );

      const newStats = {
        ...stats,
        totalGoldWeight: finalGoldWeight,
        totalGoldValue: finalGoldValue,
        highRiskCount,
        moderateRiskCount,
        safeRiskCount,
        netPosition,
        averageSurplus,
        averageDeficit,
      };

      console.log("Setting summary stats:", newStats);
      setSummaryStats(newStats);

      // Rest of your existing code for risk history
      const timestamp = new Date();
      setRiskHistory((prev) => {
        // Only update if there's a meaningful change in risk distribution
        if (
          prev.length === 0 ||
          prev[prev.length - 1].highRiskCount !== highRiskCount ||
          prev[prev.length - 1].moderateRiskCount !== moderateRiskCount ||
          prev[prev.length - 1].safeRiskCount !== safeRiskCount
        ) {
          return [
            ...prev,
            {
              time: timestamp.toLocaleTimeString(),
              formattedTime: timestamp.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
              highRiskCount,
              moderateRiskCount,
              safeRiskCount,
              goldRate: useCustomRate ? customRate : liveRate,
            },
          ].slice(-20); // Keep last 20 data points
        }
        return prev;
      });

      return newStats;
    },
    [useCustomRate, customRate, liveRate]
  );

  // Convert bid value to AED/g
  const convertBidToRate = useCallback((bid) => {
    return parseFloat(((bid / 31.103) * 3.674).toFixed(2));
  }, []);

  // Handle bid value change
  const handleBidValueChange = useCallback(
    (value) => {
      const numValue = parseFloat(value);
      setBidValue(numValue);
      const calculatedRate = convertBidToRate(numValue);
      setCustomRate(calculatedRate);
    },
    [convertBidToRate]
  );

  // Process data when gold rate or margin adjustment changes (optimized)
  const processData = useCallback(() => {
    if (originalUsers.length === 0) return;

    const effectiveRate = useCustomRate ? customRate : liveRate;
    const marginAdjustment = applyCustomMargin ? customMargin : 0;

    const updatedUsers = originalUsers.map((item) =>
      calculateUserData(
        item,
        effectiveRate,
        marginAdjustment,
        marginAdjustmentType
      )
    );

    setUsers(updatedUsers);
    calculateSummaryStats(updatedUsers);
  }, [
    originalUsers,
    useCustomRate,
    customRate,
    liveRate,
    applyCustomMargin,
    customMargin,
    marginAdjustmentType,
    calculateUserData,
    calculateSummaryStats,
  ]);

  // Fetch data from backend
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/fetch-data/${adminId}`);
      if (response.data.status === 200) {
        setOriginalUsers(response.data.data);
      } else {
        setError("Failed to fetch data");
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Error connecting to server");
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle gold rate update from market data
  useEffect(() => {
    if (marketData?.bid) {
      const bidRaw = parseFloat(marketData.bid);
      const calculatedRate = convertBidToRate(bidRaw);

      setLiveRate(calculatedRate);

      if (bidValue === 0) {
        setBidValue(bidRaw);
      }

      if (customRate === 0) {
        setCustomRate(calculatedRate);
      }

      // Add to rate history for charting
      const timestamp = new Date();
      setRateHistory((prev) =>
        [
          ...prev,
          {
            time: timestamp.toLocaleTimeString(),
            rate: calculatedRate,
            bidValue: bidRaw,
            formattedTime: timestamp.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
        ].slice(-20)
      ); // Keep last 20 data points
    }
  }, [marketData, convertBidToRate]);

  // Initialize data fetch
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Process data when dependencies change
  useEffect(() => {
    processData();
  }, [processData]);

  // Sort function
  const requestSort = useCallback(
    (key) => {
      let direction = "ascending";
      if (sortConfig.key === key && sortConfig.direction === "ascending") {
        direction = "descending";
      }
      setSortConfig({ key, direction });
    },
    [sortConfig]
  );

  // Sorted users (memoized)
  const sortedUsers = useMemo(() => {
    const sortableUsers = [...users];
    if (sortConfig.key) {
      sortableUsers.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue < bValue) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableUsers;
  }, [users, sortConfig]);

  // Filtered users with improved filtering (memoized)
  const filteredUsers = useMemo(() => {
    return sortedUsers.filter((user) => {
      // Search filter
      const matchesSearch =
        search === "" ||
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.id.toString().includes(search);

      // Account type filter
      const matchesAccountType =
        accountTypeFilter === "all" || user.accountType === accountTypeFilter;

      // Risk level filter
      const matchesRisk = riskFilter === "all" || user.riskLevel === riskFilter;

      // Margin filter (surplus/deficit) - only apply to LP and debtor accounts
      const matchesMargin =
        marginFilter === "all" ||
        (user.accountType !== "bank" &&
          ((marginFilter === "surplus" && user.surplusDeficit > 0) ||
            (marginFilter === "deficit" && user.surplusDeficit < 0)));

      // Card selection filter
      const matchesSelectedCard =
        !selectedCard ||
        (selectedCard === "high" && user.riskLevel === "high") ||
        (selectedCard === "moderate" && user.riskLevel === "moderate") ||
        (selectedCard === "safe" && user.riskLevel === "safe") ||
        (selectedCard === "lpHigh" &&
          user.accountType === "lp" &&
          user.riskLevel === "high") ||
        (selectedCard === "lpModerate" &&
          user.accountType === "lp" &&
          user.riskLevel === "moderate") ||
        (selectedCard === "lpSafe" &&
          user.accountType === "lp" &&
          user.riskLevel === "safe") ||
        (selectedCard === "debtorHigh" &&
          user.accountType === "debtor" &&
          user.riskLevel === "high") ||
        (selectedCard === "debtorModerate" &&
          user.accountType === "debtor" &&
          user.riskLevel === "moderate") ||
        (selectedCard === "debtorSafe" &&
          user.accountType === "debtor" &&
          user.riskLevel === "safe") ||
        (selectedCard === "surplus" && user.surplusDeficit > 0) ||
        (selectedCard === "deficit" && user.surplusDeficit < 0) ||
        (selectedCard === "debtorEquity" && user.accountType === "debtor") ||
        (selectedCard === "lpEquity" && user.accountType === "lp") ||
        (selectedCard === "bankBalance" && user.accountType === "bank") ||
        (selectedCard === "netPosition" &&
          (user.accountType === "lp" || user.accountType === "debtor"));

      return (
        matchesSearch &&
        matchesAccountType &&
        matchesRisk &&
        matchesMargin &&
        matchesSelectedCard
      );
    });
  }, [
    sortedUsers,
    search,
    accountTypeFilter,
    riskFilter,
    marginFilter,
    selectedCard,
  ]);

  // Pagination
  const totalPages = useMemo(
    () => Math.ceil(filteredUsers.length / itemsPerPage),
    [filteredUsers, itemsPerPage]
  );

  const currentItems = useMemo(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  }, [filteredUsers, currentPage, itemsPerPage]);

  // Handle card selection
  const handleCardSelect = useCallback(
    (cardType) => {
      setSelectedCard(selectedCard === cardType ? null : cardType);
      setCurrentPage(1); // Reset to first page when filter changes
    },
    [selectedCard]
  );

  // Handle filter changes
  const handleFilterChange = useCallback((filterType, value) => {
    switch (filterType) {
      case "search":
        setSearch(value);
        break;
      case "account":
        setAccountTypeFilter(value);
        break;
      case "risk":
        setRiskFilter(value);
        break;
      case "margin":
        setMarginFilter(value);
        break;
      default:
        break;
    }
    setCurrentPage(1); // Reset to first page when filter changes
  }, []);

  // Save current scenario
  const saveScenario = useCallback(() => {
    const scenario = {
      id: Date.now().toString(),
      name: scenarioName,
      goldRate: useCustomRate ? customRate : liveRate,
      bidValue: bidValue,
      marginAdjustment: applyCustomMargin ? customMargin : 0,
      marginAdjustmentType,
      stats: { ...summaryStats },
      timestamp: new Date().toISOString(),
    };

    setSavedScenarios((prev) => [...prev, scenario]);

    // Show success message
    alert(`Scenario "${scenarioName}" saved successfully!`);
  }, [
    scenarioName,
    useCustomRate,
    customRate,
    liveRate,
    bidValue,
    applyCustomMargin,
    customMargin,
    marginAdjustmentType,
    summaryStats,
  ]);
  useEffect(() => {
    console.log("Summary Stats:", summaryStats);
    console.log("Total Gold Value:", summaryStats.totalGoldValue);
    console.log("Total Gold Weight:", summaryStats.totalGoldWeight);
  }, [summaryStats]);
  // Risk indicator component
  const RiskIndicator = ({ riskLevel }) => {
    const riskConfig = {
      high: {
        color: "text-red-600",
        bgColor: "bg-red-100",
        icon: <AlertCircle className="h-4 w-4 mr-1" />,
        text: "High Risk",
      },
      moderate: {
        color: "text-amber-500",
        bgColor: "bg-amber-100",
        icon: <AlertTriangle className="h-4 w-4 mr-1" />,
        text: "Moderate",
      },
      safe: {
        color: "text-green-600",
        bgColor: "bg-green-100",
        icon: <CheckCircle className="h-4 w-4 mr-1" />,
        text: "Safe",
      },
      "N/A": {
        color: "text-gray-400",
        bgColor: "bg-gray-100",
        icon: <Info className="h-4 w-4 mr-1" />,
        text: "N/A",
      },
    };

    const config = riskConfig[riskLevel] || riskConfig["N/A"];

    return (
      <div
        className={`flex items-center px-2 py-1 rounded-full ${config.bgColor} ${config.color}`}
      >
        {config.icon}
        <span className="text-xs font-medium">{config.text}</span>
      </div>
    );
  };

  // Create chart data (memoized)
  const chartData = useMemo(() => {
    return {
      riskDistribution: [
        {
          name: "High Risk",
          value: summaryStats.highRiskCount,
          color: "#ef4444",
        },
        {
          name: "Moderate Risk",
          value: summaryStats.moderateRiskCount,
          color: "#f59e0b",
        },
        { name: "Safe", value: summaryStats.safeRiskCount, color: "#10b981" },
      ],
      accountType: [
        {
          name: "Debtor",
          value: users.filter((user) => user.accountType === "debtor").length,
          color: "#8b5cf6",
        },
        {
          name: "LP",
          value: users.filter((user) => user.accountType === "lp").length,
          color: "#3b82f6",
        },
        {
          name: "Bank",
          value: users.filter((user) => user.accountType === "bank").length,
          color: "#06b6d4",
        },
      ],
      cashFlow: [
        {
          name: "Surplus",
          value: summaryStats.surplusMargin,
          color: "#10b981",
        },
        {
          name: "Deficit",
          value: summaryStats.deficitMargin,
          color: "#ef4444",
        },
      ],
      riskByAccountType: [
        {
          name: "LP High",
          Accounts: summaryStats.lpHighRiskCount,
          color: "#ef4444",
        },
        {
          name: "LP Moderate",
          Accounts: summaryStats.lpModerateRiskCount,
          color: "#f59e0b",
        },
        {
          name: "LP Safe",
          Accounts: summaryStats.lpSafeRiskCount,
          color: "#10b981",
        },
        {
          name: "Debtor High",
          Accounts: summaryStats.debtorHighRiskCount,
          color: "#dc2626",
        },
        {
          name: "Debtor Moderate",
          Accounts: summaryStats.debtorModerateRiskCount,
          color: "#d97706",
        },
        {
          name: "Debtor Safe",
          Accounts: summaryStats.debtorSafeRiskCount,
          color: "#059669",
        },
      ],
    };
  }, [summaryStats, users]);

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border border-gray-200 shadow-md rounded">
          <p className="font-medium">{`${
            label || payload[0].name
          }: ${formatNumber(payload[0].value)}`}</p>
        </div>
      );
    }
    return null;
  };

  // Loading state
  if (loading && users.length === 0) {
    return (
      <div className="fixed inset-0 flex justify-center items-center bg-white">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading accounts...</p>
        </div>
      </div>
    );
  }

  // Table header component
  const TableHeader = ({ label, sortKey }) => (
    <th
      scope="col"
      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer sticky top-0 bg-gray-100 z-10"
      onClick={() => requestSort(sortKey)}
    >
      <div className="flex items-center">
        {label}
        {sortConfig.key === sortKey && (
          <span className="ml-1">
            {sortConfig.direction === "ascending" ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </span>
        )}
      </div>
    </th>
  );

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      {/* Gold Rate Control Panel */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <DollarSign className="h-5 w-5 text-yellow-500 mr-2" />
          Gold Rate & Analysis Settings
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Live Rate Display */}
          <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Globe className="h-5 w-5 text-yellow-600 mr-2" />
                <p className="text-sm font-medium text-gray-700">
                  Live Gold Rate
                </p>
              </div>
              {marketDataLoading ? (
                <RefreshCw className="h-4 w-4 text-yellow-600 animate-spin" />
              ) : (
                <TrendingUp className="h-4 w-4 text-yellow-600" />
              )}
            </div>
            <div className="flex justify-between mt-2">
              <div>
                <p className="text-xs text-gray-500">Bid Value (USD/oz)</p>
                <p className="text-lg font-bold text-yellow-700">
                  {formatNumber(marketData?.bid || 0)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Rate (AED/g)</p>
                <p className="text-lg font-bold text-yellow-700">
                  {formatNumber(liveRate)}
                </p>
              </div>
            </div>
          </div>

          {/* Custom Rate Input */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center mb-2">
              <Sliders className="h-5 w-5 text-blue-600 mr-2" />
              <p className="text-sm font-medium text-gray-700">Custom Rate</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-500 block mb-1">
                  Bid (USD/oz)
                </label>
                <input
                  type="number"
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                  value={bidValue}
                  onChange={(e) => handleBidValueChange(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">
                  Rate (AED/g)
                </label>
                <input
                  type="number"
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                  value={customRate}
                  onChange={(e) => setCustomRate(parseFloat(e.target.value))}
                />
              </div>
            </div>
            <div className="mt-2">
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="form-checkbox h-4 w-4 text-blue-600"
                  checked={useCustomRate}
                  onChange={() => setUseCustomRate(!useCustomRate)}
                />
                <span className="ml-2 text-xs text-gray-700">
                  Use custom rate
                </span>
              </label>
            </div>
          </div>

          {/* Margin Adjustment */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center mb-2">
              <Scale className="h-5 w-5 text-purple-600 mr-2" />
              <p className="text-sm font-medium text-gray-700">
                Margin Adjustment
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <div>
                <label className="text-xs text-gray-500 block mb-1">
                  Adjustment (%)
                </label>
                <input
                  type="number"
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                  value={customMargin}
                  onChange={(e) => setCustomMargin(parseFloat(e.target.value))}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">
                  Apply to
                </label>
                <select
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                  value={marginAdjustmentType}
                  onChange={(e) => setMarginAdjustmentType(e.target.value)}
                >
                  <option value="all">All Accounts</option>
                  <option value="lp">LP Accounts Only</option>
                  <option value="debtor">Debtor Accounts Only</option>
                </select>
              </div>
            </div>
            <div className="mt-2">
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="form-checkbox h-4 w-4 text-purple-600"
                  checked={applyCustomMargin}
                  onChange={() => setApplyCustomMargin(!applyCustomMargin)}
                />
                <span className="ml-2 text-xs text-gray-700">
                  Apply adjustment
                </span>
              </label>
            </div>
          </div>

          {/* Scenario Management */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center mb-2">
              <Save className="h-5 w-5 text-green-600 mr-2" />
              <p className="text-sm font-medium text-gray-700">Scenario</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">
                Scenario Name
              </label>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded text-sm mb-2"
                value={scenarioName}
                onChange={(e) => setScenarioName(e.target.value)}
                placeholder="Enter scenario name"
              />
              <button
                className="w-full flex items-center justify-center p-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
                onClick={saveScenario}
              >
                <Save className="h-4 w-4 mr-1" /> Save Scenario
              </button>
            </div>
          </div>
        </div>

        {/* Quick Summary Row */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="p-2 rounded-full bg-blue-100 text-blue-600 mr-3">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Effective Gold Rate</p>
              <p className="text-lg font-bold text-gray-800">
                {formatNumber(useCustomRate ? customRate : liveRate)} AED/g
              </p>
            </div>
          </div>

          <div className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="p-2 rounded-full bg-purple-100 text-purple-600 mr-3">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Margin Adjustment</p>
              <p className="text-lg font-bold text-gray-800">
                {applyCustomMargin
                  ? `${customMargin > 0 ? "+" : ""}${customMargin}%`
                  : "None"}
              </p>
            </div>
          </div>

          <div className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="p-2 rounded-full bg-red-100 text-red-600 mr-3">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500">High Risk Accounts</p>
              <p className="text-lg font-bold text-gray-800">
                {summaryStats.highRiskCount}
                <span className="text-xs font-normal text-gray-500 ml-1">
                  (
                  {Math.round(
                    (summaryStats.highRiskCount /
                      users.filter((u) => u.accountType !== "bank").length) *
                      100
                  )}
                  %)
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="p-2 rounded-full bg-green-100 text-green-600 mr-3">
              <PieChart className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Net Position</p>
              <p
                className={`text-lg font-bold ${
                  summaryStats.netPosition >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {formatCurrency(summaryStats.netPosition)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Stats */}
      {showCards && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
              <Activity className="h-5 w-5 text-blue-500 mr-2" />
              Dashboard Stats
            </h2>
            <button
              onClick={() => setShowCards(!showCards)}
              className="text-sm text-gray-600 flex items-center"
            >
              {showCards ? (
                <ChevronUp className="h-4 w-4 mr-1" />
              ) : (
                <ChevronDown className="h-4 w-4 mr-1" />
              )}
              {showCards ? "Hide" : "Show"}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Account Equity Summary */}
            <div
              className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleCardSelect("debtorEquity")}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500">Debtor Net Equity</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {formatCurrency(summaryStats.totalDebtorEquity)}
                  </p>
                </div>
                <Database className="h-8 w-8 text-blue-500" />
              </div>
            </div>

            <div
              className="bg-white rounded-lg shadow-md p-4 border-l-4 border-purple-500 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleCardSelect("lpEquity")}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500">LP Net Equity</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {formatCurrency(summaryStats.totalLPEquity)}
                  </p>
                </div>
                <Database className="h-8 w-8 text-purple-500" />
              </div>
            </div>

            <div
              className="bg-white rounded-lg shadow-md p-4 border-l-4 border-cyan-500 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleCardSelect("bankBalance")}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500">Bank Balances</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {formatCurrency(summaryStats.totalBankBalance)}
                  </p>
                </div>
                <CreditCard className="h-8 w-8 text-cyan-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-yellow-500 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500">Total Gold Value</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {summaryStats.totalGoldValue > 0
                      ? formatCurrency(summaryStats.totalGoldValue)
                      : "AED 0"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {summaryStats.totalGoldWeight > 0
                      ? `${formatNumber(summaryStats.totalGoldWeight)} grams`
                      : "0.00 grams"}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-yellow-500" />
              </div>
            </div>

            {/* Risk Distribution */}
            <div
              className="bg-white rounded-lg shadow-md p-4 border-l-4 border-red-500 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleCardSelect("high")}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500">High Risk Accounts</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {summaryStats.highRiskCount}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    LP: {summaryStats.lpHighRiskCount} | Debtor:{" "}
                    {summaryStats.debtorHighRiskCount}
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
            </div>

            <div
              className="bg-white rounded-lg shadow-md p-4 border-l-4 border-amber-500 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleCardSelect("moderate")}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500">
                    Moderate Risk Accounts
                  </p>
                  <p className="text-2xl font-bold text-gray-800">
                    {summaryStats.moderateRiskCount}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    LP: {summaryStats.lpModerateRiskCount} | Debtor:{" "}
                    {summaryStats.debtorModerateRiskCount}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-amber-500" />
              </div>
            </div>

            <div
              className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleCardSelect("safe")}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500">Safe Accounts</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {summaryStats.safeRiskCount}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    LP: {summaryStats.lpSafeRiskCount} | Debtor:{" "}
                    {summaryStats.debtorSafeRiskCount}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </div>

            {/* Cash Flow */}
            <div
              className="bg-white rounded-lg shadow-md p-4 border-l-4 border-teal-500 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleCardSelect("netPosition")}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500">Net Position</p>
                  <p
                    className={`text-2xl font-bold ${
                      summaryStats.netPosition >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {formatCurrency(summaryStats.netPosition)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Surplus: {formatCurrency(summaryStats.surplusMargin)} |
                    Deficit: {formatCurrency(summaryStats.deficitMargin)}
                  </p>
                </div>
                {summaryStats.netPosition >= 0 ? (
                  <TrendingUp className="h-8 w-8 text-teal-500" />
                ) : (
                  <TrendingDown className="h-8 w-8 text-red-500" />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Charts Section with Trend Tracking */}
      {showCharts && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
              <BarChart2 className="h-5 w-5 text-purple-500 mr-2" />
              Dynamic Analysis & Trends
            </h2>
            <div className="flex items-center">
              <select
                value={activeChart}
                onChange={(e) => setActiveChart(e.target.value)}
                className="mr-2 border border-gray-300 rounded px-2 py-1 text-sm"
              >
                <option value="riskDistribution">Risk Distribution</option>
                <option value="accountType">Account Types</option>
                <option value="cashFlow">Cash Flow Analysis</option>
                <option value="riskByAccountType">Risk by Account Type</option>
                <option value="goldRateTrend">Gold Rate Trend</option>
                <option value="riskTrend">Risk Level Trend</option>
                <option value="surplusDeficitTrend">
                  Surplus/Deficit Trend
                </option>
              </select>
              <button
                onClick={() => setShowCharts(!showCharts)}
                className="text-sm text-gray-600 flex items-center"
              >
                {showCharts ? (
                  <ChevronUp className="h-4 w-4 mr-1" />
                ) : (
                  <ChevronDown className="h-4 w-4 mr-1" />
                )}
                {showCharts ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="h-64">
              {/* Original charts */}
              {activeChart === "riskDistribution" && (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPC>
                    <Pie
                      data={chartData.riskDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={(entry) => `${entry.name}: ${entry.value}`}
                    >
                      {chartData?.riskDistribution?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                  </RechartsPC>
                </ResponsiveContainer>
              )}

              {activeChart === "accountType" && (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPC>
                    <Pie
                      data={chartData.accountType}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={(entry) => `${entry.name}: ${entry.value}`}
                    >
                      {chartData.accountType.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                  </RechartsPC>
                </ResponsiveContainer>
              )}

              {activeChart === "cashFlow" && (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPC>
                    <Pie
                      data={chartData.cashFlow}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={(entry) =>
                        `${entry.name}: ${formatCurrency(entry.value)}`
                      }
                    >
                      {chartData.cashFlow.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                  </RechartsPC>
                </ResponsiveContainer>
              )}

              {activeChart === "riskByAccountType" && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData.riskByAccountType}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="Accounts" fill="#8884d8">
                      {chartData.riskByAccountType.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}

              {/* New Gold Rate Trend Chart */}
              {activeChart === "goldRateTrend" && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={rateHistory}
                    margin={{
                      top: 10,
                      right: 30,
                      left: 0,
                      bottom: 0,
                    }}
                  >
                    <defs>
                      <linearGradient
                        id="colorRate"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#8884d8"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor="#8884d8"
                          stopOpacity={0.1}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="formattedTime"
                      label={{
                        value: "Time",
                        position: "insideBottomRight",
                        offset: 0,
                      }}
                    />
                    <YAxis
                      domain={["auto", "auto"]}
                      label={{
                        value: "AED/g",
                        angle: -90,
                        position: "insideLeft",
                      }}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white p-3 border border-gray-200 shadow-lg rounded">
                              <p className="font-medium text-gray-800">{`Time: ${label}`}</p>
                              <p className="text-purple-600 font-semibold">{`Rate: ${formatNumber(
                                payload[0].value
                              )} AED/g`}</p>
                              <p className="text-blue-600">{`Bid: $${formatNumber(
                                payload[0].payload.bidValue
                              )}/oz`}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="rate"
                      stroke="#8884d8"
                      fillOpacity={1}
                      fill="url(#colorRate)"
                      strokeWidth={2}
                    />
                    {/* Risk indicator lines */}
                    {riskHistory.length > 0 && (
                      <ReferenceLine
                        y={rateHistory[rateHistory?.length - 1]?.rate}
                        stroke="#ff4500"
                        strokeDasharray="3 3"
                        label={{
                          value: "Current",
                          position: "right",
                          fill: "#ff4500",
                        }}
                      />
                    )}
                    {/* Support and resistance lines based on historical data */}
                    {rateHistory.length > 5 && (
                      <>
                        <ReferenceLine
                          y={Math.min(...rateHistory.map((item) => item.rate))}
                          stroke="#10b981"
                          strokeDasharray="3 3"
                          label={{
                            value: "Support",
                            position: "left",
                            fill: "#10b981",
                          }}
                        />
                        <ReferenceLine
                          y={Math.max(...rateHistory.map((item) => item.rate))}
                          stroke="#ef4444"
                          strokeDasharray="3 3"
                          label={{
                            value: "Resistance",
                            position: "left",
                            fill: "#ef4444",
                          }}
                        />
                      </>
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              )}

              {/* New Risk Trend Chart */}
              {activeChart === "riskTrend" && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={riskHistory}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="formattedTime" />
                    <YAxis />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white p-2 border border-gray-200 shadow-md rounded">
                              <p className="text-sm font-medium">{`Time: ${label}`}</p>
                              <p className="text-sm text-red-600">{`High Risk: ${payload[0].value}`}</p>
                              <p className="text-sm text-amber-600">{`Moderate Risk: ${payload[1].value}`}</p>
                              <p className="text-sm text-green-600">{`Safe: ${payload[2].value}`}</p>
                              <p className="text-sm text-gray-600">{`Gold Rate: ${formatNumber(
                                payload[0].payload.goldRate
                              )} AED/g`}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="highRiskCount"
                      stackId="1"
                      stroke="#ef4444"
                      fill="#ef4444"
                    />
                    <Area
                      type="monotone"
                      dataKey="moderateRiskCount"
                      stackId="1"
                      stroke="#f59e0b"
                      fill="#f59e0b"
                    />
                    <Area
                      type="monotone"
                      dataKey="safeRiskCount"
                      stackId="1"
                      stroke="#10b981"
                      fill="#10b981"
                    />
                    <Legend />
                  </AreaChart>
                </ResponsiveContainer>
              )}

              {/* New Surplus/Deficit Trend Chart */}
              {activeChart === "surplusDeficitTrend" && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={rateHistory.map((rateData, index) => {
                      // Find the closest risk history data point for this rate
                      const matchingRiskData =
                        riskHistory.find((r) => r.time === rateData.time) ||
                        (index > 0 && index < riskHistory.length
                          ? riskHistory[index]
                          : riskHistory[riskHistory.length - 1]);

                      // Calculate approximate surplus/deficit based on gold rate changes
                      const ratePercentChange =
                        index > 0
                          ? (rateData.rate - rateHistory[index - 1].rate) /
                            rateHistory[index - 1].rate
                          : 0;

                      const baselineValue = summaryStats.netPosition;
                      const estimatedNetPosition =
                        baselineValue *
                        (1 +
                          ratePercentChange *
                            (users.filter((u) => u.accountType !== "bank")
                              .length /
                              users.length));

                      return {
                        ...rateData,
                        surplus: Math.max(0, estimatedNetPosition),
                        deficit: Math.abs(Math.min(0, estimatedNetPosition)),
                        netPosition: estimatedNetPosition,
                        highRiskCount: matchingRiskData?.highRiskCount || 0,
                      };
                    })}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="formattedTime" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white p-2 border border-gray-200 shadow-md rounded">
                              <p className="text-sm font-medium">{`Time: ${label}`}</p>
                              <p className="text-sm text-blue-600">{`Net Position: ${formatCurrency(
                                payload[0].value
                              )}`}</p>
                              <p className="text-sm text-gray-600">{`Gold Rate: ${formatNumber(
                                payload[0].payload.rate
                              )} AED/g`}</p>
                              <p className="text-sm text-red-600">{`High Risk Accounts: ${payload[0].payload.highRiskCount}`}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="netPosition"
                      stroke="#3b82f6"
                      strokeWidth={2}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="rate"
                      stroke="#8884d8"
                      strokeWidth={1}
                      dot={false}
                    />
                    <Legend />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Add a small infobox below the chart to explain what the user is seeing */}
            <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-gray-700 flex items-start">
              <Info className="h-4 w-4 text-blue-500 mr-1 mt-0.5 flex-shrink-0" />
              {activeChart === "goldRateTrend" && (
                <p>
                  This chart shows the gold rate trend over time. You can see
                  how the rate has changed and how it affects your positions.
                </p>
              )}
              {activeChart === "riskTrend" && (
                <p>
                  This chart shows how risk levels have changed over time.
                  Notice how adjusting the gold rate impacts the distribution of
                  high, moderate, and safe accounts.
                </p>
              )}
              {activeChart === "surplusDeficitTrend" && (
                <p>
                  This chart shows how your net position changes alongside the
                  gold rate. The blue line represents your net position (surplus
                  minus deficit), while the purple line tracks the gold rate.
                </p>
              )}
              {(activeChart === "riskDistribution" ||
                activeChart === "accountType" ||
                activeChart === "cashFlow" ||
                activeChart === "riskByAccountType") && (
                <p>
                  Try adjusting the gold rate or margin settings to see how it
                  affects this distribution. Switch to trend charts to see
                  historical changes.
                </p>
              )}
            </div>
          </div>

          {/* Add interactive scenario comparison */}
          {savedScenarios.length > 0 && (
            <div className="mt-4 p-4 bg-white rounded-lg shadow-md">
              <h3 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
                <Scale className="h-5 w-5 text-purple-500 mr-2" />
                Scenario Comparison
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Scenario
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Gold Rate
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        High Risk
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Net Position
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {savedScenarios.slice(-3).map((scenario) => (
                      <tr key={scenario.id}>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                          {scenario.name}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                          {formatNumber(scenario.goldRate)} AED/g
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                          <span className="text-red-600">
                            {scenario.stats.highRiskCount}
                          </span>{" "}
                          accounts
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                          <span
                            className={
                              scenario.stats.netPosition >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }
                          >
                            {formatCurrency(scenario.stats.netPosition)}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                          <button
                            className="text-blue-600 hover:text-blue-800 flex items-center"
                            onClick={() => {
                              setCustomRate(scenario.goldRate);
                              setBidValue(scenario.bidValue);
                              setUseCustomRate(true);
                              setCustomMargin(scenario.marginAdjustment);
                              setApplyCustomMargin(
                                scenario.marginAdjustment !== 0
                              );
                              setMarginAdjustmentType(
                                scenario.marginAdjustmentType
                              );
                            }}
                          >
                            <ArrowRight className="h-4 w-4 mr-1" /> Apply
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filtering Controls */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex items-center flex-grow md:max-w-xs">
            <Search className="h-4 w-4 absolute left-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search accounts..."
              value={search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="pl-9 pr-3 py-2 border border-gray-300 rounded w-full"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            <select
              value={accountTypeFilter}
              onChange={(e) => handleFilterChange("account", e.target.value)}
              className="border border-gray-300 rounded px-3 py-2"
            >
              <option value="all">All Account Types</option>
              <option value="lp">LP Accounts</option>
              <option value="debtor">Debtor Accounts</option>
              <option value="bank">Bank Accounts</option>
            </select>

            <select
              value={riskFilter}
              onChange={(e) => handleFilterChange("risk", e.target.value)}
              className="border border-gray-300 rounded px-3 py-2"
            >
              <option value="all">All Risk Levels</option>
              <option value="high">High Risk</option>
              <option value="moderate">Moderate Risk</option>
              <option value="safe">Safe</option>
            </select>

            <select
              value={marginFilter}
              onChange={(e) => handleFilterChange("margin", e.target.value)}
              className="border border-gray-300 rounded px-3 py-2"
            >
              <option value="all">All Margin Status</option>
              <option value="surplus">Surplus</option>
              <option value="deficit">Deficit</option>
            </select>

            {selectedCard && (
              <button
                onClick={() => setSelectedCard(null)}
                className="flex items-center bg-blue-100 text-blue-700 px-3 py-2 rounded hover:bg-blue-200 transition-colors"
              >
                <Filter className="h-4 w-4 mr-1" />
                Clear Filter
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center">
            <Users className="h-5 w-5 text-blue-500 mr-2" />
            Account Analysis
            {selectedCard && (
              <span className="ml-2 text-sm text-blue-600">(Filtered)</span>
            )}
          </h2>
          <div className="text-sm text-gray-600">
            Showing {currentItems.length} of {filteredUsers.length} accounts
          </div>
        </div>

        <div className="overflow-x-auto max-h-96">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <TableHeader label="ID" sortKey="id" />
                <TableHeader label="Name" sortKey="name" />
                <TableHeader label="Type" sortKey="accountType" />
                <TableHeader label="Balance" sortKey="accBalance" />
                <TableHeader label="Gold (g)" sortKey="metalWeight" />
                <TableHeader label="Value (AED)" sortKey="valueInAED" />
                <TableHeader label="Net Equity" sortKey="netEquity" />
                <TableHeader label="Margin %" sortKey="margin" />
                <TableHeader label="Margin Amount" sortKey="marginAmount" />
                <TableHeader label="Surplus/Deficit" sortKey="surplusDeficit" />
                <TableHeader label="Risk Level" sortKey="riskLevel" />
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentItems.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {user.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                    {user.accountType}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {formatCurrency(user.accBalance)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {formatNumber(user.metalWeight)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {formatCurrency(user.valueInAED)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {formatCurrency(user.netEquity)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {formatNumber(user.margin)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {formatCurrency(user.marginAmount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                    <span
                      className={
                        user.surplusDeficit >= 0
                          ? "text-green-600 font-medium"
                          : "text-red-600 font-medium"
                      }
                    >
                      {formatCurrency(user.surplusDeficit)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <RiskIndicator riskLevel={user.riskLevel} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() =>
                setCurrentPage(currentPage > 1 ? currentPage - 1 : 1)
              }
              disabled={currentPage === 1}
              className={`${
                currentPage === 1
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              } relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md`}
            >
              Previous
            </button>
            <button
              onClick={() =>
                setCurrentPage(
                  currentPage < totalPages ? currentPage + 1 : totalPages
                )
              }
              disabled={currentPage === totalPages || totalPages === 0}
              className={`${
                currentPage === totalPages || totalPages === 0
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              } ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md`}
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing{" "}
                <span className="font-medium">
                  {filteredUsers.length > 0
                    ? (currentPage - 1) * itemsPerPage + 1
                    : 0}
                </span>{" "}
                to{" "}
                <span className="font-medium">
                  {Math.min(currentPage * itemsPerPage, filteredUsers.length)}
                </span>{" "}
                of <span className="font-medium">{filteredUsers.length}</span>{" "}
                results
              </p>
            </div>
            <div>
              <nav
                className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                aria-label="Pagination"
              >
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className={`${
                    currentPage === 1
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white text-gray-500 hover:bg-gray-50"
                  } relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 text-sm font-medium`}
                >
                  <span className="sr-only">First</span>
                  <ChevronLeft className="h-5 w-5" />
                  <ChevronLeft className="h-5 w-5 -ml-4" />
                </button>
                <button
                  onClick={() =>
                    setCurrentPage(currentPage > 1 ? currentPage - 1 : 1)
                  }
                  disabled={currentPage === 1}
                  className={`${
                    currentPage === 1
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white text-gray-500 hover:bg-gray-50"
                  } relative inline-flex items-center px-2 py-2 border border-gray-300 text-sm font-medium`}
                >
                  <span className="sr-only">Previous</span>
                  <ChevronLeft className="h-5 w-5" />
                </button>

                {/* Page numbers */}
                {[...Array(totalPages).keys()].map((page) => {
                  // Show only a window of pages around current page for better UX
                  if (
                    page + 1 === 1 ||
                    page + 1 === totalPages ||
                    (page + 1 >= currentPage - 2 && page + 1 <= currentPage + 2)
                  ) {
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page + 1)}
                        className={`${
                          currentPage === page + 1
                            ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                            : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                        } relative inline-flex items-center px-4 py-2 border text-sm font-medium`}
                      >
                        {page + 1}
                      </button>
                    );
                  } else if (
                    page + 1 === currentPage - 3 ||
                    page + 1 === currentPage + 3
                  ) {
                    return (
                      <span
                        key={page}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                      >
                        ...
                      </span>
                    );
                  }
                  return null;
                })}

                <button
                  onClick={() =>
                    setCurrentPage(
                      currentPage < totalPages ? currentPage + 1 : totalPages
                    )
                  }
                  disabled={currentPage === totalPages || totalPages === 0}
                  className={`${
                    currentPage === totalPages || totalPages === 0
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white text-gray-500 hover:bg-gray-50"
                  } relative inline-flex items-center px-2 py-2 border border-gray-300 text-sm font-medium`}
                >
                  <span className="sr-only">Next</span>
                  <ChevronRight className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className={`${
                    currentPage === totalPages
                      ? "text-gray-300"
                      : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <span className="sr-only">Last</span>
                  <ChevronRight className="h-5 w-5" />
                  <ChevronRight className="h-5 w-5 -ml-2" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Footer with metadata */}
      <div className="text-xs text-gray-500 flex items-center justify-between">
        <div className="flex items-center">
          <Clock className="h-3 w-3 mr-1" />
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
        <div className="flex items-center">
          <Info className="h-3 w-3 mr-1" />
          <span>
            Showing {filteredUsers.length} of {users.length} accounts
          </span>
        </div>
      </div>
    </div>
  );
}
