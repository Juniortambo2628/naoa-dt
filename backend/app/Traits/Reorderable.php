<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

trait Reorderable
{
    /**
     * Reorder items for a given model.
     *
     * @param Model $model The Eloquent model class (e.g., GalleryItem::class)
     * @param Request $request Request containing items array with id and order
     * @param string $inputKey The request input key (e.g., 'items' or 'faqs')
     * @param string $orderColumn The column name to update (default: 'order')
     */
    protected function reorderItems(
        Model $model,
        Request $request,
        string $inputKey = 'items',
        string $orderColumn = 'order'
    ): \Illuminate\Http\JsonResponse {
        $request->validate([
            "{$inputKey}" => 'required|array',
            "{$inputKey}.*.id" => "required|exists:{$model->getTable()},id",
            "{$inputKey}.*.{$orderColumn}" => 'required|integer',
        ]);

        foreach ($request->input($inputKey) as $item) {
            $model::where('id', $item['id'])->update([$orderColumn => $item[$orderColumn]]);
        }

        return response()->json(['message' => 'Order updated successfully']);
    }
}
