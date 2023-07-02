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
// When the user types in the search field
document.querySelector("#search").addEventListener("input", function () {
  // Get the current search value (lowercase for case-insensitive search)
  let searchValue = this.value.toLowerCase();

  // Get all tiles
  let tiles = document.querySelectorAll(".tile");

  // Initialize the visibleTiles variable
  let visibleTiles = 0;

  // Loop over each tile
  tiles.forEach(function (tile) {
    // Get the tile's title, file and lang data attributes
    let title = tile.getAttribute("data-title").toLowerCase();
    let file = tile.getAttribute("data-file").toLowerCase();
    let lang = tile.getAttribute("data-lang").toLowerCase();

    // If the search value is found in the title, file, or lang, show the tile; otherwise, hide it
    if (
      title.includes(searchValue) ||
      file.includes(searchValue) ||
      lang.includes(searchValue)
    ) {
      tile.style.display = "flex";
      visibleTiles++;
    } else {
      tile.style.display = "none";
    }
  });
  // Update the screen-reader-only text with the number of visible tiles
  document.querySelector("#srUpdate").textContent =
    visibleTiles + " results found.";
});

// Language switcher function
window.switchLanguage = function () {
  const currentLang = localStorage.getItem("language") || "en";
  const newLang = currentLang === "en" ? "fr" : "en";
  localStorage.setItem("language", newLang);
  location.reload();
};

// Language specific script
const lang = document.documentElement.lang;
const langSwitchButton = document.getElementById("langSwitch");

if (lang === "fr") {
  // French
  langSwitchButton.textContent = "EN";
  document.querySelector("#search").placeholder =
    "Rechercher par titre, nom de fichier ou langue...";
  document.querySelector('#appTitle').textContent="Lecteur de contenu ouvert"
} else {
  // English
  langSwitchButton.textContent = "FR";
  document.querySelector("#search").placeholder =
    "Search by title, filename or language...";
  document.querySelector('#appTitle').textContent="Open Content Viewer"
}
