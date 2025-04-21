import { useNavigate } from "react-router-dom";
import Container from "../../utils/Container";

const Grammar = () => {
  const navigate = useNavigate();
  const grammarTypes = [
    { id: 1, topic: "Clauses" },
    { id: 2, topic: "Passive Voice" },
    { id: 3, topic: "Verb with Preposition" },
    { id: 4, topic: "Adjective with Preposition" },
    { id: 5, topic: "Perfekt & Präteritum" },
  ];
  return (
    <Container>
      <div className="max-w-5xl mx-auto p-4 mb-4 min-h-screen">
        <h2 className="text-3xl font-bold font-mono text-sky-700 my-5 md:my-8 lg:my-8 text-center">
          Grammar Topics
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 lg:gap-8">
          {grammarTypes.map((grammarType) => (
            <div
              key={grammarType.id}
              className="bg-gradient-to-r from-slate-900 via-cyan-800 to-cyan-600  p-4 rounded shadow transition delay-150 duration-300 ease-in-out hover:-translate-y-1 hover:scale-105 hover:bg-indigo-500 text-white cursor-pointer"
              onClick={() => navigate(`/grammar/${grammarType.id}`)}
              // onClick={() => navigate(`/clauses`)}
            >
              <h3 className="text-lg font-semibold">{grammarType.topic}</h3>
            </div>
          ))}
        </div>
      </div>
    </Container>
  );
};

export default Grammar;
