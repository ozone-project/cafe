const express = require('express');
const path = require('path');
const { DomainService, AuthService } = require('./services');

function createRoutes(database) {
  const router = express.Router();
  const domainService = new DomainService(database);
  const authService = new AuthService(database);

  // Static routes
  router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'homepage.html'));
  });

  router.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
  });

  router.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'signup.html'));
  });

  router.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
  });

  router.get('/data-collector-dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'data-collector-dashboard.html'));
  });

  // Legacy route - redirect old index to new homepage
  router.get('/index', (req, res) => {
    res.redirect('/');
  });

  // Auth routes
  router.post('/create-account', async (req, res) => {
    try {
      const result = await authService.createAccount(req.body);
      res.json(result);
    } catch (error) {
      console.log('Create account error:', error.message);
      res.status(400).json({ error: error.message });
    }
  });

  router.post('/login', async (req, res) => {
    try {
      console.log('Login attempt:', req.body.email);
      const result = await authService.login(req.body.email, req.body.password);
      console.log('Login successful for user:', result.user.email);
      res.json(result);
    } catch (error) {
      console.log('Login error:', error.message);
      const status = error.message.includes('Invalid email or password') ? 401 : 400;
      res.status(status).json({ error: error.message });
    }
  });

  // Domain routes
  router.post('/domains', async (req, res) => {
    try {
      const { user_id, domain } = req.body;
      
      if (!user_id || !domain) {
        return res.status(400).json({ error: 'User ID and domain are required' });
      }

      const result = await domainService.addDomainForUser(user_id, domain);
      res.json(result);
    } catch (error) {
      console.log('Add domain error:', error.message);
      const status = error.message.includes('Only publishers') ? 403 : 
                    error.message.includes('Invalid user') ? 400 : 500;
      res.status(status).json({ error: error.message });
    }
  });

  router.get('/domains/:user_id', async (req, res) => {
    try {
      const user_id = req.params.user_id;
      const domains = await database.getUserDomains(user_id);
      res.json(domains);
    } catch (error) {
      console.log('Get domains error:', error.message);
      res.status(500).json({ error: 'Database error' });
    }
  });

  router.delete('/domains/:domain_id/association/:user_id', async (req, res) => {
    try {
      const domain_id = req.params.domain_id;
      const user_id = req.params.user_id;
      
      const result = await domainService.removeDomainForUser(user_id, domain_id);
      console.log(`Domain association removed: ${result.domain} for user ${user_id}`);
      res.json(result);
    } catch (error) {
      console.log('Remove domain error:', error.message);
      const status = error.message.includes('not found') ? 404 : 500;
      res.status(status).json({ error: error.message });
    }
  });

  // Robots.txt routes
  router.get('/domains/:domain_id/robots', async (req, res) => {
    try {
      const domain_id = req.params.domain_id;
      const domain = await database.getDomainById(domain_id);
      
      if (!domain) {
        return res.status(404).json({ error: 'Domain not found' });
      }
      if (!domain.robots_content) {
        return res.status(404).json({ error: 'robots.txt not loaded yet' });
      }
      
      res.json({
        domain: domain.domain,
        content: domain.robots_content,
        loaded_at: domain.robots_loaded_at
      });
    } catch (error) {
      console.log('Get robots error:', error.message);
      res.status(500).json({ error: 'Database error' });
    }
  });

  router.post('/domains/:domain_id/refresh-robots', async (req, res) => {
    try {
      const domain_id = req.params.domain_id;
      const domain = await database.getDomainById(domain_id);
      
      if (!domain) {
        return res.status(404).json({ error: 'Domain not found' });
      }
      
      const result = await domainService.refreshRobotsForDomain(domain_id, domain.domain);
      
      if (result.success) {
        res.json({
          message: 'Robots.txt loaded successfully',
          line_count: result.line_count,
          loaded_at: result.loaded_at
        });
      } else {
        res.status(500).json({ error: 'Failed to fetch robots.txt: ' + result.error });
      }
    } catch (error) {
      console.log('Refresh robots error:', error.message);
      res.status(500).json({ error: 'Database error' });
    }
  });

  // Bot routes
  router.get('/domains/:domain_id/bots', async (req, res) => {
    try {
      const domain_id = req.params.domain_id;
      const bots = await database.getDomainBots(domain_id);
      res.json(bots);
    } catch (error) {
      console.log('Get bots error:', error.message);
      res.status(500).json({ error: 'Database error' });
    }
  });

  router.put('/domains/:domain_id/bots/:bot_id/permission', async (req, res) => {
    try {
      const domain_id = req.params.domain_id;
      const bot_id = req.params.bot_id;
      const { allow } = req.body;

      if (typeof allow !== 'boolean') {
        return res.status(400).json({ error: 'allow field must be a boolean' });
      }

      const result = await database.updateBotPermission(domain_id, bot_id, allow);
      
      if (result.changes === 0) {
        return res.status(404).json({ error: 'Bot permission not found for this domain' });
      }

      res.json({ 
        message: 'Bot permission updated successfully',
        allow: allow
      });
    } catch (error) {
      console.log('Update bot permission error:', error.message);
      res.status(500).json({ error: 'Database error' });
    }
  });

  // Data collector routes
  router.get('/data-collectors', async (req, res) => {
    try {
      const dataCollectors = await database.getAllDataCollectors();
      res.json(dataCollectors);
    } catch (error) {
      console.log('Get data collectors error:', error.message);
      res.status(500).json({ error: 'Database error' });
    }
  });

  router.get('/data-collectors/:user_id/domains', async (req, res) => {
    try {
      const userId = req.params.user_id;
      
      // Get user with data collector info
      const user = await database.getUserWithDataCollector(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      if (user.account_type !== 'data_collector' || !user.data_collector_id) {
        return res.status(403).json({ error: 'User is not a data collector' });
      }
      
      // Get domains where this data collector's bots are mentioned
      const domains = await database.getDomainsForDataCollector(user.data_collector_id);
      
      res.json(domains);
    } catch (error) {
      console.log('Get data collector domains error:', error.message);
      res.status(500).json({ error: 'Database error' });
    }
  });

  // Publisher routes - get data collectors accessing this publisher's domains
  router.get('/publishers/:user_id/data-collectors', async (req, res) => {
    try {
      const userId = req.params.user_id;
      
      // Get user info (only account_type is needed for validation)
      const user = await database.getUserById(userId);
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          error: 'User not found' 
        });
      }
      
      if (user.account_type !== 'publisher') {
        return res.status(403).json({ 
          success: false,
          error: 'User is not a publisher' 
        });
      }
      
      // Get data collectors that have accessed this publisher's domains
      const dataCollectors = await database.getDataCollectorsForPublisher(userId);
      
      res.json({
        success: true,
        data: dataCollectors
      });
    } catch (error) {
      console.log('Get publisher data collectors error:', error.message);
      res.status(500).json({ 
        success: false,
        error: 'Database error: ' + error.message
      });
    }
  });

  // Admin routes
  router.get('/accounts', async (req, res) => {
    try {
      const users = await database.getAllUsers();
      res.json(users);
    } catch (error) {
      console.log('Get accounts error:', error.message);
      res.status(500).json({ error: 'Database error' });
    }
  });

  router.delete('/users/all', async (req, res) => {
    try {
      await database.deleteAllUsers();
      console.log('All users and domains deleted');
      res.json({ message: 'All users and domains deleted successfully' });
    } catch (error) {
      console.log('Delete all users error:', error.message);
      res.status(500).json({ error: 'Error deleting users' });
    }
  });

  return router;
}

module.exports = createRoutes;