# Музейный комплекс «Самыртай» / Samyrtay Museum Complex

## Авторство и использование

Автор проекта: [Aleksn2003](https://github.com/Aleksn2003). Все права на оригинальный исходный код, структуру и дизайн, созданные автором проекта, сохраняются за автором. Использование, копирование, изменение и распространение авторских материалов за пределами возможностей GitHub требуют предварительного разрешения автора. Публичный репозиторий можно просматривать и форкать на GitHub в соответствии с [условиями использования GitHub](https://docs.github.com/en/site-policy/github-terms/github-terms-of-service); это не предоставляет открытую лицензию на повторное использование авторских материалов.

Этот раздел относится только к оригинальным материалам автора проекта. Название музея, фотографии, исторические материалы, логотипы и другой сторонний контент могут принадлежать музею или соответствующим правообладателям. Автор проекта не заявляет на них права.

В репозитории нет открытой лицензии (`LICENSE`). Это уведомление фиксирует намерение автора, но не является юридической консультацией и не заменяет отдельную лицензию.

### Authorship and Use (English)

Project author: [Aleksn2003](https://github.com/Aleksn2003). All rights to the original source code, structure, and design created by the project author remain with the author. Use, copying, modification, or distribution of the author's work beyond the functionality provided by GitHub requires the author's prior permission. The public repository may be viewed and forked on GitHub under the [GitHub Terms of Service](https://docs.github.com/en/site-policy/github-terms/github-terms-of-service); this does not grant an open license to reuse the author's work.

This notice applies only to original work by the project author. The museum name, photographs, historical materials, logos, and other third-party content may belong to the museum or their respective rights holders. No rights to those materials are claimed by the project author.

This repository does not include an open-source license (`LICENSE`). This notice records the author's intent but is not legal advice and does not replace a separate license.

---

## О проекте

Сайт музейного комплекса «Самыртай» — филиала Хангаласского улусного краеведческого музея им. Г. В. Ксенофонтова. На сайте представлены сведения о музее, коллекциях и экспонатах, новости, мероприятия и информация для посетителей. В проект также входит панель управления содержимым.

### Возможности

- Страницы музея, коллекции и экспонаты
- Новости и афиша мероприятий
- Поиск и избранные материалы
- Панель администратора для редактирования материалов и загрузки изображений
- Необязательный автоматический импорт публикаций VK по хэштегам
- PostgreSQL, PHP API и веб-сервер Nginx
- Три демонстрационные новости и два демонстрационных мероприятия при чистом запуске

### Технологии

- Интерфейс: HTML, CSS и JavaScript
- API: PHP 8.2 и Slim 4
- База данных: PostgreSQL 15
- Веб-сервер: Nginx
- Локальный запуск: Docker Compose

## Локальный запуск

Требуются Docker Desktop и Docker Compose.

1. Скопируйте `.env.example` в `.env`.
2. Замените `CHANGE_ME` в `DB_PASSWORD`, `JWT_SECRET` и `ADMIN_PASSWORD` разными случайными значениями. Пароль `ADMIN_PASSWORD` должен содержать не менее 16 символов. Не публикуйте `.env`: этот файл исключён из Git.
3. Запустите приложение:

   ```sh
   docker compose up -d --build
   ```

4. Откройте сайт: [http://localhost:8080](http://localhost:8080).

Проверить состояние контейнеров можно командой `docker compose ps`. Остановить приложение — `docker compose down`. Данные PostgreSQL сохраняются в томе Docker `museum_pgdata`. Не используйте `docker compose down -v`, если хотите сохранить базу.

### Панель администратора

Откройте [http://localhost:8080/admin.html](http://localhost:8080/admin.html). Логин — `admin`, пароль — значение `ADMIN_PASSWORD` из локального файла `.env`.

При первой инициализации базы `init.sql` создаёт структуру таблиц и начальные факты о музее. Затем `seed-demo.sql` добавляет три демонстрационные новости и два демонстрационных мероприятия с изображениями из репозитория. Даты мероприятий вычисляются относительно даты инициализации базы. Эти записи нужны для демонстрации сайта и не являются реальными объявлениями музея.

Скрипты инициализации PostgreSQL выполняются только для пустого тома. Если применяете `seed-demo.sql` вручную к существующей базе, сначала сделайте резервную копию: скрипт скрывает текущие новости и мероприятия перед добавлением примеров.

## Импорт из VK

Импорт VK необязателен и отключён, пока не заданы учётные данные. Для импорта публикаций сообщества укажите в личном `.env`:

- `VK_ACCESS_TOKEN` — действующий токен VK API с доступом к стене сообщества;
- `VK_GROUP_ID` — числовой ID сообщества без знака минус;
- `VK_SYNC_KEY` — отдельный случайный секрет для авторизации импорта.

Импортёр проверяет последние 20 публикаций каждую минуту. Хэштеги `#новость`, `#новости` и `#news` добавляют публикацию в новости. Хэштеги `#мероприятие`, `#мероприятия`, `#афиша`, `#событие`, `#события` и `#event` добавляют её в мероприятия. Если у записи несколько распознанных хэштегов, тип определяет первый распознанный хэштег. Импорт выполняется для сообщества из `VK_GROUP_ID`; каждому пользователю проекта нужны собственные токен и ID сообщества. Не добавляйте токены VK в репозиторий.

## Данные и изображения

Демонстрационные записи используют изображения из `frontend/img/`, поэтому доступны после клонирования репозитория. Загруженные через админку изображения хранятся в `frontend/img/uploads/` и исключены из новых коммитов Git. Перед переносом проекта сделайте резервную копию этой папки вместе с базой. Некоторые изображения, загруженные в предыдущих версиях, уже отслеживаются в Git.

## Примечания по Docker

На компьютере опубликован только порт сайта Nginx (`WEB_PORT`, по умолчанию `8080`). API и PostgreSQL доступны другим сервисам только внутри сети Compose. Встроенный PHP-сервер предназначен для локальной разработки и демонстрации. Для публичного размещения настройте производственный PHP-сервер, HTTPS, защищённое хранение секретов и регулярное резервное копирование базы и изображений.

---

## About the project

The Samyrtay Museum Complex website is for a branch of the Khangalassky District Museum of Local Lore. It presents museum information, collections, exhibits, news, events, and visitor details. The project also includes a content administration panel.

### Features

- Museum pages, collections, and exhibits
- News and event listings
- Search and featured content
- Admin panel for editing content and uploading images
- Optional scheduled import of VK community posts by hashtag
- PostgreSQL database, PHP API, and Nginx web server
- Three sample news posts and two sample events on a fresh installation

### Tech stack

- Frontend: HTML, CSS, and JavaScript
- API: PHP 8.2 and Slim 4
- Database: PostgreSQL 15
- Web server: Nginx
- Local environment: Docker Compose

## Run locally

Requirements: Docker Desktop with Docker Compose.

1. Copy `.env.example` to `.env`.
2. Replace `CHANGE_ME` in `DB_PASSWORD`, `JWT_SECRET`, and `ADMIN_PASSWORD` with different random values. Use at least 16 characters for `ADMIN_PASSWORD`. Keep `.env` private; Git ignores it.
3. Start the application:

   ```sh
   docker compose up -d --build
   ```

4. Open [http://localhost:8080](http://localhost:8080).

Check container status with `docker compose ps`. Stop the application with `docker compose down`. PostgreSQL data is kept in the `museum_pgdata` Docker volume. Avoid `docker compose down -v` if you need to keep that data.

### Admin panel

Open [http://localhost:8080/admin.html](http://localhost:8080/admin.html). The username is `admin`; use the password set as `ADMIN_PASSWORD` in your local `.env` file.

On first database initialization, `init.sql` creates the schema and initial museum facts. `seed-demo.sql` adds three sample news posts and two sample events with repository images. Event dates are calculated relative to the database initialization date. These records are for demonstrating the site and are not real museum announcements.

PostgreSQL initialization scripts run only when the database volume is empty. Back up an existing database before manually running `seed-demo.sql`; it hides currently visible news and events before adding the samples.

## VK import

VK import is optional and disabled until credentials are configured. Set these values in your private `.env` file to import posts from a VK community:

- `VK_ACCESS_TOKEN`: a valid VK API access token with permission to read the community wall
- `VK_GROUP_ID`: the numeric community ID, without a minus sign
- `VK_SYNC_KEY`: a separate random secret used to authorize the importer

The importer checks the latest 20 wall posts every minute. Posts tagged `#новость`, `#новости`, or `#news` are imported as news. Posts tagged `#мероприятие`, `#мероприятия`, `#афиша`, `#событие`, `#события`, or `#event` are imported as events. If a post has multiple recognized tags, the first recognized tag determines its type. Import runs for the community configured by `VK_GROUP_ID`; each user needs their own token and community ID. Never commit VK credentials to the repository.

## Data and images

Sample records use images stored in `frontend/img/`, so they are available after cloning. Images uploaded through the admin panel are stored in `frontend/img/uploads/` and are excluded from new Git commits. Back up this folder together with the database before moving the project. Some images uploaded in earlier versions are already tracked in Git.

## Docker notes

Only the Nginx website port is published to the host (`WEB_PORT`, default `8080`). The API and PostgreSQL are available to other services only on the Compose network. The included PHP built-in server is intended for local development and demonstrations. A public production deployment should use a production PHP server setup, HTTPS, managed secrets, and regular database and image backups.
