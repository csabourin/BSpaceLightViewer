var sidebar = document.querySelector(".sidebar");
var main = document.querySelector("#main");
function openNav() {
  sidebar.classList.toggle("open");
  main.classList.toggle("open");
  sidebar.setAttribute('aria-hidden', 'false');
  var focusableEls = document.querySelectorAll('#mySidebar a, #mySidebar button');
  focusableEls.forEach(function(el) {
    el.removeAttribute('tabindex');
  });
  localStorage.setItem('sidebarStatus', 'open'); // save the sidebar status
}

function closeNav() {
  sidebar.classList.toggle("open");
  main.classList.toggle("open");
  sidebar.setAttribute('aria-hidden', 'true');
  var focusableEls = document.querySelectorAll('#mySidebar a, #mySidebar button');
  focusableEls.forEach(function(el) {
    el.setAttribute('tabindex', '-1');
  });
  localStorage.setItem('sidebarStatus', 'closed'); // save the sidebar status
}

document.addEventListener('DOMContentLoaded', (event) => {
  sidebar.setAttribute('aria-hidden', 'true');
  var focusableEls = document.querySelectorAll('#mySidebar a, #mySidebar button');
  focusableEls.forEach(function(el) {
    el.setAttribute('tabindex', '-1');
  });
});

window.addEventListener('message', function(event) {

  // Verify the structure of the event data
  if (typeof event.data === 'object' && event.data.type === 'changeUrl' && typeof event.data.url === 'string') {
    // If the message is what you expect, change the URL
    window.location.href = event.data.url;
  }
});



                  // Check the saved sidebar status and open the sidebar if it was previously open
        // var sidebarStatus = localStorage.getItem('sidebarStatus');
        // if (sidebarStatus === 'open') {
        //     openNav();
        // }

