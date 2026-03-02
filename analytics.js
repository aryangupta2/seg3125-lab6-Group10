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

const pieChartTargets = {
  recommend: "chart-recommend-pie",
};

const allChartTargetIds = [
  ...Object.values(horizontalChartTargets),
  ...Object.values(columnChartTargets),
  ...Object.values(pieChartTargets),
];

const PIE_COLORS = ["#0071ce", "#2f95e5", "#ffc220", "#2e7d32", "#f28b30", "#1f9e89"];

const formatPercent = (value) => `${value.toFixed(1)}%`;
const formatDateTime = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown date" : date.toLocaleString();
};

const toFiniteNumber = (value, fallback = 0) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
};

const setText = (id, value) => {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = value;
  }
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

const createPieLegendItem = (item, color, total) => {
  const legendItem = document.createElement("li");
  legendItem.className = "pie-legend-item";

  const swatch = document.createElement("span");
  swatch.className = "pie-swatch";
  swatch.style.backgroundColor = color;

  const label = document.createElement("span");
  label.textContent = item.label;

  const value = document.createElement("span");
  value.className = "pie-legend-value";
  const percent = total === 0 ? 0 : (item.count / total) * 100;
  value.textContent = `${item.count} (${formatPercent(percent)})`;

  legendItem.append(swatch, label, value);
  return legendItem;
};

const renderPieChart = (containerId, values, hasResponses) => {
  const container = document.getElementById(containerId);
  if (!container) {
    return;
  }

  container.innerHTML = "";

  const nonZeroValues = values.filter((item) => item.count > 0);
  const total = nonZeroValues.reduce((sum, item) => sum + item.count, 0);

  if (!hasResponses || total === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "No responses yet.";
    container.append(empty);
    return;
  }

  let currentAngle = 0;
  const segments = nonZeroValues.map((item, index) => {
    const start = currentAngle;
    currentAngle += (item.count / total) * 360;
    const color = PIE_COLORS[index % PIE_COLORS.length];
    return { color, start, end: currentAngle, item };
  });

  const pieLayout = document.createElement("div");
  pieLayout.className = "pie-layout";

  const pieGraphic = document.createElement("div");
  pieGraphic.className = "pie-graphic";
  pieGraphic.style.backgroundImage = `conic-gradient(${segments
    .map((segment) => `${segment.color} ${segment.start}deg ${segment.end}deg`)
    .join(",")})`;

  const pieCenter = document.createElement("div");
  pieCenter.className = "pie-center";

  const totalValue = document.createElement("strong");
  totalValue.textContent = String(total);
  const totalLabel = document.createElement("span");
  totalLabel.textContent = "responses";

  pieCenter.append(totalValue, totalLabel);
  pieGraphic.append(pieCenter);

  const legend = document.createElement("ul");
  legend.className = "pie-legend";
  segments.forEach((segment) => {
    legend.append(createPieLegendItem(segment.item, segment.color, total));
  });

  pieLayout.append(pieGraphic, legend);
  container.append(pieLayout);
};

const renderMetrics = (totals = {}) => {
  const responses = toFiniteNumber(totals.responses);
  const positiveRate = toFiniteNumber(totals.positiveRecommendationRate);
  const averageExperienceScore = toFiniteNumber(totals.averageExperienceScore);
  const averageFeaturesSelected = toFiniteNumber(totals.averageFeaturesSelected);
  const averageLoadSpeed = toFiniteNumber(totals.averageLoadSpeed);
  const averageTasksCompleted = toFiniteNumber(totals.averageTasksCompleted);

  setText("metric-total-responses", String(responses));
  setText("metric-positive-rate", formatPercent(positiveRate));
  setText("metric-experience-score", `${averageExperienceScore.toFixed(2)} / 5`);
  setText("metric-features-average", averageFeaturesSelected.toFixed(2));
  setText("metric-load-speed", `${averageLoadSpeed.toFixed(2)} / 10`);
  setText("metric-tasks-completed", averageTasksCompleted.toFixed(2));
};

const renderHighlights = (highlights = {}, generatedAt) => {
  if (highlights.topFeature) {
    setText("highlight-feature", `${highlights.topFeature.label} (${highlights.topFeature.count} votes)`);
  } else {
    setText("highlight-feature", "No responses yet");
  }

  if (highlights.topExperience) {
    setText(
      "highlight-experience",
      `${highlights.topExperience.label} (${highlights.topExperience.count} responses)`
    );
  } else {
    setText("highlight-experience", "No responses yet");
  }

  if (highlights.topAgeGroup) {
    setText("highlight-age-group", `${highlights.topAgeGroup.label} (${highlights.topAgeGroup.count} responses)`);
  } else {
    setText("highlight-age-group", "No responses yet");
  }

  setText("generated-at", formatDateTime(generatedAt));
};

const renderComments = (comments) => {
  const list = document.getElementById("recent-comments");
  if (!list) {
    return;
  }

  list.innerHTML = "";

  const safeComments = Array.isArray(comments) ? comments : [];

  if (!safeComments.length) {
    const item = document.createElement("li");
    item.className = "empty-state";
    item.textContent = "No comments submitted yet.";
    list.append(item);
    return;
  }

  safeComments.forEach((commentEntry) => {
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
    const totals = analytics && typeof analytics === "object" ? analytics.totals || {} : {};
    const highlights = analytics && typeof analytics === "object" ? analytics.highlights || {} : {};
    const charts = analytics && typeof analytics === "object" ? analytics.charts || {} : {};
    const generatedAt = analytics && typeof analytics === "object" ? analytics.generatedAt : undefined;
    const hasResponses = toFiniteNumber(totals.responses) > 0;

    renderMetrics(totals);
    renderHighlights(highlights, generatedAt);
    renderComments(highlights.recentComments);

    Object.entries(horizontalChartTargets).forEach(([key, target]) => {
      const values = Array.isArray(charts[key]) ? charts[key] : [];
      renderHorizontalChart(target, values, hasResponses);
    });

    Object.entries(columnChartTargets).forEach(([key, target]) => {
      const values = Array.isArray(charts[key]) ? charts[key] : [];
      renderColumnChart(target, values, hasResponses);
    });

    Object.entries(pieChartTargets).forEach(([key, target]) => {
      const values = Array.isArray(charts[key]) ? charts[key] : [];
      renderPieChart(target, values, hasResponses);
    });
  } catch (error) {
    renderError();
  }
};

loadAnalytics();
