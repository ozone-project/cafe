import React, { useState, useEffect } from 'react';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Activity,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar 
} from 'recharts';
import { DashboardMetrics, formatCurrency, formatNumber, formatPercentage } from '@cafe/shared';

// Mock data for development
const mockDashboardData: DashboardMetrics = {
  totalUsers: 45672,
  totalRevenue: 12340.50,
  totalReferrals: 3456,
  humanVsBotRatio: 72.5,
  channelBreakdown: [
    {
      channelId: '1',
      channelName: 'Main Website',
      type: 'DIRECT_WEB' as any,
      users: 25000,
      revenue: 8500,
      growth: 12.5
    },
    {
      channelId: '2', 
      channelName: 'Mobile App',
      type: 'DIRECT_APP' as any,
      users: 15000,
      revenue: 2800,
      growth: -2.1
    },
    {
      channelId: '3',
      channelName: 'Search Traffic',
      type: 'INDIRECT_SEARCH' as any,
      users: 3500,
      revenue: 890,
      growth: -15.3
    },
    {
      channelId: '4',
      channelName: 'Social Media',
      type: 'INDIRECT_SOCIAL' as any,
      users: 2172,
      revenue: 150.50,
      growth: -8.7
    }
  ],
  dailyMetrics: [
    { date: '2024-01-15', users: 1200, revenue: 340, referrals: 89 },
    { date: '2024-01-16', users: 1450, revenue: 380, referrals: 92 },
    { date: '2024-01-17', users: 1350, revenue: 420, referrals: 78 },
    { date: '2024-01-18', users: 1600, revenue: 390, referrals: 85 },
    { date: '2024-01-19', users: 1520, revenue: 450, referrals: 96 },
    { date: '2024-01-20', users: 1680, revenue: 380, referrals: 82 },
    { date: '2024-01-21', users: 1720, revenue: 470, referrals: 91 }
  ]
};

const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setData(mockDashboardData);
      setLoading(false);
    }, 500);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data) return <div>No data available</div>;

  const stats = [
    {
      name: 'Total Users',
      value: formatNumber(data.totalUsers),
      icon: Users,
      change: '+12.5%',
      changeType: 'increase' as const
    },
    {
      name: 'Revenue',
      value: formatCurrency(data.totalRevenue),
      icon: DollarSign,
      change: '+8.2%',
      changeType: 'increase' as const
    },
    {
      name: 'Referrals',
      value: formatNumber(data.totalReferrals),
      icon: TrendingUp,
      change: '-15.3%',
      changeType: 'decrease' as const
    },
    {
      name: 'Human vs Bot Ratio',
      value: formatPercentage(data.humanVsBotRatio),
      icon: Activity,
      change: '+2.1%',
      changeType: 'increase' as const
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Overview of your content distribution and revenue metrics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Icon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {stat.name}
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stat.value}
                      </dd>
                    </dl>
                  </div>
                </div>
                <div className="mt-4 flex items-center">
                  {stat.changeType === 'increase' ? (
                    <ArrowUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <ArrowDown className="h-4 w-4 text-red-500" />
                  )}
                  <span className={`ml-2 text-sm font-medium ${
                    stat.changeType === 'increase' ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {stat.change}
                  </span>
                  <span className="ml-2 text-sm text-gray-500">vs last period</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Metrics Chart */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Daily Metrics</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.dailyMetrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
                formatter={(value: any, name: string) => [
                  name === 'revenue' ? formatCurrency(value) : formatNumber(value),
                  name.charAt(0).toUpperCase() + name.slice(1)
                ]}
              />
              <Line type="monotone" dataKey="users" stroke="#3B82F6" strokeWidth={2} />
              <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Channel Breakdown */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Channel Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.channelBreakdown}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="channelName"
                tick={{ fontSize: 12 }}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis />
              <Tooltip 
                formatter={(value: any, name: string) => [
                  name === 'revenue' ? formatCurrency(value) : formatNumber(value),
                  name.charAt(0).toUpperCase() + name.slice(1)
                ]}
              />
              <Bar dataKey="users" fill="#3B82F6" />
              <Bar dataKey="revenue" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Channel Details Table */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Channel Details</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Channel
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Users
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Growth
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.channelBreakdown.map((channel) => (
                <tr key={channel.channelId}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {channel.channelName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      channel.type.startsWith('DIRECT') 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-orange-100 text-orange-800'
                    }`}>
                      {channel.type.startsWith('DIRECT') ? 'Direct' : 'Indirect'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatNumber(channel.users)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(channel.revenue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center">
                      {channel.growth > 0 ? (
                        <ArrowUp className="h-4 w-4 text-green-500 mr-1" />
                      ) : (
                        <ArrowDown className="h-4 w-4 text-red-500 mr-1" />
                      )}
                      <span className={channel.growth > 0 ? 'text-green-500' : 'text-red-500'}>
                        {formatPercentage(Math.abs(channel.growth))}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;