window.charts = {
  createXpLineChart(xpData, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Clear previous content
    container.innerHTML = '';
    
    // Create tooltip
    const tooltip = document.createElement('div');
    tooltip.id = 'xpTooltip';
    tooltip.style.position = 'absolute';
    tooltip.style.pointerEvents = 'none';
    tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    tooltip.style.color = 'white';
    tooltip.style.padding = '8px';
    tooltip.style.borderRadius = '4px';
    tooltip.style.fontSize = '14px';
    tooltip.style.display = 'none';
    container.appendChild(tooltip);

    // Separate data by type
    const dataByType = {
      go: [],
      js: [],
      cursus: []
    };

    xpData.forEach(item => {
      if (item.path.includes("/piscine-go")) {
        dataByType.go.push(item);
      } else if (item.path.includes("/piscine-js/")) {
        dataByType.js.push(item);
      } else {
        dataByType.cursus.push(item);
      }
    });

    // Aggregate data by date for each type
    const aggregateData = (data) => {
      return data.reduce((acc, item) => {
        const date = new Date(item.createdAt).toLocaleDateString();
        if (!acc[date]) {
          acc[date] = 0;
        }
        acc[date] += item.amount;
        return acc;
      }, {});
    };

    const aggregatedGo = aggregateData(dataByType.go);
    const aggregatedJs = aggregateData(dataByType.js);
    const aggregatedCursus = aggregateData(dataByType.cursus);

    // Get all unique dates
    const allDates = [
      ...Object.keys(aggregatedGo),
      ...Object.keys(aggregatedJs),
      ...Object.keys(aggregatedCursus)
    ].filter((date, index, self) => self.indexOf(date) === index)
     .sort((a, b) => new Date(a) - new Date(b));

    // Calculate cumulative values for each type
    const cumulativeData = {
      go: {},
      js: {},
      cursus: {}
    };

    let goTotal = 0, jsTotal = 0, cursusTotal = 0;
    allDates.forEach(date => {
      if (aggregatedGo[date]) goTotal += aggregatedGo[date];
      if (aggregatedJs[date]) jsTotal += aggregatedJs[date];
      if (aggregatedCursus[date]) cursusTotal += aggregatedCursus[date];
      
      cumulativeData.go[date] = goTotal;
      cumulativeData.js[date] = jsTotal;
      cumulativeData.cursus[date] = cursusTotal;
    });

    // Find max value for scaling
    const maxValue = Math.max(goTotal, jsTotal, cursusTotal);

    // Create SVG
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "500");
    svg.setAttribute("viewBox", `0 0 ${allDates.length * 50} 500`);

    // Draw grid lines
    for (let i = 0; i <= 5; i++) {
      const y = 500 - (i * 100);
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", "0");
      line.setAttribute("y1", y);
      line.setAttribute("x2", allDates.length * 50);
      line.setAttribute("y2", y);
      line.setAttribute("stroke", "#ddd");
      line.setAttribute("stroke-width", "1");
      svg.appendChild(line);

      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", "0");
      text.setAttribute("y", y - 5);
      text.setAttribute("font-size", "12");
      text.setAttribute("fill", "#666");
      text.textContent = `${Math.round((i * maxValue) / 5)} XP`;
      svg.appendChild(text);
    }

    // Draw lines for each type
    const drawLine = (data, color) => {
      let pathData = '';
      let firstPoint = true;
      let total = 0;
      
      allDates.forEach((date, i) => {
        if (data[date]) total = data[date];
        const y = 500 - (total / maxValue * 400);
        
        if (firstPoint) {
          pathData += `M ${i * 50} ${y}`;
          firstPoint = false;
        } else {
          pathData += ` L ${i * 50} ${y}`;
        }
      });

      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", pathData);
      path.setAttribute("fill", "none");
      path.setAttribute("stroke", color);
      path.setAttribute("stroke-width", "3");
      svg.appendChild(path);
    };

    drawLine(cumulativeData.go, "#EA4335");    // Red for Go
    drawLine(cumulativeData.js, "#FBBC05");    // Yellow for JS
    drawLine(cumulativeData.cursus, "#4285F4"); // Blue for Cursus

    // Add date labels
    allDates.forEach((date, i) => {
      if (i % Math.ceil(allDates.length / 10) === 0) { // Show about 10 labels
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", i * 50);
        text.setAttribute("y", "495");
        text.setAttribute("font-size", "12");
        text.setAttribute("text-anchor", "middle");
        text.textContent = date;
        svg.appendChild(text);
      }
    });

    // Add legend
    const legend = document.createElementNS("http://www.w3.org/2000/svg", "g");
    legend.setAttribute("transform", `translate(20, 20)`);
    
    const addLegendItem = (color, label, y) => {
      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      rect.setAttribute("x", "0");
      rect.setAttribute("y", y);
      rect.setAttribute("width", "15");
      rect.setAttribute("height", "15");
      rect.setAttribute("fill", color);
      legend.appendChild(rect);
      
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", "20");
      text.setAttribute("y", y + 12);
      text.setAttribute("font-size", "14");
      text.textContent = label;
      legend.appendChild(text);
    };
    
    addLegendItem("#EA4335", "Piscine Go", 0);
    addLegendItem("#FBBC05", "Piscine JS", 25);
    addLegendItem("#4285F4", "Cursus", 50);
    
    svg.appendChild(legend);

    container.appendChild(svg);
    container.appendChild(tooltip);
  },

  createAuditRatioPieChart(up, down, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const total = up + down;
    if (total === 0) {
      container.innerHTML = '<p>No audit data available</p>';
      return;
    }

    const upPercentage = (up / total) * 100;

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "300");
    svg.setAttribute("height", "300");
    svg.setAttribute("viewBox", "0 0 300 300");

    const radius = 100;
    const centerX = 150;
    const centerY = 150;

    const upStartAngle = 0;
    const upEndAngle = (upPercentage / 100) * 360;
    const upPath = this.describeArc(centerX, centerY, radius, upStartAngle, upEndAngle);
    
    const upSlice = document.createElementNS("http://www.w3.org/2000/svg", "path");
    upSlice.setAttribute("d", upPath);
    upSlice.setAttribute("fill", "#34a853");
    svg.appendChild(upSlice);

    const downStartAngle = upEndAngle;
    const downEndAngle = 360;
    const downPath = this.describeArc(centerX, centerY, radius, downStartAngle, downEndAngle);
    
    const downSlice = document.createElementNS("http://www.w3.org/2000/svg", "path");
    downSlice.setAttribute("d", downPath);
    downSlice.setAttribute("fill", "#ea4335");
    svg.appendChild(downSlice);

    const centerCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    centerCircle.setAttribute("cx", centerX);
    centerCircle.setAttribute("cy", centerY);
    centerCircle.setAttribute("r", radius * 0.5);
    centerCircle.setAttribute("fill", "white");
    svg.appendChild(centerCircle);

    const ratioText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    ratioText.setAttribute("x", centerX);
    ratioText.setAttribute("y", centerY - 10);
    ratioText.setAttribute("text-anchor", "middle");
    ratioText.setAttribute("font-size", "24");
    ratioText.setAttribute("font-weight", "bold");
    ratioText.textContent = `${(up / down).toFixed(1)}`;
    svg.appendChild(ratioText);

    container.innerHTML = '';
    container.appendChild(svg);
  },

  describeArc(x, y, radius, startAngle, endAngle) {
    const start = this.polarToCartesian(x, y, radius, endAngle);
    const end = this.polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

    return [
      "M", x, y,
      "L", start.x, start.y,
      "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
      "Z"
    ].join(" ");
  },

  polarToCartesian(centerX, centerY, radius, angleInDegrees) {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  }
};
