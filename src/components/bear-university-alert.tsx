import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";


export function BearUniversityAlert() {
    return (
        <div>
            <Alert
                variant="default"
                className="bg-white border-zinc-300 py-4 flex flex-col md:flex-row justify-between items-center"
            >
                <div className="flex flex-row gap-2">
                    <AlertCircle className="h-4 w-4 stroke-zinc-500" />
                    <div className="flex flex-col">
                        <AlertTitle className="font-bold">
                            Enroll your puppet to Bear University.
                        </AlertTitle>
                        <AlertDescription className="text-zinc-500">
                            Enroll your puppet and be rewarded for attending class! Join our community for mint info
                        </AlertDescription>
                    </div>
                </div>
                <Button
                    variant="outline"
                    className="mt-4 md:mt-0 flex items-center gap-2"
                    onClick={() => window.open('https://discord.gg/sBTs64xcbZ', '_blank')}
                >
                    <img
                        src="/icons/discord.svg"
                        className="h-4 w-4"
                    />
                    Open Discord
                </Button>
            </Alert>
        </div>
    );
}