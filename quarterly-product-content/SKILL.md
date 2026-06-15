---
name: quarterly-product-content
description: >
  Génère le blog post et la newsletter produit du quarter pour Batch (batch.com), en français et en anglais, 
  et les publie dans Notion. À utiliser dès que quelqu'un demande à écrire, générer ou préparer le "blog post 
  du quarter", la "newsletter produit", le "product update" trimestriel, le "récap produit", ou les "nouveautés 
  Batch" d'une période donnée. Se déclenche aussi sur des formulations comme "rédige le contenu Q1/Q2/Q3/Q4", 
  "fais le blog post de nos releases", "prépare la newsletter clients", "écris le product tour du semestre". 
  Le skill va chercher les releases dans #product-releases sur Slack, sélectionne les features client-facing, 
  les organise par angle narratif, rédige le contenu dans le style Batch, et crée deux pages Notion (FR + EN).
---

# Quarterly Product Content — Blog Post & Newsletter

Ce skill génère le blog post et la newsletter trimestrielle produit de Batch, en FR et EN, dans un style 
éditorial soigné, puis les publie dans Notion.

**Blog post et newsletter ont le même contenu** — seul le format final diffère légèrement (intro newsletter 
plus directe, pas de chapeau "conviction produit"). Les traiter comme un seul document, décliné en deux langues.

---

## Étape 1 — Cadrage initial (AVANT de collecter les releases)

Avant toute recherche Slack, pose ces deux questions à l'utilisateur :

**1. Accès au dernier blog post quarterly**

Demande le lien (ou le contenu) du dernier blog post produit publié. Objectif : éviter les redits et les 
features anticipées — certaines releases sont annoncées dans un quarter mais réellement sorties dans le 
suivant. Si l'utilisateur n'a pas le lien sous la main, propose de chercher dans Notion ou sur batch.com.

**2. Date de fin de capture**

Demande explicitement la date à laquelle arrêter la capture des releases dans #product-releases. 
Ne pas deviner à partir du nom du quarter — une feature annoncée le 28 mars peut appartenir au Q1 ou 
être reportée au Q2 selon la décision de l'équipe.

N'avance pas à l'étape 2 avant d'avoir ces deux éléments.

---

## Étape 2 — Collecter et filtrer les releases

Recherche dans #product-releases sur Slack toutes les releases de la période :

```
slack_search_public_and_private(
  query="in:#product-releases after:YYYY-MM-DD before:YYYY-MM-DD",
  sort="timestamp",
  sort_dir="asc",
  limit=20
)
```

Si trop peu de résultats, élargis légèrement la fenêtre ou pagine.

### Filtrage — ce qu'on garde vs ce qu'on écarte

**À inclure :**
- `[Product Release]` — features client-facing
- `[Product Update]` — mises à jour significatives d'une feature existante
- `[UX Improvement]` si l'amélioration est visible et notable pour un client CRM

**À écarter :**
- `[internal]` — releases purement internes (console admin, infra, tech debt)
- `[Unplanned]` petites améliorations sans impact stratégique (ex : limite de labels +5)
- Releases purement techniques (TypeScript strict, React Compiler, etc.)
- Releases sans bénéfice direct pour un marketer/CRM manager
- Features déjà couvertes dans le dernier blog post (cf. étape 1)

---

## Étape 3 — Proposer une sélection éditoriale à valider

Ne pas rédiger encore. Présenter une **proposition structurée** à l'utilisateur :

```
Voici ma sélection pour le blog post Q? YYYY :

**3 sujets phares** (développement complet avec angle narratif)
1. [Nom de la feature] — [angle narratif proposé / bénéfice mis en avant]
2. [Nom de la feature] — [angle narratif proposé / bénéfice mis en avant]
3. [Nom de la feature] — [angle narratif proposé / bénéfice mis en avant]

**Sujets mineurs** (section "Nos autres nouveautés", traitement court)
- [Feature A]
- [Feature B]
- [Feature C]
- [Feature D]

**Écarté** (interne / technique / déjà couvert)
- [Feature X] — raison
- [Feature Y] — raison

Tu valides cette sélection ? Tu peux modifier l'ordre, déplacer une feature entre phares et mineurs, 
ou en retirer/ajouter.
```

**Attends la validation explicite de l'utilisateur avant de continuer.**

---

## Étape 4 — Questions complémentaires avant rédaction

Une fois la sélection validée, identifie les points flous ou manquants :

- Une feature phare manque d'un exemple d'usage concret ?
- Un chiffre clé serait utile pour appuyer un angle ?
- Un nom de feature a changé récemment ?
- Une date de disponibilité (bêta / GA) est à préciser ?

Si tu as des questions, pose-les **toutes en même temps** dans un seul message. 
Si tu n'as aucune question, passe directement à l'étape 5.

---

## Étape 5 — Rédiger le contenu (FR en premier, EN ensuite)

### Style éditorial Batch — règles strictes

