import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function ThankYouPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-3xl font-bold text-zinc-900">Payment successful</h1>
      <p className="text-zinc-600">Your custom case order has been received.</p>
      <Link href="/" className={buttonVariants()}>
        Back to home
      </Link>
    </div>
  );
}
