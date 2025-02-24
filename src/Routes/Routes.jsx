import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import LevelForm from "../Form/LevelForm";
import TopicForm from "../Form/TopicForm";
import ArticleForm from "../Form/ArticleForm";
import PartOfSpeechForm from "../Form/PartOfSpeechForm";
import LevelList from "../View/LevelList";
import WordList from "../View/WordList";
import UpdateWord from "../View/UpdateWord";
import DeleteAllWords from "../View/DeleteAllWords";
import WordForm from "../Form/WordForm";
import LoginPage from "../login/login";
import Register from "../register/Register";
import FavoritesList from "../View/FavoritesList";
import ResendVerification from "../register/ResendVerification";
import VerifyEmail from "../register/VerifyEmail";
import Conversation from "../View/Conversation/Conversation";
import ConversationsList from "../View/Conversation/ConversationList";
import CreateConversation from "../View/Conversation/CreateConversation";
import ConversationTitleList from "../View/Conversation/ConversationTitleList";
import ConversationPage from "../View/Conversation/ConversationPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "/",
        element: <WordList />,
      },
      {
        path: "/create-word",
        element: <WordForm />,
      },
      {
        path: "/level",
        element: <LevelForm />,
      },
      {
        path: "/topic",
        element: <TopicForm />,
      },
      {
        path: "/article",
        element: <ArticleForm />,
      },
      {
        path: "/part-of-Speech",
        element: <PartOfSpeechForm />,
      },
      {
        path: "/level-list",
        element: <LevelList />,
      },

      {
        path: "edit-word/:id",
        element: <UpdateWord />,
      },
      {
        path: "delete-all",
        element: <DeleteAllWords />,
      },
      {
        path: "/favorites",
        element: <FavoritesList></FavoritesList>,
      },
      // {
      //   path: "/conversations",
      //   element: <Conversation></Conversation>,
      // },
      {
        path: "/conversation-titles",
        element: <ConversationTitleList></ConversationTitleList>,
      },
      {
        path: "/conversation/:id",
        element: <ConversationPage></ConversationPage>,
      },
      {
        path: "/update-conversation",
        element: <ConversationsList></ConversationsList>,
      },
      {
        path: "/create-conversation",
        element: <CreateConversation></CreateConversation>,
      },
    ],
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <Register></Register>,
  },
  {
    path: "/verify-email",
    element: <VerifyEmail></VerifyEmail>,
  },
  {
    path: "/resend-verification",
    element: <ResendVerification></ResendVerification>,
  },
]);
