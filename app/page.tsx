import { RealTimeProvider } from "./components/RealTimeProvider";
import PledgeForm from "./components/PledgeForm";

export default function HomePage() {
  return (
    <RealTimeProvider>
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-2">Zimmerman Pledge Tracker</h1>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
            Support our community by pledging food items
          </p>
          <PledgeForm />
        </div>
      </main>
    </RealTimeProvider>
  );
}