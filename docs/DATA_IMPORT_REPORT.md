# Data Import Report

## Source

- File: `C:\Users\team7\Downloads\vocab_buddy_60_words_dataset.pdf`
- Imported into: `src/data/vocabulary.json`
- Import method: extracted text from PDF pages 3-8 with `pdfplumber`, then parsed each vocabulary row by source ID.

## Summary

- Converted words: 60
- Skipped rows: 0
- Duplicate words found: 0
- JSON validation: passed

## Counts By Scenario

- Job Interview: 20
- Customer Service: 20
- Online Selling: 20

## Counts By CEFR

- A1: 33
- A2: 23
- B1: 3
- B2: 1

## Duplicate Words

- None

## Skipped Rows

- None

## Missing Fields Filled With Empty Values

- commonMistake: 60 items
- contexts.daily: 60 items
- contexts.study: 60 items
- contexts.work: 60 items
- memoryTip: 60 items
- simpleMeaning: 60 items
- synonyms: 60 items

## Notes

- The PDF provides one primary business scenario per word: Job Interview, Customer Service, or Online Selling.
- The earlier web schema expects `daily`, `work`, and `study` contexts. Those fields were kept for compatibility and filled with empty strings when the PDF did not provide them.
- A scenario-specific context key was also added for the source scenario so the original example and Thai translation are preserved.
- `simpleMeaning`, `synonyms`, `commonMistake`, and `memoryTip` were not present in the PDF, so they were filled with empty values.
