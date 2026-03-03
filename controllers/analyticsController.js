const { toArray, readSubmissions } = require("./submissionData");

const CHART_OPTIONS = {
  experience: [
    { value: "excellent", label: "Excellent" },
    { value: "good", label: "Good" },
    { value: "average", label: "Average" },
    { value: "poor", label: "Poor" },
    { value: "very-poor", label: "Very Poor" },
  ],
  navigation: [
    { value: "very-easy", label: "Very Easy" },
    { value: "easy", label: "Easy" },
    { value: "neutral", label: "Neutral" },
    { value: "difficult", label: "Difficult" },
    { value: "very-difficult", label: "Very Difficult" },
  ],
  design: [
    { value: "very-appealing", label: "Very Appealing" },
    { value: "appealing", label: "Appealing" },
    { value: "neutral", label: "Neutral" },
    { value: "unappealing", label: "Unappealing" },
    { value: "very-unappealing", label: "Very Unappealing" },
  ],
  recommend: [
    { value: "definitely", label: "Definitely Yes" },
    { value: "probably", label: "Probably Yes" },
    { value: "not-sure", label: "Not Sure" },
    { value: "probably-not", label: "Probably Not" },
    { value: "definitely-not", label: "Definitely Not" },
  ],
  ageGroup: [
    { value: "18-24", label: "18-24" },
    { value: "25-34", label: "25-34" },
    { value: "35-44", label: "35-44" },
    { value: "45-54", label: "45-54" },
    { value: "55+", label: "55+" },
  ],
  features: [
    { value: "search", label: "Search Functionality" },
    { value: "categories", label: "Product Categories" },
    { value: "filters", label: "Filtering Options" },
    { value: "cart", label: "Shopping Cart" },
    { value: "reviews", label: "Customer Reviews" },
    { value: "deals", label: "Deals and Promotions" },
  ],
};

const EXPERIENCE_SCORES = {
  excellent: 5,
  good: 4,
  average: 3,
  poor: 2,
  "very-poor": 1,
};

const buildSingleSelectDistribution = (submissions, fieldName, options) => {
  const counts = Object.fromEntries(options.map((option) => [option.value, 0]));

  for (const submission of submissions) {
    const selectedValue = submission[fieldName];
    if (counts[selectedValue] !== undefined) {
      counts[selectedValue] += 1;
    }
  }

  return options.map((option) => {
    const count = counts[option.value];
    const percent = submissions.length === 0 ? 0 : (count / submissions.length) * 100;

    return {
      ...option,
      count,
      percent,
    };
  });
};

const buildNumericDistribution = (submissions, fieldName, min, max) => {
  const options = Array.from({ length: max - min + 1 }, (_, index) => {
    const value = min + index;
    return { value, label: String(value) };
  });

  const counts = Object.fromEntries(options.map((option) => [option.value, 0]));
  let validResponses = 0;

  for (const submission of submissions) {
    const numericValue = Number(submission[fieldName]);
    if (!Number.isFinite(numericValue) || numericValue < min || numericValue > max) {
      continue;
    }

    validResponses += 1;
    counts[Math.round(numericValue)] += 1;
  }

  return options.map((option) => {
    const count = counts[option.value];
    const percent = validResponses === 0 ? 0 : (count / validResponses) * 100;

    return {
      value: String(option.value),
      label: option.label,
      count,
      percent,
    };
  });
};

