# MindSense Member 2 NLP Module — Update 1.1.0

## Changes
- Made Hugging Face transformer sentiment optional and lazy-loaded. The default install is lighter and can run using VADER.
- Added a fallback lexicon sentiment calculation if the VADER lexicon cannot be downloaded.
- Preserved existing output keys such as `risk_level` and `overall_risk_level` for compatibility with the current UI/API.
- Added `language_negativity_signal`, `analysis_method`, and clearer handling for empty or very short text.
- Improved text cleanup so hashtag words are retained while URLs and social handles are removed.
- Improved trend aggregation with recent average score, entry count, and a more explicit small-sample caveat.
- Added API validation for blank text and trend requests with fewer than two entries.
- Improved UI descriptions and made the entry ordering explicit.
- Added unit tests for trend calculations.

## Important
These values are heuristic, non-clinical text signals. They are not validated medical or mental-health risk scores.
