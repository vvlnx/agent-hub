# Thesis Audit Layer and Open-source Attribution

## What Was Integrated

The project now includes a deterministic thesis-audit layer inspired by a public
supply-chain bottleneck research methodology from
[`muxuuu/serenity-skill`](https://github.com/muxuuu/serenity-skill).

The product UI intentionally uses neutral wording such as "Supply-chain Thesis Audit" and
"产业链论证复核". The goal is to present this as a product capability, not as a branded copy
of another project. Attribution is kept here and in exported evidence metadata.

This is not a runtime dependency on the GitHub skill. The implementation adapts the public
research workflow into this app's own TypeScript pipeline:

1. Rank scarce supply-chain layers before ranking companies.
2. Review candidate companies by chain position, scarcity score, evidence grade, and failure condition.
3. Separate research-only names from Bitget-executable stock-token names.
4. Keep the final trading decision under the existing Bitget tradability and backtest gates.

Source attribution:

- Repository: https://github.com/muxuuu/serenity-skill
- License: MIT
- Integrated form: methodology-inspired deterministic audit layer, not copied execution code.

## Where It Runs

The integration lives in:

- `lib/thesisAudit.ts`
- `lib/agent.ts`
- `app/page.tsx`
- `lib/mockData.ts`

The analysis flow is now:

```text
Industry input
-> ThroatScan industry inference
-> Supply-chain company map
-> News and macro evidence
-> Bitget stock-token evidence
-> Event-adjusted simulated decision
-> Bitget candle validation
-> thesis audit
-> UI explanation and evidence export
```

## Role In The Project

The thesis audit is not the core trading engine.

Its value is:

- It makes the app feel less like a generic stock picker and more like a research system.
- It explains whether the current bottleneck thesis is supported, neutral, or challenged.
- It exposes what could make the thesis wrong.
- It gives next evidence checks for filings, capacity, customers, orders, lead times, and substitution.
- It improves the competition demo because judges can see a clear research discipline before the simulated trade decision.

## Boundaries

The thesis-audit layer must not:

- override Bitget listing status;
- fabricate stock prices or K-line data;
- issue direct buy or sell commands;
- replace the verified Bitget backtest;
- claim complete market coverage without a complete public-company data source.

The output should be described as research support and thesis stress testing.

## Why This Helps Track 3

Track 3 rewards a real US stock tokenized trading problem with explainable simulated trading or backtesting evidence.

This integration helps by turning the product into:

```text
industry research -> scarce-layer thesis -> public-company map -> tradability filter -> simulated Bitget decision
```

That is easier to defend than a simple recommendation UI because the system shows:

- the industry logic;
- the company-chain position;
- the evidence quality;
- the failure conditions;
- whether the name can actually be traded on Bitget.
