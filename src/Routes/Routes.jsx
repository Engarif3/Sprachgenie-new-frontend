import { lazy, Suspense } from "react";
import App from "../App";
import { createBrowserRouter } from "react-router-dom";
import Loader from "../utils/Loader";
import ProtectedRoute, { PublicRoute } from "./ProtectedRoute";

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
const PerfectAndPastForm = lazy(
  () => import("../View/Grammar/PerfectAndPastForm/PerfectAndPastForm"),
);
const Stories = lazy(() => import("../View/Stories/Stories"));
const UsersFavoriteCount = lazy(
  () => import("../AdminActions/Admin/UsersFavoriteCount"),
);
const DashboardLayout = lazy(() => import("../dashboard/DashboardLayout"));
const DashboardHome = lazy(() => import("../dashboard/DashboardHome"));
const AdminVisitorsPage = lazy(() => import("../dashboard/AdminVisitorsPage"));
const FavoritesListDashboard = lazy(
  () => import("../View/Words/Favorite/FavoritesListDashboard"),
);
const Backend = lazy(() => import("../Backend/Backend"));

// AI Pages
const GlobalLimits = lazy(() => import("../AI/GlobalLimits"));
const UserLimits = lazy(() => import("../AI/UserLimits"));
const Usage = lazy(() => import("../AI/Usage"));
const ReportsByUsers = lazy(() => import("../AI/ReportsByUsers"));

//translator
const Translator = lazy(() => import("../Translate/Translator"));

// Quiz
const Quiz = lazy(() => import("../View/Quiz/Quiz"));

// Helper to wrap lazy components with Suspense
const withSuspense = (Component) => {
  return (props) => (
    <Suspense fallback={<Loader loading={true} />}>
      <Component {...props} />
    </Suspense>
  );
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
const PerfectAndPastFormWithSuspense = withSuspense(PerfectAndPastForm);
const StoriesWithSuspense = withSuspense(Stories);
const UsersFavoriteCountWithSuspense = withSuspense(UsersFavoriteCount);
const DashboardLayoutWithSuspense = withSuspense(DashboardLayout);
const DashboardHomeWithSuspense = withSuspense(DashboardHome);
const AdminVisitorsPageWithSuspense = withSuspense(AdminVisitorsPage);
const FavoritesListDashboardWithSuspense = withSuspense(FavoritesListDashboard);
const BackendWithSuspense = withSuspense(Backend);
const GlobalLimitsWithSuspense = withSuspense(GlobalLimits);
const UserLimitsWithSuspense = withSuspense(UserLimits);
const UsageWithSuspense = withSuspense(Usage);
const ReportsByUsersWithSuspense = withSuspense(ReportsByUsers);

//translator
const TranslatorWithSuspense = withSuspense(Translator);

//Quiz
const QuizWithSuspense = withSuspense(Quiz);

// System Status
const SystemStatusPage = lazy(() => import("../dashboard/SystemStatusPage"));
const SystemStatusPageWithSuspense = withSuspense(SystemStatusPage);

// Router
export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { path: "/", element: <HomeWithSuspense /> },
      { path: "/words", element: <WordListWithSuspense /> },
      { path: "/create-word", element: <WordFormWithSuspense /> },
      { path: "/level", element: <LevelFormWithSuspense /> },
      { path: "/topic", element: <TopicFormWithSuspense /> },
      { path: "/article", element: <ArticleFormWithSuspense /> },
      { path: "/part-of-Speech", element: <PartOfSpeechFormWithSuspense /> },
      { path: "/level-list", element: <LevelListWithSuspense /> },
      { path: "/edit-word/:id", element: <UpdateWordWithSuspense /> },
      { path: "/favorites", element: <FavoritesListWithSuspense /> },
      {
        path: "/conversation-titles",
        element: <ConversationTitleListWithSuspense />,
      },
      { path: "/conversation/:id", element: <ConversationPageWithSuspense /> },
      {
        path: "/update-conversation",
        element: <ConversationsListWithSuspense />,
      },
      {
        path: "/create-conversation",
        element: <CreateConversationWithSuspense />,
      },
      { path: "/prefix-types", element: <PrefixTypeListWithSuspense /> },
      { path: "/prefix-list/:id", element: <PrefixListWithSuspense /> },
      { path: "/grammar", element: <GrammarWithSuspense /> },
      { path: "/grammar/:id", element: <GrammarTopicWithSuspense /> },
      { path: "/clauses", element: <ClausesWithSuspense /> },
      { path: "/clause/:id", element: <ClauseWithSuspense /> },
      { path: "/stories", element: <StoriesWithSuspense /> },
      {
        path: "/update-user-status",
        element: <UpdateUserStatusWithSuspense />,
      },
      {
        path: "/update-basic-user-status",
        element: <UpdateBasicUserStatusWithSuspense />,
      },
      {
        path: "/users-favorite-count",
        element: <UsersFavoriteCountWithSuspense />,
      },
      { path: "/past-perfect", element: <PerfectAndPastFormWithSuspense /> },
      //translator
      { path: "/translator", element: <TranslatorWithSuspense /> },

      //Quiz
      { path: "/quiz", element: <QuizWithSuspense /> },

      {
        path: "/dashboard",
        // element: <DashboardLayoutWithSuspense />,
        element: (
          <ProtectedRoute>
            <DashboardLayoutWithSuspense />
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <DashboardHomeWithSuspense /> },
          {
            path: "visitors",
            element: <AdminVisitorsPageWithSuspense />,
          },
          {
            path: "favorites-words",
            element: <FavoritesListDashboardWithSuspense />,
          },
          {
            path: "update-user-status",
            element: <UpdateUserStatusWithSuspense />,
          },
          {
            path: "update-basic-user-status",
            element: <UpdateBasicUserStatusWithSuspense />,
          },
          { path: "topic", element: <TopicFormWithSuspense /> },
          { path: "create-word", element: <WordFormWithSuspense /> },
          {
            path: "create-conversation",
            element: <CreateConversationWithSuspense />,
          },
          {
            path: "update-conversation",
            element: <ConversationsListWithSuspense />,
          },
          {
            path: "conversation/:id",
            element: <ConversationPageWithSuspense />,
          },
          {
            path: "users-favorite-count",
            element: <UsersFavoriteCountWithSuspense />,
          },
          { path: "global-limits", element: <GlobalLimitsWithSuspense /> },
          { path: "user-limits", element: <UserLimitsWithSuspense /> },
          { path: "get-usage", element: <UsageWithSuspense /> },
          { path: "get-reports", element: <ReportsByUsersWithSuspense /> },
          { path: "system-status", element: <SystemStatusPageWithSuspense /> },
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
  { path: "/resend-verification", element: <ResendVerificationWithSuspense /> },
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
]);
