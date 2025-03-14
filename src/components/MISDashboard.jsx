import React, { useState } from 'react';
import { CalendarCheck, TrendingUp, Users, DollarSign, Activity, Package, ChevronDown, Search, Bell, Filter, Download, RefreshCw, BarChart, LineChart, PieChart } from 'lucide-react';
import { LineChart as RechartsLineChart, Line, BarChart as RechartsBarChart, Bar, PieChart as RechartsPieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

// Demo Data for Charts
const revenueData = [
  { name: 'Jan 1', revenue: 4000, profit: 2400 },
  { name: 'Jan 8', revenue: 3000, profit: 1398 },
  { name: 'Jan 15', revenue: 9800, profit: 3908 },
  { name: 'Jan 22', revenue: 3780, profit: 2000 },
  { name: 'Jan 29', revenue: 5890, profit: 3800 },
  { name: 'Feb 5', revenue: 4390, profit: 2500 },
  { name: 'Feb 12', revenue: 8490, profit: 5300 },
  { name: 'Feb 19', revenue: 6490, profit: 4300 },
  { name: 'Feb 26', revenue: 9290, profit: 6100 },
  { name: 'Mar 5', revenue: 11490, profit: 7300 },
];

const salesDistributionData = [
  { name: 'Electronics', value: 35, color: '#4F46E5' },
  { name: 'Apparel', value: 25, color: '#0EA5E9' },
  { name: 'Home Goods', value: 18, color: '#10B981' },
  { name: 'Beauty', value: 12, color: '#F59E0B' },
  { name: 'Other', value: 10, color: '#EF4444' },
];

const customerAcquisitionData = [
  { name: 'Jan', organic: 40, paid: 24, referral: 18 },
  { name: 'Feb', organic: 30, paid: 38, referral: 20 },
  { name: 'Mar', organic: 42, paid: 36, referral: 25 },
  { name: 'Apr', organic: 35, paid: 40, referral: 22 },
  { name: 'May', organic: 50, paid: 45, referral: 30 },
];

const productsData = [
  { id: 1, name: 'Ultra HD Smart TV', sales: 235, revenue: '$16,240', trend: 8.5 },
  { id: 2, name: 'Wireless Headphones', sales: 189, revenue: '$12,380', trend: 3.2 },
  { id: 3, name: 'Smartphone Pro Max', sales: 156, revenue: '$9,450', trend: -2.1 },
  { id: 4, name: 'Fitness Tracker', sales: 124, revenue: '$7,820', trend: 6.7 },
  { id: 5, name: 'Smart Home Hub', sales: 98, revenue: '$5,120', trend: -1.4 },
];

// Dashboard component
const MISDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  return (
    <div className="flex flex-col h-screen w-full bg-gray-50">
      {/* Header */}
      <header className="bg-white px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            {/* <h1 className="text-2xl font-bold text-gray-800">MIS Suite</h1> */}
            {/* <div className="flex mt-1 space-x-4">
              <TabButton 
                active={activeTab === 'reporting'} 
                onClick={() => setActiveTab('reporting')}
                icon={<BarChart size={16} />}
                label="Reporting"
              />
              <TabButton 
                active={activeTab === 'dashboard'} 
                onClick={() => setActiveTab('dashboard')}
                icon={<Activity size={16} />}
                label="Dashboard"
              />
              <TabButton 
                active={activeTab === 'analytics'} 
                onClick={() => setActiveTab('analytics')}
                icon={<TrendingUp size={16} />}
                label="Analytics"
              />
            </div> */}
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Search..." 
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 relative">
              <Bell size={20} className="text-gray-600" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-medium">JD</div>
              <ChevronDown size={16} className="ml-2 text-gray-500" />
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-1 p-6 overflow-auto">
        {/* Dashboard Controls */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-gray-800">Business Performance Overview</h2>
            <div className="flex items-center bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
              <CalendarCheck size={14} className="mr-1" />
              Last 30 Days
              <ChevronDown size={14} className="ml-1" />
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* <button className="flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Filter size={16} className="mr-2 text-gray-500" />
              <span>Filters</span>
            </button>
            <button className="flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Download size={16} className="mr-2 text-gray-500" />
              <span>Export</span>
            </button> */}
            <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <RefreshCw size={16} className="text-gray-500" />
            </button>
          </div>
        </div>
        
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <MetricCard 
            title="Total Revenue" 
            value="$128,540" 
            change="+12.5%" 
            positive={true}
            icon={<DollarSign size={22} className="text-blue-600" />} 
          />
          <MetricCard 
            title="Active Customers" 
            value="3,842" 
            change="+7.2%" 
            positive={true}
            icon={<Users size={22} className="text-green-600" />} 
          />
          <MetricCard 
            title="Conversion Rate" 
            value="24.3%" 
            change="-2.1%" 
            positive={false}
            icon={<TrendingUp size={22} className="text-purple-600" />} 
          />
          <MetricCard 
            title="Total Orders" 
            value="1,294" 
            change="+18.3%" 
            positive={true}
            icon={<Package size={22} className="text-orange-600" />} 
          />
        </div>
        
        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Trend Chart */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-800">Revenue Trend</h3>
              <div className="flex space-x-2">
                <button className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-lg">Daily</button>
                <button className="px-3 py-1 text-sm text-gray-500 hover:bg-gray-100 rounded-lg">Weekly</button>
                <button className="px-3 py-1 text-sm text-gray-500 hover:bg-gray-100 rounded-lg">Monthly</button>
              </div>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsLineChart
                  data={revenueData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 6 }} />
                </RechartsLineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Sales Distribution Pie Chart */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-800">Sales Distribution</h3>
              <ChevronDown size={16} className="text-gray-500" />
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={salesDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {salesDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Top Products Table */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-800">Top Performing Products</h3>
              <button className="text-blue-600 text-sm font-medium">View All</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-2 text-gray-600 font-medium">Product</th>
                    <th className="text-left py-3 px-2 text-gray-600 font-medium">Sales</th>
                    <th className="text-left py-3 px-2 text-gray-600 font-medium">Revenue</th>
                    <th className="text-left py-3 px-2 text-gray-600 font-medium">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {productsData.map(product => (
                    <TableRow 
                      key={product.id}
                      name={product.name} 
                      sales={product.sales} 
                      revenue={product.revenue} 
                      trend={product.trend} 
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Customers Acquisition Chart */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-800">Customer Acquisition</h3>
              <ChevronDown size={16} className="text-gray-500" />
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart
                  data={customerAcquisitionData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="organic" fill="#4f46e5" />
                  <Bar dataKey="paid" fill="#10b981" />
                  <Bar dataKey="referral" fill="#f59e0b" />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

// Tab button component
const TabButton = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`flex items-center px-1 py-1 border-b-2 text-sm font-medium ${
      active 
        ? 'border-blue-600 text-blue-600' 
        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
    }`}
  >
    {icon}
    <span className="ml-1">{label}</span>
  </button>
);

// Metric card component
const MetricCard = ({ title, value, change, positive, icon }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm text-gray-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
      </div>
      <div className="p-2 rounded-lg bg-blue-50">{icon}</div>
    </div>
    <div className={`mt-2 text-sm ${positive ? 'text-green-600' : 'text-red-600'} font-medium`}>
      {change} {positive ? '↑' : '↓'}
    </div>
  </div>
);

// Table row component
const TableRow = ({ name, sales, revenue, trend }) => (
  <tr className="border-b border-gray-100 hover:bg-gray-50">
    <td className="py-3 px-2">
      <span className="font-medium text-gray-800">{name}</span>
    </td>
    <td className="py-3 px-2 text-gray-600">{sales}</td>
    <td className="py-3 px-2 text-gray-600">{revenue}</td>
    <td className="py-3 px-2">
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        trend >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
      }`}>
        {trend >= 0 ? '+' : ''}{trend}%
      </span>
    </td>
  </tr>
);

export default MISDashboard;