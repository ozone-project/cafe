/**
 * Data Collector Management Module for Publishers
 */

class DataCollectorManager {
    constructor(user) {
        this.user = user;
        this.dataCollectors = [];
    }

    // Load data collectors and their domain counts for this publisher
    async loadDataCollectors() {
        const loadingMessage = document.getElementById('loadingDataCollectors');
        loadingMessage.style.display = 'block';
        
        try {
            const result = await CafeUtils.apiCall(`/publishers/${this.user.id}/data-collectors`);
            
            if (result.success) {
                // Handle the double-wrapped response from our API
                if (result.data.success) {
                    this.dataCollectors = result.data.data;
                    this.renderDataCollectors();
                } else {
                    this.showError('Error loading data collectors: ' + result.data.error);
                }
            } else {
                this.showError('Error loading data collectors: ' + result.error);
            }
        } catch (error) {
            console.error('Data collectors API error:', error);
            this.showError('Network error loading data collectors.');
        } finally {
            loadingMessage.style.display = 'none';
        }
    }

    // UI Methods
    renderDataCollectors() {
        const dataCollectorsTableBody = document.getElementById('dataCollectorsTableBody');
        const dataCollectorsList = document.getElementById('dataCollectorsList');
        
        if (this.dataCollectors.length === 0) {
            dataCollectorsList.style.display = 'none';
            // Insert empty state
            const emptyStateElement = document.createElement('div');
            emptyStateElement.id = 'dataCollectorsEmptyState';
            emptyStateElement.className = 'empty-state';
            emptyStateElement.innerHTML = 'No data collectors have accessed your domains yet.';
            
            // Remove any existing empty state
            const existingEmptyState = document.getElementById('dataCollectorsEmptyState');
            if (existingEmptyState) {
                existingEmptyState.remove();
            }
            
            dataCollectorsList.parentNode.insertBefore(emptyStateElement, dataCollectorsList.nextSibling);
            return;
        }

        // Remove empty state if it exists
        const existingEmptyState = document.getElementById('dataCollectorsEmptyState');
        if (existingEmptyState) {
            existingEmptyState.remove();
        }
        
        dataCollectorsList.style.display = 'block';
        dataCollectorsTableBody.innerHTML = this.dataCollectors.map(dc => this.renderDataCollectorItem(dc)).join('');
    }

    renderDataCollectorItem(dataCollector) {
        const domainCount = dataCollector.domain_count || 0;
        const domainText = domainCount === 1 ? 'domain' : 'domains';
        const lastSeen = dataCollector.last_seen_at ? CafeUtils.formatDateTime(dataCollector.last_seen_at) : 'Never';
        
        return `
            <div class="table-row" data-collector-id="${dataCollector.id}" style="grid-template-columns: 3fr 2fr 2fr; cursor: pointer;" onclick="dataCollectorManager.viewCollectorDetails(${dataCollector.id}, '${dataCollector.name}')">
                <div class="domain-display">
                    <div style="width: 16px; height: 16px; background: var(--primary); border-radius: 2px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
                        <span style="color: white; font-size: 10px; font-weight: bold;">DC</span>
                    </div>
                    <div>
                        <div style="font-weight: 600;">${dataCollector.name}</div>
                        <div style="font-size: 12px; color: var(--neutral-700);">Last seen: ${lastSeen}</div>
                    </div>
                </div>
                <div style="text-align: center;">
                    <span class="status-badge ${domainCount > 0 ? 'allowed' : 'blocked'}" style="font-size: 12px;">
                        ${domainCount} ${domainText}
                    </span>
                </div>
                <div class="action-buttons" onclick="event.stopPropagation()">
                    <button class="btn btn-ghost btn-sm" onclick="dataCollectorManager.viewCollectorDetails(${dataCollector.id}, '${dataCollector.name}')" ${domainCount === 0 ? 'disabled' : ''}>
                        View Details
                    </button>
                </div>
            </div>
        `;
    }

    async viewCollectorDetails(collectorId, collectorName) {
        // For now, just show an alert with basic info
        // Later we could implement a modal or separate page with detailed information
        if (!collectorId) return;
        
        const collector = this.dataCollectors.find(dc => dc.id === collectorId);
        if (!collector) return;
        
        const domainCount = collector.domain_count || 0;
        const domainText = domainCount === 1 ? 'domain' : 'domains';
        
        alert(`Data Collector: ${collectorName}\n\nAccessing ${domainCount} of your ${domainText}.\n\nThis feature will be expanded in future updates to show detailed domain-by-domain access information.`);
    }

    showError(message) {
        const dataCollectorsTableBody = document.getElementById('dataCollectorsTableBody');
        const dataCollectorsList = document.getElementById('dataCollectorsList');
        
        dataCollectorsList.style.display = 'none';
        
        const errorElement = document.createElement('div');
        errorElement.className = 'message error';
        errorElement.innerHTML = message;
        
        // Remove any existing error
        const existingError = document.getElementById('dataCollectorsError');
        if (existingError) {
            existingError.remove();
        }
        
        errorElement.id = 'dataCollectorsError';
        dataCollectorsList.parentNode.insertBefore(errorElement, dataCollectorsList.nextSibling);
    }
}