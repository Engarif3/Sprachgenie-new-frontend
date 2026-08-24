import { useNavigate } from "react-router-dom";
import Container from "../../utils/Container";
import PageHeader from "../../components/UI/PageHeader";
import TopicCard from "../../components/UI/TopicCard";
import {
  IoBookOutline,
  IoGitBranchOutline,
  IoSwapHorizontalOutline,
  IoLinkOutline,
  IoPricetagOutline,
  IoListOutline,
  IoWalkOutline,
} from "react-icons/io5";

// Display order — independent of each topic's id (which is what /grammar/:id
// routes on). Passive Voice's detail page is still a "Coming soon"
// placeholder, so it's kept last instead of showing near the top.
const grammarTypes = [
  {
    id: 1,
    topic: "Clauses",
    description:
      "Understand subordinate and coordinate clauses and how they change German word order.",
    icon: IoGitBranchOutline,
  },
  {
    id: 3,
    topic: "Verb with Preposition",
    description:
      "Master the fixed verb-preposition combinations German relies on.",
    icon: IoLinkOutline,
  },
  {
    id: 4,
    topic: "Adjective with Preposition",
    description:
      "Learn which prepositions pair with common adjectives and how meaning shifts.",
    icon: IoPricetagOutline,
  },
  {
    id: 5,
    topic: "Strong & Irregular Verbs",
    description:
      "Browse strong and irregular verbs with their Präsens, Präteritum, and Perfekt forms.",
    icon: IoListOutline,
  },
  {
    id: 6,
    topic: "Verbs ending with - gehen",
    description:
      "Explore compound verbs built from 'gehen' and what each one means.",
    icon: IoWalkOutline,
  },
  {
    id: 2,
    topic: "Passive Voice",
    description:
      "Learn how to form and use the passive voice across different tenses.",
    icon: IoSwapHorizontalOutline,
  },
];

const Grammar = () => {
  const navigate = useNavigate();

  return (
    <Container>
      <div className="mx-auto mb-4 min-h-screen max-w-7xl px-4 pb-4 pt-1">
        <PageHeader
          eyebrow="Learn Grammar"
          eyebrowIcon={IoBookOutline}
          eyebrowTone="orange"
          title="Grammar Topics"
          subtitle="Master German grammar with clear explanations and examples"
          accent="brand"
          align="center"
          className="mb-8 mt-4"
        />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {grammarTypes.map((grammarType, index) => (
            <TopicCard
              key={grammarType.id}
              index={index}
              icon={grammarType.icon}
              title={grammarType.topic}
              description={grammarType.description}
              actionLabel="Learn More"
              onClick={() => navigate(`/grammar/${grammarType.id}`)}
            />
          ))}
        </div>
      </div>
    </Container>
  );
};

export default Grammar;
