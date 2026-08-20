# AVIS SUR LE CAHIER DE CHARGE DE TamCP

Le cahier des charges du projet TamCP est très prometteur et répond à un besoin réel sur le terrain. Voici mon analyse détaillée, organisée par points forts, points de vigilance et suggestions.

### Points forts remarquables

- **Offline-first bien pensé** : La promesse d’un fonctionnement intégral sans connexion avec synchronisation différée est parfaitement adaptée aux zones isolées. C’est la colonne vertébrale du projet et c’est la bonne approche.
- **Unification multi-disciplinaire** : Regrouper médical, dentaire et vétérinaire dans un seul outil avec des formulaires adaptatifs (schéma dentaire, espèce/race) est une excellente idée pour éviter les silos et avoir une vue patient globale.
- **Traçabilité pharmaceutique** : Gestion par lot, alertes de péremption, lien ordonnance-dispensation, code-barres optionnel – c’est du niveau d’une officine, ce qui est rare dans les outils de campagne humanitaire.
- **Continuité des soins** : L’historique patient persistant d’une campagne à l’autre est un vrai plus pour la qualité des prises en charge.
- **Rapports multilingues exportables** : Génération en français et arabe, modèles bailleurs personnalisables – c’est exactement ce qu’attendent les financeurs et les autorités sanitaires.
- **Rôles et droits granulaires** : La définition des 6 profils avec des permissions adaptées (coordinateur en lecture seule, pharmacien centré sur le stock, etc.) montre une bonne compréhension des flux de travail terrain.

### Points de vigilance et risques

- **Complexité de la synchronisation offline** : C’est le défi technique principal. Comment gérer les conflits quand deux utilisateurs modifient le même dossier patient ou dispensent les mêmes lots sans connexion ? Le document reste silencieux sur la stratégie (dernier écrivain gagnant, CRDT, validation serveur…). Une mauvaise gestion peut corrompre les données.
- **Identifiants uniques générés localement** : Les numéros de patients créés hors ligne risquent de créer des doublons lors de la fusion. Il est impératif d’utiliser des UUID (ou un préfixe par appareil) pour éviter les collisions.
- **Expérience utilisateur sur le terrain** : Avec autant de fonctionnalités (formulaires adaptatifs, signature, photo, code-barres), l’interface risque d’être lourde sur des appareils d’entrée de gamme, souvent utilisés par les volontaires. Une ergonomie minimaliste et des temps de chargement optimisés seront critiques.
- **Volume des photos et stockage local** : Les photos, même en basse résolution, peuvent saturer la mémoire des terminaux sur une campagne de plusieurs semaines. Une compression agressive et une purge automatique après synchronisation sont nécessaires.
- **Gestion de stock partagée offline** : Si deux pharmaciens ou dispensateurs travaillent hors ligne sur le même lot, comment éviter les stocks négatifs ? Le système doit soit imposer un verrouillage, soit disposer d’un mécanisme de réservation temporaire avec réconciliation.
- **Sécurité et conformité** : L’authentification hors ligne est mentionnée, mais pas le chiffrement des données au repos ni les aspects réglementaires (protection des données de santé, selon les pays). C’est pourtant indispensable pour un outil manipulant des données médicales identifiables.
- **Roadmap V1 ambitieuse** : Vouloir couvrir l’intégralité des modules (campagnes, consultations, pharmacie, rapports multilingues) pour mai 2026 en partant de zéro est un calendrier tendu. Un MVP recentré sur 1-2 disciplines avec une synchronisation simple pourrait être plus sûr.

### Suggestions concrètes

