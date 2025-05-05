// src/components/LpStatements/LpNavigation.jsx
import React from "react";
import { FileText, BarChart, Book, Wallet } from "lucide-react";

const LpNavigation = ({ activeTab, setActiveTab }) => {
  const tabs = [
    {
      id: "orders",
      name: "Orders",
      icon: <FileText size={18} />,
      description: "View order history and details",
    },
    {
      id: "profit",
      name: "Profit & Loss",
      icon: <BarChart size={18} />,
      description: "Analyze profit and loss performance",
    },
    {
      id: "ledger",
      name: "Ledger",
      icon: <Book size={18} />,
      description: "View full account ledger",
    },
    {
      id: "fund-management",
      name: "Fund Management",
      icon: <Wallet size={18} />,
      description: "Manage LP cash and gold funds",
    },
  ];

  return (
    <div className="border-b border-gray-200">
      <div className="flex overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-6 py-3 text-sm font-medium whitespace-nowrap transition-colors duration-150 border-b-2 focus:outline-none ${
              activeTab === tab.id
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <span className={activeTab === tab.id ? "text-blue-500" : "text-gray-400"}>
              {tab.icon}
            </span>
            <span>{tab.name}</span>
          </button>
        ))}
      </div>
      <div className="px-6 py-2 bg-gray-50 border-b border-gray-200 hidden md:block">
        <p className="text-sm text-gray-500">
          {tabs.find((tab) => tab.id === activeTab)?.description}
        </p>
      </div>
    </div>
  );
};

export default LpNavigation;