const buildTaskBucketDistribution = (submissions) => {
  const buckets = [
    { value: "0-2", label: "0-2" },
    { value: "3-5", label: "3-5" },
    { value: "6-10", label: "6-10" },
    { value: "11+", label: "11+" },
  ];

  const counts = Object.fromEntries(buckets.map((bucket) => [bucket.value, 0]));
  let validResponses = 0;

  for (const submission of submissions) {
    const value = Number(submission.tasksCompleted);
    if (!Number.isFinite(value) || value < 0) {
      continue;
    }

    validResponses += 1;

    if (value <= 2) {
      counts["0-2"] += 1;
      continue;
    }

    if (value <= 5) {
      counts["3-5"] += 1;
      continue;
    }

    if (value <= 10) {
      counts["6-10"] += 1;
      continue;
    }

    counts["11+"] += 1;
  }

  return buckets.map((bucket) => {
    const count = counts[bucket.value];
    const percent = validResponses === 0 ? 0 : (count / validResponses) * 100;

    return {
      ...bucket,
      count,
      percent,
    };
  });
};

const buildRecentDailyDistribution = (submissions, days) => {
  const today = new Date();
  const buckets = [];
  const counts = new Map();

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const day = new Date(today);
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - offset);
    const key = day.toISOString().slice(0, 10);
    const label = day.toLocaleDateString(undefined, { month: "short", day: "numeric" });

    buckets.push({ key, label });
    counts.set(key, 0);
  }

  for (const submission of submissions) {
    const submittedDate = new Date(submission.submittedAt);
    if (Number.isNaN(submittedDate.getTime())) {
      continue;
    }

    submittedDate.setHours(0, 0, 0, 0);
    const key = submittedDate.toISOString().slice(0, 10);
    if (counts.has(key)) {
      counts.set(key, counts.get(key) + 1);
    }
  }

  const maxCount = Math.max(...Array.from(counts.values()), 0);

  return buckets.map((bucket) => {
    const count = counts.get(bucket.key) || 0;
    const percent = maxCount === 0 ? 0 : (count / maxCount) * 100;

    return {
      value: bucket.key,
      label: bucket.label,
      count,
      percent,
    };
  });
};

const buildFeatureDistribution = (submissions, options) => {
  const counts = Object.fromEntries(options.map((option) => [option.value, 0]));

  for (const submission of submissions) {
    const selectedFeatures = new Set(toArray(submission.features));
    for (const feature of selectedFeatures) {
      if (counts[feature] !== undefined) {
        counts[feature] += 1;
      }
    }
  }

  return options.map((option) => {
    const count = counts[option.value];
    const percent = submissions.length === 0 ? 0 : (count / submissions.length) * 100;

    return {
      ...option,
      count,
      percent,
    };
  });
};

const findTopItem = (distribution) => {
  return distribution.reduce(
    (top, current) => (current.count > top.count ? current : top),
    distribution[0] || { count: 0 }
  );
};

