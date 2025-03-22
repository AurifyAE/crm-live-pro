import React from "react";
import { useLocation, Link } from "react-router-dom";
import { 
  LayoutDashboard, 
  Wallet,
  LineChart, 
  HandCoins, 
  Users, 
  HelpCircle, 
  LogOut,
  Database,
  BarChart3,
  Shield,
  Settings
} from "lucide-react";

import logo from '../assets/logo.jpg';

const Sidebar = () => {
  const location = useLocation();

  return (
    <div className="w-64 bg-white shadow-lg flex flex-col p-5">
      {/* Logo Section */}
      <div className="flex items-center gap-3 -mt-14">
        <img src={logo} alt="Aurify Logo" className="h-40" />
      </div>

      {/* Navigation Items */}
      <nav className="flex flex-col space-y-2 -mt-10">
        <SidebarItem 
          icon={<LayoutDashboard strokeWidth={1.5} size={22} />} 
          text="Dashboard" 
          to="/" 
          active={location.pathname === "/"} 
        />
        <SidebarItem 
          icon={<Wallet strokeWidth={1.5} size={22} />} 
          text="Fund" 
          to="/bank" 
          active={location.pathname === "/bank"} 
        />
        <SidebarItem 
          icon={<HandCoins strokeWidth={1.5} size={22} />} 
          text="Liquidity Provider" 
          to="/liquidity-provider" 
          active={location.pathname === "/liquidity-provider"} 
        />
        <SidebarItem 
          icon={<Users strokeWidth={1.5} size={22} />} 
          text="Debtor" 
          to="/debtor" 
          active={location.pathname === "/debtor"} 
        />
        <SidebarItem 
          icon={<Database strokeWidth={1.5} size={22} />} 
          text="User Data" 
          to="/user-data" 
          active={location.pathname === "/user-data"} 
        />
        <SidebarItem 
          icon={<LineChart strokeWidth={1.5} size={22} />} 
          text="Cash Flow" 
          to="/cash-flow" 
          active={location.pathname === "/cash-flow"} 
        />
        <SidebarItem 
          icon={<BarChart3 strokeWidth={1.5} size={22} />} 
          text="Analysis" 
          to="/analysis" 
          active={location.pathname === "/analysis"} 
        />
        {/* Company Pages Section */}
        <div className="mt-5 text-gray-400 text-sm font-medium">COMPANY PAGES</div>
        <SidebarItem 
          icon={<Shield strokeWidth={1.5} size={22} />} 
          text="Security" 
          to="/security" 
          active={location.pathname === "/security"} 
        />
        <SidebarItem 
          icon={<Settings strokeWidth={1.5} size={22} />} 
          text="Settings" 
          to="/settings" 
          active={location.pathname === "/settings"} 
        />

        {/* Help & Logout */}
        <div className="mt-auto">
          <SidebarItem 
            icon={<HelpCircle strokeWidth={1.5} size={22} />} 
            text="Help Center" 
            to="/help-center" 
            active={location.pathname === "/help-center"} 
          />
          <SidebarItem 
            icon={<LogOut strokeWidth={1.5} size={22} />} 
            text="Log Out" 
            to="/logout" 
            active={location.pathname === "/logout"} 
          />
        </div>
      </nav>
    </div>
  );
};

const SidebarItem = ({ icon, text, to, active }) => {
  return (
    <Link to={to} className="no-underline">
      <div
        className={`flex relative items-center gap-3 p-3 w-64 rounded-xl cursor-pointer transition-all 
        ${active
          ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-medium"
          : "text-slate-700 hover:bg-slate-100"
          } `}
      >
        {icon}
        <span className="font-medium">{text}</span>
      </div>
    </Link>
  );
};

export default Sidebar;