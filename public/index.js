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
// Define the function that performs the search
function performSearch() {
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
        let tags = tile.getAttribute("data-tags").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

    // Check if the tile contains all search keywords
    const tileMatchesAllKeywords = searchValues.every(searchValue => 
      title.includes(searchValue) ||
      file.includes(searchValue) ||
      tags.includes(searchValue) ||
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
    localStorage.setItem('searchValue', document.getElementById('search').value);
}

// Add the event listener for #search
document.querySelector("#search").addEventListener("input", performSearch);

window.onload = function() {
  fetch('/getLanguage', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  .then(response => response.json())
  .then(data => {
    const currentLang = data.language || localStorage.getItem("language") || "en-ca";
    localStorage.setItem("language", currentLang);  // Update localStorage with the server session language
    document.documentElement.lang = currentLang;  // Update the document language

    // Language-dependent operations go here
    if (localStorage.getItem('searchValue')) {
      document.getElementById('search').value = localStorage.getItem('searchValue');
      
      // If searchValue is not empty, trigger the performSearch function
      if(document.getElementById('search').value.trim() !== "") {
        performSearch.call(document.getElementById('search'));
      }
    }
  })
  .catch((error) => {
    console.error('Failed to fetch language from server:', error);
  });
};


document.querySelector("#search").addEventListener("keydown", function(event) {
  if (event.key === 'Enter') {
    event.preventDefault(); // prevent form submission
    document.querySelector("#srUpdate").focus();
  }
});

// Fetch current language from the server on page load
fetch('/getLanguage')
  .then(response => response.json())
  .then(data => {
    if (data.language) {
      // Set local storage language based on the server session
      localStorage.setItem("language", data.language);
    } else {
      // If no language is set in the server session, set default language
      localStorage.setItem("language", "en-ca");
    }
  })
  .catch(error => console.error('Failed to fetch language from the server:', error));

// Language switcher function
window.switchLanguage = function() {
  const currentLang = localStorage.getItem("language");
  const newLang = currentLang.startsWith("en") ? "fr-ca" : "en-ca";

  fetch('/setLanguage', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ language: newLang })
  })
  .then((response) => {
    if (response.ok) {
      localStorage.setItem("language", newLang);
      window.location.reload(true);
    } else {
      console.error('Failed to update language on the server');
    }
  })
  .catch((error) => {
    console.error('Failed to send language update request to server:', error);
  });
};

document.addEventListener('DOMContentLoaded', function() {
  var detailToggles = document.querySelectorAll('.details-toggle');

  detailToggles.forEach(function(toggle) {
    // Set up the function that will be called when the detail toggle is clicked or pressed
    var toggleDetails = function() {
      var detailContent = document.getElementById(this.getAttribute('aria-controls'));

      var isExpanded = this.getAttribute('aria-expanded') === 'true';

      // Update the "aria-expanded" attribute
      this.setAttribute('aria-expanded', !isExpanded);

      // Update the "aria-hidden" attribute
      detailContent.setAttribute('aria-hidden', isExpanded);

      // Toggle the "opened" class on the parent div
      this.parentElement.classList.toggle('opened');

      if (detailContent.style.maxHeight) {
        detailContent.style.maxHeight = null;
      } else {
        var detailText = detailContent.querySelector('.detail-text');
        detailContent.style.maxHeight = detailText.scrollHeight + "px";
      }
    };

    // Add the event listener for the "click" event
    toggle.addEventListener('click', toggleDetails);

    // Add the event listener for the "keydown" event
    toggle.addEventListener('keydown', function(event) {
      // Check if the key pressed was Enter or Space (key codes 13 and 32 respectively)
      if (event.keyCode === 13 || event.keyCode === 32) {
        event.preventDefault();  // Prevent the default action for these keys
        toggleDetails.call(this);  // Call the toggleDetails function
      }
    });
  });
});

