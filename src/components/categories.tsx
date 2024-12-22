import React from "react";
import {
  Laptop,
  Lightbulb,
  Gamepad,
  DollarSign,
  Image,
  TrendingUp,
  HelpCircle,
  XIcon,
  ArrowDownUp,
} from "lucide-react";
import { Button } from "./ui/button";
import { useRouter, useSearchParams } from "next/navigation";

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

const categoryDetails: Record<string, { icon: JSX.Element }> = {
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
};

export const Categories = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedCategory = searchParams.get("tag");

  const handleCategoryClick = (category: string) => {
    const params = new URLSearchParams(searchParams);

    if (category === selectedCategory) {
      params.delete("tag");
    } else {
      params.set("tag", category);
    }

    // Reset to page 1 when changing categories
    params.set("page", "1");

    // Create new URLSearchParams with desired order
    const orderedParams = new URLSearchParams();

    // Set tag first if it exists
    if (params.has("tag")) {
      orderedParams.set("tag", params.get("tag")!);
    }

    // Set page second
    if (params.has("page")) {
      orderedParams.set("page", params.get("page")!);
    }

    // Use router.replace with ordered parameters
    router.replace(`/?${orderedParams.toString()}`, { scroll: false });
  };

  return (
    <div className="flex flex-wrap space-x-2">
      {categories.map((category) => {
        const { icon } = categoryDetails[category] || {
          icon: <HelpCircle size={16} />,
        };
        const isActive = category === selectedCategory;
        return (
          <Button
            key={category}
            className={`flex items-center px-3 py-1 rounded-lg text-sm shadow ${
              isActive
                ? "bg-blue-500 hover:bg-sky-600 text-white"
                : "bg-white hover:bg-gray-100 text-black"
            }`}
            onClick={() => handleCategoryClick(category)}
          >
            {icon}
            <span className="mr-1">{category}</span>
            {isActive && <XIcon size={12} />}
          </Button>
        );
      })}
    </div>
  );
};
