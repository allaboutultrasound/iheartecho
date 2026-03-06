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
import TTENavigatorRedirect from "./pages/TTENavigator";
import HemodynamicsLab from "./pages/HemodynamicsLab";
import ScanCoach from "./pages/ScanCoach";
import CaseLab from "./pages/CaseLab";
import ReportBuilder from "./pages/ReportBuilder";
import PediatricNavigator from "./pages/PediatricNavigator";
import TTENavigator from "./pages/TTENavigator";
import TEENavigator from "./pages/TEENavigator";
import ICENavigator from "./pages/ICENavigator";
import DeviceNavigator from "./pages/DeviceNavigator";
import ACHDNavigator from "./pages/ACHDNavigator";
import StressNavigator from "./pages/StressNavigator";
import EchoAssist from "./pages/EchoAssist";
import Hub from "./pages/Hub";
import CardiacPOCUS from "./pages/CardiacPOCUS";
import LungPOCUS from "./pages/LungPOCUS";
import EfastPOCUS from "./pages/EfastPOCUS";
import StrainNavigator from "./pages/StrainNavigator";
import AccreditationTool from "./pages/AccreditationTool";
import AccreditationNavigator from "./pages/AccreditationNavigator";
import LabAdmin from "./pages/LabAdmin";
import ImageQualityReview from "./pages/ImageQualityReview";
import EchoCorrelation from "./pages/EchoCorrelation";
import EchoNavigatorHub from "./pages/EchoNavigatorHub";
import ScanCoachHub from "./pages/ScanCoachHub";
import EchoAssistHub from "./pages/EchoAssistHub";
import StrainScanCoach from "./pages/StrainScanCoach";
function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/calculator" component={EchoCalculator} />
      <Route path="/fetal" component={FetalNavigator} />
      <Route path="/pediatric" component={PediatricNavigator} />
      <Route path="/tte" component={TTENavigator} />
      <Route path="/tee" component={TEENavigator} />
      <Route path="/ice" component={ICENavigator} />
      <Route path="/device" component={DeviceNavigator} />
      <Route path="/achd" component={ACHDNavigator} />
      <Route path="/stress" component={StressNavigator} />
      <Route path="/protocol" component={TTENavigatorRedirect} />
      <Route path="/hemodynamics" component={HemodynamicsLab} />
      <Route path="/scan-coach" component={ScanCoach} />
      <Route path="/cases" component={CaseLab} />
      <Route path="/report" component={ReportBuilder} />
      <Route path="/echoassist" component={EchoAssist} />
      <Route path="/hub" component={Hub} />
      <Route path="/cardiac-pocus" component={CardiacPOCUS} />
      <Route path="/lung-pocus" component={LungPOCUS} />
      <Route path="/efast" component={EfastPOCUS} />
      <Route path="/strain" component={StrainNavigator} />
      <Route path="/accreditation" component={AccreditationTool} />
      <Route path="/accreditation-navigator" component={AccreditationNavigator} />
      <Route path="/lab-admin" component={LabAdmin} />
      <Route path="/image-quality-review" component={ImageQualityReview} />
      <Route path="/echo-correlation" component={() => { window.location.replace("/accreditation"); return null; }} />
      <Route path="/echo-navigators" component={EchoNavigatorHub} />
      <Route path="/scan-coach-hub" component={ScanCoachHub} />
      <Route path="/strain-scan-coach" component={StrainScanCoach} />
      <Route path="/echo-assist-hub" component={EchoAssistHub} />
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
