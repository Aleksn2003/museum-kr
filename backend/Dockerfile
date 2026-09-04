FROM php:8.2-fpm-alpine

# Установка зависимостей: postgresql-dev для pdo_pgsql, curl для cron-запросов
RUN apk add --no-cache postgresql-dev curl \
    && docker-php-ext-install pdo_pgsql

# Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Копируем файлы composer и устанавливаем зависимости
COPY composer.json composer.lock* ./
RUN composer install --no-dev --optimize-autoloader --no-interaction

# Копируем остальные файлы приложения
COPY . .

# Настройка cron
COPY crontab /etc/crontabs/root
RUN chmod 644 /etc/crontabs/root

COPY php.ini /usr/local/etc/php/conf.d/uploads.ini

EXPOSE 80
CMD ["sh", "-c", "crond && php -S 0.0.0.0:80 -t public"]