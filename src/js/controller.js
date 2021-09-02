import * as model from './model';
import { MODAL_CLOSE_SEC } from './config';
import recipeView from './views/recipeView';
import searchView from './views/searchView';
import resultsView from './views/resultsView';
import paginationView from './views/paginationView';
import bookmarksView from './views/bookmarksView';
import addRecipeView from './views/addRecipeView';

import 'core-js/stable';
import 'regenerator-runtime/runtime';
import { async } from 'regenerator-runtime/runtime';

// if (module.hot) module.hot.accept();

// https://forkify-api.herokuapp.com/v2

///////////////////////////////////////

// ======================
// SHOW RECIPE
// ======================
async function controlRecipe() {
  try {
    // get id
    const id = window.location.hash.slice(1);
    if (!id) return;

    // spinner
    recipeView.renderSpinner();

    // show selected result
    // const results = model.state.search.results;
    const results = model.getSearchResultsPage();
    resultsView.update(results);

    // 1) Load recipe
    await model.loadRecipe(id);
    const { recipe } = model.state;

    // update bookmarks
    const bookmarks = model.state.bookmarks;
    bookmarksView.update(bookmarks);

    // 2) Rendering recipe
    recipeView.render(recipe);
  } catch (error) {
    recipeView.renderError();
    console.log(error);
  }
}

// ======================
// SEARCH RESULTS
// ======================
async function controlSearchResults() {
  try {
    resultsView.renderSpinner();

    // 1) get query
    const query = searchView.getQuery();
    if (!query || query === '') return;

    // 2) load query results
    await model.loadSearchResults(query);

    // 3) render query results
    // const results = model.state.search.results;
    const results = model.getSearchResultsPage();
    resultsView.render(results);

    // 4) render initial pagination btns
    paginationView.render(model.state.search);
  } catch (error) {
    resultsView.renderError();
    console.log(error);
  }
}

// ======================
// PAGINATION
// ======================
function controlPagination(goToPage) {
  // 1) render NEW results
  // const results = model.state.search.results;
  const results = model.getSearchResultsPage(goToPage);
  resultsView.render(results);

  // 2) render NEW pagination btns
  paginationView.render(model.state.search);
}

// ======================
// UPDATE SERVINGS
// ======================
function controlServings(newServing) {
  // update recipe servings (in state)
  model.updateServings(newServing);

  // update the recipe view
  recipeView.update(model.state.recipe);
}

// ======================
// BOOKMARK
// ======================
function controlBookmark() {
  const recipe = model.state.recipe;

  // add / remove bookmark
  if (!recipe.bookmarked) model.addBookmark(recipe);
  else model.removeBookmark(recipe.id);

  // update recipe view
  recipeView.update(recipe);

  // render bookmarks
  const bookmarks = model.state.bookmarks;
  bookmarksView.render(bookmarks);
}

// ======================
// LOCAL STORAGE
// ======================
function controlLocalStorage() {
  const bookmarks = model.state.bookmarks;
  bookmarksView.render(bookmarks);
}

// ======================
// UPLOAD RECIPE
// ======================
async function controlUploadRecipe(newRecipe) {
  try {
    const uploadedRecipe = model.state.recipe;
    // REnder spinner
    addRecipeView.renderSpinner();

    // Upload recipe to the state
    await model.uploadRecipe(newRecipe);

    // Render the recipe
    recipeView.render(model.state.recipe);

    // Display Success message
    addRecipeView.renderMessage();

    // Render bookmarks
    bookmarksView.render(model.state.bookmarks);

    // Change ID in the URL
    window.history.pushState(null, '', `#${model.state.recipe.id}`);

    // Close the modal
    setTimeout(() => {
      addRecipeView.toggleWindow();
      // reload the page
      window.location.reload();
    }, MODAL_CLOSE_SEC * 1000);
  } catch (error) {
    console.error(error.message);
    addRecipeView.renderError(error.message);
  }
}

(function () {
  console.log('Welcome to the Application :) || By Okkasha Ally');
  bookmarksView.addHandlerRender(controlLocalStorage);
  recipeView.renderInitMessage();
  recipeView.addHandlerRender(controlRecipe);
  recipeView.addHandlerUpdateServings(controlServings);
  recipeView.addHandlerBookmark(controlBookmark);
  searchView.addHandlerSearch(controlSearchResults);
  paginationView.addHandlerClick(controlPagination);
  addRecipeView.addHandlerUpload(controlUploadRecipe);
})();
