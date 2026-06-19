# Contributing to Waktu+

Thank you for your interest in contributing to Waktu+. This project is a full-screen prayer times display for mosques and suraus in Malaysia.

## Before you start

- Read the [Code of Conduct](CODE_OF_CONDUCT.md).
- Search [existing issues](https://github.com/shahrulestar/waktuplus/issues) to avoid duplicates.
- For security issues, do **not** open a public issue. See [SECURITY.md](SECURITY.md).

## Ways to contribute

- Report bugs
- Suggest features or improvements
- Fix issues or improve documentation
- Improve translations (English / Bahasa Malaysia)
- Test on different browsers, TVs, and screen sizes

## Reporting bugs

Use the **Bug report** issue template and include:

- What you expected to happen
- What actually happened
- Browser, device, and screen size
- Prayer zone (if relevant)
- Steps to reproduce

Screenshots or screen recordings are helpful for display issues.

## Suggesting features

Use the **Feature request** issue template. Explain:

- The problem you are trying to solve
- Why it helps mosques, suraus, or display users
- Any alternatives you considered

Keep suggestions focused on the prayer time display experience.

## Pull requests

1. Fork the repository and create a branch from `main`.
2. Make focused changes. One logical change per pull request when possible.
3. Match existing code style (TypeScript, functional React components, existing naming patterns).
4. Do not commit secrets, API keys, tokens, or personal data.
5. Test your changes locally before opening a PR.
6. Write a clear PR description: what changed, why, and how to verify.

### Scope guidance

Waktu+ is intentionally focused on the prayer times display. Pull requests that add unrelated features (for example, Quran readers, calendars, or social features) are unlikely to be accepted unless discussed in an issue first.

### What not to include in commits

- `.env`, `.env.local`, `.dev.vars`, or any credential files
- Generated build output (`.next/`, `.open-next/`, `node_modules/`)
- Large unrelated refactors mixed with feature changes

## Translations

Display strings live in [`lib/translations.ts`](lib/translations.ts). When adding or changing copy:

- Update both `en` and `ms` entries
- Keep wording concise for on-screen display
- Use respectful, neutral language suitable for mosque/surau settings

## Questions

Open a [GitHub Discussion](https://github.com/shahrulestar/waktuplus/discussions) or issue if you are unsure whether a change fits the project scope.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
