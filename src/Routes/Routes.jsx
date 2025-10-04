// import { lazy, Suspense } from "react";
// import App from "../App";
// import { createBrowserRouter } from "react-router-dom";
// import Loader from "../utils/Loader";

// // Lazy-loaded pages
// const Home = lazy(() => import("../View/Home/Home"));
// const WordList = lazy(() => import("../View/Words/WordList/WordList"));
// const Login = lazy(() => import("../login/Login"));
// const Register = lazy(() => import("../register/Register"));
// const VerifyEmail = lazy(() => import("../register/VerifyEmail"));
// const ResendVerification = lazy(() => import("../register/ResendVerification"));
// const ForgotPassword = lazy(() => import("../Auth/ForgotPassword"));
// const ResetPassword = lazy(() => import("../Auth/ResetPassword"));
// const LevelForm = lazy(() => import("../Form/LevelForm"));
// const TopicForm = lazy(() => import("../Form/TopicForm"));
// const ArticleForm = lazy(() => import("../Form/ArticleForm"));
// const PartOfSpeechForm = lazy(() => import("../Form/PartOfSpeechForm"));
// const LevelList = lazy(() => import("../View/LevelList"));
// const UpdateWord = lazy(() => import("../View/Words/Update/UpdateWord"));
// // const DeleteAllWords = lazy(() => import("../View/DeleteAllWords"));
// const WordForm = lazy(() => import("../Form/WordForm"));
// const FavoritesList = lazy(() =>
//   import("../View/Words/Favorite/FavoritesList")
// );
// const ConversationsList = lazy(() =>
//   import("../View/Conversation/ConversationList")
// );
// const CreateConversation = lazy(() =>
//   import("../View/Conversation/CreateConversation")
// );
// const ConversationTitleList = lazy(() =>
//   import("../View/Conversation/ConversationTitleList")
// );
// const ConversationPage = lazy(() =>
//   import("../View/Conversation/ConversationPage")
// );
// const PrefixTypeList = lazy(() => import("../View/Prefix/PrefixTypeList"));
// const PrefixList = lazy(() => import("../View/Prefix/PrefixList"));
// const Grammar = lazy(() => import("../View/Grammar/Grammar"));
// const Clauses = lazy(() => import("../View/Grammar/Clauses/Clauses"));
// const Clause = lazy(() => import("../View/Grammar/Clauses/Clause"));
// const GrammarTopic = lazy(() => import("../View/Grammar/GrammarTopic"));
// const UpdateBasicUserStatus = lazy(() =>
//   import("../AdminActions/Admin/UpdateBasicUserStatus")
// );
// const UpdateUserStatus = lazy(() =>
//   import("../AdminActions/SuperAdmin/UpdateUSerStatus")
// );
// const PerfectAndPastForm = lazy(() =>
//   import("../View/Grammar/PerfectAndPastForm/PerfectAndPastForm")
// );
// const Stories = lazy(() => import("../View/Stories/Stories"));
// const UsersFavoriteCount = lazy(() =>
//   import("../AdminActions/Admin/UsersFavoriteCount")
// );
// const DashboardLayout = lazy(() => import("../dashboard/DashboardLayout"));
// const DashboardHome = lazy(() => import("../dashboard/DashboardHome"));
// const FavoritesListDashboard = lazy(() =>
//   import("../View/Words/Favorite/FavoritesListDashboard")
// );
// const Backend = lazy(() => import("../Backend/Backend"));

// // =================AI====================
// // const UpdateLimits = lazy(() => import("../AI/UpdateLimits"));
// const GlobalLimits = lazy(() => import("../AI/GlobalLimits"));
// const UserLimits = lazy(() => import("../AI/UserLimits"));
// const Usage = lazy(() => import("../AI/Usage"));
// const ReportsByUsers = lazy(() => import("../AI/ReportsByUsers"));

// // import GlobalLimits from "../AI/GlobalLimits";
// // import UserLimits from "../AI/UserLimits";
// // import Usage from "../AI/Usage";

// // =================AI====================

// // Helper function to wrap pages in Suspense
// const withSuspense = (Component) => (
//   // <Suspense fallback={<div className="text-white">Loading...</div>}>
//   <Suspense fallback={<Loader></Loader>}>
//     <Component />
//   </Suspense>
// );

