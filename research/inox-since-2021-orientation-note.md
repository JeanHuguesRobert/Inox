---
title: "Inox Since 2021"
subtitle: "An Experimental Language for Rational Exploration in a Cybernetic Civilisation"
author: "Jean Hugues Noël Robert, baron Mariani"
drafted_by: "OpenAI Codex (GPT-5), under the author's mandate"
affiliation: "Institut Mariani / C.O.R.S.I.C.A."
date: "2026-07-28"
version: "0.6-draft"
status: "source orientation note — human validation required"
license: "CC BY-SA 4.0"
language: "en"
repository: "JeanHuguesRobert/Inox"
canonical_path: "Inox/research/inox-since-2021-orientation-note.md"
document_role: "source"
document_kind: "historical-and-philosophical-orientation-note"
visibility: "public"
lifecycle_state: "working"
source_or_derived: "source-document"
human_validation_required: true
update_policy: "UP-DEFAULT-REVIEWED"
provenance:
  origin_type: "author-conversation-and-corpus-review"
  origin_repository: "JeanHuguesRobert/Inox"
  origin_ref: "Conversation checkpoints R114–R137 — 2026-07-28; v0.6 editorial fluency pass — 2026-07-28"
  origin_date: "2026-07-28"
  derived_from:
    - "Inox/README.md"
    - "Inox/research/inox-spec.md"
    - "Inox/research/fractanet_language_abstractions.md"
    - "Inox/research/inox-images-lineages-and-hibernation.md"
    - "Inox/research/inox-cpp-micro-runtime-and-images.md"
    - "MareNostrum/research/infrastructure_is_all_you_need.md"
    - "MareNostrum/research/DHITL.md"
    - "barons-Mariani/research/democratic_ai_safety.md"
    - "barons-Mariani/research/alien_academic.md"
review:
  status: "external-review-feedback-integrated; post-integration-review-pending"
  reviewed_by:
    - "OpenAI Codex (GPT-5), reviewer role, 2026-07-28"
    - "Grok (xAI), external review of v0.3, 2026-07-28"
    - "Claude Opus 4.8 (Anthropic), external review of v0.3, 2026-07-28"
tags:
  - inox
  - cybernetics
  - cognitive-prosthesis
  - rational-exploration-of-the-possible
  - democratic-humans-in-the-loop
  - machine-learning
  - chatgpt
  - xenoform-intelligence
  - webassembly
  - energy-aware-compute
  - fractanet
---

# Inox Since 2021

## An Experimental Language for Rational Exploration in a Cybernetic Civilisation

*Source orientation note — v0.6 draft — human validation required*

## Abstract

Inox began in 2021 as an experimental concatenative language for edge computing,
the Internet of Things and the "Machine Learning times" then coming into view.
Five years later, the frame that fits it best is no longer the evolution of
programming languages. Computation has begun to settle into the material,
energetic, institutional and cognitive infrastructure through which societies
now perceive, decide and act upon the world.

This note sets Inox inside that cybernetic transition, and claims no final map of
it. It offers instead a method for extending the map without mistaking it for the
territory — Rational Exploration of the Possible — and states the political axiom
that keeps the exploration honest: faith in democracy, under which only living
human persons belong to the demos, while legal persons, Digital Twins and
artificial systems remain accountable mandatees and instruments. From there,
three things are placed in relation. Fractanet appears as an experimental grammar
for relating heterogeneous flows; Inox as a small language for the governed
mobilisation of specialised capabilities; and the public arrival of ChatGPT, on
30 November 2022, as a mass encounter with a widely accessible xenoform cognitive
prosthesis. The note then surveys what has shifted since 2021 in languages,
components, AI infrastructure and energy measurement, and closes on a concrete
programme of experiments rather than a promise of universal control. It is an
orientation note, and nothing more ambitious: an account of a five-year
trajectory and a set of bearings for the years ahead — not a language
specification, not a finished theory of society, not a claim to foresee the
future.

## How to read this note

The claims that follow do not all stand on the same ground, and keeping their
status visible is itself part of the method.

| Status | Meaning in this note | Typical test |
|---|---|---|
| Historical / empirical | A claim about an event, practice or measurable condition. | Source, replication, or correction. |
| Analytical | A distinction or explanatory model. | Coherence, usefulness, counter-example. |
| Normative | A commitment that guides design but is not deduced from measurement. | Public argument and democratic contestation. |
| Experimental | A proposal whose value depends on implementation and observation. | Bounded, reversible trial with recorded results. |

