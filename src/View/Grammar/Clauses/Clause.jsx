import { useParams } from "react-router-dom";
import CoordinatingConjunction from "./Coordinating/CoordinatingConjunction";
import SubordinatingConjunction from "./Subordinating/SubordinatingConjunction";
import ConjunctiveAdverb from "./ConjunctiveAdverb/ConjunctiveAdverb";
import Other from "./Others/Other";

const Clause = () => {
  const { id } = useParams();

  return (
    <div>
      {id === "1" ? (
        <CoordinatingConjunction />
      ) : id === "2" ? (
        <SubordinatingConjunction />
      ) : id === "3" ? (
        <ConjunctiveAdverb />
      ) : id === "4" ? (
        <Other />
      ) : (
        <p className="text-center text-red-500">Invalid Clause Type</p>
      )}
    </div>
  );
};

export default Clause;
