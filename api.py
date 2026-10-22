"""FastAPI endpoints for the MindSense NLP module."""
from typing import List

from fastapi import FastAPI
from pydantic import BaseModel, Field, field_validator

from nlp_pipeline import analyze_text
from trend_engine import build_trend_report

app = FastAPI(
    title="MindSense NLP API",
    version="1.1.0",
    description=(
        "Non-clinical NLP support for language and sentiment trends. "
        "It does not diagnose anxiety, depression, or other conditions."
    ),
)


class TextRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=10000)

    @field_validator("text")
    @classmethod
    def text_must_contain_words(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Text must not be blank.")
        return value


class TrendItem(BaseModel):
    text: str = Field(..., min_length=1, max_length=10000)

    @field_validator("text")
    @classmethod
    def text_must_contain_words(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Text must not be blank.")
        return value


class TrendRequest(BaseModel):
    entries: List[TrendItem] = Field(..., min_length=2, max_length=100)


@app.get("/")
def home():
    return {
        "project": "MindSense",
        "module": "NLP processing",
        "version": "1.1.0",
        "status": "running",
        "disclaimer": "Non-clinical trend screening only; not a diagnosis.",
    }


@app.post("/analyze")
def analyze(request: TextRequest):
    return analyze_text(request.text)


@app.post("/trend")
def trend(request: TrendRequest):
    rows = [
        {"entry_id": index, "text": item.text, **analyze_text(item.text)}
        for index, item in enumerate(request.entries, start=1)
    ]
    return build_trend_report(rows)