// export const router = createBrowserRouter([
//   {
//     path: "/",
//     element: <App />, // App is always eager
//     children: [
//       { path: "/", element: withSuspense(Home) },
//       { path: "/words", element: withSuspense(WordList) },
//       { path: "/create-word", element: withSuspense(WordForm) },
//       { path: "/level", element: withSuspense(LevelForm) },
//       { path: "/topic", element: withSuspense(TopicForm) },
//       { path: "/article", element: withSuspense(ArticleForm) },
//       { path: "/part-of-Speech", element: withSuspense(PartOfSpeechForm) },
//       { path: "/level-list", element: withSuspense(LevelList) },
//       { path: "/edit-word/:id", element: withSuspense(UpdateWord) },
//       // { path: "/delete-all", element: withSuspense(DeleteAllWords) },
//       { path: "/favorites", element: withSuspense(FavoritesList) },
//       {
//         path: "/conversation-titles",
//         element: withSuspense(ConversationTitleList),
//       },
//       { path: "/conversation/:id", element: withSuspense(ConversationPage) },
//       {
//         path: "/update-conversation",
//         element: withSuspense(ConversationsList),
//       },
//       {
//         path: "/create-conversation",
//         element: withSuspense(CreateConversation),
//       },
//       { path: "/prefix-types", element: withSuspense(PrefixTypeList) },
//       { path: "/prefix-list/:id", element: withSuspense(PrefixList) },
//       { path: "/grammar", element: withSuspense(Grammar) },
//       { path: "/grammar/:id", element: withSuspense(GrammarTopic) },
//       { path: "/clauses", element: withSuspense(Clauses) },
//       { path: "/clause/:id", element: withSuspense(Clause) },
//       { path: "/stories", element: withSuspense(Stories) },
//       { path: "/update-user-status", element: withSuspense(UpdateUserStatus) },
//       {
//         path: "/update-basic-user-status",
//         element: withSuspense(UpdateBasicUserStatus),
//       },
//       {
//         path: "/users-favorite-count",
//         element: withSuspense(UsersFavoriteCount),
//       },
//       { path: "/past-perfect", element: withSuspense(PerfectAndPastForm) },
//       {
//         path: "/dashboard",
//         element: withSuspense(DashboardLayout),
//         children: [
//           { index: true, element: withSuspense(DashboardHome) },
//           {
//             path: "favorites-words",
//             element: withSuspense(FavoritesListDashboard),
//           },
//           {
//             path: "update-user-status",
//             element: withSuspense(UpdateUserStatus),
//           },
//           {
//             path: "update-basic-user-status",
//             element: withSuspense(UpdateBasicUserStatus),
//           },
//           { path: "topic", element: withSuspense(TopicForm) },
//           { path: "create-word", element: withSuspense(WordForm) },
//           {
//             path: "create-conversation",
//             element: withSuspense(CreateConversation),
//           },
//           {
//             path: "update-conversation",
//             element: withSuspense(ConversationsList),
//           },
//           { path: "conversation/:id", element: withSuspense(ConversationPage) },
//           {
//             path: "users-favorite-count",
//             element: withSuspense(UsersFavoriteCount),
//           },
//           // { path: "delete-all", element: withSuspense(DeleteAllWords) },

//           {
//             path: "global-limits",
//             element: withSuspense(GlobalLimits),
//           },
//           {
//             path: "user-limits",
//             element: withSuspense(UserLimits),
//           },
//           {
//             path: "get-usage",
//             element: withSuspense(Usage),
//           },
//           {
//             path: "get-reports",
//             element: withSuspense(ReportsByUsers),
//           },
//         ],
//       },
//     ],
//   },
//   { path: "/login", element: withSuspense(Login) },
//   { path: "/register", element: withSuspense(Register) },
//   { path: "/verify-email", element: withSuspense(VerifyEmail) },
//   { path: "/resend-verification", element: withSuspense(ResendVerification) },
//   { path: "/forgot-password", element: withSuspense(ForgotPassword) },
//   { path: "/reset-password", element: withSuspense(ResetPassword) },
//   { path: "/backend", element: withSuspense(Backend) },
// ]);

import { lazy, Suspense } from "react";
import App from "../App";
import { createBrowserRouter } from "react-router-dom";
import Loader from "../utils/Loader";
import ProtectedRoute from "./ProtectedRoute";

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
        ],
      },
    ],
  },
  { path: "/login", element: <LoginWithSuspense /> },
  { path: "/register", element: <RegisterWithSuspense /> },
  { path: "/verify-email", element: <VerifyEmailWithSuspense /> },
  { path: "/resend-verification", element: <ResendVerificationWithSuspense /> },
  { path: "/forgot-password", element: <ForgotPasswordWithSuspense /> },
  { path: "/reset-password", element: <ResetPasswordWithSuspense /> },
  { path: "/backend", element: <BackendWithSuspense /> },
]);