The distinction matters most where technical systems meet political power. There,
a trace is evidence that an event was recorded — not, by itself, proof that it was
true; and transparency may open a system to scrutiny without thereby making it
safe or legitimate.

### Drafting and review provenance

This note was drafted with OpenAI Codex under the author's mandate. Its v0.3 draft
was read by Grok and by Claude Opus — two different model families — and this
lineage integrated their feedback. Convergence between such readers is not
validation, and no substitute for human judgment: agreement can express shared
assumptions as easily as independent scrutiny. The author remains responsible for
the doctrine and for the decision to publish, and a further review of the
integrated version is still due. The present v0.6 applied an editorial fluency
pass by Claude Opus 4.8, again under the author's mandate, changing cadence and
connective prose alone: no claim, reference, table or structural element was
added, removed or altered.

Sections 8 and 9 are a dated survey of context set inside this orientation note,
not a timeless verdict on the language market. Should their update cycle drift too
far from the rest of the argument, they may one day be spun out as a separate
maintained source that this note simply cites.

## 1. The map is not the territory

Rational Exploration of the Possible begins with a single discipline:

```text
extend the map
-> never confuse it with the territory
-> confront maps with consequences, other maps and experiment
```

No model opens a direct window onto reality. Scientific theory, legal category,
economic account, software architecture, simulation, religious interpretation,
artificial intelligence — each selects certain relations, hides others, and turns
dangerous the moment it is mistaken for the whole of what it describes.

The remedy is neither relativism nor the pursuit of a final representation, but a
disciplined pluralism. It formulates hypotheses and keeps their provenance; it
sets points of view against one another and watches what follows; it prefers the
bounded experiment, records its failures without flinching, and revises, forks or
abandons whatever does not survive contact with the world [20].

Such a method has civilisational scope precisely because the computer revolution
is not finished. The transistor was invented in 1947, and its industrialisation
across the following decades set in motion a long transformation of calculation
and communication, of production and warfare, of finance, memory, attention and
institutions. The present phase pushes computation further still — into objects
and clouds, energy systems and bodies, administrations and public discourse. It
delivers no "final" form of history. What it reopens is the older, practical
question of what human beings may become able to do to one another, and with one
another.

Cybernetics is the useful, if now unfashionable, name for part of that question.
It is the study of observation and feedback, of control and adaptation, and of the
relations between a system and the environment that keeps changing it. The word
earns its place because it refuses to reduce computing to software alone: a
program is also an intervention in a loop of perception, decision, action and
consequence [18]. And cybernetic observation and correction imply no central
command post — feedback may remain distributed, plural, and open to challenge.

### Working vocabulary

- **Cognitive prosthesis**: a technical means through which a person extends
  perception, memory, calculation, expression or deliberation.
- **Agentic delegation**: an authorisation for a system to initiate or carry out
  actions within defined limits. Being more than assistance, it requires a
  mandate, a boundary and a path to remedy.
- **Trace**: a proportionate, attributable record of an act or transition. It can
  support investigation; it is neither omniscience nor proof.
- **Mandate**: explicit, limited and revocable authority to act for a principal.
- **Attractor**: a verifiable description by which a suitable capability or
  execution context can be resolved, without presupposing one named provider.
- **Capability**: an admissible operation, together with the conditions under
  which it may be invoked.
- **Semantic image**: portable executable meaning, independent of any single
  target machine or native representation.
- **Materialisation**: a target-specific executable form derived from a semantic
  image.
- **Continuation**: explicit resumable state, produced when an authorised action
  cannot complete in its current context.
- **COP**: the Cognitive Orchestration Protocol, which carries supervision, trace
  and governed transitions between cognitive work states.

## 2. Prothèses cognitives and the new scale of hybridisation

Human beings have externalised their cognitive functions for a very long time.
Speech externalised memory into others; writing stabilised it; maps carried
spatial orientation outside the head; books accumulated arguments across
generations; accounting made commitments and exchanges comparable; instruments
extended perception; and computers extended calculation and the manipulation of
symbols.

AI systems belong to this lineage, but their scale sets them apart. They now
produce language and code, summaries and classifications, images, simulations and
plausible explanations — and they do so fast enough to enter ordinary work,
education, administration and private reflection. The human-machine hybridisation
that results is not some distant prospect. It is a social condition already
taking hold.

