CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
);

CREATE TABLE exhibits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    short_description TEXT,
    description TEXT,
    creation_date VARCHAR(100),
    image_url TEXT,
    images JSONB DEFAULT '[]'::jsonb,
    is_featured BOOLEAN DEFAULT false,
    collection_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE news (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    short_text TEXT,
    content TEXT,
    image_url TEXT,
    event_date DATE,
    is_pinned BOOLEAN DEFAULT false,
    published_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE fun_facts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    text TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Несколько стартовых фактов
INSERT INTO fun_facts (text) VALUES
('В музее собрано более 900 экспонатов, рассказывающих о быте и культуре якутов.'),
('Качикатская Николаевская церковь (1896 г.) — единственный сохранившийся в улусе образец русского деревянного зодчества.'),
('Шестигранный балаган с летника Даркылах — редчайший тип якутской постройки, обеспечивавший устойчивость к сильным ветрам.'),
('Музей носит имя своего основателя — краеведа Роберта Константиновича Захарова с 2020 года.'),
('На территории комплекса находится двухуровневый амбар богача Кирилла Скрябина из села Тит-Эбэ.'),
('С 2021 года музей является филиалом Хангаласского улусного краеведческого музея им. Г.В. Ксенофонтова.'),
('В музее проводятся самобытные праздники: ысыах, куйур, соревнования по национальным видам спорта.'),
('Зерносушилка мецената С.П. Барашкова — один из экспонатов, демонстрирующих хозяйственный быт XIX века.');

-- Создаём первого администратора (пароль: admin, хеш bcrypt)
INSERT INTO admins (username, password) VALUES
('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');
-- это хеш для "password" (не забудьте сменить!)