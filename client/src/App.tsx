/*
  iHeartEcho — App Router
  Design: All About Ultrasound brand (Teal #189aa1, Aqua #4ad9e0)
  Fonts: Merriweather (headings), Open Sans (body), JetBrains Mono (data)
*/
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import EchoCalculator from "./pages/EchoCalculator";
import FetalNavigator from "./pages/FetalNavigator";
import ProtocolAssistant from "./pages/ProtocolAssistant";
import HemodynamicsLab from "./pages/HemodynamicsLab";
import ScanCoach from "./pages/ScanCoach";
import CaseLab from "./pages/CaseLab";
import ReportBuilder from "./pages/ReportBuilder";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/calculator" component={EchoCalculator} />
      <Route path="/fetal" component={FetalNavigator} />
      <Route path="/protocol" component={ProtocolAssistant} />
      <Route path="/hemodynamics" component={HemodynamicsLab} />
      <Route path="/scan-coach" component={ScanCoach} />
      <Route path="/cases" component={CaseLab} />
      <Route path="/report" component={ReportBuilder} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
