---
title: "Histoire du développement d'Inox et de L9 (2021–2026)"
subtitle: "Du langage conçu et programmé par son auteur au développement coopératif avec des agents de coding"
author: "Jean Hugues Noël Robert — direction et conception ; GPT-6 — enquête Git et rédaction sous mandat"
affiliation: "Institut Mariani / C.O.R.S.I.C.A."
date: "2026-11-23"
last_modified_at: "2026-11-26"
status: "note de recherche historique — première version, à relire par l'auteur"
language: fr
license: "CC BY-SA 4.0"
document_role: "source"
document_kind: "historical-development-study"
visibility: public
lifecycle_state: working
update_policy: UP-DEFAULT-REVIEWED
canonical_url: "https://github.com/JeanHuguesRobert/Inox/blob/master/research/histoire-du-developpement-inox-l9.md"
provenance:
  origin_type: "git-history-analysis"
  origin_repository: "JeanHuguesRobert/Inox"
  origin_ref: "d4f9dad05a3444d374ee02854734b9f0c2635107"
  origin_date: "2026-11-23"
  derived_from:
    - "git log --all / git log --follow -- lib/l9.nox"
    - "lib/l9.nox"
    - "README.md"
    - "research/inox-spec.md"
    - "research/inox-since-2021-orientation-note.md"
    - "research/two-versions-scripting-vs-system.md"
review:
  status: unreviewed
  reviewed_by: []
---

# Histoire du développement d'Inox et de L9 (2021–2026)

*Enquête fondée sur les commits accessibles au 23 novembre 2026. Rédaction : GPT-6 sous la direction de Jean Hugues Noël Robert. Document destiné à être complété par les souvenirs, journaux et archives de l'auteur ; le dépôt Git constitue la trame vérifiable, non l'intégralité de l'histoire.*

## 1. Une histoire en trois mouvements

