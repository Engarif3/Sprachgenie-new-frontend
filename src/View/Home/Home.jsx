import Container from "../../utils/Container";
import HomeCard from "./HomeCard";

const Home = () => {
  return (
    <Container className="flex ">
      <div className="min-h-screen my-12">
        <h2 className="text-center text-3xl font-mono font-bold text-sky-700 mb-12">
          Choose a topic
        </h2>
        <div className="flex justify-center items-center ">
          <div className=" grid gird-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 lg:gap-8">
            <HomeCard
              title="Words List"
              text="Learn important german words"
              link="/words"
            />

            <HomeCard
              title="Conversations"
              text="Conversations on various topics"
              link="/conversation-titles"
            />
            <HomeCard
              title="Words With Prefix"
              text="Learn some prefix+word"
              link="/prefix-types"
            />
            <HomeCard
              title="Learn Grammar"
              text="Learn grammar rules to become more perfect"
              link="/grammar"
            />
            <HomeCard
              title="Practice For exam"
              text="Coming soon ....."
              link="/exam"
            />
          </div>
        </div>
      </div>
    </Container>
  );
};

export default Home;
