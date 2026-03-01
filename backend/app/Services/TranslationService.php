<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TranslationService
{
    /**
     * Detect if the text is in Shona or Ndebele and translate to English.
     *
     * @return array{translated: bool, original_language: string, translated_text: string}
     */
    public function detectAndTranslate(string $text): array
    {
        $apiKey = config('services.openai.api_key');
        if (!$apiKey) {
            return [
                'translated' => false,
                'original_language' => 'en',
                'translated_text' => $text,
            ];
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => "Bearer {$apiKey}",
                'Content-Type' => 'application/json',
            ])->post('https://api.openai.com/v1/chat/completions', [
                'model' => config('services.openai.model', 'gpt-4o'),
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => 'You are a language detection and translation assistant. Detect if the following text is in Shona (sn), Ndebele (nd), or English (en). If it is in Shona or Ndebele, translate it to English. Respond in JSON format only: {"language": "sn|nd|en", "translation": "english text here"}. If already in English, set translation to the original text.',
                    ],
                    [
                        'role' => 'user',
                        'content' => $text,
                    ],
                ],
                'temperature' => 0.1,
                'max_tokens' => 1000,
            ]);

            $content = $response->json('choices.0.message.content', '');
            $parsed = json_decode($content, true);

            if ($parsed && isset($parsed['language'])) {
                $isTranslated = in_array($parsed['language'], ['sn', 'nd']);
                return [
                    'translated' => $isTranslated,
                    'original_language' => $parsed['language'],
                    'translated_text' => $parsed['translation'] ?? $text,
                ];
            }
        } catch (\Exception $e) {
            Log::error('Translation failed: ' . $e->getMessage());
        }

        return [
            'translated' => false,
            'original_language' => 'en',
            'translated_text' => $text,
        ];
    }
}
