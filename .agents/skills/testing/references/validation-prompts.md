# Validation Prompts

Use these prompts to check whether the skill guides agents toward the right tests.

## Prompt 1

Use `$testing` to add coverage for a new requirement: failed rows should remain selectable after a retry fails.

Expected direction:

- Prefer reducer test plus component behavior if UI changed.
- Assert the failed row returns to `Failed` and can be selected again.

## Prompt 2

Use `$testing` to review a test that waits 4 seconds after clicking `Retry selected`.

Expected direction:

- Flag the sleep.
- Replace with row-level visible state or disappearance of `Retrying`.
- Keep the concurrent behavior observable.

## Prompt 3

Use `$testing` to test that the activity menu closes when the user clicks outside it.

Expected direction:

- Use a component test.
- Open Activity, assert `Activity log` visible, click the trigger again or another visible control, assert the menu state is updated accordingly.

## Prompt 4

Use `$testing` to test a refactor that moves the theme sync script.

Expected direction:

- Keep a static architecture-oriented check.
- Assert `ThemeSyncScript` is still rendered from `app/layout.tsx`.
- Assert the script tag id still exists in `components/theme-sync-script.tsx`.
