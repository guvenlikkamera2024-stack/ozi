// Advanced Signal Analysis System
class SignalAnalyzer {
    constructor() {
        this.signalHistory = new Map();
        this.activeSignals = new Map();
        this.signalPerformance = new Map();
        this.volumeThresholds = {
            low: 0.5,
            medium: 1.0,
            high: 2.0
        };
    }

    // Analyze signal timing and quality
    async analyzeSignalTiming(symbol, timeframe = '5m') {
        try {
            const data = await this.getKlineData(symbol, timeframe, 200);
            if (data.length < 50) return null;

            const analysis = {
                symbol,
                timeframe,
                timestamp: Date.now(),
                preSignal: await this.analyzePreSignal(data),
                currentSignal: await this.analyzeCurrentSignal(data),
                postSignal: await this.analyzePostSignal(data),
                signalQuality: 0,
                confidence: 0,
                duration: 0,
                isNewSignal: false,
                isStrongSignal: false,
                recommendations: []
            };

            // Calculate overall signal quality
            analysis.signalQuality = this.calculateSignalQuality(analysis);
            analysis.confidence = this.calculateConfidence(analysis);
            analysis.isNewSignal = this.isNewSignal(symbol, analysis);
            analysis.isStrongSignal = analysis.signalQuality > 75;
            analysis.recommendations = this.generateRecommendations(analysis);

            // Store signal history
            this.storeSignalHistory(symbol, analysis);

            return analysis;
        } catch (error) {
            console.error(`Signal analysis failed for ${symbol}:`, error);
            return null;
        }
    }

    // Analyze pre-signal conditions
    async analyzePreSignal(data) {
        const preData = data.slice(-50, -10); // 10-50 periods before
        if (preData.length < 20) return null;

        const prices = preData.map(d => parseFloat(d[4]));
        const volumes = preData.map(d => parseFloat(d[5]));
        const highs = preData.map(d => parseFloat(d[2]));
        const lows = preData.map(d => parseFloat(d[3]));

        return {
            priceChange: this.calculatePriceChange(prices),
            volumeChange: this.calculateVolumeChange(volumes),
            volatility: this.calculateVolatility(prices),
            momentum: this.calculateMomentum(prices),
            rsi: this.calculateRSI(prices),
            macd: this.calculateMACD(prices),
            bollingerPosition: this.calculateBollingerPosition(prices),
            volumeProfile: this.calculateVolumeProfile(volumes),
            trend: this.calculateTrend(prices),
            supportResistance: this.calculateSupportResistance(highs, lows, prices)
        };
    }

    // Analyze current signal moment
    async analyzeCurrentSignal(data) {
        const currentData = data.slice(-10); // Last 10 periods
        if (currentData.length < 5) return null;

        const prices = currentData.map(d => parseFloat(d[4]));
        const volumes = currentData.map(d => parseFloat(d[5]));
        const highs = currentData.map(d => parseFloat(d[2]));
        const lows = currentData.map(d => parseFloat(d[3]));

        const currentPrice = prices[prices.length - 1];
        const previousPrice = prices[prices.length - 2];

        return {
            priceChange: ((currentPrice - previousPrice) / previousPrice) * 100,
            volumeChange: this.calculateVolumeChange(volumes),
            volatility: this.calculateVolatility(prices),
            momentum: this.calculateMomentum(prices),
            rsi: this.calculateRSI(prices),
            macd: this.calculateMACD(prices),
            bollingerPosition: this.calculateBollingerPosition(prices),
            volumeProfile: this.calculateVolumeProfile(volumes),
            trend: this.calculateTrend(prices),
            signalStrength: this.calculateSignalStrength(prices, volumes),
            breakout: this.detectBreakout(prices, highs, lows),
            volumeSpike: this.detectVolumeSpike(volumes),
            priceAction: this.analyzePriceAction(currentData)
        };
    }

    // Analyze post-signal conditions
    async analyzePostSignal(data) {
        const postData = data.slice(-5); // Last 5 periods
        if (postData.length < 3) return null;

        const prices = postData.map(d => parseFloat(d[4]));
        const volumes = postData.map(d => parseFloat(d[5]));

        return {
            priceChange: this.calculatePriceChange(prices),
            volumeChange: this.calculateVolumeChange(volumes),
            volatility: this.calculateVolatility(prices),
            momentum: this.calculateMomentum(prices),
            signalContinuation: this.calculateSignalContinuation(prices),
            profitLoss: this.calculateProfitLoss(prices),
            trendReversal: this.detectTrendReversal(prices),
            volumeConfirmation: this.analyzeVolumeConfirmation(volumes)
        };
    }

