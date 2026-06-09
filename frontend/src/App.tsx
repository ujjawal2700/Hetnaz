import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './core/queries/queryClient';
import { AuthProvider, useAuth } from './core/context/AuthContext';
import { SocketProvider } from './core/context/SocketContext';
import { GlobalStateProvider } from './core/context/GlobalStateContext';
import { VideoCallProvider } from './core/context/VideoCallContextXState';
import './core/i18n/i18n.config'; // Initialize i18next
import { VideoCallModal } from './shared/components/VideoCallModal';
import { InAppNotificationToast } from './shared/components/InAppNotificationToast';
import { FCMInitializer } from './core/components/FCMInitializer';
import { ErrorBoundary } from './shared/components/ErrorBoundary';
import { SocketQuerySync } from './core/components/SocketQuerySync';
import { ProtectedRoute } from './core/components/ProtectedRoute';

// Auth pages - keep as regular imports for fast login experience
import { LanguageSelectionPage } from './module/auth/pages/LanguageSelectionPage';
import { SignupPage } from './module/auth/pages/SignupPage';
import { LoginPage } from './module/auth/pages/LoginPage';
import { OtpVerificationPage } from './module/auth/pages/OtpVerificationPage';
import { VerificationPendingPage } from './module/auth/pages/VerificationPendingPage';
import { BasicProfilePage } from './module/auth/pages/BasicProfilePage';
import { InterestsPage } from './module/auth/pages/InterestsPage';
import { AdminStatsProvider } from './module/admin/context/AdminStatsContext';

// Common pages
import { NotFoundPage } from './pages/NotFoundPage';

// Loading fallback component
const PageLoader = () => (
  <div className="flex h-screen items-center justify-center bg-background-light dark:bg-background-dark">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  </div>
);

// ===== LAZY LOADED PAGES =====

// Male module - lazy loaded
const MaleDashboard = lazy(() => import('./module/male/pages/MaleDashboard').then(m => ({ default: m.MaleDashboard })));
const NearbyFemalesPage = lazy(() => import('./module/male/pages/NearbyFemalesPage').then(m => ({ default: m.NearbyFemalesPage })));
const MaleChatListPage = lazy(() => import('./module/male/pages/ChatListPage').then(m => ({ default: m.ChatListPage })));
const MaleChatWindowPage = lazy(() => import('./module/male/pages/ChatWindowPage').then(m => ({ default: m.ChatWindowPage })));
const WalletPage = lazy(() => import('./module/male/pages/WalletPage').then(m => ({ default: m.WalletPage })));
const CoinPurchasePage = lazy(() => import('./module/male/pages/CoinPurchasePage').then(m => ({ default: m.CoinPurchasePage })));
const UserProfilePage = lazy(() => import('./module/male/pages/UserProfilePage').then(m => ({ default: m.UserProfilePage })));
const MaleNotificationsPage = lazy(() => import('./module/male/pages/NotificationsPage').then(m => ({ default: m.NotificationsPage })));
const PurchaseHistoryPage = lazy(() => import('./module/male/pages/PurchaseHistoryPage').then(m => ({ default: m.PurchaseHistoryPage })));
const PaymentPage = lazy(() => import('./module/male/pages/PaymentPage').then(m => ({ default: m.PaymentPage })));
const MaleMyProfilePage = lazy(() => import('./module/male/pages/MyProfilePage').then(m => ({ default: m.MyProfilePage })));
const MaleProfileEditPage = lazy(() => import('./module/male/pages/MaleProfileEditPage').then(m => ({ default: m.MaleProfileEditPage })));
const GiftsPage = lazy(() => import('./module/male/pages/GiftsPage').then(m => ({ default: m.GiftsPage })));
const BadgesPage = lazy(() => import('./module/male/pages/BadgesPage').then(m => ({ default: m.BadgesPage })));
const ReferralPage = lazy(() => import('./module/male/pages/ReferralPage').then(m => ({ default: m.ReferralPage })));

