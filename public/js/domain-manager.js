/**
 * Domain Management Module
 */

class DomainManager {
    constructor(user) {
        this.user = user;
        this.domains = [];
    }

    // Domain operations
    async loadDomains() {
        const result = await CafeUtils.apiCall(`/domains/${this.user.id}`);
        if (result.success) {
            this.domains = result.data;
            this.renderDomains();
        } else {
            this.showError('Error loading domains.');
        }
    }

    async addDomains(domainsText) {
        const validation = CafeUtils.validateDomains(domainsText);
        if (!validation.valid) {
            this.showError(validation.error);
            return;
        }

        const { domains } = validation;
        this.showProgress(`Adding ${domains.length} domains...`);

        let successCount = 0;
        const errors = [];

        for (const domain of domains) {
            const result = await CafeUtils.apiCall('/domains', {
                method: 'POST',
                body: JSON.stringify({
                    user_id: this.user.id,
                    domain: domain
                })
            });

            if (result.success) {
                successCount++;
            } else {
                errors.push(`${domain}: ${result.error}`);
            }
        }

        this.showResults(successCount, errors);
        
        if (successCount > 0) {
            this.loadDomains();
            document.getElementById('domainForm').reset();
        }
    }

    async removeDomain(domainId, domainName) {
        const confirmed = confirm(
            `Are you sure you want to remove "${domainName}" from your tracked domains?\n\n` +
            'This will remove your association with this domain but keep the domain data intact.'
        );

        if (!confirmed) return;

        const result = await CafeUtils.apiCall(
            `/domains/${domainId}/association/${this.user.id}`, 
            { method: 'DELETE' }
        );

        if (result.success) {
            alert(`Domain "${domainName}" has been removed successfully.`);
            this.loadDomains();
        } else {
            alert('Error: ' + result.error);
        }
    }

    async refreshRobots(domainId, buttonElement) {
        buttonElement.disabled = true;
        buttonElement.textContent = 'Loading...';

        const result = await CafeUtils.apiCall(`/domains/${domainId}/refresh-robots`, {
            method: 'POST'
        });

        if (result.success) {
            this.loadDomains();
        } else {
            alert('Error: ' + result.error);
            buttonElement.disabled = false;
            buttonElement.textContent = 'Refresh';
        }
    }

    async refreshAllRobots() {
        const refreshAllBtn = document.getElementById('refreshAllBtn');
        const originalText = refreshAllBtn.textContent;

        if (this.domains.length === 0) {
            alert('No domains to refresh.');
            return;
        }

        refreshAllBtn.disabled = true;
        refreshAllBtn.textContent = `Refreshing 0 of ${this.domains.length}...`;

        let completed = 0;
        let successful = 0;
        const errors = [];

        const batchSize = 3;
        for (let i = 0; i < this.domains.length; i += batchSize) {
            const batch = this.domains.slice(i, i + batchSize);
            const promises = batch.map(async (domain) => {
                const result = await CafeUtils.apiCall(`/domains/${domain.id}/refresh-robots`, {
                    method: 'POST'
                });

                completed++;
                refreshAllBtn.textContent = `Refreshing ${completed} of ${this.domains.length}...`;

                if (result.success) {
                    successful++;
                } else {
                    errors.push(`${domain.domain}: ${result.error}`);
                }
            });

            await Promise.all(promises);
        }

        let message = `Refresh complete! ${successful} of ${this.domains.length} domains updated successfully.`;
        if (errors.length > 0) {
            message += `\\n\\nErrors:\\n${errors.join('\\n')}`;
        }
        alert(message);

        this.loadDomains();
        refreshAllBtn.disabled = false;
        refreshAllBtn.textContent = originalText;
    }

    async viewDomainBots(domainId, domainName) {
        const result = await CafeUtils.apiCall(`/domains/${domainId}/bots`);
        
        if (!result.success) {
            alert('Error: ' + result.error);
            return;
        }

        CafeModals.showBotsModal(domainId, domainName, result.data, 
            (dId, botId, newAllow) => this.toggleBotPermission(dId, botId, newAllow)
        );
    }

    async viewRobots(domainId) {
        const result = await CafeUtils.apiCall(`/domains/${domainId}/robots`);
        
        if (!result.success) {
            alert('Error: ' + result.error);
            return;
        }

        // Try popup first, fallback to modal
        const robotsWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
        
        if (robotsWindow && !robotsWindow.closed) {
            this.showRobotsPopup(robotsWindow, result.data);
            robotsWindow.focus();
        } else {
            CafeModals.showRobotsModal(result.data.domain, result.data.content, result.data.loaded_at);
        }
    }

    async toggleBotPermission(domainId, botId, newAllowValue) {
        const statusButton = document.getElementById(`status-btn-${botId}`);
        const botRow = document.getElementById(`bot-row-${botId}`);
        
        // Disable button during request
        statusButton.disabled = true;
        statusButton.style.opacity = '0.5';
        statusButton.style.cursor = 'not-allowed';
        
        const result = await CafeUtils.apiCall(`/domains/${domainId}/bots/${botId}/permission`, {
            method: 'PUT',
            body: JSON.stringify({ allow: newAllowValue })
        });
        
        if (result.success) {
            this.updateBotRowUI(botRow, statusButton, newAllowValue, domainId, botId);
        } else {
            alert('Error: ' + result.error);
            // Re-enable button on error
            statusButton.disabled = false;
            statusButton.style.opacity = '1';
            statusButton.style.cursor = 'pointer';
        }
    }

