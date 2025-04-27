import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  X,
  CheckCircle,
  AlertCircle,
  Users,
  ArrowUpDown,
  ChevronDown,
  Settings,
  LogOut,
} from "lucide-react";
import axiosInstance from "../api/axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
const adminId = localStorage.getItem("adminId");
import { useNavigate } from "react-router-dom";

const initialFormState = {
  ACCOUNT_HEAD: "",
  ACCODE: "",
  Account_Type: "",
  margin: 0,
  AMOUNTFC: 0,
  METAL_WT: 0,
  created_by: "admin",
};

// User Avatar Component
const UserAvatar = ({ name }) => {
  const initials = name
    ? name
        .split(" ")
        .map((word) => word[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "";

  // Generate consistent color based on name
  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-yellow-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-red-500",
    "bg-teal-500",
  ];

  const colorIndex = name
    ? name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) %
      colors.length
    : 0;

  return (
    <div
      className={`flex items-center justify-center rounded-full w-10 h-10 text-white font-medium ${colors[colorIndex]}`}
    >
      {initials || "?"}
    </div>
  );
};

// Account Modal Component
function AccountModal({
  isModalOpen,
  handleCloseModal,
  isEditMode,
  formData,
  handleInputChange,
  handleSubmit,
  formSubmitting,
}) {
  const modalInitialFocusRef = useRef(null);
  const isBankAccount = formData.Account_Type === "BANK";
  // Modal focus management
  useEffect(() => {
    if (isModalOpen && modalInitialFocusRef.current) {
      // Focus first field when modal opens
      setTimeout(() => {
        modalInitialFocusRef.current.focus();
      }, 50);
    }
  }, [isModalOpen]);

  // Update margin to 0 when account type changes to BANK
  useEffect(() => {
    if (formData.Account_Type === "BANK") {
      handleInputChange({
        target: {
          name: "margin",
          value: 0,
          type: "number",
        },
      });
    }
  }, [formData.Account_Type, handleInputChange]);

  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div
        className="bg-white rounded-xl shadow-2xl w-11/12 max-w-2xl p-6 mx-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            {formData.ACCOUNT_HEAD && (
              <UserAvatar name={formData.ACCOUNT_HEAD} />
            )}
            <h2 id="modal-title" className="text-2xl font-bold text-gray-800">
              {isEditMode ? "Edit Account" : "Add New Account"}
            </h2>
          </div>
          <button
            onClick={handleCloseModal}
            className="text-gray-500 hover:text-gray-700 transition-colors p-1 hover:bg-gray-100 rounded-full"
            disabled={formSubmitting}
            aria-label="Close modal"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-5">
          <div className="col-span-2">
            <label
              htmlFor="account-head"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Account Name *
            </label>
            <input
              id="account-head"
              type="text"
              name="ACCOUNT_HEAD"
              value={formData.ACCOUNT_HEAD}
              onChange={handleInputChange}
              ref={modalInitialFocusRef}
              className="block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              disabled={formSubmitting}
              required
            />
          </div>

          <div>
            <label
              htmlFor="account-code"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Account Code *
            </label>
            <input
              id="account-code"
              type="text"
              name="ACCODE"
              value={formData.ACCODE}
              onChange={handleInputChange}
              disabled={isEditMode || formSubmitting}
              className="block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 transition-all"
              required
            />
          </div>

          <div>
            <label
              htmlFor="account-type"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Account Type *
            </label>
            <select
              id="account-type"
              name="Account_Type"
              value={formData.Account_Type}
              onChange={handleInputChange}
              className="block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white transition-all"
              disabled={formSubmitting}
              required
            >
              <option value="">Select Account Type</option>
              <option value="LP">Liquidity Provider</option>
              <option value="BANK">Bank</option>
              <option value="DEBTOR">Debtor</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="margin"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Margin (%)
            </label>
            <input
              id="margin"
              type="number"
              name="margin"
              value={formData.margin}
              onChange={handleInputChange}
              className="block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition-all disabled:bg-gray-100"
              disabled={formSubmitting || isBankAccount}
              title={
                isBankAccount ? "Margin is always 0 for Bank accounts" : ""
              }
            />
            {isBankAccount && (
              <p className="text-xs text-gray-500 mt-1">
                Margin is set to 0 for Bank accounts
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="amount-fc"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Amount
            </label>
            <input
              id="amount-fc"
              type="number"
              name="AMOUNTFC"
              value={formData.AMOUNTFC}
              onChange={handleInputChange}
              className="block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              disabled={formSubmitting}
            />
          </div>

          <div>
            <label
              htmlFor="metal-wt"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Metal Weight
            </label>
            <input
              id="metal-wt"
              type="number"
              name="METAL_WT"
              value={formData.METAL_WT}
              onChange={handleInputChange}
              className="block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              disabled={formSubmitting}
            />
          </div>

          <div className="col-span-2 flex justify-end space-x-4 mt-6">
            <button
              type="button"
              onClick={handleCloseModal}
              className="px-6 py-3 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 font-medium transition-colors disabled:opacity-50"
              disabled={formSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors disabled:opacity-50 flex items-center"
              disabled={formSubmitting}
            >
              {formSubmitting && (
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              )}
              {isEditMode ? "Update Account" : "Add Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


const UnifiedAccountManagement = () => {
  // Core states
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Search and filtering states
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const searchInputRef = useRef(null);

  // Pagination and sorting states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({
    key: "ACCODE",
    direction: "ascending",
  });

  // Modal and form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({ ...initialFormState });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [currentAccount, setCurrentAccount] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  // Toast styles
  const toastStyles = {
    success: {
      style: {
        border: "2px solid #10B981",
        padding: "16px",
        color: "#10B981",
        backgroundColor: "#ECFDF5",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        borderRadius: "12px",
      },
      icon: <CheckCircle className="text-green-500" />,
    },
    error: {
      style: {
        border: "2px solid #EF4444",
        padding: "16px",
        color: "#EF4444",
        backgroundColor: "#FEE2E2",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        borderRadius: "12px",
      },
      icon: <AlertCircle className="text-red-500" />,
    },
  };

  const showSuccessToast = (message) => {
    toast.success(message, {
      style: toastStyles.success.style,
      icon: toastStyles.success.icon,
      duration: 3000,
      position: "top-right",
    });
  };

  const showErrorToast = (message) => {
    toast.error(message, {
      style: toastStyles.error.style,
      icon: toastStyles.error.icon,
      duration: 3000,
      position: "top-right",
    });
  };

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300); // 300ms debounce delay

    return () => clearTimeout(timer);
  }, [search]);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  // Fetch data from API
  const fetchData = useCallback(async () => {
    const loadingToast = toast.loading("Loading accounts...", {
      style: {
        border: "2px solid #3B82F6",
        padding: "16px",
        color: "#3B82F6",
        backgroundColor: "#EFF6FF",
        borderRadius: "12px",
      },
    });

    try {
      setLoading(true);
      // Updated endpoint to use adminId in the URL
      const response = await axiosInstance.get(`/fetch-data/${adminId}`);

      toast.dismiss(loadingToast);

      if (response.data.status === 200) {
        const adminAccounts = response.data.data.filter(
          (account) => account.created_by === "admin"
        );
        setAccounts(adminAccounts);
        setError(null);
      } else {
        throw new Error("Failed to fetch accounts");
      }
    } catch (err) {
      toast.dismiss(loadingToast);
      console.error("Fetch error:", err);
      setError(err.message || "Error fetching accounts");
      showErrorToast("Error fetching accounts");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load data on component mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Modal handlers
  const handleOpenAddModal = useCallback(() => {
    setFormData({ ...initialFormState });
    setIsEditMode(false);
    setCurrentAccount(null);
    setIsModalOpen(true);
  }, []);

  const handleOpenEditModal = useCallback((account) => {
    setFormData({
      ACCOUNT_HEAD: account.ACCOUNT_HEAD || "",
      ACCODE: account.ACCODE || "",
      Account_Type: account.Account_Type || "",
      margin: account.margin || 0,
      AMOUNTFC: account.AMOUNTFC || 0,
      METAL_WT: account.METAL_WT || 0,
      created_by: "admin",
    });
    setIsEditMode(true);
    setCurrentAccount(account);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);



  // Form handlers
  const handleInputChange = useCallback((e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? parseFloat(value) || 0 : value,
    }));
  }, []);

  const validateForm = () => {
    if (!formData.ACCOUNT_HEAD.trim()) {
      showErrorToast("Account Name is required");
      return false;
    }
    if (!formData.ACCODE.trim()) {
      showErrorToast("Account Code is required");
      return false;
    }
    if (!formData.Account_Type) {
      showErrorToast("Account Type is required");
      return false;
    }
    return true;
  };

  const resetForm = () => {
    setFormData({ ...initialFormState });
    setCurrentAccount(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    const loadingToast = toast.loading(
      isEditMode ? "Updating account..." : "Adding account...",
      {
        style: {
          border: "2px solid #3B82F6",
          padding: "16px",
          color: "#3B82F6",
          backgroundColor: "#EFF6FF",
          borderRadius: "12px",
        },
      }
    );

    setFormSubmitting(true);
    try {
      // Prepare the combined account data (now including transaction data)
      const accountData = {
        ACCOUNT_HEAD: formData.ACCOUNT_HEAD,
        ACCODE: formData.ACCODE,
        Account_Type: formData.Account_Type,
        margin: formData.Account_Type === "BANK" ? 0 : formData.margin, // Ensure margin is 0 for BANK
        AMOUNTFC: formData.AMOUNTFC,
        METAL_WT: formData.METAL_WT,
        created_by: "admin",
      };

      if (isEditMode) {
        // For update operations, use the ACCODE and adminId in the URL path
        const accode = formData.ACCODE;
        const response = await axiosInstance.put(
          `/accounts/${accode}/${adminId}`,
          accountData
        );

        toast.dismiss(loadingToast);

        if (
          response.data &&
          (response.data.success === true || response.data.status === 201)
        ) {
          showSuccessToast("Account updated successfully");
          await fetchData();
          handleCloseModal();
          resetForm();
        } else {
          throw new Error("Failed to update account");
        }
      } else {
        // For new account creation
        const response = await axiosInstance.post(
          `/accounts/${adminId}`,
          accountData
        );

        toast.dismiss(loadingToast);

        if (
          response.data &&
          (response.data.success === true || response.data.status === 201)
        ) {
          showSuccessToast("Account added successfully");
          await fetchData();
          handleCloseModal();
          resetForm();
        } else {
          throw new Error("Account creation failed");
        }
      }
    } catch (err) {
      toast.dismiss(loadingToast);
      console.error("Form submission error:", err);
      showErrorToast(
        err.message ||
          (isEditMode ? "Error updating account" : "Error adding account")
      );
    } finally {
      setFormSubmitting(false);
    }
  };

  // Delete handler
  const handleDeleteAccount = useCallback((accode) => {
    toast(
      (t) => (
        <div className="flex flex-col space-y-2">
          <div className="flex items-center space-x-2 mb-1">
            <AlertCircle className="text-yellow-500" />
            <span className="font-bold">Confirm Deletion</span>
          </div>
          <p className="text-sm">
            Are you sure you want to delete this account? This action cannot be
            undone.
          </p>
          <div className="flex space-x-2 mt-3">
            <button
              onClick={() => {
                toast.dismiss(t.id);
                performDeletion(accode);
              }}
              className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-600 transition-colors"
            >
              Delete
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ),
      {
        style: {
          border: "2px solid #FBBF24",
          padding: "16px",
          backgroundColor: "#FEF3C7",
          borderRadius: "12px",
        },
        duration: Infinity,
      }
    );

    const performDeletion = async (accode) => {
      const loadingToast = toast.loading("Deleting account...", {
        style: {
          border: "2px solid #3B82F6",
          padding: "16px",
          color: "#3B82F6",
          backgroundColor: "#EFF6FF",
          borderRadius: "12px",
        },
      });

      try {
        setLoading(true);
        // Updated delete endpoint with adminId
        const response = await axiosInstance.delete(
          `/accounts/${accode}/${adminId}`
        );

        toast.dismiss(loadingToast);

        if (
          response.data &&
          (response.data.success === true || response.data.status === 201)
        ) {
          showSuccessToast("Account deleted successfully");

          // Update local state immediately
          setAccounts((prevAccounts) =>
            prevAccounts.filter((account) => account.ACCODE !== accode)
          );
        } else {
          throw new Error("Failed to delete account");
        }
      } catch (err) {
        toast.dismiss(loadingToast);
        console.error("Delete error:", err);
        showErrorToast("Error deleting account");
      } finally {
        setLoading(false);
      }
    };
  }, []);

  // Search focus handler
  const focusSearchInput = useCallback(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // Key event handlers for accessibility
  const handleKeyDown = useCallback(
    (e) => {
      // Implement keyboard shortcuts if needed
      if (e.key === "f" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        focusSearchInput();
      }
    },
    [focusSearchInput]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Sorting handler
  const requestSort = useCallback((key) => {
    setSortConfig((prevConfig) => ({
      key,
      direction:
        prevConfig.key === key && prevConfig.direction === "ascending"
          ? "descending"
          : "ascending",
    }));
  }, []);

  // Memoized filtered and sorted data
  const filteredAccounts = useMemo(() => {
    return accounts
      .filter((account) => {
        const searchLower = debouncedSearch.toLowerCase();
        return (
          (account.ACCOUNT_HEAD?.toLowerCase() || "").includes(searchLower) ||
          (account.ACCODE?.toLowerCase() || "").includes(searchLower) ||
          (account.Account_Type?.toLowerCase() || "").includes(searchLower)
        );
      })
      .sort((a, b) => {
        const aValue = a[sortConfig.key] ?? "";
        const bValue = b[sortConfig.key] ?? "";
        return sortConfig.direction === "ascending"
          ? String(aValue).localeCompare(String(bValue))
          : String(bValue).localeCompare(String(aValue));
      });
  }, [accounts, debouncedSearch, sortConfig]);

  // Memoized paginated data
  const paginatedAccounts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAccounts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAccounts, currentPage, itemsPerPage]);

  const handleViewProfile = useCallback((userId) => {
    navigate(`/profile/${userId}`);
  }, [navigate]);
  // Loading state display
  if (loading && accounts.length === 0) {
    return (
      <div className="fixed inset-0 flex justify-center items-center bg-white">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading accounts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 w-full min-h-screen">
      <div className="container mx-auto">
        <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100">
          {/* Header with user profile */}
          <div className="flex justify-between items-center p-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <h1 className="text-3xl font-bold">Account Management</h1>

            <div className="flex items-center space-x-4">
              <button
                onClick={handleOpenAddModal}
                className="flex items-center bg-white text-black px-4 py-2 rounded-lg hover:bg-indigo-50 font-medium transition-colors shadow-md"
                disabled={loading}
              >
                <Plus className="mr-2" size={18} /> Add Account
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div className="relative flex-grow max-w-md">
                <input
                  type="text"
                  placeholder="Search accounts..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  disabled={loading}
                  ref={searchInputRef}
                />
                <Search
                  className="absolute left-3 top-3 text-gray-400"
                  size={20}
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>

              <div className="flex space-x-2 items-center">
                <button
                  className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => {
                    /* Filter logic would go here */
                  }}
                  disabled={loading}
                >
                  <Filter className="mr-2" size={18} />
                  Filter
                </button>

                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="border border-gray-300 rounded-lg py-2 px-3 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700"
                  disabled={loading}
                >
                  <option value={5}>5 per page</option>
                  <option value={10}>10 per page</option>
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort("ACCOUNT_HEAD")}
                    >
                      <div className="flex items-center">
                        Account Name
                        {sortConfig.key === "ACCOUNT_HEAD" && (
                          <ArrowUpDown
                            size={16}
                            className="ml-1 text-gray-400"
                          />
                        )}
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort("ACCODE")}
                    >
                      <div className="flex items-center">
                        Code
                        {sortConfig.key === "ACCODE" && (
                          <ArrowUpDown
                            size={16}
                            className="ml-1 text-gray-400"
                          />
                        )}
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    >
                      AMOUNT
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    >
                     METAL Weight
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort("Account_Type")}
                    >
                      <div className="flex items-center">
                        Type
                        {sortConfig.key === "Account_Type" && (
                          <ArrowUpDown
                            size={16}
                            className="ml-1 text-gray-400"
                          />
                        )}
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort("margin")}
                    >
                      <div className="flex items-center">
                        Margin
                        {sortConfig.key === "margin" && (
                          <ArrowUpDown
                            size={16}
                            className="ml-1 text-gray-400"
                          />
                        )}
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedAccounts.length > 0 ? (
                    paginatedAccounts.map((account) => (
                      <tr
                        key={account.ACCODE}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap cursor-pointer" onClick={() => handleViewProfile(account._id)}>

                          <div className="flex items-center">
                            <UserAvatar name={account.ACCOUNT_HEAD} />
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">
                                {account.ACCOUNT_HEAD}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {account.ACCODE}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {account.AMOUNTFC}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {account.METAL_WT}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              account.Account_Type === "LP"
                                ? "bg-green-100 text-green-800"
                                : account.Account_Type === "BANK"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {account.Account_Type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {account.Account_Type === "BANK"
                            ? "0%"
                            : `${account.margin}%`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleOpenEditModal(account)}
                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                            disabled={loading}
                          >
                            <Edit size={18} />
                            <span className="sr-only">Edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteAccount(account.ACCODE)}
                            className="text-red-600 hover:text-red-900"
                            disabled={loading}
                          >
                            <Trash2 size={18} />
                            <span className="sr-only">Delete</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="5"
                        className="px-6 py-4 text-center text-gray-500"
                      >
                        {error ? (
                          <div className="flex flex-col -mr-60 items-center py-6">
                            <AlertCircle
                              size={40}
                              className="text-red-500 mb-2"
                            />
                            <p>{error}</p>
                            <button
                              onClick={fetchData}
                              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                              disabled={loading}
                            >
                              Try Again
                            </button>
                          </div>
                        ) : loading ? (
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
                            <span className="ml-3">Loading...</span>
                          </div>
                        ) : search ? (
                          "No matching accounts found"
                        ) : (
                          "No accounts available"
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredAccounts.length > itemsPerPage && (
              <div className="flex justify-between items-center mt-6 text-sm text-gray-700">
                <div>
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                  {Math.min(
                    currentPage * itemsPerPage,
                    filteredAccounts.length
                  )}{" "}
                  of {filteredAccounts.length} results
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() =>
                      setCurrentPage((page) => Math.max(page - 1, 1))
                    }
                    disabled={currentPage === 1 || loading}
                    className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>

                  {Array.from(
                    {
                      length: Math.ceil(filteredAccounts.length / itemsPerPage),
                    },
                    (_, i) => i + 1
                  )
                    .filter((page) => {
                      const totalPages = Math.ceil(
                        filteredAccounts.length / itemsPerPage
                      );
                      // Show first, last, current, and surrounding pages
                      return (
                        page === 1 ||
                        page === totalPages ||
                        Math.abs(page - currentPage) <= 1
                      );
                    })
                    .reduce((acc, page, i, filtered) => {
                      if (i > 0 && filtered[i - 1] !== page - 1) {
                        // Add ellipsis if pages are skipped
                        acc.push("...");
                      }
                      acc.push(page);
                      return acc;
                    }, [])
                    .map((page, index) => {
                      if (page === "...") {
                        return (
                          <span key={`ellipsis-${index}`} className="px-3 py-1">
                            {page}
                          </span>
                        );
                      }
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          disabled={loading}
                          className={`px-3 py-1 border rounded-md ${
                            currentPage === page
                              ? "bg-indigo-600 text-white border-indigo-600"
                              : "border-gray-300 hover:bg-gray-50 transition-colors"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}

                  <button
                    onClick={() =>
                      setCurrentPage((page) =>
                        Math.min(
                          page + 1,
                          Math.ceil(filteredAccounts.length / itemsPerPage)
                        )
                      )
                    }
                    disabled={
                      currentPage >=
                        Math.ceil(filteredAccounts.length / itemsPerPage) ||
                      loading
                    }
                    className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <AccountModal
        isModalOpen={isModalOpen}
        handleCloseModal={handleCloseModal}
        isEditMode={isEditMode}
        formData={formData}
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmit}
        formSubmitting={formSubmitting}
      />

      {/* Toast notifications */}
      <ToastContainer />
    </div>
  );
};

export default UnifiedAccountManagement;
