/* =========================================
   1. GLOBAL DATA
   ========================================= */
let myAssets = [
    { name: "Reliance", value: 150000, category: "stock" },
    { name: "Bitcoin", value: 150000, category: "crypto" }, 
    { name: "Gov Bond 2030", value: 50000, category: "bond" }
];

const marketData = {
    stocks: [
        { name: "Reliance", price: 2750, cat: "stock" },
        { name: "Tata Motors", price: 980, cat: "stock" },
        { name: "HDFC Bank", price: 1650, cat: "stock" },
        { name: "Infosys", price: 1480, cat: "stock" },
        { name: "ICICI Bank", price: 1100, cat: "stock" },
        { name: "SBI", price: 760, cat: "stock" }
    ],
    crypto: [
        { name: "Bitcoin", price: 5400000, cat: "crypto" },
        { name: "Ethereum", price: 290000, cat: "crypto" },
        { name: "Solana", price: 12500, cat: "crypto" },
        { name: "Binance Coin", price: 48000, cat: "crypto" }
    ]
};

/* =========================================
   2. INITIALIZATION
   ========================================= */
document.addEventListener('DOMContentLoaded', function() {
    // --- FORCE NAVIGATION RESET ON LOAD ---
    showSection('home'); 
    
    renderTicker();
    renderMarket();
    renderAssets();
    
    // Init Chart
    const ctx = document.getElementById('allocationChart');
    if(ctx) {
        window.portfolioChart = new Chart(ctx.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Safe Assets', 'Risky Assets'],
                datasets: [{ data: [50, 50], backgroundColor: ['#2ecc71', '#e74c3c'], borderWidth: 0 }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
        });
    }

    // Run Initial Analysis
    window.updatePortfolio();
});

/* =========================================
   3. NAVIGATION LOGIC (THE FIX)
   ========================================= */
function showSection(sectionId) {
    // 1. Hide ALL sections first
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(sec => {
        sec.classList.remove('active-section');
        sec.classList.add('hidden-section');
    });

    // 2. Show ONLY the target section
    const activeSec = document.getElementById(sectionId);
    if(activeSec) {
        activeSec.classList.remove('hidden-section');
        activeSec.classList.add('active-section');
    }

    // 3. Update Sidebar Highlight
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => item.classList.remove('active'));
    
    // Find nav item with matching onclick
    const navs = document.querySelectorAll('.nav-item');
    for(let n of navs) { 
        if(n.getAttribute('onclick') && n.getAttribute('onclick').includes(sectionId)) {
            n.classList.add('active');
        }
    }
}

/* =========================================
   4. RENDERING FUNCTIONS
   ========================================= */
function renderTicker() {
    const tickerContainer = document.getElementById('live-ticker');
    let tickerHTML = "";
    const allItems = [...marketData.stocks, ...marketData.crypto];
    for(let i=0; i<3; i++) {
        allItems.forEach(item => {
            const isUp = Math.random() > 0.5;
            const change = (Math.random() * 2).toFixed(2);
            const colorClass = isUp ? 'tick-up' : 'tick-down';
            const icon = isUp ? '<i class="fa-solid fa-caret-up"></i>' : '<i class="fa-solid fa-caret-down"></i>';
            tickerHTML += `<div class="ticker-item">${item.name} <span style="margin-left:5px;">₹${item.price.toLocaleString()}</span><span class="${colorClass}" style="margin-left:8px;">${icon} ${change}%</span></div>`;
        });
    }
    tickerContainer.innerHTML = tickerHTML;
}

function renderMarket() {
    const stockGrid = document.getElementById('nse-market-grid');
    const cryptoGrid = document.getElementById('crypto-market-grid');

    const createCard = (item) => `
        <div class="market-item-card">
            <div class="item-header"><span class="item-name">${item.name}</span><span class="item-tag tag-${item.cat}">${item.cat.toUpperCase()}</span></div>
            <div class="item-price">Current: ₹${item.price.toLocaleString()}</div>
            <div class="quick-trade-box">
                <input type="number" placeholder="₹ Amount" class="quick-input" id="amount-${item.name.replace(/\s/g, '')}">
                <button class="mini-btn btn-buy" onclick="quickTrade('${item.name}', '${item.cat}', 'buy')">Buy</button>
                <button class="mini-btn btn-sell" onclick="quickTrade('${item.name}', '${item.cat}', 'sell')">Sell</button>
            </div>
        </div>`;

    if(stockGrid) stockGrid.innerHTML = marketData.stocks.map(createCard).join('');
    if(cryptoGrid) cryptoGrid.innerHTML = marketData.crypto.map(createCard).join('');
}

