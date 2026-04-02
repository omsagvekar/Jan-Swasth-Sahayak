import csv
import json

input_csv = 'enhanced_healthcare_dataset.csv'
output_jsonl = 'enhanced_budget_training_data.jsonl'

print("Converting Enhanced Financial CSV into LLM conversational training data...")

with open(input_csv, mode='r') as infile, open(output_jsonl, mode='w') as outfile:
    reader = csv.DictReader(infile)
    
    for row in reader:
        try:
            state = row['State']
            year = row['Year']
            population = int(float(row['Population']))
            allocated = float(row['Allocated_Budget_Cr'])
            utilized = float(row['Utilized_Budget_Cr'])
            surplus_deficit = float(row['Surplus_Deficit_Cr'])
            
            # New Enhanced Metrics
            health_burden = float(row['Health_Burden_Score'])
            need_index = float(row['Need_Index'])
            poverty_rate = float(row['Poverty_Rate'])
            doctors_per_1000 = float(row['Doctors_per_1000'])
            disease_index = float(row['Disease_Prevalence_Index'])
            
            # Determine financial context
            if surplus_deficit > 0:
                status = f"a surplus of {surplus_deficit:.2f} Cr"
            elif surplus_deficit < 0:
                status = f"a critical deficit of {abs(surplus_deficit):.2f} Cr"
            else:
                status = "perfect budget utilization"

            # Formulate the "Prompt" (What the user asks)
            user_prompt = f"Provide a comprehensive financial and healthcare analysis for {state} in the year {year}."
            
            # Formulate the "Completion" (What the AI learns to output)
            # Notice how we weave all your new data points into a professional analytical paragraph.
            ai_response = (
                f"In {year}, {state} (Population: {population:,}) was allocated ₹{allocated:,.2f} Crores. "
                f"By year-end, the state utilized ₹{utilized:,.2f} Crores, resulting in {status}. "
                f"This financial outcome was driven by a complex Need Index of {need_index:.2f}. "
                f"Specifically, the state faced a Disease Prevalence Index of {disease_index:.2f} "
                f"and a poverty rate of {poverty_rate:.1f}%. Furthermore, healthcare delivery was constrained "
                f"by having only {doctors_per_1000:.2f} doctors per 1,000 residents, which directly impacted "
                f"their budget utilization efficiency."
            )

            # Create the standard LLM training format (ChatML format)
            training_example = {
                "messages": [
                    {"role": "system", "content": "You are Jan Swasthya Sahayak, a highly advanced AI financial architect for the Indian Ministry of Health. You provide deep, data-driven analysis of state healthcare budgets."},
                    {"role": "user", "content": user_prompt},
                    {"role": "assistant", "content": ai_response}
                ]
            }
            
            # Write to JSONL file
            outfile.write(json.dumps(training_example) + '\n')
            
        except KeyError as e:
            print(f"Skipping row due to missing column: {e}")
            continue

print(f"Success! Enhanced training data saved to {output_jsonl}. Your AI is going to be brilliant.")