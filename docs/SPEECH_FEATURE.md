# Speech Feature

## What It Does

The speech feature adds tap-to-listen pronunciation for English vocabulary and example sentences. It never autoplays audio. A learner must press a speak button before the browser reads text aloud.

## Why Web Speech API

This project uses the browser Web Speech API through `window.speechSynthesis` and `SpeechSynthesisUtterance` because it works without a backend, database, paid API, or audio file hosting. It keeps the MVP simple and makes pronunciation available directly in supported browsers.

## SpeakButton Usage

Use `SpeakButton` anywhere a future screen needs pronunciation, including Flashcard and Quiz screens.

```tsx
import { SpeakButton } from "../components/ui/SpeakButton"

<SpeakButton text="job" label="Listen to job" />
<SpeakButton text="I want this job." label="Listen to example" lang="en-GB" rate={0.9} />
```

Props:

- `text`: English text to speak.
- `label`: optional accessible label.
- `lang`: optional override, `en-US` or `en-GB`.
- `rate`: optional speed override.
- `className`: optional styling hook.

The component hides itself when speech synthesis is unsupported or when `text` is empty.

## Where Buttons Are Added

- Vocabulary List: next to the main vocabulary word in each card.
- Word Detail: next to the main vocabulary word.
- Word Detail daily/work/study contexts: next to each context example when that example exists.

## Speech Settings

Speech settings are stored in LocalStorage under `thai-english-vocab-speech-settings`.

Available accents:

- American English: `en-US`
- British English: `en-GB`

Available speeds:

- Slow: `0.75`
- Normal: `0.9`
- Fast: `1.05`

`SpeakButton` loads the latest saved settings when clicked, so changing settings affects later pronunciation without a page reload.

## Browser Limits

Support depends on the user's browser and operating system voices. Voice quality, available accents, and exact pronunciation can vary. Some browsers may not support speech synthesis at all, so the UI hides speak buttons when the API is unavailable.

## Future Improvements

- Add curated `.mp3` files for consistent pronunciation.
- Add an AI voice API later if the product needs higher quality voices.
- Add voice selection when browsers expose multiple English voices.
- Add speak buttons to Flashcard and Quiz using the same `SpeakButton` component.
