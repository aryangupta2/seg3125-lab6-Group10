const horizontalChartTargets = {
  experience: "chart-experience",
  navigation: "chart-navigation",
  design: "chart-design",
  recommend: "chart-recommend",
  ageGroup: "chart-age-group",
  features: "chart-features",
};

const columnChartTargets = {
  loadSpeed: "chart-load-speed",
  tasksCompleted: "chart-tasks-completed",
  responseTimeline: "chart-response-timeline",
};

const allChartTargetIds = [
  ...Object.values(horizontalChartTargets),
  ...Object.values(columnChartTargets),
];

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

const renderHorizontalChart = (containerId, values, hasResponses) => {
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

const createColumnItem = (item, index) => {
  const columnItem = document.createElement("div");
  columnItem.className = "column-item";

  const count = document.createElement("p");
  count.className = "column-value";
  count.textContent = item.count;

  const track = document.createElement("div");
  track.className = "column-track";

  const fill = document.createElement("div");
  fill.className = "column-fill";
  fill.style.height = `${item.percent}%`;
  fill.style.transitionDelay = `${index * 55}ms`;

  track.append(fill);

  const label = document.createElement("p");
  label.className = "column-label";
  label.textContent = item.label;

  columnItem.append(count, track, label);
  return columnItem;
};

const renderColumnChart = (containerId, values, hasResponses) => {
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

  const chart = document.createElement("div");
  chart.className = "column-chart";

  values.forEach((item, index) => {
    chart.append(createColumnItem(item, index));
  });

  container.append(chart);
};

const renderMetrics = (totals) => {
  const totalResponses = document.getElementById("metric-total-responses");
  const positiveRate = document.getElementById("metric-positive-rate");
  const experienceScore = document.getElementById("metric-experience-score");
  const featuresAverage = document.getElementById("metric-features-average");
  const loadSpeed = document.getElementById("metric-load-speed");
  const tasksCompleted = document.getElementById("metric-tasks-completed");

  totalResponses.textContent = totals.responses;
  positiveRate.textContent = formatPercent(totals.positiveRecommendationRate);
  experienceScore.textContent = `${totals.averageExperienceScore.toFixed(2)} / 5`;
  featuresAverage.textContent = totals.averageFeaturesSelected.toFixed(2);
  loadSpeed.textContent = `${totals.averageLoadSpeed.toFixed(2)} / 10`;
  tasksCompleted.textContent = totals.averageTasksCompleted.toFixed(2);
};

const renderHighlights = (highlights, generatedAt) => {
  const feature = document.getElementById("highlight-feature");
  const experience = document.getElementById("highlight-experience");
  const ageGroup = document.getElementById("highlight-age-group");
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

  if (highlights.topAgeGroup) {
    ageGroup.textContent = `${highlights.topAgeGroup.label} (${highlights.topAgeGroup.count} responses)`;
  } else {
    ageGroup.textContent = "No responses yet";
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
  const chartContainers = allChartTargetIds.map((id) => document.getElementById(id));
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

    Object.entries(horizontalChartTargets).forEach(([key, target]) => {
      const values = Array.isArray(analytics.charts[key]) ? analytics.charts[key] : [];
      renderHorizontalChart(target, values, hasResponses);
    });

    Object.entries(columnChartTargets).forEach(([key, target]) => {
      const values = Array.isArray(analytics.charts[key]) ? analytics.charts[key] : [];
      renderColumnChart(target, values, hasResponses);
    });
  } catch (error) {
    renderError();
  }
};

loadAnalytics();
