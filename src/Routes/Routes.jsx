import { lazy, Suspense } from "react";
import App from "../App";
import { createBrowserRouter } from "react-router-dom";
import Loader from "../utils/Loader";
import ProtectedRoute, { PublicRoute } from "./ProtectedRoute";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];
const SUPER_ADMIN_ROLES = ["SUPER_ADMIN"];

const protectRoute = (element, allowedRoles) => (
  <ProtectedRoute allowedRoles={allowedRoles}>{element}</ProtectedRoute>
);

// Lazy-loaded pages
const Home = lazy(() => import("../View/Home/Home"));
const WordList = lazy(() => import("../View/Words/WordList/WordList"));
const Login = lazy(() => import("../login/Login"));
const Register = lazy(() => import("../register/Register"));
const VerifyEmail = lazy(() => import("../register/VerifyEmail"));
const ResendVerification = lazy(() => import("../register/ResendVerification"));
const ForgotPassword = lazy(() => import("../Auth/ForgotPassword"));
const ResetPassword = lazy(() => import("../Auth/ResetPassword"));
const LevelForm = lazy(() => import("../Form/LevelForm"));
const TopicForm = lazy(() => import("../Form/TopicForm"));
const UpdateTopicForm = lazy(() => import("../Form/UpdateTopicForm"));
const ArticleForm = lazy(() => import("../Form/ArticleForm"));
const PartOfSpeechForm = lazy(() => import("../Form/PartOfSpeechForm"));
const LevelList = lazy(() => import("../View/LevelList"));
const UpdateWord = lazy(() => import("../View/Words/Update/UpdateWord"));
const WordForm = lazy(() => import("../Form/WordForm"));
const FavoritesList = lazy(
  () => import("../View/Words/Favorite/FavoritesList"),
);
const ConversationsList = lazy(
  () => import("../View/Conversation/ConversationList"),
);
const CreateConversation = lazy(
  () => import("../View/Conversation/CreateConversation"),
);
const ConversationTitleList = lazy(
  () => import("../View/Conversation/ConversationTitleList"),
);
const ConversationPage = lazy(
  () => import("../View/Conversation/ConversationPage"),
);
const PrefixTypeList = lazy(() => import("../View/Prefix/PrefixTypeList"));
const PrefixList = lazy(() => import("../View/Prefix/PrefixList"));
const Grammar = lazy(() => import("../View/Grammar/Grammar"));
const Clauses = lazy(() => import("../View/Grammar/Clauses/Clauses"));
const Clause = lazy(() => import("../View/Grammar/Clauses/Clause"));
const GrammarTopic = lazy(() => import("../View/Grammar/GrammarTopic"));
const UpdateBasicUserStatus = lazy(
  () => import("../AdminActions/Admin/UpdateBasicUserStatus"),
);
const UpdateUserStatus = lazy(
  () => import("../AdminActions/SuperAdmin/UpdateUSerStatus"),
);
const GenerateStory = lazy(
  () => import("../AdminActions/SuperAdmin/GenerateStory"),
);
const StoriesManagement = lazy(
  () => import("../AdminActions/SuperAdmin/StoriesManagement"),
);
const PerfectAndPastForm = lazy(
  () => import("../View/Grammar/PerfectAndPastForm/PerfectAndPastForm"),
);
const Stories = lazy(() => import("../View/Stories/Stories"));
const RadioChannels = lazy(() => import("../View/Radio/RadioChannels"));
const ChallengeSession = lazy(() => import("../View/Challenge/ChallengeSession"));
const Leaderboard = lazy(() => import("../View/Challenge/Leaderboard"));
const UsersFavoriteCount = lazy(
  () => import("../AdminActions/Admin/UsersFavoriteCount"),
);
const DashboardLayout = lazy(() => import("../dashboard/DashboardLayout"));
const DashboardHome = lazy(() => import("../dashboard/DashboardHome"));
const ProfilePage = lazy(() => import("../dashboard/ProfilePage"));
const AdminVisitorsPage = lazy(() => import("../dashboard/AdminVisitorsPage"));
const AdminRegistrationMetadataPage = lazy(
  () => import("../dashboard/AdminRegistrationMetadataPage"),
);
const ErrorLogsPage = lazy(() => import("../dashboard/ErrorLogsPage"));
const FavoritesListDashboard = lazy(
  () => import("../View/Words/Favorite/FavoritesListDashboard"),
);
const Backend = lazy(() => import("../Backend/Backend"));

