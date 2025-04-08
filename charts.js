window.charts = {
  createSingleXpLineChart(xpData, containerId, color) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    
    const tooltip = document.createElement('div');
    tooltip.className = 'chart-tooltip';
    container.style.position = 'relative'; 
    container.appendChild(tooltip);

    const aggregatedData = xpData.reduce((acc, item) => {
      const date = new Date(item.createdAt).toLocaleDateString();
      if (!acc[date]) {
        acc[date] = 0;
      }
      acc[date] += item.amount;
      return acc;
    }, {});

    const dates = Object.keys(aggregatedData).sort((a, b) => new Date(a) - new Date(b));
    const amounts = dates.map(date => aggregatedData[date]);
    
    const cumulativeAmounts = [];
    let total = 0;
    amounts.forEach(amount => {
      total += amount;
      cumulativeAmounts.push(total);
    });

    const maxAmount = Math.max(...cumulativeAmounts, 1);
    const svgHeight = 300;
    const svgWidth = Math.max(dates.length * 30, container.clientWidth);
    const padding = { top: 30, right: 30, bottom: 50, left: 60 };

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", svgHeight);
    svg.setAttribute("viewBox", `0 0 ${svgWidth} ${svgHeight}`);

    const yAxisSteps = 5;
    for (let i = 0; i <= yAxisSteps; i++) {
      const y = ((svgHeight - padding.bottom - padding.top) * (1 - i / yAxisSteps)) + padding.top;
      
      const gridLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
      gridLine.setAttribute("x1", padding.left);
      gridLine.setAttribute("y1", y);
      gridLine.setAttribute("x2", svgWidth - padding.right);
      gridLine.setAttribute("y2", y);
      gridLine.setAttribute("stroke", "#eee");
      gridLine.setAttribute("stroke-width", "1");
      svg.appendChild(gridLine);
      
      const yLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
      yLabel.setAttribute("x", padding.left - 10);
      yLabel.setAttribute("y", y + 5);
      yLabel.setAttribute("text-anchor", "end");
      yLabel.setAttribute("font-size", "10");
      yLabel.textContent = Math.round((i / yAxisSteps) * maxAmount);
      svg.appendChild(yLabel);
    }

    const pathData = cumulativeAmounts.map((amount, i) => {
      const x = padding.left + (i * (svgWidth - padding.left - padding.right) / (dates.length - 1 || 1));
      const y = svgHeight - padding.bottom - ((amount / maxAmount) * (svgHeight - padding.top - padding.bottom));
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", pathData);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", color);
    path.setAttribute("stroke-width", "3");
    svg.appendChild(path);

    cumulativeAmounts.forEach((amount, i) => {
      const x = padding.left + (i * (svgWidth - padding.left - padding.right) / (dates.length - 1 || 1));
      const y = svgHeight - padding.bottom - ((amount / maxAmount) * (svgHeight - padding.top - padding.bottom));
      
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("cx", x);
      circle.setAttribute("cy", y);
      circle.setAttribute("r", "5");
      circle.setAttribute("fill", color);
      circle.setAttribute("data-date", dates[i]);
      circle.setAttribute("data-amount", amounts[i]);
      circle.setAttribute("data-total", amount);
      
      circle.addEventListener('mouseover', (e) => {
        const svgRect = svg.getBoundingClientRect();
        const pointX = parseFloat(circle.getAttribute('cx'));
        const pointY = parseFloat(circle.getAttribute('cy'));
        
        // Calculer la position relative dans le SVG
        const viewBox = svg.getAttribute('viewBox').split(' ');
        const scaleX = svgRect.width / parseFloat(viewBox[2]);
        const scaleY = svgRect.height / parseFloat(viewBox[3]);
        
        // Positionner la tooltip par rapport au conteneur
        tooltip.innerHTML = `
            <strong>${dates[i]}</strong><br>
            XP: ${amounts[i]}<br>
            Total: ${amount}
        `;
        tooltip.style.display = 'block';
        tooltip.style.left = `${pointX * scaleX - 50}px`; // Ajustez -50 pour centrer
        tooltip.style.top = `${pointY * scaleY - 40}px`;  // Ajustez -40 pour positionner au-dessus
    });
    
    circle.addEventListener('mouseout', () => {
        tooltip.style.display = 'none';
    });
      
      svg.appendChild(circle);
    });

    dates.forEach((date, i) => {
      if (i % Math.ceil(dates.length / 10) === 0) { 
        const x = padding.left + (i * (svgWidth - padding.left - padding.right) / (dates.length - 1 || 1));
        
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", x);
        text.setAttribute("y", svgHeight - 15);
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("font-size", "10");
        text.setAttribute("transform", `rotate(45, ${x}, ${svgHeight - 15})`);
        text.textContent = date;
        svg.appendChild(text);
      }
    });

    container.appendChild(svg);
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
