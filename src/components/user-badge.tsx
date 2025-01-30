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
  "0xa6C647dDDCC7190A66c3D20584F84e6Cd3ABC1C9",
  "0x4E881e105A87dD686fd3F69F5EA2B5E87a04D1ac",
  "0xfF748368eFf5a9cCE12e021616F2Ab6ACf480a4F",
  "0x0eD6A0f577E43d9658E35CA9E80223315884C7A1",
"0x9056B02aA0C576bd8779Ddfcf462FcF2Bf45F6f3",
"0x31ceFAE622e2147Ffa16EcFc77a3f74aDC2FB52d",
"0x39DBccE0A463640CF7226F0Ca2E34ADD1C8d9127",
"0xC38462219E80FB13A8E99289AF9e300Cd01dce51",
"0xbA109916A5f1381845d6FC4a2758C1abD196ff93",
"0x5019120C23f19206AAE9A188691AfcB1dC727095",
"0x0e898ba9e51bc267789747fade63ed57ea5b5431",
"0x096E6667D8542Ba9E1FEf2679E57e32877dc4a08",
"0xeCEc066Ac76F02590Dd7fF6201F556e6f079D257",
"0xAaE01A4132e43de63137DD4a4AD6f8Ad29F48A77",
"0xCfFF4D442809030c3c06e344364fA46da4b740Ab",
"0x0a9d31BAae2BD8cE642Fd9c6e7FEd8216890d27D",
"0xacA75ea67bda764F259384b54DAFC77b6A43547d",
"0x81bc6188E92C7d95EA643B174213AffE4305bFe6",
"0xe4a17de6890022a38c9a128fbdb863c22a587463",
"0xAf2568BB26421f9319a208b05CEaf03C2B07Bdab",
"0x9D4953881605284d0a5ED358590473aef287F45C",
"0x0e898ba9e51bc267789747fade63ed57ea5b5431",
"0x7de431D96068b48eB5a4e142ec3dA6B251b7f2B6",
"0x0A5D172B8A1349415D6b79b52D715704ec716F04",
"0x79c993BAba6eE2EF4527d5567DA0d686F82A3C9B",
"0x00783Eb176f3ae0148dD0B6D65a006f625Ec3861"
  
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
