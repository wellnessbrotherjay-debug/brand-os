
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function WhoopConnect() {
    const handleConnect = () => {
        // TODO: Implement Whoop OAuth flow
        console.log("Connecting to Whoop...");
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Whoop Integration</CardTitle>
                <CardDescription>Connect your Whoop device to sync recovery and strain data.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="p-4 bg-muted rounded-md text-center">
                    <p>Whoop Connect Component Placeholder</p>
                    <p className="text-sm text-muted-foreground mt-2">Implementation pending source code.</p>
                </div>
                <Button onClick={handleConnect} className="w-full">
                    Connect Whoop
                </Button>
            </CardContent>
        </Card>
    );
}