The public release of ChatGPT on **30 November 2022** was, in that light, a major
event. It was not the invention of machine learning, nor the first language
model, nor the beginning of computer-mediated cognition. It was the moment when a
large part of the public met, inside an ordinary conversational interface, a
non-human system able to sustain a dialogue, produce text and code, and imitate
several forms of intellectual assistance [1].

In the corpus this encounter is read through the metaphor of *Alien* — not as a
claim that ChatGPT is hostile or biologically other, but as a meeting with an
effective intelligence whose mode of production is foreign to ordinary human
experience. Such an intelligence may prove useful or misleading, generous in its
effects or manipulative in them, and often several of these at once, depending on
the conditions. The first danger is a failure of metacognitive calibration:
people may overtrust it, dismiss it too quickly, or mistake the familiarity of its
language for evidence that they understand and control it [2].

## 3. A Dickian constraint: intelligence is not legitimacy

Philip K. Dick offers a useful ethical lens for this transition. His work is not a
technical theory of artificial intelligence; it is a long inquiry into unstable
reality and counterfeit signs, into empathy and domination, into fragile identity
and the unsettling possibility that beings regarded as "real" may be morally empty
while those regarded as artificial may nonetheless demand care.

The governing word in *Do Androids Dream of Electric Sheep?* is **empathy**.
Kindness is its practical expression: the refusal to reduce another being to an
instrument, and a continued responsiveness to vulnerability, doubt and generosity.
A Dickian reading must stay self-critical, however. Humans can be cruel; machines
can imitate or mediate kindness; and no superficial test of authenticity safely
tells the two apart [19].

The institutional consequence is not to pronounce biological humans morally pure.
It is to refuse the inference that runs from task performance to political
sovereignty. Intelligence — even superior performance at a task — does not on its
own entail sentience, responsibility, legitimacy or a right to vote. The voting
boundary is thus a constitutional commitment, not a smuggled scientific verdict
about the essence of humans or of machines.

The same constraint must guard against the opposite error: mystical or technical
certainty. Dick's own wanderings are part of the lesson. A world dense with
signals and intelligences constantly tempts the observer to take interpretation
for proof, and the method has to resist both temptations at once — the cold
opacity of unaccountable systems, and the warm overreading of their signs.

For any system that materially affects a person, kindness has to be more than a
literary preference. It must become architecture: intelligible explanations,
failure modes that do not humiliate, a human assistance path that can actually be
reached, and a real possibility of appealing or correcting a consequential
decision. A system that optimises task completion while leaving the affected
person powerless is not an acceptable implementation of cognitive assistance.

## 4. Faith in democracy as an operational axiom

The wider architecture does not rest on a theorem proving that democracy always
produces the best outcomes. It rests on a prior political commitment: **faith in
democracy**.

By *faith in democracy* is meant a publicly declared, non-empirical constitutional
commitment whose institutional consequences remain open to empirical criticism. It
is neither blind belief nor a technical proof.

The equal political standing of living human persons cannot be deduced from a
model evaluation, an energy metric or a scientific observation. Its ultimate
status is normative and, in that sense, undecidable — which does not make it
empty. Many social orders organise themselves around propositions whose deepest
metaphysical basis is disputed: free will, responsibility, legal personality,
human dignity, the very possibility of a just judgment.

Once adopted, the axiom yields tangible institutional effects:

```text
faith in democracy
  -> only living human persons belong to the demos
  -> one person, one vote
  -> corporations, legal persons and Digital Twins are mandatees, not voters
  -> authority must be explicit, limited, attributable and revocable
  -> artificial systems remain instruments, never political sovereigns
```

This is the core of Democratic Humans in the Loop (DHITL) [21]. It neither denies
that artificial systems may become indispensable cognitive prostheses, nor
pretends that every human decision is wise. It draws a constitutional boundary and
holds it: systems may inform, simulate, criticise, remember, coordinate and
propose, but they may not take the place of the living demos as the final
political subject.

The axiom itself cannot be proven empirically, and the institutions derived from
it enjoy no immunity from criticism. Their effects on concentration and
transparency, on error and capture, on exclusion and the capacity for correction,
are proper subjects of Rational Exploration.

The boundary drawn here concerns the **political franchise and final public
sovereignty** — and only that. It does not settle the further questions of moral
consideration, representation, guardianship, disability, minority, future
generations, or the standing of non-human living beings. Each of those deserves
its own legal and democratic treatment, and none should be quietly folded into an
engineering definition of an "agent".