const buildAnalyticsData = (submissions) => {
  const experienceDistribution = buildSingleSelectDistribution(
    submissions,
    "experience",
    CHART_OPTIONS.experience
  );
  const navigationDistribution = buildSingleSelectDistribution(
    submissions,
    "navigation",
    CHART_OPTIONS.navigation
  );
  const designDistribution = buildSingleSelectDistribution(
    submissions,
    "design",
    CHART_OPTIONS.design
  );
  const recommendationDistribution = buildSingleSelectDistribution(
    submissions,
    "recommend",
    CHART_OPTIONS.recommend
  );
  const ageGroupDistribution = buildSingleSelectDistribution(
    submissions,
    "ageGroup",
    CHART_OPTIONS.ageGroup
  );
  const featureDistribution = buildFeatureDistribution(submissions, CHART_OPTIONS.features);
  const loadSpeedDistribution = buildNumericDistribution(submissions, "loadSpeedRating", 1, 10);
  const tasksCompletedDistribution = buildTaskBucketDistribution(submissions);
  const responseTimelineDistribution = buildRecentDailyDistribution(submissions, 7);

  const positiveRecommendations = submissions.filter((submission) =>
    ["definitely", "probably"].includes(submission.recommend)
  ).length;

  const totalFeaturesSelected = submissions.reduce((total, submission) => {
    return total + toArray(submission.features).length;
  }, 0);

  const experienceScores = submissions
    .map((submission) => EXPERIENCE_SCORES[submission.experience])
    .filter((score) => Number.isFinite(score));

  const loadSpeedValues = submissions
    .map((submission) => Number(submission.loadSpeedRating))
    .filter((value) => Number.isFinite(value) && value >= 1 && value <= 10);

  const tasksCompletedValues = submissions
    .map((submission) => Number(submission.tasksCompleted))
    .filter((value) => Number.isFinite(value) && value >= 0);

  const averageExperienceScore =
    experienceScores.length === 0
      ? 0
      : experienceScores.reduce((sum, score) => sum + score, 0) / experienceScores.length;

  const averageLoadSpeed =
    loadSpeedValues.length === 0
      ? 0
      : loadSpeedValues.reduce((sum, value) => sum + value, 0) / loadSpeedValues.length;

  const averageTasksCompleted =
    tasksCompletedValues.length === 0
      ? 0
      : tasksCompletedValues.reduce((sum, value) => sum + value, 0) / tasksCompletedValues.length;

  const recentComments = submissions
    .filter((submission) => typeof submission.comments === "string" && submission.comments.trim())
    .sort(
      (a, b) =>
        new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime()
    )
    .slice(0, 5)
    .map((submission) => ({
      comment: submission.comments.trim(),
      submittedAt: submission.submittedAt,
    }));

  const topFeature = findTopItem(featureDistribution);
  const topExperience = findTopItem(experienceDistribution);
  const topAgeGroup = findTopItem(ageGroupDistribution);
  const responses = submissions
    .slice()
    .sort(
      (a, b) =>
        new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime()
    )
    .map((submission) => ({
      id: submission.id,
      fullname: submission.fullname || "",
      email: submission.email || "",
      ageGroup: submission.ageGroup || "",
      experience: submission.experience || "",
      navigation: submission.navigation || "",
      features: toArray(submission.features),
      design: submission.design || "",
      recommend: submission.recommend || "",
      loadSpeedRating: submission.loadSpeedRating || "",
      tasksCompleted: submission.tasksCompleted || "",
      lastVisitDate: submission.lastVisitDate || "",
      comments: submission.comments || "",
      submittedAt: submission.submittedAt,
    }));

  return {
    totals: {
      responses: submissions.length,
      positiveRecommendationRate:
        submissions.length === 0 ? 0 : (positiveRecommendations / submissions.length) * 100,
      averageFeaturesSelected:
        submissions.length === 0 ? 0 : totalFeaturesSelected / submissions.length,
      averageExperienceScore,
      averageLoadSpeed,
      averageTasksCompleted,
    },
    highlights: {
      topFeature:
        topFeature && topFeature.count > 0
          ? { label: topFeature.label, count: topFeature.count }
          : null,
      topExperience:
        topExperience && topExperience.count > 0
          ? { label: topExperience.label, count: topExperience.count }
          : null,
      topAgeGroup:
        topAgeGroup && topAgeGroup.count > 0
          ? { label: topAgeGroup.label, count: topAgeGroup.count }
          : null,
      recentComments,
    },
    charts: {
      experience: experienceDistribution,
      navigation: navigationDistribution,
      design: designDistribution,
      recommend: recommendationDistribution,
      ageGroup: ageGroupDistribution,
      loadSpeed: loadSpeedDistribution,
      tasksCompleted: tasksCompletedDistribution,
      responseTimeline: responseTimelineDistribution,
      features: featureDistribution,
    },
    responses,
    generatedAt: new Date().toISOString(),
  };
};

const getResponsesAnalytics = async (req, res) => {
  try {
    const submissions = await readSubmissions();
    const analyticsData = buildAnalyticsData(submissions);
    res.json(analyticsData);
  } catch (error) {
    console.error("Failed to build analytics data:", error);
    res.status(500).json({ message: "Failed to load analytics data." });
  }
};

module.exports = {
  getResponsesAnalytics,
};
