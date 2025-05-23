// This script handles interactive dashboard functionality.

document.addEventListener('DOMContentLoaded', function() {
    // Main Tabs Elements
    const tabsContainer = document.querySelector('.tabs');
    const tabButtons = document.querySelectorAll('.tab-button'); // Main tab buttons (Kitchen Utensils, Food Ingredients)
    const slider = document.querySelector('.tab-slider');
    let activeTab = document.querySelector('.tab-button.active-tab') || (tabButtons.length > 0 ? tabButtons[0] : null);

    // Info Box Elements
    const infoBoxElements = [
        { box: document.getElementById('info-box-1'), indicator: document.querySelector('#info-box-1 .urgency-indicator'), title: document.querySelector('#info-box-1 .info-box-title'), value: document.querySelector('#info-box-1 .info-box-value'), secondary: document.querySelector('#info-box-1 .info-box-secondary') },
        { box: document.getElementById('info-box-2'), indicator: document.querySelector('#info-box-2 .urgency-indicator'), title: document.querySelector('#info-box-2 .info-box-title'), value: document.querySelector('#info-box-2 .info-box-value'), secondary: document.querySelector('#info-box-2 .info-box-secondary') },
        { box: document.getElementById('info-box-3'), indicator: document.querySelector('#info-box-3 .urgency-indicator'), title: document.querySelector('#info-box-3 .info-box-title'), value: document.querySelector('#info-box-3 .info-box-value'), secondary: document.querySelector('#info-box-3 .info-box-secondary') }
    ];

    // Chart Elements
    const mainChartArea = document.getElementById('main-chart-area');
    const chartCaptionTextElement = mainChartArea ? mainChartArea.querySelector('.chart-caption-text') : null;
    const svgChart = mainChartArea ? mainChartArea.querySelector('.line-graph-svg') : null;
    const chartPeriodDropdown = document.querySelector('.chart-period-dropdown');
    let currentChartPeriod = 'daily'; // Default period

    // Low Stock Alerts Elements
    const dynamicLowStockContainer = document.getElementById('dynamic-low-stock-container');

    // --- Data Store ---
    const dashboardData = {
        utensils: {
            infoBoxes: [
                { title: "Total Utensils", value: "850", secondary: "20 Added This Week", urgency: "least-urgent" },
                { title: "Low Stock Utensils", value: "5", secondary: "Order More Soon", urgency: "medium-urgent" },
                { title: "Utensils In Use", value: "150", secondary: "25 Returned Today", urgency: "least-urgent" }
            ],
            usageChartPlaceholder: "(Utensil Usage Chart - Placeholder)",
            lowStock: [
                { name: "Serving Spoons", current: 8, target: 20, unit: "pcs", status: "warning" },
                { name: "Chef Knives", current: 3, target: 10, unit: "pcs", status: "critical" },
                { name: "Dinner Plates", current: 50, target: 100, unit: "pcs", status: "warning" },
                { name: "Soup Bowls", current: 25, target: 80, unit: "pcs", status: "critical" },
                { name: "Water Glasses", current: 60, target: 120, unit: "pcs", status: "ok" },
                { name: "Chopsticks Sets", current: 40, target: 100, unit: "sets", status: "warning" }
            ]
        },
        ingredients: {
            infoBoxes: [
                { title: "Total Ingredients", value: "1250", secondary: "50 Added Today", urgency: "least-urgent" },
                { title: "Low Stock Ingredients", value: "15", secondary: "Needs Attention!", urgency: "most-urgent" },
                { title: "Ingredients Used Today", value: "230 kg", secondary: "30 Returned", urgency: "medium-urgent" }
            ],
            usageChartPlaceholder: "(Ingredient Usage Chart - Placeholder)",
            lowStock: [
                { name: "Steak Cuts", current: 5, target: 20, unit: "kg", status: "critical" },
                { name: "Kimchi", current: 12, target: 50, unit: "batches", status: "warning" },
                { name: "Rice Bags", current: 30, target: 100, unit: "kg", status: "ok" },
                { name: "Gochujang Tubs", current: 2, target: 10, unit: "tubs", status: "critical" },
                { name: "Sesame Oil", current: 7, target: 15, unit: "bottles", status: "warning" },
                { name: "Nori Sheets", current: 100, target: 500, unit: "sheets", status: "ok" },
                { name: "Tofu Blocks", current: 4, target: 25, unit: "blocks", status: "critical" },
                { name: "Soy Sauce", current: 9, target: 20, unit: "liters", status: "warning" }
            ]
        }
    };

    // --- Main Tab Slider Logic ---
    function updateSliderPosition(targetElement) {
        if (!targetElement || !slider) return;
        slider.style.left = targetElement.offsetLeft + 'px';
        slider.style.width = targetElement.offsetWidth + 'px';
        slider.style.top = targetElement.offsetTop + 'px';
        slider.style.height = targetElement.offsetHeight + 'px';
    }

    // --- Data Display Functions ---
    function displayInfoBoxData(dataForCategory) {
        if (!dataForCategory || !dataForCategory.infoBoxes || dataForCategory.infoBoxes.length !== infoBoxElements.length) {
            console.error("Info box data is missing or mismatched.");
            return;
        }
        dataForCategory.infoBoxes.forEach((dataItem, index) => {
            const elements = infoBoxElements[index];
            if (elements.title) elements.title.textContent = dataItem.title;
            if (elements.value) elements.value.textContent = dataItem.value;
            if (elements.secondary) elements.secondary.textContent = dataItem.secondary;
            if (elements.indicator) {
                elements.indicator.className = 'urgency-indicator '; // Reset classes
                elements.indicator.classList.add(dataItem.urgency);
            }
        });
    }

    function renderPlaceholderChart(dataForCategory) {
        if (chartCaptionTextElement && dataForCategory && dataForCategory.usageChartPlaceholder) {
            chartCaptionTextElement.textContent = dataForCategory.usageChartPlaceholder + ` - Period: ${currentChartPeriod}`;
        }

        if (!svgChart) return;
        svgChart.innerHTML = ''; // Clear previous SVG content

        const svgNS = "http://www.w3.org/2000/svg";

        // Define a viewBox for the SVG. All drawing will be relative to these dimensions.
        // This allows the graph to scale and fill the SVG element.
        const viewBoxWidth = 1000;
        const viewBoxHeight = 500; // Aspect ratio 2:1
        svgChart.setAttribute('viewBox', `0 0 ${viewBoxWidth} ${viewBoxHeight}`);
        svgChart.setAttribute('preserveAspectRatio', 'xMidYMid meet'); // Or 'none' if you want to stretch

        // Padding within the viewBox (for axes, labels)
        const padding = { top: 50, right: 50, bottom: 70, left: 80 }; 

        const graphContentWidth = viewBoxWidth - padding.left - padding.right;
        const graphContentHeight = viewBoxHeight - padding.top - padding.bottom;

        let dataPointsY = [];
        let xLabels = [];
        const numDataPoints = (currentChartPeriod === 'monthly') ? 12 : (currentChartPeriod === 'weekly' ? 7 : 10); // Daily now 10 points
        const yLogicalMax = 60; // The logical maximum value for your Y-axis (e.g., 60 from image)
        const yLogicalMin = 0;  // The logical minimum value for your Y-axis

        const baseVariation = (activeTab && activeTab.dataset.tabId === 'ingredients') ? 0.6 : 0.4;

        for (let i = 0; i < numDataPoints; i++) {
            // Generate data that uses more of the 0-60 range
            const randomFactor = (Math.sin(i * 0.4 + baseVariation * i * 0.2) + 1) / 2; // Value between 0 and 1
            dataPointsY.push(yLogicalMin + randomFactor * (yLogicalMax - yLogicalMin - 10) + 5); // Ensure points are not always at extremes

            if (currentChartPeriod === 'monthly') xLabels.push(["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][i]);
            else if (currentChartPeriod === 'weekly') xLabels.push(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i]);
            else xLabels.push(`P${i + 1}`); // Period 1, Period 2...
        }

        // --- Draw X-axis labels ---
        xLabels.forEach((label, i) => {
            const x = padding.left + (i / (numDataPoints > 1 ? numDataPoints - 1 : 1)) * graphContentWidth;
            const text = document.createElementNS(svgNS, 'text');
            text.setAttribute('x', x.toString());
            text.setAttribute('y', (viewBoxHeight - padding.bottom + 30).toString()); // Position below graph area
            text.setAttribute('class', 'axis-text');
            text.textContent = label;
            svgChart.appendChild(text);
        });

        // --- Draw Y-axis labels (0, 15, 30, 45, 60) ---
        const yAxisValues = [0, 15, 30, 45, 60];
        yAxisValues.forEach(val => {
            const y = padding.top + graphContentHeight - ((val - yLogicalMin) / (yLogicalMax - yLogicalMin)) * graphContentHeight;
            const text = document.createElementNS(svgNS, 'text');
            text.setAttribute('x', (padding.left - 15).toString()); // Position left of graph area
            text.setAttribute('y', y.toString());
            text.setAttribute('dy', '0.3em'); // Center text vertically on the tick
            text.setAttribute('class', 'axis-text y-axis-text');
            text.textContent = val.toString();
            svgChart.appendChild(text);

            // Optional: Add horizontal grid lines
            const line = document.createElementNS(svgNS, 'line');
            line.setAttribute('x1', padding.left.toString());
            line.setAttribute('y1', y.toString());
            line.setAttribute('x2', (padding.left + graphContentWidth).toString());
            line.setAttribute('y2', y.toString());
            line.setAttribute('class', 'grid-line'); // Corrected class for grid lines
            svgChart.appendChild(line);
        });

        // --- Draw the data line ---
        let pathData = "M";
        dataPointsY.forEach((pointY, i) => {
            const x = padding.left + (i / (numDataPoints > 1 ? numDataPoints - 1 : 1)) * graphContentWidth;
            const y = padding.top + graphContentHeight - ((pointY - yLogicalMin) / (yLogicalMax - yLogicalMin)) * graphContentHeight;
            pathData += `${x.toFixed(2)},${y.toFixed(2)} `;
            if (i > 0) pathData = pathData.replace(/^M/, "L"); 
        });
        pathData = pathData.replace(/^L/, "M");

        const path = document.createElementNS(svgNS, 'path');
        path.setAttribute('d', pathData.trim());
        path.setAttribute('class', 'graph-line');
        svgChart.appendChild(path);
    }

    function displayLowStockData(dataForCategory) {
        if (!dynamicLowStockContainer || !dataForCategory || !dataForCategory.lowStock) {
            console.error("Low stock data or container element is missing.");
            if (dynamicLowStockContainer) dynamicLowStockContainer.innerHTML = '<p>Error loading data.</p>';
            return;
        }
        dynamicLowStockContainer.innerHTML = ''; // Clear previous items or placeholder text

        if (dataForCategory.lowStock.length === 0) {
            const noItemsMessage = document.createElement('p');
            noItemsMessage.textContent = 'No low stock items to display.';
            dynamicLowStockContainer.appendChild(noItemsMessage);
            return;
        }

        dataForCategory.lowStock.forEach(item => {
            const card = document.createElement('div');
            card.className = 'low-stock-item-card';

            const header = document.createElement('div');
            header.className = 'item-card-header';

            const name = document.createElement('span');
            name.className = 'item-card-name';
            name.textContent = item.name;

            const statusTag = document.createElement('span');
            statusTag.className = 'item-card-status ';
            statusTag.classList.add(item.status); // critical, warning, ok
            statusTag.textContent = item.status;

            header.appendChild(name);
            header.appendChild(statusTag);

            const quantity = document.createElement('p');
            quantity.className = 'item-card-quantity';
            quantity.textContent = `${item.current} ${item.unit} left (Target: ${item.target} ${item.unit})`;

            const progressBarContainer = document.createElement('div');
            progressBarContainer.className = 'item-card-progress-bar-container';

            const progressBarFill = document.createElement('div');
            progressBarFill.className = 'item-card-progress-bar-fill';
            let progressPercentage = 0;
            if (item.target > 0) { // Avoid division by zero
                progressPercentage = (item.current / item.target) * 100;
            }
            progressBarFill.style.width = Math.min(progressPercentage, 100) + '%'; // Cap at 100%
            // Optionally, change progress bar color based on status
            if (item.status === 'critical') {
                progressBarFill.style.backgroundColor = '#A93226'; // Darker Red
            } else if (item.status === 'warning') {
                progressBarFill.style.backgroundColor = '#D35400'; // Darker Orange
            } else { // ok
                progressBarFill.style.backgroundColor = '#229954'; // Darker Green
            }


            progressBarContainer.appendChild(progressBarFill);

            card.appendChild(header);
            card.appendChild(quantity);
            card.appendChild(progressBarContainer);

            dynamicLowStockContainer.appendChild(card);
        });
    }

    // --- Central Function to Update All Dashboard Data based on Main Tab ---
    function updateDashboardContent() {
        if (activeTab) {
            const tabId = activeTab.dataset.tabId; // "utensils" or "ingredients"
            const currentData = dashboardData[tabId];

            if (currentData) {
                displayInfoBoxData(currentData);
                renderPlaceholderChart(currentData);
                displayLowStockData(currentData);
            } else {
                console.error("No data found for tab:", tabId);
                // Optionally clear or set to default states
            }
        } else {
             console.error("No active main tab found.");
        }
    }

    // --- Event Listeners & Initial Setup ---

    // Main Tabs Click Handler
    tabButtons.forEach(tab => {
        tab.addEventListener('click', function() {
            tabButtons.forEach(t => t.classList.remove('active-tab'));
            this.classList.add('active-tab');
            activeTab = this;
            updateSliderPosition(this);
            updateDashboardContent(); // Update all content based on new active tab
        });
    });

    // Chart Period Dropdown Functionality
    if (chartPeriodDropdown) {
        const toggleButton = chartPeriodDropdown.querySelector('.dropdown-toggle');
        const menu = chartPeriodDropdown.querySelector('.dropdown-menu');
        const menuItems = menu.querySelectorAll('a');
        const dropdownLabel = toggleButton.querySelector('.dropdown-label');

        toggleButton.addEventListener('click', function(event) {
            event.stopPropagation();
            menu.classList.toggle('show');
            toggleButton.setAttribute('aria-expanded', menu.classList.contains('show').toString());
        });

        menuItems.forEach(item => {
            item.addEventListener('click', function(event) {
                event.preventDefault();
                currentChartPeriod = this.dataset.period;
                if (dropdownLabel) dropdownLabel.textContent = this.textContent;
                menu.classList.remove('show');
                toggleButton.setAttribute('aria-expanded', 'false');
                console.log("Selected chart period:", currentChartPeriod, "for type:", activeTab ? activeTab.dataset.tabId : 'unknown');
                updateDashboardContent(); // Re-render chart placeholder with new period
            });
        });

        window.addEventListener('click', function(event) {
            if (!chartPeriodDropdown.contains(event.target)) {
                if (menu.classList.contains('show')) {
                    menu.classList.remove('show');
                    toggleButton.setAttribute('aria-expanded', 'false');
                }
            }
        });
    }

    // Initial Setup on Load
    if (activeTab) {
        setTimeout(() => {
            updateSliderPosition(activeTab);
            updateDashboardContent(); // Initial content load
        }, 50);
    } else if (tabButtons.length > 0) {
        // Fallback if no active tab is set in HTML, activate the first one
        tabButtons[0].classList.add('active-tab');
        activeTab = tabButtons[0];
        setTimeout(() => {
            updateSliderPosition(activeTab);
            updateDashboardContent();
        }, 50);
    } else {
        console.error("No tab buttons found for initialization.");
    }

    // REMOVED: Low Stock Alerts Sub-Tab Functionality
    // REMOVED: Usage Trends Chart Sub-Tab Functionality
}); 