/**
 * Public (non-secret) third-party identifiers used by the website.
 * Secrets (e.g. the reCAPTCHA secret key) live ONLY in ~/sivanmanagment-config.php on the server.
 */

/** Google reCAPTCHA v3 site key (public). The key's domain list in Google Cloud must include sivanmanagment.com. */
export const RECAPTCHA_SITE_KEY = '6Le8HDAuAAAAAPDsGuPoKotLB-poLaQpdXIdYPxO';
/** Action name sent with each token; the server checks it matches. */
export const RECAPTCHA_ACTION = 'lead';

/**
 * Google Tag Manager containers (public IDs). Loaded ONLY after the visitor clicks "Allow statistics"
 * (see components/Analytics.astro). GTM-P792GRPP holds the GA4 tag (G-NCRQXW2F4J).
 */
export const GTM_IDS = ['GTM-P792GRPP', 'GTM-MTRMM4LP'];
