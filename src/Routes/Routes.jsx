import { lazy, Suspense } from "react";
import App from "../App";
import { createBrowserRouter } from "react-router-dom";
import Loader from "../utils/Loader";

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
const DeleteAllWords = lazy(() => import("../View/DeleteAllWords"));
const WordForm = lazy(() => import("../Form/WordForm"));
const FavoritesList = lazy(() =>
  import("../View/Words/Favorite/FavoritesList")
);
const ConversationsList = lazy(() =>
  import("../View/Conversation/ConversationList")
);
const CreateConversation = lazy(() =>
  import("../View/Conversation/CreateConversation")
);
const ConversationTitleList = lazy(() =>
  import("../View/Conversation/ConversationTitleList")
);
const ConversationPage = lazy(() =>
  import("../View/Conversation/ConversationPage")
);
const PrefixTypeList = lazy(() => import("../View/Prefix/PrefixTypeList"));
const PrefixList = lazy(() => import("../View/Prefix/PrefixList"));
const Grammar = lazy(() => import("../View/Grammar/Grammar"));
const Clauses = lazy(() => import("../View/Grammar/Clauses/Clauses"));
const Clause = lazy(() => import("../View/Grammar/Clauses/Clause"));
const GrammarTopic = lazy(() => import("../View/Grammar/GrammarTopic"));
const UpdateBasicUserStatus = lazy(() =>
  import("../AdminActions/Admin/UpdateBasicUserStatus")
);
const UpdateUserStatus = lazy(() =>
  import("../AdminActions/SuperAdmin/UpdateUSerStatus")
);
const PerfectAndPastForm = lazy(() =>
  import("../View/Grammar/PerfectAndPastForm/PerfectAndPastForm")
);
const Stories = lazy(() => import("../View/Stories/Stories"));
const UsersFavoriteCount = lazy(() =>
  import("../AdminActions/Admin/UsersFavoriteCount")
);
const DashboardLayout = lazy(() => import("../dashboard/DashboardLayout"));
const DashboardHome = lazy(() => import("../dashboard/DashboardHome"));
const FavoritesListDashboard = lazy(() =>
  import("../View/Words/Favorite/FavoritesListDashboard")
);
const Backend = lazy(() => import("../Backend/Backend"));

// =================AI====================
// const UpdateLimits = lazy(() => import("../AI/UpdateLimits"));
const GlobalLimits = lazy(() => import("../AI/GlobalLimits"));
const UserLimits = lazy(() => import("../AI/UserLimits"));
const Usage = lazy(() => import("../AI/Usage"));
const ReportsByUsers = lazy(() => import("../AI/ReportsByUsers"));

// import GlobalLimits from "../AI/GlobalLimits";
// import UserLimits from "../AI/UserLimits";
// import Usage from "../AI/Usage";

// =================AI====================

// Helper function to wrap pages in Suspense
const withSuspense = (Component) => (
  // <Suspense fallback={<div className="text-white">Loading...</div>}>
  <Suspense fallback={<Loader></Loader>}>
    <Component />
  </Suspense>
);

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />, // App is always eager
    children: [
      { path: "/", element: withSuspense(Home) },
      { path: "/words", element: withSuspense(WordList) },
      { path: "/create-word", element: withSuspense(WordForm) },
      { path: "/level", element: withSuspense(LevelForm) },
      { path: "/topic", element: withSuspense(TopicForm) },
      { path: "/article", element: withSuspense(ArticleForm) },
      { path: "/part-of-Speech", element: withSuspense(PartOfSpeechForm) },
      { path: "/level-list", element: withSuspense(LevelList) },
      { path: "/edit-word/:id", element: withSuspense(UpdateWord) },
      { path: "/delete-all", element: withSuspense(DeleteAllWords) },
      { path: "/favorites", element: withSuspense(FavoritesList) },
      {
        path: "/conversation-titles",
        element: withSuspense(ConversationTitleList),
      },
      { path: "/conversation/:id", element: withSuspense(ConversationPage) },
      {
        path: "/update-conversation",
        element: withSuspense(ConversationsList),
      },
      {
        path: "/create-conversation",
        element: withSuspense(CreateConversation),
      },
      { path: "/prefix-types", element: withSuspense(PrefixTypeList) },
      { path: "/prefix-list/:id", element: withSuspense(PrefixList) },
      { path: "/grammar", element: withSuspense(Grammar) },
      { path: "/grammar/:id", element: withSuspense(GrammarTopic) },
      { path: "/clauses", element: withSuspense(Clauses) },
      { path: "/clause/:id", element: withSuspense(Clause) },
      { path: "/stories", element: withSuspense(Stories) },
      { path: "/update-user-status", element: withSuspense(UpdateUserStatus) },
      {
        path: "/update-basic-user-status",
        element: withSuspense(UpdateBasicUserStatus),
      },
      {
        path: "/users-favorite-count",
        element: withSuspense(UsersFavoriteCount),
      },
      { path: "/past-perfect", element: withSuspense(PerfectAndPastForm) },
      {
        path: "/dashboard",
        element: withSuspense(DashboardLayout),
        children: [
          { index: true, element: withSuspense(DashboardHome) },
          {
            path: "favorites-words",
            element: withSuspense(FavoritesListDashboard),
          },
          {
            path: "update-user-status",
            element: withSuspense(UpdateUserStatus),
          },
          {
            path: "update-basic-user-status",
            element: withSuspense(UpdateBasicUserStatus),
          },
          { path: "topic", element: withSuspense(TopicForm) },
          { path: "create-word", element: withSuspense(WordForm) },
          {
            path: "create-conversation",
            element: withSuspense(CreateConversation),
          },
          {
            path: "update-conversation",
            element: withSuspense(ConversationsList),
          },
          { path: "conversation/:id", element: withSuspense(ConversationPage) },
          {
            path: "users-favorite-count",
            element: withSuspense(UsersFavoriteCount),
          },
          { path: "delete-all", element: withSuspense(DeleteAllWords) },

          {
            path: "global-limits",
            element: withSuspense(GlobalLimits),
          },
          {
            path: "user-limits",
            element: withSuspense(UserLimits),
          },
          {
            path: "get-usage",
            element: withSuspense(Usage),
          },
          {
            path: "get-reports",
            element: withSuspense(ReportsByUsers),
          },
        ],
      },
    ],
  },
  { path: "/login", element: withSuspense(Login) },
  { path: "/register", element: withSuspense(Register) },
  { path: "/verify-email", element: withSuspense(VerifyEmail) },
  { path: "/resend-verification", element: withSuspense(ResendVerification) },
  { path: "/forgot-password", element: withSuspense(ForgotPassword) },
  { path: "/reset-password", element: withSuspense(ResetPassword) },
  { path: "/backend", element: withSuspense(Backend) },
]);
