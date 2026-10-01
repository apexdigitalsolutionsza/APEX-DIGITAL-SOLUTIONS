/* ==========================================================================
   Apex Digital Solutions — site scripts
   --------------------------------------------------------------------------
   EDIT YOUR DETAILS HERE  ▼  (these power the forms + WhatsApp links in JS)
   ========================================================================== */
window.APEX = {
  // WhatsApp number in international format, digits only (27 = South Africa).
  whatsapp: '27660351707',
  email: 'apexdigitalsolutionsza@gmail.com',
  // Optional: paste a Formspree / Getform / Netlify endpoint to receive form
  // submissions by email. Leave '' and the form falls back to opening the
  // visitor's mail app with everything pre-filled.
  formEndpoint: ''
};

(function () {
  'use strict';

  var doc = document;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Mobile navigation ---------- */
  var toggle = doc.querySelector('.nav-toggle');
  var drawer = doc.getElementById('nav-drawer');

  if (toggle && drawer) {
    var setNav = function (open) {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      drawer.classList.toggle('is-open', open);
      doc.body.classList.toggle('nav-open', open);
    };
    toggle.addEventListener('click', function () {
      setNav(toggle.getAttribute('aria-expanded') !== 'true');
    });
    drawer.addEventListener('click', function (e) {
      if (e.target.closest('a')) setNav(false);
    });
    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setNav(false);
        toggle.focus();
      }
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 1000) setNav(false);
    });
  }

  /* ---------- Sticky header state ---------- */
  var header = doc.querySelector('.site-header');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('is-stuck', window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- Reveal on scroll ---------- */
  var revealables = doc.querySelectorAll('[data-reveal]');
  if (revealables.length) {
    if (reduceMotion || !('IntersectionObserver' in window)) {
      revealables.forEach(function (el) { el.classList.add('is-visible'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

      revealables.forEach(function (el) { io.observe(el); });
    }
  }

  /* ---------- Current year ---------- */
  doc.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  /* ---------- Quote / contact form ---------- */
  var form = doc.getElementById('quote-form');
  if (!form) return;

  var card = form.closest('.form-card');

  var showError = function (field, message) {
    var wrap = field.closest('.field');
    if (!wrap) return;
    wrap.classList.add('has-error');
    var slot = wrap.querySelector('.error');
    if (slot) slot.textContent = message;
    field.setAttribute('aria-invalid', 'true');
  };

  var clearError = function (field) {
    var wrap = field.closest('.field');
    if (!wrap) return;
    wrap.classList.remove('has-error');
    var slot = wrap.querySelector('.error');
    if (slot) slot.textContent = '';
    field.removeAttribute('aria-invalid');
  };

  form.querySelectorAll('input, select, textarea').forEach(function (f) {
    f.addEventListener('input', function () { clearError(f); });
    f.addEventListener('change', function () { clearError(f); });
  });

  var validate = function () {
    var ok = true;
    var firstBad = null;

    var required = form.querySelectorAll('[required]');
    required.forEach(function (f) {
      clearError(f);
      var val = (f.value || '').trim();
      if (!val) {
        showError(f, 'This field is required.');
        ok = false;
        firstBad = firstBad || f;
        return;
      }
      if (f.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val)) {
        showError(f, 'Please enter a valid email address.');
        ok = false;
        firstBad = firstBad || f;
      }
      if (f.type === 'tel' && val.replace(/\D/g, '').length < 9) {
        showError(f, 'Please enter a valid contact number.');
        ok = false;
        firstBad = firstBad || f;
      }
    });

    if (firstBad) firstBad.focus();
    return ok;
  };

  var collect = function () {
    var data = {};
    new FormData(form).forEach(function (v, k) { data[k] = v; });
    return data;
  };

  var asText = function (d) {
    return [
      'New website enquiry — Apex Digital Solutions',
      '',
      'Name: ' + (d.name || '-'),
      'Business: ' + (d.business || '-'),
      'Email: ' + (d.email || '-'),
      'Phone: ' + (d.phone || '-'),
      'Industry: ' + (d.industry || '-'),
      'Service needed: ' + (d.service || '-'),
      '',
      'Project details:',
      (d.message || '-')
    ].join('\n');
  };

  var succeed = function () {
    if (card) {
      card.classList.add('is-sent');
      var panel = card.querySelector('.form-success');
      if (panel) {
        panel.setAttribute('tabindex', '-1');
        panel.focus({ preventScroll: true });
        panel.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
      }
    }
  };

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    // Honeypot — silently succeed for bots.
    var hp = form.querySelector('[name="company_website"]');
    if (hp && hp.value) { succeed(); return; }

    if (!validate()) return;

    var data = collect();
    var btn = form.querySelector('[type="submit"]');
    var endpoint = (window.APEX && window.APEX.formEndpoint) || '';

    if (endpoint) {
      if (btn) { btn.disabled = true; btn.dataset.label = btn.textContent; btn.textContent = 'Sending…'; }
      fetch(endpoint, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(form)
      }).then(function (res) {
        if (!res.ok) throw new Error('Request failed');
        succeed();
      }).catch(function () {
        window.location.href = 'mailto:' + window.APEX.email +
          '?subject=' + encodeURIComponent('Website enquiry — ' + (data.business || data.name || 'New enquiry')) +
          '&body=' + encodeURIComponent(asText(data));
        succeed();
      }).finally(function () {
        if (btn) { btn.disabled = false; btn.textContent = btn.dataset.label || 'Send Enquiry'; }
      });
      return;
    }

    // No endpoint configured — hand off to the visitor's mail app, pre-filled.
    window.location.href = 'mailto:' + window.APEX.email +
      '?subject=' + encodeURIComponent('Website enquiry — ' + (data.business || data.name || 'New enquiry')) +
      '&body=' + encodeURIComponent(asText(data));
    succeed();
  });

  /* ---------- Send the same enquiry straight to WhatsApp ---------- */
  var waBtn = doc.getElementById('send-whatsapp');
  if (waBtn) {
    waBtn.addEventListener('click', function () {
      if (!validate()) return;
      var url = 'https://wa.me/' + window.APEX.whatsapp + '?text=' + encodeURIComponent(asText(collect()));
      window.open(url, '_blank', 'noopener');
      succeed();
    });
  }
})();
