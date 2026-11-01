# TrueRate · Lãi Suất Thật (mobile)

React Native (Expo) app for the TrueRate project (EXE101, Group 4 · IB1908): type four numbers from a loan contract and get the true yearly rate, the lender's licence status, a risk label, a plain-language explanation and your rights.

**Download APK (Android):** [TrueRate.apk](https://expo.dev/artifacts/eas/_7Jlk4-bmWNqfIbWqxAOF76x2O-Fu-Qf3c3tN5FUFBM.apk)

## Features

| User story | In the app |
|---|---|
| US-01/02 Enter loan numbers, clear errors | `CheckScreen` with per-field validation, one-time or monthly repayment |
| US-03 True APR, total cost, fee checklist, hidden-cost warning | `ResultScreen`: rate meter, 20%/100% reference costs, scenario check against the stated rate |
| US-04 Consent before any processing | `ConsentScreen` on first launch |
| US-05 Licence check | Exact match = licensed, near match = undetermined (copycat names never shown as licensed) |
| US-06 One risk label | Code-only labelling matrix (licence × rate × warning signs) |
| US-07 Plain explanation + next step | AI wording from the TrueRate backend; fixed template offline |
| US-08 Disclaimer on every result | Yes |
| US-09 Rights guide | On the result and in the Guide tab |
| US-11 Licensed lenders | `LendersScreen` with search |
| US-12 Share an anonymous result card | Share button (no lender name, no amounts) |
| US-16 Read a contract photo | Camera / gallery via `expo-image-picker`, read by the backend |
| Extra | Optional local history (off by default), instalment schedule, debt-to-income ratio |

All numbers and labels are decided by code in `src/engine` (ported from the Spring Boot backend's `core`, `license` and `risk` packages). The app works fully offline; AI only words the result.

## Structure

```
src/
  engine/      apr, validate, licence, risk, scenarios, explainer, analyze (pure JS, no UI)
  data/        licensed-lenders.json (DEMO list, not the official SBV list)
  api/         backend.js (optional: /api/analyze for AI wording, /api/ocr for photos)
  context/     AppContext (consent, settings, history; AsyncStorage)
  hooks/       useApp, useLoanCheck, useDebounce
  components/  ui (Card, Field, Button...), RiskBadge, RateMeter
  screens/     Consent, Check, Result, History, Lenders, Guide
  navigation/  Stack + bottom tabs
```

## Run

```bash
npm install
npx expo start        # press w for web, a for Android emulator, or scan the QR code with Expo Go
```

### Optional: AI explanation and photo reading

Run the backend (`EXE101/TrueRate`, `run.bat`) with its AI key in the backend's own `.env`, then create `.env` here:

```
EXPO_PUBLIC_API_URL=http://<your-computer-LAN-IP>:8080
```

The AI key never goes into the app.

## Build the APK

```bash
npx eas-cli build -p android --profile preview
```

The `preview` profile in `eas.json` produces an installable `.apk`.
