import { RealTimeProvider } from "./components/RealTimeProvider";
import PledgeForm from "./components/PledgeForm";
import PledgeWidget from "./components/PledgeWidget";   // <-- added
import { Metadata } from "next";

type CampaignInfo = {
  title: string;
  description: string;
  themeColor?: string;
};

const campaigns: Record<string, CampaignInfo> = {
  default: {
    title: "Zimmerman Pledge Tracker",
    description: "Support our community by pledging food items.",
    themeColor: "blue",
  },
  campmeeting: {
    title: "Camp Meeting 2025 – Pledge Drive",
    description: "Help us provide meals and supplies for our annual camp meeting.",
    themeColor: "green",
  },
  children: {
    title: "Children's Ministry – Supply Pledge",
    description: "Support our children's programs with food and materials.",
    themeColor: "yellow",
  },
  youth: {
    title: "Youth Retreat Pledge",
    description: "Empower our youth events with your generous pledges.",
    themeColor: "purple",
  },
};

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ campaign?: string }>;
}): Promise<Metadata> {
  const { campaign } = await searchParams;
  const info = campaign && campaigns[campaign] ? campaigns[campaign] : campaigns.default;
  return {
    title: info.title,
    description: info.description,
    openGraph: {
      title: info.title,
      description: info.description,
      type: "website",
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

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <h1 className={`text-3xl font-bold mb-2 text-${info.themeColor}-600`}>
            {info.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">{info.description}</p>
        </div>
        <RealTimeProvider>
          <PledgeForm />
          {/* Added PledgeWidget below the form for extra engagement */}
          <div className="mt-8">
            <PledgeWidget />
          </div>
        </RealTimeProvider>
      </div>
    </main>
  );
}