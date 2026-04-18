# Squelette de structure du projet (référence pour une nouvelle app)

Ce document résume **comment ce dépôt est organisé** pour qu’un autre agent (Cursor) puisse **reproduire le même type d’architecture** sur une autre application (ex. site web + backend déployé sur Vercel ou ailleurs).  
Objectif : **même idée de dossiers, Docker, Nginx, API REST, base de données** — pas copier les routes métier à l’identique.

---

## 1. Vue d’ensemble

| Couche | Rôle |
|--------|------|
| **Frontend** | HTML/CSS/JS statique servi par **Nginx** (port 80). Le JS appelle l’API en **`/api/...`** (même origine grâce au reverse proxy). |
| **Web-controller** (optionnel) | Deuxième site statique + Nginx (port 81), souvent pour un **second client** (téléphone / manette). Peut n’utiliser que **MQTT** sans passer par `/api`. |
| **Backend** | API HTTP (ici **Java Vert.x**, port **8080**). Routes préfixées par **`/api/...`**. |
| **Base de données** | **MariaDB** dans Docker, scripts d’init SQL montés au démarrage. Connexion JDBC côté backend via variables d’environnement. |
| **Temps réel (optionnel)** | **MQTT** (broker Mosquitto) + préfixe de topics ; le frontend injecte la config broker via **`env.js`** (généré ou fichier statique). |

Pour **Vercel** : en général le **frontend** est sur Vercel ; le **backend** sera une autre URL (Serverless, Node, autre). Il faudra alors remplacer le proxy Nginx `/api` par une **URL absolue** (`fetch(process.env.API_URL + '/api/...')`) ou des réécritures Vercel — **le squelette logique reste le même** (dossiers, séparation des responsabilités).

---

## 2. Arborescence type (à reproduire)

```
racine/
├── docker-compose.yml          # Orchestre tous les services
├── .env                        # Secrets / ports (non versionné en prod idéal)
├── mariadb/
│   └── mariadb_init/           # Scripts .sql exécutés au 1er démarrage MariaDB
├── mosquitto/                  # (optionnel) config broker MQTT
├── frontend/
│   ├── index.html              # Point d’entrée SPA / pages
│   ├── css/
│   ├── js/
│   │   ├── app.js              # UI / navigation
│   │   ├── http/               # appels REST (fetch vers /api/...)
│   │   ├── mqtt/               # client MQTT navigateur si besoin
│   │   └── env.js              # ou généré : window.__ENV__ pour broker MQTT
│   └── nginx/
│       └── conf.d/
│           └── default.conf    # listen 80 + proxy /api → backend
├── web-controller/             # (optionnel) même idée : html + js + nginx
│   ├── controller.html
│   ├── controller.js
│   └── nginx/
│       ├── conf.d/default.conf # listen 81, fichiers statiques
│       └── entrypoint.sh       # optionnel : génère env.js depuis env Docker
└── java-backend/               # ou node-backend/, etc.
    ├── Dockerfile              # build multi-stage → image légère
    ├── pom.xml                 # (Java) dépendances
    └── src/main/java/...       # packages par domaine
```

**Principe** : un dossier **par rôle** (frontend, backend, BDD, broker), pas tout mélangé à la racine.

---

## 3. Docker Compose (pattern)

Services typiques dans ce projet :

| Service | Image / build | Ports | Rôle |
|---------|---------------|-------|------|
| **mariadb** | `mariadb:latest` | `${DB_PORT}:3306` | BDD + volume persistant + healthcheck |
| **java-backend** | build `./java-backend` | `8080:8080` | API REST |
| **frontend** | `nginx:latest` + volumes | `80:80` | Statique + proxy `/api` |
| **web-controller** | `nginx:latest` + volumes | `81:81` | Statique secondaire |
| **mosquitto** | `eclipse-mosquitto` | 1883, 9001 | MQTT (optionnel) |
| **phpmyadmin** | optionnel | ex. 8081 | Admin BDD en dev |

Variables injectées au backend (exemple de **noms** à garder comme convention) :

- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- `MQTT_BROKER_URL`, `MQTT_BROKER_PORT`, `MQTT_MESSAGE_PREFIX`, `MQTT_USERNAME`, `MQTT_PASSWORD`

Réseau Docker nommé (ex. `game-network`) pour que les conteneurs se résolvent par **nom de service** (`java-backend`, `mariadb`).

---

## 4. Nginx — frontend (pattern important)

