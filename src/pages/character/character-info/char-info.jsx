import { useParams } from "react-router-dom";

export default function CharInfo() {
  const { id } = useParams();

  return (
    <div>
      <h1>Character Info</h1>
      <p>Character ID: {id}</p>
      {/* Fetch or display the character info based on id */}
    </div>
  );
}
