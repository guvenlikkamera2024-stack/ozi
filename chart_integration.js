// Advanced Chart Integration System
class ChartIntegration {
    constructor() {
        this.charts = new Map();
        this.signalMarkers = new Map();
        this.tradeMarkers = new Map();
        this.chartConfig = {
            width: 800,
            height: 400,
            margin: { top: 20, right: 20, bottom: 40, left: 60 },
            colors: {
                bullish: '#00ff88',
                bearish: '#ff4444',
                neutral: '#888888',
                volume: '#4a90e2',
                background: '#1a1a1a',
                grid: '#333333'
            }
        };
    }

    // Create interactive chart for symbol
    async createChart(symbol, containerId, timeframe = '5m') {
        const container = document.getElementById(containerId);
        if (!container) return null;

        // Clear existing chart
        container.innerHTML = '';

        // Create chart container
        const chartContainer = document.createElement('div');
        chartContainer.id = `chart-${symbol}`;
        chartContainer.style.width = `${this.chartConfig.width}px`;
        chartContainer.style.height = `${this.chartConfig.height}px`;
        chartContainer.style.position = 'relative';
        chartContainer.style.background = this.chartConfig.colors.background;
        chartContainer.style.border = '1px solid #333';
        container.appendChild(chartContainer);

        // Create SVG
        const svg = d3.select(chartContainer)
            .append('svg')
            .attr('width', this.chartConfig.width)
            .attr('height', this.chartConfig.height);

        // Create chart groups
        const chartGroup = svg.append('g')
            .attr('transform', `translate(${this.chartConfig.margin.left}, ${this.chartConfig.margin.top})`);

        const width = this.chartConfig.width - this.chartConfig.margin.left - this.chartConfig.margin.right;
        const height = this.chartConfig.height - this.chartConfig.margin.top - this.chartConfig.margin.bottom;

        // Get data
        const data = await this.getKlineData(symbol, timeframe, 100);
        if (data.length === 0) return null;

        // Process data
        const processedData = this.processChartData(data);
        
        // Create scales
        const xScale = d3.scaleTime()
            .domain(d3.extent(processedData, d => d.timestamp))
            .range([0, width]);

        const yScale = d3.scaleLinear()
            .domain(d3.extent(processedData, d => [d.high, d.low]).flat())
            .range([height, 0]);

        const volumeScale = d3.scaleLinear()
            .domain([0, d3.max(processedData, d => d.volume)])
            .range([0, height * 0.3]);

        // Create candlestick chart
        this.createCandlestickChart(chartGroup, processedData, xScale, yScale, width, height);

        // Create volume chart
        this.createVolumeChart(chartGroup, processedData, xScale, volumeScale, width, height);

        // Create technical indicators
        this.createTechnicalIndicators(chartGroup, processedData, xScale, yScale, width, height);

        // Create signal markers
        this.createSignalMarkers(chartGroup, symbol, xScale, yScale);

        // Create trade markers
        this.createTradeMarkers(chartGroup, symbol, xScale, yScale);

        // Add interactivity
        this.addChartInteractivity(chartGroup, processedData, xScale, yScale, width, height);

        // Store chart reference
        this.charts.set(symbol, {
            svg,
            chartGroup,
            data: processedData,
            xScale,
            yScale,
            volumeScale,
            width,
            height
        });

        return this.charts.get(symbol);
    }

    // Process kline data for charting
    processChartData(data) {
        return data.map(d => ({
            timestamp: new Date(d[0]),
            open: parseFloat(d[1]),
            high: parseFloat(d[2]),
            low: parseFloat(d[3]),
            close: parseFloat(d[4]),
            volume: parseFloat(d[5]),
            isBullish: parseFloat(d[4]) > parseFloat(d[1])
        }));
    }

    // Create candlestick chart
    createCandlestickChart(group, data, xScale, yScale, width, height) {
        const candleWidth = width / data.length * 0.8;

        // Create candlesticks
        const candles = group.selectAll('.candle')
            .data(data)
            .enter()
            .append('g')
            .attr('class', 'candle')
            .attr('transform', d => `translate(${xScale(d.timestamp)}, 0)`);

        // Draw candle bodies
        candles.append('rect')
            .attr('x', -candleWidth / 2)
            .attr('y', d => Math.min(yScale(d.open), yScale(d.close)))
            .attr('width', candleWidth)
            .attr('height', d => Math.abs(yScale(d.close) - yScale(d.open)))
            .attr('fill', d => d.isBullish ? this.chartConfig.colors.bullish : this.chartConfig.colors.bearish)
            .attr('stroke', d => d.isBullish ? this.chartConfig.colors.bullish : this.chartConfig.colors.bearish);

        // Draw wicks
        candles.append('line')
            .attr('x1', 0)
            .attr('x2', 0)
            .attr('y1', d => yScale(d.high))
            .attr('y2', d => yScale(d.low))
            .attr('stroke', d => d.isBullish ? this.chartConfig.colors.bullish : this.chartConfig.colors.bearish)
            .attr('stroke-width', 1);

        // Add axes
        this.createAxes(group, data, xScale, yScale, width, height);
    }