L'histoire d'Inox ne commence pas avec les modèles de langage. **Le premier commit date du 3 juin 2021**. Il introduit `inox.js` ([`7f93c40`](https://github.com/JeanHuguesRobert/Inox/commit/7f93c40)). L'architecture et les choix fondamentaux — langage concaténatif, cellules nommées, piles, styles syntaxiques, objets, concurrence envisagée — précèdent l'usage documenté des agents de coding sur ce dépôt.

Trois mouvements se distinguent :

1. **2021–juin 2023 : invention et réalisation initiales.** L'auteur définit et programme lui-même le langage, puis explore sa machine virtuelle, les compilateurs, les cibles bas niveau et la couche objet L9. L9 arrive en **mai 2023**, pas en 2026.
2. **2023–2025 : interruption ou activité Git très réduite.** Après les commits de juin 2023, le dépôt n'enregistre qu'un commit en avril 2025 avant la reprise de 2026. Cette discontinuité décrit l'historique Git, non nécessairement toute l'activité intellectuelle de l'auteur.
3. **2026 : reprise avec des agents.** Des assistants et agents de coding travaillent sous la direction de l'auteur : d'abord sur des bogues et l'ergonomie du runtime, puis sur les spécifications, les interfaces réseau et les images exécutables ; enfin, en novembre, sur le fonctionnement vérifié de L9. Les modèles et leurs rôles changent au cours de cette période.

Il serait trompeur de raconter « une IA qui aurait créé Inox ». L'évolution observable est celle d'un **projet humain ancien auquel des agents de coding fournissent une nouvelle capacité de maintenance, d'expérimentation, de documentation et de réalisation**.

## 2. La genèse : 2021, un langage avant les agents de coding

Le premier mois est très dense. Après `inox.js`, l'auteur ajoute des types comme **Cell, Act et Task** ([`65908bf`, 4 juin](https://github.com/JeanHuguesRobert/Inox/commit/65908bf)), le lexer ([`adb533e`, 5 juin](https://github.com/JeanHuguesRobert/Inox/commit/adb533e)) et le tokenizer ([`25638c9`, 9 juin](https://github.com/JeanHuguesRobert/Inox/commit/25638c9)). Le passage à **TypeScript** est inscrit le 7 juin ([`03393c2`](https://github.com/JeanHuguesRobert/Inox/commit/03393c2)). L'essai d'**AssemblyScript** et de **WebAssembly** commence le 10 juin ([`79ec457`](https://github.com/JeanHuguesRobert/Inox/commit/79ec457), [`c3bdaf2`](https://github.com/JeanHuguesRobert/Inox/commit/c3bdaf2)), puis le bootstrap est travaillé dès le 12 juin ([`1c57ecf`](https://github.com/JeanHuguesRobert/Inox/commit/1c57ecf)).

La filiation avec **Forth** est explicite : le 18 juin, un commit annonce le travail sur `docolom`, le mot traditionnel qui introduit de nouvelles définitions ([`a5d91c6`](https://github.com/JeanHuguesRobert/Inox/commit/a5d91c6)). Les premiers exemples en syntaxe Inox suivent ([`e68aa8b`, 28 juin](https://github.com/JeanHuguesRobert/Inox/commit/e68aa8b)). Le journal annonce un langage **Turing-complet** le 13 juillet ([`0a1099d`](https://github.com/JeanHuguesRobert/Inox/commit/0a1099d)), les boucles *stackless* le 26 juillet ([`2b36ceb`](https://github.com/JeanHuguesRobert/Inox/commit/2b36ceb)) et des sentinelles pour sécuriser `inox-break` le lendemain ([`602d94f`](https://github.com/JeanHuguesRobert/Inox/commit/602d94f)). Ces libellés sont des **déclarations historiques de commits**, pas des mesures de conformité rétrospectives.

Dès cette première période, plusieurs ambitions durables apparaissent ensemble : une syntaxe compacte mais expressive, l'exécution sur de petites machines, la composition par pile, et le souci de contrôler explicitement les structures d'exécution. Les débats récents sur les limites des piles, la reprise et l'optimisation des appels terminaux s'inscrivent dans cette continuité ; ils ne naissent pas des agents.

## 3. 2022–début 2023 : objets, flux, outillage et port C++

L'activité reprend visiblement en **décembre 2022**. Le 8 décembre, l'auteur introduit une couche orientée objet avec comptage de références ([`25ebc7c`](https://github.com/JeanHuguesRobert/Inox/commit/25ebc7c)). Le 27 décembre apparaît le type `flow`, prévu pour des flux réactifs inspirés de Toubkal ([`01c373c`](https://github.com/JeanHuguesRobert/Inox/commit/01c373c)).

En janvier 2023, le projet s'étoffe avec `bootstrap.nox` et `forth.nox` ([`643cc32`](https://github.com/JeanHuguesRobert/Inox/commit/643cc32)), puis le **REPL** ([`9e6f1fd`](https://github.com/JeanHuguesRobert/Inox/commit/9e6f1fd)). La représentation des valeurs et des types, la gestion mémoire, les portées, les noms et les opérateurs font l'objet de nombreux correctifs. Le 25 janvier, l'auteur choisit le vocabulaire des **« verbes »** plutôt que des mots, renforce le style littéraire et les variables locales ([`309f050`](https://github.com/JeanHuguesRobert/Inox/commit/309f050)).

En février et mars, l'effort porte sur la **cible C++** : première compilation sans erreur le 16 février ([`6edf321`](https://github.com/JeanHuguesRobert/Inox/commit/6edf321)), exécution le 27 février ([`330cdac`](https://github.com/JeanHuguesRobert/Inox/commit/330cdac)), puis expérimentations de performance (`INOX_FAST`, compilateur et options) ([`8435a3d`](https://github.com/JeanHuguesRobert/Inox/commit/8435a3d), [`c2e0fab`](https://github.com/JeanHuguesRobert/Inox/commit/c2e0fab)). Un commit rapporte jusqu'à **95 MIPS en mode rapide** : c'est une mesure *rapportée à l'époque par l'auteur*, dépendante de ce banc et de cette machine, non une performance actuelle démontrée.

Le travail sur `LeanString` vise à réduire la dépendance à la bibliothèque standard C++ ([`2b8b598`, 6 mars](https://github.com/JeanHuguesRobert/Inox/commit/2b8b598)). Ce souci de sobriété réapparaîtra dans les études 2026 sur les micro-runtimes et les images compactes.

## 4. Mai–juin 2023 : la naissance de L9

**L9 précède les agents de coding employés en 2026.** Son premier ajout repérable dans le dépôt se trouve dans le commit du **16 mai 2023** ([`1e78bf6`](https://github.com/JeanHuguesRobert/Inox/commit/1e78bf6)), consacré notamment aux closures, aux objets exécutables et à `l9`. Le fichier commence par cette provenance :

> `Inox LinkOS v9 kernel — JHR, 2023/05/07, from l8.js`

Il désigne son prédécesseur **L8**, décrit dans le code comme un noyau monothread piloté par événements, avec une référence au dépôt historique [`virteal/l8`](https://github.com/virteal/l8). Le Git d'Inox fournit ici **une filiation déclarée**, et non tout l'historique autonome de L8. La date « 7 mai » appartient à l'en-tête du source ; le premier commit qui ajoute `l9.nox` est daté du **16 mai**.

Le 22 mai, l'auteur travaille sur `class{}`, les attributs, les méthodes et le bootstrap L9 ([`5e779e4`](https://github.com/JeanHuguesRobert/Inox/commit/5e779e4)). Le 23 mai apparaît la notation `@` pour accéder au receveur courant et à ses chemins d'attributs ou de méthodes ([`b8d60ed`](https://github.com/JeanHuguesRobert/Inox/commit/b8d60ed)). Le 6 juin, les méthodes, la mise en cache de leur résolution, les conditions et les primitives de retour évoluent, mais le message qualifie explicitement le **système de classes et L9 de WIP** ([`9750483`](https://github.com/JeanHuguesRobert/Inox/commit/9750483)).

Il faut distinguer **l'existence du code L9** et **le fonctionnement intégral de L9**. Les classes, tâches, événements et promesses sont présents comme ambitions et premières implémentations, tandis que des défauts du parser, des durées de vie des variables et de la mémoire vont durablement compliquer le bootstrap. Ce n'est pas une couche achevée en juin 2023.

## 5. La discontinuité 2023–2025

L'historique `master` compte 51 commits datés de 2023, dont les derniers travaux substantiels ont lieu en juin ; **aucun commit daté de 2024** n'apparaît dans l'historique examiné, puis un seul commit intervient le 21 avril 2025 ([`6b3b1d1`](https://github.com/JeanHuguesRobert/Inox/commit/6b3b1d1)), consacré notamment au débogage des classes.

La meilleure lecture n'est pas celle d'un abandon doctrinal : les concepts de 2021–2023 restent dans les fichiers et les spécifications. En revanche, le dépôt Git n'atteste pas de progression régulière du runtime pendant cette période. Des travaux hors dépôt ou non committés ne pourraient pas être reconstitués avec `git log` seul.

## 6. Mai–juin 2026 : première collaboration avec des agents de coding, attestée par Git

La reprise Git commence avant l'attribution explicite aux agents : un commit du 19 avril 2026 met à jour le contexte du README ([`ed4c9ae`](https://github.com/JeanHuguesRobert/Inox/commit/ed4c9ae)), suivi de changements les 21 et 22 mai. **Le 22 mai 2026** fournit le premier exemple trouvé d'une co-signature d'agent sur ce dépôt : [`e88bb5c`](https://github.com/JeanHuguesRobert/Inox/commit/e88bb5c), avec `Co-Authored-By: Claude Opus 4.7`.

Ce commit documente deux erreurs de la machine virtuelle qui bloquaient le bootstrap L9 : un **double `free`** dans `stack_extend` et une **condition inversée** dans `forget_parameters`. Le premier défaut en masquait un second ; corriger le premier permettait enfin d'observer le suivant. C'est une séquence caractéristique de la coopération avec un agent de coding : diagnostic reproductible, correction incrémentale, découverte de l'obstacle suivant. Cela ne signifie pas que L9 était alors terminé.

Le même jour paraît [`learning-inox.md`](https://github.com/JeanHuguesRobert/Inox/blob/master/research/learning-inox.md), tutoriel explicitement destiné **aux agents IA** et aux lecteurs humains ([`83658ec`](https://github.com/JeanHuguesRobert/Inox/commit/83658ec)). La démarche est double : employer des agents *pour* développer Inox, mais aussi adapter **la documentation d'Inox pour permettre à d'autres agents d'y travailler**.

Entre fin mai et début juin, les commits co-signés avec **Claude Opus 4.7 et 4.8** portent sur les assertions, les variables, le parseur, les appels de méthodes, les collections, le comptage de références, L9, la bibliothèque standard et l'exécution CLI. Plusieurs messages de commits exposent les problèmes encore ouverts après chaque réparation, au lieu d'annoncer une stabilisation fictive : [`dc87508`](https://github.com/JeanHuguesRobert/Inox/commit/dc87508), [`948b209`](https://github.com/JeanHuguesRobert/Inox/commit/948b209), [`9a693b1`](https://github.com/JeanHuguesRobert/Inox/commit/9a693b1), [`6e32c05`](https://github.com/JeanHuguesRobert/Inox/commit/6e32c05).

Deux résultats structurants émergent : le mode **CLI synchrone**, opérationnel pour des scripts simples, et la distinction de fait entre cette couche quotidienne et le noyau L9 encore expérimental. Le commit [`5a06b2d`, 16 juin](https://github.com/JeanHuguesRobert/Inox/commit/5a06b2d) porte déjà le titre « Stabilize Inox l9 bootstrap path », mais les réparations nécessaires en novembre montrent qu'il ne constituait pas une validation finale du comportement des tâches et promesses.

La bibliothèque `stdlib.nox` est introduite le 23 mai ([`5cc1594`](https://github.com/JeanHuguesRobert/Inox/commit/5cc1594)). Son en-tête actuel indique une génération initiale par des agents **Claude/Gemini**. Les modifications humaines et les corrections d'agents ultérieures doivent être distinguées de cette origine de fichier dérivé : attribuer le commit à un humain n'invalide pas l'assistance, mais ne la prouve pas non plus en l'absence de trace.

## 7. Juillet–octobre 2026 : les agents deviennent aussi rédacteurs de contrats et opérateurs du Corpus

Le projet ne se réduit plus au débogage du runtime : il entre dans une architecture plus large de **Fractanet, COP, continuations, exécution distante et images**.

En juillet, plusieurs commits introduisent `inox-serve`, le pool de sidecars, les continuations et le cycle de paquets de session ([`f1f0320`](https://github.com/JeanHuguesRobert/Inox/commit/f1f0320), [`4e7ae15`](https://github.com/JeanHuguesRobert/Inox/commit/4e7ae15), [`ca08d9d`](https://github.com/JeanHuguesRobert/Inox/commit/ca08d9d)). Le **17 juillet**, les contrats d'images, de lignées et d'hibernation ([`edcc3ef`](https://github.com/JeanHuguesRobert/Inox/commit/edcc3ef)) et de runtime **Inox Micro** ([`c474827`](https://github.com/JeanHuguesRobert/Inox/commit/c474827)) portent explicitement `Agent-Assisted: yes`, `Agent: OpenAI Codex`, sous le mandat de l'auteur. Ce sont alors des **contrats et échafaudages de conformité**, pas une preuve de port ESP32 livré.

Le document d'orientation [*Inox Since 2021*](inox-since-2021-orientation-note.md), rédigé avec **Codex GPT-5**, puis relu avec Grok et Claude Opus, date de juillet. Il traite des raisons philosophiques et politiques du projet ; **la présente note**, plus étroitement historienne, traite des actes enregistrés dans Git. Les deux textes se complètent. Une table synthétique de la note d'orientation attribue trop largement des travaux d'images à 2023–2024 : ce n'est **pas** la chronologie attestée dans le dépôt Inox, où les contrats d'images datent de 2026.

Septembre voit des interventions explicites de **Grok Build** pour les projections du Corpus ([`dec98bd`](https://github.com/JeanHuguesRobert/Inox/commit/dec98bd), [`82a3700`](https://github.com/JeanHuguesRobert/Inox/commit/82a3700)). Octobre comprend des commits signés **Codex** sur la documentation de `inox-serve` et les projections ([`1dbfab4`](https://github.com/JeanHuguesRobert/Inox/commit/1dbfab4)). L'activité humaine et les autres interventions continuent en parallèle. Il n'existe pas de passage instantané d'« un auteur » à « un agent » : c'est une **cohabitation progressive de rôles**.

## 8. Novembre 2026 : réparation FBF de L9 et images exécutables

La deuxième grande séquence d'agents, visible en novembre, est marquée par une discipline plus explicite : **FixBugsFirst, preuve d'exécution, paquet cognitif et attribution dans le code**.

**Images et micro-runtime.** Les commits [`16edb30`](https://github.com/JeanHuguesRobert/Inox/commit/16edb30) et [`31117bc`](https://github.com/JeanHuguesRobert/Inox/commit/31117bc) documentent puis prototypent des bases/deltas de définitions `Cell` à adressage par contenu ; [`9d1d57a`](https://github.com/JeanHuguesRobert/Inox/commit/9d1d57a) adopte l'extension `.xnx` (*eXecutable iNoX*). Le 23 novembre, un autre train de commits construit progressivement un runner, des images liées, un compilateur et un lexer en Inox, puis une réassemblage minimal ([`0d999ad`](https://github.com/JeanHuguesRobert/Inox/commit/0d999ad), [`42cf87d`](https://github.com/JeanHuguesRobert/Inox/commit/42cf87d), [`aec607c`](https://github.com/JeanHuguesRobert/Inox/commit/aec607c), [`885ed96`](https://github.com/JeanHuguesRobert/Inox/commit/885ed96)). Le dossier distingue explicitement prototypes host-only, contrats, tests et portée de déploiement ; cela ne constitue pas encore un runtime Micro de production.

**L9 : quatre paliers successifs.**

| Date | Commit | Résultat observé et limite maintenue |
| --- | --- | --- |
| 22 novembre | [`acb4ebf`](https://github.com/JeanHuguesRobert/Inox/commit/acb4ebf) | Réparation du bootstrap des classes et des méthodes de `stdlib.nox` ; **démarrage** réussi, non complétude de L9. |
| 22 novembre | [`d84a08b`](https://github.com/JeanHuguesRobert/Inox/commit/d84a08b) | Réparation **causale** des boucles, sentinelles et adresses de continuation ; contrôles de profondeur de pile, sans contournement par récursion. |
| 23 novembre | [`d28865e`](https://github.com/JeanHuguesRobert/Inox/commit/d28865e) | Construction de la tâche racine et relations entre tâches ; réparation de primitives de stockage. Contrats d'ordonnancement toujours ouverts. |
| 23 novembre | [`30ead09`](https://github.com/JeanHuguesRobert/Inox/commit/30ead09) | Itération des listes, annulation de racine, états élémentaires des promesses ; propagation d'exceptions inachevée. |
| 23 novembre | [`d4f9dad`](https://github.com/JeanHuguesRobert/Inox/commit/d4f9dad) | `promise.then`, chaînage local **synchrone**, transformation et propagation ordinaires des valeurs et rejets ; ordonnanceur et exceptions de callbacks non achevés. |

Les commits concernés attribuent la contribution à **GPT-6 sous la direction de Jean Hugues Noël Robert** ; le champ Git `Author`, souvent au nom de l'auteur humain, n'est donc pas une description suffisante de qui a effectivement écrit chaque modification. Les commentaires du code, les messages, les tests et le [paquet cognitif L9](https://github.com/JeanHuguesRobert/Inox/blob/master/.cogentia/continuations/ctn_inox_l9_bootstrap_2026_11_22.json) sont nécessaires pour préciser l'origine.

Au dernier commit étudié, les tests L9 comprennent **22 cas de bootstrap**, **29 cas de structure**, **15 cas de cycle de vie élémentaire** et **17 cas de promesses chaînées**, auxquels s'ajoutent **82 tests de boucles** et **16 tests isolés sur les seuils des piles**. Les compteurs expriment les bancs tels que publiés à cette date ; ils ne mesurent ni le pourcentage du langage achevé ni la qualité scientifique des modèles.

**Ce qui reste ouvert** : `task.raise` et la propagation des annulations/erreurs, `task.schedule` et la reprise effective des acteurs, la traduction des exceptions des callbacks en rejets de promesses, et plusieurs garanties mémoire. La recherche sur la détection des débordements de pile lors d'un changement de contexte a été **explicitement différée** par l'auteur ; la correction arithmétique du seuil de croissance à 80 % est un autre sujet, déjà traité.

## 9. Avant et après les agents : comparaison de méthode

| Dimension | Avant l'usage attesté des agents (2021–2025) | Avec les agents (à partir du 22 mai 2026) |
| --- | --- | --- |
| Initiative conceptuelle | Auteur humain : grammaire, système de noms, VM, types, L8/L9, cible C++ | La direction conceptuelle et les arbitrages restent humains ; les agents confrontent les contrats au code. |
| Programmation | Itérations directement portées par l'auteur ; explorations et grands chantiers parfois laissés en WIP | Développement délégué par mandats ciblés ; recherches de cause racine, patchs et tests réutilisables. |
| Trace d'attribution | Majoritairement commits sous le nom de l'auteur | Co-signatures Claude, champs `Agent-Assisted`, identités Codex/Grok et, plus tard, commentaires GPT-6. |
| Documentation | Spécifications, README, journaux de commits et expériences | Tutoriels pour agents, contrats versionnés, documents d'architecture, paquets cognitifs et diagnostics rouges. |
| Vérification | Essais, performances rapportées, smoke tests ; qualité variable d'un chantier à l'autre | Suites de non-régression de plus en plus explicites, y compris chemins d'erreur, continuité après boucle et invariants de pile. |
| Limite persistante | Ambitions supérieures à la capacité disponible pour tout finaliser | Beaucoup plus de travaux exécutables, mais toujours des bugs, des erreurs d'agents, des problèmes d'intégration et des contrats non réalisés. |

### Quelques indicateurs, sans conclusion causale automatique

Sur la branche `master` examinée, **324 commits** figurent dans l'ascendance de `d4f9dad`, répartis par date d'auteur ainsi : **54 en 2021 ; 11 en 2022 ; 51 en 2023 ; 0 en 2024 ; 1 en 2025 ; 207 en 2026**. Il y a **325 objets commit accessibles par toutes les références** : le total `--all` peut donc inclure un objet non ancêtre de `master`.

Le premier commit explicitement co-signé Claude trouvé dans `git log` est celui du **22 mai 2026**. Les messages d'au moins **37 commits** comportent une co-signature Claude ; des commits supplémentaires portent `Agent-Assisted: yes` ou un autre type d'attribution. Ces nombres désignent **des traces documentées, non une répartition exhaustive de l'effort humain et machine** : les commits d'agent peuvent être enregistrés sous le nom de l'auteur, certains travaux n'ont pas d'attribution systématique, un commit peut porter beaucoup ou très peu de code, et la date Git n'est pas toujours la date d'exécution réelle du travail.

La densification de 2026 est observable. **Qu'elle soit entièrement *causée* par les agents ne se déduit pas de Git.** L'auteur a aussi réactivé le projet, défini de nouveaux mandats, intégré le Corpus et choisi des priorités. Les agents apparaissent comme des multiplicateurs de capacité dans cette reprise, et non comme des auteurs indépendants de sa finalité.

## 10. Les erreurs des agents font elles aussi partie de l'histoire

L'histoire postérieure à 2026 ne doit pas devenir une liste publicitaire de correctifs « réussis ». Les échanges et commits montrent des erreurs d'agents : propositions qui contournent une boucle défectueuse par une récursion consommatrice de pile, diagnostics prématurés sur la réentrance de `integer.times`, tests qui vérifient seulement un résultat imprimé mais pas la continuation, hypothèses erronées sur l'ordre des arguments et méthodes déclarées opérationnelles alors que leurs exceptions restent incomplètes.

Leur intérêt historique n'est pas anecdotique. Ils ont conduit à une discipline plus nette : **corriger la cause, vérifier les invariants, ne pas appeler « réparation » un contournement**, distinguer résultats verts et diagnostics volontairement rouges, documenter la provenance des modifications, et préserver les travaux parallèles. La règle a été formalisée dans [Cogentia, politique d'ingénierie](https://github.com/JeanHuguesRobert/cogentia/blob/main/instructions/AGENTS.policy-engineering.md#root-cause-first--workarounds-by-exception-only-2026-11-22), puis spécialisée dans [`AGENTS.md`](../AGENTS.md) d'Inox.

La nouveauté observable dans *la pratique du projet* n'est donc pas que le langage sait désormais tout faire ; c'est que le travail de développement devient plus facilement **distribuable, traçable, reprenable et réfutable** par des tests. Les défauts non résolus demeurent visibles.

## 11. Ce que Git prouve et ce qu'il ne prouve pas

**Sources fortes** : dates et contenu des commits, introduction de fichiers, messages et trailers d'attribution, modifications exactes dans les diffs, existence des tests et leur programme. **Sources déclaratives** : performances décrites dans un message, co-écriture déclarée, provenance historique indiquée dans l'en-tête de L9. **Interprétation** : l'effet des agents sur la vitesse de développement, le changement de méthode, la continuité intellectuelle entre différentes couches.

La date d'auteur (`%aI`) et la date du commit effectif (`%cI`) peuvent différer, notamment après réécriture ou réconciliation Git ; une chronologie doit préciser laquelle elle utilise. Les comptes ci-dessus suivent les **dates d'auteur**, et les hash identifient les contenus effectivement accessibles à la révision étudiée. Les signatures Git ne prouvent pas à elles seules qui a tapé chaque ligne. L'absence de commit en 2024 ne prouve pas l'absence de réflexion, d'expérimentation locale ou de conversation.

L'histoire de **L8 avant L9** mériterait une enquête Git distincte dans le dépôt d'origine ; il serait injustifié de dater sa conception uniquement d'après l'ajout de `l9.nox` en 2023. Des matériaux comme les conversations de conception, les cahiers, les traces de tests et les anciens dépôts pourraient compléter la présente première version, sous la responsabilité de l'auteur.

## 12. Reproduire l'enquête

Depuis une copie à jour du dépôt :

```bash
# Inventaire général et chronologie chronologique (dates d'auteur)
git rev-list --count HEAD
git log --reverse --format='%h|%aI|%an|%s'
git log --format='%as' | cut -c1-4 | sort | uniq -c

# Premières étapes du langage et historique de L9
git show --stat 7f93c40
git log --follow --reverse --format='%h|%aI|%s' -- lib/l9.nox
git show 1e78bf6:lib/l9.nox | head -45

# Contributions explicitement co-signées et provenance par commit
git log --format='%h|%as|%s%n%b' --all | grep -i -B1 -A1 'Co-Authored-By: Claude'
git log --format='%h|%as|%s%n%b' --all | grep -i -B1 -A4 'Agent-Assisted: yes'
git show --format=fuller e88bb5c
git show --format=fuller d4f9dad

# État des essais L9 au point de publication du présent récit
npm run build
npm run test:l9
npm run test:l9-tasks
npm run test:l9-lifecycle-basics
npm run test:l9-promise-chain
node scripts/probe-l9-task-lifecycle.js  # diagnostics encore rouges
```

**Révision examinée :** [`d4f9dad`](https://github.com/JeanHuguesRobert/Inox/commit/d4f9dad05a3444d374ee02854734b9f0c2635107), `master`, 23 novembre 2026. Les développements ultérieurs devraient faire l'objet d'une nouvelle section datée, plutôt que de modifier rétroactivement les résultats alors observés.

---

*Note de provenance : cette synthèse historique a été recherchée et rédigée par GPT-6 à partir du dépôt Git, sous mandat de l'auteur. Elle n'attribue pas à GPT-6 le code historique, la conception d'Inox ou de L9 ; les contributions de coding agents identifiées sont référencées séparément. La validation éditoriale par l'auteur reste à faire.*


## Addendum daté — 26 novembre 2026 : convergence incrémentale JavascriptInox

Le paquet [Cogentia #291](https://github.com/JeanHuguesRobert/cogentia/issues/291)
et [Inox #41](https://github.com/JeanHuguesRobert/Inox/issues/41) documentent
une nouvelle matérialisation expérimentale en JavaScript natif, distincte
de la VM historique à Cells empaquetées. L'auteur maintient l'unité de
la sémantique, non l'identité des formats binaires. Les agents de coding
réalisent les étapes sous sa direction, avec essais différentiels.

| Jalon | Trace |
| --- | --- |
| Sélecteur de champ de navigation exprimé en Inox, image et test Chromium | [ae2d879](https://github.com/JeanHuguesRobert/Inox/commit/ae2d879) |
| Contrôle structuré, compilateur, blocs et locaux dynamiques | [f92237c](https://github.com/JeanHuguesRobert/Inox/commit/f92237c), [d3a69e6](https://github.com/JeanHuguesRobert/Inox/commit/d3a69e6), [c1cdf3a](https://github.com/JeanHuguesRobert/Inox/commit/c1cdf3a) |
| Mesures de mémoire des scripts courts ; pas de refonte prématurée | [466a94a](https://github.com/JeanHuguesRobert/Inox/commit/466a94a) |
| Blocs cible et paramètres nommés ; FBF historique du retour et du mode rapide | [4bb3d0e](https://github.com/JeanHuguesRobert/Inox/commit/4bb3d0e), [d0445e2](https://github.com/JeanHuguesRobert/Inox/commit/d0445e2), [86ab50a](https://github.com/JeanHuguesRobert/Inox/commit/86ab50a) |
| Liaison dynamique et définition capturée ; style historique de terminaison | [a79ad02](https://github.com/JeanHuguesRobert/Inox/commit/a79ad02), [ea1da5f](https://github.com/JeanHuguesRobert/Inox/commit/ea1da5f) |

Au dernier jalon de ce paquet : 137 tests expérimentaux verts, images
lexer/compilateur reproductibles et Reality Test Chromium sur fixture
isolée réussi. Ce bilan ne couvre pas les autres travaux L9 parallèles.
Les décisions pérennes se trouvent dans la [note des couches Inox](two-versions-scripting-vs-system.md)
et la [note Micro/C++](inox-cpp-micro-runtime-and-images.md).
Les états datés du 23 novembre ci-dessus restent des observations de leur
révision, non un bilan courant de tout L9.
