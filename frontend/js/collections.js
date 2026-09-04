let currentCategory = null;
let currentPage = 1;
const perPage = 16;

// Загрузить категории
async function loadCategories() {
    const container = document.getElementById('categories-bar');
    const res = await fetch('/api/categories');
    const categories = await res.json();
    let html = '<button class="px-4 py-2 rounded border border-gray-200 bg-white hover:border-[#5D4037] transition" data-category="">Все</button>';
    categories.forEach(cat => {
        html += `<button class="px-4 py-2 rounded border border-gray-200 bg-white hover:border-[#5D4037] transition" data-category="${cat.id}" data-description="${cat.description || ''}">${cat.name} (${cat.exhibit_count})</button>`;
    });
    container.innerHTML = html;

    // Обработчики клика по категории
    container.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => {
            container.querySelectorAll('button').forEach(b => b.classList.remove('bg-[#5D4037]', 'text-white'));
            btn.classList.add('bg-[#5D4037]', 'text-white');
            currentCategory = btn.dataset.category || null;
            currentPage = 1;
            loadExhibits(currentCategory, currentPage);
        });
    });
}

// Загрузить экспонаты (с пагинацией)
async function loadExhibits(categoryId = null, page = 1) {
    const grid = document.getElementById('exhibits-grid');
    const loadMore = document.getElementById('load-more-container');
    const categoryDesc = document.getElementById('category-description');
    
    // Отображаем описание категории, если есть
    if (categoryId) {
        const catBtn = document.querySelector(`#categories-bar button[data-category="${categoryId}"]`);
        if (catBtn) {
            const desc = catBtn.dataset.description;
            categoryDesc.innerHTML = desc ? `<p class="text-sm text-gray-700">${desc}</p>` : '';
            categoryDesc.classList.remove('hidden');
        }
    } else {
        categoryDesc.classList.add('hidden');
    }

    let url = `/api/exhibits?page=${page}&per_page=${perPage}`;
    if (categoryId) url += `&category_id=${categoryId}`;

    const res = await fetch(url);
    const data = await res.json();

    // Рендер карточек
    let cardsHtml = data.items.map(item => `
        <div class="exhibit-card cursor-pointer" data-id="${item.id}">
            <img src="${item.image_url || 'https://picsum.photos/400/250?random=' + Math.random()}" alt="${item.title}" class="h-48 w-full object-cover border-b-2 border-[#5D4037]">
            <div class="p-4">
                <span class="text-xs bg-[#5D4037] text-white px-2 py-1 rounded-full">${item.creation_date || 'Без даты'}</span>
                <h3 class="font-serif text-xl font-bold mt-2 mb-1">${item.title}</h3>
                <p class="text-gray-600 text-sm line-clamp-2">${item.short_description || ''}</p>
            </div>
        </div>
    `).join('');

    if (page === 1) {
        grid.innerHTML = cardsHtml || '<p class="col-span-3 text-center text-gray-500">Экспонаты не найдены</p>';
    } else {
        grid.insertAdjacentHTML('beforeend', cardsHtml);
    }

    // Показать/скрыть кнопку "Показать еще"
    if (data.total > page * perPage) {
        loadMore.classList.remove('hidden');
    } else {
        loadMore.classList.add('hidden');
    }
}

// Кнопка "Показать еще"
document.getElementById('load-more-btn')?.addEventListener('click', () => {
    currentPage++;
    loadExhibits(currentCategory, currentPage);
});

// Инициализация
loadCategories().then(() => loadExhibits(null, 1));