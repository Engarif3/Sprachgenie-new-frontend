// import { lazy, Suspense } from "react";
// import App from "../App";
// import { createBrowserRouter } from "react-router-dom";
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
// const DeleteAllWords = lazy(() => import("../View/DeleteAllWords"));
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

// export const router = createBrowserRouter([
//   {
//     path: "/",
//     element: (
//       <Suspense fallback={<div>Loading app...</div>}>
//         <App />
//       </Suspense>
//     ),
//     children: [
//       {
//         path: "/",
//         element: <Home />,
//       },
//       {
//         path: "/words",
//         element: <WordList />,
//       },
//       {
//         path: "/create-word",
//         element: <WordForm />,
//       },
//       {
//         path: "/level",
//         element: <LevelForm />,
//       },
//       {
//         path: "/topic",
//         element: <TopicForm />,
//       },
//       {
//         path: "/article",
//         element: <ArticleForm />,
//       },
//       {
//         path: "/part-of-Speech",
//         element: <PartOfSpeechForm />,
//       },
//       {
//         path: "/level-list",
//         element: <LevelList />,
//       },

//       {
//         path: "edit-word/:id",
//         element: <UpdateWord />,
//       },
//       {
//         path: "delete-all",
//         element: <DeleteAllWords />,
//       },
//       {
//         path: "/favorites",
//         element: <FavoritesList></FavoritesList>,
//       },
//       // {
//       //   path: "/conversations",
//       //   element: <Conversation></Conversation>,
//       // },
//       {
//         path: "/conversation-titles",
//         element: <ConversationTitleList></ConversationTitleList>,
//       },
//       {
//         path: "/conversation/:id",
//         element: <ConversationPage></ConversationPage>,
//       },
//       {
//         path: "/update-conversation",
//         element: <ConversationsList></ConversationsList>,
//       },
//       {
//         path: "/create-conversation",
//         element: <CreateConversation></CreateConversation>,
//       },
//       {
//         path: "/prefix-types",
//         element: <PrefixTypeList></PrefixTypeList>,
//       },
//       {
//         path: "/prefix-list/:id",
//         element: <PrefixList></PrefixList>,
//       },
//       // =============================Grammar ===================================
//       {
//         path: "/grammar",
//         element: <Grammar></Grammar>,
//       },
//       {
//         path: "/grammar/:id",
//         element: <GrammarTopic></GrammarTopic>,
//       },
//       {
//         // path: "/clauses/:id",
//         path: "/clauses",
//         element: <Clauses></Clauses>,
//         // element: <CoordinatingConjunction></CoordinatingConjunction>,
//       },
//       {
//         path: "/clause/:id",
//         element: <Clause />,
//       },
//       {
//         path: "/stories",
//         element: <Stories></Stories>,
//       },
//       {
//         path: "/update-user-status",
//         element: <UpdateUserStatus></UpdateUserStatus>,
//       },
//       {
//         path: "/update-basic-user-status",
//         element: <UpdateBasicUserStatus></UpdateBasicUserStatus>,
//       },
//       {
//         path: "/users-favorite-count",
//         element: <UsersFavoriteCount></UsersFavoriteCount>,
//       },
//       // {
//       //   path: "/dashboard",
//       //   element: <Dashboard></Dashboard>,
//       // },
//       {
//         path: "/past-perfect",
//         element: <PerfectAndPastForm></PerfectAndPastForm>,
//       },

//       //   ========dashboard=======
//       {
//         path: "/dashboard",
//         element: <DashboardLayout />,
//         children: [
//           { index: true, element: <DashboardHome /> },
//           // { path: "favorites", element: <FavoritesList /> },
//           { path: "favorites-words", element: <FavoritesListDashboard /> },
//           { path: "update-user-status", element: <UpdateUserStatus /> },
//           {
//             path: "update-basic-user-status",
//             element: <UpdateBasicUserStatus />,
//           },
//           { path: "topic", element: <TopicForm /> },
//           { path: "create-word", element: <WordForm /> },
//           { path: "create-conversation", element: <CreateConversation /> },
//           { path: "update-conversation", element: <ConversationsList /> },
//           { path: "conversation/:id", element: <ConversationPage /> },
//           { path: "users-favorite-count", element: <UsersFavoriteCount /> },
//           {
//             path: "delete-all",
//             element: <DeleteAllWords />,
//           },
//         ],
//       },

//       //   ========dashboard=======
//     ],
//   },
//   {
//     path: "/login",
//     element: <Login />,
//     // element: <LoginPage />,
//   },
//   {
//     path: "/register",
//     element: <Register></Register>,
//   },
//   {
//     path: "/verify-email",
//     element: <VerifyEmail></VerifyEmail>,
//   },
//   {
//     path: "/resend-verification",
//     element: <ResendVerification></ResendVerification>,
//   },
//   {
//     path: "/forgot-password",
//     element: <ForgotPassword></ForgotPassword>,
//   },
//   { path: "/reset-password", element: <ResetPassword></ResetPassword> },
// ]);

import { lazy, Suspense } from "react";
import App from "../App";
import { createBrowserRouter } from "react-router-dom";

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

// Helper function to wrap pages in Suspense
const withSuspense = (Component) => (
  <Suspense fallback={<div>Loading...</div>}>
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
]);
