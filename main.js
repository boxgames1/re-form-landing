const WEBHOOK_URL = "https://hook.eu1.make.com/a0lcepc219zhmh0kqoap5cezsjhe2xv6";

const form = document.querySelector("#lead-form");
const statusMessage = document.querySelector("#form-status");
const submitButton = document.querySelector("#submit-button");
const scrollButton = document.querySelector(".scroll-to-form");
const privacyModal = document.querySelector("#privacy-modal"); // actualizado
const privacyOpenButtons = document.querySelectorAll(".link-modal-privacidad"); // actualizado
const privacyCloseButtons = document.querySelectorAll("[data-close-privacidad]"); // actualizado

let lastFocusedElement = null; // actualizado

function setStatus(message, type = "") {
  if (!statusMessage) return;

  statusMessage.textContent = message;
  statusMessage.classList.remove("is-success", "is-error");

  if (type === "success") statusMessage.classList.add("is-success");
  if (type === "error") statusMessage.classList.add("is-error");
}

function setLoading(isLoading) {
  if (!submitButton) return;

  submitButton.disabled = isLoading;
  submitButton.classList.toggle("is-loading", isLoading);
}

function smoothScrollToForm() {
  if (!scrollButton || !form) return;

  scrollButton.addEventListener("click", () => {
    form.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => {
      const firstInput = form.querySelector("input, select");
      if (firstInput) firstInput.focus();
    }, 450);
  });
}

// actualizado: lógica accesible del modal de privacidad
function getFocusableElements(container) {
  if (!container) return [];
  return Array.from(
    container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
  ).filter((el) => !el.hasAttribute("disabled"));
}

function closePrivacyModal() {
  if (!privacyModal || privacyModal.hasAttribute("hidden")) return;
  privacyModal.setAttribute("hidden", "");
  document.body.style.overflow = "";
  document.removeEventListener("keydown", onPrivacyKeydown);
  if (lastFocusedElement) {
    lastFocusedElement.focus();
  }
}

function onPrivacyKeydown(event) {
  if (!privacyModal || privacyModal.hasAttribute("hidden")) return;

  if (event.key === "Escape") {
    event.preventDefault();
    closePrivacyModal();
    return;
  }

  if (event.key !== "Tab") return;

  const focusable = getFocusableElements(privacyModal);
  if (!focusable.length) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function openPrivacyModal() {
  if (!privacyModal) return;
  lastFocusedElement = document.activeElement;
  privacyModal.removeAttribute("hidden");
  document.body.style.overflow = "hidden";
  document.addEventListener("keydown", onPrivacyKeydown);

  const focusable = getFocusableElements(privacyModal);
  if (focusable.length) {
    focusable[0].focus();
  }
}

function initPrivacyModal() {
  if (!privacyModal) return;

  privacyOpenButtons.forEach((button) => {
    button.addEventListener("click", openPrivacyModal);
  });

  privacyCloseButtons.forEach((button) => {
    button.addEventListener("click", closePrivacyModal);
  });

  privacyModal.addEventListener("click", (event) => {
    if (event.target === privacyModal) {
      closePrivacyModal();
    }
  });

  // actualizado: modal privacidad desde footer
  document
    .getElementById("open-privacy-footer")
    ?.addEventListener("click", () => openPrivacyModal());
}

function validateForm() {
  if (!form) return { valid: false };

  const fullName = form.fullName.value.trim();
  const email = form.email.value.trim();
  const phone = form.phone.value.trim();
  const saleTimeline = form.querySelector('input[name="saleTimeline"]:checked');
  const privacyAccepted = form.privacyAccepted.checked;
  const validationMessage =
    "Revisa que has rellenado todos los datos obligatorios y que el correo electrónico es correcto.";

  if (!fullName) {
    return { valid: false, message: validationMessage, field: "fullName" };
  }

  if (!email) {
    return { valid: false, message: validationMessage, field: "email" };
  }

  if (!form.email.checkValidity()) {
    return { valid: false, message: validationMessage, field: "email" };
  }

  if (!phone) {
    return { valid: false, message: validationMessage, field: "phone" };
  }

  if (!saleTimeline) {
    return { valid: false, message: validationMessage };
  }

  if (!privacyAccepted) {
    return {
      valid: false,
      message: validationMessage,
      field: "privacyAccepted"
    };
  }

  return { valid: true };
}

function getPayload() {
  const selectedTimeline = form.querySelector('input[name="saleTimeline"]:checked'); // actualizado
  const nombre = form.fullName.value.trim(); // actualizado
  const email = form.email.value.trim(); // actualizado
  const telefono = form.phone.value.trim(); // actualizado
  const tipoInmueble = form.propertyType.value; // actualizado
  const localidad = form.location.value.trim(); // actualizado
  const direccionAproximada = form.address.value.trim(); // actualizado
  const plazoVenta = selectedTimeline ? selectedTimeline.value : ""; // actualizado

  return {
    nombre,
    email,
    telefono,
    tipoInmueble,
    localidad,
    direccionAproximada,
    plazoVenta,
    origen: "landing-tasamostupropiedad" // actualizado
  };
}

async function onSubmit(event) {
  event.preventDefault();
  setStatus("");

  const validation = validateForm();
  if (!validation.valid) {
    setStatus(validation.message, "error");
    if (validation.field && form[validation.field]) {
      form[validation.field].focus();
    }
    return;
  }

  const payload = getPayload();
  setLoading(true);
  setStatus("Enviando tu solicitud, por favor espera...");

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Webhook responded with ${response.status}`);
    }
    fbq("track", "Lead");
    if (typeof gtag === "function") {
      gtag("event", "generate_lead");
    }


    // actualizado mensaje
    setStatus(
      "Gracias. El equipo de tasamostupropiedad.es revisará tu caso y se pondrá en contacto contigo en breve.",
      "success"
    );
    form.reset();
  } catch (error) {
    console.error("Error al enviar formulario:", error);
    // actualizado mensaje
    setStatus(
      "Ha habido un problema al enviar tus datos. Inténtalo de nuevo en unos minutos. Si el error continúa, puedes escribirnos a info@tasamostupropiedad.es.",
      "error"
    );
  } finally {
    setLoading(false);
  }
}

function initFormHandler() {
  if (!form) return;
  form.addEventListener("submit", onSubmit);
}

smoothScrollToForm();
initFormHandler();
initPrivacyModal(); // actualizado
