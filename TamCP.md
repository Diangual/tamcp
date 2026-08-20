# TAMCampagnePlateforme (TamCP)

**Plateforme de gestion des campagnes médicales, dentaires & vétérinaires**

| | |
|---|---|
| **Contexte** | Association médicale |
| **Mode de déploiement** | En ligne |
| **Langues supportées (priorité V1)** | Français · Arabe (possible pour les rapports) |
| **Version** | 0.1 — Mai 2026 |
| **Statut** | Projet — en cours de validation |

Ce document présente le cahier des charges fonctionnel de la plateforme TamCP, outil unifié de gestion des campagnes médicales, dentaires et vétérinaires à destination des équipes de terrain. Il est destiné aux équipes métier et techniques pour validation et priorisation des besoins.

---

## Sommaire

1. Contexte & objectifs
2. Acteurs & rôles
3. Modules fonctionnels
4. Gestion des campagnes — détail
5. Consultations & dossiers patients — détail
6. Pharmacie & gestion de stock — détail
7. Rapports multilingues — détail
8. Contraintes techniques
9. Sécurité & conformité
10. Roadmap & indicateurs de succès

---

<!-- Page 2/5 -->

> ⚠️ L'application doit fonctionner intégralement sans connexion internet. La synchronisation s'effectue automatiquement dès qu'une connexion est disponible.

## 1. Contexte & objectifs

Les campagnes médicales sont menées dans des zones isolées, sans connexion internet stable, avec des équipes pluridisciplinaires (médecins, dentistes, vétérinaires, pharmaciens). Aujourd'hui, la gestion est fragmentée : fichiers Excel, cahiers papier, outils non interopérables. TamCP répond à ce besoin en centralisant toutes les disciplines dans une même application web, fonctionnant hors ligne.

| Problème | Objectif MedCamp |
|---|---|
| Données dispersées et non consolidées | Un seul outil pour toutes les disciplines |
| Rapports chronophages et non standardisés | Génération automatique FR/AR |
| Perte de données sans connexion | Offline-first avec sync différée |
| Stock pharmacie non tracé | Gestion de stock avec alertes de péremption |
| Pas d'historique patient inter-campagnes | Dossier patient persistant multi-campagnes |

## 2. Acteurs & rôles

Six rôles distincts sont définis, chacun avec des droits d'accès granulaires. Un intervenant peut avoir plusieurs rôles au sein d'une même campagne.

| Administrateur | Médecin/Dentiste | Vétérinaire |
|---|---|---|
| ✓ Créer/archiver campagnes<br>✓ Gérer tous les intervenants<br>✓ Accès rapports complets<br>✓ Configurer la pharmacie<br>✓ Paramètres système | ✓ Créer consultations<br>✓ Voir dossiers patients<br>✓ Prescrire médicaments<br>✓ Rapports de sa discipline | ✓ Consultations animaux<br>✓ Suivi espèces/races<br>✓ Accès stock vétérinaire |

| Pharmacien | Infirmier/Aide | Coordinateur |
|---|---|---|
| ✓ Gérer stock entrant<br>✓ Valider dispensations<br>✓ Alertes ruptures stock<br>✓ Rapport consommation | ✓ Enregistrer patients<br>✓ Triage & constantes<br>✓ Vue lecture consultations | ✓ Tableau de bord global<br>✓ Exporter les rapports<br>✓ Lecture seule (pas de saisie clinique) |

## 3. Modules fonctionnels

La plateforme est structurée en six modules interdépendants. Les quatre premiers sont prioritaires pour la V1.

### Gestion des campagnes
Création, configuration (types : médical, dentaire, vétérinaire — un ou plusieurs par campagne), dates, localisation géographique, équipe affectée, statut (actif/clôturé/archivé).  
**V1 — Priorité 1** · Multi-types · Offline · Tableau de bord

### Gestion des intervenants
Création de comptes avec rôle, spécialité et langue préférée. Affectation par campagne. Authentification sécurisée hors-ligne.  
**V1 — Priorité 1** · Auth offline · Multi-campagnes

### Consultations & dossiers patients
Fiche patient (identité, âge, sexe, numéro bénéficiaire). Formulaires adaptés par discipline (anamnèse, diagnostic CIM-10 simplifié, traitement, ordonnance, signature). Historique multi-campagnes.  
**V1 — Priorité 2** · Formulaires dynamiques · Historique · CIM-10

### Pharmacie & gestion de stock
Catalogue, réceptions par lot, dispensation sur ordonnance, alertes seuil et péremption, traçabilité lot par lot. Séparation stock humain/vétérinaire.  
**V1 — Priorité 3** · Péremptions · Traçabilité lots

