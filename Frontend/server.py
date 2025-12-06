from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class Asset(BaseModel):
    name: str
    value: float
    category: str

class PortfolioRequest(BaseModel):
    assets: List[Asset] 

def analyze_portfolio(assets: List[Asset]):
    total_value = sum(a.value for a in assets)
    if total_value == 0: return 0.5, [] 

    weighted_risk_sum = 0
    breakdown = []
    
    for asset in assets:
        cat = asset.category.lower()
        if cat == 'crypto': asset_risk = 0.95
        elif cat == 'stock': asset_risk = 0.65
        elif cat == 'bond': asset_risk = 0.10
        else: asset_risk = 0.50
            
        allocation_pct = (asset.value / total_value)
        contribution = allocation_pct * asset_risk
        weighted_risk_sum += contribution

        breakdown.append({
            "name": asset.name,
            "category": asset.category,
            "value": asset.value,
            "allocation": round(allocation_pct * 100, 1),
            "risk_score": asset_risk,
            "contribution": round(contribution, 3)
        })

    breakdown.sort(key=lambda x: x['contribution'], reverse=True)
    return round(weighted_risk_sum, 2), breakdown

def generate_recommendations(stress_score, breakdown, total_value):
    recs = []
    if stress_score > 0.65:
        top_risk = breakdown[0] 
        sell_amount = top_risk['value'] * 0.20 
        recs.append({"action": "SELL", "asset": top_risk['name'], "amount": int(sell_amount), "reason": f"High risk contribution ({top_risk['contribution']}). Reduce exposure."})
        recs.append({"action": "BUY", "asset": "Gov Bond 2030", "amount": int(sell_amount), "reason": "Reallocate to safe assets."})
    elif stress_score < 0.35:
        buy_amount = total_value * 0.10 
        recs.append({"action": "BUY", "asset": "Reliance", "amount": int(buy_amount), "reason": "Portfolio too conservative. Add growth."})
    else:
        recs.append({"action": "HOLD", "asset": "Portfolio", "amount": 0, "reason": "Portfolio is balanced."})
    return recs

def get_strategy(stress_score):
    base_safe = 50 
    safety_adjustment = stress_score * 40
    final_safe = min(95, max(5, base_safe + safety_adjustment))
    final_risky = 100 - final_safe

    if stress_score > 0.65:
        reason = f"High Stress ({stress_score}). Immediate de-risking recommended."
        strat = "Defensive Hedge"
    elif stress_score < 0.35:
        reason = f"Low Stress ({stress_score}). Capital inefficient."
        strat = "Aggressive Growth"
    else:
        reason = f"Optimal Stress ({stress_score}). Maintaining yield."
        strat = "Balanced Diversification"

    return strat, reason, int(final_safe), int(final_risky)

@app.post("/rebalance")
async def rebalance_portfolio(data: PortfolioRequest):
    stress_score, breakdown_data = analyze_portfolio(data.assets)
    strat, reason, safe, risky = get_strategy(stress_score)
    total_val = sum(a.value for a in data.assets)
    recommendations = generate_recommendations(stress_score, breakdown_data, total_val)
    
    return {
        "strategy_name": strat,
        "reasoning": reason,
        "safe_allocation": safe,
        "risky_allocation": risky,
        "final_stress": stress_score,
        "breakdown": breakdown_data,
        "recommendations": recommendations 
    }
