function setCurrentYear() {
  var yearEl = document.querySelector("#displayYear");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
}

function initialiseNavigation() {
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".nav-links");
  if (!toggle || !nav) return;

  toggle.addEventListener("click", function () {
    var isOpen = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });
}

function initialiseContactForm() {
  var contactForm = document.querySelector("#contactForm");
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
  var endpoint = contactForm.getAttribute("action") || "/api/contact";

  function setFieldError(fieldName, message) {
    if (!fieldErrors[fieldName]) return;
    fieldErrors[fieldName].textContent = message || "";
    fieldErrors[fieldName].classList.toggle("d-none", !message);
  }

  function clearErrors() {
    Object.keys(fieldErrors).forEach(function (key) {
      setFieldError(key, "");
      var field = contactForm.elements[key];
      if (field) field.classList.remove("is-invalid");
    });
  }

  function showStatus(message, type) {
    if (!statusEl) return;
    statusEl.classList.remove("d-none", "alert-success", "alert-danger");
    statusEl.classList.add(type === "success" ? "alert-success" : "alert-danger");
    statusEl.textContent = message;
  }

  contactForm.addEventListener("input", function (event) {
    var target = event.target;
    if (!target || !target.name) return;
    target.setCustomValidity("");
    if (target.checkValidity()) {
      setFieldError(target.name, "");
      target.classList.remove("is-invalid");
    }
  });

  contactForm.addEventListener("submit", function (event) {
    event.preventDefault();
    clearErrors();
    if (statusEl) statusEl.classList.add("d-none");

    if (!contactForm.checkValidity()) {
      Object.keys(fieldErrors).forEach(function (key) {
        var field = contactForm.elements[key];
        if (field && !field.checkValidity()) {
          setFieldError(key, field.validationMessage);
          field.classList.add("is-invalid");
        }
      });
      return;
    }

    var payload = {
      name: contactForm.name.value.trim(),
      email: contactForm.email.value.trim(),
      company: contactForm.company ? contactForm.company.value.trim() : "",
      phone: contactForm.phone.value.trim(),
      message: contactForm.message.value.trim(),
      consent: contactForm.consent.checked,
    };

    if (submitBtn) submitBtn.disabled = true;

    fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
      body: JSON.stringify(payload),
    })
      .then(function (response) {
        return response.text().then(function (text) {
          var data = null;
          try {
            data = text ? JSON.parse(text) : null;
          } catch (err) {
            data = null;
          }

          if (response.ok) return data || { success: true };
          throw data || { error: text || "Request failed" };
        });
      })
      .then(function () {
        contactForm.reset();
        showStatus("Thanks. Your enquiry has been stored for review.", "success");
      })
      .catch(function (error) {
        if (error && error.errors) {
          Object.keys(error.errors).forEach(function (key) {
            setFieldError(key, error.errors[key]);
            var field = contactForm.elements[key];
            if (field) field.classList.add("is-invalid");
          });
        }

        var details = error && Array.isArray(error.details) ? error.details.join(" ") : "";
        var message =
          [error && (error.error || error.message), details].filter(Boolean).join(" ").trim() ||
          "Unable to submit your enquiry right now. Please try again later.";

        showStatus(message, "danger");
      })
      .finally(function () {
        if (submitBtn) submitBtn.disabled = false;
      });
  });
}

function initialiseStatCounters() {
  var statValues = Array.prototype.slice.call(document.querySelectorAll("[data-count]"));
  if (!statValues.length) return;

  var prefersReducedMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasAnimated = false;

  function renderValue(element, value) {
    var prefix = element.getAttribute("data-prefix") || "";
    var suffix = element.getAttribute("data-suffix") || "";
    element.textContent = prefix + value + suffix;
  }

  function renderFinalValues() {
    statValues.forEach(function (element) {
      renderValue(element, Number(element.getAttribute("data-count")) || 0);
    });
  }

  function animateCounters() {
    if (hasAnimated) return;
    hasAnimated = true;

    if (prefersReducedMotion) {
      renderFinalValues();
      return;
    }

    var duration = 1100;
    var startTime = null;

    statValues.forEach(function (element) {
      renderValue(element, 0);
    });

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);
      var easedProgress = 1 - Math.pow(1 - progress, 3);

      statValues.forEach(function (element) {
        var target = Number(element.getAttribute("data-count")) || 0;
        renderValue(element, Math.round(target * easedProgress));
      });

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        renderFinalValues();
      }
    }

    window.requestAnimationFrame(step);
  }

  if (!("IntersectionObserver" in window)) {
    animateCounters();
    return;
  }

  var panel = document.querySelector(".stats-panel");
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        animateCounters();
        observer.disconnect();
      }
    });
  }, { threshold: 0.35 });

  observer.observe(panel || statValues[0]);
}

setCurrentYear();
initialiseNavigation();
initialiseContactForm();
initialiseStatCounters();