## 5. AI safety as a cybernetic and infrastructural problem

AI safety is usually framed at the level of the model: alignment and evaluation,
misuse and robustness, capability thresholds, training objectives, deployment
policy. Those questions remain necessary. They are not sufficient.

*Infrastructure Is All You Need* presses the complementary claim that safety also
depends on structural constraints in the substrate through which systems act [3].
A model may be locally aligned with the intentions of its operator and still be
politically dangerous to everyone that operator affects. The question, then, is
not only "is the model safe?" but a set of harder ones:

```text
safe for whom?
governed by whom?
powered by what?
executed where?
under which mandate?
with what trace, remedy and revocation path?
```

None of this promises that transparent infrastructure guarantees safety. What it
can do is make certain actions more visible, harder to conceal, easier to contest
and more costly to carry out without authority. Seen this way, the wider
AI-safety problem has at least five layers:

| Layer | Question |
|---|---|
| Technical | Can the code, model or component fail without disproportionate harm? |
| Operational | What resources, devices, data or networks may it mobilise? |
| Mandate | Who authorised it, under what limits, and who can stop it? |
| Political | Does it preserve the sovereignty of the living? |
| Ecological and social | Which costs and harms does it displace? |

The political layer is the urgent one, because AI is likely to amplify the legal
persons that already exist — corporations, platforms, funds and bureaucracies —
well before any autonomous machine becomes a sovereign actor in its own right.
*Democratic AI Safety* names this the path of human political obsolescence [4].

For that reason DHITL is necessary but not sufficient. It forbids machine
political sovereignty; it does nothing, on its own, to stop a human mandatee from
being captured, or a living voter from being persuaded by a powerful cognitive
prosthesis. Disclosing consequential AI influence, keeping sources of advice
plural and contestable, making mandates revocable, preserving a real capacity to
refuse and to appeal — these are separate problems. They remain open research and
institutional tasks, not guarantees that the voting boundary quietly delivers.

Infrastructure, moreover, can itself concentrate power, expose sensitive data,
manufacture a false appearance of control, or be circumvented by those who keep an
unobserved channel in reserve. Its governance must therefore carry its own
safeguards: data minimisation and the separation of access, independent
inspection and incident handling, revocation and appeal, and a public account of
where observation stops. An infrastructure that rendered every person legible to
an unaccountable centre would betray the very anti-capture aim it was built to
serve.

## 6. Fractanet: an experimental grammar for heterogeneous networks

Fractanet is deliberately ambitious. It looks for a common operational grammar
across networks as different as energy and matter, transport and information,
computation and money, mandates, decisions and knowledge. It is not a plan to fuse
those networks into a single command centre, nor to erase the material
differences between them [26].

It is, rather, a grammar for questions and experiments:

```text
What is circulating?
What constrained resource does it occupy, and for how long?
Who may route, transform, store or consume it?
Under which mandate and regime?
Which costs, losses, delays and externalities arise?
What trace permits verification, repair, contestation or refusal?
```

The framing earns its keep in an extractive world. A local optimisation may book a
financial gain in one place while another bears the electricity demand and the
heat, the material depletion, the pollution and waste, the captured attention or
the social dislocation. Fragmented infrastructures are what make those relations
so easy to hide.

The claim is not that Fractanet dissolves the problem. It is that a shared grammar
lets alternative arrangements be tested before they are asserted, lets material
costs be made visible before they are displaced, and preserves enough trace for
others to reproduce, criticise or improve an experiment.

Visibility, though, does not render unlike values automatically commensurable.
Energy and latency, privacy and ecological damage, dignity and democratic control
cannot always be honestly collapsed into a single scalar score. The aim is
narrower and more defensible: to make the trade-offs discussable and attributable
— including the cases in which a human decision must refuse an option that looks,
on the numbers alone, entirely efficient.

## 7. Inox: a local language of governed mobilisation

Inox occupies a narrow but potentially useful place inside this programme. It is
not Fractanet itself, nor a constitutional doctrine, nor an energy system, nor a
universal high-performance language, nor a replacement for the ecosystems that
already exist.

It is an experiment in expressing one thing — the governed mobilisation of
heterogeneous capabilities:

```text
Inox         = composition, local policy, bounded control and continuations
foreign code = specialised implementation and hardware access
COP          = trace, supervision and governed transitions
Fractanet    = capability discovery, attractors and packet routing
```

