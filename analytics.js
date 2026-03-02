const chartTargets = {
  experience: "chart-experience",
  navigation: "chart-navigation",
  design: "chart-design",
  recommend: "chart-recommend",
  features: "chart-features",
};

const formatPercent = (value) => `${value.toFixed(1)}%`;
const formatDateTime = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown date" : date.toLocaleString();
};

const createBarRow = (item, index) => {
  const row = document.createElement("div");
  row.className = "chart-row";

  const label = document.createElement("p");
  label.className = "chart-label";
  label.textContent = item.label;

  const barTrack = document.createElement("div");
  barTrack.className = "bar-track";

  const barFill = document.createElement("div");
  barFill.className = "bar-fill";
  barFill.style.width = `${item.percent}%`;
  barFill.style.transitionDelay = `${index * 70}ms`;

  barTrack.append(barFill);

  const value = document.createElement("p");
  value.className = "chart-value";
  value.textContent = `${item.count} (${formatPercent(item.percent)})`;

  row.append(label, barTrack, value);
  return row;
};

const renderChart = (containerId, values, hasResponses) => {
  const container = document.getElementById(containerId);
  if (!container) {
    return;
  }

  container.innerHTML = "";

  if (!hasResponses) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "No responses yet.";
    container.append(empty);
    return;
  }

  values.forEach((item, index) => {
    container.append(createBarRow(item, index));
  });
};

const renderMetrics = (totals) => {
  const totalResponses = document.getElementById("metric-total-responses");
  const positiveRate = document.getElementById("metric-positive-rate");
  const experienceScore = document.getElementById("metric-experience-score");
  const featuresAverage = document.getElementById("metric-features-average");

  totalResponses.textContent = totals.responses;
  positiveRate.textContent = formatPercent(totals.positiveRecommendationRate);
  experienceScore.textContent = `${totals.averageExperienceScore.toFixed(2)} / 5`;
  featuresAverage.textContent = totals.averageFeaturesSelected.toFixed(2);
};

const renderHighlights = (highlights, generatedAt) => {
  const feature = document.getElementById("highlight-feature");
  const experience = document.getElementById("highlight-experience");
  const updatedAt = document.getElementById("generated-at");

  if (highlights.topFeature) {
    feature.textContent = `${highlights.topFeature.label} (${highlights.topFeature.count} votes)`;
  } else {
    feature.textContent = "No responses yet";
  }

  if (highlights.topExperience) {
    experience.textContent = `${highlights.topExperience.label} (${highlights.topExperience.count} responses)`;
  } else {
    experience.textContent = "No responses yet";
  }

  updatedAt.textContent = formatDateTime(generatedAt);
};

const renderComments = (comments) => {
  const list = document.getElementById("recent-comments");
  if (!list) {
    return;
  }

  list.innerHTML = "";

  if (!comments.length) {
    const item = document.createElement("li");
    item.className = "empty-state";
    item.textContent = "No comments submitted yet.";
    list.append(item);
    return;
  }

  comments.forEach((commentEntry) => {
    const item = document.createElement("li");
    item.className = "comment-item";

    const text = document.createElement("p");
    text.className = "comment-text";
    text.textContent = commentEntry.comment;

    const timestamp = document.createElement("time");
    timestamp.className = "comment-time";
    timestamp.textContent = formatDateTime(commentEntry.submittedAt);

    item.append(text, timestamp);
    list.append(item);
  });
};

const renderError = () => {
  const chartContainers = Object.values(chartTargets).map((id) => document.getElementById(id));
  chartContainers.forEach((container) => {
    if (!container) {
      return;
    }

    container.innerHTML = "";
    const error = document.createElement("p");
    error.className = "empty-state error";
    error.textContent = "Could not load analytics data.";
    container.append(error);
  });
};

const loadAnalytics = async () => {
  try {
    const response = await fetch("/api/responses/analytics");
    if (!response.ok) {
      throw new Error("Failed to fetch analytics data");
    }

    const analytics = await response.json();
    const hasResponses = analytics.totals.responses > 0;

    renderMetrics(analytics.totals);
    renderHighlights(analytics.highlights, analytics.generatedAt);
    renderComments(analytics.highlights.recentComments);

    Object.entries(chartTargets).forEach(([key, target]) => {
      renderChart(target, analytics.charts[key], hasResponses);
    });
  } catch (error) {
    renderError();
  }
};

loadAnalytics();
