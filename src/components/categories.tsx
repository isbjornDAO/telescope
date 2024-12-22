import React from "react";
import {
  ArrowUpRight,
  Laptop,
  Lightbulb,
  Gamepad,
  DollarSign,
  Image,
  TrendingUp,
  HelpCircle,
} from "lucide-react";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";

const categories = [
  "DEX",
  "Good Tech",
  "Alpha",
  "Gaming",
  "Finance",
  "NFT",
  "Yield",
  "404s",
];

const categoryDetails: Record<string, { bgClass: string; icon: JSX.Element }> =
  {
    DEX: {
      bgClass: "bg-sky-500 hover:bg-sky-400",
      icon: <ArrowUpRight size={16} />,
    },
    "Good Tech": {
      bgClass: "bg-emerald-500 hover:bg-emerald-400",
      icon: <Laptop size={16} />,
    },
    Alpha: {
      bgClass: "bg-purple-500 hover:bg-purple-400",
      icon: <Lightbulb size={16} />,
    },
    Gaming: {
      bgClass: "bg-red-500 hover:bg-red-400",
      icon: <Gamepad size={16} />,
    },
    Finance: {
      bgClass: "bg-teal-500 hover:bg-teal-400",
      icon: <DollarSign size={16} />,
    },
    NFT: {
      bgClass: "bg-pink-500 hover:bg-pink-400",
      icon: <Image size={16} />,
    },
    Yield: {
      bgClass: "bg-orange-500 hover:bg-orange-400",
      icon: <TrendingUp size={16} />,
    },
    "404s": {
      bgClass: "bg-gray-500 hover:bg-gray-400",
      icon: <HelpCircle size={16} />,
    },
  };

export const Categories = () => {
  const router = useRouter();
  const searchParams = new URLSearchParams(window.location.search);
  const selectedCategory = searchParams.get("tag");

  const handleCategoryClick = (category: string) => {
    if (category === selectedCategory) {
      searchParams.delete("tag");
    } else {
      searchParams.set("tag", category);
    }
    router.push(`/?${searchParams.toString()}`);
  };

  return (
    <div className="flex flex-wrap space-x-2">
      {categories.map((category) => {
        const { bgClass, icon } = categoryDetails[category] || {
          bgClass: "bg-gray-500 hover:bg-gray-400",
          icon: <HelpCircle size={16} />,
        };
        const isActive = category === selectedCategory;
        return (
          <Button
            key={category}
            className={`flex items-center px-3 py-1 rounded-lg ${bgClass} text-black text-sm shadow ${
              isActive ? "border-2 border-black" : ""
            }`}
            onClick={() => handleCategoryClick(category)}
          >
            {icon}
            <span>{category}</span>
          </Button>
        );
      })}
    </div>
  );
};