    // Calculate signal quality score
    calculateSignalQuality(analysis) {
        let score = 0;
        let factors = 0;

        // Pre-signal factors (30%)
        if (analysis.preSignal) {
            const preScore = this.evaluatePreSignal(analysis.preSignal);
            score += preScore * 0.3;
            factors += 0.3;
        }

        // Current signal factors (50%)
        if (analysis.currentSignal) {
            const currentScore = this.evaluateCurrentSignal(analysis.currentSignal);
            score += currentScore * 0.5;
            factors += 0.5;
        }

        // Post-signal factors (20%)
        if (analysis.postSignal) {
            const postScore = this.evaluatePostSignal(analysis.postSignal);
            score += postScore * 0.2;
            factors += 0.2;
        }

        return factors > 0 ? Math.min(100, score / factors) : 0;
    }

    // Evaluate pre-signal conditions
    evaluatePreSignal(preSignal) {
        let score = 50;

        // Volume analysis
        if (preSignal.volumeChange > 0.5) score += 10;
        if (preSignal.volumeProfile.ratio > 0.7) score += 5;

        // Momentum analysis
        if (Math.abs(preSignal.momentum) > 0.02) score += 10;
        if (preSignal.rsi > 30 && preSignal.rsi < 70) score += 5;

        // Volatility analysis
        if (preSignal.volatility > 0.01) score += 5;

        // Trend analysis
        if (preSignal.trend.strength > 0.6) score += 10;

        return Math.min(100, score);
    }

    // Evaluate current signal
    evaluateCurrentSignal(currentSignal) {
        let score = 50;

        // Price action
        if (Math.abs(currentSignal.priceChange) > 1) score += 15;
        if (currentSignal.breakout) score += 20;
        if (currentSignal.volumeSpike) score += 15;

        // Technical indicators
        if (currentSignal.rsi > 60 || currentSignal.rsi < 40) score += 10;
        if (currentSignal.macd.histogram > 0) score += 10;

        // Volume confirmation
        if (currentSignal.volumeConfirmation) score += 15;

        // Signal strength
        score += currentSignal.signalStrength * 10;

        return Math.min(100, score);
    }

    // Evaluate post-signal
    evaluatePostSignal(postSignal) {
        let score = 50;

        // Signal continuation
        if (postSignal.signalContinuation > 0.7) score += 20;
        if (postSignal.profitLoss > 0) score += 15;

        // Volume confirmation
        if (postSignal.volumeConfirmation) score += 10;

        // Trend reversal detection
        if (!postSignal.trendReversal) score += 15;

        return Math.min(100, score);
    }

    // Calculate confidence level
    calculateConfidence(analysis) {
        let confidence = 0;
        let factors = 0;

        // Volume consistency
        if (analysis.preSignal && analysis.currentSignal) {
            const volumeConsistency = this.calculateVolumeConsistency(
                analysis.preSignal.volumeChange,
                analysis.currentSignal.volumeChange
            );
            confidence += volumeConsistency * 0.3;
            factors += 0.3;
        }

        // Technical indicator alignment
        if (analysis.currentSignal) {
            const indicatorAlignment = this.calculateIndicatorAlignment(analysis.currentSignal);
            confidence += indicatorAlignment * 0.4;
            factors += 0.4;
        }

        // Market conditions
        const marketConditions = this.analyzeMarketConditions(analysis);
        confidence += marketConditions * 0.3;
        factors += 0.3;

        return factors > 0 ? Math.min(1, confidence / factors) : 0;
    }

