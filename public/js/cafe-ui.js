/**
 * CAFE UI Framework - Reusable components and utilities
 */

// ======================
// UTILITIES
// ======================

const CafeUtils = {
    // API utilities
    async apiCall(url, options = {}) {
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        const config = { ...defaultOptions, ...options };
        
        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || `HTTP ${response.status}`);
            }
            
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // DOM utilities
    createElement(tag, attributes = {}, children = []) {
        const element = document.createElement(tag);
        
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'style' && typeof value === 'object') {
                Object.assign(element.style, value);
            } else if (key.startsWith('on') && typeof value === 'function') {
                element.addEventListener(key.slice(2).toLowerCase(), value);
            } else {
                element.setAttribute(key, value);
            }
        });
        
        children.forEach(child => {
            if (typeof child === 'string') {
                element.appendChild(document.createTextNode(child));
            } else {
                element.appendChild(child);
            }
        });
        
        return element;
    },

    // Form utilities
    getFormData(form) {
        const formData = new FormData(form);
        const data = {};
        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }
        return data;
    },

    // Validation utilities
    validateDomains(domainsText) {
        const domains = domainsText
            .split('\n')
            .map(domain => domain.trim())
            .filter(domain => domain.length > 0);

        if (domains.length === 0) {
            return { valid: false, error: 'Please enter at least one domain.' };
        }

        const invalidDomains = domains.filter(domain => 
            !/^[a-zA-Z0-9][a-zA-Z0-9-._]*[a-zA-Z0-9]$/.test(domain)
        );

        if (invalidDomains.length > 0) {
            return { 
                valid: false, 
                error: `Invalid domain names: ${invalidDomains.join(', ')}` 
            };
        }

        return { valid: true, domains };
    },

    // Date utilities
    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString();
    },

    formatDateTime(dateString) {
        return new Date(dateString).toLocaleString();
    }
};

// ======================
// UI COMPONENTS
// ======================

const CafeComponents = {
    // Message component
    createMessage(type, text) {
        return CafeUtils.createElement('div', {
            class: `message ${type}`
        }, [text]);
    },

    // Button component
    createButton(text, options = {}) {
        const defaultOptions = {
            class: 'btn',
            style: {
                background: '#007bff',
                color: 'white',
                padding: '10px 20px',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px'
            }
        };

        return CafeUtils.createElement('button', {
            ...defaultOptions,
            ...options
        }, [text]);
    },

    // Modal component
    createModal(title, content, options = {}) {
        const modal = CafeUtils.createElement('div', {
            style: {
                position: 'fixed',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(0,0,0,0.7)',
                zIndex: '1000',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
            }
        });

        const modalContent = CafeUtils.createElement('div', {
            style: {
                background: 'white',
                width: options.width || '90%',
                maxWidth: options.maxWidth || '600px',
                maxHeight: options.maxHeight || '80%',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
            }
        });

        const header = CafeUtils.createElement('div', {
            style: {
                padding: '20px',
                borderBottom: '1px solid #ddd',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#f8f9fa',
                borderRadius: '8px 8px 0 0'
            }
        });

        const headerTitle = CafeUtils.createElement('div', {}, [
            CafeUtils.createElement('h2', {
                style: { margin: '0', color: '#333' }
            }, [title])
        ]);

        const closeButton = CafeUtils.createElement('button', {
            style: {
                background: '#dc3545',
                color: 'white',
                border: 'none',
                padding: '8px 10px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px',
                lineHeight: '1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px'
            },
            title: 'Close',
            onclick: () => modal.remove()
        }, ['×']);

        // Add hover effect
        closeButton.addEventListener('mouseenter', () => {
            closeButton.style.background = '#c82333';
        });
        closeButton.addEventListener('mouseleave', () => {
            closeButton.style.background = '#dc3545';
        });

        const body = CafeUtils.createElement('div', {
            style: {
                flex: '1',
                padding: '20px',
                overflowY: 'auto',
                background: '#fff',
                borderRadius: '0 0 8px 8px'
            }
        });

        if (typeof content === 'string') {
            body.innerHTML = content;
        } else {
            body.appendChild(content);
        }

        header.appendChild(headerTitle);
        header.appendChild(closeButton);
        modalContent.appendChild(header);
        modalContent.appendChild(body);
        modal.appendChild(modalContent);

        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        // Close on escape key
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);

        return modal;
    },

    // Bot permission status button
    createBotStatusButton(bot, domainId, onToggle) {
        const button = CafeUtils.createElement('button', {
            id: `status-btn-${bot.bot_id}`,
            'data-domain-id': domainId,
            'data-bot-id': bot.bot_id,
            'data-current-allow': bot.allow,
            style: {
                padding: '4px 10px',
                border: 'none',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: 'bold',
                background: bot.allow ? '#28a745' : '#dc3545',
                color: 'white',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
            },
            title: `Click to ${bot.allow ? 'block' : 'allow'} this bot`,
            onclick: () => onToggle(domainId, bot.bot_id, !bot.allow)
        }, [bot.allow ? 'Allowed' : 'Blocked']);

        // Add hover effect
        button.addEventListener('mouseenter', () => {
            button.style.opacity = '0.8';
        });
        button.addEventListener('mouseleave', () => {
            button.style.opacity = '1';
        });

        return button;
    },

    // Bot row component
    createBotRow(bot, domainId, onToggle) {
        const row = CafeUtils.createElement('div', {
            id: `bot-row-${bot.bot_id}`,
            style: {
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 12px',
                margin: '6px 0',
                background: bot.allow ? '#d4edda' : '#f8d7da',
                border: `1px solid ${bot.allow ? '#c3e6cb' : '#f5c6cb'}`,
                borderRadius: '6px',
                borderLeft: `4px solid ${bot.allow ? '#28a745' : '#dc3545'}`,
                transition: 'all 0.3s ease'
            }
        });

        const info = CafeUtils.createElement('div', {}, [
            CafeUtils.createElement('div', {
                style: {
                    fontWeight: 'bold',
                    fontFamily: '"Courier New", monospace',
                    fontSize: '14px'
                }
            }, [bot.user_agent]),
            CafeUtils.createElement('div', {
                style: {
                    fontSize: '11px',
                    color: '#666',
                    marginTop: '3px'
                }
            }, [`Parsed: ${CafeUtils.formatDate(bot.created_at)}`])
        ]);

        const statusButton = this.createBotStatusButton(bot, domainId, onToggle);

        row.appendChild(info);
        row.appendChild(statusButton);

        return row;
    },

    // Company toggle badge
    createCompanyToggle(companyName, botCount, companyId, onToggle) {
        return CafeUtils.createElement('span', {
            id: `toggle-${companyId}`,
            style: {
                fontSize: '12px',
                fontWeight: 'normal',
                color: '#666',
                background: '#e9ecef',
                padding: '2px 6px',
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease',
                userSelect: 'none'
            },
            title: 'Click to expand/collapse bots',
            onclick: () => onToggle(companyId),
            onmouseenter: function() { this.style.background = '#dee2e6'; },
            onmouseleave: function() { this.style.background = '#e9ecef'; }
        }, [`${botCount} bot${botCount !== 1 ? 's' : ''}`]);
    }
};

