const form = document.getElementById("evaluation-form");

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

if (form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
      const formData = new FormData(form);
      const payload = toPayload(formData);

      const response = await fetch("/survey", {
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
    } catch (error) {
      alert("Sorry, we could not submit your response. Please try again.");
    }
  });
}
