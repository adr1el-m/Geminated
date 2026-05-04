import os
from groq import Groq
from dotenv import load_dotenv
import json

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))
MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

async def classify_triage(symptoms: str, age: int = None, sex: str = None,
                           duration: str = None, conditions: list = None,
                           language: str = "English") -> dict:
    prompt = f"""
    You are a medical triage AI assistant for the Haliya platform. 
    Do NOT diagnose. Only classify urgency.
    Respond ONLY in valid JSON. 
    Language: {language}.

    Patient info:
    - Age: {age or "unknown"}
    - Sex: {sex or "unknown"}
    - Duration: {duration or "unknown"}
    - Pre-existing conditions: {", ".join(conditions) if conditions else "none"}
    - Symptoms: {symptoms}

    Return this exact JSON structure:
    {{
      "urgency_level": "self-care|see-doctor|go-to-er|call-emergency",
      "urgency_color": "green|yellow|orange|red",
      "urgency_score": <1-10 integer>,
      "explanation": "<2-3 plain sentences>",
      "recommended_actions": ["<action1>", "<action2>", "<action3>"],
      "warning_signs": ["<sign1>", "<sign2>"]
    }}
    """
    
    response = client.chat.completions.create(
        messages=[
            {
                "role": "user",
                "content": prompt,
            }
        ],
        model=MODEL,
        response_format={"type": "json_object"},
    )
    
    return json.loads(response.choices[0].message.content)
