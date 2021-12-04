import { Timestamp } from "firebase/firestore";

export type Player = {
  lastAlive: Timestamp;
  cursorLine: number;
  cursorColumn: number;
};

type Line = {
  lastModified: Timestamp;
  [char: `character_${number}`]: string[] | undefined;
}

type Doc = {
  players: Record<string, Player>;
  lines: Record<`${number}`, Line>
};

type Root = {
  docs: Record<string, Doc>;
};
