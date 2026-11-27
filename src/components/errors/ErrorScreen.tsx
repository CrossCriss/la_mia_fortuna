import Link from "next/link";

interface ErrorScreenProps {
  title: string;
  text: string;
  action?: React.ReactNode;
}

const buttonClass =
  "inline-flex h-12 items-center justify-center border border-ink bg-ink px-6 text-sm font-medium text-background transition-opacity hover:opacity-90";

export function ErrorScreen({ title, text, action }: ErrorScreenProps) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-20 text-center md:py-28">
      <h1 className="font-display text-[44px] font-semibold leading-[1.02] text-ink md:text-[56px]">
        {title}
      </h1>
      <p className="mt-5 text-[15px] leading-relaxed text-ink-soft md:text-base">{text}</p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        {action}
        <Link href="/catalog" className={buttonClass}>
          До каталогу
        </Link>
        <Link href="/" className={buttonClass}>
          На головну
        </Link>
      </div>
    </div>
  );
}
