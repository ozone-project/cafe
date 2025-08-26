const sqlite3 = require('sqlite3').verbose();

class Database {
  constructor(dbPath = 'cafe.db') {
    this.db = new sqlite3.Database(dbPath);
    this.init();
  }

  init() {
    this.db.serialize(() => {
      this.createTables();
      this.runMigrations();
    });
  }

  createTables() {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        account_type TEXT NOT NULL,
        company TEXT,
        data_collector_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(data_collector_id) REFERENCES data_collectors(id)
      )
    `);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS domains (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        domain TEXT UNIQUE NOT NULL,
        robots_content TEXT,
        robots_line_count INTEGER,
        robots_loaded_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS data_collectors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        website TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS bots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_agent TEXT UNIQUE NOT NULL,
        data_collector_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (data_collector_id) REFERENCES data_collectors (id)
      )
    `);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS user_domains (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        domain_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (domain_id) REFERENCES domains (id),
        UNIQUE(user_id, domain_id)
      )
    `);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS domain_bots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        domain_id INTEGER NOT NULL,
        bot_id INTEGER NOT NULL,
        allow BOOLEAN NOT NULL DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (domain_id) REFERENCES domains (id),
        FOREIGN KEY (bot_id) REFERENCES bots (id),
        UNIQUE(domain_id, bot_id)
      )
    `);
  }

  runMigrations() {
    this.addPasswordColumn();
    this.addRobotsColumns();
    this.migrateDomainAssociations();
    this.cleanupDomainStructure();
    this.addDataCollectorColumn();
    this.addUserDataCollectorIdColumn();
    this.populateDataCollectors();
  }

  addPasswordColumn() {
    this.db.all("PRAGMA table_info(users)", [], (err, columns) => {
      if (err) {
        console.log('Error checking table structure:', err);
        return;
      }
      
      const hasPasswordColumn = columns.some(col => col.name === 'password');
      if (!hasPasswordColumn) {
        console.log('Adding password column to existing users table...');
        this.db.run(`ALTER TABLE users ADD COLUMN password TEXT`, (err) => {
          if (err) {
            console.log('Error adding password column:', err);
          } else {
            console.log('Password column added successfully');
          }
        });
      }
    });
  }

  addRobotsColumns() {
    this.db.all("PRAGMA table_info(domains)", [], (err, columns) => {
      if (err) {
        console.log('Error checking domains table structure:', err);
        return;
      }
      
      const hasRobotsContent = columns.some(col => col.name === 'robots_content');
      const hasRobotsLineCount = columns.some(col => col.name === 'robots_line_count');
      const hasRobotsLoadedAt = columns.some(col => col.name === 'robots_loaded_at');
      
      if (!hasRobotsContent) {
        this.db.run(`ALTER TABLE domains ADD COLUMN robots_content TEXT`);
      }
      if (!hasRobotsLineCount) {
        this.db.run(`ALTER TABLE domains ADD COLUMN robots_line_count INTEGER`);
      }
      if (!hasRobotsLoadedAt) {
        this.db.run(`ALTER TABLE domains ADD COLUMN robots_loaded_at DATETIME`);
      }
    });
  }

  migrateDomainAssociations() {
    this.db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='user_domains'", [], (err, table) => {
      if (err) {
        console.log('Error checking for user_domains table:', err);
        return;
      }
      
      if (table) {
        this.db.get("SELECT COUNT(*) as count FROM user_domains", [], (err, result) => {
          if (err) {
            console.log('Error checking user_domains count:', err);
            return;
          }
          
          if (result.count === 0) {
            console.log('Migrating existing domain associations to new structure...');
            
            this.db.run(`
              INSERT OR IGNORE INTO domains (domain, robots_content, robots_line_count, robots_loaded_at, created_at)
              SELECT DISTINCT domain, robots_content, robots_line_count, robots_loaded_at, MIN(created_at)
              FROM domains 
              WHERE domain IS NOT NULL
              GROUP BY domain
            `, (err) => {
              if (err) {
                console.log('Error creating unique domains:', err);
                return;
              }
              
              this.db.run(`
                INSERT OR IGNORE INTO user_domains (user_id, domain_id, created_at)
                SELECT DISTINCT old_domains.user_id, new_domains.id, old_domains.created_at
                FROM domains old_domains
                JOIN domains new_domains ON old_domains.domain = new_domains.domain
                WHERE old_domains.user_id IS NOT NULL
              `, (err) => {
                if (err) {
                  console.log('Error creating user-domain associations:', err);
                } else {
                  console.log('Migration completed successfully');
                }
              });
            });
          }
        });
      }
    });
  }

  cleanupDomainStructure() {
    // Migrate domains with user_id to user_domains table
    this.db.all("SELECT * FROM domains WHERE user_id IS NOT NULL AND user_id > 0", [], (err, rows) => {
      if (err) {
        console.log('Error checking domains with user_id:', err);
        return;
      }
      
      if (rows.length > 0) {
        console.log(`Migrating ${rows.length} domains to new structure...`);
        
        rows.forEach(domain => {
          // Insert user-domain association if it doesn't exist
          this.db.run(
            'INSERT OR IGNORE INTO user_domains (user_id, domain_id) VALUES (?, ?)',
            [domain.user_id, domain.id],
            (err) => {
              if (err) {
                console.log('Error creating user-domain association:', err);
              }
            }
          );
        });
      }
    });
  }

  addDataCollectorColumn() {
    this.db.all("PRAGMA table_info(bots)", [], (err, columns) => {
      if (err) {
        console.log('Error checking bots table structure:', err);
        return;
      }
      
      const hasDataCollectorColumn = columns.some(col => col.name === 'data_collector_id');
      if (!hasDataCollectorColumn) {
        console.log('Adding data_collector_id column to bots table...');
        this.db.run(`ALTER TABLE bots ADD COLUMN data_collector_id INTEGER`, (err) => {
          if (err) {
            console.log('Error adding data_collector_id column:', err);
          } else {
            console.log('data_collector_id column added successfully');
          }
        });
      }
    });
  }

  addUserDataCollectorIdColumn() {
    this.db.all("PRAGMA table_info(users)", [], (err, columns) => {
      if (err) {
        console.log('Error checking users table structure:', err);
        return;
      }
      
      const hasDataCollectorIdColumn = columns.some(col => col.name === 'data_collector_id');
      if (!hasDataCollectorIdColumn) {
        console.log('Adding data_collector_id column to users table...');
        this.db.run(`ALTER TABLE users ADD COLUMN data_collector_id INTEGER`, (err) => {
          if (err) {
            console.log('Error adding data_collector_id column to users table:', err);
          } else {
            console.log('data_collector_id column added successfully to users table');
          }
        });
      }
    });
  }

  populateDataCollectors() {
    // Wait a bit for the column to be added
    setTimeout(() => {
      this.db.get("SELECT COUNT(*) as count FROM data_collectors", [], (err, result) => {
        if (err) {
          console.log('Error checking data_collectors table:', err);
          return;
        }
        
        if (result.count === 0) {
          console.log('Populating data collectors...');
          this.createDataCollectorsAndAssignBots();
        }
      });
    }, 1000);
  }

  createDataCollectorsAndAssignBots() {
    // Define the mapping of bot user agents to companies
    const botToCompanyMap = {
      // Google/Alphabet
      'Google-Extended': { company: 'Google', description: 'Google Extended web crawler' },
      'Google-CloudVertexBot': { company: 'Google', description: 'Google Cloud Vertex AI bot' },
      'google-extended': { company: 'Google', description: 'Google Extended web crawler (lowercase)' },
      
      // OpenAI
      'GPTBot': { company: 'OpenAI', description: 'OpenAI GPT web crawler' },
      'ChatGPT-User': { company: 'OpenAI', description: 'ChatGPT user-triggered requests' },
      'OAI-SearchBot': { company: 'OpenAI', description: 'OpenAI search bot' },
      
      // Anthropic
      'ClaudeBot': { company: 'Anthropic', description: 'Anthropic Claude web crawler' },
      'Claude-Web': { company: 'Anthropic', description: 'Anthropic Claude web access' },
      'anthropic-ai': { company: 'Anthropic', description: 'Anthropic AI crawler' },
      'claritybot': { company: 'Anthropic', description: 'Anthropic Clarity bot' },
      
      // Perplexity AI
      'PerplexityBot': { company: 'Perplexity AI', description: 'Perplexity search bot' },
      'Perplexity-User': { company: 'Perplexity AI', description: 'Perplexity user requests' },
      'Perplexity-ai': { company: 'Perplexity AI', description: 'Perplexity AI crawler' },
      
      // Meta/Facebook
      'FacebookBot': { company: 'Meta', description: 'Facebook web crawler' },
      'meta-externalagent': { company: 'Meta', description: 'Meta external agent' },
      'meta-externalfetcher': { company: 'Meta', description: 'Meta external content fetcher' },
      'Meta-ExternalAgent': { company: 'Meta', description: 'Meta External Agent (capitalized)' },
      'Meta-ExternalFetcher': { company: 'Meta', description: 'Meta External Fetcher (capitalized)' },
      
      // Amazon
      'Amazonbot': { company: 'Amazon', description: 'Amazon web crawler' },
      
      // Apple
      'Applebot-Extended': { company: 'Apple', description: 'Apple extended web crawler' },
      
      // ByteDance
      'Bytespider': { company: 'ByteDance', description: 'ByteDance web crawler' },
      
      // Baidu
      'PetalBot': { company: 'Baidu', description: 'Baidu Petal Search bot' },
      
      // Yandex
      'YandexAdditional': { company: 'Yandex', description: 'Yandex additional crawler' },
      'YandexAdditionalBot': { company: 'Yandex', description: 'Yandex additional bot' },
      
      // Cohere
      'cohere-ai': { company: 'Cohere', description: 'Cohere AI crawler' },
      
      // Common Crawl
      'CCBot': { company: 'Common Crawl', description: 'Common Crawl bot' },
      
      // Internet Archive
      'ia_archiver': { company: 'Internet Archive', description: 'Internet Archive crawler' },
      
      // Ahrefs
      'AhrefsBot': { company: 'Ahrefs', description: 'Ahrefs SEO crawler' },
      
      // Scrapy
      'Scrapy': { company: 'Generic Scrapy', description: 'Scrapy framework crawler' },
      
      // Diffbot
      'Diffbot': { company: 'Diffbot', description: 'Diffbot knowledge extraction' },
      
      // DataForSeo
      'DataForSeoBot': { company: 'DataForSeo', description: 'DataForSeo crawler' },
      
      // MJ12
      'MJ12bot': { company: 'MJ12', description: 'Majestic SEO crawler' },
      
      // Turnitin
      'TurnitinBot': { company: 'Turnitin', description: 'Turnitin plagiarism checker' },
      
      // Twitter/X
      'Twitterbot': { company: 'X (Twitter)', description: 'X/Twitter link crawler' },
      
      // Microsoft
      'msnbot': { company: 'Microsoft', description: 'Microsoft Bing crawler' },
      'MSNPTC/1.0': { company: 'Microsoft', description: 'Microsoft MSN crawler' },
      
      // Yahoo
      'Slurp': { company: 'Yahoo', description: 'Yahoo search crawler' },
      
      // DuckDuckGo
      'DuckAssistBot': { company: 'DuckDuckGo', description: 'DuckDuckGo assistant bot' },
      
      // Various smaller companies/services
      'Awario': { company: 'Awario', description: 'Social media monitoring' },
      'AwarioRssBot': { company: 'Awario', description: 'Awario RSS bot' },
      'AwarioSmartBot': { company: 'Awario', description: 'Awario smart bot' },
      'Meltwater': { company: 'Meltwater', description: 'Media monitoring service' },
      'NewsNow': { company: 'NewsNow', description: 'News aggregation service' },
      'Spinn3r': { company: 'Spinn3r', description: 'Blog and news crawler' },
      'BLP_bbot': { company: 'Bloomberg', description: 'Bloomberg news crawler' },
      'Seekr': { company: 'Seekr', description: 'Seekr search engine' },
      'ImagesiftBot': { company: 'ImageSift', description: 'Image analysis crawler' },
      'PiplBot': { company: 'Pipl', description: 'People search engine' },
      'FriendlyCrawler': { company: 'Friendly Crawler', description: 'Generic friendly crawler' },
      'WebVac': { company: 'WebVac', description: 'Web content archiver' },
      'WebZip': { company: 'WebZip', description: 'Web content downloader' },
      'Genieo': { company: 'Genieo', description: 'Search and discovery engine' },
      'Timpibot': { company: 'Timpi', description: 'Timpi search engine' },
      'dotbot': { company: 'OpenSiteExplorer', description: 'OpenSiteExplorer crawler' },
      'A6-Indexer': { company: 'A6Corp', description: 'A6 search indexer' },
      'EasouSpider': { company: 'Easou', description: 'Easou mobile search' },
      'yacybot': { company: 'YaCy', description: 'YaCy peer-to-peer search' },
      'psbot': { company: 'Picsearch', description: 'Picsearch image crawler' },
      'discobot': { company: 'Disco', description: 'Disco search crawler' },
      'peer39_crawler': { company: 'Peer39', description: 'Peer39 ad safety crawler' },
      'peer39_crawler/1.0': { company: 'Peer39', description: 'Peer39 ad safety crawler v1.0' },
      'magpie-crawler': { company: 'Brandwatch', description: 'Brandwatch Magpie crawler' },
      'omgili': { company: 'OMGili', description: 'OMGili blog search' },
      'omgilibot': { company: 'OMGili', description: 'OMGili blog search bot' },
      'Scope3/2.0 (scope3.com)': { company: 'Scope3', description: 'Scope3 ad sustainability' },
      'R6_CommentReader': { company: 'R6', description: 'R6 comment reader' },
      'Verity/1.1': { company: 'Verity', description: 'Verity search engine' },
      'ecoResearch': { company: 'EcoResearch', description: 'Eco research crawler' },
      'news-please': { company: 'news-please', description: 'News extraction framework' }
    };

    // Create data collectors
    const companies = [...new Set(Object.values(botToCompanyMap).map(item => item.company))];
    
    companies.forEach(companyName => {
      this.db.run(
        'INSERT OR IGNORE INTO data_collectors (name) VALUES (?)',
        [companyName],
        (err) => {
          if (err) {
            console.log('Error inserting data collector:', err);
          }
        }
      );
    });

    // Wait for data collectors to be inserted, then assign bots
    setTimeout(() => {
      this.assignBotsToDataCollectors(botToCompanyMap);
    }, 500);
  }

  assignBotsToDataCollectors(botToCompanyMap) {
    // Get all data collectors
    this.db.all('SELECT * FROM data_collectors', [], (err, dataCollectors) => {
      if (err) {
        console.log('Error fetching data collectors:', err);
        return;
      }

      const collectorsByName = {};
      dataCollectors.forEach(collector => {
        collectorsByName[collector.name] = collector.id;
      });

      // Update bots with data collector IDs
      Object.entries(botToCompanyMap).forEach(([userAgent, mapping]) => {
        const dataCollectorId = collectorsByName[mapping.company];
        if (dataCollectorId) {
          this.db.run(
            'UPDATE bots SET data_collector_id = ? WHERE user_agent = ?',
            [dataCollectorId, userAgent],
            (err) => {
              if (err) {
                console.log(`Error updating bot ${userAgent}:`, err);
              }
            }
          );
        }
      });

      console.log('Bot-to-company assignments completed');
    });
  }

  // User operations
  createUser(userData) {
    return new Promise((resolve, reject) => {
      const { name, email, password, account_type, company, data_collector_id } = userData;
      this.db.run(
        'INSERT INTO users (name, email, password, account_type, company, data_collector_id) VALUES (?, ?, ?, ?, ?, ?)',
        [name, email, password, account_type, company || null, data_collector_id || null],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID });
        }
      );
    });
  }

  getUserByEmail(email) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT id, name, email, account_type, company, password FROM users WHERE email = ?',
        [email],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }

  getUserById(id) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT account_type FROM users WHERE id = ?',
        [id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }

  getAllUsers() {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM users ORDER BY created_at DESC', [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Domain operations
  createOrGetDomain(domain, tempUserId = -1) {
    return new Promise((resolve, reject) => {
      const db = this.db;
      
      // First check if domain already exists
      db.get(
        'SELECT id, robots_loaded_at FROM domains WHERE domain = ?',
        [domain],
        (err, existingDomain) => {
          if (err) return reject(err);
          
          if (existingDomain) {
            // Domain exists, return it
            resolve({ ...existingDomain, wasInserted: false });
          } else {
            // Domain doesn't exist, create it with temporary user_id
            db.run(
              'INSERT INTO domains (domain, user_id) VALUES (?, ?)',
              [domain, tempUserId],
              function(err) {
                if (err) return reject(err);
                
                resolve({ id: this.lastID, robots_loaded_at: null, wasInserted: true });
              }
            );
          }
        }
      );
    });
  }

  updateDomainRobots(domainId, robotsContent, lineCount) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE domains SET robots_content = ?, robots_line_count = ?, robots_loaded_at = CURRENT_TIMESTAMP WHERE id = ?',
        [robotsContent, lineCount, domainId],
        function(err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  getDomainById(id) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM domains WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  getUserDomains(userId) {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT d.id, d.domain, d.robots_content, d.robots_line_count, d.robots_loaded_at, ud.created_at
        FROM domains d
        JOIN user_domains ud ON d.id = ud.domain_id
        WHERE ud.user_id = ?
        ORDER BY ud.created_at DESC
      `, [userId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // User-Domain association operations
  getUserDomainAssociation(userId, domainId) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT id FROM user_domains WHERE user_id = ? AND domain_id = ?',
        [userId, domainId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }

  createUserDomainAssociation(userId, domainId) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO user_domains (user_id, domain_id) VALUES (?, ?)',
        [userId, domainId],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID });
        }
      );
    });
  }

  deleteUserDomainAssociation(userId, domainId) {
    return new Promise((resolve, reject) => {
      this.db.get(`
        SELECT d.domain, ud.id as association_id
        FROM domains d
        JOIN user_domains ud ON d.id = ud.domain_id
        WHERE d.id = ? AND ud.user_id = ?
      `, [domainId, userId], (err, association) => {
        if (err) return reject(err);
        if (!association) return resolve(null);
        
        this.db.run('DELETE FROM user_domains WHERE user_id = ? AND domain_id = ?', 
          [userId, domainId], 
          function(err) {
            if (err) reject(err);
            else resolve({ changes: this.changes, domain: association.domain });
          }
        );
      });
    });
  }

  // Data Collector operations
  getAllDataCollectors() {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM data_collectors ORDER BY name', [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  getDataCollectorsForPublisher(publisherId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT DISTINCT
          dc.id,
          dc.name,
          dc.description,
          dc.website,
          COUNT(DISTINCT d.id) as domain_count,
          MAX(db.created_at) as last_seen_at
        FROM data_collectors dc
        INNER JOIN bots b ON dc.id = b.data_collector_id
        INNER JOIN domain_bots db ON b.id = db.bot_id
        INNER JOIN domains d ON db.domain_id = d.id
        INNER JOIN user_domains ud ON d.id = ud.domain_id
        WHERE ud.user_id = ?
        GROUP BY dc.id, dc.name, dc.description, dc.website
        ORDER BY domain_count DESC, dc.name
      `;
      
      this.db.all(query, [publisherId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  getDataCollectorById(id) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM data_collectors WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  createDataCollector(name, description = null, website = null) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO data_collectors (name, description, website) VALUES (?, ?, ?)',
        [name, description, website],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID });
        }
      );
    });
  }

  // Bot operations
  createOrGetBot(userAgent) {
    return new Promise((resolve, reject) => {
      this.db.run('INSERT OR IGNORE INTO bots (user_agent) VALUES (?)', [userAgent], (err) => {
        if (err) return reject(err);
        
        this.db.get('SELECT id FROM bots WHERE user_agent = ?', [userAgent], (err, bot) => {
          if (err) reject(err);
          else resolve(bot);
        });
      });
    });
  }

  clearDomainBots(domainId) {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM domain_bots WHERE domain_id = ?', [domainId], function(err) {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  createDomainBotAssociation(domainId, botId, allow) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO domain_bots (domain_id, bot_id, allow) VALUES (?, ?, ?)',
        [domainId, botId, allow ? 1 : 0],
        function(err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  getDomainBots(domainId) {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT b.user_agent, db.allow, db.created_at, 
               dc.name as data_collector_name, dc.id as data_collector_id,
               b.id as bot_id, db.id as domain_bot_id
        FROM domain_bots db
        JOIN bots b ON db.bot_id = b.id
        LEFT JOIN data_collectors dc ON b.data_collector_id = dc.id
        WHERE db.domain_id = ?
        ORDER BY dc.name, b.user_agent
      `, [domainId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  updateBotPermission(domainId, botId, allow) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE domain_bots SET allow = ? WHERE domain_id = ? AND bot_id = ?',
        [allow ? 1 : 0, domainId, botId],
        function(err) {
          if (err) reject(err);
          else resolve({ changes: this.changes });
        }
      );
    });
  }

  // Data Collector operations
  getDomainsForDataCollector(dataCollectorId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT DISTINCT
          d.id as domain_id,
          d.domain,
          db.allow,
          b.user_agent,
          db.created_at as updated_at,
          u.name as publisher_name,
          u.email as publisher_email,
          dc.name as data_collector_name
        FROM domains d
        INNER JOIN domain_bots db ON d.id = db.domain_id
        INNER JOIN bots b ON db.bot_id = b.id
        LEFT JOIN user_domains ud ON d.id = ud.domain_id
        LEFT JOIN users u ON ud.user_id = u.id AND u.account_type = 'publisher'
        LEFT JOIN data_collectors dc ON b.data_collector_id = dc.id
        WHERE b.data_collector_id = ?
        ORDER BY d.domain, b.user_agent
      `;
      
      this.db.all(query, [dataCollectorId], (err, rows) => {
        if (err) {
          console.log('Error getting domains for data collector:', err);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  getUserWithDataCollector(userId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          u.*,
          dc.name as data_collector_name
        FROM users u
        LEFT JOIN data_collectors dc ON u.data_collector_id = dc.id
        WHERE u.id = ?
      `;
      
      this.db.get(query, [userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  // Cleanup operations
  deleteAllUsers() {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM domains', (err) => {
        if (err) return reject(err);
        
        this.db.run('DELETE FROM users', (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    });
  }

  close() {
    this.db.close();
  }
}

module.exports = Database;