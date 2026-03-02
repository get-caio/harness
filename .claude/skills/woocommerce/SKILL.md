---
name: woocommerce
description: Patterns for building WooCommerce plugins with WordPress Plugin API, WC REST API v3, order hooks, and product sync. Use this skill when building WooCommerce integrations, product catalog syncing via WC API, order webhook handling, or WordPress eCommerce plugin development. Trigger on any mention of WooCommerce, WC plugin, WC REST API, or WordPress eCommerce.
---

# WooCommerce Plugin

WooCommerce plugins use the WordPress Plugin API with WooCommerce-specific hooks and the WC REST API for catalog and order operations.

## When to Read This

- Building a WooCommerce connector plugin
- Syncing product catalogs from WC REST API
- Handling order completion hooks for attribution
- Registering webhook endpoints for real-time updates

## Plugin Setup

```php
// myapp-woocommerce.php
defined('ABSPATH') || exit;

// Check WooCommerce is active
add_action('plugins_loaded', function () {
    if (!class_exists('WooCommerce')) {
        add_action('admin_notices', function () {
            echo '<div class="error"><p>This plugin requires WooCommerce to be installed and active.</p></div>';
        });
        return;
    }
    require_once plugin_dir_path(__FILE__) . 'includes/class-myapp-wc.php';
    new MyApp_WC();
});
```

## Product Catalog Sync

```php
class MyApp_WC_Sync {
    public function sync_products(): array {
        $products = wc_get_products([
            'limit' => -1,
            'status' => 'publish',
            'type' => ['simple', 'variable'],
        ]);

        $synced = [];
        foreach ($products as $product) {
            $data = [
                'external_id' => (string) $product->get_id(),
                'title' => $product->get_name(),
                'description' => $product->get_short_description(),
                'price' => $product->get_price(),
                'image_url' => wp_get_attachment_url($product->get_image_id()),
                'url' => $product->get_permalink(),
                'in_stock' => $product->is_in_stock(),
                'categories' => wp_list_pluck(
                    $product->get_category_ids(), 'term_id'
                ),
            ];

            $this->push_to_api($data);
            $synced[] = $data['external_id'];
        }
        return $synced;
    }

    private function push_to_api(array $product): void {
        $api_key = get_option('myapp_api_key');
        $api_url = get_option('myapp_api_url', 'https://api.example.com');
        wp_remote_post($api_url . '/api/v1/ecommerce/products', [
            'headers' => [
                'Authorization' => 'Bearer ' . $api_key,
                'Content-Type' => 'application/json',
            ],
            'body' => wp_json_encode($product),
            'timeout' => 15,
        ]);
    }
}
```

## Order Attribution Hook

```php
// Track purchases attributed to your app
add_action('woocommerce_order_status_completed', function ($order_id) {
    $order = wc_get_order($order_id);
    if (!$order) return;

    // Always prefer order meta (stored at checkout) over cookies
    $attribution_ref = $order->get_meta('_myapp_ref');
    if (empty($attribution_ref)) return; // No attribution — skip

    $api_key = get_option('myapp_api_key');
    $api_url = get_option('myapp_api_url', 'https://api.example.com');
    wp_remote_post($api_url . '/webhooks/woocommerce/orders', [
        'headers' => [
            'Authorization' => 'Bearer ' . $api_key,
            'Content-Type' => 'application/json',
        ],
        'body' => wp_json_encode([
            'order_id' => $order_id,
            'total' => $order->get_total(),
            'currency' => $order->get_currency(),
            'attribution_ref' => sanitize_text_field($attribution_ref),
            'items' => array_map(function ($item) {
                return [
                    'product_id' => $item->get_product_id(),
                    'quantity' => $item->get_quantity(),
                    'total' => $item->get_total(),
                ];
            }, $order->get_items()),
        ]),
    ]);
});

// Capture attribution ref from cookie into order meta at checkout
add_action('woocommerce_checkout_update_order_meta', function ($order_id) {
    if (isset($_COOKIE['myapp_ref'])) {
        update_post_meta($order_id, '_myapp_ref', sanitize_text_field($_COOKIE['myapp_ref']));
    }
});
```

## Scheduled Sync

```php
// Register cron for 4-hour sync
register_activation_hook(__FILE__, function () {
    if (!wp_next_scheduled('myapp_product_sync')) {
        wp_schedule_event(time(), 'four_hours', 'myapp_product_sync');
    }
});

add_filter('cron_schedules', function ($schedules) {
    $schedules['four_hours'] = [
        'interval' => 4 * HOUR_IN_SECONDS,
        'display' => 'Every 4 Hours',
    ];
    return $schedules;
});

add_action('myapp_product_sync', [MyApp_WC_Sync::class, 'sync_products']);
```

## Common Mistakes

1. **Always use `wp_remote_post/get`** not `curl` — respects WordPress proxy and SSL settings
2. **Sanitize all cookie values** — `$_COOKIE` is user-controlled input
3. **Check WooCommerce is active** before using any `wc_*` functions
4. **Handle refunds** — hook `woocommerce_order_refunded` to reverse attributions
5. **Use `wp_json_encode`** not `json_encode` — handles encoding edge cases
6. **Clean up cron** on deactivation: `wp_clear_scheduled_hook('myapp_product_sync')`
7. **Prefer order meta over cookies** in order hooks — cookies may not be available in async/cron contexts
