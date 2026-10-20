---
name: wordpress-plugin
description: Patterns for building secure WordPress plugins with PHP 8.0+, WP REST API, React Gutenberg blocks, and WordPress.org directory compliance. Use this skill whenever building or rebuilding WordPress plugins, adding Gutenberg blocks, handling WP nonces and security, registering WP hooks, or submitting to the WordPress plugin directory. Trigger on any mention of WordPress, WP plugin, Gutenberg, wp_enqueue, nonce, or PHP plugin development.
---

# WordPress Plugin Development

Secure WordPress plugin patterns using PHP 8.0+, WP REST API, React Gutenberg blocks, and WordPress coding standards.

## When to Read This

- Building or rebuilding a WP publisher plugin
- Adding React Gutenberg blocks to WordPress
- Implementing proper nonce security and input sanitization
- Registering REST API endpoints in WordPress
- Preparing for WordPress.org plugin directory submission

---

## WP-Specific Gotchas

These are the patterns the model is most likely to miss. General PHP/security knowledge is not repeated here.

### ABSPATH Guard — Required on Every File

```php
defined('ABSPATH') || exit;
```

Every PHP file in the plugin must begin with this. Without it, files can be accessed directly via URL, bypassing WordPress entirely. This is a WordPress.org submission requirement and a security necessity.

### wp_remote_get/post vs curl

```php
// WRONG — bypasses WordPress proxy settings, fails on many hosts
$response = curl_exec($ch);

// RIGHT — respects WP HTTP API, proxy config, and SSL settings
$response = wp_remote_get('https://api.example.com/data');
$body = wp_remote_retrieve_body($response);
$code = wp_remote_retrieve_response_code($response);
```

Always use `wp_remote_get()` / `wp_remote_post()` instead of `curl` or `file_get_contents()`. Hosts block raw curl; the WP HTTP API respects server proxy config.

### Nonce Verification — Both Sides Required

```php
// Output side — always include in form
wp_nonce_field('sided_save_settings', 'sided_nonce');

// Verification side — before any processing
if (!isset($_POST['sided_nonce']) ||
    !wp_verify_nonce($_POST['sided_nonce'], 'sided_save_settings')) {
    wp_die('Security check failed');
}
if (!current_user_can('manage_options')) {
    wp_die('Unauthorized');
}
```

Nonces expire after 24 hours by default. Use `check_ajax_referer()` for AJAX handlers.

### REST API: Always Declare `permission_callback`

```php
register_rest_route('sided/v1', '/settings', [
    'methods' => 'POST',
    'callback' => [self::class, 'update_settings'],
    // REQUIRED — omitting this defaults to open access in older WP versions
    'permission_callback' => fn() => current_user_can('manage_options'),
    'args' => [
        'api_key' => [
            'type' => 'string',
            'sanitize_callback' => 'sanitize_text_field',
            'required' => true,
        ],
    ],
]);
```

The `sanitize_callback` in `args` runs before your handler receives the value — use it instead of sanitizing manually in the callback.

### uninstall.php — Required for WordPress.org

```php
// uninstall.php — runs when user deletes the plugin
defined('WP_UNINSTALL_PLUGIN') || exit;

delete_option('sided_api_key');
delete_option('sided_property_id');
delete_option('sided_embed_enabled');
```

Must be a separate file (not a hook). WordPress.org requires it. Without it, plugin data persists indefinitely after deletion.

---

## Plugin Structure

```
sided-publisher/
├── sided-publisher.php           # Main plugin file (headers, activation)
├── includes/
│   ├── class-sided-admin.php
│   ├── class-sided-api.php
│   ├── class-sided-embed.php
│   └── class-sided-gutenberg.php
├── blocks/
│   └── sided-poll/
│       ├── block.json            # Block metadata
│       ├── edit.tsx
│       ├── save.tsx
│       └── index.ts
├── languages/                    # i18n
├── readme.txt                    # WordPress.org listing
└── uninstall.php                 # Clean uninstall handler
```

## Main Plugin File Header

```php
<?php
/**
 * Plugin Name: Sided Publisher
 * Description: Embed contextual polls in your articles to drive engagement.
 * Version: 2.0.0
 * Requires at least: 6.0
 * Requires PHP: 8.0
 * Author: Sided
 * License: GPL v2 or later
 * Text Domain: sided-publisher
 */

defined('ABSPATH') || exit;
```

The header comment block is parsed by WordPress — every field affects directory listing appearance and compatibility checks.
