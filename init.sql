CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    name_en VARCHAR(255),
    description_en TEXT,
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
    title_en VARCHAR(255),
    short_description_en TEXT,
    description_en TEXT,
    material_en TEXT,
    dimensions_en TEXT,
    origin_en TEXT,
    quote_en TEXT,
    quote_author_en TEXT,
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
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    title_en VARCHAR(255),
    short_text_en TEXT,
    content_en TEXT
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
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    title_en VARCHAR(255),
    short_text_en TEXT,
    description_en TEXT,
    location_en TEXT
);

CREATE TABLE page_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_url TEXT NOT NULL UNIQUE,
    content TEXT,
    content_en TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE page_blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_url TEXT NOT NULL,
    block_id TEXT NOT NULL,
    content TEXT,
    content_en TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (page_url, block_id)
);

CREATE TABLE fun_facts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    text TEXT NOT NULL,
    text_en TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO fun_facts (text, text_en) VALUES
('В музее собрано более 900 экспонатов, рассказывающих о быте и культуре якутов.', 'The museum holds more than 900 objects documenting Sakha life and culture.'),
('Качикатская Николаевская церковь (1896 г.) — единственный сохранившийся в улусе образец русского деревянного зодчества.', 'The Kachikatskaya St. Nicholas Church (1896) is the only surviving example of Russian wooden architecture in the district.'),
('Шестигранный балаган с летника Даркылах — редчайший тип якутской постройки, обеспечивавший устойчивость к сильным ветрам.', 'The hexagonal balagan from Darkylakh is a rare Sakha building type designed to withstand strong winds.'),
('Музей носит имя своего основателя — краеведа Роберта Константиновича Захарова с 2020 года.', 'Since 2020, the museum has borne the name of its founder, local historian Robert Konstantinovich Zakharov.'),
('На территории комплекса находится двухуровневый амбар богача Кирилла Скрябина из села Тит-Эбэ.', 'The grounds include a two-storey barn that belonged to Kirill Skryabin of Tit-Ebe village.'),
('С 2021 года музей является филиалом Хангаласского улусного краеведческого музея им. Г.В. Ксенофонтова.', 'Since 2021, the museum has been a branch of the G. V. Ksenofontov Khangalassky District Museum of Local History.'),
('В музее проводятся самобытные праздники: ысыах, куйур, соревнования по национальным видам спорта.', 'The museum hosts traditional celebrations, including Ysyakh, Kuyur and competitions in national sports.'),
('Зерносушилка мецената С.П. Барашкова — один из экспонатов, демонстрирующий хозяйственный быт XIX века.', 'The grain dryer donated by S. P. Barashkov illustrates 19th-century agricultural life.');
