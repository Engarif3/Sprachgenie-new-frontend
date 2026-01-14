import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../axios";
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
      const response = await api.get("/prefix/prefix-types");
      console.log("Prefix Types Response:", response.data);
      setPrefixTypes(response.data.data);
    } catch (error) {
      console.error("Error fetching Prefix Types:", error);
      console.error("Error details:", error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrefixTypes();
  }, []);

  return (
    <Container>
      <div className="max-w-7xl mx-auto p-4 mb-4 min-h-screen">
        {/* Header Section */}
        <div className="text-center mb-12 mt-8">
          <div className="mb-4">
            <span className="inline-block px-6 py-2 bg-gradient-to-r from-orange-500/20 to-pink-500/20 border border-orange-500/50 rounded-full text-orange-400 font-semibold text-sm">
              🔤 Word Formation
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 mb-4">
            Prefix Types
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Understand German word formation with prefix combinations
          </p>
          <div className="flex justify-center mt-6">
            <div className="h-1 w-32 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 rounded-full"></div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center min-h-[50vh]">
            <Loader loading={loading} />
          </div>
        ) : prefixTypes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {prefixTypes.map((prefixType, index) => (
              <div
                key={prefixType.id}
                className="group relative bg-gradient-to-br from-gray-800/80 via-gray-900 to-black border-2 border-gray-700/50 hover:border-orange-500 p-6 rounded-2xl transition-all duration-500 cursor-pointer hover:-translate-y-3 hover:scale-105 overflow-hidden shadow-xl hover:shadow-[0_0_50px_rgba(249,115,22,0.5)]"
                onClick={() => navigate(`/prefix-list/${prefixType.id}`)}
              >
                {/* Animated gradient background on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/0 via-pink-500/0 to-purple-500/0 group-hover:from-orange-500/10 group-hover:via-pink-500/10 group-hover:to-purple-500/10 transition-all duration-500 rounded-2xl"></div>

                {/* Shine effect */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12"></div>

                <div className="relative z-10">
                  {/* Topic Number Badge */}
                  <div className="absolute -top-2 -right-2 w-10 h-10 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                    {index + 1}
                  </div>

                  {/* Icon */}
                  <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                    🔤
                  </div>

                  {/* Topic Title */}
                  <h3 className="text-xl font-bold text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-orange-400 group-hover:to-pink-400 transition-all duration-300 mb-3">
                    {prefixType.name}
                  </h3>

                  {/* View Button */}
                  <div className="flex items-center gap-2 text-orange-500 font-semibold text-sm group-hover:gap-3 transition-all duration-300">
                    <span>Explore Words</span>
                    <span className="text-lg transform group-hover:translate-x-1 transition-transform duration-300">
                      →
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex justify-center items-center min-h-[50vh]">
            <div className="text-center">
              <p className="text-xl text-gray-400 mb-4">
                No prefix types available
              </p>
              <p className="text-sm text-gray-500">
                Check console for error details
              </p>
            </div>
          </div>
        )}
      </div>
    </Container>
  );
};

export default PrefixTypeList;
