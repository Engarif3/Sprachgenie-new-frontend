import { useParams } from "react-router-dom";
import Clauses from "./Clauses/Clauses";
import SubordinatingConjunction from "./Clauses/Subordinating/SubordinatingConjunction";
import PassiveVoice from "./PassiveVoice/PassiveVoice";
import VerbWithPreposition from "./VerbWithPreposition/VerbWithPreposition";
import AdjectiveWithPreposition from "./AdjectiveWithPreposition/AdjectiveWithPreposition";
import PerfectAndPastForm from "./PerfectAndPastForm/PerfectAndPastForm";
import VerbsWithGehen from "./VerbsWithGehen/VerbsWithGehen";

const GrammarTopic = () => {
  const { id } = useParams();

  return (
    <div>
      {id === "1" ? (
        <Clauses />
      ) : id === "2" ? (
        <PassiveVoice />
      ) : id === "3" ? (
        <VerbWithPreposition />
      ) : id === "4" ? (
        <AdjectiveWithPreposition />
      ) : id === "5" ? (
        <PerfectAndPastForm />
      ) : id === "6" ? (
        <VerbsWithGehen />
      ) : (
        <p className="text-center text-red-500">Invalid Clause Type</p>
      )}
    </div>
  );
};

export default GrammarTopic;
