// Hope for All Shelter - lightweight client-side JS
// Features:
// 1) Enquiry form validation + success message
// 2) Prevent reload and (optional) open mail client via mailto
// 3) Mobile navbar toggle
// 4) Simple homepage carousel/slider

(function () {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function ensureStyles() {
    // Minimal inline styles only if elements are missing.
    // Avoids touching existing CSS files.
    if (document.getElementById('bbai-js-styles')) return;
    const style = document.createElement('style');
    style.id = 'bbai-js-styles';
    style.textContent = `
      .bbai-hidden{display:none !important;}
      .bbai-carousel{position:relative;overflow:hidden}
      .bbai-carousel-track{display:flex;transition:transform 400ms ease}
      .bbai-carousel-slide{min-width:100%;box-sizing:border-box}
      .bbai-carousel-controls{display:flex;justify-content:space-between;gap:10px;margin-top:10px}
      .bbai-pill{font-size:12px;opacity:.85}
      .bbai-error{color:#b00020;font-size:12px;margin-top:6px}
      .bbai-success{color:#0a7a0a;font-size:14px;margin-top:10px}
      .bbai-toast{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);background:#111;color:#fff;padding:10px 14px;border-radius:10px;z-index:9999;max-width:92vw}
      .bbai-toast .bbai-pill{color:#fff;opacity:.9}
    `;
    document.head.appendChild(style);
  }

  function showToast(message, sub) {
    const toast = document.createElement('div');
    toast.className = 'bbai-toast';
    toast.innerHTML = `<div>${escapeHtml(message)}</div>${sub ? `<div class="bbai-pill">${escapeHtml(sub)}</div>` : ''}`;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 250ms ease';
      setTimeout(() => toast.remove(), 260);
    }, 3200);
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '<')
      .replaceAll('>', '>')
      .replaceAll('"', '"')
      .replaceAll("'", '&#039;');
  }

  // -------------------------
  // 1) Navbar toggle (generic)
  // -------------------------
  function initNavbarToggle() {
    // Detect common elements in your HTML structure.
    // Your index.html uses: nav.navbar > .links > ul.nav-links
    const nav = document.querySelector('nav.navbar') || document.querySelector('nav');
    if (!nav) return;

    // If already toggled, skip.
    const existingBtn = document.getElementById('bbai-nav-toggle');
    if (existingBtn) return;

    // Only create a toggle when there is a UL links container.
    const ul = nav.querySelector('ul');
    if (!ul) return;

    // Create button
    const btn = document.createElement('button');
    btn.id = 'bbai-nav-toggle';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Toggle navigation');
    btn.setAttribute('aria-expanded', 'false');
    btn.textContent = 'Menu';
    btn.style.margin = '10px';
    btn.style.padding = '10px 14px';
    btn.style.border = '1px solid rgba(0,0,0,.2)';
    btn.style.borderRadius = '10px';
    btn.style.background = '#fff';

    // Place button at top of nav
    nav.insertBefore(btn, nav.firstChild);

    // Responsive behavior: collapse by default on small screens.
    const applyResponsive = () => {
      const isSmall = window.matchMedia('(max-width: 768px)').matches;
      if (isSmall) {
        // collapsed by default
        if (!nav.dataset.babaiCollapsedInit) {
          ul.style.display = 'none';
          btn.setAttribute('aria-expanded', 'false');
          nav.dataset.babaiCollapsedInit = 'true';
        }
      } else {
        // show always on desktop
        ul.style.display = '';
        btn.setAttribute('aria-expanded', 'true');
      }
    };

    applyResponsive();
    window.addEventListener('resize', applyResponsive);

    btn.addEventListener('click', () => {
      const isHidden = getComputedStyle(ul).display === 'none';
      ul.style.display = isHidden ? 'block' : 'none';
      btn.setAttribute('aria-expanded', String(isHidden));
    });
  }

  // -------------------------
  // 2) Enquiry form validation + mailto
  // -------------------------
  function initEnquiryForm() {
    const form = document.querySelector('form');
    if (!form) return;

    // Your enquiry.html contains labels/inputs with ids: name, email, message
    const nameEl = $('#name', form);
    const emailEl = $('#email', form);
    const messageEl = $('#message', form);
    if (!nameEl || !emailEl || !messageEl) return;

    let errorBox = form.querySelector('.bbai-error');
    if (!errorBox) {
      errorBox = document.createElement('div');
      errorBox.className = 'bbai-error';
      form.appendChild(errorBox);
    }

    let successBox = form.querySelector('.bbai-success');
    if (!successBox) {
      successBox = document.createElement('div');
      successBox.className = 'bbai-success';
      form.appendChild(successBox);
    }

    function setError(msg) {
      errorBox.textContent = msg || '';
      successBox.textContent = '';
    }

    function setSuccess(msg) {
      errorBox.textContent = '';
      successBox.textContent = msg || '';
    }

    // If action is '#', we need prevent reload.
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = nameEl.value.trim();
      const email = emailEl.value.trim();
      const message = messageEl.value.trim();

      if (!name) return setError('Please enter your name.');
      if (!email) return setError('Please enter your email.');
      // basic email check
      if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Please enter a valid email address.');
      if (!message) return setError('Please enter your message.');
      if (message.length < 10) return setError('Message should be at least 10 characters.');

      const orgEmail = 'hopeforall@gmail.com';
      const subject = `Enquiry from ${name}`;
      const body = `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`;

      setSuccess('Enquiry received! Opening your email client…');
      showToast('Enquiry submitted', 'Opening mail client');

      const mailto = `mailto:${encodeURIComponent(orgEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

      // Open mail client
      window.location.href = mailto;
    });

    // Live validation on input
    const onInput = () => {
      if (!errorBox || !successBox) return;
      if (!nameEl.value.trim() && !emailEl.value.trim() && !messageEl.value.trim()) {
        setError('');
        setSuccess('');
      }
    };
    [nameEl, emailEl, messageEl].forEach((el) => el.addEventListener('input', onInput));
  }

  // -------------------------
  // 3) Homepage simple carousel/slider
  // -------------------------
  function initCarousel() {
    const homepage = document.getElementById('homepage');
    if (!homepage) return;

    // If author already placed carousel markup, do not override.
    if (homepage.querySelector('.bbai-carousel')) return;

    // Try to find candidate images inside homepage.
    const imgs = $$('#people at shelter img', homepage);
    if (!imgs.length) return;

    // Your index.html currently only has one image; add optional behavior:
    // If there are multiple images under homepage, carousel them; otherwise, nothing.
    const allImages = $$('img', homepage).filter((img) => img.getAttribute('src'));
    if (allImages.length < 2) return;

    // Build carousel container around images.
    const wrapper = document.createElement('div');
    wrapper.className = 'bbai-carousel';

    const track = document.createElement('div');
    track.className = 'bbai-carousel-track';

    const slides = allImages.map((img) => {
      const slide = document.createElement('div');
      slide.className = 'bbai-carousel-slide';

      // Move the image into slide
      img.parentElement && img.parentElement.removeChild(img);
      img.style.width = '100%';
      img.style.height = 'auto';
      img.style.display = 'block';
      slide.appendChild(img);
      return slide;
    });

    slides.forEach((s) => track.appendChild(s));
    wrapper.appendChild(track);

    // Controls
    const controls = document.createElement('div');
    controls.className = 'bbai-carousel-controls';
    const prevBtn = document.createElement('button');
    const nextBtn = document.createElement('button');
    prevBtn.type = 'button';
    nextBtn.type = 'button';
    prevBtn.textContent = 'Prev';
    nextBtn.textContent = 'Next';
    prevBtn.style.padding = nextBtn.style.padding = '10px 14px';
    prevBtn.style.border = nextBtn.style.border = '1px solid rgba(0,0,0,.2)';
    prevBtn.style.borderRadius = nextBtn.style.borderRadius = '10px';
    prevBtn.style.background = nextBtn.style.background = '#fff';

    controls.appendChild(prevBtn);
    controls.appendChild(nextBtn);

    // Replace images area with carousel
    // Put wrapper right after the heading in homepage
    const heading = homepage.querySelector('h2') || homepage.firstChild;
    homepage.insertBefore(wrapper, heading.nextSibling);
    homepage.appendChild(controls);

    let index = 0;
    const update = () => {
      track.style.transform = `translateX(-${index * 100}%)`;
    };

    prevBtn.addEventListener('click', () => {
      index = (index - 1 + slides.length) % slides.length;
      update();
    });
    nextBtn.addEventListener('click', () => {
      index = (index + 1) % slides.length;
      update();
    });

    // Auto-advance
    let timer = setInterval(() => {
      index = (index + 1) % slides.length;
      update();
    }, 3500);

    wrapper.addEventListener('mouseenter', () => clearInterval(timer));
    wrapper.addEventListener('mouseleave', () => {
      timer = setInterval(() => {
        index = (index + 1) % slides.length;
        update();
      }, 3500);
    });
  }

  // -------------------------
  // Boot
  // -------------------------
  function boot() {
    ensureStyles();
    initNavbarToggle();
    initEnquiryForm();
    initCarousel();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();

let acc = document.querySelectorAll(".accordion");

acc.forEach(item => {
    item.addEventListener("click", function () {
        let panel = this.nextElementSibling;

        if(panel.style.display === "block"){
            panel.style.display = "none";
        } else {
            panel.style.display = "block";
        }
    });
});
function calculateDonation(){

    let food = document.getElementById("food").value * 50;
    let blankets = document.getElementById("blankets").value * 100;
    let kits = document.getElementById("kits").value * 150;
    let other = document.getElementById("other"). value *200;

    let total = food + blankets + kits;

    document.getElementById("total").innerHTML =
    "Total Donation Value: R" + total;
}
document.getElementById("searchInput")
.addEventListener("keyup", function() {

    let filter = this.value.toLowerCase();
    let services = document.querySelectorAll("#serviceList li");

    services.forEach(service => {

        let text = service.textContent.toLowerCase();

        if(text.includes(filter)){
            service.style.display = "";
        } else {
            service.style.display = "none";
        }

    });

});
const events = [
{
title: "Winter Blanket Drive",
date: "15 June 2026"
},
{
title: "Community Food Campaign",
date: "20 July 2026"
},
{
title: "Volunteer Training Day",
date: "10 August 2026"
}
];

const eventContainer =
document.getElementById("events");

events.forEach(event => {

eventContainer.innerHTML += `
<div class="event-card">
<h3>${event.title}</h3>
<p>${event.date}</p>
</div>
`;

});
document.getElementById("enquiryForm")
.addEventListener("submit", function(e){

e.preventDefault();

let enquiry =
document.getElementById("enquiryType").value;

let message = "";

switch(enquiry){

case "Volunteer":
message =
"Volunteer positions are available every weekend.";
break;

case "Sponsorship":
message =
"Sponsorship packages start from R500 per month.";
break;

case "Donation":
message =
"Donations can be made online or at our shelter.";
break;

case "Shelter Services":
message =
"Shelter services are available subject to space.";
break;
}

document.getElementById("response")
.innerHTML = message;

});
document.getElementById("contactForm")
.addEventListener("submit", function(e){

let email =
document.getElementById("contactEmail").value;

let emailPattern =
/^[^\s@]+@[^\s@]+\.[^\s@]+$/;

if(!emailPattern.test(email)){

e.preventDefault();

alert("Please enter a valid email.");

}

});
document.getElementById("contactForm")
.addEventListener("submit", function(e){

e.preventDefault();

fetch("https://jsonplaceholder.typicode.com/posts",{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({

name:"Test User",

message:"Hello"

})

})
.then(response => response.json())
.then(data => {

alert("Form submitted successfully!");

});
