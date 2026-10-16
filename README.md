# US Tariff Lookup (Desktop)

Offline US import-tariff lookup for **Windows, macOS and Linux** — HTS code search (English or 中文), stacked duties (MFN base + China Section 301 + global Section 301 + Section 232/338), MPF/HMF entry fees, and landed cost per unit. **No API key, no network calls: the versioned ruleset ships inside the app.**

Part of the [us-tariff-lookup](https://github.com/invoicetariff/us-tariff-lookup) family by [InvoiceTariff](https://invoicetariff.com) — the same deterministic engine powers the [web calculator](https://invoicetariff.com/tariff-calculator), the npm package, and the [browser extension](https://github.com/invoicetariff/us-tariff-lookup-extension).

## Downloads

Grab the latest installer for your platform from [Releases](https://github.com/invoicetariff/us-tariff-lookup-desktop/releases) or from the [download page](https://invoicetariff.com/download):

| Platform | File | Notes |
|---|---|---|
| macOS (Apple Silicon) | `US-Tariff-Lookup-<ver>-arm64.dmg` | macOS 11+ |
| macOS (Intel) | `US-Tariff-Lookup-<ver>-x64.dmg` | macOS 11+ |
| Windows | `US-Tariff-Lookup-Setup-<ver>.exe` | Windows 10+ x64 |
| Linux | `US-Tariff-Lookup-<ver>-x86_64.AppImage` | glibc x86_64 |

Builds are not code-signed yet — on first launch your OS may show a one-time warning:

- **macOS**: right-click the app → **Open** → Open (or `xattr -dr com.apple.quarantine /Applications/US\ Tariff\ Lookup.app`)
- **Windows (SmartScreen)**: *More info* → *Run anyway*
- **Linux**: `chmod +x` the AppImage, then run it

Every release ships a `SHA256SUMS.txt`; verify your download before running it.

## Features

- **Search 484 curated high-frequency HTS 8-digit codes** by code prefix, English description, or Chinese keywords
- **Stacked duty calculation**: MFN (USITC Column 1) + China Section 301 (Lists 2/3/4A + four-year review) + global Section 301 (60 country tiers) + Section 232 measures + MPF/HMF fees + landed cost
- **Transport-mode aware**: sea / air / express / postal (HMF applies to sea; postal ≤ $2,500 uses informal-entry flat fees)
- **Every rate line is traceable**: `legalBasis` + official source (USITC / USTR / CBP / Federal Register) — click through from the table
- **Bilingual UI** (English / 中文), follows your system language
- **Single-instance, sandboxed renderer** (context isolation on, no node integration in the UI)

## Data quality, honestly

Same ruleset as the npm package (v0.3.x): except the FY2027 fee table, most rate lines carry `sample`/`unverified` flags — **estimates for planning, pricing scenarios, and demos; not certified for production customs declarations.**

## Development

```bash
npm install
npm start           # run the app in dev mode
npm run dist        # build the current platform
npm run dist:mac    # dmg (arm64 + x64)
npm run dist:win    # NSIS installer (x64)
npm run dist:linux  # AppImage (x86_64)
```

The calculation engine is `us-tariff-lookup` (npm) — this app only adds the desktop shell, so results are byte-identical with the web calculator and the CLI. Update the engine with `npm update us-tariff-lookup` when the [ruleset](https://github.com/invoicetariff/us-tariff-rates-2026) moves.

## License

[MIT](LICENSE) · © 2026 InvoiceTariff
