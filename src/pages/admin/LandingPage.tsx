import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Globe, Tag, Search, Link2, Code, CheckSquare } from "lucide-react";
import { PixelsTab } from "@/components/admin/landing/PixelsTab";
import { GoogleToolsTab } from "@/components/admin/landing/GoogleToolsTab";
import { SeoTab } from "@/components/admin/landing/SeoTab";
import { UtmBuilderTab } from "@/components/admin/landing/UtmBuilderTab";
import { ScriptsTab } from "@/components/admin/landing/ScriptsTab";
import { PerformanceTab } from "@/components/admin/landing/PerformanceTab";

const LandingPage = () => {
  const [activeTab, setActiveTab] = useState("pixels");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Landing Page</h1>
        <p className="text-muted-foreground">
          Gerencie pixels, tracking e otimizações da sua página de captura
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6 h-auto gap-2 bg-transparent p-0">
          <TabsTrigger
            value="pixels"
            className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Tag className="h-4 w-4" />
            <span className="hidden sm:inline">Pixels</span>
          </TabsTrigger>
          <TabsTrigger
            value="google"
            className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">Google</span>
          </TabsTrigger>
          <TabsTrigger
            value="seo"
            className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">SEO</span>
          </TabsTrigger>
          <TabsTrigger
            value="utm"
            className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Link2 className="h-4 w-4" />
            <span className="hidden sm:inline">UTM Builder</span>
          </TabsTrigger>
          <TabsTrigger
            value="scripts"
            className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Code className="h-4 w-4" />
            <span className="hidden sm:inline">Scripts</span>
          </TabsTrigger>
          <TabsTrigger
            value="performance"
            className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <CheckSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Checklist</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pixels">
          <PixelsTab />
        </TabsContent>
        <TabsContent value="google">
          <GoogleToolsTab />
        </TabsContent>
        <TabsContent value="seo">
          <SeoTab />
        </TabsContent>
        <TabsContent value="utm">
          <UtmBuilderTab />
        </TabsContent>
        <TabsContent value="scripts">
          <ScriptsTab />
        </TabsContent>
        <TabsContent value="performance">
          <PerformanceTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LandingPage;
