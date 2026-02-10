# Contributing

Thanks for your interest in contributing to this project.

## How to Contribute

1. **Fork** the repository.
2. **Create** a feature branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make** your changes and commit with clear, descriptive messages.
4. **Push** to your fork and open a **Pull Request** against `main`.

## Guidelines

- Follow the existing code style and conventions.
- Write tests for new features and bug fixes.
- Keep PRs focused — one feature or fix per PR.
- Update documentation if your changes affect the public API.

## Development Setup

```bash
yarn install
cp env.example .env
# Fill in .env with your values
npx prisma generate
yarn dev
```

## Reporting Issues

Use [GitHub Issues](../../issues) to report bugs or request features. Include:

- A clear description of the problem or feature.
- Steps to reproduce (for bugs).
- Expected vs actual behavior.
- Environment details (Node version, OS, etc.).

## Code of Conduct

By participating, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).
