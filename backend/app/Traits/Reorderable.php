<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

trait Reorderable
{
    /**
     * Reorder items for a given model.
     *
     * @param  class-string<Model>  $model  The Eloquent model class (e.g., GalleryItem::class)
     * @param  Request  $request  Request containing items array with id and order
     * @param  string  $inputKey  The request input key (e.g., 'items' or 'faqs')
     * @param  string  $orderColumn  The column name to update (default: 'order')
     */
    protected function reorderItems(
        string $model,
        Request $request,
        string $inputKey = 'items',
        string $orderColumn = 'order'
    ): \Illuminate\Http\JsonResponse {
        $table = (new $model)->getTable();

        $request->validate([
            "{$inputKey}" => 'required|array',
            "{$inputKey}.*.id" => "required|exists:{$table},id",
            "{$inputKey}.*.{$orderColumn}" => 'required|integer',
        ]);

        foreach ($request->input($inputKey) as $item) {
            $model::where('id', $item['id'])->update([$orderColumn => $item[$orderColumn]]);
        }

        return response()->json(['message' => 'Order updated successfully']);
    }
}
