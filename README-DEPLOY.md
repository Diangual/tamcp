# Guide de Déploiement TamCP (Serveur / VPS)

Ce guide explique comment déployer l'application TamCP de manière sécurisée et pérenne sur un serveur dédié ou un VPS. Le déploiement repose sur Docker et Docker Compose, ce qui assure une excellente isolation, une portabilité totale, ainsi que des redémarrages automatiques en cas de crash (anti-crash natif).

## Prérequis
1. Un serveur/VPS (Linux recommandé : Ubuntu/Debian).
2. [Docker](https://docs.docker.com/engine/install/) et [Docker Compose](https://docs.docker.com/compose/install/) installés.
3. Git installé.

## Étape 1 : Cloner le projet sur le serveur
```bash
git clone <URL_DE_VOTRE_DEPOT> tamcp
cd tamcp
```

## Étape 2 : Configuration
Modifiez le fichier `.env.production` à la racine pour y inscrire vos mots de passe sécurisés :
```ini
DB_PASSWORD=votre_mot_de_passe_sql_tres_securise
JWT_SECRET=votre_cle_secrete_longue_et_aleatoire
```

*(L'URL de l'API est déjà configurée pour utiliser Nginx de façon transparente en production).*

## Étape 3 : Lancement (Build & Start)
Lancez simplement la commande suivante à la racine du projet :
```bash
docker-compose up -d --build
```
Cette commande va :
- Construire l'image du Frontend (Vite -> Nginx)
- Construire l'image du Backend (Node.js)
- Lancer la base de données PostgreSQL
- Lancer le service automatisé de sauvegardes (Backups)

Vous pouvez vérifier que tout fonctionne avec :
```bash
docker-compose ps
```

## Étape 4 : Exposition et HTTPS (Pour la PWA)
Pour que la PWA (Progressive Web App) puisse être installée sur toutes les plateformes (iOS, Android, Windows, macOS), l'application **doit être servie en HTTPS**.

Vous avez deux choix simples avec ce setup :

**Choix A (Recommandé) : Utiliser un Load Balancer Cloud**
Si vous utilisez un fournisseur Cloud (AWS, GCP, DigitalOcean), vous pouvez placer un Load Balancer ou un Cloudflare Proxy devant l'IP de votre serveur. Configurez le Load Balancer pour gérer le SSL/HTTPS et pointez-le vers le port 80 de votre VPS.

**Choix B : Caddy / Nginx Reverse Proxy (Certbot) sur le serveur**
Si vous avez un domaine (ex: `app.votredomaine.com`), installez Caddy Server ou Nginx avec Certbot directement sur le serveur hôte. Ce proxy pointera vers le port 80 exposé par `docker-compose`.

Exemple Caddyfile :
```caddyfile
app.votredomaine.com {
    reverse_proxy localhost:80
}
```

## Maintenance & Backups
- **Sauvegardes (Automatisé)** : Le service `db-backup` crée un `pg_dump` complet toutes les nuits. Les backups sont placés dans le dossier `./backups/` sur votre serveur hôte. Il garde les 7 derniers jours et nettoie les plus vieux automatiquement.
- **Mise à jour** : Lorsque vous poussez du nouveau code, lancez simplement :
```bash
git pull
docker-compose up -d --build
```
Cela mettra à jour vos services sans interruption longue (Zéro Downtime relatif).
- **Voir les logs** : 
```bash
docker-compose logs -f backend
```

## CI/CD (Mises é jour automatiques)
Un workflow GitHub Actions est inclus dans le fichier .github/workflows/deploy.yml. Ce pipeline automatisé déploiera la derniére version de votre code sur votre serveur à chaque fois que vous ferez un 'Push' sur la branche \main\ ou \master\.

Pour l'activer, vous devez ajouter les \Secrets\ suivants dans les paramétres de votre dépôt GitHub (Settings -> Secrets and variables -> Actions) :
- \SERVER_HOST\ : L'adresse IP de votre serveur
- \SERVER_USERNAME\ : Votre nom d'utilisateur SSH (ex: ubuntu, root)
- \SERVER_SSH_KEY\ : Votre clé privée SSH permettant de se connecter au serveur

Une fois configuré, les mises à jour et correctifs futurs seront déployés en production automatiquement et de manière transparente !
