import { API_ROUTES } from '../../../core/constants/api-routes';

export type ResourceFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'url'
  | 'email'
  | 'date'
  | 'datetime'
  | 'select'
  | 'tags';

export interface ResourceField {
  key: string;
  label: string;
  type: ResourceFieldType;
  required?: boolean;
  placeholder?: string;
  options?: string[];
  createOnly?: boolean;
}

export interface ResourceListColumn {
  key: string;
  label: string;
  type?: 'text' | 'status' | 'date' | 'boolean' | 'tags';
}

export interface AdminResourceConfig {
  title: string;
  endpoint: string;
  shape: 'items' | 'array';
  columns: ResourceListColumn[];
  fields: ResourceField[];
  searchable?: boolean;
  statusParam?: string;
  statusField?: string;
  statusOptions?: string[];
  statusEndpoint?: string;
  creatable?: boolean;
  editable?: boolean;
  deletable?: boolean;
  createEndpoint?: string;
  createDefaults?: Record<string, unknown>;
  createRoute?: string;
}

const STATUSES_CONTENT: ResourceField = {
  key: 'status',
  label: 'Statut',
  type: 'select',
  options: ['DRAFT', 'PUBLISHED', 'ARCHIVED']
};

export const ADMIN_RESOURCE_CONFIG: Record<string, AdminResourceConfig> = {
  users: {
    title: 'Utilisateurs',
    endpoint: API_ROUTES.admin.users,
    shape: 'items',
    searchable: true,
    statusParam: 'status',
    statusField: 'status',
    statusOptions: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
    creatable: true,
    editable: true,
    deletable: true,
    columns: [
      { key: 'firstName', label: 'Prénom' },
      { key: 'lastName', label: 'Nom' },
      { key: 'email', label: 'Email' },
      { key: 'role', label: 'Rôle' },
      { key: 'status', label: 'Statut', type: 'status' },
      { key: 'createdAt', label: 'Créé le', type: 'date' }
    ],
    fields: [
      { key: 'firstName', label: 'Prénom', type: 'text', required: true },
      { key: 'lastName', label: 'Nom', type: 'text', required: true },
      { key: 'email', label: 'Email', type: 'email', required: true },
      { key: 'password', label: 'Mot de passe', type: 'text', required: true, createOnly: true, placeholder: 'Minimum 8 caractères' },
      { key: 'role', label: 'Rôle', type: 'select', options: ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'COMMUNICATION'] },
      { key: 'status', label: 'Statut', type: 'select', options: ['ACTIVE', 'INACTIVE', 'SUSPENDED'] }
    ]
  },
  auditLogs: {
    title: "Journaux d'audit",
    endpoint: API_ROUTES.admin.auditLogs,
    shape: 'items',
    columns: [
      { key: 'entity', label: 'Entité' },
      { key: 'action', label: 'Action' },
      { key: 'userId', label: 'Utilisateur' },
      { key: 'createdAt', label: 'Date', type: 'date' }
    ],
    fields: []
  },
  settings: {
    title: 'Paramètres',
    endpoint: API_ROUTES.admin.settings,
    shape: 'array',
    columns: [
      { key: 'key', label: 'Clé' },
      { key: 'value', label: 'Valeur' },
      { key: 'isPublic', label: 'Public', type: 'boolean' }
    ],
    fields: []
  },
  media: {
    title: 'Médias',
    endpoint: API_ROUTES.admin.media,
    shape: 'items',
    columns: [
      { key: 'originalName', label: 'Nom' },
      { key: 'alt', label: 'Texte alternatif' },
      { key: 'mimeType', label: 'Type' },
      { key: 'size', label: 'Taille' }
    ],
    fields: [],
    deletable: true
  },
  contacts: {
    title: 'Contacts',
    endpoint: API_ROUTES.admin.contacts,
    shape: 'items',
    searchable: true,
    statusParam: 'status',
    statusField: 'status',
    statusOptions: ['NEW', 'IN_PROGRESS', 'RESOLVED', 'SPAM'],
    statusEndpoint: '/status',
    columns: [
      { key: 'name', label: 'Nom' },
      { key: 'email', label: 'Email' },
      { key: 'subject', label: 'Sujet' },
      { key: 'status', label: 'Statut', type: 'status' },
      { key: 'createdAt', label: 'Reçu le', type: 'date' }
    ],
    fields: []
  },
  members: {
    title: 'Membres',
    endpoint: API_ROUTES.admin.members,
    shape: 'items',
    searchable: true,
    statusParam: 'status',
    statusField: 'status',
    statusOptions: ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'],
    statusEndpoint: '/status',
    columns: [
      { key: 'companyName', label: 'Entreprise' },
      { key: 'representativeName', label: 'Représentant' },
      { key: 'representativeEmail', label: 'Email' },
      { key: 'status', label: 'Statut', type: 'status' },
      { key: 'createdAt', label: 'Créé le', type: 'date' }
    ],
    fields: [],
    editable: true
  },
  memberApplications: {
    title: "Demandes d'adhésion",
    endpoint: API_ROUTES.admin.memberApplications,
    createEndpoint: API_ROUTES.public.memberApplications,
    createDefaults: { consent: true },
    shape: 'items',
    searchable: true,
    statusParam: 'status',
    statusField: 'status',
    statusOptions: ['PENDING', 'APPROVED', 'REJECTED'],
    statusEndpoint: '/status',
    creatable: true,
    columns: [
      { key: 'companyName', label: 'Entreprise' },
      { key: 'representativeName', label: 'Représentant' },
      { key: 'representativeEmail', label: 'Email' },
      { key: 'status', label: 'Statut', type: 'status' },
      { key: 'createdAt', label: 'Reçu le', type: 'date' }
    ],
    fields: [
      { key: 'companyName', label: 'Entreprise', type: 'text', required: true },
      { key: 'legalForm', label: 'Forme juridique', type: 'text', placeholder: 'Ex. SARL' },
      { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Activité de l’entreprise' },
      { key: 'website', label: 'Site web', type: 'url' },
      { key: 'email', label: 'Email de l’entreprise', type: 'email' },
      { key: 'phone', label: 'Téléphone', type: 'text' },
      { key: 'address', label: 'Adresse', type: 'text' },
      { key: 'representativeName', label: 'Représentant', type: 'text', required: true, placeholder: 'Nom Prénom' },
      { key: 'representativeEmail', label: 'Email du représentant', type: 'email', required: true },
      { key: 'logoUrl', label: 'Logo', type: 'url', placeholder: 'https://cdn.example/logo.png' },
      { key: 'sectors', label: 'Secteurs', type: 'tags', placeholder: 'Ex. Fintech, EdTech' },
      { key: 'employees', label: 'Effectif', type: 'number' }
    ]
  },
  projects: {
    title: 'Projets',
    endpoint: API_ROUTES.admin.projects,
    shape: 'items',
    searchable: true,
    statusParam: 'status',
    statusField: 'status',
    statusOptions: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
    creatable: true,
    editable: true,
    deletable: true,
    columns: [
      { key: 'title', label: 'Titre' },
      { key: 'status', label: 'Statut', type: 'status' },
      { key: 'createdAt', label: 'Créé le', type: 'date' }
    ],
    fields: [
      { key: 'title', label: 'Titre', type: 'text', required: true },
      { key: 'slug', label: 'Slug', type: 'text', placeholder: 'Généré automatiquement si vide' },
      { key: 'excerpt', label: 'Résumé', type: 'textarea' },
      { key: 'contentHtml', label: 'Contenu HTML', type: 'textarea' },
      { key: 'coverUrl', label: 'Image de couverture', type: 'url' },
      { key: 'startDate', label: 'Début', type: 'date' },
      { key: 'endDate', label: 'Fin', type: 'date' },
      { key: 'tags', label: 'Tags', type: 'tags' },
      STATUSES_CONTENT
    ]
  },
  activities: {
    title: 'Activités',
    endpoint: API_ROUTES.admin.activities,
    shape: 'items',
    searchable: true,
    statusParam: 'status',
    statusField: 'status',
    statusOptions: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
    creatable: true,
    editable: true,
    deletable: true,
    columns: [
      { key: 'title', label: 'Titre' },
      { key: 'category', label: 'Catégorie' },
      { key: 'status', label: 'Statut', type: 'status' },
      { key: 'createdAt', label: 'Créé le', type: 'date' }
    ],
    fields: [
      { key: 'title', label: 'Titre', type: 'text', required: true },
      { key: 'slug', label: 'Slug', type: 'text', placeholder: 'Généré automatiquement si vide' },
      { key: 'excerpt', label: 'Résumé', type: 'textarea' },
      { key: 'contentHtml', label: 'Contenu HTML', type: 'textarea' },
      { key: 'coverUrl', label: 'Image de couverture', type: 'url' },
      { key: 'category', label: 'Catégorie', type: 'text' },
      STATUSES_CONTENT
    ]
  },
  events: {
    title: 'Événements',
    endpoint: API_ROUTES.admin.events,
    shape: 'items',
    searchable: true,
    statusParam: 'status',
    statusField: 'status',
    statusOptions: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
    creatable: true,
    editable: true,
    deletable: true,
    columns: [
      { key: 'title', label: 'Titre' },
      { key: 'category', label: 'Catégorie' },
      { key: 'location', label: 'Lieu' },
      { key: 'startAt', label: 'Début', type: 'date' },
      { key: 'status', label: 'Statut', type: 'status' }
    ],
    fields: [
      { key: 'title', label: 'Titre', type: 'text', required: true },
      { key: 'slug', label: 'Slug', type: 'text', placeholder: 'Généré automatiquement si vide' },
      { key: 'excerpt', label: 'Résumé', type: 'textarea' },
      { key: 'contentHtml', label: 'Contenu HTML', type: 'textarea' },
      { key: 'coverUrl', label: 'Image de couverture', type: 'url' },
      { key: 'category', label: 'Catégorie', type: 'text' },
      { key: 'location', label: 'Lieu', type: 'text' },
      { key: 'startAt', label: 'Début', type: 'datetime', required: true },
      { key: 'endAt', label: 'Fin', type: 'datetime' },
      { key: 'registrationRequired', label: 'Inscription requise', type: 'select', options: ['true', 'false'] },
      { key: 'capacity', label: 'Capacité', type: 'number' },
      STATUSES_CONTENT
    ]
  },
  hackathons: {
    title: 'Hackathons',
    endpoint: API_ROUTES.admin.hackathons,
    shape: 'items',
    searchable: true,
    statusParam: 'status',
    statusField: 'status',
    statusOptions: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
    creatable: true,
    editable: true,
    deletable: true,
    columns: [
      { key: 'title', label: 'Titre' },
      { key: 'startDate', label: 'Début', type: 'date' },
      { key: 'status', label: 'Statut', type: 'status' },
      { key: 'createdAt', label: 'Créé le', type: 'date' }
    ],
    fields: [
      { key: 'title', label: 'Titre', type: 'text', required: true },
      { key: 'slug', label: 'Slug', type: 'text', placeholder: 'Généré automatiquement si vide' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'rulesHtml', label: 'Règlement HTML', type: 'textarea' },
      { key: 'coverUrl', label: 'Image de couverture', type: 'url' },
      { key: 'startDate', label: 'Début', type: 'date' },
      { key: 'endDate', label: 'Fin', type: 'date' },
      { key: 'registrationDeadline', label: 'Date limite d\'inscription', type: 'date' },
      { key: 'maxTeamSize', label: 'Taille max équipe', type: 'number' },
      { key: 'minTeamSize', label: 'Taille min équipe', type: 'number' },
      { key: 'themes', label: 'Thèmes', type: 'tags' },
      { key: 'prizes', label: 'Prix', type: 'tags' },
      STATUSES_CONTENT
    ]
  },
  partners: {
    title: 'Partenaires',
    endpoint: API_ROUTES.admin.partners,
    shape: 'array',
    statusField: 'status',
    statusOptions: ['ACTIVE', 'INACTIVE'],
    statusEndpoint: '',
    creatable: true,
    editable: true,
    deletable: true,
    columns: [
      { key: 'name', label: 'Nom' },
      { key: 'type', label: 'Type' },
      { key: 'website', label: 'Site web' },
      { key: 'status', label: 'Statut', type: 'status' },
      { key: 'order', label: 'Ordre' }
    ],
    fields: [
      { key: 'name', label: 'Nom', type: 'text', required: true },
      { key: 'logoUrl', label: 'Logo', type: 'url' },
      { key: 'website', label: 'Site web', type: 'url' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'type', label: 'Type', type: 'select', options: ['INSTITUTIONAL', 'TECHNICAL', 'FINANCIAL', 'MEDIA'] },
      { key: 'status', label: 'Statut', type: 'select', options: ['ACTIVE', 'INACTIVE'] },
      { key: 'order', label: 'Ordre', type: 'number' }
    ]
  },
newsletter: {
    title: 'Newsletter',
    endpoint: API_ROUTES.admin.newsletter,
    shape: 'items',
    statusParam: 'status',
    statusField: 'status',
    statusOptions: ['SUBSCRIBED', 'UNSUBSCRIBED'],
    deletable: true,
    columns: [
      { key: 'email', label: 'Email' },
      { key: 'firstName', label: 'Prénom' },
      { key: 'status', label: 'Statut', type: 'status' },
      { key: 'createdAt', label: 'Inscrit le', type: 'date' }
    ],
    fields: []
  },
  announcements: {
    title: 'Annonces',
    endpoint: API_ROUTES.admin.announcements,
    shape: 'items',
    columns: [
      { key: 'subject', label: 'Objet' },
      { key: 'status', label: 'Statut', type: 'status' },
      { key: 'recipientCount', label: 'Destinataires' },
      { key: 'createdAt', label: 'Créée le', type: 'date' }
    ],
    fields: [],
    creatable: true,
    editable: false,
    deletable: false,
    createRoute: '/dashboard/announcements/new'
  }
};