1.  **Définir la stratégie de synchronisation avant tout développement** : Choisir une base technologique adaptée (ex. PouchDB/CouchDB qui gère nativement l’offline et la réplication, ou IndexedDB avec un protocole CRDT). Documenter la résolution des conflits pour chaque entité (patient, consultation, lot).
2.  **Imposer les UUID pour toutes les entités** (patients, campagnes, ordonnances) afin d’éliminer les doublons d’identifiants locaux.
3.  **Concevoir une interface mobile-first extrêmement légère** (PWA ou application web simple). Réduire au maximum les champs libres, privilégier les listes déroulantes et les cases à cocher pour accélérer la saisie en mobilité.
4.  **Mettre en place un mode “kiosque” ou un verrouillage de lot** pour la pharmacie offline, ou au minimum une alerte bloquante en cas de tentative de dispensation sur un stock théorique épuisé.
5.  **Prévoir un chiffrement de la base locale** (ex. SQLCipher pour SQLite, ou IndexedDB chiffré via Web Crypto) et une gestion robuste des tokens d’authentification offline.
6.  **Organiser un pilote terrain très tôt** avec une seule discipline (ex. médical) et 2-3 appareils, en zone réellement déconnectée, pour valider l’ergonomie, la synchronisation et l’autonomie des batteries.
7.  **Ajouter une notion de “campagne jumelle” ou de partage de patients** : un patient vu en médical peut être ensuite vu en dentaire dans la même campagne ; le lien inter-consultations gagnerait à être facilité (ex. QR code patient imprimé ou scanné depuis le dossier).
8.  **Pour les rapports bailleurs personnalisables**, prévoir un système simple de templates (type HTML/Word avec balises) pour ne pas devoir redévelopper à chaque demande de financeur.

En résumé, le cahier des charges est complet, cohérent et aligné sur les réalités du terrain. Les choix fonctionnels sont pertinents. La réussite du projet dépendra désormais de la robustesse de la couche offline/sync, de l’ergonomie sur petits écrans et de la gestion fine des stocks distribués. Si ces écueils sont bien adressés, TamCP a un vrai potentiel pour devenir un outil de référence pour les ONG et associations de santé mobile.

---

# PLAN DE REALISATION

La réalisation d’un projet comme TamCP, avec sa forte composante offline-first et multidisciplinaire, nécessite une approche rigoureuse, itérative et centrée sur le terrain. Voici les étapes clés que je recommande, organisées en phases successives avec des jalons de validation.

## Phase 1 : Cadrage & conception détaillée (2 à 3 mois)

**Objectif** : figer le périmètre fonctionnel, les choix techniques et les maquettes avant tout développement.

1.  **Analyse des flux terrain et des contraintes réelles**
    - Organiser des ateliers avec chaque profil utilisateur (médecin, pharmacien, coordinateur…) pour cartographier leurs processus de travail en situation déconnectée.
    - Recenser précisément les volumes attendus : nombre de patients par jour, taille des photos, nombre d’articles en stock, fréquence de synchronisation.
2.  **Spécifications fonctionnelles détaillées (SFD)**
    - Transformer le cahier des charges en user stories avec critères d’acceptation.
    - Détailler chaque module : écrans, champs, règles métier (ex. : un lot périmé ne doit pas pouvoir être dispensé), comportement offline (que voit-on quand on est déconnecté ? quelles actions sont possibles ?).
    - **Livrable** : document de SFD validé par les métiers.
3.  **Maquettage et prototypage UX/UI**
    - Concevoir une interface mobile-first, sobre, optimisée pour des écrans peu lumineux et des doigts (boutons larges, listes de choix plutôt que saisies libres).
    - Simuler les cas dégradés : file d’attente de synchronisation, conflits, alertes stock.
    - Faire tester les prototypes papier/cliquables par quelques utilisateurs cibles.
    - **Livrable** : maquettes validées.
4.  **Choix d’architecture et preuve de concept (POC) de la synchronisation**
    - **Point crucial** : la couche offline/sync est le socle. Choisir une technologie adaptée (PouchDB/CouchDB, WatermelonDB, CRDT personnalisé avec IndexedDB…).
    - Réaliser un POC sur un cas simple (création de patients + consultations) avec deux appareils en mode avion, puis synchronisation avec résolution de conflits.
    - Valider la stratégie de résolution des conflits (dernier écrivain gagnant, fusion automatique avec horodatage, etc.).
    - **Livrable** : POC fonctionnel et document d’architecture validé.

