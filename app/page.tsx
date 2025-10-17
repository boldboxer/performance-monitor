import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <Image
          className="dark:invert"
          src="/globe.svg"
          alt="Custom logo"
          width={180}
          height={38}
          priority
        />
        <h1 className="text-2xl font-bold">Student Performance Dashboard</h1>
        <Link
          href="/students"
          className="text-blue-600 hover:underline mt-4 block"
        >
          → Go to Student List
        </Link>
      </main>
    </div>
  );
}