    // Generate trading recommendations
    generateRecommendations(analysis) {
        const recommendations = [];

        // Entry recommendations
        if (analysis.isStrongSignal && analysis.confidence > 0.7) {
            recommendations.push({
                type: 'ENTRY',
                action: analysis.currentSignal.priceChange > 0 ? 'BUY' : 'SELL',
                confidence: analysis.confidence,
                reason: 'Strong signal with high confidence',
                riskLevel: this.calculateRiskLevel(analysis)
            });
        }

        // Exit recommendations
        if (analysis.postSignal && analysis.postSignal.trendReversal) {
            recommendations.push({
                type: 'EXIT',
                action: 'CLOSE',
                confidence: 0.8,
                reason: 'Trend reversal detected',
                riskLevel: 'HIGH'
            });
        }

        // Risk management
        if (analysis.signalQuality < 50) {
            recommendations.push({
                type: 'RISK',
                action: 'AVOID',
                confidence: 0.9,
                reason: 'Low signal quality',
                riskLevel: 'HIGH'
            });
        }

        return recommendations;
    }

    // Technical indicator calculations
    calculatePriceChange(prices) {
        if (prices.length < 2) return 0;
        const first = prices[0];
        const last = prices[prices.length - 1];
        return ((last - first) / first) * 100;
    }

