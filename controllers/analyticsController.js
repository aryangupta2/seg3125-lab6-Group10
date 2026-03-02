const { toArray, readSubmissions } = require("../services/submissionService");

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
  const featureDistribution = buildFeatureDistribution(submissions, CHART_OPTIONS.features);

  const positiveRecommendations = submissions.filter((submission) =>
    ["definitely", "probably"].includes(submission.recommend)
  ).length;

  const totalFeaturesSelected = submissions.reduce((total, submission) => {
    return total + toArray(submission.features).length;
  }, 0);

  const experienceScores = submissions
    .map((submission) => EXPERIENCE_SCORES[submission.experience])
    .filter((score) => Number.isFinite(score));

  const averageExperienceScore =
    experienceScores.length === 0
      ? 0
      : experienceScores.reduce((sum, score) => sum + score, 0) / experienceScores.length;

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

  return {
    totals: {
      responses: submissions.length,
      positiveRecommendationRate:
        submissions.length === 0 ? 0 : (positiveRecommendations / submissions.length) * 100,
      averageFeaturesSelected:
        submissions.length === 0 ? 0 : totalFeaturesSelected / submissions.length,
      averageExperienceScore,
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
      recentComments,
    },
    charts: {
      experience: experienceDistribution,
      navigation: navigationDistribution,
      design: designDistribution,
      recommend: recommendationDistribution,
      features: featureDistribution,
    },
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
