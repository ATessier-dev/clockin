import { Clock3 } from "lucide-react";
import { LoginForm } from "./LoginForm";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { getTranslation, loginTranslations, type Language } from "@/translations";

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const language = (locale === "en" ? "en" : "fr") as Language;

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
            <Clock3 className="h-6 w-6 text-primary" aria-hidden="true" />
          </div>
          <CardTitle>{getTranslation(loginTranslations.title, language)}</CardTitle>
          <CardDescription>{getTranslation(loginTranslations.subtitle, language)}</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm language={language} />
        </CardContent>
      </Card>
    </main>
  );
}
