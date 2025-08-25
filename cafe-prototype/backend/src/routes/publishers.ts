import { Router } from 'express';
import { prisma } from '../index';
import { PublisherSchema, CreatePublisherRequest } from '@cafe/shared';

const router = Router();

// GET /api/publishers - Get all publishers
router.get('/', async (req, res) => {
  try {
    const publishers = await prisma.publisher.findMany({
      include: {
        channels: true,
        _count: {
          select: {
            channels: true,
            licenses: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(publishers);
  } catch (error) {
    console.error('Error fetching publishers:', error);
    res.status(500).json({ error: 'Failed to fetch publishers' });
  }
});

// GET /api/publishers/:id - Get specific publisher
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const publisher = await prisma.publisher.findUnique({
      where: { id },
      include: {
        channels: {
          include: {
            _count: {
              select: { metrics: true }
            }
          }
        },
        licenses: true
      }
    });

    if (!publisher) {
      return res.status(404).json({ error: 'Publisher not found' });
    }

    res.json(publisher);
  } catch (error) {
    console.error('Error fetching publisher:', error);
    res.status(500).json({ error: 'Failed to fetch publisher' });
  }
});

// POST /api/publishers - Create new publisher
router.post('/', async (req, res) => {
  try {
    const data: CreatePublisherRequest = req.body;
    
    // Validate input
    const validation = PublisherSchema.omit({ 
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

    const publisher = await prisma.publisher.create({
      data: validation.data,
      include: {
        channels: true,
        licenses: true
      }
    });

    res.status(201).json(publisher);
  } catch (error) {
    console.error('Error creating publisher:', error);
    res.status(500).json({ error: 'Failed to create publisher' });
  }
});

// PUT /api/publishers/:id - Update publisher
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const publisher = await prisma.publisher.update({
      where: { id },
      data,
      include: {
        channels: true,
        licenses: true
      }
    });

    res.json(publisher);
  } catch (error) {
    console.error('Error updating publisher:', error);
    res.status(500).json({ error: 'Failed to update publisher' });
  }
});

// DELETE /api/publishers/:id - Delete publisher
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.publisher.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting publisher:', error);
    res.status(500).json({ error: 'Failed to delete publisher' });
  }
});

export default router;