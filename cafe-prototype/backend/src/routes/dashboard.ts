import { Router } from 'express';
import { prisma } from '../index';
import { DashboardMetrics, ChannelType, calculateGrowth, generateDateRange } from '@cafe/shared';
import { subDays, parseISO, format } from 'date-fns';

const router = Router();

// GET /api/dashboard/:publisherId - Get dashboard metrics for a publisher
router.get('/:publisherId', async (req, res) => {
  try {
    const { publisherId } = req.params;
    const { days = '30' } = req.query;
    
    const daysCount = parseInt(days as string);
    const startDate = subDays(new Date(), daysCount);

    // Get publisher channels
    const channels = await prisma.channel.findMany({
      where: { publisherId },
      include: {
        metrics: {
          where: { date: { gte: startDate } },
          orderBy: { date: 'desc' }
        }
      }
    });

    // Calculate totals
    let totalUsers = 0;
    let totalRevenue = 0;
    let totalReferrals = 0;
    let totalHumanUsers = 0;
    let totalBotUsers = 0;

    channels.forEach(channel => {
      channel.metrics.forEach(metric => {
        totalUsers += metric.users;
        totalRevenue += Number(metric.revenue);
        totalReferrals += metric.referrals;
        totalHumanUsers += metric.humanUsers;
        totalBotUsers += metric.botUsers;
      });
    });

    // Calculate channel breakdown with growth
    const channelBreakdown = await Promise.all(
      channels.map(async (channel) => {
        // Current period metrics
        const currentMetrics = channel.metrics.reduce(
          (acc, metric) => ({
            users: acc.users + metric.users,
            revenue: acc.revenue + Number(metric.revenue)
          }),
          { users: 0, revenue: 0 }
        );

        // Previous period metrics for growth calculation
        const previousStartDate = subDays(startDate, daysCount);
        const previousMetrics = await prisma.channelMetric.aggregate({
          where: {
            channelId: channel.id,
            date: { gte: previousStartDate, lt: startDate }
          },
          _sum: {
            users: true,
            revenue: true
          }
        });

        const previousUsers = previousMetrics._sum.users || 0;
        const growth = calculateGrowth(currentMetrics.users, previousUsers);

        return {
          channelId: channel.id,
          channelName: channel.name,
          type: channel.type as ChannelType,
          users: currentMetrics.users,
          revenue: currentMetrics.revenue,
          growth
        };
      })
    );

    // Generate daily metrics
    const dateRange = generateDateRange(daysCount);
    const dailyMetricsMap = new Map();

    // Initialize all dates with zero values
    dateRange.forEach(date => {
      dailyMetricsMap.set(date, {
        date,
        users: 0,
        revenue: 0,
        referrals: 0
      });
    });

    // Populate with actual data
    channels.forEach(channel => {
      channel.metrics.forEach(metric => {
        const dateKey = format(metric.date, 'yyyy-MM-dd');
        const existing = dailyMetricsMap.get(dateKey);
        if (existing) {
          existing.users += metric.users;
          existing.revenue += Number(metric.revenue);
          existing.referrals += metric.referrals;
        }
      });
    });

    const dailyMetrics = Array.from(dailyMetricsMap.values());

    const dashboardData: DashboardMetrics = {
      totalUsers,
      totalRevenue,
      totalReferrals,
      humanVsBotRatio: totalUsers > 0 ? (totalHumanUsers / totalUsers) * 100 : 0,
      channelBreakdown,
      dailyMetrics
    };

    res.json(dashboardData);
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

export default router;