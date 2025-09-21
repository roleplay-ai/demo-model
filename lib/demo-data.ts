import type { DemoScenario } from "./demo-types"

export const getDemoScenarios = (): DemoScenario[] => [
  {
    id: "job-interview",
    name: "Job Interview Practice",
    description: "Practice answering common interview questions with confidence and clarity",
    detailedDescription:
      "This scenario simulates a typical job interview where you'll be asked behavioral and technical questions. Focus on clear communication, confidence, and providing specific examples using the STAR method (Situation, Task, Action, Result).",
    difficulty: 2,
    estimatedDuration: 5,
    tags: ["interview", "career", "communication"],
    agentConfig: {
      male: {
        name: "Michael Chen",
        avatar: "/professional-male-interviewer.jpg",
      },
      female: {
        name: "Sarah Johnson",
        avatar: "/professional-female-interviewer.jpg",
      },
    },
    rubric: {
      categories: [
        { name: "Clarity", weight: 1.2 },
        { name: "Confidence", weight: 1.0 },
        { name: "Structure", weight: 1.1 },
        { name: "Relevance", weight: 1.0 },
      ],
    },
  },
  {
    id: "sales-pitch",
    name: "Sales Pitch Practice",
    description: "Perfect your sales presentation and objection handling skills",
    detailedDescription:
      "Practice delivering a compelling sales pitch and handling common objections. Focus on persuasion, active listening, building rapport, and clearly communicating value propositions to potential customers.",
    difficulty: 3,
    estimatedDuration: 7,
    tags: ["sales", "persuasion", "business"],
    agentConfig: {
      male: {
        name: "David Rodriguez",
        avatar: "/business-male-executive.jpg",
      },
      female: {
        name: "Emma Thompson",
        avatar: "/business-female-executive.jpg",
      },
    },
    rubric: {
      categories: [
        { name: "Persuasion", weight: 1.3 },
        { name: "Clarity", weight: 1.0 },
        { name: "Engagement", weight: 1.1 },
        { name: "Objection Handling", weight: 1.2 },
      ],
    },
  },
  {
    id: "presentation-skills",
    name: "Presentation Skills",
    description: "Improve your public speaking and presentation delivery",
    detailedDescription:
      "Practice delivering a short presentation with clear structure, engaging delivery, and confident presence. Work on your storytelling, visual communication, and audience engagement techniques.",
    difficulty: 2,
    estimatedDuration: 6,
    tags: ["presentation", "public-speaking", "leadership"],
    agentConfig: {
      male: {
        name: "James Wilson",
        avatar: "/professional-male-presenter.jpg",
      },
      female: {
        name: "Lisa Park",
        avatar: "/professional-female-presenter.jpg",
      },
    },
    rubric: {
      categories: [
        { name: "Delivery", weight: 1.2 },
        { name: "Structure", weight: 1.1 },
        { name: "Engagement", weight: 1.0 },
        { name: "Confidence", weight: 1.0 },
      ],
    },
  },
  {
    id: "customer-service",
    name: "Customer Service",
    description: "Handle difficult customer situations with empathy and professionalism",
    detailedDescription:
      "Practice managing challenging customer interactions, de-escalating conflicts, and finding solutions while maintaining a positive and professional demeanor throughout the conversation.",
    difficulty: 2,
    estimatedDuration: 4,
    tags: ["customer-service", "empathy", "problem-solving"],
    agentConfig: {
      male: {
        name: "Robert Kim",
        avatar: "/customer-service-male-representative.jpg",
      },
      female: {
        name: "Maria Garcia",
        avatar: "/customer-service-female-representative.jpg",
      },
    },
    rubric: {
      categories: [
        { name: "Empathy", weight: 1.3 },
        { name: "Problem Solving", weight: 1.1 },
        { name: "Professionalism", weight: 1.0 },
        { name: "Communication", weight: 1.0 },
      ],
    },
  },
]

// Mock function to simulate saving lead data
export const saveDemoLead = async (leadData: any): Promise<void> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500))
  console.log("Demo lead saved:", leadData)
}

// Mock function to generate session report
export const generateMockReport = (scenario: DemoScenario, duration: number) => {
  const baseScore = 75 + Math.random() * 20 // Random score between 75-95

  const categoryScores = scenario.rubric.categories.map((category) => ({
    category: category.name,
    score: Math.round(baseScore + (Math.random() - 0.5) * 15), // Vary by ±7.5 points
    feedback: getMockFeedback(category.name),
  }))

  const overallScore = Math.round(
    categoryScores.reduce((sum, cat, index) => sum + cat.score * scenario.rubric.categories[index].weight, 0) /
      scenario.rubric.categories.reduce((sum, cat) => sum + cat.weight, 0),
  )

  return {
    overallScore,
    categoryScores,
    improvements: getMockImprovements(scenario.id),
    strengths: getMockStrengths(scenario.id),
  }
}

