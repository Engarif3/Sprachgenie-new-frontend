import { useNavigate } from "react-router-dom";
import Container from "../../../utils/Container";

const Clauses = () => {
  const navigate = useNavigate();
  const clauseTypes = [
    { id: 1, topic: "Coordinating Clauses" },
    { id: 2, topic: "Subordinating Clauses" },
    { id: 3, topic: "Conjunctive Adverbs" },
    { id: 4, topic: "Others" },
  ];
  return (
    <Container>
      <div className="max-w-5xl mx-auto p-4 mb-4 min-h-screen">
        <h2 className="text-3xl font-bold font-mono text-sky-700 my-5 md:my-8 lg:my-8 text-center">
          Types of clauses
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 lg:gap-8">
          {clauseTypes.map((clauseType) => (
            <div
              key={clauseType.id}
              className="bg-gradient-to-r from-slate-900 via-cyan-800 to-cyan-600  p-4 rounded shadow transition delay-150 duration-300 ease-in-out hover:-translate-y-1 hover:scale-105 hover:bg-indigo-500 text-white cursor-pointer"
              onClick={() => navigate(`/clause/${clauseType.id}`)}
              //   onClick={() => navigate("/clauses")}
            >
              <h3 className="text-lg font-semibold">{clauseType.topic}</h3>
            </div>
          ))}
        </div>
      </div>
    </Container>
  );
};

export default Clauses;
