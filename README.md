# Samyrtay Museum Complex

Website for the Samyrtay Museum Complex, a branch of the Khangalassky District Museum of Local Lore. The site presents the museum, its collections, news, events, and visitor information, with a small admin panel for managing content.

## Features

- Museum pages, collections, exhibits, news, and event listings
- Search and featured content
- Admin panel for editing museum content and uploading images
- Optional scheduled import of posts from a VK community by hashtag
- PostgreSQL database, PHP API, and Nginx web server
- Three sample news posts and two sample events included for a fresh installation

## Tech stack

- Frontend: HTML, CSS, and JavaScript
- API: PHP 8.2 and Slim 4
- Database: PostgreSQL 15
- Web server: Nginx
- Local environment: Docker Compose

## Run locally

Requirements: Docker Desktop with Docker Compose.

1. Copy `.env.example` to `.env`.
2. Replace `CHANGE_ME` in `DB_PASSWORD`, `JWT_SECRET`, and `ADMIN_PASSWORD` with different random values. Use at least 16 characters for `ADMIN_PASSWORD`. Keep `.env` private; it is ignored by Git.
3. Start the application:

   ```sh
   docker compose up -d --build
   ```

4. Open [http://localhost:8080](http://localhost:8080).

Check container status with `docker compose ps`. Stop the application with `docker compose down`. PostgreSQL data is kept in the `museum_pgdata` Docker volume. Avoid `docker compose down -v` if you need to keep that data.

## Admin panel

Open [http://localhost:8080/admin.html](http://localhost:8080/admin.html). The username is `admin`; use the password configured in `ADMIN_PASSWORD` in your local `.env` file.

On the first database initialization, `init.sql` creates the schema and initial museum facts. `seed-demo.sql` adds clearly marked sample news and events with images included in the repository. Their event dates are generated relative to the database initialization date. They are examples for demonstrating the site, not real museum announcements.

PostgreSQL initialization scripts run only when the database volume is empty. To load demo content manually into an existing database, back it up first: `seed-demo.sql` hides currently visible news and events before adding the samples.

## VK import

VK import is optional and disabled until credentials are configured. To import posts from a VK community, set these values in your private `.env` file:

- `VK_ACCESS_TOKEN`: a valid VK API access token with permission to read the community wall
- `VK_GROUP_ID`: the numeric ID of the community, without a minus sign
- `VK_SYNC_KEY`: a separate, random secret used to authorize the importer

The importer checks the latest 20 wall posts every minute. Posts tagged `#новость`, `#новости`, or `#news` are imported as news. Posts tagged `#мероприятие`, `#мероприятия`, `#афиша`, `#событие`, `#события`, or `#event` are imported as events. If a post has multiple recognized tags, the first recognized tag determines its type. Import runs only for the community configured by `VK_GROUP_ID`; each user must provide their own token and community ID. Never commit VK credentials to the repository.

## Images and data

Sample content uses images stored under `frontend/img/`, so it is available after cloning the repository. Images uploaded through the admin panel are stored in `frontend/img/uploads/` and are excluded from new Git commits. Back up uploaded images together with the PostgreSQL database before moving the project. Some existing uploaded images are already tracked in Git from earlier versions.

## Docker notes

Only the Nginx website port is published to the host (`WEB_PORT`, default `8080`). The API and PostgreSQL are available to other services on the private Compose network. The included PHP built-in server is intended for local development and demonstrations. A public production deployment should use a production PHP server setup, HTTPS, managed secrets, and regular database and upload backups.

## Authorship and use

Project author: [Aleksn2003](https://github.com/Aleksn2003). All rights to the original source code, structure, and design created by the author remain with the author. Use, copying, modification, or distribution of the author's work beyond the functionality provided by GitHub requires the author's prior permission. The public repository may be viewed and forked on GitHub under the [GitHub Terms of Service](https://docs.github.com/en/site-policy/github-terms/github-terms-of-service); this does not grant an open license to reuse the author's work.

This notice applies only to original work by the project author. Museum names, photographs, historical materials, logos, and other third-party content may belong to the museum or their respective rights holders and are not claimed by this notice.

This repository does not include an open-source license (`LICENSE`). This notice records the author's intent but is not legal advice and does not replace a separate license.
