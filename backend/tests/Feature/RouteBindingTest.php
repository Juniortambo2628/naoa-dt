<?php

namespace Tests\Feature;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Routing\Route as RoutingRoute;
use ReflectionMethod;
use Tests\TestCase;

/**
 * Guards against a silent failure mode that had already bitten one feature:
 * when a route parameter doesn't match the controller's type-hinted argument
 * (e.g. `DELETE /polaroid-images/{id}` -> `destroy(PolaroidImage $polaroid)`),
 * implicit binding never fires — the controller receives an empty model and
 * "succeeds" while touching nothing, or writes a stray row.
 *
 * Every Eloquent type-hint in a controller action must name a route parameter.
 */
class RouteBindingTest extends TestCase
{
    public function test_every_eloquent_action_parameter_matches_a_route_parameter(): void
    {
        $mismatches = [];

        /** @var RoutingRoute $route */
        foreach (app('router')->getRoutes() as $route) {
            $action = $route->getActionName();
            if (! str_contains($action, 'Controller@') || ! class_exists(explode('@', $action)[0])) {
                continue;
            }

            [$class, $method] = explode('@', $action);

            try {
                $parameters = (new ReflectionMethod($class, $method))->getParameters();
            } catch (\Throwable) {
                continue;
            }

            foreach ($parameters as $parameter) {
                $type = $parameter->getType();
                if (! $type || $type->isBuiltin() || ! class_exists($type->getName())) {
                    continue;
                }

                if (! is_subclass_of($type->getName(), Model::class)) {
                    continue;
                }

                // Optional arguments are fine: Laravel injects their default
                // (null) instead of building an empty model — that's how
                // `getSchedule(?Event $event = null)` filters.
                if ($parameter->isDefaultValueAvailable()) {
                    continue;
                }

                if (! in_array($parameter->getName(), $route->parameterNames(), true)) {
                    $mismatches[] = sprintf(
                        '%s %s -> %s::%s($%s) — route has [%s]',
                        $route->methods()[0],
                        $route->uri(),
                        $class,
                        $method,
                        $parameter->getName(),
                        implode(', ', $route->parameterNames()) ?: 'none',
                    );
                }
            }
        }

        $this->assertSame([], $mismatches, "Broken implicit bindings:\n".implode("\n", $mismatches));
    }
}