**Ton :**
- Direct, sans fioriture. On parle à un CRM manager qui manque de temps.
- Conviction assumée : "Notre conviction est simple : …"
- On nomme le problème avant de présenter la solution. Pas de marketing creux.
- Concret : chiffres, exemples d'usage, gain de temps réel.
- Pas de superlatif vide ("révolutionnaire", "puissant", "innovant").
- Humain et légèrement teinté de personnalité — ni corporate, ni startup hype.

**Structure du blog post / newsletter :**

```
[TITRE] — accrocheur, centré sur le bénéfice, pas sur les noms de features
(ex: "Données, canaux, impact : les nouveautés Batch qui changent votre quotidien CRM")

[INTRO] — 3-5 lignes max
Pose 2-3 frictions récurrentes que ce quarter a résolues. Ni trop formel, ni trop marketing.
Se termine sur une invitation à lire ("Bonne lecture !")

[SECTION PRINCIPALE — les 3 features phares validées à l'étape 3]
Pour chaque feature :

## [Titre = bénéfice, pas nom technique]
(ex: "Activez vos données sans dépendre de votre équipe data")

Paragraphe d'accroche : le problème qu'on résout, la conviction Batch.
Présentation de la feature en 1-2 phrases, avec le **nom exact** en gras.
Liste "Concrètement :" avec 3-5 points d'usage pratiques.
Phrase de clôture sur l'impact business.

[SECTION SECONDAIRE — features mineures validées à l'étape 3]
## Nos autres nouveautés pour un CRM plus efficace

### [Nom ou bénéfice court]
2-3 lignes par feature. Même logique : problème → solution → bénéfice.

[CLÔTURE]
1-2 phrases de synthèse. Message de fond sur la vision produit Batch.
```

**Règles de forme :**
- Utilise le **gras** pour les noms de features la première fois qu'ils apparaissent
- Les listes "Concrètement :" doivent avoir des items qui commencent par le **cas d'usage** (ex: "WhatsApp : intégrer…")
- Longueur totale : 600-900 mots en FR, identique en EN
- Pas de tableau, pas de bullet point en intro ou clôture
- Titre H2 = bénéfice utilisateur. Jamais le nom de la feature seul.

### Rédaction EN

Traduis fidèlement, en adaptant à un anglais idiomatique B2B SaaS. Ne pas faire une traduction mot à mot.  
Même structure, même longueur. L'EN doit sonner natif — pas comme du français traduit.

Règles spécifiques EN :
- "Our teams" plutôt que "our teams have not been idle"
- Verbes actifs, phrases courtes
- "Here's how some of you plan to use it:" plutôt que "Concrètement :"

---

## Étape 6 — Publier dans Notion

### Trouver la bonne base Notion

Cherche dans Notion la base ou section dédiée aux blog posts / newsletters produit :

```
notion_search(query="blog post produit quarter newsletter")
```

Si plusieurs résultats, demande à l'utilisateur lequel utiliser.

### Créer deux pages

Crée **deux pages distinctes** dans la base identifiée :

**Page FR :**
- Titre : `[Blog / Newsletter] Nouveautés produit Batch — [Q? YYYY]`
- Contenu : version FR complète

**Page EN :**
- Titre : `[Blog / Newsletter] Batch Product Updates — [Q? YYYY]`
- Contenu : version EN complète

Pour chaque page, utilise `notion_create_pages` avec le contenu en blocs Notion (paragraphes, headings H2/H3, bulleted lists).

### Après publication

Partage les liens des deux pages à l'utilisateur.

---

## Références

### Exemple de blog post FR (mars 2026)

Source : https://batch.com/fr/blog/posts/nouveautes-produit-batch-mars-2026

Structure observée :
- Titre : "Données, canaux, impact : les nouveautés Batch qui changent votre quotidien CRM"
- Intro : 5 lignes, 3 frictions nommées, finit sur "Bonne lecture !"
- 3 grandes features (Cloud Sync, Universal Channel, Conversion Goals) avec H2 bénéfice
- Section "Nos autres nouveautés" avec 5 features mineures en H3
- Clôture : 2 phrases de synthèse vision produit

### Format des releases Slack

Les messages dans #product-releases suivent ce pattern :
```
*[Product Release] - Nom de la feature* :emoji:
*What's new?* ...
*Why?* ...
*Who can use it?* ...
*Points of Attention* ...
```

Les `[internal]`, `[UX Improvement]` mineures, et releases purement techniques sont à écarter du contenu client.

---

## Checklist avant publication

- [ ] Le dernier blog post a été consulté — pas de redits
- [ ] La date de fin de capture Slack a été confirmée par l'utilisateur
- [ ] La sélection (phares + mineurs) a été validée par l'utilisateur
- [ ] Toutes les questions complémentaires ont été posées et répondues
- [ ] Chaque H2 exprime un bénéfice, pas un nom de feature
- [ ] La version EN sonne idiomatique (pas de traduction littérale)
- [ ] Les noms de features sont en gras à leur première apparition
- [ ] Longueur : entre 600 et 900 mots par version
- [ ] Les deux pages Notion sont créées et les liens partagés
