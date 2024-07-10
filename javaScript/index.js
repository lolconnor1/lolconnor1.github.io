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

// Initial display
showSlide(index);

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