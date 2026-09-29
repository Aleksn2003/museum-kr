#!/bin/sh
set -eu
php /var/www/html/bin/bootstrap-admin.php
crond
exec php -S 0.0.0.0:80 -t /var/www/html/public
