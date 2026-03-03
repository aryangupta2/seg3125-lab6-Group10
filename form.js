const form = document.getElementById("evaluation-form");
const steps = form ? Array.from(form.querySelectorAll(".form-step")) : [];
const stepIndicator = document.getElementById("step-indicator");
const progressFill = document.getElementById("progress-fill");
const loadSpeedInput = document.getElementById("load-speed-rating");
const loadSpeedValue = document.getElementById("load-speed-value");

let currentStepIndex = 0;

const toPayload = (formData) => {
  const payload = {};

  for (const [key, value] of formData.entries()) {
    if (payload[key] === undefined) {
      payload[key] = value;
      continue;
    }

    if (!Array.isArray(payload[key])) {
      payload[key] = [payload[key]];
    }

    payload[key].push(value);
  }

  if (payload.features === undefined) {
    payload.features = [];
  }

  return payload;
};

const updateLoadSpeedValue = () => {
  if (!loadSpeedInput || !loadSpeedValue) {
    return;
  }

  loadSpeedValue.textContent = loadSpeedInput.value;
};

const updateStepState = () => {
  if (!steps.length) {
    return;
  }

  steps.forEach((step, index) => {
    const isCurrentStep = index === currentStepIndex;
    step.classList.toggle("active", isCurrentStep);
    step.hidden = !isCurrentStep;
  });

  if (stepIndicator) {
    stepIndicator.textContent = `Step ${currentStepIndex + 1} of ${steps.length}`;
  }

  if (progressFill) {
    const progressPercent = ((currentStepIndex + 1) / steps.length) * 100;
    progressFill.style.width = `${progressPercent}%`;
  }
};

const getStepFields = (step) => {
  return Array.from(step.querySelectorAll("input, select, textarea")).filter((field) => {
    return field.type !== "hidden" && !field.disabled;
  });
};

const validateStep = (stepIndex) => {
  const step = steps[stepIndex];
  if (!step) {
    return false;
  }

  const fields = getStepFields(step);

  for (const field of fields) {
    if (!field.checkValidity()) {
      field.reportValidity();
      return false;
    }
  }

  return true;
};

const goToStep = (stepIndex) => {
  const boundedStep = Math.max(0, Math.min(stepIndex, steps.length - 1));
  currentStepIndex = boundedStep;
  updateStepState();
};

if (form) {
  updateStepState();
  updateLoadSpeedValue();

  if (loadSpeedInput) {
    loadSpeedInput.addEventListener("input", updateLoadSpeedValue);
  }

  form.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) {
      return;
    }

    const action = button.dataset.action;

    if (action === "next") {
      if (!validateStep(currentStepIndex)) {
        return;
      }

      goToStep(currentStepIndex + 1);
      return;
    }

    if (action === "prev") {
      goToStep(currentStepIndex - 1);
    }
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const onFinalStep = currentStepIndex === steps.length - 1;
    if (!onFinalStep) {
      if (validateStep(currentStepIndex)) {
        goToStep(currentStepIndex + 1);
      }
      return;
    }

    if (!validateStep(currentStepIndex)) {
      return;
    }

    try {
      const formData = new FormData(form);
      const payload = toPayload(formData);

      const response = await fetch("/api/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Submission failed");
      }

      alert("Thanks! Your response has been submitted.");
      form.reset();
      goToStep(0);
      updateLoadSpeedValue();
    } catch (error) {
      alert("Sorry, we could not submit your response. Please try again.");
    }
  });
}

// Keyboard navigation + close behavior for Walmart image zoom overlays
const zoomOverlays = Array.from(document.querySelectorAll(".zoom-overlay"));
let activeZoomIndex = -1;
const totalZoomImages = zoomOverlays.length;

zoomOverlays.forEach((overlay, index) => {
  const counter = document.createElement("p");
  counter.className = "zoom-counter";
  counter.textContent = `${index + 1} / ${totalZoomImages}`;
  overlay.append(counter);
});

const setActiveZoom = (index) => {
  zoomOverlays.forEach((overlay, overlayIndex) => {
    overlay.classList.toggle("is-open", overlayIndex === index);
  });
  activeZoomIndex = index;
};

const closeActiveZoom = () => {
  if (activeZoomIndex !== -1) {
    setActiveZoom(-1);
  }
};

document.addEventListener("click", (event) => {
  const galleryLink = event.target.closest('.gallery a[href^="#zoom-"]');
  if (galleryLink) {
    event.preventDefault();
    const targetId = (galleryLink.getAttribute("href") || "").replace("#", "");
    const zoomIndex = zoomOverlays.findIndex((overlay) => overlay.id === targetId);
    if (zoomIndex !== -1) {
      setActiveZoom(zoomIndex);
    }
    return;
  }

  if (event.target.closest(".zoom-overlay .close")) {
    event.preventDefault();
    closeActiveZoom();
    return;
  }

  const overlay = event.target.closest(".zoom-overlay");
  if (overlay && event.target === overlay) {
    closeActiveZoom();
  }
});

window.addEventListener(
  "keydown",
  (event) => {
    if (activeZoomIndex === -1) {
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      closeActiveZoom();
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      setActiveZoom((activeZoomIndex + 1) % zoomOverlays.length);
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      setActiveZoom((activeZoomIndex - 1 + zoomOverlays.length) % zoomOverlays.length);
    }
  },
  true,
);
