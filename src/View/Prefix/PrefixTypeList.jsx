import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../axios";
import Container from "../../utils/Container";
import Loader from "../../utils/Loader";
import PageHeader from "../../components/UI/PageHeader";
import TopicCard from "../../components/UI/TopicCard";
import { IoTextOutline } from "react-icons/io5";

const PrefixTypeList = () => {
  const [prefixTypes, setPrefixTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Fetch all prefix types
  const fetchPrefixTypes = async () => {
    try {
      setLoading(true);
      const response = await api.get("/prefix/prefix-types");
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
      <div className="mx-auto mb-4 min-h-screen max-w-7xl px-4 pb-4 pt-1">
        <PageHeader
          eyebrow="Word Formation"
          eyebrowIcon={IoTextOutline}
          eyebrowTone="orange"
          title="Prefix Types"
          subtitle="Understand German word formation with prefix combinations"
          accent="brand"
          align="center"
          className="mb-8 mt-4"
        />

        {loading ? (
          <div className="flex min-h-[50vh] items-center justify-center">
            <Loader loading={loading} />
          </div>
        ) : prefixTypes.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {prefixTypes.map((prefixType, index) => {
              const prefixCount = prefixType._count?.prefixes ?? 0;
              return (
                <TopicCard
                  key={prefixType.id}
                  index={index}
                  icon={IoTextOutline}
                  title={prefixType.name}
                  description={`Browse verbs formed with the "${prefixType.name}" prefix and see how it changes their meaning.`}
                  badge={
                    prefixCount > 0
                      ? `${prefixCount} ${prefixCount === 1 ? "prefix" : "prefixes"}`
                      : null
                  }
                  actionLabel="Explore Words"
                  onClick={() => navigate(`/prefix-list/${prefixType.id}`)}
                />
              );
            })}
          </div>
        ) : (
          <div className="flex min-h-[50vh] items-center justify-center">
            <div className="text-center">
              <p className="mb-4 text-xl text-gray-400">
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
