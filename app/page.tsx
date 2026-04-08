import { RealTimeProvider } from "./components/RealTimeProvider";
import PledgeForm from "./components/PledgeForm";
import PledgeWidget from "./components/PledgeWidget";
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

const colorClassMap: Record<string, string> = {
  blue: "text-blue-600",
  green: "text-green-600",
  yellow: "text-yellow-600",
  purple: "text-purple-600",
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
  const titleColorClass = colorClassMap[info.themeColor] || "text-blue-600";

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <h1 className={`text-3xl font-bold mb-2 ${titleColorClass}`}>
            {info.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">{info.description}</p>
        </div>
        <RealTimeProvider>
          <PledgeForm />
          <div className="mt-8">
            <PledgeWidget />
          </div>
        </RealTimeProvider>
      </div>
    </main>
  );
}