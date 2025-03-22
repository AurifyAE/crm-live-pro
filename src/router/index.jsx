import React from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import HomePage from "../pages/homePage";
import DebtorPage from "../pages/debtorPage";
import AllUsersPage from "../pages/allUsersPage";
import LpPage from "../pages/LpPage";
import BankPage from "../pages/bankPage";
import CashFlowPage from "../pages/cashFlowPage";
import AnalysisPage from "../pages/analysisPage";
import NotFound from "../components/notFound"; 
export default function UserRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/debtor" element={<DebtorPage />} />
      <Route path="/user-data" element={<AllUsersPage />} />
      <Route path="/liquidity-provider" element={<LpPage />} />
      <Route path="/bank" element={<BankPage />} />
      <Route path="/cash-flow" element={<CashFlowPage />} />
      <Route path="/analysis" element={<AnalysisPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}