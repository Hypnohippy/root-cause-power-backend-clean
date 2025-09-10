/**
 * Root Cause Power - Content Automation Scheduler
 * Handles automated content discovery and scheduled tasks
 */

class AutomationScheduler {
    constructor() {
        this.intervals = new Map();
        this.isRunning = false;
        this.config = {
            // Content discovery schedule
            contentDiscovery: {
                enabled: true,
                interval: 24 * 60 * 60 * 1000, // 24 hours
                lastRun: null
            },
            
            // Quality check schedule
            qualityReview: {
                enabled: true,
                interval: 6 * 60 * 60 * 1000, // 6 hours
                lastRun: null
            },
            
            // Cleanup schedule
            cleanup: {
                enabled: true,
                interval: 7 * 24 * 60 * 60 * 1000, // 7 days
                lastRun: null
            }
        };
        
        this.contentAggregator = null;
    }

    /**
     * Initialize the automation scheduler
     */
    async initialize() {
        console.log('🤖 Initializing Content Automation Scheduler...');
        
        try {
            // Import ContentAggregator
            if (typeof require !== 'undefined') {
                const ContentAggregator = require('./ContentAggregator');
                this.contentAggregator = new ContentAggregator();
            } else {
                this.contentAggregator = new ContentAggregator();
            }
            
            // Load configuration
            this.loadConfiguration();
            
            // Start scheduler
            this.start();
            
            console.log('✅ Automation scheduler initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize automation scheduler:', error);
            throw error;
        }
    }

    /**
     * Start all scheduled tasks
     */
    start() {
        if (this.isRunning) {
            console.log('⚠️ Scheduler already running');
            return;
        }
        
        console.log('🚀 Starting automation scheduler...');
        this.isRunning = true;
        
        // Schedule content discovery
        if (this.config.contentDiscovery.enabled) {
            this.scheduleTask('contentDiscovery', () => this.runContentDiscovery());
        }
        
        // Schedule quality reviews
        if (this.config.qualityReview.enabled) {
            this.scheduleTask('qualityReview', () => this.runQualityReview());
        }
        
        // Schedule cleanup
        if (this.config.cleanup.enabled) {
            this.scheduleTask('cleanup', () => this.runCleanup());
        }
        
        // Run initial discovery if never run before
        if (!this.config.contentDiscovery.lastRun) {
            setTimeout(() => this.runContentDiscovery(), 5000); // 5 seconds delay
        }
        
        console.log('✅ All scheduled tasks started');
    }

    /**
     * Stop all scheduled tasks
     */
    stop() {
        console.log('🛑 Stopping automation scheduler...');
        
        this.intervals.forEach((intervalId, taskName) => {
            clearInterval(intervalId);
            console.log(`  - Stopped ${taskName}`);
        });
        
        this.intervals.clear();
        this.isRunning = false;
        
        console.log('✅ Scheduler stopped');
    }

    /**
     * Schedule a recurring task
     */
    scheduleTask(taskName, taskFunction) {
        const config = this.config[taskName];
        
        if (!config || !config.enabled) {
            console.log(`⏭️ Task ${taskName} is disabled, skipping`);
            return;
        }
        
        // Clear existing interval if any
        if (this.intervals.has(taskName)) {
            clearInterval(this.intervals.get(taskName));
        }
        
        // Schedule new interval
        const intervalId = setInterval(async () => {
            try {
                console.log(`🔄 Running scheduled task: ${taskName}`);
                await taskFunction();
                config.lastRun = new Date().toISOString();
                this.saveConfiguration();
                
            } catch (error) {
                console.error(`❌ Error in scheduled task ${taskName}:`, error);
            }
        }, config.interval);
        
        this.intervals.set(taskName, intervalId);
        
        console.log(`📅 Scheduled ${taskName} to run every ${this.formatInterval(config.interval)}`);
    }

    /**
     * Run content discovery process
     */
    async runContentDiscovery() {
        console.log('🔍 Starting automated content discovery...');
        
        try {
            if (!this.contentAggregator) {
                throw new Error('ContentAggregator not initialized');
            }
            
            const startTime = Date.now();
            const discoveredContent = await this.contentAggregator.aggregateContent();
            const duration = Date.now() - startTime;
            
            // Log results
            const stats = this.analyzeDiscoveredContent(discoveredContent);
            
            console.log(`✅ Content discovery completed in ${duration}ms`);
            console.log(`📊 Discovery Stats:`, stats);
            
            // Save discovery log
            this.logDiscoveryResults({
                timestamp: new Date().toISOString(),
                duration: duration,
                contentFound: discoveredContent.length,
                stats: stats,
                success: true
            });
            
            // Send notification if significant content found
            if (discoveredContent.length >= 5) {
                this.notifyAdmins(`🎉 Found ${discoveredContent.length} new content items for review!`);
            }
            
            return discoveredContent;
            
        } catch (error) {
            console.error('❌ Content discovery failed:', error);
            
            this.logDiscoveryResults({
                timestamp: new Date().toISOString(),
                success: false,
                error: error.message
            });
            
            throw error;
        }
    }