// AI Pages
const GlobalLimits = lazy(() => import("../AI/GlobalLimits"));
const UserLimits = lazy(() => import("../AI/UserLimits"));
const Usage = lazy(() => import("../AI/Usage"));
const ReportsByUsers = lazy(() => import("../AI/ReportsByUsers"));
const ConjugationReportsPage = lazy(() => import("../AI/ConjugationReportsPage"));

//translator
const Translator = lazy(() => import("../Translate/Translator"));

// Quiz
const Quiz = lazy(() => import("../View/Quiz/Quiz"));

// Helper to wrap lazy components with Suspense
const withSuspense = (Component) => {
  const WrappedComponent = (props) => (
    <Suspense fallback={<Loader loading={true} />}>
      <Component {...props} />
    </Suspense>
  );

  WrappedComponent.displayName = `withSuspense(${Component.displayName || Component.name || "Component"})`;

  return WrappedComponent;
};

// Wrap components
const HomeWithSuspense = withSuspense(Home);
const WordListWithSuspense = withSuspense(WordList);
const LoginWithSuspense = withSuspense(Login);
const RegisterWithSuspense = withSuspense(Register);
const VerifyEmailWithSuspense = withSuspense(VerifyEmail);
const ResendVerificationWithSuspense = withSuspense(ResendVerification);
const ForgotPasswordWithSuspense = withSuspense(ForgotPassword);
const ResetPasswordWithSuspense = withSuspense(ResetPassword);
const LevelFormWithSuspense = withSuspense(LevelForm);
const TopicFormWithSuspense = withSuspense(TopicForm);
const UpdateTopicFormWithSuspense = withSuspense(UpdateTopicForm);
const ArticleFormWithSuspense = withSuspense(ArticleForm);
const PartOfSpeechFormWithSuspense = withSuspense(PartOfSpeechForm);
const LevelListWithSuspense = withSuspense(LevelList);
const UpdateWordWithSuspense = withSuspense(UpdateWord);
const WordFormWithSuspense = withSuspense(WordForm);
const FavoritesListWithSuspense = withSuspense(FavoritesList);
const ConversationsListWithSuspense = withSuspense(ConversationsList);
const CreateConversationWithSuspense = withSuspense(CreateConversation);
const ConversationTitleListWithSuspense = withSuspense(ConversationTitleList);
const ConversationPageWithSuspense = withSuspense(ConversationPage);
const PrefixTypeListWithSuspense = withSuspense(PrefixTypeList);
const PrefixListWithSuspense = withSuspense(PrefixList);
const GrammarWithSuspense = withSuspense(Grammar);
const ClausesWithSuspense = withSuspense(Clauses);
const ClauseWithSuspense = withSuspense(Clause);
const GrammarTopicWithSuspense = withSuspense(GrammarTopic);
const UpdateBasicUserStatusWithSuspense = withSuspense(UpdateBasicUserStatus);
const UpdateUserStatusWithSuspense = withSuspense(UpdateUserStatus);
const GenerateStoryWithSuspense = withSuspense(GenerateStory);
const StoriesManagementWithSuspense = withSuspense(StoriesManagement);
const PerfectAndPastFormWithSuspense = withSuspense(PerfectAndPastForm);
const StoriesWithSuspense = withSuspense(Stories);
const RadioChannelsWithSuspense = withSuspense(RadioChannels);
const ChallengeSessionWithSuspense = withSuspense(ChallengeSession);
const LeaderboardWithSuspense = withSuspense(Leaderboard);
const UsersFavoriteCountWithSuspense = withSuspense(UsersFavoriteCount);
const DashboardLayoutWithSuspense = withSuspense(DashboardLayout);
const DashboardHomeWithSuspense = withSuspense(DashboardHome);
const ProfilePageWithSuspense = withSuspense(ProfilePage);
const AdminVisitorsPageWithSuspense = withSuspense(AdminVisitorsPage);
const AdminRegistrationMetadataPageWithSuspense = withSuspense(
  AdminRegistrationMetadataPage,
);
const ErrorLogsPageWithSuspense = withSuspense(ErrorLogsPage);
const FavoritesListDashboardWithSuspense = withSuspense(FavoritesListDashboard);
const BackendWithSuspense = withSuspense(Backend);
const GlobalLimitsWithSuspense = withSuspense(GlobalLimits);
const UserLimitsWithSuspense = withSuspense(UserLimits);
const UsageWithSuspense = withSuspense(Usage);
const ReportsByUsersWithSuspense = withSuspense(ReportsByUsers);
const ConjugationReportsPageWithSuspense = withSuspense(ConjugationReportsPage);

