---
title: "Test du critère Rossignol — Inox"
subtitle: "Un dispositif à plusieurs Rossignols superposés"
author: "Jean Hugues Noël Robert, baron Mariani"
affiliation: "Institut Mariani / C.O.R.S.I.C.A., 1 cours Paoli, F-20250 Corte, Corsica"
date: "2026-05-31"
status: "working-note — application locale d'un critère doctrinal v0.1"
version: "0.1"
license: "CC BY-SA 4.0"
ai_assisted_by:
  - "Claude — articulation 2026-05-31"
canonical_url: https://github.com/JeanHuguesRobert/Inox/blob/master/research/test_critere_rossignol_inox.md
last_stamped_at: 2026-06-01
---

# Test du critère Rossignol — Inox

## Un dispositif à plusieurs Rossignols superposés

## 0. Rappel et contexte

Le critère, posé dans [`barons-Mariani/research/stigmergie_sans_limite_haute.md §4.3`](https://github.com/JeanHuguesRobert/barons-Mariani/blob/main/research/stigmergie_sans_limite_haute.md) et reformulé en §6 du [test sur quatre dispositifs](https://github.com/JeanHuguesRobert/barons-Mariani/blob/main/research/test_critere_rossignol.md) :

> Un dispositif est un stabilisateur procédural valide s'il peut produire son **Rossignol** — un point d'attestation *exposable hors-cadre*, physique de préférence, cryptographique acceptable, métaphorique rejeté.

Inox est la couche *langage et runtime* du corpus (« perpendiculaire » dans le four-layer-stack — il sert les agents et nœuds de Fractanet, sans appartenir à un étage particulier). Le passer au crible révèle un cas que les quatre dispositifs précédents ne montraient pas : un dispositif a, en général, **plusieurs Rossignols superposés**, et la question pertinente n'est pas « a-t-il son Rossignol ? » mais « **quel est son Rossignol vivant le plus haut ?** »

---

## 1. La hiérarchie des Rossignols Inox

Inox a une architecture en couches. Chaque couche, prise isolément, peut produire son propre Rossignol — ou ne pas en produire.

| # | Couche | Rossignol concret | État actuel |
|---|---|---|---|
| 1 | Runtime TS/JS | `bin/inox.js` démarre, parse le bytecode, alimente la stack | ✅ vivant |
| 2 | Bootstrap | `lib/bootstrap.nox` se charge sans erreur (définitions de base : `while`, `until`, `immediate!`) | ✅ vivant |
| 3 | Forth core | `lib/forth.nox` se charge — vocabulaire concaténatif minimum | ✅ vivant |
| 4 | Stdlib | `lib/stdlib.nox` (gaps documentés : seul `integer.+` existe ; `-`, `*`, `<`, `<=` manquants) | ⚠️ partiel |
| 5 | Programmes-utilisateur simples | `examples/hello.nox` exécute, sort `"Hello from Inox!\n"` | ✅ vivant |
| 6 | Système OO de l9 | `lib/l9.nox` construit la metaclass — `/thing` ne descend qu'un niveau de la super-chain (cf [`inox_thing_multilevel_dispatch`](library_packets.md)) | ❌ cassé (refcount assert) |
| 7 | Self-hosting | un compilateur Inox écrit en Inox compilant Inox | ⚠️ aspirationnel |

L'auteur lui-même s'est arrêté à la transition (5)→(6) : l'OO de l9.nox est le mur. C'est documenté, daté, traçable — c'est en soi une donnée du test.

---

## 2. Quel est le Rossignol vivant le plus haut ?

Aujourd'hui, sans ambiguïté : **étage 5**. `hello.nox` *tourne*. La chaîne est complète, observable hors-cadre :

- le source `examples/hello.nox` est lisible (4 lignes, ASCII, dans le repo public) ;
- le binaire `bin/inox.js` est exécutable sur n'importe quelle machine avec Node ;
- la sortie `"Hello from Inox!\n"` est reproductible par un tiers étranger au projet ;
- aucune dépendance à l'auteur, au ChatGPT-du-jour, à un service propriétaire — git clone + `node bin/inox.js examples/hello.nox` suffit.

C'est le Rossignol au sens fort. Modeste (4 lignes), mesurable (un `==` byte-à-byte sur la sortie), vérifiable (tiers indépendant, machine quelconque).

L'étage 4 (stdlib partielle) et l'étage 6 (l9 OO cassé) sont des Rossignols **manquants** — pas falsifiés, mais à produire. Le critère ne disqualifie pas Inox ; il situe précisément où l'attestation se ferme et où elle s'ouvre.

---

## 3. Conséquence pour le critère général

Inox révèle un raffinement du critère qu'aucun des quatre dispositifs précédents n'avait fait apparaître. Pour les dispositifs *composés* (langages, frameworks, plateformes), le Rossignol n'est pas unique : il est un **spectre étagé**. La maturité s'évalue à la *frontière* — l'altitude à laquelle l'attestation cesse d'être garantie.

Reformulation candidate :

> Pour un dispositif composé, le Rossignol pertinent est **le plus haut artefact reproductible hors-cadre** que la pile actuelle peut produire. La progression du dispositif se mesure à la migration de cette frontière vers le haut.

Cette formulation rend Inox lisible : il a un Rossignol vivant à l'étage 5 ; faire monter la frontière vers l'étage 6 (l9 OO) est, mécaniquement, *travailler à le faire avancer comme stabilisateur procédural*. Le bug `/thing multilevel dispatch` (mémoire ouverte) est donc, dans le vocabulaire du critère, une **frontière de Rossignol** — pas un détail technique.

Symétriquement, l'étage 7 (self-hosting) est *un horizon* — un Rossignol projeté, dont la production demanderait que les étages 4–6 soient stabilisés au préalable. Le critère n'exige pas qu'il soit atteint, mais il fournit un classement honnête de la distance restante.

---

## 4. Le cas Inox face aux trois maturités du test parent

Le [test sur quatre dispositifs](https://github.com/JeanHuguesRobert/barons-Mariani/blob/main/research/test_critere_rossignol.md) §5 avait dégagé une gradation trinaire :

| Maturité | Définition | Exemple parent | Inox |
|---|---|---|---|
| **natif** | Rossignol instancié et reproductible par construction | FractaVolta, Cogentia | étages 1–3, 5 |
| **attesté** | Rossignol existe au moins une fois, à généraliser | traçabilité symétrique | étage 4 (stdlib partielle) |
| **à produire** | doctrinal sans pratique | Kudocracy | étages 6, 7 |

Inox occupe les trois cases simultanément, selon la couche considérée. C'est cohérent avec sa nature *substrat* : un substrat sert plusieurs étages à la fois, à des maturités différentes. Le critère n'oblige pas à choisir une seule maturité ; il oblige à *nommer la frontière*.

---

## Continuation

```yaml
continuation:
  article: "Test du critère Rossignol — Inox"
  version: "0.1"
  status: "working-note — application locale, étage-par-étage"
  parent: "barons-Mariani/research/test_critere_rossignol.md"

  done_v0_1:
    - "Hiérarchie 7 étages des Rossignols Inox dressée."
    - "Identification du Rossignol vivant le plus haut : étage 5 (hello.nox exécute, sortie reproductible)."
    - "Frontière courante : transition étage 5 → 6 (l9.nox OO, blocage `/thing` multilevel)."
    - "Reformulation du critère pour dispositifs composés : 'le plus haut artefact reproductible hors-cadre'."

  prochaine_action:
    - "Si le bug `/thing` multilevel est levé (cf mémoire ouverte inox_thing_multilevel_dispatch), faire monter la frontière de Rossignol à l'étage 6 et mettre à jour cette note."
    - "Combler les gaps stdlib (cf inox_stdlib_gaps) : passer l'étage 4 de 'attesté' à 'natif'. Approche : synthétiser depuis primitives existantes avant d'ajouter du TS natif (cf feedback synthesize_before_primitive)."
    - "Étendre cette analyse aux autres composants substrats du corpus (inseme COP — cop-core, brique-cogentia-commons) quand pertinent."

  questions_a_traiter:
    - "Le passage substrate → application (Inox → l9 → programmes utilisateur) connaît-il une stigmergie analogue à celle des autres dispositifs ? La trace d'exécution (logs runtime, bytecode généré) est-elle un Rossignol au sens du critère ?"
    - "La self-hostance (étage 7) est-elle un Rossignol authentique, ou seulement une élégance technique sans valeur d'attestation supplémentaire ?"
    - "Quel est le rapport entre la 'frontière de Rossignol' et le concept d'`open research thread` (cf inox_open_research_threads — llm_token_efficiency, library_packets) ? Mêmes objets ?"
```


<!-- BEGIN_AUTO: backlinks -->
### Backlinks

*These documents link to this file:*
- [Corpus Status — Inox](corpus-status.md)
- [Research Index — Inox](index.md)
- [Library packets — when the library is a specification, not code](library_packets.md)

<!-- END_AUTO: backlinks -->
