import streamlit as st
from datetime import date
from nlp_pipeline import analyze_text
from trend_engine import build_trend_report

st.set_page_config(page_title="MindSense NLP Module", page_icon="🧠", layout="wide")

st.title("🧠 MindSense — NLP Screening Module")
st.caption(
    "Non-clinical screening support only. This tool detects language/sentiment trends; "
    "it does not diagnose anxiety, depression, or any other condition."
)

tab1, tab2 = st.tabs(["Single Text Analysis", "Trend Analysis"])

with tab1:
    st.subheader("Journal / Message Analysis")
    text = st.text_area(
        "Enter a journal entry or message",
        height=180,
        placeholder="Example: I have been feeling low lately and I don't enjoy things as much as before."
    )

    if st.button("Analyze Text", type="primary"):
        if not text.strip():
            st.warning("Please enter some text.")
        else:
            result = analyze_text(text)

            c1, c2, c3 = st.columns(3)
            c1.metric("Sentiment", result["sentiment_label"])
            c2.metric("Negative Score", f'{result["negative_score"]:.2f}')
            c3.metric("Text Risk Signal", result["risk_level"])

            st.write("### NLP Features")
            st.json(result)

with tab2:
    st.subheader("Trend-based Analysis")
    st.write(
        "Paste one journal/message per line. The module treats the lines as "
        "consecutive observations."
    )

    entries = st.text_area(
        "Entries",
        height=260,
        placeholder=(
            "I had a good day today.\n"
            "Work was stressful and I felt tired.\n"
            "I have been feeling down for several days."
        ),
    )

    if st.button("Build Trend Report"):
        lines = [x.strip() for x in entries.splitlines() if x.strip()]
        if len(lines) < 2:
            st.warning("Enter at least 2 entries to calculate a trend.")
        else:
            rows = []
            for i, text in enumerate(lines):
                result = analyze_text(text)
                rows.append({
                    "date": date.today().isoformat(),
                    "entry_id": i + 1,
                    "text": text,
                    **result
                })

            report = build_trend_report(rows)

            c1, c2, c3 = st.columns(3)
            c1.metric("Overall Risk Signal", report["overall_risk_level"])
            c2.metric("Negative Trend", report["negative_trend"])
            c3.metric("Recent Negative Rate", f'{report["recent_negative_rate"]:.0%}')

            st.write("### Trend Summary")
            st.info(report["summary"])

            st.write("### Personalized Next Steps")
            for suggestion in report["suggestions"]:
                st.write(f"- {suggestion}")

            st.write("### Observation Table")
            st.dataframe(rows, use_container_width=True)

st.divider()
st.caption(
    "Safety note: MindSense is intended as a non-clinical trend-screening aid. "
    "If someone is in immediate danger or may hurt themselves or others, contact "
    "local emergency services or a qualified mental-health professional."
)
