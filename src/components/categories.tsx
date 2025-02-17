"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "./ui/button";
import { XIcon, PlusIcon } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";

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

export const Categories = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedCategory = searchParams.get("tag");
  const [isExpanded, setIsExpanded] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const handleCategoryClick = (category: string) => {
    const params = new URLSearchParams(searchParams);
    const currentTab = window.location.hash.replace('#', '') || 'projects';

    if (category === selectedCategory) {
      params.delete("tag");
    } else {
      params.set("tag", category);
    }

    // Update the URL based on current tab
    router.replace(`/?${params.toString()}#${currentTab}`, { scroll: false });
  };

  const visibleCategories =
    isDesktop || isExpanded ? categories : categories.slice(0, 3);

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {visibleCategories.map((category) => {
        const { icon } = categoryDetails[category];
        const isActive = category === selectedCategory;
        return (
          <Button
            key={category}
            variant={isActive ? "default" : "outline"}
            className="flex items-center gap-1 px-3 py-1 text-sm"
            onClick={() => handleCategoryClick(category)}
          >
            {icon}
            <span>{category}</span>
            {isActive && <XIcon size={12} />}
          </Button>
        );
      })}
      {!isDesktop && !isExpanded && categories.length > 3 && (
        <Button
          variant="outline"
          className="flex items-center gap-1 px-3 py-1 text-sm"
          onClick={() => setIsExpanded(true)}
        >
          <PlusIcon size={16} />
          <span>{categories.length - 3} more</span>
        </Button>
      )}
    </div>
  );
};