### Rapports & statistiques multilingues
Rapports campagne (résumé, détaillé, par discipline). Statistiques épidémiologiques. Export PDF et Excel. Génération en français, arabe. Modèles bailleurs personnalisables.  
**V1 — Priorité 4** · PDF + Excel · FR · AR

<!-- Page 3/5 -->

## 4. Gestion des campagnes — détail

### Création d'une campagne
Nom, description, zone géographique (localité), dates de début et fin estimées. Sélection des types d'intervention par cases à cocher : médical, dentaire, vétérinaire (combinaisons libres). Numérotation automatique.  
*Écran principal* · Création guidée · Multi-types

### Configuration par type
Chaque type activé génère des formulaires de consultation spécifiques. Le module vétérinaire ajoute des champs espèce/race/propriétaire. Le module dentaire intègre un schéma dentaire simplifié (sélection des dents concernées).  
*Configuration* · Formulaires adaptatifs · Schéma dentaire

### Affectation de l'équipe
Assigner des intervenants existants avec leurs rôles pour la campagne. Définir les disponibilités (dates, demi-journées). Possibilité d'inviter de nouveaux intervenants directement depuis l'écran campagne.  
*Gestion équipe* · Invitation · Disponibilités

### Tableau de bord campagne
Patients enregistrés, consultations par discipline, stock pharmacie restant, intervenants actifs, dernière synchronisation. Vue temps réel si connecté, vue locale sinon. Alertes visuelles (stock critique, péremptions proches).  
*Dashboard* · Temps réel · Alertes · Offline-safe

## 5. Consultations & dossiers patients — détail

### Enregistrement patient
Numéro unique généré localement. Prénom, nom ou alias, date de naissance ou âge estimé, sexe, téléphone optionnel, localité. Photo optionnelle (basse résolution). Lien possible avec plusieurs campagnes (continuité des soins).  
*Admission* · Photo optionnelle · Multi-campagnes

### Formulaire de consultation
Formulaire adaptatif selon le type (médical / dentaire / vétérinaire). Sections structurées : motif de consultation, antécédents, constantes vitales, examen clinique, diagnostic, traitement prescrit, notes libres, ordonnance, signature numérique de l'intervenant.  
*Consultation* · Adaptatif · Signature · Ordonnance

### Historique & continuité des soins
Toutes les consultations d'un patient sont accessibles chronologiquement, filtrables par campagne, type d'intervention ou intervenant. Un médecin peut consulter les dossiers dentaires ou vétérinaires d'un même patient (vue unifiée).  
*Historique* · Vue unifiée · Filtres · Multi-disciplines

<!-- Page 4/5 -->

## 6. Pharmacie & gestion de stock — détail

### Catalogue & réceptions
Catalogue de médicaments partagé. Réception par lot : numéro de lot, quantité, date de péremption, fournisseur. Scanner de code-barres optionnel via l'appareil photo.  
*Stock entrant* · Lots · Code-barres optionnel

### Dispensation & traçabilité
Sortie de stock déclenchée par ordonnance médicale ou manuelle (cas d'urgence). Chaque sortie est liée à un patient ou anonyme.  
*Dispensation* · Lien ordonnance · Traçabilité

### Alertes & seuils
Alertes configurables : stock inférieur au seuil critique défini, péremption dans les 30/60 jours. Notification dans l'application pour le pharmacien et l'administrateur. Rapport d'inventaire instantané exportable.  
*Alertes* · Alertes seuils · Péremptions · Rapport inventaire

## 7. Rapports multilingues — détail

Les rapports sont un livrable clé pour les bailleurs de fonds et les autorités sanitaires. Ils doivent être générables en quelques clics, dans la langue choisie.

| Type de rapport | Contenu | Format |
|---|---|---|
| Résumé exécutif campagne | Nb patients, consultations par discipline, médicaments dispensés, jours de campagne | PDF · Excel |
| Rapport détaillé campagne | Toutes les consultations anonymisées, pathologies, traitements, intervenants | PDF · Excel |
| Statistiques épidémiologiques | Pathologies fréquentes, répartition par âge/sexe/localité, évolutions | PDF · Excel |
| Rapport de consommation pharmacie | Médicaments dispensés, stock restant, pertes (périmés), besoins estimés | PDF · Excel |
| Rapport bailleur personnalisable | Modèle configurable par l'administrateur selon les exigences du bailleur | PDF |

<!-- Page 5/5 -->

## 8. Contraintes techniques
*(Section à détailler)*

## 9. Sécurité & conformité
*(Section à détailler)*

## 10. Roadmap & indicateurs de succès
*(Section à détailler)*

---

*MedCamp — Cahier des charges fonctionnel v0.1*