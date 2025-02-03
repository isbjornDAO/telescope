import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
                            Enroll your puppet and be rewarded for attending class!
                        </AlertDescription>
                    </div>
                </div>
            </Alert>
        </div>
    );
}