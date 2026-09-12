import json
from typing import Any, Dict, List
from groq import Groq
from app.config import settings


class LLMService:

    def __init__(self):

        if not settings.groq_api_key:
            raise ValueError(
                "GROQ_API_KEY is not configured."
            )

        self.client = Groq(
            api_key=settings.groq_api_key
        )

        self.model = settings.groq_model

    def generate_recommendation(
        self,
        user_context: Dict[str, Any],
        energy_analysis: Dict[str, Any],
        retrieved_knowledge: List[Dict[str, Any]],
        rule_recommendation: Dict[str, Any],
    ) -> Dict[str, Any]:

        knowledge_text = "\n\n".join(
            [
                f"SOURCE: {item['source']}\n"
                f"{item['content']}"
                for item in retrieved_knowledge
            ]
        )

        prompt = f"""
You are GridSight's renewable energy intelligence engine.

Your task is to analyze the current energy situation and provide a
detailed, practical recommendation.

Use ONLY the numerical values provided in the context.

Do not invent measurements, forecasts, weather conditions,
battery values, energy values, or costs.

The deterministic recommendation is the operational baseline.
You may explain it, add context, and provide more detailed actions,
but do not contradict the supplied system state.

========================
USER / SYSTEM CONTEXT
========================

{json.dumps(user_context, indent=2)}

========================
ENERGY ANALYSIS
========================

{json.dumps(energy_analysis, indent=2)}

========================
RULE-BASED RECOMMENDATION
========================

{json.dumps(rule_recommendation, indent=2)}

========================
RETRIEVED ENERGY KNOWLEDGE
========================

{knowledge_text}

========================
TASK
========================

Analyze:

1. Current energy balance.
2. Expected renewable generation.
3. Weather conditions affecting generation.
4. Battery/storage situation.
5. Potential grid dependency or surplus.
6. Important forecast periods.
7. The operational recommendation.

Return ONLY valid JSON in this format:

{{
    "risk_level": "low | medium | high",

    "summary": "Short executive summary",

    "current_situation": "Explain the current energy state",

    "forecast_analysis": "Explain important forecast patterns",

    "weather_analysis": "Explain how weather affects generation",

    "storage_analysis": "Explain the storage situation",

    "recommended_actions": [
        "Action 1",
        "Action 2",
        "Action 3"
    ],

    "reasoning": [
        "Reason 1",
        "Reason 2",
        "Reason 3"
    ],

    "knowledge_sources": [
        "source filename 1",
        "source filename 2"
    ]
}}

Keep the recommendation practical and understandable to an
energy operator.
"""

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are GridSight, an energy forecasting "
                        "and renewable-energy decision-support AI."
                    ),
                },
                {
                    "role": "user",
                    "content": prompt,
                },
            ],
            temperature=0.2,
            response_format={
                "type": "json_object"
            },
        )

        content = response.choices[0].message.content

        try:
            return json.loads(content)

        except json.JSONDecodeError:

            return {
                "risk_level": "unknown",
                "summary": content,
                "current_situation": "",
                "forecast_analysis": "",
                "weather_analysis": "",
                "storage_analysis": "",
                "recommended_actions": [],
                "reasoning": [],
                "knowledge_sources": [
                    item["source"]
                    for item in retrieved_knowledge
                ],
            }