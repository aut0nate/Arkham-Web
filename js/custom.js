// to get current year
function getYear() {
  var currentDate = new Date();
  var currentYear = currentDate.getFullYear();
  var yearEl = document.querySelector("#displayYear");
  if (yearEl) {
    yearEl.innerHTML = currentYear;
  }
}

getYear();

// client section owl carousel (guarded so it only runs when present)
if (window.jQuery && $(".client_owl-carousel").length) {
  $(".client_owl-carousel").owlCarousel({
    loop: true,
    margin: 20,
    dots: false,
    nav: true,
    autoplay: true,
    autoplayHoverPause: true,
    navText: [
      '<i class="fa fa-angle-left" aria-hidden="true"></i>',
      '<i class="fa fa-angle-right" aria-hidden="true"></i>',
    ],
    responsive: {
      0: {
        items: 1,
      },
      600: {
        items: 2,
      },
      1000: {
        items: 2,
      },
    },
  });
}

// contact form validation + submission
(function () {
  var contactForm = document.querySelector('#contactForm');
  if (!contactForm) return;

  var fieldErrors = {
    name: contactForm.querySelector('[data-error-for="name"]'),
    email: contactForm.querySelector('[data-error-for="email"]'),
    phone: contactForm.querySelector('[data-error-for="phone"]'),
    message: contactForm.querySelector('[data-error-for="message"]'),
    consent: contactForm.querySelector('[data-error-for="consent"]'),
  };

  var statusEl = contactForm.querySelector('[data-role="form-status"]');
  var submitBtn = contactForm.querySelector('button[type="submit"]');
  var endpoint = contactForm.getAttribute('action') || '/api/contact';

  function setFieldError(fieldName, message) {
    if (!fieldErrors[fieldName]) return;
    fieldErrors[fieldName].textContent = message || '';
    if (message) {
      fieldErrors[fieldName].classList.remove('d-none');
    } else {
      fieldErrors[fieldName].classList.add('d-none');
    }
  }

  function clearServerErrors() {
    Object.keys(fieldErrors).forEach(function (key) {
      setFieldError(key, '');
    });
  }

  function showStatus(message, type) {
    if (!statusEl) return;
    statusEl.classList.remove('d-none', 'alert-success', 'alert-danger');
    statusEl.classList.add(type === 'success' ? 'alert-success' : 'alert-danger');
    statusEl.textContent = message;
  }

  contactForm.addEventListener('input', function (event) {
    var target = event.target;
    if (!target || !target.name) return;

    target.setCustomValidity('');
    if (target.checkValidity()) {
      setFieldError(target.name, '');
      target.classList.remove('is-invalid');
    }
  });

  contactForm.addEventListener('submit', function (event) {
    event.preventDefault();
    event.stopPropagation();
    clearServerErrors();
    if (statusEl) statusEl.classList.add('d-none');

    contactForm.classList.add('was-validated');

    if (!contactForm.checkValidity()) {
      Object.keys(fieldErrors).forEach(function (key) {
        var field = contactForm.elements[key];
        if (field && !field.checkValidity()) {
          setFieldError(key, field.validationMessage);
          field.classList.add('is-invalid');
        }
      });
      return;
    }

    var payload = {
      name: contactForm.name.value.trim(),
      email: contactForm.email.value.trim(),
      company: contactForm.company ? contactForm.company.value.trim() : '',
      phone: contactForm.phone.value.trim(),
      message: contactForm.message.value.trim(),
      consent: contactForm.consent.checked,
    };

    if (submitBtn) submitBtn.disabled = true;

    fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify(payload),
    })
      .then(function (response) {
        return response
          .text()
          .then(function (text) {
            var data = null;
            try {
              data = text ? JSON.parse(text) : null;
            } catch (err) {
              // Fall through to generic handling
            }

            if (response.ok) {
              return data || { success: true };
            }

            var errorPayload = data || { error: text || 'Request failed' };
            throw errorPayload;
          })
          .catch(function (err) {
            throw err;
          });
      })
      .then(function () {
        contactForm.reset();
        contactForm.classList.remove('was-validated');
        showStatus('Thanks for reaching out. We will contact you shortly.', 'success');
      })
      .catch(function (error) {
        if (error && error.errors) {
          Object.keys(error.errors).forEach(function (key) {
            if (fieldErrors[key]) {
              setFieldError(key, error.errors[key]);
              var field = contactForm.elements[key];
              if (field) field.classList.add('is-invalid');
            }
          });
        }

        var message = 'Unable to submit your enquiry right now. Please try again later.';
        if (error) {
          var details = Array.isArray(error.details) ? error.details.join(' ') : '';
          message = [error.error || error.message, details].filter(Boolean).join(' ').trim() || message;
        }

        showStatus(message, 'danger');
      })
      .finally(function () {
        if (submitBtn) submitBtn.disabled = false;
      });
  });
})();
