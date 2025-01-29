import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Image from "next/image";

const PUPPET_BADGE_ADDRESSES = [
  "0x84d504ADc11880F859D81ccb2ee614EeAE2c303E",
  "0x6243a82915FcB2F94dFa8A1ca0cF40B6735f0ba9",
  "0x340965A626140063500Cad9369D1A6F55F93224A",
  "0xf16f0Ece297046c47Ac21f578ADf8E191BBF6327",
  "0xc0dEd526A536f24bca0bAC704f3a9247188aa506",
  "0x8B1f8AB4e7593e9a3fB509a97251F3f3416642EB",
  "0xB1D70eF43a86eB031e17E53f5Cf4ac3C9D6A2585",
  "0x9719d48c337fDE7360E52C157eDb7462b37E2204",
  "0xE630d03426afFB63442f03B7e8f69b930629405C",
  "0x0eD6A0f577E43d9658E35CA9E80223315884C7A1",
  "0x8D1F373B12096E8D84E7E0c4997476C999F2cC5a",
  "0x1d089DaFcCE392ec3440b0dF1442f6d19E313627",
  "0x6EcB3A53c5fB6CD3C7A214244d2F18641252d2E6",
  "0x61de9450bDbFab6aCA281D523be3897c7087571F",
  "0x7de431D96068b48eB5a4e142ec3dA6B251b7f2B6",
  "0xa6C647dDDCC7190A66c3D20584F84e6Cd3ABC1C9"
  
].map((a) => a.toLowerCase());

interface UserBadgeProps {
  address: string;
}

export function UserBadge({ address }: UserBadgeProps) {
  const hasVotingBadge = PUPPET_BADGE_ADDRESSES.includes(address.toLowerCase());

  if (!hasVotingBadge) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Image
            src="/badges/puppet.png"
            alt="Early Voter Badge"
            width={24}
            height={24}
            className="rounded-full"
          />
        </TooltipTrigger>
        <TooltipContent className="bg-white text-black shadow-md px-3 py-2">
          <div className="flex flex-col gap-1">
            <p className="font-semibold text-[16px]">Puppet Holder</p>
            <p className="text-sm text-zinc-400">You’re pulling my strings!</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
