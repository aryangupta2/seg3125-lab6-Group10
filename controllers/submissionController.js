const { randomUUID } = require("crypto");
const { toArray, readSubmissions, writeSubmissions } = require("./submissionData");

const listResponses = async (req, res) => {
  try {
    const submissions = await readSubmissions();
    res.json(submissions);
  } catch (error) {
    console.error("Failed to load survey submissions:", error);
    res.status(500).json({ message: "Failed to load survey submissions." });
  }
};

const createResponse = async (req, res) => {
  const submission = {
    id: randomUUID(),
    ...req.body,
    features: toArray(req.body.features),
    submittedAt: new Date().toISOString(),
  };

  try {
    const submissions = await readSubmissions();
    submissions.push(submission);
    await writeSubmissions(submissions);

    res.location(`/api/responses/${submission.id}`);
    res.status(201).json(submission);
  } catch (error) {
    console.error("Failed to save survey submission:", error);
    res.status(500).json({ message: "Failed to save survey submission." });
  }
};

const getResponseById = async (req, res) => {
  try {
    const submissions = await readSubmissions();
    const submission = submissions.find((item) => item.id === req.params.id);

    if (!submission) {
      res.status(404).json({ message: "Survey response not found." });
      return;
    }

    res.json(submission);
  } catch (error) {
    console.error("Failed to load survey submission:", error);
    res.status(500).json({ message: "Failed to load survey submission." });
  }
};

module.exports = {
  listResponses,
  createResponse,
  getResponseById,
};
