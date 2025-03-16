import { useParams } from "react-router-dom";
import Clauses from "./Clauses/Clauses";
import SubordinatingConjunction from "./Clauses/Subordinating/SubordinatingConjunction";
import PassiveVoice from "./PassiveVoice/PassiveVoice";

const GrammarTopic = () => {
  const { id } = useParams();

  return (
    <div>
      {id === "1" ? (
        <Clauses />
      ) : id === "2" ? (
        <PassiveVoice />
      ) : (
        <p className="text-center text-red-500">Invalid Clause Type</p>
      )}
    </div>
  );
};

export default GrammarTopic;
