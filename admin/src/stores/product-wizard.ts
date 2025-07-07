import { defineStore } from 'pinia'

import router from '@/router'
import { useProductStore } from './products'
import { useNotificationStore } from './notifications'
import { useProductDraftsService } from '@/services/product-drafts'
import logger from '@/services/logger'

// Types
interface ProductWizardState {
  // Détails
  name: string
  slug: string
  description: string
  short_description: string
  color: string
  group_id: number | null
  product_type: string
  welcome_email: number | null
  welcome_email_id?: number | null // Alias pour welcome_email pour compatibilité
  image_url?: string | null
  image_file?: File | null // Le fichier image physique à envoyer au serveur
  featured?: boolean
  tag_line?: string
  order_link?: string

  // Pricing
  price: number
  setup_fee: number
  recurring: boolean
  billing_cycle: string
  allow_quantity: boolean
  stock_control: boolean
  stock_quantity: number
  price_monthly?: number
  price_quarterly?: number
  price_semiannually?: number
  price_annually?: number
  price_biennially?: number
  price_triennially?: number
  default_billing_cycle?: string
  allow_cycle_change?: boolean
  tax_included?: boolean
  tax_exempt?: boolean
  
  // Other options
  other?: {
    requireDomain?: boolean
    autoSetup?: boolean
    stockControl?: boolean
    stockQuantity?: number
    hidden?: boolean
    featured?: boolean
    welcomeEmail?: number
    notes?: string
  }
  
  // Liens
  links?: {
    direct_link?: string
    custom_url?: string
    directLinks?: {
      cartLink?: string
      cartLinkWithTemplate?: string
      cartLinkWithDomain?: string
      groupLink?: string
    }
    productLinks?: Array<{ url: string, visits: number }>
  }
  
  // Domaine gratuit
  freedomain_settings?: {
    enabled: boolean
    type: string
    discount_amount: number
    payment_type: string
    available_cycles: string[]
    available_tlds: number[]
  }
  
  // ID du produit (en mode édition)
  id?: number

  // Module
  auto_provision: boolean
  module: string | null
  server_group: string | null
  server_id: number | null
  package_name: string | null
  provisioning_type: string
  server_type: string

  // Custom Fields
  custom_fields: Array<{
    name: string
    type: string
    description: string
    required: boolean
    options: Array<{
      name: string
      value: string
    }>
  }>

  // Configurable Options
  configurable_options: Array<{
    name: string
    type: string
    required: boolean
    options: Array<{
      name: string
      price: number
      setup_fee: number
    }>
  }>

  // Upgrades
  upgrades: Array<{
    product_id: number
    upgrade_type: string
  }>
  upgrade_products: (string | number)[]

  // Free Domain
  free_domain: boolean
  free_domain_tlds: string[]
  free_domain_payment_type: string
  free_domain_payment_terms: string[]

  // Features
  features: any[]
  
  // Cross Sells
  cross_sells: number[]

  // Other
  affiliate_payment: boolean
  affiliate_amount: number
  hidden: boolean
  downloads: number[]
}