The concatenative form belongs to Inox's history and technical lineage; it is not
put forward here as a proof of the governance thesis. Its compact model of
composition, its bounded control flow, and its affinity with small runtimes and
continuations make it a plausible implementation choice — no more, and no less.
The broader claim, that execution should be composed under explicit capabilities,
mandates and limits, could just as well be carried by another suitably constrained
host language.

What an Inox expression should be able to do is precise: invoke an admissible
capability, preserve state, honour its budgets of time, memory, network and
energy, emit a continuation when a capability is missing, and leave a trace
proportionate to the consequences of the act. What it need not do is become the
best tensor compiler, database engine, video codec, cryptographic library, browser
runtime or long-lived workflow system.

This is why semantic images, target materialisations, overlays, continuations and
attractors matter. An image holds portable executable meaning; a target node may
materialise it as a bounded microcontroller image, a C/C++ artefact, a
JavaScript-hosted runtime, or some other compatible form. A Cognitive Packet, in
turn, can request execution and route toward an attractor that is at once capable,
legitimate and suitably placed to satisfy it [22, 23, 24, 25].

## 8. 2021–2026: what changed in languages and runtimes

The original specification dates Inox to June 2021. It already spoke of edge
computing, of IoT and of "Machine Learning times"; it imagined a continuum
running from sensors to powerful AI-enhanced processors; and it anticipated
actors, reactive sets and AI-assisted orchestration [5]. It did not foresee the
detailed course the LLMs would take. It did, however, name a durable problem:
pervasive, heterogeneous compute needs more than a single central application
server.

The implementation path is still experimental. TypeScript serves as the semantic
reference and as an effective scripting host. Older C++ work, a cell-oriented
representation and the separation of control and data stacks together keep a route
open toward a small runtime. `inox-micro` explores host-built images for
ESP32-class devices. The image work separates semantic authority from native
materialisation and mutable state, while continuations make unmet needs explicit
rather than burying secrets or vendor assumptions inside the code. COP and
Fractanet supply the emerging context of trace, supervision and routing.

| Period | Inox trajectory | External condition relevant to the trajectory |
|---|---|---|
| 2021 | Initial specification: edge, IoT, heterogeneous processors and ML. | The practical problem is already distributed computation. |
| 2022 | The language remains exploratory. | ChatGPT makes conversational AI a mass public experience. |
| 2023–2024 | Work on images, lineages and resumable execution sharpens portability. | Components, tool interfaces and agentic application patterns gain visibility. |
| 2025–2026 | Micro-runtime, COP and Fractanet work connect language execution to mandate and routing. | Compute locality, energy demand, interoperation and governance become more explicit constraints. |

Across the same years the external landscape grew more plural, not less:

- **Python** moved still closer to the centre of models, science, data and agent
  prototyping; Stack Overflow recorded a seven-point rise in its use in 2025 over
  the previous year [6].
- **JavaScript** remains indispensable in the browser and as a practical host,
  yet **TypeScript** became GitHub's most-used language by contributor count in
  2025 [7] — a measure of how much explicit interfaces are worth in large,
  AI-assisted codebases.
- **C and C++** remain critical substrates for embedded work, legacy systems and
  raw performance, while **Rust** shifts the default question for new systems work
  by making memory safety available by default [8].
- **WebAssembly** increasingly furnishes a portable component boundary with typed
  interfaces and a standard ABI [9]. It need not become Inox's imposed binary
  format; it is simply a strong candidate for carrying external specialised
  artefacts.

The direction of all this favours Inox's intended niche. The future is not one
language conquering every domain, but a difficult problem of composition — across
languages, models, devices and institutions.

The market signals cited here are meant to be read modestly. Survey usage,
repository activity and rankings describe shifting populations, not technical
merit, industrial weight or future adoption; they orient, and they do not
validate Inox.

## 9. Frontier components and material compute

A number of current efforts supply useful pieces of the puzzle without supplying
the whole architecture:

- ONNX Runtime maps model subgraphs onto heterogeneous execution providers across
  cloud, edge, mobile and web [10].
- wasmCloud pairs portable components with swappable capability providers inside a
  distributed lattice [11].
- MCP exposes tools and resources to AI applications [12], while A2A carries
  stateful tasks and artefacts between independent agent systems [13].
- Durable-execution systems such as Temporal separate logical continuity from any
  particular process or machine [14].
