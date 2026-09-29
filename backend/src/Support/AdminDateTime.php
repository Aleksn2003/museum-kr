<?php
namespace App\Support;

final class AdminDateTime
{
    public static function parse(?string $value): ?string
    {
        if ($value === null || trim($value) === '') return null;
        $timezone = new \DateTimeZone($_ENV['APP_TIMEZONE'] ?? 'Asia/Yakutsk');
        foreach (['!Y-m-d\\TH:i', '!Y-m-d\\TH:i:s'] as $format) {
            $date = \DateTimeImmutable::createFromFormat($format, $value, $timezone);
            $errors = \DateTimeImmutable::getLastErrors();
            if ($date && ($errors === false || ($errors['warning_count'] === 0 && $errors['error_count'] === 0))) {
                return $date->format('Y-m-d H:i:sP');
            }
        }
        throw new \InvalidArgumentException('Дата должна быть в формате YYYY-MM-DDTHH:MM.');
    }
}
