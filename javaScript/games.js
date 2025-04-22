

//header shit
let lastScrollTop = 0;
const header = document.getElementById("main-header");

window.addEventListener("scroll", () => {
  let scrollTop = window.scrollY || document.documentElement.scrollTop;

  if (scrollTop > lastScrollTop && scrollTop > 80) {
    // Scrolling down
    header.classList.add("hidden");
  } else {
    // Scrolling up
    header.classList.remove("hidden");
  }

  lastScrollTop = scrollTop <= 0 ? 0 : scrollTop; // For mobile scroll bounce
});

document.getElementById('hover-zone').addEventListener('mouseenter', () => {
  header.classList.remove('hidden');
});