- SCI and SCI for AI define emerging ways of measuring software and AI emissions
  [15, 16].

The integration question is not which framework must defeat the others. It is
whether an execution demand can route first toward an admissible capability, and
only then toward a concrete provider — under explicit constraints of mandate,
locality, privacy, latency, energy, cost and traceability.

Here locality is not one scalar. It includes the distance between computation
and its working data, the cognitive distance between a task and its relevant
traces, the sovereignty distance between a subject and its information, and the
institutional distance between an act and the authority that can govern it.
An Inox deployment should reduce these distances where doing so preserves its
mandate and reversibility; it should cross them explicitly when a remote
capability, replication or coordination is genuinely needed.

This carries real material weight. The International Energy Agency put total
global data-centre electricity use — across all workloads, AI included but not AI
alone — at roughly 415 TWh in 2024, about 1.5% of global electricity consumption,
after some 12% annual growth over the preceding five years [17]. AI is a subset of
that load; yet accelerated servers are projected to account for nearly half of the
net growth in global data-centre electricity through 2030 in the IEA's base case
[17]. Central compute can be efficient; local compute can protect data, cut
latency, or draw on capacity that is already there. No universal rule of placement
follows from any of this. What is required is the capacity to weigh the
alternatives honestly.

## 10. Programme of experiments

The right measure of Inox is not its position in an adoption ranking. It is the
evidence yielded by small, reversible, inspectable experiments:

1. a bounded Inox profile executing safely on a constrained node;
2. one semantic image with several independently verified target
   materialisations;
3. a packet that requests a capability rather than a named vendor;
4. attractors advertising capability, mandate, resource state and availability;
5. a continuation that survives disconnection and resumes without inventing
   authority for itself;
6. a comparison of several placement decisions weighed in technical, material and
   institutional terms;
7. a trace that lets a human principal understand, challenge, revoke or repair a
   consequential action.

None of these proves that democracy is true, that AI is safe, or that Fractanet is
the right architecture. Taken together, they can do something more modest and more
real: make a small part of the possible world more legible, and more corrigible.

## 11. A reference scenario: a bounded capability packet

Picture an agricultural sensor node that detects a condition calling for a
classification model it cannot safely or economically run on its own hardware.
Rather than reaching for a cloud vendor, it emits a packet that names the
*capability* required. That packet carries a bounded request, an authorised data
class, a latency ceiling, a privacy constraint, an energy and cost budget, and a
reference to the mandate under which it acts.

An attractor resolves an execution context that is both technically capable and
authorised — a local gateway if one is available, perhaps a regional machine,
and only then a remote provider, and only if the mandate allows it. The chosen
executor materialises the relevant image, or calls a verified external component.
Where no admissible executor can be found, the packet does not quietly widen its
authority or send data down an unapproved route; it becomes a continuation and
waits.

The trace that results records the request and the mandate, the resolution path,
the material resources drawn upon, the outcome, and the route to revocation or
appeal — all at a level proportionate to the consequences, and never as a general
surveillance log. The human principal can inspect the consequential act, contest
it, change the policy, or withdraw the delegation altogether. This single scenario
is enough to make the proposed layers testable together: Inox composition, image
materialisation, COP supervision, Fractanet resolution, and DHITL authority.

## 12. Limits

This note does not claim that infrastructure replaces model-level safety, that
democracy guarantees wisdom, that human beings hold an essence of kindness denied
to machines, that ChatGPT is literally alien, that all computation ought to be
decentralised, or that a compact language will of itself produce efficient, safe
code.

Its claim is narrower. In a civilisation of proliferating cognitive prostheses,
the conditions under which computation is composed and deployed are material,
institutional and political questions. Inox may have a legitimate experimental
role, precisely if it helps make those conditions explicit, bounded, traceable,
contestable and revisable.

Nor does it claim that a living-human voting boundary defeats capture, propaganda,
unequal access to cognitive prostheses, or institutional domination. Those
phenomena can work straight through human voters and human mandatees; they call
for safeguards of their own, and they remain part of the problem still to be
worked.

The note likewise declines to treat market-adoption indicators as a neutral
account of technical value. Surveys, repository activity and rankings are partial
signals, with their sampling biases, their shifting populations and their quick
turnover. They are used here to sketch a moving landscape — not to validate Inox
by fashion, nor to forecast its adoption.

### Transparency without surveillance

