// AI/ML Modules for Enhanced Scanner
class AIPredictionEngine {
    constructor() {
        this.model = null;
        this.predictionCache = new Map();
        this.sentimentCache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    async initialize() {
        try {
            // Initialize TensorFlow.js model
            await this.loadLSTMModel();
            await this.loadSentimentModel();
            console.log('AI Engine initialized successfully');
            return true;
        } catch (error) {
            console.error('AI Engine initialization failed:', error);
            return false;
        }
    }

    async loadLSTMModel() {
        // Simulate LSTM model loading
        // In production, this would load a trained TensorFlow.js model
        this.model = {
            predict: async (data) => {
                // Simulate LSTM prediction
                const trend = Math.random() > 0.5 ? 1 : -1;
                const confidence = 0.6 + Math.random() * 0.3;
                return {
                    prediction: trend,
                    confidence: confidence,
                    priceTarget: data.currentPrice * (1 + trend * confidence * 0.05)
                };
            }
        };
    }

    async loadSentimentModel() {
        // Simulate sentiment analysis model
        this.sentimentModel = {
            analyze: async (text) => {
                // Simple sentiment analysis simulation
                const positiveWords = ['bullish', 'moon', 'pump', 'surge', 'rally', 'breakout'];
                const negativeWords = ['bearish', 'dump', 'crash', 'drop', 'decline', 'breakdown'];
                
                const words = text.toLowerCase().split(' ');
                let score = 0;
                
                words.forEach(word => {
                    if (positiveWords.includes(word)) score += 1;
                    if (negativeWords.includes(word)) score -= 1;
                });
                
                return {
                    sentiment: score > 0 ? 'positive' : score < 0 ? 'negative' : 'neutral',
                    confidence: Math.min(0.9, Math.abs(score) / 10 + 0.5)
                };
            }
        };
    }

    async predictPrice(symbol, timeframe = '5m', historicalData = null) {
        const cacheKey = `${symbol}_${timeframe}`;
        const cached = this.predictionCache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }

        try {
            let data = historicalData;
            if (!data) {
                data = await this.fetchKlineData(symbol, timeframe, 100);
            }

            if (data.length < 50) {
                return null;
            }

            // Prepare data for LSTM model
            const prices = data.map(d => parseFloat(d[4]));
            const volumes = data.map(d => parseFloat(d[5]));
            const features = this.prepareFeatures(prices, volumes);

            // Get LSTM prediction
            const lstmPrediction = await this.model.predict({
                features: features,
                currentPrice: prices[prices.length - 1]
            });

            // Get technical indicators
            const indicators = this.calculateTechnicalIndicators(prices, volumes);

            // Combine predictions
            const prediction = {
                symbol,
                timeframe,
                currentPrice: prices[prices.length - 1],
                predictedPrice: lstmPrediction.priceTarget,
                confidence: lstmPrediction.confidence,
                direction: lstmPrediction.prediction > 0 ? 'bullish' : 'bearish',
                indicators: indicators,
                timestamp: Date.now()
            };

            // Cache the result
            this.predictionCache.set(cacheKey, {
                data: prediction,
                timestamp: Date.now()
            });

            return prediction;
        } catch (error) {
            console.error(`AI prediction failed for ${symbol}:`, error);
            return null;
        }
    }

    prepareFeatures(prices, volumes) {
        // Prepare features for LSTM model
        const features = [];
        
        for (let i = 20; i < prices.length; i++) {
            const priceChange = (prices[i] - prices[i - 1]) / prices[i - 1];
            const volumeChange = volumes[i] > 0 ? (volumes[i] - volumes[i - 1]) / volumes[i - 1] : 0;
            const volatility = this.calculateVolatility(prices.slice(i - 20, i));
            
            features.push([priceChange, volumeChange, volatility]);
        }
        
        return features.slice(-50); // Last 50 data points
    }

    calculateVolatility(prices) {
        if (prices.length < 2) return 0;
        
        const returns = [];
        for (let i = 1; i < prices.length; i++) {
            returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
        }
        
        const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
        const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
        
        return Math.sqrt(variance);
    }

    calculateTechnicalIndicators(prices, volumes) {
        return {
            rsi: this.calculateRSI(prices),
            macd: this.calculateMACD(prices),
            bollinger: this.calculateBollingerBands(prices),
            volumeProfile: this.calculateVolumeProfile(volumes),
            momentum: this.calculateMomentum(prices)
        };
    }

