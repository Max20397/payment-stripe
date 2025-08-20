import Image from "next/image";
import ListProduct from "./components/ListProduct";

export default function Home() {
  return (
    <div className="min-h-screen text-center">
      <ListProduct/>
    </div>
  );
}
