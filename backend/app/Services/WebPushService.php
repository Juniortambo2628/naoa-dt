<?php

namespace App\Services;

use App\Models\PushSubscription;
use GuzzleHttp\Client;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Minishlink\WebPush\Subscription;
use Minishlink\WebPush\VAPID;
use Minishlink\WebPush\WebPush;

/**
 * Sends web push notifications to guests' devices.
 *
 * VAPID keys (the key pair that identifies this site to the browsers' push
 * services) come from VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY when set;
 * otherwise a pair is generated on first use and kept in storage/, which
 * survives deploys. Changing the keys invalidates existing subscriptions.
 */
class WebPushService
{
    private const KEY_FILE = 'app/webpush-vapid.json';

    private ?array $keys = null;

    /** @return array{publicKey: string, privateKey: string}|null */
    public function keys(): ?array
    {
        if ($this->keys) {
            return $this->keys;
        }

        $public = config('services.webpush.public_key');
        $private = config('services.webpush.private_key');
        if ($public && $private) {
            return $this->keys = ['publicKey' => $public, 'privateKey' => $private];
        }

        $path = storage_path(self::KEY_FILE);
        if (File::exists($path)) {
            $stored = json_decode(File::get($path), true);
            if (! empty($stored['publicKey']) && ! empty($stored['privateKey'])) {
                return $this->keys = $stored;
            }
        }

        try {
            $generated = VAPID::createVapidKeys();
            File::ensureDirectoryExists(dirname($path));
            File::put($path, json_encode($generated));
            @chmod($path, 0600);

            return $this->keys = $generated;
        } catch (\Throwable $e) {
            Log::error('Web push: could not generate VAPID keys: '.$e->getMessage());

            return null;
        }
    }

    public function publicKey(): ?string
    {
        return $this->keys()['publicKey'] ?? null;
    }

    /**
     * Push one payload to many subscriptions. Subscriptions the push service
     * reports as gone (unsubscribed / expired) are deleted.
     *
     * @param  iterable<PushSubscription>  $subscriptions
     * @return array{sent: int, failed: int, expired: int}
     */
    public function send(iterable $subscriptions, array $payload): array
    {
        $result = ['sent' => 0, 'failed' => 0, 'expired' => 0];
        $keys = $this->keys();
        if (! $keys) {
            foreach ($subscriptions as $_) {
                $result['failed']++;
            }

            return $result;
        }

        // The logger receives the library's notices (e.g. "install GMP for
        // speed" on shared hosting) instead of PHP notices, which Laravel
        // would turn into exceptions.
        $webPush = new WebPush(
            auth: ['VAPID' => [
                'subject' => $this->subject(),
                'publicKey' => $keys['publicKey'],
                'privateKey' => $keys['privateKey'],
            ]],
            defaultOptions: ['TTL' => 86400, 'urgency' => 'high'],
            client: new Client(['timeout' => 20]),
            logger: Log::getFacadeRoot(),
        );
        $webPush->setReuseVAPIDHeaders(true);

        $json = json_encode($payload);
        foreach ($subscriptions as $subscription) {
            $webPush->queueNotification(Subscription::create([
                'endpoint' => $subscription->endpoint,
                'publicKey' => $subscription->public_key,
                'authToken' => $subscription->auth_token,
                'contentEncoding' => $subscription->content_encoding ?: 'aes128gcm',
            ]), $json);
        }

        foreach ($webPush->flush() as $report) {
            if ($report->isSuccess()) {
                $result['sent']++;

                continue;
            }

            $result['failed']++;
            if ($report->isSubscriptionExpired()) {
                $result['expired']++;
                PushSubscription::where('endpoint_hash', PushSubscription::hashEndpoint($report->getEndpoint()))->delete();
            } else {
                Log::warning('Web push failed: '.$report->getReason());
            }
        }

        return $result;
    }

    /** Push services require a contact: a mailto: address or the site URL. */
    private function subject(): string
    {
        $from = config('mail.from.address');
        if ($from && filter_var($from, FILTER_VALIDATE_EMAIL)) {
            return 'mailto:'.$from;
        }

        return (string) config('app.url');
    }
}
