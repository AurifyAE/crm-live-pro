import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  RefreshCw,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  DollarSign,
  PieChart,
  BarChart2,
  TrendingUp,
  TrendingDown,
  Filter,
  Users,
  Database,
  Clock,
  Info,
  Scale,
} from "lucide-react";
import {
  PieChart as RechartsPC,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import useMarketData from "../components/marketData";
import axiosInstance from "../api/axios";
const adminId = localStorage.getItem("adminId");

export default function CashFlowManagement() {
  const { marketData } = useMarketData(["GOLD"]);
  const [liveRate, setLiveRate] = useState(0);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // States for filtering and pagination
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({
    key: "ACCODE",
    direction: "ascending",
  });
  const [favoriteFilter, setFavoriteFilter] = useState(false);

  // Filtering states
  const [accountTypeFilter, setAccountTypeFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  const [marginFilter, setMarginFilter] = useState("all"); // new filter for surplus/deficit

  // Show chart toggle
  const [showCharts, setShowCharts] = useState(true);

  // Summary statistics
  const [summaryStats, setSummaryStats] = useState({
    totalBankBalance: 0,
    totalDebtorEquity: 0,
    totalLPEquity: 0,
    highRiskCount: 0,
    moderateRiskCount: 0,
    safeRiskCount: 0,
    // Separate risk counts for LP
    lpHighRiskCount: 0,
    lpModerateRiskCount: 0,
    lpSafeRiskCount: 0,
    // Separate risk counts for debtor
    debtorHighRiskCount: 0,
    debtorModerateRiskCount: 0,
    debtorSafeRiskCount: 0,
    // Surplus/deficit metrics
    surplusMargin: 0,
    deficitMargin: 0,
    surplusAccounts: 0,
    deficitAccounts: 0,
    averageSurplus: 0,
    averageDeficit: 0,
  });

  // Selected card for detailed view
  const [selectedCard, setSelectedCard] = useState(null);

  // Format numbers consistently
  const formatNumber = useCallback((num) => {
    return num
      ? num.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : "0.00";
  }, []);

  // Calculate risk level based on account type and margin ratio
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

  // Calculate user data with updated values and margin risk level
  const calculateUserData = useCallback(
    (item, goldRate) => {
      const accountType = item.Account_Type?.toLowerCase() || "n/a";
      const accBalance = parseFloat(item.AMOUNTFC) || 0;
      const metalWeight = parseFloat(item.METAL_WT) || 0;
      const margin = parseFloat(item.margin) || 0;
      const goldRateValue = goldRate || 0;

      // Calculate values
      const valueInAED = parseFloat((goldRateValue * metalWeight).toFixed(2));
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

      return {
        id: item.ACCODE,
        name: item.ACCOUNT_HEAD,
        accBalance,
        metalWeight,
        goldratevalueInAED: goldRateValue,
        margin: margin || 0,
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

  // Fetch data from backend
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/fetch-data/${adminId}`);
      if (response.data.status === 200) {
        // Process and transform the data
        const transformedData = response.data.data.map((item) =>
          calculateUserData(item, liveRate)
        );
        setUsers(transformedData);

        // Calculate summary statistics
        calculateSummaryStats(transformedData);
      } else {
        setError("Failed to fetch data");
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Error connecting to server");
    } finally {
      setLoading(false);
    }
  }, [liveRate, calculateUserData]);

  // Calculate summary statistics
  // Calculate summary statistics
  const calculateSummaryStats = useCallback((userData) => {
    // Filter accounts by type
    const bankAccounts = userData.filter((user) => user.accountType === "bank");
    const debtorAccounts = userData.filter(
      (user) => user.accountType === "debtor"
    );
    const lpAccounts = userData.filter((user) => user.accountType === "lp");

    // Only include LP and debtor accounts for risk and surplus/deficit calculations
    const applicableAccounts = userData.filter(
      (user) => user.accountType === "lp" || user.accountType === "debtor"
    );

    // Only calculate surplus/deficit for LP and debtor accounts
    const surplusAccounts = applicableAccounts.filter(
      (user) => user.surplusDeficit > 0
    );
    const deficitAccounts = applicableAccounts.filter(
      (user) => user.surplusDeficit < 0
    );

    // Calculate totals by account type
    const totalBankBalance = bankAccounts.reduce(
      (sum, user) => sum + user.accBalance,
      0
    );
    const totalDebtorEquity = debtorAccounts.reduce(
      (sum, user) => sum + user.netEquity,
      0
    );
    const totalLPEquity = lpAccounts.reduce(
      (sum, user) => sum + user.netEquity,
      0
    );

    // Calculate surplus/deficit metrics only for applicable accounts
    const surplusMargin = surplusAccounts.reduce(
      (sum, user) => sum + user.surplusDeficit,
      0
    );
    const deficitMargin = Math.abs(
      deficitAccounts.reduce((sum, user) => sum + user.surplusDeficit, 0)
    );

    // Calculate risk counts separately for LP and debtor accounts
    const lpHighRiskCount = lpAccounts.filter(
      (user) => user.riskLevel === "high"
    ).length;
    const lpModerateRiskCount = lpAccounts.filter(
      (user) => user.riskLevel === "moderate"
    ).length;
    const lpSafeRiskCount = lpAccounts.filter(
      (user) => user.riskLevel === "safe"
    ).length;

    const debtorHighRiskCount = debtorAccounts.filter(
      (user) => user.riskLevel === "high"
    ).length;
    const debtorModerateRiskCount = debtorAccounts.filter(
      (user) => user.riskLevel === "moderate"
    ).length;
    const debtorSafeRiskCount = debtorAccounts.filter(
      (user) => user.riskLevel === "safe"
    ).length;

    // Combined risk counts
    const highRiskCount = lpHighRiskCount + debtorHighRiskCount;
    const moderateRiskCount = lpModerateRiskCount + debtorModerateRiskCount;
    const safeRiskCount = lpSafeRiskCount + debtorSafeRiskCount;

    setSummaryStats({
      totalBankBalance,
      totalDebtorEquity,
      totalLPEquity,
      highRiskCount,
      moderateRiskCount,
      safeRiskCount,
      // Separate LP and debtor risk counts
      lpHighRiskCount,
      lpModerateRiskCount,
      lpSafeRiskCount,
      debtorHighRiskCount,
      debtorModerateRiskCount,
      debtorSafeRiskCount,
      // Surplus/deficit metrics
      surplusMargin,
      deficitMargin,
      surplusAccounts: surplusAccounts.length,
      deficitAccounts: deficitAccounts.length,
      averageSurplus:
        surplusAccounts.length > 0 ? surplusMargin / surplusAccounts.length : 0,
      averageDeficit:
        deficitAccounts.length > 0 ? deficitMargin / deficitAccounts.length : 0,
    });
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Update calculations when market data changes
  useEffect(() => {
    if (marketData?.bid) {
      const calculatedRate = parseFloat(
        ((marketData.bid / 31.103) * 3.674).toFixed(2)
      );
      setLiveRate(calculatedRate);

      // Update users with new gold rate
      setUsers((prevUsers) =>
        prevUsers.map((user) => {
          const valueInAED = parseFloat(
            (calculatedRate * user.metalWeight).toFixed(2)
          );
          const netEquity = parseFloat(
            (valueInAED + user.accBalance).toFixed(2)
          );
          const marginAmount = parseFloat(
            ((netEquity * user.margin) / 100).toFixed(2)
          );
          const surplusDeficit = netEquity - marginAmount;

          // Calculate margin ratio based on account type
          let marginRatio = 0;
          if (user.accountType === "lp") {
            marginRatio = netEquity > 0 ? marginAmount / netEquity : 0;
          } else if (user.accountType === "debtor") {
            marginRatio = marginAmount > 0 ? netEquity / marginAmount : 0;
          }

          const riskLevel = calculateRiskLevel(user.accountType, marginRatio);

          return {
            ...user,
            goldratevalueInAED: calculatedRate,
            valueInAED,
            netEquity,
            marginAmount,
            surplusDeficit,
            marginRatio,
            riskLevel,
          };
        })
      );
    }
  }, [marketData?.bid, calculateRiskLevel]);

  // Separate effect for summary stats that depends on users
  useEffect(() => {
    if (users.length > 0) {
      calculateSummaryStats(users);
    }
  }, [users, calculateSummaryStats]);

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

  // Sorted users
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

  // Filtered users with improved filtering
  const filteredUsers = useMemo(() => {
    return sortedUsers.filter((user) => {
      // Search filter
      const matchesSearch =
        search === "" ||
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.id.toString().includes(search);

      // Favorite filter
      const matchesFavorite = !favoriteFilter || user.favorite;

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

      // Card selection filter - updated to handle all card types
      // Card selection filter - updated to handle all card types and show only LP/debtor for surplus/deficit
      const matchesSelectedCard =
        !selectedCard ||
        // General risk levels
        (selectedCard === "high" && user.riskLevel === "high") ||
        (selectedCard === "moderate" && user.riskLevel === "moderate") ||
        (selectedCard === "safe" && user.riskLevel === "safe") ||
        // LP-specific risk levels
        (selectedCard === "lpHigh" &&
          user.accountType === "lp" &&
          user.riskLevel === "high") ||
        (selectedCard === "lpModerate" &&
          user.accountType === "lp" &&
          user.riskLevel === "moderate") ||
        (selectedCard === "lpSafe" &&
          user.accountType === "lp" &&
          user.riskLevel === "safe") ||
        // Debtor-specific risk levels
        (selectedCard === "debtorHigh" &&
          user.accountType === "debtor" &&
          user.riskLevel === "high") ||
        (selectedCard === "debtorModerate" &&
          user.accountType === "debtor" &&
          user.riskLevel === "moderate") ||
        (selectedCard === "debtorSafe" &&
          user.accountType === "debtor" &&
          user.riskLevel === "safe") ||
        // Surplus/deficit filters - only show LP and debtor accounts
        (selectedCard === "surplus" &&
          (user.accountType === "lp" || user.accountType === "debtor") &&
          user.surplusDeficit > 0) ||
        (selectedCard === "deficit" &&
          (user.accountType === "lp" || user.accountType === "debtor") &&
          user.surplusDeficit < 0) ||
        // Account type and equity filters
        (selectedCard === "debtorEquity" && user.accountType === "debtor") ||
        (selectedCard === "lpEquity" && user.accountType === "lp") ||
        (selectedCard === "bankBalance" && user.accountType === "bank") ||
        // Advanced filters - only show LP and debtor accounts
        (selectedCard === "totalSurplus" &&
          (user.accountType === "lp" || user.accountType === "debtor") &&
          user.surplusDeficit > 0) ||
        (selectedCard === "totalDeficit" &&
          (user.accountType === "lp" || user.accountType === "debtor") &&
          user.surplusDeficit < 0) ||
        (selectedCard === "avgSurplus" &&
          (user.accountType === "lp" || user.accountType === "debtor") &&
          user.surplusDeficit > 0) ||
        (selectedCard === "avgDeficit" &&
          (user.accountType === "lp" || user.accountType === "debtor") &&
          user.surplusDeficit < 0) ||
        (selectedCard === "netPosition" &&
          (user.accountType === "lp" || user.accountType === "debtor"));

      return (
        matchesSearch &&
        matchesFavorite &&
        matchesAccountType &&
        matchesRisk &&
        matchesMargin &&
        matchesSelectedCard
      );
    });
  }, [
    sortedUsers,
    search,
    favoriteFilter,
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
      case "favorite":
        setFavoriteFilter(value);
        break;
      default:
        break;
    }
    setCurrentPage(1); // Reset to first page when filter changes
  }, []);

  // Risk indicator component
  // Risk indicator component
  const RiskIndicator = ({ riskLevel }) => {
    const riskConfig = {
      high: {
        color: "text-red-600",
        icon: <AlertCircle className="h-4 w-4 mr-1" />,
        text: "High Risk",
      },
      moderate: {
        color: "text-amber-500",
        icon: <AlertTriangle className="h-4 w-4 mr-1" />,
        text: "Moderate",
      },
      safe: {
        color: "text-green-600",
        icon: <CheckCircle className="h-4 w-4 mr-1" />,
        text: "Safe",
      },
      "N/A": {
        color: "text-gray-400",
        icon: <Info className="h-4 w-4 mr-1" />,
        text: "N/A",
      },
    };

    const config = riskConfig[riskLevel] || riskConfig["N/A"];

    return (
      <div className={`flex items-center ${config.color}`}>
        {config.icon}
        <span>{config.text}</span>
      </div>
    );
  };

  // Create chart data
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
    };
  }, [summaryStats, users]);

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border border-gray-200 shadow-md rounded">
          <p className="font-medium">{`${payload[0].name}: ${formatNumber(
            payload[0].value
          )}`}</p>
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

  // Card component for summary stats
  const SummaryCard = ({ title, value, icon, color, isSelected, onClick }) => (
    <div
      className={`p-4 rounded-lg shadow transition-all duration-200 ${
        isSelected
          ? `bg-${color}-100 border-2 border-${color}-500`
          : "bg-white hover:bg-gray-50"
      } cursor-pointer`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className={`text-2xl font-bold text-${color}-600`}>
            {typeof value === "number" ? formatNumber(value) : value}
          </p>
        </div>
        <div className={`p-2 rounded-full bg-${color}-100`}>{icon}</div>
      </div>
    </div>
  );

  // Table header component for reusability
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
  const formatCurrencyValue = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "AED",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Cash Flow Management
        </h1>
        <div className="flex items-center text-sm text-gray-600">
          <p>
            Current Gold Rate:{" "}
            <span className="font-bold">{formatNumber(liveRate)} AED/g</span>
          </p>
          <RefreshCw
            className="ml-2 h-4 w-4 cursor-pointer hover:text-blue-600"
            onClick={fetchUsers}
          />
        </div>
      </div>

      {/* Summary Statistics Cards */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-3">
          Summary Statistics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* Combined Risk Distribution Cards */}
          <SummaryCard
            title="All High Risk Accounts"
            value={summaryStats.highRiskCount}
            icon={<AlertCircle className="h-5 w-5 text-red-600" />}
            color="red"
            isSelected={selectedCard === "high"}
            onClick={() => handleCardSelect("high")}
          />
          <SummaryCard
            title="All Moderate Risk Accounts"
            value={summaryStats.moderateRiskCount}
            icon={<AlertTriangle className="h-5 w-5 text-amber-500" />}
            color="amber"
            isSelected={selectedCard === "moderate"}
            onClick={() => handleCardSelect("moderate")}
          />
          <SummaryCard
            title="All Safe Accounts"
            value={summaryStats.safeRiskCount}
            icon={<CheckCircle className="h-5 w-5 text-green-600" />}
            color="green"
            isSelected={selectedCard === "safe"}
            onClick={() => handleCardSelect("safe")}
          />

          {/* LP Risk Distribution Cards */}
          {/* <SummaryCard
      title="LP High Risk"
      value={summaryStats.lpHighRiskCount}
      icon={<Database className="h-5 w-5 text-red-600" />}
      color="red"
      isSelected={selectedCard === "lpHigh"}
      onClick={() => handleCardSelect("lpHigh")}
    />
    <SummaryCard
      title="LP Moderate Risk"
      value={summaryStats.lpModerateRiskCount}
      icon={<Database className="h-5 w-5 text-amber-500" />}
      color="amber"
      isSelected={selectedCard === "lpModerate"}
      onClick={() => handleCardSelect("lpModerate")}
    />
    <SummaryCard
      title="LP Safe"
      value={summaryStats.lpSafeRiskCount}
      icon={<Database className="h-5 w-5 text-green-600" />}
      color="green"
      isSelected={selectedCard === "lpSafe"}
      onClick={() => handleCardSelect("lpSafe")}
    /> */}

          {/* Debtor Risk Distribution Cards */}
          {/* <SummaryCard
      title="Debtor High Risk"
      value={summaryStats.debtorHighRiskCount}
      icon={<Users className="h-5 w-5 text-red-600" />}
      color="red"
      isSelected={selectedCard === "debtorHigh"}
      onClick={() => handleCardSelect("debtorHigh")}
    />
    <SummaryCard
      title="Debtor Moderate Risk"
      value={summaryStats.debtorModerateRiskCount}
      icon={<Users className="h-5 w-5 text-amber-500" />}
      color="amber"
      isSelected={selectedCard === "debtorModerate"}
      onClick={() => handleCardSelect("debtorModerate")}
    />
    <SummaryCard
      title="Debtor Safe"
      value={summaryStats.debtorSafeRiskCount}
      icon={<Users className="h-5 w-5 text-green-600" />}
      color="green"
      isSelected={selectedCard === "debtorSafe"}
      onClick={() => handleCardSelect("debtorSafe")}
    /> */}

          {/* Cash Flow Cards */}
          <SummaryCard
            title="Surplus Accounts"
            value={summaryStats.surplusAccounts}
            icon={<TrendingUp className="h-5 w-5 text-green-600" />}
            color="green"
            isSelected={selectedCard === "surplus"}
            onClick={() => handleCardSelect("surplus")}
          />
          <SummaryCard
            title="Deficit Accounts"
            value={summaryStats.deficitAccounts}
            icon={<TrendingDown className="h-5 w-5 text-red-600" />}
            color="red"
            isSelected={selectedCard === "deficit"}
            onClick={() => handleCardSelect("deficit")}
          />

          {/* Value Cards */}
          <SummaryCard
            title="Total Surplus"
            value={formatCurrencyValue(summaryStats.surplusMargin)}
            icon={<DollarSign className="h-5 w-5 text-green-600" />}
            color="green"
            isSelected={selectedCard === "totalSurplus"}
            onClick={() => handleCardSelect("totalSurplus")}
          />
          <SummaryCard
            title="Total Deficit"
            value={formatCurrencyValue(summaryStats.deficitMargin)}
            icon={<DollarSign className="h-5 w-5 text-red-600" />}
            color="red"
            isSelected={selectedCard === "totalDeficit"}
            onClick={() => handleCardSelect("totalDeficit")}
          />

          {/* Account Type Cards */}
          <SummaryCard
            title="Debtor Equity"
            value={formatCurrencyValue(summaryStats.totalDebtorEquity)}
            icon={<Users className="h-5 w-5 text-purple-600" />}
            color="purple"
            isSelected={selectedCard === "debtorEquity"}
            onClick={() => handleCardSelect("debtorEquity")}
          />
          <SummaryCard
            title="LP Equity"
            value={formatCurrencyValue(summaryStats.totalLPEquity)}
            icon={<Database className="h-5 w-5 text-blue-600" />}
            color="blue"
            isSelected={selectedCard === "lpEquity"}
            onClick={() => handleCardSelect("lpEquity")}
          />
          <SummaryCard
            title="Bank Balance"
            value={formatCurrencyValue(summaryStats.totalBankBalance)}
            icon={<DollarSign className="h-5 w-5 text-teal-600" />}
            color="teal"
            isSelected={selectedCard === "bankBalance"}
            onClick={() => handleCardSelect("bankBalance")}
          />

          {/* Average Cards
    <SummaryCard
      title="Average Surplus"
      value={formatCurrencyValue(summaryStats.averageSurplus)}
      icon={<BarChart2 className="h-5 w-5 text-green-600" />}
      color="green"
      isSelected={selectedCard === "avgSurplus"}
      onClick={() => handleCardSelect("avgSurplus")}
    />
    <SummaryCard
      title="Average Deficit"
      value={formatCurrencyValue(summaryStats.averageDeficit)}
      icon={<BarChart2 className="h-5 w-5 text-red-600" />}
      color="red"
      isSelected={selectedCard === "avgDeficit"}
      onClick={() => handleCardSelect("avgDeficit")}
    /> */}

          {/* Balance Metrics */}
          <SummaryCard
            title="Net Position"
            value={formatCurrencyValue(
              summaryStats.surplusMargin - summaryStats.deficitMargin
            )}
            icon={<Scale className="h-5 w-5 text-blue-600" />}
            color={
              summaryStats.surplusMargin >= summaryStats.deficitMargin
                ? "green"
                : "red"
            }
            isSelected={selectedCard === "netPosition"}
            onClick={() => handleCardSelect("netPosition")}
          />
        </div>
      </div>

      {/* Charts Section */}
      {showCharts && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold text-gray-700">
              Charts & Analytics
            </h2>
            <button
              className="text-sm flex items-center text-blue-600 hover:text-blue-800"
              onClick={() => setShowCharts(false)}
            >
              <ChevronUp className="h-4 w-4 mr-1" />
              Hide Charts
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Risk Distribution Chart */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-600 mb-2">
                Risk Distribution
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPC>
                    <Pie
                      data={chartData.riskDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {chartData.riskDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                  </RechartsPC>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Account Type Distribution Chart */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-600 mb-2">
                Account Type Distribution
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPC>
                    <Pie
                      data={chartData.accountType}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {chartData.accountType.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                  </RechartsPC>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Cash Flow Chart */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-600 mb-2">
                Cash Flow Balance
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPC>
                    <Pie
                      data={chartData.cashFlow}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {chartData.cashFlow.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                  </RechartsPC>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters Section */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0 md:space-x-4">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Search accounts..."
              value={search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
            />
          </div>

          {/* Account Type Filter */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">
              Account Type:
            </label>
            <select
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              value={accountTypeFilter}
              onChange={(e) => handleFilterChange("account", e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="debtor">Debtor</option>
              <option value="lp">LP</option>
              <option value="bank">Bank</option>
            </select>
          </div>

          {/* Risk Level Filter */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">
              Risk Level:
            </label>
            <select
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              value={riskFilter}
              onChange={(e) => handleFilterChange("risk", e.target.value)}
            >
              <option value="all">All Risks</option>
              <option value="high">High Risk</option>
              <option value="moderate">Moderate Risk</option>
              <option value="safe">Safe</option>
            </select>
          </div>

          {/* Margin Filter */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">
              Margin Status:
            </label>
            <select
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              value={marginFilter}
              onChange={(e) => handleFilterChange("margin", e.target.value)}
            >
              <option value="all">All</option>
              <option value="surplus">Surplus</option>
              <option value="deficit">Deficit</option>
            </select>
          </div>

          {/* Favorite Filter */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">
              Favorites:
            </label>
            <div className="relative inline-block w-10 mr-2 align-middle select-none">
              <input
                type="checkbox"
                id="favoriteToggle"
                className="sr-only"
                checked={favoriteFilter}
                onChange={(e) =>
                  handleFilterChange("favorite", e.target.checked)
                }
              />
              <label
                htmlFor="favoriteToggle"
                className={`block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer ${
                  favoriteFilter ? "bg-blue-500" : ""
                }`}
              >
                <span
                  className={`block h-6 w-6 rounded-full bg-white shadow transform transition-transform ${
                    favoriteFilter ? "translate-x-4" : "translate-x-0"
                  }`}
                ></span>
              </label>
            </div>
          </div>

          {/* Show/Hide Charts Button */}
          {!showCharts && (
            <button
              className="text-sm flex items-center text-blue-600 hover:text-blue-800"
              onClick={() => setShowCharts(true)}
            >
              <ChevronDown className="h-4 w-4 mr-1" />
              Show Charts
            </button>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <TableHeader label="Account ID" sortKey="id" />
                <TableHeader label="Account Name" sortKey="name" />
                <TableHeader label="Account Type" sortKey="accountType" />
                <TableHeader label="Account Balance" sortKey="accBalance" />
                <TableHeader label="Metal Weight (g)" sortKey="metalWeight" />
                <TableHeader label="Value in AED" sortKey="valueInAED" />
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                    {user.accountType}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatNumber(user.accBalance)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatNumber(user.metalWeight)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatNumber(user.valueInAED)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatNumber(user.netEquity)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">{user.margin}%</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatNumber(user.marginAmount)}
                  </td>
                  <td
                    className={`px-6 py-4 whitespace-nowrap text-sm ${
                      user.surplusDeficit >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {formatNumber(user.surplusDeficit)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <RiskIndicator riskLevel={user.riskLevel} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md bg-white ${
                currentPage === 1
                  ? "text-gray-300"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              Previous
            </button>
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md bg-white ${
                currentPage === totalPages
                  ? "text-gray-300"
                  : "text-gray-700 hover:bg-gray-50"
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
                  {(currentPage - 1) * itemsPerPage + 1}
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
                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                    currentPage === 1
                      ? "text-gray-300"
                      : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <span className="sr-only">First</span>
                  <ChevronLeft className="h-5 w-5" />
                  <ChevronLeft className="h-5 w-5 -ml-2" />
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium ${
                    currentPage === 1
                      ? "text-gray-300"
                      : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <span className="sr-only">Previous</span>
                  <ChevronLeft className="h-5 w-5" />
                </button>

                {/* Page Numbers */}
                {[...Array(totalPages).keys()].map((page) => {
                  const pageNumber = page + 1;
                  // Show limited page numbers with ellipsis
                  if (
                    pageNumber === 1 ||
                    pageNumber === totalPages ||
                    (pageNumber >= currentPage - 1 &&
                      pageNumber <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => setCurrentPage(pageNumber)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === pageNumber
                            ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                            : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  } else if (
                    (pageNumber === currentPage - 2 && currentPage > 3) ||
                    (pageNumber === currentPage + 2 &&
                      currentPage < totalPages - 2)
                  ) {
                    return (
                      <span
                        key={pageNumber}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                      >
                        ...
                      </span>
                    );
                  } else {
                    return null;
                  }
                })}

                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className={`relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium ${
                    currentPage === totalPages
                      ? "text-gray-300"
                      : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <span className="sr-only">Next</span>
                  <ChevronRight className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
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
