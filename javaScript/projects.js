//fade in on scroll
const faders = document.querySelectorAll('.fade-in-left, .fade-in-right');

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.1 });

faders.forEach(el => observer.observe(el));

