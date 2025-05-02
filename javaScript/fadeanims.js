const faders = document.querySelectorAll('.fade-in-left, .fade-in-right, .fade-in-top');

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.1 });

faders.forEach(el => observer.observe(el));