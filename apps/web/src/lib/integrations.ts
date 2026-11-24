/**
 * Public (non-secret) third-party identifiers used by the website.
 * Secrets (e.g. the reCAPTCHA secret key) live ONLY in ~/sivanmanagment-config.php on the server.
 */

/** Google reCAPTCHA v3 site key (public). The key's domain list in Google Cloud must include sivanmanagment.com. */
export const RECAPTCHA_SITE_KEY = '6Le-ziYuAAAAAHBWSdGev2zj7sGp4etOsnznHvx3';
/** Action name sent with each token; the server checks it matches. */
export const RECAPTCHA_ACTION = 'lead';
