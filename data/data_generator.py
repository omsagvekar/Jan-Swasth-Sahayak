import csv
import random

states = [
    "Andaman & Nicobar", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", 
    "Chandigarh", "Chhattisgarh", "Dadra & Nagar Haveli", "Delhi", "Goa", 
    "Gujarat", "Haryana", "Himachal Pradesh", "Jammu & Kashmir", "Jharkhand", 
    "Karnataka", "Kerala", "Lakshadweep", "Madhya Pradesh", "Maharashtra", 
    "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry", 
    "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", 
    "Uttar Pradesh", "Uttarakhand", "West Bengal"
]

# Base population (approximate multipliers for realism)
base_populations = {state: random.randint(10, 200) * 1000000 for state in states} 
# Delhi/UP will be forced higher, Lakshadweep lower for realism
base_populations["Uttar Pradesh"] = 240000000
base_populations["Maharashtra"] = 125000000
base_populations["Lakshadweep"] = 64000

years = [2020, 2021, 2022, 2023, 2024]

with open('historical_state_budgets.csv', 'w', newline='') as file:
    writer = csv.writer(file)
    writer.writerow(["Year", "State", "Population", "Health_Burden_Score", "Allocated_Budget_Cr", "Utilized_Budget_Cr", "Utilization_Percentage", "Surplus_Deficit_Cr"])

    for year in years:
        for state in states:
            # 1. Population grows slightly each year
            pop = int(base_populations[state] * (1 + (0.01 * (year - 2020))))
            
            # 2. Health Burden (1 to 100). 2020/2021 were COVID years, so burden is randomly much higher
            if year in [2020, 2021]:
                burden = random.randint(60, 100)
            else:
                burden = random.randint(20, 70)
                
            # 3. Government allocates budget mostly based on population (The Flaw we are fixing!)
            allocated = int((pop / 100000) * random.uniform(1.5, 2.5))
            
            # 4. Actual Utilization depends on the Burden. 
            # If burden is high, they use it all and need more (Deficit). If low, they don't use it all (Surplus).
            if burden > 75:
                utilized = int(allocated * random.uniform(1.1, 1.4)) # Went over budget
            elif burden < 40:
                utilized = int(allocated * random.uniform(0.6, 0.85)) # Leftover money
            else:
                utilized = int(allocated * random.uniform(0.9, 1.05)) # Just right
                
            utilization_pct = round((utilized / allocated) * 100, 2)
            surplus_deficit = allocated - utilized # Positive means surplus, negative means deficit
            
            writer.writerow([year, state, pop, burden, allocated, utilized, utilization_pct, surplus_deficit])

print("Financial Data Generated! Check historical_state_budgets.csv")