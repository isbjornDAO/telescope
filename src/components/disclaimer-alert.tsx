import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function DisclaimerAlert() {
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
                            The latest projects on Avalanche
                        </AlertTitle>
                        <AlertDescription className="text-zinc-500">
                            Do Your own research. Safe launches with &lt;100 votes will be promoted to Telescope. Isbjorn is not responsible for permanent loss.
                        </AlertDescription>
                    </div>
                </div>
            </Alert>
        </div>
    );
}