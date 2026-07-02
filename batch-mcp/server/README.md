# batch-cep-mcp-server

Serveur MCP local exposant la Batch CEP Profile API (lecture seule, via export async) et la Campaigns API en mode brouillon uniquement (création/modification/suppression de `DRAFT`, jamais d'envoi réel).

Voir le [guide API](../README.md) pour le détail des endpoints, limites et le pourquoi des choix (notamment : pas de lecture synchrone d'un profil unique).

## Installation

```bash
cd server
npm install
npm run build
```

## Configuration

```bash
cp .env.example .env
```

Renseigner dans `.env` (ou en variables d'environnement du process) :

- `BATCH_REST_API_KEY` — Settings → General sur le dashboard Batch.
- `BATCH_PROJECT_KEY` — Settings → General, par projet.

Il n'y a pas de variable pour autoriser l'envoi réel de campagnes : ce serveur ne le permet **jamais**. `state` est figé à `DRAFT` dans le schéma des outils `batch_create_campaign`/`batch_update_campaign` — impossible de demander autre chose, même en se trompant. Pour lancer réellement une campagne, il faut aller sur le dashboard Batch.

## Brancher sur Claude Desktop / Claude Code

Ajouter dans la config MCP du client (ex: `claude_desktop_config.json`) :

```json
{
  "mcpServers": {
    "batch-cep": {
      "command": "node",
      "args": ["/absolute/path/to/batch-mcp/server/dist/index.js"],
      "env": {
        "BATCH_REST_API_KEY": "your_rest_api_key",
        "BATCH_PROJECT_KEY": "your_project_key"
      }
    }
  }
}
```

Ne jamais committer ce fichier de config avec la vraie clé dedans.

## Tools exposés

| Tool | Endpoint Batch | Effet |
|---|---|---|
| `batch_export_profiles` | `POST /profiles/export` | Crée une demande d'export (lecture bulk async) |
| `batch_get_export_status` | `GET /exports/view` | Poll le statut d'un export |
| `batch_download_export` | (download URL) | Télécharge le contenu JSON d'un export terminé |
| `batch_list_exports` | `GET /exports/list` | Liste les exports des 4 derniers mois |
| `batch_create_campaign` | `POST /campaigns/create` | Crée une campagne push/email — **toujours `state: DRAFT`**, jamais envoyée |
| `batch_update_campaign` | `POST /campaigns/update` | Remplace le contenu d'un brouillon existant |
| `batch_delete_campaign` | `POST /campaigns/delete` | Supprime une campagne |
| `batch_list_orchestrations` | `GET /orchestrations/list` | Liste campagnes/automations avec statut |
| `batch_get_orchestration_stats` | `GET /orchestrations/stats` | Stats (sent/open/click/conversion/revenue) |
| `batch_view_orchestration` | `GET /orchestrations/view` | Détail complet d'une campagne push (ciblage, contenu) — push uniquement |
| `batch_list_audiences` | `GET /audiences/list` | Liste les audiences personnalisées |
| `batch_view_audience` | `GET /audiences/view` | Détail d'une audience (taille, état d'indexation) |
| `batch_list_catalogs` | `GET /catalogs/list` | Liste les catalogues produits/contenus |
| `batch_view_catalog` | `GET /catalogs/view` | Détail d'un catalogue (schéma, nombre d'items) |
| `batch_list_segments` | `GET /segments/list` | Liste les segments (utilisables comme filtre d'export) |

Aucun outil d'écriture sur les profils, audiences, catalogues ou segments n'est exposé : ce serveur est lecture-seule sur toute l'API sauf pour les campagnes, où seule la gestion de brouillons (`create`/`update`/`delete`, jamais `RUNNING`) est permise.

## Limitation connue

Il n'y a pas de tool `batch_get_profile(custom_id)` : l'API Batch ne propose pas de lecture synchrone d'un profil unique. Voir la section "Profile API" du [guide principal](../README.md#4-profile-api--ce-quon-peut-et-ne-peut-pas-faire).

## Développement

```bash
npm run dev   # build + run
```

Le serveur communique en stdio (protocole MCP standard) — pas de port HTTP à exposer.
