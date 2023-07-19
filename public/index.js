const docLang = document.documentElement.lang;
const links = document.querySelectorAll(".tile a");
links.forEach((link) => {
  link.addEventListener("click", (event) => {
    const lang = new URL(link.href).searchParams.get("lang");
    const loadingText = document.getElementById("loadingText");
    if (lang === "fr-ca") {
      loadingText.textContent = "Chargement...";
    } else {
      loadingText.textContent = "Loading...";
    }
    document.getElementById("overlay").style.display = "block";
  });
});
window.addEventListener('popstate', function(event) {
  // Hide the overlay when user navigates back
  document.getElementById("overlay").style.display = "none";
});
window.addEventListener('pageshow', function(event) {
  // If the page was loaded from the bfcache, hide the overlay
  if (event.persisted) {
    document.getElementById("overlay").style.display = "none";
  }
});
// When the user types in the search field
document.querySelector("#search").addEventListener("input", function() {
  // Get the current search value (lowercase for case-insensitive search)
  let searchValues = this.value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().split(' ');

  // Get all tiles
  let tiles = document.querySelectorAll(".tile");

  // Initialize the visibleTiles variable
  let visibleTiles = 0;

  // Loop over each tile
  tiles.forEach(function(tile) {
    // Get the tile's title, file and lang data attributes
    let title = tile.getAttribute("data-title").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    let file = tile.getAttribute("data-file").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    let lang = tile.getAttribute("data-lang").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

    // Check if the tile contains all search keywords
    const tileMatchesAllKeywords = searchValues.every(searchValue => 
      title.includes(searchValue) ||
      file.includes(searchValue) ||
      lang.includes(searchValue)
    );

    // If the tile contains all search keywords, show it; otherwise, hide it
    if (tileMatchesAllKeywords) {
      tile.style.display = "flex";
      visibleTiles++;
    } else {
      tile.style.display = "none";
    }
  });

  // Update the screen-reader-only text with the number of visible tiles
  document.querySelector("#srUpdate").textContent =
    visibleTiles + (docLang.startsWith("fr") ? " résultats trouvés." : " results found.");
});


document.querySelector("#search").addEventListener("keydown", function(event) {
  if (event.key === 'Enter') {
    event.preventDefault(); // prevent form submission
    document.querySelector("#srUpdate").focus();
  }
});


// Language switcher function
window.switchLanguage = function() {
  const currentLang = localStorage.getItem("language") || "en-ca";
  const newLang = currentLang.startsWith("en") ? "fr-ca" : "en-ca";

  // Send a request to the server to update the language in the session
  fetch('/setLanguage', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ language: newLang })  // Pass the new language as data
  }).then((response) => {
    if (response.ok) {
      // If the server successfully updated the session language,
      // update the language in local storage and reload the page
      localStorage.setItem("language", newLang);
      location.href = updateQueryStringParameter(location.href, 'lang', newLang);
    } else {
      console.error('Failed to update language on the server');
    }
  }).catch((error) => {
    console.error('Failed to send language update request to server:', error);
  });
};

// Helper function to update or add a query parameter
function updateQueryStringParameter(uri, key, value) {
  var re = new RegExp("([?&])" + key + "=.*?(&|$)", "i");
  var separator = uri.indexOf('?') !== -1 ? "&" : "?";
  if (uri.match(re)) {
    return uri.replace(re, '$1' + key + "=" + value + '$2');
  } else {
    return uri + separator + key + "=" + value;
  }
}

