import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaTrigger,
} from "@/components/ui/credenza";
import { Info } from "lucide-react";

const faqItems = [
  {
    question: "What is Telescope?",
    answer:
      "Isbjorn's discovery world for projects, artists, and developers. Find who is building, argue what is worth building next, publish research, and compete in seasons — with polar bear and Arctic conservation as the reason behind it.",
  },
  {
    question: "What do I do?",
    answer:
      "Talk on the forum, enter research bounties, pin what you are building on the projects board, or compete in tournaments. Posting stays one tap.",
  },
  {
    question: "What is XP for?",
    answer:
      "XP tracks participation — voting streaks, spotlights, and season activity. Season rewards and shop claims use it; the deeper prize is standing earned through research, design, and shipped work.",
  },
  {
    question: "How can I redeem points?",
    answer:
      "Connect your wallet, click 'Collect rewards' and open the #collect channel on our Discord.",
  },
  {
    question: "Can I use multiple wallets to vote?",
    answer:
      "Yes, but only one wallet can connect with your Discord account to redeem rewards.",
  },
  {
    question: "Where does conservation come in?",
    answer:
      "Isbjorn funds Arctic missions — Churchill, Svalbard, and beyond. Every season on Telescope maps toward that journey.",
  },
];

export const FAQ = () => {
  return (
    <Credenza>
      <CredenzaTrigger asChild>
        <button className="flex items-center gap-2 bg-white dark:bg-zinc-800 rounded-lg p-2 shadow hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors">
          <Info size={20} />
          <span className="mobile-menu-text">Info / FAQ</span>
        </button>
      </CredenzaTrigger>
      <CredenzaContent>
        <CredenzaHeader>
          <CredenzaTitle className="text-xl">FAQ</CredenzaTitle>
        </CredenzaHeader>
        <CredenzaBody className="rounded-md flex flex-col gap-4">
          {faqItems.map((item, index) => (
            <div key={index}>
              <h3 className="text-lg font-semibold text-sky-900 dark:text-sky-400">
                {item.question}
              </h3>
              <p className="text-zinc-900 dark:text-zinc-100">{item.answer}</p>
            </div>
          ))}
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  );
};
