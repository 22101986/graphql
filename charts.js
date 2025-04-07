window.charts = {
  createXpLineChart(xpData, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
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

    const aggregatedData = xpData.reduce((acc, item) => {
      const date = new Date(item.createdAt).toLocaleDateString();
      acc[date] = (acc[date] || 0) + item.amount;
      return acc;
    }, {});

    const dates = Object.keys(aggregatedData);
    const amounts = Object.values(aggregatedData);
    const maxAmount = Math.max(...amounts);

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "1300");
    svg.setAttribute("viewBox", `0 0 ${dates.length * 50} 1300`);

    let xps = 0
    let pathData = `M 0 ${1300 - (amounts[0] / maxAmount * 250)}`;
    amounts.forEach((amount, i) => {
      xps += amount
      pathData += ` L ${i * 50} ${1300 - (xps / maxAmount * 250)}`;
    });

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", pathData);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "#4285f4");
    path.setAttribute("stroke-width", "3");
    svg.appendChild(path);

    let value = 0
    amounts.forEach((amount, i) => {
      value += amount
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("cx", i * 50);
      circle.setAttribute("cy", 1300 - (value / maxAmount * 250));
      circle.setAttribute("r", "10");
      circle.setAttribute("fill", "#4285f4");
      circle.setAttribute("data-amount", amount);
      circle.setAttribute("data-date", dates[i]);
      circle.classList.add("data-point");
      
      circle.addEventListener('mouseover', (e) => {
        console.log(circle.getAttribute('data-amount'))
        const amount = circle.getAttribute('data-amount');
        const date = circle.getAttribute('data-date');
        tooltip.innerHTML = `<strong>${date}</strong><br>XP: ${amount}`;
        tooltip.style.display = 'block';
        
        const svgRect = container.getBoundingClientRect();
        const pointX = parseFloat(circle.getAttribute('cx'));
        const pointY = parseFloat(circle.getAttribute('cy'));
        
        const viewBox = svg.getAttribute('viewBox').split(' ');
        const scaleX = svgRect.width / parseFloat(viewBox[2]);
        const scaleY = svgRect.height / parseFloat(viewBox[3]);
        
        tooltip.style.left = `${svgRect.left + (pointX * scaleX)}px`;
        tooltip.style.top = `${svgRect.top + (pointY * scaleY) - 30}px`;
    });
    
    circle.addEventListener('mouseout', () => {
        tooltip.style.display = 'none';
    });
      
      svg.appendChild(circle);
    });

    dates.forEach((date, i) => {
      if (i % 3 === 0) { 
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", i * 50);
        text.setAttribute("y", "1300");
        text.setAttribute("font-size", "20");
        text.textContent = date;
        svg.appendChild(text);
      }
    });

    container.innerHTML = '';
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
