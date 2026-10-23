import { RealTimeProvider } from "./components/RealTimeProvider";
import PledgeForm from "./components/PledgeForm";
import DateTimeDisplay from "./components/DateTimeDisplay";
import { Metadata } from "next";

type CampaignInfo = {
  title: string;
  description: string;
  themeColor: string;
  image?: string;
};

const campaigns: Record<string, CampaignInfo> = {
  default: {
    title: "Zimmerman Pledge Tracker",
    description: "Support our community by pledging food items, cash, or supplies.",
    themeColor: "blue",
    image: "/og-default.jpg",
  },
  campmeeting: {
    title: "Camp Meeting 2025 – Pledge Drive",
    description: "Help us provide meals and supplies for our annual camp meeting.",
    themeColor: "green",
    image: "/og-campmeeting.jpg",
  },
  children: {
    title: "Children's Ministry – Supply Pledge",
    description: "Support our children's programs with food and materials.",
    themeColor: "yellow",
    image: "/og-children.jpg",
  },
  youth: {
    title: "Youth Retreat Pledge",
    description: "Empower our youth events with your generous pledges.",
    themeColor: "purple",
    image: "/og-youth.jpg",
  },
};

// ✨ ADDED DARK MODE CLASSES TO THE COLOR MAP ✨
const colorClassMap: Record<string, string> = {
  blue: "text-blue-600 dark:text-blue-400",
  green: "text-green-600 dark:text-green-400",
  yellow: "text-yellow-600 dark:text-yellow-400",
  purple: "text-purple-600 dark:text-purple-400",
};

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ campaign?: string }>;
}): Promise<Metadata> {
  const { campaign } = await searchParams;
  const info = campaign && campaigns[campaign] ? campaigns[campaign] : campaigns.default;
  
  const baseUrl = "https://vbs-red.vercel.app";
  const campaignParam = campaign ? `?campaign=${campaign}` : "";
  
  return {
    title: info.title,
    description: info.description,
    openGraph: {
      title: info.title,
      description: info.description,
      url: `${baseUrl}${campaignParam}`,
      images: info.image ? [{ url: info.image }] : undefined,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: info.title,
      description: info.description,
      images: info.image ? [info.image] : undefined,
    },
  };
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ campaign?: string }>;
}) {
  const { campaign } = await searchParams;
  const info = campaign && campaigns[campaign] ? campaigns[campaign] : campaigns.default;
  const titleColorClass = colorClassMap[info.themeColor] || "text-blue-600 dark:text-blue-400";

  return (
    // ✨ REMOVED min-h-screen & bg classes TO LET THE LAYOUT HANDLE IT ✨
    <div className="w-full flex-1 py-6 px-4 sm:py-10 sm:px-6">
      <div className="max-w-2xl mx-auto">
        {/* Header with date/time */}
        <div className="text-center mb-8">
          <h1 className={`text-2xl sm:text-3xl font-bold mb-2 ${titleColorClass}`}>
            {info.title}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            {info.description}
          </p>
          <DateTimeDisplay />
        </div>

        <RealTimeProvider>
          <PledgeForm />
        </RealTimeProvider>

                {/* Payment Details Footer */}
        <div className="mt-8 p-5 bg-blue-50 dark:bg-blue-950 rounded-xl text-center border border-blue-200 dark:border-blue-900 shadow-sm transition-colors duration-300">
          <p className="font-bold text-gray-800 dark:text-blue-100 text-base mb-2">
            💰 Payment Details (for cash pledges)
          </p>
          <div className="text-gray-700 dark:text-gray-300 flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-4">
            <span>
              Paybill: <strong className="text-blue-700 dark:text-blue-400 text-lg font-bold tracking-wide">4029285</strong>
            </span>
            <span className="hidden sm:inline text-gray-400 dark:text-gray-600">|</span>
            <span>
              Account: <strong className="text-blue-700 dark:text-blue-400 text-lg font-bold tracking-wide">Mission2026</strong>
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
            After pledging, complete M‑Pesa payment. Admin will mark as paid.
          </p>
        </div>
      </div>
    </div>
  );
}