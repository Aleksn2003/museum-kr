FROM php:8.2-cli-alpine

RUN apk add --no-cache postgresql-dev curl \
    && docker-php-ext-install pdo_pgsql

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer
WORKDIR /var/www/html
COPY composer.json composer.lock ./
RUN composer install --no-dev --optimize-autoloader --no-interaction --no-scripts
COPY . .
RUN chmod +x /var/www/html/bin/start.sh /var/www/html/bin/sync-vk.sh
RUN cp /var/www/html/crontab /etc/crontabs/root && chmod 600 /etc/crontabs/root
COPY php.ini /usr/local/etc/php/conf.d/uploads.ini
EXPOSE 80
CMD ["/var/www/html/bin/start.sh"]
