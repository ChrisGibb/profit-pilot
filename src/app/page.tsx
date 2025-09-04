
import { ProjectView } from "@/components/profit-calculator";
import { Logo } from "@/components/logo";

export default function Home() {
  return (
    <main className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="text-center mb-12 flex flex-col items-center">
        <Logo className="w-64 h-auto" />
        <p className="mt-4 text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
          A financial modeling tool for e-commerce managers, digital marketers, and business owners.
        </p>
      </div>
      <ProjectView />
    </main>
  );
}
