import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { mockAppVersion } from '@/lib/data';
import { Download, Package, FileText, Hash } from 'lucide-react';
import Link from 'next/link';

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string }) {
    return (
        <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Icon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="font-mono text-sm font-medium">{value}</p>
            </div>
        </div>
    );
}

export default function AppStatusPage() {
    const appVersion = mockAppVersion;

    return (
        <div className="flex flex-col gap-6">
            <h1 className="font-headline text-3xl font-bold">Status do Aplicativo</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Informações da Versão Atual</CardTitle>
                    <CardDescription>Detalhes sobre a versão mais recente do aplicativo de campo.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                        <InfoRow icon={Package} label="Package Name" value={appVersion.packageName} />
                        <InfoRow icon={Hash} label="App Version" value={appVersion.appversion} />
                        <InfoRow icon={FileText} label="APK File Name" value={appVersion.apkFileName} />
                    </div>
                    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/50 p-8 text-center">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <Download className="h-8 w-8" />
                        </div>
                        <h3 className="font-headline text-xl font-semibold">Download da Versão</h3>
                        <p className="mb-4 text-sm text-muted-foreground">Clique no botão para baixar o arquivo APK.</p>
                        <Button asChild>
                            <Link href={appVersion.apkUrl} target="_blank" download>
                                Baixar {appVersion.appversion}
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