// Female module - lazy loaded
const FemaleDashboard = lazy(() => import('./module/female/pages/FemaleDashboard').then(m => ({ default: m.FemaleDashboard })));
const FemaleChatListPage = lazy(() => import('./module/female/pages/ChatListPage').then(m => ({ default: m.ChatListPage })));
const FemaleChatWindowPage = lazy(() => import('./module/female/pages/ChatWindowPage').then(m => ({ default: m.ChatWindowPage })));
const EarningsPage = lazy(() => import('./module/female/pages/EarningsPage').then(m => ({ default: m.EarningsPage })));
const WithdrawalPage = lazy(() => import('./module/female/pages/WithdrawalPage').then(m => ({ default: m.WithdrawalPage })));
const AutoMessageTemplatesPage = lazy(() => import('./module/female/pages/AutoMessageTemplatesPage').then(m => ({ default: m.AutoMessageTemplatesPage })));
const FemaleMyProfilePage = lazy(() => import('./module/female/pages/MyProfilePage').then(m => ({ default: m.MyProfilePage })));
const FemaleNotificationsPage = lazy(() => import('./module/female/pages/NotificationsPage').then(m => ({ default: m.NotificationsPage })));
const FemaleUserProfilePage = lazy(() => import('./module/female/pages/UserProfilePage').then(m => ({ default: m.UserProfilePage })));

