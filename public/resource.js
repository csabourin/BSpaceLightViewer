var sidebar = document.querySelector(".sidebar");
var main = document.querySelector("#main");
function openNav() {
  sidebar.classList.toggle("open");
  main.classList.toggle("open");
  var focusableEls = document.querySelectorAll('#mySidebar a, #mySidebar button');
  focusableEls.forEach(function(el) {
    el.removeAttribute('tabindex');
  });
  localStorage.setItem('sidebarStatus', 'open'); // save the sidebar status
}

function closeNav() {
  sidebar.classList.toggle("open");
  main.classList.toggle("open");
  var focusableEls = document.querySelectorAll('#mySidebar a, #mySidebar button');
  focusableEls.forEach(function(el) {
    el.setAttribute('tabindex', '-1');
  });
  localStorage.setItem('sidebarStatus', 'closed'); // save the sidebar status
}

document.addEventListener('DOMContentLoaded', (event) => {
  var focusableEls = document.querySelectorAll('#mySidebar a, #mySidebar button');
  focusableEls.forEach(function(el) {
    el.setAttribute('tabindex', '-1');
  });
});

window.onload = function() {
  var currentPageTitle = '<%= currentPage %>'; // get the current page resource from the server-side data
  localStorage.setItem(currentPageTitle, 'visited'); // mark the current page as visited

  // Get all links in the sidebar
  var links = document.getElementById('mySidebar').getElementsByTagName('a');

  for (var i = 0; i < links.length; i++) {
    var url = new URL(links[i].href); // Create URL object from href
    var pathParts = url.pathname.split('/'); // Split the path into parts
    var resourceId = pathParts[pathParts.length - 1]; // The resource ID is the last part of the path

    if (localStorage.getItem(resourceId) === 'visited') {
      // Add a checkmark after the link
      links[i].innerHTML += ' ✓';
    }
  }
}
                  // Check the saved sidebar status and open the sidebar if it was previously open
        // var sidebarStatus = localStorage.getItem('sidebarStatus');
        // if (sidebarStatus === 'open') {
        //     openNav();
        // }

