const fs = require("fs/promises");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");
const SUBMISSIONS_PATH = path.join(DATA_DIR, "submissions.json");

const toArray = (value) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    return [value];
  }

  return [];
};

const readSubmissions = async () => {
  try {
    const fileContent = await fs.readFile(SUBMISSIONS_PATH, "utf8");
    const parsed = JSON.parse(fileContent);
    return Array.isArray(parsed) ? parsed : [];
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

module.exports = {
  toArray,
  readSubmissions,
  writeSubmissions,
};
