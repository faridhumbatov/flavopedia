/* --- Config & State --- */
const BASE_URL = 'https://www.themealdb.com/api/json/v1/1';

let state = {
    allMeals: [],
    displayedCount: 0,
    batchSize: 8,
    isLoading: false
};

// "Ağıllı Soyuducu" üçün yalnız ƏSAS elementlər (5% məsələsinin həlli)
// Bu inqrediyentlər seçiləndə, yemək 99% ehtimalla əsasən bundan ibarət olur.
const MAIN_INGREDIENTS = [
    'Chicken', 'Beef', 'Pork', 'Salmon',
    'Lamb', 'Pasta', 'Rice', 'Potatoes',
    'Eggs', 'Lentils', 'Beans', 'Spinach'
];

/* --- DOM Elements --- */
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const randomBtn = document.getElementById('randomBtn');
const mealsGrid = document.getElementById('mealsGrid');
const scrollLoader = document.getElementById('scrollLoader');
const ingredientTagsContainer = document.getElementById('ingredientTags');
const resultHeading = document.getElementById('resultHeading');
const modal = document.getElementById('recipeModal');

/* --- Init --- */
document.addEventListener('DOMContentLoaded', () => {
    generateIngredientTags();
    fetchMeals(`${BASE_URL}/filter.php?c=Chicken`, "Our Favorites: Chicken");
});

/* --- Event Listeners --- */
searchBtn.addEventListener('click', () => {
    const term = searchInput.value;
    if (term) {
        fetchMeals(`${BASE_URL}/search.php?s=${term}`, `Search Results for "${term}"`);
        document.getElementById('recipes').scrollIntoView({ behavior: 'smooth' });
    }
});

randomBtn.addEventListener('click', getRandomMeal);

// Infinite Scroll
window.addEventListener('scroll', () => {
    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 200) {
        loadMoreMeals();
    }
});

// Category Click
document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        const cat = e.target.dataset.cat;
        fetchMeals(`${BASE_URL}/filter.php?c=${cat}`, `Category: ${cat}`);
    });
});

// Grid Click
mealsGrid.addEventListener('click', e => {
    const card = e.target.closest('.meal-card');
    if (card) getMealById(card.dataset.id);
});

/* --- Functions --- */

async function fetchMeals(url, title) {
    mealsGrid.innerHTML = '';
    resultHeading.textContent = title;
    state.allMeals = [];
    state.displayedCount = 0;
    scrollLoader.classList.remove('hidden');

    try {
        const res = await fetch(url);
        const data = await res.json();

        if (data.meals === null) {
            mealsGrid.innerHTML = '<p style="grid-column:1/-1; text-align:center;">No recipes found. Try another keyword.</p>';
            scrollLoader.classList.add('hidden');
            return;
        }

        state.allMeals = data.meals;
        loadMoreMeals();
    } catch (error) {
        console.error(error);
        mealsGrid.innerHTML = '<p style="text-align:center; width:100%;">Connection Error.</p>';
    }
}

function loadMoreMeals() {
    if (state.isLoading || state.displayedCount >= state.allMeals.length) {
        scrollLoader.classList.add('hidden');
        return;
    }

    state.isLoading = true;
    scrollLoader.classList.remove('hidden');

    setTimeout(() => {
        const nextBatch = state.allMeals.slice(state.displayedCount, state.displayedCount + state.batchSize);

        nextBatch.forEach(meal => {
            const card = document.createElement('div');
            card.classList.add('meal-card');
            card.setAttribute('data-id', meal.idMeal);
            card.innerHTML = `
                <img src="${meal.strMealThumb}" alt="${meal.strMeal}" loading="lazy">
                <div class="meal-info">
                    <h3>${meal.strMeal}</h3>
                </div>
            `;
            mealsGrid.appendChild(card);
        });

        state.displayedCount += state.batchSize;
        state.isLoading = false;

        if (state.displayedCount >= state.allMeals.length) {
            scrollLoader.classList.add('hidden');
        }
    }, 400);
}

function generateIngredientTags() {
    ingredientTagsContainer.innerHTML = '';
    MAIN_INGREDIENTS.forEach(ing => {
        const tag = document.createElement('span');
        tag.className = 'ing-tag';
        tag.textContent = ing;
        tag.addEventListener('click', () => {
            document.querySelectorAll('.ing-tag').forEach(t => t.classList.remove('active'));
            tag.classList.add('active');

            // İngilis dilində mətn
            fetchMeals(`${BASE_URL}/filter.php?i=${ing}`, `Recipes featuring: ${ing}`);
            document.getElementById('recipes').scrollIntoView({ behavior: 'smooth' });
        });
        ingredientTagsContainer.appendChild(tag);
    });
}

async function getRandomMeal() {
    try {
        const res = await fetch(`${BASE_URL}/random.php`);
        const data = await res.json();
        addMealToModal(data.meals[0]);
    } catch (e) { console.error(e); }
}

async function getMealById(id) {
    const res = await fetch(`${BASE_URL}/lookup.php?i=${id}`);
    const data = await res.json();
    addMealToModal(data.meals[0]);
}

function addMealToModal(meal) {
    document.getElementById('modalTitle').textContent = meal.strMeal;
    document.getElementById('modalCategory').textContent = meal.strCategory;
    document.getElementById('modalImg').src = meal.strMealThumb;
    document.getElementById('modalInstructions').textContent = meal.strInstructions;
    document.getElementById('modalSource').href = meal.strSource || '#';

    const videoEl = document.getElementById('modalVideo');
    if (meal.strYoutube) {
        const videoId = meal.strYoutube.split('v=')[1];
        videoEl.src = `https://www.youtube.com/embed/${videoId}`;
        videoEl.parentElement.style.display = 'block';
    } else {
        videoEl.parentElement.style.display = 'none';
    }

    const list = document.getElementById('modalIngredients');
    list.innerHTML = '';
    for (let i = 1; i <= 20; i++) {
        if (meal[`strIngredient${i}`]) {
            const li = document.createElement('li');
            li.innerHTML = `${meal[`strIngredient${i}`]} <span>${meal[`strMeasure${i}`]}</span>`;
            list.appendChild(li);
        }
    }

    modal.style.display = 'flex';
}

document.querySelector('.close-btn').onclick = () => {
    modal.style.display = 'none';
    document.getElementById('modalVideo').src = '';
};
window.onclick = (e) => e.target == modal ? modal.style.display = 'none' : null;