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
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    material TEXT,
    dimensions TEXT,
    origin TEXT,
    audio_url TEXT,
    quote TEXT,
    quote_author TEXT,
    is_exhibit_of_day BOOLEAN DEFAULT false,
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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    vk_post_id BIGINT UNIQUE,
    is_deleted BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    short_text TEXT,
    description TEXT,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,
    image_url TEXT,
    location TEXT,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    vk_post_id BIGINT UNIQUE,
    is_deleted BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE page_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_url TEXT NOT NULL UNIQUE,
    content TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE page_blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_url TEXT NOT NULL,
    block_id TEXT NOT NULL,
    content TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (page_url, block_id)
);

CREATE TABLE fun_facts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    text TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO fun_facts (text) VALUES
('В музее собрано более 900 экспонатов, рассказывающих о быте и культуре якутов.'),
('Качикатская Николаевская церковь (1896 г.) — единственный сохранившийся в улусе образец русского деревянного зодчества.'),
('Шестигранный балаган с летника Даркылах — редчайший тип якутской постройки, обеспечивавший устойчивость к сильным ветрам.'),
('Музей носит имя своего основателя — краеведа Роберта Константиновича Захарова с 2020 года.'),
('На территории комплекса находится двухуровневый амбар богача Кирилла Скрябина из села Тит-Эбэ.'),
('С 2021 года музей является филиалом Хангаласского улусного краеведческого музея им. Г.В. Ксенофонтова.'),
('В музее проводятся самобытные праздники: ысыах, куйур, соревнования по национальным видам спорта.'),
('Зерносушилка мецената С.П. Барашкова — один из экспонатов, демонстрирующий хозяйственный быт XIX века.');
