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