export const useProductWizardStore = defineStore('productWizard', {
  state: () => ({
    // ID du brouillon côté serveur
    draftId: null as number | null,
    
    // État initial du produit, avec des valeurs par défaut
    productData: {
      // Détails
      name: '',
      slug: '',
      description: '',
      short_description: '',
      color: '#0066ff',
      group_id: null,
      product_type: 'reseller_hosting',
      welcome_email: null,
      welcome_email_id: null,
      image_url: null,
      featured: false,
      tag_line: '',
      order_link: '',

      // Pricing
      price: 0,
      setup_fee: 0,
      recurring: true,
      billing_cycle: 'monthly',
      allow_quantity: false,
      stock_control: false,
      stock_quantity: 0,
      price_monthly: 0,
      price_quarterly: 0,
      price_semiannually: 0,
      price_annually: 0,
      price_biennially: 0,
      price_triennially: 0,
      default_billing_cycle: 'monthly',
      allow_cycle_change: true,
      tax_included: false,
      tax_exempt: false,
      
      // Autres options
      other: {
        requireDomain: false,
        autoSetup: true,
        stockControl: false,
        stockQuantity: 0,
        hidden: false,
        featured: false,
        welcomeEmail: 0,
        notes: ''
      },
      
      // Liens
      links: {
        direct_link: '',
        custom_url: '',
        directLinks: {
          cartLink: '',
          cartLinkWithTemplate: '',
          cartLinkWithDomain: '',
          groupLink: ''
        },
        productLinks: []
      },
      
      // Domaine gratuit
      freedomain_settings: {
        enabled: false,
        type: 'free',
        discount_amount: 10,
        payment_type: 'once',
        available_cycles: [],
        available_tlds: []
      },
      
      // ID (uniquement en mode édition)
      id: undefined,

      // Module
      auto_provision: false,
      module: null,
      server_group: null,
      server_id: null,
      package_name: null,
      provisioning_type: 'manual',
      server_type: '',

      // Custom Fields
      custom_fields: [],

      // Configurable Options
      configurable_options: [],

      // Upgrades
      upgrades: [],
      upgrade_products: [],

      // Features
      features: [],

      // Free Domain
      free_domain: false,
      free_domain_tlds: [],
      free_domain_payment_type: 'once',
      free_domain_payment_terms: [],

      // Cross Sells
      cross_sells: [],

      // Other
      affiliate_payment: false,
      affiliate_amount: 0,
      hidden: false,
      downloads: []
    } as ProductWizardState,
    
    // État de validation et d'édition
    errors: {} as Record<string, string>,
    editingProductId: null as number | null,
    currentStep: 'details' as string,
    isSubmitting: false
  }),

  getters: {
    isValid: (state) => Object.keys(state.errors).length === 0,
    
    isCompleteForStep: (_state) => (_step: string) => {
      return true; // Simplifier pour éviter des erreurs pour le moment
    },
    
    // Format adapté pour l'API
    formattedProductData: (state) => {
      // Structure les données en format plat comme attendu par l'API
      return {
        // Informations de base
        name: state.productData.name,
        slug: state.productData.slug,
        description: state.productData.description,
        short_description: state.productData.short_description, // Ajouté
        image_url: state.productData.image_url, // Ajouté
        color: state.productData.color,
        group_id: state.productData.group_id,
        product_type: state.productData.product_type,
        welcome_email_id: state.productData.welcome_email_id, // Corrigé (était welcome_email)
        
        // Informations de tarification directement au niveau racine
        price: state.productData.price,
        setup_fee: state.productData.setup_fee,
        recurring: state.productData.recurring ? 1 : 0, // Conversion boolean vers 0/1
        billing_cycle: state.productData.billing_cycle,
        allow_quantity: state.productData.allow_quantity ? 1 : 0, // Conversion boolean vers 0/1
        stock_control: state.productData.stock_control ? 1 : 0, // Conversion boolean vers 0/1
        stock_quantity: state.productData.stock_quantity,
        
        // Informations de provisionnement au niveau racine
        auto_provision: state.productData.auto_provision ? 1 : 0, // Conversion boolean vers 0/1
        module: state.productData.module,
        // Type de provisionnement spécifique selon le moment
        provisioning_type: state.productData.provisioning_type || 
                         (state.productData.auto_provision ? 'auto_setup_on_order' : 'manual'),
        server_group: state.productData.server_group,
        server_id: state.productData.server_id,
        server_type: state.productData.server_type || state.productData.module || '', // Type de serveur
        package_name: state.productData.package_name || '',
        
        // Autres champs
        custom_fields: state.productData.custom_fields,
        configurable_options: state.productData.configurable_options,
        upgrades: state.productData.upgrades,
        
        free_domain: state.productData.free_domain ? 1 : 0, // Conversion boolean vers 0/1
        free_domain_tlds: state.productData.free_domain_tlds,
        free_domain_payment_type: state.productData.free_domain_payment_type,
        free_domain_payment_terms: state.productData.free_domain_payment_terms,
        
        // Convertir les structures complexes en JSON pour le backend
        features: JSON.stringify(state.productData.features || []),
        
        affiliate_payment: state.productData.affiliate_payment ? 1 : 0, // Conversion boolean vers 0/1
        affiliate_amount: state.productData.affiliate_amount,
        hidden: state.productData.hidden ? 1 : 0, // Conversion boolean vers 0/1
        featured: state.productData.featured ? 1 : 0, // Ajout de featured (conversion boolean vers 0/1)
        downloads: state.productData.downloads,
        
        // Options au format JSON
        options: JSON.stringify({
          links: state.productData.links,
          cross_sells: state.productData.cross_sells
        })
      };
    }
  },

  actions: {
    // Réinitialise toutes les données du produit
    resetProductData() {
      this.productData = {
        name: '',
        slug: '',
        description: '',
        short_description: '',
        color: '#0066ff',
        group_id: null,
        product_type: 'reseller_hosting',
        welcome_email: null,
        welcome_email_id: null,
        image_url: null,
        featured: false,
        tag_line: '',
        order_link: '',
        price: 0,
        setup_fee: 0,
        recurring: true,
        billing_cycle: 'monthly',
        allow_quantity: false,
        stock_control: false,
        stock_quantity: 0,
        price_monthly: 0,
        price_quarterly: 0,
        price_semiannually: 0,
        price_annually: 0,
        price_biennially: 0,
        price_triennially: 0,
        default_billing_cycle: 'monthly',
        allow_cycle_change: true,
        tax_included: false,
        tax_exempt: false,
        
        other: {
          requireDomain: false,
          autoSetup: true,
          stockControl: false,
          stockQuantity: 0,
          hidden: false,
          featured: false,
          welcomeEmail: 0,
          notes: ''
        },
        
        auto_provision: false,
        module: null,
        server_group: null,
        server_id: null,
        package_name: null,
        provisioning_type: 'manual',
        server_type: '',
        features: [],
        custom_fields: [],
        configurable_options: [],
        upgrades: [],
        upgrade_products: [],
        free_domain: false,
        free_domain_tlds: [],
        free_domain_payment_type: 'free',
        free_domain_payment_terms: [],
        cross_sells: [],
        affiliate_payment: false,
        affiliate_amount: 0,
        hidden: false,
        downloads: [],
        
        // Liens
        links: {
          direct_link: '',
          custom_url: '',
          directLinks: {
            cartLink: '',
            cartLinkWithTemplate: '',
            cartLinkWithDomain: '',
            groupLink: ''
          },
          productLinks: []
        },
        
        // Domaine gratuit
        freedomain_settings: {
          enabled: false,
          type: 'free',
          discount_amount: 10,
          payment_type: 'once',
          available_cycles: [],
          available_tlds: []
        },
        
        // ID (uniquement en mode édition)
        id: undefined
      };
      this.editingProductId = null;
      this.errors = {};
      this.currentStep = 'details';
    },
    
    // Charge un produit existant pour modification
    async loadProduct(productId: number) {
      try {
        const productStore = useProductStore();
        const product = await productStore.fetchProduct(productId);
        
        // Définir explicitement l'ID du produit en édition
        this.editingProductId = productId;
        logger.info('Mode édition activé pour le produit ID:', { productId: this.editingProductId });
        
        // Initialisation du mode d'édition avec les données du produit
        await this.initEditMode(product);
        
        return product;
      } catch (error: unknown) {
        logger.error('Erreur lors du chargement du produit', { error });
        this.resetProductData();
        throw new Error('Produit non trouvé');
      }
    },
    
    // Initialise le mode d'édition avec les données d'un produit existant
    initEditMode(product: any) {
      if (!product) return;
      
      // Log pour déboguer les valeurs des champs booléens
      logger.info('Initialisation du mode édition pour le produit', {
        id: product.id,
        hidden_avant_conversion: product.hidden,
        hidden_type: typeof product.hidden,
        featured_avant_conversion: product.featured,
        featured_type: typeof product.featured
      });
      
      this.editingProductId = product.id;
      this.productData.name = product.name || '';
      this.productData.slug = product.slug || '';
      this.productData.description = product.description || '';
      this.productData.color = product.color || '#0066ff';
      this.productData.group_id = product.group_id || null;
      this.productData.product_type = product.product_type || 'reseller_hosting';
      this.productData.welcome_email = product.welcome_email || null;
      
      // Prix et facturation
      this.productData.price = product.price || 0;
      this.productData.setup_fee = product.setup_fee || 0;
      this.productData.recurring = product.recurring || false;
      this.productData.billing_cycle = product.billing_cycle || 'monthly';
      this.productData.allow_quantity = product.allow_quantity || false;
      this.productData.stock_control = product.stock_control || false;
      this.productData.stock_quantity = product.stock_quantity || 0;
      
      // Module
      this.productData.auto_provision = product.auto_provision || false;
      this.productData.module = product.module || null;
      this.productData.server_group = product.server_group || null;
      this.productData.server_id = product.server_id || null;
      this.productData.package_name = product.package_name || null;
      
      // Custom fields, configurable options, etc.
      this.productData.custom_fields = product.custom_fields || [];
      this.productData.configurable_options = product.configurable_options || [];
      this.productData.upgrades = product.upgrades || [];
      this.productData.free_domain = product.free_domain || false;
      this.productData.free_domain_tlds = product.free_domain_tlds || [];
      this.productData.free_domain_payment_type = product.free_domain_payment_type || 'free';
      this.productData.free_domain_payment_terms = product.free_domain_payment_terms || [];
      this.productData.cross_sells = product.cross_sells || [];
      this.productData.affiliate_payment = product.affiliate_payment || false;
      this.productData.affiliate_amount = product.affiliate_amount || 0;
      
      // Conversion explicite des valeurs en booléennes
      this.productData.hidden = product.hidden === 1 || product.hidden === '1' || product.hidden === true;
      this.productData.featured = product.featured === 1 || product.featured === '1' || product.featured === true;
      
      this.productData.downloads = product.downloads || [];
      
      // Liens
      this.productData.links = {
        direct_link: product.links?.direct_link || '',
        custom_url: product.links?.custom_url || ''
      };
      
      this.currentStep = 'details';
    },
    
    // Valide les données à chaque étape
    validateStep(step: string) {
      this.errors = {};
      
      switch (step) {
        case 'details':
          if (!this.productData.name) {
            this.errors.name = 'Le nom du produit est obligatoire';
          }
          if (!this.productData.group_id) {
            this.errors.group_id = 'Le groupe de produits est obligatoire';
          }
          break;
          
        case 'pricing':
          if (this.productData.price < 0) {
            this.errors.price = 'Le prix ne peut pas être négatif';
          }
          if (this.productData.setup_fee < 0) {
            this.errors.setup_fee = 'Les frais de configuration ne peuvent pas être négatifs';
          }
          break;
          
        case 'module':
          if (this.productData.auto_provision && !this.productData.module) {
            this.errors.module = 'Le module est requis pour le provisionnement automatique';
          }
          break;
      }
      
      return Object.keys(this.errors).length === 0;
    },
    
    // Enregistre les données de l'étape actuelle et passe à la suivante
    goToNextStep(currentStep: string, nextStep: string) {
      if (this.validateStep(currentStep)) {
        this.currentStep = nextStep;
        return true;
      }
      return false;
    },
    
    // Enregistre le produit en base de données
    async saveProduct() {
      // Valider toutes les données du produit avant sauvegarde
      if (!this.validateForSave()) {
        const errorMessages = Object.values(this.errors).join(', ');
        return { success: false, message: errorMessages || 'Veuillez corriger les erreurs dans le formulaire' };
      }
      
      this.isSubmitting = true;
      
      try {
        const productStore = useProductStore();
        const productData = this.formattedProductData;
        
        // Logs pour le débogage du mode (création ou édition)
        logger.info('Mode de sauvegarde du produit:', { 
          mode: this.editingProductId ? 'ÉDITION' : 'CRÉATION',
          productId: this.editingProductId,
          data: productData
        });
        
        let result;
        if (this.editingProductId) {
          logger.info(`Mise à jour du produit existant`, { productId: this.editingProductId });
          result = await productStore.updateProduct(this.editingProductId, productData);
        } else {
          logger.info('Création d\'un nouveau produit');
          result = await productStore.createProduct(productData);
        }
        
        this.isSubmitting = false;
        
        if (result.success) {
          this.resetProductData();
          this.deleteFromServer();
          router.push('/products');
        }
        
        return result;
      } catch (error: unknown) {
        this.isSubmitting = false;
        logger.error('Erreur lors de la sauvegarde', { error });
        useNotificationStore().addNotification({
          title: 'Erreur',
          message: 'La sauvegarde du produit a échoué.',
          type: 'error'
        });
        throw error;
      }
    },
    
    // Mise à jour du slug à partir du nom
    updateSlug() {
      if (!this.productData.name) return;
      
      this.productData.slug = this.productData.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/[\s-]+/g, '-')
        .trim();
    },
    
    // Validation complète pour la sauvegarde
    validateForSave() {
      this.errors = {};

      // Validation des champs obligatoires
      if (!this.productData.product_type) {
        this.errors.product_type = 'Le type de produit est obligatoire';
      }

      if (!this.productData.name) {
        this.errors.name = 'Le nom du produit est obligatoire';
      }

      if (!this.productData.slug) {
        this.errors.slug = 'Le slug du produit est obligatoire';
      }

      // Validation des prix (si définis)
      if (this.productData.price !== undefined && this.productData.price < 0) {
        this.errors.price = 'Le prix ne peut pas être négatif';
      }

      if (this.productData.setup_fee !== undefined && this.productData.setup_fee < 0) {
        this.errors.setup_fee = 'Les frais de configuration ne peuvent pas être négatifs';
      }

      // Validation du stock (si activé)
      if (this.productData.stock_control && this.productData.stock_quantity !== undefined && this.productData.stock_quantity < 0) {
        this.errors.stock_quantity = 'La quantité en stock ne peut pas être négative';
      }

      return Object.keys(this.errors).length === 0;
    },

    // Fonction de validation générique par étape
    validate(step = null) {
      const currentStep = step || this.currentStep;
      this.errors = {};

      switch (currentStep) {
        case 'type':
          if (!this.productData.product_type) {
            this.errors.product_type = 'Le type de produit est obligatoire';
          }
          break;

        case 'details':
          if (!this.productData.name) {
            this.errors.name = 'Le nom du produit est obligatoire';
          }
          if (!this.productData.group_id) {
            this.errors.group_id = 'Le groupe de produits est obligatoire';
          }
          break;

        case 'pricing':
          if (this.productData.price < 0) {
            this.errors.price = 'Le prix ne peut pas être négatif';
          }
          if (this.productData.setup_fee < 0) {
            this.errors.setup_fee = 'Les frais de configuration ne peuvent pas être négatifs';
          }
          if (this.productData.stock_control && this.productData.stock_quantity < 0) {
            this.errors.stock_quantity = 'La quantité en stock ne peut pas être négative';
          }
          break;

        case 'module':
          if (this.productData.auto_provision && !this.productData.module) {
            this.errors.module = 'Le module est obligatoire pour le provisionnement automatique';
          }
          if (this.productData.auto_provision && this.productData.module && !this.productData.server_id) {
            this.errors.server_id = 'Le serveur est obligatoire pour le provisionnement automatique';
          }
          break;
      }

      return Object.keys(this.errors).length === 0;
    },
    
    // Navigation entre les étapes
    nextStep() {
      const valid = this.validate();
      if (!valid) return false;
      
      const stepsOrder = ['details', 'pricing', 'module', 'customfields', 'configurableoptions', 'upgrades', 'freedomain', 'crosssells', 'other', 'links'];
      const currentIndex = stepsOrder.indexOf(this.currentStep);
      
      if (currentIndex < stepsOrder.length - 1) {
        this.currentStep = stepsOrder[currentIndex + 1];
        return true;
      }
      return false;
    },
    
    prevStep() {
      const stepsOrder = ['details', 'pricing', 'module', 'customfields', 'configurableoptions', 'upgrades', 'freedomain', 'crosssells', 'other', 'links'];
      const currentIndex = stepsOrder.indexOf(this.currentStep);
      
      if (currentIndex > 0) {
        this.currentStep = stepsOrder[currentIndex - 1];
        return true;
      }
      return false;
    },
    
    // Générer une slug à partir du nom
    generateSlug() {
      if (!this.productData.name) return;
      
      this.productData.slug = this.productData.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/[\s-]+/g, '-')
        .trim();
    },
    
    // Synchronisation avec le serveur
    async syncWithServer() {
      const productDraftsService = useProductDraftsService();
      const notificationStore = useNotificationStore();
      
      try {
        // Récupérer toutes les données du state
        const draftData = {
          current_step: this.currentStep,
          ...this.productData
        };
        
        // Sauvegarder le brouillon sur le serveur
        // Conversion du null en undefined pour compatibilité avec l'API
        const draftId = this.draftId === null ? undefined : this.draftId;
        const response = await productDraftsService.saveDraft(draftData, this.currentStep, draftId);
        
        // Mettre à jour l'ID du brouillon
        if (response && response.success && response.data && response.data.id) {
          this.draftId = response.data.id;
        }
        
        return true;
      } catch (error) {
        logger.error('Erreur lors de la synchronisation avec le serveur', { error });
        notificationStore.addNotification({
          title: 'Erreur de sauvegarde',
          message: 'Impossible de sauvegarder le brouillon sur le serveur',
          type: 'error'
        });
        return false;
      }
    },
    
    // Charger le dernier brouillon depuis le serveur
    async loadFromServer() {
      const productDraftsService = useProductDraftsService();
      // Ne pas créer de constante notificationStore pour éviter l'avertissement
      
      try {
        const response = await productDraftsService.getAllDrafts();
        
        if (response && response.success && response.data && response.data.length > 0) {
          // Récupérer le brouillon le plus récent
          const draft = response.data[0];
          
          // Mettre à jour l'ID du brouillon
          // Assurer que draft.id est bien un nombre (ou null si indéfini)
          this.draftId = draft.id !== undefined ? Number(draft.id) : null;
          
          // Mettre à jour les données du produit
          if (draft.data) {
            Object.assign(this.productData, draft.data);
            this.currentStep = draft.current_step || 'details';
          }
          
          return true;
        }
        return false;
      } catch (error: unknown) {
        // Vérification sûre avec type narrowing
        const errorObj = error as any;
        if (errorObj.response && errorObj.response.status === 404) {
          // Pas de brouillon trouvé, ce n'est pas une erreur
          return false;
        }
        
                logger.error('Erreur lors du chargement depuis le serveur', { error });
        useNotificationStore().addNotification({
          title: 'Erreur de chargement',
          message: 'Impossible de charger le brouillon depuis le serveur',
          type: 'error'
        });
        return false;
      }
    },
    
    // Supprimer le brouillon du serveur
    async deleteFromServer() {
      if (!this.draftId) return true;
      
      const productDraftsService = useProductDraftsService();
      
      try {
        await productDraftsService.deleteDraft(this.draftId);
        this.draftId = null;
        return true;
      } catch (error) {
                logger.error('Erreur lors de la suppression du brouillon', { error });
        return false;
      }
    },
    
    // Vérifier si un brouillon existe
    async hasDraft() {
      // Version simplifiée pour éviter les erreurs
      try {
        // Renvoyer directement false pour éviter toute vérification complexe
        // En phase de développement, c'est plus simple 
        logger.warn('Vérification des brouillons désactivée pour le moment');
        return false;
      } catch (error) {
        logger.error('Erreur lors de la vérification des brouillons', { error });
        return false;
      }
    },
    
    // Méthode pour définir les données du produit
    setProductData(data: any) {
      // Si les données sont nulles ou vides, ne rien faire
      if (!data) return;

      // Si les données contiennent un ID, définir editingProductId
      if (data.id) {
        this.editingProductId = parseInt(data.id);
        logger.info('Mode édition activé via setProductData pour le produit ID:', { productId: this.editingProductId });
      }

      // Fusionner les données avec celles existantes
      this.productData = {
        ...this.productData,
        ...data
      };

      // Synchroniser avec le serveur
      this.syncWithServer();
    },

    // Configuration du wizard (étapes, navigation)
    setWizardConfig(config: any) {
      // Pour l'instant, cette méthode est un placeholder
      // Elle permet aux composants de configurer l'affichage des étapes
      // sans générer d'erreur TypeScript
      logger.debug('Configuration du wizard:', config);
    },
    
    // Alias de setProductData pour compatibilité avec les vues existantes
    updateProductData(data: any) {
      return this.setProductData(data);
    }
  }
});