    // UI Methods
    renderDomains() {
        const domainsTableBody = document.getElementById('domainsTableBody');
        const domainsList = document.getElementById('domainsList');
        
        if (this.domains.length === 0) {
            domainsList.style.display = 'none';
            // Insert empty state after the domainsList element
            const emptyStateElement = document.createElement('div');
            emptyStateElement.id = 'emptyState';
            emptyStateElement.className = 'empty-state';
            emptyStateElement.innerHTML = 'No domains added yet. Add your first domain above!';
            
            // Remove any existing empty state
            const existingEmptyState = document.getElementById('emptyState');
            if (existingEmptyState) {
                existingEmptyState.remove();
            }
            
            domainsList.parentNode.insertBefore(emptyStateElement, domainsList.nextSibling);
            return;
        }

        // Remove empty state if it exists
        const existingEmptyState = document.getElementById('emptyState');
        if (existingEmptyState) {
            existingEmptyState.remove();
        }
        
        domainsList.style.display = 'block';
        domainsTableBody.innerHTML = this.domains.map(domain => this.renderDomainItem(domain)).join('');
    }

    renderDomainItem(domain) {
        const robotsInfo = domain.robots_loaded_at 
            ? `Last loaded: ${CafeUtils.formatDateTime(domain.robots_loaded_at)} | ${domain.robots_line_count} lines`
            : `Not loaded yet`;

        const hasRobotsContent = domain.robots_content && domain.robots_content.trim().length > 0;

        return `
            <div class="table-row" data-domain-id="${domain.id}" style="grid-template-columns: 3fr 2fr 2fr; cursor: pointer;" onclick="domainManager.viewDomainBots(${domain.id}, '${domain.domain}')">
                <div class="domain-display">
                    <img src="https://${domain.domain}/favicon.ico" class="favicon" onerror="this.style.display='none'">
                    <div>
                        <div style="font-weight: 600;">${domain.domain}</div>
                        <div style="font-size: 12px; color: var(--neutral-700);">Added: ${CafeUtils.formatDate(domain.created_at)}</div>
                    </div>
                </div>
                <div style="font-size: 12px; color: var(--neutral-700);">
                    <strong>robots.txt:</strong><br>
                    ${robotsInfo}
                </div>
                <div class="action-buttons" onclick="event.stopPropagation()">
                    <button class="btn btn-success btn-sm" onclick="domainManager.refreshRobots(${domain.id}, this)">
                        Refresh
                    </button>
                    <button class="btn btn-ghost btn-sm" onclick="domainManager.viewRobots(${domain.id})" ${!hasRobotsContent ? 'disabled' : ''}>
                        View
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="domainManager.removeDomain(${domain.id}, '${domain.domain}')">
                        Remove
                    </button>
                </div>
            </div>
        `;
    }

    showProgress(message) {
        document.getElementById('domainMessage').innerHTML = 
            `<div class="message">${message}</div>`;
    }

    showError(message) {
        document.getElementById('domainMessage').innerHTML = 
            `<div class="message error">${message}</div>`;
    }

    showResults(successCount, errors) {
        let message = '';
        if (successCount > 0) {
            message += `<div class="message success">${successCount} domain(s) added successfully.</div>`;
        }
        if (errors.length > 0) {
            message += `<div class="message error">Errors:<br>${errors.join('<br>')}</div>`;
        }
        document.getElementById('domainMessage').innerHTML = message;
    }

    updateBotRowUI(botRow, statusButton, newAllowValue, domainId, botId) {
        // Update the button
        statusButton.textContent = newAllowValue ? 'Allowed' : 'Blocked';
        statusButton.style.background = newAllowValue ? '#28a745' : '#dc3545';
        statusButton.title = `Click to ${newAllowValue ? 'block' : 'allow'} this bot`;
        statusButton.onclick = () => this.toggleBotPermission(domainId, botId, !newAllowValue);
        statusButton.setAttribute('data-current-allow', newAllowValue);
        
        // Update the row background and borders
        botRow.style.background = newAllowValue ? '#d4edda' : '#f8d7da';
        botRow.style.borderColor = newAllowValue ? '#c3e6cb' : '#f5c6cb';
        botRow.style.borderLeftColor = newAllowValue ? '#28a745' : '#dc3545';
        
        // Re-enable button
        statusButton.disabled = false;
        statusButton.style.opacity = '1';
        statusButton.style.cursor = 'pointer';
    }

    showRobotsPopup(robotsWindow, data) {
        robotsWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>robots.txt - ${data.domain}</title>
                <style>
                    body {
                        font-family: 'Courier New', monospace;
                        margin: 20px;
                        background-color: #f8f9fa;
                    }
                    .header {
                        background: white;
                        padding: 15px;
                        border-radius: 5px;
                        margin-bottom: 20px;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                    }
                    .content {
                        background: white;
                        padding: 20px;
                        border-radius: 5px;
                        white-space: pre-wrap;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                        max-height: 70vh;
                        overflow-y: auto;
                    }
                    h1 { margin: 0 0 10px 0; color: #333; }
                    .info { color: #666; font-size: 14px; }
                    .close-btn {
                        background: #dc3545; color: white; border: none;
                        padding: 8px 16px; border-radius: 4px; cursor: pointer; float: right;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>robots.txt for ${data.domain}</h1>
                    <div class="info">
                        Last loaded: ${CafeUtils.formatDateTime(data.loaded_at)} | 
                        <a href="https://${data.domain}/robots.txt" target="_blank">View original</a>
                    </div>
                    <button class="close-btn" onclick="window.close()">Close</button>
                    <div style="clear: both;"></div>
                </div>
                <div class="content">${data.content}</div>
            </body>
            </html>
        `);
        robotsWindow.document.close();
    }
}