    // Create volume chart
    createVolumeChart(group, data, xScale, volumeScale, width, height) {
        const volumeGroup = group.append('g')
            .attr('class', 'volume')
            .attr('transform', `translate(0, ${height * 0.7})`);

        const candleWidth = width / data.length * 0.8;

        volumeGroup.selectAll('.volume-bar')
            .data(data)
            .enter()
            .append('rect')
            .attr('x', d => xScale(d.timestamp) - candleWidth / 2)
            .attr('y', d => height * 0.3 - volumeScale(d.volume))
            .attr('width', candleWidth)
            .attr('height', d => volumeScale(d.volume))
            .attr('fill', d => d.isBullish ? this.chartConfig.colors.bullish : this.chartConfig.colors.bearish)
            .attr('opacity', 0.6);
    }

    // Create technical indicators
    createTechnicalIndicators(group, data, xScale, yScale, width, height) {
        // RSI
        this.createRSI(group, data, xScale, width, height);
        
        // MACD
        this.createMACD(group, data, xScale, width, height);
        
        // Bollinger Bands
        this.createBollingerBands(group, data, xScale, yScale, width, height);
        
        // Moving Averages
        this.createMovingAverages(group, data, xScale, yScale, width, height);
    }

    // Create RSI indicator
    createRSI(group, data, xScale, width, height) {
        const rsiData = this.calculateRSI(data);
        const rsiGroup = group.append('g')
            .attr('class', 'rsi')
            .attr('transform', `translate(0, ${height * 0.8})`);

        const rsiScale = d3.scaleLinear()
            .domain([0, 100])
            .range([height * 0.2, 0]);

        const line = d3.line()
            .x(d => xScale(d.timestamp))
            .y(d => rsiScale(d.rsi))
            .curve(d3.curveMonotoneX);

        rsiGroup.append('path')
            .datum(rsiData)
            .attr('d', line)
            .attr('fill', 'none')
            .attr('stroke', '#ffaa00')
            .attr('stroke-width', 2);

        // RSI levels
        rsiGroup.append('line')
            .attr('x1', 0)
            .attr('x2', width)
            .attr('y1', rsiScale(70))
            .attr('y2', rsiScale(70))
            .attr('stroke', '#ff4444')
            .attr('stroke-dasharray', '5,5');

        rsiGroup.append('line')
            .attr('x1', 0)
            .attr('x2', width)
            .attr('y1', rsiScale(30))
            .attr('y2', rsiScale(30))
            .attr('stroke', '#00ff88')
            .attr('stroke-dasharray', '5,5');
    }

    // Create MACD indicator
    createMACD(group, data, xScale, width, height) {
        const macdData = this.calculateMACD(data);
        const macdGroup = group.append('g')
            .attr('class', 'macd')
            .attr('transform', `translate(0, ${height * 0.9})`);

        const macdScale = d3.scaleLinear()
            .domain(d3.extent(macdData, d => [d.macd, d.signal]).flat())
            .range([height * 0.1, 0]);

        // MACD line
        const macdLine = d3.line()
            .x(d => xScale(d.timestamp))
            .y(d => macdScale(d.macd))
            .curve(d3.curveMonotoneX);

        macdGroup.append('path')
            .datum(macdData)
            .attr('d', macdLine)
            .attr('fill', 'none')
            .attr('stroke', '#4a90e2')
            .attr('stroke-width', 2);

        // Signal line
        const signalLine = d3.line()
            .x(d => xScale(d.timestamp))
            .y(d => macdScale(d.signal))
            .curve(d3.curveMonotoneX);

        macdGroup.append('path')
            .datum(macdData)
            .attr('d', signalLine)
            .attr('fill', 'none')
            .attr('stroke', '#ff6b6b')
            .attr('stroke-width', 2);

        // Histogram
        macdGroup.selectAll('.histogram')
            .data(macdData)
            .enter()
            .append('rect')
            .attr('x', d => xScale(d.timestamp) - 2)
            .attr('y', d => macdScale(Math.max(0, d.histogram)))
            .attr('width', 4)
            .attr('height', d => Math.abs(macdScale(d.histogram) - macdScale(0)))
            .attr('fill', d => d.histogram > 0 ? '#00ff88' : '#ff4444')
            .attr('opacity', 0.7);
    }

