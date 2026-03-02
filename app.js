const express = require("express");
const path = require("path");
const {
  listResponses,
  createResponse,
  getResponseById,
  getResponsesAnalytics,
} = require("./controllers/responseController");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname)));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/analytics", (req, res) => {
  res.sendFile(path.join(__dirname, "analytics.html"));
});

app.get("/api/responses", listResponses);
app.post("/api/responses", createResponse);
app.get("/api/responses/analytics", getResponsesAnalytics);
app.get("/api/responses/:id", getResponseById);

app.get("/api/analytics", getResponsesAnalytics);
app.post("/survey", createResponse);

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

module.exports = app;
