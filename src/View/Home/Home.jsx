// import Container from "../../utils/Container";
// import HomeCard from "./HomeCard";
// import CircularText from "./CircularText";

// const Home = () => {
//   return (
//     <Container className="flex ">
//       <CircularText
//         text="PRACTICE*MAKES*PERFECT*"
//         centerText1="Sprach"
//         centerText2="Genie"
//         onHover="speedUp"
//         spinDuration={20}
//         className="font-custom3"
//       />

//       <div className="min-h-screen mb-12">
//         <h2 className="text-center text-3xl font-mono font-bold text-white mb-12">
//           Choose a topic
//         </h2>
//         <div className="flex justify-center items-center ">
//           <div className=" grid gird-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 lg:gap-8">
//             <HomeCard
//               title="Vocabulary Library"
//               text="Explore 4000+ words"
//               link="/words"
//             />

//             <HomeCard
//               title="Conversations"
//               text="Conversations on various topics"
//               link="/conversation-titles"
//             />
//             <HomeCard
//               title="Words With Prefix"
//               text="Learn some prefix+word"
//               link="/prefix-types"
//             />
//             <HomeCard
//               title="Learn Grammar"
//               text="Learn grammar rules to become more perfect"
//               link="/grammar"
//             />
//             <HomeCard
//               title="German Stories"
//               text="Enrich your vocabulary"
//               link="/stories"
//             />
//           </div>
//         </div>
//       </div>
//     </Container>
//   );
// };

// export default Home;

import Container from "../../utils/Container";
import HomeCard from "./HomeCard";
import CircularText from "./CircularText";
import SplashCursor from "./SplashCursor";
import Marquee from "react-fast-marquee";
import { isLoggedIn } from "../../services/auth.services";

const Home = () => {
  const userLoggedIn = isLoggedIn();
  // const userInfo = getUserInfo() || {};
  return (
    <Container className="flex ">
      <div className="text-orange-600 text-xl md:text-2xl lg:text-2xl flex justify-center my-8 md:my-2 lg:my-2">
        {!userLoggedIn && (
          <div className="w-11/12  md:w-6/12 lg:w-6/12">
            <Marquee gradient={false} speed={30}>
              <p>
                ✨Log in to unleash AI-powered magic and step into the future of
                learning!✨
              </p>
            </Marquee>
          </div>
        )}
      </div>
      <SplashCursor />
      <CircularText
        text="PRACTICE*MAKES*PERFECT*"
        centerText1="Sprach"
        centerText2="Genie"
        onHover="speedUp"
        spinDuration={20}
        className="font-custom3"
      />

      <div className="min-h-screen mb-12">
        <h2 className="text-center text-3xl font-mono font-bold text-white mb-12">
          Choose a topic
        </h2>
        {/* <TargetCursor spinDuration={2} hideDefaultCursor={false} /> */}
        <div className="flex justify-center items-center ">
          <div className=" grid gird-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 lg:gap-8">
            <HomeCard
              title="Vocabulary Library"
              text="Explore 4000+ words"
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
              title="German Stories"
              text="Enrich your vocabulary"
              link="/stories"
            />
          </div>
        </div>
      </div>
    </Container>
  );
};

export default Home;