    calculateRSI(prices, period = 14) {
        if (prices.length < period + 1) return 50;
        
        let gains = 0;
        let losses = 0;
        
        for (let i = 1; i <= period; i++) {
            const change = prices[i] - prices[i - 1];
            if (change > 0) gains += change;
            else losses -= change;
        }
        
        const avgGain = gains / period;
        const avgLoss = losses / period;
        const rs = avgGain / (avgLoss || 0.0001);
        return 100 - (100 / (1 + rs));
    }

    calculateMACD(prices, fastPeriod = 12, slowPeriod = 26) {
        if (prices.length < slowPeriod) return { macd: 0, signal: 0, histogram: 0 };
        
        const emaFast = this.calculateEMA(prices, fastPeriod);
        const emaSlow = this.calculateEMA(prices, slowPeriod);
        const macd = emaFast - emaSlow;
        
        return { macd, signal: macd * 0.9, histogram: macd * 0.1 };
    }

    calculateEMA(prices, period) {
        if (prices.length === 0) return 0;
        
        const multiplier = 2 / (period + 1);
        let ema = prices[0];
        
        for (let i = 1; i < prices.length; i++) {
            ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
        }
        
        return ema;
    }

    calculateBollingerBands(prices, period = 20, stdDev = 2) {
        if (prices.length < period) return { upper: 0, middle: 0, lower: 0 };
        
        const recentPrices = prices.slice(-period);
        const mean = recentPrices.reduce((a, b) => a + b, 0) / period;
        const variance = recentPrices.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / period;
        const std = Math.sqrt(variance);
        
        return {
            upper: mean + (std * stdDev),
            middle: mean,
            lower: mean - (std * stdDev)
        };
    }

    calculateVolumeProfile(volumes) {
        const recentVolumes = volumes.slice(-20);
        const avgVolume = recentVolumes.reduce((a, b) => a + b, 0) / recentVolumes.length;
        const maxVolume = Math.max(...recentVolumes);
        
        return {
            average: avgVolume,
            max: maxVolume,
            ratio: avgVolume / maxVolume
        };
    }

    calculateMomentum(prices, period = 10) {
        if (prices.length < period) return 0;
        
        const current = prices[prices.length - 1];
        const past = prices[prices.length - period];
        
        return (current - past) / past;
    }

    async analyzeMarketSentiment() {
        const cacheKey = 'market_sentiment';
        const cached = this.sentimentCache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }

