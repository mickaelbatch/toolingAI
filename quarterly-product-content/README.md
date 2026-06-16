# quarterly-product-content

Skill Claude Code qui génère le blog post et la newsletter produit trimestrielle de Batch — en français et en anglais — puis les publie dans Notion.

**Ce skill ne se déclenche que lorsqu'il est explicitement demandé par son nom.**

## Ce que fait ce skill

À partir des releases publiées dans `#product-releases` sur Slack, le skill suit un process en 6 étapes avec validation humaine à chaque décision clé :

1. **Cadrage** — demande le dernier blog post quarterly (pour éviter les redits) et la date de fin de capture Slack
2. **Collecte & filtrage** — récupère les releases de la période, écarte les internes/techniques/déjà couverts
3. **Sélection éditoriale** — propose 3 features phares + liste de mineurs, **attend ta validation avant de continuer**
4. **Questions** — pose toutes ses questions en une fois si besoin, sinon passe directement à la rédaction
5. **Rédaction** — rédige en français puis en anglais dans le style éditorial Batch (600–900 mots par version)
6. **Scoring persona** — évalue le contenu sur deux personas (CRM Manager et CMO), révise si un score est < 9/10
7. **Publication** — crée deux pages Notion (FR + EN) et partage les liens

Blog post et newsletter ont le même contenu — seul le format final diffère légèrement.

## Utilisation

```
/quarterly-product-content
```

Le skill te demandera la période si elle n'est pas fournie.

## Prérequis

- Accès Slack connecté (pour lire `#product-releases`)
- Accès Notion connecté (pour créer les pages)
- Le lien du dernier blog post quarterly (ou accepter que le skill le cherche dans Notion / sur batch.com)
- La date de fin de capture des releases (ne pas laisser le skill la deviner)

## Process de validation humaine

Le skill ne rédige pas sans feu vert. Avant la rédaction, il présente :

```
3 sujets phares  — avec l'angle narratif proposé pour chacun
Sujets mineurs   — liste pour la section "Nos autres nouveautés"
Écarté           — ce qui a été mis de côté, avec la raison
```

Tu peux modifier l'ordre, déplacer une feature entre phares et mineurs, ou en retirer/ajouter.

## Structure du contenu généré

```
[Titre]           — centré sur le bénéfice, pas les noms de features
[Intro]           — 3-5 lignes, frictions du quarter, invitation à lire
[3 features phares]
  H2 = bénéfice   — nom de feature en gras à la 1ère apparition
  "Concrètement:" — 3-5 cas d'usage pratiques
[Nos autres nouveautés]
  H3 courts       — 2-3 lignes par feature mineure
[Clôture]         — 1-2 phrases, vision produit Batch
```

## Pages Notion créées

| Langue | Titre |
|--------|-------|
| FR | `[Blog / Newsletter] Nouveautés produit Batch — Q? YYYY` |
| EN | `[Blog / Newsletter] Batch Product Updates — Q? YYYY` |

## Scoring persona

Après chaque rédaction (FR et EN), le skill attribue une note /10 sur deux personas avant de publier. **Minimum requis : 9/10 sur les deux.**

| Persona | Ce qui est évalué |
|---|---|
| **CRM Manager** | Titres opérationnels, cas d'usage dans son vocabulaire, douleurs concrètes réduites, bénéfices chiffrés |
| **CMO** | Vision business en intro/clôture, angle différenciant, lien avec le ROI, lisible en 2 minutes |

Si un score est < 9, le skill révise automatiquement les passages faibles et recalcule avant de publier.

## Style éditorial

- Direct, sans fioriture — on s'adresse à un CRM manager qui manque de temps
- Le problème est nommé avant la solution
- Conviction assumée ("Notre conviction est simple : …")
- Pas de superlatif vide ("révolutionnaire", "puissant", "innovant")
- La version EN est adaptée à un anglais B2B SaaS idiomatique (pas une traduction mot à mot)

## Référence

Blog post example : [Nouveautés produit Batch — mars 2026](https://batch.com/fr/blog/posts/nouveautes-produit-batch-mars-2026)
