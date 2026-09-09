"use client";

import { PageNavigation } from "@/components/page-navigation";
import { Card } from "@/components/ui/card";
import { ExternalLink, Instagram, Twitter } from "lucide-react";

export default function ArtistsPage() {
  const artists = [
    {
      name: "Ly (SOPESGAL)",
      image: "https://sopesgal-art.carrd.co/assets/images/image01.jpg",
      bio: "Pixel artist creating detailed illustrations with a unique blend of dark aesthetics and kawaii charm.",
      style: "Pixel Art",
      specialties: ["Anime Characters", "Gaming Art", "NFT Collections", "Commission Work"],
      website: "https://sopesgal-art.carrd.co/",
      social: {
        twitter: "@sopesgal",
        instagram: "@sopeagal.art"
      },
      featured: "Noir Nymphs NFT Collection, Scarlet Waifu Capital Management",
      quote: "I do pixel art.🔺"
    },
    {
      name: "Frogwell",
      image: "https://cdn.myportfolio.com/09357e92-1a86-4105-9a77-5fd2e0472d1b/92b0576d-695b-4c11-9a93-0c7cb0760390_rw_1920.jpg?h=4b7acd84a55b8adb4bed7916802070ab",
      bio: "Filipino-Japanese artist based in Bangkok with 7+ years of professional experience in product development and design.",
      style: "Lofi Aesthetic",
      specialties: ["Custom Commissions", "Lofi Beats Artwork", "Product Design", "Project Management"],
      website: "https://frogwell.art/",
      social: {
        twitter: "@Memofrogwell",
        instagram: "@frogwell_san"
      },
      featured: "LoFi Beats Project (2022), HCSociety Custom Art",
      location: "Bangkok, Thailand"
    },
    {
      name: "Virk Pontelli",
      image: "https://ugc.production.linktr.ee/T6qNiKmxSdqaAH0e1XhQ_33E481jTFuW56T8B",
      bio: "Digital artist exploring creative boundaries through vibrant illustrations and character design.",
      style: "Digital Illustration",
      specialties: ["Character Design", "Digital Art", "Illustration"],
      website: "https://linktr.ee/virkkk",
      social: {},
      featured: "Active in the AVAX art community"
    },
    {
      name: "Aline Subi",
      image: "https://static.wixstatic.com/media/ab0adc_0487cc7ff4fd49c0abb53f46b86f523b~mv2.jpg/v1/fit/w_965,h_797,q_90,enc_avif,quality_auto/ab0adc_0487cc7ff4fd49c0abb53f46b86f523b~mv2.jpg",
      bio: "Contemporary artist bringing unique vision and creativity to the digital art space.",
      style: "Contemporary Digital Art",
      specialties: ["Digital Art", "Contemporary Illustration"],
      website: "https://www.alinesubi.xyz/",
      social: {},
      featured: "Portfolio showcasing diverse creative works"
    },
    {
      name: "Furk",
      image: "https://static.wixstatic.com/media/650e28_999a73b2df204830b5545c1879c2c95f~mv2.jpg/v1/fill/w_901,h_507,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/Ferdy-web-2son.jpg",
      bio: "Creative illustrator crafting compelling visual narratives and character designs.",
      style: "Illustration & Character Design",
      specialties: ["Illustration", "Character Design", "Visual Storytelling"],
      website: "https://www.furk-art.com/",
      social: {},
      featured: "Diverse portfolio of illustration work"
    },
    {
      name: "imverartis",
      image: "https://imverartis.carrd.co/assets/images/image01.jpg",
      bio: "Illustrator creating atmospheric pieces with warm, earthy palettes and detailed environmental storytelling.",
      style: "Digital Illustration",
      specialties: ["Character Design", "Environmental Art", "Atmospheric Illustration", "Commissions"],
      website: "https://imverartis.carrd.co/",
      social: {
        twitter: "@imverartis",
        instagram: "@imverartis"
      },
      featured: "The Grotto Collection, Doggerinos Series",
      collections: ["The Grotto", "Doggerinos", "Commissions"]
    },
    {
      name: "MrMocket",
      image: "https://www.mrmocket.com/images/Mocket_bw.png",
      bio: "Illustrator blending skater punk vibes with weird charm, creating colourful and unconventional art.",
      style: "Skater Punk Aesthetic",
      specialties: ["Character Design", "NFT Art", "Brand Design", "Illustrations"],
      website: "https://www.mrmocket.com/",
      social: {
        twitter: "@mrmocket",
        instagram: "@mrmocket"
      },
      featured: "NFT collections and brand design projects",
      quote: "Join me in blending skater punk vibes with weird charm. Let's explore together!"
    }
  ];

  return (
    <div className="w-full">
      <div className="w-full max-w-screen-lg mx-auto -mt-6 px-8 relative z-10 mb-16">
        <PageNavigation />

        {/* Artists Section */}
        <div className="w-full rounded-lg shadow-lg mb-8 border-2" style={{
          background: 'linear-gradient(to bottom right, #e6f0f5, #d4e8f0)',
          borderColor: '#4f8aae'
        }}>
          <div className="px-8 py-6">
            {/* Artist Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {artists.map((artist, index) => (
                <Card
                  key={index}
                  className="overflow-hidden transition-all duration-300 hover:shadow-xl group"
                >
                  <div className="relative aspect-square">
                    {/* Artist Image */}
                    <div
                      className={`w-full h-full ${artist.name === "MrMocket" ? "bg-white dark:bg-zinc-700 p-4" : "bg-zinc-100 dark:bg-zinc-700"}`}
                    >
                      <img
                        src={artist.image}
                        alt={artist.name}
                        className={`w-full h-full ${artist.name === "MrMocket" ? "object-contain" : "object-cover"} transition-transform duration-300 group-hover:scale-105`}
                      />
                    </div>

                    {/* Hover Overlay with Name and Links */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/95 via-white/90 to-white/80 dark:from-zinc-900/95 dark:via-zinc-900/90 dark:to-zinc-900/80 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-3 p-4">
                      {/* Artist Name */}
                      <h3 className="font-bold text-base text-center">
                        {artist.name}
                      </h3>

                      {/* Social & Website Links */}
                      <div className="flex flex-wrap gap-2 justify-center">
                        <a
                          href={artist.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-2 py-1 bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 rounded-md text-xs font-medium transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="h-3 w-3" />
                          Portfolio
                        </a>
                        {artist.social.twitter && (
                          <a
                            href={`https://twitter.com/${artist.social.twitter.replace('@', '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-2 py-1 bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 rounded-md text-xs font-medium transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Twitter className="h-3 w-3" />
                          </a>
                        )}
                        {artist.social.instagram && (
                          <a
                            href={`https://instagram.com/${artist.social.instagram.replace('@', '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-2 py-1 bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 rounded-md text-xs font-medium transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Instagram className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Shiny effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/20 to-transparent dark:from-zinc-500/20 dark:via-zinc-400/10 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
