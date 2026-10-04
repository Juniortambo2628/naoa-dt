<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Stichoza\GoogleTranslate\GoogleTranslate;

class TranslateController extends Controller
{
    use ApiResponse;

    public function translate(Request $request)
    {
        $request->validate([
            'text' => 'required|string',
            'target_lang' => 'required|string',
        ]);

        $text = $request->input('text');
        $targetLang = $request->input('target_lang');
        $sourceLang = 'en'; // Assuming source is always English for this admins tool

        try {
            $tr = new GoogleTranslate();
            $tr->setSource($sourceLang);
            $tr->setTarget($targetLang);
            $translatedText = $tr->translate($text);

            return $this->successResponse(['translation' => $translatedText]);
        } catch (\Exception $e) {
            return $this->errorResponse('Translation failed: ' . $e->getMessage(), 500);
        }
    }
}
