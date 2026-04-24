import pandas as pd
import numpy as np

states = [
    "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar",
    "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa",
    "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka",
    "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
    "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim",
    "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
]

data = []
years = list(range(2010, 2025))

print("Generating clean numerical data...")

for i, state in enumerate(states):
    np.random.seed(i)
    # Realistic base populations (500k to 200M)
    base_pop = np.random.randint(500000, 200000000)
    base_poverty = np.random.uniform(10.0, 45.0)
    base_docs = np.random.uniform(0.3, 1.2)
    
    # FIX: Realistic Indian Budget Scaling (Population / 25000 = approx Crores)
    # E.g., 100M population = ~4000 Crore budget
    base_budget = base_pop / 25000.0 
    
    for year in years:
        year_offset = year - 2010
        pop = int(base_pop * (1.012 ** year_offset))
        poverty = max(2.0, base_poverty - (year_offset * 0.8) + np.random.normal(0, 1))
        docs = min(3.0, base_docs + (year_offset * 0.05) + np.random.normal(0, 0.05))
        gdp = 50000 * (1.07 ** year_offset) + np.random.randint(-5000, 5000)
        imr = max(5.0, 60.0 - (year_offset * 1.5) + np.random.normal(0, 2))
        
        health_burden = min(100, max(10, int((poverty * 1.5) + (imr * 0.5) - (docs * 10))))
        need_index = min(1.0, max(0.1, (health_burden / 100) + np.random.uniform(-0.1, 0.1)))
        
        allocated = int(base_budget * (1.08 ** year_offset))
        utilized = int(allocated * np.random.uniform(0.85, 1.05))
        surplus = allocated - utilized
        util_pct = round((utilized / allocated) * 100, 2)

        data.append({
            "Year": year,
            "State": state,
            "Population": pop,
            "Health_Burden_Score": health_burden,
            "Allocated_Budget_Cr": allocated,
            "Utilized_Budget_Cr": utilized,
            "Utilization_Percentage": util_pct,
            "Surplus_Deficit_Cr": surplus,
            "GDP_Per_Capita": round(gdp, 2),
            "Poverty_Rate": round(poverty, 2),
            "Hospital_Beds_per_1000": round(docs * 1.5, 2),
            "Doctors_per_1000": round(docs, 2),
            "Infant_Mortality_Rate": round(imr, 2),
            "Elderly_Population_Percentage": round(np.random.uniform(5.0, 12.0), 2),
            "Urban_Population_Percentage": round(np.random.uniform(20.0, 60.0), 2),
            "Disease_Prevalence_Index": round(np.random.uniform(50.0, 150.0), 2),
            "Health_Infra_Index": round(docs + np.random.uniform(0.2, 0.8), 2),
            "Need_Index": round(need_index, 2)
        })

pd.DataFrame(data).to_csv("enhanced_healthcare_dataset.csv", index=False)
print("✅ Clean Numerical Dataset Saved!")