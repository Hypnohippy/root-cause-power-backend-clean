/**
 * Root Cause Power - Automated Content Aggregation System
 * Automatically discovers and curates latest PTSD/trauma research and resources
 */

class ContentAggregator {
    constructor() {
        this.sources = {
            pubmed: {
                baseUrl: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/',
                searchTerms: ['PTSD', 'trauma therapy', 'EMDR', 'trauma recovery', 'post traumatic stress'],
                enabled: true
            },
            youtube: {
                baseUrl: 'https://www.googleapis.com/youtube/v3/',
                channels: [
                    'UC-trauma-therapy',  // Replace with real trauma therapy channels
                    'UC-ptsd-research',
                    'UC-mental-health-education'
                ],
                searchTerms: ['PTSD therapy', 'trauma recovery', 'EMDR therapy', 'trauma healing'],
                enabled: true
            },
            rssFeed: {
                sources: [
                    'https://www.nimh.nih.gov/news/rss.xml',
                    'https://www.apa.org/news/rss/ptsd.xml',
                    'https://www.ptsd.va.gov/news/rss.xml'
                ],
                enabled: true
            }
        };
        
        this.contentTypes = {
            RESEARCH_PAPER: 'research_paper',
            VIDEO: 'video', 
            ARTICLE: 'article',
            TREATMENT_UPDATE: 'treatment_update',
            RESOURCE: 'resource'
        };
        
        this.qualityThreshold = 0.7; // AI relevance score threshold
    }

    /**
     * Main aggregation function - runs daily
     */
    async aggregateContent() {
        console.log('🔍 Starting automated content discovery...');
        
        const discoveredContent = [];
        
        try {
            // Aggregate from all enabled sources
            if (this.sources.pubmed.enabled) {
                const pubmedContent = await this.aggregateFromPubMed();
                discoveredContent.push(...pubmedContent);
            }
            
            if (this.sources.youtube.enabled) {
                const youtubeContent = await this.aggregateFromYouTube();
                discoveredContent.push(...youtubeContent);
            }
            
            if (this.sources.rssFeed.enabled) {
                const rssContent = await this.aggregateFromRSSFeeds();
                discoveredContent.push(...rssContent);
            }
            
            // Score and filter content
            const scoredContent = await this.scoreContentRelevance(discoveredContent);
            const qualityContent = scoredContent.filter(item => item.relevanceScore >= this.qualityThreshold);
            
            // Save to pending review
            await this.saveToPendingReview(qualityContent);
            
            console.log(`✅ Discovered ${qualityContent.length} high-quality content items`);
            return qualityContent;
            
        } catch (error) {
            console.error('❌ Content aggregation error:', error);
            throw error;
        }
    }

    /**
     * Aggregate latest research from PubMed
     */
    async aggregateFromPubMed() {
        console.log('📚 Searching PubMed for latest research...');
        
        const content = [];
        
        for (const searchTerm of this.sources.pubmed.searchTerms) {
            try {
                // Search for articles published in last 30 days
                const searchUrl = `${this.sources.pubmed.baseUrl}esearch.fcgi?` +
                    `db=pubmed&term=${encodeURIComponent(searchTerm)}&` +
                    `reldate=30&datetype=pdat&retmax=10&retmode=json`;
                
                const response = await fetch(searchUrl);
                const searchData = await response.json();
                
                if (searchData.esearchresult?.idlist) {
                    // Get article details
                    const detailsUrl = `${this.sources.pubmed.baseUrl}esummary.fcgi?` +
                        `db=pubmed&id=${searchData.esearchresult.idlist.join(',')}&retmode=json`;
                    
                    const detailsResponse = await fetch(detailsUrl);
                    const detailsData = await detailsResponse.json();
                    
                    // Process articles
                    for (const [id, article] of Object.entries(detailsData.result)) {
                        if (id === 'uids') continue;
                        
                        content.push({
                            id: `pubmed_${id}`,
                            type: this.contentTypes.RESEARCH_PAPER,
                            title: article.title,
                            abstract: article.abstract || '',
                            authors: article.authors?.map(a => a.name).join(', ') || '',
                            publishDate: article.pubdate,
                            source: 'PubMed',
                            url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
                            searchTerm: searchTerm,
                            discovered: new Date().toISOString()
                        });
                    }
                }
                
                // Rate limiting
                await new Promise(resolve => setTimeout(resolve, 1000));
                
            } catch (error) {
                console.error(`Error searching PubMed for "${searchTerm}":`, error);
            }
        }
        
        console.log(`📄 Found ${content.length} research papers`);
        return content;
    }

