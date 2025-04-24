let index = 0; // Current slide
const slides = document.querySelectorAll(".slide");

function showSlide(n) {
  slides.forEach((slide, i) => {
    slide.style.display = i === n ? "flex" : "none";
  });
}
function showSlide2(n, right) {
  slides.forEach((slide, i) => {
    slide.style.display = i === n ? "flex" : "none";
  });
  if(right){
    animateCSS(slides[n], "slideInLeft")
  }
  else{
    animateCSS(slides[n], "slideInRight")
  }
}

// Next/previous controls
function changeSlides(n) {

  if(n > 0){
    animateCSS(slides[index], "slideOutRight").then((message) => {
      index += n;
      if (index >= slides.length) index = 0;
      if (index < 0) index = slides.length - 1;
      showSlide2(index, true);
  
      })
  }
  else{
    animateCSS(slides[index], "slideOutLeft").then((message) => {
      index += n;
      if (index >= slides.length) index = 0;
      if (index < 0) index = slides.length - 1;
      showSlide2(index, false);

    })
  }
}

const animateCSS = (element, animation, prefix = 'animate__') =>
  // We create a Promise and return it
  new Promise((resolve, reject) => {
    const animationName = `${prefix}${animation}`;
    const node = element

    node.classList.add(`${prefix}animated`, animationName);

    // When the animation ends, we clean the classes and resolve the Promise
    function handleAnimationEnd(event) {
      event.stopPropagation();
      node.classList.remove(`${prefix}animated`, animationName);
      resolve('Animation ended');
    }

    node.addEventListener('animationend', handleAnimationEnd, {once: true});
  });


// Initial display
showSlide(index);


const faders = document.querySelectorAll('.fade-in-left, .fade-in-right');

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.1 });

faders.forEach(el => observer.observe(el));



const slideShow = document.getElementById('project-slider');
let slideInterval = setInterval(() => changeSlides(1), 2500);

// Pause on hover
slideShow.addEventListener('mouseenter', () => {
  clearInterval(slideInterval);
});

// Resume when mouse leaves
slideShow.addEventListener('mouseleave', () => {
  slideInterval = setInterval(() => changeSlides(1), 2500);
});

const modal = document.getElementById("imageModal");
const modalImg = document.getElementById("modalImg");
const modalCaption = document.getElementById("modalCaption");
const closeBtn = document.querySelector(".close");

document.querySelectorAll(".carousel-item img").forEach(img => {
  img.addEventListener("click", () => {
    modal.style.display = "flex";
    modalImg.src = img.src;
    modalCaption.textContent = img.alt;
  });
});

closeBtn.addEventListener("click", () => {
  modal.style.display = "none";
});

window.addEventListener("click", (e) => {
  if (e.target === modal) modal.style.display = "none";
});
