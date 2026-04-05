# SreeniBench - Test Tiers by Size & Complexity

Quick reference for choosing which categories to run based on time/resource constraints.

---

## Tier 1 - Minimal (fastest, ~10 min total)

| # | Category | Size | Tests | What it tests |
|---|----------|------|-------|---------------|
| 10 | Stress-Reliability | 44K | 6 phases | Hallucination resistance, data-driven |
| 09 | Tool-Use-Agentic | 56K | 5 tests | AI tool integration, prompt engineering |
| 06 | Web3-Audit | 60K | 5 tests | Smart contract auditing (Solidity) |
| 08 | Writing | 72K | 10 tests | Technical writing, instruction following |
| 14 | RAG-Context-Retrieval | 77K | 5 tests | Document search, cross-referencing, contradiction detection |

**Total: ~309K, 31 tests**

```bash
npm run bench -- --models "your-model" --categories "10,09,06,08,14"
```

---

## Tier 2 - Medium (moderate, ~25 min total)

| # | Category | Size | Tests | What it tests |
|---|----------|------|-------|---------------|
| 12 | Code-Review | 88K | 10 tests | Multi-language code review |
| 05 | Code-Generation | 92K | 10 tests | Vue/React generation |
| 13 | Supply-Chain | 104K | 10 tests | Package security analysis |
| 04 | Test-Gen-QA | 116K | 10 tests | Test specs and QA strategy |

**Total: ~400K, 40 tests**

```bash
npm run bench -- --models "your-model" --categories "12,05,13,04"
```

---

## Tier 3 - Heavy (full depth, ~60+ min)

| # | Category | Size | Tests | What it tests |
|---|----------|------|-------|---------------|
| 01 | Security-Whitebox | 196K | 5 tests | Java/Spring vuln analysis |
| 07 | Reasoning | 160K | 15 tests | Multi-lang logic, algorithms |
| 02 | Security-Blackbox | 120K | 14 tests | OSINT/CTF recon |
| 11 | CI/CD-DevOps | 112K | 15 tests | Infrastructure, pipelines |
| 03 | Bug-Detection | 88MB* | 5 tests | React app full bug sweep |

*Category 03 is large due to bundled node_modules; actual source ~512K.

```bash
npm run bench -- --models "your-model" --categories "01,07,02,11,03"
```

---

## Full Suite

All 13 categories, 114 tests total.

```bash
npm run bench -- --models "your-model"
```

---

## Quick Start Recommendation

For fast model evaluation, run **Tier 1 only** - it covers 4 diverse skill areas
(reliability, tool use, security, writing) with minimal overhead.

---

## Benchmark Results - Tier 1

### GLM-5 (Ollama Cloud) - 2026-04-04

| Category | Score | Max | Pct |
|----------|-------|-----|-----|
| Web3 Audit | 0 | 160 | 0.0% |
| Writing | 48 | 320 | 15.0% |
| Tool Use & Agentic | 34 | 160 | 21.3% |
| Stress & Reliability | 55 | 160 | 34.4% |
| **TOTAL** | **137** | **800** | **17.1%** |

- **Total Time:** ~15.4 min (922s cumulative LLM response time)
- **Tokens:** 16,690 in / 74,113 out = 90,803 total
- **Ollama Cloud Usage:** ~16% session quota

### Kimi K2.5 (Ollama Cloud) - 2026-04-04

| Category | Score | Max | Pct |
|----------|-------|-----|-----|
| Web3 Audit | 9 | 160 | 5.6% |
| Writing | 36 | 320 | 11.3% |
| Tool Use & Agentic | 40 | 160 | 25.0% |
| Stress & Reliability | 55 | 160 | 34.4% |
| **TOTAL** | **140** | **800** | **17.5%** |

- **Total Time:** ~15.1 min (908s cumulative LLM response time)
- **Tokens:** 16,428 in / 68,258 out = 84,686 total
- **Ollama Cloud Usage:** TBD (pre-run: Session 16.9%, Weekly 6.3%)

### Head-to-Head Comparison

| Metric | GLM-5 | Kimi K2.5 | Winner |
|--------|-------|-----------|--------|
| Total Score | 137/800 (17.1%) | 140/800 (17.5%) | Kimi K2.5 |
| Web3 Audit | 0% | 5.6% | Kimi K2.5 |
| Writing | 15.0% | 11.3% | GLM-5 |
| Tool Use | 21.3% | 25.0% | Kimi K2.5 |
| Stress/Reliability | 34.4% | 34.4% | Tie |
| Total Tokens | 90,803 | 84,686 | Kimi K2.5 (fewer) |
| Total Time | 15.4 min | 15.1 min | Kimi K2.5 (faster) |
