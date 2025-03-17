import { InputWithButton } from "@/components/form/search";
import { Album } from "../media/album";

export function Intro() {
  return (
    <div className="overscroll-auto">
      <InputWithButton />
      <Album></Album>
    </div>
  );
}
