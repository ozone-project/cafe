import { Router } from 'express';
import { prisma } from '../index';
import { ChannelMetricSchema, CreateMetricRequest } from '@cafe/shared';

const router = Router();

// GET /api/metrics?channelId=xxx&startDate=xxx&endDate=xxx - Get metrics
router.get('/', async (req, res) => {
  try {
    const { channelId, startDate, endDate } = req.query;
    
    const where: any = {};
    
    if (channelId) {
      where.channelId = channelId as string;
    }
    
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) where.date.lte = new Date(endDate as string);
    }
    
    const metrics = await prisma.channelMetric.findMany({
      where,
      include: {
        channel: {
          include: {
            publisher: true
          }
        }
      },
      orderBy: { date: 'desc' }
    });
    
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

// POST /api/metrics - Create new metric entry
router.post('/', async (req, res) => {
  try {
    const data: CreateMetricRequest = req.body;
    
    // Validate input
    const validation = ChannelMetricSchema.omit({ 
      id: true, 
      createdAt: true 
    }).safeParse({
      ...data,
      date: new Date(data.date)
    });
    
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Invalid input', 
        details: validation.error.errors 
      });
    }

    const metric = await prisma.channelMetric.create({
      data: validation.data,
      include: {
        channel: {
          include: {
            publisher: true
          }
        }
      }
    });

    res.status(201).json(metric);
  } catch (error) {
    console.error('Error creating metric:', error);
    res.status(500).json({ error: 'Failed to create metric' });
  }
});

// POST /api/metrics/bulk - Create multiple metric entries
router.post('/bulk', async (req, res) => {
  try {
    const metrics: CreateMetricRequest[] = req.body;
    
    // Validate all entries
    const validatedMetrics = metrics.map(metric => {
      const validation = ChannelMetricSchema.omit({ 
        id: true, 
        createdAt: true 
      }).safeParse({
        ...metric,
        date: new Date(metric.date)
      });
      
      if (!validation.success) {
        throw new Error(`Invalid metric data: ${validation.error.message}`);
      }
      
      return validation.data;
    });

    const createdMetrics = await prisma.channelMetric.createMany({
      data: validatedMetrics,
      skipDuplicates: true // Skip if date + channelId combination already exists
    });

    res.status(201).json({ 
      created: createdMetrics.count,
      message: `Successfully created ${createdMetrics.count} metric entries`
    });
  } catch (error) {
    console.error('Error creating bulk metrics:', error);
    res.status(500).json({ error: 'Failed to create metrics' });
  }
});

// GET /api/metrics/summary/:channelId - Get aggregated metrics for a channel
router.get('/summary/:channelId', async (req, res) => {
  try {
    const { channelId } = req.params;
    const { days = '30' } = req.query;
    
    const daysCount = parseInt(days as string);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysCount);

    const summary = await prisma.channelMetric.aggregate({
      where: {
        channelId,
        date: { gte: startDate }
      },
      _sum: {
        users: true,
        humanUsers: true,
        botUsers: true,
        revenue: true,
        referrals: true,
        pageViews: true
      },
      _avg: {
        users: true,
        revenue: true,
        referrals: true
      },
      _count: {
        id: true
      }
    });

    res.json({
      period: `${daysCount} days`,
      totalEntries: summary._count.id,
      totals: summary._sum,
      averages: summary._avg
    });
  } catch (error) {
    console.error('Error fetching metrics summary:', error);
    res.status(500).json({ error: 'Failed to fetch metrics summary' });
  }
});

export default router;