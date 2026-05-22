---
title: "Inox token-efficiency for LLMs — open hypothesis"
subtitle: "Does concatenative composition + named values + multi-dialect dispatch align Inox with autoregressive code generation?"
author: "Jean Hugues Noël Robert, baron Mariani"
affiliation: "Institut Mariani / C.O.R.S.I.C.A."
status: "working hypothesis, accumulating evidence"
date: "2026-05-23"
license: "CC BY-SA 4.0"
canonical_url: https://github.com/JeanHuguesRobert/Inox/blob/master/research/llm_token_efficiency.md
---

# Inox token-efficiency for LLMs — open hypothesis

> This is a **living research note**, not a paper. The "Evidence log"
> at the bottom is the heart of the document: as we use Inox in
> practice, we date-stamp observations that bear on the hypothesis.
> Some support it, some refute it; both are kept. Promotion to a real
> paper happens only when the accumulated evidence is strong enough
> for empirical claims to be defensible.

## Hypothesis

Inox was designed in 2021 — before the LLM era — to be efficient for
both humans and machines. The unit of work for an LLM is the **token**.
We conjecture that Inox's design properties — concatenative composition,
named values, multiple dialects, lightweight syntax — give it
non-trivial token-efficiency advantages for LLM-mediated code
generation, comprehension, and execution, compared with mainstream
languages (Python, JavaScript, Rust) and with denser ancestors (Forth,
APL).

Two distinct claims, to be kept separate:

1. **Compression claim**: an Inox program for a given semantic task
   takes fewer tokens (under modern BPE tokenizers like
   `tiktoken/cl100k_base`, Claude's, Llama's) than equivalent code in
   Python/JS/etc.
2. **Alignment claim**: independent of raw token count, Inox's
   concatenative + named-value structure aligns better with
   autoregressive generation than mainstream languages — same number
   of tokens, but each is more locally meaningful, easier for the
   model to predict correctly.

The second claim is the more interesting one if it holds — it concerns
**predictability**, not just compression.

## Why this could matter

- **Context-window economy**: more useful code per fixed context.
- **Lower per-token compute**: smaller programs = faster generation =
  cheaper.
- **Better success rate** on code-generation benchmarks if the
  alignment claim holds (LLMs make fewer mistakes per logical step).
- **A language designed in 2021 turning out, by accident or
  prescience, to be well-suited to a paradigm that did not yet exist**
  — that is a story worth telling regardless of which way the evidence
  falls.

## Steelman: where Inox should win

1. **Named values as inline documentation.** `x:3` carries both
   identity and value in tokens. No separate `var x = 3 // x is the
   counter` overhead. The semantic intent is the syntax.
2. **No `return`, no `self.`, no `result =;`** — pipeline composition
   passes state through the stack. For chained-method code (`obj
   .step1 .step2 .step3`) versus `obj.step1().step2().step3()`, Inox
   saves the parens and the explicit dot-calls become uniform.
3. **Concatenative composition aligns with autoregressive generation.**
   Each token has local semantics that modifies the data stack. The
   LLM does not need to look far back to know what `+` means *here*;
   it operates on whatever is currently on top. Generation order =
   evaluation order. Modern languages have non-local dependencies
   (closures, generics, type inference) the model must track.
4. **Late binding + missing-verb** lets the model write code that
   doesn't immediately resolve. The runtime falls back at call time.
   This is fault-tolerant generation: the model can write before the
   referent exists.
5. **Suffix conventions (`?`, `!`, `/`, `.foo`)** carry meaning in one
   token. `even?` is "is even" in one token (assuming the tokenizer
   doesn't split it).

## Honest counter-arguments

1. **BPE tokenizers were not trained on Inox.** `>x`, `$x`,
   `text.join`, `?dup` are unlikely to be single tokens under
   cl100k_base. They likely split awkwardly (`>` + `x`, `text` + `.`
   + `join`). Surface density does not translate to tokenized
   density without evidence.
2. **Stack manipulation is cognitively hard.** Humans and LLMs
   alike struggle with `swap swap rot dup`. Mainstream languages
   abandoned the stack model for good reasons. APL and J are even
   denser and yet have not won the LLM era despite being short.
3. **Multi-dialect fragments training signal.** `1 1 +` (postfix), `1
   + 1` (infix), and `+( 1, 1 )` (prefix) are three ways to say one
   thing. For an LLM, this is fewer samples per surface form. Inox
   trades on humans being free to choose; LLMs may not have the
   diversity of training data needed.
4. **No body of Inox code in the training corpus.** This is the
   chicken-and-egg of any new language. Without a critical mass of
   Inox in pretraining, LLMs will reach to Python idioms when asked
   to write Inox.
5. **The "alignment claim" needs care.** Concatenative composition is
   structurally similar to autoregressive token generation, but
   "similar" is not "same". The LLM also needs to track the stack
   *state* — which is non-local in its own way. The advantage may be
   smaller than the structural intuition suggests.

## Methodology sketch (when the evidence is ready)

A serious paper would need:

1. **Translate a benchmark** (HumanEval, MBPP, or BigCodeBench
   subset) to Inox. ~50-200 problems. Verify each translated
   problem runs correctly under the Inox runtime.
2. **Measure tokens** under multiple tokenizers: tiktoken
   `cl100k_base` and `o200k_base`, Claude's, Llama-3's. Compare per
   problem against Python, JavaScript, Forth, Haskell.
3. **Measure LLM success rate** on completion tasks: zero-shot,
   few-shot, "explain then code". Multiple models (one closed
   frontier, one open). Same prompt structure across languages.
4. **Analyse failures.** Where Inox loses, why? Tokenizer? Lack of
   training data? Genuine cognitive difficulty of the stack model?
5. **Carve-outs.** Specific Inox features (named values, suffix
   conventions, dialect freedom) measured in isolation if possible
   — ablation-style.

A workshop paper could land on (1) + (2) + a small (3). A full paper
needs all five plus an honest take on what mainstream language
designers should learn (if anything).

## Status

- **Hypothesis stated, not tested.**
- **No empirical measurements yet.**
- **Open for evidence in either direction.**

## Evidence log

This section accumulates observations encountered while working on
Inox, in date order. Each entry: date, what was observed, which claim
it bears on, and a one-line interpretation. Entries are factual; the
interpretation may be revised later.

---

*(2026-05-23, initial)* Hypothesis posed in conversation. Factorial
example: Python ~22 tokens (rough word-count), Forth ~17, Inox ~23,
Haskell ~17. **Inox is not dense at the trivial-example level.**
Implications: the "compression claim" probably needs to be evaluated
on non-trivial examples (state-heavy, OO, method-chaining) where
Inox's named-values and implicit-stack advantages show. Trivial
arithmetic is a poor benchmark.

*(2026-05-23, initial)* During the l9.nox debug session, the
multi-dialect feature did not feel like an LLM advantage — when the
runtime gave us `metaclass/make{ ... }`, the agent (Claude) reached
for the prefix expansion (`/metaclass make{`) to reason about it,
then back to the concise form for writing. That round-trip costs
tokens. **The multi-dialect freedom may be a humans-only feature**
unless models are trained heavily on Inox.

---

*Add new entries here as observations accumulate.*
