import React from "react";
import { useLocation, Link } from "react-router-dom";
import { 
  Home, 
  Landmark, 
  HandCoins, 
  Users, 
  Package, 
  Building2, 
  Banknote, 
  HelpCircle, 
  LogOut,
  Database // Added Database icon for user data
} from "lucide-react";
import logo from '../assets/logo.jpg';

const Sidebar = () => {
  const location = useLocation();

  return (
    <div className=" w-64 bg-white shadow-lg flex flex-col p-5">
      {/* Logo Section */}
      <div className="flex items-center gap-3 -mt-14">
        <img src={logo} alt="Aurify Logo" className="h-40" />
      </div>

      {/* Navigation Items */}
      <nav className="flex flex-col space-y-2 -mt-10">
        <SidebarItem icon={<Home size={20} />} text="Dashboard" to="/" active={location.pathname === "/"} />
        <SidebarItem icon={<Landmark size={20} />} text="Bank" to="/bank" active={location.pathname === "/bank"} />
        <SidebarItem icon={<HandCoins size={20} />} text="Liquidity Provider" to="/liquidity-provider" active={location.pathname === "/liquidity-provider"} />
        <SidebarItem icon={<Users size={20} />} text="Debtor" to="/debtor" active={location.pathname === "/debtor"} />
        <SidebarItem icon={<Database size={20} />} text="User Data" to="/user-data" active={location.pathname === "/user-data"} />
        <SidebarItem icon={<Package size={20} />} text="Orders" to="/orders" active={location.pathname === "/orders"} />

        {/* Company Pages Section */}
        <div className="mt-5 text-gray-400 text-sm">COMPANY PAGES</div>
        <SidebarItem icon={<Building2 size={20} />} text="Company Profile" to="/company-profile" active={location.pathname === "/company-profile"} />
        <SidebarItem icon={<Banknote size={20} />} text="Bank Details" to="/bank-details" active={location.pathname === "/bank-details"} />

        {/* Help & Logout */}
        <div className="mt-auto">
          <SidebarItem icon={<HelpCircle size={20} />} text="Help Center" to="/help-center" active={location.pathname === "/help-center"} />
          <SidebarItem icon={<LogOut size={20} />} text="Log Out" to="/logout" active={location.pathname === "/logout"} />
        </div>
      </nav>
    </div>
  );
};

const SidebarItem = ({ icon, text, to, active }) => {
  return (
    <Link to={to} className="no-underline">
      <div
        className={`flex relative  items-center gap-3 p-3 w-64 rounded-xl cursor-pointer transition-all 
        ${active ? "bg-blue-100 text-blue-600 font-semibold border-r-4 border-blue-500" : "text-gray-700 hover:bg-gray-100 border-r-4 border-transparent"}
        `}
      >
        {icon}
        <span>{text}</span>
      </div>
    </Link>
  );
};

export default Sidebar;