# Batch CEP API → MCP local

Guide pour construire un serveur MCP local qui expose les API Batch (Customer Engagement Platform) comme des *tools* utilisables depuis Claude (ou tout client MCP). Couvre en priorité la **Profile API** et la **Campaigns API**.

Ce document décrit l'API Batch dans son ensemble (lecture et écriture). Le serveur fourni dans [`server/`](server/) implémente volontairement un périmètre plus restreint et plus sûr : **lecture seule** partout (profils via export, audiences, catalogues, segments, orchestrations) et **brouillons uniquement** sur les campagnes (aucun outil ne peut faire passer une campagne en envoi réel). Un skill Claude packagé (sans clé API, à faire configurer par chaque client) est fourni dans [`skill/batch-cep-api/`](skill/batch-cep-api/SKILL.md).

## 1. Prérequis

Pour appeler les API Batch CEP (endpoints `2.x`), il faut deux identifiants, disponibles dans le dashboard Batch (⚙️ Settings → General), visibles uniquement par les comptes avec droit **Administrate** :

| Identifiant | Où le trouver | Rôle |
|---|---|---|
| **REST API Key** | Settings → General | Authentifie toutes les requêtes. **Une seule clé par entreprise**, donne accès à *tous* les projets. |
| **Project Key** | Settings → General (par projet) | Identifie le projet ciblé (`X-Batch-Project` header). |

> ⚠️ La REST API Key permet d'envoyer des push/emails/SMS, lire et écrire tous les profils, et exporter des données. Elle n'est pas scopable (pas de clé lecture-seule, pas de clé par projet). Une fuite = accès complet au compte. En cas de compromission : email à `support@batch.com`, un admin doit valider la révocation.

## 2. Authentification

Trois headers sur chaque requête :

```bash
curl --request POST \
  --url https://api.batch.com/2.11/profiles/update \
  --header 'Content-Type: application/json' \
  --header 'Authorization: Bearer <REST_API_KEY>' \
  --header 'X-Batch-Project: <PROJECT_KEY>' \
  --data '{...}'
```

- `Authorization: Bearer <REST_API_KEY>` (pas `X-Authorization`, c'est l'ancien format des API MEP legacy)
- `X-Batch-Project: <PROJECT_KEY>`
- `Content-Type: application/json`

Base URL : `https://api.batch.com/{version}` (version courante : `2.11`).

Spec OpenAPI complète (utile pour un bridge générique OpenAPI→MCP) : https://openapi.gitbook.com/o/yV0lmz43uUZMgWmM3297/spec/batch-api.yaml

## 3. Rate limits

| Endpoint | Limite |
|---|---|
| Défaut (CEP) | 1 req/s par project key |
| `/profiles/update` | 300 updates/s, burst 1000 |
| `/profiles/mass-update` | 10 000 updates/s, pas de burst |
| `/profiles/export` (avec filtre `segment`) | 5 req/h (1 toutes les 12 min), burst 10 |
| `/catalogs/*` | 5 req/s |

Une limite dépassée renvoie `429 Too Many Requests` — le client doit backoff, Batch ne retry pas pour vous.

## 4. Profile API : ce qu'on peut (et ne peut pas) faire

Le modèle Batch centralise les données utilisateur dans des **Profiles**, identifiés par un **Custom ID** (votre ID utilisateur interne). Un profil agrège attributs, events et abonnements (email/SMS/push) venant du SDK mobile/web *et* de l'API.

### Écriture (existe dans l'API, non exposée par notre serveur)

