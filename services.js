class RobotsService {
  static parseRobotsContent(robotsContent) {
    const lines = robotsContent.split('\n');
    const userAgents = {};
    let currentUserAgent = null;
    
    for (let line of lines) {
      line = line.trim();
      
      if (!line || line.startsWith('#')) {
        continue;
      }
      
      const colonIndex = line.indexOf(':');
      if (colonIndex === -1) {
        continue;
      }
      
      const directive = line.substring(0, colonIndex).trim().toLowerCase();
      const value = line.substring(colonIndex + 1).trim();
      
      if (directive === 'user-agent') {
        currentUserAgent = value;
        if (!userAgents[currentUserAgent]) {
          userAgents[currentUserAgent] = {
            allow: true,
            rules: []
          };
        }
      } else if (currentUserAgent && (directive === 'allow' || directive === 'disallow')) {
        userAgents[currentUserAgent].rules.push({
          type: directive,
          path: value
        });
        
        if (directive === 'disallow' && value !== '') {
          userAgents[currentUserAgent].allow = false;
        }
      }
    }
    
    return userAgents;
  }

  static async fetchRobotsContent(domain) {
    try {
      const robotsUrl = `https://${domain}/robots.txt`;
      const response = await fetch(robotsUrl);
      
      let robotsContent = '';
      let lineCount = 0;
      
      if (response.ok) {
        robotsContent = await response.text();
        lineCount = robotsContent.split('\n').length;
      } else {
        robotsContent = `# robots.txt not found (HTTP ${response.status})`;
        lineCount = 1;
      }
      
      return { success: true, content: robotsContent, lineCount };
    } catch (error) {
      const errorContent = `# Error fetching robots.txt: ${error.message}`;
      return { success: false, content: errorContent, lineCount: 1, error: error.message };
    }
  }
}

class DomainService {
  constructor(database) {
    this.db = database;
  }

  async addDomainForUser(userId, domain) {
    const user = await this.db.getUserById(userId);
    if (!user) {
      throw new Error('Invalid user');
    }
    if (user.account_type !== 'publisher') {
      throw new Error('Only publishers can add domains');
    }

    const domainRecord = await this.db.createOrGetDomain(domain);
    const domainId = domainRecord.id;
    const wasNewDomain = domainRecord.wasInserted;

    const existingAssociation = await this.db.getUserDomainAssociation(userId, domainId);
    
    if (existingAssociation) {
      const shouldRefreshRobots = !domainRecord.robots_loaded_at || 
        new Date() - new Date(domainRecord.robots_loaded_at) > 24 * 60 * 60 * 1000;
      
      if (shouldRefreshRobots) {
        const robotsResult = await this.refreshRobotsForDomain(domainId, domain);
        return {
          message: 'Domain added successfully',
          id: domainId,
          note: 'Association already existed, robots.txt refreshed',
          robots: robotsResult
        };
      } else {
        return {
          message: 'Domain added successfully',
          id: domainId,
          note: 'Association already existed'
        };
      }
    }

    await this.db.createUserDomainAssociation(userId, domainId);

    const shouldFetchRobots = wasNewDomain || !domainRecord.robots_loaded_at || 
      new Date() - new Date(domainRecord.robots_loaded_at) > 24 * 60 * 60 * 1000;
    
    if (shouldFetchRobots) {
      const robotsResult = await this.refreshRobotsForDomain(domainId, domain);
      return {
        message: 'Domain added successfully',
        id: domainId,
        robots: robotsResult
      };
    } else {
      return {
        message: 'Domain added successfully',
        id: domainId,
        note: 'Using existing robots.txt data'
      };
    }
  }

  async refreshRobotsForDomain(domainId, domain) {
    try {
      console.log(`Fetching robots.txt for ${domain}`);
      
      const robotsResult = await RobotsService.fetchRobotsContent(domain);
      
      await this.db.updateDomainRobots(domainId, robotsResult.content, robotsResult.lineCount);
      
      if (robotsResult.success) {
        await this.saveBotDataForDomain(domainId, robotsResult.content);
        console.log('Bot data saved successfully for domain:', domain);
      }
      
      if (robotsResult.success) {
        return {
          success: true,
          line_count: robotsResult.lineCount,
          loaded_at: new Date().toISOString()
        };
      } else {
        return {
          success: false,
          error: robotsResult.error
        };
      }
    } catch (error) {
      console.log('Error processing robots.txt:', error);
      const errorContent = `# Error processing robots.txt: ${error.message}`;
      
      try {
        await this.db.updateDomainRobots(domainId, errorContent, 1);
      } catch (dbError) {
        console.log('Failed to save error to database:', dbError);
      }
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  async saveBotDataForDomain(domainId, robotsContent) {
    const userAgents = RobotsService.parseRobotsContent(robotsContent);
    
    await this.db.clearDomainBots(domainId);
    
    const userAgentEntries = Object.entries(userAgents);
    
    for (const [userAgent, data] of userAgentEntries) {
      try {
        const bot = await this.db.createOrGetBot(userAgent);
        await this.db.createDomainBotAssociation(domainId, bot.id, data.allow);
      } catch (error) {
        console.log('Error processing bot:', userAgent, error);
      }
    }
  }

  async removeDomainForUser(userId, domainId) {
    const result = await this.db.deleteUserDomainAssociation(userId, domainId);
    if (!result) {
      throw new Error('Domain association not found');
    }
    if (result.changes === 0) {
      throw new Error('Association not found');
    }
    return { message: 'Domain association removed successfully', domain: result.domain };
  }
}

class AuthService {
  constructor(database) {
    this.db = database;
  }

  async createAccount(userData) {
    const { name, email, password, account_type, company, data_collector_id } = userData;
    
    if (!name || !email || !password || !account_type) {
      throw new Error('Name, email, password, and account type are required');
    }
    
    // Validate data collector ID if provided
    if (account_type === 'data_collector' && !data_collector_id) {
      throw new Error('Data collection company is required for data collector accounts');
    }

    try {
      const result = await this.db.createUser(userData);
      return { message: 'Account created successfully', id: result.id };
    } catch (err) {
      if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        throw new Error('Email already exists');
      }
      throw new Error('Database error');
    }
  }

  async login(email, password) {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    const user = await this.db.getUserByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    if (!user.password) {
      throw new Error('This account was created before passwords were required. Please create a new account or contact support.');
    }

    if (user.password !== password) {
      throw new Error('Invalid email or password');
    }

    // If data collector, get additional info
    let userWithInfo = user;
    if (user.account_type === 'data_collector' && user.data_collector_id) {
      userWithInfo = await this.db.getUserWithDataCollector(user.id);
    }

    const { password: _, ...userWithoutPassword } = userWithInfo;
    return { message: 'Login successful', user: userWithoutPassword };
  }
}

module.exports = {
  DomainService,
  AuthService,
  RobotsService
};