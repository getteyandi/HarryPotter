import { Route, Routes } from "react-router-dom";
import Topbar from "./components/topBar";
import Character from "./pages/character/character.jsx";
import Home from "./pages/home.jsx";
import CharactersSpread from "./components/character-spread.js";
import CharInfo from "./pages/character/character-info/char-info.jsx";

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
  return (
    <main className="relative">
      <Topbar />
      <Routes>
        <Route path="/home" element={<Home />} />
        <Route path="/characters" element={<Character />} />
        <Route path="/movies" element={<div>Movies Page</div>} />
        <Route path="/spells" element={<div>Spells Page</div>} />
        <Route path="/potions" element={<div>Potions Page</div>} />
        <Route path="/" element={<CharactersSpread cards={cards} />} />
        <Route path="/char-info/:id" element={<CharInfo />} />
      </Routes>
    </main>
  );
}

export default App;
