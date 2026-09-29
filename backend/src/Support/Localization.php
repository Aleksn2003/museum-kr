<?php
namespace App\Support;

use Psr\Http\Message\ServerRequestInterface as Request;

final class Localization
{
    public static function language(Request $request): string
    {
        return ($request->getQueryParams()['lang'] ?? '') === 'en' ? 'en' : 'ru';
    }

    public static function row(array $row, string $language, array $fields): array
    {
        if ($language !== 'en') {
            return $row;
        }

        foreach ($fields as $field) {
            $translated = $row[$field . '_en'] ?? null;
            if (is_string($translated) && trim($translated) !== '') {
                $row[$field] = $translated;
            }
        }

        return $row;
    }

    public static function rows(array $rows, string $language, array $fields): array
    {
        return array_map(
            static fn (array $row): array => self::row($row, $language, $fields),
            $rows
        );
    }
}
