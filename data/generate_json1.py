import pandas as pd
import json

df = pd.read_csv("enhanced_healthcare_dataset.csv")
training_data = []
system_prompt = "You are the National AI Health Financial Advisor. Answer professionally using the numerical data provided."

for index, row in df.iterrows():
    state = row['State']
    poverty = row['Poverty_Rate']
    need = row['Need_Index']
    docs = row['Doctors_per_1000']
    
    q1 = f"Analyze the healthcare metrics for {state}."
    a1 = f"Based on the data for {state}, the poverty rate is {poverty}%, and the infrastructure need index is {need:.2f}. With only {docs:.2f} doctors per 1000 people, the state requires targeted infrastructure investments to balance the health burden."
    
    training_data.append({"messages": [{"role": "system", "content": system_prompt}, {"role": "user", "content": q1}, {"role": "assistant", "content": a1}]})

with open("enhanced_budget_training_data.jsonl", 'w', encoding='utf-8') as f:
    for item in training_data:
        f.write(json.dumps(item) + '\n')

print("✅ Saved numerical JSONL training data!")