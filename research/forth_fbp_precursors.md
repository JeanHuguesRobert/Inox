---
title: Two precursors of Inox and CPS — Charles H. Moore and J. Paul Morrison
date: 2026-11-13
status: working-paper
author: Jean Hugues Noël Robert, baron Mariani
license: CC BY-SA 4.0
language: en
---

# Two complementary intellectual debts

The existing tribute to **Charles H. “Chuck” Moore**, creator of Forth, remains in [`lib/forth.nox`](../lib/forth.nox). Inox's concatenative style, small primitives and extensibility owe an identifiable debt to Forth. This is an acknowledgment of the original work, not a claim of equivalence.

**J. Paul Rodker Morrison (1930s–2022)** developed the original Flow-Based Programming (FBP) approach in IBM's AMPS: autonomous processes with named ports, externally specified connections, Information Packets, bounded buffers, flow control, and explicit packet ownership/lifetime. Morrison's historical JSFBP implementation used Node fibers to preserve suspendable processes where pre-async/await JavaScript would otherwise require nested callbacks. This relates technically to the `l8` reactive-task lineage but does not establish direct personal influence.

These contributions operate at different architectural levels:

- **Forth / Inox:** local representation and execution of computation.
- **FBP:** asynchronous composition and flow between computations.
- **CPS / COP / Fractanet:** transport of cognitive continuations, context, responsibilities and governed effects through a wider network.

**Important unfinished borrowing:** FBP's bounded channels, backpressure, multi-port activation, deadlock handling and structured substreams deserve an explicit gap audit before new primitives are invented in Inox or COP.

See the [cross-repository historical study and mechanism audit](https://github.com/JeanHuguesRobert/cogentia/blob/main/research/fbp_forth_cps_lineage_and_gaps.md) and the [finite Store & Forward capacity packet](https://github.com/JeanHuguesRobert/FractaVolta/issues/33).

Primary reference: [J. Paul Morrison, Flow-Based Programming](https://www.jpaulmorrison.com/fbp/). His definition explicitly mentions bounded buffers and backpressure.
