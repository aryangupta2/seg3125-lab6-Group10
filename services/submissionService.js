const fs = require("fs/promises");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");
const SUBMISSIONS_PATH = path.join(DATA_DIR, "submissions.json");
const LEGACY_SUBMISSIONS_PATH = path.join(
  __dirname,
  "..",
  ".data",
  "submissions.json",
);

const toArray = (value) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    return [value];
  }

  return [];
};

const readFromPath = async (filePath) => {
  const fileContent = await fs.readFile(filePath, "utf8");
  const parsed = JSON.parse(fileContent);
  return Array.isArray(parsed) ? parsed : [];
};

const readSubmissions = async () => {
  try {
    return await readFromPath(SUBMISSIONS_PATH);
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }

  try {
    return await readFromPath(LEGACY_SUBMISSIONS_PATH);
  } catch (error) {
    if (error.code === "ENOENT") {
      return [];
    }
    throw error;
  }
};

const writeSubmissions = async (submissions) => {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(SUBMISSIONS_PATH, JSON.stringify(submissions, null, 2));
};

const withDerivedIds = (submissions) => {
  return submissions.map((submission, index) => {
    if (submission.id) {
      return submission;
    }

    return {
      ...submission,
      id: `legacy-${index + 1}`,
    };
  });
};

module.exports = {
  toArray,
  readSubmissions,
  writeSubmissions,
  withDerivedIds,
};