function renderAssets() {
    const tableStock = document.getElementById('table-stock');
    const tableCrypto = document.getElementById('table-crypto');
    const tableBond = document.getElementById('table-bond');

    if(tableStock) tableStock.innerHTML = "";
    if(tableCrypto) tableCrypto.innerHTML = "";
    if(tableBond) tableBond.innerHTML = "";

    myAssets.forEach(asset => {
        if (asset.value > 0) {
            const row = `<tr><td>${asset.name}</td><td style="text-align:right; font-weight:bold;">₹${asset.value.toLocaleString()}</td></tr>`;
            if (asset.category === 'stock' && tableStock) tableStock.innerHTML += row;
            else if (asset.category === 'crypto' && tableCrypto) tableCrypto.innerHTML += row;
            else if (tableBond) tableBond.innerHTML += row;
        }
    });
}

/* =========================================
   5. TRADING & BACKEND
   ========================================= */
function quickTrade(name, category, type) {
    const inputId = `amount-${name.replace(/\s/g, '')}`;
    const amountVal = document.getElementById(inputId).value;
    executeTrade(name, parseFloat(amountVal), type, category);
    document.getElementById(inputId).value = ""; 
}

function handleManualTrade(type) {
    const select = document.getElementById('trade-asset');
    const option = select.options[select.selectedIndex];
    const amountVal = document.getElementById('trade-amount').value;
    executeTrade(option.value, parseFloat(amountVal), type, option.getAttribute('data-cat'));
    document.getElementById('trade-amount').value = "";
}

function executeTrade(name, amount, type, category) {
    if (isNaN(amount) || amount <= 0) { alert("Please enter a valid positive amount."); return; }
    let existing = myAssets.find(a => a.name === name);

    if (type === 'buy') {
        if (existing) existing.value += amount;
        else myAssets.push({ name: name, value: amount, category: category });
        alert(`✅ Bought ₹${amount} of ${name}`);
    } else {
        if (!existing || existing.value < amount) { alert("❌ Insufficient funds."); return; }
        existing.value -= amount;
        alert(`📉 Sold ₹${amount} of ${name}`);
    }
    renderAssets(); 
    window.updatePortfolio(); 
}

function handleSellAll() {
    const name = document.getElementById('trade-asset').value;
    let existing = myAssets.find(a => a.name === name);
    if (!existing || existing.value <= 0) { alert("No holdings to sell."); return; }
    if (confirm(`Sell ALL ${name}?`)) {
        existing.value = 0;
        renderAssets();
        window.updatePortfolio();
        alert("Position Liquidated.");
    }
}

window.updatePortfolio = async function() {
    const btn = document.getElementById('rebalance-btn');
    if(btn) { btn.innerText = "Analyzing..."; btn.style.opacity = "0.7"; }

    try {
        const response = await fetch('http://127.0.0.1:8000/rebalance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ assets: myAssets })
        });
        const data = await response.json();

        // 1. Text & Chart
        const stratName = document.getElementById('strat-name');
        const stratReason = document.getElementById('strat-reason');
        if(stratName) stratName.innerText = data.strategy_name;
        if(stratReason) stratReason.innerText = data.reasoning;
        
        if(window.portfolioChart) { 
            window.portfolioChart.data.datasets[0].data = [data.safe_allocation, data.risky_allocation]; 
            window.portfolioChart.update(); 
        }

        // 2. Risk Table
        const tbody = document.getElementById('analysis-body');
        if(tbody) {
            tbody.innerHTML = "";
            data.breakdown.forEach(item => {
                const tr = `<tr><td>${item.name}</td><td><small style='background:#eee; padding:3px 8px; border-radius:4px;'>${item.category}</small></td><td>₹${item.value.toLocaleString()}</td><td>${item.risk_score}</td><td>${item.contribution}</td></tr>`;
                tbody.innerHTML += tr;
            });
            document.getElementById('total-stress-display').innerText = data.final_stress;
        }

        // 3. RECOMMENDATIONS
        const recContainer = document.getElementById('ai-recommendations');
        if(recContainer && data.recommendations) {
            recContainer.innerHTML = "<h4><i class='fa-solid fa-wand-magic-sparkles'></i> AI Actions</h4>";
            data.recommendations.forEach(rec => {
                const color = rec.action === 'SELL' ? '#e74c3c' : (rec.action === 'BUY' ? '#2ecc71' : '#f39c12');
                const card = `
                    <div style="border-left: 5px solid ${color}; background: #fff; padding: 15px; margin-bottom: 10px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
                        <div style="font-weight: bold; color: ${color}; font-size: 1rem;">${rec.action} ${rec.asset}</div>
                        <div style="font-size: 0.9rem; margin-top: 5px;">Amount: <strong>₹${rec.amount.toLocaleString()}</strong></div>
                        <div style="font-size: 0.8rem; color: #777; margin-top: 3px;">${rec.reason}</div>
                    </div>`;
                recContainer.innerHTML += card;
            });
        }

    } catch (e) { console.error(e); }
    finally { if(btn) { btn.innerText = "Manual Scan"; btn.style.opacity = "1"; } }
};