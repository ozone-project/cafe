import { Router } from 'express';
import { prisma } from '../index';
import { LicenseSchema } from '@cafe/shared';

const router = Router();

// GET /api/licenses?publisherId=xxx - Get licenses for a publisher
router.get('/', async (req, res) => {
  try {
    const { publisherId } = req.query;
    
    const where = publisherId ? { publisherId: publisherId as string } : {};
    
    const licenses = await prisma.license.findMany({
      where,
      include: {
        publisher: true,
        channels: true,
        _count: {
          select: { channels: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(licenses);
  } catch (error) {
    console.error('Error fetching licenses:', error);
    res.status(500).json({ error: 'Failed to fetch licenses' });
  }
});

// GET /api/licenses/:id - Get specific license
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const license = await prisma.license.findUnique({
      where: { id },
      include: {
        publisher: true,
        channels: true
      }
    });

    if (!license) {
      return res.status(404).json({ error: 'License not found' });
    }

    res.json(license);
  } catch (error) {
    console.error('Error fetching license:', error);
    res.status(500).json({ error: 'Failed to fetch license' });
  }
});

// POST /api/licenses - Create new license
router.post('/', async (req, res) => {
  try {
    const data = req.body;
    
    // Validate input
    const validation = LicenseSchema.omit({ 
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

    const { channels, ...licenseData } = data;
    
    const license = await prisma.license.create({
      data: {
        ...licenseData,
        channels: channels ? {
          connect: channels.map((channelId: string) => ({ id: channelId }))
        } : undefined
      },
      include: {
        publisher: true,
        channels: true
      }
    });

    res.status(201).json(license);
  } catch (error) {
    console.error('Error creating license:', error);
    res.status(500).json({ error: 'Failed to create license' });
  }
});

// PUT /api/licenses/:id - Update license
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const { channels, ...licenseData } = data;

    const license = await prisma.license.update({
      where: { id },
      data: {
        ...licenseData,
        channels: channels ? {
          set: channels.map((channelId: string) => ({ id: channelId }))
        } : undefined
      },
      include: {
        publisher: true,
        channels: true
      }
    });

    res.json(license);
  } catch (error) {
    console.error('Error updating license:', error);
    res.status(500).json({ error: 'Failed to update license' });
  }
});

// DELETE /api/licenses/:id - Delete license
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.license.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting license:', error);
    res.status(500).json({ error: 'Failed to delete license' });
  }
});

export default router;