// Admin module - lazy loaded
const AdminDashboard = lazy(() => import('./module/admin/pages/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const AdminLoginPage = lazy(() => import('./module/admin/pages/AdminLoginPage').then(m => ({ default: m.AdminLoginPage })));
const UsersManagementPage = lazy(() => import('./module/admin/pages/UsersManagementPage').then(m => ({ default: m.UsersManagementPage })));
const UserDetailPage = lazy(() => import('./module/admin/pages/UserDetailPage').then(m => ({ default: m.UserDetailPage })));
const FemaleApprovalPage = lazy(() => import('./module/admin/pages/FemaleApprovalPage').then(m => ({ default: m.FemaleApprovalPage })));
const FemaleApprovalDetailPage = lazy(() => import('./module/admin/pages/FemaleApprovalDetailPage').then(m => ({ default: m.FemaleApprovalDetailPage })));
const RejectApprovalPage = lazy(() => import('./module/admin/pages/RejectApprovalPage').then(m => ({ default: m.RejectApprovalPage })));
const WithdrawalManagementPage = lazy(() => import('./module/admin/pages/WithdrawalManagementPage').then(m => ({ default: m.WithdrawalManagementPage })));
const RejectWithdrawalPage = lazy(() => import('./module/admin/pages/RejectWithdrawalPage').then(m => ({ default: m.RejectWithdrawalPage })));
const CoinEconomyPage = lazy(() => import('./module/admin/pages/CoinEconomyPage').then(m => ({ default: m.CoinEconomyPage })));
const TransactionsPage = lazy(() => import('./module/admin/pages/TransactionsPage').then(m => ({ default: m.TransactionsPage })));
const SettingsPage = lazy(() => import('./module/admin/pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const ReportsManagementPage = lazy(() => import('./module/admin/pages/ReportsManagementPage').then(m => ({ default: m.ReportsManagementPage })));


function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

// Separate component to access auth context
function AppContent() {
  const { isLoading } = useAuth();

  // Show loading screen while checking auth status
  // This prevents flash of login/language pages
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="flex flex-col items-center gap-4">
          <img src="/HETNAZlogo.jpg" alt="HETNAZ" className="w-20 h-20 rounded-full shadow-lg animate-pulse" />
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}

// Route-aware shell. The male/female experience is a mobile app rendered inside
// a fixed 600px "phone frame"; the admin panel is a full-width desktop dashboard
// (fixed sidebar + lg:ml-64 content) and must break out of that frame.
function AppShell() {
  const { pathname } = useLocation();
  const isAdminRoute = pathname.startsWith('/admin');

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex justify-center overflow-x-hidden">
      <div
        className={`w-full min-h-screen bg-white dark:bg-[#0a0a0a] relative flex flex-col ${
          isAdminRoute ? '' : 'max-w-[600px] shadow-[0_0_100px_rgba(0,0,0,0.8)]'
        }`}
      >
        <FCMInitializer />
        <SocketProvider>
          <SocketQuerySync />
          <GlobalStateProvider>
            <VideoCallProvider>
              <div className="flex-1 flex flex-col relative overflow-hidden">
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      {/* Landing page → default to language selection */}
                      <Route path="/" element={<Navigate to="/select-language" replace />} />

                      {/* Language Selection (First screen) */}
                      <Route path="/select-language" element={<LanguageSelectionPage />} />

                      {/* Auth routes */}
                      <Route path="/signup" element={<SignupPage />} />
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/otp-verification" element={<OtpVerificationPage />} />
                      <Route path="/verification-pending" element={<VerificationPendingPage />} />
                      <Route path="/onboarding/basic-profile" element={<BasicProfilePage />} />
                      <Route path="/onboarding/interests" element={<InterestsPage />} />

                      {/* Male Routes */}
                      <Route element={<ProtectedRoute allowedRoles={['male']} />}>
                        <Route path="/male/dashboard" element={<MaleDashboard />} />
                        <Route path="/male/discover" element={<NearbyFemalesPage />} />
                        <Route path="/male/chats" element={<MaleChatListPage />} />
                        <Route path="/male/chat/:chatId" element={<MaleChatWindowPage />} />
                        <Route path="/male/wallet" element={<WalletPage />} />
                        <Route path="/male/buy-coins" element={<CoinPurchasePage />} />
                        <Route path="/male/profile/:profileId" element={<UserProfilePage />} />
                        <Route path="/male/notifications" element={<MaleNotificationsPage />} />
                        <Route path="/male/purchase-history" element={<PurchaseHistoryPage />} />
                        <Route path="/male/payment" element={<PaymentPage />} />
                        <Route path="/male/my-profile" element={<MaleMyProfilePage />} />
                        <Route path="/male/edit-profile" element={<MaleProfileEditPage />} />
                        <Route path="/male/gifts" element={<GiftsPage />} />
                        <Route path="/male/badges" element={<BadgesPage />} />
                        <Route path="/male/referral" element={<ReferralPage />} />
                      </Route>

                      {/* Female Routes */}
                      <Route element={<ProtectedRoute allowedRoles={['female']} />}>
                        <Route path="/female/dashboard" element={<FemaleDashboard />} />
                        <Route path="/female/chats" element={<FemaleChatListPage />} />
                        <Route path="/female/chat/:chatId" element={<FemaleChatWindowPage />} />
                        <Route path="/female/earnings" element={<EarningsPage />} />
                        <Route path="/female/withdrawal" element={<WithdrawalPage />} />
                        <Route path="/female/auto-messages" element={<AutoMessageTemplatesPage />} />
                        <Route path="/female/my-profile" element={<FemaleMyProfilePage />} />
                        <Route path="/female/notifications" element={<FemaleNotificationsPage />} />
                        <Route path="/female/profile/:profileId" element={<FemaleUserProfilePage />} />
                      </Route>

                      {/* Admin Routes */}
                      <Route path="/admin/login" element={<AdminLoginPage />} />

                      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                        <Route
                          path="/admin/*"
                          element={
                            <AdminStatsProvider>
                              <Routes>
                                <Route path="dashboard" element={<AdminDashboard />} />
                                <Route path="users" element={<UsersManagementPage />} />
                                <Route path="users/:userId" element={<UserDetailPage />} />
                                <Route path="female-approval" element={<FemaleApprovalPage />} />
                                <Route path="female-approval/:userId" element={<FemaleApprovalDetailPage />} />
                                <Route path="female-approval/reject/:userId" element={<RejectApprovalPage />} />
                                <Route path="withdrawals" element={<WithdrawalManagementPage />} />
                                <Route path="withdrawals/reject/:requestId" element={<RejectWithdrawalPage />} />
                                <Route path="coin-economy" element={<CoinEconomyPage />} />
                                <Route path="transactions" element={<TransactionsPage />} />
                                <Route path="reports" element={<ReportsManagementPage />} />
                                <Route path="settings" element={<SettingsPage />} />
                              </Routes>
                            </AdminStatsProvider>
                          }
                        />
                      </Route>


                      {/* Catch-all route for 404 */}
                      <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                  </Suspense>
                  
                  {/* Global Overlays - constrained within max-width */}
                  <VideoCallModal />
                  <InAppNotificationToast />
                </div>
            </VideoCallProvider>
          </GlobalStateProvider>
        </SocketProvider>
      </div>
    </div>
  );
}

export default App;
