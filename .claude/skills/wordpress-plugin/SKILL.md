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

## Plugin Structure

```
sided-publisher/
├── sided-publisher.php           # Main plugin file (headers, activation)
├── includes/
│   ├── class-sided-admin.php     # Admin settings page
│   ├── class-sided-api.php       # REST API endpoints
│   ├── class-sided-embed.php     # Script injection logic
│   └── class-sided-gutenberg.php # Gutenberg block registration
├── blocks/
│   ├── sided-poll/
│   │   ├── block.json            # Block metadata
│   │   ├── edit.tsx              # Editor component
│   │   ├── save.tsx              # Frontend render
│   │   └── index.ts              # Block registration
│   └── build/                    # Compiled block assets
├── assets/
│   ├── admin.css
│   └── admin.js
├── languages/                    # i18n
├── readme.txt                    # WordPress.org listing
└── uninstall.php                 # Clean uninstall handler
```

## Main Plugin File

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

define('SIDED_VERSION', '2.0.0');
define('SIDED_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('SIDED_PLUGIN_URL', plugin_dir_url(__FILE__));

// Autoload
require_once SIDED_PLUGIN_DIR . 'includes/class-sided-admin.php';
require_once SIDED_PLUGIN_DIR . 'includes/class-sided-api.php';
require_once SIDED_PLUGIN_DIR . 'includes/class-sided-embed.php';
require_once SIDED_PLUGIN_DIR . 'includes/class-sided-gutenberg.php';

// Initialize
add_action('init', function () {
    Sided_Gutenberg::register_blocks();
});
add_action('rest_api_init', [Sided_Api::class, 'register_routes']);
add_action('admin_menu', [Sided_Admin::class, 'register_menu']);
add_action('wp_enqueue_scripts', [Sided_Embed::class, 'inject_script']);

// Activation
register_activation_hook(__FILE__, function () {
    add_option('sided_api_key', '');
    add_option('sided_property_id', '');
    add_option('sided_embed_enabled', 'yes');
});
```

## Security Patterns

### Nonce Verification (CRITICAL)

```php
// In admin forms — always verify nonces
public static function save_settings(): void {
    if (!isset($_POST['sided_nonce']) ||
        !wp_verify_nonce($_POST['sided_nonce'], 'sided_save_settings')) {
        wp_die('Security check failed');
    }

    if (!current_user_can('manage_options')) {
        wp_die('Unauthorized');
    }

    // Sanitize all input
    $api_key = sanitize_text_field($_POST['sided_api_key'] ?? '');
    $property_id = sanitize_text_field($_POST['sided_property_id'] ?? '');

    update_option('sided_api_key', $api_key);
    update_option('sided_property_id', $property_id);
}

// In forms — always output nonce field
public static function render_settings(): void {
    ?>
    <form method="post" action="">
        <?php wp_nonce_field('sided_save_settings', 'sided_nonce'); ?>
        <!-- form fields -->
        <?php submit_button(); ?>
    </form>
    <?php
}
```

### REST API Authentication

```php
class Sided_Api {
    public static function register_routes(): void {
        register_rest_route('sided/v1', '/settings', [
            'methods' => 'GET',
            'callback' => [self::class, 'get_settings'],
            'permission_callback' => function () {
                return current_user_can('manage_options');
            },
        ]);

        register_rest_route('sided/v1', '/settings', [
            'methods' => 'POST',
            'callback' => [self::class, 'update_settings'],
            'permission_callback' => function () {
                return current_user_can('manage_options');
            },
            'args' => [
                'api_key' => [
                    'type' => 'string',
                    'sanitize_callback' => 'sanitize_text_field',
                    'required' => true,
                ],
            ],
        ]);
    }
}
```

### Input Sanitization

```php
// Always sanitize based on expected type
sanitize_text_field($input);        // Single-line text
sanitize_textarea_field($input);    // Multi-line text
absint($input);                     // Positive integer
esc_url_raw($input);                // URL (for storage)
esc_url($input);                    // URL (for display)
sanitize_email($input);             // Email
wp_kses_post($input);               // Rich HTML content

// Never trust user input directly
// BAD: update_option('key', $_POST['value']);
// GOOD: update_option('key', sanitize_text_field($_POST['value'] ?? ''));
```

## Script Injection

```php
class Sided_Embed {
    public static function inject_script(): void {
        if (get_option('sided_embed_enabled') !== 'yes') return;

        $property_id = get_option('sided_property_id');
        if (empty($property_id)) return;

        wp_enqueue_script(
            'sided-embed',
            'https://embed-v2.sided.co/load.min.js',
            [],
            null,
            ['strategy' => 'async', 'in_footer' => true]
        );

        wp_add_inline_script('sided-embed', sprintf(
            'window.sidedConfig = %s;',
            wp_json_encode([
                'propertyId' => sanitize_text_field($property_id),
                'apiBase' => 'https://api.sided.ai',
            ])
        ), 'before');
    }
}
```

## Gutenberg Block

```json
// blocks/sided-poll/block.json
{
  "$schema": "https://schemas.wp.org/trunk/block.json",
  "apiVersion": 3,
  "name": "sided/poll",
  "title": "Sided Poll",
  "category": "embed",
  "icon": "chart-bar",
  "description": "Embed a Sided poll in your content.",
  "attributes": {
    "pollId": { "type": "string", "default": "" }
  },
  "editorScript": "file:./index.js",
  "render": "file:./render.php"
}
```

## Common Mistakes

1. **Never skip nonce verification** — every form submission and AJAX call needs it
2. **Never use `$_GET`/`$_POST` without sanitization** — always sanitize before use
3. **Always check `current_user_can()`** — verify permissions on every admin action
4. **Use `esc_attr()`, `esc_html()`, `esc_url()`** when outputting to HTML
5. **Never hardcode API URLs** — use `get_option()` so they can be updated
6. **Always provide `uninstall.php`** — clean up options and data on plugin removal
7. **Use `wp_remote_get/post`** instead of `curl` — respects WP proxy settings