    /**
     * Aggregate educational videos from YouTube
     */
    async aggregateFromYouTube() {
        console.log('🎥 Searching YouTube for educational content...');
        
        if (!process.env.YOUTUBE_API_KEY) {
            console.warn('⚠️ YouTube API key not configured');
            return [];
        }
        
        const content = [];
        
        for (const searchTerm of this.sources.youtube.searchTerms) {
            try {
                const searchUrl = `${this.sources.youtube.baseUrl}search?` +
                    `part=snippet&q=${encodeURIComponent(searchTerm)}&` +
                    `type=video&order=date&publishedAfter=${this.getLastWeekISO()}&` +
                    `maxResults=10&key=${process.env.YOUTUBE_API_KEY}`;
                
                const response = await fetch(searchUrl);
                const data = await response.json();
                
                if (data.items) {
                    for (const video of data.items) {
                        content.push({
                            id: `youtube_${video.id.videoId}`,
                            type: this.contentTypes.VIDEO,
                            title: video.snippet.title,
                            description: video.snippet.description,
                            channelTitle: video.snippet.channelTitle,
                            publishDate: video.snippet.publishedAt,
                            source: 'YouTube',
                            url: `https://www.youtube.com/watch?v=${video.id.videoId}`,
                            thumbnail: video.snippet.thumbnails?.medium?.url,
                            searchTerm: searchTerm,
                            discovered: new Date().toISOString()
                        });
                    }
                }
                
                // Rate limiting
                await new Promise(resolve => setTimeout(resolve, 1000));
                
            } catch (error) {
                console.error(`Error searching YouTube for "${searchTerm}":`, error);
            }
        }
        
        console.log(`🎬 Found ${content.length} videos`);
        return content;
    }

    /**
     * Aggregate from RSS feeds
     */
    async aggregateFromRSSFeeds() {
        console.log('📰 Checking RSS feeds for updates...');
        
        const content = [];
        
        for (const feedUrl of this.sources.rssFeed.sources) {
            try {
                // Note: In production, you'd use a proper RSS parser
                // For now, we'll create a placeholder structure
                const response = await fetch(feedUrl);
                const feedText = await response.text();
                
                // Simple RSS parsing (in production, use xml2js or similar)
                const items = this.parseRSSItems(feedText);
                
                for (const item of items) {
                    content.push({
                        id: `rss_${this.generateId(item.link)}`,
                        type: this.contentTypes.ARTICLE,
                        title: item.title,
                        description: item.description,
                        publishDate: item.pubDate,
                        source: feedUrl,
                        url: item.link,
                        discovered: new Date().toISOString()
                    });
                }
                
            } catch (error) {
                console.error(`Error parsing RSS feed ${feedUrl}:`, error);
            }
        }
        
        console.log(`📋 Found ${content.length} RSS articles`);
        return content;
    }

    /**
     * Score content relevance using AI
     */
    async scoreContentRelevance(contentItems) {
        console.log('🤖 Scoring content relevance with AI...');
        
        const scoredContent = [];
        
        for (const item of contentItems) {
            try {
                const relevanceScore = await this.calculateRelevanceScore(item);
                scoredContent.push({
                    ...item,
                    relevanceScore,
                    aiAnalysis: {
                        isTraumaRelated: relevanceScore > 0.5,
                        isEvidenceBased: this.checkEvidenceQuality(item),
                        targetAudience: this.identifyAudience(item),
                        suggestedCategory: this.suggestCategory(item)
                    }
                });
                
            } catch (error) {
                console.error('Error scoring content:', error);
                scoredContent.push({
                    ...item,
                    relevanceScore: 0.3, // Default low score if AI fails
                    aiAnalysis: null
                });
            }
        }
        
        return scoredContent.sort((a, b) => b.relevanceScore - a.relevanceScore);
    }