    /**
     * Run quality review of pending content
     */
    async runQualityReview() {
        console.log('🧐 Running automated quality review...');
        
        try {
            // Get pending content
            const pendingContent = JSON.parse(localStorage.getItem('pendingContent') || '[]');
            const pendingItems = pendingContent.filter(item => item.status === 'pending');
            
            if (pendingItems.length === 0) {
                console.log('📭 No pending content to review');
                return;
            }
            
            let autoApproved = 0;
            let flaggedForReview = 0;
            
            // Auto-approve high-quality content
            const highQualityItems = pendingItems.filter(item => 
                (item.relevanceScore || 0) >= 0.9 && 
                item.aiAnalysis?.isEvidenceBased
            );
            
            for (const item of highQualityItems) {
                await this.autoApproveContent(item);
                autoApproved++;
            }
            
            // Flag low-quality items for manual review
            const lowQualityItems = pendingItems.filter(item => 
                (item.relevanceScore || 0) < 0.5
            );
            
            for (const item of lowQualityItems) {
                await this.flagForReview(item, 'Low quality score');
                flaggedForReview++;
            }
            
            console.log(`✅ Quality review completed:`);
            console.log(`  - Auto-approved: ${autoApproved} items`);
            console.log(`  - Flagged for review: ${flaggedForReview} items`);
            
            // Notify if action taken
            if (autoApproved > 0 || flaggedForReview > 0) {
                this.notifyAdmins(
                    `📋 Quality review completed: ${autoApproved} auto-approved, ${flaggedForReview} flagged`
                );
            }
            
        } catch (error) {
            console.error('❌ Quality review failed:', error);
        }
    }

    /**
     * Run cleanup of old content
     */
    async runCleanup() {
        console.log('🧹 Running content cleanup...');
        
        try {
            const now = Date.now();
            const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
            let cleaned = 0;
            
            // Cleanup old rejected content
            const rejected = JSON.parse(localStorage.getItem('rejectedContent') || '[]');
            const recentRejected = rejected.filter(item => 
                new Date(item.rejectedDate).getTime() > thirtyDaysAgo
            );
            
            if (recentRejected.length !== rejected.length) {
                localStorage.setItem('rejectedContent', JSON.stringify(recentRejected));
                cleaned += rejected.length - recentRejected.length;
            }
            
            // Cleanup old discovery logs
            const logs = JSON.parse(localStorage.getItem('discoveryLogs') || '[]');
            const recentLogs = logs.filter(log => 
                new Date(log.timestamp).getTime() > thirtyDaysAgo
            ).slice(-100); // Keep max 100 recent logs
            
            if (recentLogs.length !== logs.length) {
                localStorage.setItem('discoveryLogs', JSON.stringify(recentLogs));
                cleaned += logs.length - recentLogs.length;
            }
            
            console.log(`✅ Cleanup completed: removed ${cleaned} old items`);
            
            if (cleaned > 0) {
                this.notifyAdmins(`🧹 Cleanup completed: removed ${cleaned} old items`);
            }
            
        } catch (error) {
            console.error('❌ Cleanup failed:', error);
        }
    }

    /**
     * Auto-approve high-quality content
     */
    async autoApproveContent(item) {
        // Move to approved content
        const approved = JSON.parse(localStorage.getItem('approvedContent') || '[]');
        approved.push({
            ...item,
            status: 'approved',
            approvedDate: new Date().toISOString(),
            approvedBy: 'auto-system',
            autoApprovalReason: 'High quality score and evidence-based'
        });
        localStorage.setItem('approvedContent', JSON.stringify(approved));
        
        // Remove from pending
        const pending = JSON.parse(localStorage.getItem('pendingContent') || '[]');
        const updatedPending = pending.filter(i => i.id !== item.id);
        localStorage.setItem('pendingContent', JSON.stringify(updatedPending));
        
        console.log(`✅ Auto-approved: ${item.title}`);
    }

    /**
     * Flag content for manual review
     */
    async flagForReview(item, reason) {
        // Update item with flag
        const pending = JSON.parse(localStorage.getItem('pendingContent') || '[]');
        const updatedPending = pending.map(i => 
            i.id === item.id ? { ...i, flagged: true, flagReason: reason } : i
        );
        localStorage.setItem('pendingContent', JSON.stringify(updatedPending));
        
        console.log(`🚩 Flagged for review: ${item.title} (${reason})`);
    }

