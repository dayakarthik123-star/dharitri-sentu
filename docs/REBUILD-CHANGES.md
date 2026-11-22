# Dharitri Sentu rebuild update — 2026-10-29

## Changes in this package

- LandLocker file input patch retained: no dynamic `key` on the file input; selected filename/size badge remains visible.
- Cinematic introduction is restricted to the home route, so it cannot cover `/login`, `/signup`, provider callbacks, or direct links. Dismissal is remembered independently of server state; login also marks the intro as seen. Replay Intro clears the dismissal flag.
- Setu configuration accepts the original `SETU_DIGILOCKER_CLIENT_ID` and `SETU_DIGILOCKER_CLIENT_SECRET` names and the requested aliases `DIGILOCKER_CLIENT_ID` and `DIGILOCKER_CLIENT_SECRET`. The backend continues to send Setu's `x-client-id`, `x-client-secret`, and `x-product-instance-id` headers.
- Added translations for the Parcel Verification Matrix title, subtitle, headings, and actions in English, Assamese, and Hindi; locale JSON dictionaries have matching keys.
- Fixed the Parcel Verification Matrix layout: horizontal overflow is contained in a scrollable wrapper and the action column/link cannot collapse into a narrow clipped button.
- `.env.example` documents the accepted credential aliases and warns that `mock-digilocker-consent` is a local mock, not a live Setu authorization endpoint.

## Verification status

- `node --check server/index.mjs`: passed.
- Locale JSON parse and key parity: passed (293 keys in each locale).
- ZIP integrity: checked after packaging.
- `npm ci` did not complete within the available install window, so TypeScript/Vite production build and browser E2E tests could not be run in this environment.

## Setu authentication limitation

This code update standardizes variable names and request header mapping, but it cannot make an invalid provider-issued secret valid. A continuing `401 Invalid client secret` requires verifying the exact credentials issued for the same Setu DigiLocker product instance and environment, and confirming the provider's expected auth scheme. Do not commit credentials or put them in client-side `VITE_` variables.

## Translation limitation

The three locale dictionaries now have full key parity and the matrix was wired to translated keys. Some older page copy remains hardcoded in feature components, so this release should not be described as complete translation of every screen. A full string-by-string localization pass and native-language review remain required.