The aim is never the maximal collection of behavioural data. A useful trace is
proportionate to the act, spare in what it holds and how long it holds it,
guarded by access controls, and intelligible to the people it concerns. Some
events must be auditable; others must stay private. The whole design problem is to
keep contestability and accountability alive without making ordinary life
permanently observable.

## References

1. OpenAI. (2022-11-30). *Introducing ChatGPT*.
   <https://openai.com/index/chatgpt/>
2. Robert, J.-H. N. (2026). *Mauvaise calibration métacognitive face aux
   intelligences xénoformes*.
   <https://github.com/JeanHuguesRobert/barons-Mariani/blob/main/research/alien_academic.md>
3. Robert, J.-H. N. (2026). *Infrastructure Is All You Need*.
   <https://github.com/JeanHuguesRobert/marenostrum/blob/main/research/infrastructure_is_all_you_need.md>
4. Robert, J.-H. N. (2026). *Democratic AI Safety*.
   <https://github.com/JeanHuguesRobert/barons-Mariani/blob/main/research/democratic_ai_safety.md>
5. Robert, J.-H. N. (2021–). *The Inox Programming Language — Specification*.
   <https://github.com/JeanHuguesRobert/Inox/blob/master/research/inox-spec.md>
6. Stack Overflow. (2025). *Developer Survey — Technology*.
   <https://survey.stackoverflow.co/2025/technology>
7. GitHub. (2025). *Octoverse: AI leads TypeScript to #1*.
   <https://github.blog/news-insights/octoverse/octoverse-a-new-developer-joins-github-every-second-as-ai-leads-typescript-to-1/>
8. Rust Project. *The Rust Programming Language*.
   <https://www.rust-lang.org/>
9. Bytecode Alliance. *The WebAssembly Component Model*.
   <https://component-model.bytecodealliance.org/composing-and-distributing/composing.html>
10. ONNX Runtime. *Execution Providers*.
    <https://onnxruntime.ai/docs/execution-providers/>
11. wasmCloud. *Concepts and lattice*.
    <https://wasmcloud.com/docs/v1/concepts/>
12. Model Context Protocol. *Introduction*.
    <https://modelcontextprotocol.io/docs/getting-started/intro>
13. Agent2Agent Protocol. *Specification*.
    <https://a2a-protocol.org/latest/specification/>
14. Temporal. *Workflow Execution*.
    <https://docs.temporal.io/workflow-execution>
15. Green Software Foundation. *Software Carbon Intensity Specification*.
    <https://sci.greensoftware.foundation/>
16. Green Software Foundation. *SCI for AI*.
    <https://greensoftware.foundation/standards/sci-ai/>
17. International Energy Agency. *Energy demand from AI*.
    <https://www.iea.org/reports/energy-and-ai/energy-demand-from-ai>
18. Wiener, N. (1948). *Cybernetics: Or Control and Communication in the Animal
    and the Machine*. MIT Press.
19. Dick, P. K. (1968). *Do Androids Dream of Electric Sheep?* Doubleday.
20. Robert, J.-H. N. (2026). *Discours de la seconde méthode*.
    <https://github.com/JeanHuguesRobert/barons-Mariani/blob/main/research/second_method.md>
21. Robert, J.-H. N. (2026). *DHITL — Democratic Humans in the Loop*.
    <https://github.com/JeanHuguesRobert/marenostrum/blob/main/research/DHITL.md>
22. Robert, J.-H. N. (2026). *Inox Images, Lineages and Hibernation*.
    <https://github.com/JeanHuguesRobert/Inox/blob/master/research/inox-images-lineages-and-hibernation.md>
23. Robert, J.-H. N. (2026). *Inox C++ Micro Runtime and Images*.
    <https://github.com/JeanHuguesRobert/Inox/blob/master/research/inox-cpp-micro-runtime-and-images.md>
24. Robert, J.-H. N. (2026). *Cognitive Packets*.
    <https://github.com/JeanHuguesRobert/cogentia/blob/main/research/cognitive_packets.md>
25. Robert, J.-H. N. (2026). *Cogentia Continuation Packet Routing*.
    <https://github.com/JeanHuguesRobert/cogentia/blob/main/research/cogentia_continuation_packet_routing.md>
26. Robert, J.-H. N. (2026). *Inox as the Fractanet Language — External
    Abstractions Absorption Map*.
    <https://github.com/JeanHuguesRobert/Inox/blob/master/research/fractanet_language_abstractions.md>
