# retirement-calculator

A minimalist terminal-style retirement projection calculator built with Vite + React.

## Running Locally

```bash
npm install
npm run dev
```

## Building

```bash
npm run build
```

## How It Works

The calculator projects your retirement balance using compound interest:

1. Each year: apply return rate to existing balance
2. Add your annual contribution (income × savings rate)
3. Subtract any big purchases configured for that year
4. Repeat for each year in the projection

Advanced mode lets you adjust income/savings rate yearly and add one-time expenses.
