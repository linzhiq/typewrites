import { Timestamp } from "firebase/firestore";

export type PlayerData = {
  lastAlive: Timestamp;
  cursorLine: number;
  cursorColumn: number;
};

type Line = {
  lastModified: Timestamp;
  [char: `character_${number}`]: string[] | undefined;
}

type Doc = {
  players: Record<string, PlayerData>;
  lines: Record<`${number}`, Line>
};

type Root = {
  docs: Record<string, Doc>;
};
