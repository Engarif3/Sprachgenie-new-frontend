import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import LevelForm from "../Form/LevelForm";
import TopicForm from "../Form/TopicForm";
import ArticleForm from "../Form/ArticleForm";
import PartOfSpeechForm from "../Form/PartOfSpeechForm";
import LevelList from "../View/LevelList";
import WordList from "../View/Words/WordList/WordList";
import UpdateWord from "../View/Words/Update/UpdateWord";
import DeleteAllWords from "../View/DeleteAllWords";
import WordForm from "../Form/WordForm";
import Register from "../register/Register";
import FavoritesList from "../View/Words/Favorite/FavoritesList";
import ResendVerification from "../register/ResendVerification";
import VerifyEmail from "../register/VerifyEmail";
import ConversationsList from "../View/Conversation/ConversationList";
import CreateConversation from "../View/Conversation/CreateConversation";
import ConversationTitleList from "../View/Conversation/ConversationTitleList";
import ConversationPage from "../View/Conversation/ConversationPage";
import Home from "../View/Home/Home";
import PrefixTypeList from "../View/Prefix/PrefixTypeList";
import PrefixList from "../View/Prefix/PrefixList";
import Grammar from "../View/Grammar/Grammar";
import Clauses from "../View/Grammar/Clauses/Clauses";
import Clause from "../View/Grammar/Clauses/Clause";
import GrammarTopic from "../View/Grammar/GrammarTopic";
import ForgotPassword from "../Auth/ForgotPassword";
import ResetPassword from "../Auth/ResetPassword";
import UpdateBasicUserStatus from "../AdminActions/Admin/UpdateBasicUserStatus";
import UpdateUserStatus from "../AdminActions/SuperAdmin/UpdateUSerStatus";
import PerfectAndPastForm from "../View/Grammar/PerfectAndPastForm/PerfectAndPastForm";
import Stories from "../View/Stories/Stories";
import Login from "../login/Login";
import UsersFavoriteCount from "../AdminActions/Admin/UsersFavoriteCount";
// import Dashboard from "../dashboard/Dashboard";
import DashboardLayout from "../dashboard/DashboardLayout";
import DashboardHome from "../dashboard/DashboardHome";
import FavoritesListDashboard from "../View/Words/Favorite/FavoritesListDashboard";

export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <Suspense fallback={<div>Loading...</div>}>
        <App />
      </Suspense>
    ),
    children: [
      { path: "/", element: <Home /> },
      { path: "/words", element: <WordList /> },
      { path: "/create-word", element: <WordForm /> },
      { path: "/level", element: <LevelForm /> },
      { path: "/topic", element: <TopicForm /> },
      { path: "/article", element: <ArticleForm /> },
      { path: "/part-of-Speech", element: <PartOfSpeechForm /> },
      { path: "/level-list", element: <LevelList /> },
      { path: "edit-word/:id", element: <UpdateWord /> },
      { path: "delete-all", element: <DeleteAllWords /> },
      { path: "/favorites", element: <FavoritesList /> },
      { path: "/conversation-titles", element: <ConversationTitleList /> },
      { path: "/conversation/:id", element: <ConversationPage /> },
      { path: "/update-conversation", element: <ConversationsList /> },
      { path: "/create-conversation", element: <CreateConversation /> },
      { path: "/prefix-types", element: <PrefixTypeList /> },
      { path: "/prefix-list/:id", element: <PrefixList /> },
      { path: "/grammar", element: <Grammar /> },
      { path: "/grammar/:id", element: <GrammarTopic /> },
      { path: "/clauses", element: <Clauses /> },
      { path: "/clause/:id", element: <Clause /> },
      { path: "/stories", element: <Stories /> },
      { path: "/update-user-status", element: <UpdateUserStatus /> },
      { path: "/update-basic-user-status", element: <UpdateBasicUserStatus /> },
      { path: "/users-favorite-count", element: <UsersFavoriteCount /> },
      { path: "/past-perfect", element: <PerfectAndPastForm /> },

      // Dashboard
      {
        path: "/dashboard",
        element: <DashboardLayout />,
        children: [
          { index: true, element: <DashboardHome /> },
          { path: "favorites-words", element: <FavoritesListDashboard /> },
          { path: "update-user-status", element: <UpdateUserStatus /> },
          {
            path: "update-basic-user-status",
            element: <UpdateBasicUserStatus />,
          },
          { path: "topic", element: <TopicForm /> },
          { path: "create-word", element: <WordForm /> },
          { path: "create-conversation", element: <CreateConversation /> },
          { path: "update-conversation", element: <ConversationsList /> },
          { path: "conversation/:id", element: <ConversationPage /> },
          { path: "users-favorite-count", element: <UsersFavoriteCount /> },
          { path: "delete-all", element: <DeleteAllWords /> },
        ],
      },
    ],
  },

  // Auth routes
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  { path: "/verify-email", element: <VerifyEmail /> },
  { path: "/resend-verification", element: <ResendVerification /> },
  { path: "/forgot-password", element: <ForgotPassword /> },
  { path: "/reset-password", element: <ResetPassword /> },
]);