## Phase 2 : Développement itératif (2 à 3 mois)

**Méthodologie** : cycles agiles (sprints de 1 à 2 semaines), avec des incréments livrables et testables sur le terrain.

### Sprint 0 : Mise en place socle technique
- Environnement de développement, CI/CD.
- Base de données locale, API de synchronisation, gestion des comptes et authentification hors ligne (JWT avec cache local sécurisé).
- Chiffrement de la base locale (obligatoire pour les données de santé).

### Vague 1 – MVP « Campagne médicale simple » (Priorités 1 & 2)
- Création/gestion de campagnes (mono-discipline : médical d’abord).
- Gestion des intervenants et rôles.
- Dossier patient et formulaire de consultation médicale (avec signature simplifiée).
- Historique patient inter-campagnes.
- Tableau de bord campagne offline/online.
- **Livrable** : une première version testable sur le terrain en mode déconnecté.

### Vague 2 – Pharmacie & multi-disciplinarité (Priorité 3)
- Module pharmacie : catalogue, réception de lots, dispensation liée à une ordonnance, alertes péremption/stock bas.
- Séparation stock humain/vétérinaire.
- Extension aux formulaires dentaire (schéma dentaire) et vétérinaire (espèces/races).
- Synchronisation avancée des stocks et verrouillage logique en offline.

### Vague 3 – Rapports & finalisation (Priorité 4)
- Génération des rapports multilingues (FR/AR) en PDF/Excel.
- Modèles bailleurs configurables.
- Export des données, statistiques épidémiologiques.
- Tests de performance et de montée en charge.

## Phase 3 : Tests & pilote terrain (2 mois)

1.  **Tests internes**
    - Tests unitaires, intégration, tests de synchronisation avec scénarios de conflits.
    - Tests de robustesse : batterie faible, coupure réseau en pleine sync, mémoire pleine.
2.  **Pilote sur site réel**
    - Déployer l’application sur 5–10 appareils lors d’une vraie campagne (ou une campagne simulée en conditions réelles).
    - Former les utilisateurs (1 journée).
    - Collecter les retours : bugs, lenteurs, incompréhensions, besoins d’évolution.
    - Itérer rapidement (correctifs et ajustements UX).
3.  **Recette métier et validation finale**
    - Revue de conformité avec le cahier des charges initial.
    - Validation de la sécurité (test d’intrusion basique, audit de la base locale chiffrée).
    - **Livrable** : version V1 prête pour déploiement.

## Phase 4 : Déploiement & formation (1 mois)

- Mise en production de l’infrastructure serveur (cloud ou serveur dédié selon le contexte).
- Création des comptes et paramétrage des campagnes à venir.
- Formation des formateurs ou des coordinateurs (guide utilisateur simple, fiches réflexes “que faire si…”, vidéos).
- Mise en place d’un canal de support (messagerie instantanée, ticket) pour les premières semaines.

## Phase 5 : Suivi & maintenance continue

- Supervision de la synchronisation (tableau de bord des erreurs, files d’attente).
- Recueil des demandes d’évolution pour une V2.
- Mise à jour du dictionnaire des médicaments, des codes CIM-10 simplifiés.
- Correctifs de sécurité et compatibilité avec les nouveaux OS mobiles.

## Facteurs clés de succès

- **Impliquer les utilisateurs finaux dès la conception** : leur expertise terrain est irremplaçable pour éviter de construire une usine à gaz inadaptée.
- **Traiter la synchronisation offline comme le cœur du système** : un échec sur ce point rend l’application inutilisable. Le POC doit être validé avant tout développement métier.
- **Privilégier un MVP simple mais robuste** : médical seul avec synchronisation fiable, plutôt que toutes les disciplines avec des bugs de sync. L’extension se fera naturellement.
- **Budget et délais réalistes** : prévoir une marge de 20 à 30 % pour les imprévus techniques, en particulier la synchronisation et l’ergonomie terrain.

En suivant ces étapes, le projet TamCP a toutes les chances d’aboutir à un outil réellement utile et adopté par les équipes de terrain.