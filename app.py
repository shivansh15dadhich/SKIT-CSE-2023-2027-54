"""Streamlit interface for the MindSense NLP and trend module."""
from datetime import date

import streamlit as st

from nlp_pipeline import analyze_text
from trend_engine import build_trend_report

st.set_page_config(page_title="MindSense NLP Module", page_icon="🧠", layout="wide")

st.title("🧠 MindSense — NLP and Trend Module")
st.caption(
    "Non-clinical screening support. Text sentiment is an imperfect signal and "
    "must not be used to diagnose anxiety, depression, or any other condition."
)

with st.sidebar:
    st.subheader("About this module")
    st.write(
        "This module analyzes text sentiment and compares recent entries. "
        "It does not infer a clinical condition."
    )
    st.caption("Entries are processed locally by this app; do not enter identifying or highly sensitive details.")

tab1, tab2 = st.tabs(["Single Text Analysis", "Trend Analysis"])

with tab1:
    st.subheader("Journal / Message Analysis")
    text = st.text_area(
        "Enter a journal entry or message",
        height=180,
        placeholder="Example: Work felt stressful today, but talking to a friend helped.",
        max_chars=10000,
    )
    if st.button("Analyze Text", type="primary", key="analyze_single"):
        if not text.strip():
            st.warning("Please enter some text.")
        else:
            with st.spinner("Analyzing text..."):
                result = analyze_text(text)
            c1, c2, c3 = st.columns(3)
            c1.metric("Sentiment", result["sentiment_label"].title())
            c2.metric("Negative-language score", f'{result["negative_score"]:.2f}')
            c3.metric("Language signal", result["risk_level"])
            st.write("### Interpretable NLP output")
            st.write(f'**Analysis method:** `{result["analysis_method"]}`')
            st.write(f'**Transformer model used:** {"Yes" if result["transformer_used"] else "No"}')
            st.json(result)
            st.caption("A short text can be ambiguous. Do not interpret this result as a diagnosis.")

with tab2:
    st.subheader("Trend-based Analysis")
    st.write(
        "Enter one entry per line, ordered from oldest to newest. "
        "For a meaningful trend, use entries from different days rather than repeating one message."
    )
    entries = st.text_area(
        "Journal entries (oldest first)",
        height=260,
        placeholder=(
            "I enjoyed spending time outside today.\n"
            "Work was stressful and I felt tired.\n"
            "I have felt overwhelmed for a few days."
        ),
        max_chars=50000,
    )
    if st.button("Build Trend Report", key="build_trend"):
        lines = [line.strip() for line in entries.splitlines() if line.strip()]
        if len(lines) < 2:
            st.warning("Enter at least 2 non-empty entries to calculate a preliminary trend.")
        else:
            rows = []
            with st.spinner(f"Analyzing {len(lines)} entries..."):
                for index, entry in enumerate(lines, start=1):
                    result = analyze_text(entry)
                    rows.append({
                        "date": date.today().isoformat(),
                        "entry_id": index,
                        "text": entry,
                        **result,
                    })
            report = build_trend_report(rows)
            c1, c2, c3 = st.columns(3)
            c1.metric("Overall language trend signal", report["overall_risk_level"])
            c2.metric("Negative-language trend", report["negative_trend"])
            c3.metric("Recent high-signal rate", f'{report["recent_negative_rate"]:.0%}')
            st.info(report["summary"])
            st.write("### Personalized next steps")
            for suggestion in report["suggestions"]:
                st.markdown(f"- {suggestion}")
            with st.expander("View analyzed entries and numeric features"):
                st.dataframe(rows, use_container_width=True)
            with st.expander("View trend metrics"):
                st.json(report)

st.divider()
st.caption(
    "Safety note: MindSense is a non-clinical reflection aid, not a substitute for "
    "professional assessment. If someone is in immediate danger, contact local emergency "
    "services or a qualified professional."
)
