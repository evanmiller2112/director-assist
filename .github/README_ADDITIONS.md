# Suggested README Additions

Add these sections to your main README.md to document the CI/CD process:

## Build & Deployment Status

```markdown
## Status

[![CI](https://github.com/evanmiller2112/director-assist/actions/workflows/ci.yml/badge.svg)](https://github.com/evanmiller2112/director-assist/actions/workflows/ci.yml)

## Live Site

**Production**: [director-assist](https://evanmiller2112.github.io/director-assist/)

Automatically deployed from the `main` branch via GitHub Pages.
```

## Development Workflow

```markdown
## Development

### Getting Started

```bash
npm install
npm run dev
```

### Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run check` - Type checking and Svelte validation
- `npm run lint` - Run ESLint

### Code Quality

All code is automatically checked on push:
- **Type Checking**: TypeScript and Svelte types
- **Linting**: ESLint for code style
- **Building**: Ensures production builds succeed

Changes to `main` branch are automatically deployed to production.
```

## Contributing

```markdown
## Contributing

### Making Changes

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Ensure code quality:
   ```bash
   npm run check
   npm run lint
   ```
4. Commit with descriptive messages
5. Push and create a pull request

### Pull Request Checks

All pull requests automatically run:
- TypeScript type checking
- ESLint linting
- Production build test

All checks must pass before merging.
```

## Releases

```markdown
## Releases

This project uses semantic versioning (v[MAJOR].[MINOR].[PATCH]).

### Creating a Release

1. Update version in `package.json`
2. Update `CHANGELOG.md` with release notes
3. Commit: `git commit -m "chore: bump version to vX.Y.Z"`
4. Tag: `git tag -a vX.Y.Z -m "Release vX.Y.Z"`
5. Push: `git push origin main && git push origin vX.Y.Z`

A GitHub Release will be created automatically with changelog.

See [Releases](https://github.com/evanmiller2112/director-assist/releases) for version history.
```