        try {
            // Simulate fetching news and social media data
            const newsData = await this.fetchNewsData();
            const socialData = await this.fetchSocialData();
            
            // Analyze sentiment
            const newsSentiment = await this.sentimentModel.analyze(newsData);
            const socialSentiment = await this.sentimentModel.analyze(socialData);
            
            // Combine sentiments
            const overallSentiment = this.combineSentiments(newsSentiment, socialSentiment);
            
            const result = {
                overall: overallSentiment.sentiment,
                confidence: overallSentiment.confidence,
                news: newsSentiment,
                social: socialSentiment,
                factors: this.extractKeyFactors(newsData, socialData),
                timestamp: Date.now()
            };

            this.sentimentCache.set(cacheKey, {
                data: result,
                timestamp: Date.now()
            });

            return result;
        } catch (error) {
            console.error('Sentiment analysis failed:', error);
            return {
                overall: 'neutral',
                confidence: 0.5,
                factors: ['Analysis unavailable']
            };
        }
    }

    async fetchNewsData() {
        // Simulate news data fetching
        const newsKeywords = ['cryptocurrency', 'bitcoin', 'ethereum', 'trading', 'market'];
        const sentimentWords = ['bullish', 'bearish', 'rally', 'crash', 'surge', 'decline'];
        
        return newsKeywords.map(keyword => 
            sentimentWords[Math.floor(Math.random() * sentimentWords.length)] + ' ' + keyword
        ).join(' ');
    }

    async fetchSocialData() {
        // Simulate social media data fetching
        const socialKeywords = ['moon', 'pump', 'dump', 'hodl', 'diamond hands'];
        const sentimentWords = ['bullish', 'bearish', 'excited', 'worried', 'optimistic'];
        
        return socialKeywords.map(keyword => 
            sentimentWords[Math.floor(Math.random() * sentimentWords.length)] + ' ' + keyword
        ).join(' ');
    }

    combineSentiments(newsSentiment, socialSentiment) {
        const newsWeight = 0.6;
        const socialWeight = 0.4;
        
        const newsScore = newsSentiment.sentiment === 'positive' ? 1 : newsSentiment.sentiment === 'negative' ? -1 : 0;
        const socialScore = socialSentiment.sentiment === 'positive' ? 1 : socialSentiment.sentiment === 'negative' ? -1 : 0;
        
        const combinedScore = (newsScore * newsWeight) + (socialScore * socialWeight);
        const combinedConfidence = (newsSentiment.confidence * newsWeight) + (socialSentiment.confidence * socialWeight);
        
        let sentiment = 'neutral';
        if (combinedScore > 0.2) sentiment = 'positive';
        else if (combinedScore < -0.2) sentiment = 'negative';
        
        return {
            sentiment,
            confidence: Math.min(0.95, combinedConfidence)
        };
    }

    extractKeyFactors(newsData, socialData) {
        const factors = [];
        
        if (newsData.includes('bullish') || socialData.includes('moon')) {
            factors.push('Positive market sentiment');
        }
        if (newsData.includes('bearish') || socialData.includes('dump')) {
            factors.push('Negative market sentiment');
        }
        if (newsData.includes('rally') || socialData.includes('pump')) {
            factors.push('Strong upward momentum');
        }
        if (newsData.includes('crash') || socialData.includes('decline')) {
            factors.push('Downward pressure');
        }
        
        return factors.length > 0 ? factors : ['Market sentiment neutral'];
    }

    async fetchKlineData(symbol, interval, limit) {
        try {
            const response = await fetch(`https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`);
            if (!response.ok) throw new Error(`API request failed: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error(`Failed to fetch ${symbol} ${interval} data:`, error);
            return [];
        }
    }
}

// Risk Management Module
class RiskManager {
    constructor() {
        this.riskProfiles = {
            conservative: { maxRisk: 0.02, stopLoss: 0.015, takeProfit: 0.03 },
            moderate: { maxRisk: 0.05, stopLoss: 0.03, takeProfit: 0.06 },
            aggressive: { maxRisk: 0.10, stopLoss: 0.05, takeProfit: 0.10 }
        };
    }

    calculatePositionSize(accountBalance, riskProfile, entryPrice, stopLossPrice) {
        const profile = this.riskProfiles[riskProfile];
        const riskAmount = accountBalance * profile.maxRisk;
        const priceRisk = Math.abs(entryPrice - stopLossPrice) / entryPrice;
        
        if (priceRisk === 0) return 0;
        
        const positionSize = riskAmount / (priceRisk * entryPrice);
        return Math.floor(positionSize);
    }

    calculateStopLoss(entryPrice, direction, riskProfile) {
        const profile = this.riskProfiles[riskProfile];
        const stopLossPercent = profile.stopLoss;
        
        if (direction === 'long') {
            return entryPrice * (1 - stopLossPercent);
        } else {
            return entryPrice * (1 + stopLossPercent);
        }
    }

    calculateTakeProfit(entryPrice, direction, riskProfile) {
        const profile = this.riskProfiles[riskProfile];
        const takeProfitPercent = profile.takeProfit;
        
        if (direction === 'long') {
            return entryPrice * (1 + takeProfitPercent);
        } else {
            return entryPrice * (1 - takeProfitPercent);
        }
    }

    assessRiskLevel(symbol, indicators, aiPrediction) {
        let riskScore = 0;
        let riskFactors = [];
        
        // RSI risk
        if (indicators.rsi > 80) {
            riskScore += 30;
            riskFactors.push('Overbought RSI');
        } else if (indicators.rsi < 20) {
            riskScore += 20;
            riskFactors.push('Oversold RSI');
        }
        
        // MACD risk
        if (Math.abs(indicators.macd.macd - indicators.macd.signal) < 0.1) {
            riskScore += 25;
            riskFactors.push('MACD convergence');
        }
        
        // Bollinger Bands risk
        const currentPrice = aiPrediction?.currentPrice || 0;
        if (currentPrice > indicators.bollinger.upper) {
            riskScore += 20;
            riskFactors.push('Price above upper Bollinger Band');
        } else if (currentPrice < indicators.bollinger.lower) {
            riskScore += 15;
            riskFactors.push('Price below lower Bollinger Band');
        }
        
        // AI confidence risk
        if (aiPrediction && aiPrediction.confidence < 50) {
            riskScore += 35;
            riskFactors.push('Low AI confidence');
        }
        
        // Volume risk
        if (indicators.volumeProfile.ratio < 0.5) {
            riskScore += 15;
            riskFactors.push('Low volume activity');
        }
        
        let riskLevel = 'low';
        if (riskScore > 60) riskLevel = 'high';
        else if (riskScore > 30) riskLevel = 'medium';
        
        return {
            level: riskLevel,
            score: riskScore,
            factors: riskFactors
        };
    }
}

// Portfolio Tracking Module
class PortfolioTracker {
    constructor() {
        this.positions = new Map();
        this.trades = [];
        this.performance = {
            totalPnl: 0,
            winRate: 0,
            bestTrade: null,
            worstTrade: null,
            totalTrades: 0
        };
    }

    addPosition(symbol, entryPrice, quantity, direction, timestamp = Date.now()) {
        const position = {
            symbol,
            entryPrice,
            quantity,
            direction,
            timestamp,
            status: 'open'
        };
        
        this.positions.set(symbol, position);
        return position;
    }

    closePosition(symbol, exitPrice, timestamp = Date.now()) {
        const position = this.positions.get(symbol);
        if (!position) return null;
        
        const pnl = this.calculatePnL(position, exitPrice);
        const trade = {
            ...position,
            exitPrice,
            pnl,
            timestamp,
            status: 'closed'
        };
        
        this.trades.push(trade);
        this.positions.delete(symbol);
        this.updatePerformance();
        
        return trade;
    }

    calculatePnL(position, currentPrice) {
        const { entryPrice, quantity, direction } = position;
        
        if (direction === 'long') {
            return (currentPrice - entryPrice) * quantity;
        } else {
            return (entryPrice - currentPrice) * quantity;
        }
    }

    updatePerformance() {
        if (this.trades.length === 0) return;
        
        const closedTrades = this.trades.filter(t => t.status === 'closed');
        this.performance.totalTrades = closedTrades.length;
        
        if (closedTrades.length === 0) return;
        
        this.performance.totalPnl = closedTrades.reduce((sum, trade) => sum + trade.pnl, 0);
        
        const winningTrades = closedTrades.filter(t => t.pnl > 0);
        this.performance.winRate = (winningTrades.length / closedTrades.length) * 100;
        
        this.performance.bestTrade = closedTrades.reduce((best, trade) => 
            trade.pnl > best.pnl ? trade : best
        );
        
        this.performance.worstTrade = closedTrades.reduce((worst, trade) => 
            trade.pnl < worst.pnl ? trade : worst
        );
    }

    getPortfolioSummary() {
        const openPositions = Array.from(this.positions.values());
        const totalValue = openPositions.reduce((sum, pos) => 
            sum + (pos.entryPrice * pos.quantity), 0
        );
        
        return {
            ...this.performance,
            openPositions: openPositions.length,
            totalValue,
            positions: openPositions
        };
    }
}

// Alert System Module
class AlertSystem {
    constructor() {
        this.alerts = [];
        this.notificationPermission = null;
        this.websocket = null;
    }

    async initialize() {
        // Request notification permission
        if ('Notification' in window) {
            this.notificationPermission = await Notification.requestPermission();
        }
        
        // Initialize WebSocket for real-time updates
        this.initializeWebSocket();
    }

    initializeWebSocket() {
        try {
            // In production, this would connect to a real WebSocket server
            console.log('WebSocket connection initialized');
        } catch (error) {
            console.error('WebSocket initialization failed:', error);
        }
    }

    createAlert(symbol, condition, threshold, callback) {
        const alert = {
            id: Date.now(),
            symbol,
            condition,
            threshold,
            callback,
            active: true,
            created: Date.now()
        };
        
        this.alerts.push(alert);
        return alert;
    }

    checkAlerts(symbol, currentData) {
        const symbolAlerts = this.alerts.filter(a => a.symbol === symbol && a.active);
        
        symbolAlerts.forEach(alert => {
            if (this.evaluateCondition(alert, currentData)) {
                this.triggerAlert(alert, currentData);
            }
        });
    }

    evaluateCondition(alert, data) {
        const { condition, threshold } = alert;
        
        switch (condition) {
            case 'price_above':
                return data.price > threshold;
            case 'price_below':
                return data.price < threshold;
            case 'score_above':
                return data.score > threshold;
            case 'score_below':
                return data.score < threshold;
            case 'rsi_above':
                return data.rsi > threshold;
            case 'rsi_below':
                return data.rsi < threshold;
            default:
                return false;
        }
    }

    triggerAlert(alert, data) {
        // Show browser notification
        if (this.notificationPermission === 'granted') {
            new Notification(`Alert: ${alert.symbol}`, {
                body: `${alert.condition} threshold reached`,
                icon: '/favicon.ico'
            });
        }
        
        // Execute callback
        if (alert.callback) {
            alert.callback(alert, data);
        }
        
        // Deactivate alert
        alert.active = false;
    }

    removeAlert(alertId) {
        const index = this.alerts.findIndex(a => a.id === alertId);
        if (index > -1) {
            this.alerts.splice(index, 1);
        }
    }
}

// Export modules
window.AIPredictionEngine = AIPredictionEngine;
window.RiskManager = RiskManager;
window.PortfolioTracker = PortfolioTracker;
window.AlertSystem = AlertSystem;