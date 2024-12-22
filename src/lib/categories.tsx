import {
  ArrowDownUp,
  Laptop,
  Lightbulb,
  Gamepad,
  DollarSign,
  Image,
  TrendingUp,
  HelpCircle,
} from "lucide-react";

export const categories = [
  "DEX",
  "Good Tech",
  "Alpha",
  "Gaming",
  "Finance",
  "NFT",
  "Yield",
  "404s",
] as const;

export type Category = (typeof categories)[number];

export const categoryDetails: Record<Category, { icon: JSX.Element }> = {
  DEX: {
    icon: <ArrowDownUp size={16} />,
  },
  "Good Tech": {
    icon: <Laptop size={16} />,
  },
  Alpha: {
    icon: <Lightbulb size={16} />,
  },
  Gaming: {
    icon: <Gamepad size={16} />,
  },
  Finance: {
    icon: <DollarSign size={16} />,
  },
  NFT: {
    icon: <Image size={16} />,
  },
  Yield: {
    icon: <TrendingUp size={16} />,
  },
  "404s": {
    icon: <HelpCircle size={16} />,
  },
} as const;
