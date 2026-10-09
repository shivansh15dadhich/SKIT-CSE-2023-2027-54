from typing import List
from fastapi import FastAPI
from pydantic import BaseModel, Field

from nlp_pipeline import analyze_text
from trend_engine import build_trend_report

app = FastAPI(
    title="MindSense NLP API",
    version="1.0.0",
    description=(
        "Non-clinical NLP screening support. It identifies language/sentiment "
        "trends and does not diagnose mental-health conditions."
    ),
)


class TextRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=10000)


class TrendItem(BaseModel):
    text: str = Field(..., min_length=1, max_length=10000)


class TrendRequest(BaseModel):
    entries: List[TrendItem]


@app.get("/")
def home():
    return {
        "project": "MindSense",
        "module": "NLP processing",
        "status": "running",
        "disclaimer": "Non-clinical trend screening only; not a diagnosis.",
    }


@app.post("/analyze")
def analyze(request: TextRequest):
    return analyze_text(request.text)


@app.post("/trend")
def trend(request: TrendRequest):
    rows = []
    for index, item in enumerate(request.entries, start=1):
        rows.append({
            "entry_id": index,
            "text": item.text,
            **analyze_text(item.text),
        })

    return build_trend_report(rows)
