import * as React from "react";
import { DateRange } from "react-day-picker";
import { subDays } from "date-fns";

import { LeadsSidebar, type LeadsView } from "@/components/leads/LeadsSidebar";
import { LeadsMobileViewSelector } from "@/components/leads/LeadsMobileViewSelector";
import { LeadsDashboardHeader } from "@/components/leads/LeadsDashboardHeader";
import { ExportReportDialog } from "@/components/leads/ExportReportDialog";
import {
  LeadsOverviewView,
  LeadsMetaView,
  LeadsGoogleAdsView,
  LeadsAnalyticsView,
} from "@/components/leads/views";
import { useLeadsMetrics } from "@/hooks/useLeadsMetrics";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Leads() {
  const [activeView, setActiveView] = React.useState<LeadsView>("overview");
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const isMobile = useIsMobile();

  const { meta, googleAds, ga4, aggregated, refetchAll } =
    useLeadsMetrics(dateRange);

  const hasAnyConnection = meta.connected || googleAds.connected || ga4.connected;
  const isLoading = aggregated.isLoading;

  // Get title based on active view
  const getViewTitle = () => {
    switch (activeView) {
      case "overview":
        return "Visão geral das plataformas";
      case "meta":
        return "Relatório Meta Ads";
      case "google_ads":
        return "Relatório Google Ads";
      case "analytics":
        return "Relatório Analytics";
      default:
        return "Invictus Fraternidade";
    }
  };

  // Render active view
  const renderView = () => {
    switch (activeView) {
      case "overview":
        return (
          <LeadsOverviewView
            meta={meta}
            googleAds={googleAds}
            ga4={ga4}
            aggregated={aggregated}
            isLoading={isLoading}
            hasAnyConnection={hasAnyConnection}
          />
        );
      case "meta":
        return <LeadsMetaView meta={meta} isLoading={meta.isLoading} />;
      case "google_ads":
        return (
          <LeadsGoogleAdsView googleAds={googleAds} isLoading={googleAds.isLoading} />
        );
      case "analytics":
        return <LeadsAnalyticsView ga4={ga4} isLoading={ga4.isLoading} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <LeadsSidebar activeView={activeView} onViewChange={setActiveView} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="p-3 md:p-6 border-b border-border/40">
          <div className="flex flex-col gap-4">
            {/* Mobile view selector */}
            {isMobile && (
              <LeadsMobileViewSelector
                activeView={activeView}
                onViewChange={setActiveView}
              />
            )}
            
            <LeadsDashboardHeader
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              onRefresh={refetchAll}
              isLoading={isLoading}
              companyName={getViewTitle()}
            />

            {/* Export button */}
            <div className="flex justify-end">
              <ExportReportDialog
                dateRange={dateRange}
                aggregatedData={aggregated}
                metaMetrics={
                  meta.connected && meta.data?.metrics
                    ? {
                        spend: meta.data.metrics.spend,
                        impressions: meta.data.metrics.impressions,
                        clicks: meta.data.metrics.clicks,
                        purchases: meta.data.metrics.purchases,
                        roas: meta.data.metrics.roas,
                      }
                    : undefined
                }
                googleAdsMetrics={
                  googleAds.connected && googleAds.data?.metrics
                    ? (googleAds.data.metrics as {
                        spend: number;
                        impressions: number;
                        clicks: number;
                        conversions: number;
                      })
                    : undefined
                }
                ga4Metrics={
                  ga4.connected && ga4.data?.metrics
                    ? (ga4.data.metrics as {
                        sessions: number;
                        users: number;
                        pageviews: number;
                        bounceRate: number;
                      })
                    : undefined
                }
              />
            </div>
          </div>
        </div>

        {/* View Content */}
        <div className="flex-1 p-4 md:p-6 overflow-auto">{renderView()}</div>
      </div>
    </div>
  );
}
