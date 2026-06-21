# 📚 Ma Bibliothèque

Catalogue personnel de livres avec scan de code-barres : sais en un instant si tu as déjà lu, prêté, ou rêvé d'un livre — et à qui tu l'as prêté.

Fonctionne comme une app installable sur ton téléphone (PWA), gratuite, hébergée sur GitHub Pages, avec tes données synchronisées entre tous tes appareils via Supabase.

---

## 🚀 Mise en route (à faire une seule fois)

### Étape 1 — Créer le projet Supabase (la base de données)

1. Va sur [supabase.com](https://supabase.com) et crée un compte gratuit.
2. Clique sur **New project**. Choisis un nom (ex : `ma-bibliotheque`), un mot de passe pour la base (note-le quelque part), et une région proche de toi (ex : `eu-west`).
3. Attends ~2 minutes que le projet soit prêt.
4. Va dans **SQL Editor** (menu de gauche) → **New query**.
5. Ouvre le fichier `supabase_schema.sql` de ce projet, copie tout son contenu, colle-le dans l'éditeur SQL de Supabase, puis clique sur **Run**.

   ⚠️ **Tu as déjà une base existante (version précédente de l'appli) ?** Exécute plutôt `migration_v2.sql` à la place — il ajoute les nouvelles colonnes (genre, prix, pages, note, date de lecture) sans toucher à tes livres déjà enregistrés.
6. Va dans **Project Settings** (engrenage en bas à gauche) → **API**. Note ces deux valeurs, tu en auras besoin :
   - **Project URL**
   - **anon public** (clé API)

### Étape 2 — Récupérer le projet sur GitHub

1. Crée un nouveau dépôt **public** sur GitHub (ex : `ma-bibliotheque`).
   ⚠️ Le nom du dépôt doit correspondre à `REPO_NAME` dans `vite.config.js` — modifie cette ligne si besoin.
2. Mets tous les fichiers de ce projet dans ton dépôt (`git init`, `git add .`, `git commit`, `git push`).

### Étape 3 — Configurer les secrets GitHub (pour le déploiement automatique)

1. Dans ton dépôt GitHub, va dans **Settings** → **Secrets and variables** → **Actions**.
2. Clique **New repository secret** et ajoute :
   - `VITE_SUPABASE_URL` → colle ton Project URL (étape 1.6)
   - `VITE_SUPABASE_ANON_KEY` → colle ta clé anon public (étape 1.6)

### Étape 4 — Activer GitHub Pages

1. Dans ton dépôt, va dans **Settings** → **Pages**.
2. Dans **Build and deployment** → **Source**, choisis **GitHub Actions**.
3. Va dans l'onglet **Actions** de ton dépôt : le déploiement se lance automatiquement à chaque `push` sur `main`. Attends qu'il soit vert ✅.
4. Ton appli sera disponible à : `https://<ton-pseudo-github>.github.io/<nom-du-repo>/`

### Étape 5 — Installer l'appli sur ton téléphone

1. Ouvre l'URL ci-dessus dans le navigateur de ton téléphone.
2. **iPhone (Safari)** : bouton Partager → "Sur l'écran d'accueil".
   **Android (Chrome)** : menu ⋮ → "Installer l'application" (ou "Ajouter à l'écran d'accueil").
3. À la première ouverture, choisis une **clé d'accès** personnelle (n'importe quel mot de passe mémorisable) — elle sert à retrouver tes livres sur tous tes appareils.

---

## 🛠️ Développement local (optionnel)

Si tu veux modifier l'appli sur ton ordinateur avant de la déployer :

```bash
npm install
cp .env.example .env
# remplis .env avec tes vraies valeurs Supabase
npm run dev
```

## 🔒 À savoir sur la sécurité

La "clé d'accès" est un système simple adapté à un usage **personnel et privé** (toi + tes proches à qui tu donnerais la clé). Ce n'est pas un système de sécurité de niveau bancaire : si quelqu'un connaît ta clé, ou explore directement l'API Supabase, il pourrait accéder à tes données. Pour cataloguer une bibliothèque personnelle, c'est largement suffisant — évite simplement de publier ta clé publiquement.

## 📖 Fonctionnalités

- Scan de code-barres (ISBN) via la caméra
- Récupération automatique du titre, auteur, couverture, nombre de pages et suggestion de genre (Open Library / Google Books)
- Genre (liste suggérée ou texte libre), prix et nombre de pages éditables
- Notation personnelle en étoiles (sur 5, demi-étoiles possibles)
- Statuts : à lire, lu, prêté (avec le nom de la personne), souhait, dédicacé
- Date de lecture (pré-remplie automatiquement, modifiable)
- Recherche et filtres avancés (genre, auteur, note minimale), tri multiple
- Récapitulatif mensuel et annuel de lectures (nombre de livres, pages, note moyenne, genres et auteurs préférés, coups de cœur)
- Synchronisation entre tous tes appareils

## 🆕 Mise à jour depuis une version précédente

Si tu avais déjà déployé une version antérieure de l'appli :
1. Exécute `migration_v2.sql` dans Supabase (voir étape 5 ci-dessus).
2. Récupère les nouveaux fichiers de ce projet et repousse sur GitHub (`git add .`, `git commit`, `git push`) — le déploiement se relance automatiquement.