    /**
     * Analyze discovered content for statistics
     */
    analyzeDiscoveredContent(content) {
        const stats = {
            total: content.length,
            byType: {},
            bySource: {},
            qualityDistribution: {
                high: 0,    // 0.8+
                medium: 0,  // 0.6-0.8
                low: 0      // < 0.6
            },
            averageScore: 0
        };
        
        let totalScore = 0;
        
        content.forEach(item => {
            // By type
            stats.byType[item.type] = (stats.byType[item.type] || 0) + 1;
            
            // By source
            stats.bySource[item.source] = (stats.bySource[item.source] || 0) + 1;
            
            // Quality distribution
            const score = item.relevanceScore || 0;
            totalScore += score;
            
            if (score >= 0.8) {
                stats.qualityDistribution.high++;
            } else if (score >= 0.6) {
                stats.qualityDistribution.medium++;
            } else {
                stats.qualityDistribution.low++;
            }
        });
        
        stats.averageScore = content.length > 0 ? (totalScore / content.length).toFixed(2) : 0;
        
        return stats;
    }

    /**
     * Log discovery results
     */
    logDiscoveryResults(result) {
        const logs = JSON.parse(localStorage.getItem('discoveryLogs') || '[]');
        logs.push(result);
        
        // Keep only last 50 logs
        if (logs.length > 50) {
            logs.splice(0, logs.length - 50);
        }
        
        localStorage.setItem('discoveryLogs', JSON.stringify(logs));
    }

    /**
     * Notify administrators
     */
    notifyAdmins(message) {
        console.log(`📢 Admin Notification: ${message}`);
        
        // Store notification for admin dashboard
        const notifications = JSON.parse(localStorage.getItem('adminNotifications') || '[]');
        notifications.push({
            id: Date.now().toString(),
            message: message,
            timestamp: new Date().toISOString(),
            read: false
        });
        
        // Keep only last 20 notifications
        if (notifications.length > 20) {
            notifications.splice(0, notifications.length - 20);
        }
        
        localStorage.setItem('adminNotifications', JSON.stringify(notifications));
    }

    /**
     * Load configuration from storage
     */
    loadConfiguration() {
        try {
            const stored = localStorage.getItem('automationConfig');
            if (stored) {
                const storedConfig = JSON.parse(stored);
                this.config = { ...this.config, ...storedConfig };
            }
        } catch (error) {
            console.error('Error loading automation config:', error);
        }
    }

    /**
     * Save configuration to storage
     */
    saveConfiguration() {
        try {
            localStorage.setItem('automationConfig', JSON.stringify(this.config));
        } catch (error) {
            console.error('Error saving automation config:', error);
        }
    }

    /**
     * Get scheduler status
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            activeTasks: Array.from(this.intervals.keys()),
            config: this.config,
            nextRuns: this.getNextRunTimes()
        };
    }

    /**
     * Calculate next run times for all tasks
     */
    getNextRunTimes() {
        const nextRuns = {};
        
        for (const [taskName, config] of Object.entries(this.config)) {
            if (config.enabled && config.lastRun) {
                const lastRun = new Date(config.lastRun).getTime();
                const nextRun = new Date(lastRun + config.interval);
                nextRuns[taskName] = nextRun.toISOString();
            }
        }
        
        return nextRuns;
    }

    /**
     * Format interval for human reading
     */
    formatInterval(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
        if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
        if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
        return `${seconds} second${seconds > 1 ? 's' : ''}`;
    }

    /**
     * Update task configuration
     */
    updateTaskConfig(taskName, newConfig) {
        if (this.config[taskName]) {
            this.config[taskName] = { ...this.config[taskName], ...newConfig };
            this.saveConfiguration();
            
            // Restart task if it was running
            if (this.intervals.has(taskName)) {
                this.scheduleTask(taskName, this.getTaskFunction(taskName));
            }
            
            console.log(`✅ Updated ${taskName} configuration`);
        }
    }

    /**
     * Get task function by name
     */
    getTaskFunction(taskName) {
        switch (taskName) {
            case 'contentDiscovery': return () => this.runContentDiscovery();
            case 'qualityReview': return () => this.runQualityReview();
            case 'cleanup': return () => this.runCleanup();
            default: return () => {};
        }
    }
}

// Auto-start scheduler if in browser environment
if (typeof window !== 'undefined') {
    window.AutomationScheduler = AutomationScheduler;
    
    // Auto-initialize when page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', async () => {
            try {
                window.automationScheduler = new AutomationScheduler();
                await window.automationScheduler.initialize();
            } catch (error) {
                console.error('Failed to auto-start automation scheduler:', error);
            }
        });
    }
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AutomationScheduler;
}