import { MD5 } from 'crypto-js';

/**
 * Utilitaire pour les fonctions de hachage
 */
export const hash = {
    /**
     * Génère un hash MD5
     * @param value Valeur à hacher
     * @returns Hash MD5
     */
    md5(value: string): string {
        return MD5(value).toString();
    }
};

export default hash;
