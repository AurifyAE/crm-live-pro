import React from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import HomePage from "../pages/homePage";
import DebtorPage from "../pages/debtorPage";
import AllUsersPage from "../pages/allUsersPage";
import LpPage from "../pages/LpPage";
import FundManagementPage from "../pages/bankPage";
import CashFlowPage from "../pages/cashFlowPage";
import AnalysisPage from "../pages/analysisPage";
import NotFound from "../components/notFound"; 
import Login from "../components/login"
import UserManagePage from "../pages/userManagePage";
import ProfilePage from '../pages/ProfilePage'
import Trading from '../pages/TradingPage'
import Statement from '../pages/statementPage'
import LpStatement from '../pages/lpStatementsPage'
import Protect from "../protectorRouter/adminProtect";

export default function UserRouter() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route element={<Protect />}>
      <Route path="/dashboard" element={<HomePage />} />
      <Route path="/debtor" element={<DebtorPage />} />
      <Route path="/user-data" element={<AllUsersPage />} />
      <Route path="/liquidity-provider" element={<LpPage />} />
      <Route path="/fund-management" element={<FundManagementPage />} />
      <Route path="/cash-flow" element={<CashFlowPage />} />
      <Route path="/analysis" element={<AnalysisPage />} />
      <Route path="/user-management" element={<UserManagePage />} />
      <Route path="/trading" element={<Trading />} />
      <Route path="/statements" element={<Statement />} />
      <Route path="/lp-statement" element={<LpStatement />} />
      <Route path="/profile/:userId" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}