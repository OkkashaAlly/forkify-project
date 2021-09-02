import { async } from 'regenerator-runtime';
import { API_URL } from './config';
import { AJAX } from './helper';
import { RES_PER_PAGE, KEY } from './config';

export const state = {
  recipe: {},
  search: {
    query: '',
    page: 1,
    results: [],
    resultsPerPage: RES_PER_PAGE,
  },
  bookmarks: [],
};

function createRecipeObject(data) {
  // store the url data
  const { recipe } = data.data;

  return {
    id: recipe.id,
    title: recipe.title,
    publisher: recipe.publisher,
    sourceUrl: recipe.source_url,
    imageUrl: recipe.image_url,
    servings: recipe.servings,
    cookingTime: recipe.cooking_time,
    ingredients: recipe.ingredients,
    ...(recipe.key && { key: recipe.key }),
  };
}

// ======================
// LOAD RECIPE FUNCTION
// ======================
export async function loadRecipe(id) {
  try {
    // load recipe
    const data = await AJAX(`${API_URL}${id}?key=${KEY}`);

    // store the url data
    const { recipe } = data.data;

    // save it to the state Object
    state.recipe = createRecipeObject(data);

    // adding bookmark state( true/ false )
    if (state.bookmarks.some(bookmark => bookmark.id === id))
      state.recipe.bookmarked = true;
    else state.recipe.bookmarked = false;
  } catch (error) {
    throw error;
  }
}

// ======================
// LOAD SEARCH QUERY
// ======================
export async function loadSearchResults(query) {
  try {
    state.search.query = query;

    const data = await AJAX(`${API_URL}?search=${query}&key=${KEY}`);

    state.search.results = data.data.recipes.map(rec => {
      return {
        id: rec.id,
        title: rec.title,
        publisher: rec.publisher,
        imageUrl: rec.image_url,
      };
    });
    state.search.page = 1;
  } catch (error) {
    throw error;
  }
}

// ======================
// GET RESULTS PAGE
// ======================
export function getSearchResultsPage(page = state.search.page) {
  state.search.page = page;

  const start = (page - 1) * state.search.resultsPerPage;
  const end = page * state.search.resultsPerPage;

  return state.search.results.slice(start, end);
}

// ======================
// UPDATE SERVINGS
// ======================
export function updateServings(newServings) {
  // change recipe quantity
  state.recipe.ingredients.forEach(ing => {
    // newQt = oldQt * newServing / oldServings:: 2*8/4 = 4
    ing.quantity = (ing.quantity * newServings) / state.recipe.servings;
  });

  // update the new servings
  state.recipe.servings = newServings;
}

// ======================
// ADD BOOKMARK
// ======================
export function addBookmark(recipe) {
  // Add bookmark
  state.bookmarks.push(recipe);

  // mark current recipe as bookmarked
  if (recipe.id === state.recipe.id) state.recipe.bookmarked = true;

  persistBookmark();
}

// ======================
// REMOVE BOOKMARK
// ======================
export function removeBookmark(id) {
  // removing bookmarked recipe
  const index = state.bookmarks.findIndex(bookmark => bookmark.id === id);
  state.bookmarks.splice(index, 1);

  // mark current recipe as NOT bookmarked
  if (id === state.recipe.id) state.recipe.bookmarked = false;

  persistBookmark();
}

// =================================
// PERSIST BOOKMARK TO LOCAL STORAGE
// =================================
function persistBookmark() {
  localStorage.setItem('bookmarks', JSON.stringify(state.bookmarks));
}

// =================================
// LOAD BOOKMARK FROM LOCAL STORAGE
// =================================
(function () {
  const storage = localStorage.getItem('bookmarks');
  if (storage) state.bookmarks = JSON.parse(storage);
})();

// ======================
// UPLOAD RECIPE
// ======================

export async function uploadRecipe(newRecipe) {
  const data = Object.entries(newRecipe);
  const ingredients = data
    .filter(entry => entry[0].startsWith('ingredient') && entry[1] !== '')
    .map(ing => {
      const ingArray = ing[1].replaceAll(' ', '').split(',');

      if (ingArray.length !== 3)
        throw new Error(
          'Wrong ingredient formart! Please try with correct format :)'
        );

      const [quantity, unit, description] = ingArray;

      return { quantity: quantity ? +quantity : null, unit, description };
    });

  const recipe = {
    title: newRecipe.title,
    image_url: newRecipe.image,
    source_url: newRecipe.sourceUrl,
    servings: newRecipe.servings,
    publisher: newRecipe.publisher,
    cooking_time: newRecipe.cookingTime,
    ingredients,
  };

  const uploadData = await AJAX(`${API_URL}?key=${KEY}`, recipe);
  state.recipe = createRecipeObject(uploadData);
  addBookmark(state.recipe);
}