- **`location /`** : sert les fichiers depuis `/usr/share/nginx/html` (montage du dossier `frontend/`).
- **`location /api`** : `proxy_pass` vers le backend (ex. `http://java-backend:8080`) pour que le navigateur appelle **`/api/...`** sans CORS ni port différent côté client.

Utilisation de **`resolver` + variable** (`set $java_backend ...`) si besoin de résolution DNS dynamique dans Docker.

Le **web-controller** peut se contenter d’un **seul `location /`** (port 81) si tout passe par MQTT.

---

## 5. Backend — type de routes (pas les URLs exactes)

Convention de ce projet :

- Préfixe global **`/api`**
- Sous-domaines logiques par package : **`/api/auth/...`**, **`/api/lobby/...`**, **`/api/game/...`**, **`/api/players/...`**, **`/api/controllers/...`**, **`/api/highscores/...`**
- Chaque domaine = dossier package avec :
  - `*Controller` : enregistre les routes (`registerRoutes(Router)`)
  - `*Service` : logique métier
  - `*Repository` : accès BDD (requêtes SQL)

Point d’entrée : un **seul** endroit qui instancie la liste des contrôleurs et appelle `registerRoutes` sur le même `Router` (équivalent de `MainVerticle.setupHttpVerticle`).

Couche HTTP commune :

- **Body parser** (JSON/form)
- **CORS** si appels cross-origin (obligatoire si frontend Vercel ≠ domaine API)

---

## 6. Base de données (pattern)

- **Docker** : service MariaDB avec `MARIADB_DATABASE`, `MARIADB_USER`, `MARIADB_PASSWORD`, volume pour données.
- **Init** : scripts SQL dans `mariadb/mariadb_init/` montés sur `/docker-entrypoint-initdb.d` (exécution au premier boot).
- **Backend** : un client singleton (pool JDBC ici) initialisé avec un objet config contenant au minimum :
  - `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- Test de connexion au démarrage (ex. `SELECT 1`) pour fail-fast.

Sur **Vercel** : la BDD sera souvent **hébergée ailleurs** (PlanetScale, Neon, Supabase, RDS…). Garder les **mêmes noms de variables** côté app et adapter uniquement l’URL JDBC / le driver.

---

## 7. Frontend JS (pattern)

- **`fetch('/api/...')`** pour REST (grâce au proxy Nginx en local).
- Fichiers séparés par responsabilité : **`js/http/`** pour l’API, **`js/mqtt/`** pour le temps réel si besoin.
- **`env.js`** ou équivalent : expose `window.__ENV__` (broker MQTT, préfixe topics) — peut être **généré au démarrage du conteneur** (`entrypoint.sh` avec `cat <<EOF`).

---

## 8. MQTT (optionnel)

- Broker séparé (Mosquitto).
- Préfixe de topics partagé entre frontend et backend (variable `MQTT_MESSAGE_PREFIX`).
- Le backend publie / s’abonne ; le frontend utilise **WebSocket** (ex. port 9001) si le broker l’expose.

Pour une nouvelle app sans MQTT : **omettre** Mosquitto et les dossiers `mqtt/` ; garder seulement HTTP + BDD.

---

## 9. Checklist pour “faire pareil” sur une autre app

1. Racine avec **`docker-compose.yml`** + **`.env`** (noms de variables documentés).
2. Dossier **`frontend/`** : `index.html`, `css/`, `js/` (+ sous-dossiers `http/`, `mqtt/` si besoin).
3. **`frontend/nginx/conf.d/default.conf`** : statique + **`location /api`** → service backend.
4. Dossier **`backend/`** (langage au choix) : Dockerfile, une couche HTTP, routes **`/api/...`**, modules par domaine (Controller / Service / Repository).
5. Dossier **`mariadb/mariadb_init/`** (ou autre SGBD) avec scripts d’init + healthcheck dans Compose.
6. (Optionnel) **`web-controller/`** ou second frontend + Nginx sur un autre port.
7. (Optionnel) MQTT + `env.js` injecté.

---

## 10. Adaptation Vercel (rappel court)

- **Frontend** : déployé comme site statique ou framework ; les `fetch` pointent vers **`https://ton-api.vercel.app/api/...`** (ou domaine custom).
- **Backend** : fonctions serverless ou projet séparé ; mêmes **préfixes `/api`** si tu veux garder la même mentalité.
- **BDD** : service managé ; variables d’environnement dans le dashboard Vercel / le backend.
- **Pas de Docker Compose en prod Vercel** : Compose reste utile pour **développement local** identique à cette structure.

---

*Document généré pour servir de modèle à une autre instance Cursor — à adapter au langage du backend (Node, Python, etc.) et au hébergeur choisi.*
