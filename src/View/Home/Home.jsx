import Container from "../../utils/Container";
import HomeCard from "./HomeCard";

const Home = () => {
  return (
    <Container className="flex ">
      <div className="min-h-screen my-12">
        <h2 className="text-center text-3xl font-mono font-bold text-cyan-900 mb-12">
          Choose a topic to learn
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
              text="Learn important german words"
              link="/conversation-titles"
            />
            <HomeCard
              title="Conversations"
              text="Learn important german words"
              link="/conversation-titles"
            />
            <HomeCard
              title="Words List"
              text="Learn important german words"
              link="/words"
            />
          </div>
        </div>
      </div>
    </Container>
  );
};

export default Home;