//translator
const TranslatorWithSuspense = withSuspense(Translator);

//Quiz
const QuizWithSuspense = withSuspense(Quiz);

// System Status
const SystemStatusPage = lazy(() => import("../dashboard/SystemStatusPage"));
const SystemStatusPageWithSuspense = withSuspense(SystemStatusPage);
const VisitorsInfoPage = lazy(() => import("../dashboard/VisitorsInfoPage"));
const VisitorsInfoPageWithSuspense = withSuspense(VisitorsInfoPage);

// Router
export const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <App />,
      children: [
        { path: "/", element: <HomeWithSuspense /> },
        { path: "/words", element: <WordListWithSuspense /> },
        {
          path: "/create-word",
          element: protectRoute(<WordFormWithSuspense />, ADMIN_ROLES),
        },
        {
          path: "/level",
          element: protectRoute(<LevelFormWithSuspense />, ADMIN_ROLES),
        },
        {
          path: "/topic",
          element: protectRoute(<TopicFormWithSuspense />, SUPER_ADMIN_ROLES),
        },
        {
          path: "/article",
          element: protectRoute(<ArticleFormWithSuspense />, ADMIN_ROLES),
        },
        {
          path: "/part-of-Speech",
          element: protectRoute(<PartOfSpeechFormWithSuspense />, ADMIN_ROLES),
        },
        {
          path: "/level-list",
          element: protectRoute(<LevelListWithSuspense />, ADMIN_ROLES),
        },
        {
          path: "/edit-word/:id",
          element: protectRoute(<UpdateWordWithSuspense />, ADMIN_ROLES),
        },
        { path: "/favorites", element: <FavoritesListWithSuspense /> },
        {
          path: "/conversation-titles",
          element: <ConversationTitleListWithSuspense />,
        },
        {
          path: "/conversation/:id",
          element: <ConversationPageWithSuspense />,
        },
        {
          path: "/update-conversation",
          element: protectRoute(<ConversationsListWithSuspense />, ADMIN_ROLES),
        },
        {
          path: "/create-conversation",
          element: protectRoute(
            <CreateConversationWithSuspense />,
            ADMIN_ROLES,
          ),
        },
        { path: "/prefix-types", element: <PrefixTypeListWithSuspense /> },
        { path: "/prefix-list/:id", element: <PrefixListWithSuspense /> },
        { path: "/grammar", element: <GrammarWithSuspense /> },
        { path: "/grammar/:id", element: <GrammarTopicWithSuspense /> },
        { path: "/clauses", element: <ClausesWithSuspense /> },
        { path: "/clause/:id", element: <ClauseWithSuspense /> },
        { path: "/stories", element: <StoriesWithSuspense /> },
        { path: "/radio", element: <RadioChannelsWithSuspense /> },
        {
          path: "/update-user-status",
          element: protectRoute(
            <UpdateUserStatusWithSuspense />,
            SUPER_ADMIN_ROLES,
          ),
        },
        {
          path: "/update-basic-user-status",
          element: protectRoute(
            <UpdateBasicUserStatusWithSuspense />,
            ADMIN_ROLES,
          ),
        },
        {
          path: "/users-favorite-count",
          element: protectRoute(
            <UsersFavoriteCountWithSuspense />,
            ADMIN_ROLES,
          ),
        },
        { path: "/past-perfect", element: <PerfectAndPastFormWithSuspense /> },
        //translator
        { path: "/translator", element: <TranslatorWithSuspense /> },

        //Quiz
        { path: "/quiz", element: <QuizWithSuspense /> },

        //Daily Challenge — publicly viewable and playable (practice mode
        // for guests, gated inline inside ChallengeSession). The
        // leaderboard page is also public, but shows a blurred placeholder
        // + login prompt to logged-out visitors instead of real data.
        {
          path: "/challenge",
          element: <ChallengeSessionWithSuspense />,
        },
        {
          path: "/challenge/leaderboard",
          element: <LeaderboardWithSuspense />,
        },

        {
          path: "/dashboard",
          element: protectRoute(<DashboardLayoutWithSuspense />),
          children: [
            { index: true, element: <DashboardHomeWithSuspense /> },
            {
              path: "profile",
              element: <ProfilePageWithSuspense />,
            },
            {
              path: "visitors",
              element: protectRoute(
                <AdminVisitorsPageWithSuspense />,
                ADMIN_ROLES,
              ),
            },
            {
              path: "registration-metadata",
              element: protectRoute(
                <AdminRegistrationMetadataPageWithSuspense />,
                ADMIN_ROLES,
              ),
            },
            {
              path: "error-logs",
              element: protectRoute(
                <ErrorLogsPageWithSuspense />,
                ADMIN_ROLES,
              ),
            },
            {
              path: "favorites-words",
              element: <FavoritesListDashboardWithSuspense />,
            },
            {
              path: "update-user-status",
              element: protectRoute(
                <UpdateUserStatusWithSuspense />,
                SUPER_ADMIN_ROLES,
              ),
            },
            {
              path: "update-basic-user-status",
              element: protectRoute(
                <UpdateBasicUserStatusWithSuspense />,
                ADMIN_ROLES,
              ),
            },
            {
              path: "topic",
              element: protectRoute(
                <TopicFormWithSuspense />,
                SUPER_ADMIN_ROLES,
              ),
            },
            {
              path: "update-topic",
              element: protectRoute(
                <UpdateTopicFormWithSuspense />,
                SUPER_ADMIN_ROLES,
              ),
            },
            {
              path: "create-word",
              element: protectRoute(<WordFormWithSuspense />, ADMIN_ROLES),
            },
            {
              path: "generate-story",
              element: protectRoute(<GenerateStoryWithSuspense />, ADMIN_ROLES),
            },
            {
              path: "stories-management",
              element: protectRoute(
                <StoriesManagementWithSuspense />,
                ADMIN_ROLES,
              ),
            },
            {
              path: "create-conversation",
              element: protectRoute(
                <CreateConversationWithSuspense />,
                ADMIN_ROLES,
              ),
            },
            {
              path: "update-conversation",
              element: protectRoute(
                <ConversationsListWithSuspense />,
                ADMIN_ROLES,
              ),
            },
            {
              path: "conversation/:id",
              element: <ConversationPageWithSuspense />,
            },
            {
              path: "users-favorite-count",
              element: protectRoute(
                <UsersFavoriteCountWithSuspense />,
                ADMIN_ROLES,
              ),
            },
            {
              path: "global-limits",
              element: protectRoute(<GlobalLimitsWithSuspense />, ADMIN_ROLES),
            },
            {
              path: "user-limits",
              element: protectRoute(<UserLimitsWithSuspense />, ADMIN_ROLES),
            },
            {
              path: "get-usage",
              element: protectRoute(<UsageWithSuspense />, ADMIN_ROLES),
            },
            {
              path: "get-reports",
              element: protectRoute(
                <ReportsByUsersWithSuspense />,
                ADMIN_ROLES,
              ),
            },
            {
              path: "conjugation-reports",
              element: protectRoute(
                <ConjugationReportsPageWithSuspense />,
                ADMIN_ROLES,
              ),
            },
            {
              path: "system-status",
              element: protectRoute(
                <SystemStatusPageWithSuspense />,
                ADMIN_ROLES,
              ),
            },
            {
              path: "visitors-info",
              element: protectRoute(
                <VisitorsInfoPageWithSuspense />,
                ADMIN_ROLES,
              ),
            },
          ],
        },
      ],
    },
    {
      path: "/login",
      element: (
        <PublicRoute>
          <LoginWithSuspense />
        </PublicRoute>
      ),
    },
    {
      path: "/register",
      element: (
        <PublicRoute>
          <RegisterWithSuspense />
        </PublicRoute>
      ),
    },
    { path: "/verify-email", element: <VerifyEmailWithSuspense /> },
    {
      path: "/resend-verification",
      element: <ResendVerificationWithSuspense />,
    },
    {
      path: "/forgot-password",
      element: (
        <PublicRoute>
          <ForgotPasswordWithSuspense />
        </PublicRoute>
      ),
    },
    {
      path: "/reset-password",
      element: (
        <PublicRoute>
          <ResetPasswordWithSuspense />
        </PublicRoute>
      ),
    },
    { path: "/backend", element: <BackendWithSuspense /> },
  ],
  {
    future: {
      v7_relativeSplatPath: true,
    },
  },
);
