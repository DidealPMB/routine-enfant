# Routine Enfant — Commercial V2 Roadmap

## Stratégie
Développer et stabiliser la V2 commerciale d'abord en application web responsive. Capacitor ne sera ajouté qu'après validation UX, données, synchronisation et parcours premium.

## Phase 1 — Socle web commercialisable
- Refactor léger du code par modules sans casser les fonctions existantes.
- Création libre de missions : texte, emoji, section, jours actifs, fréquence, poids.
- Modèles de routines prêts à l'emploi : Matin 3–5 ans, Midi, Sieste/temps calme, Soir, Propreté, École, Autonomie.
- Planning par jour : école, mercredi, week-end, vacances.
- Paramètres famille et profils enfants.
- Historique illimité côté produit.
- Export/import de sauvegarde robuste.
- Internationalisation préparée (FR en premier).

## Phase 2 — Gamification premium
- Carte d'aventure avec mondes : espace, pirates, dinosaures, chevaliers, jungle.
- Avatar évolutif et objets cosmétiques débloqués par la progression.
- Coffres hebdomadaires.
- Boutique virtuelle parentale : dépenses d'étoiles contre récompenses définies par le parent.
- Badges par familles et paliers Bronze / Argent / Or / Diamant.
- Badges secrets et événementiels.
- Défis hebdomadaires configurables ou suggérés au parent.
- Séries et records sans mécanique punitive.

## Phase 3 — Tableau de bord parent
- Statistiques par section et action.
- Progression semaine / semaine et mois / mois.
- Détection des points forts et axes d'amélioration.
- Suggestions de défis, toujours validées par le parent.
- Rapport mensuel exportable.
- Notes contextuelles par journée.

## Phase 4 — Famille & Cloud
- Authentification parentale.
- Synchronisation multi-appareils.
- Plusieurs adultes autorisés sur un même foyer.
- Plusieurs enfants, données strictement séparées.
- Sauvegarde cloud et récupération de compte.
- Modèle de données versionné et migrations.

## Phase 5 — Monétisation
### Gratuit
- 1 enfant.
- Routines de base.
- Étoiles et badges essentiels.
- Historique limité.

### Premium
- Multi-enfants.
- Cloud familial.
- Historique illimité.
- Statistiques avancées.
- Tous les univers de jeu.
- Avatars et collections.
- Routines et missions personnalisées.
- Défis avancés et rapports.

Hypothèse tarifaire initiale : 3,99–5,99 €/mois ou 30–40 €/an. À valider avant lancement.

## Phase 6 — Capacitor
À lancer uniquement quand la version web est stable.
- Installation Capacitor iOS / Android.
- Stockage sécurisé des tokens.
- Notifications locales/push.
- Haptique, sons et gestion native du cycle de vie.
- Tests iPhone/iPad puis Android.
- Préparation App Store / Play Store.

## Principes produit
- Interface enfant très simple ; complexité réservée au parent.
- Pas de classement entre enfants.
- Pas de publicité ciblée enfant.
- Les recommandations éducatives restent des suggestions parentales.
- Toute gamification doit encourager la progression, jamais humilier ou punir.
- Les données enfant doivent être minimisées et protégées dès la conception.

## Ordre de développement recommandé
1. Architecture/configuration des routines.
2. Création libre de missions et planning par jour.
3. Gamification : carte + avatar + boutique virtuelle.
4. Dashboard parent et rapports.
5. Cloud/multi-appareils.
6. Abonnement premium.
7. Capacitor et stores.
