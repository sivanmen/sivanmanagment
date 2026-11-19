<?php
/**
 * Server-side settings for the website's lead form (public/api/lead/index.php).
 *
 * Copy to the cPanel HOME directory — one level ABOVE the site folder, never inside it:
 *     /home/<cpanel-user>/sivanmanagment-config.php
 * (the site folder itself is /home/<cpanel-user>/sivanmanagment.com).
 * Every key is optional; defaults are shown. Never commit the real file.
 */
return [
    // Where lead e-mails go, and the sender (must be an address on this domain).
    'LEAD_EMAIL_TO'    => 'support@sivanmanagment.com',
    'LEAD_EMAIL_FROM'  => 'website@sivanmanagment.com',

    // Optional: Airtable (personal access token with data.records:write on the leads base only)
    'AIRTABLE_TOKEN'   => '',
    'AIRTABLE_BASE_ID' => '',
    'AIRTABLE_TABLE'   => 'Leads',

    // Optional: n8n (or any) webhook that receives every lead as JSON
    'LEAD_WEBHOOK_URL' => '',
];