    // Create Bollinger Bands
    createBollingerBands(group, data, xScale, yScale, width, height) {
        const bbData = this.calculateBollingerBands(data);
        
        // Upper band
        const upperLine = d3.line()
            .x(d => xScale(d.timestamp))
            .y(d => yScale(d.upper))
            .curve(d3.curveMonotoneX);

        group.append('path')
            .datum(bbData)
            .attr('d', upperLine)
            .attr('fill', 'none')
            .attr('stroke', '#ffaa00')
            .attr('stroke-width', 1)
            .attr('opacity', 0.7);

        // Lower band
        const lowerLine = d3.line()
            .x(d => xScale(d.timestamp))
            .y(d => yScale(d.lower))
            .curve(d3.curveMonotoneX);

        group.append('path')
            .datum(bbData)
            .attr('d', lowerLine)
            .attr('fill', 'none')
            .attr('stroke', '#ffaa00')
            .attr('stroke-width', 1)
            .attr('opacity', 0.7);

        // Middle band (SMA)
        const middleLine = d3.line()
            .x(d => xScale(d.timestamp))
            .y(d => yScale(d.middle))
            .curve(d3.curveMonotoneX);

        group.append('path')
            .datum(bbData)
            .attr('d', middleLine)
            .attr('fill', 'none')
            .attr('stroke', '#ffaa00')
            .attr('stroke-width', 1)
            .attr('opacity', 0.5);
    }

    // Create Moving Averages
    createMovingAverages(group, data, xScale, yScale, width, height) {
        const sma20 = this.calculateSMA(data, 20);
        const sma50 = this.calculateSMA(data, 50);

        // SMA 20
        const sma20Line = d3.line()
            .x(d => xScale(d.timestamp))
            .y(d => yScale(d.sma))
            .curve(d3.curveMonotoneX);

        group.append('path')
            .datum(sma20)
            .attr('d', sma20Line)
            .attr('fill', 'none')
            .attr('stroke', '#00ff88')
            .attr('stroke-width', 2)
            .attr('opacity', 0.8);

        // SMA 50
        const sma50Line = d3.line()
            .x(d => xScale(d.timestamp))
            .y(d => yScale(d.sma))
            .curve(d3.curveMonotoneX);

        group.append('path')
            .datum(sma50)
            .attr('d', sma50Line)
            .attr('fill', 'none')
            .attr('stroke', '#ff6b6b')
            .attr('stroke-width', 2)
            .attr('opacity', 0.8);
    }

    // Create signal markers
    createSignalMarkers(group, symbol, xScale, yScale) {
        const signals = this.getSignalMarkers(symbol);
        if (!signals || signals.length === 0) return;

        const signalGroup = group.append('g')
            .attr('class', 'signal-markers');

        signals.forEach(signal => {
            const marker = signalGroup.append('g')
                .attr('class', 'signal-marker')
                .attr('transform', `translate(${xScale(signal.timestamp)}, ${yScale(signal.price)})`);

            // Signal arrow
            marker.append('path')
                .attr('d', signal.type === 'BUY' ? 
                    'M0,-10 L-8,8 L8,8 Z' : 
                    'M0,10 L-8,-8 L8,-8 Z')
                .attr('fill', signal.type === 'BUY' ? '#00ff88' : '#ff4444')
                .attr('stroke', '#fff')
                .attr('stroke-width', 1);

            // Signal label
            marker.append('text')
                .attr('x', 0)
                .attr('y', signal.type === 'BUY' ? -15 : 25)
                .attr('text-anchor', 'middle')
                .attr('fill', '#fff')
                .attr('font-size', '10px')
                .text(signal.type);

            // Confidence indicator
            marker.append('circle')
                .attr('cx', 0)
                .attr('cy', signal.type === 'BUY' ? -20 : 30)
                .attr('r', signal.confidence * 3)
                .attr('fill', 'none')
                .attr('stroke', signal.confidence > 0.7 ? '#00ff88' : signal.confidence > 0.5 ? '#ffaa00' : '#ff4444')
                .attr('stroke-width', 2)
                .attr('opacity', 0.7);
        });
    }