    /**
     * Calculate AI-powered relevance score
     */
    async calculateRelevanceScore(item) {
        // Use Groq to analyze content relevance
        const prompt = `
        As a PTSD and trauma therapy expert, rate the relevance of this content for trauma survivors and mental health professionals on a scale of 0.0 to 1.0:

        Title: ${item.title}
        Description: ${item.description || item.abstract || ''}
        Source: ${item.source}
        Type: ${item.type}

        Consider:
        - Scientific accuracy and evidence base
        - Relevance to PTSD/trauma recovery
        - Potential helpfulness for trauma survivors
        - Professional credibility
        - Practical applicability

        Return ONLY a decimal number between 0.0 and 1.0 (e.g., 0.87)
        `;

        try {
            const response = await fetch('/api/groq/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: prompt,
                    maxTokens: 10
                })
            });

            const data = await response.json();
            const score = parseFloat(data.response?.trim()) || 0.3;
            return Math.min(Math.max(score, 0.0), 1.0); // Clamp between 0-1
            
        } catch (error) {
            console.error('Error calculating relevance score:', error);
            return 0.3; // Default score
        }
    }

    /**
     * Save content to pending review database
     */
    async saveToPendingReview(contentItems) {
        console.log('💾 Saving content for admin review...');
        
        for (const item of contentItems) {
            try {
                // Save to your database/file system
                // For now, we'll use localStorage as a simple storage
                const existingContent = JSON.parse(localStorage.getItem('pendingContent') || '[]');
                
                // Check for duplicates
                const isDuplicate = existingContent.some(existing => existing.id === item.id);
                if (!isDuplicate) {
                    existingContent.push({
                        ...item,
                        status: 'pending',
                        addedToReview: new Date().toISOString()
                    });
                    
                    localStorage.setItem('pendingContent', JSON.stringify(existingContent));
                }
                
            } catch (error) {
                console.error('Error saving content:', error);
            }
        }
    }

    // Utility functions
    getLastWeekISO() {
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        return lastWeek.toISOString();
    }

    generateId(text) {
        return text.toLowerCase()
            .replace(/[^a-z0-9]/g, '')
            .substring(0, 20) + '_' + Date.now();
    }

    parseRSSItems(rssText) {
        // Simple RSS parser - in production use proper XML parser
        const items = [];
        const itemMatches = rssText.match(/<item>(.*?)<\/item>/gs) || [];
        
        for (const itemMatch of itemMatches.slice(0, 10)) { // Limit to 10 items
            const title = (itemMatch.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || 
                         itemMatch.match(/<title>(.*?)<\/title>/))?.[1] || '';
            const link = itemMatch.match(/<link>(.*?)<\/link>/)?.[1] || '';
            const description = (itemMatch.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) ||
                               itemMatch.match(/<description>(.*?)<\/description>/))?.[1] || '';
            const pubDate = itemMatch.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || '';
            
            if (title && link) {
                items.push({ title, link, description, pubDate });
            }
        }
        
        return items;
    }

    checkEvidenceQuality(item) {
        const evidenceKeywords = ['study', 'research', 'clinical trial', 'peer-reviewed', 'meta-analysis'];
        const text = (item.title + ' ' + (item.description || item.abstract || '')).toLowerCase();
        return evidenceKeywords.some(keyword => text.includes(keyword));
    }

    identifyAudience(item) {
        const text = (item.title + ' ' + (item.description || '')).toLowerCase();
        if (text.includes('professional') || text.includes('clinician')) return 'professionals';
        if (text.includes('survivor') || text.includes('patient')) return 'survivors';
        return 'general';
    }

    suggestCategory(item) {
        const text = (item.title + ' ' + (item.description || '')).toLowerCase();
        if (text.includes('emdr')) return 'emdr';
        if (text.includes('therapy') || text.includes('treatment')) return 'therapy';
        if (text.includes('research')) return 'research';
        if (text.includes('support') || text.includes('community')) return 'support';
        return 'general';
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ContentAggregator;
} else if (typeof window !== 'undefined') {
    window.ContentAggregator = ContentAggregator;
}