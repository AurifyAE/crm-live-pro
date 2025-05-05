// src/components/LpStatements/ProfitTab.jsx
import React from "react";
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  BarChart2,
} from "lucide-react";

const ProfitTab = ({ profitStats, formatDate }) => {
  return (
    <div className="p-4 bg-white">
      {/* Profit overview cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 font-medium">Net Profit</p>
              <p
                className={`text-2xl font-bold ${
                  profitStats.netProfit >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                ${profitStats.netProfit.toFixed(2)}
              </p>
            </div>
            <div
              className={`rounded-full p-2 ${
                profitStats.netProfit >= 0 ? "bg-green-100" : "bg-red-100"
              }`}
            >
              {profitStats.netProfit >= 0 ? (
                <TrendingUp size={20} className="text-green-600" />
              ) : (
                <TrendingDown size={20} className="text-red-600" />
              )}
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Profit</p>
              <p className="text-2xl font-bold text-green-600">
                ${profitStats.totalProfit.toFixed(2)}
              </p>
            </div>
            <div className="rounded-full p-2 bg-green-100">
              <ArrowUpRight size={20} className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-lg shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Loss</p>
              <p className="text-2xl font-bold text-red-600">
                ${profitStats.totalLoss.toFixed(2)}
              </p>
            </div>
            <div className="rounded-full p-2 bg-red-100">
              <ArrowDownRight size={20} className="text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 font-medium">Profitability</p>
              <p className="text-2xl font-bold text-purple-600">
                {profitStats.profitableTradesPercentage.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500">
                {profitStats.profitableTradesCount} profitable trades
              </p>
            </div>
            <div className="rounded-full p-2 bg-purple-100">
              <BarChart2 size={20} className="text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Best and worst trades */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Best Trade */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
            <TrendingUp size={20} className="mr-2 text-green-600" /> Best
            Performing Trade
          </h3>
          {profitStats.bestTrade.symbol ? (
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Symbol</span>
                <span className="font-medium">
                  {profitStats.bestTrade.symbol}
                </span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Type</span>
                <span
                  className={`font-medium ${
                    profitStats.bestTrade.type === "BUY"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {profitStats.bestTrade.type}
                </span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Volume</span>
                <span className="font-medium">
                  {profitStats.bestTrade.volume}
                </span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Date</span>
                <span className="font-medium">
                  {formatDate(profitStats.bestTrade.openDate)}
                </span>
              </div>
              <div className="flex justify-between items-center text-lg">
                <span className="text-gray-600">Profit</span>
                <span className="font-bold text-green-600">
                  ${profitStats.bestTrade.profit.toFixed(2)}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No profitable trades found</p>
          )}
        </div>

        {/* Worst Trade */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
            <TrendingDown size={20} className="mr-2 text-red-600" /> Worst
            Performing Trade
          </h3>
          {profitStats.worstTrade.symbol ? (
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Symbol</span>
                <span className="font-medium">
                  {profitStats.worstTrade.symbol}
                </span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Type</span>
                <span
                  className={`font-medium ${
                    profitStats.worstTrade.type === "BUY"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {profitStats.worstTrade.type}
                </span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Volume</span>
                <span className="font-medium">
                  {profitStats.worstTrade.volume}
                </span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Date</span>
                <span className="font-medium">
                  {formatDate(profitStats.worstTrade.openDate)}
                </span>
              </div>
              <div className="flex justify-between items-center text-lg">
                <span className="text-gray-600">Loss</span>
                <span className="font-bold text-red-600">
                  ${Math.abs(profitStats.worstTrade.profit).toFixed(2)}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No loss trades found</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfitTab;