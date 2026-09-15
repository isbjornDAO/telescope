"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  User,
  RefreshCw,
  Clock,
  MessageSquare,
  ArrowLeft,
  ArrowDown,
  Send,
  ImageIcon,
  Share2,
  Quote,
  Check,
  ExternalLink,
  X,
  Bold,
  Italic,
  Underline,
  Code,
  Smile,
  AlertTriangle,
  Search,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { useAccount } from "wagmi";
import { AudienceTag, WithheldPost } from "@/components/forum/audience-picker";
import { ThreadDetailSkeleton } from "@/components/ui/retro-skeletons";
import { RetroPixelAvatar } from "@/components/retro-pixel-avatar";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

interface Board {
  id: string;
  name: string;
  title: string;
}

interface PostUser {
  createdAt: string;
  postCount?: number;
  discordId?: string;
  username?: string;
  discordAvatar?: string | null;
  handle?: string | null;
  bio?: string | null;
  xp?: number;
  coins?: number;
  level?: number;
  nodeType?: string;
  faction?: {
    name: string;
    tag?: string | null;
    color?: string | null;
  } | null;
  isAdmin?: boolean;
  rankTitle?: string;
  rankTheme?: string;
  xpProgress?: { currentProgress: number; totalNeeded: number };
  xpForNextLevel?: number;
  badges?: Array<{
    id: string;
    collectableId: string;
    name: string;
    imageUrl: string;
    rarity: string;
  }>;
}

interface Post {
  id: string;
  comment: string;
  posterId: string;
  createdAt: string;
  isOp: boolean;
  walletAddress: string | null;
  imageHash: string | null;
  anonymous: boolean;
  audienceLabel?: string;
  restricted?: boolean;
  user?: PostUser;
}

interface Withheld {
  id: string;
  withheld: true;
  requirement: string;
}

function isWithheld(p: Post | Withheld): p is Withheld {
  return "withheld" in p;
}

interface Thread {
  id: string;
  subject: string | null;
  createdAt: string;
  replyCount: number;
  board: Board;
  posts: (Post | Withheld)[];
  posterCount?: number;
  audienceLabel?: string;
  restricted?: boolean;
}

function formatTooltipDateTime(dateString: string): string {
  const date = new Date(dateString);
  const pad = (n: number) => String(n).padStart(2, "0");
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const year = String(date.getFullYear()).slice(-2);
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${month}/${day}/${year} at ${hours}:${minutes}`;
}

function getAttachmentFileName(url: string, index?: number): string {
  try {
    const pathname = url.startsWith("http") ? new URL(url).pathname : url;
    const segments = pathname.split("/").filter(Boolean);
    const lastSegment = segments[segments.length - 1];
    if (lastSegment) {
      return decodeURIComponent(lastSegment);
    }
  } catch {
    // fallback
  }
  return index !== undefined ? `image_post_${index}.png` : "attachment.png";
}

const EMOJI_CATEGORIES = [
  {
    name: "Smileys",
    icon: "😀",
    emojis: [
      { char: "😀", name: "Grinning Face", keywords: ["happy", "smile", "joy"] },
      { char: "😃", name: "Smiley Face", keywords: ["happy", "joy", "grin"] },
      { char: "😄", name: "Smiling Face with Eyes", keywords: ["happy", "laugh", "joy"] },
      { char: "😁", name: "Grinning Face with Smiling Eyes", keywords: ["teeth", "grin", "happy"] },
      { char: "😆", name: "Squinting Laugh", keywords: ["haha", "lol", "laughing", "xd"] },
      { char: "😅", name: "Sweat Smile", keywords: ["whew", "relief", "nervous", "embarrassed"] },
      { char: "😂", name: "Tears of Joy", keywords: ["laughing", "crying", "lol", "rofl", "haha"] },
      { char: "🤣", name: "ROFL", keywords: ["rolling", "floor", "laughing", "lol"] },
      { char: "🥲", name: "Smiling with Tear", keywords: ["emotional", "bittersweet", "proud", "gratitude"] },
      { char: "🥹", name: "Pleading Eyes", keywords: ["begging", "emotional", "puppy", "cute"] },
      { char: "😊", name: "Blushing Smile", keywords: ["warm", "sweet", "happy", "blush"] },
      { char: "😇", name: "Angel Halo", keywords: ["innocent", "angel", "good", "blessed"] },
      { char: "🙂", name: "Slight Smile", keywords: ["okay", "calm", "pleasant"] },
      { char: "😉", name: "Winking Face", keywords: ["wink", "flirt", "joke", "playful"] },
      { char: "😌", name: "Relieved Face", keywords: ["peaceful", "content", "calm", "zen"] },
      { char: "😍", name: "Heart Eyes", keywords: ["love", "crush", "adore", "heart"] },
      { char: "🥰", name: "Smiling with Hearts", keywords: ["love", "affection", "tender", "sweet"] },
      { char: "😘", name: "Blowing Kiss", keywords: ["kiss", "love", "flirt"] },
      { char: "😋", name: "Yum Tongue", keywords: ["tasty", "delicious", "food", "savory"] },
      { char: "😛", name: "Tongue Out", keywords: ["silly", "playful", "cheeky"] },
      { char: "😜", name: "Winking Tongue", keywords: ["crazy", "goofy", "joking"] },
      { char: "🤪", name: "Zany Face", keywords: ["wild", "party", "crazy", "wacky"] },
      { char: "😝", name: "Squinting Tongue", keywords: ["prank", "mischief", "playful"] },
      { char: "🤑", name: "Money Face", keywords: ["dollar", "rich", "profit", "cash", "crypto"] },
      { char: "🤗", name: "Hugging Face", keywords: ["hug", "open", "warmth", "embrace"] },
      { char: "🤭", name: "Giggling Face", keywords: ["oops", "teehee", "chuckle", "shy"] },
      { char: "🤫", name: "Shushing Face", keywords: ["quiet", "secret", "shh", "silence"] },
      { char: "🤔", name: "Thinking Face", keywords: ["hmm", "wonder", "ponder", "curious"] },
      { char: "🫡", name: "Saluting Face", keywords: ["respect", "yes sir", "duty", "acknowledge"] },
      { char: "🤐", name: "Zipper Mouth", keywords: ["secret", "silent", "quiet", "sealed"] },
      { char: "🤨", name: "Raised Eyebrow", keywords: ["skeptical", "doubt", "suspicious", "sus"] },
      { char: "😐", name: "Neutral Face", keywords: ["meh", "blank", "whatever"] },
      { char: "😑", name: "Expressionless", keywords: ["unimpressed", "deadpan", "annoyed"] },
      { char: "😶", name: "No Mouth", keywords: ["silent", "mute", "speechless"] },
      { char: "🫥", name: "Dotted Line Face", keywords: ["invisible", "disappear", "ignored"] },
      { char: "😏", name: "Smirking Face", keywords: ["smug", "flirt", "sly", "clever"] },
      { char: "😒", name: "Unamused Face", keywords: ["bored", "side eye", "irritated"] },
      { char: "🙄", name: "Rolling Eyes", keywords: ["annoyed", "whatever", "sarcasm"] },
      { char: "😬", name: "Grimacing Face", keywords: ["awkward", "cringe", "yikes", "nervous"] },
      { char: "😮", name: "Open Mouth", keywords: ["surprised", "wow", "gasp"] },
      { char: "😯", name: "Hushed Face", keywords: ["stunned", "speechless"] },
      { char: "😲", name: "Astonished Face", keywords: ["shocked", "amazed", "unbelievable"] },
      { char: "😳", name: "Flushed Face", keywords: ["blushing", "shocked", "embarrassed"] },
      { char: "🥺", name: "Pleading Face", keywords: ["begging", "please", "emotional"] },
      { char: "😦", name: "Frowning Open", keywords: ["concerned", "upset"] },
      { char: "😧", name: "Anguished Face", keywords: ["stunned", "pained"] },
      { char: "😨", name: "Fearful Face", keywords: ["scared", "shock", "afraid"] },
      { char: "😰", name: "Anxious Sweat", keywords: ["nervous", "cold sweat", "panic"] },
      { char: "😥", name: "Sad but Relieved", keywords: ["whew", "phew", "close call"] },
      { char: "😢", name: "Crying Face", keywords: ["sad", "tear", "unhappy"] },
      { char: "😭", name: "Loudly Crying", keywords: ["bawling", "sob", "sad", "tears", "crying"] },
      { char: "😱", name: "Screaming in Fear", keywords: ["terror", "horror", "shock", "munch"] },
      { char: "😖", name: "Confounded Face", keywords: ["frustrated", "quiver"] },
      { char: "😣", name: "Persevering Face", keywords: ["struggling", "endure"] },
      { char: "😞", name: "Disappointed Face", keywords: ["down", "sad", "bummed"] },
      { char: "😓", name: "Cold Sweat", keywords: ["exhausted", "stress", "tired"] },
      { char: "😩", name: "Weary Face", keywords: ["tired", "give up", "fed up"] },
      { char: "😫", name: "Tired Face", keywords: ["frustrated", "exhausted", "whining"] },
      { char: "🥱", name: "Yawning Face", keywords: ["sleepy", "tired", "bored"] },
      { char: "😤", name: "Triumph Face", keywords: ["huff", "steam", "proud", "angry"] },
      { char: "😡", name: "Pouting Face", keywords: ["angry", "mad", "red", "furious"] },
      { char: "😠", name: "Angry Face", keywords: ["mad", "annoyed", "grumpy"] },
      { char: "🤬", name: "Censored Swearing", keywords: ["furious", "curse", "swear", "rage"] },
      { char: "😈", name: "Smiling Imp", keywords: ["devil", "evil", "mischief", "trouble"] },
      { char: "👿", name: "Angry Imp", keywords: ["demon", "devil", "rage"] },
      { char: "💀", name: "Skull", keywords: ["dead", "ded", "rip", "skeleton", "death"] },
      { char: "☠️", name: "Skull and Crossbones", keywords: ["danger", "poison", "pirate", "dead"] },
      { char: "💩", name: "Pile of Poo", keywords: ["poop", "turd", "crap", "funny"] },
      { char: "🤡", name: "Clown Face", keywords: ["fool", "clowning", "circus", "joke"] },
      { char: "👻", name: "Ghost", keywords: ["spooky", "boo", "halloween", "phantom"] },
      { char: "👽", name: "Alien", keywords: ["extraterrestrial", "ufo", "martian", "space"] },
      { char: "👾", name: "Alien Monster", keywords: ["arcade", "pixel", "space invader", "game"] },
      { char: "🤖", name: "Robot Face", keywords: ["bot", "android", "ai", "machine"] },
      { char: "🤠", name: "Cowboy Hat Face", keywords: ["western", "sheriff", "yeehaw"] },
      { char: "🥳", name: "Partying Face", keywords: ["celebration", "birthday", "party", "tada"] },
      { char: "🥸", name: "Disguised Face", keywords: ["incognito", "mustache", "glasses", "secret"] },
      { char: "😎", name: "Sunglasses Face", keywords: ["cool", "rad", "awesome", "slick"] },
      { char: "🤓", name: "Nerd Face", keywords: ["geek", "smart", "glasses", "studious"] },
      { char: "🧐", name: "Monocle Face", keywords: ["investigate", "curious", "fancy", "inspect"] },
      { char: "🫠", name: "Melting Face", keywords: ["hot", "liquid", "dissolving", "embarrassed"] },
      { char: "🤢", name: "Nauseated Face", keywords: ["sick", "gross", "green", "disgusted"] },
      { char: "🤮", name: "Vomiting Face", keywords: ["puke", "sick", "gross", "barf"] },
      { char: "🤧", name: "Sneezing Face", keywords: ["cold", "allergy", "tissue", "sick"] },
      { char: "🤒", name: "Face with Thermometer", keywords: ["fever", "ill", "temperature", "sick"] },
      { char: "🤕", name: "Head Bandage", keywords: ["hurt", "injured", "pain", "clumsy"] },
      { char: "😴", name: "Sleeping Face", keywords: ["zzz", "tired", "bed", "sleep"] },
    ],
  },
  {
    name: "Gestures",
    icon: "👍",
    emojis: [
      { char: "👍", name: "Thumbs Up", keywords: ["like", "yes", "approve", "ok", "good", "agree"] },
      { char: "👎", name: "Thumbs Down", keywords: ["dislike", "no", "bad", "disapprove"] },
      { char: "👏", name: "Clapping Hands", keywords: ["applause", "bravo", "kudos", "praise"] },
      { char: "🙌", name: "Raising Hands", keywords: ["hooray", "celebrate", "praise", "amen"] },
      { char: "👐", name: "Open Hands", keywords: ["welcome", "open", "hug"] },
      { char: "🤲", name: "Palms Together", keywords: ["prayer", "offering", "begging"] },
      { char: "🤝", name: "Handshake", keywords: ["deal", "agreement", "partner", "shake"] },
      { char: "🤜", name: "Right Fist", keywords: ["fist bump", "attack", "bro"] },
      { char: "🤛", name: "Left Fist", keywords: ["fist bump", "respect", "bro"] },
      { char: "✊", name: "Raised Fist", keywords: ["power", "solidarity", "strength"] },
      { char: "👊", name: "Closed Fist", keywords: ["punch", "bump", "fight"] },
      { char: "✌️", name: "Victory Hand", keywords: ["peace", "two", "v sign"] },
      { char: "🤞", name: "Crossed Fingers", keywords: ["luck", "hope", "wish"] },
      { char: "🫰", name: "Finger Heart", keywords: ["kpop", "love", "snap"] },
      { char: "🤟", name: "Love-You Gesture", keywords: ["sign language", "rock", "love"] },
      { char: "🤘", name: "Sign of Horns", keywords: ["rock on", "metal", "heavy metal"] },
      { char: "👌", name: "OK Hand", keywords: ["perfect", "okay", "fine", "correct"] },
      { char: "🤌", name: "Pinched Fingers", keywords: ["italian", "chef kiss", "what", "gesture"] },
      { char: "🤏", name: "Pinching Hand", keywords: ["small", "tiny", "little bit"] },
      { char: "👈", name: "Backhand Pointing Left", keywords: ["left", "point", "direction"] },
      { char: "👉", name: "Backhand Pointing Right", keywords: ["right", "point", "this"] },
      { char: "👆", name: "Backhand Pointing Up", keywords: ["up", "above", "look"] },
      { char: "👇", name: "Backhand Pointing Down", keywords: ["down", "below", "read below"] },
      { char: "☝️", name: "Index Pointing Up", keywords: ["one", "first", "listen", "point"] },
      { char: "✋", name: "Raised Hand", keywords: ["stop", "high five", "halt", "wait"] },
      { char: "🤚", name: "Raised Back of Hand", keywords: ["hand", "wave"] },
      { char: "🖐️", name: "Hand with Fingers Splayed", keywords: ["five", "stop", "hand"] },
      { char: "🖖", name: "Vulcan Salute", keywords: ["spock", "star trek", "live long", "prosper"] },
      { char: "👋", name: "Waving Hand", keywords: ["hello", "bye", "hi", "goodbye", "wave"] },
      { char: "🤙", name: "Call Me Hand", keywords: ["shaka", "hang loose", "phone", "cool"] },
      { char: "🫵", name: "Index Pointing at Viewer", keywords: ["you", "target", "choose"] },
      { char: "✍️", name: "Writing Hand", keywords: ["pen", "notes", "author", "writing"] },
      { char: "🙏", name: "Folded Hands", keywords: ["please", "pray", "thanks", "gratitude", "namaste"] },
      { char: "💪", name: "Flexed Biceps", keywords: ["muscle", "strong", "power", "workout", "fitness"] },
      { char: "🤳", name: "Selfie", keywords: ["camera", "phone", "picture"] },
      { char: "💅", name: "Nail Polish", keywords: ["slay", "fabulous", "sassy", "beauty"] },
      { char: "💃", name: "Dancer", keywords: ["woman dancing", "party", "celebration"] },
      { char: "🕺", name: "Man Dancing", keywords: ["disco", "groove", "party"] },
    ],
  },
  {
    name: "Hearts & Vibes",
    icon: "❤️",
    emojis: [
      { char: "❤️", name: "Red Heart", keywords: ["love", "romance", "favorite"] },
      { char: "🧡", name: "Orange Heart", keywords: ["warmth", "friendship"] },
      { char: "💛", name: "Yellow Heart", keywords: ["gold", "friendship", "happiness"] },
      { char: "💚", name: "Green Heart", keywords: ["nature", "eco", "healthy"] },
      { char: "💙", name: "Blue Heart", keywords: ["trust", "peace", "cool"] },
      { char: "💜", name: "Purple Heart", keywords: ["honor", "royal", "glamour"] },
      { char: "🖤", name: "Black Heart", keywords: ["dark", "goth", "sorrow"] },
      { char: "🤍", name: "White Heart", keywords: ["pure", "peace", "clean"] },
      { char: "🤎", name: "Brown Heart", keywords: ["earth", "coffee", "chocolate"] },
      { char: "💔", name: "Broken Heart", keywords: ["heartbreak", "sad", "breakup"] },
      { char: "❤️‍🔥", name: "Heart on Fire", keywords: ["passion", "burning love", "lit"] },
      { char: "❤️‍🩹", name: "Mending Heart", keywords: ["healing", "recovery", "better"] },
      { char: "❣️", name: "Heart Exclamation", keywords: ["heavy heart", "emphasis"] },
      { char: "💕", name: "Two Hearts", keywords: ["love", "affection", "cute"] },
      { char: "💞", name: "Revolving Hearts", keywords: ["love", "revolving", "hearts"] },
      { char: "💓", name: "Beating Heart", keywords: ["heartbeat", "pulse", "excited"] },
      { char: "💗", name: "Growing Heart", keywords: ["expanding", "love", "tender"] },
      { char: "💖", name: "Sparkling Heart", keywords: ["sparkle", "glam", "shiny"] },
      { char: "💘", name: "Heart with Arrow", keywords: ["cupid", "struck", "romance"] },
      { char: "💝", name: "Heart with Ribbon", keywords: ["gift", "present", "valentine"] },
      { char: "🔥", name: "Fire", keywords: ["hot", "flame", "lit", "awesome", "trend"] },
      { char: "💯", name: "Hundred Points", keywords: ["perfect", "score", "100", "real", "truth"] },
      { char: "✨", name: "Sparkles", keywords: ["glitter", "magic", "clean", "special", "star"] },
      { char: "🌟", name: "Glowing Star", keywords: ["radiant", "shining", "favorite"] },
      { char: "⭐", name: "Star", keywords: ["rating", "favorite", "yellow star"] },
      { char: "💥", name: "Collision", keywords: ["boom", "explosion", "bang", "impact"] },
      { char: "💫", name: "Dizzy", keywords: ["stars", "sparkle", "swirl"] },
      { char: "🎉", name: "Party Popper", keywords: ["tada", "celebrate", "congrats", "party"] },
      { char: "🎊", name: "Confetti Ball", keywords: ["festival", "celebrate", "congrats"] },
      { char: "🍻", name: "Clinking Beer Mugs", keywords: ["cheers", "beer", "drink", "pub", "bar", "toast"] },
      { char: "🥂", name: "Clinking Glasses", keywords: ["champagne", "toast", "celebrate", "wine"] },
      { char: "🍷", name: "Wine Glass", keywords: ["red wine", "drink", "alcohol"] },
      { char: "☕", name: "Hot Beverage", keywords: ["coffee", "tea", "caffeine", "espresso", "morning"] },
      { char: "🧋", name: "Bubble Tea", keywords: ["boba", "tea", "drink"] },
      { char: "🍕", name: "Pizza", keywords: ["food", "slice", "cheese", "pepperoni"] },
      { char: "🍔", name: "Hamburger", keywords: ["burger", "fast food", "beef", "snack"] },
      { char: "🍟", name: "French Fries", keywords: ["fries", "potato", "fast food"] },
      { char: "🌮", name: "Taco", keywords: ["mexican", "food", "taco tuesday"] },
      { char: "🍩", name: "Doughnut", keywords: ["donut", "sweet", "pastry"] },
      { char: "🍪", name: "Cookie", keywords: ["biscuit", "chocolate chip", "snack"] },
      { char: "🎂", name: "Birthday Cake", keywords: ["cake", "birthday", "dessert", "party"] },
      { char: "👑", name: "Crown", keywords: ["king", "queen", "royal", "winner", "vip"] },
      { char: "💎", name: "Gem Stone", keywords: ["diamond", "jewel", "precious", "wealth", "luxury"] },
      { char: "🏆", name: "Trophy", keywords: ["winner", "champion", "cup", "first", "prize"] },
      { char: "🥇", name: "1st Place Medal", keywords: ["gold", "winner", "champion", "first"] },
      { char: "🥈", name: "2nd Place Medal", keywords: ["silver", "second"] },
      { char: "🥉", name: "3rd Place Medal", keywords: ["bronze", "third"] },
    ],
  },
  {
    name: "Cosmic & Tech",
    icon: "🔭",
    emojis: [
      { char: "🔭", name: "Telescope", keywords: ["astronomy", "space", "stars", "look", "explore", "telescope", "scout"] },
      { char: "🪐", name: "Ringed Planet", keywords: ["saturn", "planet", "orbit", "space", "cosmos"] },
      { char: "🌌", name: "Milky Way", keywords: ["galaxy", "universe", "stars", "night sky"] },
      { char: "🚀", name: "Rocket", keywords: ["space", "launch", "moon", "speed", "crypto", "blast off"] },
      { char: "🛸", name: "Flying Saucer", keywords: ["ufo", "alien", "spaceship"] },
      { char: "🛰️", name: "Satellite", keywords: ["orbit", "space", "station", "tech"] },
      { char: "🌠", name: "Shooting Star", keywords: ["meteor", "wish", "night"] },
      { char: "🌑", name: "New Moon", keywords: ["dark moon", "night", "eclipse"] },
      { char: "🌕", name: "Full Moon", keywords: ["moon", "bright", "lunar", "night"] },
      { char: "☀️", name: "Sun", keywords: ["sunny", "sunshine", "day", "bright"] },
      { char: "⚡", name: "High Voltage", keywords: ["lightning", "electricity", "zap", "power", "energy"] },
      { char: "☄️", name: "Comet", keywords: ["space rock", "blazing", "astronomy"] },
      { char: "🌙", name: "Crescent Moon", keywords: ["moon", "night", "sleep", "evening"] },
      { char: "🌎", name: "Earth Americas", keywords: ["globe", "world", "planet"] },
      { char: "🌍", name: "Earth Europe-Africa", keywords: ["globe", "world", "planet"] },
      { char: "🌏", name: "Earth Asia-Australia", keywords: ["globe", "world", "planet"] },
      { char: "💻", name: "Laptop", keywords: ["computer", "pc", "code", "dev", "macbook", "tech"] },
      { char: "🖥️", name: "Desktop Computer", keywords: ["pc", "screen", "monitor"] },
      { char: "📱", name: "Mobile Phone", keywords: ["iphone", "smartphone", "cell"] },
      { char: "🎮", name: "Video Game Controller", keywords: ["gaming", "gamepad", "play", "playstation", "xbox"] },
      { char: "🕹️", name: "Joystick", keywords: ["arcade", "retro", "classic", "gaming"] },
      { char: "🎲", name: "Game Die", keywords: ["dice", "random", "boardgame", "luck"] },
      { char: "🪙", name: "Coin", keywords: ["crypto", "gold", "token", "money", "currency"] },
      { char: "🛡️", name: "Shield", keywords: ["security", "defense", "protection", "armor"] },
      { char: "⚔️", name: "Crossed Swords", keywords: ["battle", "pvp", "combat", "fight", "war"] },
      { char: "🧪", name: "Test Tube", keywords: ["science", "lab", "experiment", "chemistry"] },
      { char: "🧬", name: "DNA", keywords: ["genetics", "biology", "evolution", "science"] },
      { char: "🎯", name: "Bullseye", keywords: ["target", "goal", "accuracy", "hit"] },
      { char: "💡", name: "Light Bulb", keywords: ["idea", "innovation", "bright", "smart", "tip"] },
      { char: "📌", name: "Pushpin", keywords: ["pin", "notice", "sticky", "board", "marker"] },
      { char: "💬", name: "Speech Balloon", keywords: ["chat", "message", "bubble", "comment", "talk"] },
      { char: "🔔", name: "Bell", keywords: ["alert", "notification", "ring", "chime"] },
      { char: "🔒", name: "Locked Padlock", keywords: ["secure", "privacy", "lock", "safety"] },
      { char: "🔑", name: "Key", keywords: ["access", "password", "unlock", "secret"] },
      { char: "🧠", name: "Brain", keywords: ["smart", "mind", "intellect", "thinking", "memory"] },
      { char: "🔮", name: "Crystal Ball", keywords: ["fortune", "magic", "future", "psychic"] },
    ],
  },
  {
    name: "Animals & Nature",
    icon: "🐻",
    emojis: [
      { char: "🐻", name: "Bear", keywords: ["grizzly", "teddy", "cute", "animal"] },
      { char: "🐻‍❄️", name: "Polar Bear", keywords: ["arctic", "ice", "white bear", "cold"] },
      { char: "❄️", name: "Snowflake", keywords: ["snow", "winter", "cold", "frozen", "ice"] },
      { char: "🦊", name: "Fox", keywords: ["clever", "red fox", "cute", "animal"] },
      { char: "🐺", name: "Wolf", keywords: ["howl", "wild", "pack", "alpha"] },
      { char: "🦁", name: "Lion", keywords: ["king", "roar", "feline", "pride"] },
      { char: "🐯", name: "Tiger Face", keywords: ["stripes", "wild", "cat"] },
      { char: "🐱", name: "Cat Face", keywords: ["kitty", "meow", "feline", "kitten"] },
      { char: "🐶", name: "Dog Face", keywords: ["puppy", "doggo", "bark", "canine"] },
      { char: "🐼", name: "Panda", keywords: ["bear", "bamboo", "china", "cute"] },
      { char: "🐨", name: "Koala", keywords: ["australia", "bear", "cute"] },
      { char: "🐵", name: "Monkey Face", keywords: ["ape", "chimp", "primate"] },
      { char: "🐸", name: "Frog", keywords: ["toad", "ribbit", "pepe", "amphibian"] },
      { char: "🦉", name: "Owl", keywords: ["wise", "bird", "night", "hoot"] },
      { char: "🦅", name: "Eagle", keywords: ["bird", "raptor", "freedom", "predator"] },
      { char: "🦇", name: "Bat", keywords: ["vampire", "spooky", "halloween", "night"] },
      { char: "🦆", name: "Duck", keywords: ["quack", "bird", "pond"] },
      { char: "🐝", name: "Honeybee", keywords: ["bee", "buzz", "honey", "insect"] },
      { char: "🦋", name: "Butterfly", keywords: ["wings", "nature", "pretty", "flutter"] },
      { char: "🕷️", name: "Spider", keywords: ["arachnid", "web", "creepy", "bug"] },
      { char: "🐙", name: "Octopus", keywords: ["sea", "ocean", "tentacles", "marine"] },
      { char: "🦈", name: "Shark", keywords: ["ocean", "predator", "jaws", "fish"] },
      { char: "🐳", name: "Spouting Whale", keywords: ["whale", "ocean", "sea", "huge"] },
      { char: "🐬", name: "Dolphin", keywords: ["sea", "ocean", "flipper", "smart"] },
      { char: "🌸", name: "Cherry Blossom", keywords: ["sakura", "flower", "pink", "spring"] },
      { char: "🌹", name: "Rose", keywords: ["flower", "romantic", "red", "love"] },
      { char: "🌻", name: "Sunflower", keywords: ["flower", "yellow", "summer", "sun"] },
      { char: "🍀", name: "Four Leaf Clover", keywords: ["luck", "irish", "lucky", "shamrock"] },
      { char: "🌲", name: "Evergreen Tree", keywords: ["pine", "tree", "forest", "nature"] },
      { char: "🌴", name: "Palm Tree", keywords: ["tropical", "beach", "island", "summer"] },
      { char: "🍄", name: "Mushroom", keywords: ["toadstool", "fungus", "nature", "mario"] },
      { char: "🌈", name: "Rainbow", keywords: ["pride", "colors", "sky", "weather"] },
      { char: "🌊", name: "Water Wave", keywords: ["ocean", "sea", "surf", "tsunami"] },
      { char: "🌪️", name: "Tornado", keywords: ["twister", "cyclone", "wind", "storm"] },
      { char: "🌋", name: "Volcano", keywords: ["eruption", "lava", "magma", "mountain"] },
    ],
  },
];

function renderFormattedContent(text: string) {
  const regex = /(\[u\][\s\S]*?\[\/u\]|\[b\][\s\S]*?\[\/b\]|\[i\][\s\S]*?\[\/i\]|\[code\][\s\S]*?\[\/code\]|\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  const parts = text.split(regex);
  return parts.map((part, idx) => {
    if (part.startsWith("[u]") && part.endsWith("[/u]")) {
      return (
        <span key={idx} className="underline underline-offset-2">
          {part.slice(3, -4)}
        </span>
      );
    }
    if (part.startsWith("[b]") && part.endsWith("[/b]")) {
      return (
        <strong key={idx} className="font-bold">
          {part.slice(3, -4)}
        </strong>
      );
    }
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={idx} className="font-bold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("[i]") && part.endsWith("[/i]")) {
      return (
        <em key={idx} className="italic">
          {part.slice(3, -4)}
        </em>
      );
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return (
        <em key={idx} className="italic">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith("[code]") && part.endsWith("[/code]")) {
      return (
        <code
          key={idx}
          className="font-mono text-xs px-1.5 py-0.5 rounded bg-zinc-200/70 dark:bg-zinc-800 text-pink-600 dark:text-pink-400">
          {part.slice(6, -7)}
        </code>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={idx}
          className="font-mono text-xs px-1.5 py-0.5 rounded bg-zinc-200/70 dark:bg-zinc-800 text-pink-600 dark:text-pink-400">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

function renderRelativeTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.max(0, Math.floor(diffMs / 1000));
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return <span>just now</span>;
  if (diffMins < 60) {
    return (
      <span>
        <b className="font-bold text-zinc-800 dark:text-zinc-100">{diffMins}</b>m ago
      </span>
    );
  }
  if (diffHours < 24) {
    return (
      <span>
        <b className="font-bold text-zinc-800 dark:text-zinc-100">{diffHours}</b>h ago
      </span>
    );
  }
  if (diffDays === 1) {
    return (
      <span>
        <b className="font-bold text-zinc-800 dark:text-zinc-100">1</b> day ago
      </span>
    );
  }
  return (
    <span>
      <b className="font-bold text-zinc-800 dark:text-zinc-100">{diffDays}</b> days ago
    </span>
  );
}

export default function ThreadPage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const { address } = useAccount();
  const { toast } = useToast();
  const threadId = params.threadId as string;
  const replyInputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeEmojiCategory, setActiveEmojiCategory] = useState(0);
  const [emojiSearch, setEmojiSearch] = useState("");

  const filteredEmojis = useMemo(() => {
    const q = emojiSearch.trim().toLowerCase();
    if (!q) return [];
    const results: Array<{ char: string; name: string }> = [];
    const seen = new Set<string>();
    for (const cat of EMOJI_CATEGORIES) {
      for (const item of cat.emojis) {
        if (seen.has(item.char)) continue;
        const nameMatch = item.name.toLowerCase().includes(q);
        const charMatch = item.char === q;
        const kwMatch = item.keywords?.some((k) => k.toLowerCase().includes(q));
        if (nameMatch || charMatch || kwMatch) {
          seen.add(item.char);
          results.push({ char: item.char, name: item.name });
        }
      }
    }
    return results;
  }, [emojiSearch]);

  const [thread, setThread] = useState<Thread | null>(null);
  const [loading, setLoading] = useState(true);
  const [replying, setReplying] = useState(false);
  const [comment, setComment] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [activeLightboxImage, setActiveLightboxImage] = useState<{
    url: string;
    fileName: string;
    authorName?: string;
    postNum?: number;
  } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [stayAnonymous, setStayAnonymous] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("stayAnonymous");
      return saved !== null ? JSON.parse(saved) : false;
    }
    return false;
  });

  const [quotingPost, setQuotingPost] = useState<{
    postNum: number;
    authorName: string;
    snippet: string;
    avatarUrl?: string | null;
    walletAddress?: string | null;
    posterId?: string | null;
    anonymous?: boolean;
  } | null>(null);

  const handleAnonymousChange = (checked: boolean) => {
    setStayAnonymous(checked);
    localStorage.setItem("stayAnonymous", JSON.stringify(checked));
  };

  const fetchThread = async () => {
    try {
      setIsRefreshing(true);
      const response = await fetch(`/api/forum/threads/${threadId}`);
      const data = await response.json();
      setThread(data);
    } catch (error) {
      console.error("Error fetching thread:", error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchThread();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && activeLightboxImage) {
        setActiveLightboxImage(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeLightboxImage]);

  const scrollToBottom = () => {
    const el = document.getElementById("reply-composer");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    } else {
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    }
    replyInputRef.current?.focus();
  };

  const insertQuote = (targetPost: Post, postNum: number, authorName: string) => {
    // Check if user has highlighted text on the page
    let selectedText = "";
    if (typeof window !== "undefined") {
      const selection = window.getSelection();
      if (selection && selection.toString().trim()) {
        selectedText = selection.toString().trim();
      }
    }

    const rawSnippet = selectedText || targetPost.comment.replace(/\s+/g, " ").trim();
    const snippet = rawSnippet.length > 100 ? `${rawSnippet.slice(0, 97)}…` : rawSnippet;

    setQuotingPost({
      postNum,
      authorName,
      snippet,
      avatarUrl: targetPost.user?.discordAvatar || null,
      walletAddress: targetPost.walletAddress || null,
      posterId: targetPost.posterId || null,
      anonymous: targetPost.anonymous,
    });

    scrollToBottom();
  };

  const scrollToPost = (index: number) => {
    const target = document.getElementById(`post-num-${index}`);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      target.classList.add("ring-2", "ring-sky-500", "dark:ring-sky-400");
      setTimeout(() => {
        target.classList.remove("ring-2", "ring-sky-500", "dark:ring-sky-400");
      }, 1800);
    }
  };

  const handleShareThread = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      toast({
        title: "Link Copied",
        description: "Thread link copied to your clipboard.",
      });
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleReportPost = (_postId: string) => {
    toast({
      title: "Post reported",
      description: "Thank you for reporting. This post has been flagged for moderation.",
    });
  };

  const wrapSelection = (before: string, after: string = before) => {
    const textarea = replyInputRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);
    const replacement = `${before}${selected || "text"}${after}`;
    const newText =
      text.substring(0, start) + replacement + text.substring(end);
    setComment(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + (selected.length || 4),
      );
    }, 0);
  };

  const insertEmoji = (emoji: string) => {
    const textarea = replyInputRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const newText = text.substring(0, start) + emoji + text.substring(end);
    setComment(newText);
    setTimeout(() => {
      textarea.focus();
      const newPos = start + emoji.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

  const createReply = async () => {
    if (!address || !comment.trim() || !thread) return;

    setReplying(true);
    try {
      let uploadedImageUrl = null;

      if (imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const uploadData = await uploadResponse.json();
        if (uploadData.url) {
          uploadedImageUrl = uploadData.url;
        }
      }

      const finalComment = quotingPost
        ? `>>${quotingPost.postNum}\n${comment.trim()}`
        : comment.trim();

      const response = await fetch(`/api/forum/threads/${threadId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comment: finalComment,
          walletAddress: address,
          boardName: thread.board.name,
          imageHash: uploadedImageUrl || null,
          anonymous: stayAnonymous,
        }),
      });

      const data = await response.json();

      if (data.success) {
        if (data.xpAwarded) {
          queryClient.invalidateQueries({ queryKey: ["userStats", address] });
          toast({
            title: "Reply Posted! +1 XP",
            description: `You earned 1 XP! Total: ${data.newXp} XP (Level ${data.newLevel})`,
          });
        } else {
          toast({
            title: "Reply Published",
            description: "Your response is now live on the thread.",
          });
        }
        setComment("");
        setQuotingPost(null);
        setImageFile(null);
        setImagePreview("");
        if (fileInputRef.current) fileInputRef.current.value = "";
        fetchThread();
      }
    } catch (error) {
      console.error("Error creating reply:", error);
      toast({
        title: "Error Posting Reply",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setReplying(false);
    }
  };

  if (loading) {
    return <ThreadDetailSkeleton />;
  }

  if (!thread) {
    return (
      <div className="w-full max-w-screen-lg mx-auto px-4 md:px-8 py-16">
        <div className="retro-box p-8 text-center max-w-md mx-auto">
          <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <h2 className="text-lg font-bold mb-1">Thread Not Found</h2>
          <p className="text-sm text-muted-foreground mb-4">
            The discussion topic you are looking for does not exist or has been
            removed.
          </p>
          <Link
            href="/forum"
            className="retro-btn retro-btn-blue inline-flex items-center gap-1.5 px-4 py-2 text-xs">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Forum
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* ── Retro Breadcrumbs & Control Header ── */}
      <div className="retro-topic-header mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        {/* Left: Cohesive Forum Breadcrumb Hierarchy */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Link
            href="/forum"
            className="font-medium text-zinc-600 dark:text-zinc-400 hover:text-primary transition-colors">
            Forum
          </Link>
          <span className="text-zinc-400 dark:text-zinc-600 select-none">/</span>
          <Link
            href={`/forum/${thread.board.name}`}
            className="font-medium text-zinc-600 dark:text-zinc-400 hover:text-primary transition-colors">
            {thread.board.title || thread.board.name}
          </Link>
          <span className="text-zinc-400 dark:text-zinc-600 select-none">/</span>
          <span className="font-bold text-zinc-900 dark:text-zinc-100 truncate max-w-[200px] sm:max-w-[340px]">
            {thread.subject || `Topic #${thread.id.slice(0, 8)}`}
          </span>

          {thread.restricted && thread.audienceLabel && (
            <AudienceTag label={thread.audienceLabel} />
          )}
        </div>

        {/* Right: Actions (Responses count, Update Thread, Share, Reply) */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <div
            className="retro-time-pill !h-7 px-2.5"
            title={`${thread.posts.length} ${thread.posts.length === 1 ? "response" : "responses"} recorded`}>
            <MessageSquare className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400 shrink-0" />
            <span className="font-bold text-zinc-800 dark:text-zinc-100">{thread.posts.length}</span>
          </div>

          <button
            onClick={() => fetchThread()}
            className="retro-btn retro-btn-gray h-7 w-7 p-0 inline-flex items-center justify-center font-bold"
            aria-label="Update thread"
            title="Update thread">
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </button>

          <button
            onClick={handleShareThread}
            className="retro-btn retro-btn-gray h-7 px-2.5 text-xs inline-flex items-center gap-1.5 font-bold"
            title="Share thread link">
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </>
            )}
          </button>

          <button
            onClick={scrollToBottom}
            className="retro-btn retro-btn-blue h-7 px-2.5 text-xs inline-flex items-center gap-1.5 font-bold text-white shadow-xs"
            title="Jump to reply box">
            <ArrowDown className="w-3.5 h-3.5" />
            <span>Reply</span>
          </button>
        </div>
      </div>

      {/* ── Posts Stream: Classic 2-Column Baccons Style ── */}
      <div className="space-y-4 mb-8">
        {thread.posts.map((post, index) => {
          if (isWithheld(post)) {
            return (
              <div key={post.id} className="retro-box p-4">
                <WithheldPost requirement={post.requirement} />
              </div>
            );
          }

          const isOp = !post.anonymous && Boolean(post.isOp);
          const authorName = post.anonymous
            ? "Anonymous Agent"
            : post.user?.handle
              ? `@${post.user.handle}`
              : post.user?.username ||
                (post.walletAddress
                  ? `${post.walletAddress.slice(0, 6)}...${post.walletAddress.slice(-4)}`
                  : "Anonymous Agent");

          const userAvatar = post.user?.discordAvatar;

          // Role hierarchy: Anon > Staff/Admin > Elder > Anchor > Member
          const isStaff = !post.anonymous && Boolean(post.user?.isAdmin);
          const isElder = !post.anonymous && post.user?.nodeType === "ELDER";
          const isAnchor = !post.anonymous && post.user?.nodeType === "ANCHOR";

          const roleLabel = post.anonymous
            ? "ANON"
            : isStaff
              ? "STAFF"
              : isElder
                ? "ELDER"
                : isAnchor
                  ? "ANCHOR"
                  : "MEMBER";

          const roleBadgeClass = post.anonymous
            ? "bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300"
            : isStaff
              ? "bg-[#FAC72B] border border-[#CE6401] text-[#78350F] shadow-sm"
              : isElder
                ? "bg-purple-100 dark:bg-purple-950/80 border border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300"
                : isAnchor
                  ? "bg-sky-100 dark:bg-sky-950/80 border border-sky-300 dark:border-sky-800 text-sky-700 dark:text-sky-300"
                  : "bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300";

          return (
            <div
              key={post.id}
              id={`post-num-${index + 1}`}
              className="retro-post-card group transition-all duration-300">
              {/* ── Unified Top Header Bar: Equal height & continuous bottom border ── */}
              <div className="retro-post-header">
                {/* Left: Author Header Bar */}
                <div className="retro-author-header">
                  {post.anonymous || !post.walletAddress ? (
                    <span
                      className="truncate font-bold text-xs text-zinc-900 dark:text-zinc-100"
                      title={authorName}>
                      {authorName}
                    </span>
                  ) : (
                    <Link
                      href={`/profile/${post.walletAddress}`}
                      className="hover:text-primary transition-colors inline-flex items-center justify-center gap-1.5 font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate"
                      title={`View ${authorName}'s Profile`}>
                      <span className="truncate">{authorName}</span>
                      {isOp && (
                        <span
                          className="retro-op-badge shrink-0"
                          title="Original Poster (Thread Creator)">
                          OP
                        </span>
                      )}
                    </Link>
                  )}
                </div>

                {/* Right: Metallic Header Bar with Topic Title, Time & Quote Action */}
                <div className="retro-post-infobar">
                  {/* Left: Box Title (Subject on OP, Re: Subject on replies) */}
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-bold text-xs truncate max-w-[200px] sm:max-w-[340px] text-zinc-800 dark:text-zinc-200">
                      {index === 0 ? (
                        thread.subject || "Topic"
                      ) : (
                        <>
                          <span className="text-zinc-500 font-semibold">
                            Re:
                          </span>{" "}
                          {thread.subject || "Topic"}
                        </>
                      )}
                    </span>
                  </div>

                  {/* Right: Controls cluster - Report, Quote, Time Pill with speech-bubble tooltip */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleReportPost(post.id)}
                      className="retro-btn-report"
                      title="Report this post">
                      <AlertTriangle className="w-3 h-3" />
                      <span className="hidden sm:inline">Report</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => insertQuote(post, index + 1, authorName)}
                      className="retro-btn-quote"
                      title={`Quote ${authorName}'s post in your reply`}>
                      <Quote className="w-3 h-3" />
                      <span className="hidden sm:inline">Quote</span>
                    </button>

                    <TooltipProvider delayDuration={150}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className="retro-time-pill cursor-default"
                            title={formatTooltipDateTime(post.createdAt)}>
                            <Clock className="w-3 h-3 text-zinc-500 dark:text-zinc-400 shrink-0" />
                            {renderRelativeTime(post.createdAt)}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          sideOffset={6}
                          className="bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-[11px] font-bold px-2.5 py-1 rounded border border-zinc-200 dark:border-zinc-700 shadow-md whitespace-nowrap leading-tight">
                          {formatTooltipDateTime(post.createdAt)}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </div>

              {/* ── Main 2-Column Body: Author Sidebar & Post Content ── */}
              <div className="retro-post-main">
                {/* Left Column: Baccons-Style Author Sidebar (topico_left) */}
                <div className="retro-post-author">
                  <div className="retro-author-body">
                    {/* 1. User Tagline / Mission (shown only if bio or faction exists) */}
                    {(post.user?.bio || post.user?.faction?.name) && (
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-normal truncate max-w-[155px] px-1">
                        {post.user?.bio || post.user?.faction?.name}
                      </div>
                    )}

                    {/* 2. Framed Retro Avatar Box */}
                    <div className="retro-author-avatar-box">
                      {post.anonymous ? (
                        <div className="flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-500">
                          <User className="w-10 h-10" />
                        </div>
                      ) : userAvatar ? (
                        <img
                          src={userAvatar}
                          alt={authorName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <RetroPixelAvatar
                          seed={post.walletAddress || post.posterId}
                          size={98}
                          alt={authorName}
                        />
                      )}
                    </div>

                    {/* 3. Role Status Badge */}
                    <div className={`retro-author-badge ${roleBadgeClass}`}>
                      {roleLabel}
                    </div>

                    {/* 4. Baccons-Style Animated Tarja Rank Banner */}
                    {!post.anonymous && post.user && (
                      <div
                        className={`retro-tarja ${post.user.rankTheme || "tarja-slate"}`}
                        title={`Rank: ${post.user.rankTitle || "Stargazer"} (Level ${post.user.level || 1})`}>
                        <div className="retro-tarja-sheen-container">
                          <div className="retro-tarja-sheen" />
                        </div>
                        <span className="retro-tarja-title">
                          {post.user.rankTitle || "Stargazer"}
                        </span>
                        <div className="retro-tarja-rank">
                          Lvl. {post.user.level || 1}
                        </div>
                      </div>
                    )}

                    {/* 5. Post Counter (only for identified users) */}
                    {!post.anonymous && post.user && (
                      <div className="text-[11px] text-zinc-600 dark:text-zinc-400 font-medium flex items-center gap-1.5">
                        <MessageSquare className="w-3 h-3 text-zinc-400 dark:text-zinc-500" />
                        <span>
                          <b>{post.user.postCount ?? 1}</b>{" "}
                          {post.user.postCount === 1 ? "post" : "posts"}
                        </span>
                      </div>
                    )}

                    {/* 6. Collectables / Badges Rack (Baccons Emblemas) */}
                    {!post.anonymous &&
                      post.user?.badges &&
                      post.user.badges.length > 0 && (
                        <div
                          className="retro-badge-rack"
                          title="Earned Badges & Collectables">
                          {post.user.badges.map((badge) => (
                            <div
                              key={badge.id}
                              className="retro-badge-chip"
                              title={`${badge.name} (${badge.rarity})`}>
                              <img
                                src={badge.imageUrl}
                                alt={badge.name}
                                className="w-full h-full object-contain p-0.5"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                  </div>
                </div>

                {/* Right Column: Post Body Content (topico_right) */}
                <div className="retro-post-content">
                  {/* Post Message Body */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      {/* Attached Image with Lightbox click */}
                      {post.imageHash && (
                      <div className="mt-1 mb-3">
                        <div
                          onClick={() =>
                            setActiveLightboxImage({
                              url: post.imageHash!,
                              fileName: getAttachmentFileName(post.imageHash!, index + 1),
                              authorName,
                              postNum: index + 1,
                            })
                          }
                          className="group/img relative rounded border border-zinc-200 dark:border-zinc-700 overflow-hidden inline-block cursor-pointer shadow-sm hover:shadow-md transition-all max-w-[320px] bg-zinc-50 dark:bg-zinc-900"
                          title="Click to view full image">
                          <img
                            src={post.imageHash}
                            alt="Post attachment"
                            className="w-full h-auto max-h-[360px] object-contain group-hover/img:scale-[1.02] transition-transform duration-200"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 flex items-center justify-center transition-colors">
                            <span className="opacity-0 group-hover/img:opacity-100 transition-opacity bg-black/70 text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow">
                              <ExternalLink className="w-3 h-3" />
                              <span>Click to Expand</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                    {/* Post Text: Formatted with Greentext and clickable quotes */}
                    <div className="whitespace-pre-wrap break-words text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
                      {post.comment.split("\n").map((line, lineIdx) => {
                        const trimmed = line.trim();

                        // Quoted post reference (e.g. >>1, >>4, >>4 (@beardelphi):, etc.)
                        const quoteMatch = trimmed.match(/^>>(\d+)(?:\s+.*)?$/);
                        if (quoteMatch) {
                          const targetNum = parseInt(quoteMatch[1], 10);
                          const rawTarget = thread.posts[targetNum - 1];
                          const targetPost = rawTarget && !isWithheld(rawTarget) ? rawTarget : null;
                          const targetAuthor = targetPost
                            ? targetPost.anonymous
                              ? "Anonymous Agent"
                              : targetPost.user?.handle
                                ? `@${targetPost.user.handle}`
                                : targetPost.user?.username ||
                                  (targetPost.walletAddress
                                    ? `${targetPost.walletAddress.slice(0, 6)}...${targetPost.walletAddress.slice(-4)}`
                                    : "Agent")
                            : rawTarget && isWithheld(rawTarget)
                              ? "Restricted Post"
                              : null;
                          const targetSnippet = targetPost
                            ? targetPost.comment.replace(/\s+/g, " ").trim()
                            : "";
                          const displaySnippet =
                            targetSnippet.length > 70
                              ? `${targetSnippet.slice(0, 67)}…`
                              : targetSnippet;

                          return (
                            <div key={lineIdx} className="mb-3 max-w-xl">
                              <div
                                onClick={() => scrollToPost(targetNum)}
                                className="rounded border border-[#C8C8C8] dark:border-[#3F3F46] bg-[#F7F7F8] dark:bg-[#18181B] shadow-2xs overflow-hidden cursor-pointer group/quote hover:border-zinc-400 dark:hover:border-zinc-500 transition-all text-left"
                                title={`Jump to post #${targetNum}${targetAuthor ? ` by ${targetAuthor}` : ""}`}>
                                <div className="px-2.5 py-1 bg-gradient-to-b from-[#FFFFFF] to-[#ECECED] dark:from-[#2B2B30] dark:to-[#202024] border-b border-[#D4D4D8] dark:border-[#333338] flex items-center justify-between gap-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] text-[11px]">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <div className="w-3.5 h-3.5 rounded-xs overflow-hidden border border-zinc-300 dark:border-zinc-600 shrink-0 bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                                      {targetPost?.anonymous ? (
                                        <User className="w-2.5 h-2.5 text-zinc-500" />
                                      ) : targetPost?.user?.discordAvatar ? (
                                        <img src={targetPost.user.discordAvatar} alt="" className="w-full h-full object-cover" />
                                      ) : (
                                        <RetroPixelAvatar
                                          seed={targetPost?.walletAddress || targetPost?.posterId || targetAuthor || String(targetNum)}
                                          size={14}
                                        />
                                      )}
                                    </div>
                                    <span className="text-zinc-500 dark:text-zinc-400 font-medium">Originally posted by</span>
                                    <span className="font-bold text-zinc-800 dark:text-zinc-100 group-hover/quote:text-sky-600 dark:group-hover/quote:text-sky-400 transition-colors truncate">
                                      {targetAuthor || `Post #${targetNum}`}
                                    </span>
                                    <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
                                      #{targetNum}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-zinc-400 group-hover/quote:text-zinc-700 dark:group-hover/quote:text-zinc-200 transition-colors flex items-center gap-0.5 shrink-0 font-medium">
                                    View post →
                                  </span>
                                </div>
                                {displaySnippet && (
                                  <div className="px-3 py-1.5 text-xs text-zinc-600 dark:text-zinc-300 bg-[#FBFBFB] dark:bg-[#141416] shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.25)] flex items-start gap-1.5">
                                    <Quote className="w-2.5 h-2.5 text-zinc-400 dark:text-zinc-500 shrink-0 mt-0.5 fill-current opacity-70" />
                                    <p className="line-clamp-2 leading-relaxed text-[11px] sm:text-xs">
                                      {displaySnippet}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        }

                        // Greentext quotes
                        if (
                          trimmed.startsWith(">") &&
                          !trimmed.startsWith(">>")
                        ) {
                          return (
                            <p
                              key={lineIdx}
                              className="text-[#2B8C08] dark:text-[#4ADE80] font-medium pl-1 border-l-2 border-[#2B8C08]/30 dark:border-[#4ADE80]/30 my-0.5">
                              {renderFormattedContent(line)}
                            </p>
                          );
                        }

                        return <p key={lineIdx}>{renderFormattedContent(line)}</p>;
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
        })}
      </div>

      {/* ── Reply Composer Box ── */}
      <div id="reply-composer">
        <div className="retro-box mb-8 !overflow-visible shadow-sm">
            {/* Header: Compact Retro Title Bar */}
            <div className="retro-box-title !h-9 px-3.5 rounded-t-[5px]">
              <div className="flex items-center gap-2">
                <Send className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                  Post a Reply
                </span>
              </div>
            </div>

            {/* BBCode & Media Toolbar */}
            <div className="flex items-center gap-1 px-3 py-1.5 bg-zinc-50/70 dark:bg-zinc-800/30 border-b border-zinc-200 dark:border-zinc-800 flex-wrap relative z-30">
              <button
                type="button"
                onClick={() => wrapSelection("**")}
                className="retro-btn retro-btn-gray h-6 px-2 text-[11px] inline-flex items-center gap-1 font-bold"
                title="Bold (**text**)">
                <Bold className="w-2.5 h-2.5" />
                <span>Bold</span>
              </button>

              <button
                type="button"
                onClick={() => wrapSelection("*")}
                className="retro-btn retro-btn-gray h-6 px-2 text-[11px] inline-flex items-center gap-1 italic"
                title="Italic (*text*)">
                <Italic className="w-2.5 h-2.5" />
                <span>Italic</span>
              </button>

              <button
                type="button"
                onClick={() => wrapSelection("[u]", "[/u]")}
                className="retro-btn retro-btn-gray h-6 px-2 text-[11px] inline-flex items-center gap-1 underline underline-offset-2 font-semibold"
                title="Underline ([u]text[/u])">
                <Underline className="w-2.5 h-2.5" />
                <span>Underline</span>
              </button>

              <button
                type="button"
                onClick={() => wrapSelection("`")}
                className="retro-btn retro-btn-gray h-6 px-2 text-[11px] inline-flex items-center gap-1 font-mono"
                title="Code (`code`)">
                <Code className="w-2.5 h-2.5" />
                <span>Code</span>
              </button>

              {/* Emoji Picker Popover using Radix Portal */}
              <DropdownMenu
                open={showEmojiPicker}
                onOpenChange={(open) => {
                  setShowEmojiPicker(open);
                  if (!open) setEmojiSearch("");
                }}>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "retro-btn retro-btn-gray h-6 px-2 text-[11px] inline-flex items-center gap-1 font-semibold cursor-pointer",
                      showEmojiPicker && "border-sky-500 text-sky-700 dark:text-sky-300 shadow-inner"
                    )}
                    title="Insert emoji">
                    <Smile className="w-3 h-3 text-amber-500" />
                    <span>Emoji</span>
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  side="top"
                  align="start"
                  sideOffset={6}
                  className="z-50 w-[295px] sm:w-[320px] p-0 bg-white dark:bg-[#1E1E22] rounded border border-[#C8C8C8] dark:border-[#3F3F46] shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                  {/* Metallic Header */}
                  <div className="px-2.5 py-1.5 bg-gradient-to-b from-[#FFFFFF] to-[#EDEDEE] dark:from-[#2C2C32] dark:to-[#202024] border-b border-[#D4D4D8] dark:border-[#333338] flex items-center justify-between shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-200">
                      <Smile className="w-3.5 h-3.5 text-amber-500" />
                      <span>Emoji</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(false)}
                      className="retro-btn retro-btn-gray h-4 w-4 p-0 inline-flex items-center justify-center text-[10px] cursor-pointer"
                      title="Close">
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>

                  {/* Search Bar */}
                  <div className="px-2 py-1.5 bg-zinc-50 dark:bg-[#18181B] border-b border-zinc-200 dark:border-zinc-800">
                    <div className="relative flex items-center">
                      <Search className="w-3 h-3 text-zinc-400 absolute left-2 pointer-events-none" />
                      <input
                        type="text"
                        value={emojiSearch}
                        onChange={(e) => setEmojiSearch(e.target.value)}
                        onKeyDown={(e) => e.stopPropagation()}
                        placeholder="Search emoji..."
                        className="w-full pl-6 pr-6 py-1 text-xs bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xs text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20"
                      />
                      {emojiSearch && (
                        <button
                          type="button"
                          onClick={() => setEmojiSearch("")}
                          className="absolute right-1.5 p-0.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                          title="Clear search">
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Emoji Content: Search results vs Category Tabs */}
                  {emojiSearch.trim() ? (
                    filteredEmojis.length > 0 ? (
                      <div className="p-1.5">
                        <div className="px-1 py-0.5 mb-1 text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
                          {filteredEmojis.length} {filteredEmojis.length === 1 ? "match" : "matches"} found:
                        </div>
                        <div className="grid grid-cols-7 gap-1 max-h-[200px] overflow-y-auto">
                          {filteredEmojis.map((item, idx) => (
                            <button
                              key={`${item.char}-${idx}`}
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={(e) => {
                                e.preventDefault();
                                insertEmoji(item.char);
                              }}
                              className="h-8 w-8 text-lg flex items-center justify-center rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:scale-125 active:scale-95 transition-all cursor-pointer select-none"
                              title={item.name}>
                              {item.char}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="py-8 px-4 text-center">
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">No emojis found</p>
                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                          Try searching &quot;happy&quot;, &quot;fire&quot;, &quot;heart&quot;, &quot;beer&quot;...
                        </p>
                      </div>
                    )
                  ) : (
                    <>
                      {/* Category Tabs */}
                      <div className="flex items-center gap-1 p-1 bg-zinc-100/80 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 text-[11px]">
                        {EMOJI_CATEGORIES.map((cat, idx) => (
                          <button
                            key={cat.name}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={(e) => {
                              e.preventDefault();
                              setActiveEmojiCategory(idx);
                            }}
                            className={cn(
                              "flex-1 py-1 px-1.5 rounded-xs font-medium text-center transition-all flex items-center justify-center gap-1 cursor-pointer text-[10px]",
                              activeEmojiCategory === idx
                                ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-2xs font-bold"
                                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                            )}>
                            <span>{cat.icon}</span>
                            <span className="hidden xs:inline">{cat.name}</span>
                          </button>
                        ))}
                      </div>

                      {/* Category Grid */}
                      <div className="p-1.5 grid grid-cols-7 gap-1 max-h-[200px] overflow-y-auto">
                        {EMOJI_CATEGORIES[activeEmojiCategory].emojis.map((item, emojiIdx) => (
                          <button
                            key={emojiIdx}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={(e) => {
                              e.preventDefault();
                              insertEmoji(item.char);
                            }}
                            className="h-8 w-8 text-lg flex items-center justify-center rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:scale-125 active:scale-95 transition-all cursor-pointer select-none"
                            title={item.name}>
                            {item.char}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Hidden File Input & Attach Image BBCode Button */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setImageFile(file);
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setImagePreview(reader.result as string);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "retro-btn retro-btn-gray h-6 px-2 text-[11px] inline-flex items-center gap-1 font-semibold transition-colors",
                  imageFile && "border-sky-500 text-sky-700 dark:text-sky-300"
                )}
                title={imageFile ? `Attached: ${imageFile.name}` : "Attach image"}>
                <ImageIcon className="w-3 h-3 text-zinc-500 dark:text-zinc-400" />
                <span>{imageFile ? imageFile.name.slice(0, 12) + (imageFile.name.length > 12 ? "…" : "") : "Image"}</span>
              </button>
            </div>

            {/* Active Quote Preview: Classic Forum Inset Box */}
            {quotingPost && (
              <div className="mx-3.5 my-2.5 rounded border border-[#C8C8C8] dark:border-[#3F3F46] bg-[#F7F7F8] dark:bg-[#18181B] shadow-2xs overflow-hidden animate-in fade-in duration-150">
                {/* Metallic/Beveled Retro Header Strip */}
                <div className="px-3 py-1.5 bg-gradient-to-b from-[#FFFFFF] to-[#EDEDEE] dark:from-[#2C2C32] dark:to-[#202024] border-b border-[#D4D4D8] dark:border-[#333338] flex items-center justify-between gap-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-4 h-4 rounded-xs overflow-hidden border border-zinc-300 dark:border-zinc-600 shrink-0 bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                      {quotingPost.anonymous ? (
                        <User className="w-3 h-3 text-zinc-500" />
                      ) : quotingPost.avatarUrl ? (
                        <img src={quotingPost.avatarUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <RetroPixelAvatar
                          seed={quotingPost.walletAddress || quotingPost.posterId || quotingPost.authorName}
                          size={16}
                        />
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 min-w-0 text-xs">
                      <span className="text-zinc-500 dark:text-zinc-400 font-medium shrink-0 text-[11px]">
                        Replying to
                      </span>
                      <span className="font-bold text-zinc-800 dark:text-zinc-100 truncate text-[11px]">
                        {quotingPost.authorName}
                      </span>
                      <span className="text-[10px] font-mono px-1 py-0.2 bg-zinc-200/70 dark:bg-zinc-700/60 rounded text-zinc-600 dark:text-zinc-300 shrink-0">
                        #{quotingPost.postNum}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setQuotingPost(null)}
                    className="retro-btn retro-btn-gray h-5 px-1.5 text-[10px] inline-flex items-center gap-1 cursor-pointer"
                    title="Cancel quote">
                    <X className="w-2.5 h-2.5" />
                    <span className="hidden xs:inline">Cancel</span>
                  </button>
                </div>

                {/* Inset Quote Body */}
                {quotingPost.snippet && (
                  <div className="px-3 py-2 text-xs text-zinc-600 dark:text-zinc-300 flex items-start gap-2 bg-[#FBFBFB] dark:bg-[#141416] shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.25)]">
                    <Quote className="w-3 h-3 text-zinc-400 dark:text-zinc-500 shrink-0 mt-0.5 fill-current opacity-70" />
                    <p className="line-clamp-2 leading-relaxed text-[11px] sm:text-xs">
                      {quotingPost.snippet}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Seamless Integrated Textarea */}
            <textarea
              ref={replyInputRef}
              placeholder="Write your contribution... (use > for quotes)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="w-full bg-transparent px-3.5 py-2.5 text-xs sm:text-sm outline-none placeholder:text-muted-foreground text-zinc-900 dark:text-zinc-100 resize-y min-h-[76px] leading-relaxed font-sans block"
            />

            {/* Selected Image Thumbnail Preview Chip */}
            {imagePreview && (
              <div className="px-3 pb-2 flex items-center gap-2">
                <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700 text-xs">
                  <img
                    src={imagePreview}
                    alt="Attachment Preview"
                    className="h-6 w-6 object-cover rounded"
                  />
                  <span className="truncate max-w-[160px] text-[11px] text-zinc-700 dark:text-zinc-300 font-medium">
                    {imageFile?.name || "image"}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview("");
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="text-zinc-400 hover:text-rose-600 transition-colors ml-1 p-0.5"
                    title="Remove attachment">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            {/* Integrated Compact Bottom Action Bar */}
            <div className="px-3 py-1.5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40 flex items-center justify-end gap-2.5">
              {/* Anonymous Checkbox */}
              <label
                htmlFor="anonymous-reply"
                className="h-7 px-2.5 rounded border border-zinc-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-800/60 inline-flex items-center gap-1.5 cursor-pointer select-none hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                <Checkbox
                  id="anonymous-reply"
                  checked={stayAnonymous}
                  onCheckedChange={(checked) =>
                    handleAnonymousChange(checked as boolean)
                  }
                  className="h-3.5 w-3.5"
                />
                <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                  Post Anonymously
                </span>
              </label>

              {/* Submit Reply Button */}
              <button
                type="button"
                onClick={createReply}
                disabled={!address || replying || !comment.trim()}
                className="retro-btn retro-btn-blue h-7 px-3.5 text-xs font-bold inline-flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs text-white"
                title={!address ? "Connect wallet to post a reply" : undefined}>
                {replying ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Posting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3 h-3" />
                    <span>Post Reply</span>
                  </>
                )}
              </button>
            </div>
          </div>
      </div>

      {/* ── High-Resolution Image Lightbox Modal ── */}
      {activeLightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-150"
          onClick={() => setActiveLightboxImage(null)}>
          <div
            className="relative max-w-4xl max-h-[90vh] w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700/80 rounded-lg overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}>
            {/* Header: File Name & Context + Actions */}
            <div className="flex items-center justify-between px-3.5 py-2 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-850 text-xs text-zinc-800 dark:text-zinc-200 select-none">
              <div className="flex items-center gap-2 min-w-0">
                <ImageIcon className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400 shrink-0" />
                <span
                  className="font-semibold text-xs text-zinc-800 dark:text-zinc-200 truncate max-w-[220px] sm:max-w-[420px]"
                  title={activeLightboxImage.fileName}>
                  {activeLightboxImage.fileName}
                </span>
                {activeLightboxImage.authorName && (
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate hidden md:inline">
                    by {activeLightboxImage.authorName}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <a
                  href={activeLightboxImage.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="retro-btn retro-btn-gray h-6 px-2 text-[11px] inline-flex items-center gap-1 font-bold"
                  title="Open original image in new tab">
                  <ExternalLink className="w-3 h-3" />
                  <span>Original</span>
                </a>
                <button
                  type="button"
                  onClick={() => setActiveLightboxImage(null)}
                  className="retro-btn retro-btn-gray h-6 w-6 p-0 inline-flex items-center justify-center font-bold"
                  title="Close (Esc)">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Lightbox Image Preview Body */}
            <div className="p-3 sm:p-4 flex items-center justify-center overflow-auto max-h-[80vh] bg-zinc-50/70 dark:bg-zinc-950/60">
              <img
                src={activeLightboxImage.url}
                alt={activeLightboxImage.fileName}
                className="max-w-full max-h-[74vh] object-contain rounded border border-zinc-200/60 dark:border-zinc-800/60 shadow-xs"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
