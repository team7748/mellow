# Speak Five-Completions Mission Design

## Goal

Increase the Home Speak/conversation mission when a learner listens through the final line of a conversation. The daily mission fills after five completed listening rounds. Repeating the same conversation in a new round counts again, while reaching the final line and then pressing the completion button in the same round counts only once.

## Confirmed Product Rules

- A listening round completes when the final conversation line becomes active and its audio starts.
- Each completed round adds one Speak activity event.
- The same conversation may be completed and counted more than once.
- Moving away from the final line and returning to it within the same round does not count again.
- Restarting the conversation starts a new round; reaching the final line again counts again.
- Pressing the completion/next button after the final line only navigates and does not add a second event for that round.
- The Home Speak mission target is five completions for the current day.
- Home progress is capped visually at `5/5`; additional valid completion events may still be stored.

## Chosen Approach

Use the existing `ConversationPlayer.onReachedLastLine` signal as the single activity-recording boundary for listening rounds. Keep navigation separate from activity recording so the final-line signal and the completion button cannot both score the same round.

Store every valid round as a distinct activity event. The activity summary counts today's `conversation_completed` events rather than distinct conversation IDs, allowing repeat completions of the same lesson to contribute independently.

## Component and Data Flow

1. `ConversationPlayer` automatically plays the active line.
2. When the active index reaches the final line, the player calls `onReachedLastLine` once for the current round.
3. `SpeakModePage` marks the conversation as completed in persistent Speak progress if it has not been marked before. This list remains unique because it represents lesson completion state, not the daily repetition count.
4. `SpeakModePage` records a new `conversation_completed` activity event for every completed round. The event uses the activity recorder's generated unique ID instead of the existing deterministic conversation-per-day ID.
5. The Home activity listener refreshes its summary from the ledger.
6. `summarizeLearningActivity` counts all of today's Speak completion events and converts that count to progress against a target of five.

The player's completion button continues to move to the next conversation or practice view but does not record another listening completion. Interactive-practice completion also does not create an extra listening-round event after the conversation has already been counted.

## Round Boundaries

`ConversationPlayer` keeps its existing once-per-round guard:

- The guard is reset when the conversation changes.
- The guard is also reset by the Restart control.
- Going backward and forward without restarting leaves the guard set.

This keeps repeated learning intentional and prevents accidental double counting caused by navigation within one pass.

## Activity Summary

The Speak mission target changes from one to five. Its completed value is the number of today's valid `conversation_completed` events in Speak mode, capped to five by the shared progress helper. Distinct conversation IDs are not used for this mission.

Daily-goal and streak behavior remain unchanged. Extra completion events beyond five remain available to those aggregate calculations even though the Speak mission bar stays full.

## Error Handling

- First-time persistent Speak progress is saved before its activity event is recorded.
- A repeated round for an already-completed conversation does not rewrite the unique completion list, but it still records a new activity event.
- Browser speech-autoplay errors remain non-fatal; reaching the active final line still completes the UI round after the player attempts playback.
- Existing activity-ledger validation and synchronization behavior remains unchanged.

## Testing and Verification

Add or update focused tests to prove:

1. Reaching the final line records one completion before navigation.
2. Pressing completion afterward does not record a second event in the same round.
3. Restarting and reaching the final line again records another event.
4. Repeating the same conversation produces distinct activity events.
5. The Home Speak mission reports `1/5` after one event and `5/5` after five events.
6. More than five events keeps the mission bar capped at 100%.
7. Existing Speak navigation and persistent completed-lesson behavior remain intact.

Completion requires fresh targeted tests, the full test suite, TypeScript production build, lint for every edited file, and `git diff --check`.

## Non-Goals

- Requiring speech-recognition confirmation or waiting for a browser speech `end` callback.
- Counting distinct lessons instead of completed rounds.
- Changing other Home mission targets.
- Changing the historical activity schema or deleting existing deterministic events.
- Altering the conversation UI beyond the round-reset behavior needed for accurate counting.