const getMockFeedback = (category: string): string => {
  const feedbackMap: Record<string, string[]> = {
    Clarity: [
      "Your explanations were clear and easy to follow",
      "Consider using more specific examples to illustrate your points",
      "Good use of structured responses",
    ],
    Confidence: [
      "You demonstrated strong confidence throughout the conversation",
      "Your voice tone conveyed authority and self-assurance",
      "Consider reducing filler words to sound more confident",
    ],
    Structure: [
      "Well-organized responses with logical flow",
      "Good use of the STAR method in your examples",
      "Consider adding stronger opening and closing statements",
    ],
    Persuasion: [
      "Compelling arguments that addressed key pain points",
      "Effective use of social proof and testimonials",
      "Consider asking more discovery questions",
    ],
    Engagement: [
      "Great energy and enthusiasm throughout",
      "Good use of storytelling to maintain interest",
      "Consider incorporating more interactive elements",
    ],
  }

  const options = feedbackMap[category] || ["Good performance in this area"]
  return options[Math.floor(Math.random() * options.length)]
}

const getMockImprovements = (scenarioId: string): string[] => {
  const improvementMap: Record<string, string[]> = {
    "job-interview": [
      "Practice the STAR method for behavioral questions",
      "Research the company more thoroughly before interviews",
      "Prepare 2-3 thoughtful questions about the role",
    ],
    "sales-pitch": [
      "Ask more discovery questions to understand customer needs",
      "Practice handling price objections with value-based responses",
      "Develop stronger opening hooks to capture attention",
    ],
    "presentation-skills": [
      "Use more varied vocal inflection to maintain engagement",
      "Practice smooth transitions between key points",
      "Incorporate more audience interaction opportunities",
    ],
    "customer-service": [
      "Practice active listening techniques",
      "Develop a wider range of de-escalation strategies",
      "Learn to summarize customer concerns more effectively",
    ],
  }

  return improvementMap[scenarioId] || ["Continue practicing to build confidence"]
}

const getMockStrengths = (scenarioId: string): string[] => {
  const strengthMap: Record<string, string[]> = {
    "job-interview": [
      "Clear and concise communication style",
      "Strong examples that demonstrate your experience",
      "Professional demeanor throughout the conversation",
    ],
    "sales-pitch": [
      "Confident presentation of key benefits",
      "Good rapport building with the prospect",
      "Effective use of social proof",
    ],
    "presentation-skills": [
      "Engaging storytelling approach",
      "Clear structure with logical flow",
      "Confident delivery and strong presence",
    ],
    "customer-service": [
      "Empathetic and understanding tone",
      "Professional approach to problem-solving",
      "Patient and thorough in explanations",
    ],
  }

  return strengthMap[scenarioId] || ["Good overall communication skills"]
}

// Mock transcript data
export const generateMockTranscript = (scenario: DemoScenario, duration: number) => {
  const segments = [
    {
      id: "1",
      speaker: "agent" as const,
      text: `Hello! I'm ${scenario.agentConfig.female.name}. I'm excited to help you practice your ${scenario.name.toLowerCase()} skills today. Are you ready to begin?`,
      timestamp: 0,
      confidence: 0.95,
    },
    {
      id: "2",
      speaker: "user" as const,
      text: "Yes, I'm ready. Thank you for this opportunity to practice.",
      timestamp: 5000,
      confidence: 0.92,
    },
    {
      id: "3",
      speaker: "agent" as const,
      text: getScenarioSpecificQuestion(scenario.id),
      timestamp: 8000,
      confidence: 0.96,
    },
    {
      id: "4",
      speaker: "user" as const,
      text: getScenarioSpecificResponse(scenario.id),
      timestamp: 15000,
      confidence: 0.89,
    },
  ]

  return segments
}

const getScenarioSpecificQuestion = (scenarioId: string): string => {
  const questions: Record<string, string> = {
    "job-interview":
      "Great! Let's start with a common question: Can you tell me about a time when you faced a significant challenge at work and how you overcame it?",
    "sales-pitch":
      "Perfect! I'm interested in learning more about your product. Can you walk me through what makes it unique in the market?",
    "presentation-skills":
      "Excellent! I'd like you to present your topic as if I'm your target audience. Please begin with your opening statement.",
    "customer-service":
      "Thank you. I'm calling because I'm having an issue with my recent order and I'm quite frustrated about it. Can you help me?",
  }

  return questions[scenarioId] || "Let's begin with your presentation."
}

const getScenarioSpecificResponse = (scenarioId: string): string => {
  const responses: Record<string, string> = {
    "job-interview":
      "Absolutely. In my previous role as a project manager, we faced a critical deadline when our main developer left unexpectedly. I quickly assessed our resources, redistributed tasks among the team, and brought in a freelance developer. We delivered the project on time and actually improved our process documentation.",
    "sales-pitch":
      "Thank you for your interest! Our product stands out because it combines AI-powered analytics with an intuitive user interface. Unlike competitors who focus on just data collection, we provide actionable insights that help businesses make decisions 40% faster.",
    "presentation-skills":
      "Good morning everyone. Today I want to share how small changes in our daily communication can lead to extraordinary results. Imagine if every conversation you had could build stronger relationships and drive better outcomes.",
    "customer-service":
      "I completely understand your frustration, and I sincerely apologize for the inconvenience with your order. Let me look into this right away and find the best solution for you. Can you please provide me with your order number?",
  }

  return responses[scenarioId] || "I'm excited to share my thoughts on this topic."
}
