import skinImg from "../assets/skin care course.png";
import shopifyOnlineImg from "../assets/shopify masterclass course.png";
import englishOnlineImg from "../assets/english speaking course.png";

export const onlineCourses = [
  {
    id: "yt-automation-online",
    image: skinImg,
    title: "Skin Care Formulation: Complete Guide to Creating Skincare Products",
    excerpt:
      "Master the science of Skincare Formulation! This comprehensive online course teaches you the complete process of creating your own safe, stable, and effective cosmetics, from beginner basics to advanced anti-aging serums.",
    price: "Rs. 13,000",
    badge: { label: "Premium • Online", color: "bg-[#5022C3] text-white" },
    rating: 4.7,
    ratingCount: "1,420 ratings",
    language: "Urdu / Hindi (Online)",
    whatYouWillLearn: [
      "Build a complete skincare brand from concept to launch",
      "Use for formulation, testing, and packaging",
      "Understand regulations, safety, and long-term brand scaling",
    ],
    includes: [
      "Lifetime access to all recorded video lectures (HD Quality)",
      "Downloadable professional formula templates and batch records",
      "Curated list of trusted Asian-region ingredient suppliers",
      "Hands-on practical assignments and stability testing guides",
      "Official Certificate of Completion (Digital)"
    ],
    fullDescription: [
      "This comprehensive online course is the ultimate guide to cosmetic formulation, designed for aspiring entrepreneurs and enthusiasts across Asia. You will move past simple DIY recipes and master the professional principles of cosmetic chemistry, allowing you to create customized, market-ready skincare products. The curriculum includes detailed modules on ingredient functionality, preservation systems, stability testing, and the specific needs of diverse Asian skin types, ensuring your formulations are not only effective but also safe and professional.",
      "The course emphasizes practical application, providing step-by-step guidance on creating everything from hydrating toners and anti-aging serums to stable face creams, all while adhering to industry-standard safety and quality controls (GMP).",
    ],
    requirements: [
      "A basic understanding of English (The language of instruction is simple English).",
      "Stable internet access to view video content.",
      "A digital scale (preferably $0.01\text{g}$ precision) for accurate weighing.",
      "Willingness to complete hands-on formulation exercises.",
    ],
  },
  {
    id: "english-online",
    image: englishOnlineImg,
    title: "English Speaking (Online): From Shy to Confident in few days",
    excerpt:
      "Join online English speaking classes focused on real conversations, confidence-building and practical communication for Pakistani students and professionals.",
    price: "Rs. 5,000",
    badge: {
      label: "Online • Live Speaking Practice",
      color: "bg-[#FFD1CE] text-[#b32d36]",
    },
    rating: 4.5,
    ratingCount: "2,050 ratings",
    language: "Urdu / English (Online)",
    whatYouWillLearn: [
      "Speak English more confidently in everyday situations",
      "Improve grammar, sentence structure and vocabulary in a natural way",
      "Practice real conversations for interviews, meetings and presentations",
      "Remove fear of speaking English through guided live practice",
    ],
    includes: [
      "Online live speaking sessions",
      "Practice groups and role-plays",
      "Worksheets and vocabulary lists",
      "Certificate of completion from Spark Trainings",
    ],
    fullDescription: [
      "English Speaking (Online) is a live, highly practical course designed for Pakistani learners who understand English but hesitate to speak.",
      "The focus is not on complicated grammar theory, but on real speaking practice through conversations, role-plays and daily life scenarios.",
      "You will speak in almost every class, get corrections, build confidence and develop a natural flow while talking in English in front of others.",
    ],
    requirements: [
      "Basic English reading comprehension",
      "Smartphone or laptop with internet",
      "Headphones and mic for online classes",
      "Willingness to speak and participate actively",
    ],
  },  
  {
    id: "shopify-online",
    image: shopifyOnlineImg,
    title: "Shopify Dropshipping (Online): Start Your Store in 40 Days",
    excerpt:
      "Learn how to launch and manage a profitable Shopify dropshipping store with practical, online training designed for Pakistani sellers.",
    price: "Rs. 18,000",
    badge: {
      label: "Online • Beginner Friendly",
      color: "bg-[#5022C3] text-white",
    },
    rating: 4.6,
    ratingCount: "980 ratings",
    language: "Urdu / Hindi (Online)",
    whatYouWillLearn: [
      "Set up a complete Shopify store from scratch",
      "Choose products, structure collections and write converting descriptions",
      "Understand payment gateways, shipping and store optimization",
      "Learn a clear launch plan for Pakistani and international markets",
      "Checklists, templates and resources",
    ],
    includes: [
      "Online live sessions with instructor",
      "Store-building walkthroughs",
      "Checklists, templates and resources",
      "Certificate of completion from Spark Trainings",
    ],
    fullDescription: [
      "This online Shopify Masterclass is for anyone in Pakistan who wants to start an eCommerce brand but doesn’t know where to begin.",
      "You will learn how to configure your store, pick the right products, structure pages, and prepare your brand for advertising later. The focus is on strong foundations: clean design, trust-building elements, and a simple user experience.",
      "All classes are conducted online so you can join from any city. You’ll also receive assignments to implement each step directly in your own store as you learn.",
    ],
    requirements: [
      "Basic computer and internet skills",
      "A laptop or PC for Shopify setup",
      "No previous Shopify experience required",
      "Willingness to follow the step-by-step process",
    ],
  },
];
