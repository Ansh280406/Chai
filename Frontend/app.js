/* =========================================
   1. GLOBAL FUNCTIONS (Accessible by HTML onclick)
   ========================================= */

// A. Login Page: Toggle between Forms
function toggleForms() {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');

    if (loginForm && signupForm) {
        if (loginForm.classList.contains('hidden-form')) {
            loginForm.classList.remove('hidden-form');
            loginForm.classList.add('active-form');
            signupForm.classList.remove('active-form');
            signupForm.classList.add('hidden-form');
        } else {
            signupForm.classList.remove('hidden-form');
            signupForm.classList.add('active-form');
            loginForm.classList.remove('active-form');
            loginForm.classList.add('hidden-form');
        }
    }
}

// B. Dashboard: Switch Tabs (Home / Assets / Robo)
function showSection(sectionId) {
    // Hide all sections
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(sec => {
        sec.classList.remove('active-section');
        sec.classList.add('hidden-section');
    });

    // Show selected section
    const activeSec = document.getElementById(sectionId);
    if(activeSec) {
        activeSec.classList.remove('hidden-section');
        activeSec.classList.add('active-section');
    }

    // Update Sidebar highlighting
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => item.classList.remove('active'));
    
    // Highlight the clicked button (via event bubbling or manual ID check)
    // Simple fix: find the li that contains the clicked element or is the clicked element
    let current = event.target;
    while(current && !current.classList.contains('nav-item')) {
        current = current.parentElement;
    }
    if(current) current.classList.add('active');
}

/* =========================================
   2. DOM LOAD LOGIC
   ========================================= */
document.addEventListener('DOMContentLoaded', function() {
    
    // --- LOGIN PAGE LOGIC ---
    const authForms = document.querySelectorAll('.auth-form');
    if (authForms.length > 0) {
        authForms.forEach(form => {
            form.addEventListener('submit', function(e) {
                e.preventDefault(); 
                const btn = this.querySelector('button');
                btn.innerText = "Processing...";
                btn.style.opacity = "0.7";
                setTimeout(() => {
                    window.location.href = "dashboard.html"; 
                }, 1500);
            });
        });
    }

    // --- DASHBOARD LOGIC (ROBO ADVISOR) ---
    const ctx = document.getElementById('allocationChart');
    if (ctx) {
        // Initialize Chart
        let portfolioChart = new Chart(ctx.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Safe Assets (Bonds/Gold)', 'Risky Assets (Stocks/Crypto)'],
                datasets: [{
                    data: [50, 50], 
                    backgroundColor: ['#2ecc71', '#e74c3c'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom' } }
            }
        });

        // Link Slider
        const slider = document.getElementById('stress-slider');
        const output = document.getElementById('stress-value');
        if(slider) {
            slider.oninput = function() { output.innerText = this.value; }
        }

        // Define Rebalance Function (Global Window Scope)
        window.updatePortfolio = async function() {
            const stressVal = parseFloat(document.getElementById('stress-slider').value);
            const riskVal = document.getElementById('risk-profile').value;
            const btn = document.getElementById('rebalance-btn');
            const stratName = document.getElementById('strat-name');
            const stratReason = document.getElementById('strat-reason');

            btn.innerText = "Analyzing...";
            btn.style.opacity = "0.7";

            try {
                // Connect to Python Backend
                const response = await fetch('http://127.0.0.1:8000/rebalance', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ stress_metric: stressVal, risk_profile: riskVal })
                });

                if (!response.ok) throw new Error("Backend Offline");
                const data = await response.json();

                // Update UI
                stratName.innerText = data.strategy_name;
                stratReason.innerText = data.reasoning;
                portfolioChart.data.datasets[0].data = [data.safe_allocation, data.risky_allocation];
                portfolioChart.update();

            } catch (error) {
                stratName.innerText = "Error: Backend Not Connected";
                stratName.style.color = "red";
                console.error(error);
            } finally {
                btn.innerText = "Run DRL Agent Rebalance";
                btn.style.opacity = "1";
            }
        };
    }
});