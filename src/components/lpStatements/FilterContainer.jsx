import React from "react";
import OrdersFilter from "./OrdersFilter";
import ProfitFilter from "./ProfitFilter";
import LedgerFilter from "./LedgerFilter";

export default function FilterContainer({
  activeTab,
  filters,
  handleFilterChange,
  resetFilters,
  ledgerFilters,
  handleLedgerFilterChange,
  resetLedgerFilters,
  showFilters,
  setShowFilters
}) {
  // Render appropriate filter component based on active tab
  const renderFilterComponent = () => {
    switch (activeTab) {
      case "orders":
        return (
          <OrdersFilter
            filters={filters}
            handleFilterChange={handleFilterChange}
            resetFilters={resetFilters}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
          />
        );
      case "profit":
        return (
          <ProfitFilter
            filters={filters}
            handleFilterChange={handleFilterChange}
            resetFilters={resetFilters}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
          />
        );
      case "ledger":
        return (
          <LedgerFilter
            ledgerFilters={ledgerFilters}
            handleLedgerFilterChange={handleLedgerFilterChange}
            resetLedgerFilters={resetLedgerFilters}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
          />
        );
      default:
        return null;
    }
  };

  return renderFilterComponent();
}