    // Create trade markers (TP/SL)
    createTradeMarkers(group, symbol, xScale, yScale) {
        const trades = this.getTradeMarkers(symbol);
        if (!trades || trades.length === 0) return;

        const tradeGroup = group.append('g')
            .attr('class', 'trade-markers');

        trades.forEach(trade => {
            const marker = tradeGroup.append('g')
                .attr('class', 'trade-marker')
                .attr('transform', `translate(${xScale(trade.timestamp)}, ${yScale(trade.price)})`);

            // Trade marker
            marker.append('circle')
                .attr('r', 6)
                .attr('fill', trade.type === 'ENTRY' ? '#4a90e2' : 
                           trade.type === 'TP' ? '#00ff88' : '#ff4444')
                .attr('stroke', '#fff')
                .attr('stroke-width', 2);

            // Trade label
            marker.append('text')
                .attr('x', 0)
                .attr('y', -15)
                .attr('text-anchor', 'middle')
                .attr('fill', '#fff')
                .attr('font-size', '9px')
                .text(trade.type);

            // Price label
            marker.append('text')
                .attr('x', 0)
                .attr('y', 20)
                .attr('text-anchor', 'middle')
                .attr('fill', '#ccc')
                .attr('font-size', '8px')
                .text(trade.price.toFixed(4));
        });
    }

    // Add chart interactivity
    addChartInteractivity(group, data, xScale, yScale, width, height) {
        // Crosshair
        const crosshair = group.append('g')
            .attr('class', 'crosshair')
            .style('pointer-events', 'none');

        const verticalLine = crosshair.append('line')
            .attr('x1', 0)
            .attr('x2', 0)
            .attr('y1', 0)
            .attr('y2', height)
            .attr('stroke', '#fff')
            .attr('stroke-width', 1)
            .attr('opacity', 0.5);

        const horizontalLine = crosshair.append('line')
            .attr('x1', 0)
            .attr('x2', width)
            .attr('y1', 0)
            .attr('y2', 0)
            .attr('stroke', '#fff')
            .attr('stroke-width', 1)
            .attr('opacity', 0.5);

        // Tooltip
        const tooltip = group.append('g')
            .attr('class', 'tooltip')
            .style('pointer-events', 'none');

        const tooltipRect = tooltip.append('rect')
            .attr('fill', 'rgba(0,0,0,0.8)')
            .attr('stroke', '#fff')
            .attr('stroke-width', 1)
            .attr('rx', 4);

        const tooltipText = tooltip.append('text')
            .attr('fill', '#fff')
            .attr('font-size', '12px');

        // Mouse events
        group.append('rect')
            .attr('width', width)
            .attr('height', height)
            .attr('fill', 'transparent')
            .on('mousemove', function(event) {
                const [mouseX, mouseY] = d3.pointer(event);
                const timestamp = xScale.invert(mouseX);
                const price = yScale.invert(mouseY);

                // Update crosshair
                verticalLine.attr('x1', mouseX).attr('x2', mouseX);
                horizontalLine.attr('y1', mouseY).attr('y2', mouseY);

                // Find closest data point
                const closestData = data.reduce((prev, curr) => 
                    Math.abs(curr.timestamp - timestamp) < Math.abs(prev.timestamp - timestamp) ? curr : prev
                );

                // Update tooltip
                tooltipText.text(`${closestData.close.toFixed(4)} - ${closestData.timestamp.toLocaleString()}`);
                const textBounds = tooltipText.node().getBBox();
                tooltipRect
                    .attr('x', mouseX - textBounds.width / 2 - 5)
                    .attr('y', mouseY - textBounds.height - 10)
                    .attr('width', textBounds.width + 10)
                    .attr('height', textBounds.height + 5);

                tooltip.attr('transform', `translate(${mouseX - textBounds.width / 2}, ${mouseY - textBounds.height - 5})`);
            })
            .on('mouseleave', function() {
                crosshair.style('opacity', 0);
                tooltip.style('opacity', 0);
            })
            .on('mouseenter', function() {
                crosshair.style('opacity', 1);
                tooltip.style('opacity', 1);
            });
    }

    // Create axes
    createAxes(group, data, xScale, yScale, width, height) {
        // X axis
        const xAxis = d3.axisBottom(xScale)
            .tickFormat(d3.timeFormat('%H:%M'));

        group.append('g')
            .attr('transform', `translate(0, ${height})`)
            .call(xAxis)
            .selectAll('text')
            .attr('fill', '#ccc')
            .attr('font-size', '10px');

        // Y axis
        const yAxis = d3.axisRight(yScale)
            .tickFormat(d3.format('.4f'));

        group.append('g')
            .attr('transform', `translate(${width}, 0)`)
            .call(yAxis)
            .selectAll('text')
            .attr('fill', '#ccc')
            .attr('font-size', '10px');

        // Grid lines
        group.append('g')
            .attr('class', 'grid')
            .attr('transform', `translate(0, ${height})`)
            .call(d3.axisBottom(xScale)
                .tickSize(-height)
                .tickFormat(''))
            .selectAll('line')
            .attr('stroke', this.chartConfig.colors.grid)
            .attr('opacity', 0.3);

        group.append('g')
            .attr('class', 'grid')
            .attr('transform', `translate(${width}, 0)`)
            .call(d3.axisRight(yScale)
                .tickSize(-width)
                .tickFormat(''))
            .selectAll('line')
            .attr('stroke', this.chartConfig.colors.grid)
            .attr('opacity', 0.3);
    }

