import Journal from "../../../components/journal";

export default function CharacterInfo() {
  const pages = {
    "Basic Infos": {
      left: (
        <img
          src="https://static.wikia.nocookie.net/harrypotter/images/4/40/Aberforth_Dumbledore.jpg"
          alt="Character"
          className="w-full h-full object-contain rounded"
        />
      ),
      right: (
        <div>
          <h2 className="text-3xl font-bold mb-4 text-center">Basic Info</h2>
          <div className="space-y-2 ml-5">
            <p>
              <strong>Name:</strong> Harry Potter
            </p>
            <p>
              <strong>Alias:</strong> The Boy Who Lived
            </p>
            <p>
              <strong>Born:</strong> 31 July 1980
            </p>
            <p>
              <strong>Blood Status:</strong> Half-Blood
            </p>
            <p>
              <strong>Occupation:</strong> Auror
            </p>
          </div>
        </div>
      ),
    },
    "Family Members": {
      left: (
        <p className="italic text-center">🪶 Family Tree Sketch Placeholder</p>
      ),
      right: (
        <div>
          <h2 className="text-3xl font-bold mb-4 text-center">
            Family Members
          </h2>
          <ul className="list-disc list-inside ml-5 space-y-2">
            <li>James Potter</li>
            <li>Lily Potter</li>
            <li>Ginny Potter</li>
          </ul>
        </div>
      ),
    },
    Others: {
      left: <p className="italic text-center">Notes & scribbles here...</p>,
      right: (
        <div className="space-y-2 ml-5">
          <h2 className="text-3xl font-bold mb-4 text-center">Other Infos</h2>
          <p>
            <strong>Patronus:</strong> Stag
          </p>
          <p>
            <strong>Wand:</strong> Holly, Phoenix Feather
          </p>
        </div>
      ),
    },
  };

  return (
    <main>
      <div className="relative min-h-screen bg-hp-royal pt-16 px-12 overflow-x-hidden">
        <div>
          <Journal pages={pages} />
        </div>
      </div>
    </main>
  );
}
