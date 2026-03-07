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
import ReportBuilder from "./pages/ReportBuilder";
import PediatricNavigator from "./pages/PediatricNavigator";
import TTENavigator from "./pages/TTENavigator";
import TEENavigator from "./pages/TEENavigator";
import ICENavigator from "./pages/ICENavigator";
import DeviceNavigator from "./pages/DeviceNavigator";
import ACHDNavigator from "./pages/ACHDNavigator";
import StressNavigator from "./pages/StressNavigator";
import EchoAssist from "./pages/EchoAssist";
import CardiacPOCUS from "./pages/CardiacPOCUS";
import LungPOCUS from "./pages/LungPOCUS";
import EfastPOCUS from "./pages/EfastPOCUS";
import StrainNavigator from "./pages/StrainNavigator";
import AccreditationTool from "./pages/AccreditationTool";
import { RoleGuard } from "@/components/RoleGuard";
import AccreditationNavigator from "./pages/AccreditationNavigator";
import LabAdmin from "./pages/LabAdmin";
import PlatformAdmin from "./pages/PlatformAdmin";
import ImageQualityReview from "./pages/ImageQualityReview";
import EchoCorrelation from "./pages/EchoCorrelation";
import EchoNavigatorHub from "./pages/EchoNavigatorHub";
import ScanCoachHub from "./pages/ScanCoachHub";
import EchoAssistHub from "./pages/EchoAssistHub";
import StrainScanCoach from "./pages/StrainScanCoach";
import TEEScanCoach from "./pages/TEEScanCoach";
import ICEScanCoach from "./pages/ICEScanCoach";
import CmeHub from "./pages/CmeHub";
import RegistryReviewHub from "./pages/RegistryReviewHub";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import MagicLinkRequest from "./pages/MagicLinkRequest";
import MagicLinkCallback from "./pages/MagicLinkCallback";
// New LMS engines
import QuickFire from "./pages/QuickFire";
import CaseLibrary from "./pages/CaseLibrary";
import CaseDetail from "./pages/CaseDetail";
import SubmitCase from "./pages/SubmitCase";
import AdminCaseManagement from "./pages/AdminCaseManagement";
import QuickFireAdmin from "./pages/QuickFireAdmin";
import Premium from "./pages/Premium";
import UpgradeSuccess from "./pages/UpgradeSuccess";
import UEANavigator from "./pages/UEANavigator";
import UEAScanCoach from "./pages/UEAScanCoach";
import ScanCoachEditor from "./pages/ScanCoachEditor";
import HOCMNavigator from "./pages/HOCMNavigator";
import HOCMScanCoach from "./pages/HOCMScanCoach";
import ThinkificWebhookAdmin from "./pages/ThinkificWebhookAdmin";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/verify-email" component={VerifyEmail} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/magic-link" component={MagicLinkRequest} />
      <Route path="/auth/magic" component={MagicLinkCallback} />
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
      <Route path="/cases">{() => { window.location.replace("/quickfire"); return null; }}</Route>
      <Route path="/report" component={ReportBuilder} />
      <Route path="/cme" component={CmeHub} />
      <Route path="/registry-review" component={RegistryReviewHub} />
      <Route path="/echoassist" component={EchoAssist} />
      <Route path="/hub">{() => { window.location.replace("https://member.allaboutultrasound.com/products/communities/allaboutultrasound-community"); return null; }}</Route>
      <Route path="/cardiac-pocus" component={CardiacPOCUS} />
      <Route path="/lung-pocus" component={LungPOCUS} />
      <Route path="/efast" component={EfastPOCUS} />
      <Route path="/strain" component={StrainNavigator} />
      <Route path="/accreditation">
        {() => (
          <RoleGuard roles={["diy_admin", "diy_user"]}>
            <AccreditationTool />
          </RoleGuard>
        )}
      </Route>
      <Route path="/accreditation-navigator" component={AccreditationNavigator} />
      <Route path="/lab-admin">
        {() => (
          <RoleGuard roles={["diy_admin"]}>
            <LabAdmin />
          </RoleGuard>
        )}
      </Route>
      <Route path="/platform-admin">
        {() => (
          <RoleGuard roles={["platform_admin"]} allowAdmin={false}>
            <PlatformAdmin />
          </RoleGuard>
        )}
      </Route>
      <Route path="/image-quality-review" component={ImageQualityReview} />
      <Route path="/profile" component={Profile} />
      <Route path="/echo-correlation" component={() => { window.location.replace("/accreditation"); return null; }} />
      <Route path="/echo-navigators" component={EchoNavigatorHub} />
      <Route path="/scan-coach-hub" component={ScanCoachHub} />
      <Route path="/strain-scan-coach" component={StrainScanCoach} />
      <Route path="/tee-scan-coach" component={TEEScanCoach} />
      <Route path="/ice-scan-coach" component={ICEScanCoach} />
      <Route path="/uea-navigator" component={UEANavigator} />
      <Route path="/uea-scan-coach" component={UEAScanCoach} />
      <Route path="/hocm-navigator" component={HOCMNavigator} />
      <Route path="/hocm-scan-coach" component={HOCMScanCoach} />
      <Route path="/echo-assist-hub" component={EchoAssistHub} />
      {/* ── LMS Engines ──────────────────────────────────────────────────── */}
      <Route path="/quickfire" component={QuickFire} />
      <Route path="/case-library" component={CaseLibrary} />
      <Route path="/case-library/submit" component={SubmitCase} />
      <Route path="/case-library/edit/:id" component={SubmitCase} />
      <Route path="/case-library/:id" component={CaseDetail} />
      <Route path="/admin/cases" component={AdminCaseManagement} />
      <Route path="/admin/quickfire" component={QuickFireAdmin} />
      <Route path="/admin/scancoach" component={ScanCoachEditor} />
      <Route path="/admin/thinkific-webhook" component={ThinkificWebhookAdmin} />
      {/* ── Premium Access ──────────────────────────────────────────────── */}
      <Route path="/premium" component={Premium} />
      <Route path="/upgrade-success" component={UpgradeSuccess} />
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
