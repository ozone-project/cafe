import { Router } from 'express';
import { prisma } from '../index';
import { ChannelSchema, CreateChannelRequest } from '@cafe/shared';

const router = Router();

// GET /api/channels?publisherId=xxx - Get channels for a publisher
router.get('/', async (req, res) => {
  try {
    const { publisherId } = req.query;
    
    const where = publisherId ? { publisherId: publisherId as string } : {};
    
    const channels = await prisma.channel.findMany({
      where,
      include: {
        publisher: true,
        _count: {
          select: { metrics: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(channels);
  } catch (error) {
    console.error('Error fetching channels:', error);
    res.status(500).json({ error: 'Failed to fetch channels' });
  }
});

// GET /api/channels/:id - Get specific channel
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const channel = await prisma.channel.findUnique({
      where: { id },
      include: {
        publisher: true,
        metrics: {
          orderBy: { date: 'desc' },
          take: 30 // Last 30 days
        },
        licenses: true
      }
    });

    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    res.json(channel);
  } catch (error) {
    console.error('Error fetching channel:', error);
    res.status(500).json({ error: 'Failed to fetch channel' });
  }
});

// POST /api/channels - Create new channel
router.post('/', async (req, res) => {
  try {
    const data: CreateChannelRequest = req.body;
    
    // Validate input
    const validation = ChannelSchema.omit({ 
      id: true, 
      createdAt: true, 
      updatedAt: true 
    }).safeParse(data);
    
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Invalid input', 
        details: validation.error.errors 
      });
    }

    const channel = await prisma.channel.create({
      data: validation.data,
      include: {
        publisher: true
      }
    });

    res.status(201).json(channel);
  } catch (error) {
    console.error('Error creating channel:', error);
    res.status(500).json({ error: 'Failed to create channel' });
  }
});

// PUT /api/channels/:id - Update channel
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const channel = await prisma.channel.update({
      where: { id },
      data,
      include: {
        publisher: true
      }
    });

    res.json(channel);
  } catch (error) {
    console.error('Error updating channel:', error);
    res.status(500).json({ error: 'Failed to update channel' });
  }
});

// DELETE /api/channels/:id - Delete channel
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.channel.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting channel:', error);
    res.status(500).json({ error: 'Failed to delete channel' });
  }
});

export default router;