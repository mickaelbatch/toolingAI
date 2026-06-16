# quarterly-product-content

Skill Claude Code qui génère le blog post et la newsletter produit trimestrielle de Batch — en français et en anglais — puis les publie dans Notion.

## Ce que fait ce skill

À partir des releases publiées dans `#product-releases` sur Slack, le skill :

1. **Collecte** les releases sur la période demandée
2. **Filtre** pour ne garder que les features client-facing (élimine les releases internes, techniques, et mineures)
3. **Organise** les features autour de 2-3 angles narratifs forts (pas de liste chronologique)
4. **Rédige** le contenu en français puis en anglais, dans le style éditorial Batch
5. **Publie** deux pages Notion (FR + EN) et partage les liens

Blog post et newsletter ont le même contenu — seul le format final diffère légèrement.

## Quand l'utiliser

Ce skill se déclenche dès qu'on parle de :

- "blog post du quarter"
- "newsletter produit" / "newsletter clients"
- "product update trimestriel" / "récap produit"
- "nouveautés Batch Q1/Q2/Q3/Q4"
- "rédige le contenu de nos releases"
- "prépare le product tour du semestre"

## Prérequis

- Accès Slack connecté (pour lire `#product-releases`)
- Accès Notion connecté (pour créer les pages)
- Connaître la période à couvrir (ex : "Q2 2026" ou "janvier–mars 2026")

## Utilisation

```
/quarterly-product-content
```

Le skill te demandera la période si elle n'est pas fournie, puis proposera un plan de structuration narrative avant de rédiger.

## Structure du contenu généré

```
[Titre]           — centré sur le bénéfice, pas les noms de features
[Intro]           — 3-5 lignes, frictions du quarter, invitation à lire
[2-3 grandes features]
  H2 = bénéfice   — nom de feature en gras à la 1ère apparition
  "Concrètement:" — 3-5 cas d'usage pratiques
[Nos autres nouveautés]
  H3 courts       — 2-3 lignes par feature mineure
[Clôture]         — 1-2 phrases, vision produit Batch
```

Longueur cible : **600–900 mots** par version (FR et EN).

## Pages Notion créées

| Langue | Titre |
|--------|-------|
| FR | `[Blog / Newsletter] Nouveautés produit Batch — Q? YYYY` |
| EN | `[Blog / Newsletter] Batch Product Updates — Q? YYYY` |

## Style éditorial

- Direct, sans fioriture — on s'adresse à un CRM manager qui manque de temps
- Le problème est nommé avant la solution
- Conviction assumée ("Notre conviction est simple : …")
- Pas de superlatif vide ("révolutionnaire", "puissant", "innovant")
- La version EN est adaptée à un anglais B2B SaaS idiomatique (pas une traduction mot à mot)

## Référence

Blog post example : [Nouveautés produit Batch — mars 2026](https://batch.com/fr/blog/posts/nouveautes-produit-batch-mars-2026)