    // Technical indicator calculations
    calculateRSI(data, period = 14) {
        const rsiData = [];
        for (let i = period; i < data.length; i++) {
            const prices = data.slice(i - period, i).map(d => d.close);
            const gains = [];
            const losses = [];
            
            for (let j = 1; j < prices.length; j++) {
                const change = prices[j] - prices[j - 1];
                if (change > 0) {
                    gains.push(change);
                    losses.push(0);
                } else {
                    gains.push(0);
                    losses.push(-change);
                }
            }
            
            const avgGain = gains.reduce((a, b) => a + b, 0) / period;
            const avgLoss = losses.reduce((a, b) => a + b, 0) / period;
            const rs = avgGain / (avgLoss || 0.0001);
            const rsi = 100 - (100 / (1 + rs));
            
            rsiData.push({
                timestamp: data[i].timestamp,
                rsi: rsi
            });
        }
        return rsiData;
    }

    calculateMACD(data, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
        const macdData = [];
        const prices = data.map(d => d.close);
        
        for (let i = slowPeriod; i < data.length; i++) {
            const emaFast = this.calculateEMA(prices.slice(i - fastPeriod, i), fastPeriod);
            const emaSlow = this.calculateEMA(prices.slice(i - slowPeriod, i), slowPeriod);
            const macd = emaFast - emaSlow;
            
            macdData.push({
                timestamp: data[i].timestamp,
                macd: macd,
                signal: macd * 0.9, // Simplified signal line
                histogram: macd * 0.1
            });
        }
        return macdData;
    }

    calculateBollingerBands(data, period = 20, stdDev = 2) {
        const bbData = [];
        
        for (let i = period; i < data.length; i++) {
            const prices = data.slice(i - period, i).map(d => d.close);
            const mean = prices.reduce((a, b) => a + b, 0) / period;
            const variance = prices.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / period;
            const std = Math.sqrt(variance);
            
            bbData.push({
                timestamp: data[i].timestamp,
                upper: mean + (std * stdDev),
                middle: mean,
                lower: mean - (std * stdDev)
            });
        }
        return bbData;
    }

    calculateSMA(data, period) {
        const smaData = [];
        
        for (let i = period; i < data.length; i++) {
            const prices = data.slice(i - period, i).map(d => d.close);
            const sma = prices.reduce((a, b) => a + b, 0) / period;
            
            smaData.push({
                timestamp: data[i].timestamp,
                sma: sma
            });
        }
        return smaData;
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

    // Signal and trade marker management
    addSignalMarker(symbol, signal) {
        if (!this.signalMarkers.has(symbol)) {
            this.signalMarkers.set(symbol, []);
        }
        this.signalMarkers.get(symbol).push(signal);
        this.updateChart(symbol);
    }

    addTradeMarker(symbol, trade) {
        if (!this.tradeMarkers.has(symbol)) {
            this.tradeMarkers.set(symbol, []);
        }
        this.tradeMarkers.get(symbol).push(trade);
        this.updateChart(symbol);
    }

    getSignalMarkers(symbol) {
        return this.signalMarkers.get(symbol) || [];
    }

    getTradeMarkers(symbol) {
        return this.tradeMarkers.get(symbol) || [];
    }

    updateChart(symbol) {
        const chart = this.charts.get(symbol);
        if (!chart) return;

        // Clear existing markers
        chart.chartGroup.selectAll('.signal-markers').remove();
        chart.chartGroup.selectAll('.trade-markers').remove();

        // Recreate markers
        this.createSignalMarkers(chart.chartGroup, symbol, chart.xScale, chart.yScale);
        this.createTradeMarkers(chart.chartGroup, symbol, chart.xScale, chart.yScale);
    }

    // API integration
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

    // Export chart as image
    exportChart(symbol, format = 'png') {
        const chart = this.charts.get(symbol);
        if (!chart) return null;

        const svg = chart.svg.node();
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        return new Promise((resolve) => {
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL(`image/${format}`));
            };
            img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
        });
    }
}

// Export for use in main application
window.ChartIntegration = ChartIntegration;