// ======================
// MODAL SYSTEM
// ======================

const CafeModals = {
    // Show robots.txt modal
    showRobotsModal(domain, content, loadedDate) {
        const modalContent = CafeUtils.createElement('div', {}, [
            CafeUtils.createElement('div', {
                style: { color: '#666', fontSize: '14px', marginBottom: '15px' }
            }, [
                `Last loaded: ${CafeUtils.formatDateTime(loadedDate)} | `,
                CafeUtils.createElement('a', {
                    href: `https://${domain}/robots.txt`,
                    target: '_blank'
                }, ['View original'])
            ]),
            CafeUtils.createElement('div', {
                style: {
                    fontFamily: '"Courier New", monospace',
                    whiteSpace: 'pre-wrap',
                    background: '#f8f9fa',
                    padding: '15px',
                    borderRadius: '4px',
                    maxHeight: '400px',
                    overflowY: 'auto'
                }
            }, [content])
        ]);

        const modal = CafeComponents.createModal(
            `robots.txt for ${domain}`, 
            modalContent,
            { maxWidth: '800px' }
        );

        document.body.appendChild(modal);
    },

    // Show bots permission modal
    showBotsModal(domainId, domainName, bots, onBotToggle) {
        // Group bots by company
        const botsByCompany = {};
        const unassignedBots = [];

        bots.forEach(bot => {
            if (bot.data_collector_name) {
                if (!botsByCompany[bot.data_collector_name]) {
                    botsByCompany[bot.data_collector_name] = [];
                }
                botsByCompany[bot.data_collector_name].push(bot);
            } else {
                unassignedBots.push(bot);
            }
        });

        const companyCount = Object.keys(botsByCompany).length;
        const totalBots = bots.length;

        const content = CafeUtils.createElement('div', {});

        // Header with controls
        const header = CafeUtils.createElement('div', {
            style: {
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
            }
        }, [
            CafeUtils.createElement('div', {
                style: { color: '#666', fontSize: '14px' }
            }, [`Found ${totalBots} bot(s) from ${companyCount} companies in ${domainName}/robots.txt`]),
            CafeUtils.createElement('div', {
                style: { display: 'flex', gap: '8px' }
            }, [
                this.createToggleAllButton('Expand All', '#28a745', () => this.toggleAllCompanies(true)),
                this.createToggleAllButton('Collapse All', '#6c757d', () => this.toggleAllCompanies(false))
            ])
        ]);

        // Scrollable content
        const scrollContent = CafeUtils.createElement('div', {
            style: { maxHeight: '450px', overflowY: 'auto' }
        });

        // Add company groups
        Object.keys(botsByCompany).sort().forEach((companyName, index) => {
            const companyGroup = this.createCompanyGroup(
                companyName, 
                botsByCompany[companyName], 
                `company-${index}`, 
                domainId, 
                onBotToggle
            );
            scrollContent.appendChild(companyGroup);
        });

        // Add unassigned bots
        if (unassignedBots.length > 0) {
            const unknownGroup = this.createCompanyGroup(
                'Other/Unknown', 
                unassignedBots, 
                'company-unknown', 
                domainId, 
                onBotToggle,
                '#6c757d'
            );
            scrollContent.appendChild(unknownGroup);
        }

        content.appendChild(header);
        content.appendChild(scrollContent);

        const modal = CafeComponents.createModal(
            'Data Collector Permissions',
            content,
            { maxWidth: '700px', maxHeight: '85%' }
        );

        // Add subtitle with favicon
        const favicon = CafeUtils.createElement('img', {
            src: `https://${domainName}/favicon.ico`,
            style: {
                width: '16px',
                height: '16px',
                marginRight: '8px',
                verticalAlign: 'middle'
            },
            onerror: function() { this.style.display = 'none'; }
        });
        
        const subtitle = CafeUtils.createElement('div', {
            style: { 
                color: '#666', 
                fontSize: '14px', 
                marginTop: '5px',
                display: 'flex',
                alignItems: 'center'
            }
        }, [favicon, domainName]);
        
        modal.querySelector('h2').parentNode.appendChild(subtitle);
        document.body.appendChild(modal);
    },

    // Helper methods
    createToggleAllButton(text, color, onClick) {
        return CafeUtils.createElement('button', {
            style: {
                background: color,
                color: 'white',
                border: 'none',
                padding: '4px 8px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px',
                textTransform: 'uppercase',
                fontWeight: 'bold'
            },
            title: text,
            onclick: onClick,
            onmouseenter: function() { this.style.opacity = '0.8'; },
            onmouseleave: function() { this.style.opacity = '1'; }
        }, [text]);
    },

    createCompanyGroup(companyName, bots, companyId, domainId, onBotToggle, color = '#007bff') {
        const group = CafeUtils.createElement('div', {
            style: { marginBottom: '20px' }
        });

        const header = CafeUtils.createElement('div', {
            style: {
                fontWeight: 'bold',
                fontSize: '16px',
                color: '#333',
                marginBottom: '8px',
                paddingBottom: '4px',
                borderBottom: `2px solid ${color}`,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
            }
        }, [
            CafeUtils.createElement('div', {
                style: {
                    width: '4px',
                    height: '18px',
                    background: color,
                    borderRadius: '2px'
                }
            }),
            companyName,
            CafeComponents.createCompanyToggle(
                companyName, 
                bots.length, 
                companyId, 
                (id) => this.toggleCompanyBots(id)
            )
        ]);

        const botsContainer = CafeUtils.createElement('div', {
            id: companyId,
            style: { marginLeft: '12px' }
        });

        bots.forEach(bot => {
            const botRow = CafeComponents.createBotRow(bot, domainId, onBotToggle);
            botsContainer.appendChild(botRow);
        });

        group.appendChild(header);
        group.appendChild(botsContainer);

        return group;
    },

    toggleCompanyBots(companyId) {
        const companyDiv = document.getElementById(companyId);
        const toggleButton = document.getElementById(`toggle-${companyId}`);
        
        if (companyDiv.style.display === 'none') {
            // Expand
            companyDiv.style.display = 'block';
            companyDiv.style.animation = 'fadeIn 0.3s ease-in-out';
            toggleButton.style.background = '#d4edda';
            toggleButton.style.color = '#155724';
        } else {
            // Collapse
            companyDiv.style.display = 'none';
            toggleButton.style.background = '#e9ecef';
            toggleButton.style.color = '#666';
        }
    },

    toggleAllCompanies(expand) {
        const companies = document.querySelectorAll('[id^="company-"]');
        companies.forEach((companyDiv) => {
            const isCurrentlyHidden = companyDiv.style.display === 'none';
            const shouldExpand = expand !== null ? expand : isCurrentlyHidden;
            
            if (shouldExpand && isCurrentlyHidden) {
                this.toggleCompanyBots(companyDiv.id);
            } else if (!shouldExpand && !isCurrentlyHidden) {
                this.toggleCompanyBots(companyDiv.id);
            }
        });
    }
};