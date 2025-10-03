import { Route, Routes } from "react-router-dom";
import Topbar from "./components/topBar";
import Character from "./pages/character/character.jsx";
import Home from "./pages/home.jsx";
import CharInfo from "./pages/character/character-info/char-info.jsx";
import ForbiddenDraw from "./pages/forbidden-draw/ForbiddenDraw.js";
import BooksAndMovies from "./pages/books-and-movies/books-and-movies.jsx";
import Spells from "./pages/spell/spells.jsx";
import Potions from "./pages/potion/potions.jsx";
import SpellShuffle from "./pages/spell-shuffle/spellShuffle.jsx";
import { useLocation } from "react-router-dom";

const cards = [
  {
    id: 1,
    character: "Harry",
    type: "Wizard",
    house: "Gryffindor",
    image: "/images/harry.jpg",
  },
  {
    id: 2,
    character: "Hermione",
    type: "Wizard",
    house: "Gryffindor",
    image: "/images/hermione.jpg",
  },
];

function App() {
  const location = useLocation();
  const hideTopbar = location.pathname === "/spell-shuffle";

  return (
    <main className="relative">
      {!hideTopbar && <Topbar />}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/characters" element={<Character />} />
        <Route path="/books-and-movies" element={<BooksAndMovies />} />
        <Route path="/spells" element={<Spells />} />
        <Route path="/potions" element={<Potions />} />
        {/* <Route path="/movies" element={<div>Movies Page</div>} /> */}
        {/* <Route path="/spells" element={<div>Spells Page</div>} /> */}
        {/* <Route path="/potions" element={<div>Potions Page</div>} /> */}
        {/* <Route path="/" element={<CharactersSpread cards={cards} />} /> */}
        <Route path="/char-info/:id" element={<CharInfo />} />
        <Route path="/forbidden-draw" element={<ForbiddenDraw />} />
        <Route path="/spell-shuffle" element={<SpellShuffle />} />
      </Routes>
    </main>
  );
}

export default App;
