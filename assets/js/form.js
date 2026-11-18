/* ==========================================================================
   NNE Advocates — consultation form (Web3Forms)
   ========================================================================== */
(function () {
  "use strict";

  var WEB3FORMS_ENDPOINT = "https://api.web3forms.com/submit";
  var forms = document.querySelectorAll("[data-web3forms]");

  function digits(value) {
    return (value || "").replace(/\D/g, "");
  }

  function mailtoFallback(form) {
    function value(name) {
      var field = form.querySelector('[name="' + name + '"]');
      return field ? field.value.trim() : "";
    }
    var body = [
      "Name: " + value("name"),
      "Email: " + value("email"),
      "Phone: " + value("phone"),
      "",
      value("message")
    ].join("\n");
    return (
      "mailto:info@nneadvocates.co.ke?subject=" +
      encodeURIComponent("Website enquiry - " + value("name")) +
      "&body=" +
      encodeURIComponent(body)
    );
  }

  function fieldError(field) {
    var wrapper = field.closest(".field");
    return wrapper ? wrapper.querySelector(".field__error") : null;
  }

  function setError(field, message) {
    var error = fieldError(field);
    field.setAttribute("aria-invalid", "true");
    if (error) {
      error.textContent = message;
      error.classList.add("is-visible");
      if (!field.getAttribute("aria-describedby") && error.id) {
        field.setAttribute("aria-describedby", error.id);
      }
    }
  }

  function clearError(field) {
    var error = fieldError(field);
    field.removeAttribute("aria-invalid");
    if (error) {
      error.textContent = "";
      error.classList.remove("is-visible");
    }
  }

  function validate(form) {
    var invalid = [];
    var name = form.querySelector('[name="name"]');
    var email = form.querySelector('[name="email"]');
    var phone = form.querySelector('[name="phone"]');
    var message = form.querySelector('[name="message"]');
    var consent = form.querySelector('[name="consent"]');

    if (name && name.value.trim().length < 2) {
      setError(name, "Please enter your full name.");
      invalid.push(name);
    } else if (name) clearError(name);

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) {
      setError(email, "Please enter a valid email address.");
      invalid.push(email);
    } else if (email) clearError(email);

    if (phone && digits(phone.value).length < 7) {
      setError(phone, "Please enter a phone number we can reach you on.");
      invalid.push(phone);
    } else if (phone) clearError(phone);

    if (message && message.value.trim().length < 10) {
      setError(message, "Please tell us briefly how we can help (at least 10 characters).");
      invalid.push(message);
    } else if (message) clearError(message);

    if (consent && !consent.checked) {
      setError(consent, "Please confirm that we may contact you about your enquiry.");
      invalid.push(consent);
    } else if (consent) clearError(consent);

    if (invalid.length) {
      invalid[0].focus();
      invalid[0].scrollIntoView({ behavior: "smooth", block: "center" });
      return false;
    }
    return true;
  }

  forms.forEach(function (form) {
    var status = form.querySelector(".form-status");
    var submit = form.querySelector('[type="submit"]');
    var submitLabel = submit ? submit.innerHTML : "";
    var endpoint = form.getAttribute("action") || WEB3FORMS_ENDPOINT;

    form.querySelectorAll("input, select, textarea").forEach(function (field) {
      var eventName = field.type === "checkbox" || field.tagName === "SELECT" ? "change" : "input";
      field.addEventListener(eventName, function () {
        if (field.getAttribute("aria-invalid") === "true") clearError(field);
      });
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      if (!validate(form)) {
        if (status) {
          status.className = "form-status is-visible is-error";
          status.textContent = "Please check the highlighted fields and try again.";
        }
        return;
      }

      if (submit) {
        submit.disabled = true;
        submit.textContent = "Sending…";
      }
      if (status) {
        status.className = "form-status is-visible is-loading";
        status.textContent = "Sending your request…";
      }

      fetch(endpoint, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" }
      })
        .then(function (response) {
          return response.json().then(function (data) {
            return { ok: response.ok, data: data };
          });
        })
        .then(function (result) {
          if (!result.ok || !result.data.success) {
            throw new Error(result.data && result.data.message ? result.data.message : "Submission failed");
          }
          form.reset();
          if (status) {
            status.className = "form-status is-visible is-success";
            status.textContent =
              "Thank you — your request has been received. A member of our team will contact you shortly. For urgent matters, please call +254 768 811 225.";
          }
          form.querySelectorAll("[aria-invalid]").forEach(clearError);
        })
        .catch(function () {
          if (status) {
            status.className = "form-status is-visible is-error";
            status.innerHTML =
              "We could not send your request just now. Please try again, or contact us directly on " +
              '<a href="tel:+254768811225">+254 768 811 225</a> or ' +
              '<a href="mailto:info@nneadvocates.co.ke">info@nneadvocates.co.ke</a>. ' +
              '<a href="' + mailtoFallback(form) + '">Send this enquiry by email instead</a>.';
          }
        })
        .finally(function () {
          if (submit) {
            submit.disabled = false;
            submit.innerHTML = submitLabel;
          }
        });
    });
  });
})();
