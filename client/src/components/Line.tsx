import React, { useEffect, useState } from "react";
import { updateDoc, doc, onSnapshot, arrayUnion } from "firebase/firestore";

import { db } from "../firebase";
import { Character, CharacterContent } from "./Character";
import { setUserCursorPosition, SetUserCursorPosition } from "../managers/cursors";

type LineProps = {
  docId: string;
  lineIdx: number;
  setUserCursorPosition: SetUserCursorPosition;
};

const CHAR_PER_LINE = 80;

export const Line: React.FC<LineProps> = ({ docId, lineIdx }) => {
  const [characterContent, setCharacterContent] = useState<CharacterContent[]>(
    [...Array(CHAR_PER_LINE).keys()].map(() => "")
  );

  useEffect(
    () =>
      onSnapshot(doc(db, "docs", docId, "lines", `${lineIdx}`), (line) => {
        const data = line.data();
        if (!data) {
          return;
        }

        setCharacterContent((prevCharacterContent) =>
          prevCharacterContent.map(
            (value, idx) => data[`character_${idx}`]?.join("") || ""
          )
        );
      }),
    []
  );

  return (
    <div className="line">
      {characterContent.map((content, idx) => (
        <Character
          lineIdx={lineIdx}
          columnIdx={idx}
          content={content}
          setUserCursorPosition={setUserCursorPosition}
        />
      ))}
    </div>
  );
};
