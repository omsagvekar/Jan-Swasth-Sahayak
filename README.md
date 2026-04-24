# 🏥 Jan Swasthya Sahayak 
**An AI-Driven, Privacy-Preserving National Health Fund Allocation System**

![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688.svg)
![React](https://img.shields.io/badge/React-18.0+-61DAFB.svg)
![Machine Learning](https://img.shields.io/badge/ML-Scikit--Learn-F7931E.svg)
![AI](https://img.shields.io/badge/SLM-Qwen2.5--0.5B-purple.svg)

## 📌 Overview
**Jan Swasthya Sahayak** is a macroeconomic decision-support framework designed for the Indian Ministry of Health. It facilitates the equitable, data-driven distribution of public health budgets across 36 Indian States and Union Territories. 

To address the severe data sovereignty and "financial hallucination" risks associated with commercial Cloud LLMs, this project introduces a **Hybrid AI Architecture**. It strictly decouples deterministic financial calculations (handled by a Scikit-Learn Random Forest) from qualitative policy summarization (handled by an offline, locally hosted Small Language Model).

## ✨ Key Enterprise Features

* **💧 Waterfall Distribution Algorithm:** A deterministic allocation engine that distributes treasury funds based on a "Crisis-Weighted Multiplier" (Poverty × Need Index × Health Burden). It dynamically recycles surplus capital and mathematically prevents "money hoarding" during national deficits.
* **🛡️ The "Python Cage" Interceptor:** A hard-coded API routing guardrail that intercepts and neutralizes adversarial prompts. It prevents the local AI from hallucinating exact financial numbers, writing code, or breaking its strict administrative persona.
* **🎯 Goal-Seek Policy Simulator:** A scientifically accurate policy simulator. Instead of using "fake frontend math," users input target demographic goals (e.g., Target Poverty Rate, Doctors per 1000), and the React UI dynamically queries the backend ML model to predict the exact fiscal cost of that policy in ₹ Crores.
* **🔒 100% Offline Data Sovereignty:** Utilizes a highly optimized `Qwen2.5-0.5B-Instruct` model equipped with Low-Rank Adaptation (LoRA) weights via PEFT. It runs entirely on local consumer-grade RAM, ensuring no sensitive government demographic data is ever transmitted to a third-party API.
* **⚙️ Graceful Degradation (Fallback Engine):** If the host machine experiences memory constraints and the SLM fails to load, the FastAPI orchestration layer automatically routes qualitative requests to a deterministic, rule-based text generation script, ensuring zero system downtime.

## 🏗️ System Architecture

1. **Quantitative Layer:** `RandomForestRegressor` trained on 15 years of enhanced numerical demographic data.
2. **Algorithmic Layer:** Python-based Crisis-Weighted Proportional allocator with dynamic deficit/surplus handling.
3. **Qualitative Layer:** Hugging Face Transformers pipeline featuring a localized 0.5B SLM.
4. **Orchestration Layer:** FastAPI backend + React.js frontend with Dynamic Context Injection.

## 💻 Tech Stack
* **Frontend:** React.js, Tailwind CSS (UI/UX)
* **Backend:** Python, FastAPI, Uvicorn, Pandas
* **Machine Learning:** Scikit-Learn, NumPy, Joblib
* **Generative AI:** Hugging Face `transformers`, `peft`, PyTorch
* **Data Formatting:** `Intl.NumberFormat('en-IN')` for Indian Rupee styling.

## 🚀 Installation & Local Setup

### 1. Clone the Repository
```bash
git clone [https://github.com/your-username/jan-swasthya-sahayak.git](https://github.com/your-username/jan-swasthya-sahayak.git)
cd jan-swasthya-sahayak

2. Backend Setup (FastAPI & Machine Learning)
Open a terminal in the project root directory:

Bash
# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate

# Install required Python packages
pip install fastapi uvicorn pandas scikit-learn transformers peft torch joblib

# Generate the datasets and train the Machine Learning Model
python generate_data.py
python train_budget_model.py

# Start the FastAPI Server
uvicorn main:app --reload
The backend will now be running on http://localhost:8000

3. Frontend Setup (React)
Open a second terminal:

Bash
cd frontend-folder-name # Navigate to your React folder
npm install
npm run dev
The interactive dashboard will now be running on http://localhost:3000

💡 How to Use the System
Allocate Funds: Enter the Total National Treasury Budget (e.g., ₹ 400,000). Watch the Waterfall Algorithm distribute funds equitably. Try entering a deficit amount (e.g., ₹ 250,000) to see the states shift into Deficit Mode.

Simulate Policy: Open a state's profile and use the sliders to set a target Poverty Rate or Doctor-to-Patient ratio. The ML model will instantly calculate the projected budget required to achieve that goal.

Consult the AI: Open the National AI Chatbot. Ask it to summarize the health metrics for "Maharashtra" or "Bihar." (Try asking it for the "exact budget of Delhi" or to "tell a joke" to see the Python Cage interceptor in action!).

👨‍💻 Contributors
Om Sagvekar (Roll No: 23101B2001) - Information Technology (INFT B)

Sanjay Mahabal (Roll Mo: 23101B2002) - Information Technology (INFT B)

Aditya Chikane (Roll No: 23101B2003) - Information Technology (INFT B)

Vaishnavi Karape (Roll No : 23101B2007) - Information Technology (INFT B)

📄 License
This project is licensed under the MIT License - see the LICENSE file for details.