    calculateVolumeChange(volumes) {
        if (volumes.length < 2) return 0;
        const first = volumes[0];
        const last = volumes[volumes.length - 1];
        return ((last - first) / first) * 100;
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

    calculateMomentum(prices, period = 14) {
        if (prices.length < period) return 0;
        const current = prices[prices.length - 1];
        const past = prices[prices.length - period];
        return (current - past) / past;
    }

    calculateRSI(prices, period = 14) {
        if (prices.length < period + 1) return 50;
        let gains = 0, losses = 0;
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

    calculateBollingerPosition(prices, period = 20, stdDev = 2) {
        if (prices.length < period) return 0;
        const recentPrices = prices.slice(-period);
        const mean = recentPrices.reduce((a, b) => a + b, 0) / period;
        const variance = recentPrices.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / period;
        const std = Math.sqrt(variance);
        const currentPrice = prices[prices.length - 1];
        const upper = mean + (std * stdDev);
        const lower = mean - (std * stdDev);
        return (currentPrice - lower) / (upper - lower);
    }

    calculateVolumeProfile(volumes) {
        const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
        const maxVolume = Math.max(...volumes);
        const minVolume = Math.min(...volumes);
        return {
            average: avgVolume,
            max: maxVolume,
            min: minVolume,
            ratio: avgVolume / maxVolume,
            spike: maxVolume / avgVolume
        };
    }

    calculateTrend(prices) {
        if (prices.length < 10) return { direction: 'NEUTRAL', strength: 0 };
        
        const first = prices[0];
        const last = prices[prices.length - 1];
        const change = (last - first) / first;
        
        let direction = 'NEUTRAL';
        if (change > 0.02) direction = 'UP';
        else if (change < -0.02) direction = 'DOWN';
        
        const strength = Math.min(1, Math.abs(change) * 10);
        
        return { direction, strength };
    }

    calculateSupportResistance(highs, lows, prices) {
        const currentPrice = prices[prices.length - 1];
        const resistance = Math.max(...highs);
        const support = Math.min(...lows);
        
        return {
            support,
            resistance,
            currentPrice,
            supportDistance: (currentPrice - support) / support,
            resistanceDistance: (resistance - currentPrice) / currentPrice
        };
    }

    calculateSignalStrength(prices, volumes) {
        const priceMomentum = this.calculateMomentum(prices);
        const volumeMomentum = this.calculateMomentum(volumes);
        return Math.min(1, (Math.abs(priceMomentum) + Math.abs(volumeMomentum)) / 2);
    }

    detectBreakout(prices, highs, lows) {
        const currentPrice = prices[prices.length - 1];
        const recentHigh = Math.max(...highs.slice(-5));
        const recentLow = Math.min(...lows.slice(-5));
        
        return currentPrice > recentHigh || currentPrice < recentLow;
    }

    detectVolumeSpike(volumes) {
        const avgVolume = volumes.slice(0, -1).reduce((a, b) => a + b, 0) / (volumes.length - 1);
        const currentVolume = volumes[volumes.length - 1];
        return currentVolume > avgVolume * 2;
    }

    analyzePriceAction(candles) {
        const lastCandle = candles[candles.length - 1];
        const open = parseFloat(lastCandle[1]);
        const high = parseFloat(lastCandle[2]);
        const low = parseFloat(lastCandle[3]);
        const close = parseFloat(lastCandle[4]);
        
        const bodySize = Math.abs(close - open);
        const upperShadow = high - Math.max(open, close);
        const lowerShadow = Math.min(open, close) - low;
        const totalRange = high - low;
        
        return {
            bodySize: bodySize / totalRange,
            upperShadow: upperShadow / totalRange,
            lowerShadow: lowerShadow / totalRange,
            isBullish: close > open,
            isBearish: close < open,
            isDoji: bodySize < 0.1,
            isHammer: lowerShadow > bodySize * 2,
            isShootingStar: upperShadow > bodySize * 2
        };
    }

    calculateSignalContinuation(prices) {
        if (prices.length < 3) return 0;
        const recent = prices.slice(-3);
        const trend = recent[2] - recent[0];
        const momentum = recent[1] - recent[0];
        return trend !== 0 ? momentum / trend : 0;
    }

    calculateProfitLoss(prices) {
        if (prices.length < 2) return 0;
        const first = prices[0];
        const last = prices[prices.length - 1];
        return ((last - first) / first) * 100;
    }

    detectTrendReversal(prices) {
        if (prices.length < 5) return false;
        const recent = prices.slice(-5);
        const firstHalf = recent.slice(0, 3);
        const secondHalf = recent.slice(2);
        
        const firstTrend = firstHalf[2] - firstHalf[0];
        const secondTrend = secondHalf[2] - secondHalf[0];
        
        return (firstTrend > 0 && secondTrend < 0) || (firstTrend < 0 && secondTrend > 0);
    }

    analyzeVolumeConfirmation(volumes) {
        if (volumes.length < 3) return false;
        const recent = volumes.slice(-3);
        return recent[2] > recent[1] && recent[1] > recent[0];
    }

    calculateVolumeConsistency(preVolume, currentVolume) {
        const ratio = Math.abs(currentVolume - preVolume) / Math.max(preVolume, currentVolume);
        return Math.max(0, 1 - ratio);
    }

    calculateIndicatorAlignment(signal) {
        let alignment = 0;
        let factors = 0;
        
        // RSI alignment
        if (signal.rsi > 50) alignment += 1;
        else if (signal.rsi < 50) alignment += 1;
        factors += 1;
        
        // MACD alignment
        if (signal.macd.histogram > 0) alignment += 1;
        else if (signal.macd.histogram < 0) alignment += 1;
        factors += 1;
        
        // Price change alignment
        if (signal.priceChange > 0) alignment += 1;
        else if (signal.priceChange < 0) alignment += 1;
        factors += 1;
        
        return factors > 0 ? alignment / factors : 0;
    }

    analyzeMarketConditions(analysis) {
        // This would analyze broader market conditions
        // For now, return a neutral score
        return 0.5;
    }

    calculateRiskLevel(analysis) {
        if (analysis.signalQuality > 80 && analysis.confidence > 0.8) return 'LOW';
        if (analysis.signalQuality > 60 && analysis.confidence > 0.6) return 'MEDIUM';
        return 'HIGH';
    }

    isNewSignal(symbol, analysis) {
        const lastSignal = this.signalHistory.get(symbol);
        if (!lastSignal) return true;
        
        const timeDiff = analysis.timestamp - lastSignal.timestamp;
        return timeDiff > 300000; // 5 minutes
    }

    storeSignalHistory(symbol, analysis) {
        this.signalHistory.set(symbol, analysis);
    }

    async getKlineData(symbol, interval, limit) {
        try {
            const response = await fetch(`https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`);
            if (!response.ok) throw new Error(`API request failed: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error(`Failed to fetch ${symbol} ${interval} data:`, error);
            return [];
        }
    }

    // Get signal history for a symbol
    getSignalHistory(symbol) {
        return this.signalHistory.get(symbol) || null;
    }

    // Get all active signals
    getActiveSignals() {
        return Array.from(this.activeSignals.values());
    }

    // Clear old signals
    clearOldSignals(maxAge = 3600000) { // 1 hour
        const now = Date.now();
        for (const [symbol, signal] of this.signalHistory.entries()) {
            if (now - signal.timestamp > maxAge) {
                this.signalHistory.delete(symbol);
            }
        }
    }
}

// Export for use in main application
window.SignalAnalyzer = SignalAnalyzer;