<?php
/**
 * Lead notification e-mail (HTML + plain text) in the website's visual style.
 * Language of the e-mail: config LEAD_EMAIL_LANG ('he' default, or 'en'). Option values use labels.php.
 */
declare(strict_types=1);

function sm_lead_email(array $lead, array $meta, string $lang = 'he'): array
{
    $labelsAll = is_readable(__DIR__ . '/labels.php') ? (include __DIR__ . '/labels.php') : [];
    $lang = in_array($lang, ['he', 'en'], true) ? $lang : 'he';
    $L = $labelsAll[$lang] ?? ($labelsAll['en'] ?? []);
    $rtl = $lang === 'he';
    $T = $rtl ? [
        'title' => 'פנייה חדשה מהאתר', 'sub' => 'בקשה להערכת נכס', 'contact' => 'פרטי קשר', 'property' => 'הנכס',
        'services' => 'שירותים מבוקשים', 'goals' => 'מטרות ובקשות', 'meta' => 'פרטי הפנייה',
        'name' => 'שם', 'email' => 'אימייל', 'phone' => 'טלפון', 'preferred' => 'דרך קשר מועדפת', 'type' => 'סוג נכס',
        'units' => 'יחידות', 'location' => 'מיקום', 'area' => 'אזור / כפר', 'status' => 'מצב נוכחי', 'lang' => 'שפת הטופס',
        'page' => 'עמוד', 'referrer' => 'הגיע מ', 'utm' => 'קמפיין (UTM)', 'at' => 'נשלח ב', 'score' => 'ציון reCAPTCHA',
        'consent' => 'הסכמה לעיבוד מידע', 'yes' => 'ניתנה', 'reply' => 'השב באימייל', 'wa' => 'WhatsApp', 'call' => 'התקשר',
        'none' => '—', 'footer' => 'הודעה אוטומטית מטופס יצירת הקשר באתר sivanmanagment.com. אפשר להשיב ישירות למייל זה כדי לענות לפונה.',
    ] : [
        'title' => 'New website enquiry', 'sub' => 'Property assessment request', 'contact' => 'Contact', 'property' => 'Property',
        'services' => 'Services requested', 'goals' => 'Goals & notes', 'meta' => 'Submission details',
        'name' => 'Name', 'email' => 'Email', 'phone' => 'Phone', 'preferred' => 'Preferred contact', 'type' => 'Property type',
        'units' => 'Units', 'location' => 'Location', 'area' => 'Area / village', 'status' => 'Current status', 'lang' => 'Form language',
        'page' => 'Page', 'referrer' => 'Referrer', 'utm' => 'Campaign (UTM)', 'at' => 'Submitted', 'score' => 'reCAPTCHA score',
        'consent' => 'Processing consent', 'yes' => 'given', 'reply' => 'Reply by email', 'wa' => 'WhatsApp', 'call' => 'Call',
        'none' => '—', 'footer' => 'Automatic message from the contact form on sivanmanagment.com. Reply to this e-mail to answer the sender directly.',
    ];
    $LANGS = ['en' => 'English', 'he' => 'עברית', 'el' => 'Ελληνικά', 'fr' => 'Français', 'de' => 'Deutsch', 'nl' => 'Nederlands', 'ru' => 'Русский', 'zh-cn' => '中文'];
    $opt = fn (string $group, ?string $v) => $v === null || $v === '' ? $T['none'] : ($L[$group][$v] ?? $v);
    $services = array_map(fn ($s) => $L['services'][$s] ?? $s, $lead['services']);
    $src = json_decode((string) $lead['source'], true) ?: [];
    $digits = preg_replace('/\D+/', '', (string) $lead['phone']);
    $when = (new DateTimeImmutable('now', new DateTimeZone('Europe/Athens')))->format('d.m.Y H:i') . ($rtl ? ' (שעון יוון)' : ' (Greece time)');

    $rows = [
        $T['contact'] => [
            $T['name'] => $lead['name'], $T['email'] => $lead['email'], $T['phone'] => $lead['phone'] ?: $T['none'],
            $T['preferred'] => $opt('preferred', $lead['preferred']),
        ],
        $T['property'] => [
            $T['type'] => $opt('types', $lead['propertyType']), $T['units'] => (string) $lead['units'],
            $T['location'] => $opt('locations', $lead['location']), $T['area'] => $lead['area'] ?: $T['none'],
            $T['status'] => $opt('statuses', $lead['status']),
        ],
        $T['meta'] => [
            $T['lang'] => $LANGS[$lead['locale']] ?? $lead['locale'], $T['page'] => (string) ($src['page'] ?? ''),
            $T['referrer'] => (string) (($src['referrer'] ?? '') ?: $T['none']), $T['utm'] => (string) (($src['utm'] ?? '') ?: $T['none']),
            $T['at'] => $when, $T['score'] => $meta['score'] === null ? $T['none'] : number_format((float) $meta['score'], 1),
            $T['consent'] => $T['yes'],
        ],
    ];

    // ---------- plain text ----------
    $txt = $T['title'] . ' — ' . $T['sub'] . "\n\n";
    foreach ($rows as $section => $fields) {
        if ($section === $T['meta']) {
            $txt .= '== ' . $T['services'] . " ==\n" . ($services ? '- ' . implode("\n- ", $services) : $T['none']) . "\n\n";
            $txt .= '== ' . $T['goals'] . " ==\n" . ($lead['goals'] ?: $T['none']) . "\n\n";
        }
        $txt .= "== $section ==\n";
        foreach ($fields as $k => $v) $txt .= "$k: $v\n";
        $txt .= "\n";
    }

    // ---------- HTML ----------
    $e = fn ($s) => htmlspecialchars((string) $s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $dir = $rtl ? 'rtl' : 'ltr';
    $align = $rtl ? 'right' : 'left';
    $font = "font-family:'Segoe UI',Arial,Helvetica,sans-serif";
    $ink = '#0c0b14'; $violet = '#5541d8'; $muted = '#4e4d54'; $line = '#e6e5ee'; $paper = '#f7f7fa';
    $btn = fn ($href, $label, $bg, $fg) => '<a href="' . $e($href) . '" style="display:inline-block;margin:4px;padding:10px 18px;border:1px solid ' . ($bg === '#ffffff' ? '#d6d4e2' : $bg) . ';border-radius:999px;background:' . $bg . ';color:' . $fg . ';text-decoration:none;font-weight:600;font-size:14px;' . $font . '">' . $e($label) . '</a>';
    $section = function (string $title, string $inner) use ($e, $violet, $line, $font, $align) {
        return '<tr><td style="padding:22px 28px 6px;' . $font . '"><div style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:' . $violet . ';font-weight:700;text-align:' . $align . '">' . $e($title) . '</div></td></tr>'
            . '<tr><td style="padding:0 28px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ' . $line . ';">' . $inner . '</table></td></tr>';
    };
    $table = function (array $fields) use ($e, $muted, $ink, $line, $font, $align) {
        $h = '';
        foreach ($fields as $k => $v) {
            $val = $e($v);
            if (filter_var($v, FILTER_VALIDATE_EMAIL)) $val = '<a href="mailto:' . $e($v) . '" style="color:#5541d8">' . $val . '</a>';
            // Values without Hebrew/Arabic letters (phones, e-mails, URLs, dates) keep left-to-right order inside RTL mail.
            if (!preg_match('/[\x{0590}-\x{06FF}]/u', (string) $v)) $val = '<span dir="ltr" style="unicode-bidi:embed;">' . $val . '</span>';
            $h .= '<tr><td width="38%" style="padding:10px 0;border-bottom:1px solid ' . $line . ';color:' . $muted . ';font-size:13px;vertical-align:top;text-align:' . $align . ';' . $font . '">' . $e($k) . '</td>'
                . '<td style="padding:10px 0;border-bottom:1px solid ' . $line . ';color:' . $ink . ';font-size:15px;font-weight:600;vertical-align:top;text-align:' . $align . ';' . $font . '">' . $val . '</td></tr>';
        }
        return $h;
    };
    $chips = '';
    foreach ($services as $s) $chips .= '<span style="display:inline-block;margin:0 0 6px 6px;padding:6px 12px;border-radius:999px;background:#eeebff;color:' . $violet . ';font-size:13px;font-weight:600;' . $font . '">' . $e($s) . '</span>';
    $actions = $btn('mailto:' . $lead['email'] . '?subject=' . rawurlencode('Sivan Management'), $T['reply'], $violet, '#ffffff');
    if ($digits !== '') {
        $actions .= $btn('https://wa.me/' . $digits, $T['wa'], '#1fa855', '#ffffff');
        $actions .= $btn('tel:+' . $digits, $T['call'], '#ffffff', $ink);
    }

    $html = '<!doctype html><html lang="' . $lang . '" dir="' . $dir . '"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>' . $e($T['title']) . '</title></head>'
        . '<body style="margin:0;padding:0;background:' . $paper . ';" dir="' . $dir . '">'
        . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:' . $paper . ';"><tr><td align="center" style="padding:24px 12px;">'
        . '<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid ' . $line . ';" dir="' . $dir . '">'
        // header
        . '<tr><td style="background:' . $ink . ';padding:26px 28px;text-align:' . $align . ';' . $font . '">'
        . '<div dir="ltr" style="text-align:' . $align . ';color:#ffffff;font-size:20px;font-weight:800;letter-spacing:.06em;">SIVAN <span style="font-size:11px;font-weight:600;letter-spacing:.28em;color:#b9b0ff;">MANAGEMENT</span></div>'
        . '<div style="margin-top:18px;color:#ffffff;font-size:24px;font-weight:700;line-height:1.25;">' . $e($T['title']) . '</div>'
        . '<div style="margin-top:6px;color:#b9b0ff;font-size:14px;">' . $e($T['sub']) . ' · ' . $e($when) . '</div></td></tr>'
        // summary
        . '<tr><td style="padding:24px 28px 4px;text-align:' . $align . ';' . $font . '">'
        . '<div style="font-size:22px;font-weight:700;color:' . $ink . ';">' . $e($lead['name']) . '</div>'
        . '<div style="margin-top:4px;font-size:15px;color:' . $muted . ';">' . $e($opt('types', $lead['propertyType'])) . ' · ' . $e($opt('locations', $lead['location'])) . ($lead['area'] ? ' · ' . $e($lead['area']) : '') . '</div>'
        . '<div style="margin-top:16px;">' . $actions . '</div></td></tr>'
        . $section($T['contact'], $table($rows[$T['contact']]))
        . $section($T['property'], $table($rows[$T['property']]))
        . '<tr><td style="padding:22px 28px 6px;' . $font . '"><div style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:' . $violet . ';font-weight:700;text-align:' . $align . '">' . $e($T['services']) . '</div><div style="margin-top:10px;text-align:' . $align . ';">' . ($chips ?: $e($T['none'])) . '</div></td></tr>'
        . '<tr><td style="padding:16px 28px 6px;' . $font . '"><div style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:' . $violet . ';font-weight:700;text-align:' . $align . '">' . $e($T['goals']) . '</div>'
        . '<div style="margin-top:10px;padding:14px 16px;background:' . $paper . ';border-radius:12px;color:' . $ink . ';font-size:15px;line-height:1.6;white-space:pre-wrap;text-align:' . $align . ';">' . $e($lead['goals'] ?: $T['none']) . '</div></td></tr>'
        . $section($T['meta'], $table($rows[$T['meta']]))
        . '<tr><td style="padding:24px 28px 28px;color:' . $muted . ';font-size:12px;line-height:1.6;text-align:' . $align . ';' . $font . '">' . $e($T['footer']) . '</td></tr>'
        . '</table></td></tr></table></body></html>';

    $subject = ($rtl ? 'פנייה חדשה: ' : 'New enquiry: ') . $lead['name'] . ' — ' . $opt('types', $lead['propertyType']) . ' / ' . $opt('locations', $lead['location']);
    return ['subject' => $subject, 'html' => $html, 'text' => $txt];
}
