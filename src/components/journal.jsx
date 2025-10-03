import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowDown, Square, SquareArrowUpRight } from "lucide-react";
import { getCharacterById } from "../repository/characters";
import { getSpellById } from "../repository/spells";
import { getPotionById } from "../repository/potions";
import OrnateCorner from "./ornate";
import Scribble from "./scribble";
import DoodleCircle from "./doodlecircle";
import MagicSpark from "./magicspark";
import { getBookById, getMovieById } from "../repository/booksAndMovies";

const Journal = () => {
  const { type, id } = useParams(); // URL looks like /journal/:type/:id
  const navigate = useNavigate();
  const [entity, setEntity] = useState(null);
  const [activeTab, setActiveTab] = useState("Overview");

  // ✅ Fetch based on type
  const fetchData = async (type, id) => {
    switch (type) {
      case "character":
        return await getCharacterById(id);
      case "spell":
        return await getSpellById(id);
      case "potion":
        return await getPotionById(id);
      case "book":
        return await getBookById(id);
      case "movie":
        return await getMovieById(id);
      default:
        throw new Error(`Unsupported type: ${type}`);
    }
  };

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchData(type, id);
        setEntity(data);
      } catch (err) {
        console.error(`Failed to fetch ${type}:`, err);
      }
    }
    if (type && id) load();
  }, [type, id]);

  if (!entity) {
    return (
      <div className="flex justify-center items-center h-full text-hp-darkgray">
        Loading...
      </div>
    );
  }

  // ⚡ Pages depending on type
  const pagesByType = {
    character: {
      Overview: {
        left: (
          <div className="flex flex-col items-center gap-2">
            <div className="relative w-64 h-80 flex items-center justify-center border-4 border-[#c49a6c] shadow-xl">
              <div className="absolute inset-2 border-2 border-[#c49a6c]" />
              <div className="absolute inset-4 border border-[#c49a6c]" />
              <OrnateCorner className="absolute top-0 left-0" />
              <OrnateCorner className="absolute top-0 right-0 rotate-90" />
              <OrnateCorner className="absolute bottom-0 right-0 rotate-180" />
              <OrnateCorner className="absolute bottom-0 left-0 -rotate-90" />
              <img
                src={entity.image}
                alt={entity.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-center">{entity.name}</h2>
              <p>
                <span className="font-bold">Born:</span>{" "}
                {entity.born || "Unknown"}
              </p>
              <p>
                <span className="font-bold">House:</span> {entity.house || "—"}
              </p>
              <p>
                <span className="font-bold">Species:</span> {entity.species}
              </p>
              <p>
                <span className="font-bold">Gender:</span> {entity.gender}
              </p>
            </div>
          </div>
        ),
        right: (
          <div className="space-y-2 mx-5">
            {entity.aliasNames?.length > 0 && (
              <p>
                <span className="font-bold">Also known as:</span>{" "}
                {entity.aliasNames.join(", ")}
              </p>
            )}
            <p>
              <span className="font-bold">Died:</span> {entity.died || "—"}
            </p>
            <p>
              <span className="font-bold">Blood Status:</span>{" "}
              {entity.bloodStatus || "Unknown"}
            </p>
            <p>
              <span className="font-bold">Eye Color:</span>{" "}
              {entity.eyeColor || "Unknown"}
            </p>
            <p>
              <span className="font-bold">Hair Color:</span>{" "}
              {entity.hairColor || "Unknown"}
            </p>
            <p>
              <span className="font-bold">Skin Color:</span>{" "}
              {entity.skinColor || "Unknown"}
            </p>
            <p>
              <span className="font-bold">Nationality:</span>{" "}
              {entity.nationality || "Unknown"}
            </p>
          </div>
        ),
      },
      Magic: {
        left: (
          <div className="flex flex-col items-center gap-2">
            <div className="relative w-64 h-80 flex items-center justify-center border-4 border-[#c49a6c] shadow-xl">
              <div className="absolute inset-2 border-2 border-[#c49a6c]" />
              <div className="absolute inset-4 border border-[#c49a6c]" />
              <OrnateCorner className="absolute top-0 left-0" />
              <OrnateCorner className="absolute top-0 right-0 rotate-90" />
              <OrnateCorner className="absolute bottom-0 right-0 rotate-180" />
              <OrnateCorner className="absolute bottom-0 left-0 -rotate-90" />
              <img
                src={entity.image}
                alt={entity.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className=" w-full">
              <h2 className="text-2xl font-bold text-center">{entity.name}</h2>
              <p>
                <span className="font-bold">Patronus:</span>{" "}
                {entity.patronus || "None"}
              </p>
              <p>
                <span className="font-bold">Boggart:</span>{" "}
                {entity.boggart || "Unknown"}
              </p>
              <p>
                <span className="font-bold">Animagus:</span>{" "}
                {entity.animagus || "None"}
              </p>
            </div>
          </div>
        ),
        right: (
          <div className="space-y-2 mx-5">
            <p>
              <span className="font-bold">Wands:</span>{" "}
              {entity.wands?.join(", ") || "No known wand"}
            </p>
            {entity.jobs?.length > 0 && (
              <div>
                <span className="font-bold">Jobs:</span>
                <ul className="list-disc ml-5">
                  {entity.jobs.map((job, i) => (
                    <li key={i}>{job}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ),
      },
      Family: {
        left: (
          <div className="flex flex-col items-center gap-2">
            <div className="relative w-64 h-80 flex items-center justify-center border-4 border-[#c49a6c] shadow-xl">
              <div className="absolute inset-2 border-2 border-[#c49a6c]" />
              <div className="absolute inset-4 border border-[#c49a6c]" />
              <OrnateCorner className="absolute top-0 left-0" />
              <OrnateCorner className="absolute top-0 right-0 rotate-90" />
              <OrnateCorner className="absolute bottom-0 right-0 rotate-180" />
              <OrnateCorner className="absolute bottom-0 left-0 -rotate-90" />
              <img
                src={entity.image}
                alt={entity.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className=" w-full">
              <h2 className="text-2xl font-bold text-center">{entity.name}</h2>
              <h3 className="font-bold">Romances</h3>
              {entity.romances?.length ? (
                <ul className="list-disc ml-5">
                  {entity.romances.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              ) : (
                <p>No recorded romances.</p>
              )}
            </div>
          </div>
        ),
        right: (
          <div className="space-y-2 mx-5">
            <h3 className="font-bold">Family Members</h3>
            {entity.familyMembers?.length ? (
              <ul className="list-disc ml-5">
                {entity.familyMembers.map((fam, i) => (
                  <li key={i}>{fam}</li>
                ))}
              </ul>
            ) : (
              <p>No recorded family members.</p>
            )}
          </div>
        ),
      },
    },

    spell: {
      Overview: {
        left: (
          <div className="flex flex-col items-center gap-2">
            <div className="relative w-64 h-80 border-4 border-[#c49a6c] shadow-xl">
              <OrnateCorner className="absolute top-0 left-0" />
              <OrnateCorner className="absolute top-0 right-0 rotate-90" />
              <OrnateCorner className="absolute bottom-0 right-0 rotate-180" />
              <OrnateCorner className="absolute bottom-0 left-0 -rotate-90" />
              <img
                src={entity.image}
                alt={entity.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-center">{entity.name}</h2>
              <p>
                <span className="font-bold">Incantation:</span>
                {entity.incantation || " Unknown"}
              </p>
            </div>
          </div>
        ),
        right: (
          <div className="space-y-2 mx-5">
            <p>
              <span className="font-bold">Category:</span> {entity.category}
            </p>
            <p>
              <span className="font-bold">Effect:</span> {entity.effect}
            </p>
            <p>
              <span className="font-bold">Light:</span> {entity.light || "—"}
            </p>
            <p>
              <span className="font-bold">Creator:</span>{" "}
              {entity.creator || "Unknown"}
            </p>
            <p>
              <span className="font-bold">Hand Movement:</span>{" "}
              {entity.hand || "None"}
            </p>
          </div>
        ),
      },
    },

    potion: {
      Overview: {
        left: (
          <div className="flex flex-col items-center gap-2">
            <div className="relative w-64 h-80 border-4 border-[#c49a6c] shadow-xl">
              <OrnateCorner className="absolute top-0 left-0" />
              <OrnateCorner className="absolute top-0 right-0 rotate-90" />
              <OrnateCorner className="absolute bottom-0 right-0 rotate-180" />
              <OrnateCorner className="absolute bottom-0 left-0 -rotate-90" />
              <img
                src={entity.image}
                alt={entity.name}
                className="w-full h-full object-cover"
              />
            </div>
            <h2 className="text-2xl font-bold">{entity.name}</h2>
          </div>
        ),
        right: (
          <div className="mx-5 space-y-2">
            <p>
              <span className="font-bold">Characteristics:</span>{" "}
              {entity.characteristics || "Unknown"}
            </p>
            <p>
              <span className="font-bold">Difficulty:</span>{" "}
              {entity.difficulty || "Unknown"}
            </p>
            <p>
              <span className="font-bold">Effect:</span>{" "}
              {entity.effect || "Unknown"}
            </p>
            {entity.ingredients && (
              <p>
                <span className="font-bold">Ingredients:</span>{" "}
                {entity.ingredients}
              </p>
            )}
            {entity.side_effects && (
              <p>
                <span className="font-bold">Side Effects:</span>{" "}
                {entity.side_effects}
              </p>
            )}
            {entity.time && (
              <p>
                <span className="font-bold">Time:</span> {entity.time}
              </p>
            )}
            {entity.inventors && (
              <p>
                <span className="font-bold">Inventors:</span> {entity.inventors}
              </p>
            )}
            {entity.manufacturers && (
              <p>
                <span className="font-bold">Manufacturers:</span>{" "}
                {entity.manufacturers}
              </p>
            )}
          </div>
        ),
      },
    },

    book: {
      Overview: {
        left: (
          <div className="flex flex-col items-center gap-1">
            <div className="relative w-64 h-89 border-4 border-[#c49a6c] shadow-xl">
              <OrnateCorner className="absolute top-0 left-0" />
              <OrnateCorner className="absolute top-0 right-0 rotate-90" />
              <OrnateCorner className="absolute bottom-0 right-0 rotate-180" />
              <OrnateCorner className="absolute bottom-0 left-0 -rotate-90" />
              <img
                src={entity.cover || entity.image}
                alt={entity.title}
                className="w-full h-full object-fit"
              />
            </div>
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl text-center font-bold">{entity.title}</h2>
              <p>
                <span className="font-bold">Author:</span> {entity.author}
              </p>
              <p>
                <span className="font-bold">Release Date:</span>{" "}
                {entity.release_date}
              </p>
              <p>
                <span className="font-bold">Pages:</span> {entity.pages}
              </p>
            </div>
          </div>
        ),
        right: (
          <div className="mx-5 flex flex-col gap-2">
            <p>
              <span className="font-bold">Dedication:</span>{" "}
              {entity.dedication || "—"}
            </p>
            <p>
              <span className="font-bold">Summary:</span> {entity.summary}
            </p>
          </div>
        ),
      },
    },

    movie: {
      Overview: {
        left: (
          <div className="flex flex-col items-center gap-1">
            <div className="relative w-64 h-89 border-4 border-[#c49a6c] shadow-xl">
              <OrnateCorner className="absolute top-0 left-0" />
              <OrnateCorner className="absolute top-0 right-0 rotate-90" />
              <OrnateCorner className="absolute bottom-0 right-0 rotate-180" />
              <OrnateCorner className="absolute bottom-0 left-0 -rotate-90" />
              <img
                src={entity.poster}
                alt={entity.title}
                className="w-full h-full object-fit"
              />
            </div>
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-bold text-center">{entity.title}</h2>
              <p>
                <span className="font-bold">Release Date:</span>{" "}
                {entity.release_date}
              </p>
              <p>
                <span className="font-bold">Rating:</span> {entity.rating}
              </p>
              <p>
                <span className="font-bold">Running Time:</span>{" "}
                {entity.running_time}
              </p>
            </div>
          </div>
        ),
        right: (
          <div className="mx-5 flex flex-col gap-2">
            <p>
              <span className="font-bold">Budget:</span> {entity.budget}
            </p>
            <p>
              <span className="font-bold">Box Office:</span> {entity.box_office}
            </p>
            <p>
              <span className="font-bold">Summary:</span> {entity.summary}
            </p>
          </div>
        ),
      },
      Filmmakers: {
        left: (
          <div className=" flex items-center flex-col gap-1">
            <div className="relative w-64 h-89 border-4 border-[#c49a6c] shadow-xl">
              <OrnateCorner className="absolute top-0 left-0" />
              <OrnateCorner className="absolute top-0 right-0 rotate-90" />
              <OrnateCorner className="absolute bottom-0 right-0 rotate-180" />
              <OrnateCorner className="absolute bottom-0 left-0 -rotate-90" />
              <img
                src={entity.poster}
                alt={entity.title}
                className="w-full h-full object-fit"
              />
            </div>
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-bold text-center">{entity.title}</h2>
              {entity.directors?.length > 0 && (
                <p>
                  <span className="font-bold">
                    Director{entity.directors.length > 1 ? "s" : ""}:
                  </span>{" "}
                  {entity.directors.join(", ")}
                </p>
              )}
            </div>
          </div>
        ),
        right: (
          <div className="mx-5 flex flex-col gap-2">
            {entity.producers?.length > 0 && (
              <div>
                <span className="font-bold">
                  Producer{entity.producers.length > 1 ? "s" : ""}:
                </span>
                <ul className="list-disc list-inside ml-4">
                  {entity.producers.map((producer, i) => (
                    <li key={i}>{producer}</li>
                  ))}
                </ul>
              </div>
            )}

            {entity.cinematographers?.length > 0 && (
              <div>
                <span className="font-bold">
                  Cinematographer{entity.cinematographers.length > 1 ? "s" : ""}
                  :
                </span>
                <ul className="list-disc list-inside ml-4">
                  {entity.cinematographers.map((cinema, i) => (
                    <li key={i}>{cinema}</li>
                  ))}
                </ul>
              </div>
            )}

            {entity.editors?.length > 0 && (
              <div>
                <span className="font-bold">
                  Editor{entity.editors.length > 1 ? "s" : ""}:
                </span>
                <ul className="list-disc list-inside ml-4">
                  {entity.editors.map((editor, i) => (
                    <li key={i}>{editor}</li>
                  ))}
                </ul>
              </div>
            )}

            {entity.music_composers?.length > 0 && (
              <div>
                <span className="font-bold">
                  Music Composer{entity.music_composers.length > 1 ? "s" : ""}:
                </span>
                <ul className="list-disc list-inside ml-4">
                  {entity.music_composers.map((composer, i) => (
                    <li key={i}>{composer}</li>
                  ))}
                </ul>
              </div>
            )}

            {entity.screenwriters?.length > 0 && (
              <div>
                <span className="font-bold">
                  Screenwriter{entity.screenwriters.length > 1 ? "s" : ""}:
                </span>
                <ul className="list-disc list-inside ml-4">
                  {entity.screenwriters.map((writer, i) => (
                    <li key={i}>{writer}</li>
                  ))}
                </ul>
              </div>
            )}

            {entity.distributors?.length > 0 && (
              <div>
                <span className="font-bold">
                  Distributor{entity.distributors.length > 1 ? "s" : ""}:
                </span>
                <ul className="list-disc list-inside ml-4">
                  {entity.distributors.map((dist, i) => (
                    <li key={i}>{dist}</li>
                  ))}
                </ul>
              </div>
            )}
            {entity.trailer && (
              <p className="flex items-center gap-1">
                <span className="font-bold">Trailer:</span>{" "}
                <a
                  href={entity.trailer}
                  target="_blank"
                  className="flex items-center gap-1 text-blue-950 hover:text-hp-royal"
                >
                  Watch Here <SquareArrowUpRight size={12} />
                </a>
              </p>
            )}
          </div>
        ),
      },
    },
  };

  const currentPages = pagesByType[type] || {};
  const tabs = Object.keys(currentPages);

  return (
    <div className="flex justify-center items-center w-full min-h-[100vh] pt-30 md:pt-5 bg-[url('/images/towers.png')] bg-no-repeat bg-cover">
      <div className="flex flex-col self-center">
        {/* Tabs + Back on Mobile */}
        <div className="flex flex-col md:flex-row items-center justify-between w-full md:w-fit mt-2 md:mt-10 -mb-2 px-2 gap-2">
          {/* Tabs */}
          <div className="flex flex-wrap justify-center md:justify-start">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative px-6 py-2 font-bold transition-transform duration-200 border-l-1 border-black/10 bg-hp-ivory w-fit rounded-t-lg cursor-pointer
              ${
                activeTab === tab
                  ? "text-hp-royal bg-[#cdac73] shadow-inner -translate-y-1"
                  : "text-yellow-900 hover:-translate-y-1"
              }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Back Bookmark (Mobile Top Right) */}
          <button
            onClick={() => {
              const target =
                type === "book" || type === "movie"
                  ? "books-and-movies"
                  : `${type}s`;
              navigate(`/${target}`);
            }}
            className="md:hidden absolute top-40 right-20 z-30 w-8 h-30 bg-hp-royal shadow-md 
    rounded-bl-lg rounded-br-lg flex items-center justify-center cursor-pointer
    text-hp-ivory font-bold tracking-wide text-sm
    transition-all duration-300 hover:shadow-lg [writing-mode:vertical-rl] [text-orientation:upright]"
          >
            BACK <ArrowDown size={15} className="mt-2" />
          </button>
        </div>

        {/* Journal */}
        <div className="relative w-[450px] overflow-y-auto custom-scroll md:w-[900px] h-[800px] md:h-[600px] flex flex-col md:flex-row rounded-lg shadow-2xl border-8 border-[#4a3728] bg-hp-ivory overflow-hidden">
          {/* Spine (Desktop Only) */}
          <div className="hidden md:block absolute top-0 bottom-0 left-1/2 w-1 bg-[#3a2b20] shadow-inner z-20"></div>

          {/* Left page */}
          <div className="w-full md:w-1/2 relative flex flex-col p-6 md:p-8 text-[#2a1d14] bg-[#E1CBA5]">
            <div className="absolute right-0 top-0 h-full w-12 bg-gradient-to-l from-black/15 to-transparent z-10 md:block hidden" />
            <OrnateCorner className="absolute top-0 left-0" />
            <OrnateCorner className="absolute top-0 right-0 rotate-90" />
            <OrnateCorner className="absolute bottom-0 right-0 rotate-180" />
            <OrnateCorner className="absolute bottom-0 left-0 -rotate-90" />
            <MagicSpark className="absolute bottom-10 right-6 -rotate-20 hidden md:block" />
            <div className="overflow-y-auto relative z-20 custom-scroll">
              {currentPages[activeTab]?.left}
            </div>
          </div>

          {/* Right page */}
          <div className="w-full md:w-1/2 relative flex flex-col p-6 md:p-8 text-[#2a1d14] bg-[#E1CBA5]">
            <div className="absolute left-0 top-0 h-full w-12 bg-gradient-to-r from-black/15 to-transparent z-10 md:block hidden" />
            <OrnateCorner className="absolute top-0 left-0" />
            <OrnateCorner className="absolute top-0 right-0 rotate-90" />
            <OrnateCorner className="absolute bottom-0 right-0 rotate-180" />
            <OrnateCorner className="absolute bottom-0 left-0 -rotate-90" />
            <Scribble className="absolute bottom-10 right-12 rotate-12 hidden md:block" />
            <DoodleCircle className="absolute bottom-20 left-6 rotate-3 hidden md:block" />
            <div className="overflow-y-auto relative z-20 custom-scroll">
              {currentPages[activeTab]?.right}
            </div>

            {/* Back Bookmark (Desktop Only) */}
            <button
              onClick={() => {
                const target =
                  type === "book" || type === "movie"
                    ? "books-and-movies"
                    : `${type}s`;
                navigate(`/${target}`);
              }}
              className="hidden md:flex absolute top-0 right-1 z-30 w-6 h-40 bg-hp-royal shadow-md 
           rounded-bl-lg rounded-br-lg items-center justify-center cursor-pointer
           text-hp-ivory font-semibold tracking-wider origin-bottom 
           transition-all duration-300 hover:h-50 hover:shadow-lg
           [writing-mode:vertical-rl] [text-orientation:upright]"
            >
              BACK <ArrowDown size={15} className="mt-2" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Journal;
