"use client";

import { PageNavigation } from "@/components/page-navigation";
import { Card } from "@/components/ui/card";
import { ArrowUpRight, Instagram, Twitter } from "lucide-react";

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
      social: {} as { twitter?: string; instagram?: string },
      featured: "Active in the AVAX art community"
    },
    {
      name: "Aline Subi",
      image: "https://static.wixstatic.com/media/ab0adc_0487cc7ff4fd49c0abb53f46b86f523b~mv2.jpg/v1/fit/w_965,h_797,q_90,enc_avif,quality_auto/ab0adc_0487cc7ff4fd49c0abb53f46b86f523b~mv2.jpg",
      bio: "Contemporary artist bringing unique vision and creativity to the digital art space.",
      style: "Contemporary Digital Art",
      specialties: ["Digital Art", "Contemporary Illustration"],
      website: "https://www.alinesubi.xyz/",
      social: {} as { twitter?: string; instagram?: string },
      featured: "Portfolio showcasing diverse creative works"
    },
    {
      name: "Furk",
      image: "https://static.wixstatic.com/media/650e28_999a73b2df204830b5545c1879c2c95f~mv2.jpg/v1/fill/w_901,h_507,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/Ferdy-web-2son.jpg",
      bio: "Creative illustrator crafting compelling visual narratives and character designs.",
      style: "Illustration & Character Design",
      specialties: ["Illustration", "Character Design", "Visual Storytelling"],
      website: "https://www.furk-art.com/",
      social: {} as { twitter?: string; instagram?: string },
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
      <div className="w-full max-w-screen-lg mx-auto -mt-6 px-4 md:px-8 relative z-10 mb-16 mobile-content-align">
        <PageNavigation />

        {/* Editorial header */}
        <div className="flex items-end justify-between gap-6 mb-6 md:mb-8 pb-5 border-b border-zinc-300/60 dark:border-zinc-700/60">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] font-semibold text-sky-700 dark:text-sky-300 mb-2">
              Index № 01 · Community
            </p>
            <h1 className="font-serif italic text-4xl md:text-5xl leading-[0.95] tracking-tight text-foreground">
              Artists in residence
            </h1>
          </div>
          <p className="hidden sm:block max-w-xs text-sm leading-relaxed text-muted-foreground">
            A living roster of illustrators, pixel-pushers and character designers orbiting the community.
          </p>
        </div>

        {/* Artist Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-10">
          {artists.map((artist, index) => (
            <a
              key={index}
              href={artist.website}
              target="_blank"
              rel="noopener noreferrer"
              className="group block"
            >
              <Card className="overflow-hidden bg-card rounded-xl shadow-sm hover:shadow-xl transition-all duration-500 border border-border hover:-translate-y-1">
                <div className="relative aspect-[4/5] overflow-hidden">
                  <div
                    className={`absolute inset-0 ${artist.name === "MrMocket" ? "bg-white dark:bg-zinc-800 p-6" : "bg-zinc-100 dark:bg-zinc-800"}`}
                  >
                    <img
                      src={artist.image}
                      alt={artist.name}
                      className={`w-full h-full ${artist.name === "MrMocket" ? "object-contain" : "object-cover"} transition-transform duration-700 ease-out group-hover:scale-[1.04]`}
                    />
                  </div>

                  {/* Index number — top left */}
                  <div className="absolute top-3 left-3 font-serif italic text-sm text-white/90 mix-blend-difference">
                    {String(index + 1).padStart(2, "0")}
                  </div>

                  {/* Social overlay — bottom, slides up on hover */}
                  {(artist.social.twitter || artist.social.instagram) && (
                    <div className="absolute inset-x-0 bottom-0 p-3 flex gap-2 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                      {artist.social.twitter && (
                        <a
                          href={`https://twitter.com/${artist.social.twitter.replace("@", "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="h-8 w-8 grid place-items-center rounded-full bg-white/95 dark:bg-zinc-900/95 text-zinc-900 dark:text-zinc-100 backdrop-blur hover:bg-white dark:hover:bg-zinc-900 shadow-md"
                        >
                          <Twitter className="h-3.5 w-3.5" />
                        </a>
                      )}
                      {artist.social.instagram && (
                        <a
                          href={`https://instagram.com/${artist.social.instagram.replace("@", "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="h-8 w-8 grid place-items-center rounded-full bg-white/95 dark:bg-zinc-900/95 text-zinc-900 dark:text-zinc-100 backdrop-blur hover:bg-white dark:hover:bg-zinc-900 shadow-md"
                        >
                          <Instagram className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* Persistent name + style */}
                <div className="px-4 py-3 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-serif text-base leading-tight truncate">
                      {artist.name}
                    </h3>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground mt-1 truncate">
                      {artist.style}
                    </p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-sky-700 dark:group-hover:text-sky-300" />
                </div>
              </Card>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
