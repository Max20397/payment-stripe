import Image from "next/image";
import ListProduct from "./components/ListProduct";
import Logs from "./components/Logs";

export default function Home() {
  return (
    <div className="min-h-screen text-center">
      <ListProduct/>
      <Logs/>
    </div>
  );
}