- **`POST /profiles/update`** — mise à jour temps réel, jusqu'à 200 profils par appel. Permet de fixer des attributs natifs (`$email_address`, `$phone_number`, `$language`, `$topic_preferences`, etc.), des attributs custom, et de tracker des events avec leurs propres attributs.
- **`POST /profiles/mass-update`** — même chose mais pour des imports massifs (jusqu'à 10 000 profils/appel), pensé pour 1-2 syncs/jour, pas du temps réel.

> Le serveur `server/` fourni ici n'expose volontairement **aucun outil pour ces deux endpoints** : le périmètre choisi est lecture seule sur les profils.

### Lecture — ⚠️ point important

**Il n'existe pas d'endpoint pour lire un profil unique en synchrone** (pas de `GET /profiles/{custom_id}`). La seule voie de lecture officielle est l'**Export API**, qui est :
- **asynchrone** (on crée une demande, on poll son statut, puis on télécharge un fichier)
- **en masse** — filtrable par segment, mais pas par un `custom_id` précis
- rate-limitée à 5 req/h dès qu'on utilise un filtre

Concrètement : si le besoin est "afficher les infos du profil de tel client à la demande", **l'API Batch ne le permet pas nativement aujourd'hui**. C'est un vrai gap à connaître avant de concevoir un tool MCP de type `get_profile(custom_id)` — il ne peut pas exister sous cette forme avec l'API publique actuelle. Les seules options :
1. Exporter en masse périodiquement et interroger votre propre copie des données (pas un MCP en temps réel).
2. Utiliser l'Export API en mode événementiel/segment pour des rapports, pas du lookup ponctuel.

**Flux Export (asynchrone) :**

```
POST /profiles/export   → { "id": "export_xxx" }        (créer la demande)
GET  /exports/view?id=export_xxx   → { status: "SUCCESS", files: [...] }   (poller le statut)
GET  <files[].url>       → contenu JSON (via /exports/download)            (télécharger)
```

Types d'export : `ATTRIBUTES` (snapshot des attributs + identifiants), `EVENTS` (events sur une période, lookback 90 jours), `REACHABILITY` (historique opt-in/opt-out par canal, lookback 90 jours).

## 5. Campaigns API

Pilotage des campagnes push/email 1-to-many (CRUD, pas de "send" séparé : l'état `DRAFT`/`RUNNING`/`STOPPED` fait foi).

| Endpoint | Usage |
|---|---|
| `POST /campaigns/create` | Crée une campagne (push ou email). `state: "RUNNING"` + `when.start_time: "now"` pour un envoi immédiat, `"DRAFT"` pour préparer sans envoyer. |
| `POST /campaigns/update` | Remplace intégralement une campagne existante (par `id`). Impossible sur une campagne en cours/terminée non récurrente. |
| `POST /campaigns/delete` | Supprime une campagne par `id`. |

Le **côté lecture** des campagnes (liste, statuts, stats) passe par l'**Orchestrations API** (une "orchestration" = campagne, automation récurrente, trigger, ou in-app) :

| Endpoint | Usage |
|---|---|
| `GET /orchestrations/list` | Liste paginée, filtrable par `status`, `type`, `channels`. |
| `GET /orchestrations/stats?orchestration_id=...&from=...&to=...` | Métriques (sent, delivered, opens, clicks, conversions, revenue...). |

> ⚠️ `campaigns/create` avec `state: RUNNING` et `start_time: now` **envoie réellement des notifications/emails à de vrais utilisateurs**. C'est l'endpoint le plus sensible du périmètre. Dans le serveur fourni ici, `state` est figé à `DRAFT` au niveau du schéma du tool — `RUNNING` n'est même pas une valeur acceptable, donc aucun envoi réel n'est possible depuis cet outil. Lancer une campagne reste un geste humain, fait sur le dashboard Batch.

## 6. Construire le serveur MCP

Deux approches :

**A. Générique (OpenAPI → MCP)** — le plus rapide : Batch publie sa spec OpenAPI complète (lien ci-dessus). Un bridge générique openapi-to-mcp génère automatiquement un tool par endpoint. Avantage : zéro maintenance quand Batch ajoute des routes. Inconvénient : moins de contrôle fin sur les tools exposés (risque d'exposer des endpoints sensibles comme `campaigns/create` sans garde-fou).

**B. Sur-mesure (fourni dans `server/`)** — un serveur Node/TypeScript avec le SDK officiel `@modelcontextprotocol/sdk`, qui n'expose que les tools voulus, avec validation Zod et des descriptions pensées pour un LLM. C'est l'approche recommandée pour un usage client-facing : on contrôle exactement ce qu'un agent peut faire — ici, pas d'écriture sur les profils, et `campaigns/create`/`update` acceptent uniquement `state: DRAFT` (contrainte au niveau du schéma, pas juste une consigne textuelle).

Voir [`server/README.md`](server/README.md) pour l'installation et la configuration.

## 7. Sécurité — clé API dans un MCP local

Oui, c'est acceptable pour un usage local (voir discussion complète dans la conversation d'origine). Résumé :

- Stocker la clé en variable d'environnement, jamais en dur dans le code ni committée.
- Une seule REST API Key par entreprise Batch → pas de scoping possible. Traiter le process du serveur MCP comme un accès admin complet au compte Batch.
- Ne **jamais** inclure une clé dans un skill distribué à des clients : chaque client doit configurer *sa propre* clé (variable d'environnement locale), le skill ne fait que documenter le comportement attendu des tools.
- Risque principal : prompt injection dans une session où l'agent a aussi d'autres outils (lecture de mails, web) — un contenu malveillant pourrait tenter de déclencher un export de données en masse ou la création d'un brouillon de campagne indésirable. Le serveur fourni élimine déjà le pire scénario (envoi réel) en rendant `RUNNING` impossible au niveau du schéma ; il reste malgré tout prudent de garder un œil sur les exports demandés et les brouillons créés.
