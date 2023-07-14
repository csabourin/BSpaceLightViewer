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
const sessionEnd=document.querySelector('#sessionEnd');

if (lang === "fr") {
  // French
  langSwitchButton.textContent = "EN";
  langSwitchButton.title = "English"; 
   langSwitchButton.setAttribute("aria-label", "Change language to English");
  document.querySelector("#searchlabel").textContent =
    "Rechercher par titre, mot-clé ou langue...";
  document.querySelector("#search").placeholder =
    "Rechercher par titre, mot-clé ou langue...";
  document.querySelector('#appTitle').textContent="Apprentissage ouvert de l'ÉFPC";
  
  if(sessionEnd){sessionEnd.textContent="Votre session s'est terminée. Vous avez été redirigé à la page d'accueil.";}  
   // Change the src and alt of the image for French
  let imgElement = document.querySelector(".fip img");
  imgElement.src = "/public/CSPS_FIP_BlackRed_F.svg";
  imgElement.alt = "École de la fonction publique du Canada";

} else {
  // English
  langSwitchButton.textContent = "FR";
  langSwitchButton.title = "Français";
   langSwitchButton.setAttribute("aria-label", "Changer la langue en français");
  document.querySelector("#searchlabel").textContent = "Search by title, tag or language..."
  document.querySelector("#search").placeholder =
    "Search by title, tag or language...";
  document.querySelector('#appTitle').textContent="CSPS Open Learning";
   if(sessionEnd){sessionEnd.textContent="Your session has ended. You have been redirected to the homepage.";}
    // Change the src and alt of the image for English
  let imgElement = document.querySelector(".fip img");
  imgElement.src = "/public/CSPS_FipEng_Black-Red-Final.svg";
  imgElement.alt = "Canada School of Public Service";
}
