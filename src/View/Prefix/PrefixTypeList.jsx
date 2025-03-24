import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Container from "../../utils/Container";
import Loader from "../../utils/Loader";

const PrefixTypeList = () => {
  const [prefixTypes, setPrefixTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Fetch all prefix types
  const fetchPrefixTypes = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        "https://sprcahgenie-new-backend.vercel.app/api/v1/prefix/prefix-types"
      );
      setPrefixTypes(response.data.data);
    } catch (error) {
      console.error("Error fetching Prefix Types:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrefixTypes();
  }, []);

  return (
    <Container>
      <div className="max-w-5xl mx-auto p-4 mb-4 min-h-screen">
        <h2 className="text-3xl font-bold font-mono text-sky-700 my-5 md:my-8 lg:my-8 text-center">
          Prefix Types
        </h2>
        {loading ? (
          <Loader loading={loading} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 lg:gap-8">
            {prefixTypes.map((prefixType) => (
              <div
                key={prefixType.id}
                className="bg-gradient-to-r from-slate-900 via-cyan-800 to-cyan-600  p-4 rounded shadow transition delay-150 duration-300 ease-in-out hover:-translate-y-1 hover:scale-105 hover:bg-indigo-500 text-white cursor-pointer"
                onClick={() => navigate(`/prefix-list/${prefixType.id}`)}
              >
                <h3 className="text-lg font-semibold">{prefixType.name}</h3>
              </div>
            ))}
          </div>
        )}
      </div>
    </Container>
  );
};

export default PrefixTypeList;
