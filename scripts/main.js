// Karanlık tema geçişi ve localStorage yönetimi
function setupThemeToggle() {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  btn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    if (document.body.classList.contains('dark-mode')) {
      localStorage.setItem('theme', 'dark');
      btn.querySelector('.theme-toggle__icon').textContent = '☀️';
    } else {
      localStorage.setItem('theme', 'light');
      btn.querySelector('.theme-toggle__icon').textContent = '🌙';
    }
  });
  if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-mode');
    btn.querySelector('.theme-toggle__icon').textContent = '☀️';
  }
}

// Scroll animasyonları (Intersection Observer)
function setupScrollAnimations() {
  const animatedEls = document.querySelectorAll('.animate');
  const observer = new window.IntersectionObserver((entries, obs) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.classList.add('animate--active');
        }, entry.target.dataset.delay ? Number(entry.target.dataset.delay) : 0);
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  let gridGroups = [
    ...document.querySelectorAll('.partner-list, .values-grid, .about-cards-flex')
  ];
  gridGroups.forEach(group => {
    const children = group.querySelectorAll('.animate');
    children.forEach((el, idx) => {
      el.dataset.delay = idx * 80;
    });
  });

  animatedEls.forEach(el => observer.observe(el));
}

// Ripple (dalga) animasyonu
function setupRippleEffect() {
  // Ripple eklenecek selectorlar
  const selectors = [
    'button', '.btn-primary', '.intro__button', '.contact-card__button', '.theme-toggle',
    '.partner-card', '.partner-card-large', '.about-card', '.value-card'
  ];
  const rippleElements = document.querySelectorAll(selectors.join(','));
  rippleElements.forEach(el => {
    // Çift eklenmeyi önle
    if (el._rippleBound) return;
    el._rippleBound = true;
    el.addEventListener('click', function(e) {
      // Sadece sol tık
      if (e.button !== 0) return;
      const rect = el.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      const size = Math.max(rect.width, rect.height);
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = (e.clientX - rect.left - size/2) + 'px';
      ripple.style.top = (e.clientY - rect.top - size/2) + 'px';
      el.appendChild(ripple);
      setTimeout(() => {
        ripple.remove();
      }, 600);
    });
  });
}

// SPA geçişlerinde ve ilk yüklemede dinamik scriptleri başlatan ana fonksiyon
const reinitializeDynamicScripts = () => {
  setupThemeToggle();
  setupScrollAnimations();
  setupRippleEffect();
  // ...diğer dinamik scriptler...
};

// SPA geçişleri (fetch + History API)
document.addEventListener('DOMContentLoaded', () => {
  const mainContent = document.getElementById('main-content');
  const mainNav = document.querySelector('.main-nav');

  if (!mainContent || !mainNav) {
    reinitializeDynamicScripts();
    return;
  }

  const switchPage = async (url) => {
    const currentActive = mainNav.querySelector('.active');
    if (currentActive) {
      currentActive.classList.remove('active');
    }
    const newActiveLink = mainNav.querySelector(`a[href="${url}"]`);
    if (newActiveLink) {
      newActiveLink.classList.add('active');
    }
    mainContent.style.opacity = 0;
    try {
      const response = await fetch(url);
      const newPageHtml = await response.text();
      const parser = new DOMParser();
      const newDoc = parser.parseFromString(newPageHtml, 'text/html');
      const newContent = newDoc.getElementById('main-content').innerHTML;
      const newTitle = newDoc.querySelector('title').innerText;
      setTimeout(() => {
        mainContent.innerHTML = newContent;
        document.title = newTitle;
        mainContent.style.opacity = 1;
        window.scrollTo(0, 0);
        reinitializeDynamicScripts();
      }, 300);
      window.history.pushState({ path: url }, newTitle, url);
    } catch (error) {
      console.error('Sayfa yüklenemedi:', error);
      mainContent.style.opacity = 1;
    }
  };

  mainNav.addEventListener('click', (event) => {
    if (event.target.tagName === 'A') {
      event.preventDefault();
      const url = event.target.getAttribute('href');
      if (url === window.location.pathname) {
        return;
      }
      switchPage(url);
    }
  });

  window.addEventListener('popstate', (event) => {
    if (event.state && event.state.path) {
      switchPage(event.state.path);
    } else {
      switchPage(window.location.pathname);
    }
  });

  const initialActiveLink = mainNav.querySelector(`a[href="${window.location.pathname}"]`);
  if (initialActiveLink) {
    initialActiveLink.classList.add('active');
  }

  // İlk yüklemede de dinamik scriptleri başlat
  reinitializeDynamicScripts();
});
